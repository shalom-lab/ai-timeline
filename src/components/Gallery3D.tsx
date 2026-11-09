import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import type { Company, TimelineEvent, Category } from '../types/timeline'
import { CATEGORY_LABEL_ZH, CATEGORY_THEME } from '../lib/labels'
import { companyColor } from '../lib/company'
import GalleryDetail from './GalleryDetail'

type Props = {
  events: TimelineEvent[]
  companies: Company[]
  onExit: () => void
}

type BoardHit = {
  eventId: string
  mesh: THREE.Mesh
}

const LANE_ORDER: Category[] = ['model', 'product', 'science']
const LANE_X: Record<Category, number> = {
  model: -9,
  product: 0,
  science: 9,
  other: 18,
}
const BOARD_SPACING = 3.2
const BOARD_W = 1.55
const BOARD_H = 2.35
const EYE_Y = 1.55
const MOVE_SPEED = 8
const TOUCH_LOOK_SENS = 0.0028

function isTouchPrimary(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.matchMedia('(pointer: coarse)').matches ||
      navigator.maxTouchPoints > 0)
  )
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const chars = [...text]
  let line = ''
  let lineCount = 0
  for (let i = 0; i < chars.length; i++) {
    const test = line + chars[i]
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + lineCount * lineHeight)
      line = chars[i]
      lineCount++
      if (lineCount >= maxLines - 1) {
        // rest on last line with ellipsis if needed
        let rest = chars.slice(i).join('')
        while (
          rest.length > 1 &&
          ctx.measureText(rest + '…').width > maxWidth
        ) {
          rest = rest.slice(0, -1)
        }
        if (chars.slice(i).join('') !== rest) rest = rest + '…'
        ctx.fillText(rest, x, y + lineCount * lineHeight)
        return
      }
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, y + lineCount * lineHeight)
}

function makeBoardTexture(
  event: TimelineEvent,
  companies: Company[],
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 384
  const ctx = canvas.getContext('2d')!
  const { color, soft } = companyColor(companies, event.company)
  const theme = CATEGORY_THEME[event.category]

  // blackboard body
  ctx.fillStyle = '#1a1d24'
  ctx.fillRect(0, 0, 256, 384)

  // top accent bar (company color)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 256, 10)

  // soft header band
  const grad = ctx.createLinearGradient(0, 10, 0, 90)
  grad.addColorStop(0, soft)
  grad.addColorStop(1, '#1a1d24')
  ctx.fillStyle = grad
  ctx.fillRect(0, 10, 256, 80)

  // date
  ctx.fillStyle = '#94A3B8'
  ctx.font = '600 18px system-ui, sans-serif'
  ctx.fillText(event.date, 18, 42)

  // category chip
  ctx.fillStyle = theme.accent
  ctx.beginPath()
  ctx.roundRect(18, 54, 72, 22, 6)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = '600 13px system-ui, sans-serif'
  ctx.fillText(CATEGORY_LABEL_ZH[event.category], 28, 70)

  // title
  ctx.fillStyle = '#F8FAFC'
  ctx.font = '700 22px system-ui, "Noto Sans SC", sans-serif'
  wrapText(ctx, event.title, 18, 120, 220, 28, 4)

  // company
  ctx.fillStyle = color
  ctx.font = '600 16px system-ui, sans-serif'
  ctx.fillText(event.company, 18, 250)

  // series / product
  const sub = [event.series, event.product].filter(Boolean).join(' · ')
  if (sub) {
    ctx.fillStyle = '#CBD5E1'
    ctx.font = '14px system-ui, sans-serif'
    wrapText(ctx, sub, 18, 278, 220, 20, 2)
  }

  // chalk frame
  ctx.strokeStyle = '#334155'
  ctx.lineWidth = 4
  ctx.strokeRect(6, 6, 244, 372)

  // hint
  ctx.fillStyle = '#64748B'
  ctx.font = '12px system-ui, sans-serif'
  ctx.fillText('点击查看详情', 18, 360)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  return tex
}

