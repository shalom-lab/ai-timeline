import { useMemo, useState, useCallback, useEffect } from 'react'
import { timelineData } from './data'
import type { Category, TimelineEvent } from './types/timeline'
import { BOARD_CATEGORY_ORDER } from './lib/labels'
import Header, { type Filters } from './components/Header'
import TimelineRail from './components/TimelineRail'
import CategoryColumn from './components/CategoryColumn'

const DEFAULT_FILTERS: Filters = {
  query: '',
  year: 'all',
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
  const [soloCategory, setSoloCategory] = useState<Category | null>(null)
  const [subFilters, setSubFilters] = useState<Record<Category, string>>({
    model: 'all',
    product: 'all',
    concept: 'all',
    science: 'all',
    other: 'all',
  })

  const years = useMemo(() => {
    const set = new Set(events.map((e) => e.date.slice(0, 4)))
    return [...set].sort()
  }, [events])

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    return events
      .filter((e) => {
        if (filters.year !== 'all' && !e.date.startsWith(filters.year)) {
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
      science: [],
      other: [],
    }
    for (const e of filtered) {
      map[e.category].push(e)
    }
    return map
  }, [filtered])

  useEffect(() => {
    if (selectedId && !filtered.some((e) => e.id === selectedId)) {
      setSelectedId(null)
    }
  }, [filtered, selectedId])

  const patchFilters = useCallback((patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }))
  }, [])

  const visibleCategories = soloCategory
    ? BOARD_CATEGORY_ORDER.filter((c) => c === soloCategory)
    : BOARD_CATEGORY_ORDER

  return (
    <div className="app-shell">
      <Header
        meta={meta}
        years={years}
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
          className={`board__columns${soloCategory ? ' is-solo-mode' : ''}`}
        >
          {visibleCategories.map((cat) => (
            <div key={cat} className="board__col-slot">
              <CategoryColumn
                category={cat}
                events={byCategory[cat]}
                companies={companies}
                isSolo={soloCategory === cat}
                onSolo={() => {
                  setSoloCategory(cat)
                  setSelectedId(null)
                }}
                onExitSolo={() => setSoloCategory(null)}
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
      </div>
    </div>
  )
}
