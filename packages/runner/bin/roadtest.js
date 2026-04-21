#!/usr/bin/env node
/**
 * Thin bootstrap: resolves tsx from the runner package's own node_modules,
 * then spawns it to load the TypeScript entry point.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { createRequire } from "node:module";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
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

// tsx loads ONE tsconfig at startup from process.cwd(). When running from a
// monorepo root that has no root tsconfig.json, tsx finds nothing and falls
// back to the classic JSX transform (React.createElement). Fix: locate the
// tsconfig.json nearest to the test files being run and pass it via the env
// var that tsx checks in its initialize hook.
if (!env.TSX_TSCONFIG_PATH) {
  const userArgs = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (userArgs.length > 0) {
    // Strip glob wildcards to get the closest concrete directory prefix.
    const prefix = userArgs[0].replace(/\*.*$/, "").replace(/\/$/, "") || ".";
    let current = resolve(prefix);
    // If the prefix looks like a file path (has an extension), use its dir.
    if (/\.[a-z]+$/i.test(current) && !existsSync(current)) {
      current = dirname(current);
    }
    while (true) {
      const candidate = join(current, "tsconfig.json");
      if (existsSync(candidate)) {
        env.TSX_TSCONFIG_PATH = candidate;
        break;
      }
      const parent = dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }
}

let v8CovDir = null;
if (process.argv.includes("--coverage") && !process.argv.includes("--ui")) {
  v8CovDir = mkdtempSync(join(tmpdir(), "roadtest-cov-"));
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
