import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import type { Company, TimelineEvent, Category } from '../types/timeline'
import { MODEL_CAPABILITY_LABEL_ZH } from '../types/timeline'
import {
  CATEGORY_LABEL_ZH,
  CATEGORY_THEME,
  EVENT_TYPE_COLOR,
  EVENT_TYPE_LABEL_ZH,
} from '../lib/labels'
import { companyColor, resolveCompany } from '../lib/company'
import { COMPANY_LOGO_EXT } from '../lib/icons'
import GalleryDetail from './GalleryDetail'

type Props = {
  events: TimelineEvent[]
  companies: Company[]
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
const BOARD_SPACING = 3.8
const BOARD_W = 2.2
const BOARD_H = 1.38
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

/** `#RRGGBB` → rgba() so canvas gradients can fade a brand tint to transparent. */
function alphaColor(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function logoUrl(companyId: string, ext: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const root = base.endsWith('/') ? base : `${base}/`
  return `${root}logos/${companyId}.${ext}`
}

function loadLogoImage(
  companyId: string,
  ext: string,
): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = logoUrl(companyId, ext)
  })
}

function makeBoardTexture(
  event: TimelineEvent,
  companies: Company[],
  logoImages: Map<string, HTMLImageElement>,
  scale = 1,
): THREE.CanvasTexture {
  const W = 640
  const H = 400
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(W * scale)
  canvas.height = Math.round(H * scale)
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)
  const { color, soft } = companyColor(companies, event.company)
  const theme = CATEGORY_THEME[event.category]
  const et = EVENT_TYPE_COLOR[event.eventType]

  // dark frame + light card body in the company's own soft tint
  ctx.fillStyle = '#0a0f18'
  ctx.fillRect(0, 0, W, H)
  const paper = ctx.createLinearGradient(0, 8, 0, H - 8)
  paper.addColorStop(0, '#ffffff')
  paper.addColorStop(0.55, soft)
  paper.addColorStop(1, soft)
  ctx.fillStyle = paper
  ctx.beginPath()
  ctx.roundRect(8, 8, W - 16, H - 16, 8)
  ctx.fill()

  // company-color wash at the header
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(8, 8, W - 16, H - 16, 8)
  ctx.clip()
  const headerTint = ctx.createLinearGradient(0, 8, 0, 170)
  headerTint.addColorStop(0, alphaColor(color, 0.16))
  headerTint.addColorStop(1, alphaColor(color, 0))
  ctx.fillStyle = headerTint
  ctx.fillRect(8, 8, W - 16, 170)
  ctx.restore()

  // accent bar
  ctx.fillStyle = color
  ctx.fillRect(8, 8, W - 16, 7)

  // date
  ctx.fillStyle = '#6f6a5c'
  ctx.font = '600 18px system-ui, "Noto Sans SC", sans-serif'
  ctx.fillText(event.date, 28, 48)

  // category chip
  ctx.font = '700 13px system-ui, "Noto Sans SC", sans-serif'
  const catLabel = CATEGORY_LABEL_ZH[event.category]
  const chipW = Math.max(62, ctx.measureText(catLabel).width + 24)
  ctx.fillStyle = theme.accent
  ctx.beginPath()
  ctx.roundRect(W - 28 - chipW, 30, chipW, 24, 12)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.fillText(catLabel, W - 28 - chipW / 2, 47)
  ctx.textAlign = 'left'

  // company logo + name
  const company = resolveCompany(companies, event.company)
  const logo = company ? logoImages.get(company.id) : undefined
  if (logo) {
    try {
      ctx.drawImage(logo, 28, 64, 22, 22)
    } catch {
      /* a malformed SVG should not break the whole board */
    }
  } else {
    const initial = (company?.name ?? event.company).trim().slice(0, 1).toUpperCase()
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(39, 75, 11, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 11px system-ui, "Noto Sans SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(initial, 39, 79)
    ctx.textAlign = 'left'
  }
  ctx.fillStyle = color
  ctx.font = '700 16px system-ui, "Noto Sans SC", sans-serif'
  ctx.fillText(event.company, 58, 82)

  // title
  ctx.fillStyle = '#161d29'
  ctx.font = '700 29px system-ui, "Noto Sans SC", sans-serif'
  wrapText(ctx, event.title, 28, 136, W - 56, 36, 2)

  // summary
  ctx.fillStyle = '#4f5868'
  ctx.font = '14px system-ui, "Noto Sans SC", sans-serif'
  wrapText(ctx, event.summary, 28, 226, W - 56, 20, 2)

  // capability line
  const caps = event.capabilities
    ?.map((c) => MODEL_CAPABILITY_LABEL_ZH[c])
    .join(' · ')
  if (caps) {
    ctx.fillStyle = '#8a7f6a'
    ctx.font = '600 12px system-ui, "Noto Sans SC", sans-serif'
    ctx.fillText(caps, 28, 288)
  }

  // footer divider
  ctx.strokeStyle = '#d9cdb8'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(28, 306)
  ctx.lineTo(W - 28, 306)
  ctx.stroke()

  // event type pill
  ctx.font = '600 12px system-ui, "Noto Sans SC", sans-serif'
  const typeLabel = EVENT_TYPE_LABEL_ZH[event.eventType]
  const typeW = ctx.measureText(typeLabel).width + 24
  ctx.fillStyle = et.bg
  ctx.beginPath()
  ctx.roundRect(28, 322, typeW, 22, 4)
  ctx.fill()
  ctx.fillStyle = et.fg
  ctx.fillText(typeLabel, 40, 337)

  // series / product, right aligned
  const sub = [event.series, event.product].filter(Boolean).join(' · ')
  if (sub) {
    ctx.fillStyle = '#7d7464'
    ctx.font = '12px system-ui, "Noto Sans SC", sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(sub, W - 28, 338, W - 220)
    ctx.textAlign = 'left'
  }

  // hint
  ctx.fillStyle = '#9a917f'
  ctx.font = '10px system-ui, "Noto Sans SC", sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('点击展板查看详情', W - 28, 372)
  ctx.textAlign = 'left'

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.anisotropy = 8
  return tex
}

