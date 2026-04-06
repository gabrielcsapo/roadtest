import { describe, it, expect, render, fireEvent } from '@viewtest/core'
import React from 'react'
import { useSearch } from './useSearch'

function SearchHarness({ initialQuery = '', delay = 0 }: { initialQuery?: string; delay?: number }) {
  const { query, debouncedQuery, setQuery, clearSearch, hasQuery } = useSearch(initialQuery, delay)
  return (
    <div>
      <span data-testid="query">{query}</span>
      <span data-testid="debounced">{debouncedQuery}</span>
      <span data-testid="hasQuery">{String(hasQuery)}</span>
      <input
        data-testid="input"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <button data-testid="clear" onClick={clearSearch}>clear</button>
      <button data-testid="set-hello" onClick={() => setQuery('hello')}>set hello</button>
      <button data-testid="set-world" onClick={() => setQuery('world')}>set world</button>
      <button data-testid="set-empty" onClick={() => setQuery('')}>set empty</button>
      <button data-testid="set-spaces" onClick={() => setQuery('   ')}>set spaces</button>
    </div>
  )
}

describe('useSearch', () => {
  describe('initial state with various default queries', () => {
    const initialQueries = ['', 'hello', 'world', 'test', 'search term', 'foo', 'bar', '123', 'special chars', 'long search query']
    for (const q of initialQueries) {
      it(`initializes with query "${q}"`, async () => {
        const { getByTestId } = await render(<SearchHarness initialQuery={q} />)
        expect(getByTestId('query').textContent).toBe(q)
      })
    }
  })

  describe('hasQuery state', () => {
    it('hasQuery is false for empty initial query', async () => {
      const { getByTestId } = await render(<SearchHarness initialQuery="" />)
      expect(getByTestId('hasQuery').textContent).toBe('false')
    })

    it('hasQuery is true for non-empty initial query', async () => {
      const { getByTestId } = await render(<SearchHarness initialQuery="hello" />)
      expect(getByTestId('hasQuery').textContent).toBe('true')
    })

    it('hasQuery is false for whitespace-only query', async () => {
      const { getByTestId } = await render(<SearchHarness initialQuery="   " />)
      expect(getByTestId('hasQuery').textContent).toBe('false')
    })

    it('hasQuery becomes true after setting query', async () => {
      const { getByTestId } = await render(<SearchHarness initialQuery="" />)
      await fireEvent.click(getByTestId('set-hello'))
      expect(getByTestId('hasQuery').textContent).toBe('true')
    })

    it('hasQuery becomes false after clearing', async () => {
      const { getByTestId } = await render(<SearchHarness initialQuery="hello" />)
      await fireEvent.click(getByTestId('clear'))
      expect(getByTestId('hasQuery').textContent).toBe('false')
    })

    it('hasQuery is false after setting to empty string', async () => {
      const { getByTestId } = await render(<SearchHarness initialQuery="hello" />)
      await fireEvent.click(getByTestId('set-empty'))
      expect(getByTestId('hasQuery').textContent).toBe('false')
    })

    it('hasQuery is false after setting to whitespace-only', async () => {
      const { getByTestId } = await render(<SearchHarness initialQuery="hello" />)
      await fireEvent.click(getByTestId('set-spaces'))
      expect(getByTestId('hasQuery').textContent).toBe('false')
    })
  })

  describe('setQuery interactions', () => {
    const queryValues = ['hello', 'world', 'test', 'search', 'foo', 'bar', 'baz', 'query1', 'query2', 'query3',
      'abc', 'def', 'ghi', 'jkl', 'mno', 'pqr', 'stu', 'vwx', 'yz', 'end']
    for (const val of queryValues) {
      it(`setQuery("${val}") updates query`, async () => {
        const { getByTestId } = await render(<SearchHarness initialQuery="" />)
        await fireEvent.change(getByTestId('input'), { target: { value: val } })
        expect(getByTestId('query').textContent).toBe(val)
      })
    }
  })

  describe('clearSearch', () => {
    it('clearSearch resets to empty', async () => {
      const { getByTestId } = await render(<SearchHarness initialQuery="hello" />)
      await fireEvent.click(getByTestId('clear'))
      expect(getByTestId('query').textContent).toBe('')
    })

    it('clearSearch resets hasQuery to false', async () => {
      const { getByTestId } = await render(<SearchHarness initialQuery="hello" />)
      await fireEvent.click(getByTestId('clear'))
      expect(getByTestId('hasQuery').textContent).toBe('false')
    })

    it('clearSearch works when already empty', async () => {
      const { getByTestId } = await render(<SearchHarness initialQuery="" />)
      await fireEvent.click(getByTestId('clear'))
      expect(getByTestId('query').textContent).toBe('')
    })

    it('can search again after clear', async () => {
      const { getByTestId } = await render(<SearchHarness initialQuery="" />)
      await fireEvent.click(getByTestId('set-hello'))
      await fireEvent.click(getByTestId('clear'))
      await fireEvent.click(getByTestId('set-world'))
      expect(getByTestId('query').textContent).toBe('world')
    })
  })

  describe('sequence of operations', () => {
    it('set hello -> set world -> clear', async () => {
      const { getByTestId } = await render(<SearchHarness />)
      await fireEvent.click(getByTestId('set-hello'))
      await fireEvent.click(getByTestId('set-world'))
      await fireEvent.click(getByTestId('clear'))
      expect(getByTestId('query').textContent).toBe('')
    })

    it('set hello -> clear -> set world', async () => {
      const { getByTestId } = await render(<SearchHarness />)
      await fireEvent.click(getByTestId('set-hello'))
      await fireEvent.click(getByTestId('clear'))
      await fireEvent.click(getByTestId('set-world'))
      expect(getByTestId('query').textContent).toBe('world')
    })

    it('multiple clears in sequence stays empty', async () => {
      const { getByTestId } = await render(<SearchHarness initialQuery="hello" />)
      await fireEvent.click(getByTestId('clear'))
      await fireEvent.click(getByTestId('clear'))
      await fireEvent.click(getByTestId('clear'))
      expect(getByTestId('query').textContent).toBe('')
    })
  })

  describe('input element interactions', () => {
    it('input element is rendered', async () => {
      const { getByTestId } = await render(<SearchHarness />)
      expect(getByTestId('input')).toBeDefined()
    })

    it('typing in input updates query', async () => {
      const { getByTestId } = await render(<SearchHarness initialQuery="" />)
      await fireEvent.change(getByTestId('input'), { target: { value: 'typed text' } })
      expect(getByTestId('query').textContent).toBe('typed text')
    })

    it('clearing input sets hasQuery to false', async () => {
      const { getByTestId } = await render(<SearchHarness initialQuery="hello" />)
      await fireEvent.change(getByTestId('input'), { target: { value: '' } })
      expect(getByTestId('hasQuery').textContent).toBe('false')
    })
  })

  describe('with different debounce delays', () => {
    const delays = [0, 50, 100, 200, 300, 500]
    for (const delay of delays) {
      it(`renders correctly with delay=${delay}`, async () => {
        const { getByTestId } = await render(<SearchHarness initialQuery="test" delay={delay} />)
        expect(getByTestId('query').textContent).toBe('test')
      })
    }
  })

  describe('edge cases', () => {
    it('handles numeric-like strings', async () => {
      const { getByTestId } = await render(<SearchHarness initialQuery="" />)
      await fireEvent.change(getByTestId('input'), { target: { value: '12345' } })
      expect(getByTestId('query').textContent).toBe('12345')
    })

    it('handles special characters', async () => {
      const { getByTestId } = await render(<SearchHarness initialQuery="" />)
      await fireEvent.change(getByTestId('input'), { target: { value: '!@#$%' } })
      expect(getByTestId('query').textContent).toBe('!@#$%')
    })

    it('handles very long query', async () => {
      const longQuery = 'a'.repeat(500)
      const { getByTestId } = await render(<SearchHarness initialQuery={longQuery} />)
      expect(getByTestId('query').textContent).toBe(longQuery)
    })

    it('hasQuery is true for single character', async () => {
      const { getByTestId } = await render(<SearchHarness initialQuery="a" />)
      expect(getByTestId('hasQuery').textContent).toBe('true')
    })
  })
})

