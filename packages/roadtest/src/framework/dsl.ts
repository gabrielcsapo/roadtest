import { nanoid } from "./nanoid";
import { store } from "./store";
import { __vtSetMockScope } from "./mocks";
import type { Hook, TestCase, TestSuite } from "./types";

let currentSuite: TestSuite | null = null;
let executingSuite: TestSuite | null = null;
let _currentSourceFile: string | null = null;

type HookBucket = "beforeAllFns" | "afterAllFns" | "beforeEachFns" | "afterEachFns";
type HookBuckets = Record<HookBucket, Hook[]>;

function createHookBuckets(): HookBuckets {
  return {
    beforeAllFns: [],
    afterAllFns: [],
    beforeEachFns: [],
    afterEachFns: [],
  };
}

const globalRootHooks = createHookBuckets();
const fileRootHooks = new Map<string, HookBuckets>();

function inheritedHooks(bucket: HookBucket, parentSuite: TestSuite | null): Hook[] {
  if (parentSuite) return [...(parentSuite[bucket] ?? [])];
  const fileHooks = _currentSourceFile
    ? (fileRootHooks.get(_currentSourceFile)?.[bucket] ?? [])
    : [];
  return [...globalRootHooks[bucket], ...fileHooks];
}

function rootHooksForCurrentFile(): HookBuckets {
  if (_currentSourceFile === null) return globalRootHooks;
  let hooks = fileRootHooks.get(_currentSourceFile);
  if (!hooks) {
    hooks = createHookBuckets();
    fileRootHooks.set(_currentSourceFile, hooks);
  }
  return hooks;
}

export function setCurrentSourceFile(file: string | null) {
  _currentSourceFile = file;
  __vtSetMockScope(file);
}

export function setExecutingSuite(suite: TestSuite | null) {
  executingSuite = suite;
}

/** Whether to use a describe.only context for newly registered tests */
let _describeOnly = false;

export function describe(name: string, fn: () => void) {
  const parentSuite = currentSuite;
  const suite: TestSuite = {
    id: nanoid(),
    name,
    tests: [],
    status: "pending",
    sourceFile: _currentSourceFile ?? undefined,
    beforeAllFns: inheritedHooks("beforeAllFns", parentSuite),
    afterAllFns: inheritedHooks("afterAllFns", parentSuite),
    beforeEachFns: inheritedHooks("beforeEachFns", parentSuite),
    afterEachFns: inheritedHooks("afterEachFns", parentSuite),
  };

  const prev = currentSuite;
  currentSuite = suite;
  fn();
  currentSuite = prev;

  if (suite.tests.length > 0) store.addSuite(suite);
}

describe.only = function describeOnly(name: string, fn: () => void) {
  const prevDescribeOnly = _describeOnly;
  _describeOnly = true;
  describe(name, fn);
  _describeOnly = prevDescribeOnly;
};

describe.each = function each<T extends unknown[]>(cases: T[]) {
  return function (nameTemplate: string, fn: (...args: T) => void) {
    for (const args of cases) {
      let i = 0;
      const name = nameTemplate.replace(/%[sdio%]/g, (m) => {
        if (m === "%%") return "%";
        return String(args[i++] ?? "");
      });
      describe(name, () => fn(...args));
    }
  };
};

export interface TestOptions {
  timeout?: number;
}

function registerTest(
  name: string,
  fn: () => void | Promise<void>,
  skip = false,
  only = false,
  options?: TestOptions,
) {
  if (!currentSuite) {
    const suite: TestSuite = {
      id: nanoid(),
      name: "(root)",
      tests: [],
      status: "pending",
      sourceFile: _currentSourceFile ?? undefined,
    };
    currentSuite = suite;
    _addTest(name, fn, skip, only, options);
    currentSuite = null;
    store.addSuite(suite);
  } else {
    _addTest(name, fn, skip, only, options);
  }
}

function _addTest(
  name: string,
  fn: () => void | Promise<void>,
  skip: boolean,
  only = false,
  options?: TestOptions,
) {
  if (currentSuite!.tests.some((t) => t.name === name)) {
    console.warn(
      `[roadtest] Duplicate test name "${name}" in suite "${currentSuite!.name}". Only the first definition will run.`,
    );
  }
  const isOnly = only || _describeOnly;
  const entry: TestCase = {
    id: nanoid(),
    name,
    suiteId: currentSuite!.id,
    suiteName: currentSuite!.name,
    status: skip ? "skipped" : "pending",
    assertions: [],
    snapshots: [],
    consoleLogs: [],
    networkEntries: [],
    mockEntries: [], // calls are populated by the runner after the test finishes
    testCoverage: null,
    only: isOnly || undefined,
    timeout: options?.timeout,
    fn,
  };
  currentSuite!.tests.push(entry);
}

function _it(name: string, fn: () => void | Promise<void>, options?: TestOptions) {
  registerTest(name, fn, false, false, options);
}

_it.skip = function skip(name: string, fn: () => void | Promise<void>, options?: TestOptions) {
  registerTest(name, fn, true, false, options);
};

_it.only = function only(name: string, fn: () => void | Promise<void>, options?: TestOptions) {
  registerTest(name, fn, false, true, options);
};

_it.each = function each<T extends unknown[]>(cases: T[]) {
  return function (nameTemplate: string, fn: (...args: T) => void | Promise<void>) {
    for (const args of cases) {
      let i = 0;
      const name = nameTemplate.replace(/%[sdio%]/g, (m) => {
        if (m === "%%") return "%";
        return String(args[i++] ?? "");
      });
      registerTest(name, () => fn(...args));
    }
  };
};

export const it: typeof _it & {
  skip: typeof _it.skip;
  only: typeof _it.only;
  each: typeof _it.each;
} = _it;
export const test: typeof it = _it;

// ─── Suite-scoped lifecycle hooks ─────────────────────────────────────────────

function pushSuiteHook(
  bucket: "beforeAllFns" | "afterAllFns" | "beforeEachFns" | "afterEachFns",
  fn: Hook,
) {
  const suite = currentSuite ?? executingSuite;
  if (!suite) {
    rootHooksForCurrentFile()[bucket].push(fn);
    return;
  }
  suite[bucket] = suite[bucket] ?? [];
  suite[bucket]!.push(fn);
}

export const beforeAll = (fn: Hook) => pushSuiteHook("beforeAllFns", fn);
export const afterAll = (fn: Hook) => pushSuiteHook("afterAllFns", fn);
export const beforeEach = (fn: Hook) => pushSuiteHook("beforeEachFns", fn);
export const afterEach = (fn: Hook) => pushSuiteHook("afterEachFns", fn);
