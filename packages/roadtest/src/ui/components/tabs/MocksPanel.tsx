import React, { useState, useEffect } from "react";
import type { TestCase, MockEntry, MockCall } from "../../../framework/types";

function safeDisplay(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function ArgList({ args }: { args: unknown[] }) {
  if (args.length === 0) return <span style={{ color: "#4b4b60" }}>()</span>;
  return (
    <span>
      <span style={{ color: "#6b7280" }}>(</span>
      {args.map((arg, i) => (
        <span key={i}>
          {i > 0 && <span style={{ color: "#6b7280" }}>, </span>}
          <span style={{ color: "#a5b4fc", fontFamily: "monospace" }}>{safeDisplay(arg)}</span>
        </span>
      ))}
      <span style={{ color: "#6b7280" }}>)</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Minimal VLQ decoder — used for source map resolution
// ---------------------------------------------------------------------------

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const B64_MAP: Record<string, number> = Object.fromEntries([...B64].map((c, i) => [c, i]));

/** Decode a VLQ-encoded segment (e.g. "AAAA") into an array of signed integers. */
function decodeVlq(encoded: string): number[] {
  const out: number[] = [];
  let val = 0;
  let shift = 0;
  for (const c of encoded) {
    const digit = B64_MAP[c] ?? 0;
    val |= (digit & 0x1f) << shift;
    shift += 5;
    if (!(digit & 0x20)) {
      out.push(val & 1 ? -(val >> 1) : val >> 1);
      val = 0;
      shift = 0;
    }
  }
  return out;
}

interface SourceMapV3 {
  sources: string[];
  sourcesContent?: (string | null)[];
  mappings: string;
}

/** Walk a parsed source map to resolve a generated line → original position. */
function resolveFromMap(
  sm: SourceMapV3,
  targetLine: number,
): { line: number; content: string | null } | null {
  const lines = sm.mappings.split(";");
  const targetIdx = targetLine - 1; // 0-based

  // Walk all generated lines up to targetIdx accumulating cumulative VLQ state.
  // genCol resets per line; srcIndex/srcLine are cumulative across all mappings.
  let srcIndex = 0;
  let srcLine = 0;
  let resolved: { srcIndex: number; srcLine: number } | null = null;

  for (let gi = 0; gi <= targetIdx && gi < lines.length; gi++) {
    const lineStr = lines[gi];
    if (!lineStr) continue;

    for (const seg of lineStr.split(",")) {
      if (!seg) continue;
      const fields = decodeVlq(seg);
      if (fields.length < 4) continue; // 1-field = unmapped column, skip

      srcIndex += fields[1];
      srcLine += fields[2];

      if (gi === targetIdx && resolved === null) {
        resolved = { srcIndex, srcLine };
      }
    }
  }

  if (!resolved) return null;

  const content = sm.sourcesContent?.[resolved.srcIndex] ?? null;
  return { line: resolved.srcLine + 1, content };
}

/**
 * Try to extract and apply an inline base64 source map from the content of a
 * Vite-served file.  Returns null when no inline source map is present.
 */
function resolveViaInlineSourceMap(
  transformedText: string,
  targetLine: number,
): { line: number; content: string | null } | null {
  // Match loosely — some Vite versions emit ";charset=utf-8" before ";base64"
  const m = transformedText.match(
    /\/\/# sourceMappingURL=data:application\/json[^,]*,([A-Za-z0-9+/=]+)/,
  );
  if (!m) return null;
  try {
    const sm = JSON.parse(atob(m[1])) as SourceMapV3;
    return resolveFromMap(sm, targetLine);
  } catch {
    return null;
  }
}

/**
 * If the file has an external `//# sourceMappingURL=foo.map` reference, fetch
 * it and apply the map.  Falls back to trying `${sourceUrl}.map` directly.
 */
async function resolveViaExternalSourceMap(
  transformedText: string,
  sourceUrl: string,
  targetLine: number,
): Promise<{ line: number; content: string | null } | null> {
  // Extract whatever is after sourceMappingURL= (could be relative path or absolute)
  const m = transformedText.match(/\/\/# sourceMappingURL=([^\s]+)/);
  const mapRef = m?.[1];

  // Determine the URL(s) to try
  const candidates: string[] = [];
  if (mapRef && !mapRef.startsWith("data:")) {
    try {
      candidates.push(new URL(mapRef, sourceUrl).href);
    } catch {
      /* ignore */
    }
  }
  // Always also try the conventional .map suffix
  candidates.push(`${sourceUrl}.map`);

  for (const mapUrl of candidates) {
    try {
      const res = await fetch(mapUrl);
      if (!res.ok) continue;
      const sm = (await res.json()) as SourceMapV3;
      const result = resolveFromMap(sm, targetLine);
      if (result) return result;
    } catch {
      /* try next */
    }
  }
  return null;
}

/**
 * OXC's development JSX transform embeds the original source position inside
 * every jsxDEV() call:
 *
 *   }, void 0, false, { fileName: _jsxFileName, lineNumber: 90, columnNumber: 9 }, _self)
 *
 * When source map resolution fails (e.g. the chained map is dropped), scan the
 * generated lines around the target for this annotation and use it as the
 * original line number.  Returns null when the pattern is not found.
 */
function extractLineFromJSXAnnotation(transformedText: string, targetLine: number): number | null {
  const lines = transformedText.split("\n");

  // In compiled JSX the __source annotation ({ fileName, lineNumber, columnNumber })
  // is the 5th arg to jsxDEV(), appearing AFTER the children prop.  The target line
  // sits inside the children, so the annotation is a few lines FORWARD:
  //
  //   Line N:   children: getGreeting("Team")   ← target (1-based)
  //   Line N+1: }, void 0, false, {
  //   Line N+2:   fileName: _jsxFileName,
  //   Line N+3:   lineNumber: 90,               ← annotation we want
  //
  // Search forward first.  `i` is a 0-based index; start at `targetLine`
  // which is 1-based → 0-based index targetLine = the line *after* the target.
  const hiForward = Math.min(lines.length - 1, targetLine + 10);
  for (let i = targetLine; i <= hiForward; i++) {
    const m = lines[i].match(/\blineNumber:\s*(\d+)/);
    if (m) return parseInt(m[1], 10);
  }

  // Backward fallback — in case we somehow overshoot (shouldn't be needed normally).
  const lo = Math.max(0, targetLine - 10);
  for (let i = targetLine - 2; i >= lo; i--) {
    const m = lines[i].match(/\blineNumber:\s*(\d+)/);
    if (m) return parseInt(m[1], 10);
  }

  return null;
}

// ---------------------------------------------------------------------------
// Stack frame parsing
// ---------------------------------------------------------------------------

interface StackFrame {
  /** Shortened display text, e.g. "    at App (App.tsx:90:19)" */
  text: string;
  /** Vite-relative path, e.g. "/src/App.tsx" */
  vitePath: string | null;
  /**
   * Full URL of the Vite-served file without query string,
   * e.g. "http://localhost:5173/src/App.tsx".
   * Line numbers in Error.stack refer to the content at this URL
   * (which may be Istanbul-instrumented).
   */
  sourceUrl: string | null;
  /** 1-based line number in the executed (possibly instrumented) file */
  line: number | null;
}

function parseStack(raw: string): StackFrame[] {
  const extractPathRegex = /\s+at.*?[(\s](.*?)\)?$/;

  return raw
    .split("\n")
    .filter((line, i) => {
      if (i === 0 && /^\w*Error/.test(line.trim())) return false;
      if (line.trim() === "") return false;
      if (!line.includes("    at ")) return true;
      const match = line.match(extractPathRegex)?.[1] ?? "";
      if (match.includes("/@fs/")) return false;
      if (match.includes("/node_modules/")) return false;
      if (match.includes("/@id/")) return false;
      if (match.includes("/virtual:")) return false;
      return true;
    })
    .map((line): StackFrame => {
      // Match: (http://localhost:5173/src/App.tsx?t=123:1218:19)
      const urlMatch = line.match(/\((https?:\/\/[^/]+)(\/[^?)\s]*?)(?:\?[^):]*)?:(\d+):(\d+)\)/);
      if (urlMatch) {
        const [, origin, path, lineStr, colStr] = urlMatch;
        const vitePath = path;
        const sourceUrl = `${origin}${path}`;
        const lineNum = parseInt(lineStr, 10);
        const shortText = line.replace(
          /\(https?:\/\/[^/]+\/[^?)\s]*?(?:\?[^):]*)?:(\d+):(\d+)\)/,
          `(${path.split("/").pop()}:${lineStr}:${colStr})`,
        );
        return { text: shortText, vitePath, sourceUrl, line: lineNum };
      }
      return { text: line, vitePath: null, sourceUrl: null, line: null };
    });
}

