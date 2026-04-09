import { store, setCurrentTest } from "./store";
import type { TestCase, TestSuite, IstanbulCoverage, ConsoleEntry, ConsoleLevel } from "./types";
import { runBeforeTestHooks, runAfterTestHooks } from "./hooks";
import { clearCallLog, getMockEntriesWithCalls } from "./mocks";

export interface CoverageProvider {
  snapshot(): Promise<unknown>;
  diff(before: unknown, after: unknown): Promise<IstanbulCoverage | null>;
  collect(): Promise<IstanbulCoverage | null>;
}

let _coverageProvider: CoverageProvider | null = null;

export function setCoverageProvider(p: CoverageProvider | null): void {
  _coverageProvider = p;
}

// ─── Console interception ─────────────────────────────────────────────────────

const CONSOLE_LEVELS: ConsoleLevel[] = ["log", "warn", "error", "info", "debug"];

function interceptConsole(entries: ConsoleEntry[]): () => void {
  const originals = {} as Record<ConsoleLevel, (...args: unknown[]) => void>;
  for (const level of CONSOLE_LEVELS) {
    originals[level] = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      entries.push({
        level,
        args: args.map((a) => {
          if (typeof a === "string") return a;
          if (a === null) return "null";
          if (a === undefined) return "undefined";
          try {
            const seen = new WeakSet();
            return JSON.stringify(
              a,
              (_key, value) => {
                if (typeof value === "object" && value !== null) {
                  if (seen.has(value)) return "[Circular]";
                  seen.add(value);
                }
                if (typeof value === "bigint") return value.toString() + "n";
                if (typeof value === "function") return `[Function: ${value.name || "anonymous"}]`;
                if (value instanceof Error)
                  return { message: value.message, name: value.name, stack: value.stack };
                return value;
              },
              2,
            );
          } catch {
            return String(a);
          }
        }),
        timestamp: Date.now(),
      });
    };
  }
  return () => {
    for (const level of CONSOLE_LEVELS) console[level] = originals[level];
  };
}

/** Resolves cleanup() from @testing-library/react (browser only). */
async function getCleanup(): Promise<(() => void) | null> {
  if (typeof document === "undefined") return null;
  const { cleanup } = await import("@testing-library/react");
  return cleanup;
}

/**
 * Yield to the browser and wait for the next animation frame.
 * Using rAF (not setTimeout/scheduler.yield) ensures the browser actually
 * repaints the progress UI before we continue — critical for smooth toast updates.
 */
function yieldToFrame(): Promise<void> {
  return new Promise<void>((r) => requestAnimationFrame(() => r()));
}

async function takeCoverageSnap(): Promise<unknown> {
  if (_coverageProvider) return _coverageProvider.snapshot();
  const raw = getRawCoverage();
  return raw ? snapshotCoverage(raw) : null;
}

async function computeTestCoverage(beforeSnap: unknown): Promise<IstanbulCoverage | null> {
  if (_coverageProvider) {
    if (beforeSnap === null) return null;
    const afterSnap = await _coverageProvider.snapshot();
    return _coverageProvider.diff(beforeSnap, afterSnap);
  }
  const afterCov = getRawCoverage();
  return beforeSnap && afterCov ? diffCoverage(beforeSnap as IstanbulCoverage, afterCov) : null;
}

const DEFAULT_TIMEOUT_MS = 5000;
let _timeoutMs = DEFAULT_TIMEOUT_MS;

export function setTestTimeout(ms: number): void {
  _timeoutMs = ms;
}

