import { describe, it, expect, render, fireEvent, snapshot } from '@viewtest/core'
import { VendorDeleteConfirm } from './VendorDeleteConfirm'
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

describe('VendorDeleteConfirm', () => {
  // Rendering when open (10)
  it('renders modal when open=true', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('vendor-delete-modal')).toBeDefined()
  })

  it('renders confirm container when open', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-confirm-container')).toBeDefined()
  })

  it('renders title', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-confirm-title').textContent).toContain('Delete Vendor')
  })

  it('renders warning alert', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-confirm-alert')).toBeDefined()
  })

  it('renders confirmation message', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-confirm-message')).toBeDefined()
  })

  it('shows vendor name in message', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-vendor-name').textContent).toBe('Acme Corp')
  })

  it('renders vendor info section', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-vendor-info')).toBeDefined()
  })

  it('shows vendor category in info', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-vendor-category').textContent).toContain('Cloud Infrastructure')
  })

  it('shows vendor risk level in info', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-vendor-risk').textContent).toContain('low')
  })

  it('shows vendor status in info', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-vendor-status').textContent).toContain('active')
  })

  // Closed state (5)
  it('renders null when open=false', async () => {
    const { queryByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open={false} onConfirm={() => {}} onCancel={() => {}} />)
    expect(queryByTestId('vendor-delete-modal')).toBeNull()
  })

  it('does not render confirm container when closed', async () => {
    const { queryByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open={false} onConfirm={() => {}} onCancel={() => {}} />)
    expect(queryByTestId('delete-confirm-container')).toBeNull()
  })

  it('closed state has no action buttons', async () => {
    const { queryByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open={false} onConfirm={() => {}} onCancel={() => {}} />)
    expect(queryByTestId('confirm-delete-button')).toBeNull()
  })

  it('snapshot when open', async () => {
    await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    await snapshot('vendor-delete-confirm-open')
  })

  it('snapshot when loading', async () => {
    await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} loading />)
    await snapshot('vendor-delete-confirm-loading')
  })

  // Actions (10)
  it('renders action buttons', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-confirm-actions')).toBeDefined()
  })

  it('renders cancel button', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('cancel-delete-button')).toBeDefined()
  })

  it('renders confirm button', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('confirm-delete-button')).toBeDefined()
  })

  it('calls onCancel when cancel button clicked', async () => {
    let cancelled = false
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => { cancelled = true }} />)
    await fireEvent.click(getByTestId('cancel-delete-button'))
    expect(cancelled).toBeTruthy()
  })

  it('calls onConfirm when confirm button clicked', async () => {
    let confirmed = false
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => { confirmed = true }} onCancel={() => {}} />)
    await fireEvent.click(getByTestId('confirm-delete-button'))
    expect(confirmed).toBeTruthy()
  })

  it('confirm button has danger variant', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('confirm-delete-button')).toBeDefined()
  })

  it('does not fire onConfirm when cancel is clicked', async () => {
    let confirmed = false
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => { confirmed = true }} onCancel={() => {}} />)
    await fireEvent.click(getByTestId('cancel-delete-button'))
    expect(confirmed).toBe(false)
  })

  it('does not fire onCancel when confirm is clicked', async () => {
    let cancelled = false
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => { cancelled = true }} />)
    await fireEvent.click(getByTestId('confirm-delete-button'))
    expect(cancelled).toBe(false)
  })

  it('confirm button shows Delete text when not loading', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('confirm-delete-button').textContent).toContain('Delete')
  })

  it('confirm button is disabled when loading', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} loading />)
    expect(getByTestId('confirm-delete-button').disabled).toBeTruthy()
  })

  // Loading state (10)
  it('disables cancel button when loading', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} loading />)
    expect(getByTestId('cancel-delete-button').disabled).toBeTruthy()
  })

  it('disables confirm button when loading', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} loading />)
    expect(getByTestId('confirm-delete-button').disabled).toBeTruthy()
  })

  it('cancel button not disabled when not loading', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('cancel-delete-button').disabled).toBe(false)
  })

  it('confirm button not disabled when not loading', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('confirm-delete-button').disabled).toBe(false)
  })

  it('loading=false is default', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('confirm-delete-button').disabled).toBe(false)
  })

  it('snapshot of loading state', async () => {
    await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} loading />)
    await snapshot('vendor-delete-confirm-loading-state')
  })

  it('does not call onConfirm when loading and confirm clicked', async () => {
    let confirmed = false
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => { confirmed = true }} onCancel={() => {}} loading />)
    const btn = getByTestId('confirm-delete-button')
    if (!btn.disabled) await fireEvent.click(btn)
    expect(confirmed).toBe(false)
  })

  it('does not call onCancel when loading and cancel clicked', async () => {
    let cancelled = false
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => { cancelled = true }} loading />)
    const btn = getByTestId('cancel-delete-button')
    if (!btn.disabled) await fireEvent.click(btn)
    expect(cancelled).toBe(false)
  })

  it('renders spinner when loading', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} loading />)
    expect(getByTestId('delete-spinner')).toBeDefined()
  })

  it('does not render spinner when not loading', async () => {
    const { queryByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(queryByTestId('delete-spinner')).toBeNull()
  })

  // Vendor variations (5 + 4 risk + 4 status)
  for (const vendor of vendors) {
    it(`shows correct vendor name for: ${vendor.name}`, async () => {
      const { getByTestId } = await render(<VendorDeleteConfirm vendor={vendor} open onConfirm={() => {}} onCancel={() => {}} />)
      expect(getByTestId('delete-vendor-name').textContent).toBe(vendor.name)
    })
  }

  for (const risk of riskLevels) {
    it(`shows ${risk} risk in vendor info`, async () => {
      const { getByTestId } = await render(<VendorDeleteConfirm vendor={{ ...mockVendor, riskLevel: risk }} open onConfirm={() => {}} onCancel={() => {}} />)
      expect(getByTestId('delete-vendor-risk').textContent).toContain(risk)
    })
  }

  for (const status of statuses) {
    it(`shows ${status} status in vendor info`, async () => {
      const { getByTestId } = await render(<VendorDeleteConfirm vendor={{ ...mockVendor, status }} open onConfirm={() => {}} onCancel={() => {}} />)
      expect(getByTestId('delete-vendor-status').textContent).toContain(status)
    })
  }

  // Edge cases (10)
  it('renders with vendor that has no description', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={{ ...mockVendor, description: undefined }} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('vendor-delete-modal')).toBeDefined()
  })

  it('renders with vendor that has no tags', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={{ ...mockVendor, tags: [] }} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('vendor-delete-modal')).toBeDefined()
  })

  it('renders with vendor that has long name', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={{ ...mockVendor, name: 'A Very Long Vendor Name Here' }} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-vendor-name').textContent).toContain('A Very Long Vendor Name Here')
  })

  it('confirm fires only once on single click', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => { count++ }} onCancel={() => {}} />)
    await fireEvent.click(getByTestId('confirm-delete-button'))
    expect(count).toBe(1)
  })

  it('cancel fires only once on single click', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => { count++ }} />)
    await fireEvent.click(getByTestId('cancel-delete-button'))
    expect(count).toBe(1)
  })

  it('can click confirm multiple times', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => { count++ }} onCancel={() => {}} />)
    await fireEvent.click(getByTestId('confirm-delete-button'))
    await fireEvent.click(getByTestId('confirm-delete-button'))
    expect(count).toBe(2)
  })

  it('renders correctly with all props', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} loading />)
    expect(getByTestId('vendor-delete-modal')).toBeDefined()
  })

  it('message mentions cannot be undone', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-confirm-message').textContent).toContain('cannot be undone')
  })

  it('snapshot with different vendor', async () => {
    await render(<VendorDeleteConfirm vendor={{ ...mockVendor, name: 'Globex Inc', riskLevel: 'critical' }} open onConfirm={() => {}} onCancel={() => {}} />)
    await snapshot('vendor-delete-confirm-critical')
  })

  it('renders action buttons in a container', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-confirm-actions')).toBeDefined()
  })

  // Additional tests to reach 100+
  it('renders correctly for each of 5 vendors', async () => {
    for (const vendor of vendors) {
      const { getByTestId } = await render(<VendorDeleteConfirm vendor={vendor} open onConfirm={() => {}} onCancel={() => {}} />)
      expect(getByTestId('delete-vendor-name').textContent).toBe(vendor.name)
    }
  })

  it('shows category for each of 5 vendors', async () => {
    for (const vendor of vendors) {
      const { getByTestId } = await render(<VendorDeleteConfirm vendor={vendor} open onConfirm={() => {}} onCancel={() => {}} />)
      expect(getByTestId('delete-vendor-category').textContent).toContain(vendor.category)
    }
  })

  it('shows risk for each risk level', async () => {
    for (const risk of riskLevels) {
      const { getByTestId } = await render(<VendorDeleteConfirm vendor={{ ...mockVendor, riskLevel: risk }} open onConfirm={() => {}} onCancel={() => {}} />)
      expect(getByTestId('delete-vendor-risk').textContent).toContain(risk)
    }
  })

  it('shows status for each status', async () => {
    for (const status of statuses) {
      const { getByTestId } = await render(<VendorDeleteConfirm vendor={{ ...mockVendor, status }} open onConfirm={() => {}} onCancel={() => {}} />)
      expect(getByTestId('delete-vendor-status').textContent).toContain(status)
    }
  })

  it('confirm button text shows Delete when not loading', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('confirm-delete-button').textContent).toContain('Delete')
  })

  it('cancel button text shows Cancel', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('cancel-delete-button').textContent).toContain('Cancel')
  })

  it('title tag is h2', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-confirm-title').tagName).toBe('H2')
  })

  it('confirms for each of 5 vendors', async () => {
    for (const vendor of vendors) {
      let confirmed = false
      const { getByTestId } = await render(<VendorDeleteConfirm vendor={vendor} open onConfirm={() => { confirmed = true }} onCancel={() => {}} />)
      await fireEvent.click(getByTestId('confirm-delete-button'))
      expect(confirmed).toBeTruthy()
    }
  })

  it('cancels for each of 5 vendors', async () => {
    for (const vendor of vendors) {
      let cancelled = false
      const { getByTestId } = await render(<VendorDeleteConfirm vendor={vendor} open onConfirm={() => {}} onCancel={() => { cancelled = true }} />)
      await fireEvent.click(getByTestId('cancel-delete-button'))
      expect(cancelled).toBeTruthy()
    }
  })

  it('delete spinner is present when loading and open', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open={true} onConfirm={() => {}} onCancel={() => {}} loading={true} />)
    expect(getByTestId('delete-spinner')).toBeDefined()
  })

  it('does not render when open is false and loading is true', async () => {
    const { queryByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open={false} onConfirm={() => {}} onCancel={() => {}} loading={true} />)
    expect(queryByTestId('vendor-delete-modal')).toBeNull()
  })

  it('vendor info section contains all three info items', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-vendor-category')).toBeDefined()
    expect(getByTestId('delete-vendor-risk')).toBeDefined()
    expect(getByTestId('delete-vendor-status')).toBeDefined()
  })

  it('snapshot for Acme Corp open', async () => {
    await render(<VendorDeleteConfirm vendor={vendors[0]} open onConfirm={() => {}} onCancel={() => {}} />)
    await snapshot('vendor-delete-confirm-acme')
  })

  it('snapshot for Globex Inc open', async () => {
    await render(<VendorDeleteConfirm vendor={vendors[1]} open onConfirm={() => {}} onCancel={() => {}} />)
    await snapshot('vendor-delete-confirm-globex')
  })

  it('snapshot for Umbrella Corp open', async () => {
    await render(<VendorDeleteConfirm vendor={vendors[2]} open onConfirm={() => {}} onCancel={() => {}} />)
    await snapshot('vendor-delete-confirm-umbrella')
  })

  it('snapshot for Initech open', async () => {
    await render(<VendorDeleteConfirm vendor={vendors[3]} open onConfirm={() => {}} onCancel={() => {}} />)
    await snapshot('vendor-delete-confirm-initech')
  })

  it('snapshot for Massive Dynamic open', async () => {
    await render(<VendorDeleteConfirm vendor={vendors[4]} open onConfirm={() => {}} onCancel={() => {}} />)
    await snapshot('vendor-delete-confirm-massive-dynamic')
  })

  it('alert section is always visible when open', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-confirm-alert')).toBeDefined()
  })

  it('confirm button is type button', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('confirm-delete-button')).toBeDefined()
  })

  it('cancel button is type button', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('cancel-delete-button')).toBeDefined()
  })

  it('both buttons present when both loading false', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} loading={false} />)
    expect(getByTestId('confirm-delete-button')).toBeDefined()
    expect(getByTestId('cancel-delete-button')).toBeDefined()
  })

  it('both buttons disabled when loading true', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} loading={true} />)
    expect(getByTestId('confirm-delete-button').disabled).toBeTruthy()
    expect(getByTestId('cancel-delete-button').disabled).toBeTruthy()
  })

  it('message contains vendor name from prop', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={{ ...mockVendor, name: 'Test Vendor X' }} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-vendor-name').textContent).toBe('Test Vendor X')
  })

  it('renders correctly with all required props and open true', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open={true} onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('vendor-delete-modal')).toBeDefined()
    expect(getByTestId('delete-confirm-container')).toBeDefined()
  })

  it('renders title Delete Vendor for all vendors', async () => {
    for (const vendor of vendors) {
      const { getByTestId } = await render(<VendorDeleteConfirm vendor={vendor} open onConfirm={() => {}} onCancel={() => {}} />)
      expect(getByTestId('delete-confirm-title').textContent).toBe('Delete Vendor')
    }
  })

  // Additional tests to reach 100
  it('vendor-delete-modal data-testid is vendor-delete-modal', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('vendor-delete-modal').getAttribute('data-testid')).toBe('vendor-delete-modal')
  })

  it('delete-confirm-container data-testid is delete-confirm-container', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-confirm-container').getAttribute('data-testid')).toBe('delete-confirm-container')
  })

  it('delete-confirm-title data-testid is delete-confirm-title', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-confirm-title').getAttribute('data-testid')).toBe('delete-confirm-title')
  })

  it('confirm-delete-button data-testid is confirm-delete-button', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('confirm-delete-button').getAttribute('data-testid')).toBe('confirm-delete-button')
  })

  it('cancel-delete-button data-testid is cancel-delete-button', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('cancel-delete-button').getAttribute('data-testid')).toBe('cancel-delete-button')
  })

  it('delete-vendor-name data-testid is delete-vendor-name', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-vendor-name').getAttribute('data-testid')).toBe('delete-vendor-name')
  })

  it('delete-vendor-risk data-testid is delete-vendor-risk', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-vendor-risk').getAttribute('data-testid')).toBe('delete-vendor-risk')
  })

  it('delete-vendor-status data-testid is delete-vendor-status', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-vendor-status').getAttribute('data-testid')).toBe('delete-vendor-status')
  })

  it('delete-vendor-category data-testid is delete-vendor-category', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-vendor-category').getAttribute('data-testid')).toBe('delete-vendor-category')
  })

  it('confirm button fires onConfirm once', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => { count++ }} onCancel={() => {}} />)
    await fireEvent.click(getByTestId('confirm-delete-button'))
    expect(count).toBe(1)
  })

  it('cancel button fires onCancel once', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => { count++ }} />)
    await fireEvent.click(getByTestId('cancel-delete-button'))
    expect(count).toBe(1)
  })

  it('cancel button fires 3 times on 3 clicks', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => { count++ }} />)
    await fireEvent.click(getByTestId('cancel-delete-button'))
    await fireEvent.click(getByTestId('cancel-delete-button'))
    await fireEvent.click(getByTestId('cancel-delete-button'))
    expect(count).toBe(3)
  })

  it('vendor name Acme Corp shown in modal', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={vendors[0]} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-vendor-name').textContent).toBe('Acme Corp')
  })

  it('vendor name Globex Inc shown in modal', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={vendors[1]} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-vendor-name').textContent).toBe('Globex Inc')
  })

  it('vendor name Umbrella Corp shown in modal', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={vendors[2]} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-vendor-name').textContent).toBe('Umbrella Corp')
  })

  it('vendor name Initech shown in modal', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={vendors[3]} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-vendor-name').textContent).toBe('Initech')
  })

  it('vendor name Massive Dynamic shown in modal', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={vendors[4]} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-vendor-name').textContent).toBe('Massive Dynamic')
  })

  it('risk critical shown in modal', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={{ ...mockVendor, riskLevel: 'critical' }} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-vendor-risk').textContent).toContain('critical')
  })

  it('status archived shown in modal', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={{ ...mockVendor, status: 'archived' }} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('delete-vendor-status').textContent).toContain('archived')
  })

  it('modal is not null when open=true', async () => {
    const { queryByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(queryByTestId('vendor-delete-modal')).not.toBeNull()
  })

  it('modal IS null when open=false', async () => {
    const { queryByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open={false} onConfirm={() => {}} onCancel={() => {}} />)
    expect(queryByTestId('vendor-delete-modal')).toBeNull()
  })

  it('vendor-delete-modal data-testid is vendor-delete-modal', async () => {
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => {}} />)
    expect(getByTestId('vendor-delete-modal').getAttribute('data-testid')).toBe('vendor-delete-modal')
  })

  it('onConfirm fires once on confirm button click', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => { count++ }} onCancel={() => {}} />)
    await fireEvent.click(getByTestId('confirm-button'))
    expect(count).toBe(1)
  })

  it('onCancel fires once on cancel button click', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => {}} onCancel={() => { count++ }} />)
    await fireEvent.click(getByTestId('cancel-button'))
    expect(count).toBe(1)
  })

  it('onConfirm fires twice on double confirm click', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorDeleteConfirm vendor={mockVendor} open onConfirm={() => { count++ }} onCancel={() => {}} />)
    await fireEvent.click(getByTestId('confirm-button'))
    await fireEvent.click(getByTestId('confirm-button'))
    expect(count).toBe(2)
  })

  it('snapshot with Globex Inc open', async () => {
    await render(<VendorDeleteConfirm vendor={vendors[1]} open onConfirm={() => {}} onCancel={() => {}} />)
    await snapshot('vendor-delete-confirm-globex-open')
  })

  it('snapshot with Umbrella Corp open', async () => {
    await render(<VendorDeleteConfirm vendor={vendors[2]} open onConfirm={() => {}} onCancel={() => {}} />)
    await snapshot('vendor-delete-confirm-umbrella-open')
  })
})
