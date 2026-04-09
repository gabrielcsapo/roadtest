import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import type { TestCase, Snapshot } from "../../framework/types";
import { onSandboxMessage } from "../../framework/messages";
import { StatusIcon } from "./StatusIcon";
import { GridToggle, gridStyle } from "./toolbar/GridToggle";
import { VisionFilter, visionFilterStyle } from "./toolbar/VisionFilter";
import type { VisionFilter as VisionFilterType } from "./toolbar/VisionFilter";
import { OutlineToggle } from "./toolbar/OutlineToggle";
import { MeasureToggle, MeasureOverlay, useMeasure } from "./toolbar/MeasureToggle";
import { AxePanel } from "./AxePanel";
import { AssertionsTab } from "./tabs/AssertionsTab";
import { TraceTab, type ComponentNode } from "./tabs/TraceTab";
import { CodeTab } from "./tabs/CodeTab";
import { ConsoleTab } from "./tabs/ConsoleTab";
import { MocksPanel } from "./tabs/MocksPanel";
import { DepsTab } from "./tabs/DepsTab";
import { getRegisteredTabs } from "../plugins";
import type { TabPlugin } from "../plugins";
import type { IstanbulCoverage, TestSuite } from "../../framework/types";
import { SnapshotFrame } from "./SnapshotFrame";
import { normalizeHtmlStyles, stripMismatchedWrapper } from "../css-normalize";

type Tab = string;

// Cache lazy components by plugin ID so React.lazy isn't recreated on every render
const _lazyComponentCache = new Map<
  string,
  React.ComponentType<{ test: import("../../framework/types").TestCase }>
>();
function getPluginComponent(plugin: TabPlugin) {
  if (plugin.component) return plugin.component;
  if (!plugin.load) return null;
  if (!_lazyComponentCache.has(plugin.id)) {
    _lazyComponentCache.set(
      plugin.id,
      React.lazy(() => plugin.load!().then((c) => ({ default: c }))),
    );
  }
  return _lazyComponentCache.get(plugin.id)!;
}

interface Props {
  test: TestCase | null;
  coverage: IstanbulCoverage | null;
  suites: TestSuite[];
  onSelectTest: (suiteId: string, testId: string) => void;
  onSelectSuite?: (suiteId: string) => void;
  /** Start on this frame index instead of 0. Use 1 in demo/static contexts where the live iframe is absent. */
  initialFrame?: number;
  /** URL for the display iframe. Defaults to "/" (the current Vite app). Override in embedded demos. */
  displaySrc?: string;
}

function formatElapsed(ms: number): string {
  if (ms === 0) return "0ms";
  if (ms < 1000) return `+${ms}ms`;
  return `+${(ms / 1000).toFixed(2)}s`;
}

// ─── Snapshot HTML diff ───────────────────────────────────────────────────────

function markNode(el: Element, type: "add" | "remove") {
  const h = el as HTMLElement;
  h.style.outline =
    type === "add" ? "2px solid rgba(34,197,94,0.7)" : "2px solid rgba(239,68,68,0.7)";
  h.style.outlineOffset = "1px";
}

function wrapTextNode(textNode: Text, type: "add" | "remove") {
  const doc = textNode.ownerDocument!;
  const span = doc.createElement("span");
  span.style.cssText =
    type === "add"
      ? "background:rgba(34,197,94,0.45);border-radius:2px;padding:0 1px"
      : "background:rgba(239,68,68,0.45);border-radius:2px;padding:0 1px;text-decoration:line-through";
  span.appendChild(doc.createTextNode(textNode.textContent ?? ""));
  textNode.parentNode?.replaceChild(span, textNode);
}

function diffDomNodes(baseNode: Node | null, currNode: Node | null) {
  if (!baseNode && !currNode) return;

  // One side missing — mark the whole node
  if (!baseNode && currNode) {
    if (currNode.nodeType === Node.ELEMENT_NODE) markNode(currNode as Element, "add");
    return;
  }
  if (baseNode && !currNode) {
    if (baseNode.nodeType === Node.ELEMENT_NODE) markNode(baseNode as Element, "remove");
    return;
  }

  // Text node: compare content, wrap differences
  if (baseNode!.nodeType === Node.TEXT_NODE && currNode!.nodeType === Node.TEXT_NODE) {
    if (baseNode!.textContent !== currNode!.textContent) {
      wrapTextNode(baseNode as Text, "remove");
      wrapTextNode(currNode as Text, "add");
    }
    return;
  }

  // Different element types
  if (baseNode!.nodeName !== currNode!.nodeName) {
    if (baseNode!.nodeType === Node.ELEMENT_NODE) markNode(baseNode as Element, "remove");
    if (currNode!.nodeType === Node.ELEMENT_NODE) markNode(currNode as Element, "add");
    return;
  }

  // Same element type — recurse into children.
  // Style comparison is intentionally skipped: happy-dom serializes colors as
  // hex (#1a1a24) while browsers use rgb(26,26,36), producing false positives
  // on every colored element. Content-level diffs (text nodes) are sufficient.

  const baseKids = Array.from(baseNode!.childNodes);
  const currKids = Array.from(currNode!.childNodes);
  const len = Math.max(baseKids.length, currKids.length);
  for (let i = 0; i < len; i++) diffDomNodes(baseKids[i] ?? null, currKids[i] ?? null);
}

/**
 * Returns two HTML strings identical to the inputs but with diff highlights
 * injected as inline styles / wrapper spans.
 */
