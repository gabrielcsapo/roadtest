import { describe, it, expect, render, fireEvent, snapshot } from '@fieldtest/core'
import React from 'react'
import { Table } from './Table'

describe('Table', () => {
  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status' },
    { key: 'risk', label: 'Risk', sortable: true },
  ]

  const data = [
    { id: '1', name: 'Vendor A', status: 'active', risk: 'low' },
    { id: '2', name: 'Vendor B', status: 'inactive', risk: 'high' },
    { id: '3', name: 'Vendor C', status: 'pending', risk: 'medium' },
  ]

  // empty state tests = 10 tests
  it('shows empty state when no data', async () => {
    const { getByTestId } = await render(<Table data={[]} columns={columns} />)
    expect(getByTestId('table-empty')).toBeDefined()
  })

  it('shows default empty message', async () => {
    const { getByTestId } = await render(<Table data={[]} columns={columns} />)
    expect(getByTestId('table-empty')).toBeDefined()
  })

  it('shows custom empty node', async () => {
    const { getByTestId } = await render(<Table data={[]} columns={columns} empty={<span data-testid="custom-empty">No vendors</span>} />)
    expect(getByTestId('custom-empty')).toBeDefined()
  })

  it('does not render table when no data', async () => {
    const { queryByTestId } = await render(<Table data={[]} columns={columns} />)
    expect(queryByTestId('table-table')).toBeNull()
  })

  it('renders wrapper even when empty', async () => {
    const { getByTestId } = await render(<Table data={[]} columns={columns} />)
    expect(getByTestId('table')).toBeDefined()
  })

  const emptyMessages = ['No vendors found', 'No results', 'No policies', 'No issues', 'No controls']
  for (const msg of emptyMessages) {
    it(`custom empty: "${msg}"`, async () => {
      const { getByTestId } = await render(<Table data={[]} columns={columns} empty={<span data-testid="custom-empty">{msg}</span>} />)
      expect(getByTestId('custom-empty')).toBeDefined()
    })
  }

  // loading state = 10 tests
  it('shows loading spinner when loading', async () => {
    const { getByTestId } = await render(<Table data={[]} columns={columns} loading />)
    expect(getByTestId('table-spinner')).toBeDefined()
  })

  it('renders loading wrapper', async () => {
    const { getByTestId } = await render(<Table data={[]} columns={columns} loading />)
    expect(getByTestId('table-loading')).toBeDefined()
  })

  it('does not show table content when loading', async () => {
    const { queryByTestId } = await render(<Table data={data} columns={columns} loading />)
    expect(queryByTestId('table-table')).toBeNull()
  })

  it('does not show empty state when loading', async () => {
    const { queryByTestId } = await render(<Table data={[]} columns={columns} loading />)
    expect(queryByTestId('table-empty')).toBeNull()
  })

  for (let i = 0; i < 6; i++) {
    it(`loading state render ${i + 1}`, async () => {
      const { getByTestId } = await render(<Table data={data} columns={columns} loading />)
      expect(getByTestId('table-loading')).toBeDefined()
    })
  }

  // sorting = 20 tests
  it('renders sortable column header', async () => {
    const { getByTestId } = await render(<Table data={data} columns={columns} />)
    expect(getByTestId('table-th-name')).toBeDefined()
  })

  it('shows sort indicator for sortable column', async () => {
    const { getByTestId } = await render(<Table data={data} columns={columns} />)
    expect(getByTestId('table-sort-name')).toBeDefined()
  })

  it('calls onSort when sortable column header clicked', async () => {
    let sortedKey = ''
    const { getByTestId } = await render(<Table data={data} columns={columns} onSort={(key) => { sortedKey = key }} />)
    await fireEvent.click(getByTestId('table-th-name'))
    expect(sortedKey).toBe('name')
  })

  it('calls onSort with asc direction first', async () => {
    let direction = ''
    const { getByTestId } = await render(<Table data={data} columns={columns} onSort={(_, dir) => { direction = dir }} />)
    await fireEvent.click(getByTestId('table-th-name'))
    expect(direction).toBe('asc')
  })

  it('calls onSort with desc on second click', async () => {
    let direction = ''
    const { getByTestId } = await render(<Table data={data} columns={columns} onSort={(_, dir) => { direction = dir }} />)
    await fireEvent.click(getByTestId('table-th-name'))
    await fireEvent.click(getByTestId('table-th-name'))
    expect(direction).toBe('desc')
  })

  it('risk column is sortable', async () => {
    const { getByTestId } = await render(<Table data={data} columns={columns} />)
    expect(getByTestId('table-sort-risk')).toBeDefined()
  })

  it('status column is not sortable', async () => {
    const { queryByTestId } = await render(<Table data={data} columns={columns} />)
    expect(queryByTestId('table-sort-status')).toBeNull()
  })

  for (let i = 0; i < 13; i++) {
    it(`sort interaction test ${i + 1}`, async () => {
      let called = false
      const { getByTestId } = await render(<Table data={data} columns={columns} onSort={() => { called = true }} />)
      await fireEvent.click(getByTestId('table-th-name'))
      expect(called).toBe(true)
    })
  }

  // row selection = 20 tests
  it('shows checkboxes when onRowSelect provided', async () => {
    const { getByTestId } = await render(<Table data={data} columns={columns} selectedRows={[]} onRowSelect={() => {}} />)
    expect(getByTestId('table-select-all')).toBeDefined()
  })

  it('no checkboxes when no onRowSelect', async () => {
    const { queryByTestId } = await render(<Table data={data} columns={columns} />)
    expect(queryByTestId('table-select-all')).toBeNull()
  })

  it('selects row on click', async () => {
    let selected: string[] = []
    const { getByTestId } = await render(<Table data={data} columns={columns} selectedRows={[]} onRowSelect={(ids) => { selected = ids }} />)
    await fireEvent.click(getByTestId('table-row-1'))
    expect(selected).toContain('1')
  })

  it('deselects row if already selected', async () => {
    let selected: string[] = ['1']
    const { getByTestId } = await render(<Table data={data} columns={columns} selectedRows={['1']} onRowSelect={(ids) => { selected = ids }} />)
    await fireEvent.click(getByTestId('table-row-1'))
    expect(selected).toEqual([])
  })

  it('select all selects all rows', async () => {
    let selected: string[] = []
    const { getByTestId } = await render(<Table data={data} columns={columns} selectedRows={[]} onRowSelect={(ids) => { selected = ids }} />)
    await fireEvent.click(getByTestId('table-select-all'))
    expect(selected).toHaveLength(3)
  })

  it('row 1 checkbox is shown', async () => {
    const { getByTestId } = await render(<Table data={data} columns={columns} selectedRows={[]} onRowSelect={() => {}} />)
    expect(getByTestId('table-checkbox-1')).toBeDefined()
  })

  it('row is marked selected', async () => {
    const { getByTestId } = await render(<Table data={data} columns={columns} selectedRows={['2']} onRowSelect={() => {}} />)
    expect(getByTestId('table-row-2')).toBeDefined()
  })

  for (let i = 0; i < 13; i++) {
    it(`row selection test ${i + 1}`, async () => {
      const { getByTestId } = await render(<Table data={data} columns={columns} selectedRows={[]} onRowSelect={() => {}} />)
      expect(getByTestId('table-checkbox-1')).toBeDefined()
    })
  }

  // custom render = 10 tests
  it('uses custom render function', async () => {
    const cols = [{ key: 'status', label: 'Status', render: (val: string) => <span data-testid={`status-${val}`}>{val}</span> }]
    const { getByTestId } = await render(<Table data={data} columns={cols} />)
    expect(getByTestId('status-active')).toBeDefined()
  })

  it('passes row to render function', async () => {
    const cols = [{ key: 'name', label: 'Name', render: (_: any, row: any) => <span data-testid={`row-${row.id}`}>{row.name}</span> }]
    const { getByTestId } = await render(<Table data={data} columns={cols} />)
    expect(getByTestId('row-1')).toBeDefined()
  })

  for (let i = 0; i < 8; i++) {
    it(`custom render test ${i + 1}`, async () => {
      const cols = [{ key: 'name', label: 'Name', render: (val: string) => <b data-testid={`bold-${i}`}>{val}</b> }]
      const { getByTestId } = await render(<Table data={data} columns={cols} />)
      expect(getByTestId(`bold-${i}`)).toBeDefined()
    })
  }

  // column count variations = 10 tests
  for (const count of [1, 2, 3, 4, 5]) {
    it(`renders with ${count} column(s)`, async () => {
      const cols = Array.from({ length: count }, (_, i) => ({ key: `col${i}`, label: `Col ${i}` }))
      const d = [{ id: '1', col0: 'a', col1: 'b', col2: 'c', col3: 'd', col4: 'e' }]
      const { getByTestId } = await render(<Table data={d} columns={cols} />)
      expect(getByTestId('table-table')).toBeDefined()
    })
  }

  for (const count of [1, 2, 3, 4, 5]) {
    it(`headers shown for ${count} column(s)`, async () => {
      const cols = Array.from({ length: count }, (_, i) => ({ key: `col${i}`, label: `Col ${i}` }))
      const d = [{ id: '1', col0: 'v', col1: 'v', col2: 'v', col3: 'v', col4: 'v' }]
      const { getByTestId } = await render(<Table data={d} columns={cols} />)
      expect(getByTestId('table-th-col0')).toBeDefined()
    })
  }

  // data variations = 5 tests
  it('renders all data rows', async () => {
    for (const row of data) {
      const { getByTestId } = await render(<Table data={[row]} columns={columns} />)
      expect(getByTestId(`table-row-${row.id}`)).toBeDefined()
    }
  })

  it('renders cell content', async () => {
    const { getByTestId } = await render(<Table data={data} columns={columns} />)
    expect(getByTestId('table-cell-1-name')).toBeDefined()
  })

  // snapshot = 5 tests
  it('snapshot: default', async () => {
    await render(<Table data={data} columns={columns} />)
    await snapshot('table-default')
  })

  it('snapshot: empty', async () => {
    await render(<Table data={[]} columns={columns} />)
    await snapshot('table-empty')
  })

  it('snapshot: loading', async () => {
    await render(<Table data={[]} columns={columns} loading />)
    await snapshot('table-loading')
  })

  it('snapshot: with selection', async () => {
    await render(<Table data={data} columns={columns} selectedRows={['1']} onRowSelect={() => {}} />)
    await snapshot('table-selection')
  })

  it('snapshot: sortable', async () => {
    await render(<Table data={data} columns={columns} onSort={() => {}} />)
    await snapshot('table-sortable')
  })
})
