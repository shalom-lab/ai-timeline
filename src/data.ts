import raw from '../data/timeline.json'
import type { TimelineData } from './types/timeline'

/** Typed seed dataset. Import this (not raw JSON) from app code. */
export const timelineData = raw as TimelineData

export default timelineData
