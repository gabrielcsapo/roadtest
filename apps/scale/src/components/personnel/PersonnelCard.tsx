import React from 'react'
import { Personnel } from '../../types'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { PersonnelStatusBadge } from './PersonnelStatusBadge'
import { BackgroundCheckBadge } from './BackgroundCheckBadge'

interface PersonnelCardProps {
  person: Personnel
  onClick?: (person: Personnel) => void
  onEdit?: (person: Personnel) => void
  onOffboard?: (person: Personnel) => void
  compact?: boolean
}

export function PersonnelCard({
  person,
  onClick,
  onEdit,
  onOffboard,
  compact = false,
}: PersonnelCardProps) {
  const handleCardClick = () => onClick?.(person)
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(person)
  }
  const handleOffboard = (e: React.MouseEvent) => {
    e.stopPropagation()
    onOffboard?.(person)
  }

  return (
    <div
      data-testid="personnel-card"
      data-person-id={person.id}
      onClick={handleCardClick}
      style={{
        display: 'flex',
        flexDirection: compact ? 'row' : 'column',
        alignItems: compact ? 'center' : 'flex-start',
        gap: compact ? '12px' : '16px',
        padding: compact ? '12px 16px' : '20px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        background: '#fff',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s',
      }}
    >
      <div data-testid="personnel-avatar">
        <Avatar
          name={person.name}
          src={person.avatarUrl}
          size={compact ? 32 : 48}
        />
      </div>

      <div
        data-testid="personnel-info"
        style={{ flex: 1, minWidth: 0 }}
      >
        <div
          data-testid="personnel-name"
          style={{
            fontWeight: 600,
            fontSize: compact ? '14px' : '16px',
            color: '#111827',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {person.name}
        </div>

        {!compact && (
          <div
            data-testid="personnel-job-title"
            style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}
          >
            {person.jobTitle}
          </div>
        )}

        <div
          data-testid="personnel-department"
          style={{ fontSize: '12px', color: '#9ca3af', marginTop: compact ? '2px' : '4px' }}
        >
          {person.department}
        </div>

        {!compact && (
          <div
            style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}
          >
            <PersonnelStatusBadge
              status={person.status}
              size="sm"
              showIcon={true}
            />
            <BackgroundCheckBadge
              status={person.backgroundCheckStatus}
              size="sm"
            />
          </div>
        )}
      </div>

      {compact && (
        <div data-testid="personnel-compact-badges" style={{ display: 'flex', gap: '6px' }}>
          <PersonnelStatusBadge status={person.status} size="sm" />
          <BackgroundCheckBadge status={person.backgroundCheckStatus} size="sm" />
        </div>
      )}

      {(onEdit || onOffboard) && (
        <div
          data-testid="personnel-actions"
          style={{ display: 'flex', gap: '8px', marginTop: compact ? '0' : '4px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <Button
              data-testid="edit-button"
              variant="ghost"
              size="sm"
              onClick={handleEdit}
            >
              Edit
            </Button>
          )}
          {onOffboard && person.status !== 'offboarded' && (
            <Button
              data-testid="offboard-button"
              variant="ghost"
              size="sm"
              onClick={handleOffboard}
            >
              Offboard
            </Button>
          )}
        </div>
      )}

      {person.email && (
        <div
          data-testid="personnel-email"
          style={{
            fontSize: '12px',
            color: '#6b7280',
            display: compact ? 'none' : 'block',
          }}
        >
          {person.email}
        </div>
      )}

      {person.manager && !compact && (
        <div
          data-testid="personnel-manager"
          style={{ fontSize: '12px', color: '#9ca3af' }}
        >
          Manager: {person.manager.name}
        </div>
      )}

      {!compact && (
        <div
          data-testid="personnel-start-date"
          style={{ fontSize: '12px', color: '#9ca3af' }}
        >
          Started: {person.startDate}
        </div>
      )}
    </div>
  )
}