// ---------------------------------------------------------------------------
// Source fetching (with source map resolution)
// ---------------------------------------------------------------------------

/**
 * Resolved source ready for display.
 * `line` is the 1-based line in `content` to highlight.
 */
interface ResolvedSource {
  content: string;
  line: number;
}

const _cache = new Map<string, ResolvedSource | null | "pending">();

/**
 * Fetch the Vite-served file at `sourceUrl`, apply its inline source map to
 * map `generatedLine` back to the original source, and return the original
 * content + resolved line.
 *
 * Falls back to raw on-disk source (via /__roadtest_source__ or
 * roadtest-sources.json) when source map resolution is unavailable.
 */
async function fetchResolved(
  vitePath: string,
  sourceUrl: string | null,
  generatedLine: number,
): Promise<ResolvedSource | null> {
  const cacheKey = `${sourceUrl ?? vitePath}:${generatedLine}`;
  const cached = _cache.get(cacheKey);
  if (cached !== undefined && cached !== "pending") return cached;

  _cache.set(cacheKey, "pending");

  // Helper: fetch the raw on-disk source (used as content when sourcesContent is absent)
  async function fetchRawSource(): Promise<string | null> {
    try {
      const res = await fetch(`/__roadtest_source__?url=${encodeURIComponent(vitePath)}`);
      if (res.ok) return res.text();
    } catch {
      /* build mode */
    }
    try {
      const jsonRes = await fetch("./roadtest-sources.json");
      if (jsonRes.ok) {
        const sources = (await jsonRes.json()) as Record<string, string>;
        const key = Object.keys(sources).find((k) => k.endsWith(vitePath));
        if (key) return sources[key];
      }
    } catch {
      /* not available */
    }
    return null;
  }

  // 1. Fetch Vite-served file and try three source-position strategies in order
  if (sourceUrl) {
    try {
      const res = await fetch(sourceUrl);
      if (res.ok) {
        const transformedText = await res.text();

        // 1a. Inline base64 source map (most common in Vite dev)
        let resolution =
          resolveViaInlineSourceMap(transformedText, generatedLine) ??
          // 1b. External .map file (Vite may write a separate file)
          (await resolveViaExternalSourceMap(transformedText, sourceUrl, generatedLine));

        if (resolution) {
          const content = resolution.content ?? (await fetchRawSource());
          if (content) {
            const result = { content, line: resolution.line };
            _cache.set(cacheKey, result);
            return result;
          }
        }

        // 1c. OXC dev JSX annotation: lineNumber: N embedded near the call site
        const jsxLine = extractLineFromJSXAnnotation(transformedText, generatedLine);
        if (jsxLine !== null) {
          const raw = await fetchRawSource();
          if (raw) {
            const result = { content: raw, line: jsxLine };
            _cache.set(cacheKey, result);
            return result;
          }
        }

        // 1d. No source position info — show transformed content as-is
        const numLines = transformedText.split("\n").length;
        if (generatedLine <= numLines) {
          const result = { content: transformedText, line: generatedLine };
          _cache.set(cacheKey, result);
          return result;
        }
      }
    } catch {
      // sourceUrl not reachable (build mode)
    }
  }

  // 2. No sourceUrl — fetch raw source and use generated line (may be off with Istanbul)
  {
    const raw = await fetchRawSource();
    if (raw) {
      const result: ResolvedSource = {
        content: raw,
        line: Math.min(generatedLine, raw.split("\n").length),
      };
      _cache.set(cacheKey, result);
      return result;
    }
  }

  _cache.set(cacheKey, null);
  return null;
}

