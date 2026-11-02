import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import type { Company } from '../types/timeline'
import type {
  AiToolsData,
  ToolColumnDef,
  ToolColumnGroupDef,
  ToolColumnId,
  ToolProduct,
  ToolRow,
} from '../types/tools'
import { TOOL_COLUMN_GROUPS } from '../types/tools'
import { resolveCompany } from '../lib/company'
import {
  CompanyLogoImg,
  hasCompanyLogo,
  ToolColumnIcon,
  ToolTabIcon,
  ToolsChevronIcon,
  ToolsCompanyColIcon,
} from '../lib/icons'
import {
  navigateToolsTab,
  toolsTabFromHash,
  type ToolsTabId,
} from '../lib/route'
import { writeClipboard, ClipboardIcon, CheckIcon } from '../lib/clipboard'

type Props = {
  data: AiToolsData
  companies: Company[]
  query: string
}

type PricingTone = 'green' | 'blue' | 'purple' | 'orange' | 'neutral'

function asList(v: ToolProduct | ToolProduct[] | undefined): ToolProduct[] {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

function productHay(p: ToolProduct): string {
  return [p.name, p.pricing, p.note ?? '', p.url].join(' ').toLowerCase()
}

function rowMatches(row: ToolRow, co: Company | undefined, q: string): boolean {
  if (!q) return true
  const hay = [
    row.companyId,
    row.displayName ?? '',
    row.blurb ?? '',
    co?.name ?? '',
    ...(co?.aliases ?? []),
    ...Object.values(row.cells).flatMap((c) => asList(c).map(productHay)),
  ]
    .join(' ')
    .toLowerCase()
  return hay.includes(q)
}

function rowHasCellsInCols(row: ToolRow, colIds: readonly ToolColumnId[]): boolean {
  return colIds.some((id) => asList(row.cells[id]).length > 0)
}

function pricingTone(text: string): PricingTone {
  const t = text.toLowerCase()
  if (/免费|开源|高效|低成本|热门|试用/.test(text)) return 'green'
  if (/api|按量|按 token|按token|按张|按分钟|cloud|云端|托管|vertex|azure|火山|千帆|平台按量/.test(t + text))
    return 'blue'
  if (/订阅|chatgpt|限额|对话|会员|plus|pro|premium|积分/.test(t + text)) return 'purple'
  if (/企业|enterprise|详情|定价页|席位|商务|商业|workspace/.test(t + text)) return 'orange'
  return 'neutral'
}

/** Split a pricing hint into short colorful pills (max 3). */
function pricingPills(pricing: string): { text: string; tone: PricingTone }[] {
  const raw = pricing.trim()
  if (!raw) return []
  let parts = raw
    .split(/[；;]/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length === 1 && /[·|]/.test(parts[0])) {
    const dotted = parts[0]
      .split(/[·|]/)
      .map((s) => s.trim())
      .filter(Boolean)
    // Keep compact: free/entry + one more when long
    if (dotted.length >= 2) parts = dotted.slice(0, 3)
  }
  return parts.slice(0, 3).map((text) => ({ text, tone: pricingTone(text) }))
}

function LetterAvatar({ name, color }: { name: string; color: string }) {
  const letter = (name.trim()[0] || '?').toUpperCase()
  return (
    <span
      className="tools-row__avatar tools-row__avatar--letter"
      style={{ background: color }}
      aria-hidden
    >
      {letter}
    </span>
  )
}

function ProductLogo({
  logoKey,
  title,
  columnId,
}: {
  logoKey?: string
  title: string
  columnId: ToolColumnId
}) {
  if (logoKey && hasCompanyLogo(logoKey)) {
    return (
      <span className="tools-cell__logo" aria-hidden>
        <CompanyLogoImg companyId={logoKey} size={14} title={title} />
      </span>
    )
  }
  // Category-tint glyph when no brand asset
  return (
    <span className={`tools-cell__logo tools-cell__logo--glyph tools-cell__logo--${columnId}`} aria-hidden>
      <ToolColumnIcon columnId={columnId} size={12} />
    </span>
  )
}

function ProductBlock({
  p,
  companyId,
  companyName,
  columnId,
}: {
  p: ToolProduct
  companyId: string
  companyName: string
  columnId: ToolColumnId
}) {
  const tip = p.note?.trim() || undefined
  const nameTitle = tip ? `${p.name} — ${tip}` : p.name
  const priceTitle = tip ? `${p.pricing} · ${tip}` : p.pricing
  const logoKey =
    p.logo && hasCompanyLogo(p.logo)
      ? p.logo
      : hasCompanyLogo(companyId)
        ? companyId
        : undefined
  const pills = pricingPills(p.pricing)

  const body = (
    <>
      <div className="tools-card__main">
        <ProductLogo
          logoKey={logoKey}
          title={companyName}
          columnId={columnId}
        />
        <span className="tools-cell__name-text">{p.name}</span>
      </div>
      {pills.length > 0 ? (
        <div className="tools-card__pills" title={priceTitle}>
          {pills.map((pill) =>
            p.pricingUrl ? (
              <a
                key={pill.text}
                className={`tools-pill tools-pill--${pill.tone}`}
                href={p.pricingUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {pill.text}
              </a>
            ) : (
              <span key={pill.text} className={`tools-pill tools-pill--${pill.tone}`}>
                {pill.text}
              </span>
            ),
          )}
        </div>
      ) : null}
      <span className="tools-card__chevron" aria-hidden>
        <ToolsChevronIcon size={13} />
      </span>
    </>
  )

  return (
    <a
      className="tools-card tools-card--product"
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      title={nameTitle}
    >
      {body}
    </a>
  )
}

/** Plain-text matrix for clipboard: one block per company, cols as lines. */
export function formatToolsMatrixPlainText(opts: {
  tabLabel: string
  columns: ToolColumnDef[]
  rows: { companyName: string; cells: Partial<Record<ToolColumnId, ToolProduct | ToolProduct[]>> }[]
}): string {
  const header = `AI工具 · ${opts.tabLabel}`
  if (opts.rows.length === 0) return `${header}\n（无匹配）`

  const blocks = opts.rows.map((row) => {
    const lines: string[] = [row.companyName]
    for (const col of opts.columns) {
      const products = asList(row.cells[col.id])
      if (products.length === 0) continue
      const cell = products
        .map((p) => {
          const price = p.pricing?.trim()
          return price ? `${p.name} — ${price}` : p.name
        })
        .join('；')
      lines.push(`  ${col.label}：${cell}`)
    }
    return lines.join('\n')
  })

  return [header, ...blocks].join('\n\n')
}

function ToolsMatrixCopyButton({
  tabLabel,
  columns,
  rows,
}: {
  tabLabel: string
  columns: ToolColumnDef[]
  rows: { companyName: string; cells: Partial<Record<ToolColumnId, ToolProduct | ToolProduct[]>> }[]
}) {
  const [copied, setCopied] = useState(false)
  const tip =
    rows.length === 0
      ? '暂无可复制矩阵'
      : `复制「${tabLabel}」矩阵（${rows.length} 家公司）`

  const onCopy = useCallback(
    async (e: MouseEvent) => {
      e.stopPropagation()
      if (rows.length === 0) return
      await writeClipboard(formatToolsMatrixPlainText({ tabLabel, columns, rows }))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    },
    [tabLabel, columns, rows],
  )

  return (
    <button
      type="button"
      className={`tools-tabs__copy${copied ? ' is-copied' : ''}`}
      onClick={onCopy}
      disabled={rows.length === 0}
      title={copied ? '已复制' : tip}
      aria-label={copied ? '已复制' : tip}
    >
      {copied ? <CheckIcon /> : <ClipboardIcon />}
    </button>
  )
}

function groupForTab(tab: ToolsTabId): ToolColumnGroupDef {
  return (
    TOOL_COLUMN_GROUPS.find((g) => g.id === tab) ?? TOOL_COLUMN_GROUPS[0]
  )
}

export default function ToolsMatrix({ data, companies, query }: Props) {
  const q = query.trim().toLowerCase()
  const [tab, setTab] = useState<ToolsTabId>(() => toolsTabFromHash())

  useEffect(() => {
    const sync = () => setTab(toolsTabFromHash())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const activeGroup = groupForTab(tab)

  const activeCols = useMemo(() => {
    const used = new Set<ToolColumnId>()
    for (const row of data.rows) {
      for (const col of data.columns) {
        if (asList(row.cells[col.id]).length > 0) used.add(col.id)
      }
    }
    const byId = new Map(data.columns.map((c) => [c.id, c]))
    return activeGroup.columns
      .filter((id) => used.has(id))
      .map((id) => byId.get(id))
      .filter((c): c is ToolColumnDef => Boolean(c))
  }, [data, activeGroup])

  const rows = useMemo(() => {
    const colIds = activeCols.map((c) => c.id)
    return data.rows.filter((row) => {
      if (!rowHasCellsInCols(row, colIds)) return false
      const co = resolveCompany(companies, row.companyId)
      return rowMatches(row, co, q)
    })
  }, [data.rows, companies, q, activeCols])

  const copyRows = useMemo(
    () =>
      rows.map((row) => {
        const co = resolveCompany(companies, row.companyId)
        const companyName =
          row.displayName ?? co?.name ?? row.companyId
        return { companyName, cells: row.cells }
      }),
    [rows, companies],
  )

  const wrapTitle = data.meta.disclaimer
    ? `${data.meta.disclaimer} · v${data.meta.version} · ${data.meta.updatedAt}`
    : `v${data.meta.version} · ${data.meta.updatedAt}`

  const colCount = activeCols.length

  const onSelectTab = (next: ToolsTabId) => {
    setTab(next)
    navigateToolsTab(next)
  }

  return (
    <div className="tools-page">
      <nav className="tools-tabs" aria-label="形态切换">
        {TOOL_COLUMN_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`tools-tabs__btn${tab === g.id ? ' is-active' : ''}`}
            aria-current={tab === g.id ? 'page' : undefined}
            onClick={() => onSelectTab(g.id)}
          >
            <span className="tools-tabs__icon" aria-hidden>
              <ToolTabIcon tabId={g.id} />
            </span>
            <span>{g.label}</span>
          </button>
        ))}
        <ToolsMatrixCopyButton
          tabLabel={activeGroup.label}
          columns={activeCols}
          rows={copyRows}
        />
      </nav>

      <div className="tools-table-wrap" title={wrapTitle}>
        <table className="tools-table tools-table--tabbed">
          <thead>
            <tr className="tools-table__sub-row">
              <th className="tools-table__co-h" scope="col">
                <span className="tools-table__sub-h-inner">
                  <span className="tools-table__col-icon">
                    <ToolsCompanyColIcon />
                  </span>
                  <span>公司</span>
                </span>
              </th>
              {activeCols.map((c) => (
                <th key={c.id} className="tools-table__sub-h" scope="col">
                  <span className="tools-table__sub-h-inner">
                    <span className="tools-table__col-icon">
                      <ToolColumnIcon columnId={c.id} />
                    </span>
                    <span>{c.label}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={colCount + 1} className="tools-table__empty">
                  无匹配，清空搜索试试
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const co =
                  resolveCompany(companies, row.companyId) ??
                  ({
                    id: row.companyId,
                    name: row.displayName ?? row.companyId,
                    color: '#94A3B8',
                    colorSoft: '#EEF1F6',
                  } satisfies Company)
                const name = row.displayName ?? co.name
                const blurb = row.blurb?.trim()
                return (
                  <tr key={row.companyId}>
                    <th scope="row" className="tools-table__co">
                      <div className="tools-card tools-card--company">
                        <div className="tools-row__co">
                          {hasCompanyLogo(co.id) ? (
                            <span className="tools-row__avatar">
                              <CompanyLogoImg
                                companyId={co.id}
                                size={20}
                                title={name}
                              />
                            </span>
                          ) : (
                            <LetterAvatar name={name} color={co.color} />
                          )}
                          <div className="tools-row__meta">
                            <span className="tools-row__name">{name}</span>
                            {blurb ? (
                              <span className="tools-row__blurb">{blurb}</span>
                            ) : null}
                          </div>
                          <span className="tools-card__chevron" aria-hidden>
                            <ToolsChevronIcon size={13} />
                          </span>
                        </div>
                      </div>
                    </th>
                    {activeCols.map((col) => {
                      const products = asList(row.cells[col.id])
                      return (
                        <td key={col.id} className="tools-table__cell">
                          {products.length === 0 ? (
                            <span className="tools-cell__empty" aria-hidden>
                              —
                            </span>
                          ) : (
                            <div
                              className={
                                products.length > 1
                                  ? 'tools-cell__stack'
                                  : 'tools-cell__stack tools-cell__stack--single'
                              }
                            >
                              {products.map((p) => (
                                <ProductBlock
                                  key={`${p.name}-${p.url}`}
                                  p={p}
                                  companyId={co.id}
                                  companyName={name}
                                  columnId={col.id}
                                />
                              ))}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {data.meta.disclaimer ? (
        <p className="tools-page__foot">{data.meta.disclaimer}</p>
      ) : null}
    </div>
  )
}
