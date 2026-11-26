import { useMemo, useState } from 'react'
import type { AiToolsData, ToolColumnId } from '../types/tools'
import type { Company } from '../types/timeline'
import { resolveCompany } from '../lib/company'
import { CompanyLogoImg, hasCompanyLogo } from '../lib/icons'
import ToolsMatrix from './ToolsMatrix'

export default function ToolDirectory({data, companies, query}: {data:AiToolsData;companies:Company[];query:string}) {
  const [category,setCategory] = useState<ToolColumnId | 'all'>('all')
  const [matrix,setMatrix] = useState(/^#\/tools\/(models|products)$/.test(window.location.hash))
  const q=query.trim().toLowerCase()
  const tools=useMemo(()=>data.rows.flatMap(row=>{
    const company=resolveCompany(companies,row.companyId)
    const name=row.displayName ?? company?.name ?? row.companyId
    return data.columns.flatMap(col=>{
      const value=row.cells[col.id]
      if (!value) return []
      return (Array.isArray(value)?value:[value]).map(product=>({product,col,company,name,id:row.companyId}))
    })
  }),[data,companies])
  const visible=tools.filter(x=>(category==='all'||x.col.id===category)&&(!q || [x.product.name,x.product.note,x.product.pricing,x.name,x.col.label,...x.company?.aliases??[]].some(s=>s?.toLowerCase().includes(q))))
  return <main className={`directory${matrix?' directory--matrix':''}`}>
    <div className="edition-heading">
      <span className="edition-label">FIELD GUIDE / AI TOOLS</span>
      <h2>AI 工具库</h2>
      <p>按用途找工具，查看官方入口与费用说明。</p>
    </div>
    <div className="directory__bar">
      {!matrix && <div className="directory__categories" role="group" aria-label="工具类别">
        <button type="button" aria-pressed={category==='all'} onClick={()=>setCategory('all')}>全部</button>
        {data.columns.map(c=><button type="button" key={c.id} aria-pressed={c.id===category} onClick={()=>setCategory(c.id)}>{c.label}</button>)}
      </div>}
      <button type="button" className="edition-control" onClick={()=>{
        if (matrix) window.history.replaceState(null,'','#/tools')
        setMatrix(!matrix)
      }}>{matrix?'返回工具卡片':'表格对照与复制'} <span aria-hidden="true">{matrix?'↶':'↗'}</span></button>
    </div>
    {matrix ? <ToolsMatrix data={data} companies={companies} query={query}/> : <>
      <p className="directory__status"><span aria-live="polite">{visible.length} 项工具与模型</span><span>数据更新于 {data.meta.updatedAt} · 可用性与定价以官网为准</span></p>
      <div className="directory__grid">
        {visible.map(({product,col,company,name,id})=><article className="directory__card" key={`${id}:${col.id}:${product.url}:${product.name}`}>
          <div className="directory__meta">
            {hasCompanyLogo(id) ? <CompanyLogoImg companyId={id} size={18}/> : <span aria-hidden="true" className="directory__letter" style={{color:company?.color ?? 'inherit'}}>{name.slice(0,1)}</span>}
            <span>{name}</span><span>{col.label}</span>
          </div>
          <h3>{product.name}</h3>
          <p>{product.pricing}</p>
          {product.note && <small>{product.note}</small>}
          <div className="directory__links"><a href={product.url} target="_blank" rel="noopener noreferrer">产品官网 ↗</a>
            {product.pricingUrl && product.pricingUrl!==product.url && <a href={product.pricingUrl} target="_blank" rel="noopener noreferrer">查看定价 ↗</a>}</div>
        </article>)}
      </div>
      {visible.length===0 && <p className="directory__empty">没有找到工具。试试调整搜索词或类别。</p>}
    </>}
  </main>
}
