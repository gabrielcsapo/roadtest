import React, { useState } from "react";
import type { Assertion } from "../../../framework/types";
import { SnapshotDiff } from "../Preview";
import { useApp } from "../../context";

export function AssertionsTab({
  assertions,
  suiteId,
}: {
  assertions: Assertion[];
  suiteId: string;
}) {
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
        <AssertionRow key={i} assertion={a} suiteId={suiteId} />
      ))}
    </div>
  );
}

function AssertionRow({ assertion: a, suiteId }: { assertion: Assertion; suiteId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<"success" | "error" | null>(null);
  const { devServerAvailable, apiRef } = useApp();
  const isSnap = !!a.snapshot;
  const hasDiff = isSnap && !!a.snapshot!.baselineHtml;

  async function handleUpdateSnapshot(e: React.MouseEvent) {
    e.stopPropagation();
    if (!a.snapshot) return;
    setUpdating(true);
    try {
      const res = await fetch("/__roadtest_snapshot_write__", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-MSW-Intention": "bypass" },
        body: JSON.stringify([
          {
            sourceFile: a.snapshot.sourceFile ?? "",
            suiteName: a.snapshot.suiteName ?? "",
            testName: a.snapshot.testName ?? "",
            label: a.snapshot.label,
            html: a.snapshot.html,
          },
        ]),
      });
      if (res.ok) {
        setToast("success");
        setTimeout(() => setToast(null), 3000);
        apiRef.current?.runSuite(suiteId);
      } else {
        setToast("error");
        setTimeout(() => setToast(null), 4000);
      }
    } catch {
      setToast("error");
      setTimeout(() => setToast(null), 4000);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div
      style={{
        borderRadius: 6,
        background: a.status === "pass" ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)",
        border: `1px solid ${a.status === "pass" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.2)"}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "8px 12px",
          cursor: hasDiff ? "pointer" : "default",
        }}
        onClick={() => hasDiff && setExpanded((v) => !v)}
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
          <code style={{ fontSize: 12, color: "#c4c4d4", fontFamily: "monospace" }}>{a.label}</code>
          {a.error && !hasDiff && (
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
        {hasDiff && (
          <span style={{ fontSize: 11, color: "#6b7280", flexShrink: 0, userSelect: "none" }}>
            {expanded ? "▲ hide diff" : "▼ show diff"}
          </span>
        )}
      </div>

      {hasDiff && expanded && (
        <div style={{ borderTop: "1px solid rgba(239,68,68,0.2)", padding: "12px 12px 16px" }}>
          <SnapshotDiff
            baseline={a.snapshot!.baselineHtml!}
            current={a.snapshot!.html}
            vision="none"
          />
          {devServerAvailable && (
            <div
              style={{
                marginTop: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              {toast === "success" && (
                <span style={{ fontSize: 11, color: "#22c55e" }}>Snapshot updated</span>
              )}
              {toast === "error" && (
                <span style={{ fontSize: 11, color: "#ef4444" }}>Update failed</span>
              )}
              <button
                onClick={handleUpdateSnapshot}
                disabled={updating}
                style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 4,
                  border: "1px solid rgba(239,68,68,0.4)",
                  background: "rgba(239,68,68,0.1)",
                  color: "#ef4444",
                  cursor: updating ? "default" : "pointer",
                  opacity: updating ? 0.6 : 1,
                }}
              >
                {updating ? "Updating…" : "Update snapshot"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
