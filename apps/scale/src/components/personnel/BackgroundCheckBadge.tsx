import React from 'react'
import { Personnel } from '../../types'

interface BackgroundCheckBadgeProps {
  status: Personnel['backgroundCheckStatus']
  showDate?: boolean
  date?: string
  size?: 'sm' | 'md'
}

const STATUS_CONFIG: Record<
  Personnel['backgroundCheckStatus'],
  { label: string; icon: string; color: string; bg: string }
> = {
  pending: { label: 'Pending', icon: '⏳', color: '#b45309', bg: '#fef3c7' },
  passed: { label: 'Passed', icon: '✓', color: '#15803d', bg: '#dcfce7' },
  failed: { label: 'Failed', icon: '✗', color: '#dc2626', bg: '#fee2e2' },
  'not-required': { label: 'Not Required', icon: '—', color: '#6b7280', bg: '#f3f4f6' },
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function BackgroundCheckBadge({
  status,
  showDate = false,
  date,
  size = 'md',
}: BackgroundCheckBadgeProps) {
  const config = STATUS_CONFIG[status]
  const fontSize = size === 'sm' ? '11px' : '13px'
  const padding = size === 'sm' ? '2px 6px' : '4px 10px'

  return (
    <span
      data-testid="background-check-badge"
      data-status={status}
      data-size={size}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize,
        padding,
        borderRadius: '9999px',
        fontWeight: 500,
        color: config.color,
        backgroundColor: config.bg,
        whiteSpace: 'nowrap',
      }}
    >
      <span data-testid="bgcheck-icon" aria-hidden="true">
        {config.icon}
      </span>
      <span data-testid="bgcheck-label">{config.label}</span>
      {showDate && date && (
        <span
          data-testid="bgcheck-date"
          style={{ opacity: 0.8, fontSize: size === 'sm' ? '10px' : '12px' }}
        >
          {formatDate(date)}
        </span>
      )}
    </span>
  )
}
