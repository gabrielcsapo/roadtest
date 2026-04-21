/**
 * Pure rendering module for the RoadTest node runner output.
 *
 * All functions return ANSI-escaped strings — no console.log calls.
 * This makes the output reusable for:
 *   - CLI: process.stdout.write(renderXxx(...))
 *   - Docs / website: pass the string through an ANSI-to-HTML converter
 *     and display inside a <TerminalPreview> component
 *   - Tests: assert on the returned string without capturing stdout
 */

import type { IstanbulCoverage } from "roadtest";
import type { DepGraph } from "./cache.js";
import type { SerializableTestSuite } from "./serialize.js";

// ─── ANSI codes ────────────────────────────────────────────────────────────────

export const RESET = "\x1b[0m";
export const BOLD = "\x1b[1m";
export const DIM = "\x1b[2m";
export const GREEN = "\x1b[32m";
export const RED = "\x1b[31m";
export const YELLOW = "\x1b[33m";
export const CYAN = "\x1b[36m";

// ─── Utilities ─────────────────────────────────────────────────────────────────

export function rel(abs: string, cwd: string): string {
  return abs.startsWith(cwd + "/") ? abs.slice(cwd.length + 1) : abs;
}

export function plural(n: number, word: string, wordPlural = word + "s"): string {
  return `${n} ${n === 1 ? word : wordPlural}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(2)}s`;
  const m = Math.floor(s / 60);
  const rem = (s % 60).toFixed(0).padStart(2, "0");
  return `${m}m ${rem}s`;
}

// ─── Result lines ──────────────────────────────────────────────────────────────

export interface RenderResultsOutput {
  lines: string[];
  totalPass: number;
  totalFail: number;
  totalSkip: number;
  totalFiles: number;
  failFiles: number;
}

export function renderResults(
  suites: SerializableTestSuite[],
  verbose = false,
  cwd = "",
  cached = false,
): RenderResultsOutput {
  const lines: string[] = [];
  let totalPass = 0,
    totalFail = 0,
    totalSkip = 0;

  // Group suites by source file — one output line per file
  const byFile = new Map<string, SerializableTestSuite[]>();
  for (const suite of suites) {
    const key = suite.sourceFile ?? "";
    const group = byFile.get(key);
    if (group) group.push(suite);
    else byFile.set(key, [suite]);
  }

  for (const [sourceFile, fileSuites] of byFile) {
    let filePass = 0,
      fileFail = 0,
      fileSkip = 0,
      fileDuration = 0;

    for (const suite of fileSuites) {
      if (suite.duration) fileDuration += suite.duration;
      for (const test of suite.tests) {
        if (test.status === "skipped") {
          fileSkip++;
          totalSkip++;
        } else if (test.status === "pass") {
          filePass++;
          totalPass++;
        } else {
          fileFail++;
          totalFail++;
        }
      }
    }

    const fileTotal = filePass + fileFail + fileSkip;
    const filePassed = fileFail === 0;
    const icon = filePassed ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    const badge = filePassed ? `${GREEN}${BOLD} node ${RESET}` : `${RED}${BOLD} node ${RESET}`;
    const filePath = sourceFile ? (cwd ? rel(sourceFile, cwd) : sourceFile) : "(unknown)";
    const dur = fileDuration > 0 ? `  ${DIM}${formatDuration(fileDuration)}${RESET}` : "";
    const cachedStr = cached ? `  ${DIM}↑ cached${RESET}` : "";
    lines.push(
      `${icon} ${badge} ${DIM}${filePath}${RESET} ${DIM}(${fileTotal} ${fileTotal === 1 ? "test" : "tests"})${RESET}${cached ? cachedStr : dur}`,
    );

    // Expand failures (and all tests in verbose) inline under the file line
    if (fileFail > 0 || verbose) {
      for (const suite of fileSuites) {
        if (!verbose && suite.tests.every((t) => t.status !== "fail")) continue;

        lines.push(`\n   ${DIM}${suite.name}${RESET}`);

        for (const test of suite.tests) {
          if (!verbose && test.status !== "fail") continue;
          if (test.status === "skipped") {
            lines.push(`     ${DIM}– ${test.name}${RESET}`);
            continue;
          }
          const ti = test.status === "pass" ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
          lines.push(`     ${ti} ${test.status === "pass" ? DIM : ""}${test.name}${RESET}`);
          for (const a of test.assertions) {
            if (!verbose && a.status !== "fail") continue;
            const ai = a.status === "pass" ? `${GREEN}·${RESET}` : `${RED}·${RESET}`;
            lines.push(`         ${ai} ${DIM}${a.label}${RESET}`);
            if (a.error) lines.push(`           ${RED}${a.error}${RESET}`);
          }
          if (test.error && test.assertions.every((a) => a.status === "pass")) {
            lines.push(`         ${RED}${test.error}${RESET}`);
          }
        }
      }
      lines.push("");
    }
  }

  const failFiles = [...byFile.values()].filter((ss) => ss.some((s) => s.status === "fail")).length;

  return { lines, totalPass, totalFail, totalSkip, totalFiles: byFile.size, failFiles };
}

