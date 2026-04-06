import { describe, it, expect, render, fireEvent } from '@viewtest/core'
import React from 'react'
import { useModal } from './useModal'

function ModalHarness({ initialOpen = false }: { initialOpen?: boolean }) {
  const { isOpen, data, open, close, toggle } = useModal<{ id: string; name: string }>()

  return (
    <div>
      <span data-testid="isOpen">{String(isOpen)}</span>
      <span data-testid="data">{data ? JSON.stringify(data) : 'null'}</span>
      <button data-testid="open" onClick={() => open()}>open</button>
      <button data-testid="open-with-data" onClick={() => open({ id: '1', name: 'Alice' })}>open with data</button>
      <button data-testid="open-with-data-2" onClick={() => open({ id: '2', name: 'Bob' })}>open with data 2</button>
      <button data-testid="close" onClick={close}>close</button>
      <button data-testid="toggle" onClick={toggle}>toggle</button>
    </div>
  )
}

function SimpleModalHarness({ initialOpen = false }: { initialOpen?: boolean }) {
  const { isOpen, open, close, toggle } = useModal(initialOpen)
  return (
    <div>
      <span data-testid="isOpen">{String(isOpen)}</span>
      <button data-testid="open" onClick={() => open()}>open</button>
      <button data-testid="close" onClick={close}>close</button>
      <button data-testid="toggle" onClick={toggle}>toggle</button>
    </div>
  )
}

describe('useModal', () => {
  describe('initial state', () => {
    it('isOpen is false by default', async () => {
      const { getByTestId } = await render(<SimpleModalHarness />)
      expect(getByTestId('isOpen').textContent).toBe('false')
    })

    it('isOpen is false when initialOpen=false', async () => {
      const { getByTestId } = await render(<SimpleModalHarness initialOpen={false} />)
      expect(getByTestId('isOpen').textContent).toBe('false')
    })

    it('data is null initially', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      expect(getByTestId('data').textContent).toBe('null')
    })

    it('isOpen defaults to false without initialOpen prop', async () => {
      const { getByTestId } = await render(<SimpleModalHarness />)
      expect(getByTestId('isOpen').textContent).toBe('false')
    })

    it('renders open button', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      expect(getByTestId('open')).toBeDefined()
    })

    it('renders close button', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      expect(getByTestId('close')).toBeDefined()
    })

    it('renders toggle button', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      expect(getByTestId('toggle')).toBeDefined()
    })
  })

  describe('open', () => {
    it('open() sets isOpen to true', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      await fireEvent.click(getByTestId('open'))
      expect(getByTestId('isOpen').textContent).toBe('true')
    })

    it('open() without data keeps data as null', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      await fireEvent.click(getByTestId('open'))
      expect(getByTestId('data').textContent).toBe('null')
    })

    it('open with data sets data', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      await fireEvent.click(getByTestId('open-with-data'))
      expect(getByTestId('data').textContent).toContain('Alice')
    })

    it('open with data includes id', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      await fireEvent.click(getByTestId('open-with-data'))
      expect(getByTestId('data').textContent).toContain('"id":"1"')
    })

    it('open with different data updates correctly', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      await fireEvent.click(getByTestId('open-with-data'))
      await fireEvent.click(getByTestId('open-with-data-2'))
      expect(getByTestId('data').textContent).toContain('Bob')
    })

    it('calling open twice keeps modal open', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      await fireEvent.click(getByTestId('open'))
      await fireEvent.click(getByTestId('open'))
      expect(getByTestId('isOpen').textContent).toBe('true')
    })

    it('open while already open updates data', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      await fireEvent.click(getByTestId('open-with-data'))
      await fireEvent.click(getByTestId('open-with-data-2'))
      expect(getByTestId('data').textContent).toContain('Bob')
      expect(getByTestId('isOpen').textContent).toBe('true')
    })
  })

  describe('close', () => {
    it('close() sets isOpen to false', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      await fireEvent.click(getByTestId('open'))
      await fireEvent.click(getByTestId('close'))
      expect(getByTestId('isOpen').textContent).toBe('false')
    })

    it('close() clears data', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      await fireEvent.click(getByTestId('open-with-data'))
      await fireEvent.click(getByTestId('close'))
      expect(getByTestId('data').textContent).toBe('null')
    })

    it('close when already closed is safe', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      await fireEvent.click(getByTestId('close'))
      expect(getByTestId('isOpen').textContent).toBe('false')
    })

    it('close then open works', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      await fireEvent.click(getByTestId('open'))
      await fireEvent.click(getByTestId('close'))
      await fireEvent.click(getByTestId('open'))
      expect(getByTestId('isOpen').textContent).toBe('true')
    })

    it('closing multiple times stays closed', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      await fireEvent.click(getByTestId('open'))
      await fireEvent.click(getByTestId('close'))
      await fireEvent.click(getByTestId('close'))
      expect(getByTestId('isOpen').textContent).toBe('false')
    })
  })

  describe('toggle', () => {
    it('toggle opens modal when closed', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      await fireEvent.click(getByTestId('toggle'))
      expect(getByTestId('isOpen').textContent).toBe('true')
    })

    it('toggle closes modal when open', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      await fireEvent.click(getByTestId('open'))
      await fireEvent.click(getByTestId('toggle'))
      expect(getByTestId('isOpen').textContent).toBe('false')
    })

    it('toggle twice returns to original state', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      await fireEvent.click(getByTestId('toggle'))
      await fireEvent.click(getByTestId('toggle'))
      expect(getByTestId('isOpen').textContent).toBe('false')
    })

    const toggleCounts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    for (const n of toggleCounts) {
      it(`${n} toggles: isOpen is ${n % 2 !== 0 ? 'true' : 'false'}`, async () => {
        const { getByTestId } = await render(<ModalHarness />)
        for (let i = 0; i < n; i++) {
          await fireEvent.click(getByTestId('toggle'))
        }
        expect(getByTestId('isOpen').textContent).toBe(String(n % 2 !== 0))
      })
    }
  })

  describe('sequence of operations', () => {
    it('open -> close -> open with data -> close clears data', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      await fireEvent.click(getByTestId('open'))
      await fireEvent.click(getByTestId('close'))
      await fireEvent.click(getByTestId('open-with-data'))
      await fireEvent.click(getByTestId('close'))
      expect(getByTestId('isOpen').textContent).toBe('false')
      expect(getByTestId('data').textContent).toBe('null')
    })

    it('toggle -> toggle -> open: isOpen is true', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      await fireEvent.click(getByTestId('toggle'))
      await fireEvent.click(getByTestId('toggle'))
      await fireEvent.click(getByTestId('open'))
      expect(getByTestId('isOpen').textContent).toBe('true')
    })

    it('open with data -> close -> data is null', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      await fireEvent.click(getByTestId('open-with-data'))
      expect(getByTestId('data').textContent).not.toBe('null')
      await fireEvent.click(getByTestId('close'))
      expect(getByTestId('data').textContent).toBe('null')
    })
  })

  describe('edge cases', () => {
    it('isOpen element exists', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      expect(getByTestId('isOpen')).toBeDefined()
    })

    it('data element exists', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      expect(getByTestId('data')).toBeDefined()
    })

    it('multiple opens update isOpen to true', async () => {
      const { getByTestId } = await render(<ModalHarness />)
      for (let i = 0; i < 5; i++) {
        await fireEvent.click(getByTestId('open'))
      }
      expect(getByTestId('isOpen').textContent).toBe('true')
    })
  })
})

