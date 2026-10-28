import { useMemo } from 'react'
import type { Company } from '../types/timeline'
import type {
  AiToolsData,
  ToolColumnId,
  ToolProduct,
  ToolRow,
} from '../types/tools'
import { resolveCompany } from '../lib/company'
import { CompanyLogoImg, hasCompanyLogo } from '../lib/icons'

type Props = {
  data: AiToolsData
  companies: Company[]
  query: string
}

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
    co?.name ?? '',
    ...(co?.aliases ?? []),
    ...Object.values(row.cells).flatMap((c) => asList(c).map(productHay)),
  ]
    .join(' ')
    .toLowerCase()
  return hay.includes(q)
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

function ProductBlock({ p }: { p: ToolProduct }) {
  return (
    <div className="tools-cell__item">
      <a
        className="tools-cell__name"
        href={p.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {p.name}
      </a>
      <div className="tools-cell__pricing">
        {p.pricingUrl ? (
          <a
            href={p.pricingUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="官方定价"
          >
            {p.pricing}
          </a>
        ) : (
          <span>{p.pricing}</span>
        )}
      </div>
      {p.note ? <div className="tools-cell__note">{p.note}</div> : null}
    </div>
  )
}

export default function ToolsMatrix({ data, companies, query }: Props) {
  const q = query.trim().toLowerCase()

  const activeCols = useMemo(() => {
    const used = new Set<ToolColumnId>()
    for (const row of data.rows) {
      for (const col of data.columns) {
        if (asList(row.cells[col.id]).length > 0) used.add(col.id)
      }
    }
    return data.columns.filter((c) => used.has(c.id))
  }, [data])

  const rows = useMemo(() => {
    return data.rows.filter((row) => {
      const co = resolveCompany(companies, row.companyId)
      return rowMatches(row, co, q)
    })
  }, [data.rows, companies, q])

  return (
    <div className="tools-page">
      <p className="tools-page__hint">
        {rows.length}/{data.rows.length} 家 · v{data.meta.version} ·{' '}
        {data.meta.updatedAt}
        {data.meta.disclaimer ? ` · ${data.meta.disclaimer}` : ''}
      </p>

      <div className="tools-table-wrap">
        <table className="tools-table">
          <thead>
            <tr>
              <th className="tools-table__co-h" scope="col">
                公司
              </th>
              {activeCols.map((c) => (
                <th key={c.id} scope="col">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={activeCols.length + 1} className="tools-table__empty">
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
                return (
                  <tr key={row.companyId}>
                    <th scope="row" className="tools-table__co">
                      <div className="tools-row__co">
                        {hasCompanyLogo(co.id) ? (
                          <span
                            className="tools-row__avatar"
                            style={{ background: co.colorSoft ?? '#EEF1F6' }}
                          >
                            <CompanyLogoImg
                              companyId={co.id}
                              size={20}
                              title={name}
                            />
                          </span>
                        ) : (
                          <LetterAvatar name={name} color={co.color} />
                        )}
                        <span className="tools-row__name">{name}</span>
                      </div>
                    </th>
                    {activeCols.map((col) => {
                      const products = asList(row.cells[col.id])
                      return (
                        <td key={col.id} className="tools-table__cell">
                          {products.length === 0 ? (
                            <span className="tools-cell__empty" aria-hidden>
                              ·
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
    </div>
  )
}
