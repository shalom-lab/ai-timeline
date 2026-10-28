import { useMemo, useState, type ReactNode } from 'react'
import type { CapabilityMonth, CapabilityScenario } from '../types/capability'
import { FRONTIER_LABEL_ZH, FRONTIER_THEME } from '../types/capability'

type Props = {
  months: CapabilityMonth[]
  allMonths?: CapabilityMonth[]
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

function CompareCard({
  s,
  onSelectEvent,
  muted = false,
}: {
  s: CapabilityScenario
  onSelectEvent?: (id: string) => void
  muted?: boolean
}) {
  const links =
    s.enabledBy && s.enabledBy.length > 0 && onSelectEvent ? (
      <div className="frontier-compare__links">
        {s.enabledBy.map((eid) => (
          <button
            key={eid}
            type="button"
            className="frontier-compare__link"
            title={`定位事件 ${eid}`}
            onClick={() => onSelectEvent(eid)}
          >
            关联事件
          </button>
        ))}
      </div>
    ) : null

  return (
    <li className={`frontier-compare${muted ? ' frontier-compare--muted' : ''}`}>
      {s.emoji ? (
        <span className="frontier-compare__emoji" aria-hidden>
          {s.emoji}
        </span>
      ) : null}

      <div className="frontier-compare__main">
        <div className="frontier-compare__cols">
          <div className="frontier-compare__col frontier-compare__col--before">
            <span className="frontier-compare__label">BEFORE · 原来的方式</span>
            <p className="frontier-compare__text">{s.before}</p>
          </div>

          <div className="frontier-compare__divider" aria-hidden>
            <span className="frontier-compare__arrow">→</span>
          </div>

          <div className="frontier-compare__col frontier-compare__col--after">
            <span className="frontier-compare__label">AFTER · 新的可能</span>
            <p className="frontier-compare__text">{s.after}</p>
            {s.detail ? <p className="frontier-compare__detail">{s.detail}</p> : null}
          </div>
        </div>

        {links}
      </div>
    </li>
  )
}

function MonthCard({
  month,
  carried,
  onSelectEvent,
  sortControl,
}: {
  month: CapabilityMonth
  carried: CapabilityScenario[]
  onSelectEvent?: (id: string) => void
  sortControl?: ReactNode
}) {
  return (
    <article className="frontier-month" data-frontier-month={month.month}>
      <header className="frontier-month__head">
        <time dateTime={month.month}>{formatMonthLabel(month.month)}</time>
        <span className="frontier-month__new">+{month.new.length} 项新能力</span>
        {sortControl}
      </header>
      <p className="frontier-month__summary">{month.summary}</p>

      <div className="frontier-month__panes-wrap">
        <div className="frontier-month__panes">
          <section className="frontier-pane frontier-pane--new" aria-label={`${month.month} 当月新增`}>
            <header className="frontier-pane__head"><h3>当月新增 <span>{month.new.length}</span></h3><p>这一月，新的能力突破</p></header>
            <ul className="frontier-month__list">{month.new.map(s => <CompareCard key={s.id} s={s} onSelectEvent={onSelectEvent} />)}</ul>
          </section>
          <section className="frontier-pane frontier-pane--history" aria-label={`${month.month} 既往已具备`}>
            <header className="frontier-pane__head"><h3>既往已具备 <span>{carried.length}</span></h3><p>此前累计的能力 · 在下方独立滚动查看</p></header>
            <div className="frontier-pane__scroll" tabIndex={0} role="region" aria-label={`${month.month} 历史能力滚动区`}>
              {carried.length ? <ul className="frontier-month__list">{[...carried].reverse().map(s => <CompareCard key={s.id} s={s} onSelectEvent={onSelectEvent} muted />)}</ul> : <p className="frontier-pane__empty">这是收录的起点，尚无既往能力。</p>}
            </div>
          </section>
        </div>
      </div>
    </article>
  )
}

export default function FrontierColumn({ months, allMonths = months, onSelectEvent, omitTitle = false }: Props) {
  const [newestFirst, setNewestFirst] = useState(true)
  const displayedMonths = useMemo(() => [...months].sort((a, b) => newestFirst ? b.month.localeCompare(a.month) : a.month.localeCompare(b.month)), [months, newestFirst])
  const theme = FRONTIER_THEME
  const newCount = months.reduce((n, m) => n + m.new.length, 0)

  /** Cumulative scenarios before each month (既往已具备). */
  const carriedByMonth = useMemo(() => {
    const map = new Map<string, CapabilityScenario[]>()
    const acc: CapabilityScenario[] = []
    for (const m of [...allMonths].sort((a, b) => a.month.localeCompare(b.month))) {
      map.set(m.month, [...acc])
      acc.push(...m.new)
    }
    return map
  }, [allMonths])

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

      <div className="cat-column__body frontier-column__body">
        {months.length === 0 ? (
          <p className="cat-column__empty">暂无匹配场景</p>
        ) : (
          displayedMonths.map((m, i) => (
            <MonthCard
              key={m.month}
              month={m}
              carried={carriedByMonth.get(m.month) ?? []}
              onSelectEvent={onSelectEvent}
              sortControl={
                i === 0 ? (
                  <label className="frontier-sort">
                    <select
                      aria-label="能力边界时间顺序"
                      value={newestFirst ? 'newest' : 'oldest'}
                      onChange={(e) => setNewestFirst(e.target.value === 'newest')}
                    >
                      <option value="newest">最新在前</option>
                      <option value="oldest">从起点开始</option>
                    </select>
                  </label>
                ) : undefined
              }
            />
          ))
        )}
      </div>
    </section>
  )
}
