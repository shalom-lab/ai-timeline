import { useCallback } from 'react'

export type RecentPreset = '1m' | '3m' | '6m' | 'custom'

const PRESETS: readonly { id: RecentPreset; label: string; title: string }[] = [
  { id: '1m', label: '1个月', title: '近 1 个月（从今天往回）' },
  { id: '3m', label: '3个月', title: '近 3 个月（从今天往回）' },
  { id: '6m', label: '半年', title: '近半年（从今天往回）' },
  { id: 'custom', label: '自定义', title: '自定义近 N 个月（从今天往回）' },
] as const

type Props = {
  preset: RecentPreset
  onPresetChange: (preset: RecentPreset) => void
  /** Custom「近 N 个月」; each month = 30 days from today. Default 12. */
  customMonths: number
  onCustomMonthsChange: (months: number) => void
}

export default function RecentRange({
  preset,
  onPresetChange,
  customMonths,
  onCustomMonthsChange,
}: Props) {
  const commitMonths = useCallback(
    (raw: string) => {
      const n = Math.max(1, Math.min(120, Math.floor(Number(raw)) || 1))
      onCustomMonthsChange(n)
    },
    [onCustomMonthsChange],
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
            <span>近</span>
            <input
              type="number"
              min={1}
              max={120}
              step={1}
              value={customMonths}
              aria-label="自定义近几个月"
              onChange={(e) => commitMonths(e.target.value)}
            />
            <span>个月</span>
          </label>
          <p className="recent-range__hint" role="status">
            近 {customMonths} 个月 · 从今天往回
          </p>
        </div>
      ) : null}
    </section>
  )
}
