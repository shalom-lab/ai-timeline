import { useMemo, useCallback } from 'react'
import {
  type DateWindow,
  enumerateMonths,
  clampDateWindow,
  toMonthKey,
} from '../lib/calendar'

type Props = {
  value: DateWindow
  onChange: (value: DateWindow) => void
  /** Inclusive lower bound YYYY-MM (earliest data month). */
  minMonth: string
  /** Inclusive upper bound YYYY-MM (current calendar month). */
  maxMonth: string
}

function formatYm(ym: string): string {
  const y = ym.slice(0, 4)
  const m = ym.slice(5, 7)
  return `${y}年${m}月`
}

export default function TimeWindow({
  value,
  onChange,
  minMonth,
  maxMonth,
}: Props) {
  const months = useMemo(
    () => enumerateMonths(minMonth, maxMonth),
    [minMonth, maxMonth],
  )
  const maxIdx = Math.max(0, months.length - 1)

  const start = toMonthKey(value.start)
  const end = toMonthKey(value.end)
  const startIdx = Math.max(0, months.indexOf(start))
  const endIdx = Math.max(startIdx, months.indexOf(end) === -1 ? maxIdx : months.indexOf(end))

  const commit = useCallback(
    (nextStartIdx: number, nextEndIdx: number) => {
      if (months.length === 0) return
      let s = Math.max(0, Math.min(maxIdx, nextStartIdx))
      let e = Math.max(0, Math.min(maxIdx, nextEndIdx))
      if (s > e) {
        const t = s
        s = e
        e = t
      }
      onChange(
        clampDateWindow({ start: months[s], end: months[e] }, minMonth, maxMonth),
      )
    },
    [months, maxIdx, minMonth, maxMonth, onChange],
  )

  if (months.length === 0) return null

  const rangePct =
    maxIdx === 0
      ? { left: 0, width: 100 }
      : {
          left: (startIdx / maxIdx) * 100,
          width: ((endIdx - startIdx) / maxIdx) * 100,
        }

  return (
    <section className="time-window time-window--rail time-window--slider" aria-label="历史月份窗">
      <div className="time-window__labels">
        <span className="time-window__bound">
          <em>起始</em> {formatYm(months[startIdx])}
        </span>
        <span className="time-window__bound time-window__bound--end">
          <em>截止</em> {formatYm(months[endIdx])}
        </span>
      </div>
      <div className="time-window__dual">
        <div className="time-window__track" aria-hidden>
          <div
            className="time-window__fill"
            style={{ left: `${rangePct.left}%`, width: `${rangePct.width}%` }}
          />
        </div>
        <input
          type="range"
          className="time-window__thumb time-window__thumb--start"
          min={0}
          max={maxIdx}
          step={1}
          value={startIdx}
          aria-label="起始月"
          aria-valuetext={formatYm(months[startIdx])}
          onChange={(e) => {
            const next = Number(e.target.value)
            commit(next, Math.max(next, endIdx))
          }}
        />
        <input
          type="range"
          className="time-window__thumb time-window__thumb--end"
          min={0}
          max={maxIdx}
          step={1}
          value={endIdx}
          aria-label="截止月"
          aria-valuetext={formatYm(months[endIdx])}
          onChange={(e) => {
            const next = Number(e.target.value)
            commit(Math.min(next, startIdx), next)
          }}
        />
      </div>
      <p className="time-window__range" role="status">
        {months[startIdx]} — {months[endIdx]}
        {startIdx === 0 && endIdx === maxIdx ? ' · 全跨度' : ''}
      </p>
    </section>
  )
}
