import { describe, it, expect } from "roadtest";
import { serializeDom, snapshotsAreEquivalent } from "./serializeDom.js";

describe("serializeDom — attribute ordering", () => {
  it("sorts attributes alphabetically", () => {
    const a = `<input type="radio" value="none" checked name="x"/>`;
    const b = `<input name="x" value="none" type="radio" checked/>`;
    expect(serializeDom(a)).toBe(serializeDom(b));
  });
});

describe("serializeDom — style normalization", () => {
  it("sorts style declarations alphabetically", () => {
    const a = `<div style="color: red; background: blue">x</div>`;
    const b = `<div style="background: blue; color: red">x</div>`;
    expect(serializeDom(a)).toBe(serializeDom(b));
  });

  it("normalizes hex colors to rgb()", () => {
    const hex = `<div style="color: #ff0000">x</div>`;
    const rgb = `<div style="color: rgb(255, 0, 0)">x</div>`;
    expect(serializeDom(hex)).toBe(serializeDom(rgb));
  });

  it("normalizes 3-digit hex to rgb()", () => {
    const hex = `<div style="color: #f00">x</div>`;
    const rgb = `<div style="color: rgb(255, 0, 0)">x</div>`;
    expect(serializeDom(hex)).toBe(serializeDom(rgb));
  });

  it("matches Chrome's alpha precision for 8-digit hex colors", () => {
    // 0x40/255 ≈ 0.2509 — Chrome emits 0.25 (shortest decimal that round-trips
    // to byte 0x40), not 0.251. Previously we rounded to 3 decimals unconditionally.
    const hex = `<div style="color: #818cf840">x</div>`;
    const rgba = `<div style="color: rgba(129, 140, 248, 0.25)">x</div>`;
    expect(serializeDom(hex)).toBe(serializeDom(rgba));
  });

  it("matches Chrome's alpha precision for 0x20 (0.125)", () => {
    // 0x20/255 ≈ 0.1255 — Chrome emits 0.125 (3 decimals needed to round-trip)
    const hex = `<div style="color: #ff000020">x</div>`;
    const rgba = `<div style="color: rgba(255, 0, 0, 0.125)">x</div>`;
    expect(serializeDom(hex)).toBe(serializeDom(rgba));
  });

  it("does NOT split on `;` inside &quot; HTML entities", () => {
    // Regression: parseDeclarations used to split on the `;` inside `&quot;`,
    // corrupting font-family values that contain quoted font names.
    const a = `<div style="font-family: -apple-system, &quot;Segoe UI&quot;, sans-serif; color: red">x</div>`;
    const b = `<div style='color: red; font-family: -apple-system, "Segoe UI", sans-serif'>x</div>`;
    expect(serializeDom(a)).toBe(serializeDom(b));
  });

  it("collapses multi-line pretty-printed style values", () => {
    const pretty = `<div style="transition:\n  border-color 0.15s,\n  color 0.15s">x</div>`;
    const flat = `<div style="transition: border-color 0.15s, color 0.15s">x</div>`;
    expect(serializeDom(pretty)).toBe(serializeDom(flat));
  });

  it("expands border shorthand to per-side longhands", () => {
    const shorthand = `<div style="border: 1px solid #ccc">x</div>`;
    const longhand = `<div style="border-top-width: 1px; border-top-style: solid; border-top-color: #ccc; border-right-width: 1px; border-right-style: solid; border-right-color: #ccc; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: #ccc; border-left-width: 1px; border-left-style: solid; border-left-color: #ccc">x</div>`;
    expect(serializeDom(shorthand)).toBe(serializeDom(longhand));
  });

  it("expands border-bottom shorthand to longhands", () => {
    const shorthand = `<div style="border-bottom: 1px solid #1e1e2a">x</div>`;
    const longhand = `<div style="border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: #1e1e2a">x</div>`;
    expect(serializeDom(shorthand)).toBe(serializeDom(longhand));
  });

  it("collapses happy-dom `border: none none` quirk", () => {
    const buggy = `<button style="border: none none">x</button>`;
    const correct = `<button style="border: none">x</button>`;
    expect(serializeDom(buggy)).toBe(serializeDom(correct));
  });

  it("matches Chrome's `border: none` expansion (width: medium, drops border-image: initial)", () => {
    // happy-dom serializes `border: none` as the shorthand
    const nodeSide = `<button style="border: none">x</button>`;
    // Chrome's CSSOM expands `border: none` to per-side longhands with
    // width=medium and adds border-image: initial
    const browserSide = `<button style="border-top-width: medium; border-top-style: none; border-top-color: currentcolor; border-right-width: medium; border-right-style: none; border-right-color: currentcolor; border-bottom-width: medium; border-bottom-style: none; border-bottom-color: currentcolor; border-left-width: medium; border-left-style: none; border-left-color: currentcolor; border-image: initial">x</button>`;
    expect(serializeDom(nodeSide)).toBe(serializeDom(browserSide));
  });

  it("drops border-image-* when value is `initial`", () => {
    const withInitial = `<div style="border-image: initial; color: red">x</div>`;
    const without = `<div style="color: red">x</div>`;
    expect(serializeDom(withInitial)).toBe(serializeDom(without));
  });

  it("preserves a non-initial border-image", () => {
    const html = `<div style="border-image: url(x.png) 10">x</div>`;
    expect(serializeDom(html)).toMatch(/border-image/);
  });

  it("expands margin shorthand", () => {
    const a = `<div style="margin: 10px 20px">x</div>`;
    const b = `<div style="margin-top: 10px; margin-right: 20px; margin-bottom: 10px; margin-left: 20px">x</div>`;
    expect(serializeDom(a)).toBe(serializeDom(b));
  });

  it("expands padding shorthand", () => {
    const a = `<div style="padding: 8px 20px">x</div>`;
    const b = `<div style="padding-top: 8px; padding-right: 20px; padding-bottom: 8px; padding-left: 20px">x</div>`;
    expect(serializeDom(a)).toBe(serializeDom(b));
  });

  it("expands flex shorthand", () => {
    const a = `<div style="flex: 1">x</div>`;
    const b = `<div style="flex-grow: 1; flex-shrink: 1; flex-basis: 0%">x</div>`;
    expect(serializeDom(a)).toBe(serializeDom(b));
  });

  it("normalizes 0px to 0", () => {
    const a = `<div style="margin-top: 0px">x</div>`;
    const b = `<div style="margin-top: 0">x</div>`;
    expect(serializeDom(a)).toBe(serializeDom(b));
  });
});

