import { useMemo, useState, useCallback, useEffect } from 'react'
import { timelineData, capabilityFrontierData, aiToolsData } from './data'
import type { Category, TimelineEvent } from './types/timeline'
import type { CapabilityMonth } from './types/capability'
import { BOARD_CATEGORY_ORDER } from './lib/labels'
import { groupKeyForEvent } from './lib/group'
import Header, { type Filters } from './components/Header'
import TimelineRail from './components/TimelineRail'
import CategoryColumn from './components/CategoryColumn'
import FrontierColumn from './components/FrontierColumn'
import ToolsMatrix from './components/ToolsMatrix'
import {
  buildTimelineLayout,
  frontierMonthsToLayoutSources,
  type LayoutSource,
} from './lib/timelineLayout'
import {
  type AppPage,
  pageFromHash,
  navigate as navigateHash,
} from './lib/route'

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
  const [page, setPage] = useState<AppPage>(() => pageFromHash())
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  /** Detail popover (card top-bar click). */
  const [detailId, setDetailId] = useState<string | null>(null)
  const [solo, setSolo] = useState<SoloTarget | null>(null)
  const [subFilters, setSubFilters] = useState<Record<Category, string[]>>(EMPTY_SUB)
  /** Rail hover — dashed same-moment line (no 灰白). */
  const [hoverRailId, setHoverRailId] = useState<string | null>(null)
  /** Rail click-pin — solid same-moment line + 灰白 for later cards and rail below. */
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
    if (detailId && !filtered.some((e) => e.id === detailId)) {
      setDetailId(null)
    }
  }, [filtered, detailId])

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

  /** Rail only: toggle solid same-moment line + 灰白. Never touches card outline/detail. */
  const handleRailTogglePin = useCallback((id: string) => {
    setBumpPinId((prev) => (prev === id ? null : id))
  }, [])

  /** Clear rail pin → restore full-color rail (and card 灰白). */
  const clearBumpPin = useCallback(() => {
    setBumpPinId(null)
    setHoverRailId(null)
  }, [])

  // Esc clears rail pin (DetailPopover Esc still closes detail independently).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      clearBumpPin()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [clearBumpPin])

  // Click outside rail + cards clears bump pin (card body / rail toggle pin themselves).
  useEffect(() => {
    if (!bumpPinId) return
    const onDown = (e: MouseEvent) => {
      const t = e.target
      if (!(t instanceof Element)) return
      if (t.closest('.timeline-rail')) return
      if (t.closest('.event-card')) return
      if (t.closest('.detail-popover')) return
      clearBumpPin()
    }
    const tid = window.setTimeout(() => {
      document.addEventListener('mousedown', onDown)
    }, 0)
    return () => {
      window.clearTimeout(tid)
      document.removeEventListener('mousedown', onDown)
    }
  }, [bumpPinId, clearBumpPin])

  /** Card top bar → open detail popover. */
  const handleOpenDetail = useCallback((id: string) => {
    setDetailId(id)
  }, [])

  /**
   * Card main body → same as left rail node click:
   * toggle solid same-moment H lines + 灰白 (cards after + rail below).
   * Does not open detail.
   */
  const handlePinMoment = useCallback((id: string) => {
    setDetailId(null)
    setBumpPinId((prev) => (prev === id ? null : id))
  }, [])

  /** Close detail popover. */
  const handleCloseDetail = useCallback(() => {
    setDetailId(null)
  }, [])

  // Click empty area (not detail / rail / cards) → close detail.
  useEffect(() => {
    if (!detailId) return
    const onDown = (e: MouseEvent) => {
      const t = e.target
      if (!(t instanceof Element)) return
      if (t.closest('.detail-popover')) return
      if (t.closest('.timeline-rail')) return
      // Header re-opens / stays; body handler closes detail itself.
      const card = document.querySelector(
        `[data-event-id="${CSS.escape(detailId)}"]`,
      )
      if (card && card.contains(t)) return
      setDetailId(null)
    }
    const tid = window.setTimeout(() => {
      document.addEventListener('mousedown', onDown)
    }, 0)
    return () => {
      window.clearTimeout(tid)
      document.removeEventListener('mousedown', onDown)
    }
  }, [detailId])

  const patchFilters = useCallback((patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }))
  }, [])

  useEffect(() => {
    const sync = () => setPage(pageFromHash())
    window.addEventListener('hashchange', sync)
    sync()
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const onNavigate = useCallback((next: AppPage) => {
    setFilters(DEFAULT_FILTERS)
    navigateHash(next)
    setPage(next)
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

  const selectEventFromFrontier = useCallback((id: string) => {
    setSolo(null)
    // Jump + open detail (user picked a specific event).
    setDetailId(id)
    requestAnimationFrame(() => focusCard(id))
  }, [])

  return (
    <div className="app-shell">
      <Header
        meta={meta}
        filters={filters}
        onChange={patchFilters}
        eventCount={filtered.length}
        page={page}
        onNavigate={onNavigate}
        toolsCount={aiToolsData.rows.length}
      />

      {page === 'tools' ? (
        <ToolsMatrix
          data={aiToolsData}
          companies={companies}
          query={filters.query}
        />
      ) : (
      <div className="board">
        <TimelineRail
          events={railEvents}
          companies={companies}
          hoverId={hoverRailId}
          onHover={setHoverRailId}
          pinId={bumpPinId}
          onTogglePin={handleRailTogglePin}
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
                  setDetailId(null)
                  setBumpPinId(null)
                }}
                onExitSolo={() => setSolo(null)}
                subFilter={subFilters[cat]}
                onSubFilter={(keys) =>
                  setSubFilters((s) => ({ ...s, [cat]: keys }))
                }
                detailId={detailId}
                onOpenDetail={handleOpenDetail}
                onPinMoment={handlePinMoment}
                onCloseDetail={handleCloseDetail}
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
                  setDetailId(null)
                  setBumpPinId(null)
                }}
                onExitSolo={() => setSolo(null)}
                onSelectEvent={selectEventFromFrontier}
              />
            </div>
          ) : null}
        </div>
      </div>
      )}
    </div>
  )
}
