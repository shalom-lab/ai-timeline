/** Hash routes for GH Pages (no server router): `#/` timeline, `#/tools` AI工具, `#/gallery` 3D展厅. */

export type AppPage = 'timeline' | 'tools' | 'gallery'

/** AI工具 page: 模型 | 产品 tabs. */
export type ToolsTabId = 'models' | 'products'

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

export function toolsTabFromHash(hash = window.location.hash): ToolsTabId {
  const path = hashPath(hash)
  if (path === '/tools/products' || path === 'tools/products') return 'products'
  // `#/tools`, `#/tools/models`, bare tools → 模型
  return 'models'
}

export function hashForPage(page: AppPage): string {
  if (page === 'tools') return '#/tools'
  if (page === 'gallery') return '#/gallery'
  return '#/'
}

export function hashForToolsTab(tab: ToolsTabId): string {
  return tab === 'products' ? '#/tools/products' : '#/tools/models'
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

export function navigateToolsTab(tab: ToolsTabId) {
  const next = hashForToolsTab(tab)
  if (window.location.hash !== next) {
    window.location.hash = next
  } else {
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }
}
