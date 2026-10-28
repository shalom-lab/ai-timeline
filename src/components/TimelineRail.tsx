import { useMemo, useState, useCallback } from 'react'
import type { Company, TimelineEvent } from '../types/timeline'
import { FRONTIER_THEME } from '../types/capability'
import { companyColor } from '../lib/company'
import type { TimelineLayout } from '../lib/timelineLayout'
import { YEAR_MARKER_H } from '../lib/timelineLayout'

type RailMode = 'history' | 'month'

type Props = {
  events: TimelineEvent[]
  companies: Company[]
  /** Rail hover event id — dashed same-moment line (no mute). */
  hoverId: string | null
  onHover: (id: string | null) => void
  /** Click-pinned event id — solid line + 灰白 (cards + rail below). Rail only; never selects cards. */
  pinId?: string | null
  /** Toggle bump pin (solid+mute). Does not select / outline cards. */
  onTogglePin?: (id: string) => void
  /** Compact equal-step rail layout (year left / dates indented). */
  layout: TimelineLayout
  /** When true, layout items are frontier month proxies (no TimelineEvent). */
  frontierMode?: boolean
  /** 既往 = full history; 本月 = current calendar month only. */
  mode?: RailMode
  onModeChange?: (mode: RailMode) => void
}

type MonthBand = {
  ym: string
  top: number
  height: number
  tone: number
}

const ITEM_HALF = 9
const BAND_PAD = 2

function buildMonthBands(
  items: { centerY: number; ym: string }[],
): MonthBand[] {
  if (items.length === 0) return []
  const bands: MonthBand[] = []
  let i = 0
  let tone = 0
  while (i < items.length) {
    const ym = items[i].ym
    let j = i + 1
    while (j < items.length && items[j].ym === ym) j++
    const first = items[i]
    const last = items[j - 1]
    const top = Math.max(0, first.centerY - ITEM_HALF - BAND_PAD)
    const bottom = last.centerY + ITEM_HALF + BAND_PAD
    bands.push({
      ym,
      top,
      height: Math.max(16, bottom - top),
      tone: tone % 2,
    })
    tone += 1
    i = j
  }
  return bands
}

function focusCard(id: string) {
  const el = document.querySelector<HTMLElement>(
    `[data-event-id="${CSS.escape(id)}"]`,
  )
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
}

function focusFrontierMonth(month: string) {
  const el = document.querySelector<HTMLElement>(
    `[data-frontier-month="${CSS.escape(month)}"]`,
  )
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
}

