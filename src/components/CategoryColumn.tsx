import { useMemo, useRef, useState, useCallback, type MouseEvent, type ReactNode } from 'react'
import type { Category, Company, TimelineEvent } from '../types/timeline'
import { CATEGORY_LABEL_ZH, CATEGORY_THEME } from '../lib/labels'
import { buildSubGroups } from '../lib/group'
import EventCard from './EventCard'
import BumpConnectors from './BumpConnectors'

type Props = {
  category: Category
  events: TimelineEvent[]
  companies: Company[]
  /** Selected series/subcategory keys; empty = show all */
  subFilter: string[]
  onSubFilter: (keys: string[]) => void
  /** Detail popover card id (header click). */
  detailId: string | null
  onOpenDetail: (id: string) => void
  /** Same as rail node: pin same-moment H + 灰白. */
  onPinMoment: (id: string) => void
  onCloseDetail: () => void
  /**
   * Show the same-moment slice for this category (hover dashed / pin solid).
   * Default hidden — only the active category gets the line.
   */
  bumpActive?: boolean
  /** Focus date (YYYY-MM-DD): same-moment peers. */
  bumpFocusDate?: string | null
  /** Focus event id — preferred date source for the moment slice. */
  bumpFocusId?: string | null
  /** Click-pin: solid stroke (hover uses dashed). */
  bumpSolid?: boolean
  /** Click-pin only: mute cards after focus date. Hover never mutes. */
  bumpMuteFuture?: boolean
  /** Hide the category title band (e.g. compact「其他」block under 能力边界). */
  hideHeader?: boolean
  /**
   * Skip the redundant category title/count row (tabs already name the panel).
   * Chips stay; head shrinks to the chip row only.
   */
  omitTitle?: boolean
}

const ICONS: Record<Category, ReactNode> = {
  model: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9h6M9 12h6M9 15h4" strokeLinecap="round" />
    </svg>
  ),
  product: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  science: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 3h6M10 3v4.5L5.5 18a3 3 0 0 0 2.7 4.5h7.6A3 3 0 0 0 18.5 18L14 7.5V3" strokeLinejoin="round" />
      <path d="M8 14h8" strokeLinecap="round" />
    </svg>
  ),
  other: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20V10l8-6 8 6v10" strokeLinejoin="round" />
      <path d="M9 20v-6h6v6" />
    </svg>
  ),
}

/** Plain-text chronology for clipboard: label + date + title lines. */
export function formatSubcolChronology(
  label: string,
  events: TimelineEvent[],
): string {
  const lines = [...events]
    .sort(
      (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
    )
    .map((e) => `${e.date}  ${e.title}`)
  return [label, ...lines].join('\n')
}

/** Join several subcol chronologies (blank line between groups). */
export function formatBoardChronology(
  groups: { label: string; events: TimelineEvent[] }[],
): string {
  return groups
    .map((g) => formatSubcolChronology(g.label, g.events))
    .filter((block) => block.length > 0)
    .join('\n\n')
}

async function writeClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Fallback for older / restricted clipboard
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
    } finally {
      document.body.removeChild(ta)
    }
  }
}

function ClipboardIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function SubcolCopyButton({
  label,
  events,
}: {
  label: string
  events: TimelineEvent[]
}) {
  const [copied, setCopied] = useState(false)

  const onCopy = useCallback(
    async (e: MouseEvent) => {
      e.stopPropagation()
      await writeClipboard(formatSubcolChronology(label, events))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    },
    [label, events],
  )

  return (
    <button
      type="button"
      className={`cat-subcol__copy${copied ? ' is-copied' : ''}`}
      onClick={onCopy}
      title={copied ? '已复制' : `复制「${label}」年表`}
      aria-label={copied ? '已复制' : `复制「${label}」年表`}
    >
      {copied ? <CheckIcon /> : <ClipboardIcon />}
    </button>
  )
}

function BoardCopyButton({
  groups,
}: {
  groups: { label: string; events: TimelineEvent[] }[]
}) {
  const [copied, setCopied] = useState(false)
  const n = groups.length
  const tip =
    n <= 1
      ? n === 1
        ? `复制「${groups[0]!.label}」年表`
        : '暂无可复制年表'
      : `复制当前 ${n} 列年表`

  const onCopy = useCallback(
    async (e: MouseEvent) => {
      e.stopPropagation()
      if (groups.length === 0) return
      await writeClipboard(formatBoardChronology(groups))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    },
    [groups],
  )

  return (
    <button
      type="button"
      className={`cat-column__chips-copy${copied ? ' is-copied' : ''}`}
      onClick={onCopy}
      disabled={groups.length === 0}
      title={copied ? '已复制' : tip}
      aria-label={copied ? '已复制' : tip}
    >
      {copied ? <CheckIcon /> : <ClipboardIcon />}
    </button>
  )
}

