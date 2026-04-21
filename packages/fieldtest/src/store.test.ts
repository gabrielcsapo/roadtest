import { describe, it, expect } from "fieldtest";
import { Store } from "./framework/store.js";
import type { TestSuite, TestCase } from "./framework/types.js";

function makeSuite(overrides: Partial<TestSuite> = {}): TestSuite {
  return {
    id: "suite-1",
    name: "test suite",
    tests: [],
    status: "pending",
    ...overrides,
  };
}

function makeTest(overrides: Partial<TestCase> = {}): TestCase {
  return {
    id: "test-1",
    name: "my test",
    suiteId: "suite-1",
    suiteName: "test suite",
    status: "pending",
    assertions: [],
    snapshots: [],
    consoleLogs: [],
    networkEntries: [],
    mockEntries: [],
    testCoverage: null,
    fn: () => {},
    ...overrides,
  };
}

describe("Store", () => {
  it("starts with empty state", () => {
    const store = new Store();
    const state = store.getState();
    expect(state.suites).toHaveLength(0);
    expect(state.running).toBe(false);
    expect(state.lastRunAt).toBeNull();
    expect(state.coverage).toBeNull();
    expect(state.runProgress).toBeNull();
  });

  it("addSuite appends a suite", () => {
    const store = new Store();
    store.addSuite(makeSuite());
    expect(store.getState().suites).toHaveLength(1);
    expect(store.getState().suites[0].name).toBe("test suite");
  });

  it("addSuite does not mutate previous state reference", () => {
    const store = new Store();
    const before = store.getState();
    store.addSuite(makeSuite());
    expect(store.getState() === before).toBe(false);
  });

  it("subscribe notifies listener on state change", () => {
    const store = new Store();
    let callCount = 0;
    store.subscribe(() => {
      callCount++;
    });
    store.addSuite(makeSuite());
    expect(callCount).toBe(1);
    store.addSuite(makeSuite({ id: "suite-2", name: "second" }));
    expect(callCount).toBe(2);
  });

  it("subscribe returns unsubscribe function", () => {
    const store = new Store();
    let callCount = 0;
    const unsub = store.subscribe(() => {
      callCount++;
    });
    store.addSuite(makeSuite());
    expect(callCount).toBe(1);
    unsub();
    store.addSuite(makeSuite({ id: "suite-2", name: "second" }));
    expect(callCount).toBe(1);
  });

  it("updateTest patches the correct test", () => {
    const store = new Store();
    const test = makeTest();
    store.addSuite(makeSuite({ tests: [test] }));
    store.updateTest("suite-1", "test-1", { status: "pass", duration: 42 });
    const updated = store.getState().suites[0].tests[0];
    expect(updated.status).toBe("pass");
    expect(updated.duration).toBe(42);
  });

  it("updateTest leaves other tests unchanged", () => {
    const store = new Store();
    const t1 = makeTest({ id: "test-1" });
    const t2 = makeTest({ id: "test-2", name: "second" });
    store.addSuite(makeSuite({ tests: [t1, t2] }));
    store.updateTest("suite-1", "test-1", { status: "pass" });
    expect(store.getState().suites[0].tests[1].status).toBe("pending");
  });

  it("updateSuite patches the correct suite", () => {
    const store = new Store();
    store.addSuite(makeSuite());
    store.updateSuite("suite-1", { status: "pass", duration: 100 });
    const updated = store.getState().suites[0];
    expect(updated.status).toBe("pass");
    expect(updated.duration).toBe(100);
  });

  it("setRunning sets running to true", () => {
    const store = new Store();
    store.setRunning(true);
    expect(store.getState().running).toBe(true);
    expect(store.getState().lastRunAt).toBeNull();
  });

  it("setRunning(false) sets lastRunAt", () => {
    const store = new Store();
    store.setRunning(true);
    store.setRunning(false);
    expect(store.getState().running).toBe(false);
    expect(store.getState().lastRunAt).toBeDefined();
  });

  it("reset returns all suites and tests to pending", () => {
    const store = new Store();
    const test = makeTest({ status: "pass" });
    store.addSuite(makeSuite({ status: "pass", tests: [test] }));
    store.reset();
    const suite = store.getState().suites[0];
    expect(suite.status).toBe("pending");
    expect(suite.tests[0].status).toBe("pending");
  });

  it("reset clears duration from tests", () => {
    const store = new Store();
    const test = makeTest({ status: "pass", duration: 99 });
    store.addSuite(makeSuite({ tests: [test] }));
    store.reset();
    expect(store.getState().suites[0].tests[0].duration).toBeUndefined();
  });

  it("resetSuite resets only the targeted suite", () => {
    const store = new Store();
    store.addSuite(makeSuite({ id: "suite-1", status: "pass" }));
    store.addSuite(makeSuite({ id: "suite-2", name: "other", status: "fail" }));
    store.resetSuite("suite-1");
    expect(store.getState().suites[0].status).toBe("pending");
    expect(store.getState().suites[1].status).toBe("fail");
  });

  it("resetTest resets only the targeted test", () => {
    const store = new Store();
    const t1 = makeTest({ id: "test-1", status: "pass", duration: 10 });
    const t2 = makeTest({ id: "test-2", name: "second", status: "fail" });
    store.addSuite(makeSuite({ tests: [t1, t2] }));
    store.resetTest("suite-1", "test-1");
    const tests = store.getState().suites[0].tests;
    expect(tests[0].status).toBe("pending");
    expect(tests[0].duration).toBeUndefined();
    expect(tests[1].status).toBe("fail");
  });

  it("removeSuitesForFile removes suites matching the source file", () => {
    const store = new Store();
    store.addSuite(makeSuite({ id: "s1", sourceFile: "a.test.ts" }));
    store.addSuite(makeSuite({ id: "s2", name: "other", sourceFile: "b.test.ts" }));
    store.removeSuitesForFile("a.test.ts");
    expect(store.getState().suites).toHaveLength(1);
    expect(store.getState().suites[0].sourceFile).toBe("b.test.ts");
  });

  it("removeSuitesForFile is a no-op when file not found", () => {
    const store = new Store();
    store.addSuite(makeSuite({ sourceFile: "a.test.ts" }));
    store.removeSuitesForFile("nonexistent.test.ts");
    expect(store.getState().suites).toHaveLength(1);
  });

  it("setRunProgress stores progress and notifies", () => {
    const store = new Store();
    store.setRunProgress({ done: 3, total: 10, startedAt: 0 });
    expect(store.getState().runProgress?.done).toBe(3);
    expect(store.getState().runProgress?.total).toBe(10);
  });

  it("setRunProgress(null) clears progress", () => {
    const store = new Store();
    store.setRunProgress({ done: 1, total: 5, startedAt: 0 });
    store.setRunProgress(null);
    expect(store.getState().runProgress).toBeNull();
  });
});
