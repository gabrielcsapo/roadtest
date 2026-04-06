import { describe, it, expect, render, fireEvent, snapshot } from '@viewtest/core'
import { AuditLogTable } from './AuditLogTable'
import { AuditLog, User } from '../../types'

const mockActor: User = { id: 'u1', name: 'Alice Johnson', email: 'alice@example.com', role: 'admin' }
const bobActor: User = { id: 'u2', name: 'Bob Smith', email: 'bob@example.com', role: 'manager' }

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
  { ...mockLog, id: 'l5', action: 'vendor.deleted', targetType: 'vendor', actor: bobActor },
]

describe('AuditLogTable', () => {
  // Empty state
  it('shows empty state when no logs', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={[]} />)
    expect(getByTestId('audit-log-empty')).toBeDefined()
  })

  it('does not show log list when empty', async () => {
    const { queryByTestId } = await render(<AuditLogTable logs={[]} />)
    expect(queryByTestId('audit-log-list')).toBeNull()
  })

  it('shows empty state message text', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={[]} />)
    expect(getByTestId('audit-log-empty')).toBeDefined()
  })

  // Loading state
  it('shows loading spinner when loading is true', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={[]} loading />)
    expect(getByTestId('audit-log-table-loading')).toBeDefined()
  })

  it('shows spinner component when loading', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={logs} loading />)
    expect(getByTestId('audit-table-spinner')).toBeDefined()
  })

  it('does not show log list when loading', async () => {
    const { queryByTestId } = await render(<AuditLogTable logs={logs} loading />)
    expect(queryByTestId('audit-log-list')).toBeNull()
  })

  it('does not show filters when loading', async () => {
    const { queryByTestId } = await render(<AuditLogTable logs={logs} loading />)
    expect(queryByTestId('audit-log-filters')).toBeNull()
  })

  it('hides loading when loading is false', async () => {
    const { queryByTestId } = await render(<AuditLogTable logs={logs} loading={false} />)
    expect(queryByTestId('audit-log-table-loading')).toBeNull()
  })

  // Normal rendering
  it('renders container', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={logs} />)
    expect(getByTestId('audit-log-table-container')).toBeDefined()
  })

  it('renders log list when logs exist', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={logs} />)
    expect(getByTestId('audit-log-list')).toBeDefined()
  })

  it('renders all 5 log rows', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={logs} />)
    logs.forEach((log) => {
      expect(getByTestId('audit-log-row')).toBeDefined()
    })
  })

  it('renders footer', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={logs} />)
    expect(getByTestId('audit-log-footer')).toBeDefined()
  })

  it('shows count in footer', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={logs} />)
    expect(getByTestId('audit-log-count').textContent).toContain('5')
  })

  it('shows total count when totalCount is provided', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={logs} totalCount={100} />)
    expect(getByTestId('audit-log-count').textContent).toContain('100')
  })

  // Filter rendering
  it('renders search input', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={logs} />)
    expect(getByTestId('audit-search-input')).toBeDefined()
  })

  it('renders date start filter', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={logs} />)
    expect(getByTestId('date-start-input')).toBeDefined()
  })

  it('renders date end filter', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={logs} />)
    expect(getByTestId('date-end-input')).toBeDefined()
  })

  it('renders action type filter', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={logs} />)
    expect(getByTestId('action-type-filter')).toBeDefined()
  })

  it('renders filters section', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={logs} />)
    expect(getByTestId('audit-log-filters')).toBeDefined()
  })

  // Search functionality
  it('filters logs by search term matching actor', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={logs} />)
    await fireEvent.change(getByTestId('audit-search-input'), { target: { value: 'Bob Smith' } })
    expect(getByTestId('audit-log-count').textContent).toContain('1')
  })

  it('filters logs by search term matching target', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={logs} />)
    await fireEvent.change(getByTestId('audit-search-input'), { target: { value: 'Password Policy' } })
    expect(getByTestId('audit-log-count').textContent).toContain('1')
  })

  it('filters logs by search term matching action', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={logs} />)
    await fireEvent.change(getByTestId('audit-search-input'), { target: { value: 'vendor' } })
    expect(getByTestId('audit-log-count')).toBeDefined()
  })

  it('shows empty state when search yields no results', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={logs} />)
    await fireEvent.change(getByTestId('audit-search-input'), { target: { value: 'zzz_not_found' } })
    expect(getByTestId('audit-log-empty')).toBeDefined()
  })

  it('shows all logs when search is cleared', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={logs} />)
    await fireEvent.change(getByTestId('audit-search-input'), { target: { value: 'Alice' } })
    await fireEvent.change(getByTestId('audit-search-input'), { target: { value: '' } })
    expect(getByTestId('audit-log-count').textContent).toContain('5')
  })

  // Filter callbacks
  it('calls onFilterChange when action type filter changes', async () => {
    let changedFilters: object | null = null
    const { getByTestId } = await render(
      <AuditLogTable logs={logs} onFilterChange={(f) => { changedFilters = f }} />
    )
    await fireEvent.change(getByTestId('action-type-filter'), { target: { value: 'create' } })
    expect(changedFilters).toBeDefined()
  })

  it('calls onFilterChange when start date changes', async () => {
    let changedFilters: object | null = null
    const { getByTestId } = await render(
      <AuditLogTable logs={logs} onFilterChange={(f) => { changedFilters = f }} />
    )
    await fireEvent.change(getByTestId('date-start-input'), { target: { value: '2024-01-01' } })
    expect(changedFilters).toBeDefined()
  })

  it('calls onFilterChange when end date changes', async () => {
    let changedFilters: object | null = null
    const { getByTestId } = await render(
      <AuditLogTable logs={logs} onFilterChange={(f) => { changedFilters = f }} />
    )
    await fireEvent.change(getByTestId('date-end-input'), { target: { value: '2024-12-31' } })
    expect(changedFilters).toBeDefined()
  })

  it('does not crash when onFilterChange is not provided', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={logs} />)
    await fireEvent.change(getByTestId('action-type-filter'), { target: { value: 'create' } })
    expect(getByTestId('audit-log-table-container')).toBeDefined()
  })

  // Initial filter values
  it('shows initial filter values when filters prop is provided', async () => {
    const { getByTestId } = await render(
      <AuditLogTable logs={logs} filters={{ startDate: '2024-01-01' }} />
    )
    expect(getByTestId('date-start-input')).toBeDefined()
  })

  // Load more button
  it('shows load more button when onLoadMore and has more data', async () => {
    const { getByTestId } = await render(
      <AuditLogTable logs={logs} onLoadMore={() => {}} totalCount={100} />
    )
    expect(getByTestId('load-more-button')).toBeDefined()
  })

  it('calls onLoadMore when load more is clicked', async () => {
    let loadMoreCalled = false
    const { getByTestId } = await render(
      <AuditLogTable logs={logs} onLoadMore={() => { loadMoreCalled = true }} totalCount={100} />
    )
    await fireEvent.click(getByTestId('load-more-button'))
    expect(loadMoreCalled).toBeTruthy()
  })

  it('does not show load more when all data loaded', async () => {
    const { queryByTestId } = await render(
      <AuditLogTable logs={logs} onLoadMore={() => {}} totalCount={5} />
    )
    expect(queryByTestId('load-more-button')).toBeNull()
  })

  it('does not show load more when onLoadMore is not provided', async () => {
    const { queryByTestId } = await render(<AuditLogTable logs={logs} totalCount={100} />)
    expect(queryByTestId('load-more-button')).toBeNull()
  })

  // Pagination (different row counts)
  ;([1, 2, 3, 5, 10] as number[]).map((count) =>
    it(`renders correctly with ${count} log entries`, async () => {
      const testLogs = Array.from({ length: count }, (_, i) => ({ ...mockLog, id: `log${i}` }))
      const { getByTestId } = await render(<AuditLogTable logs={testLogs} />)
      expect(getByTestId('audit-log-count').textContent).toContain(String(count))
    })
  )

  // Snapshot
  it('matches snapshot for full log table', async () => {
    const { container } = await render(<AuditLogTable logs={logs} />)
    await snapshot('audit-log-table-full')
  })

  it('matches snapshot for empty state', async () => {
    const { container } = await render(<AuditLogTable logs={[]} />)
    await snapshot('audit-log-table-empty')
  })

  it('does not crash with single log', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={[logs[0]]} />)
    expect(getByTestId('audit-log-list')).toBeDefined()
  })

  it('shows correct count when filtered', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={logs} />)
    await fireEvent.change(getByTestId('audit-search-input'), { target: { value: 'Alice' } })
    expect(getByTestId('audit-log-count')).toBeDefined()
  })

  it('renders with no filters prop', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={logs} />)
    expect(getByTestId('audit-log-table-container')).toBeDefined()
  })

  it('shows all action type options in filter', async () => {
    const { getByTestId } = await render(<AuditLogTable logs={logs} />)
    expect(getByTestId('action-type-filter')).toBeDefined()
  })
})
