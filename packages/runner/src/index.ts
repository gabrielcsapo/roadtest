#!/usr/bin/env node
/**
 * ViewTest runner entry point.
 *
 *   viewtest            — run all tests in Node
 *   viewtest --watch    — watch mode
 *   viewtest --ui       — start browser UI (Vite dev server)
 */

if (process.argv.includes('--ui')) {
  const { startUi } = await import('./ui.js')
  await startUi()
} else if (process.argv.includes('--build')) {
  const { buildUi } = await import('./ui.js')
  await buildUi()
} else {
  const { runNode } = await import('./node.js')
  await runNode()
}
