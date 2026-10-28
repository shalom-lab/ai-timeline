import { useMemo, useState, useCallback, useEffect } from 'react'
import { timelineData, capabilityFrontierData } from './data'
import type { Category, TimelineEvent } from './types/timeline'
import type { CapabilityMonth } from './types/capability'
import { BOARD_CATEGORY_ORDER } from './lib/labels'
import { groupKeyForEvent } from './lib/group'
import Header, { type Filters } from './components/Header'
import TimelineRail from './components/TimelineRail'
import CategoryColumn from './components/CategoryColumn'
import FrontierColumn from './components/FrontierColumn'
import {
  buildTimelineLayout,
  frontierMonthsToLayoutSources,
  type LayoutSource,
} from './lib/timelineLayout'

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
  el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
}

/** Visible events in a category after series/sub chips (empty chips = all). */
function visibleCategoryEvents(
  category: Category,
  events: TimelineEvent[],
  subKeys: string[],
  companies: typeof timelineData.companies,
): TimelineEvent[] {
  if (subKeys.length === 0) return events
  return events.filter((e) => {
    const { key } = groupKeyForEvent(category, e, companies)
    return subKeys.includes(key)
  })
}

export default function App() {
  const { meta, companies, events } = timelineData
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [solo, setSolo] = useState<SoloTarget | null>(null)
  const [subFilters, setSubFilters] = useState<Record<Category, string[]>>(EMPTY_SUB)
  /** Rail hover — dashed same-moment line (no 灰白). */
  const [hoverRailId, setHoverRailId] = useState<string | null>(null)
  /** Click-pin — solid same-moment line + 灰白 for later cards. */
  const [bumpPinId, setBumpPinId] = useState<string | null>(null)

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

  const byId = useMemo(() => {
    const m = new Map<string, TimelineEvent>()
    for (const e of filtered) m.set(e.id, e)
    return m
  }, [filtered])

  /**
   * Rail sources only (cards are dense-packed, not driven by this layout).
   * Solo contracts to that column / frontier months; multi uses all filtered.
   */
  const railSources = useMemo((): LayoutSource[] => {
    if (solo === 'frontier') {
      return frontierMonthsToLayoutSources(frontierMonths)
    }
    if (solo) {
      return visibleCategoryEvents(
        solo,
        byCategory[solo],
        subFilters[solo],
        companies,
      )
    }
    return filtered
  }, [solo, filtered, byCategory, subFilters, companies, frontierMonths])

  const railLayout = useMemo(
    () => buildTimelineLayout(railSources),
    [railSources],
  )

  const railEvents = useMemo((): TimelineEvent[] => {
    if (solo === 'frontier') return []
    if (solo) {
      return visibleCategoryEvents(
        solo,
        byCategory[solo],
        subFilters[solo],
        companies,
      )
    }
    return filtered
  }, [solo, filtered, byCategory, subFilters, companies])

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

  // Drop hover/pin when the event leaves the filtered set.
  useEffect(() => {
    if (hoverRailId && !byId.has(hoverRailId)) setHoverRailId(null)
  }, [byId, hoverRailId])

  useEffect(() => {
    if (bumpPinId && !byId.has(bumpPinId)) setBumpPinId(null)
  }, [byId, bumpPinId])

  // Clear hover/pin when entering/leaving solo so the line matches the view.
  useEffect(() => {
    setHoverRailId(null)
    setBumpPinId(null)
  }, [solo])

  /** Select card + toggle bump pin (click again clears solid+mute). */
  const handleSelect = useCallback(
    (id: string | null) => {
      if (id == null) {
        setSelectedId(null)
        setBumpPinId(null)
        return
      }
      if (bumpPinId === id) {
        setBumpPinId(null)
        setSelectedId(null)
      } else {
        setBumpPinId(id)
        setSelectedId(id)
      }
    },
    [bumpPinId],
  )

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

  /**
   * Bump connectors: hover → dashed (no mute); click-pin → solid + 灰白.
   * Pin wins over hover for focus. Same-moment slice, not chrono succession.
   */
  const bumpPinned = bumpPinId != null
  const bumpFocusId = bumpPinId ?? hoverRailId
  const focusEvent = bumpFocusId ? byId.get(bumpFocusId) ?? null : null
  const bumpFocusDate = focusEvent?.date ?? null
  /**
   * Which category shows the same-moment line:
   * prefer soloed category; else the category that owns the focus event.
   * Never cross 大模型↔产品.
   */
  const bumpCategory: Category | null = soloCategory
    ? soloCategory
    : (focusEvent?.category ?? null)
  const bumpActive = bumpFocusId != null && bumpCategory != null

  const selectEventFromFrontier = useCallback(
    (id: string) => {
      setSolo(null)
      setSelectedId(id)
      setBumpPinId(id)
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
          events={railEvents}
          companies={companies}
          selectedId={selectedId}
          onSelect={handleSelect}
          hoverId={hoverRailId}
          onHover={setHoverRailId}
          pinId={bumpPinId}
          layout={railLayout}
          frontierSolo={solo === 'frontier'}
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
                  setBumpPinId(null)
                }}
                onExitSolo={() => setSolo(null)}
                subFilter={subFilters[cat]}
                onSubFilter={(keys) =>
                  setSubFilters((s) => ({ ...s, [cat]: keys }))
                }
                selectedId={selectedId}
                onSelect={handleSelect}
                bumpActive={bumpActive && bumpCategory === cat}
                bumpFocusDate={
                  bumpActive && bumpCategory === cat ? bumpFocusDate : null
                }
                bumpFocusId={
                  bumpActive && bumpCategory === cat ? bumpFocusId : null
                }
                bumpSolid={bumpPinned && bumpCategory === cat}
                bumpMuteFuture={bumpPinned && bumpCategory === cat}
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
                  setBumpPinId(null)
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
