import { useEffect, useMemo, useRef, useState } from 'react'
import { buildSubGroups } from '../lib/group'
import { CATEGORY_LABEL_ZH, type Company, type TimelineEvent } from '../types/timeline'
import { EVENT_TYPE_LABEL_ZH } from '../lib/labels'
import { writeClipboard } from '../lib/clipboard'
import './compare.css'

const tabs = ['model','product','science'] as const
type Tab = typeof tabs[number]
const defaults: Record<Tab, string[]> = {
  model:['company:openai','company:anthropic','company:google','company:deepseek'],
  product:['ide','agent','chat'],
  science:['life','math','earth'],
}
const MAX = 4
const monthLabel = (month: string) => `${month.slice(0,4)} 年 ${Number(month.slice(5))} 月`
const tsvCell = (value: string) => value.replace(/[\t\n\r]+/g,' ').replace(/^[=+@-]/, match => "'" + match)

function CompareEvent({e, group}: {e:TimelineEvent; group?:string}) {
  return <article className="compare-entry">
    <div className="compare-entry__meta">
      {group && <strong>{group}</strong>}
      <span>{e.company}</span><span>{EVENT_TYPE_LABEL_ZH[e.eventType]}</span>
    </div>
    <a className="compare-entry__title" href={`#/event/${e.id}`}>{e.title}<span aria-hidden="true"> ↗</span></a>
    {e.sources[0] && <a className="compare-entry__source" href={e.sources[0].url} target="_blank" rel="noopener noreferrer" aria-label={`查看来源：${e.sources[0].title}`}>原文 ↗</a>}
  </article>
}

