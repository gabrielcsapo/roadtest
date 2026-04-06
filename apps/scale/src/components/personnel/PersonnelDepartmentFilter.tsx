import React from 'react'
import { FilterOptions } from '../../types'
import { Checkbox } from '../ui/Checkbox'
import { Button } from '../ui/Button'

interface FilterValue extends FilterOptions {
  departments?: string[]
}

interface PersonnelDepartmentFilterProps {
  departments: string[]
  value: FilterValue
  onChange: (value: FilterValue) => void
  counts?: Record<string, number>
}

const STATUSES = ['active', 'offboarding', 'offboarded'] as const
const BG_STATUSES = ['pending', 'passed', 'failed', 'not-required'] as const

export function PersonnelDepartmentFilter({
  departments,
  value,
  onChange,
  counts,
}: PersonnelDepartmentFilterProps) {
  const toggleDept = (dept: string) => {
    const current = value.departments ?? []
    const next = current.includes(dept)
      ? current.filter((d) => d !== dept)
      : [...current, dept]
    onChange({ ...value, departments: next })
  }

  const toggleStatus = (status: string) => {
    const current = value.status ?? []
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status]
    onChange({ ...value, status: next })
  }

  const clearAll = () => {
    onChange({ departments: [], status: [], search: '' })
  }

  const hasFilters =
    (value.departments?.length ?? 0) > 0 || (value.status?.length ?? 0) > 0

  return (
    <div
      data-testid="department-filter"
      style={{
        padding: '16px',
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        minWidth: '200px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>Filters</span>
        {hasFilters && (
          <Button
            data-testid="clear-all-btn"
            variant="ghost"
            size="sm"
            onClick={clearAll}
          >
            Clear all
          </Button>
        )}
      </div>

      <div data-testid="department-section" style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Department
        </div>
        {departments.length === 0 ? (
          <div data-testid="no-departments" style={{ fontSize: '13px', color: '#9ca3af' }}>
            No departments
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {departments.map((dept) => {
              const isChecked = (value.departments ?? []).includes(dept)
              return (
                <label
                  key={dept}
                  data-testid={`dept-option-${dept.toLowerCase().replace(/\s+/g, '-')}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#374151' }}
                >
                  <input
                    data-testid={`dept-checkbox-${dept.toLowerCase().replace(/\s+/g, '-')}`}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleDept(dept)}
                  />
                  <span>{dept}</span>
                  {counts?.[dept] !== undefined && (
                    <span
                      data-testid={`dept-count-${dept.toLowerCase().replace(/\s+/g, '-')}`}
                      style={{ marginLeft: 'auto', fontSize: '12px', color: '#9ca3af' }}
                    >
                      {counts[dept]}
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        )}
      </div>

      <div data-testid="status-section" style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Status
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {STATUSES.map((status) => {
            const isChecked = (value.status ?? []).includes(status)
            return (
              <label
                key={status}
                data-testid={`status-option-${status}`}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#374151' }}
              >
                <input
                  data-testid={`status-checkbox-${status}`}
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleStatus(status)}
                />
                <span style={{ textTransform: 'capitalize' }}>{status}</span>
                {counts?.[status] !== undefined && (
                  <span
                    data-testid={`status-count-${status}`}
                    style={{ marginLeft: 'auto', fontSize: '12px', color: '#9ca3af' }}
                  >
                    {counts[status]}
                  </span>
                )}
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}
