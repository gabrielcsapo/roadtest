import { type ReactElement, type ComponentType, createElement } from "react";
import { currentTest, store } from "./store";
import { registerAfterTestHook } from "./hooks";
import type { ComponentNode, Snapshot } from "./types";
import { captureProps } from "./traceUtils";
import { inlineCSSClassStyles } from "./inlineStyles";

/** Returns the first HostComponent (tag 5) DOM node in a fiber subtree */
function getFirstHostNode(fiber: any): HTMLElement | null {
  if (!fiber) return null;
  if (fiber.tag === 5 && fiber.stateNode instanceof HTMLElement) return fiber.stateNode;
  return getFirstHostNode(fiber.child);
}

/** Computes child-index path from root to node, or undefined if node isn't a descendant */
function getDomPath(node: HTMLElement, root: HTMLElement): number[] | undefined {
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

export function captureComponentTree(container: HTMLElement): ComponentNode[] {
  // Use getOwnPropertyNames to include non-enumerable properties — React 18 may set
  // __reactContainer$ as non-enumerable depending on the build/version.
  const keys = Object.getOwnPropertyNames(container);

  // React 18 createRoot sets __reactContainer$ on the root container element.
  const containerKey = keys.find((k) => k.startsWith("__reactContainer$"));
  if (containerKey) {
    const results: ComponentNode[] = [];
    walkFiber((container as any)[containerKey]?.child, 0, results, container);
    return results;
  }

  // Fallback: __reactFiber$ for non-root elements
  const fiberKey = keys.find((k) => k.startsWith("__reactFiber$"));
  if (fiberKey) {
    const results: ComponentNode[] = [];
    walkFiber((container as any)[fiberKey]?.child, 0, results, container);
    return results;
  }

  return [];
}

function walkFiber(fiber: any, depth: number, results: ComponentNode[], container: HTMLElement) {
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
      inner.displayName || inner.render?.name || inner.type?.name || inner.type?.displayName || "";
  }
  const isComponent = !!name && name !== "Anonymous";
  if (isComponent) {
    const hostNode = getFirstHostNode(fiber);
    const domPath = hostNode ? getDomPath(hostNode, container) : undefined;
    results.push({
      name,
      depth,
      key: fiber.key ?? null,
      isForwardRef,
      isMemo,
      domPath,
      props: captureProps(fiber),
    });
  }
  walkFiber(fiber.child, isComponent ? depth + 1 : depth, results, container);
  walkFiber(fiber.sibling, depth, results, container);
}

type Wrapper = ComponentType<{ children: React.ReactNode }>;

let _wrapper: Wrapper | null = null;
export function setWrapper(w: Wrapper) {
  _wrapper = w;
}

/** Cached module reference — import once, call render() fresh each time */
let _mod: typeof import("@testing-library/react") | null = null;

async function getTL() {
  if (!_mod) _mod = await import("@testing-library/react");
  return _mod;
}

/** The container from the most recent render() — used by snapshot() */
let _currentContainer: HTMLElement | null = null;

/**
 * Reference to the snapshot created by the most recent render() call.
 * After the test body finishes, the after-test hook updates its html to the
 * current DOM state so async components (e.g. those that fetch data) are
 * captured in their final rendered state rather than their loading state.
 */
let _lastRenderSnapshot: Snapshot | null = null;

registerAfterTestHook(() => {
  if (_currentContainer && _lastRenderSnapshot) {
    _lastRenderSnapshot.html = inlineCSSClassStyles(_currentContainer);
    _lastRenderSnapshot.componentTree = captureComponentTree(_currentContainer);
  }
  _lastRenderSnapshot = null;
});

/**
 * When set, all render() calls target this element instead of creating a new
 * container in document.body. Used by the display frame to render into its
 * dedicated display root.
 */
let _renderTarget: HTMLElement | null = null;
export function setRenderTarget(el: HTMLElement | null) {
  _renderTarget = el;
}

/**
 * When true, render() throws a sentinel after the first render so that test
 * interactions (fireEvent, assertions) don't execute in display mode — only
 * the initial component render happens.
 */
let _stopAfterFirstRender = false;
export function setStopAfterFirstRender(v: boolean) {
  _stopAfterFirstRender = v;
}

/**
 * When > 0, render() and fireEvent calls pause for this many ms so the user
 * can watch the test play out step-by-step in the display frame.
 */
let _playDelay = 0;
export function setPlayDelay(ms: number) {
  _playDelay = ms;
}

/** Sentinel thrown by render() in display mode to stop further test execution */
const DISPLAY_STOP = "__vtDisplayStop";

