import type { TimelineEvent } from '../types/timeline'

/** Year marker row height inside the shared canvas (rail + columns). */
export const YEAR_MARKER_H = 26
/** Minimum gap between consecutive event centers (card-friendly). */
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
 * Same date → same centerY across the board. Spacing is time-proportional with
 * a readability floor so dense clusters (and tall cards) do not overlap.
 */
export function buildTimelineLayout(events: TimelineEvent[]): TimelineLayout {
  const sorted = [...events].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  )
  if (sorted.length === 0) {
    return { centerY: {}, height: CANVAS_PAD_TOP + CANVAS_PAD_BOTTOM, items: [], years: [] }
  }

  // Per-year day span → ideal local offsets, then stitch years with markers.
  const byYear = new Map<string, TimelineEvent[]>()
  for (const e of sorted) {
    const y = e.date.slice(0, 4)
    let list = byYear.get(y)
    if (!list) {
      list = []
      byYear.set(y, list)
    }
    list.push(e)
  }

  const centerY: Record<string, number> = {}
  const items: LayoutItem[] = []
  const years: LayoutYear[] = []
  let cursor = CANVAS_PAD_TOP
  let prevCenter = -Infinity

  for (const [year, list] of byYear) {
    years.push({ year, top: cursor, count: list.length })
    cursor += YEAR_MARKER_H

    const days = list.map((e) => dayOfYear(e.date))
    const dMin = Math.min(...days)
    const dMax = Math.max(...days)
    const span = Math.max(1, dMax - dMin)
    const spanHeight = Math.max(
      (list.length - 1) * MIN_CENTER_GAP,
      span * PX_PER_DAY,
    )

    for (let i = 0; i < list.length; i++) {
      const e = list[i]
      const idealLocal =
        dMin === dMax ? 0 : ((days[i] - dMin) / span) * spanHeight
      // First event in year sits just below the year marker
      let y = cursor + idealLocal
      // Global min-gap vs previous event (including across years)
      y = Math.max(y, prevCenter + MIN_CENTER_GAP)
      // Also vs year marker bottom
      y = Math.max(y, cursor + MIN_CENTER_GAP * 0.35)

      centerY[e.id] = y
      items.push({
        id: e.id,
        date: e.date,
        centerY: y,
        ym: e.date.slice(0, 7),
      })
      prevCenter = y
    }
    // Advance cursor past last event in this year for next year marker
    cursor = Math.max(cursor, prevCenter + MIN_CENTER_GAP * 0.45)
  }

  const height = Math.max(prevCenter + CANVAS_PAD_BOTTOM, cursor + CANVAS_PAD_BOTTOM)
  return { centerY, height, items, years }
}
