/**
 * Inlines styles from document.styleSheets onto a cloned DOM subtree so that
 * snapshot HTML captures the effect of CSS classes, not just inline style attrs.
 *
 * Only modifies elements that have at least one CSS class. Respects !important:
 * a CSS rule with !important overrides a non-!important inline style (matching
 * real cascade behavior), but a plain CSS rule cannot override an inline style.
 */

interface CSSProp {
  prop: string;
  value: string;
  important: boolean;
}

function getMatchingCSSProps(el: Element): CSSProp[] {
  const result: CSSProp[] = [];
  try {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (!(rule instanceof CSSStyleRule)) continue;
          // Skip pseudo-element selectors — they don't map to real elements.
          if (rule.selectorText.includes("::")) continue;
          try {
            if (el.matches(rule.selectorText)) {
              const style = rule.style;
              for (let i = 0; i < style.length; i++) {
                const prop = style[i];
                result.push({
                  prop,
                  value: style.getPropertyValue(prop),
                  important: style.getPropertyPriority(prop) === "important",
                });
              }
            }
          } catch {
            // Invalid or complex selector that can't be evaluated — skip.
          }
        }
      } catch {
        // Cross-origin stylesheet — skip.
      }
    }
  } catch {}
  return result;
}

/**
 * Returns a serialized innerHTML of root with CSS class-derived styles inlined
 * on each descendant. Safe to call in any environment — falls back to plain
 * innerHTML when document.styleSheets is unavailable (e.g. Node/happy-dom).
 */
export function inlineCSSClassStyles(root: HTMLElement): string {
  if (typeof document === "undefined" || !document.styleSheets?.length) {
    return root.innerHTML;
  }

  const clone = root.cloneNode(true) as HTMLElement;
  const originals = [root, ...Array.from(root.querySelectorAll("*"))] as Element[];
  const cloned = [clone, ...Array.from(clone.querySelectorAll("*"))] as HTMLElement[];

  for (let i = 0; i < originals.length; i++) {
    const original = originals[i];
    const cloneEl = cloned[i];
    if (!original.className || !(cloneEl instanceof HTMLElement)) continue;

    const cssProps = getMatchingCSSProps(original);
    if (!cssProps.length) continue;

    for (const { prop, value, important } of cssProps) {
      const inlineValue = cloneEl.style.getPropertyValue(prop);
      const inlineImportant = cloneEl.style.getPropertyPriority(prop) === "important";

      // Apply the CSS rule if:
      //   - CSS is !important and inline is not → CSS wins (cascade rule)
      //   - No inline value is set → CSS applies
      // Do not apply if inline is !important and CSS is not.
      if (important && !inlineImportant) {
        cloneEl.style.setProperty(prop, value, "important");
      } else if (!inlineValue) {
        cloneEl.style.setProperty(prop, value);
      }
    }
  }

  return clone.innerHTML;
}
