import type { Company, TimelineEvent } from '../types/timeline'
import {
  CATEGORY_LABEL_ZH,
  EVENT_TYPE_COLOR,
  EVENT_TYPE_LABEL_ZH,
  PRODUCT_SUBCATEGORY_LABEL_ZH,
} from '../lib/labels'
import { companyColor } from '../lib/company'
import { CompanyAvatar } from '../lib/icons'

type Props = {
  event: TimelineEvent
  companies: Company[]
  onClose: () => void
}

/** Centered detail panel for the 3D gallery (no card anchor). */
export default function GalleryDetail({ event, companies, onClose }: Props) {
  const { color, soft } = companyColor(companies, event.company)
  const et = EVENT_TYPE_COLOR[event.eventType]
  const sub =
    event.productSubcategory &&
    PRODUCT_SUBCATEGORY_LABEL_ZH[event.productSubcategory]

  return (
    <div
      className="gallery-detail"
      role="dialog"
      aria-modal="true"
      aria-label="事件详情"
      onClick={onClose}
    >
      <div
        className="gallery-detail__panel detail-popover"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="detail-popover__top">
          <span className="detail-popover__cat">
            {CATEGORY_LABEL_ZH[event.category]}
          </span>
          <button
            type="button"
            className="detail-popover__close"
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <div
          className="detail-popover__hero"
          style={{
            background: `linear-gradient(145deg, ${soft} 0%, #fff 70%)`,
            borderColor: color,
          }}
        >
          <div
            className="detail-popover__logo"
            style={{ background: color }}
            aria-hidden
          >
            <CompanyAvatar
              companies={companies}
              companyName={event.company}
              size={28}
            />
          </div>
          <div className="detail-popover__hero-text">
            <h2>{event.title}</h2>
            <div className="detail-popover__meta-row">
              <time dateTime={event.date}>{event.date}</time>
              <span
                className="event-type-pill"
                style={{ background: et.bg, color: et.fg }}
              >
                {EVENT_TYPE_LABEL_ZH[event.eventType]}
              </span>
            </div>
          </div>
        </div>

        <p className="detail-popover__summary">{event.summary}</p>

        <dl className="detail-popover__dl">
          <div>
            <dt>公司</dt>
            <dd>
              <span className="detail-popover__co">
                <CompanyAvatar
                  companies={companies}
                  companyName={event.company}
                  size={12}
                />
                {event.company}
              </span>
            </dd>
          </div>
          {event.series ? (
            <div>
              <dt>系列</dt>
              <dd>{event.series}</dd>
            </div>
          ) : null}
          {event.product ? (
            <div>
              <dt>产品</dt>
              <dd>{event.product}</dd>
            </div>
          ) : null}
          {sub ? (
            <div>
              <dt>产品大类</dt>
              <dd>{sub}</dd>
            </div>
          ) : null}
          <div>
            <dt>来源</dt>
            <dd>
              <ul className="detail-popover__sources">
                {event.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                    {s.publisher ? (
                      <span className="muted"> · {s.publisher}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
