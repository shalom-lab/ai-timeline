import { useMemo } from 'react'
import type { Company, TimelineEvent } from '../types/timeline'
import { companyColor } from '../lib/company'

type Props = {
  events: TimelineEvent[]
  companies: Company[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

type Placed = {
  event: TimelineEvent
  /** CSS top within the year track, px */
  top: number
  label: string
}

type YearBlock = {
  year: string
  height: number
  items: Placed[]
}

const MIN_GAP = 22
const YEAR_PAD_TOP = 8
const YEAR_PAD_BOTTOM = 10
/** Pixels allocated per day of year span (clamped). */
const PX_PER_DAY = 0.55
const MIN_YEAR_BODY = 72
const MAX_YEAR_BODY = 520

function dayOfYear(iso: string): number {
  const y = Number(iso.slice(0, 4))
  const m = Number(iso.slice(5, 7))
  const d = Number(iso.slice(8, 10))
  const start = Date.UTC(y, 0, 0)
  const cur = Date.UTC(y, m - 1, d)
  return Math.round((cur - start) / 86_400_000)
}

function mmdd(iso: string): string {
  return iso.slice(5) // MM-DD
}

/**
 * Place events by calendar day within the year, then push apart so labels
 * keep a minimum vertical gap (dense clusters expand the track).
 */
function placeYear(year: string, events: TimelineEvent[]): YearBlock {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length === 0) {
    return { year, height: MIN_YEAR_BODY, items: [] }
  }

  const days = sorted.map((e) => dayOfYear(e.date))
  const dMin = Math.min(...days)
  const dMax = Math.max(...days)
  const span = Math.max(1, dMax - dMin)

  // Ideal body height from calendar span; grow if many events need min gaps.
  const spanHeight = Math.min(
    MAX_YEAR_BODY,
    Math.max(MIN_YEAR_BODY, span * PX_PER_DAY + sorted.length * 4),
  )
  const clusterFloor = (sorted.length - 1) * MIN_GAP
  const bodyHeight = Math.max(spanHeight, clusterFloor)

  const ideal = days.map((d) =>
    dMin === dMax ? bodyHeight / 2 : ((d - dMin) / span) * bodyHeight,
  )

  // Forward pass: enforce minimum gap (push down).
  const tops: number[] = []
  for (let i = 0; i < ideal.length; i++) {
    const prev = i === 0 ? -MIN_GAP : tops[i - 1]
    tops.push(Math.max(ideal[i], prev + MIN_GAP))
  }

  // If we overflowed, scale back into [0, bodyHeight] while keeping order.
  const last = tops[tops.length - 1]
  let track = bodyHeight
  if (last > bodyHeight && last > 0) {
    track = last
  }

  const items: Placed[] = sorted.map((event, i) => ({
    event,
    top: YEAR_PAD_TOP + tops[i],
    label: mmdd(event.date),
  }))

  return {
    year,
    height: YEAR_PAD_TOP + track + YEAR_PAD_BOTTOM,
    items,
  }
}

function buildBlocks(events: TimelineEvent[]): YearBlock[] {
  const byYear = new Map<string, TimelineEvent[]>()
  for (const e of [...events].sort((a, b) => a.date.localeCompare(b.date))) {
    const y = e.date.slice(0, 4)
    let list = byYear.get(y)
    if (!list) {
      list = []
      byYear.set(y, list)
    }
    list.push(e)
  }
  return [...byYear.entries()].map(([year, list]) => placeYear(year, list))
}

function focusCard(id: string) {
  const el = document.querySelector<HTMLElement>(`[data-event-id="${CSS.escape(id)}"]`)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
}

export default function TimelineRail({
  events,
  companies,
  selectedId,
  onSelect,
}: Props) {
  const blocks = useMemo(() => buildBlocks(events), [events])

  return (
    <nav className="timeline-rail" aria-label="时间轴（按日历日比例）">
      {blocks.map((block) => (
        <div key={block.year} className="timeline-rail__year">
          <div className="timeline-rail__year-label">{block.year}</div>
          <div
            className="timeline-rail__track"
            style={{ height: block.height }}
          >
            <div className="timeline-rail__line" aria-hidden />
            {block.items.map(({ event, top, label }) => {
              const { color } = companyColor(companies, event.company)
              const selected = event.id === selectedId
              return (
                <button
                  key={event.id}
                  type="button"
                  className={`timeline-rail__item${selected ? ' is-selected' : ''}`}
                  style={{ top }}
                  title={`${event.date} · ${event.title}`}
                  aria-label={`${event.date} ${event.title}`}
                  onClick={() => {
                    onSelect(event.id)
                    requestAnimationFrame(() => focusCard(event.id))
                  }}
                >
                  <span
                    className="timeline-rail__dot"
                    style={{ background: color }}
                  />
                  <span className="timeline-rail__md">{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
