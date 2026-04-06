import React, { useState } from 'react'
import { AuditLog } from '../../types'
import { Table } from '../ui/Table'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Spinner } from '../ui/Spinner'
import { EmptyState } from '../ui/EmptyState'
import { Pagination } from '../ui/Pagination'
import { AuditLogRow } from './AuditLogRow'

interface AuditFilters {
  startDate?: string
  endDate?: string
  actorId?: string
  actionType?: string
}

interface AuditLogTableProps {
  logs: AuditLog[]
  loading?: boolean
  onLoadMore?: () => void
  totalCount?: number
  filters?: AuditFilters
  onFilterChange?: (filters: AuditFilters) => void
}

const actionTypeOptions = [
  { value: 'all', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'view', label: 'View' },
]

export function AuditLogTable({
  logs,
  loading,
  onLoadMore,
  totalCount,
  filters = {},
  onFilterChange,
}: AuditLogTableProps) {
  const [search, setSearch] = useState('')

  const handleFilterChange = (key: keyof AuditFilters, value: string) => {
    onFilterChange?.({ ...filters, [key]: value || undefined })
  }

  const filteredLogs = logs.filter((log) => {
    if (!search) return true
    return (
      log.actor.name.toLowerCase().includes(search.toLowerCase()) ||
      log.target.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase())
    )
  })

  if (loading) {
    return (
      <div data-testid="audit-log-table-loading" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner data-testid="audit-table-spinner" />
      </div>
    )
  }

  return (
    <div data-testid="audit-log-table-container">
      <div data-testid="audit-log-filters" style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <Input
          data-testid="audit-search-input"
          placeholder="Search by actor, target, or action..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Input
          data-testid="date-start-input"
          type="date"
          value={filters.startDate || ''}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
          placeholder="Start date"
        />
        <Input
          data-testid="date-end-input"
          type="date"
          value={filters.endDate || ''}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
          placeholder="End date"
        />
        <Select
          data-testid="action-type-filter"
          value={filters.actionType || 'all'}
          onChange={(v) => handleFilterChange('actionType', v === 'all' ? '' : v)}
          options={actionTypeOptions}
        />
      </div>

      {filteredLogs.length === 0 ? (
        <EmptyState data-testid="audit-log-empty" title="No audit logs" description="No logs match your filters." />
      ) : (
        <div data-testid="audit-log-list">
          {filteredLogs.map((log) => (
            <AuditLogRow key={log.id} log={log} data-testid={`audit-row-${log.id}`} />
          ))}
        </div>
      )}

      <div data-testid="audit-log-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
        <span data-testid="audit-log-count" style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Showing {filteredLogs.length}{totalCount !== undefined ? ` of ${totalCount}` : ''} logs
        </span>
        {onLoadMore && filteredLogs.length < (totalCount ?? filteredLogs.length) && (
          <Button data-testid="load-more-button" variant="secondary" onClick={onLoadMore}>
            Load More
          </Button>
        )}
      </div>
    </div>
  )
}
