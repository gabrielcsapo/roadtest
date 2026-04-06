import { describe, it, expect, render, fireEvent } from '@viewtest/core'
import React, { useCallback } from 'react'
import { useAsync } from './useAsync'

function AsyncHarness({ asyncFn }: { asyncFn: () => Promise<unknown> }) {
  const { data, loading, error, execute, reset } = useAsync(asyncFn)
  return (
    <div>
      <span data-testid="data">{JSON.stringify(data)}</span>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="error">{error?.message ?? ''}</span>
      <button data-testid="execute" onClick={() => void execute()}>execute</button>
      <button data-testid="reset" onClick={reset}>reset</button>
    </div>
  )
}

function makeResolvedHarness(value: unknown) {
  const fn = () => Promise.resolve(value)
  return function Harness() {
    return <AsyncHarness asyncFn={fn} />
  }
}

function makeRejectedHarness(message: string) {
  const fn = () => Promise.reject(new Error(message))
  return function Harness() {
    return <AsyncHarness asyncFn={fn} />
  }
}

describe('useAsync', () => {
  describe('initial state', () => {
    const Harness = makeResolvedHarness('value')

    it('data is null initially', async () => {
      const { getByTestId } = await render(<Harness />)
      expect(getByTestId('data').textContent).toBe('null')
    })

    it('loading is false initially', async () => {
      const { getByTestId } = await render(<Harness />)
      expect(getByTestId('loading').textContent).toBe('false')
    })

    it('error is empty initially', async () => {
      const { getByTestId } = await render(<Harness />)
      expect(getByTestId('error').textContent).toBe('')
    })

    it('execute button is present', async () => {
      const { getByTestId } = await render(<Harness />)
      expect(getByTestId('execute')).toBeDefined()
    })

    it('reset button is present', async () => {
      const { getByTestId } = await render(<Harness />)
      expect(getByTestId('reset')).toBeDefined()
    })
  })

  describe('successful execution with various return values', () => {
    const resolvedCases = [
      { label: 'string', value: 'hello world' },
      { label: 'number', value: 42 },
      { label: 'null', value: null },
      { label: 'boolean true', value: true },
      { label: 'boolean false', value: false },
      { label: 'array', value: [1, 2, 3] },
      { label: 'object', value: { id: '1', name: 'Test' } },
      { label: 'empty object', value: {} },
      { label: 'empty array', value: [] },
      { label: 'zero', value: 0 },
      { label: 'empty string', value: '' },
      { label: 'nested object', value: { a: { b: { c: 1 } } } },
      { label: 'large number', value: 1000000 },
      { label: 'negative number', value: -42 },
      { label: 'float', value: 3.14 },
    ]

    for (const c of resolvedCases) {
      it(`resolves with ${c.label} and shows data`, async () => {
        const Harness = makeResolvedHarness(c.value)
        const { getByTestId } = await render(<Harness />)
        await fireEvent.click(getByTestId('execute'))
        expect(getByTestId('data').textContent).toBe(JSON.stringify(c.value))
      })
    }
  })

  describe('error handling', () => {
    const errorMessages = [
      'Network error',
      'Not found',
      'Unauthorized',
      'Server error',
      'Timeout',
      'Invalid input',
      'Connection refused',
      'Forbidden',
      'Bad request',
      'Internal server error',
    ]

    for (const msg of errorMessages) {
      it(`displays error message "${msg}"`, async () => {
        const Harness = makeRejectedHarness(msg)
        const { getByTestId } = await render(<Harness />)
        await fireEvent.click(getByTestId('execute'))
        expect(getByTestId('error').textContent).toBe(msg)
      })
    }

    it('sets data to null on error', async () => {
      const Harness = makeRejectedHarness('some error')
      const { getByTestId } = await render(<Harness />)
      await fireEvent.click(getByTestId('execute'))
      expect(getByTestId('data').textContent).toBe('null')
    })

    it('sets loading to false after error', async () => {
      const Harness = makeRejectedHarness('error')
      const { getByTestId } = await render(<Harness />)
      await fireEvent.click(getByTestId('execute'))
      expect(getByTestId('loading').textContent).toBe('false')
    })
  })

  describe('reset functionality', () => {
    it('reset clears data after success', async () => {
      const Harness = makeResolvedHarness('test data')
      const { getByTestId } = await render(<Harness />)
      await fireEvent.click(getByTestId('execute'))
      await fireEvent.click(getByTestId('reset'))
      expect(getByTestId('data').textContent).toBe('null')
    })

    it('reset clears error after failure', async () => {
      const Harness = makeRejectedHarness('test error')
      const { getByTestId } = await render(<Harness />)
      await fireEvent.click(getByTestId('execute'))
      await fireEvent.click(getByTestId('reset'))
      expect(getByTestId('error').textContent).toBe('')
    })

    it('reset sets loading to false', async () => {
      const Harness = makeResolvedHarness('data')
      const { getByTestId } = await render(<Harness />)
      await fireEvent.click(getByTestId('execute'))
      await fireEvent.click(getByTestId('reset'))
      expect(getByTestId('loading').textContent).toBe('false')
    })

    it('can execute again after reset', async () => {
      const Harness = makeResolvedHarness('hello')
      const { getByTestId } = await render(<Harness />)
      await fireEvent.click(getByTestId('execute'))
      await fireEvent.click(getByTestId('reset'))
      await fireEvent.click(getByTestId('execute'))
      expect(getByTestId('data').textContent).toBe('"hello"')
    })

    it('reset before any execution leaves null state', async () => {
      const Harness = makeResolvedHarness('data')
      const { getByTestId } = await render(<Harness />)
      await fireEvent.click(getByTestId('reset'))
      expect(getByTestId('data').textContent).toBe('null')
      expect(getByTestId('loading').textContent).toBe('false')
      expect(getByTestId('error').textContent).toBe('')
    })
  })

  describe('multiple executions in sequence', () => {
    const executionCounts = [1, 2, 3, 4, 5]
    for (const count of executionCounts) {
      it(`can execute ${count} times sequentially`, async () => {
        const Harness = makeResolvedHarness('result')
        const { getByTestId } = await render(<Harness />)
        for (let i = 0; i < count; i++) {
          await fireEvent.click(getByTestId('execute'))
        }
        expect(getByTestId('data').textContent).toBe('"result"')
      })
    }
  })

  describe('state consistency', () => {
    it('after success: data set, loading false, error empty', async () => {
      const Harness = makeResolvedHarness({ items: [1, 2] })
      const { getByTestId } = await render(<Harness />)
      await fireEvent.click(getByTestId('execute'))
      expect(getByTestId('loading').textContent).toBe('false')
      expect(getByTestId('error').textContent).toBe('')
      expect(getByTestId('data').textContent).toContain('items')
    })

    it('after error: data null, loading false, error set', async () => {
      const Harness = makeRejectedHarness('boom')
      const { getByTestId } = await render(<Harness />)
      await fireEvent.click(getByTestId('execute'))
      expect(getByTestId('loading').textContent).toBe('false')
      expect(getByTestId('data').textContent).toBe('null')
      expect(getByTestId('error').textContent).toBe('boom')
    })
  })

  describe('with different async functions', () => {
    const returnValues = [1, 'text', true, { a: 1 }, [1, 2], null, 0, false, '', 3.14]
    for (const val of returnValues) {
      it(`works with async function returning ${JSON.stringify(val)}`, async () => {
        const Harness = makeResolvedHarness(val)
        const { getByTestId } = await render(<Harness />)
        await fireEvent.click(getByTestId('execute'))
        expect(getByTestId('error').textContent).toBe('')
      })
    }
  })
})

