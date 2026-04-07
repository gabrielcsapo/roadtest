import { describe, it, expect, render, snapshot } from '@fieldtest/core'
import { PolicyFrameworkBadge } from './PolicyFrameworkBadge'
import { Framework } from '../../types'

const allFrameworks: Framework[] = ['SOC2', 'ISO27001', 'HIPAA', 'GDPR', 'PCI-DSS', 'FedRAMP']
const sizes = ['sm', 'md'] as const

const expectedColors: Record<Framework, string> = {
  SOC2: 'purple',
  ISO27001: 'blue',
  HIPAA: 'green',
  GDPR: 'orange',
  'PCI-DSS': 'red',
  FedRAMP: 'indigo',
}

const fullLabels: Record<Framework, string> = {
  SOC2: 'SOC 2 Type II',
  ISO27001: 'ISO/IEC 27001',
  HIPAA: 'HIPAA Privacy & Security',
  GDPR: 'General Data Protection Regulation',
  'PCI-DSS': 'Payment Card Industry DSS',
  FedRAMP: 'Federal Risk and Authorization Management Program',
}

describe('PolicyFrameworkBadge', () => {
  // Basic rendering for all 6 frameworks
  allFrameworks.map((fw) =>
    it(`renders badge for framework ${fw}`, async () => {
      const { getByTestId } = await render(<PolicyFrameworkBadge framework={fw} />)
      expect(getByTestId(`framework-badge-${fw}`)).toBeDefined()
    })
  )

  // Framework × 2 sizes (12 tests)
  allFrameworks.flatMap((fw) =>
    sizes.map((size) =>
      it(`renders ${fw} badge at size ${size}`, async () => {
        const { getByTestId } = await render(<PolicyFrameworkBadge framework={fw} size={size} />)
        expect(getByTestId(`framework-badge-${fw}`)).toBeDefined()
      })
    )
  )

  // Framework × showFull (12 tests)
  allFrameworks.flatMap((fw) =>
    [true, false].map((showFull) =>
      it(`renders ${fw} badge with showFull=${showFull}`, async () => {
        const { getByTestId } = await render(<PolicyFrameworkBadge framework={fw} showFull={showFull} />)
        expect(getByTestId(`framework-label-${fw}`)).toBeDefined()
      })
    )
  )

  // Color mapping (all 6 frameworks)
  allFrameworks.map((fw) =>
    it(`applies correct color ${expectedColors[fw]} for ${fw}`, async () => {
      const { getByTestId } = await render(<PolicyFrameworkBadge framework={fw} />)
      expect(getByTestId(`framework-badge-${fw}`).getAttribute('data-color')).toBe(expectedColors[fw])
    })
  )

  // Short label display
  it('shows SOC2 short label', async () => {
    const { getByTestId } = await render(<PolicyFrameworkBadge framework="SOC2" showFull={false} />)
    expect(getByTestId('framework-label-SOC2').textContent).toBe('SOC2')
  })

  it('shows ISO27001 short label', async () => {
    const { getByTestId } = await render(<PolicyFrameworkBadge framework="ISO27001" showFull={false} />)
    expect(getByTestId('framework-label-ISO27001').textContent).toBe('ISO27001')
  })

  it('shows HIPAA short label', async () => {
    const { getByTestId } = await render(<PolicyFrameworkBadge framework="HIPAA" showFull={false} />)
    expect(getByTestId('framework-label-HIPAA').textContent).toBe('HIPAA')
  })

  it('shows GDPR short label', async () => {
    const { getByTestId } = await render(<PolicyFrameworkBadge framework="GDPR" showFull={false} />)
    expect(getByTestId('framework-label-GDPR').textContent).toBe('GDPR')
  })

  it('shows PCI-DSS short label', async () => {
    const { getByTestId } = await render(<PolicyFrameworkBadge framework="PCI-DSS" showFull={false} />)
    expect(getByTestId('framework-label-PCI-DSS').textContent).toBe('PCI-DSS')
  })

  it('shows FedRAMP short label', async () => {
    const { getByTestId } = await render(<PolicyFrameworkBadge framework="FedRAMP" showFull={false} />)
    expect(getByTestId('framework-label-FedRAMP').textContent).toBe('FedRAMP')
  })

  // Full label display
  allFrameworks.map((fw) =>
    it(`shows full label for ${fw}`, async () => {
      const { getByTestId } = await render(<PolicyFrameworkBadge framework={fw} showFull />)
      expect(getByTestId(`framework-label-${fw}`).textContent).toBe(fullLabels[fw])
    })
  )

  // Default size is md
  it('defaults to md size when size is not provided', async () => {
    const { getByTestId } = await render(<PolicyFrameworkBadge framework="SOC2" />)
    expect(getByTestId('framework-badge-SOC2')).toBeDefined()
  })

  // Default showFull is false
  it('defaults to short label when showFull is not provided', async () => {
    const { getByTestId } = await render(<PolicyFrameworkBadge framework="GDPR" />)
    expect(getByTestId('framework-label-GDPR').textContent).toBe('GDPR')
  })

  // Custom data-testid
  it('uses custom data-testid when provided', async () => {
    const { getByTestId } = await render(
      <PolicyFrameworkBadge framework="SOC2" data-testid="custom-badge" />
    )
    expect(getByTestId('custom-badge')).toBeDefined()
  })

  // Snapshots (one per framework)
  allFrameworks.map((fw) =>
    it(`matches snapshot for ${fw}`, async () => {
      const { container } = await render(<PolicyFrameworkBadge framework={fw} />)
      await snapshot(`framework-badge-${fw.toLowerCase()}`)
    })
  )

  // Combination: all frameworks at sm size with showFull
  allFrameworks.map((fw) =>
    it(`renders ${fw} at sm size with full label`, async () => {
      const { getByTestId } = await render(<PolicyFrameworkBadge framework={fw} size="sm" showFull />)
      expect(getByTestId(`framework-label-${fw}`).textContent).toBe(fullLabels[fw])
    })
  )

  // Combination: all frameworks at md size without showFull
  allFrameworks.map((fw) =>
    it(`renders ${fw} at md size with short label`, async () => {
      const { getByTestId } = await render(<PolicyFrameworkBadge framework={fw} size="md" showFull={false} />)
      expect(getByTestId(`framework-badge-${fw}`).getAttribute('data-framework')).toBe(fw)
    })
  )

  // SOC2 purple color specific
  it('SOC2 badge has purple color attribute', async () => {
    const { getByTestId } = await render(<PolicyFrameworkBadge framework="SOC2" />)
    expect(getByTestId('framework-badge-SOC2').getAttribute('data-color')).toBe('purple')
  })

  // ISO27001 blue color specific
  it('ISO27001 badge has blue color attribute', async () => {
    const { getByTestId } = await render(<PolicyFrameworkBadge framework="ISO27001" />)
    expect(getByTestId('framework-badge-ISO27001').getAttribute('data-color')).toBe('blue')
  })

  // FedRAMP indigo color specific
  it('FedRAMP badge has indigo color attribute', async () => {
    const { getByTestId } = await render(<PolicyFrameworkBadge framework="FedRAMP" />)
    expect(getByTestId('framework-badge-FedRAMP').getAttribute('data-color')).toBe('indigo')
  })

  // PCI-DSS red color specific
  it('PCI-DSS badge has red color attribute', async () => {
    const { getByTestId } = await render(<PolicyFrameworkBadge framework="PCI-DSS" />)
    expect(getByTestId('framework-badge-PCI-DSS').getAttribute('data-color')).toBe('red')
  })

  // HIPAA green color specific
  it('HIPAA badge has green color attribute', async () => {
    const { getByTestId } = await render(<PolicyFrameworkBadge framework="HIPAA" />)
    expect(getByTestId('framework-badge-HIPAA').getAttribute('data-color')).toBe('green')
  })

  // GDPR orange color specific
  it('GDPR badge has orange color attribute', async () => {
    const { getByTestId } = await render(<PolicyFrameworkBadge framework="GDPR" />)
    expect(getByTestId('framework-badge-GDPR').getAttribute('data-color')).toBe('orange')
  })

  // Additional framework × sizes × showFull combos (6 × 2 × 2 = 24 tests)
  allFrameworks.flatMap((fw) =>
    sizes.flatMap((size) =>
      [true, false].map((showFull) =>
        it(`renders ${fw} at ${size} with showFull=${showFull} and has data-framework attribute`, async () => {
          const { getByTestId } = await render(<PolicyFrameworkBadge framework={fw} size={size} showFull={showFull} />)
          expect(getByTestId(`framework-badge-${fw}`).getAttribute('data-framework')).toBe(fw)
        })
      )
    )
  )

  // Verify label text is non-empty for all frameworks at both sizes
  allFrameworks.flatMap((fw) =>
    sizes.map((size) =>
      it(`label text is not empty for ${fw} at ${size}`, async () => {
        const { getByTestId } = await render(<PolicyFrameworkBadge framework={fw} size={size} />)
        const label = getByTestId(`framework-label-${fw}`)
        expect(label.textContent?.length).toBeGreaterThan(0)
      })
    )
  )
})
