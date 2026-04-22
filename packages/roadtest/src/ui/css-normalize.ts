/**
 * Thin re-exports of the shared DOM serializer, kept under this name so the
 * UI layer's call sites (Preview.tsx, snapshots.ts) don't churn. The actual
 * implementation lives in `../shared/serializeDom` and is identical in the
 * browser and the Node runner.
 */

import {
  serializeDom,
  stripPassthroughWrapper,
  snapshotsAreEquivalent as sharedSnapshotsAreEquivalent,
} from "../shared/serializeDom";

/** Canonicalize an HTML string. Output is stable across Node/browser/Node-version. */
export function normalizeHtmlStyles(html: string): string {
  return serializeDom(html);
}

/** Strip a `style: inherit`-only passthrough wrapper div from whichever side has it. */
export function stripMismatchedWrapper(
  baseHtml: string,
  currHtml: string,
): { base: string; curr: string } {
  return stripPassthroughWrapper(baseHtml, currHtml);
}

/** Canonical snapshot equality check. */
export const snapshotsAreEquivalent = sharedSnapshotsAreEquivalent;
