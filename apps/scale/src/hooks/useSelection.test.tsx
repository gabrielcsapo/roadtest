import { describe, it, expect, render, fireEvent } from '@viewtest/core'
import React from 'react'
import { useSelection } from './useSelection'

function SelectionHarness({ initialIds = [] as string[] }) {
  const { selectedIds, isSelected, toggle, select, deselect, selectAll, deselectAll, selectedCount, hasSelection } = useSelection(initialIds)
  const ALL_IDS = ['id1', 'id2', 'id3', 'id4', 'id5']
  return (
    <div>
      <span data-testid="count">{selectedCount}</span>
      <span data-testid="hasSelection">{String(hasSelection)}</span>
      <span data-testid="selected-id1">{String(isSelected('id1'))}</span>
      <span data-testid="selected-id2">{String(isSelected('id2'))}</span>
      <span data-testid="selected-id3">{String(isSelected('id3'))}</span>
      <span data-testid="selected-id4">{String(isSelected('id4'))}</span>
      <span data-testid="selected-id5">{String(isSelected('id5'))}</span>
      <span data-testid="ids">{[...selectedIds].sort().join(',')}</span>

      <button data-testid="toggle-id1" onClick={() => toggle('id1')}>toggle id1</button>
      <button data-testid="toggle-id2" onClick={() => toggle('id2')}>toggle id2</button>
      <button data-testid="toggle-id3" onClick={() => toggle('id3')}>toggle id3</button>
      <button data-testid="toggle-id4" onClick={() => toggle('id4')}>toggle id4</button>
      <button data-testid="toggle-id5" onClick={() => toggle('id5')}>toggle id5</button>

      <button data-testid="select-id1" onClick={() => select('id1')}>select id1</button>
      <button data-testid="select-id2" onClick={() => select('id2')}>select id2</button>
      <button data-testid="select-id3" onClick={() => select('id3')}>select id3</button>

      <button data-testid="deselect-id1" onClick={() => deselect('id1')}>deselect id1</button>
      <button data-testid="deselect-id2" onClick={() => deselect('id2')}>deselect id2</button>

      <button data-testid="select-all" onClick={() => selectAll(ALL_IDS)}>select all</button>
      <button data-testid="deselect-all" onClick={deselectAll}>deselect all</button>
    </div>
  )
}

