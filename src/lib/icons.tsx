import { useId, type ReactNode } from 'react'
import type { ModelCapability } from '../types/timeline'
import { MODEL_CAPABILITY_LABEL_ZH, MODEL_CAPABILITY_ORDER } from '../types/timeline'
import { resolveCompany } from './company'
import type { Company } from '../types/timeline'
import type { ToolColumnId } from '../types/tools'

/**
 * Company ids with a real brand asset under public/logos/{id}.{png|svg}.
 * Sources: see public/logos/SOURCES.md (Simple Icons / Lobe Icons / official CDN — not invented).
 * cognition: no verified public SVG yet → letter avatar.
 *
 * Prefer PNG when present (e.g. Doubao character avatar), else SVG.
 */
export const COMPANY_LOGO_EXT: Record<string, 'png' | 'svg'> = {
  openai: 'svg',
  anthropic: 'svg',
  google: 'svg',
  meta: 'svg',
  microsoft: 'svg',
  github: 'svg',
  xai: 'svg',
  deepseek: 'svg',
  alibaba: 'svg',
  tencent: 'svg',
  bytedance: 'png', // Doubao official character avatar
  moonshot: 'svg',
  minimax: 'svg',
  deepmind: 'svg',
  cursor: 'svg',
  zhipu: 'svg', // 清言 Qingyan double-ring
}

export const COMPANY_LOGO_IDS = new Set(Object.keys(COMPANY_LOGO_EXT))

/** @deprecated use COMPANY_LOGO_IDS / hasCompanyLogo */
export const COMPANY_MARK_IDS = COMPANY_LOGO_IDS

export function hasCompanyLogo(companyId?: string): boolean {
  return Boolean(companyId && COMPANY_LOGO_IDS.has(companyId))
}

/** @deprecated use hasCompanyLogo */
export function hasCompanyMark(companyId?: string): boolean {
  return hasCompanyLogo(companyId)
}

function logoUrl(companyId: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const root = base.endsWith('/') ? base : `${base}/`
  const ext = COMPANY_LOGO_EXT[companyId] ?? 'svg'
  return `${root}logos/${companyId}.${ext}`
}

export function CompanyLogoImg({
  companyId,
  size = 14,
  title,
}: {
  companyId: string
  size?: number
  title?: string
}): ReactNode {
  return (
    <img
      className="co-logo"
      src={logoUrl(companyId)}
      alt=""
      title={title}
      width={size}
      height={size}
      draggable={false}
      loading="lazy"
    />
  )
}

/**
 * Resolve event.company → companies[] (name / id / aliases), then show that
 * company's real logo. Letter avatar ONLY when no logo file is keyed for the id.
 */
export function CompanyAvatar({
  companies,
  companyName,
  size = 16,
}: {
  companies: Company[]
  companyName: string
  size?: number
}): ReactNode {
  const co = resolveCompany(companies, companyName)
  const color = co?.color ?? '#94A3B8'
  const id = co?.id

  if (hasCompanyLogo(id)) {
    return (
      <span
        className="co-avatar"
        style={{ width: size, height: size, color }}
        title={co?.name ?? companyName}
        data-company-id={id}
      >
        <CompanyLogoImg
          companyId={id!}
          size={Math.round(size * 0.9)}
          title={co?.name ?? companyName}
        />
      </span>
    )
  }

  const letter = (co?.name ?? companyName).trim().slice(0, 1).toUpperCase() || '?'
  return (
    <span
      className="co-avatar co-avatar--letter"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: Math.max(9, size * 0.55),
      }}
      title={co?.name ?? companyName}
      data-company-id={id ?? 'unknown'}
      aria-hidden
    >
      {letter}
    </span>
  )
}


/**
 * Capability glyphs only (no chip pad behind them): per-type soft color in the SVG.
 * `image` is a colorful picture glyph; `reasoning` is a brain.
 * Gradient ids use React useId so many chips on one page do not collide.
 */
