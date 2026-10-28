/** AI Timeline — core data types. Keep in sync with docs/DATA.md and data/timeline.json. */

export type Category = 'model' | 'product' | 'concept' | 'other'

export type ProductSubcategory =
  | 'ide'
  | 'cli'
  | 'work_assistant'
  | 'research_assistant'
  | 'search'
  | 'image'
  | 'video'
  | 'voice'
  | 'agent'
  | 'dev_platform'
  | 'chat'
  | 'other_product'

export type EventType =
  | 'research_preview'
  | 'public_beta'
  | 'ga'
  | 'first_announce'
  | 'major_upgrade'
  | 'open_source'
  | 'discontinued'
  | 'rename_rebrand'
  | 'other'

export type DateStatus = 'exact' | 'approximate' | 'unverified'

export interface Source {
  /** Human-readable source title (often the article headline). */
  title: string
  /** Prefer official blog / docs / changelog URLs. */
  url: string
  publisher?: string
  /** Source publication date when known, YYYY-MM-DD. */
  publishedAt?: string
}

export interface TimelineEvent {
  /** Stable kebab-case id, e.g. openai-chatgpt-research-preview-2022-11-30 */
  id: string
  /** Event date, YYYY-MM-DD. Must be >= meta.scopeStart. */
  date: string
  dateStatus: DateStatus
  title: string
  summary: string
  category: Category
  /** Required when category === 'product'; optional otherwise. */
  productSubcategory?: ProductSubcategory
  /** Display name of the company / org (match companies[].name when possible). */
  company: string
  /** Product line / model family, e.g. "ChatGPT", "Claude", "Gemini". */
  series?: string
  /** Specific product or model name when finer than series. */
  product?: string
  eventType: EventType
  /** At least one source; prefer official primary sources. */
  sources: Source[]
  relatedIds?: string[]
  tags?: string[]
}

export interface Company {
  id: string
  name: string
  aliases?: string[]
}

export interface TimelineMeta {
  name: string
  version: string
  /** Inclusive lower bound of the timeline scope. Fixed at "2022-11-30". */
  scopeStart: string
  /** Dataset last-updated date, YYYY-MM-DD. */
  updatedAt: string
  locale: string
}

export interface TimelineData {
  meta: TimelineMeta
  companies: Company[]
  events: TimelineEvent[]
}
