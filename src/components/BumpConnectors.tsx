import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react'

/** Anchor at mid-gap below card. */
type Anchor = {
  id: string
  date: string
  x: number
  /** Midpoint of vertical gap below the card (not the card bottom border). */
  y: number
  top: number
  bottom: number
  left: number
  right: number
  colLeft: number
  colRight: number
}

type Props = {
  /** Category column body (positioned ancestor for overlay coords). */
  containerRef: RefObject<HTMLElement | null>
  /** Visible event ids (any order — same-moment peers are filtered by focusDate). */
  orderedIds: string[]
  /** Parallel dates (YYYY-MM-DD) for orderedIds. */
  orderedDates: string[]
  /** When false, connectors stay hidden (default). */
  active: boolean
  /** Focus date: same-moment slice. */
  focusDate: string | null
  /** Focus event id — preferred date source when set. */
  focusId?: string | null
  /** Click-pin: solid stroke. Hover (unpinned): dashed. */
  solid?: boolean
}

const STROKE = 'rgba(234, 88, 12, 0.85)'
const STROKE_WIDTH = 2
const DASH = '7 5'
/** Fallback card gap when a column has no measurable inter-card gap (~0.55rem). */
const FALLBACK_GAP_PX = 9
/** Inset from company column edges for peer H ticks. */
const COL_INSET = 4
const LABEL_FONT = 10
const LABEL_PAD_X = 5

/**
 * Y at the midpoint of the vertical gap below `card` within its company column.
 * If no card below, place at half the typical inter-card gap beneath the bottom.
 */
function midGapY(card: Anchor, columnPeers: Anchor[]): number {
  const below = columnPeers
    .filter((c) => c.id !== card.id && c.top >= card.bottom - 0.5)
    .sort((a, b) => a.top - b.top)
  if (below.length > 0) {
    return (card.bottom + below[0].top) / 2
  }

  const sorted = [...columnPeers].sort((a, b) => a.top - b.top)
  let gapSum = 0
  let gapN = 0
  for (let i = 0; i < sorted.length - 1; i++) {
    const g = sorted[i + 1].top - sorted[i].bottom
    if (g > 0.5) {
      gapSum += g
      gapN++
    }
  }
  const gap = gapN > 0 ? gapSum / gapN : FALLBACK_GAP_PX
  return card.bottom + gap / 2
}

/** Compact date for the H-line center label. Prefer YYYY-MM-DD. */
function formatMomentDate(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  return iso
}

type HSeg = {
  id: string
  x1: number
  x2: number
  y: number
  date: string
}

/**
 * Independent mid-gap H under each same-date peer card.
 * No vertical gutter stairs — multiple companies = multiple separate H ticks.
 */
function momentHSegments(peers: Anchor[]): HSeg[] {
  return peers.map((p) => {
    const x1 = p.colLeft + COL_INSET
    const x2 = Math.max(x1 + 12, p.colRight - COL_INSET)
    return {
      id: p.id,
      x1,
      x2,
      y: p.y,
      date: p.date,
    }
  })
}

/**
 * Intra-category same-moment bump: one short H under each matching company
 * card (mid-gap) with a centered date label. No V connectors.
 */
