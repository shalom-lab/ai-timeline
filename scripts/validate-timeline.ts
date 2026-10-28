/**
 * Invariant checks for data/timeline.json + data/capability-frontier.json
 * + data/ai-tools.json (see docs/DATA.md). Run: npm run validate
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { TimelineData, TimelineEvent, Company } from '../src/types/timeline'
import type {
  CapabilityFrontierData,
  CapabilityMonth,
  CapabilityScenario,
} from '../src/types/capability'
import type { AiToolsData, ToolColumnId, ToolProduct } from '../src/types/tools'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const timelinePath = resolve(root, 'data/timeline.json')
const frontierPath = resolve(root, 'data/capability-frontier.json')
const toolsPath = resolve(root, 'data/ai-tools.json')

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MONTH_RE = /^\d{4}-\d{2}$/
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

function main() {
  const errors: string[] = []
  const push = (m: string) => errors.push(m)

  const timeline = JSON.parse(readFileSync(timelinePath, 'utf8')) as TimelineData
  const eventIds = validateTimeline(timeline, push)
  const companyIds = new Set(timeline.companies.map((c) => c.id))

  const frontier = JSON.parse(
    readFileSync(frontierPath, 'utf8'),
  ) as CapabilityFrontierData
  validateFrontier(frontier, eventIds, push)

  const tools = JSON.parse(readFileSync(toolsPath, 'utf8')) as AiToolsData
  validateTools(tools, companyIds, push)

  if (errors.length) {
    console.error(`Validation failed (${errors.length}):`)
    for (const e of errors) console.error(`  - ${e}`)
    process.exit(1)
  }

  const scenarioCount = frontier.months.reduce(
    (n, m) => n + m.new.length,
    0,
  )
  console.log(
    `✓ OK — timeline: ${timeline.events.length} events, ${timeline.companies.length} companies; frontier: ${frontier.months.length} months, ${scenarioCount} scenarios; tools: ${tools.rows.length} rows × ${tools.columns.length} cols`,
  )
}

function validateTimeline(
  data: TimelineData,
  push: (m: string) => void,
): Set<string> {
  const ids = new Set<string>()

  if (!data.meta) push('timeline: missing meta')
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

  return ids
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
  e: TimelineEvent,
  scopeStart: string,
  push: (m: string) => void,
) {
  if (!e.id || !KEBAB_RE.test(e.id)) {
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
  if (e.category === 'science' && !e.scienceDiscipline) {
    push(`${e.id}: science events should set scienceDiscipline`)
  }
  if (e.scienceDiscipline && !SCIENCE_DISCS.has(e.scienceDiscipline)) {
    push(`${e.id}: bad scienceDiscipline`)
  }
  if (!e.company?.trim()) push(`${e.id}: empty company`)
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
      if (!/^https?:\/\//.test(s.url ?? '')) push(`${e.id}: bad source url`)
      if (s.publishedAt && !DATE_RE.test(s.publishedAt)) {
        push(`${e.id}: bad source publishedAt`)
      }
    }
  }
}

function validateFrontier(
  data: CapabilityFrontierData,
  eventIds: Set<string>,
  push: (m: string) => void,
) {
  if (!data.meta) {
    push('frontier: missing meta')
    return
  }
  if (!data.meta.name?.trim()) push('frontier meta.name empty')
  if (!data.meta.version?.trim()) push('frontier meta.version empty')
  if (!MONTH_RE.test(data.meta.scopeStart ?? '')) {
    push(`frontier meta.scopeStart must be YYYY-MM, got ${data.meta.scopeStart}`)
  } else if (data.meta.scopeStart < '2022-11') {
    push(`frontier meta.scopeStart must be >= 2022-11`)
  }
  if (!DATE_RE.test(data.meta.updatedAt ?? '')) {
    push(`frontier meta.updatedAt bad date`)
  }
  if (!data.meta.locale?.trim()) push('frontier meta.locale empty')

  if (!Array.isArray(data.months)) {
    push('frontier months must be an array')
    return
  }

  const scenarioIds = new Set<string>()
  let prevMonth = ''

  for (const m of data.months) {
    validateMonth(m, data.meta.scopeStart, eventIds, scenarioIds, push)
    if (prevMonth && m.month <= prevMonth) {
      push(`frontier months must be sorted ascending; ${m.month} after ${prevMonth}`)
    }
    prevMonth = m.month
  }
}

function validateMonth(
  m: CapabilityMonth,
  scopeStart: string,
  eventIds: Set<string>,
  scenarioIds: Set<string>,
  push: (m: string) => void,
) {
  if (!MONTH_RE.test(m.month ?? '')) {
    push(`frontier month bad label: ${m.month}`)
    return
  }
  if (m.month < scopeStart) {
    push(`frontier ${m.month}: before scopeStart ${scopeStart}`)
  }
  if (m.month < '2022-11') {
    push(`frontier ${m.month}: before ChatGPT month 2022-11`)
  }
  if (!m.summary?.trim()) push(`frontier ${m.month}: empty summary`)
  if (!Array.isArray(m.new) || m.new.length === 0) {
    push(`frontier ${m.month}: need >=1 item in new[] (omit empty months instead)`)
    return
  }
  for (const s of m.new) {
    validateScenario(s, m.month, eventIds, scenarioIds, push)
  }
}

function validateScenario(
  s: CapabilityScenario,
  month: string,
  eventIds: Set<string>,
  scenarioIds: Set<string>,
  push: (m: string) => void,
) {
  const label = `frontier ${month}/${s.id}`
  if (!s.id || !KEBAB_RE.test(s.id)) push(`${label}: bad scenario id`)
  if (scenarioIds.has(s.id)) push(`${label}: duplicate scenario id (global)`)
  scenarioIds.add(s.id)
  if (!s.title?.trim()) push(`${label}: empty title`)
  for (const eid of s.enabledBy ?? []) {
    if (!eventIds.has(eid)) {
      push(`${label}: enabledBy missing timeline event ${eid}`)
    }
  }
}

function asProducts(v: ToolProduct | ToolProduct[] | undefined): ToolProduct[] {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

function validateTools(
  data: AiToolsData,
  companyIds: Set<string>,
  push: (m: string) => void,
) {
  if (!data.meta) {
    push('tools: missing meta')
    return
  }
  if (!data.meta.name?.trim()) push('tools meta.name empty')
  if (!data.meta.version?.trim()) push('tools meta.version empty')
  if (!DATE_RE.test(data.meta.updatedAt ?? '')) {
    push('tools meta.updatedAt bad date')
  }
  if (!data.meta.locale?.trim()) push('tools meta.locale empty')

  if (!Array.isArray(data.columns) || data.columns.length === 0) {
    push('tools columns must be non-empty')
    return
  }
  const colIds = new Set<string>()
  for (const c of data.columns) {
    if (!TOOL_COLS.has(c.id)) push(`tools: unknown column id ${c.id}`)
    if (colIds.has(c.id)) push(`tools: duplicate column ${c.id}`)
    colIds.add(c.id)
    if (!c.label?.trim()) push(`tools column ${c.id}: empty label`)
  }

  if (!Array.isArray(data.rows) || data.rows.length < 5) {
    push(`tools rows expected >=5 major companies, got ${data.rows?.length}`)
    return
  }
  const rowIds = new Set<string>()
  for (const row of data.rows) {
    if (!row.companyId || !KEBAB_RE.test(row.companyId)) {
      push(`tools: bad companyId ${row.companyId}`)
      continue
    }
    if (rowIds.has(row.companyId)) {
      push(`tools: duplicate row companyId ${row.companyId}`)
    }
    rowIds.add(row.companyId)
    if (!companyIds.has(row.companyId)) {
      push(
        `tools row ${row.companyId}: companyId not in timeline companies[] (reuse ids)`,
      )
    }
    if (row.displayName?.includes('/')) {
      push(
        `tools row ${row.companyId}: displayName must be a single brand (no slash): ${row.displayName}`,
      )
    }
    if (!row.cells || typeof row.cells !== 'object') {
      push(`tools row ${row.companyId}: missing cells`)
      continue
    }
    let productCount = 0
    for (const [cid, raw] of Object.entries(row.cells)) {
      if (!TOOL_COLS.has(cid as ToolColumnId)) {
        push(`tools row ${row.companyId}: unknown cell column ${cid}`)
      }
      for (const p of asProducts(raw as ToolProduct | ToolProduct[])) {
        productCount++
        const label = `tools ${row.companyId}/${cid}/${p.name}`
        if (!p.name?.trim()) push(`${label}: empty name`)
        if (!/^https?:\/\//.test(p.url ?? '')) push(`${label}: bad url`)
        if (!p.pricing?.trim()) push(`${label}: empty pricing hint`)
        if (p.pricingUrl && !/^https?:\/\//.test(p.pricingUrl)) {
          push(`${label}: bad pricingUrl`)
        }
        if (p.logo !== undefined) {
          if (typeof p.logo !== 'string' || !p.logo.trim()) {
            push(`${label}: logo must be non-empty string when set`)
          } else if (!KEBAB_RE.test(p.logo)) {
            push(`${label}: logo key must be kebab-case id (${p.logo})`)
          }
        }
      }
    }
    if (productCount === 0) {
      push(`tools row ${row.companyId}: need >=1 product cell`)
    }
  }
}


main()
