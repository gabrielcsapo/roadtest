import React from 'react'
import { FilterOptions } from '../../types'
import { SearchInput } from '../ui/SearchInput'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

interface VendorSearchBarProps {
  search: string
  onSearchChange: (search: string) => void
  filters: FilterOptions
  onFiltersChange: (f: FilterOptions) => void
  totalCount: number
  filteredCount: number
}

export function VendorSearchBar({ search, onSearchChange, filters, onFiltersChange, totalCount, filteredCount }: VendorSearchBarProps) {
  const activeFilterCount = (filters.status?.length ?? 0) + (filters.risk?.length ?? 0) + (filters.tags?.length ?? 0)
  const isFiltered = !!search || activeFilterCount > 0

  const clearSearch = () => onSearchChange('')
  const clearFilters = () => onFiltersChange({ search: '', status: [], risk: [], tags: [] })
  const clearAll = () => { clearSearch(); clearFilters() }

  return (
    <div data-testid="vendor-search-bar">
      <div data-testid="search-bar-row" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <SearchInput
          data-testid="search-input"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search vendors..."
          style={{ flex: 1 }}
        />
        {activeFilterCount > 0 && (
          <Badge data-testid="active-filter-count">{activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}</Badge>
        )}
        {isFiltered && (
          <Button data-testid="clear-all-button" variant="secondary" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        )}
      </div>

      <div data-testid="search-bar-meta" style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span data-testid="result-count">
          {isFiltered
            ? `${filteredCount} of ${totalCount} vendors`
            : `${totalCount} vendor${totalCount !== 1 ? 's' : ''}`}
        </span>
        {search && (
          <button data-testid="clear-search-button" onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: '12px' }}>
            Clear search
          </button>
        )}
      </div>
    </div>
  )
}

export default VendorSearchBar
