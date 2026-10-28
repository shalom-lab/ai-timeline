import { timelineData } from './data'
import type { Company } from './types/timeline'
import { CATEGORY_LABEL_ZH } from './types/timeline'

function resolveCompany(
  companies: Company[],
  name: string,
): Company | undefined {
  const lower = name.toLowerCase()
  return companies.find(
    (c) =>
      c.name.toLowerCase() === lower ||
      c.id === lower ||
      c.aliases?.some((a) => a.toLowerCase() === lower),
  )
}

/** Stubby UI — data layer first; real timeline visualization comes later. */
export default function App() {
  const { meta, companies, events } = timelineData
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date))
  const ui = meta.ui
  const openingBg =
    ui?.openingBg ??
    'linear-gradient(145deg, #0B1220 0%, #1E1B4B 48%, #312E81 100%)'
  const openingFg = ui?.openingFg ?? '#F8FAFC'

  return (
    <>
      <header
        className="hero"
        style={{ background: openingBg, color: openingFg }}
      >
        <div className="hero-inner">
          <h1>{meta.name}</h1>
          <p className="hero-scope">
            范围自 {meta.scopeStart} · v{meta.version} · {events.length}{' '}
            条事件 · 数据更新 {meta.updatedAt}
          </p>
          <p className="hero-blurb">
            ChatGPT 公众研究预览以来的 AI 里程碑：概念 → 大模型 → 产品 → 其他
          </p>
        </div>
      </header>

      <main>
        <div className="stub">
          <strong>占位界面</strong>
          <p style={{ margin: '0.35rem 0 0' }}>
            颜色映射在公司级（companies[].color）；一级分类无色值。请阅读{' '}
            <code>docs/DATA.md</code>。
          </p>
          <div className="company-pills">
            {companies.map((c) => (
              <span
                key={c.id}
                className="company-pill"
                style={{
                  background: c.colorSoft ?? '#eef1f6',
                  borderColor: c.color,
                  color: c.color,
                }}
                title={c.id}
              >
                <i style={{ background: c.color }} />
                {c.name}
              </span>
            ))}
          </div>
        </div>

        <ul className="events">
          {sorted.map((e) => {
            const co = resolveCompany(companies, e.company)
            const marker = co?.color ?? '#94a3b8'
            const soft = co?.colorSoft ?? '#eef1f6'
            return (
              <li
                key={e.id}
                className="event"
                style={{ borderLeftColor: marker }}
              >
                <div className="event-mark" style={{ background: marker }} />
                <time dateTime={e.date}>{e.date}</time>
                <strong>{e.title}</strong>
                <div className="badges">
                  <span
                    className="badge company-badge"
                    style={{ background: soft, color: marker, borderColor: marker }}
                  >
                    {e.company}
                  </span>
                  <span className="badge">
                    {CATEGORY_LABEL_ZH[e.category] ?? e.category}
                  </span>
                  <span className="badge">{e.eventType}</span>
                  {e.productSubcategory ? (
                    <span className="badge">{e.productSubcategory}</span>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      </main>
    </>
  )
}
