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
  const searchPlaceholder =
    page === 'tools'
      ? '搜索公司、产品、形态、费用…'
      : '搜索模型、产品、公司、关键词…'
  const subtitle =
    page === 'tools'
      ? `当前可用产品 · ${toolsCount ?? '—'} 家`
      : `始于 ${meta.scopeStart} · ${eventCount} 条里程碑`

  return (
    <header className="app-header">
      <div
        className="app-header__banner"

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
            探索纪年
          </button>
          <button
            type="button"
            className={`app-header__nav-btn${page === 'tools' ? ' is-active' : ''}`}
            aria-current={page === 'tools' ? 'page' : undefined}
            onClick={() => onNavigate('tools')}
          >
            AI 工具库
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
      <div className="page-intro">
        <div>
          <span className="page-intro__eyebrow">THE AI ATLAS / {page === 'tools' ? 'DIRECTORY' : 'CHRONICLE'}</span>
          <h2>{page === 'tools' ? '找到你的下一件 AI 工具。' : '看见 AI 演进的每一步。'}</h2>
          <p>{page === 'tools' ? '从模型到产品，按使用场景发现、比较与探索。' : '串联模型、产品与科学突破，理解技术如何拓展我们的能力。'}</p>
        </div>
        <div className="page-intro__status"><span /> 数据更新 <time>{meta.updatedAt}</time></div>
      </div>
    </header>
  )
}