function buildLaneBoards(
  scene: THREE.Scene,
  events: TimelineEvent[],
  companies: Company[],
  category: Category,
  hits: BoardHit[],
  logoImages: Map<string, HTMLImageElement>,
) {
  const laneEvents = events
    .filter((e) => e.category === category)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
  const x = LANE_X[category]
  const theme = CATEGORY_THEME[category]

  // lane strip
  const stripGeo = new THREE.PlaneGeometry(4.8, Math.max(20, laneEvents.length * BOARD_SPACING + 16))
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

  // Lane names live in the HTML HUD; the 3D hall stays clean.
  laneEvents.forEach((event, i) => {
    const z = 6 + i * BOARD_SPACING
    const tex = makeBoardTexture(event, companies, logoImages, 0.75)
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.DoubleSide,
    })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(BOARD_W, BOARD_H), mat)
    // stand beside the walk center, facing inward toward aisle center (x=0 path between lanes)
    const side = i % 2 === 0 ? -1.3 : 1.3
    mesh.position.set(x + side, BOARD_H / 2 + 0.95, z)
    // slight yaw so board faces roughly toward lane center + walk direction
    mesh.rotation.y = Math.PI
    mesh.userData.eventId = event.id
    mesh.userData.event = event
    mesh.userData.lowTexture = tex
    mesh.userData.hiTexture = null
    scene.add(mesh)
    hits.push({ eventId: event.id, mesh })
  })

  return laneEvents.length
}

