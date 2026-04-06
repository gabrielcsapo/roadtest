import React from 'react'
import type { Risk } from '../../types'

export interface RiskBadgeProps {
  risk: Risk
  showScore?: boolean
  compact?: boolean
  className?: string
  'data-testid'?: string
}

const riskConfig: Record<Risk, { label: string; color: string; bg: string; score: number; icon: string }> = {
  low: { label: 'Low', color: '#4ade80', bg: '#14532d', score: 25, icon: '▼' },
  medium: { label: 'Medium', color: '#fbbf24', bg: '#713f12', score: 50, icon: '■' },
  high: { label: 'High', color: '#f97316', bg: '#7c2d12', score: 75, icon: '▲' },
  critical: { label: 'Critical', color: '#f87171', bg: '#7f1d1d', score: 100, icon: '⚠' },
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  risk,
  showScore = false,
  compact = false,
  className,
  'data-testid': testId = 'risk-badge',
}) => {
  const config = riskConfig[risk]

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: compact ? '3px' : '5px',
    fontWeight: 600,
    borderRadius: '9999px',
    color: config.color,
    backgroundColor: config.bg,
    fontSize: compact ? '10px' : '12px',
    padding: compact ? '2px 6px' : '4px 10px',
  }

  return (
    <span
      style={style}
      className={className}
      data-testid={testId}
      data-risk={risk}
      role="img"
      aria-label={`Risk level: ${config.label}`}
    >
      <span data-testid={`${testId}-icon`} aria-hidden="true">{config.icon}</span>
      <span data-testid={`${testId}-label`}>{config.label}</span>
      {showScore && !compact && (
        <span data-testid={`${testId}-score`} style={{ opacity: 0.8, marginLeft: '2px' }}>
          ({config.score})
        </span>
      )}
    </span>
  )
}

export default RiskBadge
