import type { TimelineEvent } from '../types/timeline'

/** Year marker row height inside the shared canvas (rail + columns). */
export const YEAR_MARKER_H = 26
/** Minimum gap between consecutive *distinct-date* centers (card-friendly). */
export const MIN_CENTER_GAP = 156
/** Extra pixels per calendar day of span (large gaps stretch). */
export const PX_PER_DAY = 0.42
export const CANVAS_PAD_TOP = 16
export const CANVAS_PAD_BOTTOM = 40

export type LayoutItem = {
  id: string
  date: string
  /** Y of event center within the shared canvas */
  centerY: number
  ym: string
}

export type LayoutYear = {
  year: string
  /** Top of the year marker row */
  top: number
  count: number
}

export type TimelineLayout = {
  centerY: Record<string, number>
  height: number
  items: LayoutItem[]
  years: LayoutYear[]
}

function dayOfYear(iso: string): number {
  const y = Number(iso.slice(0, 4))
  const m = Number(iso.slice(5, 7))
  const d = Number(iso.slice(8, 10))
  const start = Date.UTC(y, 0, 0)
  const cur = Date.UTC(y, m - 1, d)
  return Math.round((cur - start) / 86_400_000)
}

/**
 * Shared date→Y mapping for TimelineRail dots and EventCard vertical centers.
 * Same calendar date → same centerY (one shared row across columns).
 * Spacing between distinct dates is time-proportional with a readability floor.
 */
export function buildTimelineLayout(events: TimelineEvent[]): TimelineLayout {
  const sorted = [...events].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  )
  if (sorted.length === 0) {
    return { centerY: {}, height: CANVAS_PAD_TOP + CANVAS_PAD_BOTTOM, items: [], years: [] }
  }

  // Unique dates in order (same-date events share one slot)
  const dateOrder: string[] = []
  const byDate = new Map<string, TimelineEvent[]>()
  for (const e of sorted) {
    let list = byDate.get(e.date)
    if (!list) {
      list = []
      byDate.set(e.date, list)
      dateOrder.push(e.date)
    }
    list.push(e)
  }

  const yearsPresent: string[] = []
  for (const d of dateOrder) {
    const y = d.slice(0, 4)
    if (yearsPresent[yearsPresent.length - 1] !== y) yearsPresent.push(y)
  }

  // Ideal local offset per date within its year, then stitch with year markers + min gap
  const centerY: Record<string, number> = {}
  const items: LayoutItem[] = []
  const years: LayoutYear[] = []
  let cursor = CANVAS_PAD_TOP
  let prevCenter = -Infinity
  let prevDate = ''

  for (const year of yearsPresent) {
    const datesInYear = dateOrder.filter((d) => d.startsWith(year))
    const count = datesInYear.reduce((n, d) => n + (byDate.get(d)?.length ?? 0), 0)
    years.push({ year, top: cursor, count })
    cursor += YEAR_MARKER_H

    const days = datesInYear.map((d) => dayOfYear(d))
    const dMin = Math.min(...days)
    const dMax = Math.max(...days)
    const span = Math.max(1, dMax - dMin)
    const spanHeight = Math.max(
      (datesInYear.length - 1) * MIN_CENTER_GAP,
      span * PX_PER_DAY,
    )

    for (let i = 0; i < datesInYear.length; i++) {
      const date = datesInYear[i]
      const idealLocal =
        dMin === dMax ? 0 : ((days[i] - dMin) / span) * spanHeight
      let y = cursor + idealLocal
      if (prevDate && date !== prevDate) {
        y = Math.max(y, prevCenter + MIN_CENTER_GAP)
      } else if (!prevDate) {
        y = Math.max(y, cursor + MIN_CENTER_GAP * 0.4)
      } else {
        // same date as previous slot — should not happen across loop
        y = prevCenter
      }
      y = Math.max(y, cursor + MIN_CENTER_GAP * 0.35)

      for (const e of byDate.get(date)!) {
        centerY[e.id] = y
        items.push({
          id: e.id,
          date: e.date,
          centerY: y,
          ym: e.date.slice(0, 7),
        })
      }
      prevCenter = y
      prevDate = date
    }
    cursor = Math.max(cursor, prevCenter + MIN_CENTER_GAP * 0.45)
  }

  const height = Math.max(prevCenter + CANVAS_PAD_BOTTOM, cursor + CANVAS_PAD_BOTTOM)
  return { centerY, height, items, years }
}
