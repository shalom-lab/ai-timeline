import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { timelineData, aiToolsData, companiesById } from './data'
import type { TimelineEvent } from './types/timeline'
import Chronology from './components/Chronology'
import Exhibition from './components/Exhibition'
import Header, { type Filters } from './components/Header'
import ToolDirectory from './components/ToolDirectory'
import CompareBoard from './components/CompareBoard'
import { type AppPage, pageFromHash } from './lib/route'

const DEFAULT_FILTERS: Filters = { query: '' }
const isEventView = (page: AppPage) => page === 'timeline' || page === 'compare'

function matchesQuery(e: TimelineEvent, q: string): boolean {
  return !q || [e.title,e.summary,e.company,e.companyId,...(companiesById.get(e.companyId)?.aliases ?? []),e.series??'',e.product??'',...(e.tags??[]),...e.sources.map(s=>s.title)]
    .join(' ').toLowerCase().includes(q)
}

export default function App() {
  const { meta, companies, events } = timelineData
  const [page,setPage] = useState<AppPage>(()=>pageFromHash())
  const currentPage = useRef(page)
  const [filters,setFilters] = useState(DEFAULT_FILTERS)
  const searched = useMemo(()=>{
    const q=filters.query.trim().toLowerCase()
    return events.filter(e=>matchesQuery(e,q))
  },[events,filters.query])
  const patchFilters = useCallback((patch:Partial<Filters>)=>setFilters(f=>({...f,...patch})),[])
  const clearSearch = useCallback(()=>patchFilters({query:''}),[patchFilters])

  useEffect(()=>{
    const sync = () => {
      const hash = window.location.hash
      const next = pageFromHash(hash)
      const previous = currentPage.current
      const eventLink = hash.startsWith('#/event/')
      if (eventLink || (next !== previous && !(isEventView(next) && isEventView(previous)))) {
        setFilters(DEFAULT_FILTERS)
      }
      if (next !== previous && !eventLink) window.scrollTo(0, 0)
      currentPage.current = next
      setPage(next)
    }
    window.addEventListener('hashchange',sync)
    return ()=>window.removeEventListener('hashchange',sync)
  },[])
  return <div className={`app-shell archive-app archive-app--${page}`}>
    <Header meta={meta} filters={filters} onChange={patchFilters} page={page}/>
    {page==='gallery' ? <Exhibition events={events}/> :
      page==='tools' ? <ToolDirectory data={aiToolsData} companies={companies} query={filters.query}/> :
      page==='compare' ? <CompareBoard events={events} searched={searched} companies={companies} onClearSearch={clearSearch}/> :
      <Chronology events={searched} companies={companies} scopeStart={meta.scopeStart}
        onClearSearch={clearSearch} hasQuery={!!filters.query.trim()}/>}
  </div>
}
