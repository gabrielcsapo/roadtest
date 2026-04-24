import { currentTest } from "./store";
import { captureSnapshotAssertion } from "./render";
import { inlineCSSClassStyles } from "./inlineStyles";

class AssertionError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "AssertionError";
  }
}

function stringify(v: unknown): string {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/**
 * Recursively walk `received` vs `expected` and collect lines like:
 *   - path: <received value>   (what we got)
 *   + path: <expected value>   (what was expected)
 * For primitive mismatches the path is shown; for missing/extra keys the
 * path is prefixed with "- extra:" / "+ missing:".
 */
function collectDiffLines(received: unknown, expected: unknown, path: string): string[] {
  const receivedJson = JSON.stringify(received);
  const expectedJson = JSON.stringify(expected);
  if (receivedJson === expectedJson) return [];

  const isPlainObj = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);

  if (isPlainObj(received) && isPlainObj(expected)) {
    const keys = new Set([...Object.keys(received), ...Object.keys(expected)]);
    const lines: string[] = [];
    for (const key of keys) {
      const childPath = path ? `${path}.${key}` : key;
      if (!(key in expected)) {
        lines.push(`  - extra   ${childPath}: ${stringify(received[key])}`);
      } else if (!(key in received)) {
        lines.push(`  + missing ${childPath}: ${stringify(expected[key])}`);
      } else {
        lines.push(...collectDiffLines(received[key], expected[key], childPath));
      }
    }
    return lines;
  }

  if (Array.isArray(received) && Array.isArray(expected)) {
    const len = Math.max(received.length, expected.length);
    const lines: string[] = [];
    for (let i = 0; i < len; i++) {
      lines.push(...collectDiffLines(received[i], expected[i], `${path}[${i}]`));
    }
    return lines;
  }

  // Primitive or type mismatch
  return [
    `  - received ${path || "(value)"}: ${stringify(received)}`,
    `  + expected ${path || "(value)"}: ${stringify(expected)}`,
  ];
}

function deepDiffMessage(received: unknown, expected: unknown): string {
  const lines = collectDiffLines(received, expected, "");
  if (lines.length === 0)
    return `Expected ${stringify(expected)} but received ${stringify(received)}`;
  return `toEqual failed:\n${lines.join("\n")}`;
}

interface Matchers {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeNull(): void;
  toBeUndefined(): void;
  toBeDefined(): void;
  toContain(item: unknown): void;
  toHaveLength(n: number): void;
  toThrow(msg?: string): void;
  toBeGreaterThan(n: number): void;
  toBeLessThan(n: number): void;
  toBeGreaterThanOrEqual(n: number): void;
  toBeLessThanOrEqual(n: number): void;
  toMatch(pattern: string | RegExp): void;
  toMatchObject(expected: object): void;
  toBeInstanceOf(cls: new (...args: unknown[]) => unknown): void;
  toHaveProperty(keyPath: string, value?: unknown): void;
  toHaveBeenCalled(): void;
  toHaveBeenCalledTimes(n: number): void;
  toHaveBeenCalledWith(...args: unknown[]): void;
  toMatchSnapshot(label?: string): Promise<void>;
  not: Matchers;
}

function isSubset(obj: unknown, subset: unknown): boolean {
  if (typeof subset !== "object" || subset === null) return Object.is(obj, subset);
  if (typeof obj !== "object" || obj === null) return false;
  for (const key of Object.keys(subset as object)) {
    if (!isSubset((obj as Record<string, unknown>)[key], (subset as Record<string, unknown>)[key]))
      return false;
  }
  return true;
}

function getNestedValue(obj: unknown, keyPath: string): { found: boolean; value: unknown } {
  const keys = keyPath.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return { found: false, value: undefined };
    }
    if (!(key in (current as object))) return { found: false, value: undefined };
    current = (current as Record<string, unknown>)[key];
  }
  return { found: true, value: current };
}

/** Type for spy functions decorated by wrapWithSpies() */
interface SpyFn {
  _isSpy: true;
  _spyCalls: Array<{ args: unknown[]; result: unknown; threw: boolean }>;
}

function isSpy(v: unknown): v is SpyFn {
  return typeof v === "function" && (v as unknown as SpyFn)._isSpy === true;
}

