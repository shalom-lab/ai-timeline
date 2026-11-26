import assert from 'node:assert/strict'
import { test } from 'node:test'
import timeline from '../data/timeline.json'
import tools from '../data/ai-tools.json'
import type { TimelineData } from '../src/types/timeline'
import type { AiToolsData } from '../src/types/tools'
import { validateData } from './validate-timeline'

const seed = () => ({
  events: structuredClone(timeline) as TimelineData,
  catalog: structuredClone(tools) as AiToolsData,
})

test('repository data validates', () => {
  const { events, catalog } = seed()
  assert.deepEqual(validateData(events, catalog), [])
})

const cases: [string, (d: ReturnType<typeof seed>) => void, RegExp][] = [
  ['impossible date', d => { d.events.events[0]!.date = '2026-02-30' }, /bad date/],
  ['unknown event organization', d => { d.events.events[0]!.companyId = 'not-in-catalog' }, /unknown companyId/],
  ['duplicate event with different ID', d => {
    d.events.events.push({ ...d.events.events[0]!, id: 'new-id-same-event' })
  }, /duplicate event identity/],
  ['alias shadowing another organization', d => {
    d.events.companies[0]!.aliases = [d.events.companies[1]!.name.toUpperCase()]
  }, /alias collision/],
  ['missing related event', d => { d.events.events[0]!.relatedIds = ['not-a-real-event'] }, /relatedIds missing target/],
  ['malformed source URL', d => { d.events.events[0]!.sources[0]!.url = 'https://?' }, /bad source url/],
  ['unknown tool organization', d => { d.catalog.tools[0]!.companyId = 'not-in-catalog' }, /unknown companyId/],
  ['unknown tool purpose', d => { d.catalog.categories = d.catalog.categories.slice(1) }, /unknown categoryId/],
  ['duplicate tool identity with different ID', d => {
    const original = d.catalog.tools[0]!
    d.catalog.tools.push({ ...original, id: 'duplicate-tool', name: '  ' + original.name.toLowerCase(), url: original.url.replace(/\/$/, '') + '/#about' })
  }, /duplicate tool identity/],
  ['pricing date without an official URL', d => {
    d.catalog.tools[0]!.pricingVerifiedAt = '2026-11-26'
    delete d.catalog.tools[0]!.pricingUrl
  }, /pricing verification requires/],
]
for (const [name, mutate, expected] of cases) {
  test(`rejects ${name}`, () => {
    const d = seed()
    mutate(d)
    assert.match(validateData(d.events, d.catalog).join('\n'), expected)
  })
}