describe('useSelection', () => {
  describe('initial state with empty selection', () => {
    it('selectedCount is 0 initially', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      expect(getByTestId('count').textContent).toBe('0')
    })

    it('hasSelection is false initially', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      expect(getByTestId('hasSelection').textContent).toBe('false')
    })

    it('id1 is not selected initially', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      expect(getByTestId('selected-id1').textContent).toBe('false')
    })

    it('id2 is not selected initially', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      expect(getByTestId('selected-id2').textContent).toBe('false')
    })

    it('ids string is empty initially', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      expect(getByTestId('ids').textContent).toBe('')
    })
  })

  describe('initial state with pre-selected IDs', () => {
    const preSelectedCases = [
      { ids: ['id1'], count: 1 },
      { ids: ['id1', 'id2'], count: 2 },
      { ids: ['id1', 'id2', 'id3'], count: 3 },
      { ids: ['id1', 'id2', 'id3', 'id4'], count: 4 },
      { ids: ['id1', 'id2', 'id3', 'id4', 'id5'], count: 5 },
    ]
    for (const c of preSelectedCases) {
      it(`initializes with ${c.count} pre-selected IDs`, async () => {
        const { getByTestId } = await render(<SelectionHarness initialIds={c.ids} />)
        expect(getByTestId('count').textContent).toBe(String(c.count))
      })
    }

    const idChecks = ['id1', 'id2', 'id3', 'id4', 'id5']
    for (const id of idChecks) {
      it(`${id} is selected when initialized with it`, async () => {
        const { getByTestId } = await render(<SelectionHarness initialIds={[id]} />)
        expect(getByTestId(`selected-${id}`).textContent).toBe('true')
      })
    }
  })

  describe('toggle', () => {
    it('toggle id1 selects it', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId('toggle-id1'))
      expect(getByTestId('selected-id1').textContent).toBe('true')
    })

    it('toggle id1 twice deselects it', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId('toggle-id1'))
      await fireEvent.click(getByTestId('toggle-id1'))
      expect(getByTestId('selected-id1').textContent).toBe('false')
    })

    it('toggle increments count by 1', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId('toggle-id1'))
      expect(getByTestId('count').textContent).toBe('1')
    })

    it('toggle twice returns count to 0', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId('toggle-id1'))
      await fireEvent.click(getByTestId('toggle-id1'))
      expect(getByTestId('count').textContent).toBe('0')
    })

    const toggleIds = ['id1', 'id2', 'id3', 'id4', 'id5']
    for (const id of toggleIds) {
      it(`toggle ${id} makes it selected`, async () => {
        const { getByTestId } = await render(<SelectionHarness />)
        await fireEvent.click(getByTestId(`toggle-${id}`))
        expect(getByTestId(`selected-${id}`).textContent).toBe('true')
      })
    }

    it('toggling multiple IDs accumulates selection', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId('toggle-id1'))
      await fireEvent.click(getByTestId('toggle-id2'))
      await fireEvent.click(getByTestId('toggle-id3'))
      expect(getByTestId('count').textContent).toBe('3')
    })

    it('hasSelection becomes true after toggle', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId('toggle-id1'))
      expect(getByTestId('hasSelection').textContent).toBe('true')
    })

    it('hasSelection becomes false after toggling back off', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId('toggle-id1'))
      await fireEvent.click(getByTestId('toggle-id1'))
      expect(getByTestId('hasSelection').textContent).toBe('false')
    })
  })

  describe('select and deselect', () => {
    it('select id1 adds it to selection', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId('select-id1'))
      expect(getByTestId('selected-id1').textContent).toBe('true')
    })

    it('select same id twice does not duplicate', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId('select-id1'))
      await fireEvent.click(getByTestId('select-id1'))
      expect(getByTestId('count').textContent).toBe('1')
    })

    it('deselect id1 removes it', async () => {
      const { getByTestId } = await render(<SelectionHarness initialIds={['id1']} />)
      await fireEvent.click(getByTestId('deselect-id1'))
      expect(getByTestId('selected-id1').textContent).toBe('false')
    })

    it('deselect non-selected id is safe', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId('deselect-id1'))
      expect(getByTestId('count').textContent).toBe('0')
    })

    it('select id1 and id2 gives count=2', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId('select-id1'))
      await fireEvent.click(getByTestId('select-id2'))
      expect(getByTestId('count').textContent).toBe('2')
    })

    it('deselect id2 after selecting id1 and id2 gives count=1', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId('select-id1'))
      await fireEvent.click(getByTestId('select-id2'))
      await fireEvent.click(getByTestId('deselect-id2'))
      expect(getByTestId('count').textContent).toBe('1')
    })
  })

  describe('selectAll and deselectAll', () => {
    it('selectAll selects all 5 IDs', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId('select-all'))
      expect(getByTestId('count').textContent).toBe('5')
    })

    it('selectAll makes hasSelection true', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId('select-all'))
      expect(getByTestId('hasSelection').textContent).toBe('true')
    })

    it('deselectAll clears all selections', async () => {
      const { getByTestId } = await render(<SelectionHarness initialIds={['id1', 'id2', 'id3']} />)
      await fireEvent.click(getByTestId('deselect-all'))
      expect(getByTestId('count').textContent).toBe('0')
    })

    it('deselectAll makes hasSelection false', async () => {
      const { getByTestId } = await render(<SelectionHarness initialIds={['id1']} />)
      await fireEvent.click(getByTestId('deselect-all'))
      expect(getByTestId('hasSelection').textContent).toBe('false')
    })

    it('selectAll then deselectAll gives count=0', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId('select-all'))
      await fireEvent.click(getByTestId('deselect-all'))
      expect(getByTestId('count').textContent).toBe('0')
    })

    it('deselectAll on already empty is safe', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId('deselect-all'))
      expect(getByTestId('count').textContent).toBe('0')
    })
  })

  describe('complex interactions', () => {
    it('select all -> deselect one -> count is 4', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId('select-all'))
      await fireEvent.click(getByTestId('deselect-id1'))
      expect(getByTestId('count').textContent).toBe('4')
    })

    it('toggle all 5 IDs one at a time', async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      for (const id of ['id1', 'id2', 'id3', 'id4', 'id5']) {
        await fireEvent.click(getByTestId(`toggle-${id}`))
      }
      expect(getByTestId('count').textContent).toBe('5')
    })
  })
})