function diffHtml(
  baseline: string,
  current: string,
): { baselineHtml: string; currentHtml: string } {
  const parser = new DOMParser();
  const wrap = (h: string) => `<div>${h}</div>`;
  // Normalize both sides through the live browser CSS parser before diffing,
  // then strip any mismatched outer wrapper div (e.g. from preview.tsx).
  const normBase = normalizeHtmlStyles(baseline);
  const normCurr = normalizeHtmlStyles(current);
  const { base: strippedBase, curr: strippedCurr } = stripMismatchedWrapper(normBase, normCurr);
  const baseDoc = parser.parseFromString(wrap(strippedBase), "text/html");
  const currDoc = parser.parseFromString(wrap(strippedCurr), "text/html");
  const baseRoot = baseDoc.body.firstChild as Element;
  const currRoot = currDoc.body.firstChild as Element;
  diffDomNodes(baseRoot, currRoot);
  return { baselineHtml: baseRoot.innerHTML, currentHtml: currRoot.innerHTML };
}

// ─── Text (unified) diff ──────────────────────────────────────────────────────

type DiffLine =
  | { kind: "context"; text: string; lineA: number; lineB: number }
  | { kind: "remove"; text: string; lineA: number }
  | { kind: "add"; text: string; lineB: number };

/** LCS-based unified diff of two arrays of strings. */
function computeLineDiff(aLines: string[], bLines: string[]): DiffLine[] {
  const m = aLines.length;
  const n = bLines.length;
  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        aLines[i - 1] === bLines[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  // Traceback
  const result: DiffLine[] = [];
  let i = m,
    j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aLines[i - 1] === bLines[j - 1]) {
      result.push({ kind: "context", text: aLines[i - 1], lineA: i, lineB: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ kind: "add", text: bLines[j - 1], lineB: j });
      j--;
    } else {
      result.push({ kind: "remove", text: aLines[i - 1], lineA: i });
      i--;
    }
  }
  result.reverse();
  return result;
}

// ─── CSS normalization via browser engine ─────────────────────────────────────

/**
 * Render HTML into a detached div, let the browser parse every inline style
 * attribute, then read back el.style.cssText. This normalizes:
 *   - hex colors → rgb()           (#6b7280 → rgb(107, 114, 128))
 *   - shorthands → longhands       (border: 1px solid #x → border-top: …, etc.)
 *   - property order               (sorted by the browser's internal order)
 *
 * Both baseline (from happy-dom/node) and current (from browser) go through
 * the same pass so the diff sees semantically equivalent strings as identical.
 */

/** Pretty-print HTML for diffing: one tag per line, attributes expanded. */
function prettifyHtml(html: string): string {
  return html
    .replace(/></g, ">\n<")
    .replace(/(<\w[^>]*?>)/g, (tag) =>
      tag.replace(/\s+(\w[\w-]*=(?:"[^"]*"|'[^']*'|\S+))/g, "\n  $1"),
    )
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0)
    .join("\n");
}

// ─── Text diff renderer ───────────────────────────────────────────────────────

const CONTEXT_LINES = 3;

/** Build a plain-text unified diff string (for copy/export). */
function buildPlainTextDiff(diff: DiffLine[]): string {
  const lines: string[] = [];
  diff.forEach((d) => {
    if (d.kind === "add") lines.push(`+ ${d.text}`);
    else if (d.kind === "remove") lines.push(`- ${d.text}`);
    else lines.push(`  ${d.text}`);
  });
  return lines.join("\n");
}

function TextDiff({ baseline, current }: { baseline: string; current: string }) {
  const [copied, setCopied] = useState(false);

  // Normalize both sides through the live browser CSS parser so hex vs rgb
  // and shorthand vs longhand differences don't produce false positives.
  // Then strip any mismatched outer wrapper div (e.g. from preview.tsx).
  const normBase = normalizeHtmlStyles(baseline);
  const normCurr = normalizeHtmlStyles(current);
  const { base: strippedBase, curr: strippedCurr } = stripMismatchedWrapper(normBase, normCurr);
  const aLines = prettifyHtml(strippedBase).split("\n");
  const bLines = prettifyHtml(strippedCurr).split("\n");
  const diff = computeLineDiff(aLines, bLines);

  const handleCopy = () => {
    const text = buildPlainTextDiff(diff);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Collect indices of changed lines and expand ±CONTEXT_LINES around them
  const changedIdx = new Set<number>();
  diff.forEach((d, i) => {
    if (d.kind !== "context") changedIdx.add(i);
  });
  const visible = new Set<number>();
  changedIdx.forEach((ci) => {
    for (
      let k = Math.max(0, ci - CONTEXT_LINES);
      k <= Math.min(diff.length - 1, ci + CONTEXT_LINES);
      k++
    ) {
      visible.add(k);
    }
  });

  const rows: React.ReactNode[] = [];
  let prevVisible = false;
  diff.forEach((d, i) => {
    if (!visible.has(i)) {
      prevVisible = false;
      return;
    }
    if (!prevVisible && i > 0) {
      rows.push(
        <div
          key={`sep-${i}`}
          style={{
            color: "#4b5563",
            fontStyle: "italic",
            padding: "2px 8px",
            background: "#16161d",
          }}
        >
          ···
        </div>,
      );
    }
    prevVisible = true;
    const isAdd = d.kind === "add";
    const isRemove = d.kind === "remove";
    const lineNumA = d.kind !== "add" ? String(d.lineA).padStart(4) : "    ";
    const lineNumB = d.kind !== "remove" ? String(d.lineB).padStart(4) : "    ";
    rows.push(
      <div
        key={i}
        style={{
          display: "flex",
          background: isAdd
            ? "rgba(34,197,94,0.12)"
            : isRemove
              ? "rgba(239,68,68,0.12)"
              : "transparent",
          borderLeft: isAdd
            ? "3px solid rgba(34,197,94,0.7)"
            : isRemove
              ? "3px solid rgba(239,68,68,0.7)"
              : "3px solid transparent",
        }}
      >
        <span
          style={{
            color: "#4b5563",
            userSelect: "none",
            minWidth: 36,
            textAlign: "right",
            padding: "0 6px",
            fontFamily: "monospace",
            fontSize: 11,
          }}
        >
          {lineNumA}
        </span>
        <span
          style={{
            color: "#4b5563",
            userSelect: "none",
            minWidth: 36,
            textAlign: "right",
            padding: "0 6px",
            fontFamily: "monospace",
            fontSize: 11,
          }}
        >
          {lineNumB}
        </span>
        <span
          style={{
            color: isAdd ? "rgba(34,197,94,0.9)" : isRemove ? "rgba(239,68,68,0.9)" : "#6b7280",
            userSelect: "none",
            padding: "0 4px",
            fontFamily: "monospace",
            fontSize: 11,
          }}
        >
          {isAdd ? "+" : isRemove ? "−" : " "}
        </span>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 11,
            color: isAdd ? "#bbf7d0" : isRemove ? "#fecaca" : "#c4c4d4",
            whiteSpace: "pre",
            overflowX: "auto",
            flex: 1,
          }}
        >
          {d.text}
        </span>
      </div>,
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleCopy}
          style={{
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 4,
            border: "1px solid #3a3a4e",
            cursor: "pointer",
            background: copied ? "rgba(34,197,94,0.15)" : "transparent",
            color: copied ? "#86efac" : "#6b7280",
            transition: "all 0.15s",
          }}
        >
          {copied ? "Copied!" : "Copy diff"}
        </button>
      </div>
      {rows.length === 0 ? (
        <div style={{ color: "#6b7280", fontFamily: "monospace", fontSize: 12, padding: 16 }}>
          No textual differences found after CSS normalization.
        </div>
      ) : (
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 11,
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: 520,
            background: "#0d0d11",
            borderRadius: 6,
            border: "1px solid #2a2a36",
          }}
        >
          {rows}
        </div>
      )}
    </div>
  );
}

