import { describe, it, expect, beforeEach } from "vitest";
import { clamp, sum, round, isPrime, factorial } from "./math";

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to min when below range", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("clamps to max when above range", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("handles equal min and max", () => {
    expect(clamp(7, 5, 5)).toBe(5);
  });
});

describe("sum", () => {
  it("sums an array of numbers", () => {
    expect(sum([1, 2, 3, 4])).toBe(10);
  });

  it("returns 0 for an empty array", () => {
    expect(sum([])).toBe(0);
  });

  it("handles negative numbers", () => {
    expect(sum([-1, -2, 3])).toBe(0);
  });

  it("array contains expected values — toContain", () => {
    const nums = [1, 2, 3, 4, 5];
    expect(nums).toContain(3);
    expect(nums).not.toContain(99);
  });

  it("array contains deep-equal object — toContainEqual", () => {
    const items = [{ v: 1 }, { v: 2 }, { v: 3 }];
    expect(items).toContainEqual({ v: 2 });
    expect(items).not.toContainEqual({ v: 99 });
  });
});

describe("round", () => {
  it("rounds to 2 decimal places by default", () => {
    expect(round(1.236)).toBe(1.24);
  });

  it("rounds to specified decimal places", () => {
    expect(round(3.14159, 3)).toBe(3.142);
  });

  it("toBeCloseTo — handles floating point imprecision", () => {
    expect(0.1 + 0.2).toBeCloseTo(0.3);
    expect(0.1 + 0.2).toBeCloseTo(0.3, 5);
  });
});

describe("isPrime", () => {
  it("identifies prime numbers", () => {
    expect(isPrime(2)).toBe(true);
    expect(isPrime(3)).toBe(true);
    expect(isPrime(17)).toBe(true);
    expect(isPrime(97)).toBe(true);
  });

  it("identifies non-primes", () => {
    expect(isPrime(0)).toBe(false);
    expect(isPrime(1)).toBe(false);
    expect(isPrime(4)).toBe(false);
    expect(isPrime(100)).toBe(false);
  });

  it("toBeTypeOf — result is a boolean", () => {
    expect(isPrime(7)).toBeTypeOf("boolean");
    expect(isPrime(10)).toBeTypeOf("boolean");
  });
});

describe("factorial", () => {
  it("computes factorial of 0 and 1", () => {
    expect(factorial(0)).toBe(1);
    expect(factorial(1)).toBe(1);
  });

  it("computes factorial of larger numbers", () => {
    expect(factorial(5)).toBe(120);
    expect(factorial(10)).toBe(3628800);
  });

  it("throws RangeError for negative input", () => {
    expect(() => factorial(-1)).toThrow(RangeError);
    expect(() => factorial(-1)).toThrow("not defined for negative");
  });
});

describe("asymmetric matchers", () => {
  const record = { id: 42, name: "Alice", score: 98.6, tags: ["admin", "user"] };

  it("expect.any — matches by constructor", () => {
    expect(record.id).toEqual(expect.any(Number));
    expect(record.name).toEqual(expect.any(String));
    expect(record.tags).toEqual(expect.any(Array));
  });

  it("expect.anything — matches any non-null/undefined", () => {
    expect(record.id).toEqual(expect.anything());
    expect(record.name).toEqual(expect.anything());
    expect(null).not.toEqual(expect.anything());
    expect(undefined).not.toEqual(expect.anything());
  });

  it("expect.objectContaining — partial object match", () => {
    expect(record).toEqual(expect.objectContaining({ id: 42, name: "Alice" }));
    expect(record).not.toEqual(expect.objectContaining({ id: 999 }));
  });

  it("expect.arrayContaining — subset array match", () => {
    expect(record.tags).toEqual(expect.arrayContaining(["admin"]));
    expect(record.tags).not.toEqual(expect.arrayContaining(["superuser"]));
  });

  it("expect.stringContaining — substring match", () => {
    expect(record.name).toEqual(expect.stringContaining("Ali"));
    expect(record.name).not.toEqual(expect.stringContaining("Bob"));
  });

  it("expect.stringMatching — regex match", () => {
    expect(record.name).toEqual(expect.stringMatching(/^Ali/));
    expect(record.name).not.toEqual(expect.stringMatching(/^Bob/));
  });
});

describe("toStrictEqual vs toEqual", () => {
  it("toEqual ignores class identity", () => {
    class Point {
      constructor(
        public x: number,
        public y: number,
      ) {}
    }
    // toEqual passes for plain objects with same shape
    expect({ x: 1, y: 2 }).toEqual({ x: 1, y: 2 });
  });

  it("toStrictEqual checks prototype", () => {
    class Point {
      constructor(
        public x: number,
        public y: number,
      ) {}
    }
    const p = new Point(1, 2);
    expect(p).toStrictEqual(new Point(1, 2));
    expect(p).not.toStrictEqual({ x: 1, y: 2 });
  });
});

describe("lifecycle hooks", () => {
  const calls: string[] = [];

  beforeEach(() => {
    calls.length = 0;
  });

  it("beforeEach resets the calls array", () => {
    calls.push("a");
    expect(calls).toHaveLength(1);
  });

  it("beforeEach ran again so calls is empty at start", () => {
    expect(calls).toHaveLength(0);
  });
});
