import type {
  Category,
  ProductSubcategory,
  TimelineEvent,
} from '../types/timeline'
import {
  PRODUCT_SUBCATEGORY_CHIP_ORDER,
  PRODUCT_SUBCATEGORY_LABEL_ZH,
} from './labels'

export type SubGroup = {
  key: string
  label: string
  events: TimelineEvent[]
}

function sortByDateAsc(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((a, b) => a.date.localeCompare(b.date))
}

/** Series chip label for models: "GPT系列" style when short family name */
export function seriesChipLabel(series: string): string {
  if (/系列$/.test(series)) return series
  // Keep multi-word product lines as-is (ChatGPT, Claude Code, …)
  if (/\s/.test(series) || series.length > 12) return series
  return `${series}系列`
}

export function groupKeyForEvent(
  category: Category,
  e: TimelineEvent,
): { key: string; label: string } {
  if (category === 'product') {
    const sub = (e.productSubcategory ?? 'other_product') as ProductSubcategory
    return {
      key: sub,
      label: PRODUCT_SUBCATEGORY_LABEL_ZH[sub] ?? sub,
    }
  }
  if (category === 'model' || category === 'science') {
    const s = e.series?.trim() || '其他'
    return { key: `series:${s}`, label: seriesChipLabel(s) }
  }
  // concept / other — theme by tags
  const tags = e.tags ?? []
  if (tags.some((t) => t.includes('agent'))) {
    return { key: 'theme:agent', label: 'Agent' }
  }
  if (tags.includes('multimodal')) {
    return { key: 'theme:multimodal', label: '多模态' }
  }
  if (tags.some((t) => ['policy', 'regulation', 'funding', 'acquisition'].includes(t))) {
    return { key: 'theme:policy', label: '政策/资本' }
  }
  return { key: 'theme:other', label: '其他' }
}

export function buildSubGroups(
  category: Category,
  events: TimelineEvent[],
): SubGroup[] {
  const map = new Map<string, SubGroup>()
  for (const e of events) {
    const { key, label } = groupKeyForEvent(category, e)
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
  } else {
    groups.sort((a, b) => {
      const da = a.events[0]?.date ?? ''
      const db = b.events[0]?.date ?? ''
      return da.localeCompare(db) || a.label.localeCompare(b.label, 'zh')
    })
  }
  return groups
}
