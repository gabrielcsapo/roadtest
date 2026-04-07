import { describe, it, expect, render, fireEvent } from '@fieldtest/core'
import React from 'react'
import { useSort } from './useSort'

function SortHarness({ initialField = '', initialDir = 'asc' as 'asc' | 'desc' }) {
  const { sort, setSort, toggleSort, resetSort, isSortedBy, getSortDirection } = useSort(initialField, initialDir)
  return (
    <div>
      <span data-testid="field">{sort.field}</span>
      <span data-testid="direction">{sort.direction}</span>
      <span data-testid="isSortedByName">{String(isSortedBy('name'))}</span>
      <span data-testid="isSortedByDate">{String(isSortedBy('date'))}</span>
      <span data-testid="isSortedByStatus">{String(isSortedBy('status'))}</span>
      <span data-testid="dirForName">{getSortDirection('name') ?? 'null'}</span>
      <span data-testid="dirForDate">{getSortDirection('date') ?? 'null'}</span>

      <button data-testid="sort-name-asc" onClick={() => setSort('name', 'asc')}>sort name asc</button>
      <button data-testid="sort-name-desc" onClick={() => setSort('name', 'desc')}>sort name desc</button>
      <button data-testid="sort-date-asc" onClick={() => setSort('date', 'asc')}>sort date asc</button>
      <button data-testid="sort-date-desc" onClick={() => setSort('date', 'desc')}>sort date desc</button>
      <button data-testid="sort-status" onClick={() => setSort('status')}>sort status default</button>
      <button data-testid="sort-risk" onClick={() => setSort('risk')}>sort risk</button>

      <button data-testid="toggle-name" onClick={() => toggleSort('name')}>toggle name</button>
      <button data-testid="toggle-date" onClick={() => toggleSort('date')}>toggle date</button>
      <button data-testid="toggle-status" onClick={() => toggleSort('status')}>toggle status</button>
      <button data-testid="toggle-risk" onClick={() => toggleSort('risk')}>toggle risk</button>

      <button data-testid="reset" onClick={resetSort}>reset</button>
    </div>
  )
}

