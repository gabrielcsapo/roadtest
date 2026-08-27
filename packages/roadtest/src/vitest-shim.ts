/**
 * Vitest compatibility shim for roadtest.
 *
 * Drop-in replacement for `vitest` imports — re-exports roadtest's DSL and
 * provides a `vi` object that mirrors vitest's utility API. Point your bundler
 * or loader at this file to run existing vitest test suites under roadtest
 * without changing any test syntax.
 *
 * Vite: add `resolve.alias: { vitest: 'roadtest/vitest' }` (or use the
 *        `vitestCompat: true` option on the roadtest() Vite plugin).
 * Node: run with `roadtest --vitest-compat` to enable the loader hook redirect.
 */

// ─── Re-export the roadtest DSL ───────────────────────────────────────────────

import {
  describe as roadtestDescribe,
  it as roadtestIt,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  type TestOptions,
} from "./framework/dsl";
import { expect } from "./framework/expect";
import { setTestTimeout } from "./framework/runner";

type TestFn = () => void | Promise<void>;
type RegisterTest = (name: string, fn: TestFn, options?: TestOptions) => void;
type SuiteFn = () => void;

function registerCompatSuite(
  register: (name: string, fn: SuiteFn) => void,
  name: string,
  optionsOrFn: TestOptions | SuiteFn,
  maybeFn?: SuiteFn,
): void {
  if (typeof optionsOrFn === "function") {
    register(name, optionsOrFn);
    return;
  }
  if (maybeFn === undefined) throw new TypeError(`Missing suite function for "${name}"`);
  if (optionsOrFn.timeout !== undefined) setTestTimeout(optionsOrFn.timeout);
  register(name, maybeFn);
}

const describe = Object.assign(
  (name: string, optionsOrFn: TestOptions | SuiteFn, maybeFn?: SuiteFn) =>
    registerCompatSuite(roadtestDescribe, name, optionsOrFn, maybeFn),
  {
    only: (name: string, optionsOrFn: TestOptions | SuiteFn, maybeFn?: SuiteFn) =>
      registerCompatSuite(roadtestDescribe.only, name, optionsOrFn, maybeFn),
    each: roadtestDescribe.each,
  },
);

function registerCompatTest(
  register: RegisterTest,
  name: string,
  optionsOrFn: TestOptions | TestFn,
  maybeFn?: TestFn,
): void {
  if (typeof optionsOrFn === "function") {
    register(name, optionsOrFn);
    return;
  }
  if (maybeFn === undefined) throw new TypeError(`Missing test function for "${name}"`);
  register(name, maybeFn, optionsOrFn);
}

const it = Object.assign(
  (name: string, optionsOrFn: TestOptions | TestFn, maybeFn?: TestFn) =>
    registerCompatTest(roadtestIt, name, optionsOrFn, maybeFn),
  {
    skip: (name: string, optionsOrFn: TestOptions | TestFn, maybeFn?: TestFn) =>
      registerCompatTest(roadtestIt.skip, name, optionsOrFn, maybeFn),
    only: (name: string, optionsOrFn: TestOptions | TestFn, maybeFn?: TestFn) =>
      registerCompatTest(roadtestIt.only, name, optionsOrFn, maybeFn),
    each: roadtestIt.each,
  },
);
const test = it;

export { describe, it, test, beforeAll, afterAll, beforeEach, afterEach, expect };
export { render, snapshot, fireEvent, act } from "./framework/render";

export { mock, unmock, clearAllMocks, __ftImport } from "./framework/mocks";

// ─── Spy utilities ────────────────────────────────────────────────────────────

export { createMockFn as fn, spyOn } from "./framework/spies";
export type { MockFn, MockFnCall } from "./framework/spies";

// ─── vi object ────────────────────────────────────────────────────────────────

import { mock, unmock } from "./framework/mocks";
import { createMockFn, spyOn, getAllSpies, fakeClock } from "./framework/spies";

const _stubbedGlobals = new Map<string, unknown>();
const _stubbedEnvs = new Map<string, string | undefined>();

