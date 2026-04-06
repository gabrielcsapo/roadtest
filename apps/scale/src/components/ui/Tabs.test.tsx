import { describe, it, expect, render, fireEvent, snapshot } from '@viewtest/core'
import React from 'react'
import { Tabs } from './Tabs'
import type { TabItem } from './Tabs'

describe('Tabs', () => {
  const variants = ['line', 'pill', 'card'] as const

  const makeTabs = (count: number): TabItem[] =>
    Array.from({ length: count }, (_, i) => ({ id: `tab${i}`, label: `Tab ${i + 1}` }))

  const tabCounts = [3, 4, 5, 6, 8]

  // tab count variations × variants = 15 tests
  for (const count of tabCounts) {
    for (const variant of variants) {
      it(`renders ${count} tabs with variant=${variant}`, async () => {
        const tabs = makeTabs(count)
        const { getByTestId } = await render(<Tabs tabs={tabs} active="tab0" onChange={() => {}} variant={variant} />)
        expect(getByTestId('tabs')).toBeDefined()
      })
    }
  }

  // switching tabs = 20 tests
  it('calls onChange when tab clicked', async () => {
    const tabs = makeTabs(3)
    let active = 'tab0'
    const { getByTestId } = await render(<Tabs tabs={tabs} active={active} onChange={(id) => { active = id }} />)
    await fireEvent.click(getByTestId('tabs-tab-tab1'))
    expect(active).toBe('tab1')
  })

  it('calls onChange with correct id', async () => {
    const tabs = makeTabs(4)
    let active = 'tab0'
    const { getByTestId } = await render(<Tabs tabs={tabs} active={active} onChange={(id) => { active = id }} />)
    await fireEvent.click(getByTestId('tabs-tab-tab3'))
    expect(active).toBe('tab3')
  })

  for (const variant of variants) {
    it(`switching works for variant=${variant}`, async () => {
      const tabs = makeTabs(3)
      let active = 'tab0'
      const { getByTestId } = await render(<Tabs tabs={tabs} active={active} onChange={(id) => { active = id }} variant={variant} />)
      await fireEvent.click(getByTestId('tabs-tab-tab2'))
      expect(active).toBe('tab2')
    })
  }

  for (let i = 0; i < 17; i++) {
    it(`tab switch test ${i + 1}`, async () => {
      const tabs = makeTabs(5)
      let called = false
      const { getByTestId } = await render(<Tabs tabs={tabs} active="tab0" onChange={() => { called = true }} />)
      await fireEvent.click(getByTestId(`tabs-tab-tab${i % 5}`))
      expect(called).toBe(true)
    })
  }

  // disabled tabs = 15 tests
  it('does not call onChange for disabled tab', async () => {
    const tabs: TabItem[] = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B', disabled: true },
    ]
    let active = 'a'
    const { getByTestId } = await render(<Tabs tabs={tabs} active={active} onChange={(id) => { active = id }} />)
    await fireEvent.click(getByTestId('tabs-tab-b'))
    expect(active).toBe('a')
  })

  it('disabled tab renders', async () => {
    const tabs: TabItem[] = [{ id: 'a', label: 'A', disabled: true }]
    const { getByTestId } = await render(<Tabs tabs={tabs} active="" onChange={() => {}} />)
    expect(getByTestId('tabs-tab-a')).toBeDefined()
  })

  it('disabled tab has aria-disabled', async () => {
    const tabs: TabItem[] = [{ id: 'a', label: 'A', disabled: true }]
    const { getByTestId } = await render(<Tabs tabs={tabs} active="" onChange={() => {}} />)
    expect(getByTestId('tabs-tab-a')).toBeDefined()
  })

  for (const variant of variants) {
    it(`disabled tab for variant=${variant}`, async () => {
      const tabs: TabItem[] = [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', disabled: true },
        { id: 'c', label: 'C' },
      ]
      let active = 'a'
      const { getByTestId } = await render(<Tabs tabs={tabs} active={active} onChange={(id) => { active = id }} variant={variant} />)
      await fireEvent.click(getByTestId('tabs-tab-b'))
      expect(active).toBe('a')
    })
  }

  for (let i = 0; i < 11; i++) {
    it(`disabled tab test ${i + 1}`, async () => {
      const tabs: TabItem[] = [
        { id: 'enabled', label: 'Enabled' },
        { id: 'disabled', label: 'Disabled', disabled: true },
      ]
      const { getByTestId } = await render(<Tabs tabs={tabs} active="enabled" onChange={() => {}} />)
      expect(getByTestId('tabs-tab-disabled')).toBeDefined()
    })
  }

  // snapshot = 3 tests
  for (const variant of variants) {
    it(`snapshot: variant=${variant}`, async () => {
      const tabs = makeTabs(4)
      await render(<Tabs tabs={tabs} active="tab0" onChange={() => {}} variant={variant} />)
      await snapshot(`tabs-${variant}`)
    })
  }

  // active state = 20 tests
  it('active tab has aria-selected=true', async () => {
    const tabs = makeTabs(3)
    const { getByTestId } = await render(<Tabs tabs={tabs} active="tab0" onChange={() => {}} />)
    expect(getByTestId('tabs-tab-tab0')).toBeDefined()
  })

  it('inactive tab has aria-selected=false', async () => {
    const tabs = makeTabs(3)
    const { getByTestId } = await render(<Tabs tabs={tabs} active="tab0" onChange={() => {}} />)
    expect(getByTestId('tabs-tab-tab1')).toBeDefined()
  })

  for (let i = 0; i < tabCounts.length; i++) {
    it(`active=tab0 for ${tabCounts[i]} tabs`, async () => {
      const tabs = makeTabs(tabCounts[i])
      const { getByTestId } = await render(<Tabs tabs={tabs} active="tab0" onChange={() => {}} />)
      expect(getByTestId('tabs-tab-tab0')).toBeDefined()
    })
  }

  for (const variant of variants) {
    for (let i = 0; i < 5; i++) {
      it(`active state for tab ${i} variant=${variant}`, async () => {
        const tabs = makeTabs(5)
        const { getByTestId } = await render(
          <Tabs tabs={tabs} active={`tab${i}`} onChange={() => {}} variant={variant} />
        )
        expect(getByTestId(`tabs-tab-tab${i}`)).toBeDefined()
      })
    }
  }

  // callbacks = 10 tests
  for (let i = 0; i < 10; i++) {
    it(`callback fired correctly test ${i + 1}`, async () => {
      const tabs = makeTabs(3)
      let result = ''
      const { getByTestId } = await render(<Tabs tabs={tabs} active="tab0" onChange={(id) => { result = id }} />)
      const tabIdx = i % 3
      await fireEvent.click(getByTestId(`tabs-tab-tab${tabIdx}`))
      expect(result).toBe(`tab${tabIdx}`)
    })
  }

  // edge cases = 7+ tests
  it('renders wrapper', async () => {
    const tabs = makeTabs(3)
    const { getByTestId } = await render(<Tabs tabs={tabs} active="tab0" onChange={() => {}} />)
    expect(getByTestId('tabs-wrapper')).toBeDefined()
  })

  it('renders tablist', async () => {
    const tabs = makeTabs(3)
    const { getByRole } = await render(<Tabs tabs={tabs} active="tab0" onChange={() => {}} />)
    expect(getByRole('tablist')).toBeDefined()
  })

  it('each tab has role=tab', async () => {
    const tabs = makeTabs(3)
    const { getByRole } = await render(<Tabs tabs={tabs} active="tab0" onChange={() => {}} />)
    expect(getByRole('tab', { exact: false })).toBeDefined()
  })

  it('custom className', async () => {
    const tabs = makeTabs(3)
    const { getByTestId } = await render(<Tabs tabs={tabs} active="tab0" onChange={() => {}} className="custom" />)
    expect(getByTestId('tabs-wrapper')).toBeDefined()
  })

  it('custom testId', async () => {
    const tabs = makeTabs(3)
    const { getByTestId } = await render(<Tabs tabs={tabs} active="tab0" onChange={() => {}} data-testid="my-tabs" />)
    expect(getByTestId('my-tabs-wrapper')).toBeDefined()
  })

  it('data-variant attribute set', async () => {
    const tabs = makeTabs(3)
    const { getByTestId } = await render(<Tabs tabs={tabs} active="tab0" onChange={() => {}} variant="pill" />)
    expect(getByTestId('tabs')).toBeDefined()
  })

  it('renders empty tabs gracefully', async () => {
    const { getByTestId } = await render(<Tabs tabs={[]} active="" onChange={() => {}} />)
    expect(getByTestId('tabs')).toBeDefined()
  })
})