function buildLaneBoards(
  scene: THREE.Scene,
  events: TimelineEvent[],
  companies: Company[],
  category: Category,
  hits: BoardHit[],
) {
  const laneEvents = events
    .filter((e) => e.category === category)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
  const x = LANE_X[category]
  const theme = CATEGORY_THEME[category]

  // lane strip
  const stripGeo = new THREE.PlaneGeometry(4.2, Math.max(20, laneEvents.length * BOARD_SPACING + 16))
  const stripMat = new THREE.MeshBasicMaterial({
    color: theme.accent,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
  })
  const strip = new THREE.Mesh(stripGeo, stripMat)
  strip.rotation.x = -Math.PI / 2
  strip.position.set(x, 0.02, (laneEvents.length * BOARD_SPACING) / 2 + 4)
  scene.add(strip)

  // lane label post at start
  const labelCanvas = document.createElement('canvas')
  labelCanvas.width = 256
  labelCanvas.height = 96
  const lctx = labelCanvas.getContext('2d')!
  lctx.fillStyle = theme.accent
  lctx.fillRect(0, 0, 256, 96)
  lctx.fillStyle = '#fff'
  lctx.font = '700 36px system-ui, "Noto Sans SC", sans-serif'
  lctx.textAlign = 'center'
  lctx.fillText(CATEGORY_LABEL_ZH[category], 128, 58)
  const labelTex = new THREE.CanvasTexture(labelCanvas)
  labelTex.colorSpace = THREE.SRGBColorSpace
  const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, side: THREE.DoubleSide })
  const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.2), labelMat)
  labelMesh.position.set(x, 2.2, 1.5)
  scene.add(labelMesh)

  laneEvents.forEach((event, i) => {
    const z = 6 + i * BOARD_SPACING
    const tex = makeBoardTexture(event, companies)
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.DoubleSide,
    })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(BOARD_W, BOARD_H), mat)
    // stand beside the walk center, facing inward toward aisle center (x=0 path between lanes)
    const side = i % 2 === 0 ? -1.15 : 1.15
    mesh.position.set(x + side, BOARD_H / 2 + 0.05, z)
    // slight yaw so board faces roughly toward lane center + walk direction
    mesh.rotation.y = side > 0 ? -0.35 : 0.35
    mesh.userData.eventId = event.id
    scene.add(mesh)
    hits.push({ eventId: event.id, mesh })

    // thin post under board
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.06, 0.4, 8),
      new THREE.MeshBasicMaterial({ color: 0x475569 }),
    )
    post.position.set(x + side, 0.2, z)
    scene.add(post)
  })

  return laneEvents.length
}

