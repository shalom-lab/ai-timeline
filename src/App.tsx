import { useMemo, useState, useCallback, useEffect } from 'react'
import { timelineData, capabilityFrontierData, aiToolsData } from './data'
import type { Category, TimelineEvent } from './types/timeline'
import type { CapabilityMonth } from './types/capability'
import { CATEGORY_LABEL_ZH } from './lib/labels'
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
  science: [],
  other: [],
}

/** 4 tabs: 大模型 / 产品 / 科学 / 能力边界 (frontier-only; no timeline event cards mixed in). */
type BoardTab = 'model' | 'product' | 'science' | 'frontier'

const BOARD_TABS: readonly { id: BoardTab; label: string }[] = [
  { id: 'model', label: CATEGORY_LABEL_ZH.model },
  { id: 'product', label: CATEGORY_LABEL_ZH.product },
  { id: 'science', label: CATEGORY_LABEL_ZH.science },
  { id: 'frontier', label: '能力边界' },
] as const

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
  const [activeTab, setActiveTab] = useState<BoardTab>('model')
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

  const frontierScenarioCount = useMemo(
    () => frontierMonths.reduce((n, m) => n + m.new.length, 0),
    [frontierMonths],
  )

  const tabCounts: Record<BoardTab, number> = {
    model: byCategory.model.length,
    product: byCategory.product.length,
    science: byCategory.science.length,
    frontier: frontierScenarioCount,
  }

  /**
   * Rail sources only (cards are dense-packed, not driven by this layout).
   * Active tab contracts rail to that panel's visible dates.
   */
  const railSources = useMemo((): LayoutSource[] => {
    if (activeTab === 'frontier') {
      return frontierMonthsToLayoutSources(frontierMonths)
    }
    return visibleCategoryEvents(
      activeTab,
      byCategory[activeTab],
      subFilters[activeTab],
      companies,
    )
  }, [activeTab, byCategory, subFilters, companies, frontierMonths])

  const railLayout = useMemo(
    () => buildTimelineLayout(railSources),
    [railSources],
  )

  const railEvents = useMemo((): TimelineEvent[] => {
    if (activeTab === 'frontier') {
      // 能力边界 rail is month markers only (no timeline event cards).
      return []
    }
    return visibleCategoryEvents(
      activeTab,
      byCategory[activeTab],
      subFilters[activeTab],
      companies,
    )
  }, [activeTab, byCategory, subFilters, companies])

  useEffect(() => {
    if (detailId && !filtered.some((e) => e.id === detailId)) {
      setDetailId(null)
    }
  }, [filtered, detailId])

  // Drop hover/pin when the event leaves the filtered set.
  useEffect(() => {
    if (hoverRailId && !byId.has(hoverRailId)) setHoverRailId(null)
  }, [byId, hoverRailId])

  useEffect(() => {
    if (bumpPinId && !byId.has(bumpPinId)) setBumpPinId(null)
  }, [byId, bumpPinId])

  // Clear hover/pin when switching tabs so the line matches the view.
  useEffect(() => {
    setHoverRailId(null)
    setBumpPinId(null)
  }, [activeTab])

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

  const onSelectTab = useCallback((tab: string) => {
    setActiveTab(tab as BoardTab)
    setDetailId(null)
  }, [])

  /**
   * Bump connectors: hover → dashed (no mute); click-pin → solid + 灰白.
   * Only for the active category tab (not 能力边界).
   */
  const bumpPinned = bumpPinId != null
  const bumpFocusId = bumpPinId ?? hoverRailId
  const focusEvent = bumpFocusId ? byId.get(bumpFocusId) ?? null : null
  const bumpFocusDate = focusEvent?.date ?? null
  const bumpCategory: Category | null =
    activeTab === 'frontier' ? null : activeTab
  const bumpActive = bumpFocusId != null && bumpCategory != null

  const selectEventFromFrontier = useCallback(
    (id: string) => {
      const ev = events.find((e) => e.id === id)
      if (
        ev &&
        (ev.category === 'model' ||
          ev.category === 'product' ||
          ev.category === 'science')
      ) {
        setActiveTab(ev.category)
      }
      setDetailId(id)
      requestAnimationFrame(() => focusCard(id))
    },
    [events],
  )

  const categoryColumnProps = {
    companies,
    detailId,
    onOpenDetail: handleOpenDetail,
    onPinMoment: handlePinMoment,
    onCloseDetail: handleCloseDetail,
  }

  const boardHasChipHead = activeTab !== 'frontier'

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
        <div
          className={`board${boardHasChipHead ? '' : ' board--no-col-head'}`}
        >
          <TimelineRail
            events={railEvents}
            companies={companies}
            hoverId={hoverRailId}
            onHover={setHoverRailId}
            pinId={bumpPinId}
            onTogglePin={handleRailTogglePin}
            layout={railLayout}
            frontierMode={activeTab === 'frontier'}
          />

          <div className="board__main">
            <nav className="board-tabs" aria-label="分类切换">
              {BOARD_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`board-tabs__btn${activeTab === t.id ? ' is-active' : ''}`}
                  aria-current={activeTab === t.id ? 'page' : undefined}
                  onClick={() => onSelectTab(t.id)}
                >
                  <span>{t.label}</span>
                  <em className="board-tabs__count">{tabCounts[t.id]}</em>
                </button>
              ))}
            </nav>

            <div className="board__columns">
              {activeTab === 'frontier' ? (
                <div className="board__col-slot board__col-slot--stack">
                  <FrontierColumn
                    months={frontierMonths}
                    onSelectEvent={selectEventFromFrontier}
                    omitTitle
                  />
                </div>
              ) : (
                <div className="board__col-slot">
                  <CategoryColumn
                    category={activeTab}
                    events={byCategory[activeTab]}
                    subFilter={subFilters[activeTab]}
                    onSubFilter={(keys) =>
                      setSubFilters((s) => ({ ...s, [activeTab]: keys }))
                    }
                    bumpActive={bumpActive && bumpCategory === activeTab}
                    bumpFocusDate={
                      bumpActive && bumpCategory === activeTab
                        ? bumpFocusDate
                        : null
                    }
                    bumpFocusId={
                      bumpActive && bumpCategory === activeTab
                        ? bumpFocusId
                        : null
                    }
                    bumpSolid={bumpPinned && bumpCategory === activeTab}
                    bumpMuteFuture={bumpPinned && bumpCategory === activeTab}
                    omitTitle
                    {...categoryColumnProps}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