export default function CompareBoard({events, searched, companies, onClearSearch}: {
  events:TimelineEvent[]; searched:TimelineEvent[]; companies:Company[]; onClearSearch:()=>void;
}) {
  const [tab,setTab] = useState<Tab>('model')
  const [picked,setPicked] = useState(defaults)
  const [range,setRange] = useState('all')
  const [sort,setSort] = useState<'latest'|'earliest'>('latest')
  const [sameDay,setSameDay] = useState(false)
  const [message,setMessage] = useState('')
  const [currentDate,setCurrentDate] = useState('')
  const [mobileMonth,setMobileMonth] = useState('')
  const page = useRef<HTMLElement>(null)
  const matrix = useRef<HTMLDivElement>(null)
  const rail = useRef<HTMLDivElement>(null)
  const pinnedScrollTop = useRef<number | null>(null)
  const choices = useMemo(()=>buildSubGroups(tab,events.filter(e=>e.category===tab),companies),[tab,events,companies])
  const visible = choices.filter(g=>picked[tab].includes(g.key))
  const years = [...new Set(choices.flatMap(g=>g.events.map(e=>e.date.slice(0,4))))].sort().reverse()
  const allowed = new Set(searched.map(e=>e.id))
  const now = Date.now()
  const today = new Date(now).toISOString().slice(0,10)
  const recentStart = new Date(now - 89 * 86_400_000).toISOString().slice(0,10)
  const perDate = new Map<string, Map<string, TimelineEvent[]>>()
  const period = years.includes(range) || range==='90' ? range : 'all'
  const inRange = (d:string) => period==='all' || (period==='90' ? d>=recentStart && d<=today : d.startsWith(period))
  for(const group of visible) for(const e of group.events) {
    if(!allowed.has(e.id) || !inRange(e.date)) continue
    let day = perDate.get(e.date)
    if(!day) perDate.set(e.date,day=new Map())
    const cell=day.get(group.key)??[]
    cell.push(e); day.set(group.key,cell)
  }
  const rows = [...perDate].filter(([,day])=>!sameDay || day.size>1).sort(([a],[b])=>sort==='earliest'?a.localeCompare(b):b.localeCompare(a))
  const columnCounts = new Map(visible.map(g=>[g.key, rows.reduce((n,[,day])=>n+(day.get(g.key)?.length??0),0)]))
  const total = [...columnCounts.values()].reduce((sum, count)=>sum+count, 0)
  const groupsByMonth = new Map<string, typeof rows>()
  for(const row of rows) {
    const key=row[0].slice(0,7)
    const bucket=groupsByMonth.get(key)
    if(bucket) bucket.push(row)
    else groupsByMonth.set(key,[row])
  }
  const activeDate = perDate.has(currentDate) && rows.some(([date])=>date===currentDate) ? currentDate : rows[0]?.[0] ?? ''
  const activeMonth = activeDate.slice(0,7)
  const selectionKey = picked[tab].join('|')

  useEffect(()=>{
    pinnedScrollTop.current = null
    window.scrollTo({top:0})
    if (rail.current) rail.current.scrollTop = 0
    setCurrentDate('')
    setMobileMonth('')
  },[tab,selectionKey,range,sort,sameDay,searched])

  useEffect(()=>{
    const pane = rail.current
    const control = pane?.querySelector<HTMLButtonElement>('[aria-current="date"]') ??
      pane?.querySelector<HTMLButtonElement>('[data-active-month="true"]')
    if (!pane || !control) return
    const bounds = pane.getBoundingClientRect()
    const item = control.getBoundingClientRect()
    if (item.top < bounds.top+4) pane.scrollTop += item.top-bounds.top-4
    else if (item.bottom > bounds.bottom-4) pane.scrollTop += item.bottom-bounds.bottom+4
  },[activeDate])

  useEffect(()=>{
    const header = document.querySelector('.app-header')
    const surface = page.current
    if (!surface || !header) return
    function measure() {
      if (header && surface) surface.style.setProperty('--compare-site-header', `${header.getBoundingClientRect().height}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(header)
    let frame = 0
    function onPageScroll() {
      if (frame) return
      frame = window.requestAnimationFrame(()=>{
        frame = 0
        const pane = matrix.current
        if (!pane || pane.getClientRects().length===0) return
        if (pinnedScrollTop.current!==null && Math.abs(window.scrollY-pinnedScrollTop.current)<2) return
        pinnedScrollTop.current = null
        const head = pane.querySelector('thead')?.getBoundingClientRect().height ?? 0
        const top = (header?.getBoundingClientRect().bottom ?? 0) + head
        const visibleRow = Array.from(pane.querySelectorAll<HTMLTableRowElement>('[data-compare-date]'))
          .find(row=>row.getBoundingClientRect().bottom>top+4)
        if (visibleRow?.dataset.compareDate) setCurrentDate(visibleRow.dataset.compareDate)
      })
    }
    window.addEventListener('scroll',onPageScroll,{passive:true})
    return ()=>{
      observer.disconnect()
      window.removeEventListener('scroll',onPageScroll)
      window.cancelAnimationFrame(frame)
    }
  },[])

  function jumpDate(date:string, month=false) {
    const pane = matrix.current
    const row = pane?.querySelector<HTMLTableRowElement>(month ? `[data-compare-month="${date.slice(0,7)}"]` : `[data-compare-date="${date}"]`)
    if (!pane || !row) return
    const head = pane.querySelector('thead')?.getBoundingClientRect().height ?? 0
    const mast = document.querySelector('.app-header')?.getBoundingClientRect().height ?? 0
    const at = window.scrollY + row.getBoundingClientRect().top - head - mast
    const limit = Math.max(0, document.documentElement.scrollHeight-window.innerHeight)
    const target = Math.min(limit, Math.max(0,at))
    pinnedScrollTop.current = Math.round(target)
    setCurrentDate(date)
    window.scrollTo({top:target})
  }

  const selectedCount=visible.length
  const what = {model:'机构',product:'产品类型',science:'学科'}[tab]

  function toggle(key:string) {
    setMessage('')
    setPicked(current=>{
      const old=current[tab]
      return {...current,[tab]:old.includes(key) ? old.filter(x=>x!==key) : old.length<MAX ? [...old,key] : old}
    })
  }
  async function copy() {
    const body = rows.flatMap(([date,day])=>visible.flatMap(g=>(day.get(g.key)??[]).map(e=>[
      date,g.label,e.company,e.title,EVENT_TYPE_LABEL_ZH[e.eventType],e.sources[0]?.url ?? '',
    ].map(tsvCell).join('\t'))))
    try {
      await writeClipboard(['日期\t对照列\t机构\t事件\t阶段\t首个来源', ...body].join('\n'), true)
      setMessage(`已复制 ${body.length} 条事件`)
    } catch {setMessage('暂时无法复制，请检查浏览器的剪贴板权限。')}
  }

  return <main className="comparison" aria-label="分栏对照" ref={page}>
    <div className="comparison__controls">
      <div className="comparison__tabs" role="group" aria-label="对照类别">
        {tabs.map((label)=><button type="button" key={label} aria-pressed={tab===label} onClick={()=>{setTab(label);setMessage('')}}>{CATEGORY_LABEL_ZH[label]}</button>)}
      </div>
      <div className="comparison__filters">
        <label><span>日期</span><select aria-label="对照日期" value={period} onChange={e=>{setRange(e.target.value);setMessage('')}}>
          <option value="all">全部年份</option><option value="90">最近 90 天</option>
          {years.map(y=><option key={y} value={y}>{y} 年</option>)}
        </select></label>
        <label><span>顺序</span><select aria-label="对照排序" value={sort} onChange={e=>{setSort(e.target.value==='earliest'?'earliest':'latest');setMessage('')}}>
          <option value="latest">最新在前</option><option value="earliest">最早在前</option>
        </select></label>
      </div>
    </div>
    <div className="comparison__selection">
      <details className="comparison__picker">
        <summary>选择{what}<span>{selectedCount} / {MAX}</span></summary>
        <div className="comparison__options" role="group" aria-label={`选择对照${what}`}>
          {choices.map(g=><label key={g.key}><input type="checkbox" checked={picked[tab].includes(g.key)} disabled={selectedCount>=MAX&&!picked[tab].includes(g.key)} onChange={()=>toggle(g.key)}/>{g.label}</label>)}
        </div>
      </details>
      <div className="comparison__chips" aria-label={`已选${what}`}>
        {visible.map(g=><button type="button" key={g.key} onClick={()=>toggle(g.key)} aria-label={`移除 ${g.label}`}>{g.label}<span aria-hidden="true">×</span></button>)}
      </div>
    </div>
    <div className="comparison__status">
      <span aria-live="polite">{total} 条事件 · {rows.length} 个日期</span>
      <label className="comparison__same-day"><input type="checkbox" checked={sameDay} onChange={e=>{setSameDay(e.target.checked);setMessage('')}}/>仅看跨列同日</label>
      <button type="button" className="edition-control" disabled={!total} onClick={copy}>复制当前结果</button>
      <span role="status">{message}</span>
    </div>

    {rows.length===0 ? <div className="comparison__empty"><strong>{selectedCount?'当前筛选没有事件':'请先选择至少一列'}</strong>
      <button type="button" className="edition-control" onClick={()=>{setPicked(defaults);setRange('all');setSameDay(false);onClearSearch();setMessage('')}}>恢复默认</button></div> :
      <>
        <div className="comparison__desk">
          <aside className="comparison__rail" aria-label="对照时间轴">
            <div className="comparison__rail-title"><strong>时间轴</strong><span>{sort==='latest'?'从新到旧':'从旧到新'}</span></div>
            <div className="comparison__rail-scroll" ref={rail}>
              {[...groupsByMonth].map(([month,monthRows],i,all)=><div className="comparison__rail-block" key={month}>
                {(i===0 || all[i-1][0].slice(0,4)!==month.slice(0,4)) && <div className="comparison__rail-year">{month.slice(0,4)}</div>}
                <button type="button" className="comparison__rail-month" data-active-month={activeMonth===month}
                  aria-label={`跳到 ${monthLabel(month)}，${monthRows.length} 个日期`} onClick={()=>jumpDate(monthRows[0][0],true)}>
                  <span>{Number(month.slice(5))} 月</span><small>{monthRows.length}</small>
                </button>
                {activeMonth===month && <ul className="comparison__rail-days">
                  {monthRows.map(([date,day])=><li key={date}><button type="button" aria-current={activeDate===date?'date':undefined}
                    aria-label={`定位 ${date}${day.size>1?'，跨列同日':''}`} onClick={()=>jumpDate(date)}>
                    <time dateTime={date}>{date.slice(5).replace('-',' / ')}</time>{day.size>1&&<span>同日</span>}
                  </button></li>)}
                </ul>}
              </div>)}
            </div>
          </aside>
        <div className="comparison__matrix" ref={matrix} aria-label="事件对照表">

          <table>
            <thead><tr><th scope="col">事件日期</th>{visible.map(g=><th scope="col" key={g.key}>{g.label}<small>{columnCounts.get(g.key)} 条</small></th>)}</tr></thead>
            {[...groupsByMonth].map(([month,monthRows])=><tbody key={month}>
              <tr className="comparison__month" data-compare-month={month}><th scope="rowgroup" colSpan={visible.length+1}>{monthLabel(month)}</th></tr>
              {monthRows.map(([date,day])=><tr key={date} data-compare-date={date} data-current={date===activeDate} className={day.size>1?"comparison__overlap":undefined}>
                <th className="comparison__date" scope="row"><time dateTime={date}>{date.slice(5).replace('-',' / ')}</time>{day.size>1&&<span>同日 · {day.size} 列</span>}</th>
                {visible.map(g=><td key={g.key} className={day.has(g.key)?'has-events':'is-blank'}>
                  {day.get(g.key)?.map(e=><CompareEvent key={e.id} e={e}/>)??<span aria-label="当日无匹配事件">·</span>}
                </td>)}
              </tr>)}
            </tbody>)}
          </table>
        </div>
        </div>
        <label className="comparison__mobile-jump"><span>时间轴</span><select aria-label="跳到月份" value={mobileMonth}
          onChange={e=>{setMobileMonth(e.target.value);document.getElementById('compare-mobile-'+e.target.value)?.scrollIntoView({block:'start'})}}>
          <option value="">跳到月份</option>
          {[...groupsByMonth.keys()].map(month=><option key={month} value={month}>{monthLabel(month)}</option>)}
        </select></label>
        <div className="comparison__mobile">
          {[...groupsByMonth].map(([month,monthRows])=><section id={'compare-mobile-'+month} key={month} aria-label={monthLabel(month)}>
            <h3>{monthLabel(month)}</h3>
            {monthRows.map(([date,day])=><div className="comparison__mobile-day" key={date}><time dateTime={date}>{date.slice(5).replace('-',' / ')}</time>
              <div>{visible.flatMap(g=>(day.get(g.key)??[]).map(e=><CompareEvent key={e.id} e={e} group={g.label}/>))}</div>
            </div>)}
          </section>)}
        </div>
      </>}
  </main>
}
