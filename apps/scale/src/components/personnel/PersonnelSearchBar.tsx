import React from 'react'
import { Button } from '../ui/Button'

interface PersonnelSearchBarProps {
  search: string
  onSearch: (value: string) => void
  statusFilter: string[]
  onStatusFilter: (statuses: string[]) => void
  bgCheckFilter: string[]
  onBgCheckFilter: (statuses: string[]) => void
  total: number
  filtered: number
}

const STATUS_OPTIONS = ['active', 'offboarding', 'offboarded'] as const
const BGCHECK_OPTIONS = ['pending', 'passed', 'failed', 'not-required'] as const

export function PersonnelSearchBar({
  search,
  onSearch,
  statusFilter,
  onStatusFilter,
  bgCheckFilter,
  onBgCheckFilter,
  total,
  filtered,
}: PersonnelSearchBarProps) {
  const toggleStatus = (status: string) => {
    if (statusFilter.includes(status)) {
      onStatusFilter(statusFilter.filter((s) => s !== status))
    } else {
      onStatusFilter([...statusFilter, status])
    }
  }

  const toggleBgCheck = (status: string) => {
    if (bgCheckFilter.includes(status)) {
      onBgCheckFilter(bgCheckFilter.filter((s) => s !== status))
    } else {
      onBgCheckFilter([...bgCheckFilter, status])
    }
  }

  const clearAll = () => {
    onSearch('')
    onStatusFilter([])
    onBgCheckFilter([])
  }

  const hasActiveFilters =
    search.length > 0 || statusFilter.length > 0 || bgCheckFilter.length > 0

  return (
    <div
      data-testid="personnel-search-bar"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        background: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
      }}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          data-testid="search-input"
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search personnel..."
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        {hasActiveFilters && (
          <Button
            data-testid="clear-filters-btn"
            variant="ghost"
            size="sm"
            onClick={clearAll}
          >
            Clear
          </Button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>Status:</span>
        {STATUS_OPTIONS.map((status) => {
          const active = statusFilter.includes(status)
          return (
            <button
              key={status}
              data-testid={`status-filter-${status}`}
              data-active={active ? 'true' : 'false'}
              onClick={() => toggleStatus(status)}
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                border: `1px solid ${active ? '#2563eb' : '#d1d5db'}`,
                background: active ? '#eff6ff' : '#fff',
                color: active ? '#2563eb' : '#374151',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: active ? 600 : 400,
              }}
            >
              {status}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>Background Check:</span>
        {BGCHECK_OPTIONS.map((status) => {
          const active = bgCheckFilter.includes(status)
          return (
            <button
              key={status}
              data-testid={`bgcheck-filter-${status}`}
              data-active={active ? 'true' : 'false'}
              onClick={() => toggleBgCheck(status)}
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                border: `1px solid ${active ? '#7c3aed' : '#d1d5db'}`,
                background: active ? '#f5f3ff' : '#fff',
                color: active ? '#7c3aed' : '#374151',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: active ? 600 : 400,
              }}
            >
              {status}
            </button>
          )
        })}
      </div>

      <div
        data-testid="results-count"
        style={{ fontSize: '12px', color: '#9ca3af' }}
      >
        Showing{' '}
        <span data-testid="filtered-count">{filtered}</span>
        {' '}of{' '}
        <span data-testid="total-count">{total}</span>
        {' '}personnel
      </div>
    </div>
  )
}
