import type { Page } from "@playwright/test";

/**
 * Waits until the roadtest UI has finished loading and all tests have run.
 *
 * Flow inside the app:
 *  1. "Loading test sandbox…" spinner shown while the sandbox iframe initialises.
 *  2. Once the sandbox is ready the sidebar shows "N tests ready" (pending state).
 *  3. We click the "Run all" button to trigger execution.
 *  4. A "Running tests" progress toast appears while tests execute.
 *  5. When all tests finish the toast disappears and results are visible.
 *
 * IMPORTANT: This helper must be called while the detail view ("/") is active,
 * because the "Run all" button lives in the TestTree sidebar which is only
 * rendered on the detail route.
 */
export async function waitForTestsComplete(page: Page): Promise<void> {
  // 1. Wait for the sandbox iframe to be ready (loading spinner gone)
  await page.locator("text=Loading test sandbox").waitFor({
    state: "hidden",
    timeout: 30_000,
  });

  // 2. Trigger a full test run via the sidebar's "Run all" button
  await page.getByTitle("Run all").click();

  // 3. Wait for the progress toast to confirm tests have started
  await page.locator("text=Running tests").waitFor({ state: "visible", timeout: 15_000 });

  // 4. Wait for the toast to disappear — all tests are done.
  // scheduler.yield() replaced rAF in the browser runner, eliminating the 1fps
  // headless throttle. 35s is a generous bound for the example app's test suite.
  await page.locator("text=Running tests").waitFor({ state: "hidden", timeout: 35_000 });
}