// ---------------------------------------------------------------------------
// UI components
// ---------------------------------------------------------------------------

function SourceSnippet({
  vitePath,
  sourceUrl,
  targetLine,
}: {
  vitePath: string;
  sourceUrl: string | null;
  targetLine: number;
}) {
  const [resolved, setResolved] = useState<ResolvedSource | null | "loading">("loading");

  useEffect(() => {
    let cancelled = false;
    fetchResolved(vitePath, sourceUrl, targetLine).then((r) => {
      if (!cancelled) setResolved(r);
    });
    return () => {
      cancelled = true;
    };
  }, [vitePath, sourceUrl, targetLine]);

  if (resolved === "loading") {
    return (
      <div
        style={{
          padding: "4px 12px 4px 40px",
          fontSize: 11,
          color: "#4b4b60",
          fontFamily: "monospace",
        }}
      >
        loading…
      </div>
    );
  }
  if (resolved === null) {
    return (
      <div
        style={{
          padding: "4px 12px 4px 40px",
          fontSize: 11,
          color: "#4b4b60",
          fontFamily: "monospace",
        }}
      >
        source not available
      </div>
    );
  }

  const allLines = resolved.content.split("\n");
  const line = resolved.line;
  const start = Math.max(0, line - 4);
  const end = Math.min(allLines.length, line + 3);
  const snippet = allLines.slice(start, end);

  return (
    <div
      style={{
        background: "#080810",
        borderTop: "1px solid #1a1a24",
        fontFamily: "monospace",
        fontSize: 11,
        overflowX: "auto",
      }}
    >
      {snippet.map((lineText, i) => {
        const lineNum = start + i + 1;
        const isTarget = lineNum === line;
        return (
          <div
            key={lineNum}
            style={{
              display: "flex",
              background: isTarget ? "rgba(129,140,248,0.08)" : undefined,
              borderLeft: isTarget ? "2px solid #818cf8" : "2px solid transparent",
            }}
          >
            <span
              style={{
                width: 36,
                textAlign: "right",
                paddingRight: 8,
                color: isTarget ? "#818cf8" : "#3a3a4e",
                userSelect: "none",
                flexShrink: 0,
              }}
            >
              {lineNum}
            </span>
            <span
              style={{
                color: isTarget ? "#c4c4d4" : "#5a5a74",
                whiteSpace: "pre",
              }}
            >
              {lineText}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StackFrameRow({ frame }: { frame: StackFrame }) {
  const [open, setOpen] = useState(false);
  const clickable = frame.vitePath !== null && frame.line !== null;

  return (
    <div>
      <button
        onClick={() => clickable && setOpen((v) => !v)}
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          background: "none",
          border: "none",
          padding: "1px 0",
          cursor: clickable ? "pointer" : "default",
          fontFamily: "monospace",
          fontSize: 10,
          color: clickable ? "#6b7280" : "#3a3a4e",
          whiteSpace: "pre",
        }}
      >
        {frame.text}
        {clickable && <span style={{ color: "#4b4b60", marginLeft: 4 }}>{open ? "▲" : "▼"}</span>}
      </button>
      {open && frame.vitePath && frame.line && (
        <SourceSnippet
          vitePath={frame.vitePath}
          sourceUrl={frame.sourceUrl}
          targetLine={frame.line}
        />
      )}
    </div>
  );
}

function StackView({ frames }: { frames: StackFrame[] }) {
  if (frames.length === 0) return null;
  return (
    <div style={{ padding: "6px 12px 6px 40px", borderTop: "1px solid #1a1a24" }}>
      {frames.map((frame, i) => (
        <StackFrameRow key={i} frame={frame} />
      ))}
    </div>
  );
}

function CallRow({ call, index }: { call: MockCall; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const time = new Date(call.timestamp).toISOString().slice(11, 23);
  const resultDisplay = safeDisplay(call.result);
  const isMultiline = resultDisplay.includes("\n");
  const frames = call.stack ? parseStack(call.stack) : [];
  const canExpand = isMultiline || frames.length > 0;

  return (
    <div style={{ borderBottom: "1px solid #1a1a24" }}>
      <button
        onClick={() => canExpand && setExpanded((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          background: "none",
          border: "none",
          cursor: canExpand ? "pointer" : "default",
          textAlign: "left",
        }}
      >
        <span
          style={{
            color: "#3a3a4e",
            fontSize: 10,
            fontFamily: "monospace",
            flexShrink: 0,
            width: 20,
          }}
        >
          {index}
        </span>
        <code
          style={{
            fontSize: 11,
            color: "#c4c4d4",
            fontFamily: "monospace",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <ArgList args={call.args} />
          <span style={{ color: "#4b4b60", margin: "0 6px" }}>→</span>
          {call.threw ? (
            <span style={{ color: "#f87171" }}>threw {resultDisplay}</span>
          ) : (
            <span style={{ color: "#34d399" }}>
              {isMultiline && !expanded ? "{…}" : resultDisplay}
            </span>
          )}
        </code>
        <span style={{ fontSize: 10, color: "#3a3a4e", fontFamily: "monospace", flexShrink: 0 }}>
          {time}
        </span>
        {canExpand && (
          <span style={{ fontSize: 10, color: "#4b4b60", flexShrink: 0 }}>
            {expanded ? "▲" : "▼"}
          </span>
        )}
      </button>
      {expanded && (
        <div style={{ background: "#0f0f13" }}>
          {isMultiline && (
            <pre
              style={{
                margin: 0,
                padding: "6px 12px 6px 40px",
                fontSize: 11,
                fontFamily: "monospace",
                color: "#34d399",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {resultDisplay}
            </pre>
          )}
          {frames.length > 0 && <StackView frames={frames} />}
        </div>
      )}
    </div>
  );
}

function MockEntryRow({ entry }: { entry: MockEntry }) {
  const [open, setOpen] = useState(true);

  const byFn = new Map<string, MockCall[]>();
  for (const call of entry.calls) {
    const bucket = byFn.get(call.fnName) ?? [];
    bucket.push(call);
    byFn.set(call.fnName, bucket);
  }

  return (
    <div
      style={{ marginBottom: 8, border: "1px solid #2a2a36", borderRadius: 8, overflow: "hidden" }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
          background: "#1a1a24",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            flexShrink: 0,
            color: entry.hasFactory ? "#34d399" : "#9ca3af",
            background: entry.hasFactory ? "rgba(52,211,153,0.1)" : "rgba(156,163,175,0.1)",
            border: `1px solid ${entry.hasFactory ? "rgba(52,211,153,0.3)" : "rgba(156,163,175,0.2)"}`,
            borderRadius: 4,
            padding: "2px 6px",
          }}
        >
          {entry.hasFactory ? "FACTORY" : "AUTO"}
        </span>
        <code style={{ fontSize: 12, color: "#c4c4d4", fontFamily: "monospace", flex: 1 }}>
          {entry.moduleId}
        </code>
        {entry.calls.length > 0 && (
          <span style={{ fontSize: 11, color: "#6b7280", flexShrink: 0 }}>
            {entry.calls.length} call{entry.calls.length !== 1 ? "s" : ""}
          </span>
        )}
        <span style={{ fontSize: 10, color: "#3a3a4e" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ background: "#0f0f13" }}>
          {entry.calls.length === 0 ? (
            <div style={{ padding: "10px 12px", fontSize: 12, color: "#4b4b60" }}>
              Mock registered — no calls recorded during this test
            </div>
          ) : (
            Array.from(byFn.entries()).map(([fnName, calls]) => (
              <div key={fnName}>
                <div
                  style={{
                    padding: "5px 12px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#818cf8",
                    background: "#13131a",
                    borderTop: "1px solid #2a2a36",
                    borderBottom: "1px solid #1a1a24",
                    fontFamily: "monospace",
                  }}
                >
                  {fnName}
                  <span style={{ fontWeight: 400, color: "#4b4b60", marginLeft: 6 }}>
                    {calls.length} call{calls.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {calls.map((call, i) => (
                  <CallRow key={i} call={call} index={i} />
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function MocksPanel({ test }: { test: TestCase }) {
  const { mockEntries } = test;

  if (mockEntries.length === 0) {
    return (
      <div style={{ padding: "32px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#4b4b60" }}>No module mocks active for this test</div>
        <div style={{ fontSize: 12, color: "#3a3a4e", marginTop: 6 }}>
          Use{" "}
          <code style={{ fontFamily: "monospace", color: "#818cf8" }}>mock(moduleId, factory)</code>{" "}
          at the top of your test file
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 16px" }}>
      {mockEntries.map((entry, i) => (
        <MockEntryRow key={i} entry={entry} />
      ))}
    </div>
  );
}
