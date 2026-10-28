/** Capability frontier — month-end snapshots of what ordinary people + AI can already do. */

export interface CapabilityScenario {
  /** Stable kebab id, unique across all months (first appears in that month's `new`). */
  id: string
  /** Optional leading emoji for scannability */
  emoji?: string
  /** 之前：没有这项能力时普通人怎么干（短句对比） */
  before: string
  /** 之后：有了 AI 后已经能做的具体工作场景 */
  after: string
  /** Optional one-line how / caveat under the after side */
  detail?: string
  /** Optional timeline event ids that unlocked this scenario */
  enabledBy?: string[]
  tags?: string[]
}

export interface CapabilityMonth {
  /** YYYY-MM end-of-month snapshot */
  month: string
  /** Friendly one-liner: as of this month-end, what's newly practical */
  summary: string
  /** Scenarios that became practical this month (expanded by default in UI) */
  new: CapabilityScenario[]
}

export interface CapabilityFrontierMeta {
  name: string
  version: string
  /** Inclusive lower bound month, e.g. "2022-11" */
  scopeStart: string
  /** Dataset last-updated date, YYYY-MM-DD */
  updatedAt: string
  locale: string
}

export interface CapabilityFrontierData {
  meta: CapabilityFrontierMeta
  months: CapabilityMonth[]
}

/** Distinct accent for the 能力边界 track (not one of the five event categories). */
export const FRONTIER_THEME = {
  header: '#F8FAFC',
  headerSoft: '#FDF2F8',
  accent: '#DB2777',
} as const

export const FRONTIER_LABEL_ZH = '能力边界'

/** @deprecated use CapabilityScenario */
export type CapabilityWorkflow = CapabilityScenario
