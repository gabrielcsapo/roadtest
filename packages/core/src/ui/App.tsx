import React, { useState, useEffect, useRef } from "react";
import {
  createHashRouter,
  RouterProvider,
  Outlet,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import type { TestCase, RunProgress } from "../framework/types";
import { TestTree, ViewToggle } from "./components/TestTree";
import { Preview } from "./components/Preview";
import { Gallery } from "./components/Gallery";
import { CoverageExplorer, CoverageFileList } from "./components/CoverageExplorer";
import { GraphView } from "./components/GraphView";
import { AppContext, useApp } from "./context";
import { useSandboxBridge } from "./hooks/useSandboxBridge";
import { useTestNavigation } from "./hooks/useTestNavigation";

export type AppView = "detail" | "gallery" | "coverage" | "graph";

const SANDBOX_NAME = "__vt_sandbox";

function toTestUrl(suiteName: string, testName: string) {
  return `/suite/${encodeURIComponent(suiteName)}/test/${encodeURIComponent(testName)}`;
}

function formatEta(progress: RunProgress): string {
  const elapsed = Date.now() - progress.startedAt;
  if (progress.done === 0) return "";
  const msPerTest = elapsed / progress.done;
  const remaining = (progress.total - progress.done) * msPerTest;
  if (remaining < 1000) return "<1s left";
  if (remaining < 60000) return `~${Math.ceil(remaining / 1000)}s left`;
  return `~${Math.ceil(remaining / 60000)}m left`;
}

function RunProgressToast({ progress }: { progress: RunProgress }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, []);

  const pct = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;
  const eta = formatEta(progress);
  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 200,
        background: "rgba(22,22,29,0.95)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid #2a2a36",
        borderRadius: 12,
        padding: "12px 16px",
        minWidth: 220,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle
              cx="6"
              cy="6"
              r="5"
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="8 4"
              strokeLinecap="round"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 6 6"
                to="360 6 6"
                dur="0.8s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#c4c4d4" }}>Running tests</span>
        </div>
        {eta && <span style={{ fontSize: 11, color: "#6b7280" }}>{eta}</span>}
      </div>
      <div
        style={{
          height: 4,
          background: "#2a2a36",
          borderRadius: 2,
          overflow: "hidden",
          marginBottom: 6,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "linear-gradient(90deg, #6366f1, #818cf8)",
            borderRadius: 2,
            transition: "width 0.1s ease-out",
          }}
        />
      </div>
      <div style={{ fontSize: 11, color: "#6b7280" }}>
        <span style={{ color: "#a5b4fc", fontWeight: 600 }}>{progress.done}</span>
        {" / "}
        <span>{progress.total}</span>
        {" tests"}
      </div>
    </div>
  );
}

