import { existsSync, mkdirSync, readdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import type { SerializableTestSuite } from "./serialize.js";

// ─── CSS normalization (pure text-based, no DOM dependency) ──────────────────

/** Convert a hex color token to rgb() / rgba(). */
function hexToRgb(hex: string): string {
  const h = hex.slice(1);
  let r: number, g: number, b: number;
  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16);
    g = parseInt(h[1] + h[1], 16);
    b = parseInt(h[2] + h[2], 16);
    return `rgb(${r}, ${g}, ${b})`;
  }
  r = parseInt(h.slice(0, 2), 16);
  g = parseInt(h.slice(2, 4), 16);
  b = parseInt(h.slice(4, 6), 16);
  if (h.length === 8) {
    const a = Math.round((parseInt(h.slice(6, 8), 16) / 255) * 1000) / 1000;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

/** Replace all hex color tokens in a CSS value string with rgb()/rgba(). */
function normalizeColors(value: string): string {
  return value.replace(
    /#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?=[^0-9a-fA-F]|$)/g,
    hexToRgb,
  );
}

/**
 * Split a CSS declaration block into [property, value] pairs.
 * Handles commas/semicolons inside function calls like rgb(), linear-gradient().
 */
function parseDeclarations(css: string): Array<[string, string]> {
  const decls: Array<[string, string]> = [];
  let buf = "";
  let depth = 0;
  for (const ch of css) {
    if (ch === "(") {
      depth++;
      buf += ch;
    } else if (ch === ")") {
      depth--;
      buf += ch;
    } else if (ch === ";" && depth === 0) {
      const colon = buf.indexOf(":");
      if (colon > 0) decls.push([buf.slice(0, colon).trim(), buf.slice(colon + 1).trim()]);
      buf = "";
    } else {
      buf += ch;
    }
  }
  const colon = buf.indexOf(":");
  if (colon > 0) decls.push([buf.slice(0, colon).trim(), buf.slice(colon + 1).trim()]);
  return decls;
}

// ─── Shorthand expanders ──────────────────────────────────────────────────────

/** `flex: g s b` → individual flex-* longhands, sorted. */
function expandFlex(value: string): Array<[string, string]> {
  const parts = value.trim().split(/\s+/);
  if (parts.length === 3)
    return [
      ["flex-basis", parts[2]],
      ["flex-grow", parts[0]],
      ["flex-shrink", parts[1]],
    ];
  if (parts.length === 2)
    return [
      ["flex-basis", "0%"],
      ["flex-grow", parts[0]],
      ["flex-shrink", parts[1]],
    ];
  if (parts.length === 1 && /^[\d.]/.test(parts[0]))
    return [
      ["flex-basis", "0%"],
      ["flex-grow", parts[0]],
      ["flex-shrink", "1"],
    ];
  return [["flex", value]];
}

/**
 * `border[-side]: width style color` → individual longhands.
 * Collapses `none none` → `none` before expanding.
 */
function expandBorderSide(prefix: string, value: string): Array<[string, string]> {
  const v = value.trim().replace(/^(none)(\s+none)+$/, "none");
  if (v === "none") return [[`${prefix}-style`, "none"]];
  const m = v.match(/^(\S+)\s+(\S+)\s+(.+)$/);
  if (m) {
    return [
      [`${prefix}-color`, normalizeColors(m[3].trim())],
      [`${prefix}-style`, m[2]],
      [`${prefix}-width`, m[1]],
    ];
  }
  return [[prefix, normalizeColors(v)]];
}

/** Expand a single declaration, returning one or more longhands. */
function expandDeclaration(prop: string, value: string): Array<[string, string]> {
  const v = normalizeColors(value);
  switch (prop) {
    case "flex":
      return expandFlex(v);
    case "border":
      return expandBorderSide("border", v);
    case "border-top":
      return expandBorderSide("border-top", v);
    case "border-right":
      return expandBorderSide("border-right", v);
    case "border-bottom":
      return expandBorderSide("border-bottom", v);
    case "border-left":
      return expandBorderSide("border-left", v);
    default:
      return [[prop, v]];
  }
}

/** Normalize a raw style attribute value to a canonical sorted form. */
function normalizeStyleAttr(raw: string): string {
  const expanded = new Map<string, string>();
  for (const [prop, value] of parseDeclarations(raw)) {
    for (const [p, v] of expandDeclaration(prop, value)) {
      expanded.set(p, v);
    }
  }
  return [...expanded.keys()]
    .sort()
    .map((p) => `${p}: ${expanded.get(p)}`)
    .join("; ");
}

// ─── HTML tag normalization (text-based) ──────────────────────────────────────

/**
 * Parse, sort, and normalize the attributes of a single opening tag.
 * The style attribute gets its declarations expanded and sorted.
 * All attributes are sorted alphabetically to eliminate serialization-order diffs.
 */
function normalizeTag(tag: string): string {
  const nameMatch = tag.match(/^<([^\s>/]+)/);
  if (!nameMatch) return tag;
  const tagName = nameMatch[1];

  // Extract attributes — values are quoted; handles &quot; inside values.
  const attrRe = /\s+([\w:-]+)(?:="([^"]*)")?/g;
  const attrs: Array<[string, string | null]> = [];
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(tag)) !== null) {
    attrs.push([m[1], m[2] !== undefined ? m[2] : null]);
  }

  attrs.sort(([a], [b]) => a.localeCompare(b));

  const attrStr = attrs
    .map(([name, value]) => {
      if (value === null) return ` ${name}`;
      const normalized = name === "style" ? normalizeStyleAttr(value) : value;
      return ` ${name}="${normalized}"`;
    })
    .join("");

  const selfClose = tag.endsWith("/>") ? "/" : "";
  return `<${tagName}${attrStr}${selfClose}>`;
}