export default function CategoryColumn({
  category,
  events,
  companies,
  subFilter,
  onSubFilter,
  detailId,
  onOpenDetail,
  onPinMoment,
  onCloseDetail,
  bumpActive = false,
  bumpFocusDate = null,
  bumpFocusId = null,
  bumpSolid = false,
  bumpMuteFuture = false,
  hideHeader = false,
  omitTitle = false,
}: Props) {
  const theme = CATEGORY_THEME[category]
  const bodyRef = useRef<HTMLDivElement>(null)
  const groups = useMemo(
    () => buildSubGroups(category, events, companies),
    [category, events, companies],
  )
  const showAll = subFilter.length === 0
  const visibleGroups = useMemo(
    () => (showAll ? groups : groups.filter((g) => subFilter.includes(g.key))),
    [groups, showAll, subFilter],
  )

  const toggleChip = (key: string) => {
    if (key === 'all') {
      onSubFilter([])
      return
    }
    if (subFilter.includes(key)) {
      onSubFilter(subFilter.filter((k) => k !== key))
    } else {
      onSubFilter([...subFilter, key])
    }
  }

  const multi = visibleGroups.length > 1
  /** Skip chip row when flat / single group — 别强行分 */
  const showChips = groups.length > 1

  const visibleEvents = useMemo(() => {
    const all: TimelineEvent[] = []
    for (const g of visibleGroups) all.push(...g.events)
    return all
  }, [visibleGroups])

  /** Visible events (ids/dates) for measuring same-moment peers; cards stay dense per company. */
  const orderedEvents = useMemo(
    () =>
      [...visibleEvents].sort(
        (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
      ),
    [visibleEvents],
  )

  const orderedIds = useMemo(
    () => orderedEvents.map((e) => e.id),
    [orderedEvents],
  )
  const orderedDates = useMemo(
    () => orderedEvents.map((e) => e.date),
    [orderedEvents],
  )

  const muteFuture = bumpMuteFuture && !!bumpFocusDate

  return (
    <section
      className="cat-column"
      style={{ ['--accent' as string]: theme.accent }}
      aria-label={CATEGORY_LABEL_ZH[category]}
    >
      {hideHeader ? (
        <div className="cat-column__header cat-column__header--compact">
          <span className="cat-column__header-title">
            {CATEGORY_LABEL_ZH[category]}
          </span>
          <span
            className="cat-column__header-count"
            style={{ color: theme.accent, background: theme.headerSoft }}
          >
            {events.length}
          </span>
        </div>
      ) : (
        <div
          className={`cat-column__head${omitTitle ? ' cat-column__head--chips-only' : ''}${!showChips && omitTitle ? ' cat-column__head--empty' : ''}`}
        >
          {!omitTitle ? (
            <div className="cat-column__header">
              <span
                className="cat-column__header-icon"
                style={{ color: theme.accent, background: theme.headerSoft }}
              >
                {ICONS[category]}
              </span>
              <span className="cat-column__header-title">
                {CATEGORY_LABEL_ZH[category]}
              </span>
              <span
                className="cat-column__header-count"
                style={{ color: theme.accent, background: theme.headerSoft }}
              >
                {events.length}
              </span>
            </div>
          ) : null}

          {showChips ? (
            <div className="cat-column__chips" role="group" aria-label="子类多选">
              <button
                type="button"
                className={showAll ? 'is-active' : ''}
                onClick={() => toggleChip('all')}
              >
                全部
              </button>
              {groups.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  className={!showAll && subFilter.includes(g.key) ? 'is-active' : ''}
                  aria-pressed={!showAll && subFilter.includes(g.key)}
                  onClick={() => toggleChip(g.key)}
                >
                  {g.label}
                  <em>{g.events.length}</em>
                </button>
              ))}
              <BoardCopyButton groups={visibleGroups} />
            </div>
          ) : null}
        </div>
      )}

      <div
        ref={bodyRef}
        className={`cat-column__body${multi ? ' has-subcols' : ''}`}
      >
        <BumpConnectors
          containerRef={bodyRef}
          orderedIds={orderedIds}
          orderedDates={orderedDates}
          active={bumpActive}
          focusDate={bumpFocusDate}
          focusId={bumpFocusId}
          solid={bumpSolid}
        />

        {visibleGroups.length === 0 ? (
          <p className="cat-column__empty">暂无匹配事件</p>
        ) : (
          visibleGroups.map((g) => (
            <div key={g.key} className="cat-subcol">
              {multi ? (
                <div className="cat-subcol__label">
                  <span className="cat-subcol__label-text">{g.label}</span>
                  <SubcolCopyButton label={g.label} events={g.events} />
                </div>
              ) : null}
              <div className="cat-subcol__cards">
                {g.events.map((e) => {
                  const isFuture =
                    muteFuture && !!bumpFocusDate && e.date > bumpFocusDate
                  return (
                    <EventCard
                      key={e.id}
                      event={e}
                      companies={companies}
                      detailOpen={detailId === e.id}
                      onOpenDetail={onOpenDetail}
                      onPinMoment={onPinMoment}
                      onCloseDetail={onCloseDetail}
                      isFuture={isFuture}
                    />
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
