import { store } from "./store";
import { sendHmrMessage } from "./messages";
import type { TestSuite } from "./types";

/**
 * Called in the browser sandbox by the stub module emitted for node test files.
 * Registers a pending placeholder in the store so the UI shows the file immediately,
 * then asks the Vite dev server to run the file in Node and push back results.
 */
export function __vtRegisterNodeTest(path: string): void {
  store.addSuite({
    id: `node:${path}`,
    name: path,
    tests: [],
    status: "pending",
    sourceFile: path,
    runtime: "node",
  } as TestSuite);

  sendHmrMessage({ event: "vt:run-node-test", data: { path } });
}
