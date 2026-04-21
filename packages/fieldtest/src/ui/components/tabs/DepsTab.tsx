import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DepGraph {
  [id: string]: string[];
}

interface DepResponse {
  root: string;
  graph: DepGraph;
}

type FetchState =
  | { phase: "idle" | "loading" }
  | { phase: "done"; root: string; graph: DepGraph }
  | { phase: "error"; message: string };

// ── Layout constants ──────────────────────────────────────────────────────────

const NODE_W = 200;
const NODE_H = 36;
const H_GAP = 20;
const V_GAP = 64;
const PAD = 40;

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortLabel(absPath: string): string {
  const srcMatch = absPath.match(/\/src\/(.+)$/);
  if (srcMatch) return srcMatch[1];
  return absPath.split("/").pop() ?? absPath;
}

function truncate(s: string, max = 26): string {
  return s.length > max ? "\u2026" + s.slice(-(max - 1)) : s;
}

function isTestFile(p: string): boolean {
  return p.includes(".test.") || p.includes(".spec.");
}

// ── Layout ────────────────────────────────────────────────────────────────────

interface NodePos {
  id: string;
  x: number;
  y: number;
  level: number;
}

function buildLayout(graph: DepGraph, root: string): NodePos[] {
  const nodeLevel = new Map<string, number>();
  const levelNodes = new Map<number, string[]>();
  const queue = [root];
  nodeLevel.set(root, 0);

  while (queue.length > 0) {
    const id = queue.shift()!;
    const level = nodeLevel.get(id)!;
    if (!levelNodes.has(level)) levelNodes.set(level, []);
    levelNodes.get(level)!.push(id);
    for (const child of graph[id] ?? []) {
      if (!nodeLevel.has(child)) {
        nodeLevel.set(child, level + 1);
        queue.push(child);
      }
    }
  }

  const maxPerRow = Math.max(...[...levelNodes.values()].map((ns) => ns.length));
  const canvasInner = maxPerRow * NODE_W + (maxPerRow - 1) * H_GAP;

  const positions: NodePos[] = [];
  for (const [level, ns] of levelNodes) {
    const rowW = ns.length * NODE_W + (ns.length - 1) * H_GAP;
    const startX = (canvasInner - rowW) / 2;
    ns.forEach((id, i) => {
      positions.push({
        id,
        x: PAD + startX + i * (NODE_W + H_GAP),
        y: PAD + level * (NODE_H + V_GAP),
        level,
      });
    });
  }

  return positions;
}

// ── Graph view ────────────────────────────────────────────────────────────────

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const SCALE_MIN = 0.15;
const SCALE_MAX = 3;

function clampScale(s: number) {
  return Math.max(SCALE_MIN, Math.min(SCALE_MAX, s));
}

