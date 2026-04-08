import type { Assertion } from "../../../framework/types";

export function AssertionsTab({ assertions }: { assertions: Assertion[] }) {
  if (assertions.length === 0) {
    return (
      <div style={{ padding: "32px 20px", textAlign: "center", color: "#4b4b60", fontSize: 13 }}>
        No assertions recorded
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
      {assertions.map((a, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "8px 12px",
            borderRadius: 6,
            background: a.status === "pass" ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)",
            border: `1px solid ${a.status === "pass" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.2)"}`,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: a.status === "pass" ? "#22c55e" : "#ef4444",
              marginTop: 1,
              flexShrink: 0,
            }}
          >
            {a.status === "pass" ? "✓" : "✗"}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <code style={{ fontSize: 12, color: "#c4c4d4", fontFamily: "monospace" }}>
              {a.label}
            </code>
            {a.error && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#fca5a5",
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                }}
              >
                {a.error}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
