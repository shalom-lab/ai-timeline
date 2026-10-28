import { useMemo, useState, useCallback } from 'react'
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
  /** YYYY-MM */
  ym: string
}

type MonthBand = {
  ym: string
  top: number
  height: number
  /** Alternating tone index within the year (adjacent months differ) */
  tone: number
}

type YearBlock = {
  year: string
  height: number
  items: Placed[]
  monthBands: MonthBand[]
}

const MIN_GAP = 22
const YEAR_PAD_TOP = 8
const YEAR_PAD_BOTTOM = 10
/** Pixels allocated per day of year span (clamped). */
const PX_PER_DAY = 0.55
const MIN_YEAR_BODY = 72
const MAX_YEAR_BODY = 520
/** Half of item hit area — bands hug the date rows */
const ITEM_HALF = 9
const BAND_PAD = 3

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

function ymOf(iso: string): string {
  return iso.slice(0, 7) // YYYY-MM
}

/** Soft month background bands: same YYYY-MM share one band; adjacent months alternate. */
function buildMonthBands(items: Placed[]): MonthBand[] {
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
    const top = Math.max(0, first.top - ITEM_HALF - BAND_PAD)
    const bottom = last.top + ITEM_HALF + BAND_PAD
    bands.push({
      ym,
      top,
      height: Math.max(18, bottom - top),
      tone: tone % 2,
    })
    tone += 1
    i = j
  }
  return bands
}

/**
 * Place events by calendar day within the year, then push apart so labels
 * keep a minimum vertical gap (dense clusters expand the track).
 */
function placeYear(year: string, events: TimelineEvent[]): YearBlock {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length === 0) {
    return { year, height: MIN_YEAR_BODY, items: [], monthBands: [] }
  }

  const days = sorted.map((e) => dayOfYear(e.date))
  const dMin = Math.min(...days)
  const dMax = Math.max(...days)
  const span = Math.max(1, dMax - dMin)

  const spanHeight = Math.min(
    MAX_YEAR_BODY,
    Math.max(MIN_YEAR_BODY, span * PX_PER_DAY + sorted.length * 4),
  )
  const clusterFloor = (sorted.length - 1) * MIN_GAP
  const bodyHeight = Math.max(spanHeight, clusterFloor)

  const ideal = days.map((d) =>
    dMin === dMax ? bodyHeight / 2 : ((d - dMin) / span) * bodyHeight,
  )

  const tops: number[] = []
  for (let i = 0; i < ideal.length; i++) {
    const prev = i === 0 ? -MIN_GAP : tops[i - 1]
    tops.push(Math.max(ideal[i], prev + MIN_GAP))
  }

  const last = tops[tops.length - 1]
  let track = bodyHeight
  if (last > bodyHeight && last > 0) {
    track = last
  }

  const items: Placed[] = sorted.map((event, i) => ({
    event,
    top: YEAR_PAD_TOP + tops[i],
    label: mmdd(event.date),
    ym: ymOf(event.date),
  }))

  return {
    year,
    height: YEAR_PAD_TOP + track + YEAR_PAD_BOTTOM,
    items,
    monthBands: buildMonthBands(items),
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
  const el = document.querySelector<HTMLElement>(
    `[data-event-id="${CSS.escape(id)}"]`,
  )
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
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggleYear = useCallback((year: string) => {
    setCollapsed((c) => ({ ...c, [year]: !c[year] }))
  }, [])

  return (
    <nav className="timeline-rail" aria-label="时间轴（按年折叠，按日历日比例）">
      {blocks.map((block) => {
        const isCollapsed = !!collapsed[block.year]
        return (
          <div
            key={block.year}
            className={`timeline-rail__year${isCollapsed ? ' is-collapsed' : ''}`}
          >
            <button
              type="button"
              className="timeline-rail__year-label"
              aria-expanded={!isCollapsed}
              title={isCollapsed ? `展开 ${block.year}` : `折叠 ${block.year}`}
              onClick={() => toggleYear(block.year)}
            >
              <span className="timeline-rail__year-chevron" aria-hidden>
                {isCollapsed ? '▸' : '▾'}
              </span>
              <span className="timeline-rail__year-text">{block.year}</span>
              <span className="timeline-rail__year-count">{block.items.length}</span>
            </button>
            {!isCollapsed ? (
              <div
                className="timeline-rail__track"
                style={{ height: block.height }}
              >
                {block.monthBands.map((band) => (
                  <div
                    key={band.ym}
                    className={`timeline-rail__month-bg timeline-rail__month-bg--${band.tone}`}
                    style={{ top: band.top, height: band.height }}
                    data-month={band.ym}
                    aria-hidden
                  />
                ))}
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
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}
