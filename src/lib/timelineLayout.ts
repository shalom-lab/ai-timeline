import type { TimelineEvent } from '../types/timeline'

/** Year marker row height inside the shared canvas (rail + columns). */
export const YEAR_MARKER_H = 24
/**
 * Minimum gap between consecutive *distinct-date* centers.
 * ~card height + small breath with translateY(-50%); denser than the old 148.
 */
export const MIN_CENTER_GAP = 116
/**
 * Soft cap for large calendar spans — longer Δdays get a bit more room,
 * but never raw linear voids. Kept close to MIN so long gaps stay compact.
 */
export const MAX_CENTER_GAP = 140
/**
 * tanh scale (days).
 * gap(Δ) = MIN + (MAX - MIN) * tanh(Δ / GAP_TAU)
 * Larger TAU = week/month deltas stay nearer MIN before asymptoting.
 */
export const GAP_TAU = 48
export const CANVAS_PAD_TOP = 6
export const CANVAS_PAD_BOTTOM = 24
/** Space from year marker bottom to first date center in that year. */
export const AFTER_YEAR_MARKER = 44

/** Minimal input for shared date→Y layout (events or frontier month proxies). */
export type LayoutSource = {
  id: string
  /** YYYY-MM-DD */
  date: string
}

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

function utcDay(iso: string): number {
  const y = Number(iso.slice(0, 4))
  const m = Number(iso.slice(5, 7))
  const d = Number(iso.slice(8, 10))
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000)
}

/**
 * Calendar day-delta → vertical gap (px).
 *
 *   gap(Δ) = MIN_CENTER_GAP + (MAX_CENTER_GAP - MIN_CENTER_GAP) * tanh(Δ / GAP_TAU)
 *
 * Short gaps stay near MIN (dense months readable); long gaps asymptote to MAX.
 */
export function gapForDeltaDays(deltaDays: number): number {
  const d = Math.max(0, deltaDays)
  return MIN_CENTER_GAP + (MAX_CENTER_GAP - MIN_CENTER_GAP) * Math.tanh(d / GAP_TAU)
}

/** Last calendar day of YYYY-MM as YYYY-MM-DD (UTC month-end). */
export function monthEndDate(ym: string): string {
  const y = Number(ym.slice(0, 4))
  const m = Number(ym.slice(5, 7))
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return `${ym}-${String(last).padStart(2, '0')}`
}

/** Stable layout id for a frontier month card / rail marker. */
export function frontierLayoutId(month: string): string {
  return `frontier:${month}`
}

/** Build LayoutSource rows from frontier YYYY-MM keys (month-end dates). */
export function frontierMonthsToLayoutSources(
  months: ReadonlyArray<{ month: string }>,
): LayoutSource[] {
  return months.map((m) => ({
    id: frontierLayoutId(m.month),
    date: monthEndDate(m.month),
  }))
}

/**
 * Shared date→Y for TimelineRail dots and EventCard / FrontierColumn centers.
 * Same calendar date → same centerY; order chronological; gaps soft-compressed.
 *
 * Accepts full TimelineEvent[] or lighter {id,date} proxies (frontier months).
 */
export function buildTimelineLayout(
  events: ReadonlyArray<LayoutSource | TimelineEvent>,
): TimelineLayout {
  const sorted = [...events].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  )
  if (sorted.length === 0) {
    return {
      centerY: {},
      height: CANVAS_PAD_TOP + CANVAS_PAD_BOTTOM,
      items: [],
      years: [],
    }
  }

  const dateOrder: string[] = []
  const byDate = new Map<string, LayoutSource[]>()
  for (const e of sorted) {
    let list = byDate.get(e.date)
    if (!list) {
      list = []
      byDate.set(e.date, list)
      dateOrder.push(e.date)
    }
    list.push(e)
  }

  const yearCounts = new Map<string, number>()
  for (const d of dateOrder) {
    const y = d.slice(0, 4)
    yearCounts.set(y, (yearCounts.get(y) ?? 0) + byDate.get(d)!.length)
  }

  const centerY: Record<string, number> = {}
  const items: LayoutItem[] = []
  const years: LayoutYear[] = []

  let prevCenter = -Infinity
  let prevDay = 0
  let prevYear = ''

  for (const date of dateOrder) {
    const year = date.slice(0, 4)
    const day = utcDay(date)
    let nextY: number

    if (year !== prevYear) {
      // Place year marker below previous content (or at pad for the first year)
      const markerTop =
        prevCenter === -Infinity
          ? CANVAS_PAD_TOP
          : prevCenter + gapForDeltaDays(Math.max(1, day - prevDay)) * 0.35
      years.push({
        year,
        top: markerTop,
        count: yearCounts.get(year) ?? 0,
      })
      // First date of this year sits under the marker
      const underMarker = markerTop + YEAR_MARKER_H + AFTER_YEAR_MARKER
      const fromPrev =
        prevCenter === -Infinity
          ? underMarker
          : prevCenter + gapForDeltaDays(day - prevDay)
      // Prefer calendar gap from previous date, but never climb back into the marker
      nextY = Math.max(underMarker, fromPrev)
      prevYear = year
    } else {
      nextY = prevCenter + gapForDeltaDays(day - prevDay)
    }

    for (const e of byDate.get(date)!) {
      centerY[e.id] = nextY
      items.push({
        id: e.id,
        date: e.date,
        centerY: nextY,
        ym: e.date.slice(0, 7),
      })
    }
    prevCenter = nextY
    prevDay = day
  }

  return {
    centerY,
    height: prevCenter + CANVAS_PAD_BOTTOM,
    items,
    years,
  }
}
