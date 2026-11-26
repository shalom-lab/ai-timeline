import { useMemo, useState } from 'react'
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

export default function CompareBoard({events, searched, companies, onReturn, onClearSearch}: {
  events:TimelineEvent[]; searched:TimelineEvent[]; companies:Company[]; onReturn:()=>void; onClearSearch:()=>void;
}) {
  const [tab,setTab] = useState<Tab>('model')
  const [picked,setPicked] = useState(defaults)
  const [range,setRange] = useState('all')
  const [sort,setSort] = useState<'latest'|'earliest'>('latest')
  const [sameDay,setSameDay] = useState(false)
  const [message,setMessage] = useState('')
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

  return <main className="comparison">
    <div className="comparison__mast">
      <a href="#/" className="comparison__back" onClick={e=>{if(!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey){e.preventDefault();onReturn()}}}>← 返回时间线</a>
      <h2>分栏对照</h2>
      <p>把不同发布放在同一条时间轴上。<span>每行是一个实际发生事件的日期，行距不代表相隔天数。</span></p>
    </div>
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
        <div className="comparison__matrix" tabIndex={0} aria-label="事件对照表，内容超宽时可横向滚动">
          <table>
            <thead><tr><th scope="col">事件日期</th>{visible.map(g=><th scope="col" key={g.key}>{g.label}<small>{columnCounts.get(g.key)} 条</small></th>)}</tr></thead>
            {[...groupsByMonth].map(([month,monthRows])=><tbody key={month}>
              <tr className="comparison__month"><th scope="rowgroup" colSpan={visible.length+1}>{monthLabel(month)}</th></tr>
              {monthRows.map(([date,day])=><tr key={date} className={day.size>1?"comparison__overlap":undefined}>
                <th className="comparison__date" scope="row"><time dateTime={date}>{date.slice(5).replace('-',' / ')}</time>{day.size>1&&<span>同日 · {day.size} 列</span>}</th>
                {visible.map(g=><td key={g.key} className={day.has(g.key)?'has-events':'is-blank'}>
                  {day.get(g.key)?.map(e=><CompareEvent key={e.id} e={e}/>)??<span aria-label="当日无匹配事件">·</span>}
                </td>)}
              </tr>)}
            </tbody>)}
          </table>
        </div>
        <div className="comparison__mobile">
          {[...groupsByMonth].map(([month,monthRows])=><section key={month} aria-label={monthLabel(month)}>
            <h3>{monthLabel(month)}</h3>
            {monthRows.map(([date,day])=><div className="comparison__mobile-day" key={date}><time dateTime={date}>{date.slice(5).replace('-',' / ')}</time>
              <div>{visible.flatMap(g=>(day.get(g.key)??[]).map(e=><CompareEvent key={e.id} e={e} group={g.label}/>))}</div>
            </div>)}
          </section>)}
        </div>
      </>}
  </main>
}
