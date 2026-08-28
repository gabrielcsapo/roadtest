import { Session } from "node:inspector/promises";
import type { Profiler } from "node:inspector";

export interface CpuMeasurement<T> {
  value: T;
  durationMs: number;
  startNs: bigint;
  endNs: bigint;
  profile: Profiler.Profile;
}

interface MeasurementHooks {
  onStart?: (startNs: bigint) => void;
  onEnd?: (endNs: bigint) => void;
}

/** Samples CPU only around test-file import/evaluation work. */
export class CpuImportProfiler {
  readonly #session = new Session();

  static async create(): Promise<CpuImportProfiler> {
    const profiler = new CpuImportProfiler();
    profiler.#session.connect();
    await profiler.#session.post("Profiler.enable");
    // Most test imports are only a few milliseconds. A 250µs interval provides
    // useful attribution without the much higher cost of precise instrumentation.
    await profiler.#session.post("Profiler.setSamplingInterval", { interval: 250 });
    return profiler;
  }

  async measure<T>(fn: () => Promise<T>, hooks: MeasurementHooks = {}): Promise<CpuMeasurement<T>> {
    await this.#session.post("Profiler.start");
    const startNs = process.hrtime.bigint();
    hooks.onStart?.(startNs);
    let value: T;
    try {
      value = await fn();
    } catch (error) {
      hooks.onEnd?.(process.hrtime.bigint());
      await this.#session.post("Profiler.stop").catch(() => undefined);
      throw error;
    }
    const endNs = process.hrtime.bigint();
    hooks.onEnd?.(endNs);
    const durationMs = Number(endNs - startNs) / 1_000_000;
    const { profile } = await this.#session.post("Profiler.stop");
    return { value, durationMs, startNs, endNs, profile };
  }

  async close(): Promise<void> {
    await this.#session.post("Profiler.disable").catch(() => undefined);
    this.#session.disconnect();
  }
}