function CapIcon({ kind, size = 18 }: { kind: ModelCapability; size?: number }) {
  const uid = useId().replace(/:/g, '')
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const }
  switch (kind) {
    case 'chat': {
      const g = `capChat-${uid}`
      return (
        <svg {...s} aria-hidden>
          <defs>
            <linearGradient id={g} x1="5" y1="2" x2="19" y2="16" gradientUnits="userSpaceOnUse">
              <stop stopColor="#93C5FD" />
              <stop offset="1" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
          <path
            d="M5 5.5A3.5 3.5 0 0 1 8.5 2h7A3.5 3.5 0 0 1 19 5.5v6A3.5 3.5 0 0 1 15.5 15H11l-4.2 2.8c-.7.47-1.65-.08-1.5-.9L6 15.2A3.5 3.5 0 0 1 5 11.5z"
            fill={`url(#${g})`}
            stroke="#1D4ED8"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <circle cx="9.2" cy="8.4" r="1" fill="#1E3A8A" />
          <circle cx="12" cy="8.4" r="1" fill="#1E3A8A" />
          <circle cx="14.8" cy="8.4" r="1" fill="#1E3A8A" />
        </svg>
      )
    }
    case 'reasoning': {
      const g = `capBrain-${uid}`
      return (
        <svg {...s} aria-hidden>
          <defs>
            <linearGradient id={g} x1="7" y1="3" x2="18" y2="19" gradientUnits="userSpaceOnUse">
              <stop stopColor="#DDD6FE" />
              <stop offset="1" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          <path
            d="M9.2 4.2a3.1 3.1 0 0 1 5.6 0 3 3 0 0 1 3.7 3.4 3 3 0 0 1 1.3 4.1 3.1 3.1 0 0 1-2.3 3.8v1.7a1.6 1.6 0 0 1-1.6 1.6h-5.2a1.6 1.6 0 0 1-1.6-1.6v-1.7a3.1 3.1 0 0 1-2.3-3.8 3 3 0 0 1 1.3-4.1 3 3 0 0 1 1.1-3.4z"
            fill={`url(#${g})`}
            stroke="#6D28D9"
            strokeWidth="1.15"
            strokeLinejoin="round"
          />
          <path d="M10 13.8h4M10.4 11.2c.7-.8 1.4-1.2 2.1-1.2s1.4.4 2.1 1.2" stroke="#4C1D95" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M9.6 8.2c.5-.6 1.2-.9 2.4-.9s1.9.3 2.4.9" stroke="#5B21B6" strokeWidth="1.05" strokeLinecap="round" opacity="0.85" />
        </svg>
      )
    }
    case 'image': {
      const sky = `capImgSky-${uid}`
      const hill = `capImgHill-${uid}`
      return (
        <svg {...s} aria-hidden>
          <defs>
            <linearGradient id={sky} x1="2.5" y1="4.5" x2="21.5" y2="19.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#BAE6FD" />
              <stop offset="0.55" stopColor="#7DD3FC" />
              <stop offset="1" stopColor="#38BDF8" />
            </linearGradient>
            <linearGradient id={hill} x1="3" y1="12" x2="21" y2="19" gradientUnits="userSpaceOnUse">
              <stop stopColor="#86EFAC" />
              <stop offset="1" stopColor="#22C55E" />
            </linearGradient>
          </defs>
          <rect x="2.5" y="4.5" width="19" height="15" rx="2.4" fill={`url(#${sky})`} stroke="#0E7490" strokeWidth="1.15" />
          <circle cx="8.2" cy="9.2" r="2" fill="#FBBF24" stroke="#D97706" strokeWidth="0.8" />
          <path d="M3.2 16.8l5.1-4.2 3.4 2.6 3.1-2.4 6 4" fill={`url(#${hill})`} stroke="#15803D" strokeWidth="1" strokeLinejoin="round" />
        </svg>
      )
    }
    case 'video': {
      const g = `capVid-${uid}`
      return (
        <svg {...s} aria-hidden>
          <defs>
            <linearGradient id={g} x1="2.5" y1="5.5" x2="16" y2="18.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDBA74" />
              <stop offset="1" stopColor="#F97316" />
            </linearGradient>
          </defs>
          <rect x="2.5" y="5.5" width="13.5" height="13" rx="2.2" fill={`url(#${g})`} stroke="#C2410C" strokeWidth="1.15" />
          <path d="M16.2 9.2l5.1-2.8v11.2l-5.1-2.8z" fill="#FB923C" stroke="#C2410C" strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M7.2 9.6l4.2 2.4-4.2 2.4z" fill="#FFF7ED" />
        </svg>
      )
    }
    case 'vision': {
      const g = `capEye-${uid}`
      return (
        <svg {...s} aria-hidden>
          <defs>
            <linearGradient id={g} x1="2.5" y1="5.4" x2="21.5" y2="18.6" gradientUnits="userSpaceOnUse">
              <stop stopColor="#A5F3FC" />
              <stop offset="1" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
          <path
            d="M2.5 12s3.6-6.6 9.5-6.6S21.5 12 21.5 12s-3.6 6.6-9.5 6.6S2.5 12 2.5 12z"
            fill={`url(#${g})`}
            stroke="#0E7490"
            strokeWidth="1.15"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="3.15" fill="#ECFEFF" stroke="#155E75" strokeWidth="1.1" />
          <circle cx="12" cy="12" r="1.35" fill="#0F766E" />
          <circle cx="12.7" cy="11.3" r="0.45" fill="#ECFEFF" />
        </svg>
      )
    }
    case 'audio': {
      const g = `capMic-${uid}`
      return (
        <svg {...s} aria-hidden>
          <defs>
            <linearGradient id={g} x1="9" y1="2.8" x2="15" y2="14" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6EE7B7" />
              <stop offset="1" stopColor="#10B981" />
            </linearGradient>
          </defs>
          <rect x="9" y="2.8" width="6" height="11.2" rx="3" fill={`url(#${g})`} stroke="#047857" strokeWidth="1.15" />
          <path d="M5.4 11.2a6.6 6.6 0 0 0 13.2 0" stroke="#059669" strokeWidth="1.35" strokeLinecap="round" />
          <path d="M12 17.8v3.2M9.2 21h5.6" stroke="#047857" strokeWidth="1.35" strokeLinecap="round" />
        </svg>
      )
    }
  }
}

