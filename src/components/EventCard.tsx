import type { CSSProperties } from 'react'
import type { Company, TimelineEvent } from '../types/timeline'
import { EVENT_TYPE_COLOR, EVENT_TYPE_LABEL_ZH } from '../lib/labels'
import { companyColor } from '../lib/company'

type Props = {
  event: TimelineEvent
  companies: Company[]
  selected: boolean
  onSelect: (id: string) => void
}

export default function EventCard({
  event,
  companies,
  selected,
  onSelect,
}: Props) {
  const { color, soft } = companyColor(companies, event.company)
  const et = EVENT_TYPE_COLOR[event.eventType]
  const sourceUrl = event.sources[0]?.url

  return (
    <article
      className={`event-card${selected ? ' is-selected' : ''}`}
      style={
        {
          ['--co' as string]: color,
          ['--co-soft' as string]: soft,
        } as CSSProperties
      }
      onClick={() => onSelect(event.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(event.id)
        }
      }}
    >
      <div className="event-card__tint" aria-hidden />
      <header className="event-card__meta">
        <time dateTime={event.date}>{event.date}</time>
        <span className="event-card__company" title={event.company}>
          <i style={{ background: color }} />
          {event.company}
        </span>
      </header>
      <h3 className="event-card__title">{event.title}</h3>
      <p className="event-card__summary">{event.summary}</p>
      <footer className="event-card__footer">
        <span
          className="event-type-pill"
          style={{ background: et.bg, color: et.fg }}
        >
          {EVENT_TYPE_LABEL_ZH[event.eventType]}
        </span>
        {sourceUrl ? (
          <a
            className="event-card__link"
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="打开来源"
            onClick={(e) => e.stopPropagation()}
            aria-label="打开来源链接"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        ) : null}
      </footer>
    </article>
  )
}
