import type { TimelineMeta } from '../types/timeline'
import { EVENT_TYPE_LEGEND } from '../lib/labels'

export type Filters = {
  query: string
}

type Props = {
  meta: TimelineMeta
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
  eventCount: number
}

export default function Header({ meta, filters, onChange, eventCount }: Props) {
  const openingBg =
    meta.ui?.openingBg ??
    'linear-gradient(145deg, #0B1220 0%, #1E1B4B 48%, #312E81 100%)'
  const openingFg = meta.ui?.openingFg ?? '#F8FAFC'

  return (
    <header className="app-header">
      <div
        className="app-header__banner"
        style={{ background: openingBg, color: openingFg }}
      >
        <div className="app-header__brand">
          <div className="app-header__logo" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M8 12h8M12 8v8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="app-header__titles">
            <h1>
              {meta.name}
              <span className="app-header__en">AI Timeline</span>
            </h1>
            <p className="app-header__subtitle">
              自 {meta.scopeStart} · v{meta.version} · {eventCount} 条 · 更新{' '}
              {meta.updatedAt}
            </p>
          </div>
        </div>

        <div className="app-header__search-wrap">
          <label className="sr-only" htmlFor="timeline-search">
            搜索
          </label>
          <div className="app-header__search">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              id="timeline-search"
              type="search"
              placeholder="搜索模型、产品、公司、关键词…"
              value={filters.query}
              onChange={(e) => onChange({ query: e.target.value })}
            />
          </div>
        </div>

        <div className="event-legend event-legend--banner" aria-label="事件类型图例">
          {EVENT_TYPE_LEGEND.map((g) => (
            <span key={g.label} className="event-legend__item">
              <i style={{ background: g.color }} />
              {g.label}
            </span>
          ))}
        </div>
      </div>
    </header>
  )
}
