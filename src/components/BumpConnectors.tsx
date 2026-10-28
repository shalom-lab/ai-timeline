import { useCallback, useEffect, useState, type RefObject } from 'react'

/** Anchor at card bottom-center; column box for gutter routing. */
type Anchor = {
  id: string
  date: string
  x: number
  y: number
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
  /** Visible event ids in chronological order (same top-level category only). */
  orderedIds: string[]
  /** Parallel dates (YYYY-MM-DD) for orderedIds — used to chop past vs future. */
  orderedDates: string[]
  /** When false, connectors stay hidden (default). */
  active: boolean
  /** Focus date: at/before = color, after = muted. */
  focusDate: string | null
  /** Focus event id — preferred chop point when set. */
  focusId?: string | null
}

const STROKE_PAST = 'rgba(234, 88, 12, 0.85)'
const STROKE_FUTURE = 'rgba(148, 163, 184, 0.55)'
const STROKE_WIDTH = 2
const DASH = '7 5'
/** Treat columns as same when centers are this close (px). */
const SAME_COL_X = 24
/** Push same-column vertical just outside the subcol edge into the seam. */
const SIDE_OUT = 4

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
  // Shared / heavily overlapping subcol bounds
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
    // Gap overlaps the facing span
    if (gR < lo || gL > hi) continue
    const segL = Math.max(gL, lo)
    const segR = Math.min(gR, hi)
    if (segR - segL >= 1) gaps.push((segL + segR) / 2)
  }
  if (gaps.length === 0) {
    // Fallback: just outside the left column's right edge (still a seam).
    return lo + Math.min(8, (hi - lo) / 2)
  }
  return gaps.reduce((best, g) =>
    Math.abs(g - mid) < Math.abs(best - mid) ? g : best,
  )
}

/** Vertical only in the seam beside this column (prefer right, else left). */
function sideGutter(a: Anchor, cols: ColBox[], containerW: number): number {
  const sorted = [...cols].sort((c, d) => c.left - d.left)
  // Prefer gap immediately to the right of this column
  for (let i = 0; i < sorted.length; i++) {
    const c = sorted[i]
    const overlap =
      Math.min(a.colRight, c.right) - Math.max(a.colLeft, c.left)
    if (overlap <= (c.right - c.left) * 0.5) continue
    if (i < sorted.length - 1) {
      const next = sorted[i + 1]
      if (next.left - c.right >= 1) return (c.right + next.left) / 2
    }
    // No right neighbor — use left gap or pad past right edge
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
 * One continuous H/V staircase through card bottoms.
 * Verticals exist only at gutter X (inter-company seams or side gutter).
 */
function stairVertices(
  anchors: Anchor[],
  cols: ColBox[],
  containerW: number,
): Pt[] {
  if (anchors.length === 0) return []
  const out: Pt[] = [{ x: anchors[0].x, y: anchors[0].y }]

  const push = (x: number, y: number) => {
    const last = out[out.length - 1]
    if (Math.abs(last.x - x) < 0.5 && Math.abs(last.y - y) < 0.5) return
    out.push({ x, y })
  }

  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1]
    const b = anchors[i]
    const sameY = Math.abs(a.y - b.y) < 0.5

    if (sameY) {
      // Pure horizontal along the bottom band
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

    // Different companies: V only in the inter-column gutter
    const gx = gutterBetween(a, b, cols)
    push(gx, a.y)
    push(gx, b.y)
    push(b.x, b.y)
  }
  return out
}

/**
 * Intra-category bump staircase (SVG, pointer-events none).
 * One continuous orthogonal path through card bottoms; verticals only in
 * company gutters. Hidden unless rail hover/pin. Past color / future 灰白.
 */
export default function BumpConnectors({
  containerRef,
  orderedIds,
  orderedDates,
  active,
  focusDate,
  focusId = null,
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

    const next: Anchor[] = []
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i]
      const el = root.querySelector<HTMLElement>(
        `[data-event-id="${CSS.escape(id)}"]`,
      )
      if (!el) continue
      const r = el.getBoundingClientRect()
      const left = r.left - rootBox.left + root.scrollLeft
      const top = r.top - rootBox.top + root.scrollTop
      const sub = el.closest('.cat-subcol')
      let colLeft = left
      let colRight = left + r.width
      if (sub) {
        const sr = sub.getBoundingClientRect()
        colLeft = sr.left - rootBox.left + root.scrollLeft
        colRight = colLeft + sr.width
      }
      next.push({
        id,
        date: orderedDates[i] ?? '',
        x: left + r.width / 2,
        y: top + r.height,
        left,
        right: left + r.width,
        colLeft,
        colRight,
      })
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

  if (!active || pts.length < 2 || size.w <= 0 || size.h <= 0) return null

  // Chop index: prefer focusId, else last at/before focusDate.
  let chop = pts.length - 1
  if (focusId) {
    const idx = pts.findIndex((p) => p.id === focusId)
    if (idx >= 0) chop = idx
    else if (focusDate) {
      chop = -1
      for (let i = 0; i < pts.length; i++) {
        if (pts[i].date <= focusDate) chop = i
        else break
      }
    }
  } else if (focusDate) {
    chop = -1
    for (let i = 0; i < pts.length; i++) {
      if (pts[i].date <= focusDate) chop = i
      else break
    }
  }
  if (chop < 0) chop = 0

  const pastAnchors = pts.slice(0, chop + 1)
  const futureAnchors = pts.slice(chop)
  const pastPath =
    pastAnchors.length >= 2
      ? pointsToPath(stairVertices(pastAnchors, cols, size.w))
      : ''
  const futurePath =
    futureAnchors.length >= 2 && chop < pts.length - 1
      ? pointsToPath(stairVertices(futureAnchors, cols, size.w))
      : ''

  return (
    <svg
      className="bump-connectors"
      width={size.w}
      height={size.h}
      viewBox={`0 0 ${size.w} ${size.h}`}
      aria-hidden
    >
      {futurePath ? (
        <path
          className="bump-connectors__future"
          d={futurePath}
          fill="none"
          stroke={STROKE_FUTURE}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={DASH}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {pastPath ? (
        <path
          className="bump-connectors__past"
          d={pastPath}
          fill="none"
          stroke={STROKE_PAST}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={DASH}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </svg>
  )
}
