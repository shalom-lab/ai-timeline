import type {
  Category,
  EventType,
  ProductSubcategory,
} from '../types/timeline'

/** Board column order (screenshot): 大模型 → 产品 → 概念 → 其他 */
export const BOARD_CATEGORY_ORDER: readonly Category[] = [
  'model',
  'product',
  'concept',
  'other',
] as const

export const CATEGORY_LABEL_ZH: Record<Category, string> = {
  model: '大模型',
  product: '产品',
  concept: '概念',
  other: '其他',
}

export const CATEGORY_THEME: Record<
  Category,
  { header: string; headerSoft: string; accent: string }
> = {
  model: {
    header: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
    headerSoft: '#DBEAFE',
    accent: '#2563EB',
  },
  product: {
    header: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    headerSoft: '#D1FAE5',
    accent: '#059669',
  },
  concept: {
    header: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
    headerSoft: '#FFEDD5',
    accent: '#EA580C',
  },
  other: {
    header: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    headerSoft: '#EDE9FE',
    accent: '#7C3AED',
  },
}

export const PRODUCT_SUBCATEGORY_LABEL_ZH: Record<ProductSubcategory, string> = {
  ide: '编程工具',
  cli: 'CLI',
  work_assistant: '工作助手',
  research_assistant: '研究助手',
  search: '搜索',
  image: '图像',
  video: '视频',
  voice: '语音',
  agent: 'Agent',
  dev_platform: '开发平台',
  chat: '对话产品',
  other_product: '其他',
}

/** Preferred chip order under 产品 */
export const PRODUCT_SUBCATEGORY_CHIP_ORDER: readonly ProductSubcategory[] = [
  'chat',
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
  'other_product',
] as const

export const EVENT_TYPE_LABEL_ZH: Record<EventType, string> = {
  research_preview: '研究预览',
  public_beta: '公测',
  ga: '正式开放',
  first_announce: '首次公布',
  major_upgrade: '重大更新',
  open_source: '开源',
  discontinued: '停用',
  rename_rebrand: '更名',
  other: '其他',
}

/** Pill / legend colors keyed by eventType */
export const EVENT_TYPE_COLOR: Record<
  EventType,
  { bg: string; fg: string; legend: string }
> = {
  research_preview: { bg: '#DBEAFE', fg: '#1D4ED8', legend: '#3B82F6' },
  public_beta: { bg: '#E0E7FF', fg: '#3730A3', legend: '#6366F1' },
  ga: { bg: '#DBEAFE', fg: '#1E40AF', legend: '#2563EB' },
  first_announce: { bg: '#DBEAFE', fg: '#1D4ED8', legend: '#3B82F6' },
  major_upgrade: { bg: '#D1FAE5', fg: '#047857', legend: '#10B981' },
  open_source: { bg: '#FFEDD5', fg: '#C2410C', legend: '#F97316' },
  discontinued: { bg: '#FEE2E2', fg: '#B91C1C', legend: '#EF4444' },
  rename_rebrand: { bg: '#EDE9FE', fg: '#6D28D9', legend: '#8B5CF6' },
  other: { bg: '#F1F5F9', fg: '#475569', legend: '#94A3B8' },
}

/** Compact legend groups shown in toolbar */
export const EVENT_TYPE_LEGEND: {
  label: string
  color: string
  types: EventType[]
}[] = [
  {
    label: '发布/公布',
    color: '#3B82F6',
    types: ['research_preview', 'public_beta', 'ga', 'first_announce'],
  },
  { label: '重大更新', color: '#10B981', types: ['major_upgrade'] },
  { label: '开源', color: '#F97316', types: ['open_source'] },
  { label: '更名', color: '#8B5CF6', types: ['rename_rebrand'] },
  { label: '停用', color: '#EF4444', types: ['discontinued'] },
  { label: '其他', color: '#94A3B8', types: ['other'] },
]

/** Theme chips for concept / other (match tags or fallback) */
export const CONCEPT_THEME_CHIPS = [
  { id: 'ai-for-science', label: 'AI for Science', match: (tags?: string[]) =>
    (tags ?? []).some((t) =>
      ['ai-for-science', 'science', 'alphafold', 'biology'].includes(t),
    ) },
  { id: 'agent', label: 'Agent', match: (tags?: string[]) =>
    (tags ?? []).some((t) => t.includes('agent')) },
  { id: 'multimodal', label: '多模态', match: (tags?: string[]) =>
    (tags ?? []).includes('multimodal') },
  { id: 'other', label: '其他', match: () => true },
] as const
