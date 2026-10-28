import type { ReactNode } from 'react'
import type { Category, Company, TimelineEvent } from '../types/timeline'
import { CATEGORY_LABEL_ZH, CATEGORY_THEME } from '../lib/labels'
import { buildSubGroups } from '../lib/group'
import EventCard from './EventCard'

type Props = {
  category: Category
  events: TimelineEvent[]
  companies: Company[]
  collapsed: boolean
  onToggleCollapse: () => void
  /** Active sub-group chip within this column; 'all' = show every subgroup */
  subFilter: string
  onSubFilter: (key: string) => void
  selectedId: string | null
  onSelect: (id: string) => void
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
  collapsed,
  onToggleCollapse,
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

  if (collapsed) {
    return (
      <section
        className="cat-column is-collapsed"
        style={{ ['--accent' as string]: theme.accent }}
        aria-label={CATEGORY_LABEL_ZH[category]}
      >
        <button
          type="button"
          className="cat-column__collapse-tab"
          style={{ background: theme.header }}
          onClick={onToggleCollapse}
          title={`展开 ${CATEGORY_LABEL_ZH[category]}`}
        >
          <span className="cat-column__collapse-icon">{ICONS[category]}</span>
          <span className="cat-column__collapse-label">
            {CATEGORY_LABEL_ZH[category]}
          </span>
          <span className="cat-column__collapse-count">{events.length}</span>
        </button>
      </section>
    )
  }

  return (
    <section
      className="cat-column"
      style={{ ['--accent' as string]: theme.accent }}
      aria-label={CATEGORY_LABEL_ZH[category]}
    >
      <button
        type="button"
        className="cat-column__header"
        style={{ background: theme.header }}
        onClick={onToggleCollapse}
        title="折叠本列（纵向收起为窄条，其他列可更宽）"
      >
        <span className="cat-column__header-icon">{ICONS[category]}</span>
        <span className="cat-column__header-title">
          {CATEGORY_LABEL_ZH[category]}
        </span>
        <span className="cat-column__header-count">{events.length}</span>
        <span className="cat-column__header-chevron" aria-hidden>
          ▾
        </span>
      </button>

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
