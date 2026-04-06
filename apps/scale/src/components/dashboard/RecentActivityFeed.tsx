import React from 'react'
import { AuditLog } from '../../types'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'
import { EmptyState } from '../ui/EmptyState'
import { Avatar } from '../ui/Avatar'
import { AuditActionBadge } from '../audit/AuditActionBadge'

interface RecentActivityFeedProps {
  logs: AuditLog[]
  loading?: boolean
  maxItems?: number
  onViewAll?: () => void
}

const actionTypeIcons: Record<string, string> = {
  'vendor.created': '🏢',
  'vendor.updated': '🏢',
  'vendor.deleted': '🏢',
  'policy.updated': '📄',
  'policy.created': '📄',
  'credential.rotated': '🔑',
  'credential.created': '🔑',
  'user.role_changed': '👤',
  'user.created': '👤',
  'control.updated': '🛡️',
}

function getActionIcon(action: string): string {
  return actionTypeIcons[action] || '📋'
}

function getRelativeTime(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export function RecentActivityFeed({ logs, loading, maxItems, onViewAll }: RecentActivityFeedProps) {
  if (loading) {
    return (
      <div data-testid="activity-feed-loading" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner data-testid="activity-feed-spinner" />
      </div>
    )
  }

  const displayedLogs = maxItems !== undefined ? logs.slice(0, maxItems) : logs

  return (
    <div data-testid="activity-feed-container" data-item-count={displayedLogs.length}>
      <div data-testid="activity-feed-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
          Recent Activity
        </h3>
        {onViewAll && (
          <Button
            data-testid="view-all-button"
            variant="ghost"
            size="sm"
            onClick={onViewAll}
          >
            View All
          </Button>
        )}
      </div>

      {displayedLogs.length === 0 ? (
        <EmptyState
          data-testid="activity-feed-empty"
          title="No recent activity"
          description="Activity will appear here as events occur."
        />
      ) : (
        <ul data-testid="activity-feed-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {displayedLogs.map((log) => (
            <li
              key={log.id}
              data-testid={`activity-item-${log.id}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px 0',
                borderBottom: '1px solid #f3f4f6',
              }}
            >
              <span data-testid={`activity-icon-${log.id}`} style={{ fontSize: '1.25rem', flexShrink: 0 }}>
                {getActionIcon(log.action)}
              </span>
              <Avatar
                src={log.actor.avatarUrl}
                name={log.actor.name}
                size="xs"
                data-testid={`activity-avatar-${log.id}`}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span data-testid={`activity-actor-${log.id}`} style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                    {log.actor.name}
                  </span>
                  <AuditActionBadge action={log.action} size="sm" data-testid={`activity-action-badge-${log.id}`} />
                </div>
                <div data-testid={`activity-target-${log.id}`} style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                  {log.target} ({log.targetType})
                </div>
              </div>
              <span
                data-testid={`activity-timestamp-${log.id}`}
                style={{ fontSize: '0.75rem', color: '#9ca3af', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {getRelativeTime(log.timestamp)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {maxItems !== undefined && logs.length > maxItems && (
        <div data-testid="activity-feed-truncated" style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.875rem', color: '#6b7280' }}>
          Showing {maxItems} of {logs.length} events
        </div>
      )}
    </div>
  )
}
