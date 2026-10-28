/** Compact rail spacing (not calendar day→px). Cards use dense document flow. */

export const YEAR_MARKER_H = 26
/** Vertical step between consecutive rail date rows. */
export const RAIL_ITEM_STEP = 22
export const RAIL_PAD_TOP = 8
export const RAIL_PAD_BOTTOM = 16
/** Gap between last date of a year and the next year marker. */
export const RAIL_YEAR_GAP = 10

export type LayoutSource = {
  id: string
  /** YYYY-MM-DD */
  date: string
}

export type LayoutItem = {
  id: string
  date: string
  /** Y of rail row center */
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

/** Last calendar day of YYYY-MM as YYYY-MM-DD (UTC month-end). */
export function monthEndDate(ym: string): string {
  const y = Number(ym.slice(0, 4))
  const m = Number(ym.slice(5, 7))
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return `${ym}-${String(last).padStart(2, '0')}`
}

/** Stable id for a frontier month rail marker. */
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
 * Compact equal-step rail layout: year flush-left markers, dates indented below.
 * Same calendar date → same centerY; order chronological; NO day→pixel scale.
 */
export function buildTimelineLayout(
  events: ReadonlyArray<LayoutSource>,
): TimelineLayout {
  const sorted = [...events].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  )
  if (sorted.length === 0) {
    return {
      centerY: {},
      height: RAIL_PAD_TOP + RAIL_PAD_BOTTOM,
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

  let cursor = RAIL_PAD_TOP
  let prevYear = ''

  for (const date of dateOrder) {
    const year = date.slice(0, 4)
    if (year !== prevYear) {
      if (prevYear !== '') cursor += RAIL_YEAR_GAP
      years.push({
        year,
        top: cursor,
        count: yearCounts.get(year) ?? 0,
      })
      cursor += YEAR_MARKER_H
      prevYear = year
    }

    const nextY = cursor + RAIL_ITEM_STEP / 2
    for (const e of byDate.get(date)!) {
      centerY[e.id] = nextY
      items.push({
        id: e.id,
        date: e.date,
        centerY: nextY,
        ym: e.date.slice(0, 7),
      })
    }
    cursor += RAIL_ITEM_STEP
  }

  return {
    centerY,
    height: cursor + RAIL_PAD_BOTTOM,
    items,
    years,
  }
}

/** Equal-step vertical rank for multi-subcol category boards (not day→px). */
export const RANK_STEP = 128
export const RANK_PAD_TOP = 16
export const RANK_PAD_BOTTOM = 40

export type CategoryRankLayout = {
  /** Card center Y within the subcol cards canvas */
  centerY: Record<string, number>
  height: number
  orderedIds: string[]
}

/**
 * Chronological equal-step ranks within one top-level category.
 * Same calendar date → same centerY so company columns share succession rows.
 * Used only when the category has multiple visible subgroups.
 */
export function buildCategoryRankLayout(
  events: ReadonlyArray<LayoutSource>,
): CategoryRankLayout {
  const sorted = [...events].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  )
  if (sorted.length === 0) {
    return {
      centerY: {},
      height: RANK_PAD_TOP + RANK_PAD_BOTTOM,
      orderedIds: [],
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

  const centerY: Record<string, number> = {}
  const orderedIds: string[] = []
  let rank = 0
  for (const date of dateOrder) {
    const y = RANK_PAD_TOP + rank * RANK_STEP + RANK_STEP / 2
    for (const e of byDate.get(date)!) {
      centerY[e.id] = y
      orderedIds.push(e.id)
    }
    rank += 1
  }

  return {
    centerY,
    height: RANK_PAD_TOP + rank * RANK_STEP + RANK_PAD_BOTTOM,
    orderedIds,
  }
}