/** Compact capability icon row for category === 'model' EventCards. */
export function ModelCapabilityIcons({
  capabilities,
}: {
  capabilities?: ModelCapability[]
}): ReactNode {
  if (!capabilities?.length) return null
  const order = new Map(MODEL_CAPABILITY_ORDER.map((c, i) => [c, i]))
  const sorted = [...capabilities].sort(
    (a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99),
  )
  return (
    <ul className="event-card__caps" aria-label="模型能力">
      {sorted.map((c) => (
        <li key={c} className="event-card__cap" title={MODEL_CAPABILITY_LABEL_ZH[c]} data-cap={c}>
          <CapIcon kind={c} />
          <span className="sr-only">{MODEL_CAPABILITY_LABEL_ZH[c]}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Calm stroke glyphs for AI工具 column headers (not brand marks).
 * Uses currentColor so thead muted tone carries through.
 */
export function ToolColumnIcon({
  columnId,
  size = 13,
}: {
  columnId: ToolColumnId
  size?: number
}): ReactNode {
  const s = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }
  switch (columnId) {
    case 'llm':
      // chat / language bubble
      return (
        <svg {...s}>
          <path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v5A3.5 3.5 0 0 1 15.5 15H11l-4 2.7c-.65.44-1.5-.08-1.35-.85L6.2 15A3.5 3.5 0 0 1 5 11.5z" />
          <path d="M9 8.5h6M9 11.2h3.5" />
        </svg>
      )
    case 'image':
      return (
        <svg {...s}>
          <rect x="3.5" y="5" width="17" height="14" rx="2.2" />
          <circle cx="9" cy="10" r="1.4" />
          <path d="M3.8 16.2l4.6-3.6 3.1 2.4 3-2.5 5.5 4" />
        </svg>
      )
    case 'video':
      return (
        <svg {...s}>
          <rect x="3" y="6" width="12.5" height="12" rx="2" />
          <path d="M15.5 10.2l5-2.7v9l-5-2.7z" />
        </svg>
      )
    case 'other':
      // spark / misc
      return (
        <svg {...s}>
          <path d="M12 3.5v3.2M12 17.3v3.2M3.5 12h3.2M17.3 12h3.2" />
          <path d="M6.6 6.6l2.2 2.2M15.2 15.2l2.2 2.2M17.4 6.6l-2.2 2.2M8.8 15.2l-2.2 2.2" />
          <circle cx="12" cy="12" r="2.2" />
        </svg>
      )
    case 'chat':
      return (
        <svg {...s}>
          <path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v5A3.5 3.5 0 0 1 15.5 15H11l-4 2.7c-.65.44-1.5-.08-1.35-.85L6.2 15A3.5 3.5 0 0 1 5 11.5z" />
          <circle cx="9.2" cy="9.2" r="0.85" fill="currentColor" stroke="none" />
          <circle cx="12" cy="9.2" r="0.85" fill="currentColor" stroke="none" />
          <circle cx="14.8" cy="9.2" r="0.85" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'coding':
      return (
        <svg {...s}>
          <path d="M9 7.5L5.5 12 9 16.5M15 7.5L18.5 12 15 16.5" />
        </svg>
      )
    case 'api':
      // plug / connector
      return (
        <svg {...s}>
          <path d="M9 4.5v5M15 4.5v5" />
          <path d="M7.5 9.5h9v3.2a4.5 4.5 0 0 1-4.5 4.5h0a4.5 4.5 0 0 1-4.5-4.5z" />
          <path d="M12 17.2V20" />
        </svg>
      )
  }
}
