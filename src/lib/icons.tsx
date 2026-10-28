import type { ReactNode } from 'react'
import type { TimelineEvent } from '../types/timeline'
import { resolveCompany } from './company'
import type { Company } from '../types/timeline'

/** Company ids that have a dedicated SVG mark in CompanyMark. */
export const COMPANY_MARK_IDS = new Set([
  'openai',
  'anthropic',
  'google',
  'meta',
  'microsoft',
  'github',
  'xai',
  'cognition',
  'deepseek',
  'alibaba',
  'tencent',
  'moonshot',
  'minimax',
  'deepmind',
])

export function hasCompanyMark(companyId?: string): boolean {
  return Boolean(companyId && COMPANY_MARK_IDS.has(companyId))
}

/**
 * Geometric / Simple-Icons-style marks keyed ONLY by companies[].id.
 * Callers must resolve event.company → Company via resolveCompany first.
 */
export function CompanyMark({
  companyId,
  color,
  size = 14,
}: {
  companyId?: string
  color: string
  size?: number
}): ReactNode {
  if (!companyId || !COMPANY_MARK_IDS.has(companyId)) return null

  const s = size
  const common = {
    width: s,
    height: s,
    viewBox: '0 0 24 24',
    fill: color,
    'aria-hidden': true as const,
  }

  switch (companyId) {
    case 'openai':
      // Stylized 6-petal blossom (Simple Icons–style)
      return (
        <svg {...common}>
          <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.911 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.182a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .516 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.142-.081 4.778-2.758a.795.795 0 0 0 .393-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.495 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.758a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.499 4.499 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.383-1.98L4.923 6.03l4.778 2.758a.795.795 0 0 0 .785 0l5.843-3.369-2.02-1.169a.08.08 0 0 1-.027-.01L9.74 2.05a4.5 4.5 0 0 1-7.4 5.846zm16.697 2.99-5.843 3.368v-4.664a.08.08 0 0 1 .033-.062l4.744-2.757a4.5 4.5 0 0 1 .666 7.115zm1.97-3.138-.141-.085-4.778-2.758a.794.794 0 0 0-.78 0l-5.843 3.369 2.02 1.168a.074.074 0 0 1 .027.012l4.745 2.737a4.5 4.5 0 0 1 4.75-4.443z" />
        </svg>
      )
    case 'anthropic':
      // Stylized A
      return (
        <svg {...common}>
          <path d="M13.55 2.5L5.8 21.5h3.45l1.35-3.55h6.05L18 21.5h3.5L13.95 2.5h-.4zm.2 5.55l2.15 5.95h-4.3l2.15-5.95z" />
        </svg>
      )
    case 'google':
    case 'deepmind':
      return (
        <svg {...common} fill="none">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09A6.97 6.97 0 0 1 5.48 12c0-.72.13-1.41.36-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.37l3.66-3.28z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )
    case 'meta':
      // Infinity / Meta mark
      return (
        <svg {...common}>
          <path d="M12.001 6.5c-2.55 0-4.3 1.72-5.05 3.3C6.2 8.22 4.55 6.5 2.15 6.5.9 6.5 0 7.55 0 9.15 0 13.4 4.3 17.5 8.1 17.5c1.7 0 3.05-.7 4-1.85.95 1.15 2.3 1.85 4 1.85 3.8 0 8.1-4.1 8.1-8.35 0-1.6-.9-2.65-2.15-2.65-2.4 0-4.05 1.72-4.8 3.3-.75-1.58-2.5-3.3-5.05-3.3zm-3.7 7.55c-1.9 0-4.05-2.35-4.55-4.95.55-.05 1.05-.2 1.45-.45.95 1.55 2.25 2.65 3.35 2.65.55 0 .95-.25 1.15-.7.15 1.1.55 2.25 1.5 3.05-.7.3-1.55.4-2.9.4zm7.4 0c-1.35 0-2.2-.1-2.9-.4.95-.8 1.35-1.95 1.5-3.05.2.45.6.7 1.15.7 1.1 0 2.4-1.1 3.35-2.65.4.25.9.4 1.45.45-.5 2.6-2.65 4.95-4.55 4.95z" />
        </svg>
      )
    case 'microsoft':
      return (
        <svg {...common} fill="none">
          <rect x="2" y="2" width="9" height="9" fill="#F25022" />
          <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
          <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
          <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
        </svg>
      )
    case 'github':
      return (
        <svg {...common}>
          <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.8c.85 0 1.71.12 2.51.35 1.91-1.32 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .26.18.59.69.48A10.27 10.27 0 0 0 22 12.26C22 6.58 17.52 2 12 2z" />
        </svg>
      )
    case 'xai':
      return (
        <svg {...common}>
          <path d="M4 4l7.2 9.6L4.4 20H7l4.4-5.2L15.8 20H20l-7.4-9.9L19.6 4H17l-4.1 4.9L8.4 4H4z" />
        </svg>
      )
    case 'deepseek':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="2" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      )
    case 'alibaba':
      return (
        <svg {...common}>
          <path d="M3 16.5c2.8-1.2 5.6-2 8.5-2.2V7.8c0-.7.6-1.3 1.3-1.3h.4c.7 0 1.3.6 1.3 1.3v6.5c2.9.2 5.7 1 8.5 2.2l-.6 1.7c-2.9-1.1-5.9-1.7-9-1.8h-1c-3.1.1-6.1.7-9 1.8L3 16.5z" />
        </svg>
      )
    case 'tencent':
      return (
        <svg {...common}>
          <path d="M12 3c-2.2 1.8-3.8 4.2-4.5 6.8-.4 1.5-.4 3 0 4.4C6.3 15.4 4.8 17 4 19c1.8-.4 3.4-1.2 4.7-2.3.9.5 1.9.8 3 .9v3.4h1.5v-3.4c1.1-.1 2.1-.4 3-.9 1.3 1.1 2.9 1.9 4.7 2.3-.8-2-2.3-3.6-3.5-4.8.4-1.4.4-2.9 0-4.4C15.8 7.2 14.2 4.8 12 3z" />
        </svg>
      )
    case 'cognition':
      return (
        <svg {...common}>
          <circle cx="8" cy="12" r="3" />
          <circle cx="16" cy="8" r="2.5" />
          <circle cx="16" cy="16" r="2.5" />
          <path
            d="M10.5 11.2l3.2-2.2M10.5 12.8l3.2 2.2"
            fill="none"
            stroke={color}
            strokeWidth="1.6"
          />
        </svg>
      )
    case 'moonshot':
      return (
        <svg {...common}>
          <path d="M15.5 3.5A9 9 0 1 0 20.5 14 7.5 7.5 0 0 1 15.5 3.5z" />
        </svg>
      )
    case 'minimax':
      return (
        <svg {...common}>
          <path d="M4 18V6l4 6 4-6 4 6 4-6v12h-2.2V10.5L15.5 16l-3.5-5.2L8.5 16 6.2 10.5V18H4z" />
        </svg>
      )
    default:
      return null
  }
}

/**
 * Resolve event.company → companies[] (name / id / aliases), then show that
 * company's mark. Letter avatar ONLY when no mark is defined for the id.
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

  if (hasCompanyMark(id)) {
    return (
      <span
        className="co-avatar"
        style={{ width: size, height: size, color }}
        title={co?.name ?? companyName}
        data-company-id={id}
      >
        <CompanyMark companyId={id} color={color} size={Math.round(size * 0.85)} />
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

/** Large left tile icon for a card (company mark or thematic). */
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

  let inner: ReactNode
  if (event.category === 'science') {
    inner = <IconScience color={color} />
  } else if (event.category === 'concept') {
    if (tags.some((t) => t.includes('agent') || t.includes('harness') || t.includes('skill'))) {
      inner = <IconAgent color={color} />
    } else if (tags.includes('multimodal')) {
      inner = <IconMultimodal color={color} />
    } else {
      inner = <IconConcept color={color} />
    }
  } else if (hasCompanyMark(co?.id)) {
    inner = <CompanyMark companyId={co!.id} color={color} size={22} />
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
