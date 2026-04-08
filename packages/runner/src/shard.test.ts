import { describe, it, expect } from "@fieldtest/core";
import { parseShardArg, applySharding, mergeCoverage, mergeShardResults } from "./shard.js";
import type { IstanbulCoverage } from "@fieldtest/core";
import type { ShardResult } from "./shard.js";

describe("parseShardArg", () => {
  it('parses valid "1/4" format', () => {
    const shard = parseShardArg("1/4");
    expect(shard.index).toBe(1);
    expect(shard.total).toBe(4);
  });

  it('parses single shard "1/1"', () => {
    const shard = parseShardArg("1/1");
    expect(shard.index).toBe(1);
    expect(shard.total).toBe(1);
  });

  it('parses last shard "4/4"', () => {
    const shard = parseShardArg("4/4");
    expect(shard.index).toBe(4);
    expect(shard.total).toBe(4);
  });

  it("throws for invalid format", () => {
    expect(() => parseShardArg("1-4")).toThrow();
    expect(() => parseShardArg("bad")).toThrow();
    expect(() => parseShardArg("")).toThrow();
  });

  it("throws when index is 0", () => {
    expect(() => parseShardArg("0/4")).toThrow();
  });

  it("throws when index exceeds total", () => {
    expect(() => parseShardArg("5/4")).toThrow();
  });

  it("throws when total is 0", () => {
    expect(() => parseShardArg("0/0")).toThrow();
  });
});

describe("applySharding", () => {
  const files = ["c.ts", "a.ts", "b.ts", "d.ts"];

  it("distributes files across shards alphabetically", () => {
    const shard1 = applySharding(files, { index: 1, total: 2 });
    const shard2 = applySharding(files, { index: 2, total: 2 });
    expect(shard1.length).toBe(2);
    expect(shard2.length).toBe(2);
  });

  it("every file appears in exactly one shard", () => {
    const shard1 = applySharding(files, { index: 1, total: 2 });
    const shard2 = applySharding(files, { index: 2, total: 2 });
    const all = [...shard1, ...shard2].sort();
    expect(all).toHaveLength(4);
    expect(all[0]).toBe("a.ts");
    expect(all[3]).toBe("d.ts");
  });

  it("single shard returns all files sorted", () => {
    const result = applySharding(files, { index: 1, total: 1 });
    expect(result).toHaveLength(4);
    expect(result[0]).toBe("a.ts");
  });

  it("does not mutate the input array", () => {
    const input = ["b.ts", "a.ts"];
    applySharding(input, { index: 1, total: 2 });
    expect(input[0]).toBe("b.ts");
  });

  it("returns empty array when shard has no files", () => {
    const result = applySharding(["a.ts", "b.ts"], { index: 3, total: 4 });
    expect(result).toHaveLength(0);
  });

  it("is deterministic across calls", () => {
    const r1 = applySharding(files, { index: 1, total: 3 });
    const r2 = applySharding(files, { index: 1, total: 3 });
    expect(r1).toEqual(r2);
  });
});

describe("mergeCoverage", () => {
  function makeFileCov(
    s: Record<string, number>,
    f: Record<string, number>,
    b: Record<string, number[]>,
  ): IstanbulCoverage[string] {
    return {
      path: "/test.ts",
      s,
      f,
      b,
      statementMap: {},
      branchMap: {},
      fnMap: {},
    };
  }

  it("returns null for empty input", () => {
    expect(mergeCoverage([])).toBeNull();
  });

  it("returns null when all inputs are null", () => {
    expect(mergeCoverage([null, null])).toBeNull();
  });

  it("returns single coverage unchanged", () => {
    const cov: IstanbulCoverage = {
      "/test.ts": makeFileCov({ "0": 1 }, { "0": 2 }, { "0": [1, 0] }),
    };
    const result = mergeCoverage([cov]);
    expect(result!["/test.ts"].s["0"]).toBe(1);
  });

  it("sums statement counts across coverage maps", () => {
    const cov1: IstanbulCoverage = { "/test.ts": makeFileCov({ "0": 2, "1": 0 }, {}, {}) };
    const cov2: IstanbulCoverage = { "/test.ts": makeFileCov({ "0": 1, "1": 3 }, {}, {}) };
    const result = mergeCoverage([cov1, cov2]);
    expect(result!["/test.ts"].s["0"]).toBe(3);
    expect(result!["/test.ts"].s["1"]).toBe(3);
  });

  it("sums function counts across coverage maps", () => {
    const cov1: IstanbulCoverage = { "/test.ts": makeFileCov({}, { "0": 1 }, {}) };
    const cov2: IstanbulCoverage = { "/test.ts": makeFileCov({}, { "0": 2 }, {}) };
    const result = mergeCoverage([cov1, cov2]);
    expect(result!["/test.ts"].f["0"]).toBe(3);
  });

  it("sums branch counts across coverage maps", () => {
    const cov1: IstanbulCoverage = { "/test.ts": makeFileCov({}, {}, { "0": [1, 0] }) };
    const cov2: IstanbulCoverage = { "/test.ts": makeFileCov({}, {}, { "0": [0, 2] }) };
    const result = mergeCoverage([cov1, cov2]);
    expect(result!["/test.ts"].b["0"][0]).toBe(1);
    expect(result!["/test.ts"].b["0"][1]).toBe(2);
  });

  it("skips null entries in the array", () => {
    const cov: IstanbulCoverage = { "/test.ts": makeFileCov({ "0": 5 }, {}, {}) };
    const result = mergeCoverage([null, cov, null]);
    expect(result!["/test.ts"].s["0"]).toBe(5);
  });

  it("merges coverage from different files", () => {
    const cov1: IstanbulCoverage = { "/a.ts": makeFileCov({ "0": 1 }, {}, {}) };
    const cov2: IstanbulCoverage = { "/b.ts": makeFileCov({ "0": 2 }, {}, {}) };
    const result = mergeCoverage([cov1, cov2]);
    expect(result!["/a.ts"].s["0"]).toBe(1);
    expect(result!["/b.ts"].s["0"]).toBe(2);
  });
});

describe("mergeShardResults", () => {
  const mockSuite = { id: "s1", name: "suite", tests: [], status: "pass" as const };

  it("combines suites from all shards", () => {
    const results: ShardResult[] = [
      { shard: { index: 1, total: 2 }, completedAt: 0, suites: [mockSuite], coverage: null },
      {
        shard: { index: 2, total: 2 },
        completedAt: 0,
        suites: [{ ...mockSuite, id: "s2" }],
        coverage: null,
      },
    ];
    const merged = mergeShardResults(results);
    expect(merged.suites).toHaveLength(2);
  });

  it("collects shard configs", () => {
    const results: ShardResult[] = [
      { shard: { index: 1, total: 2 }, completedAt: 0, suites: [], coverage: null },
      { shard: { index: 2, total: 2 }, completedAt: 0, suites: [], coverage: null },
    ];
    const merged = mergeShardResults(results);
    expect(merged.shards).toHaveLength(2);
    expect(merged.shards[0].index).toBe(1);
    expect(merged.shards[1].index).toBe(2);
  });

  it("returns null coverage when all shards have null coverage", () => {
    const results: ShardResult[] = [
      { shard: { index: 1, total: 1 }, completedAt: 0, suites: [], coverage: null },
    ];
    const merged = mergeShardResults(results);
    expect(merged.coverage).toBeNull();
  });

  it("returns empty suites and shards for empty input", () => {
    const merged = mergeShardResults([]);
    expect(merged.suites).toHaveLength(0);
    expect(merged.shards).toHaveLength(0);
    expect(merged.coverage).toBeNull();
  });
});
