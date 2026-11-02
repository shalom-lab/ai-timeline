import { useCallback } from 'react'
import {
  type DateWindow,
  clampDateWindow,
  toMonthKey,
} from '../lib/calendar'

export type RecentPreset = '1m' | '3m' | '6m' | 'custom'

const PRESETS: readonly { id: RecentPreset; label: string; title: string }[] = [
  { id: '1m', label: '1个月', title: '近 1 个自然月（含本月）' },
  { id: '3m', label: '3个月', title: '近 3 个自然月（含本月）' },
  { id: '6m', label: '半年', title: '近 6 个自然月（含本月）' },
  { id: 'custom', label: '自定义', title: '自定义起止月份' },
] as const

type Props = {
  preset: RecentPreset
  onPresetChange: (preset: RecentPreset) => void
  customWindow: DateWindow
  onCustomWindowChange: (value: DateWindow) => void
  minMonth: string
  maxMonth: string
}

function formatYm(ym: string): string {
  const y = ym.slice(0, 4)
  const m = ym.slice(5, 7)
  return `${y}年${m}月`
}

export default function RecentRange({
  preset,
  onPresetChange,
  customWindow,
  onCustomWindowChange,
  minMonth,
  maxMonth,
}: Props) {
  const start = toMonthKey(customWindow.start)
  const end = toMonthKey(customWindow.end)

  const commitCustom = useCallback(
    (nextStart: string, nextEnd: string) => {
      onCustomWindowChange(
        clampDateWindow({ start: nextStart, end: nextEnd }, minMonth, maxMonth),
      )
    },
    [minMonth, maxMonth, onCustomWindowChange],
  )

  return (
    <section className="recent-range" aria-label="最近时间范围">
      <div className="recent-range__chips" role="group" aria-label="预设范围">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`recent-range__chip${preset === p.id ? ' is-active' : ''}`}
            aria-pressed={preset === p.id}
            title={p.title}
            onClick={() => onPresetChange(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      {preset === 'custom' ? (
        <div className="recent-range__custom">
          <label className="recent-range__field">
            <span>起始</span>
            <input
              type="month"
              min={minMonth}
              max={end}
              value={start}
              aria-label="自定义起始月"
              onChange={(e) => commitCustom(e.target.value, end)}
            />
          </label>
          <label className="recent-range__field">
            <span>截止</span>
            <input
              type="month"
              min={start}
              max={maxMonth}
              value={end}
              aria-label="自定义截止月"
              onChange={(e) => commitCustom(start, e.target.value)}
            />
          </label>
          <p className="recent-range__hint" role="status">
            {formatYm(start)} — {formatYm(end)}
          </p>
        </div>
      ) : null}
    </section>
  )
}
