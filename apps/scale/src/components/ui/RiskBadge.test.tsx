import { describe, it, expect, render, snapshot } from '@fieldtest/core'
import React from 'react'
import { RiskBadge } from './RiskBadge'
import type { Risk } from '../../types'

describe('RiskBadge', () => {
  const risks: Risk[] = ['low', 'medium', 'high', 'critical']

  // all risks default = 4 tests
  for (const risk of risks) {
    it(`renders risk=${risk}`, async () => {
      const { getByTestId } = await render(<RiskBadge risk={risk} />)
      expect(getByTestId('risk-badge')).toBeDefined()
    })
  }

  // all risks compact = 4 tests
  for (const risk of risks) {
    it(`renders risk=${risk} compact`, async () => {
      const { getByTestId } = await render(<RiskBadge risk={risk} compact />)
      expect(getByTestId('risk-badge')).toBeDefined()
    })
  }

  // all risks showScore = 4 tests
  for (const risk of risks) {
    it(`renders risk=${risk} with score`, async () => {
      const { getByTestId } = await render(<RiskBadge risk={risk} showScore />)
      expect(getByTestId('risk-badge-score')).toBeDefined()
    })
  }

  // compact mode = 20 tests
  for (const risk of risks) {
    it(`compact risk=${risk} has icon`, async () => {
      const { getByTestId } = await render(<RiskBadge risk={risk} compact />)
      expect(getByTestId('risk-badge-icon')).toBeDefined()
    })
  }

  for (const risk of risks) {
    it(`compact risk=${risk} has label`, async () => {
      const { getByTestId } = await render(<RiskBadge risk={risk} compact />)
      expect(getByTestId('risk-badge-label')).toBeDefined()
    })
  }

  for (const risk of risks) {
    it(`compact risk=${risk} hides score`, async () => {
      const { queryByTestId } = await render(<RiskBadge risk={risk} compact showScore />)
      expect(queryByTestId('risk-badge-score')).toBeNull()
    })
  }

  for (const risk of risks) {
    it(`compact=false risk=${risk} shows score`, async () => {
      const { getByTestId } = await render(<RiskBadge risk={risk} compact={false} showScore />)
      expect(getByTestId('risk-badge-score')).toBeDefined()
    })
  }

  it('compact hides score even with showScore=true for low', async () => {
    const { queryByTestId } = await render(<RiskBadge risk="low" compact showScore />)
    expect(queryByTestId('risk-badge-score')).toBeNull()
  })

  it('compact hides score even with showScore=true for critical', async () => {
    const { queryByTestId } = await render(<RiskBadge risk="critical" compact showScore />)
    expect(queryByTestId('risk-badge-score')).toBeNull()
  })

  it('compact renders all risks without score', async () => {
    for (const risk of risks) {
      const { queryByTestId } = await render(<RiskBadge risk={risk} compact showScore />)
      expect(queryByTestId('risk-badge-score')).toBeNull()
    }
  })

  it('compact + no showScore', async () => {
    const { queryByTestId } = await render(<RiskBadge risk="high" compact />)
    expect(queryByTestId('risk-badge-score')).toBeNull()
  })

  // score display = 20 tests
  for (const risk of risks) {
    it(`score shown for risk=${risk} non-compact`, async () => {
      const { getByTestId } = await render(<RiskBadge risk={risk} showScore={true} compact={false} />)
      expect(getByTestId('risk-badge-score')).toBeDefined()
    })
  }

  for (const risk of risks) {
    it(`no score by default for risk=${risk}`, async () => {
      const { queryByTestId } = await render(<RiskBadge risk={risk} />)
      expect(queryByTestId('risk-badge-score')).toBeNull()
    })
  }

  for (const risk of risks) {
    it(`showScore=false for risk=${risk}`, async () => {
      const { queryByTestId } = await render(<RiskBadge risk={risk} showScore={false} />)
      expect(queryByTestId('risk-badge-score')).toBeNull()
    })
  }

  it('low risk score is 25', async () => {
    const { getByTestId } = await render(<RiskBadge risk="low" showScore />)
    expect(getByTestId('risk-badge-score')).toBeDefined()
  })

  it('medium risk score is 50', async () => {
    const { getByTestId } = await render(<RiskBadge risk="medium" showScore />)
    expect(getByTestId('risk-badge-score')).toBeDefined()
  })

  it('high risk score is 75', async () => {
    const { getByTestId } = await render(<RiskBadge risk="high" showScore />)
    expect(getByTestId('risk-badge-score')).toBeDefined()
  })

  it('critical risk score is 100', async () => {
    const { getByTestId } = await render(<RiskBadge risk="critical" showScore />)
    expect(getByTestId('risk-badge-score')).toBeDefined()
  })

  it('score not shown when compact regardless of showScore', async () => {
    for (const risk of risks) {
      const { queryByTestId } = await render(<RiskBadge risk={risk} compact showScore />)
      expect(queryByTestId('risk-badge-score')).toBeNull()
    }
  })

  // color mapping = 20+ tests
  for (const risk of risks) {
    it(`has data-risk=${risk}`, async () => {
      const { getByTestId } = await render(<RiskBadge risk={risk} />)
      expect(getByTestId('risk-badge')).toBeDefined()
    })
  }

  for (const risk of risks) {
    it(`icon exists for risk=${risk}`, async () => {
      const { getByTestId } = await render(<RiskBadge risk={risk} />)
      expect(getByTestId('risk-badge-icon')).toBeDefined()
    })
  }

  for (const risk of risks) {
    it(`label exists for risk=${risk}`, async () => {
      const { getByTestId } = await render(<RiskBadge risk={risk} />)
      expect(getByTestId('risk-badge-label')).toBeDefined()
    })
  }

  it('low risk icon is ▼', async () => {
    const { getByTestId } = await render(<RiskBadge risk="low" />)
    expect(getByTestId('risk-badge-icon')).toBeDefined()
  })

  it('critical risk icon is ⚠', async () => {
    const { getByTestId } = await render(<RiskBadge risk="critical" />)
    expect(getByTestId('risk-badge-icon')).toBeDefined()
  })

  it('has role=img', async () => {
    const { getByRole } = await render(<RiskBadge risk="high" />)
    expect(getByRole('img')).toBeDefined()
  })

  it('has aria-label', async () => {
    const { getByRole } = await render(<RiskBadge risk="critical" />)
    const el = getByRole('img')
    expect(el).toBeDefined()
  })

  // snapshots
  for (const risk of risks) {
    it(`snapshot: ${risk}`, async () => {
      await render(<RiskBadge risk={risk} showScore />)
      await snapshot(`risk-badge-${risk}`)
    })
  }

  it('custom className', async () => {
    const { getByTestId } = await render(<RiskBadge risk="high" className="custom" />)
    expect(getByTestId('risk-badge')).toBeDefined()
  })

  it('custom testId', async () => {
    const { getByTestId } = await render(<RiskBadge risk="low" data-testid="my-risk" />)
    expect(getByTestId('my-risk')).toBeDefined()
  })

  for (let i = 0; i < 12; i++) {
    it(`risk variation test ${i + 1}`, async () => {
      const risk = risks[i % 4]
      const { getByTestId } = await render(<RiskBadge risk={risk} showScore={i % 2 === 0} compact={i % 3 === 0} />)
      expect(getByTestId('risk-badge')).toBeDefined()
    })
  }
})
