import { useState, useEffect, useRef, type RefObject } from "react";
import type { StoreState } from "../../framework/types";
import { onSandboxMessage } from "../../framework/messages";
import type { SandboxApi } from "../context";

const EMPTY_STATE: StoreState = {
  suites: [],
  running: false,
  lastRunAt: null,
  coverage: null,
  runProgress: null,
};

export interface SandboxBridge {
  state: StoreState;
  apiRef: RefObject<SandboxApi | null>;
  sandboxReady: boolean;
  devServerAvailable: boolean;
}

/**
 * Manages the postMessage handshake with the sandbox iframe and subscribes
 * to its store. Returns the current store state, a stable ref to the sandbox
 * API, and a ready flag.
 *
 * Extracted from AppShell so the communication logic can be tested in
 * isolation without rendering the full component tree.
 */
export function useSandboxBridge(sandboxRef: RefObject<HTMLIFrameElement | null>): SandboxBridge {
  const apiRef = useRef<SandboxApi | null>(null);
  const [state, setState] = useState<StoreState>(EMPTY_STATE);
  const [sandboxReady, setSandboxReady] = useState(false);
  const [devServerAvailable, setDevServerAvailable] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    const unlisten = onSandboxMessage("__vt_ready", () => {
      const win = sandboxRef.current?.contentWindow as Record<string, unknown> | null | undefined;
      const api = win?.["__roadtest"] as SandboxApi | undefined;
      if (!api) return;
      apiRef.current = api;
      setState(api.store.getState());
      unsub = api.store.subscribe((s) => setState(s));
      setDevServerAvailable(api.devServerAvailable ?? false);
      setSandboxReady(true);
    });
    return () => {
      unlisten();
      unsub?.();
    };
  }, [sandboxRef]);

  return { state, apiRef, sandboxReady, devServerAvailable };
}
