import { useMemo, useRef, useState } from 'react'
import type { AiToolsData, ToolColumnId } from '../types/tools'
import type { Company } from '../types/timeline'
import BrandMark, { brandStyle } from './BrandMark'
import './directory.css'

type Category = ToolColumnId | 'all'
const count = (n: number) => String(n).padStart(2, '0')

export default function ToolDirectory({ data, companies, query }: { data: AiToolsData; companies: Company[]; query: string }) {
  const [category, setCategory] = useState<Category>('all')
  const resultsRef = useRef<HTMLElement>(null)
  const q = query.trim().toLowerCase()
  const tools = useMemo(() => {
    const organizations = new Map(companies.map(company => [company.id, company]))
    const categories = new Map(data.categories.map(category => [category.id, category]))
    return data.tools.map(product => {
      const company = organizations.get(product.companyId)
      const col = categories.get(product.categoryId) ?? { id: product.categoryId, label: product.categoryId }
      const name = product.brandLabel ?? company?.name ?? product.companyId
      return {
        product, col, name, company, id: product.logo ?? product.companyId, key: product.id,
        keywords: [product.name, product.description, product.note, product.pricing, name,
          company?.name, col.label, ...(company?.aliases ?? []), ...(product.aliases ?? [])].join(' ').toLowerCase(),
      }
    })
  }, [data, companies])
  const matches = tools.filter(tool => !q || tool.keywords.includes(q))
  const visible = category === 'all' ? matches : matches.filter(tool => tool.col.id === category)
  const categories = [{ id: 'all' as const, label: '全部工具' }, ...data.categories]
  const selectCategory = (next: Category) => {
    setCategory(next)
    const results = resultsRef.current
    const header = document.querySelector('.app-header')
    if (results && results.getBoundingClientRect().top < (header?.getBoundingClientRect().bottom ?? 0)) {
      results.scrollIntoView({ block: 'start' })
    }
  }
  const activeLabel = categories.find(item => item.id === category)?.label ?? '全部工具'

  return <main className="directory">
    <header className="directory__heading">
      <div>
        <span className="edition-label">FIELD GUIDE / AI TOOLS</span>
        <h2>AI 工具库</h2>
        <p>按用途找工具，查看官方入口与费用说明。</p>
      </div>
      <p className="directory__catalog"><strong>{count(tools.length)}</strong><span>项工具与模型</span></p>
    </header>
    <div className="directory__layout">
      <div className="directory__index">
        <p className="edition-label">按用途浏览</p>
        <div className="directory__categories" role="group" aria-label="工具类别">
          {categories.map(item => <button type="button" key={item.id}
            aria-pressed={category === item.id} onClick={() => selectCategory(item.id)}>
            <span>{item.label}</span>
            <span className="directory__category-count" aria-hidden="true">
              {count(item.id === 'all' ? matches.length : matches.filter(tool => tool.col.id === item.id).length)}
            </span>
          </button>)}
        </div>
      </div>
      <section ref={resultsRef} className="directory__results" aria-labelledby="tool-results-title">
        <div className="directory__status">
          <h3 id="tool-results-title">{activeLabel}</h3>
          <span aria-live="polite">{visible.length} 项结果</span>
        </div>
        {visible.length > 0 ? <div className="directory__grid">
          {visible.map(({ product, col, name, company, id, key }) => <article className="directory__card" key={key} style={brandStyle(company)}>
            <div className="directory__meta">
              <span className="directory__brand">
                <BrandMark id={id} name={name} size={19}/>
                <span>{name}</span>
              </span>
              <span className="directory__tag">{col.label}</span>
            </div>
            <h4>{product.name}</h4>
            <p className="directory__description">{product.description}</p>
            <p className="directory__pricing"><span>费用</span> {product.pricing}{product.pricingVerifiedAt && <small> · 核验于 {product.pricingVerifiedAt}</small>}</p>
            {product.note && <small>{product.note}</small>}
            <div className="directory__links">
              <a href={product.url} target="_blank" rel="noopener noreferrer" aria-label={`${product.name}：产品官网（新标签页）`}>产品官网 <span aria-hidden="true">↗</span></a>
              {product.pricingUrl && product.pricingUrl !== product.url &&
                <a href={product.pricingUrl} target="_blank" rel="noopener noreferrer" aria-label={`${product.name}：查看定价（新标签页）`}>查看定价 <span aria-hidden="true">↗</span></a>}
            </div>
          </article>)}
        </div> : <p className="directory__empty">没有找到工具。试试调整搜索词或类别。</p>}
        <footer className="directory__foot">目录更新于 <time dateTime={data.meta.updatedAt}>{data.meta.updatedAt}</time> · 可用性与定价以官网为准</footer>
      </section>
    </div>
  </main>
}
