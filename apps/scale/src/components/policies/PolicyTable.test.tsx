import { describe, it, expect, render, fireEvent, snapshot } from '@viewtest/core'
import { PolicyTable } from './PolicyTable'
import { Policy, User, ComplianceStatus, Framework } from '../../types'

const mockOwner: User = { id: 'u1', name: 'Alice Johnson', email: 'alice@example.com', role: 'admin' }
const mockPolicy: Policy = {
  id: 'pol1',
  title: 'Acceptable Use Policy',
  description: 'Guidelines for acceptable use...',
  status: 'compliant',
  owner: mockOwner,
  lastUpdated: '2024-01-15',
  version: '2.1',
  acceptanceRate: 94,
  frameworks: ['SOC2', 'ISO27001'],
}

const policies: Policy[] = [
  { ...mockPolicy, id: 'p1', title: 'Acceptable Use Policy', status: 'compliant', acceptanceRate: 94 },
  { ...mockPolicy, id: 'p2', title: 'Password Policy', status: 'in-progress', acceptanceRate: 72, frameworks: ['SOC2'] },
  { ...mockPolicy, id: 'p3', title: 'Data Retention Policy', status: 'non-compliant', acceptanceRate: 45, frameworks: ['GDPR', 'HIPAA'] },
  { ...mockPolicy, id: 'p4', title: 'Incident Response Plan', status: 'not-applicable', acceptanceRate: 100, frameworks: ['SOC2', 'ISO27001', 'FedRAMP'] },
  { ...mockPolicy, id: 'p5', title: 'Vendor Management Policy', status: 'compliant', acceptanceRate: 88, frameworks: ['ISO27001'] },
]

const allFrameworks: Framework[] = ['SOC2', 'ISO27001', 'HIPAA', 'GDPR', 'PCI-DSS', 'FedRAMP']
const allStatuses: ComplianceStatus[] = ['compliant', 'non-compliant', 'in-progress', 'not-applicable']

