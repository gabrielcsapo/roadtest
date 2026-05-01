// ─── Spy protocol ─────────────────────────────────────────────────────────────

/** Minimal shape shared by all spy objects — createMockFn() and module-mock wrappers alike. */
export interface SpyProtocol {
  _isSpy: true;
  _spyCalls: SpyCall[];
}

/** Call record stored on every spy invocation. */
export interface SpyCall {
  args: unknown[];
  result: unknown;
  threw: boolean;
}

/** Type guard: true for any function carrying the roadtest spy sentinel. */
export function isMockFn(v: unknown): v is SpyProtocol {
  return typeof v === "function" && (v as { _isSpy?: unknown })._isSpy === true;
}

// ─── Mock function types ──────────────────────────────────────────────────────

/** @deprecated Use SpyCall instead. */
export type MockFnCall = SpyCall;

interface OnceItem {
  type: "return" | "impl" | "resolved" | "rejected";
  value: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MockFn<T extends (...args: any[]) => any = (...args: any[]) => any> = T &
  SpyProtocol & {
    _isSpyOnFn?: true;
    _spyOnOriginal?: unknown;
    _spyOnObject?: object;
    _spyOnMethod?: string;

    mock: {
      calls: Parameters<T>[];
      results: Array<{ type: "return" | "throw"; value: unknown }>;
      instances: unknown[];
    };

    mockReturnValue(val: ReturnType<T>): MockFn<T>;
    mockReturnValueOnce(val: ReturnType<T>): MockFn<T>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockImplementation(fn: (...args: any[]) => any): MockFn<T>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockImplementationOnce(fn: (...args: any[]) => any): MockFn<T>;
    mockResolvedValue(val: unknown): MockFn<T>;
    mockRejectedValue(val: unknown): MockFn<T>;
    mockResolvedValueOnce(val: unknown): MockFn<T>;
    mockRejectedValueOnce(val: unknown): MockFn<T>;
    mockReturnThis(): MockFn<T>;
    mockClear(): MockFn<T>;
    mockReset(): MockFn<T>;
    mockRestore(): MockFn<T>;
    mockName(name: string): MockFn<T>;
    getMockName(): string;
  };

// ─── Global spy registry ──────────────────────────────────────────────────────

const _spyRegistry = new Set<MockFn>();

export function getAllSpies(): Set<MockFn> {
  return _spyRegistry;
}

// ─── Mock function factory ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMockFn<T extends (...args: any[]) => any>(impl?: T): MockFn<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let _impl: ((...args: any[]) => any) | undefined = impl;
  let _defaultReturn: { value: unknown } | undefined;
  const _onceQueue: OnceItem[] = [];
  let _mockName = "fn";

  const calls: Parameters<T>[] = [];
  const results: Array<{ type: "return" | "throw"; value: unknown }> = [];
  const instances: unknown[] = [];
  const _spyCalls: MockFnCall[] = [];

  const spy = function (this: unknown, ...args: unknown[]): unknown {
    instances.push(this);
    calls.push(args as Parameters<T>);

    const once = _onceQueue.shift();
    let result: unknown;
    let threw = false;

    try {
      if (once) {
        if (once.type === "return") {
          result = once.value;
        } else if (once.type === "resolved") {
          result = Promise.resolve(once.value);
        } else if (once.type === "rejected") {
          result = Promise.reject(once.value);
        } else if (once.type === "impl") {
          result = (once.value as (...a: unknown[]) => unknown).apply(this, args);
        }
      } else if (_defaultReturn !== undefined) {
        result = _defaultReturn.value;
      } else if (_impl) {
        result = _impl.apply(this, args);
      }

      _spyCalls.push({ args, result, threw: false });
      results.push({ type: "return", value: result });
    } catch (err) {
      threw = true;
      _spyCalls.push({ args, result: err, threw: true });
      results.push({ type: "throw", value: err });
      throw err;
    }

    void threw; // suppress unused warning — kept for clarity
    return result;
  } as unknown as MockFn<T>;

  Object.defineProperty(spy, "name", { value: _mockName, configurable: true });

  spy._isSpy = true;
  spy._spyCalls = _spyCalls;
  spy.mock = { calls, results, instances };

  spy.mockReturnValue = (val: ReturnType<T>) => {
    _defaultReturn = { value: val };
    _impl = undefined;
    return spy;
  };

