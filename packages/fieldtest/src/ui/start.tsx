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
import { captureProps } from "../framework/traceUtils";

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
      overflow: "auto",
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

    // Component tree captured after each render, before any after-display hooks
    // (which may call RTL cleanup and destroy the fiber).
    let _capturedTree: ComponentTreeResult = [];

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
        // No React fiber when rendering from HTML — leave _capturedTree as-is from
        // the previous live render so the trace tab still shows something.
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
        // Capture BEFORE after-display hooks — hooks may call RTL cleanup() which
        // unmounts React and destroys the fiber, making getComponentTree() return [].
        _capturedTree = scanComponentTree();
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
        // Capture BEFORE after-display hooks — same timing issue as showTest.
        _capturedTree = scanComponentTree();
        await runAfterDisplayHooks();
      }

      return container.innerHTML !== "";
    }

    async function runAxe() {
      const { default: axe } = await import("axe-core");
      return axe.run(displayRoot);
    }

    async function runVisionContrast() {
      const { checkVisionContrast } = await import("./cvd-contrast");
      return checkVisionContrast(displayRoot);
    }

    const _highlightedEls: Map<HTMLElement, { outline: string; outlineOffset: string }> = new Map();

    function highlight(highlights: { path: number[]; color: string }[]) {
      for (const [el, saved] of _highlightedEls) {
        el.style.outline = saved.outline;
        el.style.outlineOffset = saved.outlineOffset;
      }
      _highlightedEls.clear();

      for (const { path, color } of highlights) {
        let el: Element | null = displayRoot.firstElementChild;
        for (const idx of path) {
          el = el?.children[idx] ?? null;
        }
        if (el instanceof HTMLElement && !_highlightedEls.has(el)) {
          _highlightedEls.set(el, {
            outline: el.style.outline,
            outlineOffset: el.style.outlineOffset,
          });
          el.style.outline = `2px solid ${color}`;
          el.style.outlineOffset = "2px";
        }
      }
    }

    type ComponentTreeResult = {
      name: string;
      depth: number;
      key: string | null;
      isForwardRef: boolean;
      isMemo: boolean;
      domPath?: number[];
    }[];

    function findReactRoot(el: HTMLElement): { container: HTMLElement; key: string } | null {
      // Use getOwnPropertyNames to include non-enumerable properties — React 18 may set
      // __reactContainer$ as non-enumerable depending on the build/version.
      const keys = Object.getOwnPropertyNames(el);
      const containerKey = keys.find((k) => k.startsWith("__reactContainer$"));
      if (containerKey) return { container: el, key: containerKey };
      return null;
    }

    /**
     * Walk a fiber up to the HostRoot (tag 3) and return it.
     * Used when we find a fiber via __reactFiber$ on a DOM node rather than
     * __reactContainer$ on the root container.
     */
    function getHostRootFiber(fiber: any): any {
      let f = fiber;
      while (f?.return) f = f.return;
      return f;
    }

    /**
     * Scan the live DOM for React roots and return whatever component tree is
     * currently mounted. Called BEFORE runAfterDisplayHooks so the fiber is
     * still alive when we read it.
     */
    function scanComponentTree(): ComponentTreeResult {
      // 1. Check the expected container (fieldtest's setRenderTarget destination).
      const primary = displayRoot.firstElementChild as HTMLElement | null;
      if (primary) {
        const root = findReactRoot(primary);
        if (root) {
          const results: ComponentTreeResult = [];
          walkDisplayFiber((primary as any)[root.key]?.child, 0, results, primary);
          if (results.length > 0) return results;
        }
      }

      // 2. Scan document.body for React roots created by RTL's render()
      //    when the test imports render from @testing-library/react directly.
      for (const child of Array.from(document.body.children) as HTMLElement[]) {
        if (child === displayRoot) continue;
        const root = findReactRoot(child);
        if (!root) continue;
        const results: ComponentTreeResult = [];
        walkDisplayFiber((child as any)[root.key]?.child, 0, results, child);
        if (results.length > 0) return results;
      }

      // 3. Last resort: scan every DOM element for __reactFiber$ (React attaches this
      //    to every rendered DOM node). Walk up the fiber to the HostRoot, then collect
      //    the full component tree from there. Handles builds where __reactContainer$ is
      //    not accessible but individual fiber references still exist on DOM nodes.
      for (const el of Array.from(document.querySelectorAll("*")) as HTMLElement[]) {
        const fiberKey = Object.getOwnPropertyNames(el).find((k) => k.startsWith("__reactFiber$"));
        if (!fiberKey) continue;
        const hostRoot = getHostRootFiber((el as any)[fiberKey]);
        if (!hostRoot) continue;
        const container = hostRoot.stateNode?.containerInfo as HTMLElement | null;
        if (!container) continue;
        const results: ComponentTreeResult = [];
        walkDisplayFiber(hostRoot.child, 0, results, container);
        if (results.length > 0) return results;
      }

      return [];
    }

    /**
     * Returns the component tree from the most recent showTest/playTest call.
     * The tree is captured before after-display hooks run so it is always valid
     * even if a hook calls RTL cleanup() and destroys the React fiber.
     */
    function getComponentTree(): ComponentTreeResult {
      return _capturedTree;
    }

    function walkDisplayFiber(
      fiber: any,
      depth: number,
      results: ComponentTreeResult,
      container: HTMLElement,
    ) {
      if (!fiber) return;
      let name = "";
      let isForwardRef = false;
      let isMemo = false;
      if (typeof fiber.type === "function") {
        name = fiber.type.displayName || fiber.type.name || "";
      } else if (fiber.type && typeof fiber.type === "object") {
        const inner = fiber.type;
        if (inner.$$typeof) {
          const sym = String(inner.$$typeof);
          isForwardRef = sym.includes("forward_ref");
          isMemo = sym.includes("memo");
        }
        name =
          inner.displayName ||
          inner.render?.name ||
          inner.type?.name ||
          inner.type?.displayName ||
          "";
      }
      const isComponent = !!name && name !== "Anonymous";
      if (isComponent) {
        const hostNode = getFirstDisplayHostNode(fiber);
        results.push({
          name,
          depth,
          key: fiber.key ?? null,
          isForwardRef,
          isMemo,
          domPath: hostNode ? getDisplayDomPath(hostNode, container) : undefined,
          props: captureProps(fiber),
        });
      }
      walkDisplayFiber(fiber.child, isComponent ? depth + 1 : depth, results, container);
      walkDisplayFiber(fiber.sibling, depth, results, container);
    }

    function getFirstDisplayHostNode(fiber: any): HTMLElement | null {
      if (!fiber) return null;
      if (fiber.tag === 5 && fiber.stateNode instanceof HTMLElement) return fiber.stateNode;
      return getFirstDisplayHostNode(fiber.child);
    }

    function getDisplayDomPath(node: HTMLElement, root: HTMLElement): number[] | undefined {
      const path: number[] = [];
      let current: HTMLElement | null = node;
      while (current && current !== root) {
        const parent: HTMLElement | null = current.parentElement;
        if (!parent) return undefined;
        path.unshift(Array.from(parent.children).indexOf(current));
        current = parent;
      }
      return current === root ? path : undefined;
    }

    (window as unknown as Record<string, unknown>)["__vtDisplay"] = {
      showTest,
      playTest,
      displayRoot,
      runAxe,
      runVisionContrast,
      highlight,
      getComponentTree,
    };
    postParentMessage({ type: "__vt_display_ready" });
    return;
  }

  // ── UI frame: mounts the React app ─────────────────────────────────────────
  createRoot(document.getElementById("root")!).render(<App />);
}
