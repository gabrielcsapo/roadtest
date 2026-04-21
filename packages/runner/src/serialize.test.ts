import { describe, it, expect } from "roadtest";
import { serializeSnapshot, serializeTestCase, serializeTestSuite } from "./serialize.js";
import type { TestCase, TestSuite, Snapshot } from "roadtest";

function makeSnapshot(overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    label: "my snapshot",
    timestamp: 1000,
    html: "<div>hello</div>",
    element: null as never, // intentionally not serializable
    ...overrides,
  };
}

function makeTest(overrides: Partial<TestCase> = {}): TestCase {
  return {
    id: "test-1",
    name: "my test",
    suiteId: "suite-1",
    suiteName: "test suite",
    status: "pass",
    assertions: [{ label: "toBe(1)", status: "pass" }],
    snapshots: [],
    consoleLogs: [],
    networkEntries: [],
    mockEntries: [],
    testCoverage: null,
    fn: () => {},
    ...overrides,
  };
}

function makeSuite(overrides: Partial<TestSuite> = {}): TestSuite {
  return {
    id: "suite-1",
    name: "test suite",
    tests: [],
    status: "pass",
    ...overrides,
  };
}

describe("serializeSnapshot", () => {
  it("copies label, timestamp, and html", () => {
    const snap = makeSnapshot();
    const result = serializeSnapshot(snap);
    expect(result.label).toBe("my snapshot");
    expect(result.timestamp).toBe(1000);
    expect(result.html).toBe("<div>hello</div>");
  });

  it("does not include element field", () => {
    const snap = makeSnapshot();
    const result = serializeSnapshot(snap);
    expect("element" in result).toBe(false);
  });
});

describe("serializeTestCase", () => {
  it("copies id, name, suiteId, suiteName, status", () => {
    const test = makeTest();
    const result = serializeTestCase(test);
    expect(result.id).toBe("test-1");
    expect(result.name).toBe("my test");
    expect(result.suiteId).toBe("suite-1");
    expect(result.suiteName).toBe("test suite");
    expect(result.status).toBe("pass");
  });

  it("does not include fn field", () => {
    const test = makeTest();
    const result = serializeTestCase(test);
    expect("fn" in result).toBe(false);
  });

  it("copies assertions array", () => {
    const test = makeTest({
      assertions: [
        { label: "toBe(1)", status: "pass" },
        { label: "toBe(2)", status: "fail", error: "mismatch" },
      ],
    });
    const result = serializeTestCase(test);
    expect(result.assertions).toHaveLength(2);
    expect(result.assertions[1].error).toBe("mismatch");
  });

  it("serializes snapshots (drops element)", () => {
    const test = makeTest({ snapshots: [makeSnapshot({ label: "step 1" })] });
    const result = serializeTestCase(test);
    expect(result.snapshots).toHaveLength(1);
    expect(result.snapshots[0].label).toBe("step 1");
    expect("element" in result.snapshots[0]).toBe(false);
  });

  it("copies consoleLogs", () => {
    const test = makeTest({
      consoleLogs: [{ level: "log", args: ["hello"], timestamp: 123 }],
    });
    const result = serializeTestCase(test);
    expect(result.consoleLogs).toHaveLength(1);
    expect(result.consoleLogs[0].args[0]).toBe("hello");
  });

  it("copies error when present", () => {
    const test = makeTest({ status: "fail", error: "Something went wrong" });
    const result = serializeTestCase(test);
    expect(result.error).toBe("Something went wrong");
  });

  it("copies testCoverage", () => {
    const cov = {
      "/test.ts": {
        path: "/test.ts",
        s: { "0": 1 },
        f: {},
        b: {},
        statementMap: {},
        branchMap: {},
        fnMap: {},
      },
    };
    const test = makeTest({ testCoverage: cov });
    const result = serializeTestCase(test);
    expect(result.testCoverage!["/test.ts"].s["0"]).toBe(1);
  });
});

describe("serializeTestSuite", () => {
  it("copies id, name, status, sourceFile", () => {
    const suite = makeSuite({ sourceFile: "/src/foo.test.ts" });
    const result = serializeTestSuite(suite);
    expect(result.id).toBe("suite-1");
    expect(result.name).toBe("test suite");
    expect(result.status).toBe("pass");
    expect(result.sourceFile).toBe("/src/foo.test.ts");
  });

  it("serializes all tests", () => {
    const suite = makeSuite({
      tests: [makeTest({ id: "t1", name: "first" }), makeTest({ id: "t2", name: "second" })],
    });
    const result = serializeTestSuite(suite);
    expect(result.tests).toHaveLength(2);
    expect(result.tests[0].name).toBe("first");
    expect(result.tests[1].name).toBe("second");
  });

  it("omits fn from each serialized test", () => {
    const suite = makeSuite({ tests: [makeTest()] });
    const result = serializeTestSuite(suite);
    expect("fn" in result.tests[0]).toBe(false);
  });

  it("handles suite with no tests", () => {
    const result = serializeTestSuite(makeSuite());
    expect(result.tests).toHaveLength(0);
  });

  it("sourceFile is undefined when not set", () => {
    const result = serializeTestSuite(makeSuite());
    expect(result.sourceFile).toBeUndefined();
  });
});
