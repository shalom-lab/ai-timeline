import rawTimeline from '../data/timeline.json'
import rawThreads from '../data/threads.json'
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

const eventsById = new Map(timelineData.events.map(event => [event.id, event]))
export const readingThreads = rawThreads.flatMap(({ id, title, eventIds }) => {
  const events = eventIds.flatMap(eventId => {
    const event = eventsById.get(eventId)
    return event ? [event] : []
  })
  // CI rejects dangling IDs. Do not render an incomplete route during local edits.
  return events.length === eventIds.length ? [{ id, title, events }] : []
})

export default timelineData
