import React from 'react'

export interface PaginationProps {
  page: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  className?: string
  'data-testid'?: string
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className,
  'data-testid': testId = 'pagination',
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const isFirst = page <= 1
  const isLast = page >= totalPages

  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const pages: (number | '...')[] = [1]
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  }

  const controlsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  }

  const infoStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#6b6b8a',
  }

  const btnStyle = (active: boolean, disabled: boolean): React.CSSProperties => ({
    minWidth: '32px',
    height: '32px',
    padding: '0 8px',
    border: `1px solid ${active ? '#6366f1' : '#3a3a4a'}`,
    borderRadius: '6px',
    backgroundColor: active ? '#6366f1' : '#1e1e2e',
    color: active ? '#ffffff' : disabled ? '#4a4a5a' : '#a0a0b0',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '13px',
    fontFamily: 'inherit',
    opacity: disabled ? 0.5 : 1,
  })

  const start = Math.min((page - 1) * pageSize + 1, total)
  const end = Math.min(page * pageSize, total)

  return (
    <div style={wrapperStyle} className={className} data-testid={testId}>
      <div style={infoStyle} data-testid={`${testId}-info`}>
        {total === 0 ? 'No results' : `Showing ${start}–${end} of ${total}`}
      </div>

      <div style={controlsStyle}>
        <button
          style={btnStyle(false, isFirst)}
          onClick={() => !isFirst && onPageChange(1)}
          disabled={isFirst}
          data-testid={`${testId}-first`}
          aria-label="First page"
        >
          «
        </button>
        <button
          style={btnStyle(false, isFirst)}
          onClick={() => !isFirst && onPageChange(page - 1)}
          disabled={isFirst}
          data-testid={`${testId}-prev`}
          aria-label="Previous page"
        >
          ‹
        </button>

        {getPages().map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: '#6b6b8a' }} data-testid={`${testId}-ellipsis-${idx}`}>
              …
            </span>
          ) : (
            <button
              key={p}
              style={btnStyle(p === page, false)}
              onClick={() => onPageChange(p as number)}
              data-testid={`${testId}-page-${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          style={btnStyle(false, isLast)}
          onClick={() => !isLast && onPageChange(page + 1)}
          disabled={isLast}
          data-testid={`${testId}-next`}
          aria-label="Next page"
        >
          ›
        </button>
        <button
          style={btnStyle(false, isLast)}
          onClick={() => !isLast && onPageChange(totalPages)}
          disabled={isLast}
          data-testid={`${testId}-last`}
          aria-label="Last page"
        >
          »
        </button>
      </div>

      {onPageSizeChange && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} data-testid={`${testId}-size-wrapper`}>
          <span style={infoStyle}>Per page:</span>
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            style={{
              backgroundColor: '#1e1e2e',
              border: '1px solid #3a3a4a',
              borderRadius: '6px',
              color: '#a0a0b0',
              padding: '4px 8px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
            data-testid={`${testId}-page-size`}
          >
            {pageSizeOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

export default Pagination
