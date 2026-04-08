import type { MockCall, MockEntry } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Factory = () => Record<string, any>;

const _registry = new Map<string, Factory | null>();

/** Tracks which source file registered each mock */
const _scopeMap = new Map<string, string>();

let _currentMockScope: string | null = null;

/** Called by setCurrentSourceFile before loading each test file */
export function __vtSetMockScope(file: string | null): void {
  _currentMockScope = file;
}

/**
 * Call log for the currently-running test.
 * Cleared by the runner before each test, read after the test finishes.
 */
const _callLog: Array<{ moduleId: string } & MockCall> = [];

/**
 * Cache of wrapped mock modules. Keyed by moduleId.
 * Cleared when mock() is called again (so factories re-run on next __ftImport).
 */
const _cache = new Map<string, Record<string, unknown>>();

/** Record a single spy call into the current-test log */
function recordCall(
  moduleId: string,
  fnName: string,
  args: unknown[],
  result: unknown,
  threw: boolean,
) {
  _callLog.push({ moduleId, fnName, args, result, threw, timestamp: Date.now() });
}

/** Wrap every function property in a mock result with a spy */
function wrapWithSpies(
  moduleId: string,
  exports: Record<string, unknown>,
): Record<string, unknown> {
  const wrapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(exports)) {
    if (typeof value !== "function") {
      wrapped[key] = value;
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = value as (...args: any[]) => any;
    wrapped[key] = (...args: unknown[]) => {
      let result: unknown;
      try {
        result = fn(...args);
        // Handle async functions: record when the promise settles
        if (result instanceof Promise) {
          return result.then(
            (resolved) => {
              recordCall(moduleId, key, args, resolved, false);
              return resolved;
            },
            (err) => {
              recordCall(moduleId, key, args, err, true);
              throw err;
            },
          );
        }
      } catch (err) {
        recordCall(moduleId, key, args, err, true);
        throw err;
      }
      recordCall(moduleId, key, args, result, false);
      return result;
    };
  }
  return wrapped;
}

/**
 * Register a module mock. Call this at the top level of a test file.
 * The ViewTest Vite plugin hoists these calls before any transformed imports.
 *
 * @param moduleId   The module specifier to mock (e.g. `'./api'`, `'lodash'`)
 * @param factory    Optional factory — called once per test run. Omit for an
 *                   empty auto-mock (`{}`).
 */
export function mock(moduleId: string, factory?: Factory): void {
  _registry.set(moduleId, factory ?? null);
  _scopeMap.set(moduleId, _currentMockScope ?? "");
  _cache.delete(moduleId); // invalidate cached spy-wrapped result
}

/** Remove a specific module mock */
export function unmock(moduleId: string): void {
  _registry.delete(moduleId);
  _scopeMap.delete(moduleId);
  _cache.delete(moduleId);
}

/** Clear every registered mock (call in afterEach/afterAll if needed) */
export function clearAllMocks(): void {
  _registry.clear();
  _scopeMap.clear();
  _cache.clear();
  _callLog.length = 0;
}

/** Drop the per-test call log — called by the runner before each test */
export function clearCallLog(): void {
  _callLog.length = 0;
}

/**
 * Return mock entries enriched with call history from the current test's log.
 * Filtered to only the mocks registered by the given source file.
 * Called by the runner after the test finishes.
 */
export function getMockEntriesWithCalls(sourceFile?: string): MockEntry[] {
  return Array.from(_registry.keys())
    .filter((moduleId) => {
      if (!sourceFile) return true;
      const scope = _scopeMap.get(moduleId) ?? "";
      // Match if scope ends with sourceFile or equals it (handles relative vs absolute)
      return scope === sourceFile || scope.endsWith(sourceFile) || sourceFile.endsWith(scope);
    })
    .map((moduleId) => ({
      moduleId,
      hasFactory: _registry.get(moduleId) !== null,
      calls: _callLog
        .filter((c) => c.moduleId === moduleId)
        .map(({ fnName, args, result, threw, timestamp }) => ({
          fnName,
          args,
          result,
          threw,
          timestamp,
        })),
    }));
}

/**
 * Runtime import shim automatically injected into test files by the ViewTest
 * Vite transform. You never need to call this directly.
 *
 * Checks the mock registry: if a mock is registered for `moduleId` it returns
 * a spy-wrapped version of the factory result; otherwise it runs `importFn`.
 */
export async function __ftImport(
  moduleId: string,
  importFn: () => Promise<Record<string, unknown>>,
): Promise<Record<string, unknown>> {
  if (_registry.has(moduleId)) {
    if (!_cache.has(moduleId)) {
      const factory = _registry.get(moduleId);
      const raw = factory ? factory() : {};
      _cache.set(moduleId, wrapWithSpies(moduleId, raw));
    }
    return _cache.get(moduleId)!;
  }
  return importFn();
}
