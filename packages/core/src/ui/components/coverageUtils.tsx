import { useEffect } from "react";
import React from "react";
import type { IstanbulFileCoverage, IstanbulSourceMap, TestSuite } from "../../framework/types";

// ── VLQ / source-map decoding ────────────────────────────────────────────────

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function decodeVLQSegment(seg: string): number[] {
  const result: number[] = [];
  let i = 0;
  while (i < seg.length) {
    let shift = 0,
      value = 0,
      b: number;
    do {
      b = B64.indexOf(seg[i++]);
      value |= (b & 0x1f) << shift;
      shift += 5;
    } while (b & 0x20);
    result.push(value & 1 ? -(value >> 1) : value >> 1);
  }
  return result;
}

/**
 * Build a map from 1-based generated line numbers → 1-based original line numbers.
 * Source map VLQ fields are cumulative across all segments.
 * genCol resets at each new generated line (`;` separator).
 */
function buildLineMap(sm: IstanbulSourceMap): Map<number, number> {
  const map = new Map<number, number>();
  let srcLine = 0;
  const generatedLines = sm.mappings.split(";");
  for (let genLine = 0; genLine < generatedLines.length; genLine++) {
    const lineStr = generatedLines[genLine];
    if (!lineStr) continue;
    for (const seg of lineStr.split(",")) {
      if (!seg) continue;
      const vals = decodeVLQSegment(seg);
      if (vals.length >= 4) {
        srcLine += vals[2];
        if (!map.has(genLine + 1)) map.set(genLine + 1, srcLine + 1);
      }
    }
  }
  return map;
}

// ── public API ───────────────────────────────────────────────────────────────

export interface LineCoverage {
  covered: Set<number>;
  uncovered: Set<number>;
}

/**
 * Compute which 1-based ORIGINAL source lines are covered/uncovered.
 * If `fileCov.inputSourceMap` is present, generated line numbers are mapped back
 * to original line numbers before being added to the sets.
 */
export function computeLineCoverage(fileCov: IstanbulFileCoverage): LineCoverage {
  const lineMap = fileCov.inputSourceMap ? buildLineMap(fileCov.inputSourceMap) : null;
  const toOriginal = (genLine: number) => lineMap?.get(genLine) ?? genLine;

  const covered = new Set<number>();
  const uncovered = new Set<number>();

  for (const [idx, count] of Object.entries(fileCov.s)) {
    const loc = fileCov.statementMap[Number(idx)];
    if (!loc) continue;
    for (let line = loc.start.line; line <= loc.end.line; line++) {
      const orig = toOriginal(line);
      if ((count as number) > 0) {
        covered.add(orig);
        uncovered.delete(orig);
      } else if (!covered.has(orig)) {
        uncovered.add(orig);
      }
    }
  }

  return { covered, uncovered };
}

export interface UncoveredFn {
  display: string;
  line: number;
}

/**
 * Return uncovered functions with human-readable labels.
 * Uses source map to report original line numbers; falls back to source line text
 * when the Istanbul-generated name is just `(anonymous_N)`.
 */
export function uncoveredFunctions(
  fileCov: IstanbulFileCoverage,
  sourceLines?: string[],
): UncoveredFn[] {
  const lineMap = fileCov.inputSourceMap ? buildLineMap(fileCov.inputSourceMap) : null;
  const toOriginal = (genLine: number) => lineMap?.get(genLine) ?? genLine;

  return Object.entries(fileCov.fnMap)
    .filter(([idx]) => (fileCov.f[idx] ?? 0) === 0)
    .map(([, fn]) => {
      const origLine = toOriginal(fn.loc.start.line);
      let display = fn.name && !fn.name.startsWith("(anonymous") ? fn.name : null;
      if (!display && sourceLines) {
        const raw = sourceLines[origLine - 1]?.trim() ?? "";
        display = raw.length > 60 ? raw.slice(0, 57) + "…" : raw || null;
      }
      display = display ?? `anonymous (line ${origLine})`;
      return { display, line: origLine };
    });
}

/**
 * Return the original source text embedded in the Istanbul source map, if available.
 * This avoids a fetch and avoids the VIte-instrumented version.
 */
export function getEmbeddedSource(fileCov: IstanbulFileCoverage): string | null {
  return fileCov.inputSourceMap?.sourcesContent?.[0] ?? null;
}

// ── Line→test index ──────────────────────────────────────────────────────────

export interface TestRef {
  label: string;
  suiteName: string;
  testName: string;
  suiteId: string;
  testId: string;
}

export interface LineTestIndex {
  map: Map<number, TestRef[]>;
  /** Total number of tests that have any per-test coverage data for this file */
  totalTestsForFile: number;
}

export function buildLineTestIndex(filePath: string, suites: TestSuite[]): LineTestIndex {
  const map = new Map<number, TestRef[]>();
  let totalTestsForFile = 0;
  for (const suite of suites) {
    for (const test of suite.tests) {
      const fileCov = test.testCoverage?.[filePath];
      if (!fileCov) continue;
      totalTestsForFile++;
      const { covered } = computeLineCoverage(fileCov);
      const ref: TestRef = {
        label: `${suite.name} › ${test.name}`,
        suiteName: suite.name,
        testName: test.name,
        suiteId: suite.id,
        testId: test.id,
      };
      for (const line of covered) {
        const existing = map.get(line);
        if (existing) existing.push(ref);
        else map.set(line, [ref]);
      }
    }
  }
  return { map, totalTestsForFile };
}

// ── TestsModal ───────────────────────────────────────────────────────────────

export function TestsModal({
  lineNum,
  tests,
  totalTests,
  onSelect,
  onClose,
}: {
  lineNum: number;
  tests: TestRef[];
  totalTests: number;
  onSelect: (suiteId: string, testId: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#16161d",
          border: "1px solid #2a2a36",
          borderRadius: 12,
          width: 420,
          maxWidth: "90vw",
          maxHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
        }}
      >
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid #2a2a36",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#c4c4d4" }}>
              Tests covering line {lineNum}
            </span>
            <span
              style={{
                fontSize: 11,
                color: tests.length < totalTests ? "#f59e0b" : "#4b4b60",
                marginLeft: 8,
              }}
            >
              {tests.length}
              {totalTests > 0 ? ` of ${totalTests}` : ""} test{tests.length !== 1 ? "s" : ""}
              {tests.length < totalTests && " — partial coverage"}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#4b4b60",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              padding: "0 2px",
            }}
          >
            ×
          </button>
        </div>
        <div style={{ overflowY: "auto", padding: "8px 0" }}>
          {tests.map((ref) => (
            <button
              key={ref.testId}
              onClick={() => {
                onSelect(ref.suiteId, ref.testId);
                onClose();
              }}
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "10px 18px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1e1e2e")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <span style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>
                {ref.suiteName}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#22c55e", fontSize: 10 }}>✓</span>
                <span style={{ fontSize: 13, color: "#a5b4fc" }}>{ref.testName}</span>
              </div>
            </button>
          ))}
        </div>
        <div
          style={{
            padding: "10px 18px",
            borderTop: "1px solid #2a2a36",
            fontSize: 11,
            color: "#3a3a4e",
          }}
        >
          Click a test to jump to it — Esc to close
        </div>
      </div>
    </div>
  );
}
