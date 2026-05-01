/**
 * @testing-library/react compatibility shim for roadtest vitest-compat mode.
 *
 * Re-exports everything from @testing-library/react, replacing render() with a
 * synchronous snapshot-capturing version so existing tests get visual output in
 * roadtest's UI without any code changes.
 *
 * Activated automatically when `--vitest-compat` is used (the node loader hook
 * redirects @testing-library/react imports in test files to roadtest/rtl) or
 * when `vitestCompat: true` is set in the roadtest Vite plugin.
 */

import type { ReactElement } from "react";
import { render as _rtlRender } from "@testing-library/react";
import { currentTest } from "./framework/store";
import { captureComponentTree } from "./framework/render";
import { inlineCSSClassStyles } from "./framework/inlineStyles";
import { registerAfterTestHook } from "./framework/hooks";
import type { Snapshot } from "./framework/types";

export * from "@testing-library/react";

let _container: HTMLElement | null = null;
let _lastSnap: Snapshot | null = null;

registerAfterTestHook(() => {
  if (_container && _lastSnap) {
    _lastSnap.html = inlineCSSClassStyles(_container);
    _lastSnap.componentTree = captureComponentTree(_container);
  }
  _lastSnap = null;
});

export function render(
  element: ReactElement,
  options?: Parameters<typeof _rtlRender>[1],
): ReturnType<typeof _rtlRender> {
  const result = _rtlRender(element, options);
  if (currentTest) {
    _container = result.container;
    const label =
      currentTest.snapshots.length === 0 ? "initial" : `render ${currentTest.snapshots.length + 1}`;
    const snap: Snapshot = {
      label,
      element,
      html: inlineCSSClassStyles(result.container),
      componentTree: captureComponentTree(result.container),
      timestamp: Date.now(),
      comparison: false,
    };
    currentTest.snapshots.push(snap);
    _lastSnap = snap;
  }
  return result;
}
