import { store, setCurrentTest } from './store'
import type { TestCase, TestSuite, IstanbulCoverage, ConsoleEntry, ConsoleLevel } from './types'

// ─── Console interception ─────────────────────────────────────────────────────

const CONSOLE_LEVELS: ConsoleLevel[] = ['log', 'warn', 'error', 'info', 'debug']

function interceptConsole(entries: ConsoleEntry[]): () => void {
  const originals = {} as Record<ConsoleLevel, (...args: unknown[]) => void>
  for (const level of CONSOLE_LEVELS) {
    originals[level] = console[level].bind(console)
    console[level] = (...args: unknown[]) => {
      entries.push({
        level,
        args: args.map(a => {
          if (typeof a === 'string') return a
          try { return JSON.stringify(a) } catch { return String(a) }
        }),
        timestamp: Date.now(),
      })
    }
  }
  return () => {
    for (const level of CONSOLE_LEVELS) console[level] = originals[level]
  }
}

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

/**
 * Yield to the browser and wait for the next animation frame.
 * Using rAF (not setTimeout/scheduler.yield) ensures the browser actually
 * repaints the progress UI before we continue — critical for smooth toast updates.
 */
function yieldToFrame(): Promise<void> {
  return new Promise<void>(r => requestAnimationFrame(() => r()))
}

async function execTest(test: TestCase, cleanup: (() => void) | null) {
  cleanup?.()
  store.updateTest(test.suiteId, test.id, { status: 'running' })
  setCurrentTest(test)
  const consoleLogs: ConsoleEntry[] = []
  const restoreConsole = interceptConsole(consoleLogs)
  const coverageBefore = getRawCoverage()
  const beforeSnap = coverageBefore ? snapshotCoverage(coverageBefore) : null
  const t0 = Date.now()
  try {
    await test.fn()
    const duration = Date.now() - t0
    const afterCov = getRawCoverage()
    const testCoverage = (beforeSnap && afterCov) ? diffCoverage(beforeSnap, afterCov) : null
    store.updateTest(test.suiteId, test.id, {
      status: 'pass',
      snapshots: test.snapshots,
      assertions: test.assertions,
      consoleLogs,
      testCoverage,
      duration,
    })
    return true
  } catch (e) {
    const duration = Date.now() - t0
    const afterCov = getRawCoverage()
    const testCoverage = (beforeSnap && afterCov) ? diffCoverage(beforeSnap, afterCov) : null
    store.updateTest(test.suiteId, test.id, {
      status: 'fail',
      error: e instanceof Error ? e.message : String(e),
      snapshots: test.snapshots,
      assertions: test.assertions,
      consoleLogs,
      testCoverage,
      duration,
    })
    return false
  } finally {
    restoreConsole()
    setCurrentTest(null)
  }
}

async function execSuite(
  suite: TestSuite,
  cleanup: (() => void) | null,
  onTestDone?: (done: number) => void,
  doneOffset = 0,
) {
  store.updateSuite(suite.id, { status: 'running' })
  let allPass = true
  let localDone = 0
  const suiteT0 = Date.now()

  // Yield at ~60 fps — only pause once per frame regardless of test speed
  let lastYield = Date.now()

  for (const test of suite.tests) {
    if (test.status === 'skipped') continue
    const passed = await execTest(test, cleanup)
    if (!passed) allPass = false
    localDone++
    onTestDone?.(doneOffset + localDone)

    // Yield to the browser every ~16ms so the progress UI stays smooth
    const now = Date.now()
    if (now - lastYield >= 16) {
      await yieldToFrame()
      lastYield = Date.now()
    }
  }

  store.updateSuite(suite.id, {
    status: allPass ? 'pass' : 'fail',
    duration: Date.now() - suiteT0,
  })
  return localDone
}

function getRawCoverage(): IstanbulCoverage | null {
  const cov = (globalThis as Record<string, unknown>)['__coverage__']
  return (cov && typeof cov === 'object') ? cov as IstanbulCoverage : null
}

function snapshotCoverage(cov: IstanbulCoverage): IstanbulCoverage {
  const snap: IstanbulCoverage = {}
  for (const [path, fileCov] of Object.entries(cov)) {
    snap[path] = {
      ...fileCov,
      s: { ...fileCov.s },
      b: Object.fromEntries(Object.entries(fileCov.b).map(([k, v]) => [k, [...v]])),
      f: { ...fileCov.f },
    }
  }
  return snap
}

function diffCoverage(before: IstanbulCoverage, after: IstanbulCoverage): IstanbulCoverage {
  const delta: IstanbulCoverage = {}
  for (const [path, afterFile] of Object.entries(after)) {
    const beforeFile = before[path]
    if (!beforeFile) {
      delta[path] = afterFile
      continue
    }
    const s: Record<string, number> = {}
    for (const [idx, count] of Object.entries(afterFile.s)) {
      s[idx] = (count as number) - ((beforeFile.s[idx] as number) ?? 0)
    }
    const f: Record<string, number> = {}
    for (const [idx, count] of Object.entries(afterFile.f)) {
      f[idx] = (count as number) - ((beforeFile.f[idx] as number) ?? 0)
    }
    const b: Record<string, number[]> = {}
    for (const [idx, counts] of Object.entries(afterFile.b)) {
      const beforeCounts = beforeFile.b[idx] ?? []
      b[idx] = (counts as number[]).map((c, i) => c - (beforeCounts[i] ?? 0))
    }
    const hasChange = Object.values(s).some(v => v > 0)
    if (hasChange) {
      delta[path] = { ...afterFile, s, f, b }
    }
  }
  return delta
}

function collectCoverage() {
  const cov = getRawCoverage()
  if (cov) store.setCoverage(cov)
}

export async function runAll() {
  const cleanup = await getCleanup()
  store.reset()
  store.setRunning(true)
  const allTests = store.getState().suites.flatMap(s => s.tests).filter(t => t.status !== 'skipped')
  const total = allTests.length
  const startedAt = Date.now()
  store.setRunProgress({ done: 0, total, startedAt })

  let done = 0
  let offset = 0
  for (const suite of store.getState().suites) {
    const count = await execSuite(suite, cleanup, (d) => {
      done = d
      store.setRunProgress({ done, total, startedAt })
    }, offset)
    offset += count
  }

  cleanup?.()
  store.setRunProgress(null)
  store.setRunning(false)
  collectCoverage()
}

export async function runSuite(suiteId: string) {
  const cleanup = await getCleanup()
  store.resetSuite(suiteId)
  store.setRunning(true)
  const suite = store.getState().suites.find(s => s.id === suiteId)
  if (suite) {
    const total = suite.tests.filter(t => t.status !== 'skipped').length
    const startedAt = Date.now()
    store.setRunProgress({ done: 0, total, startedAt })
    await execSuite(suite, cleanup, (done) => {
      store.setRunProgress({ done, total, startedAt })
    })
  }
  cleanup?.()
  store.setRunProgress(null)
  store.setRunning(false)
  collectCoverage()
}

export async function runTest(suiteId: string, testId: string) {
  const cleanup = await getCleanup()
  store.resetTest(suiteId, testId)
  store.setRunning(true)
  store.setRunProgress({ done: 0, total: 1, startedAt: Date.now() })
  const suite = store.getState().suites.find(s => s.id === suiteId)
  const test = suite?.tests.find(t => t.id === testId)
  if (test) {
    await execTest(test, cleanup)
    store.setRunProgress({ done: 1, total: 1, startedAt: store.getState().runProgress?.startedAt ?? Date.now() })
  }
  cleanup?.()
  store.setRunProgress(null)
  store.setRunning(false)
  collectCoverage()
}
