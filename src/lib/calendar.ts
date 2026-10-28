/** Match the browser's calendar month across all recorded years. */
export function isCurrentCalendarMonth(date: string, now = new Date()): boolean {
  return Number(date.slice(5, 7)) === now.getMonth() + 1
}

export type DateWindow = { start: string; end: string; preset: number | 'custom' }
export function localDate(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
/** Whole calendar months including the current month, ending today. */
export function calendarWindow(months: number, now = new Date()): DateWindow {
  return { start: localDate(new Date(now.getFullYear(), now.getMonth() - months + 1, 1)), end: localDate(now), preset: months }
}
export function inDateWindow(date: string, window: DateWindow | null): boolean {
  if (!window) return true
  if (date.length === 7) return date >= window.start.slice(0, 7) && date <= window.end.slice(0, 7)
  return date >= window.start && date <= window.end
}
