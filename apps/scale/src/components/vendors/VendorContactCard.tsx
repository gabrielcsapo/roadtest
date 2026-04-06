import React from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

interface VendorContactCardProps {
  name: string
  email: string
  role?: string
  phone?: string
  onEmail?: (email: string) => void
  onCopy?: (value: string) => void
}

export function VendorContactCard({ name, email, role, phone, onEmail, onCopy }: VendorContactCardProps) {
  const handleEmailClick = () => onEmail?.(email)
  const handleCopyEmail = () => onCopy?.(email)
  const handleCopyPhone = () => onCopy?.(phone ?? '')

  return (
    <Card data-testid="vendor-contact-card">
      <div data-testid="contact-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div data-testid="contact-name" style={{ fontWeight: 600, fontSize: '16px' }}>{name}</div>
          {role && <Badge data-testid="contact-role" style={{ marginTop: '4px' }}>{role}</Badge>}
        </div>
      </div>

      <div data-testid="contact-details" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div data-testid="contact-email-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span data-testid="contact-email-label" style={{ color: '#6b7280', fontSize: '13px' }}>Email:</span>
          <span data-testid="contact-email-value">{email}</span>
          {onEmail && (
            <Button data-testid="send-email-button" size="sm" variant="secondary" onClick={handleEmailClick}>
              Send Email
            </Button>
          )}
          {onCopy && (
            <Button data-testid="copy-email-button" size="sm" variant="secondary" onClick={handleCopyEmail}>
              Copy
            </Button>
          )}
        </div>

        {phone && (
          <div data-testid="contact-phone-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span data-testid="contact-phone-label" style={{ color: '#6b7280', fontSize: '13px' }}>Phone:</span>
            <span data-testid="contact-phone-value">{phone}</span>
            {onCopy && (
              <Button data-testid="copy-phone-button" size="sm" variant="secondary" onClick={handleCopyPhone}>
                Copy
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

export default VendorContactCard
