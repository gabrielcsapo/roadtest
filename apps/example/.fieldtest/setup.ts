/**
 * fieldtest setup file — loaded by test files in both browser (Vite) and Node.
 * Top-level await is supported.
 *
 * Browser: starts an MSW service worker, registers the Network tab plugin.
 * Node:    starts an MSW server for fetch interception.
 */

import { registerAfterTestHook, registerBeforeDisplayHook, currentTest } from "@fieldtest/core";
import type { NetworkEntry, TestCase } from "@fieldtest/core";

// ─── Environment detection ────────────────────────────────────────────────────
// The Node runner sets globalThis.window via happy-dom, so we can't rely on
// `typeof window`. Instead we check for Node's `process.versions.node`.

const isBrowser = !(typeof process !== "undefined" && typeof process.versions?.node === "string");

const isSandboxFrame = typeof window !== "undefined" && window.name === "__vt_sandbox";
const isDisplayFrame = typeof window !== "undefined" && window.name === "__vt_display";

// ─── Shared request-capture state ────────────────────────────────────────────

type PendingEntry = {
  t0: number;
  method: string;
  url: string;
  requestBody?: string;
  test: TestCase;
};
const pending = new Map<string, PendingEntry>();

async function captureResponse(requestId: string, response: Response, mocked: boolean) {
  const p = pending.get(requestId);
  pending.delete(requestId);
  if (!p || !p.test) return;

  let responseBody: string | undefined;
  try {
    const text = await response.clone().text();
    responseBody = text || undefined;
  } catch {
    /* non-readable */
  }

  const entry: NetworkEntry = {
    method: p.method,
    url: p.url,
    status: response.status,
    mocked,
    requestBody: p.requestBody,
    responseBody,
    duration: Date.now() - p.t0,
    timestamp: p.t0,
  };

  if (!p.test.networkEntries) {
    p.test.networkEntries = [];
  }

  p.test.networkEntries.push(entry);
}

// ─── MSW setup ───────────────────────────────────────────────────────────────

// `worker` is typed to the common subset used by tests (.use / .resetHandlers)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _mswInstance!: { use(...h: any[]): void; resetHandlers(): void };

if (isBrowser && isSandboxFrame) {
  const { setupWorker } = await import("msw/browser");
  const { http, HttpResponse } = await import("msw");

  // Fieldtest's own UI fetches these dev-server endpoints from within the same
  // service-worker scope. In a static build there is no dev server, so register
  // permanent no-op handlers (passed to setupWorker so resetHandlers() never
  // removes them) to prevent passthrough failures.
  const w = setupWorker(
    http.get("/__fieldtest_source__", () => new HttpResponse(null, { status: 404 })),
    http.get("/__fieldtest_files__", () => HttpResponse.json([])),
    http.get("/__fieldtest_graph__", () => HttpResponse.json({ nodes: [], edges: [] })),
  );

  try {
    // Use a relative URL so the worker registers under the page's own directory.
    // This works whether the page is served at '/' (dev) or '/demo-ui/' (static build).
    await w.start({
      serviceWorker: { url: "./mockServiceWorker.js" },
      onUnhandledRequest: "bypass",
      quiet: true,
    });
  } catch (e) {
    console.warn("[MSW] Failed to start service worker. Run `npx msw init ./public` to fix.", e);
  }

  // Capture requests via the '*' wildcard (only public event in msw/browser)
  w.events.on("*", async (raw) => {
    const e = raw as { type: string; requestId?: string; request?: Request; response?: Response };
    const { type, requestId, request, response } = e;
    if (!requestId) return;

    if (type === "request:start" && request) {
      // Set pending SYNCHRONOUSLY before any await so it exists when response fires
      if (!currentTest) return;
      pending.set(requestId, {
        t0: Date.now(),
        method: request.method,
        url: request.url,
        test: currentTest,
      });
      try {
        const text = await request.clone().text();
        const p = pending.get(requestId);
        if (p && text) p.requestBody = text;
      } catch {}
      return;
    }

    if ((type === "response:mocked" || type === "response:bypass") && response) {
      await captureResponse(requestId, response, type === "response:mocked");
    }
  });

  _mswInstance = w;
} else if (isBrowser && isDisplayFrame) {
  // Display frame: intercept window.fetch directly (no service worker) so
  // worker.use() handlers take effect without triggering SW navigation failures.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const displayHandlers: any[] = [];
  const { getResponse } = await import("msw");
  const _origFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const response = await getResponse(displayHandlers, request);
    if (response) return response;
    return _origFetch(input, init);
  };

  // Clear handlers before each display render so stale handlers from a
  // previous test don't bleed into the next one.
  registerBeforeDisplayHook(() => {
    displayHandlers.length = 0;
  });

  _mswInstance = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    use(...handlers: any[]) {
      displayHandlers.push(...handlers);
    },
    resetHandlers() {
      displayHandlers.length = 0;
    },
  };
} else if (!isBrowser) {
  // Node environment. @vite-ignore stops Vite from bundling msw/node into the
  // browser output — this branch is dead code there.
  const { setupServer } = await import(/* @vite-ignore */ "msw/node");
  const server = setupServer();
  server.listen({ onUnhandledRequest: "bypass" });

  server.events.on("*", async (raw) => {
    const e = raw as { type: string; requestId?: string; request?: Request; response?: Response };
    const { type, requestId, request, response } = e;
    if (!requestId) return;

    if (type === "request:start" && request) {
      if (!currentTest) return;
      pending.set(requestId, {
        t0: Date.now(),
        method: request.method,
        url: request.url,
        test: currentTest,
      });
      try {
        const text = await request.clone().text();
        const p = pending.get(requestId);
        if (p && text) p.requestBody = text;
      } catch {}
      return;
    }

    if ((type === "response:mocked" || type === "response:bypass") && response) {
      await captureResponse(requestId, response, type === "response:mocked");
    }
  });

  _mswInstance = server;
}
// else: browser UI frame or display frame — no MSW needed

// Auto-reset per-test handlers so they don't leak between tests
registerAfterTestHook(() => _mswInstance?.resetHandlers());

// ─── Export for use in test files ────────────────────────────────────────────
// Tests call: worker.use(http.get(...))
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const worker: { use(...h: any[]): void; resetHandlers(): void } = _mswInstance ?? {
  use() {},
  resetHandlers() {},
};

// Register the Network tab in all browser frames.
// Using `load` means each frame imports the component itself (correct React instance).
if (isBrowser) {
  const { registerTab } = await import("@fieldtest/core");
  registerTab({
    id: "network",
    label: "Network",
    getCount: (test) => test.networkEntries.length || undefined,
    load: () => import("./NetworkTab").then((m) => m.NetworkTab),
  });
}
