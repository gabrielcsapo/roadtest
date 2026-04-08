import { type ReactElement, type ComponentType, createElement } from "react";
import { currentTest } from "./store";
import { registerAfterTestHook } from "./hooks";
import type { Snapshot } from "./types";

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
    _lastRenderSnapshot.html = _currentContainer.innerHTML;
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

/** Sentinel thrown by render() in display mode to stop further test execution */
const DISPLAY_STOP = "__vtDisplayStop";

export async function render(element: ReactElement) {
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
      html: result.container.innerHTML,
      timestamp: Date.now(),
    };
    currentTest.snapshots.push(snap);
    _lastRenderSnapshot = snap;
  }

  if (_stopAfterFirstRender) {
    const sentinel = Object.assign(new Error(DISPLAY_STOP), { [DISPLAY_STOP]: true });
    throw sentinel;
  }

  return result;
}

export async function snapshot(label?: string) {
  if (!currentTest || !_currentContainer) return;
  const frameLabel = label ?? `step ${currentTest.snapshots.length}`;
  const lastElement = currentTest.snapshots.at(-1)?.element;
  if (!lastElement) return;
  currentTest.snapshots.push({
    label: frameLabel,
    element: lastElement,
    html: _currentContainer.innerHTML,
    timestamp: Date.now(),
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
  };
}

export const fireEvent = _fireEvent as AsyncFireEvent;

export async function act(fn: () => void | Promise<void>) {
  const { act: tlAct } = await getTL();
  return tlAct(fn);
}
