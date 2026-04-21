// Framework — what test files import
export {
  describe,
  it,
  test,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  setCurrentSourceFile,
} from "./framework/dsl";
export type { TestOptions } from "./framework/dsl";
export { expect } from "./framework/expect";
export { render, snapshot, fireEvent, act } from "./framework/render";
export { store, currentTest } from "./framework/store";
export type { Store } from "./framework/store";
export {
  runAll,
  runSuite,
  runSuites,
  runTest,
  setCoverageProvider,
  setTestTimeout,
} from "./framework/runner";
export type { CoverageProvider } from "./framework/runner";
export type {
  TestStatus,
  Assertion,
  TestCase,
  TestSuite,
  StoreState,
  Snapshot,
  IstanbulCoverage,
  ConsoleEntry,
  ConsoleLevel,
  RunProgress,
  NetworkEntry,
  MockEntry,
} from "./framework/types";

// Module mocking — vi.mock() equivalent
export { mock, unmock, clearAllMocks, __ftImport, __vtSetMockScope } from "./framework/mocks";
export type { MockCall } from "./framework/types";

// Node test bridge — called by stubs emitted for node-environment test files
export { __vtRegisterNodeTest } from "./framework/node-bridge";

// Plugin extension points
export {
  registerBeforeTestHook,
  registerAfterTestHook,
  registerBeforeDisplayHook,
  registerAfterDisplayHook,
} from "./framework/hooks";
export { registerTab } from "./ui/plugins";
export type { TabPlugin } from "./ui/plugins";

// Browser UI — lazy-loaded so that @react-three/fiber / three.js are never
// imported in the node runner (where startApp and reloadFile are never called).
import type { startApp as _startAppT, reloadFile as _reloadFileT } from "./ui/start";

export async function startApp(
  ...args: Parameters<typeof _startAppT>
): ReturnType<typeof _startAppT> {
  const { startApp: fn } = await import("./ui/start");
  return fn(...args);
}

export async function reloadFile(
  ...args: Parameters<typeof _reloadFileT>
): ReturnType<typeof _reloadFileT> {
  const { reloadFile: fn } = await import("./ui/start");
  return fn(...args);
}
