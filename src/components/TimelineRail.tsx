import type { Company, TimelineEvent } from '../types/timeline'
import { companyColor } from '../lib/company'

type Props = {
  events: TimelineEvent[]
  companies: Company[]
  selectedId: string | null
  onSelect: (id: string) => void
}

type YearBlock = {
  year: string
  items: { event: TimelineEvent; monthLabel: string }[]
}

function buildBlocks(events: TimelineEvent[]): YearBlock[] {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date))
  const years = new Map<string, YearBlock>()
  for (const e of sorted) {
    const year = e.date.slice(0, 4)
    const month = e.date.slice(5, 7)
    let block = years.get(year)
    if (!block) {
      block = { year, items: [] }
      years.set(year, block)
    }
    block.items.push({
      event: e,
      monthLabel: `${month}月`,
    })
  }
  return [...years.values()]
}

export default function TimelineRail({
  events,
  companies,
  selectedId,
  onSelect,
}: Props) {
  const blocks = buildBlocks(events)

  return (
    <nav className="timeline-rail" aria-label="时间轴">
      <div className="timeline-rail__line" aria-hidden />
      {blocks.map((block) => (
        <div key={block.year} className="timeline-rail__year">
          <div className="timeline-rail__year-label">{block.year}</div>
          <ul>
            {block.items.map(({ event, monthLabel }) => {
              const { color } = companyColor(companies, event.company)
              const selected = event.id === selectedId
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    className={`timeline-rail__item${selected ? ' is-selected' : ''}`}
                    onClick={() => onSelect(event.id)}
                    title={`${event.date} · ${event.title}`}
                  >
                    <span
                      className="timeline-rail__dot"
                      style={{ background: color }}
                    />
                    <span className="timeline-rail__date">
                      <span className="timeline-rail__month">{monthLabel}</span>
                      <span className="timeline-rail__day">{event.date}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
