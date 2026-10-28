import type {
  Category,
  Company,
  ProductSubcategory,
  ScienceDiscipline,
  TimelineEvent,
} from '../types/timeline'
import {
  PRODUCT_SUBCATEGORY_CHIP_ORDER,
  PRODUCT_SUBCATEGORY_LABEL_ZH,
  SCIENCE_DISCIPLINE_CHIP_ORDER,
  SCIENCE_DISCIPLINE_LABEL_ZH,
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

/** Series chip label (legacy / search); science board no longer groups by series. */
export function seriesChipLabel(series: string): string {
  if (/系列$/.test(series)) return series
  // Keep multi-word product lines as-is (ChatGPT, Claude Code, …)
  if (/\s/.test(series) || series.length > 12) return series
  return `${series}系列`
}

/** Tag → discipline fallback when scienceDiscipline is missing. */
const TAG_DISCIPLINE: { tag: string; disc: ScienceDiscipline }[] = [
  { tag: 'biology', disc: 'life' },
  { tag: 'genomics', disc: 'life' },
  { tag: 'protein', disc: 'life' },
  { tag: 'protein-design', disc: 'life' },
  { tag: 'structural-biology', disc: 'life' },
  { tag: 'alphafold', disc: 'life' },
  { tag: 'alphagenome', disc: 'life' },
  { tag: 'antibiotics', disc: 'life' },
  { tag: 'drug-discovery', disc: 'life' },
  { tag: 'synthetic-biology', disc: 'life' },
  { tag: 'phage', disc: 'life' },
  { tag: 'nobel', disc: 'life' },
  { tag: 'evo', disc: 'life' },
  { tag: 'mathematics', disc: 'math' },
  { tag: 'geometry', disc: 'math' },
  { tag: 'imo', disc: 'math' },
  { tag: 'theorem-proving', disc: 'math' },
  { tag: 'algorithms', disc: 'math' },
  { tag: 'complexity-theory', disc: 'math' },
  { tag: 'materials', disc: 'materials' },
  { tag: 'chemistry', disc: 'materials' },
  { tag: 'weather', disc: 'earth' },
  { tag: 'climate', disc: 'earth' },
  { tag: 'earth-science', disc: 'earth' },
]

export function resolveScienceDiscipline(e: TimelineEvent): ScienceDiscipline {
  if (e.scienceDiscipline) return e.scienceDiscipline
  const tags = e.tags ?? []
  for (const { tag, disc } of TAG_DISCIPLINE) {
    if (tags.includes(tag)) return disc
  }
  return 'other'
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
    const disc = resolveScienceDiscipline(e)
    return {
      key: disc,
      label: SCIENCE_DISCIPLINE_LABEL_ZH[disc] ?? disc,
    }
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
  } else if (category === 'science') {
    const order = new Map(
      SCIENCE_DISCIPLINE_CHIP_ORDER.map((k, i) => [k as string, i]),
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