function createMatchers(received: unknown, negated = false): Matchers {
  function assert(pass: boolean, failMsg: string, label: string) {
    const finalPass = negated ? !pass : pass;
    const error = finalPass ? undefined : negated ? `Expected NOT: ${failMsg}` : failMsg;

    if (currentTest) {
      currentTest.assertions.push({
        label: negated ? `expect(…).not.${label}` : `expect(…).${label}`,
        status: finalPass ? "pass" : "fail",
        error,
      });
    }

    if (!finalPass) throw new AssertionError(error!);
  }

  const matchers: Matchers = {
    get not() {
      return createMatchers(received, !negated);
    },

    toBe(expected) {
      assert(
        Object.is(received, expected),
        `Expected ${stringify(expected)} but received ${stringify(received)}`,
        `toBe(${stringify(expected)})`,
      );
    },
    toEqual(expected) {
      assert(
        JSON.stringify(received) === JSON.stringify(expected),
        deepDiffMessage(received, expected),
        `toEqual(${stringify(expected)})`,
      );
    },
    toBeTruthy() {
      assert(
        Boolean(received),
        `Expected truthy but received ${stringify(received)}`,
        "toBeTruthy()",
      );
    },
    toBeFalsy() {
      assert(!received, `Expected falsy but received ${stringify(received)}`, "toBeFalsy()");
    },
    toBeNull() {
      assert(received === null, `Expected null but received ${stringify(received)}`, "toBeNull()");
    },
    toBeUndefined() {
      assert(
        received === undefined,
        `Expected undefined but received ${stringify(received)}`,
        "toBeUndefined()",
      );
    },
    toBeDefined() {
      assert(received !== undefined, "Expected a defined value", "toBeDefined()");
    },
    toContain(item) {
      const ok = Array.isArray(received)
        ? received.includes(item)
        : typeof received === "string" && received.includes(String(item));
      assert(
        ok,
        `Expected ${stringify(received)} to contain ${stringify(item)}`,
        `toContain(${stringify(item)})`,
      );
    },
    toHaveLength(n) {
      const len = (received as { length?: number }).length;
      assert(len === n, `Expected length ${n} but got ${len}`, `toHaveLength(${n})`);
    },
    toThrow(msg) {
      let threw = false;
      let thrownMsg = "";
      try {
        (received as () => void)();
      } catch (e) {
        threw = true;
        thrownMsg = String(e);
      }
      assert(threw, "Expected function to throw", "toThrow()");
      if (msg)
        assert(
          thrownMsg.includes(msg),
          `Expected to throw "${msg}" but got "${thrownMsg}"`,
          `toThrow(${stringify(msg)})`,
        );
    },
    toBeGreaterThan(n) {
      assert((received as number) > n, `Expected ${received} > ${n}`, `toBeGreaterThan(${n})`);
    },
    toBeLessThan(n) {
      assert((received as number) < n, `Expected ${received} < ${n}`, `toBeLessThan(${n})`);
    },
    toBeGreaterThanOrEqual(n) {
      assert(
        (received as number) >= n,
        `Expected ${received} >= ${n}`,
        `toBeGreaterThanOrEqual(${n})`,
      );
    },
    toBeLessThanOrEqual(n) {
      assert(
        (received as number) <= n,
        `Expected ${received} <= ${n}`,
        `toBeLessThanOrEqual(${n})`,
      );
    },
    toMatch(pattern) {
      const ok =
        pattern instanceof RegExp
          ? pattern.test(String(received))
          : String(received).includes(pattern);
      assert(
        ok,
        `Expected ${stringify(received)} to match ${stringify(pattern)}`,
        `toMatch(${stringify(pattern)})`,
      );
    },
    toMatchObject(expected) {
      assert(
        isSubset(received, expected),
        `Expected ${stringify(received)} to match object ${stringify(expected)}`,
        `toMatchObject(${stringify(expected)})`,
      );
    },
    toBeInstanceOf(cls) {
      assert(
        received instanceof cls,
        `Expected value to be an instance of ${cls.name}`,
        `toBeInstanceOf(${cls.name})`,
      );
    },
    toHaveProperty(keyPath, value) {
      const { found, value: actual } = getNestedValue(received, keyPath);
      if (value !== undefined) {
        assert(
          found && Object.is(actual, value),
          `Expected property "${keyPath}" to equal ${stringify(value)}, got ${stringify(actual)}`,
          `toHaveProperty(${stringify(keyPath)}, ${stringify(value)})`,
        );
      } else {
        assert(
          found,
          `Expected object to have property "${keyPath}"`,
          `toHaveProperty(${stringify(keyPath)})`,
        );
      }
    },
    toHaveBeenCalled() {
      if (!isSpy(received)) throw new AssertionError("Expected a spy function");
      assert(
        received._spyCalls.length > 0,
        `Expected spy to have been called`,
        "toHaveBeenCalled()",
      );
    },
    toHaveBeenCalledTimes(n) {
      if (!isSpy(received)) throw new AssertionError("Expected a spy function");
      assert(
        received._spyCalls.length === n,
        `Expected spy to have been called ${n} time(s) but was called ${received._spyCalls.length} time(s)`,
        `toHaveBeenCalledTimes(${n})`,
      );
    },
    toHaveBeenCalledWith(...args) {
      if (!isSpy(received)) throw new AssertionError("Expected a spy function");
      const match = received._spyCalls.some(
        (call) => JSON.stringify(call.args) === JSON.stringify(args),
      );
      assert(
        match,
        `Expected spy to have been called with ${stringify(args)}`,
        `toHaveBeenCalledWith(${args.map(stringify).join(", ")})`,
      );
    },

    async toMatchSnapshot(label?: string) {
      const html =
        received instanceof HTMLElement
          ? inlineCSSClassStyles(received)
          : typeof received === "string"
            ? received
            : undefined;
      const snapCount = currentTest
        ? currentTest.assertions.filter((a) => a.snapshot).length + 1
        : 1;
      const snapLabel = label ?? `snapshot ${snapCount}`;
      captureSnapshotAssertion(snapLabel, html ?? "");
    },
  };

  return matchers;
}

export function expect(received: unknown): Matchers {
  return createMatchers(received);
}
