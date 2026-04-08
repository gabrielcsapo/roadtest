#!/usr/bin/env node
/**
 * Thin bootstrap: resolves tsx from the runner package's own node_modules,
 * then spawns it to load the TypeScript entry point.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const _require = createRequire(import.meta.url);
const _dirname = dirname(fileURLToPath(import.meta.url));

// Resolve tsx's ESM loader from the runner's own node_modules
const tsxEsm = _require.resolve("tsx/esm");
const src = resolve(_dirname, "..", "src", "index.ts");

// When --coverage is requested, set NODE_V8_COVERAGE so Node.js instruments
// all scripts from process startup — including those loaded through tsx's
// ESM loader hook, which the inspector Profiler API can't see.
const env = { ...process.env };
let v8CovDir = null;
if (process.argv.includes("--coverage") && !process.argv.includes("--ui")) {
  v8CovDir = mkdtempSync(join(tmpdir(), "fieldtest-cov-"));
  env.NODE_V8_COVERAGE = v8CovDir;
}

const { status } = spawnSync(
  process.execPath,
  ["--import", tsxEsm, src, ...process.argv.slice(2)],
  { stdio: "inherit", env },
);

// Clean up temp coverage dir now that the child process has finished
if (v8CovDir) {
  try {
    rmSync(v8CovDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

process.exit(status ?? 0);
