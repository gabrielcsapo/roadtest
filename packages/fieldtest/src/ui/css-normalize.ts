/**
 * Browser-based HTML/CSS normalization helpers shared between the snapshot
 * comparison logic (snapshots.ts) and the visual diff UI (Preview.tsx).
 *
 * All functions require a browser DOM environment (document, DOMParser).
 */

/**
 * Round-trip all inline `style` attributes through the browser's CSS parser so
 * that value representations (hex vs rgb, shorthand vs longhand, property order)
 * are canonicalized. Attributes are also sorted alphabetically to eliminate
 * happy-dom vs browser ordering differences.
 *
 * Known happy-dom quirks fixed before the round-trip:
 *   - `border: none none` (invalid) → `border: none`
 */
export function normalizeHtmlStyles(html: string): string {
  const host = document.createElement("div");
  host.style.display = "none";
  host.innerHTML = html;
  document.body.appendChild(host);
  try {
    host.querySelectorAll<HTMLElement>("*").forEach((el) => {
      // 1. Normalize inline styles via browser CSS parser, sort alphabetically,
      //    strip properties whose computed value is "initial" (noise from shorthand
      //    expansion, e.g. `border: none` → 15+ `border-*: initial` longhands).
      const rawStyle = el.getAttribute("style");
      if (rawStyle) {
        // happy-dom serializes `border: none` as `border: none none` (invalid CSS).
        // The browser silently rejects the invalid shorthand, so fix it first.
        const sanitized = rawStyle.replace(/\b(border[^:]*):(\s*none)(\s+none)+/g, "$1:$2");
        el.style.cssText = sanitized;
        const normalized = [...el.style]
          .filter((p) => el.style.getPropertyValue(p) !== "initial")
          .sort()
          .map((p) => `${p}: ${el.style.getPropertyValue(p)}`)
          .join("; ");
        if (normalized) {
          el.setAttribute("style", normalized);
        } else {
          el.removeAttribute("style");
        }
      }

      // 2. Sort all attributes alphabetically so serialization-order differences
      //    (happy-dom vs browser) don't produce spurious diffs.
      const attrs = [...el.attributes]
        .map((a) => ({ name: a.name, value: a.value }))
        .sort((a, b) => a.name.localeCompare(b.name));
      while (el.attributes.length > 0) el.removeAttribute(el.attributes[0].name);
      attrs.forEach(({ name, value }) => el.setAttribute(name, value));
    });

    // 3. Normalize text nodes: remove whitespace-only ones (indentation/newlines
    //    between elements from pretty-printed HTML) and trim leading/trailing
    //    whitespace from content nodes so node vs browser formatting differences
    //    don't produce spurious diffs.
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    const whitespaceNodes: Node[] = [];
    let textNode: Node | null;
    while ((textNode = walker.nextNode())) {
      const trimmed = textNode.textContent?.trim() ?? "";
      if (!trimmed) {
        whitespaceNodes.push(textNode);
      } else {
        textNode.textContent = trimmed;
      }
    }
    whitespaceNodes.forEach((n) => n.parentNode?.removeChild(n));

    return host.innerHTML;
  } finally {
    document.body.removeChild(host);
  }
}

/**
 * If exactly one side has a passthrough wrapper div (only `style="...inherit..."`
 * attributes, no other attributes), strip it so both sides start from the same
 * content root. Handles the `.fieldtest/preview.tsx` wrapper that appears in
 * browser renders but not in node/happy-dom captures.
 */
export function stripMismatchedWrapper(
  baseHtml: string,
  currHtml: string,
): { base: string; curr: string } {
  const parser = new DOMParser();
  const parseRoots = (h: string) => {
    const d = parser.parseFromString(`<div>${h}</div>`, "text/html");
    return [...(d.body.firstChild as Element).childNodes].filter(
      (n) =>
        n.nodeType === Node.ELEMENT_NODE ||
        (n.nodeType === Node.TEXT_NODE && n.textContent?.trim()),
    );
  };

  const isPassthroughWrapper = (h: string): Element | null => {
    const roots = parseRoots(h);
    if (roots.length !== 1) return null;
    const sole = roots[0] as Element;
    if (sole.tagName !== "DIV") return null;
    if ([...sole.attributes].some((a) => a.name !== "style")) return null;
    const style = sole.getAttribute("style") ?? "";
    if (style && !/^[\w-]+:\s*inherit(;\s*[\w-]+:\s*inherit)*;?$/.test(style)) return null;
    return sole;
  };

  const currWrapper = isPassthroughWrapper(currHtml);
  const baseWrapper = isPassthroughWrapper(baseHtml);

  if (currWrapper && !baseWrapper) return { base: baseHtml, curr: currWrapper.innerHTML };
  if (baseWrapper && !currWrapper) return { base: baseWrapper.innerHTML, curr: currHtml };

  return { base: baseHtml, curr: currHtml };
}

/**
 * Normalize both sides and return whether they are semantically equivalent.
 * This is the canonical equality check for snapshot comparison.
 */
export function snapshotsAreEquivalent(storedHtml: string, currentHtml: string): boolean {
  const normStored = normalizeHtmlStyles(storedHtml);
  const normCurrent = normalizeHtmlStyles(currentHtml);
  const { base, curr } = stripMismatchedWrapper(normStored, normCurrent);
  return base === curr;
}
