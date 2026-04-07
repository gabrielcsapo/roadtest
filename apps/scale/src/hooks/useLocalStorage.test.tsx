import { describe, it, expect, render, fireEvent } from '@fieldtest/core'
import React from 'react'
import { useLocalStorage } from './useLocalStorage'

function LocalStorageHarness<T>({ storageKey, initial }: { storageKey: string; initial: T }) {
  const [value, setValue, removeValue] = useLocalStorage<T>(storageKey, initial)
  return (
    <div>
      <span data-testid="value">{JSON.stringify(value)}</span>
      <button data-testid="set-hello" onClick={() => setValue('hello' as unknown as T)}>set hello</button>
      <button data-testid="set-world" onClick={() => setValue('world' as unknown as T)}>set world</button>
      <button data-testid="set-number" onClick={() => setValue(42 as unknown as T)}>set 42</button>
      <button data-testid="set-null" onClick={() => setValue(null as unknown as T)}>set null</button>
      <button data-testid="remove" onClick={removeValue}>remove</button>
      <button data-testid="set-obj" onClick={() => setValue({ name: 'Alice', age: 30 } as unknown as T)}>set obj</button>
      <button data-testid="set-arr" onClick={() => setValue([1, 2, 3] as unknown as T)}>set arr</button>
      <button data-testid="set-empty" onClick={() => setValue('' as unknown as T)}>set empty</button>
      <button data-testid="set-bool-true" onClick={() => setValue(true as unknown as T)}>set true</button>
      <button data-testid="set-bool-false" onClick={() => setValue(false as unknown as T)}>set false</button>
    </div>
  )
}

