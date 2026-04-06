import React from 'react'
import type { Status } from '../../types'

export type StatusBadgeSize = 'sm' | 'md'

export interface StatusBadgeProps {
  status: Status
  showIcon?: boolean
  size?: StatusBadgeSize
  className?: string
  'data-testid'?: string
}

const statusConfig: Record<Status, { label: string; color: string; bg: string; icon: string }> = {
  active: { label: 'Active', color: '#4ade80', bg: '#14532d', icon: '●' },
  inactive: { label: 'Inactive', color: '#a0a0b0', bg: '#2a2a3a', icon: '○' },
  pending: { label: 'Pending', color: '#fbbf24', bg: '#713f12', icon: '◔' },
  archived: { label: 'Archived', color: '#818cf8', bg: '#1e1b4b', icon: '▪' },
}

const sizeStyles: Record<StatusBadgeSize, React.CSSProperties> = {
  sm: { fontSize: '10px', padding: '2px 8px', gap: '4px' },
  md: { fontSize: '12px', padding: '4px 10px', gap: '5px' },
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = false,
  size = 'md',
  className,
  'data-testid': testId = 'status-badge',
}) => {
  const config = statusConfig[status]

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: 500,
    borderRadius: '9999px',
    color: config.color,
    backgroundColor: config.bg,
    ...sizeStyles[size],
  }

  return (
    <span
      style={style}
      className={className}
      data-testid={testId}
      data-status={status}
      role="status"
    >
      {showIcon && (
        <span
          data-testid={`${testId}-icon`}
          aria-hidden="true"
          style={{ fontSize: size === 'sm' ? '8px' : '10px' }}
        >
          {config.icon}
        </span>
      )}
      <span data-testid={`${testId}-label`}>{config.label}</span>
    </span>
  )
}

export default StatusBadge
