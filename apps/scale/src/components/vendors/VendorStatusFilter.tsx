import React from 'react'
import { FilterOptions, Risk, Status } from '../../types'
import { Checkbox } from '../ui/Checkbox'
import { Badge } from '../ui/Badge'

interface VendorStatusFilterProps {
  value: FilterOptions
  onChange: (f: FilterOptions) => void
  vendorCounts?: Record<string, number>
}

const ALL_STATUSES: Status[] = ['active', 'inactive', 'pending', 'archived']
const ALL_RISKS: Risk[] = ['low', 'medium', 'high', 'critical']

export function VendorStatusFilter({ value, onChange, vendorCounts = {} }: VendorStatusFilterProps) {
  const toggleStatus = (status: Status) => {
    const current = value.status ?? []
    const next = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status]
    onChange({ ...value, status: next })
  }

  const toggleRisk = (risk: Risk) => {
    const current = value.risk ?? []
    const next = current.includes(risk)
      ? current.filter(r => r !== risk)
      : [...current, risk]
    onChange({ ...value, risk: next })
  }

  const clearAll = () => onChange({ ...value, status: [], risk: [] })

  const hasFilters = (value.status?.length ?? 0) > 0 || (value.risk?.length ?? 0) > 0

  return (
    <div data-testid="vendor-status-filter">
      <div data-testid="filter-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <strong>Filters</strong>
        {hasFilters && (
          <button data-testid="clear-filters" onClick={clearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}>
            Clear all
          </button>
        )}
      </div>

      <div data-testid="status-filter-section">
        <div data-testid="status-filter-label" style={{ fontWeight: 600, marginBottom: '8px', fontSize: '13px', color: '#374151' }}>
          Status
        </div>
        {ALL_STATUSES.map(status => (
          <div key={status} data-testid={`status-filter-${status}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Checkbox
              data-testid={`status-checkbox-${status}`}
              checked={(value.status ?? []).includes(status)}
              onChange={() => toggleStatus(status)}
            />
            <span data-testid={`status-label-${status}`}>{status}</span>
            {vendorCounts[status] !== undefined && (
              <Badge data-testid={`status-count-${status}`}>{vendorCounts[status]}</Badge>
            )}
          </div>
        ))}
      </div>

      <div data-testid="risk-filter-section" style={{ marginTop: '16px' }}>
        <div data-testid="risk-filter-label" style={{ fontWeight: 600, marginBottom: '8px', fontSize: '13px', color: '#374151' }}>
          Risk Level
        </div>
        {ALL_RISKS.map(risk => (
          <div key={risk} data-testid={`risk-filter-${risk}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Checkbox
              data-testid={`risk-checkbox-${risk}`}
              checked={(value.risk ?? []).includes(risk)}
              onChange={() => toggleRisk(risk)}
            />
            <span data-testid={`risk-label-${risk}`}>{risk}</span>
            {vendorCounts[risk] !== undefined && (
              <Badge data-testid={`risk-count-${risk}`}>{vendorCounts[risk]}</Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default VendorStatusFilter
