import React from 'react'
import { AuditLog } from '../../types'
import { Spinner } from '../ui/Spinner'
import { EmptyState } from '../ui/EmptyState'
import { AuditActionBadge } from './AuditActionBadge'
import { Avatar } from '../ui/Avatar'

interface AuditTimelineProps {
  logs: AuditLog[]
  loading?: boolean
  maxItems?: number
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function groupLogsByDate(logs: AuditLog[]): Record<string, AuditLog[]> {
  const groups: Record<string, AuditLog[]> = {}
  const sorted = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  for (const log of sorted) {
    const dateKey = new Date(log.timestamp).toDateString()
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(log)
  }
  return groups
}

export function AuditTimeline({ logs, loading, maxItems }: AuditTimelineProps) {
  if (loading) {
    return (
      <div data-testid="audit-timeline-loading" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner data-testid="timeline-spinner" />
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        data-testid="audit-timeline-empty"
        title="No activity"
        description="No audit logs to display."
      />
    )
  }

  const limitedLogs = maxItems !== undefined ? logs.slice(0, maxItems) : logs
  const grouped = groupLogsByDate(limitedLogs)
  const dateKeys = Object.keys(grouped)

  return (
    <div data-testid="audit-timeline-container" data-item-count={limitedLogs.length}>
      {dateKeys.map((dateKey) => (
        <div key={dateKey} data-testid={`timeline-date-group-${dateKey.replace(/\s/g, '-')}`}>
          <div
            data-testid="timeline-date-header"
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#6b7280',
              textTransform: 'uppercase',
              padding: '8px 0',
              borderBottom: '1px solid #e5e7eb',
              marginBottom: '8px',
            }}
          >
            {formatDate(grouped[dateKey][0].timestamp)}
          </div>
          <div data-testid="timeline-group-items" style={{ position: 'relative', paddingLeft: '20px' }}>
            <div
              style={{
                position: 'absolute',
                left: '7px',
                top: 0,
                bottom: 0,
                width: '2px',
                backgroundColor: '#e5e7eb',
              }}
            />
            {grouped[dateKey].map((log) => (
              <div
                key={log.id}
                data-testid={`timeline-item-${log.id}`}
                style={{ position: 'relative', paddingBottom: '16px', paddingLeft: '16px' }}
              >
                <div
                  data-testid="timeline-dot"
                  style={{
                    position: 'absolute',
                    left: '-9px',
                    top: '4px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#6b7280',
                    border: '2px solid white',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Avatar src={log.actor.avatarUrl} name={log.actor.name} size="xs" data-testid="timeline-actor-avatar" />
                  <span data-testid={`timeline-actor-${log.id}`} style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                    {log.actor.name}
                  </span>
                  <AuditActionBadge action={log.action} size="sm" />
                  <span data-testid={`timeline-time-${log.id}`} style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: 'auto' }}>
                    {formatTime(log.timestamp)}
                  </span>
                </div>
                <div style={{ paddingLeft: '24px' }}>
                  <span data-testid={`timeline-target-${log.id}`} style={{ fontSize: '0.875rem', color: '#374151' }}>
                    {log.target}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '4px' }}>
                    ({log.targetType})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {maxItems !== undefined && logs.length > maxItems && (
        <div data-testid="timeline-truncated" style={{ textAlign: 'center', padding: '8px', fontSize: '0.875rem', color: '#6b7280' }}>
          Showing {maxItems} of {logs.length} events
        </div>
      )}
    </div>
  )
}