// ─── Summary table ─────────────────────────────────────────────────────────────

export interface SummaryOptions {
  shard?: string;
  grep?: string;
  cacheCleared?: boolean;
}

export function renderSummary(
  totalPass: number,
  totalFail: number,
  totalSkip: number,
  totalFiles: number,
  failFiles: number,
  startTime: Date,
  durationMs?: number,
  cachedCount?: number,
  opts?: SummaryOptions,
): string[] {
  const lines: string[] = [];
  const total = totalPass + totalFail + totalSkip;

  const LABEL_W = 12;
  const label = (s: string) => `${DIM}${s.padStart(LABEL_W)}${RESET}`;

  function fileVal(): string {
    const parts: string[] = [];
    if (failFiles > 0) parts.push(`${RED}${failFiles} failed${RESET}`);
    if (totalFiles - failFiles > 0) parts.push(`${GREEN}${totalFiles - failFiles} passed${RESET}`);
    parts.push(`${DIM}(${totalFiles})${RESET}`);
    return parts.join(" | ");
  }

  function testVal(): string {
    const parts: string[] = [];
    if (totalFail > 0) parts.push(`${RED}${totalFail} failed${RESET}`);
    if (totalSkip > 0) parts.push(`${YELLOW}${totalSkip} skipped${RESET}`);
    if (totalPass > 0) parts.push(`${GREEN}${totalPass} passed${RESET}`);
    parts.push(`${DIM}(${total})${RESET}`);
    return parts.join(" | ");
  }

  const hh = startTime.getHours().toString().padStart(2, "0");
  const mm = startTime.getMinutes().toString().padStart(2, "0");
  const ss = startTime.getSeconds().toString().padStart(2, "0");

  const durStr = durationMs !== undefined ? formatDuration(durationMs) : "";
  const cachedStr = cachedCount
    ? `  ${DIM}(${plural(cachedCount, "file")} from cache)${RESET}`
    : "";

  lines.push(`\n${DIM}${"─".repeat(40)}${RESET}`);
  lines.push(`${label("Test Files")}  ${fileVal()}`);
  lines.push(`${label("Tests")}  ${testVal()}`);
  lines.push(`${label("Start at")}  ${DIM}${hh}:${mm}:${ss}${RESET}`);
  if (durStr) lines.push(`${label("Duration")}  ${DIM}${durStr}${RESET}${cachedStr}`);
  if (opts?.shard) lines.push(`${label("Shard")}  ${DIM}${opts.shard}${RESET}`);
  if (opts?.grep) lines.push(`${label("Filter")}  ${DIM}${opts.grep}${RESET}`);
  if (opts?.cacheCleared) lines.push(`${label("")}  ${DIM}cache cleared${RESET}`);
  lines.push("");

  return lines;
}

// ─── Coverage table ────────────────────────────────────────────────────────────

export function renderCoverage(coverage: IstanbulCoverage, cwd: string): string[] {
  const lines: string[] = [];

  type FileStats = {
    stmts: number;
    stmtsCov: number;
    fns: number;
    fnsCov: number;
    branches: number;
    branchesCov: number;
  };

  function fileStats(fc: IstanbulCoverage[string]): FileStats {
    const stmts = Object.keys(fc.statementMap ?? {}).length;
    const stmtsCov = Object.values(fc.s).filter((v) => (v as number) > 0).length;
    const fns = Object.keys(fc.fnMap ?? {}).length;
    const fnsCov = Object.values(fc.f).filter((v) => (v as number) > 0).length;
    const allBranches = Object.values(fc.b ?? {}).flat() as number[];
    const branches = allBranches.length;
    const branchesCov = allBranches.filter((v) => v > 0).length;
    return { stmts, stmtsCov, fns, fnsCov, branches, branchesCov };
  }

  function colorPct(covered: number, total: number): string {
    const p = total === 0 ? 100 : Math.round((covered / total) * 100);
    const raw = `${p}%`.padStart(5);
    const color = p >= 80 ? GREEN : p >= 60 ? YELLOW : RED;
    return `${color}${raw}${RESET}`;
  }

  const entries = Object.entries(coverage)
    .filter(([p]) => !p.includes(".test.") && !p.includes(".spec.") && !p.includes("node_modules"))
    .sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) {
    lines.push(`  ${DIM}no coverage data${RESET}`);
    return lines;
  }

  const rows = entries.map(([path, fc]) => ({
    path: cwd ? rel(path, cwd) : path,
    ...fileStats(fc),
  }));
  const maxPathLen = Math.max(20, ...rows.map((r) => r.path.length));
  const totals = rows.reduce(
    (acc, r) => ({
      stmts: acc.stmts + r.stmts,
      stmtsCov: acc.stmtsCov + r.stmtsCov,
      fns: acc.fns + r.fns,
      fnsCov: acc.fnsCov + r.fnsCov,
      branches: acc.branches + r.branches,
      branchesCov: acc.branchesCov + r.branchesCov,
    }),
    { stmts: 0, stmtsCov: 0, fns: 0, fnsCov: 0, branches: 0, branchesCov: 0 },
  );

  const divider = `${DIM}${"─".repeat(maxPathLen + 22)}${RESET}`;

  lines.push(`\n${CYAN}${BOLD}Coverage${RESET}`);
  lines.push(divider);
  lines.push(`  ${DIM}${"File".padEnd(maxPathLen)}  Stmts  Branch    Fns${RESET}`);
  for (const r of rows) {
    lines.push(
      `  ${DIM}${r.path.padEnd(maxPathLen)}${RESET}  ${colorPct(r.stmtsCov, r.stmts)}  ${colorPct(r.branchesCov, r.branches)}  ${colorPct(r.fnsCov, r.fns)}`,
    );
  }
  lines.push(divider);
  lines.push(
    `  ${"Total".padEnd(maxPathLen)}  ${colorPct(totals.stmtsCov, totals.stmts)}  ${colorPct(totals.branchesCov, totals.branches)}  ${colorPct(totals.fnsCov, totals.fns)}\n`,
  );

  return lines;
}

