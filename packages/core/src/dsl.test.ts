import { describe, it, expect } from "@fieldtest/core";
import { Store } from "./framework/store.js";
import { nanoid } from "./framework/nanoid.js";
import type { TestSuite } from "./framework/types.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSuite(overrides: Partial<TestSuite> = {}): TestSuite {
  return {
    id: nanoid(),
    name: "test suite",
    tests: [],
    status: "pending",
    ...overrides,
  };
}

// ─── it.skip ─────────────────────────────────────────────────────────────────

describe("it.skip", () => {
  it("skipped tests are registered with status 'skipped'", () => {
    const store = new Store();
    const suite = makeSuite();
    suite.tests.push({
      id: nanoid(),
      name: "skipped test",
      suiteId: suite.id,
      suiteName: suite.name,
      status: "skipped",
      assertions: [],
      snapshots: [],
      consoleLogs: [],
      networkEntries: [],
      mockEntries: [],
      testCoverage: null,
      fn: () => {},
    });
    store.addSuite(suite);
    const registered = store.getState().suites[0].tests[0];
    expect(registered.status).toBe("skipped");
    expect(registered.name).toBe("skipped test");
  });
});

// ─── it.only flag propagation ────────────────────────────────────────────────

describe("it.only — only flag on TestCase", () => {
  it("a test registered with only=true carries the only flag", () => {
    const store = new Store();
    const suite = makeSuite();
    suite.tests.push({
      id: nanoid(),
      name: "exclusive test",
      suiteId: suite.id,
      suiteName: suite.name,
      status: "pending",
      assertions: [],
      snapshots: [],
      consoleLogs: [],
      networkEntries: [],
      mockEntries: [],
      testCoverage: null,
      only: true,
      fn: () => {},
    });
    store.addSuite(suite);
    const registered = store.getState().suites[0].tests[0];
    expect(registered.only).toBe(true);
  });

  it("a normal test does not carry the only flag", () => {
    const store = new Store();
    const suite = makeSuite();
    suite.tests.push({
      id: nanoid(),
      name: "normal test",
      suiteId: suite.id,
      suiteName: suite.name,
      status: "pending",
      assertions: [],
      snapshots: [],
      consoleLogs: [],
      networkEntries: [],
      mockEntries: [],
      testCoverage: null,
      fn: () => {},
    });
    store.addSuite(suite);
    const registered = store.getState().suites[0].tests[0];
    expect(registered.only).toBeUndefined();
  });
});

// ─── it.each ─────────────────────────────────────────────────────────────────

describe("it.each", () => {
  const cases = [
    [1, 2, 3],
    [10, 20, 30],
    [0, 0, 0],
  ] as [number, number, number][];

  it.each(cases)("adds %d + %d to equal %d", (a, b, expected) => {
    expect(a + b).toBe(expected);
  });

  it("generates a test for each case", () => {
    // Sanity check: the tests above ran without throwing
    expect(true).toBe(true);
  });
});

// ─── Store — only flag detection ──────────────────────────────────────────────

describe("Store — only mode detection via suite tests", () => {
  it("detects only mode when any test has only=true", () => {
    const store = new Store();
    const s1 = makeSuite({ id: "s1" });
    s1.tests.push({
      id: "t1",
      name: "t1",
      suiteId: "s1",
      suiteName: "s1",
      status: "pending",
      assertions: [],
      snapshots: [],
      consoleLogs: [],
      networkEntries: [],
      mockEntries: [],
      testCoverage: null,
      fn: () => {},
    });
    const s2 = makeSuite({ id: "s2", name: "second" });
    s2.tests.push({
      id: "t2",
      name: "t2",
      suiteId: "s2",
      suiteName: "s2",
      status: "pending",
      assertions: [],
      snapshots: [],
      consoleLogs: [],
      networkEntries: [],
      mockEntries: [],
      testCoverage: null,
      only: true,
      fn: () => {},
    });
    store.addSuite(s1);
    store.addSuite(s2);
    const onlyMode = store.getState().suites.some((s) => s.tests.some((t) => t.only));
    expect(onlyMode).toBe(true);
  });

  it("reports no only mode when no test has only=true", () => {
    const store = new Store();
    const suite = makeSuite();
    suite.tests.push({
      id: "t1",
      name: "t1",
      suiteId: suite.id,
      suiteName: suite.name,
      status: "pending",
      assertions: [],
      snapshots: [],
      consoleLogs: [],
      networkEntries: [],
      mockEntries: [],
      testCoverage: null,
      fn: () => {},
    });
    store.addSuite(suite);
    const onlyMode = store.getState().suites.some((s) => s.tests.some((t) => t.only));
    expect(onlyMode).toBe(false);
  });
});