export const vi = {
  // ── Mock functions ──────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: <T extends (...args: any[]) => any>(impl?: T) => createMockFn(impl),

  spyOn,

  // ── Module mocks ────────────────────────────────────────────────────────────

  mock: (
    moduleId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    factory?: () => Record<string, any>,
  ) => mock(moduleId, factory),

  unmock: (moduleId: string) => unmock(moduleId),

  // ── Spy lifecycle ───────────────────────────────────────────────────────────

  /** Clear call records on all spies (does NOT reset implementations). */
  clearAllMocks: () => {
    for (const spy of getAllSpies()) {
      spy.mockClear();
    }
  },

  /** Clear call records AND reset implementations on all spies. */
  resetAllMocks: () => {
    for (const spy of getAllSpies()) {
      spy.mockReset();
    }
  },

  /** Restore all spyOn mocks to their original implementations. */
  restoreAllMocks: () => {
    for (const spy of getAllSpies()) {
      if (spy._isSpyOnFn) spy.mockRestore();
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mocked: <T>(fn: T): T => fn,

  // ── Fake timers ─────────────────────────────────────────────────────────────

  useFakeTimers: (config?: { now?: number | Date; toFake?: string[] }) => {
    fakeClock.install(config);
    return vi;
  },

  useRealTimers: () => {
    fakeClock.uninstall();
    return vi;
  },

  runAllTimers: () => {
    fakeClock.runAll();
    return vi;
  },

  runAllTimersAsync: async () => {
    fakeClock.runAll();
    await Promise.resolve();
    return vi;
  },

  advanceTimersByTime: (ms: number) => {
    fakeClock.tick(ms);
    return vi;
  },

  advanceTimersByTimeAsync: async (ms: number) => {
    fakeClock.tick(ms);
    await Promise.resolve();
    return vi;
  },

  clearAllTimers: () => {
    fakeClock.clearAllTimers();
    return vi;
  },

  setSystemTime: (time: number | Date | string) => {
    const t = typeof time === "string" ? new Date(time) : time;
    fakeClock.setSystemTime(typeof t === "number" ? t : t);
    return vi;
  },

  getRealSystemTime: () => fakeClock.getRealSystemTime(),

  setConfig: (config: { testTimeout?: number; hookTimeout?: number }) => {
    if (config.testTimeout !== undefined) setTestTimeout(config.testTimeout);
    return vi;
  },

  // ── Global / env stubs ──────────────────────────────────────────────────────

  stubGlobal: (name: string, value: unknown) => {
    if (!_stubbedGlobals.has(name)) {
      _stubbedGlobals.set(name, (globalThis as Record<string, unknown>)[name]);
    }
    (globalThis as Record<string, unknown>)[name] = value;
    return vi;
  },

  unstubAllGlobals: () => {
    for (const [name, original] of _stubbedGlobals) {
      (globalThis as Record<string, unknown>)[name] = original;
    }
    _stubbedGlobals.clear();
    return vi;
  },

  stubEnv: (name: string, value: string) => {
    if (!_stubbedEnvs.has(name)) {
      _stubbedEnvs.set(name, process.env[name]);
    }
    process.env[name] = value;
    return vi;
  },

  unstubAllEnvs: () => {
    for (const [name, original] of _stubbedEnvs) {
      if (original === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = original;
      }
    }
    _stubbedEnvs.clear();
    return vi;
  },

  // ── Misc ────────────────────────────────────────────────────────────────────

  /** Executes fn immediately — provided for hoisted() call compatibility. */
  hoisted: <T>(fn: () => T): T => fn(),

  /** Imports the real (un-mocked) version of a module. */
  importActual: <T = unknown>(moduleId: string): Promise<T> =>
    import(/* @vite-ignore */ moduleId) as Promise<T>,

  /** Imports a fully auto-mocked version of a module (all exports replaced with vi.fn()). */
  importMock: async <T = unknown>(moduleId: string): Promise<T> => {
    const mod = (await import(/* @vite-ignore */ moduleId)) as Record<string, unknown>;
    const mocked: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(mod)) {
      mocked[key] = typeof val === "function" ? createMockFn() : val;
    }
    return mocked as T;
  },
} as const;

export function installVitestGlobals(): void {
  Object.assign(globalThis, {
    describe,
    it,
    test,
    beforeAll,
    afterAll,
    beforeEach,
    afterEach,
    expect,
    vi,
  });
}
