import { existsSync, mkdirSync, readdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { serializeDom, stripPassthroughWrapper } from "roadtest/serialize-dom";
import type { SerializableTestSuite } from "./serialize.js";

function snapshotsAreEquivalent(stored: string, current: string): boolean {
  const a = serializeDom(stored);
  const b = serializeDom(current);
  const { base, curr } = stripPassthroughWrapper(a, b);
  return base === curr;
}

// ─── Path helpers ─────────────────────────────────────────────────────────────

function sanitize(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
}

function snapshotDir(sourceFile: string): string {
  return join(dirname(sourceFile), "__snapshots__");
}

export function snapshotPath(
  sourceFile: string,
  suiteName: string,
  testName: string,
  label: string,
): string {
  return join(
    snapshotDir(sourceFile),
    sanitize(suiteName),
    `${sanitize(testName)}__${sanitize(label)}.html`,
  );
}

// ─── Load / save ──────────────────────────────────────────────────────────────

function loadSnapshot(path: string): string | null {
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

function saveSnapshot(path: string, html: string): void {
  mkdirSync(dirname(path), { recursive: true });
  // Persist the canonical serialization so the stored file is stable across
  // runs and environments, and is immune to external formatters reformatting
  // the file between runs.
  writeFileSync(path, serializeDom(html), "utf8");
}

// ─── Diff (line-by-line) ──────────────────────────────────────────────────────

/**
 * Insert newlines between HTML tags so that a flat single-line HTML string
 * produces a readable multi-line diff instead of one enormous changed line.
 */
function prettyHtml(html: string): string {
  return html
    .replace(/></g, ">\n<")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");
}

function diffLines(a: string, b: string): string {
  const aLines = prettyHtml(a).split("\n");
  const bLines = prettyHtml(b).split("\n");
  const maxLen = Math.max(aLines.length, bLines.length);
  const out: string[] = [];
  for (let i = 0; i < maxLen; i++) {
    const lineA = aLines[i];
    const lineB = bLines[i];
    if (lineA === lineB) continue;
    if (lineA === undefined) {
      out.push(`+  ${lineB}`);
    } else if (lineB === undefined) {
      out.push(`-  ${lineA}`);
    } else {
      out.push(`-  ${lineA}`);
      out.push(`+  ${lineB}`);
    }
  }
  return out.join("\n");
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface SnapshotMismatch {
  path: string;
  suiteName: string;
  testName: string;
  label: string;
  diff: string;
}

export interface SnapshotResult {
  mismatches: SnapshotMismatch[];
  /** Paths of orphaned snapshot files that were deleted in update mode */
  removed: string[];
}

/**
 * @param allSuites   Every suite from this run (fresh + cached) — used to
 *                    determine which snapshot files are still referenced so
 *                    orphans can be pruned in update mode.
 * @param updateMode  When true, overwrite stored snapshots and prune orphans.
 * @param freshSuites Only the suites that were actually re-executed this run.
 *                    Defaults to allSuites (full run). Provide a subset when
 *                    some suites were served from cache to avoid re-writing
 *                    unchanged baselines.
 */
export function processSnapshots(
  allSuites: SerializableTestSuite[],
  updateMode: boolean,
  freshSuites: SerializableTestSuite[] = allSuites,
): SnapshotResult {
  const mismatches: SnapshotMismatch[] = [];
  const removed: string[] = [];

  // Build the full set of paths still referenced by any suite (fresh or cached)
  // so the orphan-cleanup step knows what to keep.
  const activePaths = new Set<string>();
  for (const suite of allSuites) {
    if (!suite.sourceFile) continue;
    for (const test of suite.tests) {
      for (const assertion of test.assertions) {
        if (!assertion.snapshot) continue;
        activePaths.add(
          snapshotPath(suite.sourceFile, suite.name, test.name, assertion.snapshot.label),
        );
      }
    }
  }

  // Write/compare only for freshly-executed suites.
  for (const suite of freshSuites) {
    if (!suite.sourceFile) continue;
    for (const test of suite.tests) {
      const testMismatches: SnapshotMismatch[] = [];
      for (const assertion of test.assertions) {
        if (!assertion.snapshot) continue;
        const { label, html } = assertion.snapshot;
        const path = snapshotPath(suite.sourceFile, suite.name, test.name, label);
        if (updateMode) {
          saveSnapshot(path, html);
        } else {
          const stored = loadSnapshot(path);
          if (stored === null) {
            saveSnapshot(path, html);
          } else if (!snapshotsAreEquivalent(stored, html)) {
            testMismatches.push({
              path,
              suiteName: suite.name,
              testName: test.name,
              label,
              diff: diffLines(serializeDom(stored), serializeDom(html)),
            });
            assertion.status = "fail";
            assertion.error = "Snapshot mismatch";
          }
        }
      }

      if (testMismatches.length > 0) {
        mismatches.push(...testMismatches);
        const labels = testMismatches.map((m) => m.label).join(", ");
        test.status = "fail";
        test.error = `Snapshot mismatch in: ${labels}. Run with --update-snapshots to update.`;
        suite.status = "fail";
      }
    }
  }

  // In update mode, prune orphaned .html files from every __snapshots__ directory
  // that belongs to a source file touched in this run.
  if (updateMode) {
    const dirsToClean = new Set<string>();
    for (const suite of freshSuites) {
      if (suite.sourceFile) dirsToClean.add(snapshotDir(suite.sourceFile));
    }
    for (const dir of dirsToClean) {
      if (!existsSync(dir)) continue;
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const suitePath = join(dir, entry.name);
        for (const file of readdirSync(suitePath).filter((f) => f.endsWith(".html"))) {
          const filePath = join(suitePath, file);
          if (!activePaths.has(filePath)) {
            rmSync(filePath);
            removed.push(filePath);
          }
        }
        if (readdirSync(suitePath).length === 0) {
          rmSync(suitePath, { recursive: true });
        }
      }
    }
  }

  return { mismatches, removed };
}