describe('useSelection - selectedCount after multiple toggles', () => {
  const countCases = [
    { ops: ['toggle-id1'], expected: '1' },
    { ops: ['toggle-id1', 'toggle-id2'], expected: '2' },
    { ops: ['toggle-id1', 'toggle-id2', 'toggle-id3'], expected: '3' },
    { ops: ['toggle-id1', 'toggle-id2', 'toggle-id3', 'toggle-id4'], expected: '4' },
    { ops: ['toggle-id1', 'toggle-id2', 'toggle-id3', 'toggle-id4', 'toggle-id5'], expected: '5' },
    { ops: ['toggle-id1', 'toggle-id1'], expected: '0' },
    { ops: ['toggle-id1', 'toggle-id2', 'toggle-id1'], expected: '1' },
    { ops: ['toggle-id2', 'toggle-id3', 'toggle-id2'], expected: '1' },
    { ops: ['toggle-id1', 'toggle-id1', 'toggle-id2', 'toggle-id2'], expected: '0' },
    { ops: ['toggle-id3', 'toggle-id4', 'toggle-id5'], expected: '3' },
    { ops: ['toggle-id1', 'toggle-id2', 'toggle-id3', 'toggle-id1'], expected: '2' },
    { ops: ['toggle-id5'], expected: '1' },
    { ops: ['toggle-id4', 'toggle-id5'], expected: '2' },
    { ops: ['toggle-id3', 'toggle-id3', 'toggle-id4'], expected: '1' },
    { ops: ['toggle-id1', 'toggle-id2', 'toggle-id3', 'toggle-id4', 'toggle-id1'], expected: '4' },
  ]
  for (const c of countCases) {
    it(`ops [${c.ops.join(', ')}] => count=${c.expected}`, async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      for (const op of c.ops) {
        await fireEvent.click(getByTestId(op))
      }
      expect(getByTestId('count').textContent).toBe(c.expected)
    })
  }
})

describe('useSelection - select and deselect all patterns', () => {
  const allIds = ['id1', 'id2', 'id3', 'id4', 'id5']
  for (const id of allIds) {
    it(`after selectAll, ${id} is selected`, async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId('select-all'))
      expect(getByTestId(`selected-${id}`).textContent).toBe('true')
    })
  }

  for (const id of allIds) {
    it(`after selectAll then deselectAll, ${id} is not selected`, async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId('select-all'))
      await fireEvent.click(getByTestId('deselect-all'))
      expect(getByTestId(`selected-${id}`).textContent).toBe('false')
    })
  }
})

describe('useSelection - hasSelection states', () => {
  const hasCases = [
    { label: 'no ops', ops: [], expected: 'false' },
    { label: 'one toggle', ops: ['toggle-id1'], expected: 'true' },
    { label: 'toggle on then off', ops: ['toggle-id1', 'toggle-id1'], expected: 'false' },
    { label: 'select-all', ops: ['select-all'], expected: 'true' },
    { label: 'select-all then deselect-all', ops: ['select-all', 'deselect-all'], expected: 'false' },
    { label: 'select-id1', ops: ['select-id1'], expected: 'true' },
    { label: 'select-id2', ops: ['select-id2'], expected: 'true' },
    { label: 'select-id3', ops: ['select-id3'], expected: 'true' },
    { label: 'deselect-id1 with none selected', ops: ['deselect-id1'], expected: 'false' },
    { label: 'toggle-id2 and toggle-id3', ops: ['toggle-id2', 'toggle-id3'], expected: 'true' },
  ]
  for (const c of hasCases) {
    it(`hasSelection after ${c.label} = ${c.expected}`, async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      for (const op of c.ops) {
        await fireEvent.click(getByTestId(op))
      }
      expect(getByTestId('hasSelection').textContent).toBe(c.expected)
    })
  }
})

describe('useSelection - ids string accumulation', () => {
  const idsCases = [
    { ops: ['toggle-id1'], contains: 'id1' },
    { ops: ['toggle-id2'], contains: 'id2' },
    { ops: ['toggle-id3'], contains: 'id3' },
    { ops: ['toggle-id4'], contains: 'id4' },
    { ops: ['toggle-id5'], contains: 'id5' },
    { ops: ['toggle-id1', 'toggle-id2'], contains: 'id1' },
    { ops: ['toggle-id1', 'toggle-id2'], contains: 'id2' },
    { ops: ['select-all'], contains: 'id3' },
    { ops: ['select-all'], contains: 'id4' },
    { ops: ['select-all'], contains: 'id5' },
  ]
  for (const c of idsCases) {
    it(`ops [${c.ops.join(', ')}] => ids contains "${c.contains}"`, async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      for (const op of c.ops) {
        await fireEvent.click(getByTestId(op))
      }
      expect(getByTestId('ids').textContent).toContain(c.contains)
    })
  }
})

