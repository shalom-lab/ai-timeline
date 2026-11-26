/**
 * Invariant checks for data/timeline.json + data/ai-tools.json
 * (see docs/DATA.md). Run: npm run validate
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { TimelineData, TimelineEventRecord, Company } from '../src/types/timeline'
import type { AiToolsData, ToolColumnId } from '../src/types/tools'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const timelinePath = resolve(root, 'data/timeline.json')
const toolsPath = resolve(root, 'data/ai-tools.json')

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const normalized = (s: string) => s.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ')
function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false
  const parsed = new Date(value + 'T00:00:00Z')
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}
function isWebUrl(s: unknown): s is string {
  if (typeof s !== 'string' || !/^https?:\/\//i.test(s)) return false
  try {
    const u = new URL(s)
    return !!u.hostname && !u.username && !u.password
  } catch { return false }
}
function canonicalUrl(s: string): string {
  const u = new URL(s)
  u.hash = ''
  u.pathname = u.pathname.replace(/\/+$/, '') || '/'
  return u.href
}
const HEX_RE = /^#[0-9A-Fa-f]{6}$/
const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const CATEGORIES = new Set(['model', 'product', 'science', 'other'])
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
const SCIENCE_DISCS = new Set([
  'life',
  'math',
  'materials',
  'earth',
  'other',
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
const MODEL_CAPS = new Set([
  'chat',
  'reasoning',
  'image',
  'video',
  'vision',
  'audio',
])

const TOOL_COLS = new Set<ToolColumnId>([
  'llm',
  'image',
  'video',
  'other',
  'chat',
  'coding',
  'api',
])

export function validateData(timeline: TimelineData, tools: AiToolsData): string[] {
  const errors: string[] = []
  const push = (m: string) => errors.push(m)
  const companyIds = validateTimeline(timeline, push)
  validateTools(tools, companyIds, push)
  return errors
}

function main() {
  const timeline = JSON.parse(readFileSync(timelinePath, 'utf8')) as TimelineData
  const tools = JSON.parse(readFileSync(toolsPath, 'utf8')) as AiToolsData
  const errors = validateData(timeline, tools)
  if (errors.length) {
    for (const error of errors) console.error(`  - ${error}`)
    process.exitCode = 1
  } else {
    console.log(`✓ OK — ${timeline.events.length} events, ${timeline.companies.length} organizations, ${tools.tools.length} tools`)
  }
}

function validateTimeline(
  data: TimelineData,
  push: (m: string) => void,
): Set<string> {
  const ids = new Set<string>()
  const companyIds = new Set<string>()
  const labels = new Map<string, string>()
  const eventKeys = new Set<string>()

  if (!data.meta) push('timeline: missing meta')
  else {
    if (data.meta.scopeStart !== '2022-11-30') {
      push(`meta.scopeStart must be 2022-11-30, got ${data.meta.scopeStart}`)
    }
    for (const k of ['updatedAt', 'scopeStart'] as const) {
      if (!isDate(data.meta[k])) push(`meta.${k} bad date`)
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
    for (const c of data.companies) {
      validateCompany(c, push)
      if (companyIds.has(c.id)) push(`duplicate company id: ${c.id}`)
      companyIds.add(c.id)
      for (const alias of [c.id, c.name, ...(Array.isArray(c.aliases) ? c.aliases : [])]) {
        if (typeof alias !== 'string' || !alias.trim()) { push(`company ${c.id}: invalid alias or name`); continue }
        const key = normalized(alias)
        const previous = labels.get(key)
        if (previous && previous !== c.id) push(`company alias collision: ${alias} (${previous}, ${c.id})`)
        labels.set(key, c.id)
      }
    }
  }

  if (!Array.isArray(data.events)) push('events must be an array')
  else {
    for (const e of data.events) {
      validateEvent(e, data.meta?.scopeStart ?? '2022-11-30', push)
      if (!companyIds.has(e.companyId)) push(`${e.id}: unknown companyId ${e.companyId}`)
      if ('company' in e) push(`${e.id}: use companyId only; display names are derived`)
      const key = JSON.stringify([e.companyId, e.date, e.category, e.eventType, normalized(e.title ?? '')])
      if (eventKeys.has(key)) push(`${e.id}: duplicate event identity`)
      eventKeys.add(key)
      if (ids.has(e.id)) push(`duplicate id: ${e.id}`)
      ids.add(e.id)
    }
    for (const e of data.events) {
      for (const rid of e.relatedIds ?? []) {
        if (rid === e.id) push(`${e.id}: relatedIds cannot link to itself`)
        if (!ids.has(rid)) push(`${e.id}: relatedIds missing target ${rid}`)
      }
    }
    if (data.events.length < 10) {
      push(`expected a meaningful seed (>=10), got ${data.events.length}`)
    }
  }

  return companyIds
}

function validateCompany(c: Company, push: (m: string) => void) {
  if (!c.id || !KEBAB_RE.test(c.id)) {
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
  e: TimelineEventRecord,
  scopeStart: string,
  push: (m: string) => void,
) {
  if (!e.id || !KEBAB_RE.test(e.id)) {
    push(`bad id: ${e.id}`)
  }
  if (!isDate(e.date)) push(`${e.id}: bad date`)
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
  if (e.category === 'science' && !e.scienceDiscipline) {
    push(`${e.id}: science events should set scienceDiscipline`)
  }
  if (e.scienceDiscipline && !SCIENCE_DISCS.has(e.scienceDiscipline)) {
    push(`${e.id}: bad scienceDiscipline`)
  }
  if (!EVENT_TYPES.has(e.eventType)) push(`${e.id}: bad eventType`)
  if (e.capabilities != null) {
    if (!Array.isArray(e.capabilities)) {
      push(`${e.id}: capabilities must be an array`)
    } else {
      if (e.category !== 'model' && e.capabilities.length > 0) {
        push(`${e.id}: capabilities only allowed when category === 'model'`)
      }
      const seen = new Set<string>()
      for (const c of e.capabilities) {
        if (!MODEL_CAPS.has(c)) push(`${e.id}: bad capability ${c}`)
        if (seen.has(c)) push(`${e.id}: duplicate capability ${c}`)
        seen.add(c)
      }
    }
  }
  if (!Array.isArray(e.sources) || e.sources.length < 1) {
    push(`${e.id}: need >=1 source`)
  } else {
    for (const s of e.sources) {
      if (!s.title?.trim()) push(`${e.id}: source missing title`)
      if (!isWebUrl(s.url)) push(`${e.id}: bad source url`)
      if (s.publishedAt && !isDate(s.publishedAt)) {
        push(`${e.id}: bad source publishedAt`)
      }
    }
  }
}

function validateTools(data: AiToolsData, companyIds: Set<string>, push: (m: string) => void) {
  if (!data.meta || !data.meta.name?.trim() || !data.meta.version?.trim() || !data.meta.locale?.trim()) push('tools: missing metadata')
  if (!isDate(data.meta?.updatedAt)) push('tools: invalid updatedAt')
  if (!Array.isArray(data.categories) || !data.categories.length) { push('tools: missing categories'); return }
  const categories = new Set<ToolColumnId>()
  for (const category of data.categories) {
    if (!TOOL_COLS.has(category.id) || categories.has(category.id) || !category.label?.trim()) {
      push(`tools: invalid or duplicate category ${category.id}`)
    }
    categories.add(category.id)
  }
  if (!Array.isArray(data.tools) || !data.tools.length) { push('tools: empty catalog'); return }
  const ids = new Set<string>()
  const identities = new Set<string>()
  for (const tool of data.tools) {
    const label = `tool ${tool.id}`
    if (!KEBAB_RE.test(tool.id ?? '') || ids.has(tool.id)) push(`${label}: invalid or duplicate id`)
    ids.add(tool.id)
    if (!companyIds.has(tool.companyId)) push(`${label}: unknown companyId ${tool.companyId}`)
    if (!categories.has(tool.categoryId)) push(`${label}: unknown categoryId ${tool.categoryId}`)
    if (!tool.name?.trim()) push(`${label}: empty name`)
    const description = typeof tool.description === 'string' ? tool.description.trim() : ''
    if (!description || description.length > 70 || /[\r\n]/.test(description)) push(`${label}: invalid short description (1–70 chars)`)
    if (!tool.pricing?.trim()) push(`${label}: empty pricing hint`)
    if (tool.pricingUrl !== undefined && !isWebUrl(tool.pricingUrl)) push(`${label}: bad pricingUrl`)
    if (tool.pricingVerifiedAt !== undefined && (!isDate(tool.pricingVerifiedAt) || !isWebUrl(tool.pricingUrl))) {
      push(`${label}: pricing verification requires a valid date and source URL`)
    }
    if (tool.logo !== undefined && !KEBAB_RE.test(tool.logo)) push(`${label}: bad logo key`)
    if (!isWebUrl(tool.url)) { push(`${label}: bad product URL`); continue }
    const key = JSON.stringify([tool.categoryId, normalized(tool.name ?? ''), canonicalUrl(tool.url)])
    if (identities.has(key)) push(`${label}: duplicate tool identity`)
    identities.add(key)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