function GraphView({ graph, root }: { graph: DepGraph; root: string }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const containerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null);
  const isDragging = useRef(false);

  const layout = buildLayout(graph, root);
  const posMap = new Map(layout.map((n) => [n.id, n]));

  const edges: [string, string][] = [];
  for (const [from, children] of Object.entries(graph)) {
    for (const to of children) {
      if (posMap.has(from) && posMap.has(to)) edges.push([from, to]);
    }
  }

  const contentW = PAD * 2 + Math.max(0, ...layout.map((n) => n.x + NODE_W - PAD));
  const contentH = PAD * 2 + Math.max(0, ...layout.map((n) => n.y + NODE_H - PAD));

  // Auto-fit on first render
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || layout.length === 0) return;
    const { width, height } = el.getBoundingClientRect();
    const scale = clampScale(Math.min(width / contentW, height / contentH) * 0.9);
    setTransform({
      x: (width - contentW * scale) / 2,
      y: (height - contentH * scale) / 2,
      scale,
    });
  }, [root]); // re-fit when test changes

  // Wheel zoom centered on cursor
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      setTransform((t) => {
        const s = clampScale(t.scale * factor);
        const ratio = s / t.scale;
        return { scale: s, x: cx - (cx - t.x) * ratio, y: cy - (cy - t.y) * ratio };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDragging.current = false;
    drag.current = { startX: e.clientX, startY: e.clientY, tx: transform.x, ty: transform.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    if (Math.abs(dx) + Math.abs(dy) > 3) isDragging.current = true;
    setTransform((t) => ({ ...t, x: drag.current!.tx + dx, y: drag.current!.ty + dy }));
  };

  const onMouseUp = () => {
    drag.current = null;
  };

  const zoom = (factor: number) => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const cx = width / 2;
    const cy = height / 2;
    setTransform((t) => {
      const s = clampScale(t.scale * factor);
      const ratio = s / t.scale;
      return { scale: s, x: cx - (cx - t.x) * ratio, y: cy - (cy - t.y) * ratio };
    });
  };

  const resetView = () => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const scale = clampScale(Math.min(width / contentW, height / contentH) * 0.9);
    setTransform({ x: (width - contentW * scale) / 2, y: (height - contentH * scale) / 2, scale });
  };

  // Highlight sets
  const highlightedNodes = hovered
    ? new Set([
        hovered,
        ...(graph[hovered] ?? []),
        ...layout.filter((n) => (graph[n.id] ?? []).includes(hovered!)).map((n) => n.id),
      ])
    : null;

  const highlightedEdges = hovered
    ? new Set(edges.filter(([f, t]) => f === hovered || t === hovered).map(([f, t]) => `${f}→${t}`))
    : null;

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      {/* Zoom controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "4px 12px",
          borderBottom: "1px solid #1a1a24",
          background: "#0f0f13",
          flexShrink: 0,
        }}
      >
        <ZoomBtn onClick={() => zoom(1.25)}>+</ZoomBtn>
        <ZoomBtn onClick={() => zoom(1 / 1.25)}>−</ZoomBtn>
        <ZoomBtn onClick={resetView} title="Fit to view">
          ⊡
        </ZoomBtn>
        <span style={{ fontSize: 10, color: "#3a3a4e", marginLeft: 4 }}>
          {Math.round(transform.scale * 100)}%
        </span>
        <span style={{ fontSize: 10, color: "#3a3a4e", marginLeft: "auto" }}>
          scroll to zoom · drag to pan
        </span>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: "hidden",
          background: "#0a0a0e",
          cursor: drag.current ? "grabbing" : "grab",
          userSelect: "none",
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <svg width="100%" height="100%" style={{ display: "block" }}>
          <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
            {/* Edges */}
            {edges.map(([from, to], i) => {
              const a = posMap.get(from)!;
              const b = posMap.get(to)!;
              const x1 = a.x + NODE_W / 2;
              const y1 = a.y + NODE_H;
              const x2 = b.x + NODE_W / 2;
              const y2 = b.y;
              const cy = (y1 + y2) / 2;
              const key = `${from}→${to}`;
              const lit = highlightedEdges?.has(key) ?? false;
              const dim = !!hovered && !lit;
              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} C ${x1} ${cy} ${x2} ${cy} ${x2} ${y2}`}
                  fill="none"
                  stroke={lit ? "#6366f1" : "#2a2a36"}
                  strokeWidth={lit ? 2 : 1.5}
                  opacity={dim ? 0.12 : 0.9}
                  style={{ transition: "opacity 0.12s, stroke 0.12s" }}
                />
              );
            })}

            {/* Nodes */}
            {layout.map(({ id, x, y, level }) => {
              const label = truncate(shortLabel(id));
              const isRoot = level === 0;
              const isTest = isTestFile(id);
              const lit = highlightedNodes ? highlightedNodes.has(id) : true;
              const dim = !!hovered && !lit;

              const stroke = isRoot
                ? "#6366f1"
                : isTest
                  ? "rgba(99,102,241,0.45)"
                  : hovered === id
                    ? "#6366f1"
                    : lit
                      ? "rgba(99,102,241,0.3)"
                      : "#2a2a36";

              const fill = isRoot
                ? "rgba(99,102,241,0.18)"
                : hovered === id
                  ? "rgba(99,102,241,0.14)"
                  : "#1a1a24";

              const textFill = isRoot ? "#a5b4fc" : hovered === id || lit ? "#c4c4d4" : "#4b4b60";

              return (
                <g
                  key={id}
                  transform={`translate(${x},${y})`}
                  onMouseEnter={() => !isDragging.current && setHovered(id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    cursor: "default",
                    opacity: dim ? 0.22 : 1,
                    transition: "opacity 0.12s",
                  }}
                >
                  <title>{id}</title>
                  <rect
                    width={NODE_W}
                    height={NODE_H}
                    rx={6}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isRoot ? 1.5 : 1}
                  />
                  {isRoot && <circle cx={14} cy={NODE_H / 2} r={3} fill="#6366f1" opacity={0.9} />}
                  <text
                    x={isRoot ? NODE_W / 2 + 5 : NODE_W / 2}
                    y={NODE_H / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={11}
                    fontFamily="monospace"
                    fill={textFill}
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}

function ZoomBtn({
  onClick,
  children,
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 22,
        height: 22,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "1px solid #2a2a36",
        borderRadius: 4,
        color: "#6b7280",
        fontSize: 14,
        cursor: "pointer",
        lineHeight: 1,
        padding: 0,
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#4b4b60")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#2a2a36")}
    >
      {children}
    </button>
  );
}

// ── DepsTab ───────────────────────────────────────────────────────────────────

interface Props {
  sourceFile?: string;
}

export function DepsTab({ sourceFile }: Props) {
  const [state, setState] = useState<FetchState>({ phase: "idle" });

  useEffect(() => {
    if (!sourceFile) return;
    setState({ phase: "loading" });
    fetch(`/__fieldtest_deps__?file=${encodeURIComponent(sourceFile)}`, {
      headers: { "X-MSW-Intention": "bypass" },
    })
      .then((r) => {
        if (!r.ok) return Promise.reject("unavailable");
        if (!(r.headers.get("content-type") ?? "").includes("json"))
          return Promise.reject("unavailable");
        return r.json() as Promise<DepResponse>;
      })
      .then(({ root, graph }) => setState({ phase: "done", root, graph }))
      .catch((e: unknown) => {
        if (String(e) !== "unavailable") {
          setState({ phase: "error", message: String(e) });
          return;
        }
        // Dev server unavailable — fall back to the bundled graph
        fetch("./fieldtest-graph.json")
          .then((r) => (r.ok ? r.json() : Promise.reject("no static graph")))
          .then((data: { nodes: { id: string }[]; edges: { from: string; to: string }[] }) => {
            // Build importsOf[file] = [deps] from edges (edge = { from: dep, to: importer })
            const importsOf = new Map<string, string[]>();
            for (const { from, to } of data.edges) {
              if (!importsOf.has(to)) importsOf.set(to, []);
              importsOf.get(to)!.push(from);
            }
            // Match sourceFile to an absolute node id.
            // Vite glob paths start with "./" (e.g. "./src/App.test.tsx"); strip the leading dot.
            const normalized = sourceFile.startsWith("./") ? sourceFile.slice(1) : sourceFile;
            const suffix = normalized.startsWith("/") ? normalized : `/${normalized}`;
            const rootId = data.nodes.find((n) => n.id.endsWith(suffix))?.id ?? sourceFile;
            // BFS to build the dep tree
            const graph: DepGraph = {};
            const visited = new Set([rootId]);
            const queue = [rootId];
            while (queue.length > 0) {
              const cur = queue.shift()!;
              const deps = importsOf.get(cur) ?? [];
              graph[cur] = deps;
              for (const dep of deps) {
                if (!visited.has(dep)) {
                  visited.add(dep);
                  queue.push(dep);
                }
              }
            }
            setState({ phase: "done", root: rootId, graph });
          })
          .catch(() => setState({ phase: "done", root: sourceFile, graph: {} }));
      });
  }, [sourceFile]);

  if (!sourceFile) return <Empty icon="◌" message="No source file associated with this test" />;
  if (state.phase === "idle" || state.phase === "loading")
    return <Empty icon="·" message="Loading dependency graph…" />;
  if (state.phase === "error") {
    return (
      <div
        style={{
          padding: "32px 20px",
          textAlign: "center",
          color: "#fca5a5",
          fontSize: 12,
          fontFamily: "monospace",
        }}
      >
        {state.message}
      </div>
    );
  }

  const { root, graph } = state;
  if (Object.keys(graph).length === 0) {
    return <Empty icon="◌" message="No project dependencies found for this test" />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid #1a1a24",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexShrink: 0,
          background: "#0f0f13",
        }}
      >
        <LegendItem color="#6366f1" label="Test file (root)" />
        <LegendItem color="#2a2a36" label="Source file" />
      </div>
      <GraphView graph={graph} root={root} />
    </div>
  );
}

function Empty({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{ padding: "32px 20px", textAlign: "center", color: "#4b4b60", fontSize: 13 }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
      {message}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#4b4b60" }}>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 2,
          background: `${color}22`,
          border: `1px solid ${color}`,
        }}
      />
      {label}
    </div>
  );
}