export default function Gallery3D({ events, companies }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [locked, setLocked] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [hint, setHint] = useState('点击画面进入 · W 向里 = 更早 · 鼠标看 · E/点击展板详情')
  const [touchUi, setTouchUi] = useState(false)
  const [logoImages, setLogoImages] = useState<Map<string, HTMLImageElement> | null>(
    null,
  )
  const detailIdRef = useRef<string | null>(null)
  const keysRef = useRef<Record<string, boolean>>({})
  const touchMoveRef = useRef({ x: 0, y: 0 })
  const lookRef = useRef({ yaw: 0, pitch: 0 })
  const openDetailRef = useRef<(id: string) => void>(() => {})
  const lockRef = useRef<() => void>(() => {})
  const focusRelativeRef = useRef<(delta: number) => void>(() => {})
  const focusLaneRef = useRef<(category: Category) => void>(() => {})
  const focusEdgeRef = useRef<(edge: 'newest' | 'oldest') => void>(() => {})

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
    let cancelled = false
    const run = async () => {
      const entries = await Promise.all(
        companies.map(async (company) => {
          const ext = COMPANY_LOGO_EXT[company.id]
          if (!ext) return null
          const img = await loadLogoImage(company.id, ext)
          return img ? ([company.id, img] as const) : null
        }),
      )
      if (cancelled) return
      setLogoImages(
        new Map(
          entries.filter(
            (entry): entry is readonly [string, HTMLImageElement] => entry !== null,
          ),
        ),
      )
    }
    run()
    return () => {
      cancelled = true
    }
  }, [companies])

  useEffect(() => {
    const el = mountRef.current
    if (!el || !logoImages) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x070b14)
    scene.fog = new THREE.Fog(0x070b14, 24, 86)

    const camera = new THREE.PerspectiveCamera(
      70,
      el.clientWidth / Math.max(1, el.clientHeight),
      0.1,
      200,
    )
    camera.position.set(0, EYE_Y, 2.2)
    camera.rotation.y = Math.PI

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08
    el.appendChild(renderer.domElement)

    // ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(48, 220),
      new THREE.MeshBasicMaterial({ color: 0x0a101a }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.z = 60
    scene.add(ground)

    // ceiling + light strips make the hall read as a room, not a void
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(48, 220),
      new THREE.MeshBasicMaterial({ color: 0x060a11, side: THREE.DoubleSide }),
    )
    ceiling.rotation.x = Math.PI / 2
    ceiling.position.set(0, 6.2, 60)
    scene.add(ceiling)
    for (const cat of LANE_ORDER) {
      const accent = CATEGORY_THEME[cat].accent
      const stripLight = new THREE.Mesh(
        new THREE.PlaneGeometry(0.14, 200),
        new THREE.MeshBasicMaterial({
          color: accent,
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
        }),
      )
      stripLight.rotation.x = Math.PI / 2
      stripLight.position.set(LANE_X[cat], 6.1, 70)
      scene.add(stripLight)
    }

    // track lane lines (hurdle-track feel)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.22 })
    for (const cat of LANE_ORDER) {
      const x = LANE_X[cat]
      for (const dx of [-2.4, 2.4]) {
        const line = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 200), lineMat)
        line.rotation.x = -Math.PI / 2
        line.position.set(x + dx, 0.03, 70)
        scene.add(line)
      }
    }
    // start line
    const start = new THREE.Mesh(
      new THREE.PlaneGeometry(28, 0.25),
      new THREE.MeshBasicMaterial({ color: 0xd8b25a, transparent: true, opacity: 0.55 }),
    )
    start.rotation.x = -Math.PI / 2
    start.position.set(0, 0.04, 4.2)
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
      const n = buildLaneBoards(scene, events, companies, cat, hits, logoImages)
      maxZ = Math.max(maxZ, 6 + n * BOARD_SPACING + 8)
    }

    const controls = new PointerLockControls(camera, renderer.domElement)
    lockRef.current = () => controls.lock()
    const onLock = () => setLocked(true)
    const onUnlock = () => setLocked(false)
    controls.addEventListener('lock', onLock)
    controls.addEventListener('unlock', onUnlock)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2(0, 0)
    const boardMeshes = hits.map((h) => h.mesh)
    const meshById = new Map(hits.map((h) => [h.eventId, h.mesh]))
    const ordered = [...hits].sort(
      (a, b) => a.mesh.position.z - b.mesh.position.z,
    )

    let fly: {
      fromPos: THREE.Vector3
      toPos: THREE.Vector3
      fromQuat: THREE.Quaternion
      toQuat: THREE.Quaternion
      start: number
    } | null = null

    const beginFly = (
      toPos: THREE.Vector3,
      lookAt: THREE.Vector3,
    ) => {
      const m = new THREE.Matrix4().lookAt(
        toPos,
        lookAt,
        new THREE.Vector3(0, 1, 0),
      )
      fly = {
        fromPos: camera.position.clone(),
        toPos,
        fromQuat: camera.quaternion.clone(),
        toQuat: new THREE.Quaternion().setFromRotationMatrix(m),
        start: performance.now(),
      }
    }

    const focusById = (id: string) => {
      const mesh = meshById.get(id)
      if (!mesh) return
      controls.unlock()
      const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.quaternion)
      const toPos = mesh.position.clone().addScaledVector(normal, 2.6)
      toPos.y = EYE_Y
      beginFly(toPos, mesh.position.clone())
      openDetailRef.current(id)
    }

    const focusRelative = (delta: number) => {
      const current = detailIdRef.current
      let index = current
        ? ordered.findIndex((h) => h.eventId === current)
        : -1
      if (index < 0) {
        index = 0
        for (let i = 1; i < ordered.length; i++) {
          if (
            Math.abs(ordered[i].mesh.position.z - camera.position.z) <
            Math.abs(ordered[index].mesh.position.z - camera.position.z)
          ) {
            index = i
          }
        }
      }
      const next = Math.max(0, Math.min(ordered.length - 1, index + delta))
      const target = ordered[next]
      if (target) focusById(target.eventId)
    }

    const focusLane = (category: Category) => {
      controls.unlock()
      const x = LANE_X[category]
      const toPos = new THREE.Vector3(x, EYE_Y, camera.position.z)
      const lookAt = new THREE.Vector3(x, EYE_Y, camera.position.z + 12)
      beginFly(toPos, lookAt)
    }

    const focusEdge = (edge: 'newest' | 'oldest') => {
      const target = edge === 'newest' ? ordered[0] : ordered[ordered.length - 1]
      if (target) focusById(target.eventId)
    }

    focusRelativeRef.current = focusRelative
    focusLaneRef.current = focusLane
    focusEdgeRef.current = focusEdge

    const tryPick = (clientX?: number, clientY?: number): boolean => {
      if (detailIdRef.current) return false
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
      const id = found[0]?.object.userData.eventId as string | undefined
      if (id) {
        focusById(id)
        return true
      }
      return false
    }

    const onClick = (ev: MouseEvent) => {
      if (detailIdRef.current) return
      if (controls.isLocked) {
        tryPick()
        return
      }
      if (tryPick(ev.clientX, ev.clientY)) return
      if (!isTouchPrimary()) controls.lock()
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
      if (e.code === 'BracketLeft') {
        e.preventDefault()
        focusRelative(1)
      } else if (e.code === 'BracketRight') {
        e.preventDefault()
        focusRelative(-1)
      } else if (e.code === 'Digit1') {
        focusLane('model')
      } else if (e.code === 'Digit2') {
        focusLane('product')
      } else if (e.code === 'Digit3') {
        focusLane('science')
      } else if (e.code === 'Home') {
        e.preventDefault()
        focusEdge('newest')
      } else if (e.code === 'End') {
        e.preventDefault()
        focusEdge('oldest')
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
    let lodLast = 0

    /** Near boards get a 2× texture lazily; far ones fall back to the low-res map. */
    const updateLod = (now: number) => {
      if (now - lodLast < 160) return
      lodLast = now
      let budget = 1
      for (const hit of hits) {
        const mesh = hit.mesh
        const event = mesh.userData.event as TimelineEvent | undefined
        const lowTexture = mesh.userData.lowTexture as THREE.Texture | undefined
        if (!event || !lowTexture) continue
        const hiTexture = mesh.userData.hiTexture as THREE.Texture | null
        const distance = mesh.position.distanceTo(camera.position)
        if (distance < 14 && !hiTexture && budget > 0) {
          const hi = makeBoardTexture(event, companies, logoImages, 2)
          const mat = mesh.material as THREE.MeshBasicMaterial
          mat.map = hi
          mat.needsUpdate = true
          mesh.userData.hiTexture = hi
          budget -= 1
        } else if (distance > 24 && hiTexture) {
          const mat = mesh.material as THREE.MeshBasicMaterial
          mat.map = lowTexture
          mat.needsUpdate = true
          mesh.userData.hiTexture = null
          hiTexture.dispose()
        }
      }
    }

    const animate = () => {
      if (!alive) return
      raf = requestAnimationFrame(animate)
      const dt = Math.min(0.05, clock.getDelta())
      const now = performance.now()

      if (isTouchPrimary() && !fly) {
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

      if (fly) {
        const t = Math.min(1, (now - fly.start) / 850)
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
        camera.position.lerpVectors(fly.fromPos, fly.toPos, ease)
        camera.quaternion.slerpQuaternions(fly.fromQuat, fly.toQuat, ease)
        if (t >= 1) fly = null
      } else {
        camera.position.add(velocity)
        // bounds
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, -16, 16)
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, 0.5, maxZ)
        camera.position.y = EYE_Y
      }

      // void yaw unused warning in desktop path
      void yaw

      updateLod(now)
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
  }, [events, companies, logoImages])

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
        <div className="gallery-topbar__title">
          跑道展板
          <span className="gallery-topbar__badge">原型</span>
        </div>
        <div className="gallery-topbar__hint">{hint}</div>
      </div>

      <div className="gallery-stage" ref={mountRef}>
        {!locked && !touchUi && !detailId ? (
          <button
            type="button"
            className="gallery-enter"
            onClick={() => {
              // direct pointer lock; a synthetic canvas click at 0,0 can
              // accidentally pick a board and open its drawer instead.
              lockRef.current()
            }}
          >
            点击进入展厅
            <small>点击展板会飞过去 · 鼠标转向 · W 向里 = 更早</small>
          </button>
        ) : null}
      </div>

      <div className="gallery-hud" aria-label="展厅控制">
        <div className="gallery-hud__group" role="group" aria-label="切换跑道">
          {LANE_ORDER.map((cat) => (
            <button
              key={cat}
              type="button"
              className="gallery-hud__btn"
              onClick={() => focusLaneRef.current(cat)}
            >
              <i style={{ background: CATEGORY_THEME[cat].accent }} />
              {CATEGORY_LABEL_ZH[cat]}
            </button>
          ))}
        </div>
        <div className="gallery-hud__group" role="group" aria-label="按时间前后">
          <button
            type="button"
            className="gallery-hud__btn"
            onClick={() => focusEdgeRef.current('newest')}
          >
            最新
          </button>
          <button
            type="button"
            className="gallery-hud__btn"
            onClick={() => focusRelativeRef.current(-1)}
          >
            更新
          </button>
          <button
            type="button"
            className="gallery-hud__btn"
            onClick={() => focusRelativeRef.current(1)}
          >
            更早
          </button>
          <button
            type="button"
            className="gallery-hud__btn"
            onClick={() => focusEdgeRef.current('oldest')}
          >
            最早
          </button>
        </div>
        <span className="gallery-hud__hint">
          1/2/3 切道 · [ ] 前后 · 点击展板飞过去
        </span>
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
