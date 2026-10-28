/** AI Timeline — core data types. Keep in sync with docs/DATA.md and data/timeline.json. */

/** Four primary categories. Board categories: 大模型 → 产品 → 科学 → 其他; UI tabs: 大模型 / 产品 / 科学 / 能力边界 (frontier tab is capability snapshots only). */
export type Category = 'model' | 'product' | 'science' | 'other'

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

/** Science column discipline chips (AI-for-science board grouping). */
export type ScienceDiscipline =
  | 'life'
  | 'math'
  | 'materials'
  | 'earth'
  | 'other'

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

/** Model modality/capability chips on 大模型 EventCards (release-accurate). */
export type ModelCapability =
  | 'chat'
  | 'reasoning'
  | 'image'
  | 'video'
  | 'vision'
  | 'audio'

export const MODEL_CAPABILITY_ORDER: readonly ModelCapability[] = [
  'chat',
  'reasoning',
  'image',
  'video',
  'vision',
  'audio',
] as const

export const MODEL_CAPABILITY_LABEL_ZH: Record<ModelCapability, string> = {
  chat: '对话',
  reasoning: '思考',
  image: '图像',
  video: '视频',
  vision: '视觉',
  audio: '语音',
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
  /**
   * Required when category === 'science': board chips / sub-columns by discipline
   * (生命科学 / 数学 / 材料 / 地球科学), not by series.
   */
  scienceDiscipline?: ScienceDiscipline
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
  /**
   * Optional modality chips for category === 'model' only.
   * Only list capabilities the release actually had; omit rather than invent.
   */
  capabilities?: ModelCapability[]
}


export interface Company {
  id: string
  name: string
  aliases?: string[]
  /** Primary brand color for timeline chips/markers, #RRGGBB */
  color: string
  /** Optional softer tint for backgrounds, #RRGGBB */
  colorSoft?: string
}

export interface TimelineUiMeta {
  /** Opening/hero background: CSS value (gradient preferred) or image URL */
  openingBg: string
  /** Optional overlay/text color for hero */
  openingFg?: string
}

export interface TimelineMeta {
  name: string
  version: string
  /** Inclusive lower bound of the timeline scope. Fixed at "2022-11-30". */
  scopeStart: string
  /** Dataset last-updated date, YYYY-MM-DD. */
  updatedAt: string
  locale: string
  ui?: TimelineUiMeta
}

export interface TimelineData {
  meta: TimelineMeta
  companies: Company[]
  events: TimelineEvent[]
}

/** Canonical primary-category display order (zh labels in docs / board). */
export const CATEGORY_DISPLAY_ORDER: readonly Category[] = [
  'model',
  'product',
  'science',
  'other',
] as const

export const CATEGORY_LABEL_ZH: Record<Category, string> = {
  model: '大模型',
  product: '产品',
  science: '科学',
  other: '其他',
}
