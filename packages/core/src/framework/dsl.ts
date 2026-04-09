import { nanoid } from "./nanoid";
import { store } from "./store";
import { __vtSetMockScope } from "./mocks";
import type { TestCase, TestSuite } from "./types";

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

function registerTest(name: string, fn: () => void | Promise<void>, skip = false, only = false) {
  if (!currentSuite) {
    const suite: TestSuite = {
      id: nanoid(),
      name: "(root)",
      tests: [],
      status: "pending",
      sourceFile: _currentSourceFile ?? undefined,
    };
    currentSuite = suite;
    _addTest(name, fn, skip, only);
    currentSuite = null;
    store.addSuite(suite);
  } else {
    _addTest(name, fn, skip, only);
  }
}

function _addTest(name: string, fn: () => void | Promise<void>, skip: boolean, only = false) {
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
    fn,
  };
  currentSuite!.tests.push(entry);
}

function _it(name: string, fn: () => void | Promise<void>) {
  registerTest(name, fn);
}

_it.skip = function skip(name: string, fn: () => void | Promise<void>) {
  registerTest(name, fn, true);
};

_it.only = function only(name: string, fn: () => void | Promise<void>) {
  registerTest(name, fn, false, true);
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