function SuiteOverview({
  suite,
  running,
  onSelectTest,
  onRunSuite,
  onRunTest,
}: {
  suite: import("../framework/types").TestSuite | null;
  running: boolean;
  onSelectTest: (test: TestCase) => void;
  onRunSuite: (suiteId: string) => void;
  onRunTest: (suiteId: string, testId: string) => void;
}) {
  if (!suite)
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
        Suite not found
      </div>
    );
  const pass = suite.tests.filter((t) => t.status === "pass").length;
  const fail = suite.tests.filter((t) => t.status === "fail").length;
  const pending = suite.tests.filter((t) => t.status === "pending").length;
  const fileName = suite.sourceFile ? suite.sourceFile.split("/").pop() : null;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#0f0f13",
      }}
    >
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid #2a2a36",
          background: "#16161d",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#c4c4d4",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {suite.name}
          </div>
          {fileName && (
            <div style={{ fontSize: 11, color: "#4b4b60", fontFamily: "monospace", marginTop: 2 }}>
              {fileName}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 11, flexShrink: 0 }}>
          {pass > 0 && <span style={{ color: "#22c55e" }}>✓ {pass}</span>}
          {fail > 0 && <span style={{ color: "#ef4444" }}>✗ {fail}</span>}
          {pending > 0 && <span style={{ color: "#6b7280" }}>○ {pending}</span>}
        </div>
        <button
          onClick={() => onRunSuite(suite.id)}
          disabled={running}
          title="Run suite"
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: "none",
            flexShrink: 0,
            background: running ? "#1e1e2e" : "#6366f1",
            color: running ? "#6b7280" : "#fff",
            cursor: running ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {running ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle
                cx="6"
                cy="6"
                r="5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="8 4"
                strokeLinecap="round"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 6 6"
                  to="360 6 6"
                  dur="0.8s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
          ) : (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
              <path
                d="M1 1.5L9 6L1 10.5V1.5Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {suite.tests.map((test) => {
          const statusColor =
            test.status === "pass" ? "#22c55e" : test.status === "fail" ? "#ef4444" : "#6b7280";
          const statusIcon = test.status === "pass" ? "✓" : test.status === "fail" ? "✗" : "○";
          return (
            <div
              key={test.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
                height: 36,
                gap: 10,
                cursor: "pointer",
              }}
              onClick={() => onSelectTest(test)}
            >
              <span
                style={{
                  color: statusColor,
                  fontSize: 12,
                  fontWeight: 700,
                  width: 14,
                  flexShrink: 0,
                }}
              >
                {statusIcon}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: "#9898a8",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {test.name}
              </span>
              {test.duration !== undefined && test.status !== "pending" && (
                <span
                  style={{ fontSize: 10, color: "#3a3a4e", fontFamily: "monospace", flexShrink: 0 }}
                >
                  {test.duration < 1000
                    ? `${test.duration}ms`
                    : `${(test.duration / 1000).toFixed(2)}s`}
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRunTest(suite.id, test.id);
                }}
                disabled={running}
                title="Run"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  border: "none",
                  flexShrink: 0,
                  background: "transparent",
                  color: "#4b4b60",
                  fontSize: 9,
                  cursor: running ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ▶
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#4b4b60",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle
          cx="10"
          cy="10"
          r="8"
          stroke="#6366f1"
          strokeWidth="1.5"
          strokeDasharray="12 6"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 10 10"
            to="360 10 10"
            dur="0.8s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
      <span style={{ fontSize: 13 }}>Loading test sandbox…</span>
    </div>
  );
}

// ── Root layout ───────────────────────────────────────────────────────────────

