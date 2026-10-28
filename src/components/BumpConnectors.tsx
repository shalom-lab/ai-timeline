import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react'

/** Anchor at mid-gap below card; column box for gutter routing. */
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

type ColBox = { left: number; right: number }

type Pt = { x: number; y: number }

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
/** Treat columns as same when centers are this close (px). */
const SAME_COL_X = 24
/** Push same-column vertical just outside the subcol edge into the seam. */
const SIDE_OUT = 4
/** Inset from category left/right edges for the span caps. */
const EDGE_PAD = 2

function pointsToPath(pts: Pt[]): string {
  if (pts.length === 0) return ''
  const parts = [`M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`]
  for (let i = 1; i < pts.length; i++) {
    parts.push(`L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`)
  }
  return parts.join(' ')
}

function sameColumn(a: Anchor, b: Anchor): boolean {
  if (Math.abs(a.x - b.x) < SAME_COL_X) return true
  const overlap =
    Math.min(a.colRight, b.colRight) - Math.max(a.colLeft, b.colLeft)
  const minW = Math.min(a.colRight - a.colLeft, b.colRight - b.colLeft)
  return minW > 0 && overlap > minW * 0.6
}

/** Midpoint of a real inter-column gap overlapping [facingL, facingR]. */
function pickGutterX(
  facingL: number,
  facingR: number,
  cols: ColBox[],
): number {
  const lo = Math.min(facingL, facingR)
  const hi = Math.max(facingL, facingR)
  const mid = (lo + hi) / 2
  if (hi - lo < 1) return mid

  const sorted = [...cols].sort((a, b) => a.left - b.left)
  const gaps: number[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const gL = sorted[i].right
    const gR = sorted[i + 1].left
    if (gR - gL < 1) continue
    if (gR < lo || gL > hi) continue
    const segL = Math.max(gL, lo)
    const segR = Math.min(gR, hi)
    if (segR - segL >= 1) gaps.push((segL + segR) / 2)
  }
  if (gaps.length === 0) {
    return lo + Math.min(8, (hi - lo) / 2)
  }
  return gaps.reduce((best, g) =>
    Math.abs(g - mid) < Math.abs(best - mid) ? g : best,
  )
}

/** Vertical only in the seam beside this column (prefer right, else left). */
function sideGutter(a: Anchor, cols: ColBox[], containerW: number): number {
  const sorted = [...cols].sort((c, d) => c.left - d.left)
  for (let i = 0; i < sorted.length; i++) {
    const c = sorted[i]
    const overlap =
      Math.min(a.colRight, c.right) - Math.max(a.colLeft, c.left)
    if (overlap <= (c.right - c.left) * 0.5) continue
    if (i < sorted.length - 1) {
      const next = sorted[i + 1]
      if (next.left - c.right >= 1) return (c.right + next.left) / 2
    }
    if (i > 0) {
      const prev = sorted[i - 1]
      if (c.left - prev.right >= 1) return (prev.right + c.left) / 2
    }
    const rightPad = Math.min(containerW - 2, c.right + SIDE_OUT)
    const leftPad = Math.max(2, c.left - SIDE_OUT)
    return rightPad < containerW - 4 ? rightPad : leftPad
  }
  return Math.min(containerW - 2, a.colRight + SIDE_OUT)
}

function gutterBetween(a: Anchor, b: Anchor, cols: ColBox[]): number {
  if (a.x <= b.x) {
    return pickGutterX(a.colRight, b.colLeft, cols)
  }
  return pickGutterX(b.colRight, a.colLeft, cols)
}

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

/**
 * Same-moment slice: primarily horizontal line across the category,
 * with short micro-staircase only among exact same-date peers (L→R).
 * Vertical risers live only in company gutters — meaning 「同一时刻」,
 * never a chrono succession through all history.
 * Y is mid-gap below each peer card, not the card bottom border.
 */
function momentSliceVertices(
  peers: Anchor[],
  cols: ColBox[],
  containerW: number,
): Pt[] {
  if (peers.length === 0) return []

  const sorted = [...peers].sort(
    (a, b) => a.x - b.x || a.colLeft - b.colLeft || a.id.localeCompare(b.id),
  )

  const out: Pt[] = []
  const push = (x: number, y: number) => {
    if (out.length === 0) {
      out.push({ x, y })
      return
    }
    const last = out[out.length - 1]
    if (Math.abs(last.x - x) < 0.5 && Math.abs(last.y - y) < 0.5) return
    out.push({ x, y })
  }

  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const leftX = EDGE_PAD
  const rightX = Math.max(EDGE_PAD + 1, containerW - EDGE_PAD)

  push(leftX, first.y)
  push(first.x, first.y)

  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1]
    const b = sorted[i]
    const sameY = Math.abs(a.y - b.y) < 0.5

    if (sameY) {
      push(b.x, b.y)
      continue
    }

    if (sameColumn(a, b)) {
      const gx = sideGutter(a, cols, containerW)
      push(gx, a.y)
      push(gx, b.y)
      push(b.x, b.y)
      continue
    }

    const gx = gutterBetween(a, b, cols)
    push(gx, a.y)
    push(gx, b.y)
    push(b.x, b.y)
  }

  push(rightX, last.y)
  return out
}

/**
 * Intra-category same-moment bump line (SVG, pointer-events none).
 * Hover → dashed (no mute). Click-pin → solid. Short gutter risers only
 * among exact same-date peers. Not a chrono path.
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
  const [cols, setCols] = useState<ColBox[]>([])
  const [size, setSize] = useState({ w: 0, h: 0 })

  const measure = useCallback(() => {
    const root = containerRef.current
    if (!root) {
      setPts([])
      setCols([])
      setSize({ w: 0, h: 0 })
      return
    }

    const w = Math.max(root.scrollWidth, root.clientWidth)
    const h = Math.max(root.scrollHeight, root.clientHeight)
    setSize({ w, h })

    const rootBox = root.getBoundingClientRect()

    const colEls = root.querySelectorAll<HTMLElement>('.cat-subcol')
    const nextCols: ColBox[] = []
    colEls.forEach((el) => {
      const r = el.getBoundingClientRect()
      const left = r.left - rootBox.left + root.scrollLeft
      nextCols.push({ left, right: left + r.width })
    })
    setCols(nextCols)

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
        // Temporary; rewritten to mid-gap below once column peers are known.
        y: bottom,
        top,
        bottom,
        left,
        right: left + r.width,
        colLeft,
        colRight,
      })
    }

    // Group by company subcol, then place Y in the inter-card gap midpoint.
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

  if (!active || peers.length < 1 || size.w <= 0 || size.h <= 0) return null

  const path = pointsToPath(momentSliceVertices(peers, cols, size.w))
  if (!path) return null

  return (
    <svg
      className={`bump-connectors${solid ? ' is-solid' : ' is-dashed'}`}
      width={size.w}
      height={size.h}
      viewBox={`0 0 ${size.w} ${size.h}`}
      aria-hidden
    >
      <path
        className="bump-connectors__moment"
        d={path}
        fill="none"
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={solid ? undefined : DASH}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
