import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import type { IstanbulCoverage, IstanbulFileCoverage, TestSuite } from "../../framework/types";
import {
  computeLineCoverage,
  uncoveredFunctions,
  getEmbeddedSource,
  buildLineTestIndex,
  TestsModal,
} from "./coverageUtils";
import type { TestRef, LineTestIndex } from "./coverageUtils";

// ── static sources cache ─────────────────────────────────────────────────────
// In static/CDN deployments (e.g. GitHub Pages), /__fieldtest_source__ doesn't exist.
// buildUi() writes fieldtest-sources.json alongside the bundle as a fallback.
let _staticSourcesPromise: Promise<Record<string, string>> | null = null;
function loadStaticSources(): Promise<Record<string, string>> {
  if (!_staticSourcesPromise) {
    _staticSourcesPromise = fetch("./fieldtest-sources.json")
      .then((r) => (r.ok ? (r.json() as Promise<Record<string, string>>) : {}))
      .catch(() => ({}));
  }
  return _staticSourcesPromise;
}

// ── helpers ─────────────────────────────────────────────────────────────────

function coveragePct(fileCov: IstanbulFileCoverage): number {
  const stmts = Object.values(fileCov.s);
  if (stmts.length === 0) return 100;
  const hit = stmts.filter((n) => n > 0).length;
  return Math.round((hit / stmts.length) * 100);
}

function pctColor(pct: number): string {
  if (pct >= 80) return "#22c55e";
  if (pct >= 50) return "#f59e0b";
  return "#ef4444";
}

function shortPath(absPath: string): string {
  const m = absPath.match(/\/src\/(.+)$/);
  return m ? `src/${m[1]}` : (absPath.split("/").pop() ?? absPath);
}

// ── FileEntry ────────────────────────────────────────────────────────────────

interface FileEntry {
  path: string;
  fileCov: IstanbulFileCoverage | null;
  pct: number;
}

// ── SourceView ───────────────────────────────────────────────────────────────