function AppShell() {
  const sandboxRef = useRef<HTMLIFrameElement>(null);
  const { state, apiRef, sandboxReady, devServerAvailable } = useSandboxBridge(sandboxRef);

  return (
    <AppContext.Provider value={{ state, apiRef, sandboxReady, devServerAvailable }}>
      <iframe
        ref={sandboxRef}
        name={SANDBOX_NAME}
        src="./index.html"
        title="FieldTest Sandbox"
        style={{
          position: "fixed",
          width: 0,
          height: 0,
          border: "none",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      />
      <div
        style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}
      >
        <div
          style={{
            height: 44,
            flexShrink: 0,
            borderBottom: "1px solid #2a2a36",
            background: "#16161d",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 12,
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: "#a5b4fc",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginRight: "auto",
            }}
          >
            Fieldtest
          </span>
          <ViewToggle />
        </div>
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {!sandboxReady ? <LoadingSpinner /> : <Outlet />}
        </div>
      </div>
      {state.running && state.runProgress && <RunProgressToast progress={state.runProgress} />}
    </AppContext.Provider>
  );
}

// ── Detail layout (TestTree sidebar + Preview/SuiteOverview) ──────────────────
// Uses a pathless layout route so Preview (and its display iframe) stays mounted
// while navigating between suite and test URLs.

function DetailLayout() {
  const { state, apiRef } = useApp();
  const { suiteName, testName } = useParams<{ suiteName?: string; testName?: string }>();
  const [search, setSearch] = useState("");
  const nav = useTestNavigation(state, apiRef);

  const suite = suiteName ? (state.suites.find((s) => s.name === suiteName) ?? null) : null;
  const selected: TestCase | null =
    testName && suite ? (suite.tests.find((t) => t.name === testName) ?? null) : null;

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      {/* Left rail */}
      <div
        style={{
          width: 280,
          minWidth: 220,
          borderRight: "1px solid #2a2a36",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TestTree
          state={state}
          selected={selected}
          selectedSuiteId={suite?.id ?? null}
          search={search}
          onSelect={nav.handleSelect}
          onSelectSuite={nav.handleSelectSuite}
          onSearchChange={setSearch}
          onRunAll={nav.handleRunAll}
          onRunSuite={nav.handleRunSuite}
          onRunTest={nav.handleRunTest}
        />
      </div>

      {/* Right pane — always Preview so the display iframe stays alive */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {suite && !testName ? (
          <SuiteOverview
            suite={suite}
            running={state.running}
            onSelectTest={nav.handleSelect}
            onRunSuite={(id) => apiRef.current?.runSuite(id)}
            onRunTest={nav.handleRunTest}
          />
        ) : (
          <Preview
            test={selected}
            coverage={state.coverage}
            suites={state.suites}
            onSelectTest={nav.handleNavigateToTest}
            onSelectSuite={nav.handleSelectSuite}
          />
        )}
      </div>
    </div>
  );
}

// ── Gallery route ─────────────────────────────────────────────────────────────

function GalleryRoute() {
  const { state, apiRef } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  return (
    <Gallery
      state={state}
      search={search}
      onSearchChange={setSearch}
      onSelect={(test) => navigate(toTestUrl(test.suiteName, test.name))}
      onPlayTest={(test) => {
        navigate(toTestUrl(test.suiteName, test.name));
        apiRef.current?.runTest(test.suiteId, test.id);
      }}
      onRunAll={() => apiRef.current?.runAll()}
    />
  );
}

// ── Coverage route ────────────────────────────────────────────────────────────

/** Mirrors the shortPath() logic in CoverageExplorer — extracts src/… from an absolute path. */
function coverageShortPath(absPath: string): string {
  const m = absPath.match(/\/src\/(.+)$/);
  return m ? `src/${m[1]}` : (absPath.split("/").pop() ?? absPath);
}

function CoverageRoute() {
  const { state, apiRef } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allSourceFiles, setAllSourceFiles] = useState<string[]>([]);
  const fileParam = searchParams.get("file"); // e.g. "src/Counter.tsx"

  useEffect(() => {
    fetch("/__fieldtest_files__", { headers: { "X-MSW-Intention": "bypass" } })
      .then((r) => r.json() as Promise<string[]>)
      .then(setAllSourceFiles)
      .catch(() => {});
  }, []);

  // Resolve short param back to the full absolute path used internally.
  // Check coverage paths first, then all source files (covers uncovered files).
  const allPaths = [...new Set([...Object.keys(state.coverage ?? {}), ...allSourceFiles])];
  const selectedFile = fileParam
    ? (allPaths.find((p) => coverageShortPath(p) === fileParam) ?? fileParam)
    : null;

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      <div
        style={{
          width: 280,
          minWidth: 220,
          borderRight: "1px solid #2a2a36",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "#16161d",
        }}
      >
        <CoverageFileList
          coverage={state.coverage}
          allFiles={allSourceFiles}
          selectedFile={selectedFile}
          onSelectFile={(file) => {
            if (file) setSearchParams({ file: coverageShortPath(file) });
            else setSearchParams({});
          }}
        />
      </div>
      <CoverageExplorer
        coverage={state.coverage}
        suites={state.suites}
        selectedFile={selectedFile}
        onSelectTest={(suiteId, testId) => {
          const test = state.suites
            .flatMap((s) => s.tests)
            .find((t) => t.suiteId === suiteId && t.id === testId);
          if (test) navigate(toTestUrl(test.suiteName, test.name));
        }}
        onRunAll={() => apiRef.current?.runAll()}
      />
    </div>
  );
}

// ── Graph route ───────────────────────────────────────────────────────────────

function GraphRoute() {
  const { state } = useApp();
  const navigate = useNavigate();

  return (
    <GraphView
      suites={state.suites}
      coverage={state.coverage}
      onSelectSuite={(suiteId) => {
        const suite = state.suites.find((s) => s.id === suiteId);
        if (suite?.tests[0]) navigate(toTestUrl(suite.tests[0].suiteName, suite.tests[0].name));
      }}
    />
  );
}

// ── Router ────────────────────────────────────────────────────────────────────

const router = createHashRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      // Pathless layout: keeps Preview (and its display iframe) mounted while
      // navigating between suite and test URLs.
      {
        element: <DetailLayout />,
        children: [
          { index: true, element: null },
          { path: "suite/:suiteName", element: null },
          { path: "suite/:suiteName/test/:testName", element: null },
        ],
      },
      { path: "gallery", element: <GalleryRoute /> },
      { path: "coverage", element: <CoverageRoute /> },
      { path: "graph", element: <GraphRoute /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
