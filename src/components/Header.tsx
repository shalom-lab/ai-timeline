import type {
  Category,
  Company,
  EventType,
  ProductSubcategory,
  TimelineMeta,
} from '../types/timeline'
import {
  BOARD_CATEGORY_ORDER,
  CATEGORY_LABEL_ZH,
  EVENT_TYPE_LABEL_ZH,
  EVENT_TYPE_LEGEND,
  PRODUCT_SUBCATEGORY_LABEL_ZH,
  PRODUCT_SUBCATEGORY_CHIP_ORDER,
} from '../lib/labels'

export type Filters = {
  query: string
  year: string | 'all'
  company: string | 'all'
  category: Category | 'all'
  productSubcategory: ProductSubcategory | 'all'
  eventType: EventType | 'all'
}

type Props = {
  meta: TimelineMeta
  years: string[]
  companies: Company[]
  eventTypesPresent: EventType[]
  productSubsPresent: ProductSubcategory[]
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
  eventCount: number
}

export default function Header({
  meta,
  years,
  companies,
  eventTypesPresent,
  productSubsPresent,
  filters,
  onChange,
  eventCount,
}: Props) {
  const openingBg =
    meta.ui?.openingBg ??
    'linear-gradient(145deg, #0B1220 0%, #1E1B4B 48%, #312E81 100%)'
  const openingFg = meta.ui?.openingFg ?? '#F8FAFC'

  const orderedSubs = PRODUCT_SUBCATEGORY_CHIP_ORDER.filter((s) =>
    productSubsPresent.includes(s),
  )

  return (
    <header className="app-header">
      <div
        className="app-header__banner"
        style={{ background: openingBg, color: openingFg }}
      >
        <div className="app-header__brand">
          <div className="app-header__logo" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M8 12h8M12 8v8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <h1>{meta.name}</h1>
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
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

        <div className="app-header__utils" aria-hidden title="浅色主题">
          <span className="app-header__util-btn">☀</span>
        </div>
      </div>

      <div className="app-header__toolbar">
        <div className="year-chips" role="tablist" aria-label="按年筛选">
          <button
            type="button"
            className={filters.year === 'all' ? 'is-active' : ''}
            onClick={() => onChange({ year: 'all' })}
          >
            全部
          </button>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              className={filters.year === y ? 'is-active' : ''}
              onClick={() => onChange({ year: y })}
            >
              {y}
            </button>
          ))}
        </div>

        <div className="filter-row">
          <label>
            <span>公司</span>
            <select
              value={filters.company}
              onChange={(e) =>
                onChange({ company: e.target.value as Filters['company'] })
              }
            >
              <option value="all">全部</option>
              {companies.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>一级分类</span>
            <select
              value={filters.category}
              onChange={(e) =>
                onChange({
                  category: e.target.value as Filters['category'],
                })
              }
            >
              <option value="all">全部</option>
              {BOARD_CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL_ZH[c]}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>产品大类</span>
            <select
              value={filters.productSubcategory}
              onChange={(e) =>
                onChange({
                  productSubcategory: e.target
                    .value as Filters['productSubcategory'],
                })
              }
            >
              <option value="all">全部</option>
              {orderedSubs.map((s) => (
                <option key={s} value={s}>
                  {PRODUCT_SUBCATEGORY_LABEL_ZH[s]}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>事件类型</span>
            <select
              value={filters.eventType}
              onChange={(e) =>
                onChange({
                  eventType: e.target.value as Filters['eventType'],
                })
              }
            >
              <option value="all">全部</option>
              {eventTypesPresent.map((t) => (
                <option key={t} value={t}>
                  {EVENT_TYPE_LABEL_ZH[t]}
                </option>
              ))}
            </select>
          </label>

          <div className="event-legend" aria-label="事件类型图例">
            {EVENT_TYPE_LEGEND.map((g) => (
              <span key={g.label} className="event-legend__item">
                <i style={{ background: g.color }} />
                {g.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
