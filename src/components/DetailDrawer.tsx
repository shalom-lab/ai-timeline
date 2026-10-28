import type { Company, TimelineEvent } from '../types/timeline'
import {
  CATEGORY_LABEL_ZH,
  EVENT_TYPE_COLOR,
  EVENT_TYPE_LABEL_ZH,
  PRODUCT_SUBCATEGORY_LABEL_ZH,
} from '../lib/labels'
import { companyColor, resolveCompany } from '../lib/company'

type Props = {
  event: TimelineEvent | null
  companies: Company[]
  /** Filtered list used for prev/next */
  list: TimelineEvent[]
  onClose: () => void
  onSelect: (id: string) => void
}

export default function DetailDrawer({
  event,
  companies,
  list,
  onClose,
  onSelect,
}: Props) {
  if (!event) return null

  const idx = list.findIndex((e) => e.id === event.id)
  const prev = idx > 0 ? list[idx - 1] : null
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null
  const { color, soft } = companyColor(companies, event.company)
  const co = resolveCompany(companies, event.company)
  const et = EVENT_TYPE_COLOR[event.eventType]
  const sub =
    event.productSubcategory &&
    PRODUCT_SUBCATEGORY_LABEL_ZH[event.productSubcategory]

  return (
    <aside className="detail-drawer" aria-label="事件详情">
      <div className="detail-drawer__top">
        <span className="detail-drawer__cat">
          {CATEGORY_LABEL_ZH[event.category]}
        </span>
        <button
          type="button"
          className="detail-drawer__close"
          onClick={onClose}
          aria-label="关闭"
        >
          ×
        </button>
      </div>

      <div
        className="detail-drawer__hero"
        style={{
          background: `linear-gradient(145deg, ${soft} 0%, #fff 70%)`,
          borderColor: color,
        }}
      >
        <div
          className="detail-drawer__logo"
          style={{ background: color }}
          aria-hidden
        >
          {(co?.name ?? event.company).slice(0, 1)}
        </div>
        <div className="detail-drawer__hero-text">
          <h2>{event.title}</h2>
          <div className="detail-drawer__meta-row">
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

      <p className="detail-drawer__summary">{event.summary}</p>

      <dl className="detail-drawer__dl">
        <div>
          <dt>公司</dt>
          <dd>
            <span className="detail-drawer__co">
              <i style={{ background: color }} />
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
          <dt>事件类型</dt>
          <dd>{EVENT_TYPE_LABEL_ZH[event.eventType]}</dd>
        </div>
        <div>
          <dt>来源</dt>
          <dd>
            <ul className="detail-drawer__sources">
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

      {event.tags && event.tags.length > 0 ? (
        <div className="detail-drawer__tags">
          {event.tags.map((t) => (
            <span key={t} className="tag-chip">
              {t}
            </span>
          ))}
        </div>
      ) : null}

      <footer className="detail-drawer__nav">
        <button
          type="button"
          disabled={!prev}
          onClick={() => prev && onSelect(prev.id)}
        >
          ← 上一条
        </button>
        <span className="muted">
          {idx >= 0 ? `${idx + 1} / ${list.length}` : '—'}
        </span>
        <button
          type="button"
          disabled={!next}
          onClick={() => next && onSelect(next.id)}
        >
          下一条 →
        </button>
      </footer>
    </aside>
  )
}