function withTimeout<T>(promise: Promise<T>, ms: number, testName: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Test timed out after ${ms}ms: "${testName}"`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function execTest(test: TestCase, cleanup: (() => void) | null) {
  store.updateTest(test.suiteId, test.id, { status: "running" });
  setCurrentTest(test);
  clearCallLog(); // fresh spy log for this test
  const sourceFile = store.getState().suites.find((s) => s.id === test.suiteId)?.sourceFile;
  const consoleLogs: ConsoleEntry[] = [];
  const restoreConsole = interceptConsole(consoleLogs);
  // Outer try/finally guarantees restoreConsole, setCurrentTest, and afterEach hooks
  // always run — even if beforeEach hooks or coverage snapshotting throws.
  try {
    await runBeforeTestHooks();
    const beforeSnap = await takeCoverageSnap();
    const t0 = Date.now();
    try {
      await withTimeout(Promise.resolve(test.fn!()), _timeoutMs, test.name);
      const duration = Date.now() - t0;
      const testCoverage = await computeTestCoverage(beforeSnap);
      store.updateTest(test.suiteId, test.id, {
        status: "pass",
        snapshots: test.snapshots,
        assertions: test.assertions,
        consoleLogs,
        networkEntries: test.networkEntries,
        mockEntries: getMockEntriesWithCalls(sourceFile),
        testCoverage,
        duration,
      });
      return true;
    } catch (e) {
      const duration = Date.now() - t0;
      const testCoverage = await computeTestCoverage(beforeSnap);
      store.updateTest(test.suiteId, test.id, {
        status: "fail",
        error: e instanceof Error ? e.message : String(e),
        snapshots: test.snapshots,
        assertions: test.assertions,
        consoleLogs,
        networkEntries: test.networkEntries,
        mockEntries: getMockEntriesWithCalls(sourceFile),
        testCoverage,
        duration,
      });
      return false;
    }
  } finally {
    restoreConsole();
    setCurrentTest(null);
    // Run afterEach hooks before cleanup so hooks can still read DOM state
    // (e.g. the snapshot after-hook reads _currentContainer.innerHTML).
    // A failing hook cannot mask the test result that was already recorded above.
    try {
      await runAfterTestHooks();
    } catch (e) {
      console.error("[fieldtest] afterEach hook threw:", e);
    }
    cleanup?.();
  }
}

async function execSuite(
  suite: TestSuite,
  cleanup: (() => void) | null,
  onTestDone?: (done: number) => void,
  doneOffset = 0,
  options: { grepPattern?: RegExp; onlyMode?: boolean } = {},
) {
  store.updateSuite(suite.id, { status: "running" });
  let allPass = true;
  let localDone = 0;
  const suiteT0 = Date.now();

  // Yield at ~60 fps — only pause once per frame regardless of test speed
  let lastYield = Date.now();

  for (const test of suite.tests) {
    if (test.status === "skipped") continue;
    // Node tests have no fn — run server-side, results pushed via WS
    if (!test.fn) continue;
    // Skip non-only tests when any test is marked .only
    if (options.onlyMode && !test.only) {
      store.updateTest(test.suiteId, test.id, { status: "skipped" });
      continue;
    }
    // Skip tests whose name doesn't match --grep pattern
    if (options.grepPattern && !options.grepPattern.test(test.name)) {
      store.updateTest(test.suiteId, test.id, { status: "skipped" });
      continue;
    }
    const passed = await execTest(test, cleanup);
    if (!passed) allPass = false;
    localDone++;
    onTestDone?.(doneOffset + localDone);

    // Yield to the browser every ~16ms so the progress UI stays smooth
    const now = Date.now();
    if (now - lastYield >= 16) {
      await yieldToFrame();
      lastYield = Date.now();
    }
  }

  store.updateSuite(suite.id, {
    status: allPass ? "pass" : "fail",
    duration: Date.now() - suiteT0,
  });
  return localDone;
}

function getRawCoverage(): IstanbulCoverage | null {
  const cov = (globalThis as Record<string, unknown>)["__coverage__"];
  return cov && typeof cov === "object" ? (cov as IstanbulCoverage) : null;
}

function snapshotCoverage(cov: IstanbulCoverage): IstanbulCoverage {
  const snap: IstanbulCoverage = {};
  for (const [path, fileCov] of Object.entries(cov)) {
    snap[path] = {
      ...fileCov,
      s: { ...fileCov.s },
      b: Object.fromEntries(Object.entries(fileCov.b).map(([k, v]) => [k, [...v]])),
      f: { ...fileCov.f },
    };
  }
  return snap;
}

function diffCoverage(before: IstanbulCoverage, after: IstanbulCoverage): IstanbulCoverage {
  const delta: IstanbulCoverage = {};
  for (const [path, afterFile] of Object.entries(after)) {
    const beforeFile = before[path];
    if (!beforeFile) {
      delta[path] = afterFile;
      continue;
    }
    const s: Record<string, number> = {};
    for (const [idx, count] of Object.entries(afterFile.s)) {
      s[idx] = (count as number) - ((beforeFile.s[idx] as number) ?? 0);
    }
    const f: Record<string, number> = {};
    for (const [idx, count] of Object.entries(afterFile.f)) {
      f[idx] = (count as number) - ((beforeFile.f[idx] as number) ?? 0);
    }
    const b: Record<string, number[]> = {};
    for (const [idx, counts] of Object.entries(afterFile.b)) {
      const beforeCounts = beforeFile.b[idx] ?? [];
      b[idx] = (counts as number[]).map((c, i) => c - (beforeCounts[i] ?? 0));
    }
    const hasChange = Object.values(s).some((v) => v > 0);
    if (hasChange) {
      delta[path] = { ...afterFile, s, f, b };
    }
  }
  return delta;
}

async function collectCoverage() {
  if (_coverageProvider) {
    const cov = await _coverageProvider.collect();
    if (cov) store.setCoverage(cov);
  } else {
    const cov = getRawCoverage();
    if (cov) store.setCoverage(cov);
  }
}

export async function runAll(options: { grep?: string; timeout?: number } = {}) {
  const cleanup = await getCleanup();
  store.reset();
  store.setRunning(true);

  if (options.timeout !== undefined) setTestTimeout(options.timeout);

  const grepPattern = options.grep ? new RegExp(options.grep) : undefined;
  const onlyMode = store.getState().suites.some((s) => s.tests.some((t) => t.only));
  const suiteOptions = { grepPattern, onlyMode };

  const allTests = store
    .getState()
    .suites.flatMap((s) => s.tests)
    .filter((t) => {
      if (t.status === "skipped") return false;
      if (onlyMode && !t.only) return false;
      if (grepPattern && !grepPattern.test(t.name)) return false;
      return true;
    });
  const total = allTests.length;
  const startedAt = Date.now();
  store.setRunProgress({ done: 0, total, startedAt });

  let done = 0;
  let offset = 0;
  for (const suite of store.getState().suites) {
    const count = await execSuite(
      suite,
      cleanup,
      (d) => {
        done = d;
        store.setRunProgress({ done, total, startedAt });
      },
      offset,
      suiteOptions,
    );
    offset += count;
  }

  store.setRunProgress(null);
  store.setRunning(false);
  await collectCoverage();
}

export async function runSuite(suiteId: string) {
  const cleanup = await getCleanup();
  store.resetSuite(suiteId);
  store.setRunning(true);
  const suite = store.getState().suites.find((s) => s.id === suiteId);
  if (suite) {
    const total = suite.tests.filter((t) => t.status !== "skipped").length;
    const startedAt = Date.now();
    store.setRunProgress({ done: 0, total, startedAt });
    await execSuite(suite, cleanup, (done) => {
      store.setRunProgress({ done, total, startedAt });
    });
  }
  cleanup?.();
  store.setRunProgress(null);
  store.setRunning(false);
  await collectCoverage();
}

export async function runTest(suiteId: string, testId: string) {
  const cleanup = await getCleanup();
  store.resetTest(suiteId, testId);
  store.setRunning(true);
  store.setRunProgress({ done: 0, total: 1, startedAt: Date.now() });
  const suite = store.getState().suites.find((s) => s.id === suiteId);
  const test = suite?.tests.find((t) => t.id === testId);
  if (test) {
    await execTest(test, cleanup);
    store.setRunProgress({
      done: 1,
      total: 1,
      startedAt: store.getState().runProgress?.startedAt ?? Date.now(),
    });
  }
  cleanup?.();
  store.setRunProgress(null);
  store.setRunning(false);
  await collectCoverage();
}