describe('useSort', () => {
  describe('initial state with different fields', () => {
    const fields = ['', 'name', 'date', 'status', 'risk', 'category', 'email', 'score', 'title', 'id']
    for (const field of fields) {
      it(`initializes with field="${field}"`, async () => {
        const { getByTestId } = await render(<SortHarness initialField={field} />)
        expect(getByTestId('field').textContent).toBe(field)
      })
    }
  })

  describe('initial state with different directions', () => {
    it('initializes with direction asc', async () => {
      const { getByTestId } = await render(<SortHarness initialField="name" initialDir="asc" />)
      expect(getByTestId('direction').textContent).toBe('asc')
    })

    it('initializes with direction desc', async () => {
      const { getByTestId } = await render(<SortHarness initialField="name" initialDir="desc" />)
      expect(getByTestId('direction').textContent).toBe('desc')
    })

    it('defaults direction to asc when not specified', async () => {
      const { getByTestId } = await render(<SortHarness />)
      expect(getByTestId('direction').textContent).toBe('asc')
    })
  })

  describe('setSort', () => {
    it('sets field to "name" asc', async () => {
      const { getByTestId } = await render(<SortHarness />)
      await fireEvent.click(getByTestId('sort-name-asc'))
      expect(getByTestId('field').textContent).toBe('name')
      expect(getByTestId('direction').textContent).toBe('asc')
    })

    it('sets field to "name" desc', async () => {
      const { getByTestId } = await render(<SortHarness />)
      await fireEvent.click(getByTestId('sort-name-desc'))
      expect(getByTestId('field').textContent).toBe('name')
      expect(getByTestId('direction').textContent).toBe('desc')
    })

    it('sets field to "date" asc', async () => {
      const { getByTestId } = await render(<SortHarness />)
      await fireEvent.click(getByTestId('sort-date-asc'))
      expect(getByTestId('field').textContent).toBe('date')
      expect(getByTestId('direction').textContent).toBe('asc')
    })

    it('sets field to "date" desc', async () => {
      const { getByTestId } = await render(<SortHarness />)
      await fireEvent.click(getByTestId('sort-date-desc'))
      expect(getByTestId('field').textContent).toBe('date')
      expect(getByTestId('direction').textContent).toBe('desc')
    })

    it('sets field without direction defaults to asc', async () => {
      const { getByTestId } = await render(<SortHarness />)
      await fireEvent.click(getByTestId('sort-status'))
      expect(getByTestId('direction').textContent).toBe('asc')
    })

    it('can change from one field to another', async () => {
      const { getByTestId } = await render(<SortHarness />)
      await fireEvent.click(getByTestId('sort-name-asc'))
      await fireEvent.click(getByTestId('sort-date-desc'))
      expect(getByTestId('field').textContent).toBe('date')
      expect(getByTestId('direction').textContent).toBe('desc')
    })
  })

  describe('toggleSort', () => {
    it('toggle name: first toggle sets to "name" asc', async () => {
      const { getByTestId } = await render(<SortHarness />)
      await fireEvent.click(getByTestId('toggle-name'))
      expect(getByTestId('field').textContent).toBe('name')
      expect(getByTestId('direction').textContent).toBe('asc')
    })

    it('toggle name twice: second toggle flips to desc', async () => {
      const { getByTestId } = await render(<SortHarness />)
      await fireEvent.click(getByTestId('toggle-name'))
      await fireEvent.click(getByTestId('toggle-name'))
      expect(getByTestId('direction').textContent).toBe('desc')
    })

    it('toggle name three times: third flips back to asc', async () => {
      const { getByTestId } = await render(<SortHarness />)
      await fireEvent.click(getByTestId('toggle-name'))
      await fireEvent.click(getByTestId('toggle-name'))
      await fireEvent.click(getByTestId('toggle-name'))
      expect(getByTestId('direction').textContent).toBe('asc')
    })

    it('toggle different field resets to asc', async () => {
      const { getByTestId } = await render(<SortHarness />)
      await fireEvent.click(getByTestId('toggle-name'))
      await fireEvent.click(getByTestId('toggle-name'))
      // now name is desc
      await fireEvent.click(getByTestId('toggle-date'))
      // switching to date resets to asc
      expect(getByTestId('field').textContent).toBe('date')
      expect(getByTestId('direction').textContent).toBe('asc')
    })

    it('toggle date', async () => {
      const { getByTestId } = await render(<SortHarness />)
      await fireEvent.click(getByTestId('toggle-date'))
      expect(getByTestId('field').textContent).toBe('date')
    })

    it('toggle status', async () => {
      const { getByTestId } = await render(<SortHarness />)
      await fireEvent.click(getByTestId('toggle-status'))
      expect(getByTestId('field').textContent).toBe('status')
    })

    it('toggle risk', async () => {
      const { getByTestId } = await render(<SortHarness />)
      await fireEvent.click(getByTestId('toggle-risk'))
      expect(getByTestId('field').textContent).toBe('risk')
    })

    const toggleSequences = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    for (const n of toggleSequences) {
      it(`toggle name ${n} times: direction is ${n % 2 === 0 ? 'desc' : 'asc'} (after first toggle)`, async () => {
        const { getByTestId } = await render(<SortHarness />)
        for (let i = 0; i < n; i++) {
          await fireEvent.click(getByTestId('toggle-name'))
        }
        const expected = n % 2 === 0 ? 'desc' : 'asc'
        expect(getByTestId('direction').textContent).toBe(expected)
      })
    }
  })

  describe('isSortedBy', () => {
    it('isSortedBy("name") is false initially (empty field)', async () => {
      const { getByTestId } = await render(<SortHarness />)
      expect(getByTestId('isSortedByName').textContent).toBe('false')
    })

    it('isSortedBy("name") is true after sorting by name', async () => {
      const { getByTestId } = await render(<SortHarness />)
      await fireEvent.click(getByTestId('sort-name-asc'))
      expect(getByTestId('isSortedByName').textContent).toBe('true')
    })

    it('isSortedBy("date") is false when sorted by name', async () => {
      const { getByTestId } = await render(<SortHarness />)
      await fireEvent.click(getByTestId('sort-name-asc'))
      expect(getByTestId('isSortedByDate').textContent).toBe('false')
    })

    it('isSortedBy("date") is true after sorting by date', async () => {
      const { getByTestId } = await render(<SortHarness />)
      await fireEvent.click(getByTestId('sort-date-asc'))
      expect(getByTestId('isSortedByDate').textContent).toBe('true')
    })
  })

  describe('getSortDirection', () => {
    it('getSortDirection returns null for non-active field', async () => {
      const { getByTestId } = await render(<SortHarness />)
      await fireEvent.click(getByTestId('sort-name-asc'))
      expect(getByTestId('dirForDate').textContent).toBe('null')
    })

    it('getSortDirection returns "asc" for active asc field', async () => {
      const { getByTestId } = await render(<SortHarness />)
      await fireEvent.click(getByTestId('sort-name-asc'))
      expect(getByTestId('dirForName').textContent).toBe('asc')
    })

    it('getSortDirection returns "desc" for active desc field', async () => {
      const { getByTestId } = await render(<SortHarness />)
      await fireEvent.click(getByTestId('sort-name-desc'))
      expect(getByTestId('dirForName').textContent).toBe('desc')
    })
  })

  describe('resetSort', () => {
    it('reset reverts to initial field', async () => {
      const { getByTestId } = await render(<SortHarness initialField="name" initialDir="asc" />)
      await fireEvent.click(getByTestId('sort-date-desc'))
      await fireEvent.click(getByTestId('reset'))
      expect(getByTestId('field').textContent).toBe('name')
    })

    it('reset reverts to initial direction', async () => {
      const { getByTestId } = await render(<SortHarness initialField="name" initialDir="desc" />)
      await fireEvent.click(getByTestId('sort-date-asc'))
      await fireEvent.click(getByTestId('reset'))
      expect(getByTestId('direction').textContent).toBe('desc')
    })

    it('reset from empty field state stays empty', async () => {
      const { getByTestId } = await render(<SortHarness />)
      await fireEvent.click(getByTestId('sort-name-asc'))
      await fireEvent.click(getByTestId('reset'))
      expect(getByTestId('field').textContent).toBe('')
    })
  })
})

