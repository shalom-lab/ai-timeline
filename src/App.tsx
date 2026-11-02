import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { timelineData, aiToolsData } from './data'
import type { Category, TimelineEvent } from './types/timeline'
import { CATEGORY_LABEL_ZH } from './lib/labels'
import { groupKeyForEvent } from './lib/group'
import {
  inDateWindow,
  inDayWindow,
  localMonth,
  earliestMonth,
  clampDateWindow,
  recentDayWindow,
  recentMonthsCount,
  type DateWindow,
} from './lib/calendar'
import type { RecentPreset } from './components/RecentRange'
import Header, { type Filters } from './components/Header'
import TimelineRail from './components/TimelineRail'
import CategoryColumn from './components/CategoryColumn'
import ToolsMatrix from './components/ToolsMatrix'
import { buildTimelineLayout, type LayoutSource } from './lib/timelineLayout'
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

/** 3 tabs: 大模型 / 产品 / 科学 */
type BoardTab = 'model' | 'product' | 'science'

const BOARD_TABS: readonly { id: BoardTab; label: string }[] = [
  { id: 'model', label: CATEGORY_LABEL_ZH.model },
  { id: 'product', label: CATEGORY_LABEL_ZH.product },
  { id: 'science', label: CATEGORY_LABEL_ZH.science },
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

function buildDefaultDateWindow(eventDates: Iterable<string>): DateWindow {
  const end = localMonth()
  const min = earliestMonth([...eventDates], end)
  return clampDateWindow({ start: min, end }, min, end)
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
  /** 既往 = history slider window; 最近 = rolling N months from today (or custom). */
  const [railMode, setRailMode] = useState<'history' | 'recent'>('history')
  const monthBounds = useMemo(() => {
    const end = localMonth()
    const min = earliestMonth(
      events.map((e) => e.date),
      end,
    )
    return { min, max: end }
  }, [events])
  const [dateWindow, setDateWindow] = useState<DateWindow>(() =>
    buildDefaultDateWindow(timelineData.events.map((e) => e.date)),
  )
  /** 「最近」preset — default 1个月; 12个月 chip editable N (default 12); session state. */
  const [recentPreset, setRecentPreset] = useState<RecentPreset>('1m')
  const [recentCustomMonths, setRecentCustomMonths] = useState(12)

  const recentMonths = useMemo(
    () => recentMonthsCount(recentPreset, recentCustomMonths),
    [recentPreset, recentCustomMonths],
  )
  const recentWindow = useMemo(
    () => recentDayWindow(recentMonths),
    [recentMonths],
  )
  /** History uses month DateWindow; recent uses day rolling window — keep separate keys for effects. */
  const filterKey = railMode === 'recent' ? recentWindow.start + recentWindow.end : `${dateWindow.start}:${dateWindow.end}`

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    return events
      .filter((e) => matchesQuery(e, q))
      .filter((e) =>
        railMode === 'recent'
          ? inDayWindow(e.date, recentWindow)
          : inDateWindow(e.date, dateWindow),
      )
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [events, filters, railMode, recentWindow, dateWindow])

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

  const tabCounts: Record<BoardTab, number> = {
    model: byCategory.model.length,
    product: byCategory.product.length,
    science: byCategory.science.length,
  }

  /**
   * Rail sources only (cards are dense-packed, not driven by this layout).
   * Active tab contracts rail to that panel's visible dates.
   */
  const railSources = useMemo((): LayoutSource[] => {
    return visibleCategoryEvents(
      activeTab,
      byCategory[activeTab],
      subFilters[activeTab],
      companies,
    )
  }, [activeTab, byCategory, subFilters, companies])

  const railLayout = useMemo(
    () => buildTimelineLayout(railSources),
    [railSources],
  )

  const railEvents = useMemo((): TimelineEvent[] => {
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

  // Clear hover/pin when switching tabs or rail mode so the line matches the view.
  useEffect(() => {
    setHoverRailId(null)
    setBumpPinId(null)
  }, [activeTab, railMode, filterKey])

  const handleRailModeChange = useCallback((mode: 'history' | 'recent') => {
    setRailMode(mode)
  }, [])

  /** Selecting 12个月 from another preset resets N to 12; editing N keeps custom months. */
  const handleRecentPresetChange = useCallback(
    (preset: RecentPreset) => {
      if (preset === '12m' && recentPreset !== '12m') {
        setRecentCustomMonths(12)
      }
      setRecentPreset(preset)
    },
    [recentPreset],
  )

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
   * Only for the active category tab.
   */
  const bumpPinned = bumpPinId != null
  const bumpFocusId = bumpPinId ?? hoverRailId
  const focusEvent = bumpFocusId ? byId.get(bumpFocusId) ?? null : null
  const bumpFocusDate = focusEvent?.date ?? null
  const bumpCategory: Category | null = activeTab
  const bumpActive = bumpFocusId != null && bumpCategory != null

  const categoryColumnProps = {
    companies,
    detailId,
    onOpenDetail: handleOpenDetail,
    onPinMoment: handlePinMoment,
    onCloseDetail: handleCloseDetail,
  }

  const boardScrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    boardScrollRef.current?.scrollTo({ top: 0, left: 0 })
  }, [activeTab, railMode, filterKey])

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
            mode={railMode}
            onModeChange={handleRailModeChange}
            dateWindow={dateWindow}
            onDateWindowChange={setDateWindow}
            minMonth={monthBounds.min}
            maxMonth={monthBounds.max}
            recentPreset={recentPreset}
            onRecentPresetChange={handleRecentPresetChange}
            recentCustomMonths={recentCustomMonths}
            onRecentCustomMonthsChange={setRecentCustomMonths}
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

            <div className="board__columns" ref={boardScrollRef}>
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
