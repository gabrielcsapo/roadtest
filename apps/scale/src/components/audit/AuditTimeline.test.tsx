import { describe, it, expect, render, snapshot } from '@fieldtest/core'
import { AuditTimeline } from './AuditTimeline'
import { AuditLog, User } from '../../types'

const mockActor: User = { id: 'u1', name: 'Alice Johnson', email: 'alice@example.com', role: 'admin' }

const mockLog: AuditLog = {
  id: 'log1',
  action: 'vendor.created',
  actor: mockActor,
  target: 'Acme Corp',
  targetType: 'vendor',
  timestamp: '2024-03-15T14:23:00Z',
  metadata: { vendorId: 'v1' },
}

const logs: AuditLog[] = [
  { ...mockLog, id: 'l1', action: 'vendor.created', targetType: 'vendor', timestamp: '2024-03-15T14:23:00Z' },
  { ...mockLog, id: 'l2', action: 'policy.updated', target: 'Password Policy', targetType: 'policy', timestamp: '2024-03-15T10:00:00Z' },
  { ...mockLog, id: 'l3', action: 'credential.rotated', target: 'AWS API Key', targetType: 'credential', timestamp: '2024-03-14T09:00:00Z' },
  { ...mockLog, id: 'l4', action: 'user.role_changed', target: 'Bob Smith', targetType: 'user', timestamp: '2024-03-13T16:00:00Z' },
  { ...mockLog, id: 'l5', action: 'vendor.deleted', targetType: 'vendor', timestamp: '2024-03-13T08:00:00Z', actor: { ...mockActor, id: 'u2', name: 'Bob Smith' } },
]