describe('useSort - isSortedBy after various setSort calls', () => {
  const sortCases = [
    { btn: 'sort-name-asc', testid: 'isSortedByName', expected: 'true' },
    { btn: 'sort-name-desc', testid: 'isSortedByName', expected: 'true' },
    { btn: 'sort-date-asc', testid: 'isSortedByDate', expected: 'true' },
    { btn: 'sort-date-desc', testid: 'isSortedByDate', expected: 'true' },
    { btn: 'sort-name-asc', testid: 'isSortedByDate', expected: 'false' },
    { btn: 'sort-date-asc', testid: 'isSortedByName', expected: 'false' },
    { btn: 'sort-status', testid: 'isSortedByStatus', expected: 'true' },
    { btn: 'sort-status', testid: 'isSortedByName', expected: 'false' },
    { btn: 'sort-status', testid: 'isSortedByDate', expected: 'false' },
    { btn: 'sort-name-asc', testid: 'isSortedByStatus', expected: 'false' },
  ]
  for (const c of sortCases) {
    it(`after ${c.btn}: ${c.testid} = ${c.expected}`, async () => {
      const { getByTestId } = await render(<SortHarness />)
      await fireEvent.click(getByTestId(c.btn))
      expect(getByTestId(c.testid).textContent).toBe(c.expected)
    })
  }
})

describe('useSort - field stays after sequential sorts', () => {
  const fieldSequences = [
    { ops: ['sort-name-asc', 'sort-date-asc'], expectedField: 'date' },
    { ops: ['sort-date-desc', 'sort-name-asc'], expectedField: 'name' },
    { ops: ['sort-status', 'sort-risk'], expectedField: 'risk' },
    { ops: ['sort-risk', 'sort-status'], expectedField: 'status' },
    { ops: ['sort-name-asc', 'sort-name-desc'], expectedField: 'name' },
    { ops: ['sort-date-asc', 'sort-date-desc'], expectedField: 'date' },
    { ops: ['sort-name-asc', 'sort-date-desc', 'sort-status'], expectedField: 'status' },
    { ops: ['sort-status', 'sort-name-asc', 'sort-date-asc'], expectedField: 'date' },
  ]
  for (const c of fieldSequences) {
    it(`ops [${c.ops.join(', ')}] => field="${c.expectedField}"`, async () => {
      const { getByTestId } = await render(<SortHarness />)
      for (const op of c.ops) {
        await fireEvent.click(getByTestId(op))
      }
      expect(getByTestId('field').textContent).toBe(c.expectedField)
    })
  }
})