describe('useAsync - loading state tracking', () => {
  const loadingAfterResetCases = [
    { label: 'string value', value: 'hello' },
    { label: 'number value', value: 42 },
    { label: 'object value', value: { key: 'val' } },
    { label: 'array value', value: [1, 2] },
    { label: 'boolean true', value: true },
    { label: 'null value', value: null },
    { label: 'empty string', value: '' },
    { label: 'zero', value: 0 },
    { label: 'false', value: false },
    { label: 'nested', value: { a: [1, 2, 3] } },
  ]
  for (const c of loadingAfterResetCases) {
    it(`loading is false after execute+reset with ${c.label}`, async () => {
      const Harness = makeResolvedHarness(c.value)
      const { getByTestId } = await render(<Harness />)
      await fireEvent.click(getByTestId('execute'))
      await fireEvent.click(getByTestId('reset'))
      expect(getByTestId('loading').textContent).toBe('false')
    })
  }
})

describe('useAsync - error is cleared on reset', () => {
  const errorResetCases = [
    'err-1', 'err-2', 'err-3', 'err-4', 'err-5',
    'timeout', 'network', 'auth', 'server', 'parse',
  ]
  for (const msg of errorResetCases) {
    it(`reset clears error "${msg}"`, async () => {
      const Harness = makeRejectedHarness(msg)
      const { getByTestId } = await render(<Harness />)
      await fireEvent.click(getByTestId('execute'))
      await fireEvent.click(getByTestId('reset'))
      expect(getByTestId('error').textContent).toBe('')
    })
  }
})

describe('useAsync - data is null on error', () => {
  const errorDataCases = [
    'error-a', 'error-b', 'error-c', 'error-d', 'error-e',
    'fail-1', 'fail-2', 'fail-3', 'fail-4', 'fail-5',
  ]
  for (const msg of errorDataCases) {
    it(`data is null when async rejects with "${msg}"`, async () => {
      const Harness = makeRejectedHarness(msg)
      const { getByTestId } = await render(<Harness />)
      await fireEvent.click(getByTestId('execute'))
      expect(getByTestId('data').textContent).toBe('null')
    })
  }
})

describe('useAsync - execute multiple then reset', () => {
  const multiExecCases = [2, 3, 4, 5, 6, 7, 8, 9, 10]
  for (const n of multiExecCases) {
    it(`execute ${n} times then reset: data is null`, async () => {
      const Harness = makeResolvedHarness('result')
      const { getByTestId } = await render(<Harness />)
      for (let i = 0; i < n; i++) {
        await fireEvent.click(getByTestId('execute'))
      }
      await fireEvent.click(getByTestId('reset'))
      expect(getByTestId('data').textContent).toBe('null')
    })
  }
})

describe('useAsync - initial state checks across multiple renders', () => {
  const renderChecks = [
    { label: 'render 1 data null', check: 'data', expected: 'null' },
    { label: 'render 2 loading false', check: 'loading', expected: 'false' },
    { label: 'render 3 error empty', check: 'error', expected: '' },
  ]
  for (const c of renderChecks) {
    const values = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
    for (const v of values) {
      it(`${c.label} with value "${v}"`, async () => {
        const Harness = makeResolvedHarness(v)
        const { getByTestId } = await render(<Harness />)
        expect(getByTestId(c.check).textContent).toBe(c.expected)
      })
    }
  }
})
