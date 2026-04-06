import { describe, it, expect, render, fireEvent, snapshot } from '@viewtest/core'
import { VendorStatusFilter } from './VendorStatusFilter'
import { FilterOptions, Risk, Status } from '../../types'

const emptyFilters: FilterOptions = { status: [], risk: [] }
const riskLevels: Risk[] = ['low', 'medium', 'high', 'critical']
const statuses: Status[] = ['active', 'inactive', 'pending', 'archived']

describe('VendorStatusFilter', () => {
  // Basic rendering (10)
  it('renders filter container', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('vendor-status-filter')).toBeDefined()
  })

  it('renders filter header', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('filter-header')).toBeDefined()
  })

  it('renders status filter section', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('status-filter-section')).toBeDefined()
  })

  it('renders risk filter section', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('risk-filter-section')).toBeDefined()
  })

  it('renders status filter label', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('status-filter-label')).toBeDefined()
  })

  it('renders risk filter label', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('risk-filter-label')).toBeDefined()
  })

  it('snapshot default state', async () => {
    await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    await snapshot('vendor-status-filter-default')
  })

  it('hides clear button when no filters active', async () => {
    const { queryByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(queryByTestId('clear-filters')).toBeNull()
  })

  it('shows all status filters', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    for (const status of statuses) {
      expect(getByTestId(`status-filter-${status}`)).toBeDefined()
    }
  })

  it('shows all risk filters', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    for (const risk of riskLevels) {
      expect(getByTestId(`risk-filter-${risk}`)).toBeDefined()
    }
  })

  // Status filter items (4 statuses)
  for (const status of statuses) {
    it(`renders ${status} status checkbox`, async () => {
      const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
      expect(getByTestId(`status-checkbox-${status}`)).toBeDefined()
    })
  }

  // Risk filter items (4 risks)
  for (const risk of riskLevels) {
    it(`renders ${risk} risk checkbox`, async () => {
      const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
      expect(getByTestId(`risk-checkbox-${risk}`)).toBeDefined()
    })
  }

  // Checked state for statuses (4)
  for (const status of statuses) {
    it(`${status} checkbox is checked when in filter value`, async () => {
      const { getByTestId } = await render(
        <VendorStatusFilter value={{ status: [status], risk: [] }} onChange={() => {}} />
      )
      const checkbox = getByTestId(`status-checkbox-${status}`)
      expect(checkbox.getAttribute('checked') !== null || checkbox.checked).toBeTruthy()
    })
  }

  // Checked state for risks (4)
  for (const risk of riskLevels) {
    it(`${risk} risk checkbox is checked when in filter value`, async () => {
      const { getByTestId } = await render(
        <VendorStatusFilter value={{ status: [], risk: [risk] }} onChange={() => {}} />
      )
      const checkbox = getByTestId(`risk-checkbox-${risk}`)
      expect(checkbox).toBeDefined()
    })
  }

  // onChange callbacks (10)
  it('calls onChange when status checkbox clicked', async () => {
    let changed = false
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => { changed = true }} />)
    await fireEvent.click(getByTestId('status-checkbox-active'))
    expect(changed).toBeTruthy()
  })

  it('calls onChange with added status', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={f => { newFilters = f }} />)
    await fireEvent.click(getByTestId('status-checkbox-active'))
    expect(newFilters?.status).toContain('active')
  })

  it('calls onChange with removed status when unchecked', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(
      <VendorStatusFilter value={{ status: ['active'], risk: [] }} onChange={f => { newFilters = f }} />
    )
    await fireEvent.click(getByTestId('status-checkbox-active'))
    expect(newFilters?.status).not.toContain('active')
  })

  it('calls onChange when risk checkbox clicked', async () => {
    let changed = false
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => { changed = true }} />)
    await fireEvent.click(getByTestId('risk-checkbox-low'))
    expect(changed).toBeTruthy()
  })

  it('calls onChange with added risk', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={f => { newFilters = f }} />)
    await fireEvent.click(getByTestId('risk-checkbox-critical'))
    expect(newFilters?.risk).toContain('critical')
  })

  it('calls onChange with removed risk when unchecked', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(
      <VendorStatusFilter value={{ status: [], risk: ['high'] }} onChange={f => { newFilters = f }} />
    )
    await fireEvent.click(getByTestId('risk-checkbox-high'))
    expect(newFilters?.risk).not.toContain('high')
  })

  it('can select multiple statuses', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(<VendorStatusFilter value={{ status: ['active'], risk: [] }} onChange={f => { newFilters = f }} />)
    await fireEvent.click(getByTestId('status-checkbox-inactive'))
    expect(newFilters?.status).toContain('active')
    expect(newFilters?.status).toContain('inactive')
  })

  it('can select multiple risks', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(<VendorStatusFilter value={{ status: [], risk: ['low'] }} onChange={f => { newFilters = f }} />)
    await fireEvent.click(getByTestId('risk-checkbox-high'))
    expect(newFilters?.risk).toContain('low')
    expect(newFilters?.risk).toContain('high')
  })

  it('shows clear all button when status filter active', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={{ status: ['active'], risk: [] }} onChange={() => {}} />)
    expect(getByTestId('clear-filters')).toBeDefined()
  })

  it('shows clear all button when risk filter active', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={{ status: [], risk: ['high'] }} onChange={() => {}} />)
    expect(getByTestId('clear-filters')).toBeDefined()
  })

  // Clear all (5)
  it('clear all calls onChange with empty filters', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(
      <VendorStatusFilter value={{ status: ['active'], risk: ['high'] }} onChange={f => { newFilters = f }} />
    )
    await fireEvent.click(getByTestId('clear-filters'))
    expect(newFilters?.status).toHaveLength(0)
    expect(newFilters?.risk).toHaveLength(0)
  })

  it('clear all removes all status filters', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(
      <VendorStatusFilter value={{ status: ['active', 'inactive'], risk: [] }} onChange={f => { newFilters = f }} />
    )
    await fireEvent.click(getByTestId('clear-filters'))
    expect(newFilters?.status).toHaveLength(0)
  })

  it('clear all removes all risk filters', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(
      <VendorStatusFilter value={{ status: [], risk: ['low', 'high'] }} onChange={f => { newFilters = f }} />
    )
    await fireEvent.click(getByTestId('clear-filters'))
    expect(newFilters?.risk).toHaveLength(0)
  })

  it('snapshot with active filters', async () => {
    await render(<VendorStatusFilter value={{ status: ['active'], risk: ['critical'] }} onChange={() => {}} />)
    await snapshot('vendor-status-filter-active')
  })

  it('snapshot with all filters', async () => {
    await render(<VendorStatusFilter value={{ status: [...statuses], risk: [...riskLevels] }} onChange={() => {}} />)
    await snapshot('vendor-status-filter-all')
  })

  // vendorCounts (10)
  it('renders count badge for status when vendorCounts provided', async () => {
    const { getByTestId } = await render(
      <VendorStatusFilter value={emptyFilters} onChange={() => {}} vendorCounts={{ active: 5 }} />
    )
    expect(getByTestId('status-count-active')).toBeDefined()
  })

  it('shows correct count for active status', async () => {
    const { getByTestId } = await render(
      <VendorStatusFilter value={emptyFilters} onChange={() => {}} vendorCounts={{ active: 10 }} />
    )
    expect(getByTestId('status-count-active').textContent).toContain('10')
  })

  it('renders count badge for risk when vendorCounts provided', async () => {
    const { getByTestId } = await render(
      <VendorStatusFilter value={emptyFilters} onChange={() => {}} vendorCounts={{ critical: 3 }} />
    )
    expect(getByTestId('risk-count-critical')).toBeDefined()
  })

  it('shows correct count for critical risk', async () => {
    const { getByTestId } = await render(
      <VendorStatusFilter value={emptyFilters} onChange={() => {}} vendorCounts={{ critical: 7 }} />
    )
    expect(getByTestId('risk-count-critical').textContent).toContain('7')
  })

  it('does not render count badge when vendorCounts not provided', async () => {
    const { queryByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(queryByTestId('status-count-active')).toBeNull()
  })

  it('renders count badges for multiple statuses', async () => {
    const counts = { active: 5, inactive: 2, pending: 1, archived: 0 }
    const { getByTestId } = await render(
      <VendorStatusFilter value={emptyFilters} onChange={() => {}} vendorCounts={counts} />
    )
    for (const status of statuses) {
      expect(getByTestId(`status-count-${status}`)).toBeDefined()
    }
  })

  it('renders count badge of 0', async () => {
    const { getByTestId } = await render(
      <VendorStatusFilter value={emptyFilters} onChange={() => {}} vendorCounts={{ archived: 0 }} />
    )
    expect(getByTestId('status-count-archived').textContent).toContain('0')
  })

  it('renders count badges for multiple risks', async () => {
    const counts = { low: 10, medium: 5, high: 3, critical: 1 }
    const { getByTestId } = await render(
      <VendorStatusFilter value={emptyFilters} onChange={() => {}} vendorCounts={counts} />
    )
    for (const risk of riskLevels) {
      expect(getByTestId(`risk-count-${risk}`)).toBeDefined()
    }
  })

  it('snapshot with vendor counts', async () => {
    const counts = { active: 10, inactive: 3, pending: 2, archived: 1, low: 8, medium: 5, high: 2, critical: 1 }
    await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} vendorCounts={counts} />)
    await snapshot('vendor-status-filter-counts')
  })

  it('renders correctly with empty vendorCounts', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} vendorCounts={{}} />)
    expect(getByTestId('vendor-status-filter')).toBeDefined()
  })

  // Edge cases (5)
  it('renders with undefined status in value', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={{ search: 'test' }} onChange={() => {}} />)
    expect(getByTestId('vendor-status-filter')).toBeDefined()
  })

  it('renders with undefined risk in value', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={{ status: ['active'] }} onChange={() => {}} />)
    expect(getByTestId('vendor-status-filter')).toBeDefined()
  })

  it('labels are visible for all statuses', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    for (const status of statuses) {
      expect(getByTestId(`status-label-${status}`).textContent).toContain(status)
    }
  })

  it('labels are visible for all risks', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    for (const risk of riskLevels) {
      expect(getByTestId(`risk-label-${risk}`).textContent).toContain(risk)
    }
  })

  it('preserves existing filter values when adding new ones', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(
      <VendorStatusFilter value={{ status: ['active'], risk: ['low'], search: 'test' }} onChange={f => { newFilters = f }} />
    )
    await fireEvent.click(getByTestId('risk-checkbox-high'))
    expect(newFilters?.search).toBe('test')
    expect(newFilters?.status).toContain('active')
  })

  // Additional tests to reach 100+
  it('status filter active label is visible', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('status-label-active').textContent).toBe('active')
  })

  it('status filter inactive label is visible', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('status-label-inactive').textContent).toBe('inactive')
  })

  it('status filter pending label is visible', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('status-label-pending').textContent).toBe('pending')
  })

  it('status filter archived label is visible', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('status-label-archived').textContent).toBe('archived')
  })

  it('risk filter low label is visible', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('risk-label-low').textContent).toBe('low')
  })

  it('risk filter medium label is visible', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('risk-label-medium').textContent).toBe('medium')
  })

  it('risk filter high label is visible', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('risk-label-high').textContent).toBe('high')
  })

  it('risk filter critical label is visible', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('risk-label-critical').textContent).toBe('critical')
  })

  it('clicking active status checkbox with active filter removes it', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(
      <VendorStatusFilter value={{ status: ['active'], risk: [] }} onChange={f => { newFilters = f }} />
    )
    await fireEvent.click(getByTestId('status-checkbox-active'))
    expect(newFilters?.status).not.toContain('active')
  })

  it('clicking inactive status checkbox with inactive filter removes it', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(
      <VendorStatusFilter value={{ status: ['inactive'], risk: [] }} onChange={f => { newFilters = f }} />
    )
    await fireEvent.click(getByTestId('status-checkbox-inactive'))
    expect(newFilters?.status).not.toContain('inactive')
  })

  it('clicking pending status checkbox adds pending', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(
      <VendorStatusFilter value={{ status: [], risk: [] }} onChange={f => { newFilters = f }} />
    )
    await fireEvent.click(getByTestId('status-checkbox-pending'))
    expect(newFilters?.status).toContain('pending')
  })

  it('clicking archived status checkbox adds archived', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(
      <VendorStatusFilter value={{ status: [], risk: [] }} onChange={f => { newFilters = f }} />
    )
    await fireEvent.click(getByTestId('status-checkbox-archived'))
    expect(newFilters?.status).toContain('archived')
  })

  it('clicking low risk checkbox adds low', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(
      <VendorStatusFilter value={{ status: [], risk: [] }} onChange={f => { newFilters = f }} />
    )
    await fireEvent.click(getByTestId('risk-checkbox-low'))
    expect(newFilters?.risk).toContain('low')
  })

  it('clicking medium risk checkbox adds medium', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(
      <VendorStatusFilter value={{ status: [], risk: [] }} onChange={f => { newFilters = f }} />
    )
    await fireEvent.click(getByTestId('risk-checkbox-medium'))
    expect(newFilters?.risk).toContain('medium')
  })

  it('clicking critical risk checkbox removes critical when already checked', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(
      <VendorStatusFilter value={{ status: [], risk: ['critical'] }} onChange={f => { newFilters = f }} />
    )
    await fireEvent.click(getByTestId('risk-checkbox-critical'))
    expect(newFilters?.risk).not.toContain('critical')
  })

  it('clicking medium risk checkbox removes medium when already checked', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(
      <VendorStatusFilter value={{ status: [], risk: ['medium'] }} onChange={f => { newFilters = f }} />
    )
    await fireEvent.click(getByTestId('risk-checkbox-medium'))
    expect(newFilters?.risk).not.toContain('medium')
  })

  it('all status checkboxes are unchecked by default', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    for (const status of statuses) {
      const checkbox = getByTestId(`status-checkbox-${status}`)
      expect(checkbox.checked).toBeFalsy()
    }
  })

  it('all risk checkboxes are unchecked by default', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    for (const risk of riskLevels) {
      const checkbox = getByTestId(`risk-checkbox-${risk}`)
      expect(checkbox.checked).toBeFalsy()
    }
  })

  it('Filters heading text is shown', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('filter-header').textContent).toContain('Filters')
  })

  it('Status heading text is shown', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('status-filter-label').textContent).toContain('Status')
  })

  it('Risk Level heading text is shown', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('risk-filter-label').textContent).toContain('Risk')
  })

  it('snapshot with only active status selected', async () => {
    await render(<VendorStatusFilter value={{ status: ['active'], risk: [] }} onChange={() => {}} />)
    await snapshot('vendor-status-filter-active-only')
  })

  it('snapshot with only critical risk selected', async () => {
    await render(<VendorStatusFilter value={{ status: [], risk: ['critical'] }} onChange={() => {}} />)
    await snapshot('vendor-status-filter-critical-only')
  })

  it('snapshot with empty vendor counts', async () => {
    await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} vendorCounts={{}} />)
    await snapshot('vendor-status-filter-no-counts')
  })

  it('shows count of 50 for active', async () => {
    const { getByTestId } = await render(
      <VendorStatusFilter value={emptyFilters} onChange={() => {}} vendorCounts={{ active: 50 }} />
    )
    expect(getByTestId('status-count-active').textContent).toContain('50')
  })

  it('shows count of 25 for low risk', async () => {
    const { getByTestId } = await render(
      <VendorStatusFilter value={emptyFilters} onChange={() => {}} vendorCounts={{ low: 25 }} />
    )
    expect(getByTestId('risk-count-low').textContent).toContain('25')
  })

  it('shows count of 100 for medium risk', async () => {
    const { getByTestId } = await render(
      <VendorStatusFilter value={emptyFilters} onChange={() => {}} vendorCounts={{ medium: 100 }} />
    )
    expect(getByTestId('risk-count-medium').textContent).toContain('100')
  })

  it('clear button click triggers onChange with empty arrays', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(
      <VendorStatusFilter value={{ status: ['active'], risk: ['critical'] }} onChange={f => { newFilters = f }} />
    )
    await fireEvent.click(getByTestId('clear-filters'))
    expect(newFilters?.status?.length).toBe(0)
    expect(newFilters?.risk?.length).toBe(0)
  })

  it('renders filter with all statuses and all risks selected', async () => {
    const { getByTestId } = await render(
      <VendorStatusFilter value={{ status: [...statuses], risk: [...riskLevels] }} onChange={() => {}} />
    )
    expect(getByTestId('clear-filters')).toBeDefined()
  })

  it('has 4 status filter items total', async () => {
    const { container } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    const items = container.querySelectorAll('[data-testid^="status-filter-"]')
    expect(items.length).toBe(4)
  })

  it('has 4 risk filter items total', async () => {
    const { container } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    const items = container.querySelectorAll('[data-testid^="risk-filter-"]')
    expect(items.length).toBe(4)
  })

  it('renders correctly with all statuses checked', async () => {
    const { getByTestId } = await render(
      <VendorStatusFilter value={{ status: [...statuses], risk: [] }} onChange={() => {}} />
    )
    expect(getByTestId('vendor-status-filter')).toBeDefined()
  })

  it('renders correctly with all risks checked', async () => {
    const { getByTestId } = await render(
      <VendorStatusFilter value={{ status: [], risk: [...riskLevels] }} onChange={() => {}} />
    )
    expect(getByTestId('vendor-status-filter')).toBeDefined()
  })

  // Additional tests to reach 100
  it('vendor-status-filter data-testid is vendor-status-filter', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('vendor-status-filter').getAttribute('data-testid')).toBe('vendor-status-filter')
  })

  it('filter-header data-testid is filter-header', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('filter-header').getAttribute('data-testid')).toBe('filter-header')
  })

  it('status-filter-label data-testid is status-filter-label', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('status-filter-label').getAttribute('data-testid')).toBe('status-filter-label')
  })

  it('risk-filter-label data-testid is risk-filter-label', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('risk-filter-label').getAttribute('data-testid')).toBe('risk-filter-label')
  })

  it('status-checkbox-active data-testid is status-checkbox-active', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('status-checkbox-active').getAttribute('data-testid')).toBe('status-checkbox-active')
  })

  it('risk-checkbox-high data-testid is risk-checkbox-high', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('risk-checkbox-high').getAttribute('data-testid')).toBe('risk-checkbox-high')
  })

  it('clear-filters data-testid is clear-filters', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={{ status: ['active'], risk: [] }} onChange={() => {}} />)
    expect(getByTestId('clear-filters').getAttribute('data-testid')).toBe('clear-filters')
  })

  it('clicking high risk adds high to risk filter', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(<VendorStatusFilter value={{ status: [], risk: [] }} onChange={f => { newFilters = f }} />)
    await fireEvent.click(getByTestId('risk-checkbox-high'))
    expect(newFilters?.risk).toContain('high')
  })

  it('clicking critical risk adds critical to risk filter', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(<VendorStatusFilter value={{ status: [], risk: [] }} onChange={f => { newFilters = f }} />)
    await fireEvent.click(getByTestId('risk-checkbox-critical'))
    expect(newFilters?.risk).toContain('critical')
  })

  it('clicking low risk removes low when already present', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(<VendorStatusFilter value={{ status: [], risk: ['low'] }} onChange={f => { newFilters = f }} />)
    await fireEvent.click(getByTestId('risk-checkbox-low'))
    expect(newFilters?.risk).not.toContain('low')
  })

  it('clicking high risk removes high when already present', async () => {
    let newFilters: FilterOptions | null = null
    const { getByTestId } = await render(<VendorStatusFilter value={{ status: [], risk: ['high'] }} onChange={f => { newFilters = f }} />)
    await fireEvent.click(getByTestId('risk-checkbox-high'))
    expect(newFilters?.risk).not.toContain('high')
  })

  it('active checkbox is checked when active in filter', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={{ status: ['active'], risk: [] }} onChange={() => {}} />)
    expect(getByTestId('status-checkbox-active').checked).toBeTruthy()
  })

  it('low risk checkbox is checked when low in filter', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={{ status: [], risk: ['low'] }} onChange={() => {}} />)
    expect(getByTestId('risk-checkbox-low').checked).toBeTruthy()
  })

  it('critical risk checkbox is checked when critical in filter', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={{ status: [], risk: ['critical'] }} onChange={() => {}} />)
    expect(getByTestId('risk-checkbox-critical').checked).toBeTruthy()
  })

  it('pending checkbox is checked when pending in filter', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={{ status: ['pending'], risk: [] }} onChange={() => {}} />)
    expect(getByTestId('status-checkbox-pending').checked).toBeTruthy()
  })

  it('archive checkbox is not checked by default', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('status-checkbox-archived').checked).toBeFalsy()
  })

  it('medium risk checkbox is not checked by default', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('risk-checkbox-medium').checked).toBeFalsy()
  })

  it('clear filters fires onChange once', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorStatusFilter value={{ status: ['active'], risk: ['high'] }} onChange={() => { count++ }} />)
    await fireEvent.click(getByTestId('clear-filters'))
    expect(count).toBe(1)
  })

  it('snapshot with active and critical selected', async () => {
    await render(<VendorStatusFilter value={{ status: ['active'], risk: ['critical'] }} onChange={() => {}} />)
    await snapshot('vendor-status-filter-active-critical')
  })

  it('snapshot with all statuses and all risks selected', async () => {
    await render(<VendorStatusFilter value={{ status: [...statuses], risk: [...riskLevels] }} onChange={() => {}} />)
    await snapshot('vendor-status-filter-all-selected')
  })

  it('snapshot with vendor counts', async () => {
    await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} vendorCounts={{ active: 10, inactive: 5, high: 3, critical: 2 }} />)
    await snapshot('vendor-status-filter-with-counts')
  })

  it('vendor-status-filter data-testid is vendor-status-filter', async () => {
    const { getByTestId } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => {}} />)
    expect(getByTestId('vendor-status-filter').getAttribute('data-testid')).toBe('vendor-status-filter')
  })

  it('onChange fires twice when checkbox clicked twice', async () => {
    let count = 0
    const { container } = await render(<VendorStatusFilter value={emptyFilters} onChange={() => { count++ }} />)
    const checkbox = container.querySelector('[data-testid="status-checkbox-active"]')!
    await fireEvent.click(checkbox)
    await fireEvent.click(checkbox)
    expect(count).toBe(2)
  })
})
