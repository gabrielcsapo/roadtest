import { store, setCurrentTest } from './store'
import type { TestCase, TestSuite } from './types'

/** Lazily resolved cleanup() from @testing-library/react (browser only) */
let _cleanup: (() => void) | null = null
async function getCleanup() {
  if (_cleanup) return _cleanup
  if (typeof document !== 'undefined') {
    const mod = await import('@testing-library/react')
    _cleanup = mod.cleanup
  }
  return _cleanup
}

async function execTest(test: TestCase, cleanup: (() => void) | null) {
  cleanup?.()
  store.updateTest(test.suiteId, test.id, { status: 'running' })
  setCurrentTest(test)
  try {
    await test.fn()
    store.updateTest(test.suiteId, test.id, {
      status: 'pass',
      element: test.element,
      assertions: test.assertions,
    })
    return true
  } catch (e) {
    store.updateTest(test.suiteId, test.id, {
      status: 'fail',
      error: e instanceof Error ? e.message : String(e),
      element: test.element,
      assertions: test.assertions,
    })
    return false
  } finally {
    setCurrentTest(null)
  }
}

async function execSuite(suite: TestSuite, cleanup: (() => void) | null) {
  store.updateSuite(suite.id, { status: 'running' })
  let allPass = true
  for (const test of suite.tests) {
    if (test.status === 'skipped') continue
    const passed = await execTest(test, cleanup)
    if (!passed) allPass = false
  }
  store.updateSuite(suite.id, { status: allPass ? 'pass' : 'fail' })
}

export async function runAll() {
  const cleanup = await getCleanup()
  store.reset()
  store.setRunning(true)
  for (const suite of store.getState().suites) {
    await execSuite(suite, cleanup)
  }
  cleanup?.()
  store.setRunning(false)
}

export async function runSuite(suiteId: string) {
  const cleanup = await getCleanup()
  store.resetSuite(suiteId)
  store.setRunning(true)
  const suite = store.getState().suites.find(s => s.id === suiteId)
  if (suite) await execSuite(suite, cleanup)
  cleanup?.()
  store.setRunning(false)
}

export async function runTest(suiteId: string, testId: string) {
  const cleanup = await getCleanup()
  store.resetTest(suiteId, testId)
  store.setRunning(true)
  const suite = store.getState().suites.find(s => s.id === suiteId)
  const test = suite?.tests.find(t => t.id === testId)
  if (test) await execTest(test, cleanup)
  cleanup?.()
  store.setRunning(false)
}
