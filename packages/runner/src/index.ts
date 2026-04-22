#!/usr/bin/env node
/**
 * RoadTest runner entry point.
 *
 *   roadtest            — run all tests in Node
 *   roadtest --watch    — watch mode
 *   roadtest --ui       — start browser UI (Vite dev server)
 */

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printHelp();
} else if (process.argv.includes("--version") || process.argv.includes("-v")) {
  await printVersion();
} else if (process.argv.includes("--ui")) {
  const { startUi } = await import("./ui.js");
  await startUi();
} else if (process.argv.includes("--build")) {
  const { buildUi } = await import("./ui.js");
  await buildUi();
} else {
  const { runNode } = await import("./node.js");
  await runNode();
}

function printHelp(): void {
  process.stdout.write(`\
roadtest — React component + unit test runner

Usage
  roadtest [pattern] [flags]            run tests in Node (happy-dom)
  roadtest --ui [pattern] [flags]       launch the browser UI
  roadtest --build [flags]              build the UI as a static bundle

Pattern
  A glob of test files. Defaults to src/**/*.test.{ts,tsx}.

Run modes
  --watch                 re-run tests when files change
  --ui                    open the interactive browser UI
  --build                 build the UI as a static site

Selection
  --grep=<substr>         only run tests whose name contains <substr>
  --shard=<n>/<m>         run shard n of m (split test files)
  --merge-shards          merge shard results written under .roadtest/shards

Snapshots & cache
  --update-snapshots      overwrite stored snapshot baselines
  --clear-cache           delete the .roadtest/cache directory

Output
  --verbose               show full diffs, all assertions
  --coverage              collect V8 coverage (also works with --ui)
  --output-json=<path>    write JSON results to <path>
  --timeout=<ms>          per-test timeout (default varies)

Build (--build only)
  --outDir=<path>         output directory (default: dist)
  --base=<path>           public base path (default: /)

Other
  -h, --help              show this help and exit
  -v, --version           print the roadtest package version and exit

Examples
  roadtest
  roadtest src/cart.test.ts
  roadtest --ui 'src/**/*.test.tsx'
  roadtest --update-snapshots
  roadtest --shard=1/3 --output-json=shard.json
  roadtest --build --outDir=dist-demo --base=./
`);
}

async function printVersion(): Promise<void> {
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  const pkg = require("../package.json") as { version: string };
  process.stdout.write(`${pkg.version}\n`);
}
