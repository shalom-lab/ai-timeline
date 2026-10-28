import { useState } from 'react'
import { calendarWindow, localDate, type DateWindow } from '../lib/calendar'

type Props = { value: DateWindow | null; onChange: (value: DateWindow | null) => void }
export default function TimeWindow({ value, onChange }: Props) {
  const [editing, setEditing] = useState(false)
  const [start, setStart] = useState(value?.start ?? calendarWindow(6).start)
  const [end, setEnd] = useState(value?.end ?? localDate())
  const invalid = !start || !end || start > end
  return <section className="time-window" aria-label="历史时间窗">
    <div className="time-window__row">
      <span className="time-window__label">时间窗</span>
      <button aria-pressed={!value} onClick={() => { onChange(null); setEditing(false) }}>全部历史</button>
      {[3, 6, 12].map(n => <button key={n} aria-pressed={value?.preset === n} onClick={() => { onChange(calendarWindow(n)); setEditing(false) }}>近 {n} 个月</button>)}
      <button aria-pressed={editing || value?.preset === 'custom'} onClick={() => { setStart(value?.start ?? calendarWindow(6).start); setEnd(value?.end ?? localDate()); setEditing(true) }}>自定义范围</button>
      <span className="time-window__range" role="status">{value ? `${value.start} — ${value.end}` : '全部已收录日期'}</span>
    </div>
    {editing && <form className="time-window__form" onSubmit={e => { e.preventDefault(); if (!invalid) { onChange({ start, end, preset: 'custom' }); setEditing(false) } }}>
      <label>开始日期<input type="date" aria-label="开始日期" required value={start} onChange={e => setStart(e.target.value)} /></label>
      <span aria-hidden>—</span>
      <label>结束日期<input type="date" aria-label="结束日期" required value={end} onChange={e => setEnd(e.target.value)} /></label>
      <button type="submit" disabled={invalid}>应用范围</button>
      <button type="button" onClick={() => setEditing(false)}>取消</button>
      {invalid && <span role="alert">请填写日期，且开始日期不能晚于结束日期。</span>}
    </form>}
    <p className="time-window__hint">近 N 个月含本月至今天；自定义范围包含起止日期。能力边界按范围涉及的月份展示。</p>
  </section>
}