export default function TimelineRail({
  events,
  companies,
  hoverId,
  onHover,
  pinId = null,
  onTogglePin,
  layout,
  frontierMode = false,
  mode = 'history',
  onModeChange,
}: Props) {
  const byId = useMemo(() => {
    const m = new Map<string, TimelineEvent>()
    for (const e of events) m.set(e.id, e)
    return m
  }, [events])

  const monthBands = useMemo(
    () => buildMonthBands(layout.items),
    [layout.items],
  )

  /** Pinned focus date — mute rail nodes/segments strictly after (match card 灰白). */
  const pinDate = pinId ? byId.get(pinId)?.date ?? null : null
  const pinCenterY = pinId != null ? (layout.centerY[pinId] ?? null) : null
  const muteRailFuture = pinDate != null

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggleYear = useCallback((year: string) => {
    setCollapsed((c) => ({ ...c, [year]: !c[year] }))
  }, [])

  const hiddenYears = useMemo(() => {
    const s = new Set<string>()
    for (const [y, v] of Object.entries(collapsed)) {
      if (v) s.add(y)
    }
    return s
  }, [collapsed])

  return (
    <nav className="timeline-rail" aria-label="时间轴（日期导航，紧凑缩进）">
      <div className="timeline-rail__head-spacer">
        <div
          className="timeline-rail__mode"
          role="group"
          aria-label="时间轴模式"
        >
          <button
            type="button"
            className={`timeline-rail__mode-btn${mode === 'history' ? ' is-active' : ''}`}
            aria-pressed={mode === 'history'}
            title="既往：显示全部历史日期"
            onClick={() => onModeChange?.('history')}
          >
            既往
          </button>
          <button
            type="button"
            className={`timeline-rail__mode-btn${mode === 'month' ? ' is-active' : ''}`}
            aria-pressed={mode === 'month'}
            title="本月大事件：仅显示当月"
            onClick={() => onModeChange?.('month')}
          >
            本月
          </button>
        </div>
      </div>
      <div
        className="timeline-rail__canvas"
        style={{ height: layout.height }}
      >
        {layout.years.map((y) => {
          const isCollapsed = hiddenYears.has(y.year)
          const yearMuted =
            muteRailFuture &&
            pinCenterY != null &&
            y.top > pinCenterY
          return (
            <button
              key={y.year}
              type="button"
              className={`timeline-rail__year-marker${isCollapsed ? ' is-collapsed' : ''}${yearMuted ? ' is-future' : ''}`}
              style={{ top: y.top, height: YEAR_MARKER_H }}
              aria-expanded={!isCollapsed}
              title={
                isCollapsed
                  ? `显示 ${y.year} 节点`
                  : `折叠 ${y.year} 节点`
              }
              onClick={() => toggleYear(y.year)}
            >
              <span className="timeline-rail__year-chevron" aria-hidden>
                {isCollapsed ? '▸' : '▾'}
              </span>
              <span className="timeline-rail__year-text">{y.year}</span>
              <span className="timeline-rail__year-count">{y.count}</span>
            </button>
          )
        })}

        {monthBands.map((band) => {
          if (hiddenYears.has(band.ym.slice(0, 4))) return null
          const bandMuted =
            muteRailFuture &&
            pinCenterY != null &&
            band.top >= pinCenterY
          return (
            <div
              key={band.ym}
              className={`timeline-rail__month-bg timeline-rail__month-bg--${band.tone}${bandMuted ? ' is-future' : ''}`}
              style={{ top: band.top, height: band.height }}
              data-month={band.ym}
              aria-hidden
            />
          )
        })}

        {muteRailFuture && pinCenterY != null ? (
          <>
            <div
              className="timeline-rail__line"
              style={{ top: 2, height: Math.max(0, pinCenterY - 2) }}
              aria-hidden
            />
            <div
              className="timeline-rail__line is-muted-tail"
              style={{
                top: pinCenterY,
                bottom: 6,
                height: 'auto',
              }}
              aria-hidden
            />
          </>
        ) : (
          <div className="timeline-rail__line" aria-hidden />
        )}

        {layout.items.map((item) => {
          const year = item.date.slice(0, 4)
          if (hiddenYears.has(year)) return null

          if (frontierMode || item.id.startsWith('frontier:')) {
            const month = item.ym
            return (
              <button
                key={item.id}
                type="button"
                className="timeline-rail__item is-frontier"
                style={{ top: item.centerY }}
                title={`${month} · 能力边界`}
                aria-label={`${month} 能力边界`}
                onClick={() => focusFrontierMonth(month)}
              >
                <span
                  className="timeline-rail__dot"
                  style={{ background: FRONTIER_THEME.accent }}
                />
                <span className="timeline-rail__md">{item.date.slice(5)}</span>
              </button>
            )
          }

          const event = byId.get(item.id)
          if (!event) return null
          const { color } = companyColor(companies, event.company)
          const hovered = event.id === hoverId
          const pinned = event.id === pinId
          const mutedFuture =
            muteRailFuture && pinDate != null && event.date > pinDate
          return (
            <button
              key={event.id}
              type="button"
              className={`timeline-rail__item${hovered ? ' is-hover' : ''}${pinned ? ' is-pinned' : ''}${mutedFuture ? ' is-future' : ''}`}
              style={{ top: item.centerY }}
              title={`${event.date} · ${event.title}（悬停虚线；点击实线+灰白）`}
              aria-label={`${event.date} ${event.title}`}
              onMouseEnter={() => onHover(event.id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(event.id)}
              onBlur={(e) => {
                const rail = e.currentTarget.closest('.timeline-rail')
                if (
                  rail &&
                  e.relatedTarget instanceof Node &&
                  rail.contains(e.relatedTarget)
                ) {
                  return
                }
                onHover(null)
              }}
              onClick={() => {
                // Bump line only — never select / outline / open card detail.
                onTogglePin?.(event.id)
                requestAnimationFrame(() => focusCard(event.id))
              }}
            >
              <span
                className="timeline-rail__dot"
                style={{ background: color }}
              />
              <span className="timeline-rail__md">{item.date.slice(5)}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