/** Normalize every opening tag in an HTML string. */
function normalizeSnapshotHtml(html: string): string {
  return html.replace(/<[a-zA-Z][^>]*>/g, (match) => {
    if (match.startsWith("</") || match.startsWith("<!--")) return match;
    try {
      return normalizeTag(match);
    } catch {
      return match;
    }
  });
}

// ─── Wrapper stripping ────────────────────────────────────────────────────────

/**
 * If exactly one side has a passthrough wrapper div whose only attribute is
 * `style="...: inherit; ..."`, strip it.  This handles the `.fieldtest/preview.tsx`
 * wrapper present in browser renders but absent in node/happy-dom captures.
 */
function stripMismatchedWrapper(
  baseHtml: string,
  currHtml: string,
): { base: string; curr: string } {
  function unwrap(h: string): string | null {
    const trimmed = h.trim();
    // Must start with <div or <div style="...inherit..."> and end with </div>
    const m = trimmed.match(/^(<div(?:\s+style="[^"]*")??>)([\s\S]*)<\/div>$/);
    if (!m) return null;
    const openTag = m[1];
    // Only allow a style attribute whose values are all "inherit"
    if (
      openTag !== "<div>" &&
      !/^<div style="(?:[\w-]+:\s*inherit;\s*)*[\w-]+:\s*inherit">$/.test(openTag)
    )
      return null;
    return m[2];
  }

  const uBase = unwrap(baseHtml);
  const uCurr = unwrap(currHtml);
  if (uCurr !== null && uBase === null) return { base: baseHtml, curr: uCurr };
  if (uBase !== null && uCurr === null) return { base: uBase, curr: currHtml };
  return { base: baseHtml, curr: currHtml };
}

function snapshotsAreEquivalent(stored: string, current: string): boolean {
  const normStored = normalizeSnapshotHtml(stored);
  const normCurrent = normalizeSnapshotHtml(current);
  const { base, curr } = stripMismatchedWrapper(normStored, normCurrent);
  return base === curr;
}

// ─── Path helpers ─────────────────────────────────────────────────────────────

function sanitize(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
}

function snapshotDir(sourceFile: string): string {
  return join(dirname(sourceFile), "__snapshots__");
}

export function snapshotPath(
  sourceFile: string,
  suiteName: string,
  testName: string,
  label: string,
): string {
  return join(
    snapshotDir(sourceFile),
    sanitize(suiteName),
    `${sanitize(testName)}__${sanitize(label)}.html`,
  );
}

// ─── Load / save ──────────────────────────────────────────────────────────────

function loadSnapshot(path: string): string | null {
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

function saveSnapshot(path: string, html: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, html, "utf8");
}

// ─── Diff (line-by-line) ──────────────────────────────────────────────────────

/**
 * Insert newlines between HTML tags so that a flat single-line HTML string
 * produces a readable multi-line diff instead of one enormous changed line.
 */
function prettyHtml(html: string): string {
  return html
    .replace(/></g, ">\n<")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");
}

function diffLines(a: string, b: string): string {
  const aLines = prettyHtml(a).split("\n");
  const bLines = prettyHtml(b).split("\n");
  const maxLen = Math.max(aLines.length, bLines.length);
  const out: string[] = [];
  for (let i = 0; i < maxLen; i++) {
    const lineA = aLines[i];
    const lineB = bLines[i];
    if (lineA === lineB) continue;
    if (lineA === undefined) {
      out.push(`+  ${lineB}`);
    } else if (lineB === undefined) {
      out.push(`-  ${lineA}`);
    } else {
      out.push(`-  ${lineA}`);
      out.push(`+  ${lineB}`);
    }
  }
  return out.join("\n");
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface SnapshotMismatch {
  path: string;
  suiteName: string;
  testName: string;
  label: string;
  diff: string;
}

export interface SnapshotResult {
  mismatches: SnapshotMismatch[];
  /** Paths of orphaned snapshot files that were deleted in update mode */
  removed: string[];
}

/**
 * @param allSuites   Every suite from this run (fresh + cached) — used to
 *                    determine which snapshot files are still referenced so
 *                    orphans can be pruned in update mode.
 * @param updateMode  When true, overwrite stored snapshots and prune orphans.
 * @param freshSuites Only the suites that were actually re-executed this run.
 *                    Defaults to allSuites (full run). Provide a subset when
 *                    some suites were served from cache to avoid re-writing
 *                    unchanged baselines.
 */
export function processSnapshots(
  allSuites: SerializableTestSuite[],
  updateMode: boolean,
  freshSuites: SerializableTestSuite[] = allSuites,
): SnapshotResult {
  const mismatches: SnapshotMismatch[] = [];
  const removed: string[] = [];

  // Build the full set of paths still referenced by any suite (fresh or cached)
  // so the orphan-cleanup step knows what to keep.
  const activePaths = new Set<string>();
  for (const suite of allSuites) {
    if (!suite.sourceFile) continue;
    for (const test of suite.tests) {
      for (const assertion of test.assertions) {
        if (!assertion.snapshot) continue;
        activePaths.add(
          snapshotPath(suite.sourceFile, suite.name, test.name, assertion.snapshot.label),
        );
      }
    }
  }

  // Write/compare only for freshly-executed suites.
  for (const suite of freshSuites) {
    if (!suite.sourceFile) continue;
    for (const test of suite.tests) {
      const testMismatches: SnapshotMismatch[] = [];
      for (const assertion of test.assertions) {
        if (!assertion.snapshot) continue;
        const { label, html } = assertion.snapshot;
        const path = snapshotPath(suite.sourceFile, suite.name, test.name, label);
        if (updateMode) {
          saveSnapshot(path, html);
        } else {
          const stored = loadSnapshot(path);
          if (stored === null) {
            saveSnapshot(path, html);
          } else if (!snapshotsAreEquivalent(stored, html)) {
            testMismatches.push({
              path,
              suiteName: suite.name,
              testName: test.name,
              label,
              diff: diffLines(stored, html),
            });
            assertion.status = "fail";
            assertion.error = "Snapshot mismatch";
          }
        }
      }

      if (testMismatches.length > 0) {
        mismatches.push(...testMismatches);
        const labels = testMismatches.map((m) => m.label).join(", ");
        test.status = "fail";
        test.error = `Snapshot mismatch in: ${labels}. Run with --update-snapshots to update.`;
        suite.status = "fail";
      }
    }
  }

  // In update mode, prune orphaned .html files from every __snapshots__ directory
  // that belongs to a source file touched in this run.
  if (updateMode) {
    const dirsToClean = new Set<string>();
    for (const suite of freshSuites) {
      if (suite.sourceFile) dirsToClean.add(snapshotDir(suite.sourceFile));
    }
    for (const dir of dirsToClean) {
      if (!existsSync(dir)) continue;
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const suitePath = join(dir, entry.name);
        for (const file of readdirSync(suitePath).filter((f) => f.endsWith(".html"))) {
          const filePath = join(suitePath, file);
          if (!activePaths.has(filePath)) {
            rmSync(filePath);
            removed.push(filePath);
          }
        }
        if (readdirSync(suitePath).length === 0) {
          rmSync(suitePath, { recursive: true });
        }
      }
    }
  }

  return { mismatches, removed };
}
