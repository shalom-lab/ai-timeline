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

/**
 * Re-pack rail after year collapse: skip hidden-year event rows so year pills
 * sit tightly adjacent (almost flush). Expanded years keep normal item steps.
 */
export const RAIL_COLLAPSED_YEAR_GAP = 2

export function compactTimelineLayout(
  layout: TimelineLayout,
  hiddenYears: ReadonlySet<string>,
): TimelineLayout {
  if (hiddenYears.size === 0) return layout

  const itemsByYear = new Map<string, LayoutItem[]>()
  for (const item of layout.items) {
    const y = item.date.slice(0, 4)
    let list = itemsByYear.get(y)
    if (!list) {
      list = []
      itemsByYear.set(y, list)
    }
    list.push(item)
  }

  const centerY: Record<string, number> = {}
  const items: LayoutItem[] = []
  const years: LayoutYear[] = []

  let cursor = RAIL_PAD_TOP
  let prevYear = ''
  let prevCollapsed = false

  for (const y of layout.years) {
    const collapsed = hiddenYears.has(y.year)
    if (prevYear !== '') {
      cursor += prevCollapsed || collapsed ? RAIL_COLLAPSED_YEAR_GAP : RAIL_YEAR_GAP
    }
    years.push({
      year: y.year,
      top: cursor,
      count: y.count,
    })
    cursor += YEAR_MARKER_H
    prevYear = y.year
    prevCollapsed = collapsed

    if (collapsed) continue

    // Preserve same-date stacking: group consecutive same centerY / date from original order
    const yearItems = itemsByYear.get(y.year) ?? []
    let i = 0
    while (i < yearItems.length) {
      const date = yearItems[i].date
      let j = i + 1
      while (j < yearItems.length && yearItems[j].date === date) j++
      const nextY = cursor + RAIL_ITEM_STEP / 2
      for (let k = i; k < j; k++) {
        const src = yearItems[k]
        centerY[src.id] = nextY
        items.push({
          id: src.id,
          date: src.date,
          centerY: nextY,
          ym: src.ym,
        })
      }
      cursor += RAIL_ITEM_STEP
      i = j
    }
  }

  return {
    centerY,
    height: cursor + RAIL_PAD_BOTTOM,
    items,
    years,
  }
}
