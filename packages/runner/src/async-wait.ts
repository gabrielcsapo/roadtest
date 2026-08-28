import { createHook } from "node:async_hooks";
import type { AsyncResourceInterval } from "./import-profile.js";

interface PendingResource {
  type: string;
  startNs: bigint;
  endNs?: bigint;
}

/** Records concrete async-resource lifetimes created while a module import is active. */
export class AsyncWaitTracker {
  readonly #resources = new Map<number, PendingResource>();
  #active = false;
  readonly #hook = createHook({
    init: (asyncId, type) => {
      if (!this.#active) return;
      this.#resources.set(asyncId, { type, startNs: process.hrtime.bigint() });
    },
    destroy: (asyncId) => this.#finish(asyncId),
    promiseResolve: (asyncId) => this.#finish(asyncId),
  });

  constructor() {
    this.#hook.enable();
  }

  start(startNs = process.hrtime.bigint()): bigint {
    this.#resources.clear();
    this.#active = true;
    return startNs;
  }

  stop(endNs = process.hrtime.bigint()): AsyncResourceInterval[] {
    this.#active = false;
    const intervals: AsyncResourceInterval[] = [];
    for (const resource of this.#resources.values()) {
      const intervalEnd = resource.endNs && resource.endNs < endNs ? resource.endNs : endNs;
      if (intervalEnd > resource.startNs) {
        intervals.push({ type: resource.type, startNs: resource.startNs, endNs: intervalEnd });
      }
    }
    this.#resources.clear();
    return intervals;
  }

  close(): void {
    this.#active = false;
    this.#resources.clear();
    this.#hook.disable();
  }

  #finish(asyncId: number): void {
    const resource = this.#resources.get(asyncId);
    if (resource && resource.endNs === undefined) resource.endNs = process.hrtime.bigint();
  }
}
