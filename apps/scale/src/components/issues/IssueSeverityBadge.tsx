import React from 'react'
import { Risk } from '../../types'
import { Badge } from '../ui/Badge'

interface IssueSeverityBadgeProps {
  severity: Risk
  size?: 'sm' | 'md'
  showIcon?: boolean
}

const severityColors: Record<Risk, string> = {
  low: 'green',
  medium: 'yellow',
  high: 'orange',
  critical: 'red',
}

const severityLabels: Record<Risk, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

const severityIcons: Record<Risk, string> = {
  low: '✓',
  medium: '⚠',
  high: '▲',
  critical: '🔴',
}

export function IssueSeverityBadge({ severity, size = 'md', showIcon = false }: IssueSeverityBadgeProps) {
  const color = severityColors[severity]
  const label = severityLabels[severity]
  const icon = severityIcons[severity]

  return (
    <Badge
      data-testid="severity-badge"
      color={color}
      size={size}
      data-severity={severity}
      data-color={color}
    >
      {showIcon && (
        <span data-testid="severity-icon" aria-hidden="true" style={{ marginRight: '4px' }}>
          {icon}
        </span>
      )}
      <span data-testid="severity-label">{label}</span>
    </Badge>
  )
}
