import { type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import {
  setWrapper,
  setRenderTarget,
  setStopAfterFirstRender,
  setPlayDelay,
} from "../framework/render";
import { setCurrentSourceFile } from "../framework/dsl";
import { store } from "../framework/store";
import { runAll, runSuite, runTest } from "../framework/runner";
import { runAfterTestHooks, runBeforeDisplayHooks, runAfterDisplayHooks } from "../framework/hooks";
import { postParentMessage, onHmrMessage } from "../framework/messages";
import { checkDevServer, writeSnapshotsToServer, compareSnapshotsWithServer } from "./snapshots";
import type { TestSuite } from "../framework/types";

/** Whether the FieldTest dev server is reachable — false in static --build deployments. */
export let devServerAvailable = false;

interface StartOptions {
  wrapper?: ComponentType<{ children: React.ReactNode }>;
}

async function loadTestFiles(testFiles: Record<string, () => Promise<unknown>>) {
  for (const [path, loader] of Object.entries(testFiles)) {
    setCurrentSourceFile(path);
    try {
      await loader();
    } catch (e) {
      console.error(`[fieldtest] Failed to load ${path}:`, e);
    }
  }
  setCurrentSourceFile(null);
}

export async function reloadFile(path: string, loader: () => Promise<unknown>) {
  if (window.name !== "__vt_sandbox") return;
  store.removeSuitesForFile(path);
  setCurrentSourceFile(path);
  try {
    await loader();
  } catch (e) {
    console.error(`[fieldtest] Failed to reload ${path}:`, e);
  }
  setCurrentSourceFile(null);
  const fresh = store.getState().suites.filter((s) => s.sourceFile === path);
  for (const suite of fresh) runSuite(suite.id);
}

export async function startApp(
  testFiles: Record<string, () => Promise<unknown>>,
  options?: StartOptions,
) {
  // ── Sandbox frame: runs all tests ──────────────────────────────────────────
  if (window.name === "__vt_sandbox") {
    if (options?.wrapper) setWrapper(options.wrapper);
    await loadTestFiles(testFiles);
    // Receive results from node tests run server-side
    onHmrMessage("vt:node-results", ({ suites }: { suites: TestSuite[] }) => {
      for (const suite of suites) {
        if (suite.sourceFile) store.removeSuitesForFile(suite.sourceFile);
        store.addSuite(suite);
      }
    });

    // Check if the dev server is running and whether --update-snapshots was passed.
    // In a static --build deployment this fetch will fail → devServerAvailable stays false.
    const { devServer, autoWrite } = await checkDevServer();
    devServerAvailable = devServer;

    // Expose sandbox API — devServerAvailable is now set correctly.
    (window as unknown as Record<string, unknown>)["__fieldtest"] = {
      store,
      runAll,
      runSuite,
      runTest,
      devServerAvailable,
    };

    // After every run: compare snapshots against server baselines (always when
    // the dev server is available) and optionally write new baselines to disk.
    let wasRunning = false;
    store.subscribe(() => {
      const { running, suites } = store.getState();
      const justFinished = wasRunning && !running;
      wasRunning = running; // update before async calls to prevent re-entrancy
      if (justFinished) {
        if (devServer) {
          compareSnapshotsWithServer(suites).catch(() => {});
        }
        if (autoWrite) {
          writeSnapshotsToServer(suites).catch(() => {});
        }
      }
    });

    postParentMessage({ type: "__vt_ready" });
    return;
  }

  // ── Display frame: renders selected test interactively ─────────────────────
  if (window.name === "__vt_display") {
    if (options?.wrapper) setWrapper(options.wrapper);
    await loadTestFiles(testFiles);

    // Minimal reset so only the component shows, with transparent background and flex centering
    Object.assign(document.documentElement.style, {
      background: "transparent",
      overflow: "visible",
      height: "100%",
    });
    Object.assign(document.body.style, {
      margin: "0",
      padding: "24px",
      background: "transparent",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      boxSizing: "border-box",
      minHeight: "100%",
    });
    const displayRoot = document.createElement("div");
    displayRoot.id = "__vt_display_root__";
    document.body.appendChild(displayRoot);

    async function showTest(
      suiteName: string,
      testName: string,
      fallbackHtml?: string,
    ): Promise<boolean> {
      const { cleanup } = await import("@testing-library/react");
      cleanup();
      // Replace displayRoot's contents with a fresh element each time.
      // Reusing the same DOM node as a React root causes createRoot() to throw
      // on the second call (stale __reactContainer$ property), which is silently
      // swallowed and leaves the canvas empty.
      displayRoot.innerHTML = "";
      const container = document.createElement("div");
      displayRoot.appendChild(container);

      const test = store
        .getState()
        .suites.find((s) => s.name === suiteName)
        ?.tests.find((t) => t.name === testName);
      if (!test) return false;

      // Run before-display hooks first — these block until complete so any setup
      // (fetch mocking, data seeding, context providers, etc.) is in place before
      // the component renders.
      await runBeforeDisplayHooks();

      // If the UI frame provided snapshot HTML from a previous sandbox run, use it
      // directly. Live render in the display frame will fail for tests that use
      // worker.use() — the MSW service worker has no handlers registered here and
      // unmatched requests get Vite's SPA fallback (index.html) instead of JSON.
      if (fallbackHtml) {
        container.innerHTML = fallbackHtml;
        await runAfterDisplayHooks();
        return true;
      }

      // No snapshot yet — attempt a live render (works for tests that don't use MSW).
      setRenderTarget(container);
      setStopAfterFirstRender(true);
      try {
        await test.fn?.();
      } catch (e: unknown) {
        // Swallow the display-stop sentinel and any assertion errors
        if (!(e instanceof Error) || !("__vtDisplayStop" in e)) {
          console.debug("[fieldtest display]", e);
        }
      } finally {
        setRenderTarget(null);
        setStopAfterFirstRender(false);
        await runAfterTestHooks();
        await runAfterDisplayHooks();
      }

      return container.innerHTML !== "";
    }

    async function playTest(suiteName: string, testName: string, speed = 600): Promise<boolean> {
      const { cleanup } = await import("@testing-library/react");
      cleanup();
      displayRoot.innerHTML = "";
      const container = document.createElement("div");
      displayRoot.appendChild(container);

      const test = store
        .getState()
        .suites.find((s) => s.name === suiteName)
        ?.tests.find((t) => t.name === testName);
      if (!test) return false;

      await runBeforeDisplayHooks();

      setRenderTarget(container);
      setPlayDelay(speed);
      try {
        await test.fn?.();
      } catch (e: unknown) {
        console.debug("[fieldtest play]", e);
      } finally {
        setRenderTarget(null);
        setPlayDelay(0);
        await runAfterTestHooks();
        await runAfterDisplayHooks();
      }

      return container.innerHTML !== "";
    }

    async function runAxe() {
      const { default: axe } = await import("axe-core");
      return axe.run(displayRoot);
    }

    (window as unknown as Record<string, unknown>)["__vtDisplay"] = {
      showTest,
      playTest,
      displayRoot,
      runAxe,
    };
    postParentMessage({ type: "__vt_display_ready" });
    return;
  }

  // ── UI frame: mounts the React app ─────────────────────────────────────────
  createRoot(document.getElementById("root")!).render(<App />);
}
