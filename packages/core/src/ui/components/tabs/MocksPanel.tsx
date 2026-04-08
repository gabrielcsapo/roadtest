import React, { useState } from "react";
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

function CallRow({ call, index }: { call: MockCall; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const time = new Date(call.timestamp).toISOString().slice(11, 23);
  const resultDisplay = safeDisplay(call.result);
  const isMultiline = resultDisplay.includes("\n");

  return (
    <div style={{ borderBottom: "1px solid #1a1a24" }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          background: "none",
          border: "none",
          cursor: "pointer",
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
        {isMultiline && (
          <span style={{ fontSize: 10, color: "#4b4b60", flexShrink: 0 }}>
            {expanded ? "▲" : "▼"}
          </span>
        )}
      </button>
      {expanded && isMultiline && (
        <pre
          style={{
            margin: 0,
            padding: "6px 12px 6px 40px",
            fontSize: 11,
            fontFamily: "monospace",
            color: "#34d399",
            background: "#0f0f13",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {resultDisplay}
        </pre>
      )}
    </div>
  );
}

function MockEntryRow({ entry }: { entry: MockEntry }) {
  const [open, setOpen] = useState(true);

  // Group calls by function name
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
      {/* Header */}
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

      {/* Call list grouped by export name */}
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
