import { useState, useDeferredValue, useRef, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { StoreState, TestCase } from "../../framework/types";
import { StatusIcon } from "./StatusIcon";
import { SnapshotFrame } from "./SnapshotFrame";

interface Props {
  state: StoreState;
  search: string;
  onSearchChange: (q: string) => void;
  onSelect: (test: TestCase) => void;
  onPlayTest: (test: TestCase) => void;
  onRunAll: () => void;
}

const CARD_MIN_W = 260;
const GAP = 16;
const CARD_H = 172; // 120px preview + ~52px footer
const HEADER_H = 36; // suite group header height
const PAD = 24; // container padding

function PendingPlaceholder() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.12) 1px, transparent 1px)",
        backgroundSize: "16px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "1.5px solid rgba(99,102,241,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(99,102,241,0.35)",
          fontSize: 13,
        }}
      >
        ○
      </div>
    </div>
  );
}

function RunningPlaceholder() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#f59e0b",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle
          cx="10"
          cy="10"
          r="8"
          stroke="currentColor"
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
    </div>
  );
}

function GalleryCard({
  test,
  suiteName,
  onSelect,
  onPlayTest,
}: {
  test: TestCase;
  suiteName: string;
  onSelect: () => void;
  onPlayTest: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ position: "relative", minWidth: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onSelect}
        style={{
          width: "100%",
          background: "#16161d",
          border: `1px solid ${hovered ? "#6366f1" : "#2a2a36"}`,
          borderRadius: 12,
          padding: 0,
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "border-color 0.15s",
        }}
      >
        <div
          style={{
            background: "#0f0f13",
            height: 120,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid #2a2a36",
            overflow: "hidden",
          }}
        >
          {test.status === "running" ? (
            <RunningPlaceholder />
          ) : test.snapshots[0] ? (
            <SnapshotFrame
              html={test.snapshots[0].html}
              displayWidth={240}
              displayHeight={116}
              virtualWidth={800}
            />
          ) : test.status === "fail" ? (
            <div style={{ color: "#ef4444", fontSize: 28 }}>✗</div>
          ) : test.status === "pass" ? (
            <div style={{ color: "#22c55e", fontSize: 28 }}>✓</div>
          ) : (
            <PendingPlaceholder />
          )}
        </div>
        <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <StatusIcon status={test.status} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                color: "#4b4b60",
                overflowWrap: "break-word",
                wordBreak: "break-word",
              }}
            >
              {suiteName}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#c4c4d4",
                overflowWrap: "break-word",
                wordBreak: "break-word",
              }}
            >
              {test.name}
            </div>
          </div>
        </div>
      </button>

      {test.status !== "skipped" && test.status !== "running" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlayTest();
          }}
          title="Run and focus this test"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 26,
            height: 26,
            borderRadius: 6,
            border: "1px solid rgba(99,102,241,0.4)",
            background: "rgba(22,22,29,0.85)",
            backdropFilter: "blur(4px)",
            color: "#a5b4fc",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.15s",
            pointerEvents: hovered ? "auto" : "none",
            zIndex: 2,
          }}
        >
          <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
            <path
              d="M1 1L7 5L1 9V1Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

type SuggestionItem =
  | { kind: "suite"; suiteName: string }
  | { kind: "test"; test: TestCase; suiteName: string };

function matches(text: string, q: string, exact: boolean) {
  const t = text.toLowerCase();
  if (exact) return t.includes(q);
  // fuzzy: every character in q appears in order in t
  let ti = 0;
  for (let qi = 0; qi < q.length; qi++) {
    ti = t.indexOf(q[qi], ti);
    if (ti === -1) return false;
    ti++;
  }
  return true;
}

