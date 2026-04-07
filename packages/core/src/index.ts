// Framework — what test files import
export { describe, it, test, setCurrentSourceFile } from './framework/dsl'
export { expect } from './framework/expect'
export { render, snapshot, fireEvent, act } from './framework/render'
export { store, currentTest } from './framework/store'
export type { Store } from './framework/store'
export { runAll, runSuite, runTest, setCoverageProvider } from './framework/runner'
export type { CoverageProvider } from './framework/runner'
export type { TestStatus, Assertion, TestCase, TestSuite, StoreState, Snapshot, IstanbulCoverage, ConsoleEntry, ConsoleLevel, RunProgress, NetworkEntry, MockEntry } from './framework/types'

// Module mocking — vi.mock() equivalent
export { mock, unmock, clearAllMocks, __ftImport, __vtSetMockScope } from './framework/mocks'
export type { MockCall } from './framework/types'

// Node test bridge — called by stubs emitted for node-environment test files
export { __vtRegisterNodeTest } from './framework/node-bridge'

// Plugin extension points
export { registerAfterTestHook, registerBeforeDisplayHook, registerAfterDisplayHook } from './framework/hooks'
export { registerTab } from './ui/plugins'
export type { TabPlugin } from './ui/plugins'

// Browser UI
export { startApp, reloadFile } from './ui/start'