describe('useLocalStorage', () => {
  describe('initial state with string values', () => {
    const initialValues = ['', 'hello', 'world', 'test', 'foo', 'bar', 'baz', 'long string value', 'unicode: 日本語', 'special: !@#$%']
    for (const val of initialValues) {
      it(`initializes with string value "${val}"`, async () => {
        const { getByTestId } = await render(<LocalStorageHarness storageKey={`test-str-${val}`} initial={val} />)
        expect(getByTestId('value').textContent).toBe(JSON.stringify(val))
      })
    }
  })

  describe('initial state with numeric values', () => {
    const initialValues = [0, 1, -1, 42, 100, 999, -100, 3.14, 0.001, 1000000]
    for (const val of initialValues) {
      it(`initializes with numeric value ${val}`, async () => {
        const { getByTestId } = await render(<LocalStorageHarness storageKey={`test-num-${val}`} initial={val} />)
        expect(getByTestId('value').textContent).toBe(JSON.stringify(val))
      })
    }
  })

  describe('setting values', () => {
    it('sets value to "hello"', async () => {
      const { getByTestId } = await render(<LocalStorageHarness storageKey="test-set-1" initial="" />)
      await fireEvent.click(getByTestId('set-hello'))
      expect(getByTestId('value').textContent).toBe('"hello"')
    })

    it('sets value to "world"', async () => {
      const { getByTestId } = await render(<LocalStorageHarness storageKey="test-set-2" initial="" />)
      await fireEvent.click(getByTestId('set-world'))
      expect(getByTestId('value').textContent).toBe('"world"')
    })

    it('sets value to number 42', async () => {
      const { getByTestId } = await render(<LocalStorageHarness storageKey="test-set-3" initial={0} />)
      await fireEvent.click(getByTestId('set-number'))
      expect(getByTestId('value').textContent).toBe('42')
    })

    it('sets value to null', async () => {
      const { getByTestId } = await render(<LocalStorageHarness storageKey="test-set-4" initial="default" />)
      await fireEvent.click(getByTestId('set-null'))
      expect(getByTestId('value').textContent).toBe('null')
    })

    it('sets value to object', async () => {
      const { getByTestId } = await render(<LocalStorageHarness storageKey="test-set-5" initial={{}} />)
      await fireEvent.click(getByTestId('set-obj'))
      expect(getByTestId('value').textContent).toContain('Alice')
    })

    it('sets value to array', async () => {
      const { getByTestId } = await render(<LocalStorageHarness storageKey="test-set-6" initial={[]} />)
      await fireEvent.click(getByTestId('set-arr'))
      expect(getByTestId('value').textContent).toBe('[1,2,3]')
    })

    it('sets value to empty string', async () => {
      const { getByTestId } = await render(<LocalStorageHarness storageKey="test-set-7" initial="start" />)
      await fireEvent.click(getByTestId('set-empty'))
      expect(getByTestId('value').textContent).toBe('""')
    })

    it('sets value to boolean true', async () => {
      const { getByTestId } = await render(<LocalStorageHarness storageKey="test-set-8" initial={false} />)
      await fireEvent.click(getByTestId('set-bool-true'))
      expect(getByTestId('value').textContent).toBe('true')
    })

    it('sets value to boolean false', async () => {
      const { getByTestId } = await render(<LocalStorageHarness storageKey="test-set-9" initial={true} />)
      await fireEvent.click(getByTestId('set-bool-false'))
      expect(getByTestId('value').textContent).toBe('false')
    })

    it('can update value multiple times', async () => {
      const { getByTestId } = await render(<LocalStorageHarness storageKey="test-multi" initial="" />)
      await fireEvent.click(getByTestId('set-hello'))
      expect(getByTestId('value').textContent).toBe('"hello"')
      await fireEvent.click(getByTestId('set-world'))
      expect(getByTestId('value').textContent).toBe('"world"')
    })
  })

  describe('removing values', () => {
    it('removes value and reverts to initial (string)', async () => {
      const { getByTestId } = await render(<LocalStorageHarness storageKey="test-remove-1" initial="default" />)
      await fireEvent.click(getByTestId('set-hello'))
      await fireEvent.click(getByTestId('remove'))
      expect(getByTestId('value').textContent).toBe('"default"')
    })

    it('removes value and reverts to initial (empty string)', async () => {
      const { getByTestId } = await render(<LocalStorageHarness storageKey="test-remove-2" initial="" />)
      await fireEvent.click(getByTestId('set-hello'))
      await fireEvent.click(getByTestId('remove'))
      expect(getByTestId('value').textContent).toBe('""')
    })

    it('removes value and reverts to initial (number)', async () => {
      const { getByTestId } = await render(<LocalStorageHarness storageKey="test-remove-3" initial={0} />)
      await fireEvent.click(getByTestId('set-number'))
      await fireEvent.click(getByTestId('remove'))
      expect(getByTestId('value').textContent).toBe('0')
    })

    it('calling remove on untouched state keeps initial', async () => {
      const { getByTestId } = await render(<LocalStorageHarness storageKey="test-remove-4" initial="initial" />)
      await fireEvent.click(getByTestId('remove'))
      expect(getByTestId('value').textContent).toBe('"initial"')
    })
  })

  describe('sequence of operations', () => {
    const sequences = [
      { key: 'seq-1', ops: ['set-hello', 'set-world'], final: '"world"' },
      { key: 'seq-2', ops: ['set-number', 'set-hello'], final: '"hello"' },
      { key: 'seq-3', ops: ['set-hello', 'remove'], final: '""' },
    ]
    for (const seq of sequences) {
      it(`sequence [${seq.ops.join(', ')}] ends with ${seq.final}`, async () => {
        const { getByTestId } = await render(<LocalStorageHarness storageKey={seq.key} initial="" />)
        for (const op of seq.ops) {
          await fireEvent.click(getByTestId(op))
        }
        expect(getByTestId('value').textContent).toBe(seq.final)
      })
    }
  })

  describe('different storage keys', () => {
    const keys = ['key-a', 'key-b', 'my-key', 'user-pref', 'app-state', 'config', 'session', 'data', 'cache', 'store']
    for (const k of keys) {
      it(`works with storage key "${k}"`, async () => {
        const { getByTestId } = await render(<LocalStorageHarness storageKey={k} initial="initial" />)
        expect(getByTestId('value').textContent).toBe('"initial"')
        await fireEvent.click(getByTestId('set-hello'))
        expect(getByTestId('value').textContent).toBe('"hello"')
      })
    }
  })

  describe('edge cases', () => {
    it('renders value span', async () => {
      const { getByTestId } = await render(<LocalStorageHarness storageKey="edge-1" initial="x" />)
      expect(getByTestId('value')).toBeDefined()
    })

    it('renders remove button', async () => {
      const { getByTestId } = await render(<LocalStorageHarness storageKey="edge-2" initial="x" />)
      expect(getByTestId('remove')).toBeDefined()
    })

    it('handles boolean initial value false', async () => {
      const { getByTestId } = await render(<LocalStorageHarness storageKey="edge-3" initial={false} />)
      expect(getByTestId('value').textContent).toBe('false')
    })

    it('handles array initial value', async () => {
      const { getByTestId } = await render(<LocalStorageHarness storageKey="edge-4" initial={[]} />)
      expect(getByTestId('value').textContent).toBe('[]')
    })

    it('handles object initial value', async () => {
      const { getByTestId } = await render(<LocalStorageHarness storageKey="edge-5" initial={{}} />)
      expect(getByTestId('value').textContent).toBe('{}')
    })
  })
})

