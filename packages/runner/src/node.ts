import { Window } from "happy-dom";
import { existsSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { findSourceMap, register } from "node:module";
import { takeCoverage } from "node:v8";
import type { Profiler } from "node:inspector";

// Register the mock-hoisting loader hook for test files.
// Must happen before any test files are imported. The hook intercepts test
// files after tsx has processed them (receives JS), then rewrites static imports
// to __ftImport() calls and hoists mock() registrations before them —
// the same transform the Vite plugin applies in the browser runner.
register(new URL("./mock-loader-hooks.js", import.meta.url));
import type { DepGraph } from "./cache.js";
import {
  getCacheDir,
  computeCacheKey,
  readCache,
  readCacheByTestFile,
  writeCache,
  clearCache,
  hashFileContent,
} from "./cache.js";
import {
  parseShardArg,
  applySharding,
  getResultsDir,
  writeShardResult,
  readAllShardResults,
  mergeShardResults,
} from "./shard.js";
import { serializeTestSuite } from "./serialize.js";
import type { SerializableTestSuite } from "./serialize.js";
import { processSnapshots, snapshotPath } from "./snapshots.js";
import type { IstanbulCoverage } from "roadtest";
import {
  RESET,
  BOLD,
  DIM,
  YELLOW,
  CYAN,
  rel,
  plural,
  renderResults as _renderResults,
  renderSummary,
  renderCoverage,
  renderSnapshotMismatches,
  renderDepTree,
  renderWatchSeparator,
} from "./render.js";

// ─── V8 coverage via NODE_V8_COVERAGE ────────────────────────────────────────

type V8ScriptCoverage = Profiler.ScriptCoverage;

/**
 * Flush V8 coverage to disk (NODE_V8_COVERAGE dir) and convert all source
 * files under srcDir to Istanbul format. Uses NODE_V8_COVERAGE which Node.js
 * sets up at process start — unlike the inspector Profiler API, it tracks
 * scripts loaded through tsx's ESM loader hook.
 */
async function readNodeCoverage(srcDir: string): Promise<IstanbulCoverage | null> {
  const covDir = process.env.NODE_V8_COVERAGE;
  if (!covDir) return null;

  // Flush current coverage counters to a JSON file in covDir
  takeCoverage();

  const files = readdirSync(covDir).filter((f) => f.endsWith(".json"));
  if (files.length === 0) return null;

  const { default: V8ToIstanbul } = await import("v8-to-istanbul");

  // Collect all source scripts from every written coverage file
  const srcScripts: V8ScriptCoverage[] = [];
  for (const file of files) {
    try {
      const data = JSON.parse(readFileSync(join(covDir, file), "utf-8")) as {
        result?: V8ScriptCoverage[];
      };
      if (!Array.isArray(data.result)) continue;
      for (const script of data.result) {
        if (!script.url.startsWith("file://")) continue;
        try {
          const p = fileURLToPath(script.url);
          if (p.startsWith(srcDir) && !p.includes("node_modules")) srcScripts.push(script);
        } catch {
          /* skip non-file URLs */
        }
      }
    } catch {
      /* skip malformed files */
    }
  }

  if (srcScripts.length === 0) return null;

  // Convert V8 byte-range coverage to Istanbul statement/branch/function format.
  // tsx registers source maps with Node's source map registry so findSourceMap()
  // returns the map needed to translate byte offsets back to TypeScript lines.
  // Note: branch coverage accuracy is limited by esbuild's coarser source maps —
  // statement and function percentages are more reliable.
  const out: IstanbulCoverage = {};
  for (const script of srcScripts) {
    try {
      const filePath = fileURLToPath(script.url);
      const sm = findSourceMap(script.url);
      const sources = sm ? { sourceMap: { sourcemap: sm.payload } } : undefined;
      const conv = new V8ToIstanbul(filePath, 0, sources as never);
      await conv.load();
      conv.applyCoverage(script.functions);
      Object.assign(out, conv.toIstanbul());
    } catch {
      /* skip files that fail conversion */
    }
  }

  return Object.keys(out).length > 0 ? out : null;
}

// ─── DOM environment ──────────────────────────────────────────────────────────

const win = new Window({ url: "http://localhost/", width: 1024, height: 768 });

function setGlobal(name: string, value: unknown) {
  try {
    (globalThis as Record<string, unknown>)[name] = value;
  } catch {
    try {
      Object.defineProperty(globalThis, name, { value, writable: true, configurable: true });
    } catch {
      /* already set */
    }
  }
}

setGlobal("window", win);
setGlobal("document", win.document);
setGlobal("navigator", win.navigator);
setGlobal("location", win.location);
setGlobal("history", win.history);
setGlobal("screen", win.screen);

for (const name of [
  "Element",
  "HTMLElement",
  "HTMLButtonElement",
  "HTMLInputElement",
  "HTMLDivElement",
  "HTMLSpanElement",
  "HTMLAnchorElement",
  "HTMLFormElement",
  "Node",
  "Text",
  "Comment",
  "DocumentFragment",
  "Event",
  "CustomEvent",
  "MouseEvent",
  "KeyboardEvent",
  "FocusEvent",
  "InputEvent",
  "MutationObserver",
  "ResizeObserver",
  "IntersectionObserver",
  "NodeFilter",
  "DOMParser",
  "getComputedStyle",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "matchMedia",
]) {
  const val = (win as Record<string, unknown>)[name];
  if (val !== undefined) setGlobal(name, val);
}
setGlobal("IS_REACT_ACT_ENVIRONMENT", true);

// ─── Dep graph ────────────────────────────────────────────────────────────────

const IMPORT_RE = /(?:^|\s)(?:import|from)\s+['"]([^'"]+)['"]/gm;

function parseImports(content: string): string[] {
  const result: string[] = [];
  IMPORT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = IMPORT_RE.exec(content)) !== null) result.push(m[1]);
  return result;
}

