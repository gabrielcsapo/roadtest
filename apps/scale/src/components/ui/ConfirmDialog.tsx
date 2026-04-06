import React from 'react'

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmDialogVariant
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  className?: string
  'data-testid'?: string
}

const variantConfig: Record<ConfirmDialogVariant, { color: string; icon: string; confirmBg: string }> = {
  danger: { color: '#f87171', icon: '⚠', confirmBg: '#ef4444' },
  warning: { color: '#fbbf24', icon: '⚠', confirmBg: '#f59e0b' },
  info: { color: '#60a5fa', icon: 'ℹ', confirmBg: '#6366f1' },
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'info',
  onConfirm,
  onCancel,
  loading = false,
  className,
  'data-testid': testId = 'confirm-dialog',
}) => {
  if (!open) return null

  const config = variantConfig[variant]

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  }

  const dialogStyle: React.CSSProperties = {
    backgroundColor: '#1a1a2e',
    borderRadius: '12px',
    border: '1px solid #3a3a4a',
    width: '420px',
    maxWidth: '100%',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  }

  const iconStyle: React.CSSProperties = {
    fontSize: '24px',
    color: config.color,
    flexShrink: 0,
    marginTop: '2px',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '17px',
    fontWeight: 700,
    color: '#e0e0f0',
    margin: 0,
  }

  const messageStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#a0a0b0',
    lineHeight: 1.6,
    margin: 0,
  }

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '4px',
  }

  const cancelBtnStyle: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: '#1e1e2e',
    border: '1px solid #3a3a4a',
    borderRadius: '6px',
    color: '#a0a0b0',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'inherit',
    fontWeight: 500,
  }

  const confirmBtnStyle: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: loading ? '#4a4a6a' : config.confirmBg,
    border: 'none',
    borderRadius: '6px',
    color: '#ffffff',
    cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    fontFamily: 'inherit',
    fontWeight: 500,
    opacity: loading ? 0.7 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  }

  return (
    <div style={overlayStyle} data-testid={`${testId}-overlay`} role="presentation">
      <div
        style={dialogStyle}
        className={className}
        data-testid={testId}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${testId}-title`}
        aria-describedby={`${testId}-message`}
        data-variant={variant}
      >
        <div style={headerStyle} data-testid={`${testId}-header`}>
          <span style={iconStyle} data-testid={`${testId}-icon`} aria-hidden="true">
            {config.icon}
          </span>
          <h2 id={`${testId}-title`} style={titleStyle} data-testid={`${testId}-title`}>
            {title}
          </h2>
        </div>
        <p id={`${testId}-message`} style={messageStyle} data-testid={`${testId}-message`}>
          {message}
        </p>
        <div style={footerStyle} data-testid={`${testId}-footer`}>
          <button
            style={cancelBtnStyle}
            onClick={onCancel}
            data-testid={`${testId}-cancel`}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            style={confirmBtnStyle}
            onClick={!loading ? onConfirm : undefined}
            data-testid={`${testId}-confirm`}
            disabled={loading}
            aria-busy={loading}
          >
            {loading && (
              <span data-testid={`${testId}-spinner`} style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
