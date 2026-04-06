import React from 'react'
import { Vendor, SortOptions } from '../../types'
import { Table } from '../ui/Table'
import { StatusBadge } from '../ui/StatusBadge'
import { RiskBadge } from '../ui/RiskBadge'
import { Button } from '../ui/Button'
import { Checkbox } from '../ui/Checkbox'
import { Spinner } from '../ui/Spinner'
import { EmptyState } from '../ui/EmptyState'

interface VendorTableProps {
  vendors: Vendor[]
  loading?: boolean
  onSort?: (sort: SortOptions) => void
  onSelect?: (vendor: Vendor) => void
  selectedIds?: string[]
  onEdit?: (vendor: Vendor) => void
  onDelete?: (vendor: Vendor) => void
}

export function VendorTable({ vendors, loading = false, onSort, onSelect, selectedIds = [], onEdit, onDelete }: VendorTableProps) {
  const [sort, setSort] = React.useState<SortOptions>({ field: 'name', direction: 'asc' })

  const handleSort = (field: string) => {
    const newSort: SortOptions = {
      field,
      direction: sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc',
    }
    setSort(newSort)
    onSort?.(newSort)
  }

  if (loading) {
    return (
      <div data-testid="vendor-table-loading" style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <Spinner />
      </div>
    )
  }

  if (vendors.length === 0) {
    return (
      <div data-testid="vendor-table-empty">
        <EmptyState title="No vendors" description="No vendors to display." />
      </div>
    )
  }

  return (
    <div data-testid="vendor-table-container">
      <Table data-testid="vendor-table">
        <thead data-testid="vendor-table-header">
          <tr>
            <th data-testid="col-select">Select</th>
            <th data-testid="col-name" onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
              Name {sort.field === 'name' ? (sort.direction === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th data-testid="col-category" onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>Category</th>
            <th data-testid="col-risk" onClick={() => handleSort('riskLevel')} style={{ cursor: 'pointer' }}>Risk</th>
            <th data-testid="col-status" onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status</th>
            <th data-testid="col-review">Last Review</th>
            <th data-testid="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody data-testid="vendor-table-body">
          {vendors.map(vendor => (
            <tr
              key={vendor.id}
              data-testid={`vendor-row-${vendor.id}`}
              data-selected={selectedIds.includes(vendor.id)}
              onClick={() => onSelect?.(vendor)}
              style={{ cursor: onSelect ? 'pointer' : 'default' }}
            >
              <td data-testid={`select-${vendor.id}`}>
                <Checkbox
                  checked={selectedIds.includes(vendor.id)}
                  onChange={() => onSelect?.(vendor)}
                />
              </td>
              <td data-testid={`name-${vendor.id}`}>{vendor.name}</td>
              <td data-testid={`category-${vendor.id}`}>{vendor.category}</td>
              <td data-testid={`risk-${vendor.id}`}><RiskBadge risk={vendor.riskLevel} /></td>
              <td data-testid={`status-${vendor.id}`}><StatusBadge status={vendor.status} /></td>
              <td data-testid={`review-${vendor.id}`}>{vendor.lastReviewDate}</td>
              <td data-testid={`actions-${vendor.id}`}>
                {onEdit && (
                  <Button size="sm" variant="secondary" onClick={e => { e.stopPropagation(); onEdit(vendor) }} data-testid={`edit-${vendor.id}`}>
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button size="sm" variant="danger" onClick={e => { e.stopPropagation(); onDelete(vendor) }} data-testid={`delete-${vendor.id}`}>
                    Delete
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

export default VendorTable
