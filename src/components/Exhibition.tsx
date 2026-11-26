import { useState } from 'react'
import type { TimelineEvent } from '../types/timeline'

const chapters = [
  { title: '给 AI 一个对话框', overline: '01 / CONVERSATION', color: 'amber', copy: '从公开研究预览到多模态助手。对话不再只是研究演示，而成了使用模型的入口。', points: [
    ['openai-chatgpt-research-preview-2022-11-30', '研究预览走向公众'],
    ['openai-gpt-4-2023-03-14', '对话模型开始理解图像'],
  ] },
  { title: '从回答到动手', overline: '02 / AGENCY', color: 'blue', copy: '工具连接、终端代理与云端执行，让人们开始把工作交给 AI，而不只是向它提问。', points: [
    ['anthropic-mcp-open-source-2024-11-25', '让模型连接外部工具'],
    ['anthropic-claude-code-research-preview-2025-02-24', '把编码助手带进终端'],
    ['openai-codex-research-preview-2025-05-16', '在云端执行软件工程任务'],
  ] },
  { title: '模型不只在云上', overline: '03 / OPEN WEIGHTS', color: 'ink', copy: '公开模型权重，让部署和研究不只能依赖单一厂商的 API。能否商用、如何分发，仍取决于各自许可证。', points: [
    ['deepseek-r1-open-source-2025-01-20', '开放推理模型与蒸馏版本'],
    ['alibaba-qwen3-open-source-2025-04-29', '同一家族提供多种规模与思考模式'],
  ] },
  { title: '走进科研现场', overline: '04 / SCIENCE', color: 'moss', copy: '天气、结构生物学与算法发现。这里追踪的是可查证的研究节点，不是厂商能力榜。', points: [
    ['deepmind-graphcast-2023-11-14', '预测未来十天的天气'],
    ['google-deepmind-alphafold3-2024-05-08', '预测生物分子的相互作用'],
    ['deepmind-alphaevolve-algorithms-2025-05-14', '搜索并检验更好的算法'],
    ['deepmind-alphagenome-atlas-2026-09-08', '把变异效应预测做成可查询图谱'],
  ] },
] as const

function Plate({ variant }: { variant: number }) {
  return (
    <svg className="exhibit__plate" viewBox="0 0 540 360" fill="none" aria-hidden="true">
      <path d="M28 18H512V342H28z M28 38H512 M28 322H512 M48 18V342 M492 18V342" stroke="currentColor" opacity=".25"/>
      <path d="M270 38V322M48 180H492" stroke="currentColor" opacity=".26" strokeDasharray="3 7"/>
      {variant === 0 && <>
        {Array.from({length:23}, (_, i) => <path key={i} d={`M94 ${70+i*10} C 160 ${70+i*10}, 176 ${165-i*2}, 270 ${145+i*3} S 395 ${60+i*11}, 446 ${60+i*11}`} stroke="currentColor" opacity={i % 5 === 0 ? .82 : .34}/>)}
        <path d="M82 70H115V291H82z M428 60H461V302H428z" stroke="currentColor"/>
        <circle cx="270" cy="180" r="65" stroke="currentColor" strokeDasharray="2 6"/>
        <circle cx="270" cy="180" r="5" fill="currentColor"/>
      </>}
      {variant === 1 && <>
        {[0,1,2,3].map((m) => <g key={m}>
          <path d={`M115 ${75+m*68}H207V${93+m*58}H270V${260-m*51}H339V${76+m*68}H425`} stroke="currentColor" opacity={.4+m*.16} strokeWidth={m===3?2:1}/>
          <circle cx="115" cy={75+m*68} r="12" stroke="currentColor"/>
          <circle cx="425" cy={76+m*68} r="12" stroke="currentColor"/>
          <circle cx="270" cy={93+m*58} r="4" fill="currentColor"/>
        </g>)}
        <path d="M85 48H145V309H85z M395 48H455V309H395z" stroke="currentColor" opacity=".42"/>
      </>}
      {variant === 3 && Array.from({length:12},(_,i)=><g key={i} transform={`rotate(${i*15} 270 180)`} opacity={i%3===0?.82:.34}>
        <ellipse cx="270" cy="180" rx={158-i*3} ry={41+i*1.8} stroke="currentColor"/>
        <circle cx={428-i*3} cy="180" r={i%3===0?4:2} fill="currentColor"/>
      </g>)}
      {variant===2 && <>
        {Array.from({length:36},(_,i)=>{
          const x = 145 + i%6*50
          const y = 75 + Math.floor(i/6)*42
          const path = (i%6+Math.floor(i/6))%2===0
          return <g key={i} opacity={path ? .85 : .36}>
            <rect x={x-11} y={y-11} width="22" height="22" stroke="currentColor" fill={path?'currentColor':'none'} fillOpacity=".2"/>
            {i%6 < 5 && <path d={`M${x+11} ${y}H${x+39}`} stroke="currentColor" strokeDasharray={path?'2 4':undefined}/>}
            {i<30 && <path d={`M${x} ${y+11}V${y+31}`} stroke="currentColor" opacity=".7"/>}
          </g>
        })}
      </>}
      <text x="51" y="33">AI CHRONICLE / ARCHIVE PLATE</text>
      <text x="51" y="336">{`FIG. 0${variant + 1}  /  CONCEPT DIAGRAM`}</text>
    </svg>
  )
}

export default function Exhibition({events}: {events: TimelineEvent[]}) {
  const [selected,setSelected] = useState(0)
  const chapter = chapters[selected]
  const lookup = new Map(events.map(e => [e.id,e]))
  return <main className="exhibit">
    <div className="edition-heading">
      <span className="edition-label">THE EXHIBITION / 04 CHAPTERS</span>
      <h2>里程碑展</h2>
      <p>四条线索，重读生成式 AI 的关键转折。</p>
    </div>
    <div className="exhibit__tabs" role="group" aria-label="选择展览章节">
      {chapters.map((c,i) => <button type="button" aria-pressed={selected===i} key={c.title} onClick={()=>setSelected(i)}><span>{String(i+1).padStart(2,'0')}</span>{c.title}</button>)}
    </div>
    <section className={`exhibit__feature exhibit__feature--${chapter.color}`} aria-labelledby="exhibit-chapter">
      <div className="exhibit__visual"><Plate variant={selected}/></div>
      <div className="exhibit__description">
        <span className="edition-label">{chapter.overline}</span>
        <h3 id="exhibit-chapter">{chapter.title}</h3>
        <p>{chapter.copy}</p>
        <ol>{chapter.points.map(([id,note])=>{
          const event=lookup.get(id)
          return event && <li key={id}><a href={`#/event/${id}`}><time dateTime={event.date}>{event.date}</time><span><strong>{event.title}</strong><small>{note}</small></span><span aria-hidden="true">↗</span></a></li>
        })}</ol>
      </div>
    </section>
  </main>
}
