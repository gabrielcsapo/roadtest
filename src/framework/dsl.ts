import { nanoid } from './nanoid'
import { store } from './store'
import type { TestCase, TestSuite } from './types'

let currentSuite: TestSuite | null = null

export function describe(name: string, fn: () => void) {
  const suite: TestSuite = {
    id: nanoid(),
    name,
    tests: [],
    status: 'pending',
  }

  const prev = currentSuite
  currentSuite = suite
  fn()
  currentSuite = prev

  store.addSuite(suite)
}

function registerTest(name: string, fn: () => void | Promise<void>, skip = false) {
  if (!currentSuite) {
    const suite: TestSuite = { id: nanoid(), name: '(root)', tests: [], status: 'pending' }
    currentSuite = suite
    _addTest(name, fn, skip)
    currentSuite = null
    store.addSuite(suite)
  } else {
    _addTest(name, fn, skip)
  }
}

function _addTest(name: string, fn: () => void | Promise<void>, skip: boolean) {
  const entry: TestCase = {
    id: nanoid(),
    name,
    suiteId: currentSuite!.id,
    suiteName: currentSuite!.name,
    status: skip ? 'skipped' : 'pending',
    assertions: [],
    fn,
  }
  currentSuite!.tests.push(entry)
}

function _it(name: string, fn: () => void | Promise<void>) {
  registerTest(name, fn)
}

_it.skip = function skip(name: string, fn: () => void | Promise<void>) {
  registerTest(name, fn, true)
}

export const it: typeof _it & { skip: typeof _it.skip } = _it
export const test: typeof _it & { skip: typeof _it.skip } = _it
