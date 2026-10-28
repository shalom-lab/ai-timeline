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
  subFilter: string
  onSubFilter: (key: string) => void
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
  const visibleGroups =
    subFilter === 'all'
      ? groups
      : groups.filter((g) => g.key === subFilter)

  return (
    <section
      className={`cat-column${isSolo ? ' is-solo' : ''}`}
      style={{ ['--accent' as string]: theme.accent }}
      aria-label={CATEGORY_LABEL_ZH[category]}
    >
      <div
        className="cat-column__header"
        style={{ background: theme.header }}
      >
        <span className="cat-column__header-icon">{ICONS[category]}</span>
        <span className="cat-column__header-title">
          {CATEGORY_LABEL_ZH[category]}
        </span>
        <span className="cat-column__header-count">{events.length}</span>
        {isSolo ? (
          <button
            type="button"
            className="cat-column__solo-btn is-active"
            onClick={onExitSolo}
            title="退出独占，恢复显示全部列"
          >
            退出独占
          </button>
        ) : (
          <button
            type="button"
            className="cat-column__solo-btn"
            onClick={onSolo}
            title="独占本列：隐藏其他列，本列全宽"
          >
            独占
          </button>
        )}
      </div>

      <div className="cat-column__chips">
        <button
          type="button"
          className={subFilter === 'all' ? 'is-active' : ''}
          onClick={() => onSubFilter('all')}
        >
          全部
        </button>
        {groups.map((g) => (
          <button
            key={g.key}
            type="button"
            className={subFilter === g.key ? 'is-active' : ''}
            onClick={() => onSubFilter(g.key)}
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
