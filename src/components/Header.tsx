import type { TimelineMeta } from '../types/timeline'
import type { AppPage } from '../lib/route'

export type Filters = {
  query: string
}

type Props = {
  meta: TimelineMeta
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
  eventCount: number
  page: AppPage
  onNavigate: (page: AppPage) => void
  toolsCount?: number
}

const brandMarkSrc = `${import.meta.env.BASE_URL || '/'}brand/mark.svg`

export default function Header({
  meta,
  filters,
  onChange,
  eventCount,
  page,
  onNavigate,
  toolsCount,
}: Props) {
  const openingBg =
    meta.ui?.openingBg ??
    'linear-gradient(145deg, #0B1220 0%, #1E1B4B 48%, #312E81 100%)'
  const openingFg = meta.ui?.openingFg ?? '#F8FAFC'
  const searchPlaceholder =
    page === 'tools'
      ? '搜索公司、产品、形态、费用…'
      : '搜索模型、产品、公司、关键词…'
  const subtitle =
    page === 'tools'
      ? `产品矩阵 · v${meta.version} · ${toolsCount ?? '—'} 家 · 更新 ${meta.updatedAt}`
      : `自 ${meta.scopeStart} · v${meta.version} · ${eventCount} 条 · 更新 ${meta.updatedAt}`

  return (
    <header className="app-header">
      <div
        className="app-header__banner"
        style={{ background: openingBg, color: openingFg }}
      >
        <div className="app-header__brand">
          <img
            className="app-header__logo-img"
            src={brandMarkSrc}
            width={36}
            height={36}
            alt=""
            draggable={false}
          />
          <div className="app-header__titles">
            <h1>
              {meta.name}
              <span className="app-header__en">AI Timeline</span>
            </h1>
            <p className="app-header__subtitle">{subtitle}</p>
          </div>
        </div>

        <nav className="app-header__nav" aria-label="页面切换">
          <button
            type="button"
            className={`app-header__nav-btn${page === 'timeline' ? ' is-active' : ''}`}
            aria-current={page === 'timeline' ? 'page' : undefined}
            onClick={() => onNavigate('timeline')}
          >
            纪年
          </button>
          <button
            type="button"
            className={`app-header__nav-btn${page === 'tools' ? ' is-active' : ''}`}
            aria-current={page === 'tools' ? 'page' : undefined}
            onClick={() => onNavigate('tools')}
          >
            AI工具
          </button>
        </nav>

        <div className="app-header__search-wrap">
          <label className="sr-only" htmlFor="site-search">
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
              id="site-search"
              type="search"
              placeholder={searchPlaceholder}
              value={filters.query}
              onChange={(e) => onChange({ query: e.target.value })}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
