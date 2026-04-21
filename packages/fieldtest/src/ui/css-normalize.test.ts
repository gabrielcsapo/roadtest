import { describe, it, expect } from "fieldtest";
import { normalizeHtmlStyles, snapshotsAreEquivalent } from "./css-normalize.js";

// ─── normalizeHtmlStyles ──────────────────────────────────────────────────────

describe("normalizeHtmlStyles — whitespace text node normalization", () => {
  it("removes whitespace-only text nodes between elements", () => {
    const pretty = `<div>\n  <span>hello</span>\n</div>`;
    const flat = `<div><span>hello</span></div>`;
    expect(normalizeHtmlStyles(pretty)).toBe(normalizeHtmlStyles(flat));
  });

  it("trims leading/trailing whitespace from content text nodes", () => {
    const pretty = `<h2>\n        Team\n      </h2>`;
    const flat = `<h2>Team</h2>`;
    expect(normalizeHtmlStyles(pretty)).toBe(normalizeHtmlStyles(flat));
  });

  it("preserves inner whitespace within a text node", () => {
    const result = normalizeHtmlStyles(`<span>hello   world</span>`);
    expect(result.includes("hello   world")).toBe(true);
  });

  it("handles deeply nested pretty-printed HTML", () => {
    const pretty = `<div>\n  <section>\n    <h2>\n      Sprint Tasks\n    </h2>\n  </section>\n</div>`;
    const flat = `<div><section><h2>Sprint Tasks</h2></section></div>`;
    expect(normalizeHtmlStyles(pretty)).toBe(normalizeHtmlStyles(flat));
  });

  it("handles mixed: whitespace-only nodes alongside content nodes", () => {
    // The 'A' text node has surrounding whitespace from indentation
    const pretty = `<div>\n  <span>\n    A\n  </span>\n</div>`;
    const flat = `<div><span>A</span></div>`;
    expect(normalizeHtmlStyles(pretty)).toBe(normalizeHtmlStyles(flat));
  });
});

// ─── snapshotsAreEquivalent ───────────────────────────────────────────────────

describe("snapshotsAreEquivalent — node vs browser formatting", () => {
  it("treats pretty-printed and flat HTML as equivalent", () => {
    const nodeHtml = `<div>\n  <header>\n    <span>Team Dashboard</span>\n  </header>\n</div>`;
    const browserHtml = `<div><header><span>Team Dashboard</span></header></div>`;
    expect(snapshotsAreEquivalent(nodeHtml, browserHtml)).toBe(true);
  });

  it("treats identical flat HTML as equivalent", () => {
    const html = `<div><span>hello</span></div>`;
    expect(snapshotsAreEquivalent(html, html)).toBe(true);
  });

  it("detects genuinely different text content", () => {
    const a = `<div><span>hello</span></div>`;
    const b = `<div><span>world</span></div>`;
    expect(snapshotsAreEquivalent(a, b)).toBe(false);
  });

  it("detects genuinely different structure", () => {
    const a = `<div><span>text</span></div>`;
    const b = `<div><p>text</p></div>`;
    expect(snapshotsAreEquivalent(a, b)).toBe(false);
  });

  it("detects added elements", () => {
    const a = `<ul><li>one</li></ul>`;
    const b = `<ul><li>one</li><li>two</li></ul>`;
    expect(snapshotsAreEquivalent(a, b)).toBe(false);
  });

  it("ignores indentation differences in non-style attributes", () => {
    // Attribute values are the same; only formatting differs
    const nodeHtml = `<button\n  data-testid="btn"\n  aria-label="close">Click</button>`;
    const browserHtml = `<button data-testid="btn" aria-label="close">Click</button>`;
    expect(snapshotsAreEquivalent(nodeHtml, browserHtml)).toBe(true);
  });
});
