import type { Company } from '../types/timeline'

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Resolve event.company string → companies[] entry.
 * Match order: exact name → exact id → aliases (never fuzzy partials).
 */
export function resolveCompany(
  companies: Company[],
  name: string,
): Company | undefined {
  const key = norm(name)
  if (!key) return undefined
  const byName = companies.find((c) => norm(c.name) === key)
  if (byName) return byName
  const byId = companies.find((c) => c.id === key)
  if (byId) return byId
  return companies.find((c) => c.aliases?.some((a) => norm(a) === key))
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
