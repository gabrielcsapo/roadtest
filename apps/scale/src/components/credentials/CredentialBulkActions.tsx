import React from 'react'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'

interface CredentialBulkActionsProps {
  selectedCount: number
  onRotate?: () => void
  onDelete?: () => void
  onExport?: () => void
  loading?: boolean
}

export function CredentialBulkActions({
  selectedCount,
  onRotate,
  onDelete,
  onExport,
  loading = false,
}: CredentialBulkActionsProps) {
  const isDisabled = loading || selectedCount === 0

  if (selectedCount === 0) {
    return null
  }

  return (
    <div
      data-testid="credential-bulk-actions"
      data-selected-count={selectedCount}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        background: '#f5f3ff',
        borderRadius: '8px',
        border: '1px solid #ddd6fe',
      }}
    >
      <span
        data-testid="bulk-count-label"
        style={{ fontSize: '14px', fontWeight: 600, color: '#7c3aed' }}
      >
        {selectedCount} selected
      </span>

      <div style={{ width: '1px', height: '20px', background: '#ddd6fe' }} />

      <div style={{ display: 'flex', gap: '8px' }}>
        {onRotate && (
          <Button
            data-testid="bulk-rotate-btn"
            variant="secondary"
            size="sm"
            disabled={isDisabled}
            onClick={onRotate}
          >
            {loading ? <Spinner size="xs" /> : 'Rotate All'}
          </Button>
        )}

        {onExport && (
          <Button
            data-testid="bulk-export-btn"
            variant="ghost"
            size="sm"
            disabled={isDisabled}
            onClick={onExport}
          >
            {loading ? <Spinner size="xs" /> : 'Export'}
          </Button>
        )}

        {onDelete && (
          <Button
            data-testid="bulk-delete-btn"
            variant="danger"
            size="sm"
            disabled={isDisabled}
            onClick={onDelete}
          >
            {loading ? <Spinner size="xs" /> : 'Delete'}
          </Button>
        )}
      </div>

      {loading && (
        <span data-testid="bulk-loading-text" style={{ fontSize: '12px', color: '#7c3aed' }}>
          Processing...
        </span>
      )}
    </div>
  )
}
