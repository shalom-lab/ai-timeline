import type { CSSProperties } from 'react'
import { CompanyLogoImg, hasCompanyLogo } from '../lib/icons'
import type { Company } from '../types/timeline'
import './brand-mark.css'

export function brandStyle(company?: Company): CSSProperties {
  return { '--event-tone': company?.color ?? '#447463', '--event-soft': company?.colorSoft } as CSSProperties
}

export default function BrandMark({ id, name, size = 13 }: { id: string; name: string; size?: number }) {
  return <span className="brand-mark" aria-hidden="true" style={{ '--mark-size': `${size}px` } as CSSProperties}>
    {hasCompanyLogo(id) ? <CompanyLogoImg companyId={id} size={size} /> : Array.from(name.trim())[0]?.toUpperCase() ?? '?'}
  </span>
}
