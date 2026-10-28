import type { ReactNode } from 'react'
import type { Category, Company, TimelineEvent } from '../types/timeline'
import { CATEGORY_LABEL_ZH, CATEGORY_THEME } from '../lib/labels'
import { buildSubGroups } from '../lib/group'
import EventCard from './EventCard'

type Props = {
  category: Category
  events: TimelineEvent[]
  companies: Company[]
  /** Whether this column is currently in 独占 mode */
  isSolo: boolean
  onSolo: () => void
  onExitSolo: () => void
  /** Selected series/subcategory keys; empty = show all */
  subFilter: string[]
  onSubFilter: (keys: string[]) => void
  selectedId: string | null
  onSelect: (id: string | null) => void
}

const ICONS: Record<Category, ReactNode> = {
  model: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9h6M9 12h6M9 15h4" strokeLinecap="round" />
    </svg>
  ),
  product: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  concept: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" strokeLinecap="round" />
    </svg>
  ),
  science: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 3h6M10 3v4.5L5.5 18a3 3 0 0 0 2.7 4.5h7.6A3 3 0 0 0 18.5 18L14 7.5V3" strokeLinejoin="round" />
      <path d="M8 14h8" strokeLinecap="round" />
    </svg>
  ),
  other: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20V10l8-6 8 6v10" strokeLinejoin="round" />
      <path d="M9 20v-6h6v6" />
    </svg>
  ),
}

/** Compact maximize / focus — enter 独占 (~14px) */
function IconSoloEnter() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Compact minimize / exit-focus — leave 独占 (~14px) */
function IconSoloExit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 5v4H5M15 5v4h4M9 19v-4H5M15 19v-4h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function CategoryColumn({
  category,
  events,
  companies,
  isSolo,
  onSolo,
  onExitSolo,
  subFilter,
  onSubFilter,
  selectedId,
  onSelect,
}: Props) {
  const theme = CATEGORY_THEME[category]
  const groups = buildSubGroups(category, events)
  const showAll = subFilter.length === 0
  const visibleGroups = showAll
    ? groups
    : groups.filter((g) => subFilter.includes(g.key))

  const toggleChip = (key: string) => {
    if (key === 'all') {
      onSubFilter([])
      return
    }
    if (subFilter.includes(key)) {
      onSubFilter(subFilter.filter((k) => k !== key))
    } else {
      onSubFilter([...subFilter, key])
    }
  }

  return (
    <section
      className={`cat-column${isSolo ? ' is-solo' : ''}`}
      style={{ ['--accent' as string]: theme.accent }}
      aria-label={CATEGORY_LABEL_ZH[category]}
    >
      <div className="cat-column__header">
        <span
          className="cat-column__header-icon"
          style={{ color: theme.accent, background: theme.headerSoft }}
        >
          {ICONS[category]}
        </span>
        <span className="cat-column__header-title">
          {CATEGORY_LABEL_ZH[category]}
        </span>
        <span
          className="cat-column__header-count"
          style={{ color: theme.accent, background: theme.headerSoft }}
        >
          {events.length}
        </span>
        {isSolo ? (
          <button
            type="button"
            className="cat-column__solo-btn is-icon is-active"
            onClick={onExitSolo}
            title="退出独占"
            aria-label="退出独占"
          >
            <IconSoloExit />
          </button>
        ) : (
          <button
            type="button"
            className="cat-column__solo-btn is-icon"
            onClick={onSolo}
            title="独占"
            aria-label="独占"
          >
            <IconSoloEnter />
          </button>
        )}
      </div>

      <div className="cat-column__chips" role="group" aria-label="子类多选">
        <button
          type="button"
          className={showAll ? 'is-active' : ''}
          onClick={() => toggleChip('all')}
        >
          全部
        </button>
        {groups.map((g) => (
          <button
            key={g.key}
            type="button"
            className={!showAll && subFilter.includes(g.key) ? 'is-active' : ''}
            aria-pressed={!showAll && subFilter.includes(g.key)}
            onClick={() => toggleChip(g.key)}
          >
            {g.label}
            <em>{g.events.length}</em>
          </button>
        ))}
      </div>

      <div
        className={`cat-column__body${visibleGroups.length > 1 ? ' has-subcols' : ''}`}
      >
        {visibleGroups.length === 0 ? (
          <p className="cat-column__empty">暂无匹配事件</p>
        ) : (
          visibleGroups.map((g) => (
            <div key={g.key} className="cat-subcol">
              {visibleGroups.length > 1 ? (
                <div className="cat-subcol__label">{g.label}</div>
              ) : null}
              <div className="cat-subcol__cards">
                {g.events.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    companies={companies}
                    selected={selectedId === e.id}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
