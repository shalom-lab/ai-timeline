import { useMemo, useState, useCallback, useEffect } from 'react'
import { timelineData, aiToolsData } from './data'
import type { TimelineEvent } from './types/timeline'
import Chronology from './components/Chronology'
import Exhibition from './components/Exhibition'
import Header, { type Filters } from './components/Header'
import ToolDirectory from './components/ToolDirectory'
import CompareBoard from './components/CompareBoard'
import { type AppPage, pageFromHash, navigate as navigateHash } from './lib/route'

const DEFAULT_FILTERS: Filters = { query: '' }
const isComparison = () => /^#\/compare\/?$/.test(window.location.hash)

function matchesQuery(e: TimelineEvent, q: string): boolean {
  return !q || [e.title,e.summary,e.company,e.series??'',e.product??'',...(e.tags??[]),...e.sources.map(s=>s.title)]
    .join(' ').toLowerCase().includes(q)
}

export default function App() {
  const { meta, companies, events } = timelineData
  const [page,setPage] = useState<AppPage>(()=>pageFromHash())
  const [compare,setCompare] = useState(isComparison)
  const [filters,setFilters] = useState(DEFAULT_FILTERS)
  const searched = useMemo(()=>{
    const q=filters.query.trim().toLowerCase()
    return events.filter(e=>matchesQuery(e,q))
  },[events,filters.query])
  const patchFilters = useCallback((patch:Partial<Filters>)=>setFilters(f=>({...f,...patch})),[])
  const clearSearch = useCallback(()=>patchFilters({query:''}),[patchFilters])

  useEffect(()=>{
    const sync = () => {setPage(pageFromHash());setCompare(isComparison())}
    window.addEventListener('hashchange',sync)
    return ()=>window.removeEventListener('hashchange',sync)
  },[])
  const onNavigate = useCallback((next:AppPage)=>{
    setFilters(DEFAULT_FILTERS)
    navigateHash(next)
    setPage(next)
    setCompare(false)
  },[])
  return <div className={`app-shell archive-app archive-app--${page}${compare?' archive-app--compare':''}`}>
    <Header meta={meta} filters={filters} onChange={patchFilters} page={page} onNavigate={onNavigate}/>
    {page==='gallery' ? <Exhibition events={events}/> :
      page==='tools' ? <ToolDirectory data={aiToolsData} companies={companies} query={filters.query}/> :
      compare ? <CompareBoard events={events} searched={searched} companies={companies} onReturn={()=>onNavigate('timeline')} onClearSearch={clearSearch}/> :
      <Chronology events={searched} companies={companies}
        onCompare={()=>{window.location.hash='#/compare';setCompare(true)}}
        onClearSearch={clearSearch} hasQuery={!!filters.query.trim()}/>}
  </div>
}
