import React from 'react'

export type CardPadding = 'none' | 'sm' | 'md' | 'lg'
export type CardShadow = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps {
  title?: string
  subtitle?: string
  footer?: React.ReactNode
  padding?: CardPadding
  shadow?: CardShadow
  border?: boolean
  onClick?: () => void
  loading?: boolean
  children?: React.ReactNode
  className?: string
  'data-testid'?: string
}

const paddingValues: Record<CardPadding, string> = {
  none: '0',
  sm: '12px',
  md: '20px',
  lg: '32px',
}

const shadowValues: Record<CardShadow, string> = {
  none: 'none',
  sm: '0 1px 3px rgba(0,0,0,0.4)',
  md: '0 4px 12px rgba(0,0,0,0.5)',
  lg: '0 8px 24px rgba(0,0,0,0.6)',
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  footer,
  padding = 'md',
  shadow = 'sm',
  border = true,
  onClick,
  loading = false,
  children,
  className,
  'data-testid': testId = 'card',
}) => {
  const cardStyle: React.CSSProperties = {
    backgroundColor: '#1a1a2e',
    borderRadius: '10px',
    border: border ? '1px solid #3a3a4a' : 'none',
    boxShadow: shadowValues[shadow],
    cursor: onClick ? 'pointer' : 'default',
    overflow: 'hidden',
    position: 'relative',
  }

  const headerStyle: React.CSSProperties = {
    padding: padding === 'none' ? '16px 20px 0' : `${paddingValues[padding]} ${paddingValues[padding]} 0`,
    borderBottom: (children || footer) ? '1px solid #3a3a4a' : 'none',
    paddingBottom: '12px',
    marginBottom: padding !== 'none' ? '4px' : undefined,
  }

  const bodyStyle: React.CSSProperties = {
    padding: paddingValues[padding],
  }

  const footerStyle: React.CSSProperties = {
    padding: padding === 'none' ? '16px 20px' : `0 ${paddingValues[padding]} ${paddingValues[padding]}`,
    borderTop: '1px solid #3a3a4a',
    marginTop: padding !== 'none' ? '4px' : undefined,
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#e0e0f0',
    margin: 0,
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#6b6b8a',
    margin: '4px 0 0',
  }

  const loadingOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(26,26,46,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderRadius: '10px',
  }

  return (
    <div
      style={cardStyle}
      className={className}
      data-testid={testId}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {loading && (
        <div style={loadingOverlayStyle} data-testid={`${testId}-loading`}>
          <div style={{ width: '24px', height: '24px', border: '3px solid #3a3a4a', borderTopColor: '#6366f1', borderRadius: '50%' }} data-testid={`${testId}-spinner`} />
        </div>
      )}
      {(title || subtitle) && (
        <div style={headerStyle} data-testid={`${testId}-header`}>
          {title && <h3 style={titleStyle} data-testid={`${testId}-title`}>{title}</h3>}
          {subtitle && <p style={subtitleStyle} data-testid={`${testId}-subtitle`}>{subtitle}</p>}
        </div>
      )}
      {children && (
        <div style={bodyStyle} data-testid={`${testId}-body`}>
          {children}
        </div>
      )}
      {footer && (
        <div style={footerStyle} data-testid={`${testId}-footer`}>
          {footer}
        </div>
      )}
    </div>
  )
}

export default Card
