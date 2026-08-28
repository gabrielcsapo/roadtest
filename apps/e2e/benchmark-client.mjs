import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const app = args.find((arg) => !arg.startsWith("--")) ?? "scale";
const selectedTest = args.find((arg) => arg.startsWith("--select-test="))?.slice(14);
const root = resolve(import.meta.dirname, `../${app}`);
const cli = resolve(import.meta.dirname, "../../packages/roadtest/bin/roadtest.js");
if (args.includes("--cold")) {
  rmSync(join(root, "node_modules", ".vite"), { recursive: true, force: true });
}
const startedAt = performance.now();
const server = spawn(process.execPath, [cli, "--ui"], {
  cwd: root,
  env: { ...process.env, BROWSER: "none" },
  stdio: ["pipe", "pipe", "pipe"],
});

server.stdout.pipe(process.stderr);
server.stderr.pipe(process.stderr);

async function waitForServer() {
  let lastError;
  for (let attempt = 0; attempt < 300; attempt++) {
    try {
      const response = await fetch("http://localhost:3333/");
      if (response.ok) return;
      lastError = new Error(`Roadtest UI returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  throw new Error("Roadtest UI did not start", { cause: lastError });
}

let browser;
try {
  await waitForServer();
  const serverReadyAt = performance.now();
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    headless: true,
  });
  const page = await browser.newPage();
  await page.goto("http://localhost:3333/");
  const runAll = page.getByTitle("Run all");
  await runAll.waitFor({ state: "visible", timeout: 120_000 });
  await page.waitForFunction(() => {
    const button = document.querySelector('button[title="Run all"]');
    return button instanceof HTMLButtonElement && !button.disabled;
  });
  const sandboxReadyAt = performance.now();
  await runAll.click();
  await page.locator("text=Running tests").waitFor({ state: "visible", timeout: 30_000 });
  await page.locator("text=Running tests").waitFor({ state: "hidden", timeout: 120_000 });
  if (selectedTest) {
    await page.getByText(selectedTest, { exact: true }).first().click();
    await page
      .frameLocator('iframe[name="__vt_display"]')
      .locator("#__vt_display_root__ > *")
      .first()
      .waitFor({ state: "attached", timeout: 30_000 });
  }
  const finishedAt = performance.now();
  const resources = await page.evaluate(() =>
    performance.getEntriesByType("resource").map((entry) => ({
      duration: entry.duration,
      name: entry.name,
      transferSize: "transferSize" in entry ? entry.transferSize : 0,
    })),
  );

  process.stdout.write(
    `${JSON.stringify({
      app,
      resourceCount: resources.length,
      serverReadyMs: Math.round(serverReadyAt - startedAt),
      sandboxReadyMs: Math.round(sandboxReadyAt - serverReadyAt),
      testRunMs: Math.round(finishedAt - sandboxReadyAt),
      totalMs: Math.round(finishedAt - startedAt),
      transferBytes: resources.reduce((sum, resource) => sum + resource.transferSize, 0),
    })}\n`,
  );
} finally {
  await browser?.close();
  server.kill("SIGINT");
}
