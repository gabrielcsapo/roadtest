import React from 'react'
import { Policy } from '../../types'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Progress } from '../ui/Progress'
import { Avatar } from '../ui/Avatar'
import { PolicyFrameworkBadge } from './PolicyFrameworkBadge'
import { PolicyAcceptanceBar } from './PolicyAcceptanceBar'

interface PolicyCardProps {
  policy: Policy
  onClick?: (policy: Policy) => void
  onEdit?: (policy: Policy) => void
  onAssign?: (policy: Policy) => void
}

const statusColors: Record<string, string> = {
  compliant: 'green',
  'non-compliant': 'red',
  'in-progress': 'yellow',
  'not-applicable': 'gray',
}

const statusLabels: Record<string, string> = {
  compliant: 'Compliant',
  'non-compliant': 'Non-Compliant',
  'in-progress': 'In Progress',
  'not-applicable': 'Not Applicable',
}

export function PolicyCard({ policy, onClick, onEdit, onAssign }: PolicyCardProps) {
  const handleClick = () => onClick?.(policy)
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(policy)
  }
  const handleAssign = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAssign?.(policy)
  }

  return (
    <Card
      data-testid="policy-card"
      onClick={handleClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div data-testid="policy-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 data-testid="policy-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
            {policy.title}
          </h3>
          <p data-testid="policy-description" style={{ margin: '4px 0', color: '#6b7280', fontSize: '0.875rem' }}>
            {policy.description}
          </p>
        </div>
        <Badge
          data-testid="policy-status-badge"
          color={statusColors[policy.status] || 'gray'}
        >
          {statusLabels[policy.status] || policy.status}
        </Badge>
      </div>

      <div data-testid="policy-frameworks" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', margin: '8px 0' }}>
        {policy.frameworks.map((fw) => (
          <PolicyFrameworkBadge key={fw} framework={fw} size="sm" data-testid={`framework-badge-${fw}`} />
        ))}
        {policy.frameworks.length === 0 && (
          <span data-testid="no-frameworks" style={{ color: '#9ca3af', fontSize: '0.75rem' }}>No frameworks</span>
        )}
      </div>

      <div data-testid="policy-acceptance" style={{ margin: '8px 0' }}>
        <PolicyAcceptanceBar rate={policy.acceptanceRate} size="sm" />
      </div>

      <div data-testid="policy-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <div data-testid="policy-owner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar
            src={policy.owner.avatarUrl}
            name={policy.owner.name}
            size="sm"
            data-testid="owner-avatar"
          />
          <span data-testid="owner-name" style={{ fontSize: '0.875rem', color: '#374151' }}>
            {policy.owner.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span data-testid="policy-version" style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            v{policy.version}
          </span>
          <span data-testid="policy-last-updated" style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            {policy.lastUpdated}
          </span>
        </div>
      </div>

      {(onEdit || onAssign) && (
        <div data-testid="policy-actions" style={{ display: 'flex', gap: '8px', marginTop: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
          {onEdit && (
            <Button
              data-testid="edit-button"
              variant="secondary"
              size="sm"
              onClick={handleEdit}
            >
              Edit
            </Button>
          )}
          {onAssign && (
            <Button
              data-testid="assign-button"
              variant="secondary"
              size="sm"
              onClick={handleAssign}
            >
              Assign
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