/**
 * Resolve a workspace package import (one whose node_modules entry is a symlink)
 * to its TypeScript source entry. Returns null if the package is not a workspace
 * symlink or if its source entry cannot be found.
 */
const _workspaceImportCache = new Map<string, string | null>();

function resolveWorkspaceImport(fromFile: string, imp: string): string | null {
  const cacheKey = `${fromFile}\0${imp}`;
  if (_workspaceImportCache.has(cacheKey)) return _workspaceImportCache.get(cacheKey) ?? null;
  const result = _resolveWorkspaceImportUncached(fromFile, imp);
  _workspaceImportCache.set(cacheKey, result);
  return result;
}

function _resolveWorkspaceImportUncached(fromFile: string, imp: string): string | null {
  // Extract bare package name (handle scoped packages like @scope/pkg)
  const parts = imp.split("/");
  const pkgName = imp.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
  if (!pkgName) return null;

  // Walk up the directory tree from fromFile to find node_modules/<pkgName>
  let dir = dirname(fromFile);
  for (let i = 0; i < 10; i++) {
    const nmPkg = join(dir, "node_modules", pkgName);
    if (existsSync(nmPkg)) {
      try {
        const realPath = realpathSync(nmPkg);
        if (realPath === nmPkg) return null; // not a symlink → not a workspace package
        // Read package.json to find the TypeScript source entry
        const pkgJson = JSON.parse(readFileSync(join(realPath, "package.json"), "utf-8")) as {
          exports?: Record<string, { import?: string } | string>;
          main?: string;
          source?: string;
        };
        // Prefer exports["."].import (TypeScript source path), then source, then main
        const exportsRoot = pkgJson.exports?.["."];
        const srcRelative =
          (typeof exportsRoot === "object" ? exportsRoot?.import : undefined) ??
          pkgJson.source ??
          pkgJson.main;
        if (!srcRelative) return null;
        const srcAbs = resolve(realPath, srcRelative);
        // The exports field may already point at a .ts file; try as-is plus .ts/.tsx
        for (const candidate of [srcAbs, `${srcAbs}.ts`, `${srcAbs}.tsx`]) {
          if (existsSync(candidate)) return candidate;
        }
        return null;
      } catch {
        return null;
      }
    }
    const parent = resolve(dir, "..");
    if (parent === dir) break; // reached filesystem root
    dir = parent;
  }
  return null;
}

function resolveImport(fromFile: string, imp: string): string | null {
  if (imp.startsWith(".")) {
    const base = resolve(dirname(fromFile), imp);
    for (const c of [
      `${base}.ts`,
      `${base}.tsx`,
      join(base, "index.ts"),
      join(base, "index.tsx"),
    ]) {
      if (existsSync(c)) return c;
    }
    return null;
  }
  return resolveWorkspaceImport(fromFile, imp);
}

