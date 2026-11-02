import rawTimeline from '../data/timeline.json'
import rawTools from '../data/ai-tools.json'
import type { TimelineData } from './types/timeline'
import type { AiToolsData } from './types/tools'

/** Typed seed dataset. Import this (not raw JSON) from app code. */
export const timelineData = rawTimeline as TimelineData

/** Current AI products matrix (not a history timeline). */
export const aiToolsData = rawTools as AiToolsData

export default timelineData
