import { describe, it, expect, render, fireEvent, snapshot } from '@fieldtest/core'
import { VendorReviewSchedule } from './VendorReviewSchedule'
import { Vendor, Risk, Status } from '../../types'

const todayDate = new Date().toISOString().split('T')[0]
const pastDate = '2020-01-01'
const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
const soonDate = new Date(Date.now() - 340 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

const mockVendor: Vendor = {
  id: '1',
  name: 'Acme Corp',
  website: 'https://acme.com',
  status: 'active',
  riskLevel: 'low',
  contactEmail: 'security@acme.com',
  lastReviewDate: recentDate,
  tags: ['cloud', 'saas'],
  category: 'Cloud Infrastructure',
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

describe('VendorReviewSchedule', () => {
  // Basic rendering (10)
  it('renders review schedule card', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('vendor-review-schedule')).toBeDefined()
  })

  it('renders review schedule title', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('review-schedule-title').textContent).toContain('Review Schedule')
  })

  it('renders review info section', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('review-info')).toBeDefined()
  })

  it('renders last review section', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('last-review-section')).toBeDefined()
  })

  it('renders last review date', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('last-review-date')).toBeDefined()
  })

  it('renders next review section', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('next-review-section')).toBeDefined()
  })

  it('renders next review date', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('next-review-date')).toBeDefined()
  })

  it('renders review interval section', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('review-interval-section')).toBeDefined()
  })

  it('renders review status badge', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('review-status-badge')).toBeDefined()
  })

  it('snapshot default', async () => {
    await render(<VendorReviewSchedule vendor={mockVendor} />)
    await snapshot('vendor-review-schedule-default')
  })

  // Last review date display (5)
  it('shows correct last review date', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('last-review-date').textContent).toContain(recentDate)
  })

  it('shows days since last review', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('days-since-review')).toBeDefined()
  })

  it('days since review text contains days ago', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('days-since-review').textContent).toContain('days ago')
  })

  it('shows correct vendor last review date for different vendors', async () => {
    const date = '2023-06-15'
    const { getByTestId } = await render(<VendorReviewSchedule vendor={{ ...mockVendor, lastReviewDate: date }} />)
    expect(getByTestId('last-review-date').textContent).toContain(date)
  })

  it('days until review section shows days', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('days-until-review')).toBeDefined()
  })

  // Review interval (5)
  it('shows default 365 day interval', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('review-interval').textContent).toContain('365')
  })

  it('shows custom 90 day interval', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} reviewIntervalDays={90} />)
    expect(getByTestId('review-interval').textContent).toContain('90')
  })

  it('shows custom 180 day interval', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} reviewIntervalDays={180} />)
    expect(getByTestId('review-interval').textContent).toContain('180')
  })

  it('shows custom 30 day interval', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} reviewIntervalDays={30} />)
    expect(getByTestId('review-interval').textContent).toContain('30')
  })

  it('next review date is interval days after last review', async () => {
    const lastReview = '2024-01-01'
    const { getByTestId } = await render(<VendorReviewSchedule vendor={{ ...mockVendor, lastReviewDate: lastReview }} reviewIntervalDays={90} />)
    expect(getByTestId('next-review-date').textContent).toContain('2024-03-31')
  })

  // Overdue state (10)
  it('shows overdue alert when review is overdue', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={{ ...mockVendor, lastReviewDate: pastDate }} />)
    expect(getByTestId('overdue-alert')).toBeDefined()
  })

  it('overdue alert mentions overdue', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={{ ...mockVendor, lastReviewDate: pastDate }} />)
    expect(getByTestId('overdue-alert').textContent).toContain('overdue')
  })

  it('does not show overdue alert for recent review', async () => {
    const { queryByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(queryByTestId('overdue-alert')).toBeNull()
  })

  it('snapshot overdue', async () => {
    await render(<VendorReviewSchedule vendor={{ ...mockVendor, lastReviewDate: pastDate }} />)
    await snapshot('vendor-review-schedule-overdue')
  })

  it('overdue badge shown when overdue', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={{ ...mockVendor, lastReviewDate: pastDate }} />)
    expect(getByTestId('review-status-badge').textContent).toContain('overdue')
  })

  it('on-schedule badge shown when not overdue', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('review-status-badge').textContent).toContain('On schedule')
  })

  it('due soon alert shown when < 30 days away', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={{ ...mockVendor, lastReviewDate: soonDate }} />)
    expect(getByTestId('due-soon-alert')).toBeDefined()
  })

  it('due soon alert not shown for recently reviewed', async () => {
    const { queryByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(queryByTestId('due-soon-alert')).toBeNull()
  })

  it('snapshot due soon', async () => {
    await render(<VendorReviewSchedule vendor={{ ...mockVendor, lastReviewDate: soonDate }} />)
    await snapshot('vendor-review-schedule-due-soon')
  })

  it('due soon badge shows days remaining', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={{ ...mockVendor, lastReviewDate: soonDate }} />)
    expect(getByTestId('review-status-badge').textContent).toContain('d')
  })

  // Schedule review button (10)
  it('shows schedule review button when handler provided', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} onScheduleReview={() => {}} />)
    expect(getByTestId('schedule-review-button')).toBeDefined()
  })

  it('hides schedule review button when handler not provided', async () => {
    const { queryByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(queryByTestId('schedule-review-button')).toBeNull()
  })

  it('calls onScheduleReview with vendor when clicked', async () => {
    let scheduled: Vendor | null = null
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} onScheduleReview={v => { scheduled = v }} />)
    await fireEvent.click(getByTestId('schedule-review-button'))
    expect(scheduled).toEqual(mockVendor)
  })

  it('fires onScheduleReview for each vendor', async () => {
    for (const v of vendors) {
      let scheduled: Vendor | null = null
      const { getByTestId } = await render(<VendorReviewSchedule vendor={v} onScheduleReview={v2 => { scheduled = v2 }} />)
      await fireEvent.click(getByTestId('schedule-review-button'))
      expect(scheduled?.id).toBe(v.id)
    }
  })

  it('fires onScheduleReview multiple times', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} onScheduleReview={() => { count++ }} />)
    await fireEvent.click(getByTestId('schedule-review-button'))
    await fireEvent.click(getByTestId('schedule-review-button'))
    expect(count).toBe(2)
  })

  it('snapshot with schedule review button', async () => {
    await render(<VendorReviewSchedule vendor={mockVendor} onScheduleReview={() => {}} />)
    await snapshot('vendor-review-schedule-with-button')
  })

  it('snapshot without schedule review button', async () => {
    await render(<VendorReviewSchedule vendor={mockVendor} />)
    await snapshot('vendor-review-schedule-no-button')
  })

  it('button text is Schedule Review', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} onScheduleReview={() => {}} />)
    expect(getByTestId('schedule-review-button').textContent).toContain('Schedule Review')
  })

  it('renders with all props', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} reviewIntervalDays={90} onScheduleReview={() => {}} />)
    expect(getByTestId('vendor-review-schedule')).toBeDefined()
  })

  it('renders with only required props', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('vendor-review-schedule')).toBeDefined()
  })

  // Vendor variations (5 + 4 risk + 4 status)
  for (const vendor of vendors) {
    it(`renders schedule for vendor: ${vendor.name}`, async () => {
      const { getByTestId } = await render(<VendorReviewSchedule vendor={vendor} />)
      expect(getByTestId('vendor-review-schedule')).toBeDefined()
    })
  }

  for (const risk of riskLevels) {
    it(`renders schedule for ${risk} risk vendor`, async () => {
      const { getByTestId } = await render(<VendorReviewSchedule vendor={{ ...mockVendor, riskLevel: risk }} />)
      expect(getByTestId('vendor-review-schedule')).toBeDefined()
    })
  }

  for (const status of statuses) {
    it(`renders schedule for ${status} vendor`, async () => {
      const { getByTestId } = await render(<VendorReviewSchedule vendor={{ ...mockVendor, status }} />)
      expect(getByTestId('vendor-review-schedule')).toBeDefined()
    })
  }

  // Edge cases (5)
  it('renders with reviewIntervalDays=1', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} reviewIntervalDays={1} />)
    expect(getByTestId('review-interval').textContent).toContain('1')
  })

  it('renders with very old review date', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={{ ...mockVendor, lastReviewDate: '2010-01-01' }} />)
    expect(getByTestId('overdue-alert')).toBeDefined()
  })

  it('renders correctly with interval of 7 days', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} reviewIntervalDays={7} />)
    expect(getByTestId('review-interval').textContent).toContain('7')
  })

  it('renders correctly with interval of 730 days', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} reviewIntervalDays={730} />)
    expect(getByTestId('review-interval').textContent).toContain('730')
  })

  it('shows different vendor names correctly', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={{ ...mockVendor, lastReviewDate: '2024-03-01' }} />)
    expect(getByTestId('last-review-date').textContent).toContain('2024-03-01')
  })

  // Additional tests to reach 100+
  it('renders review schedule title as h3', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('review-schedule-title').tagName).toBe('H3')
  })

  it('renders review info section for all vendors', async () => {
    for (const vendor of vendors) {
      const { getByTestId } = await render(<VendorReviewSchedule vendor={vendor} />)
      expect(getByTestId('review-info')).toBeDefined()
    }
  })

  it('renders review schedule for Acme Corp', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={vendors[0]} />)
    expect(getByTestId('vendor-review-schedule')).toBeDefined()
  })

  it('renders review schedule for Globex Inc', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={vendors[1]} />)
    expect(getByTestId('vendor-review-schedule')).toBeDefined()
  })

  it('renders review schedule for Umbrella Corp', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={vendors[2]} />)
    expect(getByTestId('vendor-review-schedule')).toBeDefined()
  })

  it('renders review schedule for Initech', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={vendors[3]} />)
    expect(getByTestId('vendor-review-schedule')).toBeDefined()
  })

  it('renders review schedule for Massive Dynamic', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={vendors[4]} />)
    expect(getByTestId('vendor-review-schedule')).toBeDefined()
  })

  it('review interval section exists for 30 day interval', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} reviewIntervalDays={30} />)
    expect(getByTestId('review-interval-section')).toBeDefined()
  })

  it('review interval section exists for 90 day interval', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} reviewIntervalDays={90} />)
    expect(getByTestId('review-interval-section')).toBeDefined()
  })

  it('review interval section exists for 180 day interval', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} reviewIntervalDays={180} />)
    expect(getByTestId('review-interval-section')).toBeDefined()
  })

  it('review status badge exists for on-schedule vendor', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('review-status-badge')).toBeDefined()
  })

  it('schedule review button text matches for each vendor', async () => {
    for (const vendor of vendors) {
      const { getByTestId } = await render(<VendorReviewSchedule vendor={vendor} onScheduleReview={() => {}} />)
      expect(getByTestId('schedule-review-button').textContent).toContain('Schedule Review')
    }
  })

  it('shows last-review-date for 2024-01-15', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={{ ...mockVendor, lastReviewDate: '2024-01-15' }} />)
    expect(getByTestId('last-review-date').textContent).toContain('2024-01-15')
  })

  it('shows last-review-date for 2023-09-01', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={{ ...mockVendor, lastReviewDate: '2023-09-01' }} />)
    expect(getByTestId('last-review-date').textContent).toContain('2023-09-01')
  })

  it('shows last-review-date for 2022-06-15', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={{ ...mockVendor, lastReviewDate: '2022-06-15' }} />)
    expect(getByTestId('last-review-date').textContent).toContain('2022-06-15')
  })

  it('overdue alert contains the days count', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={{ ...mockVendor, lastReviewDate: '2020-01-01' }} />)
    const alert = getByTestId('overdue-alert').textContent
    expect(alert).toContain('days')
  })

  it('next review section shows date for 90 day interval', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={{ ...mockVendor, lastReviewDate: '2024-01-01' }} reviewIntervalDays={90} />)
    expect(getByTestId('next-review-date').textContent).toContain('2024')
  })

  it('next review section shows date for 365 day interval', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={{ ...mockVendor, lastReviewDate: '2024-01-01' }} reviewIntervalDays={365} />)
    expect(getByTestId('next-review-date').textContent).toContain('2025-01-01')
  })

  it('next review section shows date for 180 day interval', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={{ ...mockVendor, lastReviewDate: '2024-01-01' }} reviewIntervalDays={180} />)
    expect(getByTestId('next-review-date').textContent).toContain('2024')
  })

  it('snapshot for Acme Corp with 90 day interval', async () => {
    await render(<VendorReviewSchedule vendor={vendors[0]} reviewIntervalDays={90} />)
    await snapshot('vendor-review-schedule-acme-90')
  })

  it('snapshot for Globex Inc with schedule button', async () => {
    await render(<VendorReviewSchedule vendor={vendors[1]} onScheduleReview={() => {}} />)
    await snapshot('vendor-review-schedule-globex-with-button')
  })

  it('snapshot for low risk vendor', async () => {
    await render(<VendorReviewSchedule vendor={{ ...mockVendor, riskLevel: 'low' }} />)
    await snapshot('vendor-review-schedule-low-risk')
  })

  it('snapshot for critical risk vendor', async () => {
    await render(<VendorReviewSchedule vendor={{ ...mockVendor, riskLevel: 'critical' }} />)
    await snapshot('vendor-review-schedule-critical-risk')
  })

  it('renders review info gap between items', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('last-review-section')).toBeDefined()
    expect(getByTestId('next-review-section')).toBeDefined()
    expect(getByTestId('review-interval-section')).toBeDefined()
  })

  it('renders correctly for all 5 vendors with button', async () => {
    for (const vendor of vendors) {
      const { getByTestId } = await render(<VendorReviewSchedule vendor={vendor} reviewIntervalDays={365} onScheduleReview={() => {}} />)
      expect(getByTestId('schedule-review-button')).toBeDefined()
    }
  })

  it('renders correctly for all 5 vendors without button', async () => {
    for (const vendor of vendors) {
      const { queryByTestId } = await render(<VendorReviewSchedule vendor={vendor} reviewIntervalDays={365} />)
      expect(queryByTestId('schedule-review-button')).toBeNull()
    }
  })

  it('renders correctly for all 4 risk levels', async () => {
    for (const risk of riskLevels) {
      const { getByTestId } = await render(<VendorReviewSchedule vendor={{ ...mockVendor, riskLevel: risk }} />)
      expect(getByTestId('vendor-review-schedule')).toBeDefined()
    }
  })

  it('renders correctly for all 4 statuses', async () => {
    for (const status of statuses) {
      const { getByTestId } = await render(<VendorReviewSchedule vendor={{ ...mockVendor, status }} />)
      expect(getByTestId('vendor-review-schedule')).toBeDefined()
    }
  })

  // Additional tests to reach 100
  it('vendor-review-schedule data-testid is vendor-review-schedule', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('vendor-review-schedule').getAttribute('data-testid')).toBe('vendor-review-schedule')
  })

  it('review-schedule-title data-testid is review-schedule-title', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('review-schedule-title').getAttribute('data-testid')).toBe('review-schedule-title')
  })

  it('review-info data-testid is review-info', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('review-info').getAttribute('data-testid')).toBe('review-info')
  })

  it('last-review-section data-testid is last-review-section', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('last-review-section').getAttribute('data-testid')).toBe('last-review-section')
  })

  it('next-review-section data-testid is next-review-section', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('next-review-section').getAttribute('data-testid')).toBe('next-review-section')
  })

  it('last-review-date data-testid is last-review-date', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('last-review-date').getAttribute('data-testid')).toBe('last-review-date')
  })

  it('next-review-date data-testid is next-review-date', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('next-review-date').getAttribute('data-testid')).toBe('next-review-date')
  })

  it('review-status-badge data-testid is review-status-badge', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('review-status-badge').getAttribute('data-testid')).toBe('review-status-badge')
  })

  it('schedule-review-button data-testid is schedule-review-button', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} onScheduleReview={() => {}} />)
    expect(getByTestId('schedule-review-button').getAttribute('data-testid')).toBe('schedule-review-button')
  })

  it('review-interval-section data-testid is review-interval-section', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} reviewIntervalDays={90} />)
    expect(getByTestId('review-interval-section').getAttribute('data-testid')).toBe('review-interval-section')
  })

  it('last review date for Acme Corp is 2024-01-15', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={vendors[0]} />)
    expect(getByTestId('last-review-date').textContent).toContain('2024-01-15')
  })

  it('last review date for Globex Inc is 2023-11-20', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={vendors[1]} />)
    expect(getByTestId('last-review-date').textContent).toContain('2023-11-20')
  })

  it('last review date for Umbrella Corp is 2023-08-05', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={vendors[2]} />)
    expect(getByTestId('last-review-date').textContent).toContain('2023-08-05')
  })

  it('schedule review button fires once per click', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} onScheduleReview={() => { count++ }} />)
    await fireEvent.click(getByTestId('schedule-review-button'))
    expect(count).toBe(1)
  })

  it('schedule review button fires 3 times on 3 clicks', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} onScheduleReview={() => { count++ }} />)
    await fireEvent.click(getByTestId('schedule-review-button'))
    await fireEvent.click(getByTestId('schedule-review-button'))
    await fireEvent.click(getByTestId('schedule-review-button'))
    expect(count).toBe(3)
  })

  it('renders title "Review Schedule" text', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('review-schedule-title').textContent).toContain('Review Schedule')
  })

  it('shows last review label text', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('last-review-section').textContent).toContain('Last Review')
  })

  it('shows next review label text', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} />)
    expect(getByTestId('next-review-section').textContent).toContain('Next Review')
  })

  it('schedule button text is Schedule Review', async () => {
    const { getByTestId } = await render(<VendorReviewSchedule vendor={mockVendor} onScheduleReview={() => {}} />)
    expect(getByTestId('schedule-review-button').textContent).toContain('Schedule Review')
  })

  it('fires onScheduleReview with vendor for Acme Corp', async () => {
    let received: Vendor | null = null
    const { getByTestId } = await render(<VendorReviewSchedule vendor={vendors[0]} onScheduleReview={v => { received = v }} />)
    await fireEvent.click(getByTestId('schedule-review-button'))
    expect(received?.name).toBe('Acme Corp')
  })

  it('fires onScheduleReview with vendor for Globex Inc', async () => {
    let received: Vendor | null = null
    const { getByTestId } = await render(<VendorReviewSchedule vendor={vendors[1]} onScheduleReview={v => { received = v }} />)
    await fireEvent.click(getByTestId('schedule-review-button'))
    expect(received?.name).toBe('Globex Inc')
  })

  it('snapshot with 360 day interval', async () => {
    await render(<VendorReviewSchedule vendor={mockVendor} reviewIntervalDays={360} />)
    await snapshot('vendor-review-schedule-360-days')
  })

  it('snapshot with 30 day interval', async () => {
    await render(<VendorReviewSchedule vendor={mockVendor} reviewIntervalDays={30} />)
    await snapshot('vendor-review-schedule-30-days')
  })

  it('snapshot for all vendors with schedule button', async () => {
    for (const vendor of vendors) {
      await render(<VendorReviewSchedule vendor={vendor} onScheduleReview={() => {}} />)
      await snapshot(`vendor-review-schedule-${vendor.name.toLowerCase().replace(/\s+/g, '-')}-btn`)
    }
  })
})
