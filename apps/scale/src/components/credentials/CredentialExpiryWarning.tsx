import React from 'react'
import { Credential } from '../../types'
import { Button } from '../ui/Button'
import { Alert } from '../ui/Alert'

interface CredentialExpiryWarningProps {
  credentials: Credential[]
  onRotate?: (id: string) => void
  onDismiss?: () => void
}

function getDaysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null
  const now = new Date()
  const expiry = new Date(expiresAt)
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function CredentialExpiryWarning({
  credentials,
  onRotate,
  onDismiss,
}: CredentialExpiryWarningProps) {
  const expiring = credentials.filter((c) => c.status === 'expiring-soon')
  const expired = credentials.filter((c) => c.status === 'expired')

  if (expiring.length === 0 && expired.length === 0) {
    return null
  }

  return (
    <div data-testid="expiry-warning" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {expired.length > 0 && (
        <div
          data-testid="expired-alert"
          style={{
            padding: '16px',
            borderRadius: '8px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <span aria-hidden="true" style={{ fontSize: '18px' }}>✗</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#dc2626' }}>
              {expired.length === 1 ? '1 credential has expired' : `${expired.length} credentials have expired`}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {expired.map((cred) => (
                <div
                  key={cred.id}
                  data-testid={`expired-item-${cred.id}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span style={{ fontSize: '13px', color: '#374151' }}>
                    <strong>{cred.name}</strong> ({cred.service})
                  </span>
                  {onRotate && (
                    <Button
                      data-testid={`rotate-expired-${cred.id}`}
                      variant="danger"
                      size="sm"
                      onClick={() => onRotate(cred.id)}
                    >
                      Rotate
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          {onDismiss && (
            <button
              data-testid="dismiss-expired-btn"
              onClick={onDismiss}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '18px' }}
            >
              ×
            </button>
          )}
        </div>
      )}

      {expiring.length > 0 && (
        <div
          data-testid="expiring-alert"
          style={{
            padding: '16px',
            borderRadius: '8px',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <span aria-hidden="true" style={{ fontSize: '18px' }}>⚠</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#b45309' }}>
              {expiring.length === 1 ? '1 credential is expiring soon' : `${expiring.length} credentials are expiring soon`}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {expiring.map((cred) => {
                const days = getDaysUntilExpiry(cred.expiresAt)
                return (
                  <div
                    key={cred.id}
                    data-testid={`expiring-item-${cred.id}`}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span style={{ fontSize: '13px', color: '#374151' }}>
                      <strong>{cred.name}</strong> ({cred.service})
                      {days !== null && (
                        <span data-testid={`days-${cred.id}`} style={{ color: '#b45309', marginLeft: '6px' }}>
                          — {days}d remaining
                        </span>
                      )}
                    </span>
                    {onRotate && (
                      <Button
                        data-testid={`rotate-expiring-${cred.id}`}
                        variant="secondary"
                        size="sm"
                        onClick={() => onRotate(cred.id)}
                      >
                        Rotate
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          {onDismiss && (
            <button
              data-testid="dismiss-expiring-btn"
              onClick={onDismiss}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '18px' }}
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  )
}