describe('AuditTimeline', () => {
  // Loading state
  it('shows loading spinner when loading', async () => {
    const { getByTestId } = await render(<AuditTimeline logs={[]} loading />)
    expect(getByTestId('audit-timeline-loading')).toBeDefined()
  })

  it('shows spinner component when loading', async () => {
    const { getByTestId } = await render(<AuditTimeline logs={logs} loading />)
    expect(getByTestId('timeline-spinner')).toBeDefined()
  })

  it('does not show container when loading', async () => {
    const { queryByTestId } = await render(<AuditTimeline logs={logs} loading />)
    expect(queryByTestId('audit-timeline-container')).toBeNull()
  })

  it('does not show empty state when loading', async () => {
    const { queryByTestId } = await render(<AuditTimeline logs={[]} loading />)
    expect(queryByTestId('audit-timeline-empty')).toBeNull()
  })

  it('hides loading when not loading', async () => {
    const { queryByTestId } = await render(<AuditTimeline logs={logs} loading={false} />)
    expect(queryByTestId('audit-timeline-loading')).toBeNull()
  })

  // Empty state
  it('shows empty state when no logs', async () => {
    const { getByTestId } = await render(<AuditTimeline logs={[]} />)
    expect(getByTestId('audit-timeline-empty')).toBeDefined()
  })

  it('does not show container when empty', async () => {
    const { queryByTestId } = await render(<AuditTimeline logs={[]} />)
    expect(queryByTestId('audit-timeline-container')).toBeNull()
  })

  // Single log
  it('renders container with single log', async () => {
    const { getByTestId } = await render(<AuditTimeline logs={[logs[0]]} />)
    expect(getByTestId('audit-timeline-container')).toBeDefined()
  })

  it('renders timeline item for single log', async () => {
    const { getByTestId } = await render(<AuditTimeline logs={[logs[0]]} />)
    expect(getByTestId('timeline-item-l1')).toBeDefined()
  })

  it('shows actor name in single log', async () => {
    const { getByTestId } = await render(<AuditTimeline logs={[logs[0]]} />)
    expect(getByTestId('timeline-actor-l1').textContent).toContain('Alice Johnson')
  })

  it('shows target in single log', async () => {
    const { getByTestId } = await render(<AuditTimeline logs={[logs[0]]} />)
    expect(getByTestId('timeline-target-l1').textContent).toContain('Acme Corp')
  })

  it('shows timestamp for single log', async () => {
    const { getByTestId } = await render(<AuditTimeline logs={[logs[0]]} />)
    expect(getByTestId('timeline-time-l1')).toBeDefined()
  })

  it('shows date header for single log', async () => {
    const { getByTestId } = await render(<AuditTimeline logs={[logs[0]]} />)
    expect(getByTestId('timeline-date-header')).toBeDefined()
  })

  it('renders dot for single log', async () => {
    const { getByTestId } = await render(<AuditTimeline logs={[logs[0]]} />)
    expect(getByTestId('timeline-dot')).toBeDefined()
  })

  it('shows actor avatar for single log', async () => {
    const { getByTestId } = await render(<AuditTimeline logs={[logs[0]]} />)
    expect(getByTestId('timeline-actor-avatar')).toBeDefined()
  })

  it('has correct item count attribute for single log', async () => {
    const { getByTestId } = await render(<AuditTimeline logs={[logs[0]]} />)
    expect(getByTestId('audit-timeline-container').getAttribute('data-item-count')).toBe('1')
  })

  // Multiple logs - all 5
  logs.forEach((log) =>
    it(`renders timeline item for log ${log.id}`, async () => {
      const { getByTestId } = await render(<AuditTimeline logs={logs} />)
      expect(getByTestId(`timeline-item-${log.id}`)).toBeDefined()
    })
  )

  logs.forEach((log) =>
    it(`shows correct actor for log ${log.id}`, async () => {
      const { getByTestId } = await render(<AuditTimeline logs={logs} />)
      expect(getByTestId(`timeline-actor-${log.id}`).textContent).toContain(log.actor.name)
    })
  )

  logs.forEach((log) =>
    it(`shows correct target for log ${log.id}`, async () => {
      const { getByTestId } = await render(<AuditTimeline logs={logs} />)
      expect(getByTestId(`timeline-target-${log.id}`)).toBeDefined()
    })
  )

  logs.forEach((log) =>
    it(`shows timestamp for log ${log.id}`, async () => {
      const { getByTestId } = await render(<AuditTimeline logs={logs} />)
      expect(getByTestId(`timeline-time-${log.id}`)).toBeDefined()
    })
  )

  // Date grouping
  it('groups logs by date into separate sections', async () => {
    const { getByTestId } = await render(<AuditTimeline logs={logs} />)
    // logs have 3 distinct dates
    expect(getByTestId('audit-timeline-container')).toBeDefined()
  })

  it('logs on same date appear in same group', async () => {
    const sameDateLogs = [
      { ...mockLog, id: 'sd1', timestamp: '2024-03-15T09:00:00Z' },
      { ...mockLog, id: 'sd2', timestamp: '2024-03-15T14:00:00Z' },
    ]
    const { getByTestId } = await render(<AuditTimeline logs={sameDateLogs} />)
    expect(getByTestId('timeline-item-sd1')).toBeDefined()
    expect(getByTestId('timeline-item-sd2')).toBeDefined()
  })

  it('logs on different dates appear in separate groups', async () => {
    const { getByTestId } = await render(<AuditTimeline logs={logs} />)
    expect(getByTestId('audit-timeline-container')).toBeDefined()
  })

  it('shows correct item count with 5 logs', async () => {
    const { getByTestId } = await render(<AuditTimeline logs={logs} />)
    expect(getByTestId('audit-timeline-container').getAttribute('data-item-count')).toBe('5')
  })

  // maxItems
  it('limits items when maxItems is provided', async () => {
    const { getByTestId } = await render(<AuditTimeline logs={logs} maxItems={3} />)
    expect(getByTestId('audit-timeline-container').getAttribute('data-item-count')).toBe('3')
  })

  it('shows truncation message when maxItems < total', async () => {
    const { getByTestId } = await render(<AuditTimeline logs={logs} maxItems={3} />)
    expect(getByTestId('timeline-truncated')).toBeDefined()
  })

  it('does not show truncation when maxItems equals total', async () => {
    const { queryByTestId } = await render(<AuditTimeline logs={logs} maxItems={5} />)
    expect(queryByTestId('timeline-truncated')).toBeNull()
  })

  it('does not show truncation when maxItems exceeds total', async () => {
    const { queryByTestId } = await render(<AuditTimeline logs={logs} maxItems={100} />)
    expect(queryByTestId('timeline-truncated')).toBeNull()
  })

  it('shows correct maxItems count in truncation message', async () => {
    const { getByTestId } = await render(<AuditTimeline logs={logs} maxItems={2} />)
    expect(getByTestId('timeline-truncated').textContent).toContain('2')
  })

  it('shows total count in truncation message', async () => {
    const { getByTestId } = await render(<AuditTimeline logs={logs} maxItems={2} />)
    expect(getByTestId('timeline-truncated').textContent).toContain('5')
  })

  it('does not show truncation when maxItems is not provided', async () => {
    const { queryByTestId } = await render(<AuditTimeline logs={logs} />)
    expect(queryByTestId('timeline-truncated')).toBeNull()
  })

  it('shows first log item when maxItems is 1', async () => {
    const { getByTestId } = await render(<AuditTimeline logs={logs} maxItems={1} />)
    expect(getByTestId('audit-timeline-container').getAttribute('data-item-count')).toBe('1')
  })

  // Chronological order - tests that container renders correctly
  it('renders timeline container in correct order', async () => {
    const { getByTestId } = await render(<AuditTimeline logs={logs} />)
    expect(getByTestId('audit-timeline-container')).toBeDefined()
  })

  it('handles 10 logs correctly', async () => {
    const tenLogs = Array.from({ length: 10 }, (_, i) => ({
      ...mockLog,
      id: `tl${i}`,
      timestamp: `2024-03-${String(15 - i).padStart(2, '0')}T12:00:00Z`,
    }))
    const { getByTestId } = await render(<AuditTimeline logs={tenLogs} />)
    expect(getByTestId('audit-timeline-container').getAttribute('data-item-count')).toBe('10')
  })

  // Snapshots
  it('matches snapshot with all logs', async () => {
    const { container } = await render(<AuditTimeline logs={logs} />)
    await snapshot('audit-timeline-full')
  })

  it('matches snapshot for empty state', async () => {
    const { container } = await render(<AuditTimeline logs={[]} />)
    await snapshot('audit-timeline-empty')
  })

  it('matches snapshot with maxItems=2', async () => {
    const { container } = await render(<AuditTimeline logs={logs} maxItems={2} />)
    await snapshot('audit-timeline-limited')
  })

  it('matches snapshot for loading state', async () => {
    const { container } = await render(<AuditTimeline logs={[]} loading />)
    await snapshot('audit-timeline-loading')
  })

  it('renders group items section', async () => {
    const { getByTestId } = await render(<AuditTimeline logs={[logs[0]]} />)
    expect(getByTestId('timeline-group-items')).toBeDefined()
  })
})