describe("serializeDom — structure", () => {
  it("normalizes tag-name casing", () => {
    const a = `<DIV><SPAN>hi</SPAN></DIV>`;
    const b = `<div><span>hi</span></div>`;
    expect(serializeDom(a)).toBe(serializeDom(b));
  });

  it("self-closes void elements consistently", () => {
    const a = `<br>`;
    const b = `<br/>`;
    const c = `<br />`;
    expect(serializeDom(a)).toBe(serializeDom(b));
    expect(serializeDom(b)).toBe(serializeDom(c));
  });

  it("preserves boolean (valueless) attributes", () => {
    const html = `<input checked type="checkbox"/>`;
    expect(serializeDom(html)).toMatch(/checked/);
  });

  it("drops whitespace-only text nodes between tags", () => {
    const pretty = `<ul>\n  <li>a</li>\n  <li>b</li>\n</ul>`;
    const flat = `<ul><li>a</li><li>b</li></ul>`;
    expect(serializeDom(pretty)).toBe(serializeDom(flat));
  });

  it("handles deep nesting with pretty-printed indentation", () => {
    const pretty = `<div>\n  <section>\n    <h2>\n      Title\n    </h2>\n  </section>\n</div>`;
    const flat = `<div><section><h2>Title</h2></section></div>`;
    expect(serializeDom(pretty)).toBe(serializeDom(flat));
  });
});

describe("serializeDom — entity handling", () => {
  it('treats &quot; and " equivalently in attribute values', () => {
    const a = `<div title="&quot;hello&quot;">x</div>`;
    const b = `<div title='"hello"'>x</div>`;
    expect(serializeDom(a)).toBe(serializeDom(b));
  });

  it("decodes numeric character references", () => {
    const a = `<span>&#65;</span>`;
    const b = `<span>A</span>`;
    expect(serializeDom(a)).toBe(serializeDom(b));
  });
});

describe("serializeDom — cross-environment parity", () => {
  it("happy-dom longhand output matches browser shorthand output", () => {
    // happy-dom serializes border-bottom shorthand as 3 longhands
    const happyDom = `<div style="border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: #1e1e2a">x</div>`;
    // Real browser keeps the shorthand form
    const browser = `<div style="border-bottom: 1px solid #1e1e2a">x</div>`;
    expect(serializeDom(happyDom)).toBe(serializeDom(browser));
  });

  it("treats pretty-printed (oxfmt) and compact HTML as equivalent", () => {
    const pretty = `<div\n  style="\n    color: red;\n    background: blue;\n  "\n>\n  hi\n</div>`;
    const compact = `<div style="color: red; background: blue">hi</div>`;
    expect(serializeDom(pretty)).toBe(serializeDom(compact));
  });
});

describe("snapshotsAreEquivalent", () => {
  it("treats semantically equivalent HTML as equal", () => {
    const a = `<div style="color: #fff; border: 1px solid #000">hi</div>`;
    const b = `<div style="border-top: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000; border-left: 1px solid #000; color: rgb(255, 255, 255)">hi</div>`;
    expect(snapshotsAreEquivalent(a, b)).toBe(true);
  });

  it("detects genuinely different content", () => {
    const a = `<div>hello</div>`;
    const b = `<div>world</div>`;
    expect(snapshotsAreEquivalent(a, b)).toBe(false);
  });

  it("strips passthrough wrapper from browser side only", () => {
    const browser = `<div style="color: inherit; background: inherit"><span>content</span></div>`;
    const node = `<span>content</span>`;
    expect(snapshotsAreEquivalent(browser, node)).toBe(true);
  });
});
