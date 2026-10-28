import { useMemo, useState } from 'react'
import type { CapabilityMonth, CapabilityScenario } from '../types/capability'
import { FRONTIER_LABEL_ZH, FRONTIER_THEME } from '../types/capability'

type Props = {
  months: CapabilityMonth[]
  isSolo: boolean
  onSolo: () => void
  onExitSolo: () => void
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

function ScenarioItem({
  s,
  onSelectEvent,
}: {
  s: CapabilityScenario
  onSelectEvent?: (id: string) => void
}) {
  return (
    <li className="frontier-workflow">
      <div className="frontier-workflow__title">
        {s.emoji ? <span className="frontier-workflow__emoji">{s.emoji}</span> : null}
        <span>{s.title}</span>
      </div>
      {s.detail ? <p className="frontier-workflow__how">{s.detail}</p> : null}
      {s.enabledBy && s.enabledBy.length > 0 && onSelectEvent ? (
        <div className="frontier-workflow__links">
          {s.enabledBy.map((eid) => (
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
  )
}

function MonthCard({
  month,
  carried,
  onSelectEvent,
}: {
  month: CapabilityMonth
  carried: CapabilityScenario[]
  onSelectEvent?: (id: string) => void
}) {
  const [carriedOpen, setCarriedOpen] = useState(false)

  return (
    <article className="frontier-month">
      <header className="frontier-month__head">
        <time dateTime={month.month}>{formatMonthLabel(month.month)}</time>
        <span className="frontier-month__new">+{month.new.length}</span>
      </header>
      <p className="frontier-month__summary">{month.summary}</p>

      <div className="frontier-month__section">
        <div className="frontier-month__section-label">当月新增</div>
        <ul className="frontier-month__list">
          {month.new.map((s) => (
            <ScenarioItem key={s.id} s={s} onSelectEvent={onSelectEvent} />
          ))}
        </ul>
      </div>

      {carried.length > 0 ? (
        <div className="frontier-month__section frontier-month__section--carried">
          <button
            type="button"
            className="frontier-month__carried-toggle"
            aria-expanded={carriedOpen}
            onClick={() => setCarriedOpen((v) => !v)}
          >
            <span aria-hidden>{carriedOpen ? '▾' : '▸'}</span>
            既往已具备
            <em>{carried.length}</em>
          </button>
          {carriedOpen ? (
            <ul className="frontier-month__list frontier-month__list--carried">
              {carried.map((s) => (
                <ScenarioItem key={s.id} s={s} onSelectEvent={onSelectEvent} />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

export default function FrontierColumn({
  months,
  isSolo,
  onSolo,
  onExitSolo,
  onSelectEvent,
}: Props) {
  const theme = FRONTIER_THEME
  const newCount = months.reduce((n, m) => n + m.new.length, 0)

  /** Cumulative scenarios before each month (既往已具备). */
  const carriedByMonth = useMemo(() => {
    const map = new Map<string, CapabilityScenario[]>()
    const acc: CapabilityScenario[] = []
    for (const m of months) {
      map.set(m.month, [...acc])
      acc.push(...m.new)
    }
    return map
  }, [months])

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
          {newCount}
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
        工作场景快照：截止该月末，普通人+AI
        已经能做的事。「当月新增」默认展开；「既往已具备」默认折叠。
      </p>

      <div className="cat-column__body frontier-column__body">
        {months.length === 0 ? (
          <p className="cat-column__empty">暂无匹配场景</p>
        ) : (
          months.map((m) => (
            <MonthCard
              key={m.month}
              month={m}
              carried={carriedByMonth.get(m.month) ?? []}
              onSelectEvent={onSelectEvent}
            />
          ))
        )}
      </div>
    </section>
  )
}
