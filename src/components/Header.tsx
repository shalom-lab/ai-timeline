import type { TimelineMeta } from '../types/timeline'
import type { AppPage } from '../lib/route'

export type Filters = {
  query: string
}

type Props = {
  meta: TimelineMeta
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
  page: AppPage
  onNavigate: (page: AppPage) => void
}

const brandMarkSrc = `${import.meta.env.BASE_URL || '/'}brand/mark.svg`

/** Trim ISO datetime to YYYY-MM-DD when needed. */
function formatUpdatedAt(raw: string): string {
  const m = raw.trim().match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : raw.trim()
}

export default function Header({
  meta,
  filters,
  onChange,
  page,
  onNavigate,
}: Props) {
  const searchPlaceholder =
    page === 'tools'
      ? '搜索公司、产品、形态、费用…'
      : '搜索模型、产品、公司、关键词…'
  // Same short line on both tabs so brand–nav width does not jitter.
  const subtitle = `更新于 ${formatUpdatedAt(meta.updatedAt)}`

  return (
    <header className="app-header">
      <div
        className="app-header__banner"
      >
        <div className="app-header__brand">
          <img
            className="app-header__logo-img"
            src={brandMarkSrc}
            width={32}
            height={32}
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
          <button
            type="button"
            className={`app-header__nav-btn${page === 'gallery' ? ' is-active' : ''}`}
            aria-current={page === 'gallery' ? 'page' : undefined}
            onClick={() => onNavigate('gallery')}
            title="Three.js 第一人称展厅原型"
          >
            3D 展厅
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

        <a
          className="app-header__github"
          href="https://github.com/shalom-lab/ai-timeline"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub"
          aria-label="GitHub 源码"
        >
          <svg
            className="app-header__github-icon"
            width="18"
            height="18"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
      </div>
    </header>
  )
}