function SourceView({
  entry,
  lineTestIndex,
  onLineClick,
}: {
  entry: FileEntry;
  lineTestIndex: LineTestIndex;
  onLineClick: (lineNum: number, tests: TestRef[]) => void;
}) {
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSource(null);
    setError(null);
    // Prefer embedded source from Istanbul's inputSourceMap (avoids instrumented code)
    const embedded = entry.fileCov ? getEmbeddedSource(entry.fileCov) : null;
    if (embedded) {
      setSource(embedded);
      return;
    }
    fetch(`/__fieldtest_source__?path=${encodeURIComponent(entry.path)}`, {
      headers: { "X-MSW-Intention": "bypass" },
    })
      .then((r) => {
        if (r.ok) return r.text();
        // Fallback: static sources bundle written by `fieldtest build` for CDN/static hosts
        return loadStaticSources().then((sources) => {
          const src = sources[entry.path];
          if (src != null) return src;
          return Promise.reject(`${r.status}`);
        });
      })
      .then(setSource)
      .catch((e: unknown) => setError(String(e)));
  }, [entry.path, entry.fileCov]);

  if (error)
    return (
      <div style={{ padding: "20px", color: "#fca5a5", fontSize: 12, fontFamily: "monospace" }}>
        Failed to load: {error}
      </div>
    );

  if (!source)
    return (
      <div style={{ padding: "20px", color: "#4b4b60", fontSize: 13, textAlign: "center" }}>
        Loading…
      </div>
    );

  const lines = source.split("\n");

  if (!entry.fileCov) {
    return (
      <div>
        <div
          style={{
            padding: "10px 16px",
            background: "rgba(239,68,68,0.1)",
            borderBottom: "1px solid rgba(239,68,68,0.2)",
            fontSize: 12,
            color: "#fca5a5",
          }}
        >
          This file was never imported during any test — 0% coverage
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 12, overflowX: "auto" }}>
          {lines.map((text, i) => (
            <div
              key={i}
              style={{ display: "flex", background: "rgba(239,68,68,0.06)", minHeight: 20 }}
            >
              <div style={{ width: 3, flexShrink: 0, background: "#ef4444" }} />
              <div
                style={{
                  width: 40,
                  flexShrink: 0,
                  textAlign: "right",
                  paddingRight: 12,
                  color: "#3a3a4e",
                  userSelect: "none",
                  lineHeight: "20px",
                }}
              >
                {i + 1}
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: "0 16px",
                  color: "#6b7280",
                  lineHeight: "20px",
                  whiteSpace: "pre",
                  flex: 1,
                }}
              >
                {text || " "}
              </pre>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { covered, uncovered } = computeLineCoverage(entry.fileCov);
  const missing = uncoveredFunctions(entry.fileCov, lines);
  const { map: testMap, totalTestsForFile } = lineTestIndex;

  return (
    <div>
      {missing.length > 0 && (
        <div
          style={{
            padding: "10px 16px",
            background: "rgba(239,68,68,0.08)",
            borderBottom: "1px solid #2a2a36",
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600, flexShrink: 0 }}>
            Untested functions:
          </span>
          {missing.map((fn) => (
            <span
              key={`${fn.line}-${fn.display}`}
              title={`Line ${fn.line}`}
              style={{
                fontSize: 11,
                color: "#fca5a5",
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 4,
                padding: "1px 8px",
                fontFamily: "monospace",
                cursor: "default",
              }}
            >
              {fn.display}
              <span style={{ color: "#6b7280", marginLeft: 5 }}>:{fn.line}</span>
            </span>
          ))}
        </div>
      )}
      <div style={{ fontFamily: "monospace", fontSize: 12, overflowX: "auto" }}>
        {lines.map((text, i) => {
          const lineNum = i + 1;
          const isCovered = covered.has(lineNum);
          const isUncovered = uncovered.has(lineNum);
          const tests = testMap.get(lineNum) ?? [];
          const clickable = isCovered && tests.length > 0;
          // A line covered by ALL tests isn't interesting — highlight only partial coverage
          const isPartial = clickable && totalTestsForFile > 0 && tests.length < totalTestsForFile;
          const bg = isCovered
            ? isPartial
              ? "rgba(245,158,11,0.1)"
              : "rgba(34,197,94,0.08)"
            : isUncovered
              ? "rgba(239,68,68,0.1)"
              : "transparent";
          const gutterColor = isCovered
            ? isPartial
              ? "#f59e0b"
              : "#22c55e"
            : isUncovered
              ? "#ef4444"
              : "transparent";

          return (
            <div
              key={i}
              onClick={clickable ? () => onLineClick(lineNum, tests) : undefined}
              title={
                clickable
                  ? isPartial
                    ? `${tests.length} of ${totalTestsForFile} tests — click to see`
                    : `All ${tests.length} tests — click to see`
                  : undefined
              }
              style={{
                display: "flex",
                background: bg,
                minHeight: 20,
                cursor: clickable ? "pointer" : "default",
              }}
            >
              <div style={{ width: 3, flexShrink: 0, background: gutterColor }} />
              <div
                style={{
                  width: 40,
                  flexShrink: 0,
                  textAlign: "right",
                  paddingRight: 12,
                  color: "#3a3a4e",
                  userSelect: "none",
                  lineHeight: "20px",
                }}
              >
                {lineNum}
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: "0 16px",
                  color: "#c4c4d4",
                  lineHeight: "20px",
                  whiteSpace: "pre",
                  flex: 1,
                }}
              >
                {text || " "}
              </pre>
              {clickable && (
                <div
                  style={{ paddingRight: 10, display: "flex", alignItems: "center", flexShrink: 0 }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: isPartial ? 700 : 400,
                      color: isPartial ? "#f59e0b" : "#4b4b60",
                      background: isPartial ? "rgba(245,158,11,0.15)" : "#1e1e2e",
                      border: `1px solid ${isPartial ? "rgba(245,158,11,0.4)" : "#2a2a36"}`,
                      borderRadius: 10,
                      padding: "0 5px",
                    }}
                  >
                    {totalTestsForFile > 0 ? `${tests.length}/${totalTestsForFile}` : tests.length}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── CoverageFileList ─────────────────────────────────────────────────────────

interface CoverageFileListProps {
  coverage: IstanbulCoverage | null;
  allFiles: string[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
}

export function CoverageFileList({
  coverage,
  allFiles,
  selectedFile,
  onSelectFile,
}: CoverageFileListProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (allFiles.length > 0 && !selectedFile) {
      const sorted = [...allFiles].sort((a, b) => {
        const pa = coverage?.[a] ? coveragePct(coverage[a]) : 0;
        const pb = coverage?.[b] ? coveragePct(coverage[b]) : 0;
        return pa - pb;
      });
      // Prefer a partially-covered file (has data but not 100%) over a bare 0%
      const partial = sorted.find((f) => {
        const pct = coverage?.[f] ? coveragePct(coverage[f]) : 0;
        return pct > 0 && pct < 100;
      });
      onSelectFile(partial ?? sorted[0]);
    }
  }, [allFiles, coverage]);

  if (!coverage) {
    return (
      <div
        style={{
          padding: "20px 12px",
          fontSize: 12,
          color: "#4b4b60",
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        Run tests to see coverage
      </div>
    );
  }

  const coveredPaths = new Set(Object.keys(coverage));
  const allPaths = new Set([...allFiles, ...coveredPaths]);
  const q = search.toLowerCase();
  const entries: FileEntry[] = [...allPaths]
    .filter((p) => !p.includes(".test.") && !p.includes(".spec."))
    .filter((p) => !q || shortPath(p).toLowerCase().includes(q))
    .map((p) => {
      const fileCov = coverage[p] ?? null;
      return { path: p, fileCov, pct: fileCov ? coveragePct(fileCov) : 0 };
    })
    .sort((a, b) => a.pct - b.pct);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {/* Search bar */}
      <div style={{ padding: "8px 8px", borderBottom: "1px solid #2a2a36", flexShrink: 0 }}>
        <div style={{ position: "relative" }}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#4b4b60",
              pointerEvents: "none",
            }}
          >
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
            <line
              x1="7.5"
              y1="7.5"
              x2="11"
              y2="11"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Filter files…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#0f0f13",
              border: "1px solid #2a2a36",
              borderRadius: 6,
              padding: "5px 8px 5px 26px",
              fontSize: 12,
              color: "#c4c4d4",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
            onBlur={(e) => (e.target.style.borderColor = "#2a2a36")}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: 6,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#4b4b60",
                cursor: "pointer",
                fontSize: 14,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        {entries.map((entry) => {
          const isActive = entry.path === selectedFile;
          return (
            <button
              key={entry.path}
              onClick={() => onSelectFile(entry.path)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 12px",
                background: isActive ? "#1e1e2e" : "transparent",
                borderLeft: `2px solid ${isActive ? "#6366f1" : "transparent"}`,
                border: "none",
                borderLeftWidth: 2,
                borderLeftStyle: "solid",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 4,
                  background: "#2a2a36",
                  borderRadius: 2,
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${entry.pct}%`,
                    background: pctColor(entry.pct),
                    borderRadius: 2,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: pctColor(entry.pct),
                  fontWeight: 700,
                  flexShrink: 0,
                  width: 30,
                }}
              >
                {entry.pct}%
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: isActive ? "#c4c4d4" : "#6b7280",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {shortPath(entry.path)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── CoverageExplorer ─────────────────────────────────────────────────────────

interface Props {
  coverage: IstanbulCoverage | null;
  suites: TestSuite[];
  selectedFile: string | null;
  onSelectTest: (suiteId: string, testId: string) => void;
  onRunAll?: () => void;
}

export function CoverageExplorer({
  coverage,
  suites,
  selectedFile,
  onSelectTest,
  onRunAll,
}: Props) {
  const [modal, setModal] = useState<{ lineNum: number; tests: TestRef[] } | null>(null);

  const handleLineClick = useCallback((lineNum: number, tests: TestRef[]) => {
    setModal({ lineNum, tests });
  }, []);

  if (!coverage) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#4b4b60",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <svg
            width="40"
            height="40"
            viewBox="0 0 14 14"
            fill="none"
            style={{ opacity: 0.4, marginBottom: 16 }}
          >
            <rect x="1" y="7" width="2.5" height="6" rx="1" fill="currentColor" />
            <rect x="5" y="4" width="2.5" height="9" rx="1" fill="currentColor" />
            <rect x="9" y="1" width="2.5" height="12" rx="1" fill="currentColor" />
          </svg>
          <div style={{ fontSize: 14, color: "#c4c4d4", marginBottom: 8 }}>
            No coverage data yet
          </div>
          <div style={{ fontSize: 12, color: "#4b4b60", marginBottom: 20, lineHeight: 1.6 }}>
            Run your tests to see coverage here. Coverage is collected when running via{" "}
            <code
              style={{
                background: "#1e1e2e",
                border: "1px solid #2a2a36",
                borderRadius: 3,
                padding: "1px 5px",
                fontSize: 11,
                color: "#a5b4fc",
              }}
            >
              fieldtest --ui
            </code>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {onRunAll && (
              <button
                onClick={onRunAll}
                style={{
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  background: "#6366f1",
                  border: "none",
                  borderRadius: 6,
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Run all tests
              </button>
            )}
            <Link
              to="/"
              style={{
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                background: "transparent",
                border: "1px solid #2a2a36",
                borderRadius: 6,
                color: "#c4c4d4",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              View tests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const coveredPaths = new Set(Object.keys(coverage));
  const entries: FileEntry[] = [...coveredPaths]
    .filter((p) => !p.includes(".test.") && !p.includes(".spec."))
    .map((p) => {
      const fileCov = coverage[p] ?? null;
      return { path: p, fileCov, pct: fileCov ? coveragePct(fileCov) : 0 };
    })
    .sort((a, b) => a.pct - b.pct);

  const totalStmts = entries.reduce(
    (n, e) => n + (e.fileCov ? Object.keys(e.fileCov.s).length : 0),
    0,
  );
  const coveredStmts = entries.reduce(
    (n, e) => n + (e.fileCov ? Object.values(e.fileCov.s).filter((c) => c > 0).length : 0),
    0,
  );
  const overallPct = totalStmts === 0 ? 0 : Math.round((coveredStmts / totalStmts) * 100);
  const fullyTested = entries.filter((e) => e.pct === 100).length;
  const untested = entries.filter((e) => e.pct === 0).length;

  const selectedEntry = selectedFile
    ? (entries.find((e) => e.path === selectedFile) ??
      // Synthetic entry for files in the source tree but not in coverage
      (selectedFile.startsWith("/") ? { path: selectedFile, fileCov: null, pct: 0 } : null))
    : null;
  const lineTestIndex = selectedFile
    ? buildLineTestIndex(selectedFile, suites)
    : { map: new Map<number, TestRef[]>(), totalTestsForFile: 0 };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Summary header */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid #2a2a36",
          background: "#16161d",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#c4c4d4" }}>Coverage Explorer</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: pctColor(overallPct) }}>
            {overallPct}%
          </span>
          <span style={{ fontSize: 12, color: "#4b4b60" }}>
            {coveredStmts} / {totalStmts} statements
          </span>
          <span style={{ fontSize: 12, color: "#22c55e" }}>{fullyTested} fully covered</span>
          {untested > 0 && (
            <span style={{ fontSize: 12, color: "#ef4444" }}>{untested} untested</span>
          )}
          <div style={{ marginLeft: "auto", fontSize: 11, color: "#3a3a4e" }}>
            Click a covered line to see which tests cover it
          </div>
        </div>
        <div style={{ height: 4, background: "#2a2a36", borderRadius: 2, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${overallPct}%`,
              background: pctColor(overallPct),
              borderRadius: 2,
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>

      {/* Source pane */}
      <div style={{ flex: 1, overflowY: "auto", background: "#0f0f13" }}>
        {selectedEntry ? (
          <>
            <div
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid #2a2a36",
                background: "#16161d",
                display: "flex",
                alignItems: "center",
                gap: 10,
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
            >
              <span style={{ fontSize: 12, fontFamily: "monospace", color: "#6b7280" }}>
                {shortPath(selectedEntry.path)}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: pctColor(selectedEntry.pct),
                  background: `${pctColor(selectedEntry.pct)}1a`,
                  border: `1px solid ${pctColor(selectedEntry.pct)}40`,
                  borderRadius: 4,
                  padding: "1px 6px",
                }}
              >
                {selectedEntry.pct}% statements
              </span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                {[
                  { color: "rgba(34,197,94,0.3)", label: "Covered" },
                  { color: "rgba(239,68,68,0.3)", label: "Not covered" },
                ].map(({ color, label }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      color: "#4b4b60",
                    }}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
            <SourceView
              entry={selectedEntry}
              lineTestIndex={lineTestIndex}
              onLineClick={handleLineClick}
            />
          </>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#4b4b60",
              fontSize: 13,
            }}
          >
            {selectedFile ? "No coverage data for this file" : "Select a file"}
          </div>
        )}
      </div>

      {modal && (
        <TestsModal
          lineNum={modal.lineNum}
          tests={modal.tests}
          totalTests={lineTestIndex.totalTestsForFile}
          onSelect={onSelectTest}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