describe('useSelection - toggle pairs across all id combinations', () => {
  const pairs = [
    ['id1', 'id2'], ['id1', 'id3'], ['id1', 'id4'], ['id1', 'id5'],
    ['id2', 'id3'], ['id2', 'id4'], ['id2', 'id5'],
    ['id3', 'id4'], ['id3', 'id5'],
    ['id4', 'id5'],
  ]
  for (const [a, b] of pairs) {
    it(`toggle ${a} and ${b} => count=2`, async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId(`toggle-${a}`))
      await fireEvent.click(getByTestId(`toggle-${b}`))
      expect(getByTestId('count').textContent).toBe('2')
    })
  }
})

describe('useSelection - select individual then deselect all', () => {
  const singleIds = ['id1', 'id2', 'id3', 'id4', 'id5']
  for (const id of singleIds) {
    it(`select ${id} then deselect-all: count=0`, async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId(`toggle-${id}`))
      await fireEvent.click(getByTestId('deselect-all'))
      expect(getByTestId('count').textContent).toBe('0')
    })
  }
})

describe('useSelection - pre-selected + toggle off each', () => {
  const allIds = ['id1', 'id2', 'id3', 'id4', 'id5']
  for (const id of allIds) {
    it(`pre-select ${id} then toggle off: count=0`, async () => {
      const { getByTestId } = await render(<SelectionHarness initialIds={[id]} />)
      await fireEvent.click(getByTestId(`toggle-${id}`))
      expect(getByTestId('count').textContent).toBe('0')
    })
  }
})

describe('useSelection - three-way toggle tests', () => {
  const tripleIds = ['id1', 'id2', 'id3', 'id4', 'id5']
  for (const id of tripleIds) {
    it(`toggle ${id} three times: count=1`, async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId(`toggle-${id}`))
      await fireEvent.click(getByTestId(`toggle-${id}`))
      await fireEvent.click(getByTestId(`toggle-${id}`))
      expect(getByTestId('count').textContent).toBe('1')
    })
  }
})

describe('useSelection - selectAll then toggle each off', () => {
  const allIds = ['id1', 'id2', 'id3', 'id4', 'id5']
  for (const id of allIds) {
    it(`selectAll then toggle-off ${id}: count=4, ${id} is false`, async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId('select-all'))
      await fireEvent.click(getByTestId(`toggle-${id}`))
      expect(getByTestId('count').textContent).toBe('4')
      expect(getByTestId(`selected-${id}`).textContent).toBe('false')
    })
  }
})

describe('useSelection - selectedCount with 5 pre-selected toggling all off', () => {
  const allIds = ['id1', 'id2', 'id3', 'id4', 'id5']
  it('toggle all 5 IDs off when pre-selected: count=0', async () => {
    const { getByTestId } = await render(<SelectionHarness initialIds={['id1', 'id2', 'id3', 'id4', 'id5']} />)
    for (const id of allIds) {
      await fireEvent.click(getByTestId(`toggle-${id}`))
    }
    expect(getByTestId('count').textContent).toBe('0')
  })

  it('toggle all 5 IDs off when pre-selected: hasSelection=false', async () => {
    const { getByTestId } = await render(<SelectionHarness initialIds={['id1', 'id2', 'id3', 'id4', 'id5']} />)
    for (const id of allIds) {
      await fireEvent.click(getByTestId(`toggle-${id}`))
    }
    expect(getByTestId('hasSelection').textContent).toBe('false')
  })

  const remainIds = ['id1', 'id2', 'id3', 'id4', 'id5']
  for (const id of remainIds) {
    it(`after removing all, ${id} is not selected`, async () => {
      const { getByTestId } = await render(<SelectionHarness initialIds={['id1', 'id2', 'id3', 'id4', 'id5']} />)
      for (const tid of allIds) {
        await fireEvent.click(getByTestId(`toggle-${tid}`))
      }
      expect(getByTestId(`selected-${id}`).textContent).toBe('false')
    })
  }
})

describe('useSelection - select then deselect specific', () => {
  const dsCases = [
    { select: 'select-id1', deselect: 'deselect-id1', expected: '0' },
    { select: 'select-id2', deselect: 'deselect-id2', expected: '0' },
    { select: 'select-id3', deselect: 'deselect-id1', expected: '1' },
    { select: 'select-id1', deselect: 'deselect-id2', expected: '1' },
    { select: 'select-id2', deselect: 'deselect-id1', expected: '1' },
  ]
  for (const c of dsCases) {
    it(`${c.select} then ${c.deselect}: count=${c.expected}`, async () => {
      const { getByTestId } = await render(<SelectionHarness />)
      await fireEvent.click(getByTestId(c.select))
      await fireEvent.click(getByTestId(c.deselect))
      expect(getByTestId('count').textContent).toBe(c.expected)
    })
  }
})
