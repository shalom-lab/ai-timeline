import type { CapabilityMonth } from '../types/capability'
import { FRONTIER_LABEL_ZH, FRONTIER_THEME } from '../types/capability'

type Props = {
  months: CapabilityMonth[]
  isSolo: boolean
  onSolo: () => void
  onExitSolo: () => void
  /** Optional: highlight / scroll to a timeline event from enabledBy */
  onSelectEvent?: (id: string) => void
}

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

function IconFrontier() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" strokeLinecap="round" />
    </svg>
  )
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-')
  return `${y}年${Number(m)}月`
}

export default function FrontierColumn({
  months,
  isSolo,
  onSolo,
  onExitSolo,
  onSelectEvent,
}: Props) {
  const theme = FRONTIER_THEME
  const workflowCount = months.reduce((n, m) => n + m.workflows.length, 0)

  return (
    <section
      className={`cat-column frontier-column${isSolo ? ' is-solo' : ''}`}
      style={{ ['--accent' as string]: theme.accent }}
      aria-label={FRONTIER_LABEL_ZH}
    >
      <div className="cat-column__header">
        <span
          className="cat-column__header-icon"
          style={{ color: theme.accent, background: theme.headerSoft }}
        >
          <IconFrontier />
        </span>
        <span className="cat-column__header-title">{FRONTIER_LABEL_ZH}</span>
        <span
          className="cat-column__header-count"
          style={{ color: theme.accent, background: theme.headerSoft }}
        >
          {workflowCount}
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

      <p className="frontier-column__hint">
        月末快照：当月新出现、普通人+AI 可实际采用的工作流（不重复往月）。
      </p>

      <div className="cat-column__body frontier-column__body">
        {months.length === 0 ? (
          <p className="cat-column__empty">暂无匹配能力</p>
        ) : (
          months.map((m) => (
            <article key={m.month} className="frontier-month">
              <header className="frontier-month__head">
                <time dateTime={m.month}>{formatMonthLabel(m.month)}</time>
                <span className="frontier-month__new">+{m.workflows.length}</span>
              </header>
              <p className="frontier-month__summary">{m.summary}</p>
              <ul className="frontier-month__list">
                {m.workflows.map((w) => (
                  <li key={w.id} className="frontier-workflow">
                    <div className="frontier-workflow__title">{w.title}</div>
                    {w.how ? (
                      <p className="frontier-workflow__how">{w.how}</p>
                    ) : null}
                    {w.enabledBy && w.enabledBy.length > 0 && onSelectEvent ? (
                      <div className="frontier-workflow__links">
                        {w.enabledBy.map((eid) => (
                          <button
                            key={eid}
                            type="button"
                            className="frontier-workflow__link"
                            title={`定位事件 ${eid}`}
                            onClick={() => onSelectEvent(eid)}
                          >
                            关联事件
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
