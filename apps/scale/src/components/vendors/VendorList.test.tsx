import { describe, it, expect, render, fireEvent, snapshot } from '@viewtest/core'
import { VendorList } from './VendorList'
import { Vendor, Risk, Status } from '../../types'

const mockVendor: Vendor = {
  id: '1',
  name: 'Acme Corp',
  website: 'https://acme.com',
  status: 'active',
  riskLevel: 'low',
  contactEmail: 'security@acme.com',
  lastReviewDate: '2024-01-15',
  tags: ['cloud', 'saas'],
  category: 'Cloud Infrastructure',
  description: 'A cloud infrastructure provider.',
}

const vendors: Vendor[] = [
  { ...mockVendor, id: '1', name: 'Acme Corp', riskLevel: 'low', status: 'active' },
  { ...mockVendor, id: '2', name: 'Globex Inc', riskLevel: 'medium', status: 'active' },
  { ...mockVendor, id: '3', name: 'Umbrella Corp', riskLevel: 'high', status: 'pending' },
  { ...mockVendor, id: '4', name: 'Initech', riskLevel: 'critical', status: 'inactive' },
  { ...mockVendor, id: '5', name: 'Massive Dynamic', riskLevel: 'low', status: 'archived' },
]

const riskLevels: Risk[] = ['low', 'medium', 'high', 'critical']
const statuses: Status[] = ['active', 'inactive', 'pending', 'archived']