// ─── SnapshotDiff container with mode toggle ──────────────────────────────────

export function SnapshotDiff({
  baseline,
  current,
  vision,
}: {
  baseline: string;
  current: string;
  vision: VisionFilterType;
}) {
  const [diffMode, setDiffMode] = useState<"visual" | "text">("visual");

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    padding: "3px 10px",
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 4,
    border: "1px solid",
    cursor: "pointer",
    background: active ? "#1e1e2e" : "transparent",
    borderColor: active ? "#6366f1" : "#3a3a4e",
    color: active ? "#a5b4fc" : "#6b7280",
    transition: "all 0.15s",
  });

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: "#6b7280",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  };

  const paneStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 8,
    padding: 16,
    background: "#0f0f13",
    overflow: "auto",
    maxHeight: 600,
    ...visionFilterStyle(vision),
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      {/* Mode toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
        <span style={{ fontSize: 11, color: "#4b5563" }}>Diff view:</span>
        <button style={toggleStyle(diffMode === "visual")} onClick={() => setDiffMode("visual")}>
          Visual
        </button>
        <button style={toggleStyle(diffMode === "text")} onClick={() => setDiffMode("text")}>
          Text
        </button>
      </div>

      {diffMode === "visual" ? (
        (() => {
          const { baselineHtml, currentHtml } = diffHtml(baseline, current);
          return (
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start", width: "100%" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={labelStyle}>Expected (baseline)</div>
                <div style={paneStyle}>
                  <SnapshotFrame html={baselineHtml} displayWidth={480} displayHeight={400} />
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={labelStyle}>Received (current)</div>
                <div style={paneStyle}>
                  <SnapshotFrame html={currentHtml} displayWidth={480} displayHeight={400} />
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        <div style={{ width: "100%" }}>
          <TextDiff baseline={baseline} current={current} />
        </div>
      )}
    </div>
  );
}

function Timeline({
  snapshots,
  active,
  onSelect,
}: {
  snapshots: Snapshot[];
  active: number;
  onSelect: (i: number) => void;
}) {
  if (!snapshots.length) return null;
  const t0 = snapshots[0].timestamp;
  return (
    <div style={{ padding: "20px 24px 24px" }}>
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            right: 40,
            height: 2,
            background: "#2a2a36",
            zIndex: 0,
          }}
        />
        <div style={{ display: "flex", gap: 0, overflowX: "auto", paddingBottom: 4 }}>
          {snapshots.map((snap, i) => {
            const isActive = i === active;
            return (
              <button
                key={i}
                onClick={() => onSelect(i)}
                style={{
                  flex: "0 0 auto",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  padding: "0 12px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: isActive ? "#a5b4fc" : "#3a3a4e",
                    fontFamily: "monospace",
                    marginBottom: 2,
                    transition: "color 0.15s",
                  }}
                >
                  {formatElapsed(snap.timestamp - t0)}
                </span>
                <div
                  style={{
                    width: 80,
                    height: 56,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: `2px solid ${snap.baselineHtml ? (isActive ? "#ef4444" : "rgba(239,68,68,0.5)") : isActive ? "#6366f1" : "#2a2a36"}`,
                    background: "#0f0f13",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "border-color 0.15s",
                    boxShadow: isActive
                      ? snap.baselineHtml
                        ? "0 0 0 3px rgba(239,68,68,0.2)"
                        : "0 0 0 3px rgba(99,102,241,0.2)"
                      : "none",
                  }}
                >
                  <SnapshotFrame
                    html={snap.html}
                    displayWidth={76}
                    displayHeight={52}
                    virtualWidth={800}
                  />
                </div>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: isActive ? "#6366f1" : "#2a2a36",
                    border: `2px solid ${isActive ? "#818cf8" : "#3a3a4e"}`,
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    color: isActive ? "#c4c4d4" : "#4b4b60",
                    maxWidth: 80,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    transition: "color 0.15s",
                  }}
                >
                  {snap.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: Tab; label: string; count?: number }[];
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScroll();
    const ro = new ResizeObserver(updateScroll);
    ro.observe(el);
    el.addEventListener("scroll", updateScroll);
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", updateScroll);
    };
  }, [updateScroll]);

  return (
    <div
      style={{
        position: "relative",
        borderBottom: "1px solid #2a2a36",
        background: "#16161d",
        flexShrink: 0,
      }}
    >
      {canScrollLeft && (
        <div
          onClick={() => scrollRef.current?.scrollBy({ left: -100, behavior: "smooth" })}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 32,
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(to right, #16161d 60%, transparent)",
            cursor: "pointer",
            color: "#6b7280",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M7.5 2L3.5 6l4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
      {canScrollRight && (
        <div
          onClick={() => scrollRef.current?.scrollBy({ left: 100, behavior: "smooth" })}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 32,
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(to left, #16161d 60%, transparent)",
            cursor: "pointer",
            color: "#6b7280",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M4.5 2L8.5 6l-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
      <div ref={scrollRef} style={{ display: "flex", overflowX: "auto", scrollbarWidth: "none" }}>
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                flexShrink: 0,
                padding: "10px 16px",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${isActive ? "#6366f1" : "transparent"}`,
                color: isActive ? "#a5b4fc" : "#4b4b60",
                fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "color 0.15s, border-color 0.15s",
                marginBottom: -1,
              }}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: isActive ? "rgba(99,102,241,0.2)" : "#1e1e2e",
                    color: isActive ? "#818cf8" : "#4b4b60",
                    borderRadius: 10,
                    padding: "1px 6px",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type Viewport = "mobile" | "tablet" | "desktop";
const VIEWPORT_WIDTHS: Record<Viewport, number | null> = {
  mobile: 375,
  tablet: 768,
  desktop: null,
};
const VIEWPORT_TITLES: Record<Viewport, string> = {
  mobile: "Mobile (375px)",
  tablet: "Tablet (768px)",
  desktop: "Desktop (full)",
};

function IconMobile() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="1"
        y="0.5"
        width="10"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      <circle cx="6" cy="11.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

function IconTablet() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="0.5"
        y="0.5"
        width="13"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      <circle cx="11.5" cy="7" r="0.8" fill="currentColor" />
    </svg>
  );
}

function IconDesktop() {
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="0.5"
        y="0.5"
        width="15"
        height="10"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      <path d="M5 13h6M8 11v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

const VIEWPORT_ICONS: Record<Viewport, () => React.ReactElement> = {
  mobile: IconMobile,
  tablet: IconTablet,
  desktop: IconDesktop,
};

interface DisplayApi {
  showTest: (suiteName: string, testName: string, fallbackHtml?: string) => Promise<boolean>;
  playTest: (suiteName: string, testName: string, speed?: number) => Promise<boolean>;
  displayRoot: HTMLElement;
  runAxe?: () => Promise<import("axe-core").AxeResults>;
  highlight?: (highlights: { path: number[]; color: string }[]) => void;
  getComponentTree?: () => ComponentNode[];
}

function ToolbarTip({ label, children }: { label: string; children: React.ReactNode }) {
  const [tipRect, setTipRect] = useState<DOMRect | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      style={{ position: "relative", display: "flex", flexShrink: 0 }}
      onMouseEnter={() => setTipRect(ref.current?.getBoundingClientRect() ?? null)}
      onMouseLeave={() => setTipRect(null)}
    >
      {children}
      {tipRect && (
        <div
          style={{
            position: "fixed",
            top: tipRect.bottom + 6,
            left: tipRect.left + tipRect.width / 2,
            transform: "translateX(-50%)",
            background: "#1a1a24",
            border: "1px solid #2a2a36",
            borderRadius: 4,
            padding: "3px 8px",
            fontSize: 11,
            color: "#c4c4d4",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 300,
            boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

export function Preview({
  test,
  coverage,
  suites,
  onSelectTest,
  onSelectSuite,
  initialFrame = 0,
  displaySrc = "./index.html",
}: Props) {
  const [grid, setGrid] = useState(false);
  const [outline, setOutline] = useState(false);
  const [measure, setMeasure] = useState(false);
  const [vision, setVision] = useState<VisionFilterType>("none");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [activeFrame, setActiveFrame] = useState(initialFrame);
  const [activeTab, setActiveTab] = useState<Tab>("assertions");
  const [axeViolationCount, setAxeViolationCount] = useState<number | undefined>(undefined);
  const [canvasPaneHeight, setCanvasPaneHeight] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [displayReady, setDisplayReady] = useState(false);
  const [displayHasContent, setDisplayHasContent] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [liveComponentTree, setLiveComponentTree] = useState<ComponentNode[] | null>(null);
  // When a snapshot mismatch exists, show the diff by default.
  // Pressing play hides it so the live iframe can take over.
  const [showComparison, setShowComparison] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // canvasRef points into the display iframe's document after rendering,
  // so tools (axe, measure, trace) operate on the live interactive component.
  const canvasRef = useRef<HTMLElement | null>(null);
  const displayIframeRef = useRef<HTMLIFrameElement>(null);
  const displayApiRef = useRef<DisplayApi | null>(null);

  const measureInfo = useMeasure(
    canvasRef as React.RefObject<HTMLElement | null>,
    measure,
    displayIframeRef.current,
  );
  const toolbarScrollRef = useRef<HTMLDivElement>(null);
  const [toolbarCanScrollLeft, setToolbarCanScrollLeft] = useState(false);
  const [toolbarCanScrollRight, setToolbarCanScrollRight] = useState(false);

  const updateToolbarScroll = useCallback(() => {
    const el = toolbarScrollRef.current;
    if (!el) return;
    setToolbarCanScrollLeft(el.scrollLeft > 0);
    setToolbarCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = toolbarScrollRef.current;
    if (!el) return;
    updateToolbarScroll();
    const ro = new ResizeObserver(updateToolbarScroll);
    ro.observe(el);
    el.addEventListener("scroll", updateToolbarScroll);
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", updateToolbarScroll);
    };
  }, [updateToolbarScroll]);

  const handlePlay = useCallback(() => {
    if (!test || !displayApiRef.current?.playTest || isPlaying) return;
    setShowComparison(false); // hide diff so the live iframe can take over
    setIsPlaying(true);
    displayApiRef.current.playTest(test.suiteName, test.name).then(() => {
      setIsPlaying(false);
      setHasPlayed(true);
      setLiveComponentTree(displayApiRef.current?.getComponentTree?.() ?? null);
    });
  }, [test, isPlaying]);

  const dragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);
  const canvasPaneRef = useRef<HTMLDivElement>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  // Derived values needed before hooks (safe when test is null)
  const snapshotsEarly = test?.snapshots ?? [];
  const safeFrameEarly = Math.min(activeFrame, Math.max(0, snapshotsEarly.length - 1));
  const showingSnapshotEarly = !!snapshotsEarly[safeFrameEarly] && activeFrame > 0;
  const hasMismatch = !!test?.snapshots.some((s) => s.baselineHtml);
  const showLive =
    !!test && displayHasContent && !showingSnapshotEarly && (!hasMismatch || !showComparison);

  // Subscribe to display iframe ready signal
  useEffect(() => {
    return onSandboxMessage("__vt_display_ready", () => {
      const win = displayIframeRef.current?.contentWindow as
        | Record<string, unknown>
        | null
        | undefined;
      const api = win?.["__vtDisplay"] as DisplayApi | undefined;
      if (!api) return;
      displayApiRef.current = api;
      setDisplayReady(true);
    });
  }, []);

  // Re-render in display iframe whenever the selected test changes or completes a run
  const lastSnapshotTimestamp = test?.snapshots[test.snapshots.length - 1]?.timestamp;
  useEffect(() => {
    if (!displayReady || !test || !displayApiRef.current) return;
    if (test.status === "running") return; // wait for run to complete before refreshing
    setDisplayHasContent(false);
    setLiveComponentTree(null);
    canvasRef.current = null;
    const snapHtml = test.snapshots[test.snapshots.length - 1]?.html;
    displayApiRef.current.showTest(test.suiteName, test.name, snapHtml).then((rendered) => {
      setDisplayHasContent(rendered);
      if (rendered) canvasRef.current = displayApiRef.current?.displayRoot ?? null;
    });
  }, [test?.id, displayReady, lastSnapshotTimestamp]);

  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true;
      setIsDragging(true);
      dragStartY.current = e.clientY;
      dragStartH.current = canvasPaneHeight ?? canvasPaneRef.current?.offsetHeight ?? 300;
      e.preventDefault();
    },
    [canvasPaneHeight],
  );

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging.current) return;
      const delta = e.clientY - dragStartY.current;
      setCanvasPaneHeight(
        Math.max(80, Math.min(dragStartH.current + delta, window.innerHeight - 160)),
      );
    }
    function onUp() {
      dragging.current = false;
      setIsDragging(false);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "m" || e.key === "M") setMeasure((v) => !v);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Position the display iframe as a CSS overlay on the canvas pane when showing live content
  useLayoutEffect(() => {
    const iframe = displayIframeRef.current;
    if (!iframe) return;

    if (!showLive) {
      iframe.style.cssText =
        "position:fixed;top:0;left:0;width:0;height:0;border:none;pointer-events:none;overflow:hidden";
      return;
    }

    const canvas = contentAreaRef.current;
    if (!canvas) return;

    const vw = VIEWPORT_WIDTHS[viewport];
    const visionCss =
      vision !== "none"
        ? vision === "blurred"
          ? "filter:blur(2px)"
          : "filter:url(#fieldtest-vision-filter)"
        : "";

    const update = () => {
      if (expanded) {
        const expW = window.innerWidth * 0.8;
        const expH = window.innerHeight * 0.8;
        const parts: string[] = [
          "position:fixed",
          `top:${window.innerHeight * 0.1}px`,
          `left:${window.innerWidth * 0.1}px`,
          `width:${expW}px`,
          `height:${expH}px`,
          "border:none",
          "pointer-events:auto",
          "overflow:auto",
          "background:#0f0f13",
          "z-index:100",
          "opacity:1",
          "border-radius:8px",
          "outline:1px solid rgba(99,102,241,0.4)",
          "box-shadow:0 0 0 4px rgba(99,102,241,0.06),0 24px 64px rgba(0,0,0,0.6)",
        ];
        if (visionCss) parts.push(visionCss);
        iframe.style.cssText = parts.join(";");
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const frameW = vw !== null ? Math.min(vw, rect.width) : rect.width;
      const frameLeft = rect.left + (rect.width - frameW) / 2;
      const parts: string[] = [
        "position:fixed",
        `top:${rect.top}px`,
        `left:${frameLeft}px`,
        `width:${frameW}px`,
        `height:${rect.height}px`,
        "border:none",
        isPlaying || hasPlayed ? "pointer-events:auto" : "pointer-events:none",
        "overflow:auto",
        "background:transparent",
        "z-index:10",
        isPlaying || hasPlayed ? "opacity:1" : "opacity:0.45",
        "transition:opacity 0.2s",
      ];
      if (visionCss) parts.push(visionCss);
      if (vw !== null)
        parts.push(
          "outline:1px solid rgba(99,102,241,0.4)",
          "box-shadow:0 0 0 4px rgba(99,102,241,0.06)",
        );
      iframe.style.cssText = parts.join(";");
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(canvas);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [showLive, canvasPaneHeight, viewport, vision, isPlaying, hasPlayed, expanded]);

  const prevTestId = useRef<string | null>(null);
  if ((test?.id ?? null) !== prevTestId.current) {
    prevTestId.current = test?.id ?? null;
    if (activeFrame !== initialFrame) setActiveFrame(initialFrame);
    if (activeTab === "timeline") setActiveTab("assertions");
    if (isPlaying) setIsPlaying(false);
    if (hasPlayed) setHasPlayed(false);
    setShowComparison(true); // re-show diff when switching to a new test
  }

  if (!test) {
    return (
      <>
        {/* Keep display iframe alive in the background */}
        <iframe
          ref={displayIframeRef}
          name="__vt_display"
          src={displaySrc}
          title="FieldTest Display"
          style={{ position: "fixed", width: 0, height: 0, border: "none", pointerEvents: "none" }}
        />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#4b4b60",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>◌</div>
            <div style={{ fontSize: 14 }}>Select a test to preview</div>
          </div>
        </div>
      </>
    );
  }

  const snapshots = test.snapshots;
  const safeFrame = Math.min(activeFrame, Math.max(0, snapshots.length - 1));
  const activeSnap = snapshots[safeFrame] ?? null;
  // Show the timeline snapshot HTML when the user has selected a history frame
  const showingSnapshot = activeSnap && activeFrame > 0;
  const displayDoc = displayIframeRef.current?.contentDocument;

  const mockCallCount = test.mockEntries.reduce((n, e) => n + e.calls.length, 0);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "assertions", label: "Assertions", count: test.assertions.length },
    ...(snapshots.length > 1
      ? [{ id: "timeline" as Tab, label: "Timeline", count: snapshots.length }]
      : []),
    {
      id: "accessibility",
      label: "Accessibility",
      ...(axeViolationCount !== undefined ? { count: axeViolationCount } : {}),
    },
    { id: "trace", label: "Trace" },
    { id: "code", label: "Code" },
    ...(test.consoleLogs.length > 0
      ? [{ id: "console" as Tab, label: "Console", count: test.consoleLogs.length }]
      : [{ id: "console" as Tab, label: "Console" }]),
    ...(test.mockEntries.length > 0
      ? [{ id: "mocks" as Tab, label: "Mocks", count: mockCallCount || test.mockEntries.length }]
      : [{ id: "mocks" as Tab, label: "Mocks" }]),
    { id: "dependencies", label: "Dependencies" },
    ...getRegisteredTabs().map((p) => ({
      id: p.id,
      label: p.label,
      count: p.getCount?.(test),
    })),
  ];

  const viewportW = VIEWPORT_WIDTHS[viewport];
  const constraintStyle =
    viewportW !== null
      ? {
          width: viewportW,
          overflow: "hidden" as const,
          outline: "1px solid rgba(99,102,241,0.4)",
          boxShadow: "0 0 0 4px rgba(99,102,241,0.06)",
        }
      : {};

  return (
    <>
      {/* Display iframe — always mounted, hidden until used */}
      <iframe
        ref={displayIframeRef}
        name="__vt_display"
        src={displaySrc}
        title="FieldTest Display"
        style={{ position: "fixed", width: 0, height: 0, border: "none", pointerEvents: "none" }}
      />

      {/* Backdrop for expanded mode */}
      {expanded && (
        <div
          onClick={() => setExpanded(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 99,
          }}
        />
      )}

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "10px 20px",
            borderBottom: "1px solid #2a2a36",
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#16161d",
            flexShrink: 0,
          }}
        >
          <StatusIcon status={test.status} />
          {onSelectSuite ? (
            <button
              onClick={() => onSelectSuite(test.suiteId)}
              style={{
                fontSize: 12,
                color: "#6b7280",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#a5b4fc")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#6b7280")}
            >
              {test.suiteName}
            </button>
          ) : (
            <span style={{ fontSize: 12, color: "#6b7280" }}>{test.suiteName}</span>
          )}
          <span style={{ color: "#3a3a4e" }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#c4c4d4" }}>{test.name}</span>
        </div>

        {/* Top pane — canvas */}
        <div
          ref={canvasPaneRef}
          style={{
            ...(canvasPaneHeight !== null
              ? { height: canvasPaneHeight, flexShrink: 0 }
              : { flex: 1 }),
            display: "flex",
            flexDirection: "column",
            background: "#0f0f13",
          }}
        >
          {/* Toolbar row — above the scroll area so content is never obstructed */}
          <div style={{ flexShrink: 0, position: "relative", borderBottom: "1px solid #1a1a24" }}>
            {/* Left fade + arrow */}
            {toolbarCanScrollLeft && (
              <div
                onClick={() => {
                  toolbarScrollRef.current?.scrollBy({ left: -80, behavior: "smooth" });
                }}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 32,
                  zIndex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(to right, #0f0f13 60%, transparent)",
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M7.5 2L3.5 6l4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
            {/* Right fade + arrow */}
            {toolbarCanScrollRight && (
              <div
                onClick={() => {
                  toolbarScrollRef.current?.scrollBy({ left: 80, behavior: "smooth" });
                }}
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 32,
                  zIndex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(to left, #0f0f13 60%, transparent)",
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M4.5 2L8.5 6l-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
            <div
              ref={toolbarScrollRef}
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                overflowX: "auto",
                scrollbarWidth: "none",
              }}
            >
              <ToolbarTip label={isPlaying ? "Playing…" : "Play test"}>
                <button
                  onClick={handlePlay}
                  disabled={isPlaying}
                  style={{
                    flexShrink: 0,
                    width: 26,
                    height: 26,
                    borderRadius: 5,
                    border: "1px solid",
                    borderColor: isPlaying ? "rgba(99,102,241,0.6)" : "#2a2a36",
                    background: isPlaying ? "rgba(99,102,241,0.2)" : "transparent",
                    color: isPlaying ? "#a5b4fc" : "#4b4b60",
                    cursor: isPlaying ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "auto",
                  }}
                >
                  {isPlaying ? (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      style={{ animation: "spin 1s linear infinite" }}
                    >
                      <circle
                        cx="6"
                        cy="6"
                        r="4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeDasharray="14 7"
                      />
                    </svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                      <path d="M2 1.5l7 3.5-7 3.5V1.5z" />
                    </svg>
                  )}
                </button>
              </ToolbarTip>
              <div style={{ flexShrink: 0, width: 1, height: 16, background: "#2a2a36" }} />
              {(["mobile", "tablet", "desktop"] as Viewport[]).map((vp) => {
                const Icon = VIEWPORT_ICONS[vp];
                const isActive = viewport === vp;
                return (
                  <ToolbarTip key={vp} label={VIEWPORT_TITLES[vp]}>
                    <button
                      onClick={() => setViewport(vp)}
                      style={{
                        flexShrink: 0,
                        width: 26,
                        height: 26,
                        borderRadius: 5,
                        border: "1px solid",
                        borderColor: isActive ? "rgba(99,102,241,0.6)" : "#2a2a36",
                        background: isActive ? "rgba(99,102,241,0.2)" : "transparent",
                        color: isActive ? "#a5b4fc" : "#4b4b60",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon />
                    </button>
                  </ToolbarTip>
                );
              })}
              <div style={{ flexShrink: 0, width: 1, height: 16, background: "#2a2a36" }} />
              <ToolbarTip label="Measure element (M)">
                <MeasureToggle value={measure} onChange={setMeasure} />
              </ToolbarTip>
              <ToolbarTip label="Toggle outlines">
                <OutlineToggle value={outline} onChange={setOutline} targetDocument={displayDoc} />
              </ToolbarTip>
              <ToolbarTip label="Toggle grid">
                <GridToggle value={grid} onChange={setGrid} />
              </ToolbarTip>
              <div style={{ flexShrink: 0, width: 1, height: 16, background: "#2a2a36" }} />
              <ToolbarTip label="Vision simulation">
                <VisionFilter value={vision} onChange={setVision} />
              </ToolbarTip>
              <div style={{ flexShrink: 0, width: 1, height: 16, background: "#2a2a36" }} />
              <ToolbarTip label={expanded ? "Collapse preview" : "Expand preview"}>
                <button
                  onClick={() => setExpanded((v) => !v)}
                  style={{
                    flexShrink: 0,
                    width: 26,
                    height: 26,
                    borderRadius: 5,
                    border: "1px solid",
                    borderColor: expanded ? "rgba(99,102,241,0.6)" : "#2a2a36",
                    background: expanded ? "rgba(99,102,241,0.2)" : "transparent",
                    color: expanded ? "#a5b4fc" : "#4b4b60",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {expanded ? (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M4.5 1.5H1.5v3M7.5 1.5h3v3M4.5 10.5H1.5v-3M7.5 10.5h3v-3" />
                    </svg>
                  ) : (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M1.5 4.5V1.5h3M10.5 4.5V1.5h-3M1.5 7.5v3h3M10.5 7.5v3h-3" />
                    </svg>
                  )}
                </button>
              </ToolbarTip>
            </div>
          </div>

          {/* Content area — scrollable */}
          <div ref={contentAreaRef} style={{ flex: 1, overflow: "auto" }}>
            {displayHasContent || showingSnapshot || activeSnap?.baselineHtml ? (
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "100%",
                  padding: 24,
                  ...gridStyle(grid),
                }}
              >
                {/* Timeline snapshot view (static HTML) */}
                {showingSnapshot && !activeSnap.baselineHtml && (
                  <div style={{ ...constraintStyle, ...visionFilterStyle(vision) }}>
                    <SnapshotFrame
                      html={activeSnap.html}
                      displayWidth={800}
                      displayHeight={600}
                      virtualWidth={1024}
                    />
                  </div>
                )}

                {/* Side-by-side snapshot comparison — shown when a mismatch exists and the user hasn't pressed play */}
                {activeSnap?.baselineHtml && showComparison && (
                  <SnapshotDiff
                    baseline={activeSnap.baselineHtml}
                    current={activeSnap.html}
                    vision={vision}
                  />
                )}

                {/* Live interactive component is shown in the display iframe overlay (positioned by useLayoutEffect) */}
                {showLive && <div style={{ width: "100%", minHeight: 200 }} />}

                {/* Hint overlay — shown when the live component is visible but not playing */}
                {showLive && !isPlaying && !hasPlayed && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 12,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "rgba(15,15,19,0.85)",
                      border: "1px solid #2a2a36",
                      borderRadius: 6,
                      padding: "5px 10px",
                      fontSize: 11,
                      color: "#6b7280",
                      pointerEvents: "none",
                      whiteSpace: "nowrap",
                      zIndex: 20,
                    }}
                  >
                    Press <span style={{ color: "#a5b4fc" }}>▶</span> to run the test and interact
                  </div>
                )}

                <MeasureOverlay info={measureInfo} />
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#4b4b60",
                  height: "100%",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 40,
                      marginBottom: 10,
                      color: test.status === "pass" ? "#22c55e" : "#4b4b60",
                    }}
                  >
                    {test.status === "pass" ? "✓" : test.status === "pending" ? "○" : "◌"}
                  </div>
                  <div style={{ fontSize: 13 }}>
                    {test.status === "pass"
                      ? "Passed — no visual output"
                      : test.status === "pending"
                        ? "Run tests to see results"
                        : "◌"}
                  </div>
                </div>
              </div>
            )}

            {test.error && test.assertions.every((a) => a.status === "pass") && (
              <div
                style={{
                  margin: "16px 20px",
                  padding: 16,
                  borderRadius: 8,
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>
                  Error
                </div>
                <pre
                  style={{
                    fontSize: 12,
                    color: "#fca5a5",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    fontFamily: "monospace",
                  }}
                >
                  {test.error}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={onDragStart}
          style={{
            height: 6,
            flexShrink: 0,
            cursor: "row-resize",
            background: "#16161d",
            borderTop: "1px solid #2a2a36",
            borderBottom: "1px solid #2a2a36",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
          }}
        >
          <div style={{ width: 32, height: 2, borderRadius: 2, background: "#3a3a4e" }} />
        </div>

        {/* Bottom pane — tabs */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "#0f0f13",
          }}
        >
          <div style={{ borderBottom: "1px solid #2a2a36", flexShrink: 0 }}>
            <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
          </div>
          <div style={{ flex: 1, overflow: "auto" }}>
            {activeTab === "assertions" && (
              <AssertionsTab assertions={test.assertions} suiteId={test.suiteId} />
            )}
            {activeTab === "timeline" && (
              <Timeline snapshots={snapshots} active={safeFrame} onSelect={setActiveFrame} />
            )}
            {activeTab === "accessibility" && (
              <AxePanel
                containerRef={canvasRef as React.RefObject<HTMLElement | null>}
                runAxe={displayApiRef.current?.runAxe}
                active={true}
                onResults={setAxeViolationCount}
              />
            )}
            {activeTab === "trace" && (
              <TraceTab
                nodes={liveComponentTree ?? activeSnap?.componentTree ?? []}
                onHighlight={(highlights) => displayApiRef.current?.highlight?.(highlights)}
              />
            )}
            {activeTab === "code" && (
              <CodeTab
                suiteName={test.suiteName}
                coverage={coverage}
                testCoverage={test.testCoverage}
                suites={suites}
                onSelectTest={onSelectTest}
              />
            )}
            {activeTab === "console" && <ConsoleTab consoleLogs={test.consoleLogs} />}
            {activeTab === "mocks" && <MocksPanel test={test} />}
            {activeTab === "dependencies" && (
              <DepsTab sourceFile={suites.find((s) => s.id === test.suiteId)?.sourceFile} />
            )}
            {getRegisteredTabs().map((plugin) => {
              if (activeTab !== plugin.id) return null;
              const Component = getPluginComponent(plugin);
              if (!Component) return null;
              return (
                <React.Suspense key={plugin.id} fallback={null}>
                  <Component test={test} />
                </React.Suspense>
              );
            })}
          </div>
        </div>
      </div>

      {/* Drag capture overlay — sits above the iframe so mouseup is never swallowed */}
      {isDragging && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, cursor: "row-resize" }} />
      )}
    </>
  );
}
