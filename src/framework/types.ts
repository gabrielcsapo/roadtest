import type { ReactElement } from 'react'

export type TestStatus = 'pending' | 'running' | 'pass' | 'fail' | 'skipped'

export interface Assertion {
  label: string
  status: 'pass' | 'fail'
  error?: string
}

export interface TestCase {
  id: string
  name: string
  suiteId: string
  suiteName: string
  status: TestStatus
  error?: string
  assertions: Assertion[]
  /** Captured React element from render() calls inside this test */
  element?: ReactElement
  fn: () => void | Promise<void>
}

export interface TestSuite {
  id: string
  name: string
  tests: TestCase[]
  status: TestStatus
}

export interface StoreState {
  suites: TestSuite[]
  running: boolean
  lastRunAt: Date | null
}
