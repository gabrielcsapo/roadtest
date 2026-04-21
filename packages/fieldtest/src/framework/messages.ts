import type { TestSuite } from "./types";

// ─── window.postMessage types (frame → frame) ─────────────────────────────────

export type SandboxMessage = { type: "__vt_ready" } | { type: "__vt_display_ready" };

export function postParentMessage(msg: SandboxMessage): void {
  window.parent?.postMessage(msg, "*");
}

/**
 * Subscribe to a specific sandbox message type on window.
 * Returns an unlisten function — call it to remove the listener.
 */
export function onSandboxMessage<T extends SandboxMessage["type"]>(
  type: T,
  handler: (e: MessageEvent<Extract<SandboxMessage, { type: T }>>) => void,
): () => void {
  const listener = (e: MessageEvent<unknown>) => {
    if ((e.data as SandboxMessage | null)?.type === type) {
      handler(e as MessageEvent<Extract<SandboxMessage, { type: T }>>);
    }
  };
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}

// ─── Vite HMR types (browser ↔ Vite dev server) ──────────────────────────────

export type HmrClientMessage = {
  event: "vt:run-node-test";
  data: { path: string };
};

export type HmrServerMessage = {
  event: "vt:node-results";
  data: { suites: TestSuite[] };
};

/** Send a typed message to the Vite dev server via HMR websocket. */
export function sendHmrMessage(msg: HmrClientMessage): void {
  // import.meta.hot is injected by Vite in dev mode only
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (import.meta as any).hot?.send(msg.event, msg.data);
}

/**
 * Subscribe to a typed message from the Vite dev server.
 * Returns an unlisten function — call it to remove the listener.
 */
export function onHmrMessage<T extends HmrServerMessage["event"]>(
  event: T,
  handler: (data: Extract<HmrServerMessage, { event: T }>["data"]) => void,
): () => void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (import.meta as any).hot?.on(event, handler);
  return () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (import.meta as any).hot?.off(event, handler);
  };
}
