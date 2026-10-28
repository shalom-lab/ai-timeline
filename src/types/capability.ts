/** Capability frontier — month-end snapshots of newly practical human+AI workflows. */

export interface CapabilityWorkflow {
  /** Stable kebab id, unique across all months. */
  id: string
  /** Imperative / scene title, e.g. "用对话助手问知识问题并得到可用回答" */
  title: string
  /** Brief how-to. */
  how?: string
  /** Optional timeline event ids that enabled this workflow. */
  enabledBy?: string[]
  tags?: string[]
}

export interface CapabilityMonth {
  /** YYYY-MM end-of-month snapshot label. */
  month: string
  /** 1–2 sentences overall frontier that month. */
  summary: string
  /** ONLY workflows newly available this month (do not repeat prior months). */
  workflows: CapabilityWorkflow[]
}

export interface CapabilityFrontierMeta {
  name: string
  version: string
  /** Inclusive lower bound month, e.g. "2022-11". */
  scopeStart: string
  /** Dataset last-updated date, YYYY-MM-DD. */
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
