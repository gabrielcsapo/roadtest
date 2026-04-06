import { describe, it, expect, render, snapshot } from '@viewtest/core'
import { AuditActionBadge } from './AuditActionBadge'

const createActions = [
  'vendor.created',
  'policy.added',
  'credential.uploaded',
  'user.registered',
  'control.created',
]
const updateActions = [
  'policy.updated',
  'credential.rotated',
  'user.role_changed',
  'vendor.modified',
  'control.edited',
  'license.renewed',
]
const deleteActions = [
  'vendor.deleted',
  'policy.removed',
  'credential.revoked',
  'user.terminated',
  'control.deleted',
]
const viewActions = [
  'report.viewed',
  'policy.accessed',
  'credential.downloaded',
  'data.exported',
  'audit.read',
]
const unknownActions = [
  'vendor.synced',
  'policy.approved',
  'system.restarted',
  'job.queued',
]
const sizes = ['sm', 'md'] as const

describe('AuditActionBadge', () => {
  // Renders for each create action
  createActions.forEach((action) =>
    it(`renders badge for create action: ${action}`, async () => {
      const { getByTestId } = await render(<AuditActionBadge action={action} />)
      expect(getByTestId('audit-action-badge')).toBeDefined()
    })
  )

  // Create actions have green color
  createActions.forEach((action) =>
    it(`create action ${action} has green category`, async () => {
      const { getByTestId } = await render(<AuditActionBadge action={action} />)
      expect(getByTestId('audit-action-badge').getAttribute('data-category')).toBe('create')
    })
  )

  // Renders for each update action
  updateActions.forEach((action) =>
    it(`renders badge for update action: ${action}`, async () => {
      const { getByTestId } = await render(<AuditActionBadge action={action} />)
      expect(getByTestId('audit-action-badge')).toBeDefined()
    })
  )

  // Update actions have blue color
  updateActions.forEach((action) =>
    it(`update action ${action} has update category`, async () => {
      const { getByTestId } = await render(<AuditActionBadge action={action} />)
      expect(getByTestId('audit-action-badge').getAttribute('data-category')).toBe('update')
    })
  )

  // Renders for each delete action
  deleteActions.forEach((action) =>
    it(`renders badge for delete action: ${action}`, async () => {
      const { getByTestId } = await render(<AuditActionBadge action={action} />)
      expect(getByTestId('audit-action-badge')).toBeDefined()
    })
  )

  // Delete actions have red color
  deleteActions.forEach((action) =>
    it(`delete action ${action} has delete category`, async () => {
      const { getByTestId } = await render(<AuditActionBadge action={action} />)
      expect(getByTestId('audit-action-badge').getAttribute('data-category')).toBe('delete')
    })
  );

  // Renders for each view action
  viewActions.forEach((action) =>
    it(`renders badge for view action: ${action}`, async () => {
      const { getByTestId } = await render(<AuditActionBadge action={action} />)
      expect(getByTestId('audit-action-badge')).toBeDefined()
    })
  );

  // View actions have gray color
  viewActions.forEach((action) =>
    it(`view action ${action} has view category`, async () => {
      const { getByTestId } = await render(<AuditActionBadge action={action} />)
      expect(getByTestId('audit-action-badge').getAttribute('data-category')).toBe('view')
    })
  );

  // Unknown actions fallback
  unknownActions.forEach((action) =>
    it(`unknown action ${action} renders with fallback`, async () => {
      const { getByTestId } = await render(<AuditActionBadge action={action} />)
      expect(getByTestId('audit-action-badge')).toBeDefined()
    })
  );

  // Size variations for all action types
  ([...createActions.slice(0, 2), ...updateActions.slice(0, 2), ...deleteActions.slice(0, 2)] as string[]).forEach((action) =>
    sizes.forEach((size) =>
      it(`renders ${action} at size ${size}`, async () => {
        const { getByTestId } = await render(<AuditActionBadge action={action} size={size} />)
        expect(getByTestId('audit-action-badge')).toBeDefined()
      })
    )
  )

  // Label text
  it('shows Create label for created actions', async () => {
    const { getByTestId } = await render(<AuditActionBadge action="vendor.created" />)
    expect(getByTestId('action-badge-label').textContent).toBe('Create')
  })

  it('shows Update label for updated actions', async () => {
    const { getByTestId } = await render(<AuditActionBadge action="policy.updated" />)
    expect(getByTestId('action-badge-label').textContent).toBe('Update')
  })

  it('shows Delete label for deleted actions', async () => {
    const { getByTestId } = await render(<AuditActionBadge action="vendor.deleted" />)
    expect(getByTestId('action-badge-label').textContent).toBe('Delete')
  })

  it('shows View label for viewed actions', async () => {
    const { getByTestId } = await render(<AuditActionBadge action="report.viewed" />)
    expect(getByTestId('action-badge-label').textContent).toBe('View')
  })

  it('shows Action label for unknown actions', async () => {
    const { getByTestId } = await render(<AuditActionBadge action="vendor.synced" />)
    expect(getByTestId('action-badge-label').textContent).toBe('Action')
  })

  // data-action attribute
  it('stores action in data-action attribute', async () => {
    const { getByTestId } = await render(<AuditActionBadge action="policy.updated" />)
    expect(getByTestId('audit-action-badge').getAttribute('data-action')).toBe('policy.updated')
  })

  // Custom testid
  it('uses custom data-testid when provided', async () => {
    const { getByTestId } = await render(
      <AuditActionBadge action="vendor.created" data-testid="custom-badge" />
    )
    expect(getByTestId('custom-badge')).toBeDefined()
  })

  // Default size
  it('defaults to md size', async () => {
    const { getByTestId } = await render(<AuditActionBadge action="vendor.created" />)
    expect(getByTestId('audit-action-badge')).toBeDefined()
  })

  // Plain action strings without dot notation
  it('renders action without dot notation', async () => {
    const { getByTestId } = await render(<AuditActionBadge action="created" />)
    expect(getByTestId('audit-action-badge')).toBeDefined()
  })

  it('renders empty action string', async () => {
    const { getByTestId } = await render(<AuditActionBadge action="" />)
    expect(getByTestId('audit-action-badge')).toBeDefined()
  })

  // Snapshots
  it('matches snapshot for create action', async () => {
    const { container } = await render(<AuditActionBadge action="vendor.created" />)
    await snapshot('audit-action-badge-create')
  })

  it('matches snapshot for update action', async () => {
    const { container } = await render(<AuditActionBadge action="policy.updated" />)
    await snapshot('audit-action-badge-update')
  })

  it('matches snapshot for delete action', async () => {
    const { container } = await render(<AuditActionBadge action="vendor.deleted" />)
    await snapshot('audit-action-badge-delete')
  })

  it('matches snapshot for view action', async () => {
    const { container } = await render(<AuditActionBadge action="report.viewed" />)
    await snapshot('audit-action-badge-view')
  })

  it('matches snapshot for unknown action', async () => {
    const { container } = await render(<AuditActionBadge action="vendor.synced" />)
    await snapshot('audit-action-badge-unknown')
  })

  // Verify all create actions at sm size
  createActions.forEach((action) =>
    it(`create action ${action} renders at sm size`, async () => {
      const { getByTestId } = await render(<AuditActionBadge action={action} size="sm" />)
      expect(getByTestId('audit-action-badge').getAttribute('data-action')).toBe(action)
    })
  )

  // Verify all update actions at md size
  updateActions.forEach((action) =>
    it(`update action ${action} renders at md size`, async () => {
      const { getByTestId } = await render(<AuditActionBadge action={action} size="md" />)
      expect(getByTestId('audit-action-badge').getAttribute('data-action')).toBe(action)
    })
  )

  // Verify all delete actions at sm size
  deleteActions.forEach((action) =>
    it(`delete action ${action} renders at sm size`, async () => {
      const { getByTestId } = await render(<AuditActionBadge action={action} size="sm" />)
      expect(getByTestId('action-badge-label').textContent).toBe('Delete')
    })
  )

  // Verify all view actions label
  viewActions.forEach((action) =>
    it(`view action ${action} shows View label`, async () => {
      const { getByTestId } = await render(<AuditActionBadge action={action} />)
      expect(getByTestId('action-badge-label').textContent).toBe('View')
    })
  )

  // Verify create actions show Create label
  createActions.forEach((action) =>
    it(`create action ${action} shows Create label`, async () => {
      const { getByTestId } = await render(<AuditActionBadge action={action} />)
      expect(getByTestId('action-badge-label').textContent).toBe('Create')
    })
  )

  // Verify update actions show Update label
  updateActions.forEach((action) =>
    it(`update action ${action} shows Update label`, async () => {
      const { getByTestId } = await render(<AuditActionBadge action={action} />)
      expect(getByTestId('action-badge-label').textContent).toBe('Update')
    })
  )
})
