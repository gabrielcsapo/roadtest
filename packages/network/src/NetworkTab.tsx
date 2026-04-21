import React, { useState } from "react";
import type { NetworkEntry, TestCase } from "roadtest";

function statusColor(status: number): string {
  if (status >= 500) return "#ef4444";
  if (status >= 400) return "#f97316";
  if (status >= 300) return "#eab308";
  if (status >= 200) return "#22c55e";
  return "#6b7280";
}

function methodColor(method: string): string {
  switch (method.toUpperCase()) {
    case "GET":
      return "#60a5fa";
    case "POST":
      return "#a78bfa";
    case "PUT":
      return "#fb923c";
    case "PATCH":
      return "#f472b6";
    case "DELETE":
      return "#f87171";
    default:
      return "#9ca3af";
  }
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + (u.search || "");
  } catch {
    return url;
  }
}

function JsonBody({ raw }: { raw: string }) {
  try {
    const parsed = JSON.parse(raw);
    return (
      <pre
        style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          fontSize: 11,
          color: "#a5b4fc",
        }}
      >
        {JSON.stringify(parsed, null, 2)}
      </pre>
    );
  } catch {
    return (
      <pre
        style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          fontSize: 11,
          color: "#c4c4d4",
        }}
      >
        {raw}
      </pre>
    );
  }
}

function NetworkRow({ entry }: { entry: NetworkEntry }) {
  const [expanded, setExpanded] = useState(false);
  const sc = statusColor(entry.status);
  const mc = methodColor(entry.method);
  const hasBody = !!(entry.requestBody || entry.responseBody);

  return (
    <div
      style={{
        borderRadius: 6,
        background: "#1a1a24",
        border: "1px solid #2a2a36",
        overflow: "hidden",
      }}
    >
      <div
        onClick={() => hasBody && setExpanded((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 12px",
          cursor: hasBody ? "pointer" : "default",
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          style={{
            flexShrink: 0,
            color: hasBody ? "#4b4b60" : "transparent",
            transform: expanded ? "rotate(90deg)" : "none",
            transition: "transform 0.15s",
          }}
        >
          <path
            d="M3 2l4 3-4 3"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: mc,
            background: `${mc}1a`,
            border: `1px solid ${mc}40`,
            borderRadius: 4,
            padding: "1px 5px",
            flexShrink: 0,
          }}
        >
          {entry.method}
        </span>

        <span
          style={{
            fontSize: 12,
            color: "#c4c4d4",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: "monospace",
          }}
          title={entry.url}
        >
          {shortUrl(entry.url)}
        </span>

        {entry.mocked && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#818cf8",
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: 4,
              padding: "1px 6px",
              flexShrink: 0,
            }}
          >
            mocked
          </span>
        )}

        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: sc,
            background: `${sc}15`,
            border: `1px solid ${sc}40`,
            borderRadius: 4,
            padding: "1px 6px",
            flexShrink: 0,
            fontFamily: "monospace",
          }}
        >
          {entry.status || "—"}
        </span>

        <span
          style={{
            fontSize: 11,
            color: "#4b4b60",
            flexShrink: 0,
            fontFamily: "monospace",
            minWidth: 44,
            textAlign: "right",
          }}
        >
          {entry.duration}ms
        </span>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid #2a2a36" }}>
          {entry.requestBody && (
            <div
              style={{
                padding: "8px 12px",
                borderBottom: entry.responseBody ? "1px solid #1e1e2e" : "none",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#4b4b60",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Request body
              </div>
              <div
                style={{
                  background: "#0f0f13",
                  borderRadius: 4,
                  padding: "8px 10px",
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                <JsonBody raw={entry.requestBody} />
              </div>
            </div>
          )}
          {entry.responseBody && (
            <div style={{ padding: "8px 12px" }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#4b4b60",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Response body
              </div>
              <div
                style={{
                  background: "#0f0f13",
                  borderRadius: 4,
                  padding: "8px 10px",
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                <JsonBody raw={entry.responseBody} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function NetworkTab({ test }: { test: TestCase }) {
  const entries = test.networkEntries;

  if (entries.length === 0) {
    return (
      <div
        style={{
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          color: "#4b4b60",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M2 12h3M19 12h3M12 2v3M12 19v3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <div style={{ fontSize: 13 }}>No network requests captured</div>
      </div>
    );
  }

  const mockedCount = entries.filter((e) => e.mocked).length;

  return (
    <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span
          style={{
            fontSize: 11,
            color: "#4b4b60",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          {entries.length} request{entries.length !== 1 ? "s" : ""}
        </span>
        {mockedCount > 0 && (
          <span style={{ fontSize: 11, color: "#818cf8" }}>{mockedCount} mocked</span>
        )}
        {mockedCount < entries.length && (
          <span style={{ fontSize: 11, color: "#6b7280" }}>
            {entries.length - mockedCount} passthrough
          </span>
        )}
      </div>
      {entries.map((entry, i) => (
        <NetworkRow key={i} entry={entry} />
      ))}
    </div>
  );
}