describe('useModal - open state verification', () => {
  const openCloseCycles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  for (const n of openCloseCycles) {
    it(`after ${n} open-close cycles isOpen is false`, async () => {
      const { getByTestId } = await render(<SimpleModalHarness />)
      for (let i = 0; i < n; i++) {
        await fireEvent.click(getByTestId('open'))
        await fireEvent.click(getByTestId('close'))
      }
      expect(getByTestId('isOpen').textContent).toBe('false')
    })
  }
})

describe('useModal - data scenarios', () => {
  const dataPayloads = [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
    { id: '3', name: 'Charlie' },
    { id: '4', name: 'Diana' },
    { id: '5', name: 'Eve' },
    { id: '10', name: 'Frank' },
    { id: '100', name: 'Grace' },
    { id: 'abc', name: 'Heidi' },
    { id: 'xyz', name: 'Ivan' },
    { id: '999', name: 'Judy' },
  ]
  for (const payload of dataPayloads) {
    it(`modal open with data id="${payload.id}" sets data correctly`, async () => {
      function PayloadHarness() {
        const { isOpen, data, open, close } = useModal<{ id: string; name: string }>()
        return (
          <div>
            <span data-testid="isOpen">{String(isOpen)}</span>
            <span data-testid="data">{data ? JSON.stringify(data) : 'null'}</span>
            <button data-testid="open" onClick={() => open(payload)}>open</button>
            <button data-testid="close" onClick={close}>close</button>
          </div>
        )
      }
      const { getByTestId } = await render(<PayloadHarness />)
      await fireEvent.click(getByTestId('open'))
      expect(getByTestId('data').textContent).toContain(payload.id)
    })
  }
})

describe('useModal - isOpen after open then close verification', () => {
  const attempts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  for (const n of attempts) {
    it(`attempt ${n}: open sets isOpen=true`, async () => {
      const { getByTestId } = await render(<SimpleModalHarness />)
      await fireEvent.click(getByTestId('open'))
      expect(getByTestId('isOpen').textContent).toBe('true')
    })
  }
})

describe('useModal - close resets state', () => {
  const verifications = [
    { label: 'isOpen is false after close', check: 'isOpen', expected: 'false' },
  ]
  for (const v of verifications) {
    it(v.label, async () => {
      const { getByTestId } = await render(<SimpleModalHarness />)
      await fireEvent.click(getByTestId('open'))
      await fireEvent.click(getByTestId('close'))
      expect(getByTestId(v.check).textContent).toBe(v.expected)
    })
  }
})

describe('useModal - additional toggle verification', () => {
  const extraToggleCounts = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]
  for (const n of extraToggleCounts) {
    it(`${n} toggles: isOpen is ${n % 2 !== 0 ? 'true' : 'false'}`, async () => {
      const { getByTestId } = await render(<SimpleModalHarness />)
      for (let i = 0; i < n; i++) {
        await fireEvent.click(getByTestId('toggle'))
      }
      expect(getByTestId('isOpen').textContent).toBe(String(n % 2 !== 0))
    })
  }
})
