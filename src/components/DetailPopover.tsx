import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
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
  anchorRef: RefObject<HTMLElement | null>
  onClose: () => void
}

type Pos = { top: number; left: number; width: number }

export default function DetailPopover({
  event,
  companies,
  anchorRef,
  onClose,
}: Props) {
  const popRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<Pos | null>(null)
  const { color, soft } = companyColor(companies, event.company)
  const et = EVENT_TYPE_COLOR[event.eventType]
  const sub =
    event.productSubcategory &&
    PRODUCT_SUBCATEGORY_LABEL_ZH[event.productSubcategory]

  const place = () => {
    const el = anchorRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const width = Math.min(360, Math.max(280, r.width + 24))
    let left = r.left + r.width / 2 - width / 2
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8))
    let top = r.top
    const approxH = popRef.current?.offsetHeight ?? 320
    if (top + approxH > window.innerHeight - 8) {
      top = Math.max(8, window.innerHeight - approxH - 8)
    }
    setPos({ top, left, width })
  }

  useLayoutEffect(() => {
    place()
  }, [event.id])

  useEffect(() => {
    const onScroll = () => place()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (popRef.current?.contains(t)) return
      if (anchorRef.current?.contains(t)) return
      onClose()
    }
    window.addEventListener('resize', onScroll)
    window.addEventListener('scroll', onScroll, true)
    document.addEventListener('keydown', onKey)
    // defer so the opening click does not immediately close
    const tid = window.setTimeout(() => {
      document.addEventListener('mousedown', onDown)
    }, 0)
    return () => {
      window.clearTimeout(tid)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('scroll', onScroll, true)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [onClose, event.id])

  return createPortal(
    <div
      ref={popRef}
      className="detail-popover"
      role="dialog"
      aria-label="事件详情"
      style={
        pos
          ? {
              top: pos.top,
              left: pos.left,
              width: pos.width,
              visibility: 'visible',
            }
          : { visibility: 'hidden', top: 0, left: 0 }
      }
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
        <div className="detail-popover__logo" style={{ background: color }} aria-hidden>
          <CompanyAvatar companies={companies} companyName={event.company} size={28} />
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
              <CompanyAvatar companies={companies} companyName={event.company} size={12} />
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

      {event.tags && event.tags.length > 0 ? (
        <div className="detail-popover__tags">
          {event.tags.map((t) => (
            <span key={t} className="tag-chip">
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </div>,
    document.body,
  )
}
