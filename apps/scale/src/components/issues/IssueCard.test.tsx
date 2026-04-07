import { describe, it, expect, render, fireEvent, snapshot } from '@fieldtest/core'
import { IssueCard } from './IssueCard'
import { Issue, User, Risk, Framework } from '../../types'

const mockAssignee: User = { id: 'u1', name: 'Alice Johnson', email: 'alice@example.com', role: 'admin' }

const mockIssue: Issue = {
  id: 'i1',
  title: 'Missing MFA enforcement',
  description: 'MFA is not enforced for admin accounts',
  severity: 'high',
  status: 'open',
  assignee: mockAssignee,
  dueDate: '2099-04-30',
  createdAt: '2024-03-01',
  framework: 'SOC2',
}

const issues: Issue[] = [
  { ...mockIssue, id: 'i1', severity: 'critical', status: 'open' },
  { ...mockIssue, id: 'i2', severity: 'high', status: 'in-progress', title: 'Unpatched systems' },
  { ...mockIssue, id: 'i3', severity: 'medium', status: 'resolved', title: 'Weak password policy' },
  { ...mockIssue, id: 'i4', severity: 'low', status: 'wont-fix', title: 'Missing audit log retention' },
  { ...mockIssue, id: 'i5', severity: 'high', status: 'open', assignee: undefined, dueDate: undefined },
]

const allSeverities: Risk[] = ['low', 'medium', 'high', 'critical']
const allStatuses = ['open', 'in-progress', 'resolved', 'wont-fix'] as const

