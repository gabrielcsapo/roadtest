import { currentTest } from "./store";
import { captureSnapshotAssertion } from "./render";
import { inlineCSSClassStyles } from "./inlineStyles";
import { isMockFn } from "./spies";
import type { SpyProtocol } from "./spies";
import {
  deepEqual,
  strictDeepEqual,
  AsymmetricMatcher,
  AnyMatcher,
  AnythingMatcher,
  ArrayContainingMatcher,
  ObjectContainingMatcher,
  StringContainingMatcher,
  StringMatchingMatcher,
} from "./utils";

class AssertionError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "AssertionError";
  }
}

function stringify(v: unknown): string {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (v instanceof AsymmetricMatcher) return v.toString();
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function collectDiffLines(received: unknown, expected: unknown, path: string): string[] {
  if (deepEqual(received, expected)) return [];

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

// ─── Custom matchers registry ─────────────────────────────────────────────────

type CustomMatcherResult = { pass: boolean; message: () => string };
type CustomMatcherFn = (received: unknown, ...args: unknown[]) => CustomMatcherResult;
const _customMatchers: Record<string, CustomMatcherFn> = {};

// ─── Matchers interface ───────────────────────────────────────────────────────

interface Matchers {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toStrictEqual(expected: unknown): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeNull(): void;
  toBeUndefined(): void;
  toBeDefined(): void;
  toBeNaN(): void;
  toBeCloseTo(number: number, numDigits?: number): void;
  toBeTypeOf(type: string): void;
  toContain(item: unknown): void;
  toContainEqual(item: unknown): void;
  toHaveLength(n: number): void;
  toThrow(msg?: string | RegExp | Error): void;
  toBeGreaterThan(n: number): void;
  toBeLessThan(n: number): void;
  toBeGreaterThanOrEqual(n: number): void;
  toBeLessThanOrEqual(n: number): void;
  toMatch(pattern: string | RegExp): void;
  toMatchObject(expected: object): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toBeInstanceOf(cls: new (...args: any[]) => unknown): void;
  toHaveProperty(keyPath: string | string[], value?: unknown): void;
  toHaveBeenCalled(): void;
  toHaveBeenCalledTimes(n: number): void;
  toHaveBeenCalledWith(...args: unknown[]): void;
  toHaveBeenLastCalledWith(...args: unknown[]): void;
  toHaveBeenNthCalledWith(n: number, ...args: unknown[]): void;
  toHaveReturnedWith(value: unknown): void;
  toHaveReturnedTimes(n: number): void;
  toHaveLastReturnedWith(value: unknown): void;
  toHaveNthReturnedWith(n: number, value: unknown): void;
  toMatchSnapshot(label?: string): Promise<void>;
  resolves: AsyncMatchers;
  rejects: AsyncMatchers;
  not: Matchers;
  [key: string]: unknown;
}

// resolves/rejects return a promise-wrapped version of every sync matcher
type AsyncMatchers = {
  [K in keyof Omit<Matchers, "resolves" | "rejects" | "not">]: Matchers[K] extends (
    ...args: infer A
  ) => void
    ? (...args: A) => Promise<void>
    : never;
} & { not: AsyncMatchers };

function getNestedValue(
  obj: unknown,
  keyPath: string | string[],
): { found: boolean; value: unknown } {
  const keys = Array.isArray(keyPath) ? keyPath : keyPath.split(".");
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

function isSubset(obj: unknown, subset: unknown): boolean {
  if (subset instanceof AsymmetricMatcher) return subset.matches(obj);
  if (typeof subset !== "object" || subset === null) return deepEqual(obj, subset);
  if (typeof obj !== "object" || obj === null) return false;
  for (const key of Object.keys(subset as object)) {
    if (!isSubset((obj as Record<string, unknown>)[key], (subset as Record<string, unknown>)[key]))
      return false;
  }
  return true;
}

// ─── Async matchers proxy ─────────────────────────────────────────────────────

function createAsyncMatchers(
  received: unknown,
  negated: boolean,
  mode: "resolves" | "rejects",
): AsyncMatchers {
  const handler: ProxyHandler<object> = {
    get(_, prop) {
      if (prop === "not") {
        return createAsyncMatchers(received, !negated, mode);
      }
      return async (...args: unknown[]) => {
        let value: unknown;
        if (mode === "resolves") {
          value = await (received as Promise<unknown>);
        } else {
          try {
            await (received as Promise<unknown>);
            throw new AssertionError(`Expected promise to reject but it resolved`);
          } catch (e) {
            if (e instanceof AssertionError) throw e;
            value = e;
          }
        }
        const m = createMatchers(value, negated);
        return (m as Record<string, (...a: unknown[]) => unknown>)[prop as string]?.(...args);
      };
    },
  };
  return new Proxy({}, handler) as AsyncMatchers;
}

// ─── Core matcher factory ─────────────────────────────────────────────────────

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

    get resolves() {
      return createAsyncMatchers(received, negated, "resolves");
    },

    get rejects() {
      return createAsyncMatchers(received, negated, "rejects");
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
        deepEqual(received, expected),
        deepDiffMessage(received, expected),
        `toEqual(${stringify(expected)})`,
      );
    },

    toStrictEqual(expected) {
      assert(
        strictDeepEqual(received, expected),
        deepDiffMessage(received, expected),
        `toStrictEqual(${stringify(expected)})`,
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

    toBeNaN() {
      assert(
        typeof received === "number" && isNaN(received),
        `Expected NaN but received ${stringify(received)}`,
        "toBeNaN()",
      );
    },

    toBeCloseTo(number, numDigits = 2) {
      const factor = Math.pow(10, numDigits);
      const ok =
        typeof received === "number" &&
        Math.round(received * factor) === Math.round(number * factor);
      assert(
        ok,
        `Expected ${stringify(received)} to be close to ${number} (${numDigits} decimal digits)`,
        `toBeCloseTo(${number}, ${numDigits})`,
      );
    },

    toBeTypeOf(type) {
      assert(
        typeof received === type,
        `Expected typeof ${stringify(received)} to be "${type}" but got "${typeof received}"`,
        `toBeTypeOf(${stringify(type)})`,
      );
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

    toContainEqual(item) {
      const ok = Array.isArray(received) && received.some((el) => deepEqual(el, item));
      assert(
        ok,
        `Expected array to contain an element equal to ${stringify(item)}`,
        `toContainEqual(${stringify(item)})`,
      );
    },

    toHaveLength(n) {
      const len = (received as { length?: number }).length;
      assert(len === n, `Expected length ${n} but got ${len}`, `toHaveLength(${n})`);
    },

    toThrow(msg) {
      let threw = false;
      let thrownMsg = "";
      let thrownErr: unknown;

      // When called via rejects chain, received is already the thrown value
      if (typeof received !== "function") {
        threw = true;
        thrownErr = received;
        thrownMsg = received instanceof Error ? received.message : String(received);
      } else {
        try {
          (received as () => void)();
        } catch (e) {
          threw = true;
          thrownErr = e;
          thrownMsg = e instanceof Error ? e.message : String(e);
        }
      }
      assert(threw, "Expected function to throw", "toThrow()");
      if (msg !== undefined) {
        if (msg instanceof RegExp) {
          assert(
            msg.test(thrownMsg),
            `Expected to throw matching ${msg} but got "${thrownMsg}"`,
            `toThrow(${msg})`,
          );
        } else if (typeof msg === "function") {
          // Class constructor (e.g. toThrow(RangeError))
          assert(
            thrownErr instanceof (msg as unknown as new (...args: unknown[]) => unknown),
            `Expected to throw ${(msg as { name?: string }).name ?? String(msg)} but got "${thrownMsg}"`,
            `toThrow(${(msg as { name?: string }).name ?? String(msg)})`,
          );
        } else if (msg instanceof Error) {
          assert(
            thrownErr instanceof msg.constructor && thrownMsg === msg.message,
            `Expected to throw ${msg.constructor.name}: "${msg.message}" but got "${thrownMsg}"`,
            `toThrow(${stringify(msg.message)})`,
          );
        } else {
          assert(
            thrownMsg.includes(msg as string),
            `Expected to throw "${msg}" but got "${thrownMsg}"`,
            `toThrow(${stringify(msg)})`,
          );
        }
      }
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toBeInstanceOf(cls: new (...args: any[]) => unknown) {
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
          found && deepEqual(actual, value),
          `Expected property "${Array.isArray(keyPath) ? keyPath.join(".") : keyPath}" to equal ${stringify(value)}, got ${stringify(actual)}`,
          `toHaveProperty(${stringify(keyPath)}, ${stringify(value)})`,
        );
      } else {
        assert(
          found,
          `Expected object to have property "${Array.isArray(keyPath) ? keyPath.join(".") : keyPath}"`,
          `toHaveProperty(${stringify(keyPath)})`,
        );
      }
    },

    toHaveBeenCalled() {
      if (!isMockFn(received)) throw new AssertionError("Expected a spy function");
      assert(
        received._spyCalls.length > 0,
        `Expected spy to have been called`,
        "toHaveBeenCalled()",
      );
    },

    toHaveBeenCalledTimes(n) {
      if (!isMockFn(received)) throw new AssertionError("Expected a spy function");
      assert(
        received._spyCalls.length === n,
        `Expected spy to have been called ${n} time(s) but was called ${received._spyCalls.length} time(s)`,
        `toHaveBeenCalledTimes(${n})`,
      );
    },

    toHaveBeenCalledWith(...args) {
      if (!isMockFn(received)) throw new AssertionError("Expected a spy function");
      const match = received._spyCalls.some((call) => deepEqual(call.args, args));
      assert(
        match,
        `Expected spy to have been called with ${stringify(args)}\nActual calls: ${stringify(received._spyCalls.map((c) => c.args))}`,
        `toHaveBeenCalledWith(${args.map(stringify).join(", ")})`,
      );
    },

    toHaveBeenLastCalledWith(...args) {
      if (!isMockFn(received)) throw new AssertionError("Expected a spy function");
      const last = received._spyCalls[received._spyCalls.length - 1];
      assert(
        !!last && deepEqual(last.args, args),
        `Expected last spy call to have been called with ${stringify(args)}\nActual last call: ${stringify(last?.args)}`,
        `toHaveBeenLastCalledWith(${args.map(stringify).join(", ")})`,
      );
    },

    toHaveBeenNthCalledWith(n, ...args) {
      if (!isMockFn(received)) throw new AssertionError("Expected a spy function");
      const call = received._spyCalls[n - 1];
      assert(
        !!call && deepEqual(call.args, args),
        `Expected ${n}th spy call to have been called with ${stringify(args)}\nActual ${n}th call: ${stringify(call?.args)}`,
        `toHaveBeenNthCalledWith(${n}, ${args.map(stringify).join(", ")})`,
      );
    },

    toHaveReturnedWith(value) {
      if (!isMockFn(received)) throw new AssertionError("Expected a spy function");
      const match = received._spyCalls.some((call) => !call.threw && deepEqual(call.result, value));
      assert(
        match,
        `Expected spy to have returned ${stringify(value)}`,
        `toHaveReturnedWith(${stringify(value)})`,
      );
    },

    toHaveReturnedTimes(n) {
      if (!isMockFn(received)) throw new AssertionError("Expected a spy function");
      const count = received._spyCalls.filter((call) => !call.threw).length;
      assert(
        count === n,
        `Expected spy to have returned ${n} time(s) but returned ${count} time(s)`,
        `toHaveReturnedTimes(${n})`,
      );
    },

    toHaveLastReturnedWith(value) {
      if (!isMockFn(received)) throw new AssertionError("Expected a spy function");
      const returned = received._spyCalls.filter((call) => !call.threw);
      const last = returned[returned.length - 1];
      assert(
        !!last && deepEqual(last.result, value),
        `Expected last spy return value to be ${stringify(value)}\nActual: ${stringify(last?.result)}`,
        `toHaveLastReturnedWith(${stringify(value)})`,
      );
    },

    toHaveNthReturnedWith(n, value) {
      if (!isMockFn(received)) throw new AssertionError("Expected a spy function");
      const returned = received._spyCalls.filter((call) => !call.threw);
      const call = returned[n - 1];
      assert(
        !!call && deepEqual(call.result, value),
        `Expected ${n}th spy return value to be ${stringify(value)}\nActual: ${stringify(call?.result)}`,
        `toHaveNthReturnedWith(${n}, ${stringify(value)})`,
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

  // Apply any registered custom matchers
  for (const [name, matcherFn] of Object.entries(_customMatchers)) {
    matchers[name] = (...args: unknown[]) => {
      const result = matcherFn(received, ...args);
      const pass = negated ? !result.pass : result.pass;
      if (currentTest) {
        currentTest.assertions.push({
          label: negated ? `expect(…).not.${name}` : `expect(…).${name}`,
          status: pass ? "pass" : "fail",
          error: pass ? undefined : result.message(),
        });
      }
      if (!pass) throw new AssertionError(result.message());
    };
  }

  return matchers;
}

// ─── Public expect function ───────────────────────────────────────────────────

export function expect(received: unknown): Matchers {
  return createMatchers(received);
}

expect.extend = (matchers: Record<string, CustomMatcherFn>) => {
  Object.assign(_customMatchers, matchers);
};

expect.any = (ctor: unknown) => new AnyMatcher(ctor);
expect.anything = () => new AnythingMatcher();
expect.arrayContaining = (arr: unknown[]) => new ArrayContainingMatcher(arr);
expect.objectContaining = (obj: Record<string, unknown>) => new ObjectContainingMatcher(obj);
expect.stringContaining = (str: string) => new StringContainingMatcher(str);
expect.stringMatching = (pattern: string | RegExp) => new StringMatchingMatcher(pattern);

expect.assertions = (n: number) => {
  // Records the expected assertion count — checked at test completion
  if (currentTest) {
    (currentTest as unknown as Record<string, unknown>)._expectedAssertions = n;
  }
};

expect.hasAssertions = () => {
  if (currentTest) {
    (currentTest as unknown as Record<string, unknown>)._hasAssertions = true;
  }
};