describe('useLocalStorage - value persistence through set/remove cycles', () => {
  const cycleKeys = ['cyc-1', 'cyc-2', 'cyc-3', 'cyc-4', 'cyc-5', 'cyc-6', 'cyc-7', 'cyc-8', 'cyc-9', 'cyc-10']
  for (const key of cycleKeys) {
    it(`set then remove with key "${key}" reverts to initial`, async () => {
      const { getByTestId } = await render(<LocalStorageHarness storageKey={key} initial="init" />)
      await fireEvent.click(getByTestId('set-hello'))
      await fireEvent.click(getByTestId('remove'))
      expect(getByTestId('value').textContent).toBe('"init"')
    })
  }
})

describe('useLocalStorage - type-specific initial values', () => {
  const typeCases = [
    { initial: 'string-val', expected: '"string-val"' },
    { initial: '', expected: '""' },
    { initial: 'a', expected: '"a"' },
    { initial: 'z', expected: '"z"' },
    { initial: 'hello world', expected: '"hello world"' },
    { initial: '123', expected: '"123"' },
    { initial: 'true', expected: '"true"' },
    { initial: 'false', expected: '"false"' },
    { initial: 'null', expected: '"null"' },
    { initial: 'undefined', expected: '"undefined"' },
    { initial: 'test-key', expected: '"test-key"' },
    { initial: 'my value', expected: '"my value"' },
  ]
  for (const c of typeCases) {
    it(`initial string "${c.initial}" shows as ${c.expected}`, async () => {
      const key = `type-case-${c.initial.slice(0, 5)}`
      const { getByTestId } = await render(<LocalStorageHarness storageKey={key} initial={c.initial} />)
      expect(getByTestId('value').textContent).toBe(c.expected)
    })
  }
})

describe('useLocalStorage - multi-step sequences', () => {
  const stepSequences = [
    { key: 'ms-1', ops: ['set-hello', 'set-world', 'set-hello'], expected: '"hello"' },
    { key: 'ms-2', ops: ['set-number', 'set-hello', 'set-number'], expected: '42' },
    { key: 'ms-3', ops: ['set-bool-true', 'set-bool-false'], expected: 'false' },
    { key: 'ms-4', ops: ['set-bool-false', 'set-bool-true'], expected: 'true' },
    { key: 'ms-5', ops: ['set-obj', 'remove'], expected: '""' },
    { key: 'ms-6', ops: ['set-arr', 'remove'], expected: '""' },
    { key: 'ms-7', ops: ['set-hello', 'remove', 'set-world'], expected: '"world"' },
    { key: 'ms-8', ops: ['set-number', 'set-empty', 'set-hello'], expected: '"hello"' },
    { key: 'ms-9', ops: ['set-empty', 'set-world'], expected: '"world"' },
    { key: 'ms-10', ops: ['set-hello', 'set-empty', 'remove'], expected: '""' },
  ]
  for (const s of stepSequences) {
    it(`key="${s.key}" ops [${s.ops.join(', ')}] => ${s.expected}`, async () => {
      const { getByTestId } = await render(<LocalStorageHarness storageKey={s.key} initial="" />)
      for (const op of s.ops) {
        await fireEvent.click(getByTestId(op))
      }
      expect(getByTestId('value').textContent).toBe(s.expected)
    })
  }
})

describe('useLocalStorage - additional initial value verification', () => {
  const extraValues = ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape', 'honeydew', 'kiwi', 'lemon',
    'mango', 'nectarine', 'orange', 'papaya', 'quince', 'raspberry', 'strawberry', 'tangerine', 'ugli', 'vanilla']
  for (const val of extraValues) {
    it(`initial value "${val}" is displayed correctly`, async () => {
      const { getByTestId } = await render(<LocalStorageHarness storageKey={`extra-${val}`} initial={val} />)
      expect(getByTestId('value').textContent).toBe(JSON.stringify(val))
    })
  }
})
