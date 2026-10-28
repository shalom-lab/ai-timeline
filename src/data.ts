import rawTimeline from '../data/timeline.json'
import rawFrontier from '../data/capability-frontier.json'
import type { TimelineData } from './types/timeline'
import type { CapabilityFrontierData } from './types/capability'

/** Typed seed dataset. Import this (not raw JSON) from app code. */
export const timelineData = rawTimeline as TimelineData

/** Capability frontier (separate from timeline events). */
export const capabilityFrontierData = rawFrontier as CapabilityFrontierData

export default timelineData