  spy.mockReturnValueOnce = (val: ReturnType<T>) => {
    _onceQueue.push({ type: "return", value: val });
    return spy;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spy.mockImplementation = (fn: (...args: any[]) => any) => {
    _impl = fn;
    _defaultReturn = undefined;
    return spy;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spy.mockImplementationOnce = (fn: (...args: any[]) => any) => {
    _onceQueue.push({ type: "impl", value: fn });
    return spy;
  };

  spy.mockResolvedValue = (val: unknown) => {
    _impl = () => Promise.resolve(val);
    _defaultReturn = undefined;
    return spy;
  };

  spy.mockRejectedValue = (val: unknown) => {
    _impl = () => Promise.reject(val);
    _defaultReturn = undefined;
    return spy;
  };

  spy.mockResolvedValueOnce = (val: unknown) => {
    _onceQueue.push({ type: "resolved", value: val });
    return spy;
  };

  spy.mockRejectedValueOnce = (val: unknown) => {
    _onceQueue.push({ type: "rejected", value: val });
    return spy;
  };

  spy.mockReturnThis = () => {
    _impl = function (this: unknown) {
      return this;
    };
    _defaultReturn = undefined;
    return spy;
  };

  spy.mockClear = () => {
    calls.length = 0;
    results.length = 0;
    instances.length = 0;
    _spyCalls.length = 0;
    return spy;
  };

  spy.mockReset = () => {
    spy.mockClear();
    _impl = undefined;
    _defaultReturn = undefined;
    _onceQueue.length = 0;
    return spy;
  };

  spy.mockRestore = () => {
    if (spy._isSpyOnFn && spy._spyOnObject && spy._spyOnMethod != null) {
      (spy._spyOnObject as Record<string, unknown>)[spy._spyOnMethod] = spy._spyOnOriginal;
    }
    return spy;
  };

  spy.mockName = (name: string) => {
    _mockName = name;
    Object.defineProperty(spy, "name", { value: name, configurable: true });
    return spy;
  };

  spy.getMockName = () => _mockName;

  _spyRegistry.add(spy as unknown as MockFn);

  return spy;
}

// ─── spyOn ────────────────────────────────────────────────────────────────────

export function spyOn<T extends object, K extends keyof T>(
  obj: T,
  method: K,
  accessType?: "get" | "set",
): MockFn {
  if (accessType) {
    const descriptor = Object.getOwnPropertyDescriptor(obj, method) ?? {};
    const original = descriptor[accessType as keyof PropertyDescriptor];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = createMockFn(original as (...args: any[]) => any);
    spy._isSpyOnFn = true;
    spy._spyOnObject = obj;
    spy._spyOnMethod = String(method);
    spy._spyOnOriginal = original;
    Object.defineProperty(obj, method, {
      ...descriptor,
      [accessType]: spy,
      configurable: true,
    });
    return spy;
  }

  const original = obj[method];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spy = createMockFn(
    typeof original === "function" ? (original as (...args: any[]) => any) : undefined,
  );
  spy._isSpyOnFn = true;
  spy._spyOnObject = obj;
  spy._spyOnMethod = String(method);
  spy._spyOnOriginal = original;
  (obj as Record<string, unknown>)[String(method)] = spy;
  return spy;
}

// ─── Fake timers ──────────────────────────────────────────────────────────────

interface FakeTimer {
  id: number;
  type: "timeout" | "interval";
  delay: number;
  callback: (...args: unknown[]) => void;
  nextTick: number;
  active: boolean;
}

class FakeClock {
  private _currentTime = Date.now();
  private _timers: FakeTimer[] = [];
  private _nextId = 1;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _originals: Record<string, any> = {};
  private _active = false;

  install(config?: { now?: number | Date; toFake?: string[] }): void {
    if (this._active) return;
    const now = config?.now;
    this._currentTime =
      now instanceof Date ? now.getTime() : typeof now === "number" ? now : Date.now();
    this._active = true;

    this._originals = {
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
      setInterval: globalThis.setInterval,
      clearInterval: globalThis.clearInterval,
      Date: globalThis.Date,
    };

    const self = this;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).setTimeout = (
      fn: (...args: unknown[]) => void,
      delay = 0,
      ...args: unknown[]
    ) => {
      const id = self._nextId++;
      self._timers.push({
        id,
        type: "timeout",
        delay,
        callback: () => fn(...args),
        nextTick: self._currentTime + delay,
        active: true,
      });
      return id;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).clearTimeout = (id: number) => {
      const t = self._timers.find((t) => t.id === id);
      if (t) t.active = false;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).setInterval = (
      fn: (...args: unknown[]) => void,
      delay = 0,
      ...args: unknown[]
    ) => {
      const id = self._nextId++;
      self._timers.push({
        id,
        type: "interval",
        delay,
        callback: () => fn(...args),
        nextTick: self._currentTime + delay,
        active: true,
      });
      return id;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).clearInterval = (id: number) => {
      const t = self._timers.find((t) => t.id === id);
      if (t) t.active = false;
    };

    const OrigDate = this._originals.Date as typeof Date;
    const FakeDate = class extends OrigDate {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(self._currentTime);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          super(...(args as ConstructorParameters<typeof Date>));
        }
      }
      static now() {
        return self._currentTime;
      }
      static parse = OrigDate.parse;
      static UTC = OrigDate.UTC;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).Date = FakeDate;
  }

  uninstall(): void {
    if (!this._active) return;
    this._active = false;
    Object.assign(globalThis, this._originals);
    this._timers = [];
    this._originals = {};
  }

  tick(ms: number): void {
    const target = this._currentTime + ms;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const pending = this._timers
        .filter((t) => t.active && t.nextTick <= target)
        .sort((a, b) => a.nextTick - b.nextTick);
      if (pending.length === 0) break;
      const t = pending[0];
      this._currentTime = t.nextTick;
      if (t.type === "timeout") {
        t.active = false;
        t.callback();
      } else {
        t.nextTick += t.delay;
        t.callback();
      }
    }
    this._currentTime = target;
  }

  runAll(maxIterations = 10_000): void {
    for (let i = 0; i < maxIterations; i++) {
      const pending = this._timers.filter((t) => t.active);
      if (pending.length === 0) break;
      const next = pending.sort((a, b) => a.nextTick - b.nextTick)[0];
      this._currentTime = next.nextTick;
      if (next.type === "timeout") {
        next.active = false;
        next.callback();
      } else {
        next.nextTick += next.delay;
        next.callback();
      }
    }
  }

  setSystemTime(time: number | Date): void {
    this._currentTime = typeof time === "number" ? time : time.getTime();
  }

  getRealSystemTime(): number {
    const OrigDate = this._originals.Date as typeof Date | undefined;
    return OrigDate ? OrigDate.now() : Date.now();
  }

  clearAllTimers(): void {
    this._timers.forEach((t) => {
      t.active = false;
    });
  }

  isActive(): boolean {
    return this._active;
  }
}

export const fakeClock = new FakeClock();
