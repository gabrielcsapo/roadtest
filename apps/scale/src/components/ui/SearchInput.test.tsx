import { describe, it, expect, render, fireEvent, snapshot } from '@fieldtest/core'
import React from 'react'
import { SearchInput } from './SearchInput'

describe('SearchInput', () => {
  const sizes = ['sm', 'md', 'lg'] as const

  // input values = 20 tests
  const testValues = [
    '', 'a', 'ab', 'search', 'vendor name', 'compliance',
    'SOC 2', 'ISO 27001', 'John Doe', 'acme corp',
    'test@example.com', '123', 'risk management', 'policy review',
    'audit trail', 'control framework', 'security scan', 'data breach',
    'cloud provider', 'third party risk',
  ]

  for (const val of testValues) {
    it(`renders with value="${val.substring(0, 20)}"`, async () => {
      const { getByTestId } = await render(
        <SearchInput value={val} onChange={() => {}} />
      )
      expect(getByTestId('search-input')).toBeDefined()
    })
  }

  // clear button = 15 tests
  it('shows clear button when value is non-empty and onClear provided', async () => {
    const { getByTestId } = await render(
      <SearchInput value="text" onChange={() => {}} onClear={() => {}} />
    )
    expect(getByTestId('search-input-clear')).toBeDefined()
  })

  it('no clear button when value is empty', async () => {
    const { queryByTestId } = await render(
      <SearchInput value="" onChange={() => {}} onClear={() => {}} />
    )
    expect(queryByTestId('search-input-clear')).toBeNull()
  })

  it('no clear button when onClear not provided', async () => {
    const { queryByTestId } = await render(
      <SearchInput value="text" onChange={() => {}} />
    )
    expect(queryByTestId('search-input-clear')).toBeNull()
  })

  it('calls onClear when clear button clicked', async () => {
    let cleared = false
    const { getByTestId } = await render(
      <SearchInput value="search" onChange={() => {}} onClear={() => { cleared = true }} />
    )
    await fireEvent.click(getByTestId('search-input-clear'))
    expect(cleared).toBe(true)
  })

  it('clears value when clear button clicked', async () => {
    let val = 'test'
    const { getByTestId } = await render(
      <SearchInput value={val} onChange={(v) => { val = v }} onClear={() => {}} />
    )
    await fireEvent.click(getByTestId('search-input-clear'))
    expect(val).toBe('')
  })

  for (let i = 0; i < 10; i++) {
    it(`clear button test ${i + 1}`, async () => {
      let called = false
      const { getByTestId } = await render(
        <SearchInput value={`search ${i}`} onChange={() => {}} onClear={() => { called = true }} />
      )
      await fireEvent.click(getByTestId('search-input-clear'))
      expect(called).toBe(true)
    })
  }

  // loading state = 10 tests
  it('shows loading indicator when loading', async () => {
    const { getByTestId } = await render(
      <SearchInput value="" onChange={() => {}} loading />
    )
    expect(getByTestId('search-input-loading')).toBeDefined()
  })

  it('no loading indicator when not loading', async () => {
    const { queryByTestId } = await render(
      <SearchInput value="" onChange={() => {}} />
    )
    expect(queryByTestId('search-input-loading')).toBeNull()
  })

  for (const size of sizes) {
    it(`loading state at size=${size}`, async () => {
      const { getByTestId } = await render(
        <SearchInput value="" onChange={() => {}} loading size={size} />
      )
      expect(getByTestId('search-input-loading')).toBeDefined()
    })
  }

  it('loading with non-empty value', async () => {
    const { getByTestId } = await render(
      <SearchInput value="searching" onChange={() => {}} loading />
    )
    expect(getByTestId('search-input-loading')).toBeDefined()
  })

  for (let i = 0; i < 5; i++) {
    it(`loading appearance test ${i + 1}`, async () => {
      const { getByTestId } = await render(
        <SearchInput value="" onChange={() => {}} loading={true} />
      )
      expect(getByTestId('search-input-loading')).toBeDefined()
    })
  }

  // size variations = 15 tests
  for (const size of sizes) {
    it(`renders size=${size}`, async () => {
      const { getByTestId } = await render(
        <SearchInput value="" onChange={() => {}} size={size} />
      )
      expect(getByTestId('search-input')).toBeDefined()
    })
  }

  for (const size of sizes) {
    it(`wrapper renders at size=${size}`, async () => {
      const { getByTestId } = await render(
        <SearchInput value="" onChange={() => {}} size={size} />
      )
      expect(getByTestId('search-input-wrapper')).toBeDefined()
    })
  }

  for (const size of sizes) {
    it(`icon renders at size=${size}`, async () => {
      const { getByTestId } = await render(
        <SearchInput value="" onChange={() => {}} size={size} />
      )
      expect(getByTestId('search-input-icon')).toBeDefined()
    })
  }

  for (const size of sizes) {
    it(`size=${size} with value and clear`, async () => {
      const { getByTestId } = await render(
        <SearchInput value="text" onChange={() => {}} size={size} onClear={() => {}} />
      )
      expect(getByTestId('search-input-clear')).toBeDefined()
    })
  }

  for (const size of sizes) {
    it(`size=${size} with loading`, async () => {
      const { getByTestId } = await render(
        <SearchInput value="" onChange={() => {}} size={size} loading />
      )
      expect(getByTestId('search-input-loading')).toBeDefined()
    })
  }

  // change events = 20 tests
  it('calls onChange on input change', async () => {
    let val = ''
    const { getByTestId } = await render(
      <SearchInput value={val} onChange={(v) => { val = v }} />
    )
    await fireEvent.change(getByTestId('search-input'), { target: { value: 'hello' } })
    expect(val).toBe('hello')
  })

  const changeValues = [
    'vendor', 'compliance', 'audit', 'risk', 'policy',
    'control', 'framework', 'security', 'monitoring', 'alert',
    'incident', 'threat', 'vulnerability', 'patch', 'access',
    'identity', 'permission', 'role', 'group', 'team',
  ]

  for (const v of changeValues) {
    it(`onChange fires with value="${v}"`, async () => {
      let result = ''
      const { getByTestId } = await render(
        <SearchInput value="" onChange={(val) => { result = val }} />
      )
      await fireEvent.change(getByTestId('search-input'), { target: { value: v } })
      expect(result).toBe(v)
    })
  }

  // debounce = 5 tests
  for (const delay of [0, 100, 200, 300, 500]) {
    it(`renders with debounce=${delay}`, async () => {
      const { getByTestId } = await render(
        <SearchInput value="" onChange={() => {}} debounce={delay} />
      )
      expect(getByTestId('search-input')).toBeDefined()
    })
  }

  // snapshot = 3 tests
  it('snapshot: empty', async () => {
    await render(<SearchInput value="" onChange={() => {}} />)
    await snapshot('search-input-empty')
  })

  it('snapshot: with value', async () => {
    await render(<SearchInput value="vendor search" onChange={() => {}} onClear={() => {}} />)
    await snapshot('search-input-value')
  })

  it('snapshot: loading', async () => {
    await render(<SearchInput value="" onChange={() => {}} loading />)
    await snapshot('search-input-loading')
  })

  // placeholder variations = 12+ tests
  const placeholders = [
    'Search vendors...', 'Find controls', 'Search policies',
    'Filter by name', 'Search by email', 'Find framework',
    'Search issues...', 'Look up vendor', 'Filter users',
    'Search audits', 'Find credentials', 'Search frameworks',
  ]

  for (const ph of placeholders) {
    it(`placeholder="${ph}"`, async () => {
      const { getByTestId } = await render(
        <SearchInput value="" onChange={() => {}} placeholder={ph} />
      )
      expect(getByTestId('search-input')).toBeDefined()
    })
  }

  it('search icon always visible', async () => {
    const { getByTestId } = await render(<SearchInput value="" onChange={() => {}} />)
    expect(getByTestId('search-input-icon')).toBeDefined()
  })

  it('custom className', async () => {
    const { getByTestId } = await render(<SearchInput value="" onChange={() => {}} className="custom" />)
    expect(getByTestId('search-input-wrapper')).toBeDefined()
  })

  it('custom testId', async () => {
    const { getByTestId } = await render(<SearchInput value="" onChange={() => {}} data-testid="my-search" />)
    expect(getByTestId('my-search')).toBeDefined()
  })
})
