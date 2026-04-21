#!/usr/bin/env node
/**
 * RoadTest runner entry point.
 *
 *   roadtest            — run all tests in Node
 *   roadtest --watch    — watch mode
 *   roadtest --ui       — start browser UI (Vite dev server)
 */

if (process.argv.includes("--ui")) {
  const { startUi } = await import("./ui.js");
  await startUi();
} else if (process.argv.includes("--build")) {
  const { buildUi } = await import("./ui.js");
  await buildUi();
} else {
  const { runNode } = await import("./node.js");
  await runNode();
}
