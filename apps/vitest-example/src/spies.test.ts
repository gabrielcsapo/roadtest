import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { storage } from "./storage";

// ─── vi.fn() ──────────────────────────────────────────────────────────────────

describe("vi.fn() — standalone mock functions", () => {
  it("records calls and returns undefined by default", () => {
    const fn = vi.fn();
    fn("hello");
    fn("world");

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledWith("hello");
    expect(fn).toHaveBeenCalledWith("world");
    expect(fn).toHaveBeenLastCalledWith("world");
  });

  it("mockReturnValue — returns a fixed value", () => {
    const double = vi.fn().mockReturnValue(42);

    expect(double()).toBe(42);
    expect(double()).toBe(42);
    expect(double).toHaveBeenCalledTimes(2);
    expect(double).toHaveReturnedTimes(2);
    expect(double).toHaveReturnedWith(42);
  });

  it("mockReturnValueOnce — returns different values in sequence", () => {
    const fn = vi.fn().mockReturnValueOnce(1).mockReturnValueOnce(2).mockReturnValue(0);

    expect(fn()).toBe(1);
    expect(fn()).toBe(2);
    expect(fn()).toBe(0); // falls back to default
    expect(fn()).toBe(0);
  });

  it("mockImplementation — wraps custom logic", () => {
    const add = vi.fn().mockImplementation((a: number, b: number) => a + b);

    expect(add(2, 3)).toBe(5);
    expect(add(10, 20)).toBe(30);
    expect(add).toHaveBeenNthCalledWith(1, 2, 3);
    expect(add).toHaveBeenNthCalledWith(2, 10, 20);
  });

  it("mockImplementationOnce — runs custom logic for one call", () => {
    const fn = vi
      .fn()
      .mockImplementationOnce(() => "first")
      .mockReturnValue("default");

    expect(fn()).toBe("first");
    expect(fn()).toBe("default");
  });

  it("mockClear — clears call history but keeps implementation", () => {
    const fn = vi.fn().mockReturnValue(99);
    fn("a");
    fn("b");
    expect(fn).toHaveBeenCalledTimes(2);

    fn.mockClear();
    expect(fn).toHaveBeenCalledTimes(0);
    expect(fn()).toBe(99); // implementation intact
  });

  it("mockReset — clears history and removes implementation", () => {
    const fn = vi.fn().mockReturnValue(99);
    fn();
    fn.mockReset();

    expect(fn).toHaveBeenCalledTimes(0);
    expect(fn()).toBeUndefined();
  });

  it("accepts initial implementation in constructor", () => {
    const greet = vi.fn((name: string) => `Hello, ${name}!`);
    expect(greet("World")).toBe("Hello, World!");
    expect(greet).toHaveBeenCalledWith("World");
  });
});

// ─── vi.spyOn() ───────────────────────────────────────────────────────────────

describe("vi.spyOn() — wrapping existing methods", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("tracks calls to an existing method", () => {
    const obj = { multiply: (a: number, b: number) => a * b };
    const spy = vi.spyOn(obj, "multiply");

    expect(obj.multiply(3, 4)).toBe(12); // original still called
    expect(spy).toHaveBeenCalledWith(3, 4);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveReturnedWith(12);
  });

  it("can override implementation with mockImplementation", () => {
    const obj = { getValue: () => "real" };
    vi.spyOn(obj, "getValue").mockImplementation(() => "mocked");

    expect(obj.getValue()).toBe("mocked");
    expect(obj.getValue()).toBe("mocked");
  });

  it("mockRestore — reverts the spy to the original", () => {
    const obj = { getValue: () => "original" };
    const spy = vi.spyOn(obj, "getValue").mockReturnValue("spy");
    expect(obj.getValue()).toBe("spy");

    spy.mockRestore();
    expect(obj.getValue()).toBe("original");
  });

  it("spies on localStorage via the storage module", () => {
    const setSpy = vi.spyOn(storage, "set");
    storage.set("key", { theme: "dark" });

    expect(setSpy).toHaveBeenCalledWith("key", { theme: "dark" });
    expect(setSpy).toHaveBeenCalledTimes(1);
  });
});

// ─── vi.clearAllMocks / resetAllMocks ─────────────────────────────────────────

describe("vi.clearAllMocks() and vi.resetAllMocks()", () => {
  it("clearAllMocks zeroes call counts across all spies", () => {
    const a = vi.fn().mockReturnValue(1);
    const b = vi.fn().mockReturnValue(2);
    a();
    b();
    b();

    vi.clearAllMocks();

    expect(a).toHaveBeenCalledTimes(0);
    expect(b).toHaveBeenCalledTimes(0);
    // Implementations survive clearAllMocks
    expect(a()).toBe(1);
    expect(b()).toBe(2);
  });

  it("resetAllMocks zeroes counts and removes implementations", () => {
    const fn = vi.fn().mockReturnValue(42);
    fn();

    vi.resetAllMocks();

    expect(fn).toHaveBeenCalledTimes(0);
    expect(fn()).toBeUndefined();
  });
});

// ─── toHaveBeenNthCalledWith / toHaveLastReturnedWith ─────────────────────────

describe("call-order matchers", () => {
  it("toHaveBeenNthCalledWith checks the nth call's args", () => {
    const fn = vi.fn();
    fn("a");
    fn("b");
    fn("c");

    expect(fn).toHaveBeenNthCalledWith(1, "a");
    expect(fn).toHaveBeenNthCalledWith(2, "b");
    expect(fn).toHaveBeenNthCalledWith(3, "c");
  });

  it("toHaveLastReturnedWith checks the most recent return value", () => {
    const fn = vi.fn().mockReturnValueOnce(10).mockReturnValue(20);
    fn();
    fn();

    expect(fn).toHaveLastReturnedWith(20);
  });

  it("toHaveNthReturnedWith checks a specific return value by index", () => {
    const fn = vi
      .fn()
      .mockReturnValueOnce("first")
      .mockReturnValueOnce("second")
      .mockReturnValue("rest");
    fn();
    fn();
    fn();

    expect(fn).toHaveNthReturnedWith(1, "first");
    expect(fn).toHaveNthReturnedWith(2, "second");
    expect(fn).toHaveNthReturnedWith(3, "rest");
  });
});

// ─── vi.stubGlobal / vi.unstubAllGlobals ─────────────────────────────────────

describe("vi.stubGlobal()", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("replaces a global and restores it afterward", () => {
    vi.stubGlobal("__TEST_FLAG__", true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((globalThis as any).__TEST_FLAG__).toBe(true);
  });
});
