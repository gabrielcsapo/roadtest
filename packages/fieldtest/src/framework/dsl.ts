import { nanoid } from "./nanoid";
import { store } from "./store";
import { __vtSetMockScope } from "./mocks";
import type { Hook, TestCase, TestSuite } from "./types";

let currentSuite: TestSuite | null = null;
let _currentSourceFile: string | null = null;

export function setCurrentSourceFile(file: string | null) {
  _currentSourceFile = file;
  __vtSetMockScope(file);
}

/** Whether to use a describe.only context for newly registered tests */
let _describeOnly = false;

export function describe(name: string, fn: () => void) {
  const suite: TestSuite = {
    id: nanoid(),
    name,
    tests: [],
    status: "pending",
    sourceFile: _currentSourceFile ?? undefined,
  };

  const prev = currentSuite;
  currentSuite = suite;
  fn();
  currentSuite = prev;

  store.addSuite(suite);
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
      `[fieldtest] Duplicate test name "${name}" in suite "${currentSuite!.name}". Only the first definition will run.`,
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
  if (!currentSuite) {
    console.warn(`[fieldtest] ${bucket.replace("Fns", "")}() called outside of a describe block.`);
    return;
  }
  currentSuite[bucket] = currentSuite[bucket] ?? [];
  currentSuite[bucket]!.push(fn);
}

export const beforeAll = (fn: Hook) => pushSuiteHook("beforeAllFns", fn);
export const afterAll = (fn: Hook) => pushSuiteHook("afterAllFns", fn);
export const beforeEach = (fn: Hook) => pushSuiteHook("beforeEachFns", fn);
export const afterEach = (fn: Hook) => pushSuiteHook("afterEachFns", fn);
