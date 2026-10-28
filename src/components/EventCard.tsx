import { useRef, type CSSProperties, type KeyboardEvent } from 'react'
import type { Company, TimelineEvent } from '../types/timeline'
import { EVENT_TYPE_COLOR, EVENT_TYPE_LABEL_ZH } from '../lib/labels'
import { companyColor } from '../lib/company'
import { CompanyAvatar, ModelCapabilityIcons } from '../lib/icons'
import DetailPopover from './DetailPopover'

type Props = {
  event: TimelineEvent
  companies: Company[]
  /** Detail popover open (header click). */
  detailOpen: boolean
  /** Open detail — card top bar (date / company). */
  onOpenDetail: (id: string) => void
  /** Pin same-moment line + 灰白 — main body click (same as rail node). */
  onPinMoment: (id: string) => void
  onCloseDetail: () => void
  /** After focus date while bump line is shown — 还没发生 */
  isFuture?: boolean
}

export default function EventCard({
  event,
  companies,
  detailOpen,
  onOpenDetail,
  onPinMoment,
  onCloseDetail,
  isFuture = false,
}: Props) {
  const cardRef = useRef<HTMLElement>(null)
  const { color, soft } = companyColor(companies, event.company)
  const et = EVENT_TYPE_COLOR[event.eventType]
  const sourceUrl = event.sources[0]?.url
  const openDetail = () => onOpenDetail(event.id)
  const pinMoment = () => onPinMoment(event.id)

  const onHeaderKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      openDetail()
    }
  }

  const onBodyKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      pinMoment()
    }
  }

  return (
    <article
      ref={cardRef}
      className={`event-card${detailOpen ? ' is-detail' : ''}${isFuture ? ' is-future' : ''}`}
      data-event-id={event.id}
      style={
        {
          ['--co' as string]: color,
          ['--co-soft' as string]: soft,

        } as CSSProperties
      }
      aria-expanded={detailOpen}
    >
      <header
        className="event-card__meta"
        onClick={(e) => {
          e.stopPropagation()
          openDetail()
        }}
        onKeyDown={onHeaderKey}
        role="button"
        tabIndex={0}
        title="打开卡片详情"
        aria-label={`打开详情：${event.title}`}
      >
        <time dateTime={event.date}>{event.date}</time>
        <span className="event-card__company" title={event.company}>
          <CompanyAvatar companies={companies} companyName={event.company} size={14} />
          {event.company}
        </span>
      </header>

      <div
        className="event-card__body"
        onClick={(e) => {
          e.stopPropagation()
          pinMoment()
        }}
        onKeyDown={onBodyKey}
        role="button"
        tabIndex={0}
        title="钉住同日横线（与左侧时间轴节点相同）"
        aria-label={`钉住 ${event.date} 同日时刻`}
      >
        <div className="event-card__main">
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
        {event.category === 'model' ? (
          <ModelCapabilityIcons capabilities={event.capabilities} />
        ) : null}
      </div>

      {detailOpen ? (
        <DetailPopover
          event={event}
          companies={companies}
          anchorRef={cardRef}
          onClose={onCloseDetail}
        />
      ) : null}
    </article>
  )
}
