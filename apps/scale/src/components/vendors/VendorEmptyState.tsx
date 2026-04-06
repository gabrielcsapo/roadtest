import React from 'react'
import { EmptyState } from '../ui/EmptyState'
import { Button } from '../ui/Button'

interface VendorEmptyStateProps {
  hasSearch: boolean
  onAddVendor?: () => void
  onClearSearch?: () => void
}

export function VendorEmptyState({ hasSearch, onAddVendor, onClearSearch }: VendorEmptyStateProps) {
  if (hasSearch) {
    return (
      <div data-testid="vendor-empty-state" data-variant="no-results">
        <EmptyState
          data-testid="no-results-empty-state"
          title="No vendors found"
          description="No vendors match your search criteria. Try adjusting your search or filters."
        />
        <div data-testid="empty-state-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
          {onClearSearch && (
            <Button data-testid="clear-search-action" variant="secondary" onClick={onClearSearch}>
              Clear Search
            </Button>
          )}
          {onAddVendor && (
            <Button data-testid="add-vendor-action" onClick={onAddVendor}>
              Add Vendor
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div data-testid="vendor-empty-state" data-variant="no-vendors">
      <EmptyState
        data-testid="no-vendors-empty-state"
        title="No vendors yet"
        description="Add your first vendor to start tracking your third-party risk."
      />
      <div data-testid="empty-state-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
        {onAddVendor && (
          <Button data-testid="add-vendor-action" onClick={onAddVendor}>
            Add Your First Vendor
          </Button>
        )}
      </div>
    </div>
  )
}

export default VendorEmptyState
