import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { IstanbulCoverage } from "roadtest";
import type { SerializableTestSuite } from "./serialize.js";

// ─── Shard config ─────────────────────────────────────────────────────────────

export interface ShardConfig {
  /** 1-based shard index */
  index: number;
  total: number;
}

export function parseShardArg(arg: string): ShardConfig {
  const match = arg.match(/^(\d+)\/(\d+)$/);
  if (!match) throw new Error(`Invalid --shard value "${arg}". Expected format: N/M (e.g. 1/4)`);
  const index = parseInt(match[1], 10);
  const total = parseInt(match[2], 10);
  if (total < 1) throw new Error(`Shard total must be >= 1`);
  if (index < 1 || index > total) throw new Error(`Shard index must be between 1 and ${total}`);
  return { index, total };
}

/**
 * Deterministically distribute files across shards.
 * Files are sorted alphabetically so the same file always lands in the same shard.
 */
export function applySharding(files: string[], shard: ShardConfig): string[] {
  return [...files].sort().filter((_, i) => i % shard.total === shard.index - 1);
}

// ─── Shard result file ────────────────────────────────────────────────────────

export interface ShardResult {
  shard: ShardConfig;
  completedAt: number;
  suites: SerializableTestSuite[];
  coverage: IstanbulCoverage | null;
}

export function getResultsDir(cwd: string): string {
  return join(cwd, ".roadtest", "results");
}

export function shardResultPath(resultsDir: string, shard: ShardConfig): string {
  return join(resultsDir, `shard-${shard.index}-of-${shard.total}.json`);
}

export function writeShardResult(resultsDir: string, result: ShardResult): void {
  mkdirSync(resultsDir, { recursive: true });
  writeFileSync(shardResultPath(resultsDir, result.shard), JSON.stringify(result));
}

// ─── Coverage merging ─────────────────────────────────────────────────────────

export function mergeCoverage(maps: (IstanbulCoverage | null)[]): IstanbulCoverage | null {
  const valid = maps.filter((m): m is IstanbulCoverage => m !== null);
  if (valid.length === 0) return null;

  const merged: IstanbulCoverage = {};
  for (const cov of valid) {
    for (const [path, fileCov] of Object.entries(cov)) {
      if (!merged[path]) {
        merged[path] = {
          ...fileCov,
          s: { ...fileCov.s },
          b: Object.fromEntries(Object.entries(fileCov.b).map(([k, v]) => [k, [...v]])),
          f: { ...fileCov.f },
        };
        continue;
      }
      const dest = merged[path];
      for (const idx of Object.keys(fileCov.s)) {
        dest.s[idx] = (dest.s[idx] ?? 0) + (fileCov.s[idx] ?? 0);
      }
      for (const idx of Object.keys(fileCov.f)) {
        dest.f[idx] = (dest.f[idx] ?? 0) + (fileCov.f[idx] ?? 0);
      }
      for (const [idx, counts] of Object.entries(fileCov.b)) {
        if (!dest.b[idx]) {
          dest.b[idx] = [...(counts as number[])];
          continue;
        }
        dest.b[idx] = dest.b[idx].map((c, i) => c + ((counts as number[])[i] ?? 0));
      }
    }
  }
  return merged;
}

// ─── Merge all shards ─────────────────────────────────────────────────────────

export function readAllShardResults(resultsDir: string): ShardResult[] {
  if (!existsSync(resultsDir)) return [];
  return readdirSync(resultsDir)
    .filter((f) => f.match(/^shard-\d+-of-\d+\.json$/))
    .map((f) => {
      try {
        return JSON.parse(readFileSync(join(resultsDir, f), "utf-8")) as ShardResult;
      } catch {
        return null;
      }
    })
    .filter((r): r is ShardResult => r !== null)
    .sort((a, b) => a.shard.index - b.shard.index);
}

export interface MergedResult {
  suites: SerializableTestSuite[];
  coverage: IstanbulCoverage | null;
  shards: ShardConfig[];
}

export function mergeShardResults(results: ShardResult[]): MergedResult {
  return {
    suites: results.flatMap((r) => r.suites),
    coverage: mergeCoverage(results.map((r) => r.coverage)),
    shards: results.map((r) => r.shard),
  };
}