export default function Gallery3D({ events, companies, onExit }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [locked, setLocked] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [hint, setHint] = useState('点击画面进入 · WASD 移动 · 鼠标看 · E/点击展板详情')
  const [touchUi, setTouchUi] = useState(false)
  const detailIdRef = useRef<string | null>(null)
  const keysRef = useRef<Record<string, boolean>>({})
  const touchMoveRef = useRef({ x: 0, y: 0 })
  const lookRef = useRef({ yaw: 0, pitch: 0 })
  const openDetailRef = useRef<(id: string) => void>(() => {})

  const byId = useMemo(() => {
    const m = new Map<string, TimelineEvent>()
    for (const e of events) m.set(e.id, e)
    return m
  }, [events])

  const detailEvent = detailId ? byId.get(detailId) ?? null : null

  const openDetail = useCallback((id: string) => {
    detailIdRef.current = id
    setDetailId(id)
  }, [])
  openDetailRef.current = openDetail

  const closeDetail = useCallback(() => {
    detailIdRef.current = null
    setDetailId(null)
  }, [])

  useEffect(() => {
    setTouchUi(isTouchPrimary())
    if (isTouchPrimary()) {
      setHint('虚拟摇杆移动 · 拖动画布转向 · 点展板看详情')
    }
  }, [])

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0b1020)
    scene.fog = new THREE.Fog(0x0b1020, 28, 90)

    const camera = new THREE.PerspectiveCamera(
      70,
      el.clientWidth / Math.max(1, el.clientHeight),
      0.1,
      200,
    )
    camera.position.set(0, EYE_Y, 2)

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    el.appendChild(renderer.domElement)

    // ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(48, 220),
      new THREE.MeshBasicMaterial({ color: 0x121826 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.z = 60
    scene.add(ground)

    // track lane lines (hurdle-track feel)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.35 })
    for (const cat of LANE_ORDER) {
      const x = LANE_X[cat]
      for (const dx of [-2.1, 2.1]) {
        const line = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 200), lineMat)
        line.rotation.x = -Math.PI / 2
        line.position.set(x + dx, 0.03, 70)
        scene.add(line)
      }
    }
    // start line
    const start = new THREE.Mesh(
      new THREE.PlaneGeometry(28, 0.25),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24 }),
    )
    start.rotation.x = -Math.PI / 2
    start.position.set(0, 0.04, 3.5)
    scene.add(start)

    // ambient fill via unlit materials + subtle hemisphere feel: add a dim plane "sky"
    const hemi = new THREE.HemisphereLight(0x9ec9ff, 0x1a1a2e, 0.55)
    scene.add(hemi)
    const dir = new THREE.DirectionalLight(0xffffff, 0.35)
    dir.position.set(4, 12, 6)
    scene.add(dir)

    const hits: BoardHit[] = []
    let maxZ = 20
    for (const cat of LANE_ORDER) {
      const n = buildLaneBoards(scene, events, companies, cat, hits)
      maxZ = Math.max(maxZ, 6 + n * BOARD_SPACING + 8)
    }

    // year markers across all lanes
    const years = [...new Set(events.map((e) => e.date.slice(0, 4)))].sort()
    const minDate = events.reduce(
      (m, e) => (e.date < m ? e.date : m),
      events[0]?.date ?? '2022-11-30',
    )
    const maxDate = events.reduce(
      (m, e) => (e.date > m ? e.date : m),
      events[0]?.date ?? '2026-11-05',
    )
    const t0 = Date.parse(minDate)
    const t1 = Date.parse(maxDate) || t0 + 1
    for (const y of years) {
      const mid = Date.parse(`${y}-07-01`)
      const z = 6 + ((mid - t0) / (t1 - t0)) * (maxZ - 14)
      const yc = document.createElement('canvas')
      yc.width = 128
      yc.height = 48
      const yx = yc.getContext('2d')!
      yx.fillStyle = 'rgba(248,250,252,0.9)'
      yx.font = '700 28px system-ui, sans-serif'
      yx.textAlign = 'center'
      yx.fillText(y, 64, 34)
      const yt = new THREE.CanvasTexture(yc)
      yt.colorSpace = THREE.SRGBColorSpace
      const ym = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 0.8),
        new THREE.MeshBasicMaterial({ map: yt, transparent: true, side: THREE.DoubleSide }),
      )
      ym.position.set(0, 3.2, z)
      scene.add(ym)
      const bar = new THREE.Mesh(
        new THREE.PlaneGeometry(26, 0.06),
        new THREE.MeshBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.5 }),
      )
      bar.rotation.x = -Math.PI / 2
      bar.position.set(0, 0.05, z)
      scene.add(bar)
    }

    const controls = new PointerLockControls(camera, renderer.domElement)
    const onLock = () => setLocked(true)
    const onUnlock = () => setLocked(false)
    controls.addEventListener('lock', onLock)
    controls.addEventListener('unlock', onUnlock)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2(0, 0)
    const boardMeshes = hits.map((h) => h.mesh)

    const tryPick = (clientX?: number, clientY?: number) => {
      if (detailIdRef.current) return
      if (clientX != null && clientY != null) {
        const rect = renderer.domElement.getBoundingClientRect()
        pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
      } else {
        // center of view when locked
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
      }
      const found = raycaster.intersectObjects(boardMeshes, false)
      if (found[0]) {
        const id = found[0].object.userData.eventId as string | undefined
        if (id) {
          if (controls.isLocked) controls.unlock()
          openDetailRef.current(id)
        }
      }
    }

    const onClick = (ev: MouseEvent) => {
      if (detailIdRef.current) return
      if (!controls.isLocked && !isTouchPrimary()) {
        controls.lock()
        return
      }
      tryPick(ev.clientX, ev.clientY)
    }
    renderer.domElement.addEventListener('click', onClick)

    // touch look
    let lastTouch: { x: number; y: number } | null = null
    const onTouchStart = (ev: TouchEvent) => {
      if (ev.touches.length === 1) {
        lastTouch = { x: ev.touches[0].clientX, y: ev.touches[0].clientY }
      }
    }
    const onTouchMove = (ev: TouchEvent) => {
      if (!lastTouch || ev.touches.length !== 1) return
      if ((ev.target as HTMLElement).closest?.('.gallery-touch')) return
      const t = ev.touches[0]
      const dx = t.clientX - lastTouch.x
      const dy = t.clientY - lastTouch.y
      lastTouch = { x: t.clientX, y: t.clientY }
      lookRef.current.yaw -= dx * TOUCH_LOOK_SENS
      lookRef.current.pitch -= dy * TOUCH_LOOK_SENS
      lookRef.current.pitch = Math.max(
        -1.2,
        Math.min(1.2, lookRef.current.pitch),
      )
      ev.preventDefault()
    }
    const onTouchEnd = (ev: TouchEvent) => {
      if (ev.changedTouches.length === 1 && lastTouch) {
        const t = ev.changedTouches[0]
        const dx = t.clientX - lastTouch.x
        const dy = t.clientY - lastTouch.y
        if (Math.hypot(dx, dy) < 8) {
          tryPick(t.clientX, t.clientY)
        }
      }
      lastTouch = null
    }
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true })
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false })
    renderer.domElement.addEventListener('touchend', onTouchEnd)

    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true
      if (e.code === 'KeyE' && controls.isLocked) {
        tryPick()
      }
      if (e.code === 'Escape' && detailIdRef.current) {
        // let React overlay handle Esc via its own listener; don't unlock fight
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const onResize = () => {
      if (!mountRef.current) return
      const w = mountRef.current.clientWidth
      const h = mountRef.current.clientHeight
      camera.aspect = w / Math.max(1, h)
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    const clock = new THREE.Clock()
    const velocity = new THREE.Vector3()
    const direction = new THREE.Vector3()
    let raf = 0
    let alive = true

    const animate = () => {
      if (!alive) return
      raf = requestAnimationFrame(animate)
      const dt = Math.min(0.05, clock.getDelta())

      if (isTouchPrimary()) {
        camera.rotation.order = 'YXZ'
        camera.rotation.y = lookRef.current.yaw
        camera.rotation.x = lookRef.current.pitch
      }

      direction.set(0, 0, 0)
      const k = keysRef.current
      if (k['KeyW'] || k['ArrowUp']) direction.z -= 1
      if (k['KeyS'] || k['ArrowDown']) direction.z += 1
      if (k['KeyA'] || k['ArrowLeft']) direction.x -= 1
      if (k['KeyD'] || k['ArrowRight']) direction.x += 1
      direction.x += touchMoveRef.current.x
      direction.z += touchMoveRef.current.y
      if (direction.lengthSq() > 0) direction.normalize()

      // move in camera yaw plane
      const yaw = isTouchPrimary()
        ? lookRef.current.yaw
        : controls.object.rotation.y
      // PointerLockControls nests camera; get forward from camera
      const forward = new THREE.Vector3()
      camera.getWorldDirection(forward)
      forward.y = 0
      forward.normalize()
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

      velocity.set(0, 0, 0)
      velocity.addScaledVector(forward, -direction.z * MOVE_SPEED * dt)
      velocity.addScaledVector(right, direction.x * MOVE_SPEED * dt)

      if (!detailIdRef.current) {
        camera.position.add(velocity)
        // bounds
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, -16, 16)
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, 0.5, maxZ)
        camera.position.y = EYE_Y
      }

      // void yaw unused warning in desktop path
      void yaw

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      controls.removeEventListener('lock', onLock)
      controls.removeEventListener('unlock', onUnlock)
      if (controls.isLocked) controls.unlock()
      renderer.domElement.removeEventListener('click', onClick)
      renderer.domElement.removeEventListener('touchstart', onTouchStart)
      renderer.domElement.removeEventListener('touchmove', onTouchMove)
      renderer.domElement.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (renderer.domElement.parentElement === el) {
        el.removeChild(renderer.domElement)
      }
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose()
          const m = obj.material
          if (Array.isArray(m)) m.forEach((mm) => {
            if (mm.map) mm.map.dispose()
            mm.dispose()
          })
          else if (m) {
            if ((m as THREE.MeshBasicMaterial).map) {
              ;(m as THREE.MeshBasicMaterial).map!.dispose()
            }
            m.dispose()
          }
        }
      })
    }
  }, [events, companies])

  // Esc closes detail
  useEffect(() => {
    if (!detailId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDetail()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detailId, closeDetail])

  const setStick = (x: number, y: number) => {
    touchMoveRef.current = { x, y }
  }

  return (
    <div className="gallery-root">
      <div className="gallery-topbar">
        <button type="button" className="gallery-topbar__back" onClick={onExit}>
          ← 返回纪年
        </button>
        <div className="gallery-topbar__title">
          3D 展厅<span className="gallery-topbar__badge">原型</span>
        </div>
        <div className="gallery-topbar__hint">{hint}</div>
      </div>

      <div className="gallery-stage" ref={mountRef}>
        {!locked && !touchUi && !detailId ? (
          <button
            type="button"
            className="gallery-enter"
            onClick={() => {
              // click on canvas also locks; this is a visible CTA
              const canvas = mountRef.current?.querySelector('canvas')
              canvas?.click()
            }}
          >
            点击进入展厅
            <small>WASD 移动 · 鼠标转向 · E / 点击展板看详情</small>
          </button>
        ) : null}
      </div>

      {touchUi ? (
        <div className="gallery-touch" aria-hidden>
          <div
            className="gallery-stick"
            onTouchStart={(e) => {
              e.preventDefault()
              const t = e.touches[0]
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
              const nx = ((t.clientX - r.left) / r.width) * 2 - 1
              const ny = ((t.clientY - r.top) / r.height) * 2 - 1
              setStick(Math.max(-1, Math.min(1, nx)), Math.max(-1, Math.min(1, ny)))
            }}
            onTouchMove={(e) => {
              e.preventDefault()
              const t = e.touches[0]
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
              const nx = ((t.clientX - r.left) / r.width) * 2 - 1
              const ny = ((t.clientY - r.top) / r.height) * 2 - 1
              setStick(Math.max(-1, Math.min(1, nx)), Math.max(-1, Math.min(1, ny)))
            }}
            onTouchEnd={() => setStick(0, 0)}
            onTouchCancel={() => setStick(0, 0)}
          >
            <span>摇杆</span>
          </div>
        </div>
      ) : null}

      {detailEvent ? (
        <GalleryDetail
          event={detailEvent}
          companies={companies}
          onClose={closeDetail}
        />
      ) : null}
    </div>
  )
}
