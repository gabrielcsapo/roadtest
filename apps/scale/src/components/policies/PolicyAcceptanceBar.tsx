import React from 'react'
import { Progress } from '../ui/Progress'

interface PolicyAcceptanceBarProps {
  rate: number
  totalUsers?: number
  acceptedCount?: number
  size?: 'sm' | 'md' | 'lg'
}

function getColor(rate: number): string {
  if (rate >= 80) return 'green'
  if (rate >= 60) return 'yellow'
  return 'red'
}

function getLabel(rate: number): string {
  if (rate >= 80) return 'Good'
  if (rate >= 60) return 'Fair'
  return 'Low'
}

const heightMap: Record<string, string> = {
  sm: '6px',
  md: '10px',
  lg: '14px',
}

export function PolicyAcceptanceBar({ rate, totalUsers, acceptedCount, size = 'md' }: PolicyAcceptanceBarProps) {
  const clampedRate = Math.max(0, Math.min(100, rate))
  const color = getColor(clampedRate)
  const label = getLabel(clampedRate)

  return (
    <div data-testid="acceptance-bar-container" data-size={size} data-rate={clampedRate}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span data-testid="acceptance-label" style={{ fontSize: '0.75rem', color: '#6b7280' }}>
          Acceptance Rate
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {totalUsers !== undefined && acceptedCount !== undefined && (
            <span data-testid="acceptance-counts" style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {acceptedCount}/{totalUsers} users
            </span>
          )}
          <span
            data-testid="acceptance-percentage"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: color === 'green' ? '#10b981' : color === 'yellow' ? '#f59e0b' : '#ef4444',
            }}
          >
            {clampedRate}%
          </span>
          <span
            data-testid="acceptance-status-label"
            style={{
              fontSize: '0.75rem',
              color: color === 'green' ? '#10b981' : color === 'yellow' ? '#f59e0b' : '#ef4444',
            }}
          >
            ({label})
          </span>
        </div>
      </div>
      <Progress
        data-testid="acceptance-progress"
        value={clampedRate}
        max={100}
        color={color}
        height={heightMap[size]}
      />
    </div>
  )
}
