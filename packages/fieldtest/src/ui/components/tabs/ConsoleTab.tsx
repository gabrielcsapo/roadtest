import { useState } from "react";
import type { ConsoleEntry } from "../../../framework/types";

const LEVEL_STYLES: Record<
  ConsoleEntry["level"],
  { color: string; bg: string; border: string; badge: string }
> = {
  log: {
    color: "#c4c4d4",
    bg: "transparent",
    border: "transparent",
    badge: "#4b4b60",
  },
  info: {
    color: "#93c5fd",
    bg: "rgba(59,130,246,0.06)",
    border: "rgba(59,130,246,0.15)",
    badge: "#3b82f6",
  },
  warn: {
    color: "#fcd34d",
    bg: "rgba(234,179,8,0.06)",
    border: "rgba(234,179,8,0.15)",
    badge: "#ca8a04",
  },
  error: {
    color: "#fca5a5",
    bg: "rgba(239,68,68,0.07)",
    border: "rgba(239,68,68,0.2)",
    badge: "#ef4444",
  },
  debug: {
    color: "#6b7280",
    bg: "transparent",
    border: "transparent",
    badge: "#374151",
  },
};

const LEVEL_ICON: Record<ConsoleEntry["level"], string> = {
  log: "›",
  info: "ℹ",
  warn: "⚠",
  error: "✗",
  debug: "·",
};

// ─── Primitive value renderer ─────────────────────────────────────────────────

function PrimitiveValue({ value }: { value: unknown }) {
  if (value === null) return <span style={{ color: "#9ca3af" }}>null</span>;
  if (value === undefined) return <span style={{ color: "#9ca3af" }}>undefined</span>;
  if (typeof value === "boolean") return <span style={{ color: "#60a5fa" }}>{String(value)}</span>;
  if (typeof value === "number") return <span style={{ color: "#fbbf24" }}>{String(value)}</span>;
  if (typeof value === "string") {
    // Check for special serialized values from runner
    if (value === "[Circular]") return <span style={{ color: "#9ca3af" }}>[Circular]</span>;
    if (value.startsWith("[Function:")) return <span style={{ color: "#c084fc" }}>{value}</span>;
    return <span style={{ color: "#86efac" }}>"{value}"</span>;
  }
  return <span style={{ color: "#c4c4d4" }}>{String(value)}</span>;
}

// ─── Tree node ────────────────────────────────────────────────────────────────

function TreeNode({
  value,
  keyName,
  depth = 0,
}: {
  value: unknown;
  keyName?: string | number;
  depth?: number;
}) {
  const isObject = value !== null && typeof value === "object";
  const isArray = Array.isArray(value);
  const [expanded, setExpanded] = useState(depth < 1);

  const KeyLabel =
    keyName !== undefined ? (
      <span style={{ color: "#93c5fd" }}>
        {isArray ? keyName : `"${keyName}"`}
        <span style={{ color: "#6b7280" }}>: </span>
      </span>
    ) : null;

  if (!isObject) {
    return (
      <div style={{ paddingLeft: depth * 14, lineHeight: "1.7" }}>
        {KeyLabel}
        <PrimitiveValue value={value} />
      </div>
    );
  }

  const entries: [string | number, unknown][] = isArray
    ? (value as unknown[]).map((v, i) => [i, v])
    : Object.entries(value as Record<string, unknown>);

  const openBracket = isArray ? "[" : "{";
  const closeBracket = isArray ? "]" : "}";

  if (entries.length === 0) {
    return (
      <div style={{ paddingLeft: depth * 14, lineHeight: "1.7" }}>
        {KeyLabel}
        <span style={{ color: "#c4c4d4" }}>
          {openBracket}
          {closeBracket}
        </span>
      </div>
    );
  }

  const summary = isArray
    ? `Array(${entries.length})`
    : `{${entries
        .slice(0, 3)
        .map(([k]) => ` ${k}`)
        .join(",")}${entries.length > 3 ? ", …" : " "} }`;

  return (
    <div>
      <div
        style={{
          paddingLeft: depth * 14,
          cursor: "pointer",
          display: "flex",
          alignItems: "baseline",
          gap: 3,
          lineHeight: "1.7",
          userSelect: "none",
        }}
        onClick={() => setExpanded((e) => !e)}
      >
        <span style={{ color: "#6b7280", fontSize: 9, flexShrink: 0 }}>{expanded ? "▾" : "▸"}</span>
        {KeyLabel}
        {expanded ? (
          <span style={{ color: "#c4c4d4" }}>{openBracket}</span>
        ) : (
          <span style={{ color: "#6b7280", fontStyle: "italic" }}>{summary}</span>
        )}
      </div>
      {expanded && (
        <>
          {entries.map(([k, v]) => (
            <TreeNode key={String(k)} value={v} keyName={k} depth={depth + 1} />
          ))}
          <div style={{ paddingLeft: depth * 14, lineHeight: "1.7" }}>
            <span style={{ color: "#c4c4d4" }}>{closeBracket}</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Arg renderer — plain string or tree ─────────────────────────────────────

function ConsoleArg({ arg }: { arg: string }) {
  // Try to parse as JSON. Only render as tree if it's an object or array.
  let parsed: unknown;
  let isStructured = false;
  try {
    parsed = JSON.parse(arg);
    isStructured = parsed !== null && typeof parsed === "object";
  } catch {
    // plain string
  }

  if (isStructured) {
    return (
      <span style={{ fontFamily: "monospace", fontSize: 12 }}>
        <TreeNode value={parsed} />
      </span>
    );
  }

  return <span>{arg}</span>;
}

// ─── Console tab ─────────────────────────────────────────────────────────────

export function ConsoleTab({ consoleLogs }: { consoleLogs: ConsoleEntry[] }) {
  if (consoleLogs.length === 0) {
    return (
      <div
        style={{
          padding: "32px 20px",
          textAlign: "center",
          color: "#4b4b60",
          fontSize: 13,
        }}
      >
        No console output
      </div>
    );
  }

  const t0 = consoleLogs[0].timestamp;

  return (
    <div style={{ padding: "12px 0", display: "flex", flexDirection: "column" }}>
      {consoleLogs.map((entry, i) => {
        const s = LEVEL_STYLES[entry.level];
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "5px 20px",
              background: s.bg,
              borderLeft: `2px solid ${s.border}`,
              marginLeft: 2,
            }}
          >
            {/* Level badge */}
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                color: s.badge,
                letterSpacing: "0.05em",
                flexShrink: 0,
                width: 36,
                marginTop: 1,
                fontFamily: "monospace",
              }}
            >
              {LEVEL_ICON[entry.level]} {entry.level}
            </span>

            {/* Args */}
            <span
              style={{
                fontSize: 12,
                color: s.color,
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {entry.args.map((arg, j) => (
                <ConsoleArg key={j} arg={arg} />
              ))}
            </span>

            {/* Timestamp */}
            <span
              style={{
                fontSize: 10,
                color: "#3a3a4e",
                fontFamily: "monospace",
                flexShrink: 0,
                marginTop: 2,
                textAlign: "right",
              }}
            >
              {new Date(entry.timestamp).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
              <br />+{entry.timestamp - t0}ms
            </span>
          </div>
        );
      })}
    </div>
  );
}
