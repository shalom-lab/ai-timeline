import assert from 'node:assert/strict'
import { isCurrentCalendarMonth } from '../src/lib/calendar'
const october = new Date(2026, 9, 28)
assert.equal(isCurrentCalendarMonth('2023-10-12', october), true)
assert.equal(isCurrentCalendarMonth('2026-10', october), true)
assert.equal(isCurrentCalendarMonth('2025-09-30', october), false)
assert.equal(isCurrentCalendarMonth('2026-11', october), false)
assert.equal(isCurrentCalendarMonth('2022-01-01', new Date(2027, 0, 1)), true)
console.log('OK: calendar month includes matching months in every year')

const {
  calendarWindow,
  inDateWindow,
  shiftMonth,
  shiftDateWindow,
  enumerateMonths,
  clampDateWindow,
} = await import('../src/lib/calendar')
const six = calendarWindow(6, october)
assert.equal(six.start, '2026-05')
assert.equal(six.end, '2026-10')
assert.equal(inDateWindow('2026-05-01', six), true)
assert.equal(inDateWindow('2026-10-28', six), true)
assert.equal(inDateWindow('2026-04-30', six), false)
assert.equal(inDateWindow('2026-10-29', six), true) // month-granularity: whole Oct
assert.equal(inDateWindow('2026-10', six), true)
assert.equal(calendarWindow(6, new Date(2026, 0, 31)).start, '2025-08')
assert.equal(inDateWindow('2024-02-29', { start: '2024-02', end: '2024-02' }), true)
assert.equal(inDateWindow('2024-02', { start: '2024-02', end: '2024-03' }), true)
assert.equal(inDateWindow('2022-11-30', null), true)
assert.equal(shiftMonth('2026-01', -1), '2025-12')
assert.equal(shiftMonth('2025-12', 1), '2026-01')
assert.deepEqual(enumerateMonths('2026-09', '2026-11'), [
  '2026-09',
  '2026-10',
  '2026-11',
])
assert.deepEqual(
  shiftDateWindow({ start: '2026-05', end: '2026-07' }, 2, '2026-01', '2026-12'),
  { start: '2026-07', end: '2026-09' },
)
assert.deepEqual(
  clampDateWindow({ start: '2026-11', end: '2026-08' }, '2026-01', '2026-12'),
  { start: '2026-08', end: '2026-11' },
)
console.log('OK: inclusive month windows, shift/clamp, year boundary and leap day')
