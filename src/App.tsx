import { timelineData } from './data'

/** Stubby UI — data layer first; real timeline visualization comes later. */
export default function App() {
  const { meta, events } = timelineData
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <main>
      <h1>{meta.name}</h1>
      <p className="meta">
        v{meta.version} · 范围自 {meta.scopeStart} · 数据更新 {meta.updatedAt} ·{' '}
        {events.length} 条事件
      </p>
      <div className="stub">
        <strong>占位界面</strong>
        <p style={{ margin: '0.35rem 0 0' }}>
          当前交付重点是数据规范与种子 JSON。请先阅读{' '}
          <code>docs/DATA.md</code> 与 <code>docs/DEVELOPMENT.md</code>
          。GitHub Pages 尚未配置。
        </p>
      </div>
      <ul className="events">
        {sorted.map((e) => (
          <li key={e.id} className="event">
            <time dateTime={e.date}>{e.date}</time>
            <strong>{e.title}</strong>
            <div className="badges">
              <span className="badge">{e.company}</span>
              <span className="badge">{e.category}</span>
              <span className="badge">{e.eventType}</span>
              {e.productSubcategory ? (
                <span className="badge">{e.productSubcategory}</span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
