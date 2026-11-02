import { useCallback, useRef, useEffect } from 'react'

export type RecentPreset = '1m' | '3m' | '6m' | '12m'

const FIXED: readonly { id: Exclude<RecentPreset, '12m'>; label: string; title: string }[] = [
  { id: '1m', label: '1个月', title: '近 1 个月（从今天往回）' },
  { id: '3m', label: '3个月', title: '近 3 个月（从今天往回）' },
  { id: '6m', label: '半年', title: '近半年（从今天往回）' },
] as const

type Props = {
  preset: RecentPreset
  onPresetChange: (preset: RecentPreset) => void
  /** Editable N for the「12个月」chip; default 12. Each month = 30 days. */
  customMonths: number
  onCustomMonthsChange: (months: number) => void
}

export default function RecentRange({
  preset,
  onPresetChange,
  customMonths,
  onCustomMonthsChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const twelveActive = preset === '12m'

  const commitMonths = useCallback(
    (raw: string) => {
      const n = Math.max(1, Math.min(120, Math.floor(Number(raw)) || 1))
      onCustomMonthsChange(n)
    },
    [onCustomMonthsChange],
  )

  useEffect(() => {
    if (!twelveActive) return
    // Focus after selecting 12 so N is immediately editable
    const t = window.setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
    return () => window.clearTimeout(t)
  }, [twelveActive])

  return (
    <section className="recent-range" aria-label="最近时间范围">
      <div className="recent-range__chips" role="group" aria-label="预设范围">
        {FIXED.map((p) => (
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
        <button
          type="button"
          className={`recent-range__chip recent-range__chip--editable${twelveActive ? ' is-active' : ''}`}
          aria-pressed={twelveActive}
          title="近 12 个月（点击可选中并修改月数）"
          onClick={() => onPresetChange('12m')}
        >
          {twelveActive ? (
            <label className="recent-range__inline" onClick={(e) => e.stopPropagation()}>
              <input
                ref={inputRef}
                type="number"
                min={1}
                max={120}
                step={1}
                value={customMonths}
                aria-label="近几个月"
                onChange={(e) => commitMonths(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    ;(e.target as HTMLInputElement).blur()
                  }
                }}
              />
              <span>个月</span>
            </label>
          ) : (
            '12个月'
          )}
        </button>
      </div>
    </section>
  )
}
