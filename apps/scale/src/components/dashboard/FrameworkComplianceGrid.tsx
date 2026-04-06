import React from 'react'
import { Framework, Control } from '../../types'
import { Card } from '../ui/Card'
import { Spinner } from '../ui/Spinner'
import { EmptyState } from '../ui/EmptyState'
import { Progress } from '../ui/Progress'
import { PolicyFrameworkBadge } from '../policies/PolicyFrameworkBadge'

interface FrameworkEntry {
  name: Framework
  compliant: number
  total: number
  controls: Control[]
}

interface FrameworkComplianceGridProps {
  frameworks: FrameworkEntry[]
  loading?: boolean
  onSelect?: (framework: Framework) => void
}

function getColor(pct: number): string {
  if (pct >= 80) return 'green'
  if (pct >= 60) return 'yellow'
  return 'red'
}

function getTextColor(pct: number): string {
  if (pct >= 80) return '#10b981'
  if (pct >= 60) return '#f59e0b'
  return '#ef4444'
}

export function FrameworkComplianceGrid({ frameworks, loading, onSelect }: FrameworkComplianceGridProps) {
  if (loading) {
    return (
      <div data-testid="framework-grid-loading" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner data-testid="framework-grid-spinner" />
      </div>
    )
  }

  if (frameworks.length === 0) {
    return (
      <EmptyState
        data-testid="framework-grid-empty"
        title="No frameworks"
        description="No framework compliance data available."
      />
    )
  }

  return (
    <div
      data-testid="framework-grid-container"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}
    >
      {frameworks.map((fw) => {
        const pct = fw.total > 0 ? Math.round((fw.compliant / fw.total) * 100) : 0
        const color = getColor(pct)
        const textColor = getTextColor(pct)

        return (
          <Card
            key={fw.name}
            data-testid={`framework-card-${fw.name}`}
            data-percentage={pct}
            onClick={onSelect ? () => onSelect(fw.name) : undefined}
            style={{ cursor: onSelect ? 'pointer' : 'default' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <PolicyFrameworkBadge framework={fw.name} size="sm" />
              <span
                data-testid={`framework-percentage-${fw.name}`}
                style={{ fontSize: '1.125rem', fontWeight: 700, color: textColor }}
              >
                {pct}%
              </span>
            </div>
            <Progress
              data-testid={`framework-progress-${fw.name}`}
              value={pct}
              max={100}
              color={color}
              height="6px"
            />
            <div
              data-testid={`framework-counts-${fw.name}`}
              style={{ marginTop: '6px', fontSize: '0.75rem', color: '#6b7280' }}
            >
              {fw.compliant}/{fw.total} compliant
            </div>
          </Card>
        )
      })}
    </div>
  )
}
