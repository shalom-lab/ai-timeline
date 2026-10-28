import { useRef, type CSSProperties } from 'react'
import type { Company, TimelineEvent } from '../types/timeline'
import { EVENT_TYPE_COLOR, EVENT_TYPE_LABEL_ZH, CATEGORY_THEME } from '../lib/labels'
import { companyColor } from '../lib/company'
import { CompanyAvatar, CardMainIcon } from '../lib/icons'
import DetailPopover from './DetailPopover'

type Props = {
  event: TimelineEvent
  companies: Company[]
  selected: boolean
  onSelect: (id: string | null) => void
  /** After focus date while bump line is shown — 还没发生 */
  isFuture?: boolean
}

export default function EventCard({
  event,
  companies,
  selected,
  onSelect,
  isFuture = false,
}: Props) {
  const cardRef = useRef<HTMLElement>(null)
  const { color, soft } = companyColor(companies, event.company)
  const et = EVENT_TYPE_COLOR[event.eventType]
  const sourceUrl = event.sources[0]?.url
  const accent = CATEGORY_THEME[event.category].accent

  return (
    <article
      ref={cardRef}
      className={`event-card${selected ? ' is-selected' : ''}${isFuture ? ' is-future' : ''}`}
      data-event-id={event.id}
      style={
        {
          ['--co' as string]: color,
          ['--co-soft' as string]: soft,
          background: soft,
        } as CSSProperties
      }
      onClick={() => onSelect(selected ? null : event.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(selected ? null : event.id)
        }
      }}
      aria-expanded={selected}
    >
      <header className="event-card__meta">
        <time dateTime={event.date}>{event.date}</time>
        <span className="event-card__company" title={event.company}>
          <CompanyAvatar companies={companies} companyName={event.company} size={14} />
          {event.company}
        </span>
      </header>
      <div className="event-card__main">
        <CardMainIcon event={event} companies={companies} accent={accent} />
        <div className="event-card__copy">
          <h3 className="event-card__title">{event.title}</h3>
          <p className="event-card__summary">{event.summary}</p>
        </div>
      </div>
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

      {selected ? (
        <DetailPopover
          event={event}
          companies={companies}
          anchorRef={cardRef}
          onClose={() => onSelect(null)}
        />
      ) : null}
    </article>
  )
}
