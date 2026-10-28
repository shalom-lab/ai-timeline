import { useCallback, useEffect, useState, type RefObject } from 'react'

/** Anchor at card bottom-center; left/right for gutter-aware horizontals. */
type Anchor = {
  id: string
  date: string
  x: number
  y: number
  left: number
  right: number
}

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
  /** Focus event — path originates from this card's bottom; H-line spans gutters. */
  focusId?: string | null
}

const STROKE_PAST = 'rgba(234, 88, 12, 0.85)'
const STROKE_FUTURE = 'rgba(148, 163, 184, 0.55)'
const STROKE_WIDTH = 2
const DASH = '7 5'
/** Pad horizontals slightly into column gutters past the card edges. */
const GUTTER_PAD = 6

/**
 * H-dominant orthogonal path through bottom anchors.
 * Horizontal first (through card-gap / gutter band), then short vertical.
 */
function hDominantPath(pts: Anchor[]): string {
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
      // Leave A bottom → horizontal across gutters → short vertical to B bottom.
      parts.push(`L ${b.x.toFixed(1)} ${a.y.toFixed(1)}`)
      parts.push(`L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`)
    }
  }
  return parts.join(' ')
}

/**
 * Intra-category bump connectors (SVG, pointer-events none).
 * Dense board: anchors are card **bottoms**. Primary strokes are horizontal
 * dashed lines in the gaps between cards; verticals only link those bands.
 * Hidden unless rail hover/pin is active. Past = color, future = 灰白.
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

    if (orderedIds.length < 1) {
      setPts([])
      return
    }

    const rootBox = root.getBoundingClientRect()
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
      next.push({
        id,
        date: orderedDates[i] ?? '',
        x: left + r.width / 2,
        // Bottom edge — line leaves from here, not card center.
        y: top + r.height,
        left,
        right: left + r.width,
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

  if (!active || pts.length < 1 || size.w <= 0 || size.h <= 0) return null

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
  const pastPath = pastPts.length >= 2 ? hDominantPath(pastPts) : ''
  const futurePath =
    futurePts.length >= 2 && chop < pts.length - 1 ? hDominantPath(futurePts) : ''

  // Origin card: full-width horizontal dashed band at its bottom (through gutters).
  const origin =
    (focusId ? pts.find((p) => p.id === focusId) : null) ??
    (chop >= 0 ? pts[chop] : null)

  const spanLeft = Math.min(
    ...pts.map((p) => p.left - GUTTER_PAD),
    4,
  )
  const spanRight = Math.max(
    ...pts.map((p) => p.right + GUTTER_PAD),
    size.w - 4,
  )

  const originHPath = origin
    ? `M ${spanLeft.toFixed(1)} ${origin.y.toFixed(1)} L ${spanRight.toFixed(1)} ${origin.y.toFixed(1)}`
    : ''

  // Small vertical stub from origin card center-x down to the H-band (already at bottom).
  // Plus per-card short bottom ticks so stations read in gutters.
  const stationTicks = pts.map((p) => {
    const isPast = !focusDate || p.date <= focusDate
    const tickLeft = Math.max(spanLeft, p.left - GUTTER_PAD)
    const tickRight = Math.min(spanRight, p.right + GUTTER_PAD)
    return {
      id: p.id,
      isPast,
      d: `M ${tickLeft.toFixed(1)} ${p.y.toFixed(1)} L ${tickRight.toFixed(1)} ${p.y.toFixed(1)}`,
    }
  })

  return (
    <svg
      className="bump-connectors"
      width={size.w}
      height={size.h}
      viewBox={`0 0 ${size.w} ${size.h}`}
      aria-hidden
    >
      {/* Full-width H-band at focus card bottom — primary visual */}
      {originHPath ? (
        <path
          className="bump-connectors__origin-h"
          d={originHPath}
          fill="none"
          stroke={STROKE_PAST}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={DASH}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      {/* Per-card bottom ticks (H in local gutter) */}
      {stationTicks.map((t) => (
        <path
          key={`tick-${t.id}`}
          d={t.d}
          fill="none"
          stroke={t.isPast ? STROKE_PAST : STROKE_FUTURE}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={DASH}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          opacity={0.55}
        />
      ))}

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
