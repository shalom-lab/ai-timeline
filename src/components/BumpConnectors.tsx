import { useCallback, useEffect, useState, type RefObject } from 'react'

type Point = { id: string; x: number; y: number }

type Props = {
  /** Category column body (positioned ancestor for overlay coords). */
  containerRef: RefObject<HTMLElement | null>
  /** Visible event ids in chronological order (same top-level category only). */
  orderedIds: string[]
}

/** Soft orange dashed stroke — readable over cards, thinner than the sketch marker. */
const STROKE = 'rgba(234, 88, 12, 0.78)'
const STROKE_WIDTH = 2
const DASH = '7 5'

/**
 * Continuous intra-category bump staircase (SVG overlay — no canvas needed).
 * One polyline through card centers in chrono order; orthogonal H→V steps.
 * Drawn above cards with pointer-events:none so clicks still hit cards.
 */
export default function BumpConnectors({ containerRef, orderedIds }: Props) {
  const [path, setPath] = useState('')
  const [size, setSize] = useState({ w: 0, h: 0 })

  const measure = useCallback(() => {
    const root = containerRef.current
    if (!root) {
      setPath('')
      setSize({ w: 0, h: 0 })
      return
    }

    const w = Math.max(root.scrollWidth, root.clientWidth)
    const h = Math.max(root.scrollHeight, root.clientHeight)
    setSize({ w, h })

    if (orderedIds.length < 2) {
      setPath('')
      return
    }

    const rootBox = root.getBoundingClientRect()
    const pts: Point[] = []
    for (const id of orderedIds) {
      const el = root.querySelector<HTMLElement>(
        `[data-event-id="${CSS.escape(id)}"]`,
      )
      if (!el) continue
      const r = el.getBoundingClientRect()
      // Centers in root-local coords (includes rank translateY(-50%)).
      pts.push({
        id,
        x: r.left - rootBox.left + root.scrollLeft + r.width / 2,
        y: r.top - rootBox.top + root.scrollTop + r.height / 2,
      })
    }

    if (pts.length < 2) {
      setPath('')
      return
    }

    // One continuous orthogonal staircase through centers (sketch-style).
    const parts: string[] = [
      `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`,
    ]
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
    setPath(parts.join(' '))
  }, [containerRef, orderedIds])

  const idsKey = orderedIds.join('\0')

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

    // Catch late font/layout settles after absolute rank placement.
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
    // idsKey stands in for orderedIds identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, idsKey, measure])

  if (!path || size.w <= 0 || size.h <= 0) return null

  return (
    <svg
      className="bump-connectors"
      width={size.w}
      height={size.h}
      viewBox={`0 0 ${size.w} ${size.h}`}
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={DASH}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