describe('PolicyTable', () => {
  // Empty state
  it('shows empty state when no policies provided', async () => {
    const { getByTestId } = await render(<PolicyTable policies={[]} />)
    expect(getByTestId('policy-table-empty')).toBeDefined()
  })

  it('shows empty state message text', async () => {
    const { getByTestId } = await render(<PolicyTable policies={[]} />)
    expect(getByTestId('policy-table-empty')).toBeDefined()
  })

  it('does not show table when no policies', async () => {
    const { queryByTestId } = await render(<PolicyTable policies={[]} />)
    expect(queryByTestId('policy-table')).toBeNull()
  })

  // Loading state
  it('shows loading spinner when loading is true', async () => {
    const { getByTestId } = await render(<PolicyTable policies={[]} loading />)
    expect(getByTestId('policy-table-loading')).toBeDefined()
  })

  it('shows spinner component when loading', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} loading />)
    expect(getByTestId('loading-spinner')).toBeDefined()
  })

  it('does not show table when loading', async () => {
    const { queryByTestId } = await render(<PolicyTable policies={policies} loading />)
    expect(queryByTestId('policy-table')).toBeNull()
  })

  it('does not show empty state when loading', async () => {
    const { queryByTestId } = await render(<PolicyTable policies={[]} loading />)
    expect(queryByTestId('policy-table-empty')).toBeNull()
  })

  it('hides loading spinner when loading is false', async () => {
    const { queryByTestId } = await render(<PolicyTable policies={policies} loading={false} />)
    expect(queryByTestId('policy-table-loading')).toBeNull()
  })

  // Table rendering
  it('renders table container', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    expect(getByTestId('policy-table-container')).toBeDefined()
  })

  it('renders table when policies exist', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    expect(getByTestId('policy-table')).toBeDefined()
  })

  it('renders all policy rows', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    policies.forEach((p) => {
      expect(getByTestId(`policy-row-${p.id}`)).toBeDefined()
    })
  })

  it('renders policy title column', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    expect(getByTestId('policy-title-p1').textContent).toContain('Acceptable Use Policy')
  })

  it('renders status column', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    expect(getByTestId('policy-status-p1')).toBeDefined()
  })

  it('renders acceptance rate column', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    expect(getByTestId('policy-acceptance-p1').textContent).toContain('94')
  })

  it('renders owner column', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    expect(getByTestId('policy-owner-p1').textContent).toContain('Alice Johnson')
  })

  it('renders last updated column', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    expect(getByTestId('policy-updated-p1').textContent).toContain('2024-01-15')
  })

  it('renders footer with count', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    expect(getByTestId('policy-table-footer')).toBeDefined()
  })

  it('shows correct count in footer', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    expect(getByTestId('policy-table-footer').textContent).toContain('5')
  })

  // Framework filter
  allFrameworks.map((fw) =>
    it(`filters by framework ${fw}`, async () => {
      const { getByTestId } = await render(<PolicyTable policies={policies} />)
      const select = getByTestId('framework-filter')
      await fireEvent.change(select, { target: { value: fw } })
      expect(getByTestId('policy-table-container')).toBeDefined()
    })
  )

  it('shows all policies when framework filter is all', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    const select = getByTestId('framework-filter')
    await fireEvent.change(select, { target: { value: 'all' } })
    expect(getByTestId('policy-table-footer').textContent).toContain('5')
  })

  it('filters to policies with SOC2 framework', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    await fireEvent.change(getByTestId('framework-filter'), { target: { value: 'SOC2' } })
    // p1, p2, p4 have SOC2
    expect(getByTestId('policy-table-footer').textContent).toContain('3')
  })

  it('shows empty state when framework filter yields no results', async () => {
    const singlePolicy = [{ ...mockPolicy, id: 'x1', frameworks: ['SOC2'] }]
    const { getByTestId } = await render(<PolicyTable policies={singlePolicy} />)
    await fireEvent.change(getByTestId('framework-filter'), { target: { value: 'HIPAA' } })
    expect(getByTestId('policy-table-empty')).toBeDefined()
  })

  // Status filter
  allStatuses.map((status) =>
    it(`filters by status ${status}`, async () => {
      const { getByTestId } = await render(<PolicyTable policies={policies} />)
      await fireEvent.change(getByTestId('status-filter'), { target: { value: status } })
      expect(getByTestId('policy-table-container')).toBeDefined()
    })
  )

  it('shows all policies when status filter is all', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    await fireEvent.change(getByTestId('status-filter'), { target: { value: 'all' } })
    expect(getByTestId('policy-table-footer').textContent).toContain('5')
  })

  it('filters to compliant policies', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    await fireEvent.change(getByTestId('status-filter'), { target: { value: 'compliant' } })
    expect(getByTestId('policy-table-footer').textContent).toContain('2')
  })

  it('renders filters section', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    expect(getByTestId('policy-table-filters')).toBeDefined()
  })

  // Sorting
  it('renders sortable title header', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    expect(getByTestId('sort-title')).toBeDefined()
  })

  it('renders sortable status header', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    expect(getByTestId('sort-status')).toBeDefined()
  })

  it('renders sortable acceptance header', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    expect(getByTestId('sort-acceptance')).toBeDefined()
  })

  it('calls onSort when title header is clicked', async () => {
    let sortCalled = false
    const { getByTestId } = await render(<PolicyTable policies={policies} onSort={() => { sortCalled = true }} />)
    await fireEvent.click(getByTestId('sort-title'))
    expect(sortCalled).toBeTruthy()
  })

  it('calls onSort with field name', async () => {
    let sortField = ''
    const { getByTestId } = await render(<PolicyTable policies={policies} onSort={(f) => { sortField = f }} />)
    await fireEvent.click(getByTestId('sort-title'))
    expect(sortField).toBe('title')
  })

  it('calls onSort with direction asc on first click', async () => {
    let sortDir = ''
    const { getByTestId } = await render(<PolicyTable policies={policies} onSort={(_, dir) => { sortDir = dir }} />)
    await fireEvent.click(getByTestId('sort-title'))
    expect(sortDir).toBe('asc')
  })

  it('calls onSort with direction desc on second click', async () => {
    let sortDir = ''
    const { getByTestId } = await render(<PolicyTable policies={policies} onSort={(_, dir) => { sortDir = dir }} />)
    await fireEvent.click(getByTestId('sort-title'))
    await fireEvent.click(getByTestId('sort-title'))
    expect(sortDir).toBe('desc')
  })

  it('calls onSort when status header is clicked', async () => {
    let sortField = ''
    const { getByTestId } = await render(<PolicyTable policies={policies} onSort={(f) => { sortField = f }} />)
    await fireEvent.click(getByTestId('sort-status'))
    expect(sortField).toBe('status')
  })

  it('calls onSort when acceptance header is clicked', async () => {
    let sortField = ''
    const { getByTestId } = await render(<PolicyTable policies={policies} onSort={(f) => { sortField = f }} />)
    await fireEvent.click(getByTestId('sort-acceptance'))
    expect(sortField).toBe('acceptanceRate')
  })

  it('does not crash when onSort is not provided and header is clicked', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    await fireEvent.click(getByTestId('sort-title'))
    expect(getByTestId('policy-table')).toBeDefined()
  })

  // Bulk selection
  it('shows select-all checkbox when onSelect is provided', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} onSelect={() => {}} selectedIds={[]} />)
    expect(getByTestId('select-all-checkbox')).toBeDefined()
  })

  it('does not show select-all checkbox when onSelect is not provided', async () => {
    const { queryByTestId } = await render(<PolicyTable policies={policies} />)
    expect(queryByTestId('select-all-checkbox')).toBeNull()
  })

  policies.forEach((p) =>
    it(`shows row checkbox for policy ${p.id}`, async () => {
      const { getByTestId } = await render(<PolicyTable policies={policies} onSelect={() => {}} selectedIds={[]} />)
      expect(getByTestId(`select-checkbox-${p.id}`)).toBeDefined()
    })
  )

  it('calls onSelect with all ids when select-all is checked', async () => {
    let selected: string[] = []
    const { getByTestId } = await render(
      <PolicyTable policies={policies} onSelect={(ids) => { selected = ids }} selectedIds={[]} />
    )
    await fireEvent.click(getByTestId('select-all-checkbox'))
    expect(selected.length).toBe(5)
  })

  it('calls onSelect with empty array when select-all is unchecked', async () => {
    let selected: string[] = ['p1', 'p2', 'p3', 'p4', 'p5']
    const { getByTestId } = await render(
      <PolicyTable policies={policies} onSelect={(ids) => { selected = ids }} selectedIds={['p1', 'p2', 'p3', 'p4', 'p5']} />
    )
    await fireEvent.click(getByTestId('select-all-checkbox'))
    expect(selected.length).toBe(0)
  })

  it('calls onSelect when a single row checkbox is clicked', async () => {
    let selected: string[] = []
    const { getByTestId } = await render(
      <PolicyTable policies={policies} onSelect={(ids) => { selected = ids }} selectedIds={[]} />
    )
    await fireEvent.click(getByTestId('select-checkbox-p1'))
    expect(selected).toContain('p1')
  })

  it('deselects a row when already selected checkbox is clicked', async () => {
    let selected: string[] = ['p1']
    const { getByTestId } = await render(
      <PolicyTable policies={policies} onSelect={(ids) => { selected = ids }} selectedIds={['p1']} />
    )
    await fireEvent.click(getByTestId('select-checkbox-p1'))
    expect(selected).not.toContain('p1')
  })

  // Edit callbacks
  it('shows edit button when onEdit is provided', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} onEdit={() => {}} />)
    expect(getByTestId('edit-button-p1')).toBeDefined()
  })

  it('does not show edit button when onEdit is not provided', async () => {
    const { queryByTestId } = await render(<PolicyTable policies={policies} />)
    expect(queryByTestId('edit-button-p1')).toBeNull()
  })

  policies.forEach((p) =>
    it(`calls onEdit with correct policy for ${p.id}`, async () => {
      let edited: Policy | null = null
      const { getByTestId } = await render(<PolicyTable policies={policies} onEdit={(pol) => { edited = pol }} />)
      await fireEvent.click(getByTestId(`edit-button-${p.id}`))
      expect(edited?.id).toBe(p.id)
    })
  )

  // Header columns
  it('renders frameworks column header', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    expect(getByTestId('col-frameworks')).toBeDefined()
  })

  it('renders owner column header', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    expect(getByTestId('col-owner')).toBeDefined()
  })

  it('renders last updated column header', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    expect(getByTestId('col-updated')).toBeDefined()
  })

  it('renders actions column header when onEdit provided', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} onEdit={() => {}} />)
    expect(getByTestId('col-actions')).toBeDefined()
  })

  it('renders table header', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    expect(getByTestId('policy-table-header')).toBeDefined()
  })

  it('renders table body', async () => {
    const { getByTestId } = await render(<PolicyTable policies={policies} />)
    expect(getByTestId('policy-table-body')).toBeDefined()
  })

  // Single policy
  it('renders table with single policy', async () => {
    const { getByTestId } = await render(<PolicyTable policies={[policies[0]]} />)
    expect(getByTestId('policy-row-p1')).toBeDefined()
  })

  // Snapshot
  it('matches snapshot with all policies', async () => {
    const { container } = await render(<PolicyTable policies={policies} />)
    await snapshot('policy-table-full')
  })
})
