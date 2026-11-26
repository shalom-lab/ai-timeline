import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { CATEGORY_LABEL_ZH, type Category, type Company, type TimelineEvent } from '../types/timeline'
import { EVENT_TYPE_LABEL_ZH } from '../lib/labels'
import { groupKeyForEvent } from '../lib/group'
import { CompanyLogoImg, hasCompanyLogo } from '../lib/icons'
import './chronology.css'

type Props = { events: TimelineEvent[]; companies: Company[]; onClearSearch: () => void; hasQuery: boolean }
const categories: ('all' | Category)[] = ['all', 'model', 'product', 'science']
const linkedEvent = () => /^#\/event\/([a-z0-9-]+)$/.exec(window.location.hash)?.[1] ?? null

export default function Chronology({ events, companies, onClearSearch, hasQuery }: Props) {
  const [category, setCategory] = useState<'all' | Category>('all')
  const [year, setYear] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [company, setCompany] = useState('')
  const [eventLink, setEventLink] = useState(linkedEvent)
  const lastOpened = useRef<string | null>(null)
  const scroller = useRef<HTMLElement>(null)
  const updateIndex = () => {
    const el = scroller.current
    if (!el) return
    const top = (el.querySelector('.chronology__toolbar')?.getBoundingClientRect().bottom ?? 0) + 46
    const headings = Array.from(el.querySelectorAll<HTMLElement>('.chronology__yearhead h2'))
    const reachedEnd = el.scrollHeight > el.clientHeight && el.scrollTop + el.clientHeight >= el.scrollHeight - 3
    const visible = reachedEnd ? headings.at(-1) : headings.filter(h => h.getBoundingClientRect().top <= top).at(-1) ?? headings[0]
    if (visible) setSelectedYear(visible.id.slice('chronology-year-'.length))
  }
  useEffect(() => {
    const sync = () => {
      const next = linkedEvent()
      lastOpened.current = null
      setEventLink(next)
      if (next) {
        setCategory('all')
        setYear('')
        setCompany('')
        onClearSearch()
      }
    }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [onClearSearch])

  useEffect(() => {
    if (!eventLink || eventLink === lastOpened.current) return
    const card = document.getElementById('event-' + eventLink)
    if (!(card instanceof HTMLDetailsElement)) return
    lastOpened.current = eventLink
    card.open = true
    card.scrollIntoView({ block: 'center' })
  }, [eventLink, events, category, year, company])
  const years = useMemo(() => [...new Set(events.map(e => e.date.slice(0, 4)))].sort().reverse(), [events])
  const orgs = useMemo(() => [...new Map(events.map(e => [e.companyId, e.company])).entries()].sort((a, b) => a[1].localeCompare(b[1], 'zh-CN')), [events])
  const groups = useMemo(() => {
    const list = events.filter(e => (category === 'all' || e.category === category) &&
      (!year || e.date.startsWith(year)) && (!company || e.companyId === company))
      .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'zh-CN'))
    const byYear = new Map<string, TimelineEvent[]>()
    for (const event of list) {
      const yearKey = event.date.slice(0, 4)
      const bucket = byYear.get(yearKey)
      if (bucket) bucket.push(event)
      else byYear.set(yearKey, [event])
    }
    return [...byYear]
  }, [events, category, year, company])
  const count = groups.reduce((sum, [, entries]) => sum + entries.length, 0)
  const hasFilters = category !== 'all' || !!year || !!company || hasQuery
  const shownYears = groups.map(([label, entries]) => ({label, count:entries.length}))
  function jump(label: string) {
    setSelectedYear(label)
    document.getElementById('chronology-year-' + label)?.scrollIntoView({block:'start'})
  }
  function clear() {
    setCategory('all'); setYear(''); setSelectedYear(''); setCompany(''); onClearSearch()
  }
  return (
    <main className="chronology" ref={scroller} onScroll={updateIndex}>
      <div className="chronology__toolbar">
        <div className="chronology__bar">
          <div className="chronology__categories" role="group" aria-label="事件分类">
            {categories.map(id => <button type="button" key={id} aria-pressed={category === id}
              onClick={() => setCategory(id)}>{id === 'all' ? '全部' : CATEGORY_LABEL_ZH[id]}</button>)}
          </div>
          <div className="chronology__controls">
            <select aria-label="按年份筛选" value={year} onChange={e => setYear(e.target.value)}>
              <option value="">全部年份</option>
              {year && !years.includes(year) && <option value={year}>{year} 年</option>}
              {years.map(y => <option key={y} value={y}>{y} 年</option>)}
            </select>
            <select aria-label="按机构筛选" value={company} onChange={e => setCompany(e.target.value)}>
              <option value="">全部机构</option>
              {company && !orgs.some(([id]) => id === company) && <option value={company}>{companies.find(c => c.id === company)?.name ?? company}</option>}
              {orgs.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="chronology__layout">
        <aside className="archive-index" aria-label="年份索引">
          <div className="archive-index__label"><span>TIME</span><span>INDEX</span></div>
          <div className="archive-index__inner">
            <div className="edition-label">年份索引 / YEAR</div>
            {shownYears.map(({label,count})=><button type="button" key={label}
              aria-label={`跳到 ${label} 年，${count} 条事件`}
              aria-current={(shownYears.some(y=>y.label===selectedYear)?selectedYear:shownYears[0]?.label)===label?'location':undefined}
              onClick={()=>jump(label)}><strong>{label}</strong><span>{String(count).padStart(2,'0')}</span></button>)}
            <div className="archive-index__tail"><span>{count} 条事件</span><span>↓</span></div>
          </div>
        </aside>
        <div className="chronology__body">
        {groups.length === 0 ? (
          <div className="chronology__empty">
            <h2>没有符合条件的事件</h2>
            <button type="button" onClick={clear}>清除筛选</button>
          </div>
        ) : groups.map(([y, entries], index) => (
          <section className="chronology__year" key={y} aria-labelledby={'chronology-year-' + y}>
            <div className="chronology__yearhead">
              <div className="chronology__year-title"><span className="edition-label">年度档案 / YEAR</span><h2 id={'chronology-year-' + y}>{y}</h2></div>
              <span className="chronology__count" aria-live={index === 0 ? 'polite' : undefined}>{index === 0 && hasFilters ? `${count} 条符合条件` : `${entries.length} 条记录`}</span>
              {index === 0 && hasFilters && <button type="button" className="chronology__clear" onClick={clear}>清除筛选</button>}
            </div>
            <ol className="chronology__stream">
              {entries.map((event, i) => {
                const brand = companies.find(c => c.id === event.companyId)
                const categoryLabel = CATEGORY_LABEL_ZH[event.category]
                const subcategoryLabel = event.category === 'model'
                  ? event.series?.trim()
                  : event.category === 'science' || event.category === 'product'
                    ? groupKeyForEvent(event.category, event).label
                    : undefined
                const startsMonth = i === 0 || entries[i - 1].date.slice(0,7) !== event.date.slice(0,7)
                const startsDay = i === 0 || entries[i - 1].date !== event.date
                return <li className={`chronology__item${startsDay ? " chronology__item--newday" : ""}${startsMonth ? " chronology__item--newmonth" : ""}`} key={event.id} style={{ '--event-tone': brand?.color ?? '#447463', '--event-soft': brand?.colorSoft } as CSSProperties}>
                  <time className={startsDay ? undefined : "sr-only"} dateTime={event.date}><span>{event.date.slice(5,7)}</span><span className="chronology__date-slash">/</span><strong>{event.date.slice(8)}</strong></time>
                  <details className="chronology__card" id={'event-' + event.id}>
                    <summary>
                      <span className="chronology__eyebrow">
                        <span className="chronology__org">
                          <span className="chronology__mark" aria-hidden="true">
                            {hasCompanyLogo(event.companyId)
                              ? <CompanyLogoImg companyId={event.companyId} size={13} />
                              : event.company.slice(0, 1).toUpperCase()}
                          </span>
                          {event.company}
                        </span>
                        <span className="chronology__taxonomy">
                          <span>{categoryLabel}</span>
                          {subcategoryLabel && subcategoryLabel !== categoryLabel && <>
                            <span className="chronology__taxonomy-divider" aria-hidden="true">›</span>
                            <span className="chronology__subtype">{subcategoryLabel}</span>
                          </>}
                        </span>
                      </span>
                      <span className="chronology__title">{event.title}</span>
                      <span className="chronology__excerpt">{event.summary}</span>
                      <span className="chronology__disclosure" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                          <path className="chronology__disclosure-closed" d="m4 6.5 4 4 4-4" />
                          <path className="chronology__disclosure-open" d="m4 10 4-4 4 4" />
                        </svg>
                      </span>
                    </summary>
                    <div className="chronology__detail">
                      <p>{event.summary}</p>
                      <div className="chronology__sources">
                        <span>{EVENT_TYPE_LABEL_ZH[event.eventType]}</span>
                        <a className="chronology__permalink" href={'#/event/' + event.id}>事件链接</a>
                        {event.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.publisher ?? source.title} · 原始来源 ↗<span className="sr-only">：{source.title}</span></a>)}
                      </div>
                    </div>
                  </details>
                </li>
              })}
            </ol>
          </section>
        ))}
        </div>
      </div>
    </main>
  )
}
