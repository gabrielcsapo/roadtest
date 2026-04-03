import { currentTest } from './store'

class AssertionError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'AssertionError'
  }
}

function stringify(v: unknown): string {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  try { return JSON.stringify(v) } catch { return String(v) }
}

interface Matchers {
  toBe(expected: unknown): void
  toEqual(expected: unknown): void
  toBeTruthy(): void
  toBeFalsy(): void
  toBeNull(): void
  toBeUndefined(): void
  toBeDefined(): void
  toContain(item: unknown): void
  toHaveLength(n: number): void
  toThrow(msg?: string): void
  toBeGreaterThan(n: number): void
  toBeLessThan(n: number): void
  not: Matchers
}

function createMatchers(received: unknown, negated = false): Matchers {
  function assert(pass: boolean, failMsg: string, label: string) {
    const finalPass = negated ? !pass : pass
    const error = finalPass ? undefined : (negated ? `Expected NOT: ${failMsg}` : failMsg)

    if (currentTest) {
      currentTest.assertions.push({
        label: negated ? `expect(…).not.${label}` : `expect(…).${label}`,
        status: finalPass ? 'pass' : 'fail',
        error,
      })
    }

    if (!finalPass) throw new AssertionError(error!)
  }

  const matchers: Matchers = {
    get not() { return createMatchers(received, !negated) },

    toBe(expected) {
      assert(
        Object.is(received, expected),
        `Expected ${stringify(expected)} but received ${stringify(received)}`,
        `toBe(${stringify(expected)})`
      )
    },
    toEqual(expected) {
      assert(
        JSON.stringify(received) === JSON.stringify(expected),
        `Expected ${stringify(expected)} but received ${stringify(received)}`,
        `toEqual(${stringify(expected)})`
      )
    },
    toBeTruthy() {
      assert(Boolean(received), `Expected truthy but received ${stringify(received)}`, 'toBeTruthy()')
    },
    toBeFalsy() {
      assert(!received, `Expected falsy but received ${stringify(received)}`, 'toBeFalsy()')
    },
    toBeNull() {
      assert(received === null, `Expected null but received ${stringify(received)}`, 'toBeNull()')
    },
    toBeUndefined() {
      assert(received === undefined, `Expected undefined but received ${stringify(received)}`, 'toBeUndefined()')
    },
    toBeDefined() {
      assert(received !== undefined, 'Expected a defined value', 'toBeDefined()')
    },
    toContain(item) {
      const ok = Array.isArray(received)
        ? received.includes(item)
        : typeof received === 'string' && received.includes(String(item))
      assert(ok, `Expected ${stringify(received)} to contain ${stringify(item)}`, `toContain(${stringify(item)})`)
    },
    toHaveLength(n) {
      const len = (received as { length?: number }).length
      assert(len === n, `Expected length ${n} but got ${len}`, `toHaveLength(${n})`)
    },
    toThrow(msg) {
      let threw = false
      let thrownMsg = ''
      try { (received as () => void)() } catch (e) { threw = true; thrownMsg = String(e) }
      assert(threw, 'Expected function to throw', 'toThrow()')
      if (msg) assert(thrownMsg.includes(msg), `Expected to throw "${msg}" but got "${thrownMsg}"`, `toThrow(${stringify(msg)})`)
    },
    toBeGreaterThan(n) {
      assert((received as number) > n, `Expected ${received} > ${n}`, `toBeGreaterThan(${n})`)
    },
    toBeLessThan(n) {
      assert((received as number) < n, `Expected ${received} < ${n}`, `toBeLessThan(${n})`)
    },
  }

  return matchers
}

export function expect(received: unknown): Matchers {
  return createMatchers(received)
}
