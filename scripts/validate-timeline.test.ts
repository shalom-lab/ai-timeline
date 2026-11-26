import assert from 'node:assert/strict'
import { test } from 'node:test'
import timeline from '../data/timeline.json'
import threads from '../data/threads.json'
import { readingThreads } from '../src/data'
import tools from '../data/ai-tools.json'
import type { TimelineData } from '../src/types/timeline'
import type { AiToolsData } from '../src/types/tools'
import { validateData } from './validate-timeline'

const seed = () => ({
  threads: structuredClone(threads),
  events: structuredClone(timeline) as TimelineData,
  catalog: structuredClone(tools) as AiToolsData,
})

test('repository data validates', () => {
  const { events, catalog, threads } = seed()
  assert.deepEqual(validateData(events, catalog, threads), [])
})

test('reading paths resolve canonical event titles and preserve public event IDs', () => {
  for (const [index, thread] of threads.entries()) {
    const rendered = readingThreads[index]!
    assert.deepEqual(rendered.events.map(event => event.id), thread.eventIds)
    assert.deepEqual(rendered.events.map(event => event.title), thread.eventIds.map(id =>
      timeline.events.find(event => event.id === id)?.title))
  }
})

test('allows shared events across themes and editorial order within the same day', () => {
  const d = seed()
  const first = d.threads[0]!
  const [firstId, secondId] = first.eventIds
  const a = d.events.events.find(event => event.id === firstId)!
  const b = d.events.events.find(event => event.id === secondId)!
  b.date = a.date
  d.threads.push({ id: 'second-theme', title: '另一个主题', eventIds: [secondId!, firstId!] })
  assert.deepEqual(validateData(d.events, d.catalog, d.threads), [])
})

const cases: [string, (d: ReturnType<typeof seed>) => void, RegExp][] = [
  ['a malformed thread ID', d => { d.threads[0]!.id = 'Bad ID' }, /invalid thread id/],
  ['a duplicate thread ID', d => { d.threads.push({ ...d.threads[0]! }) }, /duplicate thread id/],
  ['a missing theme title', d => { d.threads[0]!.title = ' ' }, /missing theme title/],
  ['a single-stop thread', d => { d.threads[0]!.eventIds.splice(1) }, /expected at least two event IDs/],
  ['a dangling thread reference', d => { d.threads[0]!.eventIds[1] = 'not-an-event' }, /missing event not-an-event/],
  ['a repeated event in a thread', d => { d.threads[0]!.eventIds[1] = d.threads[0]!.eventIds[0]! }, /duplicate event/],
  ['reversed thread dates', d => { d.threads[0]!.eventIds.reverse() }, /date order reversed/],
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
    assert.match(validateData(d.events, d.catalog, d.threads).join('\n'), expected)
  })
}
