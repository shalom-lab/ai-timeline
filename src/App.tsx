import { useMemo, useState, useCallback, useEffect } from 'react'
import { timelineData } from './data'
import type {
  Category,
  EventType,
  ProductSubcategory,
  TimelineEvent,
} from './types/timeline'
import { BOARD_CATEGORY_ORDER } from './lib/labels'
import Header, { type Filters } from './components/Header'
import TimelineRail from './components/TimelineRail'
import CategoryColumn from './components/CategoryColumn'
import DetailDrawer from './components/DetailDrawer'

const DEFAULT_FILTERS: Filters = {
  query: '',
  year: 'all',
  company: 'all',
  category: 'all',
  productSubcategory: 'all',
  eventType: 'all',
}

function matchesQuery(e: TimelineEvent, q: string): boolean {
  if (!q) return true
  const hay = [
    e.title,
    e.summary,
    e.company,
    e.series ?? '',
    e.product ?? '',
    ...(e.tags ?? []),
    ...e.sources.map((s) => s.title),
  ]
    .join(' ')
    .toLowerCase()
  return hay.includes(q)
}

export default function App() {
  const { meta, companies, events } = timelineData
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Record<Category, boolean>>({
    model: false,
    product: false,
    concept: false,
    other: false,
  })
  const [subFilters, setSubFilters] = useState<Record<Category, string>>({
    model: 'all',
    product: 'all',
    concept: 'all',
    other: 'all',
  })

  const years = useMemo(() => {
    const set = new Set(events.map((e) => e.date.slice(0, 4)))
    return [...set].sort()
  }, [events])

  const eventTypesPresent = useMemo(() => {
    const set = new Set(events.map((e) => e.eventType))
    return [...set] as EventType[]
  }, [events])

  const productSubsPresent = useMemo(() => {
    const set = new Set(
      events
        .map((e) => e.productSubcategory)
        .filter((x): x is ProductSubcategory => Boolean(x)),
    )
    return [...set]
  }, [events])

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    return events
      .filter((e) => {
        if (filters.year !== 'all' && !e.date.startsWith(filters.year)) {
          return false
        }
        if (filters.company !== 'all' && e.company !== filters.company) {
          return false
        }
        if (filters.category !== 'all' && e.category !== filters.category) {
          return false
        }
        if (
          filters.productSubcategory !== 'all' &&
          e.productSubcategory !== filters.productSubcategory
        ) {
          return false
        }
        if (filters.eventType !== 'all' && e.eventType !== filters.eventType) {
          return false
        }
        if (!matchesQuery(e, q)) return false
        return true
      })
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [events, filters])

  const byCategory = useMemo(() => {
    const map: Record<Category, TimelineEvent[]> = {
      model: [],
      product: [],
      concept: [],
      other: [],
    }
    for (const e of filtered) {
      map[e.category].push(e)
    }
    return map
  }, [filtered])

  const selected = useMemo(
    () => filtered.find((e) => e.id === selectedId) ?? null,
    [filtered, selectedId],
  )

  // Drop selection if filtered out
  useEffect(() => {
    if (selectedId && !filtered.some((e) => e.id === selectedId)) {
      setSelectedId(null)
    }
  }, [filtered, selectedId])

  const patchFilters = useCallback((patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }))
  }, [])

  const toggleCollapse = useCallback((cat: Category) => {
    setCollapsed((c) => {
      const next = { ...c, [cat]: !c[cat] }
      // Never collapse all four — keep at least one open for flex focus UX
      if (BOARD_CATEGORY_ORDER.every((k) => next[k])) {
        return c
      }
      return next
    })
  }, [])

  const focusOnly = useCallback((cat: Category) => {
    setCollapsed({
      model: cat !== 'model',
      product: cat !== 'product',
      concept: cat !== 'concept',
      other: cat !== 'other',
    })
  }, [])

  const expandedCount = BOARD_CATEGORY_ORDER.filter((c) => !collapsed[c]).length

  return (
    <div className={`app-shell${selected ? ' has-drawer' : ''}`}>
      <Header
        meta={meta}
        years={years}
        companies={companies}
        eventTypesPresent={eventTypesPresent}
        productSubsPresent={productSubsPresent}
        filters={filters}
        onChange={patchFilters}
        eventCount={filtered.length}
      />

      <div className="board">
        <TimelineRail
          events={filtered}
          companies={companies}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <div
          className="board__columns"
          style={{ ['--expanded' as string]: String(Math.max(expandedCount, 1)) }}
        >
          {BOARD_CATEGORY_ORDER.map((cat) => (
            <div
              key={cat}
              className={`board__col-slot${collapsed[cat] ? ' is-collapsed' : ''}`}
              onDoubleClick={() => focusOnly(cat)}
              title={
                collapsed[cat]
                  ? `点击展开「${cat}」；双击仅看本列`
                  : '点击标题折叠；双击仅看本列'
              }
            >
              <CategoryColumn
                category={cat}
                events={byCategory[cat]}
                companies={companies}
                collapsed={collapsed[cat]}
                onToggleCollapse={() => toggleCollapse(cat)}
                subFilter={subFilters[cat]}
                onSubFilter={(key) =>
                  setSubFilters((s) => ({ ...s, [cat]: key }))
                }
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
          ))}
        </div>

        {selected ? (
          <DetailDrawer
            event={selected}
            companies={companies}
            list={filtered}
            onClose={() => setSelectedId(null)}
            onSelect={setSelectedId}
          />
        ) : null}
      </div>
    </div>
  )
}
