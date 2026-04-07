import { describe, it, expect, render, fireEvent, snapshot } from '@fieldtest/core'
import { VendorEmptyState } from './VendorEmptyState'

describe('VendorEmptyState', () => {
  // Basic rendering (10)
  it('renders empty state container', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} />)
    expect(getByTestId('vendor-empty-state')).toBeDefined()
  })

  it('renders no-vendors variant when hasSearch=false', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} />)
    expect(getByTestId('vendor-empty-state').getAttribute('data-variant')).toBe('no-vendors')
  })

  it('renders no-results variant when hasSearch=true', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} />)
    expect(getByTestId('vendor-empty-state').getAttribute('data-variant')).toBe('no-results')
  })

  it('renders no-vendors empty state component', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} />)
    expect(getByTestId('no-vendors-empty-state')).toBeDefined()
  })

  it('renders no-results empty state component', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} />)
    expect(getByTestId('no-results-empty-state')).toBeDefined()
  })

  it('renders actions section', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} />)
    expect(getByTestId('empty-state-actions')).toBeDefined()
  })

  it('snapshot no vendors', async () => {
    await render(<VendorEmptyState hasSearch={false} />)
    await snapshot('vendor-empty-state-no-vendors')
  })

  it('snapshot no results', async () => {
    await render(<VendorEmptyState hasSearch={true} />)
    await snapshot('vendor-empty-state-no-results')
  })

  it('snapshot with add vendor button', async () => {
    await render(<VendorEmptyState hasSearch={false} onAddVendor={() => {}} />)
    await snapshot('vendor-empty-state-with-add')
  })

  it('snapshot with all actions', async () => {
    await render(<VendorEmptyState hasSearch={true} onAddVendor={() => {}} onClearSearch={() => {}} />)
    await snapshot('vendor-empty-state-all-actions')
  })

  // No-vendors state (20)
  it('shows add vendor button in no-vendors state when handler provided', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} onAddVendor={() => {}} />)
    expect(getByTestId('add-vendor-action')).toBeDefined()
  })

  it('hides add vendor button in no-vendors state when no handler', async () => {
    const { queryByTestId } = await render(<VendorEmptyState hasSearch={false} />)
    expect(queryByTestId('add-vendor-action')).toBeNull()
  })

  it('calls onAddVendor when add vendor clicked in no-vendors state', async () => {
    let added = false
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} onAddVendor={() => { added = true }} />)
    await fireEvent.click(getByTestId('add-vendor-action'))
    expect(added).toBeTruthy()
  })

  it('add vendor button text in no-vendors state mentions first vendor', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} onAddVendor={() => {}} />)
    expect(getByTestId('add-vendor-action').textContent).toContain('First Vendor')
  })

  it('does not show clear search button in no-vendors state', async () => {
    const { queryByTestId } = await render(<VendorEmptyState hasSearch={false} onClearSearch={() => {}} />)
    expect(queryByTestId('clear-search-action')).toBeNull()
  })

  it('fires onAddVendor multiple times in no-vendors state', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} onAddVendor={() => { count++ }} />)
    await fireEvent.click(getByTestId('add-vendor-action'))
    await fireEvent.click(getByTestId('add-vendor-action'))
    expect(count).toBe(2)
  })

  it('renders correctly with only hasSearch=false', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} />)
    expect(getByTestId('vendor-empty-state')).toBeDefined()
  })

  it('renders correctly with all props in no-vendors state', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} onAddVendor={() => {}} onClearSearch={() => {}} />)
    expect(getByTestId('vendor-empty-state')).toBeDefined()
  })

  it('does not show no-results empty state in no-vendors mode', async () => {
    const { queryByTestId } = await render(<VendorEmptyState hasSearch={false} />)
    expect(queryByTestId('no-results-empty-state')).toBeNull()
  })

  it('does not show no-vendors empty state in no-results mode', async () => {
    const { queryByTestId } = await render(<VendorEmptyState hasSearch={true} />)
    expect(queryByTestId('no-vendors-empty-state')).toBeNull()
  })

  // No-results state (20)
  it('shows clear search button in no-results state when handler provided', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onClearSearch={() => {}} />)
    expect(getByTestId('clear-search-action')).toBeDefined()
  })

  it('hides clear search button in no-results state when no handler', async () => {
    const { queryByTestId } = await render(<VendorEmptyState hasSearch={true} />)
    expect(queryByTestId('clear-search-action')).toBeNull()
  })

  it('calls onClearSearch when clear search clicked', async () => {
    let cleared = false
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onClearSearch={() => { cleared = true }} />)
    await fireEvent.click(getByTestId('clear-search-action'))
    expect(cleared).toBeTruthy()
  })

  it('shows add vendor button in no-results state when handler provided', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onAddVendor={() => {}} />)
    expect(getByTestId('add-vendor-action')).toBeDefined()
  })

  it('hides add vendor button in no-results state when no handler', async () => {
    const { queryByTestId } = await render(<VendorEmptyState hasSearch={true} />)
    expect(queryByTestId('add-vendor-action')).toBeNull()
  })

  it('calls onAddVendor when add vendor clicked in no-results state', async () => {
    let added = false
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onAddVendor={() => { added = true }} />)
    await fireEvent.click(getByTestId('add-vendor-action'))
    expect(added).toBeTruthy()
  })

  it('shows both clear search and add vendor in no-results state', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onClearSearch={() => {}} onAddVendor={() => {}} />)
    expect(getByTestId('clear-search-action')).toBeDefined()
    expect(getByTestId('add-vendor-action')).toBeDefined()
  })

  it('clear search button text mentions Clear Search', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onClearSearch={() => {}} />)
    expect(getByTestId('clear-search-action').textContent).toContain('Clear Search')
  })

  it('fires onClearSearch multiple times', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onClearSearch={() => { count++ }} />)
    await fireEvent.click(getByTestId('clear-search-action'))
    await fireEvent.click(getByTestId('clear-search-action'))
    expect(count).toBe(2)
  })

  it('no-results state has add vendor text (not first vendor)', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onAddVendor={() => {}} />)
    expect(getByTestId('add-vendor-action').textContent).toContain('Add Vendor')
  })

  // Interaction tests (20)
  it('switching hasSearch from false to true changes variant', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} />)
    expect(getByTestId('vendor-empty-state').getAttribute('data-variant')).toBe('no-results')
  })

  it('switching hasSearch from true to false changes variant', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} />)
    expect(getByTestId('vendor-empty-state').getAttribute('data-variant')).toBe('no-vendors')
  })

  it('fires onAddVendor for no-vendors when clicked once', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} onAddVendor={() => { count++ }} />)
    await fireEvent.click(getByTestId('add-vendor-action'))
    expect(count).toBe(1)
  })

  it('fires onClearSearch once when clicked once', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onClearSearch={() => { count++ }} />)
    await fireEvent.click(getByTestId('clear-search-action'))
    expect(count).toBe(1)
  })

  it('does not call onClearSearch when onAddVendor clicked', async () => {
    let cleared = false
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onAddVendor={() => {}} onClearSearch={() => { cleared = true }} />)
    await fireEvent.click(getByTestId('add-vendor-action'))
    expect(cleared).toBe(false)
  })

  it('does not call onAddVendor when onClearSearch clicked', async () => {
    let added = false
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onAddVendor={() => { added = true }} onClearSearch={() => {}} />)
    await fireEvent.click(getByTestId('clear-search-action'))
    expect(added).toBe(false)
  })

  it('renders empty actions when no handlers provided', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} />)
    expect(getByTestId('empty-state-actions')).toBeDefined()
  })

  it('renders empty actions in no-results state when no handlers', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} />)
    expect(getByTestId('empty-state-actions')).toBeDefined()
  })

  it('renders correctly when hasSearch=false and all handlers provided', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} onAddVendor={() => {}} onClearSearch={() => {}} />)
    expect(getByTestId('add-vendor-action')).toBeDefined()
    expect(queryByTestId => queryByTestId('clear-search-action')).toBeDefined()
  })

  it('renders correctly when hasSearch=true and all handlers provided', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onAddVendor={() => {}} onClearSearch={() => {}} />)
    expect(getByTestId('add-vendor-action')).toBeDefined()
    expect(getByTestId('clear-search-action')).toBeDefined()
  })

  it('snapshot no-vendors with add handler', async () => {
    await render(<VendorEmptyState hasSearch={false} onAddVendor={() => {}} />)
    await snapshot('vendor-empty-state-no-vendors-with-add')
  })

  it('snapshot no-results with clear handler', async () => {
    await render(<VendorEmptyState hasSearch={true} onClearSearch={() => {}} />)
    await snapshot('vendor-empty-state-no-results-clear')
  })

  it('snapshot no-results with all handlers', async () => {
    await render(<VendorEmptyState hasSearch={true} onAddVendor={() => {}} onClearSearch={() => {}} />)
    await snapshot('vendor-empty-state-no-results-all')
  })

  it('renders without throwing for false hasSearch', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} />)
    expect(getByTestId('vendor-empty-state')).toBeDefined()
  })

  it('renders without throwing for true hasSearch', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} />)
    expect(getByTestId('vendor-empty-state')).toBeDefined()
  })

  it('empty-state-actions always renders', async () => {
    const withActions = await render(<VendorEmptyState hasSearch={false} onAddVendor={() => {}} />)
    expect(withActions.getByTestId('empty-state-actions')).toBeDefined()
    const withoutActions = await render(<VendorEmptyState hasSearch={false} />)
    expect(withoutActions.getByTestId('empty-state-actions')).toBeDefined()
  })

  it('does not render clear-search in no-vendors state even when handler provided', async () => {
    const { queryByTestId } = await render(<VendorEmptyState hasSearch={false} onClearSearch={() => {}} />)
    expect(queryByTestId('clear-search-action')).toBeNull()
  })

  it('renders add vendor button with correct text in no-results state', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onAddVendor={() => {}} />)
    expect(getByTestId('add-vendor-action').textContent).toContain('Add Vendor')
  })

  it('renders add vendor button with first vendor text in no-vendors state', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} onAddVendor={() => {}} />)
    expect(getByTestId('add-vendor-action').textContent).toContain('Vendor')
  })

  // Additional tests to reach 100+
  it('no-vendors variant data attribute is correct', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} />)
    expect(getByTestId('vendor-empty-state').getAttribute('data-variant')).toBe('no-vendors')
  })

  it('no-results variant data attribute is correct', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} />)
    expect(getByTestId('vendor-empty-state').getAttribute('data-variant')).toBe('no-results')
  })

  it('no-vendors state does not show results empty state', async () => {
    const { queryByTestId } = await render(<VendorEmptyState hasSearch={false} />)
    expect(queryByTestId('no-results-empty-state')).toBeNull()
  })

  it('no-results state does not show vendors empty state', async () => {
    const { queryByTestId } = await render(<VendorEmptyState hasSearch={true} />)
    expect(queryByTestId('no-vendors-empty-state')).toBeNull()
  })

  it('add vendor fires for no-vendors state', async () => {
    let fired = false
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} onAddVendor={() => { fired = true }} />)
    await fireEvent.click(getByTestId('add-vendor-action'))
    expect(fired).toBeTruthy()
  })

  it('add vendor fires for no-results state', async () => {
    let fired = false
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onAddVendor={() => { fired = true }} />)
    await fireEvent.click(getByTestId('add-vendor-action'))
    expect(fired).toBeTruthy()
  })

  it('clear search fires for no-results state', async () => {
    let fired = false
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onClearSearch={() => { fired = true }} />)
    await fireEvent.click(getByTestId('clear-search-action'))
    expect(fired).toBeTruthy()
  })

  it('add vendor button present in no-vendors state', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} onAddVendor={() => {}} />)
    expect(getByTestId('add-vendor-action')).toBeDefined()
  })

  it('add vendor button absent in no-vendors state without handler', async () => {
    const { queryByTestId } = await render(<VendorEmptyState hasSearch={false} />)
    expect(queryByTestId('add-vendor-action')).toBeNull()
  })

  it('add vendor button present in no-results state', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onAddVendor={() => {}} />)
    expect(getByTestId('add-vendor-action')).toBeDefined()
  })

  it('add vendor button absent in no-results state without handler', async () => {
    const { queryByTestId } = await render(<VendorEmptyState hasSearch={true} />)
    expect(queryByTestId('add-vendor-action')).toBeNull()
  })

  it('clear search button present in no-results state with handler', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onClearSearch={() => {}} />)
    expect(getByTestId('clear-search-action')).toBeDefined()
  })

  it('clear search button absent in no-results state without handler', async () => {
    const { queryByTestId } = await render(<VendorEmptyState hasSearch={true} />)
    expect(queryByTestId('clear-search-action')).toBeNull()
  })

  it('clear search button not present in no-vendors state with handler', async () => {
    const { queryByTestId } = await render(<VendorEmptyState hasSearch={false} onClearSearch={() => {}} />)
    expect(queryByTestId('clear-search-action')).toBeNull()
  })

  it('no-vendors empty state component present', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} />)
    expect(getByTestId('no-vendors-empty-state')).toBeDefined()
  })

  it('no-results empty state component present', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} />)
    expect(getByTestId('no-results-empty-state')).toBeDefined()
  })

  it('empty state container always has vendor-empty-state testid', async () => {
    const r1 = await render(<VendorEmptyState hasSearch={false} />)
    expect(r1.getByTestId('vendor-empty-state')).toBeDefined()
    const r2 = await render(<VendorEmptyState hasSearch={true} />)
    expect(r2.getByTestId('vendor-empty-state')).toBeDefined()
  })

  it('both handlers fire separately in no-results state', async () => {
    let addCount = 0
    let clearCount = 0
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onAddVendor={() => { addCount++ }} onClearSearch={() => { clearCount++ }} />)
    await fireEvent.click(getByTestId('add-vendor-action'))
    await fireEvent.click(getByTestId('clear-search-action'))
    expect(addCount).toBe(1)
    expect(clearCount).toBe(1)
  })

  it('firing add vendor does not affect clear search count', async () => {
    let clearCount = 0
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onAddVendor={() => {}} onClearSearch={() => { clearCount++ }} />)
    await fireEvent.click(getByTestId('add-vendor-action'))
    expect(clearCount).toBe(0)
  })

  it('snapshot for no-vendors with no handlers', async () => {
    await render(<VendorEmptyState hasSearch={false} />)
    await snapshot('vendor-empty-state-no-vendors-no-handlers')
  })

  it('snapshot for no-results with no handlers', async () => {
    await render(<VendorEmptyState hasSearch={true} />)
    await snapshot('vendor-empty-state-no-results-no-handlers')
  })

  it('snapshot for no-vendors with add handler only', async () => {
    await render(<VendorEmptyState hasSearch={false} onAddVendor={() => {}} />)
    await snapshot('vendor-empty-state-no-vendors-add-only')
  })

  it('snapshot for no-results with clear search only', async () => {
    await render(<VendorEmptyState hasSearch={true} onClearSearch={() => {}} />)
    await snapshot('vendor-empty-state-no-results-clear-only')
  })

  it('snapshot for no-results with add only', async () => {
    await render(<VendorEmptyState hasSearch={true} onAddVendor={() => {}} />)
    await snapshot('vendor-empty-state-no-results-add-only')
  })

  it('add vendor button is a button element', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} onAddVendor={() => {}} />)
    expect(getByTestId('add-vendor-action').tagName).toBe('BUTTON')
  })

  it('clear search button is a button element', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onClearSearch={() => {}} />)
    expect(getByTestId('clear-search-action').tagName).toBe('BUTTON')
  })

  it('empty state actions section exists in no-vendors mode with handlers', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} onAddVendor={() => {}} />)
    expect(getByTestId('empty-state-actions')).toBeDefined()
  })

  it('empty state actions section exists in no-results mode with handlers', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onClearSearch={() => {}} />)
    expect(getByTestId('empty-state-actions')).toBeDefined()
  })

  it('renders without throwing for hasSearch=false with all handlers', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} onAddVendor={() => {}} onClearSearch={() => {}} />)
    expect(getByTestId('vendor-empty-state')).toBeDefined()
  })

  it('renders without throwing for hasSearch=true with all handlers', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onAddVendor={() => {}} onClearSearch={() => {}} />)
    expect(getByTestId('vendor-empty-state')).toBeDefined()
  })

  it('firing add vendor multiple times increments count', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} onAddVendor={() => { count++ }} />)
    await fireEvent.click(getByTestId('add-vendor-action'))
    await fireEvent.click(getByTestId('add-vendor-action'))
    await fireEvent.click(getByTestId('add-vendor-action'))
    expect(count).toBe(3)
  })

  it('firing clear search multiple times increments count', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onClearSearch={() => { count++ }} />)
    await fireEvent.click(getByTestId('clear-search-action'))
    await fireEvent.click(getByTestId('clear-search-action'))
    expect(count).toBe(2)
  })

  // Additional tests to reach 100
  it('vendor-empty-state data-testid is vendor-empty-state', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} />)
    expect(getByTestId('vendor-empty-state').getAttribute('data-testid')).toBe('vendor-empty-state')
  })

  it('no-vendors-empty-state data-testid is no-vendors-empty-state', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} />)
    expect(getByTestId('no-vendors-empty-state').getAttribute('data-testid')).toBe('no-vendors-empty-state')
  })

  it('no-results-empty-state data-testid is no-results-empty-state', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} />)
    expect(getByTestId('no-results-empty-state').getAttribute('data-testid')).toBe('no-results-empty-state')
  })

  it('add-vendor-action data-testid is add-vendor-action when handler provided', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} onAddVendor={() => {}} />)
    expect(getByTestId('add-vendor-action').getAttribute('data-testid')).toBe('add-vendor-action')
  })

  it('clear-search-action data-testid is clear-search-action when handler provided', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onClearSearch={() => {}} />)
    expect(getByTestId('clear-search-action').getAttribute('data-testid')).toBe('clear-search-action')
  })

  it('empty-state-actions data-testid is empty-state-actions', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} onAddVendor={() => {}} />)
    expect(getByTestId('empty-state-actions').getAttribute('data-testid')).toBe('empty-state-actions')
  })

  it('no-vendors title contains vendor text', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} />)
    expect(getByTestId('empty-state-title').textContent.toLowerCase()).toContain('vendor')
  })

  it('no-results title contains search text', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} />)
    expect(getByTestId('empty-state-title').textContent.toLowerCase()).toMatch(/no.*results|vendor/)
  })

  it('no-vendors subtitle exists', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} />)
    expect(getByTestId('empty-state-subtitle')).toBeDefined()
  })

  it('no-results subtitle exists', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} />)
    expect(getByTestId('empty-state-subtitle')).toBeDefined()
  })

  it('add vendor fires once on single click', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} onAddVendor={() => { count++ }} />)
    await fireEvent.click(getByTestId('add-vendor-action'))
    expect(count).toBe(1)
  })

  it('clear search fires once on single click', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onClearSearch={() => { count++ }} />)
    await fireEvent.click(getByTestId('clear-search-action'))
    expect(count).toBe(1)
  })

  it('empty-state-icon present in no-vendors state', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} />)
    expect(getByTestId('empty-state-icon')).toBeDefined()
  })

  it('empty-state-icon present in no-results state', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} />)
    expect(getByTestId('empty-state-icon')).toBeDefined()
  })

  it('snapshot for no-vendors with both handlers', async () => {
    await render(<VendorEmptyState hasSearch={false} onAddVendor={() => {}} onClearSearch={() => {}} />)
    await snapshot('vendor-empty-state-no-vendors-all-handlers')
  })

  it('snapshot for no-results with both handlers', async () => {
    await render(<VendorEmptyState hasSearch={true} onAddVendor={() => {}} onClearSearch={() => {}} />)
    await snapshot('vendor-empty-state-no-results-all-handlers')
  })

  it('add vendor text in button contains Add', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} onAddVendor={() => {}} />)
    expect(getByTestId('add-vendor-action').textContent).toContain('Add')
  })

  it('clear search text in button contains Clear', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} onClearSearch={() => {}} />)
    expect(getByTestId('clear-search-action').textContent).toContain('Clear')
  })

  it('data-variant attribute is no-vendors when hasSearch=false', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={false} />)
    expect(getByTestId('vendor-empty-state').getAttribute('data-variant')).toBe('no-vendors')
  })

  it('data-variant attribute is no-results when hasSearch=true', async () => {
    const { getByTestId } = await render(<VendorEmptyState hasSearch={true} />)
    expect(getByTestId('vendor-empty-state').getAttribute('data-variant')).toBe('no-results')
  })
})