function SearchCombobox({
  state,
  search,
  fuzzy,
  onSearchChange,
  onFuzzyChange,
  onSelect,
}: {
  state: StoreState;
  search: string;
  fuzzy: boolean;
  onSearchChange: (q: string) => void;
  onFuzzyChange: (f: boolean) => void;
  onSelect: (test: TestCase) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo<SuggestionItem[]>(() => {
    const q = search.toLowerCase();
    if (!q) return [];
    const items: SuggestionItem[] = [];
    const seenSuites = new Set<string>();
    for (const suite of state.suites) {
      const suiteMatch = matches(suite.name, q, !fuzzy);
      if (suiteMatch && !seenSuites.has(suite.name)) {
        seenSuites.add(suite.name);
        items.push({ kind: "suite", suiteName: suite.name });
      }
      for (const test of suite.tests) {
        // only include tests whose own name matches — not just because the suite matched
        if (test.snapshots.length > 0 && matches(test.name, q, !fuzzy)) {
          items.push({ kind: "test", test, suiteName: suite.name });
        }
      }
    }
    return items.slice(0, 12);
  }, [state.suites, search, fuzzy]);

  const select = useCallback(
    (item: SuggestionItem) => {
      if (item.kind === "suite") {
        onSearchChange(item.suiteName);
      } else {
        onSelect(item.test);
        onSearchChange("");
      }
      setOpen(false);
      setActiveIndex(-1);
    },
    [onSearchChange, onSelect],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      select(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, maxWidth: 380 }}>
      <div style={{ position: "relative", flex: 1 }}>
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
            zIndex: 1,
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
          ref={inputRef}
          type="text"
          placeholder="Search tests…"
          value={search}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => search && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "#0f0f13",
            border: `1px solid ${open && suggestions.length > 0 ? "#6366f1" : "#2a2a36"}`,
            borderRadius: open && suggestions.length > 0 ? "6px 6px 0 0" : 6,
            padding: "5px 8px 5px 26px",
            fontSize: 12,
            color: "#c4c4d4",
            outline: "none",
          }}
        />
        {search && (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onSearchChange("");
              setOpen(false);
              inputRef.current?.focus();
            }}
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
        {open && suggestions.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#0f0f13",
              border: "1px solid #6366f1",
              borderTop: "none",
              borderRadius: "0 0 6px 6px",
              zIndex: 100,
              overflow: "hidden",
            }}
          >
            {suggestions.map((item, i) => (
              <div
                key={item.kind === "suite" ? `suite:${item.suiteName}` : `test:${item.test.id}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(item)}
                onMouseEnter={() => setActiveIndex(i)}
                style={{
                  padding: "7px 10px",
                  cursor: "pointer",
                  background: i === activeIndex ? "#1e1e2e" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  borderTop: i > 0 ? "1px solid #1e1e2e" : "none",
                }}
              >
                {item.kind === "suite" ? (
                  <>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: "#6366f1",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        background: "rgba(99,102,241,0.12)",
                        border: "1px solid rgba(99,102,241,0.25)",
                        borderRadius: 3,
                        padding: "1px 4px",
                        flexShrink: 0,
                      }}
                    >
                      describe
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "#c4c4d4",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.suiteName}
                    </span>
                  </>
                ) : (
                  <>
                    <StatusIcon status={item.test.status} />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#c4c4d4",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.test.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#4b4b60",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.suiteName}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFuzzyChange(!fuzzy)}
        title={
          fuzzy ? "Fuzzy match (click to match whole word)" : "Match whole word (click for fuzzy)"
        }
        style={{
          flexShrink: 0,
          width: 26,
          height: 26,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          background: !fuzzy ? "rgba(99,102,241,0.2)" : "transparent",
          border: `1px solid ${!fuzzy ? "rgba(99,102,241,0.5)" : "#2a2a36"}`,
          borderRadius: 4,
          color: !fuzzy ? "#a5b4fc" : "#4b4b60",
          cursor: "pointer",
          transition: "all 0.15s",
          padding: 0,
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em" }}>
          ab
        </span>
        <span
          style={{
            display: "block",
            width: 12,
            height: 1.5,
            background: "currentColor",
            borderRadius: 1,
          }}
        />
      </button>
    </div>
  );
}

export function Gallery({ state, search, onSearchChange, onSelect, onPlayTest, onRunAll }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [fuzzy, setFuzzy] = useState(false);

  // Callback ref so the ResizeObserver attaches whenever the scroll
  // container actually mounts (it's only rendered when totalTests > 0).
  const setScrollRef = useCallback((el: HTMLDivElement | null) => {
    (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    roRef.current?.disconnect();
    roRef.current = null;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width - PAD * 2);
    });
    ro.observe(el);
    roRef.current = ro;
  }, []);

  const deferredSearch = useDeferredValue(search);
  const q = deferredSearch.toLowerCase();

  type CardRowItem = { type: "cards"; items: Array<{ test: TestCase; suiteName: string }> };
  type HeaderRowItem = { type: "header"; suiteName: string };
  type RowItem = HeaderRowItem | CardRowItem;

  // How many columns fit — minimum 1
  const cols =
    containerWidth > 0 ? Math.max(1, Math.floor((containerWidth + GAP) / (CARD_MIN_W + GAP))) : 1;

  const groups = useMemo(
    () =>
      state.suites
        .map((suite) => ({
          name: suite.name,
          tests: suite.tests
            .filter((t) => t.snapshots.length > 0)
            .filter((t) => !q || matches(t.name, q, !fuzzy) || matches(suite.name, q, !fuzzy))
            .map((t) => ({ test: t, suiteName: suite.name })),
        }))
        .filter((g) => g.tests.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.suites, q, fuzzy],
  );

  const totalTests = useMemo(() => groups.reduce((n, g) => n + g.tests.length, 0), [groups]);

  // Build a flat list of virtual rows: header + card-chunk rows per group
  const rows = useMemo<RowItem[]>(() => {
    const result: RowItem[] = [];
    for (const group of groups) {
      result.push({ type: "header", suiteName: group.name });
      for (let i = 0; i < group.tests.length; i += cols) {
        result.push({ type: "cards", items: group.tests.slice(i, i + cols) });
      }
    }
    return result;
  }, [groups, cols]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => (rows[i]?.type === "header" ? HEADER_H + GAP : CARD_H + GAP),
    overscan: 3,
  });

  const hasAnyVisual = state.suites.some((s) => s.tests.some((t) => t.snapshots.length > 0));

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Search bar */}
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid #2a2a36",
          background: "#16161d",
          flexShrink: 0,
        }}
      >
        <SearchCombobox
          state={state}
          search={search}
          fuzzy={fuzzy}
          onSearchChange={onSearchChange}
          onFuzzyChange={setFuzzy}
          onSelect={onSelect}
        />
      </div>

      {totalTests === 0 ? (
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
            {!hasAnyVisual ? (
              <>
                <div style={{ fontSize: 32, marginBottom: 16 }}>◌</div>
                <div style={{ fontSize: 14, color: "#c4c4d4", marginBottom: 8 }}>
                  No visual output yet
                </div>
                <div style={{ fontSize: 12, color: "#4b4b60", marginBottom: 20, lineHeight: 1.6 }}>
                  Run your tests to see rendered snapshots here. Use{" "}
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
                    render()
                  </code>{" "}
                  in your tests to capture visual snapshots.
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
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
              </>
            ) : search ? (
              <div style={{ fontSize: 14 }}>No visual tests match "{search}"</div>
            ) : (
              <div style={{ fontSize: 14 }}>No visual tests found</div>
            )}
          </div>
        </div>
      ) : (
        <div ref={setScrollRef} style={{ flex: 1, overflow: "auto", padding: PAD }}>
          <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
            {virtualizer.getVirtualItems().map((vRow) => {
              const row = rows[vRow.index];
              return (
                <div
                  key={vRow.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${vRow.start}px)`,
                  }}
                >
                  {row.type === "header" ? (
                    <div
                      style={{
                        height: HEADER_H,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: GAP,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#6366f1",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {row.suiteName}
                      </span>
                      <div style={{ flex: 1, height: 1, background: "#2a2a36" }} />
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${cols}, 1fr)`,
                        gap: GAP,
                        paddingBottom: GAP,
                      }}
                    >
                      {row.items.map(({ test, suiteName }) => (
                        <GalleryCard
                          key={test.id}
                          test={test}
                          suiteName={suiteName}
                          onSelect={() => onSelect(test)}
                          onPlayTest={() => onPlayTest(test)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
