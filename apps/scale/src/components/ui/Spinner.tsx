import React from 'react'

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface SpinnerProps {
  size?: SpinnerSize
  color?: string
  label?: string
  className?: string
  'data-testid'?: string
}

const sizeDimensions: Record<SpinnerSize, number> = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 36,
  xl: 48,
}

const borderWidths: Record<SpinnerSize, number> = {
  xs: 2,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 5,
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = '#6366f1',
  label,
  className,
  'data-testid': testId = 'spinner',
}) => {
  const dim = sizeDimensions[size]
  const bw = borderWidths[size]

  const wrapperStyle: React.CSSProperties = {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  }

  const spinnerStyle: React.CSSProperties = {
    width: `${dim}px`,
    height: `${dim}px`,
    border: `${bw}px solid rgba(255,255,255,0.1)`,
    borderTopColor: color,
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    flexShrink: 0,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#a0a0b0',
  }

  return (
    <div
      style={wrapperStyle}
      className={className}
      data-testid={`${testId}-wrapper`}
      role="status"
      aria-label={label || 'Loading'}
      aria-live="polite"
    >
      <div style={spinnerStyle} data-testid={testId} data-size={size} />
      {label && (
        <span style={labelStyle} data-testid={`${testId}-label`}>
          {label}
        </span>
      )}
    </div>
  )
}

export default Spinner