function buildDepGraph(testFiles: string[]): DepGraph {
  const dependents = new Map<string, Set<string>>();
  const importedBy = new Map<string, Map<string, string>>();

  function visit(file: string, testFile: string, parent: string | null, visited: Set<string>) {
    if (visited.has(file)) return;
    visited.add(file);

    if (!dependents.has(file)) dependents.set(file, new Set());
    dependents.get(file)!.add(testFile);

    if (!importedBy.has(testFile)) importedBy.set(testFile, new Map());
    if (parent !== null) {
      importedBy.get(testFile)!.set(file, parent);
    } else {
      // Record the test file as a dependency of itself so that getDepsForFile
      // always includes it — cache key changes whenever the test file changes.
      importedBy.get(testFile)!.set(file, file);
    }

    let content: string;
    try {
      content = readFileSync(file, "utf-8");
    } catch {
      return;
    }

    for (const imp of parseImports(content)) {
      const resolved = resolveImport(file, imp);
      if (resolved) visit(resolved, testFile, file, visited);
    }
  }

  for (const t of testFiles) visit(t, t, null, new Set());
  return { dependents, importedBy };
}

// ─── Thin CLI wrappers around render.ts ───────────────────────────────────────

function print(lines: string[]): void {
  process.stdout.write(lines.join("\n") + "\n");
}

function renderResults(suites: SerializableTestSuite[], verbose = false, cwd = process.cwd()) {
  const result = _renderResults(suites, verbose, cwd);
  print(result.lines);
  return result;
}

function printSummary(
  totalPass: number,
  totalFail: number,
  totalSkip: number,
  totalFiles: number,
  failFiles: number,
  startTime: Date,
  durationMs?: number,
  cachedCount?: number,
  opts?: { shard?: string; grep?: string; cacheCleared?: boolean },
) {
  print(
    renderSummary(
      totalPass,
      totalFail,
      totalSkip,
      totalFiles,
      failFiles,
      startTime,
      durationMs,
      cachedCount,
      opts,
    ),
  );
}

