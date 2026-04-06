import React, { useState } from 'react'
import { Control, ComplianceStatus, Framework } from '../../types'
import { Table } from '../ui/Table'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { Tabs } from '../ui/Tabs'
import { Spinner } from '../ui/Spinner'
import { EmptyState } from '../ui/EmptyState'
import { PolicyFrameworkBadge } from '../policies/PolicyFrameworkBadge'

interface ControlTableProps {
  controls: Control[]
  loading?: boolean
  onSort?: (field: string, direction: 'asc' | 'desc') => void
  onEdit?: (control: Control) => void
  frameworkFilter?: Framework
  onFrameworkFilter?: (framework: Framework | undefined) => void
}

const statusColors: Record<ComplianceStatus, string> = {
  compliant: 'green',
  'non-compliant': 'red',
  'in-progress': 'yellow',
  'not-applicable': 'gray',
}

const statusLabels: Record<ComplianceStatus, string> = {
  compliant: 'Compliant',
  'non-compliant': 'Non-Compliant',
  'in-progress': 'In Progress',
  'not-applicable': 'Not Applicable',
}

const allFrameworks: Framework[] = ['SOC2', 'ISO27001', 'HIPAA', 'GDPR', 'PCI-DSS', 'FedRAMP']
const allStatuses: ComplianceStatus[] = ['compliant', 'non-compliant', 'in-progress', 'not-applicable']

export function ControlTable({ controls, loading, onSort, onEdit, frameworkFilter, onFrameworkFilter }: ControlTableProps) {
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | 'all'>('all')
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (field: string) => {
    const newDir = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortField(field)
    setSortDirection(newDir)
    onSort?.(field, newDir)
  }

  const activeFramework = frameworkFilter ?? null

  const filteredControls = controls.filter((c) => {
    if (activeFramework && c.framework !== activeFramework) return false
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    return true
  })

  if (loading) {
    return (
      <div data-testid="control-table-loading" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner data-testid="control-table-spinner" />
      </div>
    )
  }

  return (
    <div data-testid="control-table-container">
      <div data-testid="framework-filter-tabs" style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <Button
          data-testid="tab-all"
          variant={!activeFramework ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => onFrameworkFilter?.(undefined)}
        >
          All
        </Button>
        {allFrameworks.map((fw) => (
          <Button
            key={fw}
            data-testid={`tab-${fw}`}
            variant={activeFramework === fw ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onFrameworkFilter?.(fw)}
          >
            {fw}
          </Button>
        ))}
      </div>

      <div data-testid="control-table-filters" style={{ marginBottom: '16px' }}>
        <Select
          data-testid="status-filter"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as ComplianceStatus | 'all')}
          options={[
            { value: 'all', label: 'All Statuses' },
            ...allStatuses.map((s) => ({ value: s, label: statusLabels[s] })),
          ]}
        />
      </div>

      {filteredControls.length === 0 ? (
        <EmptyState data-testid="control-table-empty" title="No controls found" description="Try adjusting your filters." />
      ) : (
        <Table data-testid="control-table">
          <thead>
            <tr data-testid="control-table-header">
              <th data-testid="sort-name" onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th data-testid="col-framework">Framework</th>
              <th data-testid="sort-status" onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th data-testid="col-evidence">Evidence</th>
              <th data-testid="col-owner">Owner</th>
              <th data-testid="sort-due-date" onClick={() => handleSort('dueDate')} style={{ cursor: 'pointer' }}>
                Due Date {sortField === 'dueDate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              {onEdit && <th data-testid="col-actions">Actions</th>}
            </tr>
          </thead>
          <tbody data-testid="control-table-body">
            {filteredControls.map((control) => (
              <tr key={control.id} data-testid={`control-row-${control.id}`}>
                <td data-testid={`control-name-${control.id}`}>{control.name}</td>
                <td data-testid={`control-framework-${control.id}`}>
                  <PolicyFrameworkBadge framework={control.framework} size="sm" />
                </td>
                <td data-testid={`control-status-${control.id}`}>
                  <Badge color={statusColors[control.status]}>{statusLabels[control.status]}</Badge>
                </td>
                <td data-testid={`control-evidence-${control.id}`}>{control.evidence.length} files</td>
                <td data-testid={`control-owner-${control.id}`}>{control.owner?.name ?? 'Unassigned'}</td>
                <td data-testid={`control-due-date-${control.id}`}>{control.dueDate ?? 'None'}</td>
                {onEdit && (
                  <td>
                    <Button
                      data-testid={`edit-button-${control.id}`}
                      size="sm"
                      variant="secondary"
                      onClick={() => onEdit(control)}
                    >
                      Edit
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <div data-testid="control-table-footer" style={{ marginTop: '8px', fontSize: '0.875rem', color: '#6b7280' }}>
        Showing {filteredControls.length} of {controls.length} controls
      </div>
    </div>
  )
}
