/** Hash routes for GH Pages (no server router): `#/` timeline, `#/tools` AI工具. */

export type AppPage = 'timeline' | 'tools'

export function pageFromHash(hash = window.location.hash): AppPage {
  const raw = (hash || '#/').replace(/^#/, '')
  const path = raw.split('?')[0].replace(/\/+$/, '') || '/'
  if (path === '/tools' || path === 'tools') return 'tools'
  return 'timeline'
}

export function hashForPage(page: AppPage): string {
  return page === 'tools' ? '#/tools' : '#/'
}

export function navigate(page: AppPage) {
  const next = hashForPage(page)
  if (window.location.hash !== next) {
    window.location.hash = next
  } else {
    // force listeners when already on target
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }
}
