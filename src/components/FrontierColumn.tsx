import { useMemo, useState } from 'react'
import type { CapabilityMonth, CapabilityScenario } from '../types/capability'
import { FRONTIER_LABEL_ZH, FRONTIER_THEME } from '../types/capability'

type Props = {
  months: CapabilityMonth[]
  onSelectEvent?: (id: string) => void
  /** Skip title band when the active board tab already names this panel. */
  omitTitle?: boolean
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
    <article className="frontier-month" data-frontier-month={month.month}>
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

export default function FrontierColumn({ months, onSelectEvent, omitTitle = false }: Props) {
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
      className="cat-column frontier-column"
      style={{ ['--accent' as string]: theme.accent }}
      aria-label={FRONTIER_LABEL_ZH}
    >
      {!omitTitle ? (
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
        </div>
      ) : null}

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
