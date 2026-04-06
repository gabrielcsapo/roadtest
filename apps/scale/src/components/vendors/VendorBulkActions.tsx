import React from 'react'
import { Risk } from '../../types'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { Spinner } from '../ui/Spinner'
import { Badge } from '../ui/Badge'

interface VendorBulkActionsProps {
  selectedCount: number
  onArchive?: () => void
  onDelete?: () => void
  onChangeRisk?: (risk: Risk) => void
  onExport?: () => void
  loading?: boolean
}

const RISK_OPTIONS: Risk[] = ['low', 'medium', 'high', 'critical']

export function VendorBulkActions({ selectedCount, onArchive, onDelete, onChangeRisk, onExport, loading = false }: VendorBulkActionsProps) {
  const [selectedRisk, setSelectedRisk] = React.useState<Risk>('low')

  if (selectedCount === 0) return null

  return (
    <div data-testid="vendor-bulk-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
      {loading && <Spinner data-testid="bulk-spinner" size="sm" />}

      <Badge data-testid="selected-count-badge" style={{ backgroundColor: '#3b82f6', color: 'white' }}>
        {selectedCount} selected
      </Badge>

      <div data-testid="bulk-action-buttons" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {onArchive && (
          <Button data-testid="bulk-archive-button" size="sm" variant="secondary" onClick={onArchive} disabled={loading}>
            Archive
          </Button>
        )}

        {onDelete && (
          <Button data-testid="bulk-delete-button" size="sm" variant="danger" onClick={onDelete} disabled={loading}>
            Delete
          </Button>
        )}

        {onChangeRisk && (
          <div data-testid="bulk-risk-change" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <Select
              data-testid="bulk-risk-select"
              value={selectedRisk}
              onChange={e => setSelectedRisk(e.target.value as Risk)}
              disabled={loading}
              style={{ fontSize: '13px' }}
            >
              {RISK_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </Select>
            <Button
              data-testid="bulk-risk-apply-button"
              size="sm"
              variant="secondary"
              onClick={() => onChangeRisk(selectedRisk)}
              disabled={loading}
            >
              Apply Risk
            </Button>
          </div>
        )}

        {onExport && (
          <Button data-testid="bulk-export-button" size="sm" variant="secondary" onClick={onExport} disabled={loading}>
            Export
          </Button>
        )}
      </div>
    </div>
  )
}

export default VendorBulkActions
