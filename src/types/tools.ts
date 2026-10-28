/** AI工具矩阵 — keep in sync with docs/DATA.md §9 and data/ai-tools.json. */

/** Stable column ids for product forms (hide empty cols in UI if needed). */
export type ToolColumnId =
  | 'llm'
  | 'image'
  | 'video'
  | 'other' // embedding / 语音 / 新形态等
  | 'chat'
  | 'coding'
  | 'api'

/** Super-group for two-level thead (大模型 | 产品). */
export type ToolColumnGroupId = 'models' | 'products'

export interface ToolColumnDef {
  id: ToolColumnId
  /** Chinese header label */
  label: string
}

export interface ToolColumnGroupDef {
  id: ToolColumnGroupId
  /** Chinese group label */
  label: string
  columns: readonly ToolColumnId[]
}

/** One product in a matrix cell. */
export interface ToolProduct {
  /** Short product name shown in the cell */
  name: string
  /** Official product homepage */
  url: string
  /**
   * High-level fee hint only (free tier / Plus price / API pay-as-you-go).
   * Prefer linking pricingUrl for full detail — do not invent exact SKUs.
   */
  pricing: string
  /** Official pricing page when known */
  pricingUrl?: string
  /** Optional one-line note */
  note?: string
  /**
   * Optional logo key under public/logos/{key}.{ext} (see COMPANY_LOGO_EXT).
   * When omitted, product cells fall back to the row company logo / letter.
   * Only rendered in 产品 columns (chat / coding / api).
   */
  logo?: string
}

export interface ToolRow {
  /** Must match timeline companies[].id when possible */
  companyId: string
  /** Optional display override (defaults to timeline company name). Single brand — no "A / B". */
  displayName?: string
  /**
   * Products keyed by column id. Array when multiple products share a form
   * (e.g. Codex + Cursor under coding). Empty/missing → empty cell.
   */
  cells: Partial<Record<ToolColumnId, ToolProduct | ToolProduct[]>>
}

export interface AiToolsMeta {
  name: string
  version: string
  updatedAt: string
  locale: string
  /** Conservative disclaimer shown in UI */
  disclaimer?: string
}

export interface AiToolsData {
  meta: AiToolsMeta
  columns: ToolColumnDef[]
  rows: ToolRow[]
}

/** Two-level header groups: 大模型 then 产品. */
export const TOOL_COLUMN_GROUPS: readonly ToolColumnGroupDef[] = [
  {
    id: 'models',
    label: '大模型',
    columns: ['llm', 'image', 'video', 'other'],
  },
  {
    id: 'products',
    label: '产品',
    columns: ['chat', 'coding', 'api'],
  },
] as const

export const TOOL_COLUMN_ORDER: readonly ToolColumnId[] =
  TOOL_COLUMN_GROUPS.flatMap((g) => g.columns)

/** Product-block columns that show per-product logos. */
export const TOOL_PRODUCT_COLUMN_IDS: ReadonlySet<ToolColumnId> = new Set([
  'chat',
  'coding',
  'api',
])
