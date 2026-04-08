import { createContext, useContext, type RefObject } from "react";
import type { StoreState } from "../framework/types";
import type { Store } from "../framework/store";

export interface SandboxApi {
  store: Store;
  runAll: () => Promise<void>;
  runSuite: (id: string) => Promise<void>;
  runTest: (suiteId: string, testId: string) => Promise<void>;
}

export interface AppContextValue {
  state: StoreState;
  apiRef: RefObject<SandboxApi | null>;
  sandboxReady: boolean;
}

const EMPTY_STATE: StoreState = {
  suites: [],
  running: false,
  lastRunAt: null,
  coverage: null,
  runProgress: null,
};

export const AppContext = createContext<AppContextValue>({
  state: EMPTY_STATE,
  apiRef: { current: null },
  sandboxReady: false,
});

export function useApp() {
  return useContext(AppContext);
}
