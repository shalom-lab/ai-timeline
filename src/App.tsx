import { useMemo, useState, useCallback, useEffect } from 'react'
import { timelineData, capabilityFrontierData } from './data'
import type { Category, TimelineEvent } from './types/timeline'
import type { CapabilityMonth } from './types/capability'
import { BOARD_CATEGORY_ORDER } from './lib/labels'
import Header, { type Filters } from './components/Header'
import TimelineRail from './components/TimelineRail'
import CategoryColumn from './components/CategoryColumn'
import FrontierColumn from './components/FrontierColumn'
import { buildTimelineLayout } from './lib/timelineLayout'

const DEFAULT_FILTERS: Filters = {
  query: '',
}

const EMPTY_SUB: Record<Category, string[]> = {
  model: [],
  product: [],
  concept: [],
  science: [],
  other: [],
}

type SoloTarget = Category | 'frontier'

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

function filterFrontierMonths(
  months: CapabilityMonth[],
  q: string,
): CapabilityMonth[] {
  if (!q) return months
  const out: CapabilityMonth[] = []
  for (const m of months) {
    const monthHit =
      m.month.includes(q) ||
      m.summary.toLowerCase().includes(q) ||
      `能力边界`.includes(q) ||
      `工作场景`.includes(q)
    const neu = m.new.filter((w) => {
      const hay = [
        w.title,
        w.detail ?? '',
        w.emoji ?? '',
        ...(w.tags ?? []),
        ...(w.enabledBy ?? []),
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
    if (monthHit) {
      out.push(m)
    } else if (neu.length > 0) {
      out.push({ ...m, new: neu })
    }
  }
  return out
}

function focusCard(id: string) {
  const el = document.querySelector<HTMLElement>(
    `[data-event-id="${CSS.escape(id)}"]`,
  )
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
}

export default function App() {
  const { meta, companies, events } = timelineData
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [solo, setSolo] = useState<SoloTarget | null>(null)
  const [subFilters, setSubFilters] = useState<Record<Category, string[]>>(EMPTY_SUB)

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    return events
      .filter((e) => matchesQuery(e, q))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [events, filters])

  const frontierMonths = useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    return filterFrontierMonths(capabilityFrontierData.months, q)
  }, [filters])

  /** Shared rail ↔ card vertical positions (all search-filtered events). */
  const layout = useMemo(() => buildTimelineLayout(filtered), [filtered])

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

  useEffect(() => {
    if (!solo) return
    if (solo === 'frontier') {
      if (frontierMonths.length === 0) setSolo(null)
      return
    }
    if (byCategory[solo].length === 0) setSolo(null)
  }, [solo, byCategory, frontierMonths])

  const patchFilters = useCallback((patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }))
  }, [])

  const categoriesWithEvents = BOARD_CATEGORY_ORDER.filter(
    (c) => byCategory[c].length > 0,
  )

  const showFrontier = frontierMonths.length > 0
  const soloCategory = solo && solo !== 'frontier' ? solo : null

  const visibleCategories =
    solo === 'frontier'
      ? []
      : soloCategory
        ? categoriesWithEvents.filter((c) => c === soloCategory)
        : categoriesWithEvents

  const showFrontierColumn =
    showFrontier && (solo === null || solo === 'frontier')

  const selectEventFromFrontier = useCallback(
    (id: string) => {
      setSolo(null)
      setSelectedId(id)
      requestAnimationFrame(() => focusCard(id))
    },
    [],
  )

  return (
    <div className="app-shell">
      <Header
        meta={meta}
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
          layout={layout}
        />

        <div
          className={`board__columns${solo ? ' is-solo-mode' : ''}`}
        >
          {visibleCategories.map((cat) => (
            <div key={cat} className="board__col-slot">
              <CategoryColumn
                category={cat}
                events={byCategory[cat]}
                companies={companies}
                isSolo={solo === cat}
                onSolo={() => {
                  setSolo(cat)
                  setSelectedId(null)
                }}
                onExitSolo={() => setSolo(null)}
                subFilter={subFilters[cat]}
                onSubFilter={(keys) =>
                  setSubFilters((s) => ({ ...s, [cat]: keys }))
                }
                selectedId={selectedId}
                onSelect={setSelectedId}
                layout={layout}
              />
            </div>
          ))}

          {showFrontierColumn ? (
            <div key="frontier" className="board__col-slot board__col-slot--frontier">
              <FrontierColumn
                months={frontierMonths}
                isSolo={solo === 'frontier'}
                onSolo={() => {
                  setSolo('frontier')
                  setSelectedId(null)
                }}
                onExitSolo={() => setSolo(null)}
                onSelectEvent={selectEventFromFrontier}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