// ─── Snapshot diff ─────────────────────────────────────────────────────────────

export interface SnapshotMismatch {
  suiteName: string;
  testName: string;
  label: string;
  path: string;
  diff: string;
}

export function renderSnapshotMismatches(
  mismatches: SnapshotMismatch[],
  cwd: string,
  verbose = false,
): string[] {
  const lines: string[] = [];
  const DIFF_PREVIEW_LINES = verbose ? Infinity : 15;

  lines.push(
    `\n${YELLOW}${BOLD}Snapshot ${plural(mismatches.length, "mismatch", "mismatches")}:${RESET}`,
  );
  for (const m of mismatches) {
    lines.push(`\n  ${BOLD}${m.suiteName} > ${m.testName} > ${m.label}${RESET}`);
    lines.push(`  ${DIM}${cwd ? rel(m.path, cwd) : m.path}${RESET}`);
    const diffLines = m.diff.split("\n");
    const visibleLines = diffLines.slice(0, DIFF_PREVIEW_LINES);
    const truncated = diffLines.length - DIFF_PREVIEW_LINES;
    lines.push(
      visibleLines
        .map((l) => {
          if (l.startsWith("@@")) return `  ${CYAN}${DIM}${l}${RESET}`;
          if (l.startsWith("+")) return `  ${GREEN}${l}${RESET}`;
          if (l.startsWith("-")) return `  ${RED}${l}${RESET}`;
          return `  ${DIM}${l}${RESET}`;
        })
        .join("\n"),
    );
    if (truncated > 0) {
      lines.push(`  ${DIM}… ${truncated} more lines — run with --verbose to see full diff${RESET}`);
    }
  }
  lines.push(`\n${DIM}Run with --update-snapshots to update stored snapshots.${RESET}\n`);

  return lines;
}

// ─── Watch mode dep tree ───────────────────────────────────────────────────────

export type { DepGraph };

function getImportPath(changedFile: string, testFile: string, graph: DepGraph): string[] {
  if (changedFile === testFile) return [changedFile];
  const parents = graph.importedBy.get(testFile);
  if (!parents?.has(changedFile)) return [changedFile, testFile];

  const path = [changedFile];
  let current = changedFile;
  while (current !== testFile) {
    const parent = parents.get(current);
    if (!parent) break;
    path.push(parent);
    current = parent;
  }
  return path;
}

export function renderDepTree(
  changedAbs: string,
  affectedTests: string[],
  reason: "direct" | "dep" | "fallback",
  graph: DepGraph,
  cwd: string,
): string {
  const lines: string[] = [];

  if (reason === "fallback") {
    lines.push(
      `${YELLOW}${rel(changedAbs, cwd)}${RESET}  ${DIM}(not tracked — running all)${RESET}`,
    );
    return lines.join("\n");
  }

  lines.push(`${CYAN}${rel(changedAbs, cwd)}${RESET}`);

  affectedTests.forEach((testFile, i) => {
    const isLast = i === affectedTests.length - 1;
    const branch = isLast ? "└─" : "├─";
    const path = getImportPath(changedAbs, testFile, graph);
    const via = path.slice(1, -1);
    const viaStr =
      via.length > 0 ? `  ${DIM}via ${via.map((f) => rel(f, cwd)).join(" → ")}${RESET}` : "";
    lines.push(`  ${DIM}${branch}${RESET} ${GREEN}${rel(testFile, cwd)}${RESET}${viaStr}`);
  });

  return lines.join("\n");
}

// ─── Watch rerun separator ─────────────────────────────────────────────────────

export function renderWatchSeparator(): string {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
  return `${DIM}${"─".repeat(40)} re-run ${timeStr} ${"─".repeat(3)}${RESET}`;
}