describe('useSort - direction after sequential sorts', () => {
  const dirSequences = [
    { ops: ['sort-name-asc', 'sort-name-desc'], expectedDir: 'desc' },
    { ops: ['sort-name-desc', 'sort-name-asc'], expectedDir: 'asc' },
    { ops: ['sort-date-desc', 'sort-date-asc'], expectedDir: 'asc' },
    { ops: ['sort-date-asc', 'sort-date-desc'], expectedDir: 'desc' },
    { ops: ['sort-name-asc', 'sort-date-desc'], expectedDir: 'desc' },
    { ops: ['sort-name-desc', 'sort-date-asc'], expectedDir: 'asc' },
    { ops: ['sort-status'], expectedDir: 'asc' },
    { ops: ['sort-risk'], expectedDir: 'asc' },
    { ops: ['toggle-name', 'toggle-name'], expectedDir: 'desc' },
    { ops: ['toggle-name', 'toggle-name', 'toggle-name'], expectedDir: 'asc' },
    { ops: ['toggle-date', 'toggle-date'], expectedDir: 'desc' },
    { ops: ['toggle-date', 'toggle-name'], expectedDir: 'asc' },
  ]
  for (const c of dirSequences) {
    it(`ops [${c.ops.join(', ')}] => dir="${c.expectedDir}"`, async () => {
      const { getByTestId } = await render(<SortHarness />)
      for (const op of c.ops) {
        await fireEvent.click(getByTestId(op))
      }
      expect(getByTestId('direction').textContent).toBe(c.expectedDir)
    })
  }
})

describe('useSort - reset after many operations', () => {
  const resetCases = [
    { ops: ['sort-name-asc'], afterField: '', afterDir: 'asc' },
    { ops: ['sort-date-desc'], afterField: '', afterDir: 'asc' },
    { ops: ['toggle-name', 'toggle-name'], afterField: '', afterDir: 'asc' },
    { ops: ['sort-status', 'sort-risk'], afterField: '', afterDir: 'asc' },
    { ops: ['toggle-date', 'toggle-name', 'sort-date-asc'], afterField: '', afterDir: 'asc' },
  ]
  for (const c of resetCases) {
    it(`after [${c.ops.join(', ')}] + reset: field="${c.afterField}" dir="${c.afterDir}"`, async () => {
      const { getByTestId } = await render(<SortHarness />)
      for (const op of c.ops) {
        await fireEvent.click(getByTestId(op))
      }
      await fireEvent.click(getByTestId('reset'))
      expect(getByTestId('field').textContent).toBe(c.afterField)
      expect(getByTestId('direction').textContent).toBe(c.afterDir)
    })
  }
})

describe('useSort - toggle field systematic tests', () => {
  const fieldToggleCases = [
    { field: 'toggle-name', expectField: 'name' },
    { field: 'toggle-date', expectField: 'date' },
    { field: 'toggle-status', expectField: 'status' },
    { field: 'toggle-risk', expectField: 'risk' },
  ]
  const times = [1, 2, 3, 4, 5]
  for (const c of fieldToggleCases) {
    for (const n of times) {
      it(`${c.field} ${n} times: field="${c.expectField}"`, async () => {
        const { getByTestId } = await render(<SortHarness />)
        for (let i = 0; i < n; i++) {
          await fireEvent.click(getByTestId(c.field))
        }
        expect(getByTestId('field').textContent).toBe(c.expectField)
      })
    }
  }
})

describe('useSort - getSortDirection for various fields', () => {
  const dirCases = [
    { btn: 'sort-name-asc', testid: 'dirForName', expected: 'asc' },
    { btn: 'sort-name-desc', testid: 'dirForName', expected: 'desc' },
    { btn: 'sort-date-asc', testid: 'dirForDate', expected: 'asc' },
    { btn: 'sort-date-desc', testid: 'dirForDate', expected: 'desc' },
    { btn: 'sort-name-asc', testid: 'dirForDate', expected: 'null' },
    { btn: 'sort-date-asc', testid: 'dirForName', expected: 'null' },
  ]
  for (const c of dirCases) {
    it(`after ${c.btn}: getSortDirection for ${c.testid} = "${c.expected}"`, async () => {
      const { getByTestId } = await render(<SortHarness />)
      await fireEvent.click(getByTestId(c.btn))
      expect(getByTestId(c.testid).textContent).toBe(c.expected)
    })
  }
})
