/** AI工具矩阵 — keep in sync with docs/DATA.md §9 and data/ai-tools.json. */

/** Stable column ids for product forms (hide empty cols in UI if needed). */
export type ToolColumnId =
  | 'llm'
  | 'image'
  | 'video'
  | 'chat'
  | 'coding'
  | 'api'
  | 'agent'

export interface ToolColumnDef {
  id: ToolColumnId
  /** Chinese header label */
  label: string
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
}

export interface ToolRow {
  /** Must match timeline companies[].id when possible */
  companyId: string
  /** Optional display override (defaults to timeline company name) */
  displayName?: string
  /**
   * Products keyed by column id. Array when multiple products share a form
   * (e.g. Codex + Cursor-adjacent under coding). Empty/missing → empty cell.
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

export const TOOL_COLUMN_ORDER: readonly ToolColumnId[] = [
  'llm',
  'image',
  'video',
  'chat',
  'coding',
  'api',
  'agent',
] as const
