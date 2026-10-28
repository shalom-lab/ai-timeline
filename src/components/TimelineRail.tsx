import { useMemo, useState, useCallback, useRef } from 'react'
import type { Company, TimelineEvent } from '../types/timeline'
import { FRONTIER_THEME } from '../types/capability'
import { companyColor } from '../lib/company'
import type { TimelineLayout } from '../lib/timelineLayout'
import { YEAR_MARKER_H } from '../lib/timelineLayout'
import {
  type DateWindow,
  clampDateWindow,
  clampMonth,
  shiftDateWindow,
  shiftMonth,
  toMonthKey,
  monthToIndex,
} from '../lib/calendar'
import TimeWindow from './TimeWindow'

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
  /** 既往 = full history; 本月 = same calendar month across all years. */
  mode?: RailMode
  onModeChange?: (mode: RailMode) => void
  /** History month window — rendered under 既往|当月 when mode is history. */
  dateWindow?: DateWindow | null
  onDateWindowChange?: (value: DateWindow) => void
  /** Inclusive slider bounds YYYY-MM. */
  minMonth?: string
  maxMonth?: string
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

type DragKind = 'move' | 'start' | 'end'

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
  dateWindow = null,
  onDateWindowChange,
  minMonth,
  maxMonth,
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

  /** Yellow sliding-window geometry over visible in-range rail rows. */
  const rangeOverlay = useMemo(() => {
    if (mode !== 'history' || !dateWindow) return null
    const start = toMonthKey(dateWindow.start)
    const end = toMonthKey(dateWindow.end)
    const visible = layout.items.filter((item) => {
      if (hiddenYears.has(item.date.slice(0, 4))) return false
      const ym = item.ym
      return ym >= start && ym <= end
    })
    if (visible.length === 0) return null
    const top = Math.max(0, visible[0].centerY - ITEM_HALF - BAND_PAD)
    const bottom =
      visible[visible.length - 1].centerY + ITEM_HALF + BAND_PAD
    return { top, height: Math.max(20, bottom - top) }
  }, [mode, dateWindow, layout.items, hiddenYears])

  const dragRef = useRef<{
    kind: DragKind
    originY: number
    origin: DateWindow
    lastDelta: number
  } | null>(null)

  const boundsReady =
    minMonth != null &&
    maxMonth != null &&
    dateWindow != null &&
    onDateWindowChange != null

  const onRangePointerDown = useCallback(
    (kind: DragKind, e: React.PointerEvent<HTMLElement>) => {
      if (!boundsReady || !dateWindow || !minMonth || !maxMonth) return
      e.preventDefault()
      e.stopPropagation()
      const target = e.currentTarget
      target.setPointerCapture(e.pointerId)
      dragRef.current = {
        kind,
        originY: e.clientY,
        origin: { ...dateWindow },
        lastDelta: 0,
      }
    },
    [boundsReady, dateWindow, minMonth, maxMonth],
  )

  const onRangePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const drag = dragRef.current
      if (!drag || !onDateWindowChange || !minMonth || !maxMonth) return
      const pxPerMonth = Math.max(14, rangeOverlay?.height
        ? rangeOverlay.height /
            Math.max(
              1,
              monthToIndex(toMonthKey(drag.origin.end)) -
                monthToIndex(toMonthKey(drag.origin.start)) +
                1,
            )
        : 22)
      const delta = Math.round((e.clientY - drag.originY) / pxPerMonth)
      if (delta === drag.lastDelta) return
      drag.lastDelta = delta
      if (drag.kind === 'move') {
        onDateWindowChange(
          shiftDateWindow(drag.origin, delta, minMonth, maxMonth),
        )
        return
      }
      if (drag.kind === 'start') {
        const nextStart = clampMonth(
          shiftMonth(toMonthKey(drag.origin.start), delta),
          minMonth,
          toMonthKey(drag.origin.end),
        )
        onDateWindowChange(
          clampDateWindow(
            { start: nextStart, end: toMonthKey(drag.origin.end) },
            minMonth,
            maxMonth,
          ),
        )
        return
      }
      const nextEnd = clampMonth(
        shiftMonth(toMonthKey(drag.origin.end), delta),
        toMonthKey(drag.origin.start),
        maxMonth,
      )
      onDateWindowChange(
        clampDateWindow(
          { start: toMonthKey(drag.origin.start), end: nextEnd },
          minMonth,
          maxMonth,
        ),
      )
    },
    [onDateWindowChange, minMonth, maxMonth, rangeOverlay],
  )

  const onRangePointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!dragRef.current) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
    dragRef.current = null
  }, [])

  const showSlider =
    mode === 'history' &&
    onDateWindowChange != null &&
    dateWindow != null &&
    minMonth != null &&
    maxMonth != null

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
            title="既往：用月份滑窗选择起始月至截止月"
            onClick={() => onModeChange?.('history')}
          >
            既往
          </button>
          <button
            type="button"
            className={`timeline-rail__mode-btn${mode === 'month' ? ' is-active' : ''}`}
            aria-pressed={mode === 'month'}
            title="当月：查看所有年份中与当前月份相同的记录"
            onClick={() => onModeChange?.('month')}
          >
            当月
          </button>
        </div>
        {showSlider ? (
          <TimeWindow
            value={dateWindow}
            onChange={onDateWindowChange}
            minMonth={minMonth}
            maxMonth={maxMonth}
          />
        ) : (
          <div className="timeline-rail__head-fill" aria-hidden />
        )}
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

        {rangeOverlay && boundsReady ? (
          <div
            className="timeline-rail__range-window"
            style={{ top: rangeOverlay.top, height: rangeOverlay.height }}
            role="group"
            aria-label="月份滑动窗口"
            onPointerDown={(e) => {
              if (e.target !== e.currentTarget) return
              onRangePointerDown('move', e)
            }}
            onPointerMove={onRangePointerMove}
            onPointerUp={onRangePointerUp}
            onPointerCancel={onRangePointerUp}
          >
            <button
              type="button"
              className="timeline-rail__range-grip"
              aria-label="拖动平移月份窗"
              title="拖动平移选中月份范围"
              onPointerDown={(e) => onRangePointerDown('move', e)}
              onPointerMove={onRangePointerMove}
              onPointerUp={onRangePointerUp}
              onPointerCancel={onRangePointerUp}
              onKeyDown={(e) => {
                if (!dateWindow || !minMonth || !maxMonth || !onDateWindowChange)
                  return
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                  e.preventDefault()
                  onDateWindowChange(
                    shiftDateWindow(dateWindow, 1, minMonth, maxMonth),
                  )
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                  e.preventDefault()
                  onDateWindowChange(
                    shiftDateWindow(dateWindow, -1, minMonth, maxMonth),
                  )
                }
              }}
            />
            <button
              type="button"
              className="timeline-rail__range-edge timeline-rail__range-edge--start"
              aria-label="拖动调整起始月"
              title="拖动调整起始月"
              onPointerDown={(e) => onRangePointerDown('start', e)}
              onPointerMove={onRangePointerMove}
              onPointerUp={onRangePointerUp}
              onPointerCancel={onRangePointerUp}
            />
            <button
              type="button"
              className="timeline-rail__range-edge timeline-rail__range-edge--end"
              aria-label="拖动调整截止月"
              title="拖动调整截止月"
              onPointerDown={(e) => onRangePointerDown('end', e)}
              onPointerMove={onRangePointerMove}
              onPointerUp={onRangePointerUp}
              onPointerCancel={onRangePointerUp}
            />
          </div>
        ) : null}

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
