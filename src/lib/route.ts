/** Hash routes for GH Pages (no server router): `#/` timeline, `#/compare` 同期对照, `#/tools` AI工具, `#/gallery` 里程碑. */

export type AppPage = 'timeline' | 'compare' | 'tools' | 'gallery'

function hashPath(hash = window.location.hash): string {
  const raw = (hash || '#/').replace(/^#/, '')
  return raw.split('?')[0].replace(/\/+$/, '') || '/'
}

export function pageFromHash(hash = window.location.hash): AppPage {
  const path = hashPath(hash)
  if (path === '/compare' || path === 'compare') return 'compare'
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
  if (page === 'compare') return '#/compare'
  if (page === 'tools') return '#/tools'
  if (page === 'gallery') return '#/gallery'
  return '#/'
}