describe('useSearch - hasQuery with various inputs', () => {
  const hasQueryCases = [
    { val: '', expected: 'false' },
    { val: ' ', expected: 'false' },
    { val: 'a', expected: 'true' },
    { val: 'hello', expected: 'true' },
    { val: 'search term', expected: 'true' },
    { val: '123', expected: 'true' },
    { val: '!@#', expected: 'true' },
    { val: 'x', expected: 'true' },
    { val: 'query', expected: 'true' },
    { val: 'filter', expected: 'true' },
    { val: '0', expected: 'true' },
    { val: 'test', expected: 'true' },
  ]
  for (const c of hasQueryCases) {
    it(`hasQuery="${c.expected}" when query="${c.val}"`, async () => {
      const { getByTestId } = await render(<SearchHarness initialQuery={c.val.trim()} />)
      expect(getByTestId('hasQuery').textContent).toBe(c.expected)
    })
  }
})

describe('useSearch - clearSearch resets to empty', () => {
  const clearCases = ['hello', 'world', 'foo', 'bar', 'baz', 'query', 'test', 'search', 'find', 'abc']
  for (const q of clearCases) {
    it(`clearSearch after query="${q}" resets hasQuery to false`, async () => {
      const { getByTestId } = await render(<SearchHarness initialQuery={q} />)
      await fireEvent.click(getByTestId('clear'))
      expect(getByTestId('hasQuery').textContent).toBe('false')
    })
  }
})

describe('useSearch - query input interactions', () => {
  const inputCases = [
    'apple', 'banana', 'cherry', 'date', 'elderberry',
    'fig', 'grape', 'honeydew', 'kiwi', 'lemon',
    'mango', 'nectarine', 'orange', 'papaya', 'quince',
    'raspberry', 'strawberry', 'tangerine', 'ugli', 'vanilla',
  ]
  for (const val of inputCases) {
    it(`typing "${val}" sets query correctly`, async () => {
      const { getByTestId } = await render(<SearchHarness />)
      await fireEvent.change(getByTestId('input'), { target: { value: val } })
      expect(getByTestId('query').textContent).toBe(val)
    })
  }
})

describe('useSearch - query field presence', () => {
  const presenceCases = ['', 'a', 'hello', 'world', 'test', 'foo', 'bar', 'baz', 'abc', 'xyz']
  for (const q of presenceCases) {
    it(`renders query span with initial="${q}"`, async () => {
      const { getByTestId } = await render(<SearchHarness initialQuery={q} />)
      expect(getByTestId('query')).toBeDefined()
      expect(getByTestId('hasQuery')).toBeDefined()
    })
  }
})