describe('IssueCard', () => {
  // All 5 issues render
  issues.forEach((issue) =>
    it(`renders card for issue ${issue.id}`, async () => {
      const { getByTestId } = await render(<IssueCard issue={issue} />)
      expect(getByTestId('issue-card')).toBeDefined()
    })
  )

  // Title and description
  issues.forEach((issue) =>
    it(`shows title for issue ${issue.id}`, async () => {
      const { getByTestId } = await render(<IssueCard issue={issue} />)
      expect(getByTestId('issue-title').textContent).toContain(issue.title)
    })
  )

  it('shows issue description', async () => {
    const { getByTestId } = await render(<IssueCard issue={mockIssue} />)
    expect(getByTestId('issue-description')).toBeDefined()
  })

  // Status badge for all 4 statuses
  allStatuses.map((status) =>
    it(`shows status badge for ${status}`, async () => {
      const { getByTestId } = await render(<IssueCard issue={{ ...mockIssue, status }} />)
      expect(getByTestId('issue-status-badge')).toBeDefined()
    })
  )

  it('shows Open label for open issues', async () => {
    const { getByTestId } = await render(<IssueCard issue={{ ...mockIssue, status: 'open' }} />)
    expect(getByTestId('issue-status-badge').textContent).toContain('Open')
  })

  it('shows In Progress label', async () => {
    const { getByTestId } = await render(<IssueCard issue={{ ...mockIssue, status: 'in-progress' }} />)
    expect(getByTestId('issue-status-badge').textContent).toContain('In Progress')
  })

  it('shows Resolved label', async () => {
    const { getByTestId } = await render(<IssueCard issue={{ ...mockIssue, status: 'resolved' }} />)
    expect(getByTestId('issue-status-badge').textContent).toContain('Resolved')
  })

  it("shows Won't Fix label", async () => {
    const { getByTestId } = await render(<IssueCard issue={{ ...mockIssue, status: 'wont-fix' }} />)
    expect(getByTestId('issue-status-badge').textContent).toContain("Won't Fix")
  })

  // Severity × status combos (16 combos)
  allSeverities.forEach((severity) =>
    allStatuses.forEach((status) =>
      it(`renders ${severity} severity with ${status} status`, async () => {
        const { getByTestId } = await render(<IssueCard issue={{ ...mockIssue, severity, status }} />)
        expect(getByTestId('issue-card')).toBeDefined()
        expect(getByTestId('issue-status-badge')).toBeDefined()
      })
    )
  )

  // Assignee
  it('shows assignee name', async () => {
    const { getByTestId } = await render(<IssueCard issue={mockIssue} />)
    expect(getByTestId('assignee-name').textContent).toContain('Alice Johnson')
  })

  it('shows assignee avatar', async () => {
    const { getByTestId } = await render(<IssueCard issue={mockIssue} />)
    expect(getByTestId('assignee-avatar')).toBeDefined()
  })

  it('shows unassigned when no assignee', async () => {
    const { getByTestId } = await render(<IssueCard issue={issues[4]} />)
    expect(getByTestId('unassigned-label')).toBeDefined()
  })

  it('does not show assignee section when unassigned', async () => {
    const { queryByTestId } = await render(<IssueCard issue={issues[4]} />)
    expect(queryByTestId('issue-assignee')).toBeNull()
  })

  it('shows issue-assignee section when assigned', async () => {
    const { getByTestId } = await render(<IssueCard issue={mockIssue} />)
    expect(getByTestId('issue-assignee')).toBeDefined()
  })

  // Due date
  it('shows due date when set', async () => {
    const { getByTestId } = await render(<IssueCard issue={{ ...mockIssue, dueDate: '2099-12-31' }} />)
    expect(getByTestId('issue-due-date')).toBeDefined()
  })

  it('shows overdue label for past due date', async () => {
    const { getByTestId } = await render(<IssueCard issue={{ ...mockIssue, dueDate: '2020-01-01' }} />)
    expect(getByTestId('issue-due-date').textContent).toContain('Overdue:')
  })

  it('shows Due prefix for future due date', async () => {
    const { getByTestId } = await render(<IssueCard issue={{ ...mockIssue, dueDate: '2099-12-31' }} />)
    expect(getByTestId('issue-due-date').textContent).toContain('Due:')
  })

  it('shows no-due-date when dueDate is undefined', async () => {
    const { getByTestId } = await render(<IssueCard issue={issues[4]} />)
    expect(getByTestId('no-due-date')).toBeDefined()
  })

  it('does not show due date element when dueDate is undefined', async () => {
    const { queryByTestId } = await render(<IssueCard issue={issues[4]} />)
    expect(queryByTestId('issue-due-date')).toBeNull()
  })

  // Framework badge
  it('shows framework badge when framework is set', async () => {
    const { getByTestId } = await render(<IssueCard issue={mockIssue} />)
    expect(getByTestId('issue-framework-badge')).toBeDefined()
  })

  it('shows framework name in badge', async () => {
    const { getByTestId } = await render(<IssueCard issue={{ ...mockIssue, framework: 'SOC2' }} />)
    expect(getByTestId('issue-framework-badge').textContent).toContain('SOC2')
  })

  it('does not show framework badge when framework is not set', async () => {
    const { queryByTestId } = await render(<IssueCard issue={{ ...mockIssue, framework: undefined }} />)
    expect(queryByTestId('issue-framework-badge')).toBeNull()
  })

  // Created at
  it('shows created at date', async () => {
    const { getByTestId } = await render(<IssueCard issue={mockIssue} />)
    expect(getByTestId('issue-created-at').textContent).toContain('2024-03-01')
  })

  // Click handler
  it('calls onClick when card is clicked', async () => {
    let clicked = false
    const { getByTestId } = await render(<IssueCard issue={mockIssue} onClick={() => { clicked = true }} />)
    await fireEvent.click(getByTestId('issue-card'))
    expect(clicked).toBeTruthy()
  })

  it('passes correct issue to onClick', async () => {
    let received: Issue | null = null
    const { getByTestId } = await render(<IssueCard issue={issues[1]} onClick={(i) => { received = i }} />)
    await fireEvent.click(getByTestId('issue-card'))
    expect(received?.id).toBe('i2')
  })

  // Action buttons
  it('shows assign button when onAssign provided', async () => {
    const { getByTestId } = await render(<IssueCard issue={mockIssue} onAssign={() => {}} />)
    expect(getByTestId('assign-button')).toBeDefined()
  })

  it('calls onAssign with correct issue', async () => {
    let assigned: Issue | null = null
    const { getByTestId } = await render(<IssueCard issue={mockIssue} onAssign={(i) => { assigned = i }} />)
    await fireEvent.click(getByTestId('assign-button'))
    expect(assigned?.id).toBe('i1')
  })

  it('shows resolve button for non-resolved issues', async () => {
    const { getByTestId } = await render(<IssueCard issue={{ ...mockIssue, status: 'open' }} onResolve={() => {}} />)
    expect(getByTestId('resolve-button')).toBeDefined()
  })

  it('does not show resolve button for resolved issues', async () => {
    const { queryByTestId } = await render(<IssueCard issue={{ ...mockIssue, status: 'resolved' }} onResolve={() => {}} />)
    expect(queryByTestId('resolve-button')).toBeNull()
  })

  it('calls onResolve with correct issue', async () => {
    let resolved: Issue | null = null
    const { getByTestId } = await render(<IssueCard issue={{ ...mockIssue, status: 'open' }} onResolve={(i) => { resolved = i }} />)
    await fireEvent.click(getByTestId('resolve-button'))
    expect(resolved?.id).toBe('i1')
  })

  it('shows dismiss button when onDismiss provided', async () => {
    const { getByTestId } = await render(<IssueCard issue={mockIssue} onDismiss={() => {}} />)
    expect(getByTestId('dismiss-button')).toBeDefined()
  })

  it('calls onDismiss with correct issue', async () => {
    let dismissed: Issue | null = null
    const { getByTestId } = await render(<IssueCard issue={mockIssue} onDismiss={(i) => { dismissed = i }} />)
    await fireEvent.click(getByTestId('dismiss-button'))
    expect(dismissed?.id).toBe('i1')
  })

  it('shows actions section when any action provided', async () => {
    const { getByTestId } = await render(<IssueCard issue={mockIssue} onResolve={() => {}} />)
    expect(getByTestId('issue-actions')).toBeDefined()
  })

  it('does not show actions section when no actions provided', async () => {
    const { queryByTestId } = await render(<IssueCard issue={mockIssue} />)
    expect(queryByTestId('issue-actions')).toBeNull()
  })

  it('does not show assign button when onAssign not provided', async () => {
    const { queryByTestId } = await render(<IssueCard issue={mockIssue} />)
    expect(queryByTestId('assign-button')).toBeNull()
  })

  // Snapshots
  it('matches snapshot for critical issue', async () => {
    const { container } = await render(<IssueCard issue={issues[0]} />)
    await snapshot('issue-card-critical')
  })

  it('matches snapshot for high issue in-progress', async () => {
    const { container } = await render(<IssueCard issue={issues[1]} />)
    await snapshot('issue-card-high-in-progress')
  })

  it('matches snapshot for resolved issue', async () => {
    const { container } = await render(<IssueCard issue={issues[2]} />)
    await snapshot('issue-card-resolved')
  })

  it('matches snapshot for wont-fix issue', async () => {
    const { container } = await render(<IssueCard issue={issues[3]} />)
    await snapshot('issue-card-wont-fix')
  })

  it('renders card header', async () => {
    const { getByTestId } = await render(<IssueCard issue={mockIssue} />)
    expect(getByTestId('issue-card-header')).toBeDefined()
  })

  it('renders meta section', async () => {
    const { getByTestId } = await render(<IssueCard issue={mockIssue} />)
    expect(getByTestId('issue-meta')).toBeDefined()
  })

  it('has correct data-issue-id attribute', async () => {
    const { getByTestId } = await render(<IssueCard issue={issues[2]} />)
    expect(getByTestId('issue-card').getAttribute('data-issue-id')).toBe('i3')
  })

  it('has pointer cursor when onClick provided', async () => {
    const { getByTestId } = await render(<IssueCard issue={mockIssue} onClick={() => {}} />)
    expect(getByTestId('issue-card').style.cursor).toBe('pointer')
  })

  it('does not crash when onClick not provided', async () => {
    const { getByTestId } = await render(<IssueCard issue={mockIssue} />)
    await fireEvent.click(getByTestId('issue-card'))
    expect(getByTestId('issue-card')).toBeDefined()
  })
})
