import React from 'react'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  rounded?: boolean
  children?: React.ReactNode
  className?: string
  'data-testid'?: string
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: { backgroundColor: '#3a3a4a', color: '#a0a0b0' },
  success: { backgroundColor: '#14532d', color: '#4ade80' },
  warning: { backgroundColor: '#713f12', color: '#fbbf24' },
  danger: { backgroundColor: '#7f1d1d', color: '#f87171' },
  info: { backgroundColor: '#1e3a5f', color: '#60a5fa' },
}

const sizeStyles: Record<BadgeSize, React.CSSProperties> = {
  sm: { fontSize: '10px', padding: '2px 6px' },
  md: { fontSize: '12px', padding: '4px 10px' },
}

const dotColors: Record<BadgeVariant, string> = {
  default: '#a0a0b0',
  success: '#4ade80',
  warning: '#fbbf24',
  danger: '#f87171',
  info: '#60a5fa',
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  dot = false,
  rounded = false,
  children,
  className,
  'data-testid': testId = 'badge',
}) => {
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: 500,
    borderRadius: rounded ? '9999px' : '4px',
    ...variantStyles[variant],
    ...sizeStyles[size],
  }

  return (
    <span style={style} className={className} data-testid={testId} role="status">
      {dot && (
        <span
          data-testid="badge-dot"
          style={{
            width: size === 'sm' ? '5px' : '6px',
            height: size === 'sm' ? '5px' : '6px',
            borderRadius: '50%',
            backgroundColor: dotColors[variant],
            flexShrink: 0,
          }}
        />
      )}
      {children && <span data-testid="badge-content">{children}</span>}
    </span>
  )
}

export default Badge
