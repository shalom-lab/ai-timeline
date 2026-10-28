/** Match the browser's calendar month across all recorded years. */
export function isCurrentCalendarMonth(date: string, now = new Date()): boolean {
  return Number(date.slice(5, 7)) === now.getMonth() + 1
}

/** Inclusive month window. `start` / `end` are YYYY-MM keys. */
export type DateWindow = { start: string; end: string }

export function localDate(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/** Current calendar month as YYYY-MM (browser local = UTC+8 on this app). */
export function localMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/** Normalize a date or month string to YYYY-MM. */
export function toMonthKey(dateOrMonth: string): string {
  return dateOrMonth.slice(0, 7)
}

/** Whole calendar months including the current month. */
export function calendarWindow(months: number, now = new Date()): DateWindow {
  const start = localMonth(new Date(now.getFullYear(), now.getMonth() - months + 1, 1))
  return { start, end: localMonth(now) }
}

export function inDateWindow(date: string, window: DateWindow | null): boolean {
  if (!window) return true
  const ym = toMonthKey(date)
  return ym >= toMonthKey(window.start) && ym <= toMonthKey(window.end)
}

/** Absolute month index (year * 12 + month0). */
export function monthToIndex(ym: string): number {
  const y = Number(ym.slice(0, 4))
  const m = Number(ym.slice(5, 7))
  return y * 12 + (m - 1)
}

export function indexToMonth(index: number): string {
  const y = Math.floor(index / 12)
  const m = (index % 12) + 1
  return `${y}-${String(m).padStart(2, '0')}`
}

export function shiftMonth(ym: string, delta: number): string {
  return indexToMonth(monthToIndex(ym) + delta)
}

export function clampMonth(ym: string, min: string, max: string): string {
  if (ym < min) return min
  if (ym > max) return max
  return ym
}

/** Inclusive list of YYYY-MM keys from start to end. */
export function enumerateMonths(startYm: string, endYm: string): string[] {
  const a = monthToIndex(toMonthKey(startYm))
  const b = monthToIndex(toMonthKey(endYm))
  if (b < a) return []
  const out: string[] = []
  for (let i = a; i <= b; i++) out.push(indexToMonth(i))
  return out
}

/** Clamp a window so start ≤ end and both sit inside [min, max]. */
export function clampDateWindow(
  window: DateWindow,
  min: string,
  max: string,
): DateWindow {
  let start = clampMonth(toMonthKey(window.start), min, max)
  let end = clampMonth(toMonthKey(window.end), min, max)
  if (start > end) {
    const mid = start
    start = end
    end = mid
  }
  return { start, end }
}

/** Shift both ends by `delta` months, preserving span, clamped to [min, max]. */
export function shiftDateWindow(
  window: DateWindow,
  delta: number,
  min: string,
  max: string,
): DateWindow {
  if (delta === 0) return clampDateWindow(window, min, max)
  const startIdx = monthToIndex(toMonthKey(window.start))
  const endIdx = monthToIndex(toMonthKey(window.end))
  const span = endIdx - startIdx
  const minIdx = monthToIndex(min)
  const maxIdx = monthToIndex(max)
  let nextStart = startIdx + delta
  let nextEnd = endIdx + delta
  if (nextStart < minIdx) {
    nextStart = minIdx
    nextEnd = nextStart + span
  }
  if (nextEnd > maxIdx) {
    nextEnd = maxIdx
    nextStart = nextEnd - span
  }
  if (nextStart < minIdx) nextStart = minIdx
  return { start: indexToMonth(nextStart), end: indexToMonth(nextEnd) }
}

/** Earliest YYYY-MM among event dates / frontier months, capped by `fallback`. */
export function earliestMonth(
  dates: Iterable<string>,
  fallback = localMonth(),
): string {
  let min = fallback
  for (const d of dates) {
    const ym = toMonthKey(d)
    if (ym < min) min = ym
  }
  return min
}
