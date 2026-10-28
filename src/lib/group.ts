import type {
  Category,
  Company,
  ProductSubcategory,
  TimelineEvent,
} from '../types/timeline'
import {
  PRODUCT_SUBCATEGORY_CHIP_ORDER,
  PRODUCT_SUBCATEGORY_LABEL_ZH,
} from './labels'
import { resolveCompany } from './company'

export type SubGroup = {
  key: string
  label: string
  events: TimelineEvent[]
}

function sortByDateAsc(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((a, b) => a.date.localeCompare(b.date))
}

/** Series chip label for science (and legacy): "GPT系列" style when short family name */
export function seriesChipLabel(series: string): string {
  if (/系列$/.test(series)) return series
  // Keep multi-word product lines as-is (ChatGPT, Claude Code, …)
  if (/\s/.test(series) || series.length > 12) return series
  return `${series}系列`
}

/**
 * Sub-group key/label for a column.
 * Model column groups by **company** (companies[].id / name), not series —
 * so OpenAI GPT/o1/o3 stay together, DeepSeek + DeepSeek-R1 stay together, etc.
 */
export function groupKeyForEvent(
  category: Category,
  e: TimelineEvent,
  companies: Company[] = [],
): { key: string; label: string } {
  if (category === 'product') {
    const sub = (e.productSubcategory ?? 'other_product') as ProductSubcategory
    return {
      key: sub,
      label: PRODUCT_SUBCATEGORY_LABEL_ZH[sub] ?? sub,
    }
  }
  if (category === 'model') {
    const co = resolveCompany(companies, e.company)
    if (co) {
      return { key: `company:${co.id}`, label: co.name }
    }
    const name = e.company?.trim() || '其他'
    return { key: `company:${name}`, label: name }
  }
  if (category === 'science') {
    const s = e.series?.trim() || '其他'
    return { key: `series:${s}`, label: seriesChipLabel(s) }
  }
  // concept: flat chronological — do NOT force MCP/Skill/Harness theme chips
  if (category === 'concept') {
    return { key: 'flat', label: '全部' }
  }
  // other — light theme buckets only when tags clearly apply; else flat
  const tags = e.tags ?? []
  if (tags.some((t) => ['policy', 'regulation', 'funding', 'acquisition'].includes(t))) {
    return { key: 'theme:policy', label: '政策/资本' }
  }
  return { key: 'flat', label: '全部' }
}

export function buildSubGroups(
  category: Category,
  events: TimelineEvent[],
  companies: Company[] = [],
): SubGroup[] {
  const map = new Map<string, SubGroup>()
  for (const e of events) {
    const { key, label } = groupKeyForEvent(category, e, companies)
    let g = map.get(key)
    if (!g) {
      g = { key, label, events: [] }
      map.set(key, g)
    }
    g.events.push(e)
  }
  for (const g of map.values()) {
    g.events = sortByDateAsc(g.events)
  }

  const groups = [...map.values()]
  if (category === 'product') {
    const order = new Map(
      PRODUCT_SUBCATEGORY_CHIP_ORDER.map((k, i) => [k as string, i]),
    )
    groups.sort(
      (a, b) => (order.get(a.key) ?? 99) - (order.get(b.key) ?? 99),
    )
  } else if (category === 'model') {
    // Prefer companies[] dictionary order, then first-event date
    const coOrder = new Map(companies.map((c, i) => [`company:${c.id}`, i]))
    groups.sort((a, b) => {
      const oa = coOrder.has(a.key) ? coOrder.get(a.key)! : 999
      const ob = coOrder.has(b.key) ? coOrder.get(b.key)! : 999
      if (oa !== ob) return oa - ob
      const da = a.events[0]?.date ?? ''
      const db = b.events[0]?.date ?? ''
      return da.localeCompare(db) || a.label.localeCompare(b.label, 'zh')
    })
  } else {
    groups.sort((a, b) => {
      const da = a.events[0]?.date ?? ''
      const db = b.events[0]?.date ?? ''
      return da.localeCompare(db) || a.label.localeCompare(b.label, 'zh')
    })
  }
  return groups
}
