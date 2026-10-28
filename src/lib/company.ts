import type { Company } from '../types/timeline'

export function resolveCompany(
  companies: Company[],
  name: string,
): Company | undefined {
  const lower = name.toLowerCase()
  return companies.find(
    (c) =>
      c.name.toLowerCase() === lower ||
      c.id === lower ||
      c.aliases?.some((a) => a.toLowerCase() === lower),
  )
}

export function companyColor(
  companies: Company[],
  name: string,
): { color: string; soft: string } {
  const co = resolveCompany(companies, name)
  return {
    color: co?.color ?? '#94A3B8',
    soft: co?.colorSoft ?? '#EEF1F6',
  }
}
