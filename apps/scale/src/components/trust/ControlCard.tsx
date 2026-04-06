import React from 'react'
import { Control, ComplianceStatus } from '../../types'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { PolicyFrameworkBadge } from '../policies/PolicyFrameworkBadge'

interface ControlCardProps {
  control: Control
  onClick?: (control: Control) => void
  onEdit?: (control: Control) => void
  onAddEvidence?: (control: Control) => void
}

const statusColors: Record<ComplianceStatus, string> = {
  compliant: 'green',
  'non-compliant': 'red',
  'in-progress': 'yellow',
  'not-applicable': 'gray',
}

const statusLabels: Record<ComplianceStatus, string> = {
  compliant: 'Compliant',
  'non-compliant': 'Non-Compliant',
  'in-progress': 'In Progress',
  'not-applicable': 'Not Applicable',
}

function isOverdue(dueDate: string | undefined): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

export function ControlCard({ control, onClick, onEdit, onAddEvidence }: ControlCardProps) {
  const handleClick = () => onClick?.(control)
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(control)
  }
  const handleAddEvidence = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAddEvidence?.(control)
  }

  const overdue = isOverdue(control.dueDate)

  return (
    <Card
      data-testid="control-card"
      data-control-id={control.id}
      onClick={handleClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div data-testid="control-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <PolicyFrameworkBadge framework={control.framework} size="sm" />
            <Badge
              data-testid="control-status-badge"
              color={statusColors[control.status]}
            >
              {statusLabels[control.status]}
            </Badge>
          </div>
          <h3 data-testid="control-name" style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>
            {control.name}
          </h3>
          <p data-testid="control-description" style={{ margin: '4px 0', color: '#6b7280', fontSize: '0.875rem' }}>
            {control.description}
          </p>
        </div>
      </div>

      <div data-testid="control-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span
            data-testid="evidence-count"
            style={{ fontSize: '0.75rem', color: '#6b7280' }}
          >
            {control.evidence.length} {control.evidence.length === 1 ? 'file' : 'files'}
          </span>

          {control.dueDate && (
            <span
              data-testid="control-due-date"
              style={{
                fontSize: '0.75rem',
                color: overdue ? '#ef4444' : '#6b7280',
                fontWeight: overdue ? 600 : 400,
              }}
            >
              {overdue ? 'Overdue: ' : 'Due: '}{control.dueDate}
            </span>
          )}

          {!control.dueDate && (
            <span data-testid="no-due-date" style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              No due date
            </span>
          )}
        </div>

        {control.owner ? (
          <div data-testid="control-owner" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Avatar
              src={control.owner.avatarUrl}
              name={control.owner.name}
              size="xs"
              data-testid="owner-avatar"
            />
            <span data-testid="owner-name" style={{ fontSize: '0.75rem', color: '#374151' }}>
              {control.owner.name}
            </span>
          </div>
        ) : (
          <span data-testid="no-owner" style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            Unassigned
          </span>
        )}
      </div>

      {(onEdit || onAddEvidence) && (
        <div data-testid="control-actions" style={{ display: 'flex', gap: '8px', marginTop: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
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
          {onAddEvidence && (
            <Button
              data-testid="add-evidence-button"
              variant="secondary"
              size="sm"
              onClick={handleAddEvidence}
            >
              Add Evidence
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