function printCoverage(coverage: IstanbulCoverage, cwd: string) {
  print(renderCoverage(coverage, cwd));
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function runNode() {
  const args = process.argv.slice(2);
  const watchMode = args.includes("--watch");
  const mergeShards = args.includes("--merge-shards");
  const clearCacheFlag = args.includes("--clear-cache");
  const coverageFlag = args.includes("--coverage");
  const verboseFlag = args.includes("--verbose");
  const shardArg = args.find((a) => a.startsWith("--shard="))?.slice("--shard=".length);
  const outputJsonArg = args
    .find((a) => a.startsWith("--output-json="))
    ?.slice("--output-json=".length);
  const grepArg = args.find((a) => a.startsWith("--grep="))?.slice("--grep=".length);
  const timeoutArg = args.find((a) => a.startsWith("--timeout="))?.slice("--timeout=".length);
  const updateSnapshots = args.includes("--update-snapshots") || args.includes("--update-snapshot");
  const cwd = process.cwd();

  // ── --clear-cache ──────────────────────────────────────────────────────────
  if (clearCacheFlag) {
    clearCache(getCacheDir(cwd));
    const otherArgs = args.filter((a) => a !== "--clear-cache");
    // If no other args, just confirm and exit. Otherwise the main header will note it.
    if (otherArgs.length === 0) {
      console.log(`${CYAN}${BOLD}RoadTest${RESET} ${DIM}cache cleared${RESET}`);
      return;
    }
  }

  // ── --merge-shards ─────────────────────────────────────────────────────────
  if (mergeShards) {
    const resultsDir = getResultsDir(cwd);
    const shardResults = readAllShardResults(resultsDir);
    if (shardResults.length === 0) {
      console.log(`${YELLOW}No shard result files found in ${rel(resultsDir, cwd)}${RESET}`);
      process.exit(1);
    }

    const { suites, shards } = mergeShardResults(shardResults);
    console.log(
      `\n${CYAN}${BOLD}RoadTest${RESET} ${DIM}merged ${plural(shards.length, "shard")}${RESET}\n`,
    );

    const mergeStart = Date.now();
    const mergeStartDate = new Date();
    const mergedCwd = process.cwd();
    const { totalPass, totalFail, totalSkip, totalFiles, failFiles } = renderResults(
      suites,
      false,
      mergedCwd,
    );
    printSummary(
      totalPass,
      totalFail,
      totalSkip,
      totalFiles,
      failFiles,
      mergeStartDate,
      Date.now() - mergeStart,
    );
    process.exit(totalFail > 0 ? 1 : 0);
  }

  // ── Watch mode ─────────────────────────────────────────────────────────────
  if (watchMode) {
    const { watch } = await import("node:fs");
    const { spawn } = await import("node:child_process");
    const { fileURLToPath } = await import("node:url");
    const { glob } = await import("glob");

    const tsxBin = resolve(cwd, "node_modules", ".bin", "tsx");
    const scriptPath = fileURLToPath(import.meta.url);
    const globPattern =
      args.find((a, i) => i > 0 && !a.startsWith("--")) ?? "src/**/*.test.{ts,tsx}";

    let child: ReturnType<typeof spawn> | null = null;
    let debounce: ReturnType<typeof setTimeout> | null = null;

    function spawnRun(files: string[]) {
      child?.kill();
      child = spawn(tsxBin, [scriptPath, ...files], { stdio: "inherit" });
    }

    const initial = (await glob(globPattern, { cwd })).map((f) => resolve(cwd, f));
    console.log(`\n${CYAN}${BOLD}RoadTest${RESET} ${DIM}watch${RESET}\n`);
    console.log(
      `${DIM}watching src/  •  ${plural(initial.length, "test file")} found  •  ctrl+c to stop${RESET}\n`,
    );
    spawnRun(initial);

    watch(resolve(cwd, "src"), { recursive: true }, async (_, filename) => {
      if (!filename?.match(/\.(ts|tsx)$/)) return;
      if (debounce) clearTimeout(debounce);

      debounce = setTimeout(async () => {
        const changedAbs = resolve(cwd, "src", filename);
        const freshTestFiles = (await glob(globPattern, { cwd })).map((f) => resolve(cwd, f));
        const graph = buildDepGraph(freshTestFiles);

        const affected = graph.dependents.get(changedAbs);
        let filesToRun: string[];
        let reason: "direct" | "dep" | "fallback";

        if (affected && affected.size > 0) {
          filesToRun = [...affected];
          const isDirect = freshTestFiles.includes(changedAbs);
          reason = isDirect ? "direct" : "dep";
        } else {
          filesToRun = freshTestFiles;
          reason = "fallback";
        }

        process.stdout.write(
          "\n" +
            renderWatchSeparator() +
            "\n" +
            renderDepTree(changedAbs, filesToRun, reason, graph, cwd) +
            "\n\n",
        );
        spawnRun(filesToRun);
      }, 120);
    });

    process.on("SIGINT", () => {
      child?.kill();
      process.exit(0);
    });
    process.stdin.resume();
    return;
  }

  // ── Non-watch (run) mode ───────────────────────────────────────────────────
  const { glob } = await import("glob");
  const { pathToFileURL } = await import("node:url");
  const { isAbsolute } = await import("node:path");

  const positional = args.filter((a) => !a.startsWith("--"));

  let files: string[];
  if (positional.length === 0) {
    files = (await glob("src/**/*.test.{ts,tsx}", { cwd })).map((f) => resolve(cwd, f));
  } else if (
    positional.length === 1 &&
    (positional[0].includes("*") || positional[0].includes("{"))
  ) {
    files = (await glob(positional[0], { cwd })).map((f) => resolve(cwd, f));
  } else {
    files = positional
      .map((f) => (isAbsolute(f) ? f : resolve(cwd, f)))
      .filter((f) => existsSync(f));
  }

  if (files.length === 0) {
    console.log(`${YELLOW}No test files found${RESET}`);
    process.exit(0);
  }

  // ── Sharding ───────────────────────────────────────────────────────────────
  const shard = shardArg ? parseShardArg(shardArg) : null;
  if (shard) files = applySharding(files, shard);

  if (files.length === 0) {
    console.log(
      `${DIM}Shard ${shard!.index}/${shard!.total}: no files assigned to this shard${RESET}`,
    );
    process.exit(0);
  }

  const runStartDate = new Date();
  const runStart = runStartDate.getTime();

  // ── Build dep graph + cache lookup ─────────────────────────────────────────
  const graph = buildDepGraph(files);
  const cacheDir = getCacheDir(cwd);

  const cacheHits: SerializableTestSuite[] = [];
  const cacheMisses: string[] = [];
  const cacheMissReasons = new Map<string, string[]>();
  const cacheKeys = new Map<string, { key: string; fileHashes: Record<string, string> }>();
  const cachedCoverage: IstanbulCoverage = {};
  let cachedTestCount = 0;

  for (const file of files) {
    const computed = computeCacheKey(file, graph);
    cacheKeys.set(file, computed);
    const entry = readCache(cacheDir, computed.key);
    if (entry) {
      cacheHits.push(...entry.suites);
      cachedTestCount += entry.suites.reduce((sum, s) => sum + s.tests.length, 0);
      if (entry.coverage) Object.assign(cachedCoverage, entry.coverage);
    } else {
      cacheMisses.push(file);
      // Determine why: compare current hashes against the previously stored entry
      const oldEntry = readCacheByTestFile(cacheDir, file);
      if (oldEntry?.fileHashes) {
        const changed: string[] = [];
        for (const [f, h] of Object.entries(computed.fileHashes)) {
          if (oldEntry.fileHashes[f] !== h) changed.push(rel(f, cwd));
        }
        for (const f of Object.keys(oldEntry.fileHashes)) {
          if (!(f in computed.fileHashes)) changed.push(`${rel(f, cwd)} (removed)`);
        }
        if (changed.length > 0) cacheMissReasons.set(file, changed);
      }
    }
  }

  if (cachedTestCount > 0) {
    console.log(
      `\n  ${DIM}${plural(cacheHits.length, "file")} cached  •  ${cacheMisses.length} to run${RESET} \n`,
    );
    for (const file of cacheMisses) {
      const reasons = cacheMissReasons.get(file);
      const why = reasons ? `  ${DIM}← ${reasons.join(", ")} changed${RESET}` : "";
      console.log(`  ${YELLOW}↺${RESET}  ${DIM}${rel(file, cwd)}${RESET}${why}`);
    }
  }

  // ── Stream results ─────────────────────────────────────────────────────────
  // Cached files print immediately; fresh files print as each one finishes.
  const freshSuites: SerializableTestSuite[] = [];
  let freshCoverage: IstanbulCoverage | null = null;
  const serializedByFile = new Map<string, SerializableTestSuite[]>();

  // Print cached results immediately in original file order
  for (const file of files) {
    const cached = cacheHits.filter((s) => s.sourceFile === file);
    if (cached.length > 0) print(_renderResults(cached, verboseFlag, cwd, true).lines);
  }

  // Run each cache-miss file and stream its result immediately
  if (cacheMisses.length > 0) {
    const { setCurrentSourceFile, runSuites, store, clearAllMocks } = await import("roadtest");
    const missTotal = cacheMisses.length;

    for (let i = 0; i < cacheMisses.length; i++) {
      const file = cacheMisses[i];

      // Live progress indicator (overwritten on each iteration)
      process.stdout.write(`\r\x1b[2K  ${DIM}running ${i + 1}/${missTotal}…${RESET}`);

      const prevSuiteIds = new Set(store.getState().suites.map((s) => s.id));

      setCurrentSourceFile(file);
      await import(pathToFileURL(file).href);
      setCurrentSourceFile(null);

      const newSuiteIds = store
        .getState()
        .suites.filter((s) => !prevSuiteIds.has(s.id))
        .map((s) => s.id);

      await runSuites(newSuiteIds, {
        grep: grepArg,
        timeout: timeoutArg !== undefined ? parseInt(timeoutArg, 10) : undefined,
      });

      // Clear mocks registered by this file so they don't leak into the next file.
      clearAllMocks();

      // Clear the progress line and immediately print this file's result
      process.stdout.write("\r\x1b[2K");

      const updatedSuites = store.getState().suites.filter((s) => newSuiteIds.includes(s.id));
      const serialized = updatedSuites.map(serializeTestSuite);

      print(_renderResults(serialized, verboseFlag, cwd).lines);

      freshSuites.push(...serialized);
      serializedByFile.set(file, serialized);
    }

    // NODE_V8_COVERAGE was set by the bin script before this process started.
    freshCoverage = await readNodeCoverage(resolve(cwd, "src"));
  }

  // ── Compute aggregate totals (results already printed above) ───────────────
  const allSuites: SerializableTestSuite[] = [];
  for (const file of files) {
    const fromCache = cacheHits.filter((s) => s.sourceFile === file);
    const fromFresh = freshSuites.filter((s) => s.sourceFile === file);
    allSuites.push(...fromCache, ...fromFresh);
  }

  // ── Snapshot persistence ───────────────────────────────────────────────────
  const suitesToCompare = updateSnapshots ? freshSuites : allSuites;
  const { mismatches: snapshotMismatches, removed: snapshotRemoved } = processSnapshots(
    allSuites,
    updateSnapshots,
    suitesToCompare,
  );

  // Write cache entries after processSnapshots so snapshot hashes are current.
  if (serializedByFile.size > 0) {
    for (const file of cacheMisses) {
      const serialized = serializedByFile.get(file) ?? [];
      const { key, fileHashes } = cacheKeys.get(file)!;

      const snapshotHashes: Record<string, string> = {};
      for (const suite of serialized) {
        if (!suite.sourceFile) continue;
        for (const test of suite.tests) {
          for (const assertion of test.assertions) {
            if (!assertion.snapshot) continue;
            const p = snapshotPath(
              suite.sourceFile,
              suite.name,
              test.name,
              assertion.snapshot.label,
            );
            if (existsSync(p)) snapshotHashes[p] = hashFileContent(p);
          }
        }
      }

      writeCache(cacheDir, key, file, {
        suites: serialized,
        coverage: freshCoverage,
        fileHashes,
        snapshotHashes: Object.keys(snapshotHashes).length > 0 ? snapshotHashes : undefined,
      });
    }
  }

  // Compute totals from all suites (lines already printed per-file above)
  const { totalPass, totalFail, totalSkip, totalFiles, failFiles } = _renderResults(
    allSuites,
    verboseFlag,
    cwd,
  );
  printSummary(
    totalPass,
    totalFail,
    totalSkip,
    totalFiles,
    failFiles,
    runStartDate,
    Date.now() - runStart,
    cachedTestCount,
    {
      shard: shard ? `${shard.index}/${shard.total}` : undefined,
      grep: grepArg,
      cacheCleared: clearCacheFlag,
    },
  );

  // ── Snapshot results (after summary) ──────────────────────────────────────
  if (snapshotRemoved.length > 0) {
    console.log(`\n${DIM}Removed ${plural(snapshotRemoved.length, "obsolete snapshot")}:${RESET}`);
    for (const p of snapshotRemoved) {
      console.log(`  ${DIM}− ${rel(p, cwd)}${RESET}`);
    }
  }
  if (snapshotMismatches.length > 0) {
    print(renderSnapshotMismatches(snapshotMismatches, cwd, verboseFlag));
  }

  // ── Coverage report ────────────────────────────────────────────────────────
  if (coverageFlag) {
    const merged: IstanbulCoverage = { ...cachedCoverage, ...freshCoverage };

    if (Object.keys(merged).length > 0) {
      printCoverage(merged, cwd);
    } else {
      console.log(
        `${DIM}No coverage data — run with --clear-cache if all tests were cached${RESET}\n`,
      );
    }
  }

  // ── Write JSON output ──────────────────────────────────────────────────────
  if (outputJsonArg) {
    const outPath = resolve(cwd, outputJsonArg);
    const { writeFileSync, mkdirSync } = await import("node:fs");
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, JSON.stringify(allSuites, null, 2), "utf-8");
    console.log(`${DIM}results written → ${outPath}${RESET}\n`);
  }

  // ── Write shard result file ────────────────────────────────────────────────
  if (shard) {
    writeShardResult(getResultsDir(cwd), {
      shard,
      completedAt: Date.now(),
      suites: allSuites,
      coverage: null, // full coverage merge happens at --merge-shards time
    });
    console.log(
      `${DIM}shard result written → .roadtest/results/shard-${shard.index}-of-${shard.total}.json${RESET}\n`,
    );
  }

  process.exit(totalFail > 0 ? 1 : 0);
}
