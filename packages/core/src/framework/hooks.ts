type Hook = () => void | Promise<void>;

const afterTestHooks: Hook[] = [];

export function registerAfterTestHook(fn: Hook) {
  afterTestHooks.push(fn);
}

export async function runAfterTestHooks() {
  for (const fn of afterTestHooks) {
    try {
      await fn();
    } catch {
      /* don't let hook failures break test runner */
    }
  }
}

// ─── Display lifecycle hooks ──────────────────────────────────────────────────
// These run in the display frame around each showTest() call.
// beforeDisplay hooks are awaited before test.fn() runs, so setup is guaranteed
// to be in place before the component renders (fetch mocking, data seeding, etc.).

const beforeDisplayHooks: Hook[] = [];
const afterDisplayHooks: Hook[] = [];

export function registerBeforeDisplayHook(fn: Hook) {
  beforeDisplayHooks.push(fn);
}

export function registerAfterDisplayHook(fn: Hook) {
  afterDisplayHooks.push(fn);
}

export async function runBeforeDisplayHooks() {
  for (const fn of beforeDisplayHooks) {
    try {
      await fn();
    } catch {
      /* don't let hook failures block render */
    }
  }
}

export async function runAfterDisplayHooks() {
  for (const fn of afterDisplayHooks) {
    try {
      await fn();
    } catch {
      /* don't let hook failures break display frame */
    }
  }
}
