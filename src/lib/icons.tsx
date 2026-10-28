import type { ReactNode } from 'react'
import type { TimelineEvent } from '../types/timeline'
import { resolveCompany } from './company'
import type { Company } from '../types/timeline'

/**
 * Company ids with a real brand asset under public/logos/{id}.svg.
 * Sources: see public/logos/SOURCES.md (Simple Icons / Wikimedia — not invented).
 * cognition: no verified public SVG yet → letter avatar.
 */
export const COMPANY_LOGO_IDS = new Set([
  'openai',
  'anthropic',
  'google',
  'meta',
  'microsoft',
  'github',
  'xai',
  'deepseek',
  'alibaba',
  'tencent',
  'bytedance',
  'moonshot',
  'minimax',
  'deepmind', // Google mark fallback — see SOURCES.md
  'cursor',
])

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
  return `${root}logos/${companyId}.svg`
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

function IconAgent({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6" cy="12" r="2.5" stroke={color} strokeWidth="1.8" />
      <circle cx="18" cy="6" r="2.5" stroke={color} strokeWidth="1.8" />
      <circle cx="18" cy="18" r="2.5" stroke={color} strokeWidth="1.8" />
      <path d="M8.3 11l7-3.5M8.3 13l7 3.5" stroke={color} strokeWidth="1.8" />
    </svg>
  )
}

function IconMultimodal({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth="1.8" />
      <circle cx="9" cy="11" r="2" fill={color} />
      <path d="M3 16l5-4 4 3 3-2 6 4" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function IconScience({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 3h6M10 3v4.5L5.5 18a3 3 0 0 0 2.7 4.5h7.6A3 3 0 0 0 18.5 18L14 7.5V3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8 14h8" stroke={color} strokeWidth="1.8" />
    </svg>
  )
}

function IconConcept({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
      <path
        d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconProduct({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="1.8" />
      <path d="M8 12h8M12 8v8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

/** Large left tile icon for a card (company logo or thematic). */
export function CardMainIcon({
  event,
  companies,
  accent,
}: {
  event: TimelineEvent
  companies: Company[]
  accent: string
}): ReactNode {
  const co = resolveCompany(companies, event.company)
  const color = co?.color ?? accent
  const tags = event.tags ?? []
  const soft = co?.colorSoft ?? `${accent}22`

  // Company logo ALWAYS wins when event.company resolves to a known id with asset.
  let inner: ReactNode
  if (hasCompanyLogo(co?.id)) {
    inner = <CompanyLogoImg companyId={co!.id} size={22} title={co?.name} />
  } else if (event.category === 'science') {
    inner = <IconScience color={color} />
  } else if (event.category === 'concept') {
    if (tags.some((t) => t.includes('agent') || t.includes('harness') || t.includes('skill'))) {
      inner = <IconAgent color={color} />
    } else if (tags.includes('multimodal')) {
      inner = <IconMultimodal color={color} />
    } else {
      inner = <IconConcept color={color} />
    }
  } else {
    inner = <IconProduct color={color} />
  }

  return (
    <span
      className="event-card__icon-tile"
      style={{ background: soft, color }}
      data-company-id={co?.id ?? 'none'}
      aria-hidden
    >
      {inner}
    </span>
  )
}
