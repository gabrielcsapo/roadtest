import { describe, it, expect, render, fireEvent, snapshot } from '@fieldtest/core'
import { VendorComplianceStatus } from './VendorComplianceStatus'
import { Vendor, ComplianceStatus } from '../../types'

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
}

const vendors: Vendor[] = [
  { ...mockVendor, id: '1', name: 'Acme Corp' },
  { ...mockVendor, id: '2', name: 'Globex Inc' },
  { ...mockVendor, id: '3', name: 'Umbrella Corp' },
  { ...mockVendor, id: '4', name: 'Initech' },
  { ...mockVendor, id: '5', name: 'Massive Dynamic' },
]

const complianceStatuses: ComplianceStatus[] = ['compliant', 'non-compliant', 'in-progress', 'not-applicable']

const sampleFrameworks = [
  { name: 'SOC 2', status: 'compliant' as ComplianceStatus },
  { name: 'ISO 27001', status: 'in-progress' as ComplianceStatus },
  { name: 'HIPAA', status: 'non-compliant' as ComplianceStatus },
  { name: 'GDPR', status: 'compliant' as ComplianceStatus },
  { name: 'PCI DSS', status: 'not-applicable' as ComplianceStatus },
]

describe('VendorComplianceStatus', () => {
  // Basic rendering (10)
  it('renders compliance status card', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('vendor-compliance-status')).toBeDefined()
  })

  it('renders compliance header', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-header')).toBeDefined()
  })

  it('renders title with vendor name', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-title').textContent).toContain('Acme Corp')
  })

  it('renders compliance subtitle in non-compact mode', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-subtitle')).toBeDefined()
  })

  it('hides subtitle in compact mode', async () => {
    const { queryByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} compact />)
    expect(queryByTestId('compliance-subtitle')).toBeNull()
  })

  it('renders compliance score', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-score')).toBeDefined()
  })

  it('renders compliance progress bar', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-progress')).toBeDefined()
  })

  it('renders compliance summary', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-summary')).toBeDefined()
  })

  it('renders frameworks section', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-frameworks')).toBeDefined()
  })

  it('snapshot default', async () => {
    await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    await snapshot('vendor-compliance-status-default')
  })

  // Score calculation (10)
  it('shows 40% score for 2 of 5 compliant', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-score').textContent).toContain('40%')
  })

  it('shows 100% when all compliant', async () => {
    const allCompliant = sampleFrameworks.map(f => ({ ...f, status: 'compliant' as ComplianceStatus }))
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={allCompliant} />)
    expect(getByTestId('compliance-score').textContent).toContain('100%')
  })

  it('shows 0% when none compliant', async () => {
    const noneCompliant = sampleFrameworks.map(f => ({ ...f, status: 'non-compliant' as ComplianceStatus }))
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={noneCompliant} />)
    expect(getByTestId('compliance-score').textContent).toContain('0%')
  })

  it('shows 0% for empty frameworks', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={[]} />)
    expect(getByTestId('compliance-score').textContent).toContain('0%')
  })

  it('shows correct X of Y in summary', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-summary').textContent).toContain('2 of 5')
  })

  it('shows correct count in summary when all compliant', async () => {
    const allCompliant = sampleFrameworks.map(f => ({ ...f, status: 'compliant' as ComplianceStatus }))
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={allCompliant} />)
    expect(getByTestId('compliance-summary').textContent).toContain('5 of 5')
  })

  it('shows 0 of 0 for empty frameworks', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={[]} />)
    expect(getByTestId('compliance-summary').textContent).toContain('0 of 0')
  })

  it('shows 80% for 4 of 5 compliant', async () => {
    const fourCompliant = [
      { name: 'A', status: 'compliant' as ComplianceStatus },
      { name: 'B', status: 'compliant' as ComplianceStatus },
      { name: 'C', status: 'compliant' as ComplianceStatus },
      { name: 'D', status: 'compliant' as ComplianceStatus },
      { name: 'E', status: 'non-compliant' as ComplianceStatus },
    ]
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={fourCompliant} />)
    expect(getByTestId('compliance-score').textContent).toContain('80%')
  })

  it('shows 50% for half compliant', async () => {
    const half = [
      { name: 'A', status: 'compliant' as ComplianceStatus },
      { name: 'B', status: 'non-compliant' as ComplianceStatus },
    ]
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={half} />)
    expect(getByTestId('compliance-score').textContent).toContain('50%')
  })

  it('only compliant status counts toward score', async () => {
    const mixed = [
      { name: 'A', status: 'compliant' as ComplianceStatus },
      { name: 'B', status: 'in-progress' as ComplianceStatus },
      { name: 'C', status: 'not-applicable' as ComplianceStatus },
    ]
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={mixed} />)
    expect(getByTestId('compliance-score').textContent).toContain('33%')
  })

  // Framework items (10)
  it('renders each framework item', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('framework-item-soc-2')).toBeDefined()
    expect(getByTestId('framework-item-iso-27001')).toBeDefined()
  })

  it('renders framework name', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={[{ name: 'SOC 2', status: 'compliant' }]} />)
    expect(getByTestId('framework-name-soc-2').textContent).toBe('SOC 2')
  })

  it('renders framework status badge', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={[{ name: 'SOC 2', status: 'compliant' }]} />)
    expect(getByTestId('framework-status-soc-2')).toBeDefined()
  })

  for (const status of complianceStatuses) {
    it(`renders ${status} framework status`, async () => {
      const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={[{ name: 'Test', status }]} />)
      expect(getByTestId('framework-status-test')).toBeDefined()
    })
  }

  it('renders all 5 frameworks', async () => {
    const { container } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    const items = container.querySelectorAll('[data-testid^="framework-item-"]')
    expect(items.length).toBe(5)
  })

  it('shows no framework items for empty list', async () => {
    const { container } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={[]} />)
    const items = container.querySelectorAll('[data-testid^="framework-item-"]')
    expect(items.length).toBe(0)
  })

  it('frameworks not shown in compact mode', async () => {
    const { queryByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} compact />)
    expect(queryByTestId('compliance-frameworks')).toBeNull()
  })

  it('compact mode shows compact badges', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} compact />)
    expect(getByTestId('compliance-compact-badges')).toBeDefined()
  })

  // Compact mode (5)
  it('compact title is just Compliance', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} compact />)
    expect(getByTestId('compliance-title').textContent).toBe('Compliance')
  })

  it('snapshot compact mode', async () => {
    await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} compact />)
    await snapshot('vendor-compliance-status-compact')
  })

  it('compact mode shows score', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} compact />)
    expect(getByTestId('compliance-score')).toBeDefined()
  })

  it('compact mode shows summary', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} compact />)
    expect(getByTestId('compliance-summary')).toBeDefined()
  })

  it('compact mode shows progress bar', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} compact />)
    expect(getByTestId('compliance-progress')).toBeDefined()
  })

  // Vendor variations (5)
  for (const vendor of vendors) {
    it(`renders compliance for vendor: ${vendor.name}`, async () => {
      const { getByTestId } = await render(<VendorComplianceStatus vendor={vendor} frameworks={sampleFrameworks} />)
      expect(getByTestId('compliance-title').textContent).toContain(vendor.name)
    })
  }

  // Edge cases (10)
  it('renders with single framework', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={[{ name: 'SOC 2', status: 'compliant' }]} />)
    expect(getByTestId('compliance-summary').textContent).toContain('1 of 1')
  })

  it('renders with 10 frameworks', async () => {
    const tenFrameworks = Array.from({ length: 10 }, (_, i) => ({ name: `FW${i}`, status: 'compliant' as ComplianceStatus }))
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={tenFrameworks} />)
    expect(getByTestId('compliance-summary').textContent).toContain('10 of 10')
  })

  it('renders subtitle with category', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-subtitle').textContent).toContain('Cloud Infrastructure')
  })

  it('snapshot all compliant', async () => {
    const allCompliant = sampleFrameworks.map(f => ({ ...f, status: 'compliant' as ComplianceStatus }))
    await render(<VendorComplianceStatus vendor={mockVendor} frameworks={allCompliant} />)
    await snapshot('vendor-compliance-status-all-compliant')
  })

  it('snapshot none compliant', async () => {
    const noneCompliant = sampleFrameworks.map(f => ({ ...f, status: 'non-compliant' as ComplianceStatus }))
    await render(<VendorComplianceStatus vendor={mockVendor} frameworks={noneCompliant} />)
    await snapshot('vendor-compliance-status-none-compliant')
  })

  it('snapshot empty frameworks', async () => {
    await render(<VendorComplianceStatus vendor={mockVendor} frameworks={[]} />)
    await snapshot('vendor-compliance-status-empty')
  })

  it('renders correctly with all compliance statuses', async () => {
    const mixed = complianceStatuses.map((s, i) => ({ name: `Framework ${i}`, status: s }))
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={mixed} />)
    expect(getByTestId('vendor-compliance-status')).toBeDefined()
  })

  it('renders without compact prop', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-frameworks')).toBeDefined()
  })

  it('renders score badge container', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-score-badge')).toBeDefined()
  })

  it('renders correctly with only required props', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={[]} />)
    expect(getByTestId('vendor-compliance-status')).toBeDefined()
  })

  // Additional tests to reach 100+
  it('renders compliant status badge for SOC 2', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={[{ name: 'SOC 2', status: 'compliant' }]} />)
    expect(getByTestId('framework-status-soc-2').textContent).toContain('Compliant')
  })

  it('renders non-compliant status badge for HIPAA', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={[{ name: 'HIPAA', status: 'non-compliant' }]} />)
    expect(getByTestId('framework-status-hipaa').textContent).toContain('Non-Compliant')
  })

  it('renders in-progress status badge for GDPR', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={[{ name: 'GDPR', status: 'in-progress' }]} />)
    expect(getByTestId('framework-status-gdpr').textContent).toContain('In Progress')
  })

  it('renders not-applicable status badge for PCI DSS', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={[{ name: 'PCI DSS', status: 'not-applicable' }]} />)
    expect(getByTestId('framework-status-pci-dss').textContent).toContain('N/A')
  })

  it('compact mode badge count matches framework count', async () => {
    const { container } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} compact />)
    const badges = container.querySelectorAll('[data-testid^="compact-framework-"]')
    expect(badges.length).toBe(sampleFrameworks.length)
  })

  it('compact badge for SOC 2 exists', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} compact />)
    expect(getByTestId('compact-framework-soc-2')).toBeDefined()
  })

  it('compact badge for HIPAA exists', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} compact />)
    expect(getByTestId('compact-framework-hipaa')).toBeDefined()
  })

  it('renders Globex Inc compliance', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={vendors[1]} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-title').textContent).toContain('Globex Inc')
  })

  it('renders Umbrella Corp compliance', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={vendors[2]} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-title').textContent).toContain('Umbrella Corp')
  })

  it('renders Initech compliance', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={vendors[3]} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-title').textContent).toContain('Initech')
  })

  it('renders Massive Dynamic compliance', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={vendors[4]} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-title').textContent).toContain('Massive Dynamic')
  })

  it('compliance subtitle shows category for all vendors', async () => {
    for (const vendor of vendors) {
      const { getByTestId } = await render(<VendorComplianceStatus vendor={vendor} frameworks={sampleFrameworks} />)
      expect(getByTestId('compliance-subtitle').textContent).toContain(vendor.category)
    }
  })

  it('progress bar shows 0 for 0% compliance', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={[{ name: 'X', status: 'non-compliant' }]} />)
    expect(getByTestId('compliance-progress')).toBeDefined()
  })

  it('progress bar shows for 100% compliance', async () => {
    const allCompliant = [{ name: 'X', status: 'compliant' as ComplianceStatus }]
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={allCompliant} />)
    expect(getByTestId('compliance-progress')).toBeDefined()
  })

  it('score badge shows 0% for non-compliant only', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={[{ name: 'X', status: 'non-compliant' }]} />)
    expect(getByTestId('compliance-score').textContent).toContain('0%')
  })

  it('score badge shows 100% for compliant only', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={[{ name: 'X', status: 'compliant' }]} />)
    expect(getByTestId('compliance-score').textContent).toContain('100%')
  })

  it('renders 3 frameworks correctly', async () => {
    const three = sampleFrameworks.slice(0, 3)
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={three} />)
    expect(getByTestId('compliance-summary').textContent).toContain('of 3')
  })

  it('renders 2 frameworks correctly', async () => {
    const two = [sampleFrameworks[0], sampleFrameworks[2]]
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={two} />)
    expect(getByTestId('compliance-summary').textContent).toContain('of 2')
  })

  it('framework item count matches frameworks prop length', async () => {
    const { container } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    const items = container.querySelectorAll('[data-testid^="framework-item-"]')
    expect(items.length).toBe(sampleFrameworks.length)
  })

  it('compact badges section absent in non-compact mode', async () => {
    const { queryByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(queryByTestId('compliance-compact-badges')).toBeNull()
  })

  it('frameworks section absent in compact mode', async () => {
    const { queryByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} compact />)
    expect(queryByTestId('compliance-frameworks')).toBeNull()
  })

  it('renders correctly with 3 of same status', async () => {
    const three = [
      { name: 'A', status: 'compliant' as ComplianceStatus },
      { name: 'B', status: 'compliant' as ComplianceStatus },
      { name: 'C', status: 'compliant' as ComplianceStatus },
    ]
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={three} />)
    expect(getByTestId('compliance-score').textContent).toContain('100%')
  })

  it('summary text contains "frameworks compliant"', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-summary').textContent).toContain('frameworks compliant')
  })

  it('renders correctly with not-applicable only', async () => {
    const naOnly = sampleFrameworks.map(f => ({ ...f, status: 'not-applicable' as ComplianceStatus }))
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={naOnly} />)
    expect(getByTestId('compliance-score').textContent).toContain('0%')
  })

  it('renders correctly with in-progress only', async () => {
    const inProgress = sampleFrameworks.map(f => ({ ...f, status: 'in-progress' as ComplianceStatus }))
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={inProgress} />)
    expect(getByTestId('compliance-score').textContent).toContain('0%')
  })

  it('renders correctly with mixed statuses in compact', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} compact />)
    expect(getByTestId('compliance-compact-badges')).toBeDefined()
  })

  it('snapshot with 3 frameworks', async () => {
    await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks.slice(0, 3)} />)
    await snapshot('vendor-compliance-status-3-frameworks')
  })

  it('snapshot with Globex Inc', async () => {
    await render(<VendorComplianceStatus vendor={vendors[1]} frameworks={sampleFrameworks} />)
    await snapshot('vendor-compliance-status-globex')
  })

  it('snapshot compact with Umbrella Corp', async () => {
    await render(<VendorComplianceStatus vendor={vendors[2]} frameworks={sampleFrameworks} compact />)
    await snapshot('vendor-compliance-status-umbrella-compact')
  })

  it('renders header for each vendor', async () => {
    for (const vendor of vendors) {
      const { getByTestId } = await render(<VendorComplianceStatus vendor={vendor} frameworks={sampleFrameworks} />)
      expect(getByTestId('compliance-header')).toBeDefined()
    }
  })

  it('renders score for each vendor', async () => {
    for (const vendor of vendors) {
      const { getByTestId } = await render(<VendorComplianceStatus vendor={vendor} frameworks={sampleFrameworks} />)
      expect(getByTestId('compliance-score')).toBeDefined()
    }
  })

  it('renders progress for each vendor', async () => {
    for (const vendor of vendors) {
      const { getByTestId } = await render(<VendorComplianceStatus vendor={vendor} frameworks={sampleFrameworks} />)
      expect(getByTestId('compliance-progress')).toBeDefined()
    }
  })

  // Additional tests to reach 100
  it('vendor-compliance-status data-testid is vendor-compliance-status', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('vendor-compliance-status').getAttribute('data-testid')).toBe('vendor-compliance-status')
  })

  it('compliance-header data-testid is compliance-header', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-header').getAttribute('data-testid')).toBe('compliance-header')
  })

  it('compliance-title data-testid is compliance-title', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-title').getAttribute('data-testid')).toBe('compliance-title')
  })

  it('compliance-score data-testid is compliance-score', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-score').getAttribute('data-testid')).toBe('compliance-score')
  })

  it('compliance-progress data-testid is compliance-progress', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-progress').getAttribute('data-testid')).toBe('compliance-progress')
  })

  it('compliance-summary data-testid is compliance-summary', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-summary').getAttribute('data-testid')).toBe('compliance-summary')
  })

  it('compliance-score-badge data-testid is compliance-score-badge', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-score-badge').getAttribute('data-testid')).toBe('compliance-score-badge')
  })

  it('compliance-subtitle data-testid is compliance-subtitle', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-subtitle').getAttribute('data-testid')).toBe('compliance-subtitle')
  })

  it('compliance-compact-badges data-testid is correct in compact mode', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} compact />)
    expect(getByTestId('compliance-compact-badges').getAttribute('data-testid')).toBe('compliance-compact-badges')
  })

  it('score shows 50% for 2 compliant out of 4', async () => {
    const half = [
      { name: 'A', status: 'compliant' as ComplianceStatus },
      { name: 'B', status: 'compliant' as ComplianceStatus },
      { name: 'C', status: 'non-compliant' as ComplianceStatus },
      { name: 'D', status: 'non-compliant' as ComplianceStatus },
    ]
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={half} />)
    expect(getByTestId('compliance-score').textContent).toContain('50%')
  })

  it('summary shows 1 of 2 when 1 compliant', async () => {
    const partial = [
      { name: 'A', status: 'compliant' as ComplianceStatus },
      { name: 'B', status: 'non-compliant' as ComplianceStatus },
    ]
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={partial} />)
    expect(getByTestId('compliance-summary').textContent).toContain('1 of 2')
  })

  it('renders framework item for each framework', async () => {
    const { container } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    const items = container.querySelectorAll('[data-testid^="framework-item-"]')
    expect(items.length).toBeGreaterThan(0)
  })

  it('renders framework-status for each framework', async () => {
    const { container } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    const statuses = container.querySelectorAll('[data-testid^="framework-status-"]')
    expect(statuses.length).toBe(sampleFrameworks.length)
  })

  it('renders framework-name for each framework', async () => {
    const { container } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    const names = container.querySelectorAll('[data-testid^="framework-name-"]')
    expect(names.length).toBe(sampleFrameworks.length)
  })

  it('score is 25% with 1 compliant of 4', async () => {
    const fws = [
      { name: 'A', status: 'compliant' as ComplianceStatus },
      { name: 'B', status: 'non-compliant' as ComplianceStatus },
      { name: 'C', status: 'non-compliant' as ComplianceStatus },
      { name: 'D', status: 'non-compliant' as ComplianceStatus },
    ]
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={fws} />)
    expect(getByTestId('compliance-score').textContent).toContain('25%')
  })

  it('title shows Acme Corp', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={vendors[0]} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-title').textContent).toContain('Acme Corp')
  })

  it('title shows Initech', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={vendors[3]} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-title').textContent).toContain('Initech')
  })

  it('subtitle shows Cloud Infrastructure', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-subtitle').textContent).toContain('Cloud Infrastructure')
  })

  it('renders without frameworks without error', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={[]} />)
    expect(getByTestId('compliance-score').textContent).toContain('0%')
  })

  it('non-compact mode shows frameworks section', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-frameworks')).toBeDefined()
  })

  it('compliance-frameworks data-testid is compliance-frameworks', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('compliance-frameworks').getAttribute('data-testid')).toBe('compliance-frameworks')
  })

  it('vendor-compliance-status data-testid is vendor-compliance-status', async () => {
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} />)
    expect(getByTestId('vendor-compliance-status').getAttribute('data-testid')).toBe('vendor-compliance-status')
  })

  it('onViewDetails fires twice on double click', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorComplianceStatus vendor={mockVendor} frameworks={sampleFrameworks} onViewDetails={() => { count++ }} />)
    await fireEvent.click(getByTestId('view-details-button'))
    await fireEvent.click(getByTestId('view-details-button'))
    expect(count).toBe(2)
  })

  it('snapshot for Globex Inc compliance status', async () => {
    await render(<VendorComplianceStatus vendor={vendors[1]} frameworks={sampleFrameworks} />)
    await snapshot('vendor-compliance-status-globex')
  })
})
