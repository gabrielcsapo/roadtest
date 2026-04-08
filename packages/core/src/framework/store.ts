import type { StoreState, TestSuite, TestCase, IstanbulCoverage, RunProgress } from "./types";

type Listener = (state: StoreState) => void;

export class Store {
  private state: StoreState = {
    suites: [],
    running: false,
    lastRunAt: null,
    coverage: null,
    runProgress: null,
  };
  private listeners: Set<Listener> = new Set();

  getState(): StoreState {
    return this.state;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    const s = this.state;
    this.listeners.forEach((fn) => fn(s));
  }

  addSuite(suite: TestSuite) {
    this.state = { ...this.state, suites: [...this.state.suites, suite] };
    this.emit();
  }

  updateTest(suiteId: string, testId: string, patch: Partial<TestCase>) {
    this.state = {
      ...this.state,
      suites: this.state.suites.map((s) =>
        s.id !== suiteId
          ? s
          : {
              ...s,
              tests: s.tests.map((t) => (t.id !== testId ? t : { ...t, ...patch })),
            },
      ),
    };
    this.emit();
  }

  updateSuite(suiteId: string, patch: Partial<TestSuite>) {
    this.state = {
      ...this.state,
      suites: this.state.suites.map((s) => (s.id !== suiteId ? s : { ...s, ...patch })),
    };
    this.emit();
  }

  setRunProgress(runProgress: RunProgress | null) {
    this.state = { ...this.state, runProgress };
    this.emit();
  }

  setCoverage(coverage: IstanbulCoverage) {
    this.state = { ...this.state, coverage };
    this.emit();
  }

  setRunning(running: boolean) {
    this.state = {
      ...this.state,
      running,
      lastRunAt: running ? this.state.lastRunAt : new Date(),
    };
    this.emit();
  }

  /** Reset all suites back to pending */
  reset() {
    this.state = {
      ...this.state,
      running: false,
      suites: this.state.suites.map((s) => resetSuite(s)),
    };
    this.emit();
  }

  /** Reset a single suite back to pending */
  resetSuite(suiteId: string) {
    this.state = {
      ...this.state,
      suites: this.state.suites.map((s) => (s.id !== suiteId ? s : resetSuite(s))),
    };
    this.emit();
  }

  /** Remove all suites registered from a specific source file (used before HMR re-import) */
  removeSuitesForFile(sourceFile: string) {
    this.state = {
      ...this.state,
      suites: this.state.suites.filter((s) => s.sourceFile !== sourceFile),
    };
    this.emit();
  }

  /** Reset a single test back to pending */
  resetTest(suiteId: string, testId: string) {
    this.state = {
      ...this.state,
      suites: this.state.suites.map((s) =>
        s.id !== suiteId
          ? s
          : {
              ...s,
              tests: s.tests.map((t) => (t.id !== testId ? t : resetTest(t))),
            },
      ),
    };
    this.emit();
  }
}

function resetSuite(s: TestSuite): TestSuite {
  return { ...s, status: "pending", duration: undefined, tests: s.tests.map(resetTest) };
}

function resetTest(t: TestCase): TestCase {
  return {
    ...t,
    status: "pending",
    error: undefined,
    snapshots: [],
    assertions: [],
    consoleLogs: [],
    networkEntries: [],
    mockEntries: [],
    testCoverage: null,
    duration: undefined,
  };
}

export const store = new Store();

/** Points to whichever test is currently executing */
export let currentTest: TestCase | null = null;
export function setCurrentTest(t: TestCase | null) {
  currentTest = t;
}
