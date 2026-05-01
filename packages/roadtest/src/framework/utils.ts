// ─── Asymmetric matchers ──────────────────────────────────────────────────────

export abstract class AsymmetricMatcher {
  abstract matches(received: unknown): boolean;
  abstract toString(): string;
}

export class AnyMatcher extends AsymmetricMatcher {
  constructor(private ctor: unknown) {
    super();
  }
  matches(received: unknown): boolean {
    if (this.ctor === String) return typeof received === "string" || received instanceof String;
    if (this.ctor === Number) return typeof received === "number" || received instanceof Number;
    if (this.ctor === Boolean) return typeof received === "boolean" || received instanceof Boolean;
    if (this.ctor === BigInt) return typeof received === "bigint";
    if (this.ctor === Symbol) return typeof received === "symbol";
    if (this.ctor === Function) return typeof received === "function";
    if (this.ctor === Object) return typeof received === "object" && received !== null;
    return received instanceof (this.ctor as new (...args: unknown[]) => unknown);
  }
  toString() {
    return `Any<${(this.ctor as { name?: string }).name ?? String(this.ctor)}>`;
  }
}

export class AnythingMatcher extends AsymmetricMatcher {
  matches(received: unknown): boolean {
    return received !== null && received !== undefined;
  }
  toString() {
    return "Anything";
  }
}

export class ArrayContainingMatcher extends AsymmetricMatcher {
  constructor(private expected: unknown[]) {
    super();
  }
  matches(received: unknown): boolean {
    if (!Array.isArray(received)) return false;
    return this.expected.every((e) => (received as unknown[]).some((r) => deepEqual(r, e)));
  }
  toString() {
    return `ArrayContaining(${JSON.stringify(this.expected)})`;
  }
}

export class ObjectContainingMatcher extends AsymmetricMatcher {
  constructor(private expected: Record<string, unknown>) {
    super();
  }
  matches(received: unknown): boolean {
    if (typeof received !== "object" || received === null) return false;
    return Object.entries(this.expected).every(([k, v]) =>
      deepEqual((received as Record<string, unknown>)[k], v),
    );
  }
  toString() {
    return `ObjectContaining(${JSON.stringify(this.expected)})`;
  }
}

export class StringContainingMatcher extends AsymmetricMatcher {
  constructor(private expected: string) {
    super();
  }
  matches(received: unknown): boolean {
    return typeof received === "string" && received.includes(this.expected);
  }
  toString() {
    return `StringContaining(${JSON.stringify(this.expected)})`;
  }
}

export class StringMatchingMatcher extends AsymmetricMatcher {
  constructor(private pattern: string | RegExp) {
    super();
  }
  matches(received: unknown): boolean {
    if (typeof received !== "string") return false;
    return this.pattern instanceof RegExp
      ? this.pattern.test(received)
      : received.includes(this.pattern);
  }
  toString() {
    return `StringMatching(${this.pattern})`;
  }
}

// ─── Deep equality ────────────────────────────────────────────────────────────

export function deepEqual(a: unknown, b: unknown): boolean {
  if (b instanceof AsymmetricMatcher) return b.matches(a);
  if (a instanceof AsymmetricMatcher) return a.matches(b);
  if (Object.is(a, b)) return true;
  if (a === null || b === null || a === undefined || b === undefined) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    const bArr = b as unknown[];
    if (a.length !== bArr.length) return false;
    return a.every((v, i) => deepEqual(v, bArr[i]));
  }

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const keysA = Object.keys(aObj);
  const keysB = Object.keys(bObj);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => k in bObj && deepEqual(aObj[k], bObj[k]));
}

export function strictDeepEqual(a: unknown, b: unknown): boolean {
  if (b instanceof AsymmetricMatcher) return b.matches(a);
  if (a instanceof AsymmetricMatcher) return a.matches(b);
  if (Object.is(a, b)) return true;
  if (a === null || b === null || a === undefined || b === undefined) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;

  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    const bArr = b as unknown[];
    if (a.length !== bArr.length) return false;
    return a.every((v, i) => strictDeepEqual(v, bArr[i]));
  }

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  // Include ALL own enumerable + non-enumerable string properties for strict check
  const keysA = Object.getOwnPropertyNames(aObj);
  const keysB = Object.getOwnPropertyNames(bObj);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => k in bObj && strictDeepEqual(aObj[k], bObj[k]));
}
