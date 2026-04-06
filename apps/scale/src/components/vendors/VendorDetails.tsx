import React, { useState } from 'react'
import { Vendor } from '../../types'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Tabs } from '../ui/Tabs'
import { StatusBadge } from '../ui/StatusBadge'
import { RiskBadge } from '../ui/RiskBadge'
import { Badge } from '../ui/Badge'
import { Spinner } from '../ui/Spinner'

interface VendorDetailsProps {
  vendor: Vendor
  loading?: boolean
  onEdit?: (vendor: Vendor) => void
  onArchive?: (vendor: Vendor) => void
}

const TABS = ['Overview', 'Risk', 'Contacts', 'Documents']

export function VendorDetails({ vendor, loading = false, onEdit, onArchive }: VendorDetailsProps) {
  const [activeTab, setActiveTab] = useState('Overview')

  if (loading) {
    return (
      <div data-testid="vendor-details-loading" style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
        <Spinner />
      </div>
    )
  }

  return (
    <div data-testid="vendor-details">
      <div data-testid="vendor-details-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 data-testid="vendor-details-name">{vendor.name}</h1>
          <div data-testid="vendor-details-badges" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <RiskBadge risk={vendor.riskLevel} data-testid="details-risk-badge" />
            <StatusBadge status={vendor.status} data-testid="details-status-badge" />
            <Badge data-testid="details-category-badge">{vendor.category}</Badge>
          </div>
        </div>
        <div data-testid="vendor-details-actions" style={{ display: 'flex', gap: '8px' }}>
          {onEdit && (
            <Button data-testid="details-edit-button" variant="secondary" onClick={() => onEdit(vendor)}>
              Edit
            </Button>
          )}
          {onArchive && (
            <Button data-testid="details-archive-button" variant="secondary" onClick={() => onArchive(vendor)}>
              Archive
            </Button>
          )}
        </div>
      </div>

      <Tabs
        data-testid="vendor-details-tabs"
        tabs={TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div data-testid="vendor-details-content" style={{ marginTop: '24px' }}>
        {activeTab === 'Overview' && (
          <Card data-testid="tab-overview">
            <div data-testid="overview-website">
              <strong>Website:</strong>{' '}
              <a href={vendor.website} target="_blank" rel="noopener noreferrer">{vendor.website}</a>
            </div>
            <div data-testid="overview-contact" style={{ marginTop: '8px' }}>
              <strong>Contact:</strong> {vendor.contactEmail}
            </div>
            <div data-testid="overview-review-date" style={{ marginTop: '8px' }}>
              <strong>Last Review:</strong> {vendor.lastReviewDate}
            </div>
            {vendor.description && (
              <div data-testid="overview-description" style={{ marginTop: '8px' }}>
                <strong>Description:</strong> {vendor.description}
              </div>
            )}
            {vendor.tags && vendor.tags.length > 0 && (
              <div data-testid="overview-tags" style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {vendor.tags.map(tag => <Badge key={tag} data-testid={`overview-tag-${tag}`}>{tag}</Badge>)}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'Risk' && (
          <Card data-testid="tab-risk">
            <div data-testid="risk-level-section">
              <strong>Risk Level:</strong>{' '}
              <RiskBadge risk={vendor.riskLevel} data-testid="risk-tab-badge" />
            </div>
            <p data-testid="risk-tab-description">Risk assessment information for {vendor.name}.</p>
          </Card>
        )}

        {activeTab === 'Contacts' && (
          <Card data-testid="tab-contacts">
            <div data-testid="contact-email-section">
              <strong>Security Contact:</strong> {vendor.contactEmail}
            </div>
          </Card>
        )}

        {activeTab === 'Documents' && (
          <Card data-testid="tab-documents">
            <p data-testid="documents-placeholder">No documents attached to this vendor.</p>
          </Card>
        )}
      </div>
    </div>
  )
}

export default VendorDetails
