import type { ReactElement } from 'react'

export type TestStatus = 'pending' | 'running' | 'pass' | 'fail' | 'skipped'

export interface Assertion {
  label: string
  status: 'pass' | 'fail'
  error?: string
}

export interface Snapshot {
  label: string
  /** ms since epoch when this snapshot was captured */
  timestamp: number
  /** The React element — used for the live interactive canvas */
  element: ReactElement
  /** DOM innerHTML captured at this point — used for filmstrip thumbnails */
  html: string
}

export type ConsoleLevel = 'log' | 'warn' | 'error' | 'info' | 'debug'

export interface ConsoleEntry {
  level: ConsoleLevel
  args: string[]
  timestamp: number
}

export interface TestCase {
  id: string
  name: string
  suiteId: string
  suiteName: string
  status: TestStatus
  error?: string
  assertions: Assertion[]
  /** Ordered list of visual snapshots captured during this test */
  snapshots: Snapshot[]
  /** Console output captured during this test */
  consoleLogs: ConsoleEntry[]
  /** Coverage delta — statements hit specifically during this test */
  testCoverage: IstanbulCoverage | null
  /** Wall-clock ms the test took to run */
  duration?: number
  fn: () => void | Promise<void>
}

export interface TestSuite {
  id: string
  name: string
  tests: TestCase[]
  status: TestStatus
  /** Absolute path of the test file that registered this suite */
  sourceFile?: string
  /** Wall-clock ms the suite took to run (all tests) */
  duration?: number
}

// Istanbul coverage types (subset we actually use)
export interface IstanbulLocation { line: number; column: number }
export interface IstanbulRange { start: IstanbulLocation; end: IstanbulLocation }

export interface IstanbulSourceMap {
  version: number
  sources: string[]
  sourcesContent?: string[]
  mappings: string
  names?: string[]
}

export interface IstanbulFileCoverage {
  path: string
  s: Record<string, number>        // statement hit counts
  b: Record<string, number[]>      // branch hit counts
  f: Record<string, number>        // function hit counts
  statementMap: Record<string, IstanbulRange>
  branchMap: Record<string, { locations: IstanbulRange[] }>
  fnMap: Record<string, { name: string; loc: IstanbulRange }>
  inputSourceMap?: IstanbulSourceMap
}

export type IstanbulCoverage = Record<string, IstanbulFileCoverage>

export interface RunProgress {
  done: number
  total: number
  startedAt: number
}

export interface StoreState {
  suites: TestSuite[]
  running: boolean
  lastRunAt: Date | null
  coverage: IstanbulCoverage | null
  runProgress: RunProgress | null
}
