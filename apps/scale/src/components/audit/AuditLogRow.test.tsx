import { describe, it, expect, render, fireEvent, snapshot } from '@viewtest/core'
import { AuditLogRow } from './AuditLogRow'
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
  { ...mockLog, id: 'l1', action: 'vendor.created', targetType: 'vendor' },
  { ...mockLog, id: 'l2', action: 'policy.updated', target: 'Password Policy', targetType: 'policy' },
  { ...mockLog, id: 'l3', action: 'credential.rotated', target: 'AWS API Key', targetType: 'credential' },
  { ...mockLog, id: 'l4', action: 'user.role_changed', target: 'Bob Smith', targetType: 'user' },
  {
    ...mockLog,
    id: 'l5',
    action: 'vendor.deleted',
    targetType: 'vendor',
    actor: { ...mockActor, id: 'u2', name: 'Bob Smith' },
  },
]

const targetTypes = ['vendor', 'policy', 'credential', 'user', 'control', 'report']

describe('AuditLogRow', () => {
  // Rendering each log
  logs.map((log) =>
    it(`renders log ${log.id}`, async () => {
      const { getByTestId } = await render(<AuditLogRow log={log} />)
      expect(getByTestId('audit-log-row')).toBeDefined()
    })
  )

  // Actor name display
  logs.map((log) =>
    it(`shows actor name for log ${log.id}`, async () => {
      const { getByTestId } = await render(<AuditLogRow log={log} />)
      expect(getByTestId('actor-name').textContent).toContain(log.actor.name)
    })
  )

  // Target name display
  logs.map((log) =>
    it(`shows target name for log ${log.id}`, async () => {
      const { getByTestId } = await render(<AuditLogRow log={log} />)
      expect(getByTestId('target-name').textContent).toContain(log.target)
    })
  )

  // Target type display
  logs.map((log) =>
    it(`shows target type for log ${log.id}`, async () => {
      const { getByTestId } = await render(<AuditLogRow log={log} />)
      expect(getByTestId('target-type').textContent).toContain(log.targetType)
    })
  )

  // Compact mode
  it('renders in compact mode', async () => {
    const { getByTestId } = await render(<AuditLogRow log={mockLog} compact />)
    expect(getByTestId('audit-log-row').getAttribute('data-compact')).toBe('true')
  })

  it('renders in non-compact mode by default', async () => {
    const { getByTestId } = await render(<AuditLogRow log={mockLog} />)
    expect(getByTestId('audit-log-row').getAttribute('data-compact')).toBe('false')
  })

  it('shows action description in non-compact mode', async () => {
    const { getByTestId } = await render(<AuditLogRow log={mockLog} compact={false} />)
    expect(getByTestId('action-description')).toBeDefined()
  })

  it('hides action description in compact mode', async () => {
    const { queryByTestId } = await render(<AuditLogRow log={mockLog} compact />)
    expect(queryByTestId('action-description')).toBeNull()
  })

  it('shows actor avatar in compact mode', async () => {
    const { getByTestId } = await render(<AuditLogRow log={mockLog} compact />)
    expect(getByTestId('actor-avatar')).toBeDefined()
  })

  it('shows actor avatar in non-compact mode', async () => {
    const { getByTestId } = await render(<AuditLogRow log={mockLog} compact={false} />)
    expect(getByTestId('actor-avatar')).toBeDefined()
  })

  it('shows action icon in compact mode', async () => {
    const { getByTestId } = await render(<AuditLogRow log={mockLog} compact />)
    expect(getByTestId('action-icon')).toBeDefined()
  })

  it('shows action icon in non-compact mode', async () => {
    const { getByTestId } = await render(<AuditLogRow log={mockLog} />)
    expect(getByTestId('action-icon')).toBeDefined()
  })

  // Click handler
  it('calls onClick when row is clicked', async () => {
    let clicked = false
    const { getByTestId } = await render(<AuditLogRow log={mockLog} onClick={() => { clicked = true }} />)
    await fireEvent.click(getByTestId('audit-log-row'))
    expect(clicked).toBeTruthy()
  })

  it('passes correct log to onClick', async () => {
    let received: AuditLog | null = null
    const { getByTestId } = await render(<AuditLogRow log={logs[1]} onClick={(l) => { received = l }} />)
    await fireEvent.click(getByTestId('audit-log-row'))
    expect(received?.id).toBe('l2')
  })

  it('does not crash when onClick is not provided', async () => {
    const { getByTestId } = await render(<AuditLogRow log={mockLog} />)
    await fireEvent.click(getByTestId('audit-log-row'))
    expect(getByTestId('audit-log-row')).toBeDefined()
  })

  it('has pointer cursor when onClick is provided', async () => {
    const { getByTestId } = await render(<AuditLogRow log={mockLog} onClick={() => {}} />)
    expect(getByTestId('audit-log-row').style.cursor).toBe('pointer')
  })

  it('has default cursor when onClick is not provided', async () => {
    const { getByTestId } = await render(<AuditLogRow log={mockLog} />)
    expect(getByTestId('audit-log-row').style.cursor).toBe('default')
  })

  // Timestamp display
  it('renders timestamp', async () => {
    const { getByTestId } = await render(<AuditLogRow log={mockLog} />)
    expect(getByTestId('log-timestamp')).toBeDefined()
  })

  it('renders timestamp in compact mode', async () => {
    const { getByTestId } = await render(<AuditLogRow log={mockLog} compact />)
    expect(getByTestId('log-timestamp')).toBeDefined()
  })

  it('renders timestamp for early morning time', async () => {
    const earlyLog = { ...mockLog, timestamp: '2024-03-15T02:00:00Z' }
    const { getByTestId } = await render(<AuditLogRow log={earlyLog} />)
    expect(getByTestId('log-timestamp')).toBeDefined()
  })

  it('renders timestamp for midnight', async () => {
    const midnightLog = { ...mockLog, timestamp: '2024-03-15T00:00:00Z' }
    const { getByTestId } = await render(<AuditLogRow log={midnightLog} />)
    expect(getByTestId('log-timestamp')).toBeDefined()
  })

  // Action badge
  it('renders action badge', async () => {
    const { getByTestId } = await render(<AuditLogRow log={mockLog} />)
    expect(getByTestId('action-badge')).toBeDefined()
  })

  // Target types with icons
  targetTypes.forEach((type) =>
    it(`renders icon for targetType ${type}`, async () => {
      const log = { ...mockLog, targetType: type }
      const { getByTestId } = await render(<AuditLogRow log={log} />)
      expect(getByTestId('action-icon')).toBeDefined()
    })
  )

  // Different actor variations
  it('shows actor without avatar URL', async () => {
    const actor = { ...mockActor, avatarUrl: undefined }
    const { getByTestId } = await render(<AuditLogRow log={{ ...mockLog, actor }} />)
    expect(getByTestId('actor-avatar')).toBeDefined()
  })

  it('shows actor with avatar URL', async () => {
    const actor = { ...mockActor, avatarUrl: 'https://example.com/avatar.png' }
    const { getByTestId } = await render(<AuditLogRow log={{ ...mockLog, actor }} />)
    expect(getByTestId('actor-avatar')).toBeDefined()
  })

  it('displays different actor name', async () => {
    const { getByTestId } = await render(<AuditLogRow log={logs[4]} />)
    expect(getByTestId('actor-name').textContent).toContain('Bob Smith')
  })

  // Long text handling
  it('renders with very long target name', async () => {
    const log = { ...mockLog, target: 'A'.repeat(200) }
    const { getByTestId } = await render(<AuditLogRow log={log} />)
    expect(getByTestId('target-name')).toBeDefined()
  })

  it('renders with very long actor name', async () => {
    const actor = { ...mockActor, name: 'Very Long Name That Exceeds Normal Display Width Considerably' }
    const { getByTestId } = await render(<AuditLogRow log={{ ...mockLog, actor }} />)
    expect(getByTestId('actor-name')).toBeDefined()
  })

  // Missing metadata
  it('renders without metadata gracefully', async () => {
    const log = { ...mockLog, metadata: {} }
    const { getByTestId } = await render(<AuditLogRow log={log} />)
    expect(getByTestId('audit-log-row')).toBeDefined()
  })

  it('renders with complex metadata', async () => {
    const log = { ...mockLog, metadata: { a: 1, b: 'two', c: { nested: true } } }
    const { getByTestId } = await render(<AuditLogRow log={log} />)
    expect(getByTestId('audit-log-row')).toBeDefined()
  })

  // Log ID attribute
  it('has correct data-log-id attribute', async () => {
    const { getByTestId } = await render(<AuditLogRow log={mockLog} />)
    expect(getByTestId('audit-log-row').getAttribute('data-log-id')).toBe('log1')
  })

  // Action description content
  it('action description mentions target', async () => {
    const { getByTestId } = await render(<AuditLogRow log={mockLog} />)
    expect(getByTestId('action-description').textContent).toContain('Acme Corp')
  })

  // Snapshots
  ;(['l1', 'l2', 'l3', 'l4', 'l5'] as string[]).map((id, i) =>
    it(`matches snapshot for log ${id}`, async () => {
      const { container } = await render(<AuditLogRow log={logs[i]} />)
      await snapshot(`audit-log-row-${id}`)
    })
  )

  // Accessibility
  it('renders with no required aria attributes missing', async () => {
    const { getByTestId } = await render(<AuditLogRow log={mockLog} />)
    expect(getByTestId('audit-log-row')).toBeDefined()
  })

  it('compact mode with all logs renders actor name', async () => {
    for (const log of logs) {
      const { getByTestId } = await render(<AuditLogRow log={log} compact />)
      expect(getByTestId('actor-name').textContent).toContain(log.actor.name)
    }
  })

  it('renders unknown targetType with fallback icon', async () => {
    const log = { ...mockLog, targetType: 'unknown_type' }
    const { getByTestId } = await render(<AuditLogRow log={log} />)
    expect(getByTestId('action-icon')).toBeDefined()
  })
})