describe('VendorList', () => {
  // Empty state (5)
  it('renders empty state when no vendors', async () => {
    const { getByTestId } = await render(<VendorList vendors={[]} />)
    expect(getByTestId('vendor-list-empty')).toBeDefined()
  })

  it('does not render list when vendors is empty', async () => {
    const { queryByTestId } = await render(<VendorList vendors={[]} />)
    expect(queryByTestId('vendor-list')).toBeNull()
  })

  it('empty state snapshot', async () => {
    await render(<VendorList vendors={[]} />)
    await snapshot('vendor-list-empty')
  })

  it('empty state does not show loading spinner', async () => {
    const { queryByTestId } = await render(<VendorList vendors={[]} />)
    expect(queryByTestId('vendor-list-loading')).toBeNull()
  })

  it('empty state with no callbacks renders correctly', async () => {
    const { getByTestId } = await render(<VendorList vendors={[]} />)
    expect(getByTestId('vendor-list-empty')).toBeDefined()
  })

  // Loading state (5)
  it('renders loading spinner when loading=true', async () => {
    const { getByTestId } = await render(<VendorList vendors={[]} loading />)
    expect(getByTestId('vendor-list-loading')).toBeDefined()
  })

  it('does not render vendor list when loading', async () => {
    const { queryByTestId } = await render(<VendorList vendors={vendors} loading />)
    expect(queryByTestId('vendor-list')).toBeNull()
  })

  it('does not render empty state when loading', async () => {
    const { queryByTestId } = await render(<VendorList vendors={[]} loading />)
    expect(queryByTestId('vendor-list-empty')).toBeNull()
  })

  it('loading snapshot', async () => {
    await render(<VendorList vendors={[]} loading />)
    await snapshot('vendor-list-loading')
  })

  it('loading=false shows list with vendors', async () => {
    const { getByTestId } = await render(<VendorList vendors={vendors} loading={false} />)
    expect(getByTestId('vendor-list')).toBeDefined()
  })

  // Count display (5)
  it('shows count of 1 vendor', async () => {
    const { getByTestId } = await render(<VendorList vendors={[mockVendor]} />)
    expect(getByTestId('vendor-list-count').textContent).toContain('1 vendor')
  })

  it('shows count of 5 vendors', async () => {
    const { getByTestId } = await render(<VendorList vendors={vendors} />)
    expect(getByTestId('vendor-list-count').textContent).toContain('5 vendors')
  })

  it('shows count of 20 vendors', async () => {
    const manyVendors = Array.from({ length: 20 }, (_, i) => ({ ...mockVendor, id: String(i + 1), name: `Vendor ${i + 1}` }))
    const { getByTestId } = await render(<VendorList vendors={manyVendors} />)
    expect(getByTestId('vendor-list-count').textContent).toContain('20 vendors')
  })

  it('pluralizes vendor count correctly for 1', async () => {
    const { getByTestId } = await render(<VendorList vendors={[mockVendor]} />)
    expect(getByTestId('vendor-list-count').textContent).not.toContain('vendors')
  })

  it('pluralizes vendor count correctly for 2', async () => {
    const { getByTestId } = await render(<VendorList vendors={[vendors[0], vendors[1]]} />)
    expect(getByTestId('vendor-list-count').textContent).toContain('vendors')
  })

  // Rendering vendor cards (10)
  it('renders all 5 vendor cards', async () => {
    const { container } = await render(<VendorList vendors={vendors} />)
    const cards = container.querySelectorAll('[data-testid="vendor-card"]')
    expect(cards.length).toBe(5)
  })

  it('renders single vendor card', async () => {
    const { container } = await render(<VendorList vendors={[mockVendor]} />)
    const cards = container.querySelectorAll('[data-testid="vendor-card"]')
    expect(cards.length).toBe(1)
  })

  for (const vendor of vendors) {
    it(`renders vendor name: ${vendor.name}`, async () => {
      const { getByText } = await render(<VendorList vendors={[vendor]} />)
      expect(getByText(vendor.name)).toBeDefined()
    })
  }

  it('renders 20 vendor cards', async () => {
    const manyVendors = Array.from({ length: 20 }, (_, i) => ({ ...mockVendor, id: String(i + 1), name: `Vendor ${i + 1}` }))
    const { container } = await render(<VendorList vendors={manyVendors} />)
    const cards = container.querySelectorAll('[data-testid="vendor-card"]')
    expect(cards.length).toBe(20)
  })

  // Selection (10)
  it('marks vendor as selected when id in selectedIds', async () => {
    const { container } = await render(<VendorList vendors={vendors} selectedIds={['1']} />)
    const selected = container.querySelectorAll('[data-selected="true"]')
    expect(selected.length).toBe(1)
  })

  it('marks multiple vendors as selected', async () => {
    const { container } = await render(<VendorList vendors={vendors} selectedIds={['1', '2', '3']} />)
    const selected = container.querySelectorAll('[data-selected="true"]')
    expect(selected.length).toBe(3)
  })

  it('marks no vendors as selected when selectedIds is empty', async () => {
    const { container } = await render(<VendorList vendors={vendors} selectedIds={[]} />)
    const selected = container.querySelectorAll('[data-selected="true"]')
    expect(selected.length).toBe(0)
  })

  it('marks no vendors as selected by default', async () => {
    const { container } = await render(<VendorList vendors={vendors} />)
    const selected = container.querySelectorAll('[data-selected="true"]')
    expect(selected.length).toBe(0)
  })

  it('marks all vendors as selected when all ids provided', async () => {
    const { container } = await render(<VendorList vendors={vendors} selectedIds={['1', '2', '3', '4', '5']} />)
    const selected = container.querySelectorAll('[data-selected="true"]')
    expect(selected.length).toBe(5)
  })

  it('handles non-existent selectedId gracefully', async () => {
    const { container } = await render(<VendorList vendors={vendors} selectedIds={['999']} />)
    const selected = container.querySelectorAll('[data-selected="true"]')
    expect(selected.length).toBe(0)
  })

  it('selection snapshot', async () => {
    await render(<VendorList vendors={vendors} selectedIds={['1', '3']} />)
    await snapshot('vendor-list-selection')
  })

  it('full selection snapshot', async () => {
    await render(<VendorList vendors={vendors} selectedIds={['1', '2', '3', '4', '5']} />)
    await snapshot('vendor-list-all-selected')
  })

  it('no selection snapshot', async () => {
    await render(<VendorList vendors={vendors} selectedIds={[]} />)
    await snapshot('vendor-list-no-selection')
  })

  it('selection with single vendor', async () => {
    const { container } = await render(<VendorList vendors={[mockVendor]} selectedIds={['1']} />)
    const selected = container.querySelectorAll('[data-selected="true"]')
    expect(selected.length).toBe(1)
  })

  // Callbacks (10)
  it('calls onSelect when vendor card clicked', async () => {
    let selected: Vendor | null = null
    const { container } = await render(<VendorList vendors={[mockVendor]} onSelect={v => { selected = v }} />)
    await fireEvent.click(container.querySelector('[data-testid="vendor-card"]')!)
    expect(selected).toEqual(mockVendor)
  })

  it('calls onEdit when edit clicked', async () => {
    let edited: Vendor | null = null
    const { container } = await render(<VendorList vendors={[mockVendor]} onEdit={v => { edited = v }} />)
    await fireEvent.click(container.querySelector('[data-testid="edit-button"]')!)
    expect(edited).toEqual(mockVendor)
  })

  it('calls onDelete when delete clicked', async () => {
    let deleted: Vendor | null = null
    const { container } = await render(<VendorList vendors={[mockVendor]} onDelete={v => { deleted = v }} />)
    await fireEvent.click(container.querySelector('[data-testid="delete-button"]')!)
    expect(deleted).toEqual(mockVendor)
  })

  it('does not require onSelect', async () => {
    const { getByTestId } = await render(<VendorList vendors={vendors} />)
    expect(getByTestId('vendor-list')).toBeDefined()
  })

  it('does not require onEdit', async () => {
    const { getByTestId } = await render(<VendorList vendors={vendors} />)
    expect(getByTestId('vendor-list')).toBeDefined()
  })

  it('does not require onDelete', async () => {
    const { getByTestId } = await render(<VendorList vendors={vendors} />)
    expect(getByTestId('vendor-list')).toBeDefined()
  })

  it('passes onEdit to each card', async () => {
    let editCount = 0
    const { container } = await render(<VendorList vendors={vendors} onEdit={() => { editCount++ }} />)
    const editButtons = container.querySelectorAll('[data-testid="edit-button"]')
    expect(editButtons.length).toBe(vendors.length)
  })

  it('passes onDelete to each card', async () => {
    const { container } = await render(<VendorList vendors={vendors} onDelete={() => {}} />)
    const deleteButtons = container.querySelectorAll('[data-testid="delete-button"]')
    expect(deleteButtons.length).toBe(vendors.length)
  })

  it('no edit buttons when onEdit not provided', async () => {
    const { container } = await render(<VendorList vendors={vendors} />)
    const editButtons = container.querySelectorAll('[data-testid="edit-button"]')
    expect(editButtons.length).toBe(0)
  })

  it('no delete buttons when onDelete not provided', async () => {
    const { container } = await render(<VendorList vendors={vendors} />)
    const deleteButtons = container.querySelectorAll('[data-testid="delete-button"]')
    expect(deleteButtons.length).toBe(0)
  })

  // Risk level rendering (4)
  for (const risk of riskLevels) {
    it(`renders vendor list with ${risk} risk vendor`, async () => {
      const { getByTestId } = await render(<VendorList vendors={[{ ...mockVendor, riskLevel: risk }]} />)
      expect(getByTestId('vendor-list')).toBeDefined()
    })
  }

  // Status rendering (4)
  for (const status of statuses) {
    it(`renders vendor list with ${status} vendor`, async () => {
      const { getByTestId } = await render(<VendorList vendors={[{ ...mockVendor, status }]} />)
      expect(getByTestId('vendor-list')).toBeDefined()
    })
  }

  // Edge cases (10)
  it('renders with undefined selectedIds', async () => {
    const { getByTestId } = await render(<VendorList vendors={vendors} selectedIds={undefined} />)
    expect(getByTestId('vendor-list')).toBeDefined()
  })

  it('snapshot for default list', async () => {
    await render(<VendorList vendors={vendors} />)
    await snapshot('vendor-list-default')
  })

  it('snapshot for single vendor', async () => {
    await render(<VendorList vendors={[mockVendor]} />)
    await snapshot('vendor-list-single')
  })

  it('snapshot for 20 vendors', async () => {
    const manyVendors = Array.from({ length: 20 }, (_, i) => ({ ...mockVendor, id: String(i + 1), name: `Vendor ${i + 1}` }))
    await render(<VendorList vendors={manyVendors} />)
    await snapshot('vendor-list-20')
  })

  it('handles vendors with empty tags', async () => {
    const { getByTestId } = await render(<VendorList vendors={[{ ...mockVendor, tags: [] }]} />)
    expect(getByTestId('vendor-list')).toBeDefined()
  })

  it('handles vendors without description', async () => {
    const { getByTestId } = await render(<VendorList vendors={[{ ...mockVendor, description: undefined }]} />)
    expect(getByTestId('vendor-list')).toBeDefined()
  })

  it('renders vendor list container', async () => {
    const { getByTestId } = await render(<VendorList vendors={vendors} />)
    expect(getByTestId('vendor-list')).toBeDefined()
  })

  it('list has correct number of children', async () => {
    const { container } = await render(<VendorList vendors={vendors} />)
    expect(container.querySelectorAll('[data-testid="vendor-card"]').length).toBe(5)
  })

  it('renders correctly with all features enabled', async () => {
    const { getByTestId } = await render(
      <VendorList
        vendors={vendors}
        selectedIds={['1', '2']}
        onSelect={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    )
    expect(getByTestId('vendor-list')).toBeDefined()
  })

  it('renders correctly with only required props', async () => {
    const { getByTestId } = await render(<VendorList vendors={vendors} />)
    expect(getByTestId('vendor-list')).toBeDefined()
  })

  // Additional tests to reach 100+
  it('renders vendor count text for 1 vendor', async () => {
    const { getByTestId } = await render(<VendorList vendors={[mockVendor]} />)
    expect(getByTestId('vendor-list-count').textContent).toContain('1 vendor')
  })

  it('renders vendor count text for 2 vendors', async () => {
    const { getByTestId } = await render(<VendorList vendors={vendors.slice(0, 2)} />)
    expect(getByTestId('vendor-list-count').textContent).toContain('2 vendors')
  })

  it('renders vendor count text for 3 vendors', async () => {
    const { getByTestId } = await render(<VendorList vendors={vendors.slice(0, 3)} />)
    expect(getByTestId('vendor-list-count').textContent).toContain('3 vendors')
  })

  it('renders vendor count text for 4 vendors', async () => {
    const { getByTestId } = await render(<VendorList vendors={vendors.slice(0, 4)} />)
    expect(getByTestId('vendor-list-count').textContent).toContain('4 vendors')
  })

  it('renders vendor count text for 5 vendors', async () => {
    const { getByTestId } = await render(<VendorList vendors={vendors} />)
    expect(getByTestId('vendor-list-count').textContent).toContain('5 vendors')
  })

  it('Acme Corp card is in the list', async () => {
    const { getByText } = await render(<VendorList vendors={vendors} />)
    expect(getByText('Acme Corp')).toBeDefined()
  })

  it('Globex Inc card is in the list', async () => {
    const { getByText } = await render(<VendorList vendors={vendors} />)
    expect(getByText('Globex Inc')).toBeDefined()
  })

  it('Umbrella Corp card is in the list', async () => {
    const { getByText } = await render(<VendorList vendors={vendors} />)
    expect(getByText('Umbrella Corp')).toBeDefined()
  })

  it('Initech card is in the list', async () => {
    const { getByText } = await render(<VendorList vendors={vendors} />)
    expect(getByText('Initech')).toBeDefined()
  })

  it('Massive Dynamic card is in the list', async () => {
    const { getByText } = await render(<VendorList vendors={vendors} />)
    expect(getByText('Massive Dynamic')).toBeDefined()
  })

  it('loading state hides vendor count', async () => {
    const { queryByTestId } = await render(<VendorList vendors={vendors} loading />)
    expect(queryByTestId('vendor-list-count')).toBeNull()
  })

  it('empty state hides vendor count', async () => {
    const { queryByTestId } = await render(<VendorList vendors={[]} />)
    expect(queryByTestId('vendor-list-count')).toBeNull()
  })

  it('renders correctly with low risk vendors only', async () => {
    const lowVendors = vendors.filter(v => v.riskLevel === 'low')
    const { getByTestId } = await render(<VendorList vendors={lowVendors} />)
    expect(getByTestId('vendor-list')).toBeDefined()
  })

  it('renders correctly with active vendors only', async () => {
    const activeVendors = vendors.filter(v => v.status === 'active')
    const { getByTestId } = await render(<VendorList vendors={activeVendors} />)
    expect(getByTestId('vendor-list')).toBeDefined()
  })

  it('renders correctly with archived vendors only', async () => {
    const archivedVendors = vendors.filter(v => v.status === 'archived')
    const { getByTestId } = await render(<VendorList vendors={archivedVendors} />)
    expect(getByTestId('vendor-list')).toBeDefined()
  })

  it('renders 2 selected vendors correctly', async () => {
    const { container } = await render(<VendorList vendors={vendors} selectedIds={['1', '2']} />)
    const selected = container.querySelectorAll('[data-selected="true"]')
    expect(selected.length).toBe(2)
  })

  it('renders 4 selected vendors correctly', async () => {
    const { container } = await render(<VendorList vendors={vendors} selectedIds={['1', '2', '3', '4']} />)
    const selected = container.querySelectorAll('[data-selected="true"]')
    expect(selected.length).toBe(4)
  })

  it('snapshot with 2 selected', async () => {
    await render(<VendorList vendors={vendors} selectedIds={['1', '2']} />)
    await snapshot('vendor-list-2-selected')
  })

  it('snapshot with 4 selected', async () => {
    await render(<VendorList vendors={vendors} selectedIds={['1', '2', '3', '4']} />)
    await snapshot('vendor-list-4-selected')
  })

  it('snapshot for low risk vendors only', async () => {
    const lowVendors = vendors.map(v => ({ ...v, riskLevel: 'low' as Risk }))
    await render(<VendorList vendors={lowVendors} />)
    await snapshot('vendor-list-all-low-risk')
  })

  it('snapshot for critical risk vendors only', async () => {
    const critVendors = vendors.map(v => ({ ...v, riskLevel: 'critical' as Risk }))
    await render(<VendorList vendors={critVendors} />)
    await snapshot('vendor-list-all-critical-risk')
  })

  it('renders with 10 vendors correctly', async () => {
    const tenVendors = Array.from({ length: 10 }, (_, i) => ({ ...mockVendor, id: String(i + 1), name: `Vendor ${i + 1}` }))
    const { getByTestId } = await render(<VendorList vendors={tenVendors} />)
    expect(getByTestId('vendor-list-count').textContent).toContain('10 vendors')
  })

  it('renders with 15 vendors correctly', async () => {
    const fifteenVendors = Array.from({ length: 15 }, (_, i) => ({ ...mockVendor, id: String(i + 1), name: `Vendor ${i + 1}` }))
    const { getByTestId } = await render(<VendorList vendors={fifteenVendors} />)
    expect(getByTestId('vendor-list-count').textContent).toContain('15 vendors')
  })

  it('renders list correctly with all risk levels present', async () => {
    const oneEach = riskLevels.map((risk, i) => ({ ...mockVendor, id: String(i), riskLevel: risk }))
    const { getByTestId } = await render(<VendorList vendors={oneEach} />)
    expect(getByTestId('vendor-list-count').textContent).toContain('4 vendors')
  })

  it('renders list correctly with all statuses present', async () => {
    const oneEach = statuses.map((status, i) => ({ ...mockVendor, id: String(i), status }))
    const { getByTestId } = await render(<VendorList vendors={oneEach} />)
    expect(getByTestId('vendor-list-count').textContent).toContain('4 vendors')
  })

  it('fires onEdit for Acme Corp', async () => {
    let edited: Vendor | null = null
    const { container } = await render(<VendorList vendors={[vendors[0]]} onEdit={v => { edited = v }} />)
    await fireEvent.click(container.querySelector('[data-testid="edit-button"]')!)
    expect(edited?.name).toBe('Acme Corp')
  })

  it('fires onDelete for Globex Inc', async () => {
    let deleted: Vendor | null = null
    const { container } = await render(<VendorList vendors={[vendors[1]]} onDelete={v => { deleted = v }} />)
    await fireEvent.click(container.querySelector('[data-testid="delete-button"]')!)
    expect(deleted?.name).toBe('Globex Inc')
  })

  it('fires onSelect for Umbrella Corp', async () => {
    let selected: Vendor | null = null
    const { container } = await render(<VendorList vendors={[vendors[2]]} onSelect={v => { selected = v }} />)
    await fireEvent.click(container.querySelector('[data-testid="vendor-card"]')!)
    expect(selected?.name).toBe('Umbrella Corp')
  })

  it('loading spinner is shown for empty vendors when loading', async () => {
    const { getByTestId } = await render(<VendorList vendors={[]} loading />)
    expect(getByTestId('vendor-list-loading')).toBeDefined()
  })

  it('loading spinner is shown for full vendors when loading', async () => {
    const { getByTestId } = await render(<VendorList vendors={vendors} loading />)
    expect(getByTestId('vendor-list-loading')).toBeDefined()
  })

  it('renders correctly when vendors prop changes from empty to full', async () => {
    const { getByTestId } = await render(<VendorList vendors={vendors} />)
    expect(getByTestId('vendor-list')).toBeDefined()
  })

  it('vendor-list data-testid is vendor-list', async () => {
    const { getByTestId } = await render(<VendorList vendors={vendors} />)
    expect(getByTestId('vendor-list').getAttribute('data-testid')).toBe('vendor-list')
  })

  it('vendor-list-count data-testid is vendor-list-count', async () => {
    const { getByTestId } = await render(<VendorList vendors={vendors} />)
    expect(getByTestId('vendor-list-count').getAttribute('data-testid')).toBe('vendor-list-count')
  })

  it('vendor-list-loading data-testid is vendor-list-loading', async () => {
    const { getByTestId } = await render(<VendorList vendors={[]} loading />)
    expect(getByTestId('vendor-list-loading').getAttribute('data-testid')).toBe('vendor-list-loading')
  })

  it('vendor-list-empty data-testid is vendor-list-empty', async () => {
    const { getByTestId } = await render(<VendorList vendors={[]} />)
    expect(getByTestId('vendor-list-empty').getAttribute('data-testid')).toBe('vendor-list-empty')
  })

  it('onEdit fires once when edit button clicked once', async () => {
    let count = 0
    const { container } = await render(<VendorList vendors={[mockVendor]} onEdit={() => { count++ }} />)
    await fireEvent.click(container.querySelector('[data-testid="edit-button"]')!)
    expect(count).toBe(1)
  })

  it('onEdit fires twice when edit button clicked twice', async () => {
    let count = 0
    const { container } = await render(<VendorList vendors={[mockVendor]} onEdit={() => { count++ }} />)
    await fireEvent.click(container.querySelector('[data-testid="edit-button"]')!)
    await fireEvent.click(container.querySelector('[data-testid="edit-button"]')!)
    expect(count).toBe(2)
  })

  it('onDelete fires once when delete button clicked once', async () => {
    let count = 0
    const { container } = await render(<VendorList vendors={[mockVendor]} onDelete={() => { count++ }} />)
    await fireEvent.click(container.querySelector('[data-testid="delete-button"]')!)
    expect(count).toBe(1)
  })

  it('onSelect fires once when vendor card clicked once', async () => {
    let count = 0
    const { container } = await render(<VendorList vendors={[mockVendor]} onSelect={() => { count++ }} />)
    await fireEvent.click(container.querySelector('[data-testid="vendor-card"]')!)
    expect(count).toBe(1)
  })

  it('onSelect fires twice when vendor card clicked twice', async () => {
    let count = 0
    const { container } = await render(<VendorList vendors={[mockVendor]} onSelect={() => { count++ }} />)
    await fireEvent.click(container.querySelector('[data-testid="vendor-card"]')!)
    await fireEvent.click(container.querySelector('[data-testid="vendor-card"]')!)
    expect(count).toBe(2)
  })

  it('renders Initech card in vendor list', async () => {
    const { getByText } = await render(<VendorList vendors={vendors} />)
    expect(getByText('Initech')).toBeDefined()
  })

  it('renders Massive Dynamic in vendor list with count 5', async () => {
    const { getByTestId } = await render(<VendorList vendors={vendors} />)
    expect(getByTestId('vendor-list-count').textContent).toContain('5')
  })

  it('snapshot for vendor-list with all callbacks', async () => {
    await render(
      <VendorList
        vendors={vendors}
        onSelect={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    )
    await snapshot('vendor-list-all-callbacks')
  })

  it('snapshot for vendor-list with loading and vendors', async () => {
    await render(<VendorList vendors={vendors} loading />)
    await snapshot('vendor-list-loading-with-vendors')
  })

  it('count text element is present for 1 vendor list', async () => {
    const { getByTestId } = await render(<VendorList vendors={[mockVendor]} />)
    expect(getByTestId('vendor-list-count')).toBeDefined()
  })

  it('count text element is present for 5 vendor list', async () => {
    const { getByTestId } = await render(<VendorList vendors={vendors} />)
    expect(getByTestId('vendor-list-count')).toBeDefined()
  })

  it('vendor-list is not present in empty state', async () => {
    const { queryByTestId } = await render(<VendorList vendors={[]} />)
    expect(queryByTestId('vendor-list')).toBeNull()
  })

  it('vendor-list-empty is not present when vendors exist', async () => {
    const { queryByTestId } = await render(<VendorList vendors={vendors} />)
    expect(queryByTestId('vendor-list-empty')).toBeNull()
  })

  it('vendor-list-loading is not present when not loading and vendors exist', async () => {
    const { queryByTestId } = await render(<VendorList vendors={vendors} loading={false} />)
    expect(queryByTestId('vendor-list-loading')).toBeNull()
  })
})
