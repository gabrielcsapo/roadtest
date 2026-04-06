import { describe, it, expect, render, snapshot } from '@viewtest/core'
import { PolicyAcceptanceBar } from './PolicyAcceptanceBar'

const rates = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
const sizes = ['sm', 'md', 'lg'] as const

describe('PolicyAcceptanceBar', () => {
  // Basic rendering
  it('renders the container', async () => {
    const { getByTestId } = await render(<PolicyAcceptanceBar rate={75} />)
    expect(getByTestId('acceptance-bar-container')).toBeDefined()
  })

  it('renders the acceptance label', async () => {
    const { getByTestId } = await render(<PolicyAcceptanceBar rate={75} />)
    expect(getByTestId('acceptance-label')).toBeDefined()
  })

  it('renders the progress bar', async () => {
    const { getByTestId } = await render(<PolicyAcceptanceBar rate={75} />)
    expect(getByTestId('acceptance-progress')).toBeDefined()
  })

  it('renders the percentage display', async () => {
    const { getByTestId } = await render(<PolicyAcceptanceBar rate={75} />)
    expect(getByTestId('acceptance-percentage').textContent).toContain('75')
  })

  // Parameterized: rate × size (33 tests)
  rates.forEach((rate) =>
    sizes.forEach((size) =>
      it(`renders rate ${rate} at size ${size}`, async () => {
        const { getByTestId } = await render(<PolicyAcceptanceBar rate={rate} size={size} />)
        const container = getByTestId('acceptance-bar-container')
        expect(container).toBeDefined()
        expect(container.getAttribute('data-rate')).toBe(String(rate))
        expect(container.getAttribute('data-size')).toBe(size)
      })
    )
  )

  // Color thresholds: green >= 80
  ;([80, 85, 90, 95, 100] as number[]).map((rate) =>
    it(`shows green color for rate ${rate}`, async () => {
      const { getByTestId } = await render(<PolicyAcceptanceBar rate={rate} />)
      expect(getByTestId('acceptance-status-label').textContent).toContain('Good')
    })
  )

  // Color thresholds: yellow >= 60 < 80
  ;([60, 65, 70, 75, 79] as number[]).map((rate) =>
    it(`shows yellow color for rate ${rate}`, async () => {
      const { getByTestId } = await render(<PolicyAcceptanceBar rate={rate} />)
      expect(getByTestId('acceptance-status-label').textContent).toContain('Fair')
    })
  )

  // Color thresholds: red < 60
  ;([0, 10, 20, 30, 40, 50, 59] as number[]).map((rate) =>
    it(`shows red color for rate ${rate}`, async () => {
      const { getByTestId } = await render(<PolicyAcceptanceBar rate={rate} />)
      expect(getByTestId('acceptance-status-label').textContent).toContain('Low')
    })
  )

  // With counts
  it('shows user counts when totalUsers and acceptedCount are provided', async () => {
    const { getByTestId } = await render(
      <PolicyAcceptanceBar rate={80} totalUsers={100} acceptedCount={80} />
    )
    expect(getByTestId('acceptance-counts')).toBeDefined()
  })

  it('shows correct count text', async () => {
    const { getByTestId } = await render(
      <PolicyAcceptanceBar rate={80} totalUsers={100} acceptedCount={80} />
    )
    expect(getByTestId('acceptance-counts').textContent).toContain('80/100')
  })

  it('does not show counts when totalUsers is not provided', async () => {
    const { queryByTestId } = await render(<PolicyAcceptanceBar rate={80} />)
    expect(queryByTestId('acceptance-counts')).toBeNull()
  })

  it('does not show counts when acceptedCount is not provided', async () => {
    const { queryByTestId } = await render(<PolicyAcceptanceBar rate={80} totalUsers={100} />)
    expect(queryByTestId('acceptance-counts')).toBeNull()
  })

  it('shows 0/0 users when both counts are zero', async () => {
    const { getByTestId } = await render(
      <PolicyAcceptanceBar rate={0} totalUsers={0} acceptedCount={0} />
    )
    expect(getByTestId('acceptance-counts').textContent).toContain('0/0')
  })

  it('shows counts with large numbers', async () => {
    const { getByTestId } = await render(
      <PolicyAcceptanceBar rate={95} totalUsers={10000} acceptedCount={9500} />
    )
    expect(getByTestId('acceptance-counts').textContent).toContain('9500/10000')
  })

  // Size variants
  it('renders sm size correctly', async () => {
    const { getByTestId } = await render(<PolicyAcceptanceBar rate={75} size="sm" />)
    expect(getByTestId('acceptance-bar-container').getAttribute('data-size')).toBe('sm')
  })

  it('renders md size correctly', async () => {
    const { getByTestId } = await render(<PolicyAcceptanceBar rate={75} size="md" />)
    expect(getByTestId('acceptance-bar-container').getAttribute('data-size')).toBe('md')
  })

  it('renders lg size correctly', async () => {
    const { getByTestId } = await render(<PolicyAcceptanceBar rate={75} size="lg" />)
    expect(getByTestId('acceptance-bar-container').getAttribute('data-size')).toBe('lg')
  })

  it('defaults to md size when size not provided', async () => {
    const { getByTestId } = await render(<PolicyAcceptanceBar rate={75} />)
    expect(getByTestId('acceptance-bar-container').getAttribute('data-size')).toBe('md')
  })

  // Edge cases
  it('clamps rate above 100 to 100', async () => {
    const { getByTestId } = await render(<PolicyAcceptanceBar rate={150} />)
    expect(getByTestId('acceptance-percentage').textContent).toContain('100')
  })

  it('clamps rate below 0 to 0', async () => {
    const { getByTestId } = await render(<PolicyAcceptanceBar rate={-10} />)
    expect(getByTestId('acceptance-percentage').textContent).toContain('0')
  })

  it('renders at exactly 80 as green threshold', async () => {
    const { getByTestId } = await render(<PolicyAcceptanceBar rate={80} />)
    expect(getByTestId('acceptance-status-label').textContent).toContain('Good')
  })

  it('renders at exactly 60 as yellow threshold', async () => {
    const { getByTestId } = await render(<PolicyAcceptanceBar rate={60} />)
    expect(getByTestId('acceptance-status-label').textContent).toContain('Fair')
  })

  it('renders at 79 below green threshold', async () => {
    const { getByTestId } = await render(<PolicyAcceptanceBar rate={79} />)
    expect(getByTestId('acceptance-status-label').textContent).toContain('Fair')
  })

  it('renders at 59 below yellow threshold', async () => {
    const { getByTestId } = await render(<PolicyAcceptanceBar rate={59} />)
    expect(getByTestId('acceptance-status-label').textContent).toContain('Low')
  })

  // Snapshots
  it('matches snapshot at rate 100', async () => {
    const { container } = await render(<PolicyAcceptanceBar rate={100} size="md" />)
    await snapshot('acceptance-bar-100')
  })

  it('matches snapshot at rate 70', async () => {
    const { container } = await render(<PolicyAcceptanceBar rate={70} size="md" />)
    await snapshot('acceptance-bar-70')
  })

  it('matches snapshot at rate 40', async () => {
    const { container } = await render(<PolicyAcceptanceBar rate={40} size="md" />)
    await snapshot('acceptance-bar-40')
  })

  it('matches snapshot with counts', async () => {
    const { container } = await render(
      <PolicyAcceptanceBar rate={85} totalUsers={200} acceptedCount={170} size="lg" />
    )
    await snapshot('acceptance-bar-with-counts')
  })

  // Status label tests
  it('shows status label text', async () => {
    const { getByTestId } = await render(<PolicyAcceptanceBar rate={90} />)
    expect(getByTestId('acceptance-status-label')).toBeDefined()
  })

  it('shows rate in percentage element', async () => {
    const { getByTestId } = await render(<PolicyAcceptanceBar rate={55} />)
    expect(getByTestId('acceptance-percentage').textContent).toContain('55')
  })

  // Additional parameterized tests for all rates at sm size
  rates.forEach((rate) =>
    it(`acceptance bar shows correct percentage for rate ${rate} at sm size`, async () => {
      const { getByTestId } = await render(<PolicyAcceptanceBar rate={rate} size="sm" />)
      expect(getByTestId('acceptance-percentage').textContent).toContain(String(rate))
    })
  )

  // Additional combinations with counts
  ;([0, 50, 100] as number[]).map((rate) =>
    it(`shows user counts correctly at rate ${rate}`, async () => {
      const total = 100
      const accepted = rate
      const { getByTestId } = await render(
        <PolicyAcceptanceBar rate={rate} totalUsers={total} acceptedCount={accepted} />
      )
      expect(getByTestId('acceptance-counts').textContent).toContain(`${accepted}/${total}`)
    })
  )

  // Additional rates at md size with counts
  rates.forEach((rate) =>
    it(`acceptance bar percentage element exists for rate ${rate}`, async () => {
      const { getByTestId } = await render(<PolicyAcceptanceBar rate={rate} size="md" totalUsers={100} acceptedCount={rate} />)
      expect(getByTestId('acceptance-percentage')).toBeDefined()
    })
  )

  // All rates at lg size
  rates.forEach((rate) =>
    it(`renders acceptance bar at rate ${rate} lg size`, async () => {
      const { getByTestId } = await render(<PolicyAcceptanceBar rate={rate} size="lg" />)
      expect(getByTestId('acceptance-bar-container').getAttribute('data-size')).toBe('lg')
    })
  )

  // Verify progress bar exists at all rates and sizes
  rates.forEach((rate) =>
    sizes.forEach((size) =>
      it(`progress bar exists at rate ${rate} size ${size}`, async () => {
        const { getByTestId } = await render(<PolicyAcceptanceBar rate={rate} size={size} />)
        expect(getByTestId('acceptance-progress')).toBeDefined()
      })
    )
  )

  // Status label for all threshold boundaries
  it('shows Good label at rate 81', async () => {
    const { getByTestId } = await render(<PolicyAcceptanceBar rate={81} />)
    expect(getByTestId('acceptance-status-label').textContent).toContain('Good')
  })

  it('shows Fair label at rate 61', async () => {
    const { getByTestId } = await render(<PolicyAcceptanceBar rate={61} />)
    expect(getByTestId('acceptance-status-label').textContent).toContain('Fair')
  })

  it('shows Low label at rate 1', async () => {
    const { getByTestId } = await render(<PolicyAcceptanceBar rate={1} />)
    expect(getByTestId('acceptance-status-label').textContent).toContain('Low')
  })
})
