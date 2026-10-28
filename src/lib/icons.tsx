import type { ReactNode } from 'react'
import type { TimelineEvent } from '../types/timeline'
import { resolveCompany } from './company'
import type { Company } from '../types/timeline'

/** Geometric / Simple-Icons-style marks — not scraped trademark bitmaps. */
export function CompanyMark({
  companyId,
  color,
  size = 14,
}: {
  companyId?: string
  color: string
  size?: number
}): ReactNode {
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
      // Blossom approximation (6 petals)
      return (
        <svg {...common}>
          <path d="M22.28 8.72a5.98 5.98 0 0 0-2.54-4.05 6.05 6.05 0 0 0-6.5-.5 5.98 5.98 0 0 0-4.48-2.01A6.05 6.05 0 0 0 3.1 7.5a5.98 5.98 0 0 0-2.01 4.48 6.05 6.05 0 0 0 3.72 5.48 5.98 5.98 0 0 0 2.54 4.05 6.05 6.05 0 0 0 6.5.5 5.98 5.98 0 0 0 4.48 2.01 6.05 6.05 0 0 0 5.66-5.34 5.98 5.98 0 0 0 2.01-4.48 6.05 6.05 0 0 0-3.72-5.48zM12 16.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z" />
        </svg>
      )
    case 'anthropic':
      return (
        <svg {...common}>
          <path d="M13.6 3L7 21h3.2l1.2-3.4h5.3L18 21h3.2L14.6 3h-1zm.2 5.2l1.9 5.4h-3.8l1.9-5.4z" />
        </svg>
      )
    case 'google':
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
      return (
        <svg {...common}>
          <path d="M12 4c-2.8 0-4.6 1.9-5.4 3.6C5.7 5.9 3.9 4 1.1 4v2.2c1.7 0 2.9 1.1 3.6 2.4.3.6.5 1.3.5 2.1V20h2.3v-9.2c0-1.5.9-2.8 2.2-3.3.4-.1.8-.2 1.2-.2.9 0 1.6.3 2.1.9.5.6.8 1.4.8 2.4V20h2.3v-9.3c0-2.4-1.3-4.7-3.7-5.8C12.8 4.3 12.4 4 12 4z" />
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
  const mark = (
    <CompanyMark companyId={co?.id} color={color} size={Math.round(size * 0.85)} />
  )
  if (mark) {
    return (
      <span
        className="co-avatar"
        style={{ width: size, height: size, color }}
        title={companyName}
      >
        {mark}
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
      title={companyName}
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
    if (tags.some((t) => t.includes('agent'))) inner = <IconAgent color={color} />
    else if (tags.includes('multimodal')) inner = <IconMultimodal color={color} />
    else inner = <IconConcept color={color} />
  } else if (event.category === 'product') {
    const mark = <CompanyMark companyId={co?.id} color={color} size={22} />
    inner = mark ?? <IconProduct color={color} />
  } else {
    // model / other — prefer company mark
    const mark = <CompanyMark companyId={co?.id} color={color} size={22} />
    inner = mark ?? <IconProduct color={color} />
  }

  return (
    <span className="event-card__icon-tile" style={{ background: soft, color }} aria-hidden>
      {inner}
    </span>
  )
}
