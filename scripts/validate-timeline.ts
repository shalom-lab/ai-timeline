/**
 * Invariant checks for data/timeline.json (see docs/DATA.md §5).
 * Run: npm run validate
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { TimelineData, TimelineEvent, Company } from '../src/types/timeline'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dataPath = resolve(root, 'data/timeline.json')

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const HEX_RE = /^#[0-9A-Fa-f]{6}$/

const CATEGORIES = new Set(['model', 'product', 'concept', 'science', 'other'])
const SUBCATS = new Set([
  'ide',
  'cli',
  'work_assistant',
  'research_assistant',
  'search',
  'image',
  'video',
  'voice',
  'agent',
  'dev_platform',
  'chat',
  'other_product',
])
const EVENT_TYPES = new Set([
  'research_preview',
  'public_beta',
  'ga',
  'first_announce',
  'major_upgrade',
  'open_source',
  'discontinued',
  'rename_rebrand',
  'other',
])
const DATE_STATUS = new Set(['exact', 'approximate', 'unverified'])

function main() {
  const data = JSON.parse(readFileSync(dataPath, 'utf8')) as TimelineData
  const errors: string[] = []

  const push = (m: string) => errors.push(m)

  if (!data.meta) push('missing meta')
  else {
    if (data.meta.scopeStart !== '2022-11-30') {
      push(`meta.scopeStart must be 2022-11-30, got ${data.meta.scopeStart}`)
    }
    for (const k of ['updatedAt', 'scopeStart'] as const) {
      if (!DATE_RE.test(data.meta[k])) push(`meta.${k} bad date`)
    }
    if (!data.meta.ui?.openingBg?.trim()) {
      push('meta.ui.openingBg is required (CSS gradient or image URL)')
    }
    if (data.meta.ui?.openingFg && !HEX_RE.test(data.meta.ui.openingFg)) {
      push(`meta.ui.openingFg must be #RRGGBB, got ${data.meta.ui.openingFg}`)
    }
  }

  if (!Array.isArray(data.companies) || data.companies.length === 0) {
    push('companies must be a non-empty array')
  } else {
    const companyIds = new Set<string>()
    for (const c of data.companies) {
      validateCompany(c, push)
      if (companyIds.has(c.id)) push(`duplicate company id: ${c.id}`)
      companyIds.add(c.id)
    }
  }

  if (!Array.isArray(data.events)) push('events must be an array')
  else {
    const ids = new Set<string>()
    for (const e of data.events) {
      validateEvent(e, data.meta.scopeStart, push)
      if (ids.has(e.id)) push(`duplicate id: ${e.id}`)
      ids.add(e.id)
    }
    for (const e of data.events) {
      for (const rid of e.relatedIds ?? []) {
        if (!ids.has(rid)) push(`${e.id}: relatedIds missing target ${rid}`)
      }
    }
    if (data.events.length < 10) {
      push(`expected a meaningful seed (>=10), got ${data.events.length}`)
    }
  }

  if (errors.length) {
    console.error(`Validation failed (${errors.length}):`)
    for (const e of errors) console.error(`  - ${e}`)
    process.exit(1)
  }

  console.log(
    `✓ OK — ${data.events.length} events, ${data.companies.length} companies, scopeStart=${data.meta.scopeStart}, openingBg set`,
  )
}

function validateCompany(c: Company, push: (m: string) => void) {
  if (!c.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c.id)) {
    push(`bad company id: ${c.id}`)
  }
  if (!c.name?.trim()) push(`company ${c.id}: empty name`)
  if (!HEX_RE.test(c.color ?? '')) {
    push(`company ${c.id}: color required as #RRGGBB`)
  }
  if (c.colorSoft != null && !HEX_RE.test(c.colorSoft)) {
    push(`company ${c.id}: colorSoft must be #RRGGBB`)
  }
}

function validateEvent(
  e: TimelineEvent,
  scopeStart: string,
  push: (m: string) => void,
) {
  if (!e.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(e.id)) {
    push(`bad id: ${e.id}`)
  }
  if (!DATE_RE.test(e.date)) push(`${e.id}: bad date`)
  if (e.date < scopeStart) push(`${e.id}: date before scopeStart`)
  if (!DATE_STATUS.has(e.dateStatus)) push(`${e.id}: bad dateStatus`)
  if (e.dateStatus === 'unverified') {
    push(`${e.id}: unverified not allowed in main dataset`)
  }
  if (!e.title?.trim()) push(`${e.id}: empty title`)
  if (!e.summary?.trim()) push(`${e.id}: empty summary`)
  if (!CATEGORIES.has(e.category)) push(`${e.id}: bad category`)
  if (e.category === 'product' && !e.productSubcategory) {
    push(`${e.id}: product events should set productSubcategory`)
  }
  if (e.productSubcategory && !SUBCATS.has(e.productSubcategory)) {
    push(`${e.id}: bad productSubcategory`)
  }
  if (!e.company?.trim()) push(`${e.id}: empty company`)
  if (!EVENT_TYPES.has(e.eventType)) push(`${e.id}: bad eventType`)
  if (!Array.isArray(e.sources) || e.sources.length < 1) {
    push(`${e.id}: need >=1 source`)
  } else {
    for (const s of e.sources) {
      if (!s.title?.trim()) push(`${e.id}: source missing title`)
      if (!/^https?:\/\//.test(s.url ?? '')) push(`${e.id}: bad source url`)
      if (s.publishedAt && !DATE_RE.test(s.publishedAt)) {
        push(`${e.id}: bad source publishedAt`)
      }
    }
  }
}

main()
