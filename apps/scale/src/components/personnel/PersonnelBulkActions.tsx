import React from 'react'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'

interface PersonnelBulkActionsProps {
  selectedCount: number
  onOffboard?: () => void
  onExport?: () => void
  onSendReminder?: () => void
  loading?: boolean
  disabled?: boolean
}

export function PersonnelBulkActions({
  selectedCount,
  onOffboard,
  onExport,
  onSendReminder,
  loading = false,
  disabled = false,
}: PersonnelBulkActionsProps) {
  const isDisabled = disabled || loading || selectedCount === 0

  if (selectedCount === 0) {
    return null
  }

  return (
    <div
      data-testid="bulk-actions-bar"
      data-selected-count={selectedCount}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        background: '#eff6ff',
        borderRadius: '8px',
        border: '1px solid #bfdbfe',
      }}
    >
      <span
        data-testid="selected-count-label"
        style={{ fontSize: '14px', fontWeight: 600, color: '#1d4ed8' }}
      >
        {selectedCount} selected
      </span>

      <div style={{ width: '1px', height: '20px', background: '#bfdbfe' }} />

      <div style={{ display: 'flex', gap: '8px' }}>
        {onOffboard && (
          <Button
            data-testid="bulk-offboard-btn"
            variant="danger"
            size="sm"
            disabled={isDisabled}
            onClick={onOffboard}
          >
            {loading ? <Spinner size="xs" /> : 'Offboard'}
          </Button>
        )}

        {onExport && (
          <Button
            data-testid="bulk-export-btn"
            variant="secondary"
            size="sm"
            disabled={isDisabled}
            onClick={onExport}
          >
            {loading ? <Spinner size="xs" /> : 'Export'}
          </Button>
        )}

        {onSendReminder && (
          <Button
            data-testid="bulk-reminder-btn"
            variant="ghost"
            size="sm"
            disabled={isDisabled}
            onClick={onSendReminder}
          >
            {loading ? <Spinner size="xs" /> : 'Send Reminder'}
          </Button>
        )}
      </div>

      {loading && (
        <span data-testid="bulk-loading-indicator" style={{ fontSize: '12px', color: '#6b7280' }}>
          Processing...
        </span>
      )}
    </div>
  )
}
