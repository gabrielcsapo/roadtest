import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import type { IstanbulCoverage } from "@fieldtest/core";
import type { SerializableTestSuite } from "./serialize.js";

// ─── Dep graph (shared with node.ts) ─────────────────────────────────────────

export interface DepGraph {
  /** file → set of test files that (transitively) depend on it */
  dependents: Map<string, Set<string>>;
  /** testFile → Map<depFile, parentFile> (for import path tracing) */
  importedBy: Map<string, Map<string, string>>;
}

// ─── Cache entry ──────────────────────────────────────────────────────────────

export interface CacheEntry {
  hash: string;
  cachedAt: number;
  suites: SerializableTestSuite[];
  coverage: IstanbulCoverage | null;
  /** per-file sha256 hashes at the time the entry was written */
  fileHashes?: Record<string, string>;
  /**
   * sha256 hashes of snapshot HTML files produced by this test run.
   * If any of these files have changed on disk (e.g. updated via the web UI
   * or --update-snapshots), the cache entry is considered stale.
   */
  snapshotHashes?: Record<string, string>;
}

// ─── Hash computation ─────────────────────────────────────────────────────────

/** Returns the set of all files (test file + transitive deps) for a given test file. */
export function getDepsForFile(testFile: string, graph: DepGraph): Set<string> {
  const deps = new Set<string>();
  const importedBy = graph.importedBy.get(testFile);
  if (importedBy) {
    for (const dep of importedBy.keys()) deps.add(dep);
  }
  return deps;
}

/** Hash a single file's content. Returns empty string if unreadable. */
export function hashFileContent(filePath: string): string {
  try {
    return createHash("sha256").update(readFileSync(filePath)).digest("hex");
  } catch {
    return "";
  }
}

/**
 * Walk up from `startDir` and return the path of the first lockfile found, or null.
 * Supports pnpm-lock.yaml, package-lock.json, and yarn.lock.
 */
function findLockfile(startDir: string): string | null {
  const candidates = ["pnpm-lock.yaml", "package-lock.json", "yarn.lock"];
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    for (const name of candidates) {
      const p = join(dir, name);
      if (existsSync(p)) return p;
    }
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/**
 * Compute a stable cache key for a test file, also returning per-file hashes.
 * Key = SHA256 of:
 *   - lockfile hash (so 3rd-party dep changes bust the cache)
 *   - sorted source file paths + their content hashes (test file + all transitive deps)
 */
export function computeCacheKey(
  testFile: string,
  graph: DepGraph,
): { key: string; fileHashes: Record<string, string> } {
  const deps = getDepsForFile(testFile, graph); // always includes testFile itself
  const allFiles = [...deps].sort();

  const hash = createHash("sha256");

  // Salt with the lockfile so that installing/upgrading any npm package
  // invalidates all cache entries.
  const lockfile = findLockfile(dirname(testFile));
  if (lockfile) hash.update("lockfile\0" + hashFileContent(lockfile) + "\0");

  const fileHashes: Record<string, string> = {};
  for (const f of allFiles) {
    const fh = hashFileContent(f);
    fileHashes[f] = fh;
    hash.update(f + "\0");
    hash.update(fh + "\0");
  }
  return { key: hash.digest("hex").slice(0, 24), fileHashes };
}

// ─── Cache index (testFile → last cache key) ──────────────────────────────────

function getIndexPath(cacheDir: string): string {
  return join(cacheDir, "index.json");
}

export function readCacheIndex(cacheDir: string): Record<string, string> {
  try {
    return JSON.parse(readFileSync(getIndexPath(cacheDir), "utf-8")) as Record<string, string>;
  } catch {
    return {};
  }
}

function writeCacheIndex(cacheDir: string, index: Record<string, string>): void {
  writeFileSync(getIndexPath(cacheDir), JSON.stringify(index));
}

// ─── Cache I/O ────────────────────────────────────────────────────────────────

export function getCacheDir(cwd: string): string {
  return join(cwd, ".fieldtest", "cache");
}

export function readCache(cacheDir: string, key: string): CacheEntry | null {
  const file = join(cacheDir, `${key}.json`);
  if (!existsSync(file)) return null;
  try {
    const entry = JSON.parse(readFileSync(file, "utf-8")) as CacheEntry;
    if (entry.hash !== key) return null;
    // If this entry recorded snapshot file hashes, verify they haven't changed.
    // A mismatch means snapshots were updated externally (web UI, --update-snapshots,
    // or a manual edit) and this cache entry no longer reflects reality.
    if (entry.snapshotHashes) {
      for (const [snapshotFile, storedHash] of Object.entries(entry.snapshotHashes)) {
        if (hashFileContent(snapshotFile) !== storedHash) return null;
      }
    }
    return entry;
  } catch {
    return null;
  }
}

export function readCacheByTestFile(cacheDir: string, testFile: string): CacheEntry | null {
  const index = readCacheIndex(cacheDir);
  const oldKey = index[testFile];
  if (!oldKey) return null;
  return readCache(cacheDir, oldKey);
}

export function writeCache(
  cacheDir: string,
  key: string,
  testFile: string,
  entry: Omit<CacheEntry, "hash" | "cachedAt">,
): void {
  mkdirSync(cacheDir, { recursive: true });
  const full: CacheEntry = { hash: key, cachedAt: Date.now(), ...entry };
  writeFileSync(join(cacheDir, `${key}.json`), JSON.stringify(full));
  const index = readCacheIndex(cacheDir);
  index[testFile] = key;
  writeCacheIndex(cacheDir, index);
}

export function clearCache(cacheDir: string): void {
  if (existsSync(cacheDir)) rmSync(cacheDir, { recursive: true, force: true });
}
