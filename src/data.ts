import rawTimeline from '../data/timeline.json'
import rawTools from '../data/ai-tools.json'
import type { TimelineData, TimelineEvent } from './types/timeline'
import type { AiToolsData } from './types/tools'

/** Typed seed dataset. Import this (not raw JSON) from app code. */
const source = rawTimeline as TimelineData
export const companiesById = new Map(source.companies.map(company => [company.id, company]))
export const timelineData: TimelineData<TimelineEvent> = {
  ...source,
  events: source.events.map(event => ({ ...event, company: companiesById.get(event.companyId)?.name ?? event.companyId })),
}

/** Current AI tool catalog (not a history timeline). */
export const aiToolsData = rawTools as AiToolsData

export default timelineData