export default function BumpConnectors({
  containerRef,
  orderedIds,
  orderedDates,
  active,
  focusDate,
  focusId = null,
  solid = false,
}: Props) {
  const [pts, setPts] = useState<Anchor[]>([])
  const [size, setSize] = useState({ w: 0, h: 0 })

  const measure = useCallback(() => {
    const root = containerRef.current
    if (!root) {
      setPts([])
      setSize({ w: 0, h: 0 })
      return
    }

    const w = Math.max(root.scrollWidth, root.clientWidth)
    const h = Math.max(root.scrollHeight, root.clientHeight)
    setSize({ w, h })

    const rootBox = root.getBoundingClientRect()

    if (orderedIds.length < 1) {
      setPts([])
      return
    }

    const raw: Anchor[] = []
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i]
      const el = root.querySelector<HTMLElement>(
        `[data-event-id="${CSS.escape(id)}"]`,
      )
      if (!el) continue
      const r = el.getBoundingClientRect()
      const left = r.left - rootBox.left + root.scrollLeft
      const top = r.top - rootBox.top + root.scrollTop
      const bottom = top + r.height
      const sub = el.closest('.cat-subcol')
      let colLeft = left
      let colRight = left + r.width
      if (sub) {
        const sr = sub.getBoundingClientRect()
        colLeft = sr.left - rootBox.left + root.scrollLeft
        colRight = colLeft + sr.width
      }
      raw.push({
        id,
        date: orderedDates[i] ?? '',
        x: left + r.width / 2,
        y: bottom,
        top,
        bottom,
        left,
        right: left + r.width,
        colLeft,
        colRight,
      })
    }

    const byCol = new Map<string, Anchor[]>()
    for (const a of raw) {
      const key = `${a.colLeft.toFixed(1)}:${a.colRight.toFixed(1)}`
      const list = byCol.get(key)
      if (list) list.push(a)
      else byCol.set(key, [a])
    }
    const next: Anchor[] = []
    for (const group of byCol.values()) {
      for (const a of group) {
        next.push({ ...a, y: midGapY(a, group) })
      }
    }
    setPts(next)
  }, [containerRef, orderedIds, orderedDates])

  const idsKey = orderedIds.join('\0')
  const datesKey = orderedDates.join('\0')

  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    let raf = 0
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        requestAnimationFrame(measure)
      })
    }

    schedule()

    const ro = new ResizeObserver(schedule)
    ro.observe(root)
    for (const id of orderedIds) {
      const el = root.querySelector(`[data-event-id="${CSS.escape(id)}"]`)
      if (el) ro.observe(el)
    }
    root.querySelectorAll('.cat-subcol').forEach((el) => ro.observe(el))

    window.addEventListener('resize', schedule)
    const board = root.closest('.board')
    board?.addEventListener('scroll', schedule, { passive: true })
    const boardCols = root.closest('.board__columns')
    boardCols?.addEventListener('scroll', schedule, { passive: true })

    const t1 = window.setTimeout(schedule, 50)
    const t2 = window.setTimeout(schedule, 200)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', schedule)
      board?.removeEventListener('scroll', schedule)
      boardCols?.removeEventListener('scroll', schedule)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, idsKey, datesKey, measure])

  const resolvedDate = useMemo(() => {
    if (focusId) {
      const hit = pts.find((p) => p.id === focusId)
      if (hit?.date) return hit.date
    }
    return focusDate
  }, [pts, focusId, focusDate])

  const peers = useMemo(() => {
    if (!resolvedDate) return []
    return pts.filter((p) => p.date === resolvedDate)
  }, [pts, resolvedDate])

  const segs = useMemo(() => momentHSegments(peers), [peers])

  if (!active || segs.length < 1 || size.w <= 0 || size.h <= 0) return null

  return (
    <svg
      className={`bump-connectors${solid ? ' is-solid' : ' is-dashed'}`}
      width={size.w}
      height={size.h}
      viewBox={`0 0 ${size.w} ${size.h}`}
      aria-hidden
    >
      {segs.map((s) => {
        const label = formatMomentDate(s.date)
        const midX = (s.x1 + s.x2) / 2
        // Approximate text width so we can gap the H stroke around the label.
        const textW = Math.max(48, label.length * 6.2)
        const gapL = midX - textW / 2 - LABEL_PAD_X
        const gapR = midX + textW / 2 + LABEL_PAD_X
        const leftEnd = Math.min(gapL, s.x2)
        const rightStart = Math.max(gapR, s.x1)
        return (
          <g key={s.id} className="bump-connectors__seg">
            {leftEnd > s.x1 + 2 ? (
              <line
                className="bump-connectors__moment"
                x1={s.x1}
                y1={s.y}
                x2={leftEnd}
                y2={s.y}
                stroke={STROKE}
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={solid ? undefined : DASH}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            {rightStart < s.x2 - 2 ? (
              <line
                className="bump-connectors__moment"
                x1={rightStart}
                y1={s.y}
                x2={s.x2}
                y2={s.y}
                stroke={STROKE}
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={solid ? undefined : DASH}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            <text
              className="bump-connectors__date"
              x={midX}
              y={s.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={LABEL_FONT}
              fontWeight={650}
              fill={STROKE}
            >
              {label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