export async function render(
  element: ReactElement,
): Promise<Awaited<ReturnType<typeof import("@testing-library/react").render>>> {
  const wrapped = _wrapper ? createElement(_wrapper, null, element) : element;

  const { render: tlRender } = await getTL();

  const container: HTMLElement =
    _renderTarget ??
    (() => {
      const div = document.createElement("div");
      document.body.appendChild(div);
      return div;
    })();

  const result = tlRender(wrapped, { container, baseElement: container });

  if (currentTest) {
    _currentContainer = result.container;
    const label =
      currentTest.snapshots.length === 0 ? "initial" : `render ${currentTest.snapshots.length + 1}`;
    const snap: Snapshot = {
      label,
      element: wrapped,
      html: inlineCSSClassStyles(result.container),
      componentTree: captureComponentTree(result.container),
      timestamp: Date.now(),
      comparison: false, // preview-only; not compared against baselines
    };
    currentTest.snapshots.push(snap);
    _lastRenderSnapshot = snap;
  }

  if (_stopAfterFirstRender) {
    const sentinel = Object.assign(new Error(DISPLAY_STOP), { [DISPLAY_STOP]: true });
    throw sentinel;
  }

  if (_playDelay > 0) {
    await new Promise((resolve) => setTimeout(resolve, _playDelay));
  }

  return result;
}

/**
 * Capture the current DOM state as a named filmstrip frame.
 * These are shown in the snapshot timeline but are NOT compared against
 * baselines — use expect(el).toMatchSnapshot() for baseline assertions.
 */
export async function snapshot(label?: string) {
  if (!currentTest || !_currentContainer) return;
  const snapLabel = label ?? `step ${currentTest.snapshots.length}`;
  const lastElement = currentTest.snapshots[currentTest.snapshots.length - 1]?.element;
  if (!lastElement) return;
  currentTest.snapshots.push({
    label: snapLabel,
    element: lastElement,
    html: inlineCSSClassStyles(_currentContainer),
    timestamp: Date.now(),
    comparison: false, // filmstrip only
  });
}

/**
 * Capture a snapshot assertion for the given element (or the current container
 * if no element is provided) and record it as a baseline-compared assertion.
 * Called internally by expect(el).toMatchSnapshot().
 */
export function captureSnapshotAssertion(label: string, html: string) {
  if (!currentTest) return;
  const lastElement = currentTest.snapshots[currentTest.snapshots.length - 1]?.element;
  if (lastElement) {
    currentTest.snapshots.push({
      label,
      element: lastElement,
      html,
      timestamp: Date.now(),
      comparison: true,
    });
  }
  const suite = store.getState().suites.find((s) => s.id === currentTest!.suiteId);
  currentTest.assertions.push({
    label: `toMatchSnapshot("${label}")`,
    status: "pass",
    snapshot: {
      label,
      html,
      sourceFile: suite?.sourceFile,
      suiteName: suite?.name,
      testName: currentTest.name,
    },
  });
}

type TLFireEvent = typeof import("@testing-library/react").fireEvent;
type AsyncFireEvent = {
  (element: Element | Node | Document | Window, event: Event): Promise<boolean>;
} & {
  [K in keyof TLFireEvent]: TLFireEvent[K] extends (el: infer E, init?: infer I) => boolean
    ? (el: E, init?: I) => Promise<boolean>
    : never;
};

async function _fireEvent(element: Element | Node | Document | Window, event: Event) {
  const { fireEvent: fe } = await getTL();
  return fe(element, event);
}

const eventMethods = [
  "click",
  "dblClick",
  "change",
  "input",
  "submit",
  "focus",
  "blur",
  "keyDown",
  "keyUp",
  "keyPress",
  "mouseDown",
  "mouseUp",
  "mouseEnter",
  "mouseLeave",
  "mouseOver",
  "mouseOut",
  "scroll",
  "contextMenu",
] as const;

for (const method of eventMethods) {
  (_fireEvent as unknown as Record<string, unknown>)[method] = async (
    element: Element,
    eventProperties?: object,
  ) => {
    const { fireEvent: fe, act: tlAct } = await getTL();
    await tlAct(async () => {
      (fe[method] as (el: Element, props?: object) => boolean)(element, eventProperties);
    });
    if (_playDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, _playDelay));
    }
  };
}

export const fireEvent = _fireEvent as AsyncFireEvent;

export async function act(fn: () => void | Promise<void>) {
  const { act: tlAct } = await getTL();
  return tlAct(fn);
}
