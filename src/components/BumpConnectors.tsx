import { useCallback, useEffect, useState, type RefObject } from 'react'

type Point = { id: string; x: number; y: number }

type Props = {
  /** Category column body (positioned ancestor for overlay coords). */
  containerRef: RefObject<HTMLElement | null>
  /** Visible event ids in chronological order (same top-level category only). */
  orderedIds: string[]
}

/**
 * Intra-category bump-chart dashed steps between consecutive cards.
 * Never spans different top-level categories — parent passes one category's ids.
 */
export default function BumpConnectors({ containerRef, orderedIds }: Props) {
  const [path, setPath] = useState('')
  const [size, setSize] = useState({ w: 0, h: 0 })

  const measure = useCallback(() => {
    const root = containerRef.current
    if (!root || orderedIds.length < 2) {
      setPath('')
      setSize({ w: root?.clientWidth ?? 0, h: root?.scrollHeight ?? 0 })
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
      pts.push({
        id,
        x: r.left - rootBox.left + root.scrollLeft + r.width / 2,
        y: r.top - rootBox.top + root.scrollTop + r.height / 2,
      })
    }

    setSize({ w: root.clientWidth, h: Math.max(root.scrollHeight, root.clientHeight) })

    if (pts.length < 2) {
      setPath('')
      return
    }

    // Orthogonal bump steps: horizontal at current Y, then vertical to next Y.
    const parts: string[] = [`M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`]
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]
      const b = pts[i]
      if (Math.abs(a.x - b.x) < 1) {
        parts.push(`L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`)
      } else {
        parts.push(`L ${b.x.toFixed(1)} ${a.y.toFixed(1)}`)
        parts.push(`L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`)
      }
    }
    setPath(parts.join(' '))
  }, [containerRef, orderedIds])

  const idsKey = orderedIds.join('\0')

  useEffect(() => {
    measure()
    const root = containerRef.current
    if (!root) return

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(measure)
    })
    ro.observe(root)
    for (const id of orderedIds) {
      const el = root.querySelector(`[data-event-id="${CSS.escape(id)}"]`)
      if (el) ro.observe(el)
    }

    const onScroll = () => requestAnimationFrame(measure)
    window.addEventListener('resize', onScroll)
    const board = root.closest('.board')
    board?.addEventListener('scroll', onScroll, { passive: true })

    const t = window.setTimeout(measure, 80)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', onScroll)
      board?.removeEventListener('scroll', onScroll)
      window.clearTimeout(t)
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
        stroke="rgba(219, 39, 119, 0.35)"
        strokeWidth={1.5}
        strokeDasharray="5 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
