import { afterEach, describe, expect, it } from "roadtest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readCacheIndex, rebuildCacheIndex, writeCache } from "./cache.js";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("rebuildCacheIndex", () => {
  it("recovers cache entries written by isolated workers", () => {
    const cacheDirectory = mkdtempSync(join(tmpdir(), "roadtest-cache-test-"));
    temporaryDirectories.push(cacheDirectory);

    writeCache(cacheDirectory, "first-key", "/tests/first.test.ts", {
      suites: [],
      coverage: null,
    });
    writeCache(cacheDirectory, "second-key", "/tests/second.test.ts", {
      suites: [],
      coverage: null,
    });
    writeFileSync(join(cacheDirectory, "index.json"), "{}", "utf8");

    rebuildCacheIndex(cacheDirectory);

    expect(readCacheIndex(cacheDirectory)).toEqual({
      "/tests/first.test.ts": "first-key",
      "/tests/second.test.ts": "second-key",
    });
  });
});
