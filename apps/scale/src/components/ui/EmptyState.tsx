import React from 'react'

export interface EmptyStateAction {
  label: string
  onClick: () => void
}

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: EmptyStateAction
  compact?: boolean
  className?: string
  'data-testid'?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  compact = false,
  className,
  'data-testid': testId = 'empty-state',
}) => {
  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: compact ? '24px 16px' : '64px 32px',
    gap: compact ? '8px' : '12px',
  }

  const iconStyle: React.CSSProperties = {
    fontSize: compact ? '32px' : '48px',
    color: '#3a3a4a',
    marginBottom: '4px',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: compact ? '15px' : '18px',
    fontWeight: 600,
    color: '#c0c0d0',
    margin: 0,
  }

  const descStyle: React.CSSProperties = {
    fontSize: compact ? '13px' : '14px',
    color: '#6b6b8a',
    maxWidth: '360px',
    margin: 0,
    lineHeight: 1.6,
  }

  const actionStyle: React.CSSProperties = {
    marginTop: compact ? '4px' : '8px',
    padding: compact ? '6px 14px' : '8px 20px',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: compact ? '13px' : '14px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }

  return (
    <div
      style={wrapperStyle}
      className={className}
      data-testid={testId}
      role="status"
      aria-label={title}
    >
      {icon && (
        <div style={iconStyle} data-testid={`${testId}-icon`} aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 style={titleStyle} data-testid={`${testId}-title`}>
        {title}
      </h3>
      {description && (
        <p style={descStyle} data-testid={`${testId}-description`}>
          {description}
        </p>
      )}
      {action && (
        <button
          style={actionStyle}
          onClick={action.onClick}
          data-testid={`${testId}-action`}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

export default EmptyState
