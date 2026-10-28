import { useCallback, useEffect, useState, type RefObject } from 'react'

type Point = { id: string; date: string; x: number; y: number }

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
}

const STROKE_PAST = 'rgba(234, 88, 12, 0.85)'
const STROKE_FUTURE = 'rgba(148, 163, 184, 0.55)'
const STROKE_WIDTH = 2
const DASH = '7 5'

function orthoPath(pts: Point[]): string {
  if (pts.length === 0) return ''
  const parts: string[] = [`M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`]
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const sameX = Math.abs(a.x - b.x) < 0.5
    const sameY = Math.abs(a.y - b.y) < 0.5
    if (sameX || sameY) {
      parts.push(`L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`)
    } else {
      // Horizontal toward next column, then vertical to next rank.
      parts.push(`L ${b.x.toFixed(1)} ${a.y.toFixed(1)}`)
      parts.push(`L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`)
    }
  }
  return parts.join(' ')
}

/**
 * Continuous intra-category bump staircase (SVG overlay — no canvas).
 * Hidden by default; when active, one orthogonal dashed path through card
 * centers, split into past (color) vs future (灰白) at focusDate.
 */
export default function BumpConnectors({
  containerRef,
  orderedIds,
  orderedDates,
  active,
  focusDate,
}: Props) {
  const [pts, setPts] = useState<Point[]>([])
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

    if (orderedIds.length < 2) {
      setPts([])
      return
    }

    const rootBox = root.getBoundingClientRect()
    const next: Point[] = []
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i]
      const el = root.querySelector<HTMLElement>(
        `[data-event-id="${CSS.escape(id)}"]`,
      )
      if (!el) continue
      const r = el.getBoundingClientRect()
      next.push({
        id,
        date: orderedDates[i] ?? '',
        x: r.left - rootBox.left + root.scrollLeft + r.width / 2,
        y: r.top - rootBox.top + root.scrollTop + r.height / 2,
      })
    }
    setPts(next.length >= 2 ? next : [])
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

    window.addEventListener('resize', schedule)
    const board = root.closest('.board')
    board?.addEventListener('scroll', schedule, { passive: true })
    const cols = root.closest('.board__columns')
    cols?.addEventListener('scroll', schedule, { passive: true })

    const t1 = window.setTimeout(schedule, 50)
    const t2 = window.setTimeout(schedule, 200)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', schedule)
      board?.removeEventListener('scroll', schedule)
      cols?.removeEventListener('scroll', schedule)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
    // idsKey/datesKey stand in for orderedIds/orderedDates identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, idsKey, datesKey, measure])

  if (!active || pts.length < 2 || size.w <= 0 || size.h <= 0) return null

  // Last index at/before focusDate (inclusive). No focus → all past (color).
  let chop = pts.length - 1
  if (focusDate) {
    chop = -1
    for (let i = 0; i < pts.length; i++) {
      if (pts[i].date <= focusDate) chop = i
      else break
    }
  }

  const pastPts = chop >= 0 ? pts.slice(0, chop + 1) : []
  const futurePts = chop >= 0 ? pts.slice(chop) : pts
  const pastPath = pastPts.length >= 2 ? orthoPath(pastPts) : ''
  // Future needs the shared focus node + at least one after.
  const futurePath =
    futurePts.length >= 2 && chop < pts.length - 1 ? orthoPath(futurePts) : ''

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
      {/* Single-node past (focus only): draw a short tick so the focus is visible */}
      {!pastPath && chop >= 0 && pastPts.length === 1 ? (
        <circle
          cx={pastPts[0].x}
          cy={pastPts[0].y}
          r={3}
          fill={STROKE_PAST}
        />
      ) : null}
    </svg>
  )
}
