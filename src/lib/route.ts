/** Hash routes for GH Pages (no server router): `#/` timeline, `#/tools` AI工具, `#/gallery` 里程碑展. */

export type AppPage = 'timeline' | 'tools' | 'gallery'

function hashPath(hash = window.location.hash): string {
  const raw = (hash || '#/').replace(/^#/, '')
  return raw.split('?')[0].replace(/\/+$/, '') || '/'
}

export function pageFromHash(hash = window.location.hash): AppPage {
  const path = hashPath(hash)
  if (
    path === '/gallery' ||
    path === 'gallery' ||
    path.startsWith('/gallery/') ||
    path.startsWith('gallery/')
  ) {
    return 'gallery'
  }
  if (
    path === '/tools' ||
    path === 'tools' ||
    path.startsWith('/tools/') ||
    path.startsWith('tools/')
  ) {
    return 'tools'
  }
  return 'timeline'
}

export function hashForPage(page: AppPage): string {
  if (page === 'tools') return '#/tools'
  if (page === 'gallery') return '#/gallery'
  return '#/'
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
