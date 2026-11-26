/** Current-tool catalog; independent from the historical event archive. */
export type ToolColumnId = 'llm' | 'image' | 'video' | 'other' | 'chat' | 'coding' | 'api'

export interface ToolCategory {
  id: ToolColumnId
  label: string
}

export interface ToolProduct {
  /** Stable entry identity; don't change it when the display name changes. */
  id: string
  companyId: string
  categoryId: ToolColumnId
  brandLabel?: string
  aliases?: string[]
  name: string
  description: string
  url: string
  pricing: string
  pricingUrl?: string
  /** Set only after the displayed fee hint has been verified at pricingUrl. */
  pricingVerifiedAt?: string
  note?: string
  logo?: string
}

export interface AiToolsData {
  meta: { name: string; version: string; updatedAt: string; locale: string; disclaimer?: string }
  categories: ToolCategory[]
  tools: ToolProduct[]
}
