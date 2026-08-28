import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

const COST_STRIDE = 7;
const COST = { module: 0, self: 1, total: 2, load: 3, resolve: 4, cut: 5, owned: 6 };

const PHASES = [
  ["CPU evaluation", "cpuMs", "#3659e3"],
  ["Loader", "loaderMs", "#e2634c"],
  ["Async wait", "asyncMs", "#168b75"],
  ["Unknown", "unknownMs", "#aab4c8"],
];

const SORTS = [
  ["cut", "Cut cost", "CPU that disappears if this file stops being imported"],
  ["self", "Self CPU", "CPU spent evaluating this file's own module body"],
  ["total", "Stack CPU", "Sampled CPU with this file anywhere on the stack"],
  ["loader", "Loader", "Resolution and load time attributed to this file"],
];

const report = JSON.parse(document.getElementById("profile-data").textContent);

/** Rebuild the paths the payload stores split into interned directory + file name. */
const paths = report.names.map((name, id) => report.dirs[report.dirOf[id]] + name);

function ms(value) {
  if (!value) return "0ms";
  if (value < 0.1) return "<0.1ms";
  if (value < 10) return value.toFixed(1) + "ms";
  if (value < 1000) return Math.round(value) + "ms";
  return (value / 1000).toFixed(2) + "s";
}

function bytes(value) {
  if (!value) return "—";
  if (value < 1024) return value + "B";
  if (value < 1024 * 1024) return (value / 1024).toFixed(1) + "KB";
  return (value / (1024 * 1024)).toFixed(1) + "MB";
}

/** Directory names that identify nothing on their own. */
const GENERIC = new Set(["dist", "src", "lib", "esm", "cjs", "build", "index", "node_modules"]);

/**
 * A graph node has room for a few segments. Packages bury their entry point
 * under dist/ and call it index.js, so walk past the generic segments until the
 * label says which module this actually is.
 */
function basename(path) {
  const parts = path.split("/").filter(Boolean);
  const name = parts.pop() ?? path;
  const generic = GENERIC.has(name.replace(/\.[cm]?[jt]sx?$/, ""));
  const qualifiers = [];
  for (let i = parts.length - 1; i >= 0 && qualifiers.length < 2; i--) {
    if (GENERIC.has(parts[i])) continue;
    qualifiers.unshift(parts[i]);
    if (!generic) break;
  }
  return [...qualifiers, name].join("/");
}

/**
 * Node labels are SVG text, which does not wrap or ellipsize. The face is
 * monospace, so clamping by character count is exact; keep the tail because the
 * file name identifies the module and the leading directories rarely do.
 */
function clamp(text, width, fontSize) {
  const fits = Math.floor((width - 30) / (fontSize * 0.62));
  return text.length <= fits ? text : "…" + text.slice(text.length - fits + 1);
}

/** Truncate the directory rather than the file name, which is the part that identifies a module. */
function FilePath({ path, className }) {
  const cut = path.lastIndexOf("/") + 1;
  return (
    <span className={className} title={path}>
      {cut > 0 && <i className="path-dir">{path.slice(0, cut)}</i>}
      <b className="path-name">{path.slice(cut)}</b>
    </span>
  );
}

/**
 * Materialize one test into rows and adjacency lists. Everything the views need
 * is derived from this once per test, so selecting a file or walking the graph
 * never re-scans the global edge list.
 */
function buildTestModel(testIndex) {
  const test = report.tests[testIndex];
  const local = new Map();
  test.modules.forEach((id, index) => local.set(id, index));
  const rows = test.modules.map((id, index) => ({
    index,
    id,
    path: paths[id],
    self: 0,
    total: 0,
    loader: 0,
    cut: 0,
    owned: 1,
    idom: test.idoms[index],
    size: report.sizes[id],
    reach: report.reach[id],
  }));
  for (let at = 0; at < test.costs.length; at += COST_STRIDE) {
    const row = rows[test.costs[at + COST.module]];
    row.self = test.costs[at + COST.self];
    row.total = test.costs[at + COST.total];
    row.loader = test.costs[at + COST.load] + test.costs[at + COST.resolve];
    row.cut = test.costs[at + COST.cut];
    row.owned = test.costs[at + COST.owned];
  }
  const outgoing = rows.map(() => []);
  const incoming = rows.map(() => []);
  for (let i = 0; i < report.edges.length; i += 2) {
    const from = local.get(report.edges[i]);
    const to = local.get(report.edges[i + 1]);
    if (from === undefined || to === undefined || from === to) continue;
    outgoing[from].push(to);
    incoming[to].push(from);
  }
  const byCut = (a, b) => rows[b].cut - rows[a].cut;
  for (const list of outgoing) list.sort(byCut);
  for (const list of incoming) list.sort(byCut);
  let connectedCpuMs = 0;
  let connectedCount = 0;
  for (const row of rows) {
    if (row.idom < 0 && row.index !== test.root) continue;
    connectedCpuMs += row.self;
    connectedCount++;
  }

  // Shortest import path from the entry point. The filmstrip walks real import
  // edges, and a dominator parent can skip levels — idom[shared] is the branch
  // point, which need not import `shared` directly — so it cannot seed the strip.
  const parent = rows.map(() => -1);
  if (test.root >= 0) {
    const queue = [test.root];
    const seen = new Uint8Array(rows.length);
    seen[test.root] = 1;
    for (let head = 0; head < queue.length; head++) {
      const node = queue[head];
      for (const child of outgoing[node]) {
        if (seen[child]) continue;
        seen[child] = 1;
        parent[child] = node;
        queue.push(child);
      }
    }
  }

  return { test, rows, outgoing, incoming, parent, connectedCpuMs, connectedCount };
}

/** Walk BFS parents back to the entry point, giving a path of real import edges. */
function pathTo(model, node) {
  const path = [node];
  let current = model.parent[node];
  while (current >= 0 && path.length < 64) {
    path.unshift(current);
    current = model.parent[current];
  }
  return path;
}

/** The chain of imports you would have to break to drop this module. */
function dominatorChain(model, index) {
  const chain = [];
  let current = model.rows[index]?.idom ?? -1;
  while (current >= 0 && chain.length < 32) {
    chain.unshift(current);
    current = model.rows[current].idom;
  }
  return chain;
}

function why(model, row) {
  if (row.idom < 0 && row.index !== model.test.root)
    return "Sampled without a captured import edge";
  if (row.self > row.cut * 0.6) return "Cost is its own module body";
  if (row.owned > 1) return "Owns " + (row.owned - 1).toLocaleString() + " files below it";
  if (row.loader > row.self) return "Loader and resolution dominate";
  if (model.incoming[row.index]?.length > 1)
    return "Shared by " + model.incoming[row.index].length + " importers";
  return "Contributes through its dependencies";
}

function diagnosis(model, row) {
  const importers = model.incoming[row.index] ?? [];
  if (row.index === model.test.root) {
    return "This is the test entry point. Everything below it is the import cost of running this file.";
  }
  if (row.idom < 0) {
    return (
      "The profiler sampled " +
      ms(row.self) +
      " here but never saw an import edge reach it. It is usually a CommonJS or native frame pulled in indirectly."
    );
  }
  const gate = model.rows[row.idom];
  if (importers.length > 1) {
    return (
      "Reached by " +
      importers.length +
      " importers, so cutting any single one saves nothing. The " +
      ms(row.cut) +
      " only goes away once every path through " +
      gate.path +
      " does."
    );
  }
  if (row.self > row.cut * 0.6) {
    return "Almost all of this is the module body itself. Move the module-scope work behind a function or a lazy initializer.";
  }
  if (row.owned > 1) {
    return (
      "Removing the import in " +
      gate.path +
      " drops " +
      (row.owned - 1).toLocaleString() +
      " files and " +
      ms(row.cut) +
      ". Defer it, or import a narrower entry point."
    );
  }
  if (row.loader > row.self) {
    return "Resolution and load outweigh evaluation. Check resolution indirection, barrel files, and generated sources.";
  }
  return "Not dominant on its own. Follow its highest cut-cost dependency before changing this file.";
}

/** Entry points ordered slowest first: payload order is discovery order, which buries the cold start. */
const byCost = report.tests
  .map((test, index) => index)
  .sort((a, b) => report.tests[b].durationMs - report.tests[a].durationMs);

function useTestModel() {
  const [testIndex, setTestIndex] = useState(byCost[0] ?? 0);
  const model = useMemo(
    () => (report.tests[testIndex] ? buildTestModel(testIndex) : null),
    [testIndex],
  );
  return [model, testIndex, setTestIndex];
}

function RunStrip({ model, testIndex, onSelectTest }) {
  const { test } = model;
  const unlinked = Math.max(0, test.cpuMs - model.connectedCpuMs);
  const slowest = Math.max(1, ...report.tests.map((entry) => entry.durationMs));
  return (
    <section className="run">
      <div className="run-tests">
        <span className="kicker">Entry points · {ms(report.totalImportMs)} total</span>
        <div className="run-list">
          {byCost.map((index) => {
            const entry = report.tests[index];
            return (
              <button
                key={entry.file}
                type="button"
                className="run-row"
                aria-current={index === testIndex}
                onClick={() => onSelectTest(index)}
              >
                <span title={entry.file}>{entry.file}</span>
                <i>
                  {PHASES.map(([label, key, color]) => (
                    <em
                      key={key}
                      title={label + " " + ms(entry[key])}
                      style={{ width: (entry[key] / slowest) * 100 + "%", background: color }}
                    />
                  ))}
                </i>
                <strong>{ms(entry.durationMs)}</strong>
              </button>
            );
          })}
        </div>
      </div>
      <div className="run-phases">
        <span className="kicker">
          Where {test.file} spends {ms(test.durationMs)}
        </span>
        <ul className="phase-legend">
          {PHASES.map(([label, key, color]) => (
            <li key={key}>
              <i style={{ background: color }} />
              <span>{label}</span>
              <strong>{ms(test[key])}</strong>
            </li>
          ))}
        </ul>
        <p className="run-note">
          The import graph accounts for {ms(model.connectedCpuMs)} across{" "}
          {model.connectedCount.toLocaleString()} connected files. {ms(unlinked)} of CPU was sampled
          in frames with no captured import edge.
        </p>
      </div>
    </section>
  );
}

const ROW_HEIGHT = 46;
const OVERSCAN = 6;

/**
 * Node builtins and the test runner itself. Shown by default: on a CommonJS-heavy
 * suite `node:internal/modules/cjs/loader` is routinely the single largest cost,
 * and hiding it silently would misstate where the time goes. The toggle exists
 * for when you want only files you can edit.
 */
function isRuntimeInternal(path) {
  return path.startsWith("node:") || path.includes("/roadtest/dist/");
}

function RankedFiles({ model, focus, onFocus }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("cut");
  const [showInternals, setShowInternals] = useState(true);
  const [scrollTop, setScrollTop] = useState(0);
  const [height, setHeight] = useState(600);
  const viewport = useRef(null);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setHeight(element.clientHeight));
    observer.observe(element);
    setHeight(element.clientHeight);
    return () => observer.disconnect();
  }, []);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = model.rows.filter(
      (row) =>
        (showInternals || !isRuntimeInternal(row.path)) &&
        (!needle || row.path.toLowerCase().includes(needle)),
    );
    return rows.sort((a, b) => b[sort] - a[sort] || a.path.localeCompare(b.path));
  }, [model, query, sort, showInternals]);

  // Report what hiding would cost you, so the toggle is an informed choice.
  const internals = useMemo(() => {
    let count = 0;
    let cut = 0;
    for (const row of model.rows) {
      if (!isRuntimeInternal(row.path)) continue;
      count++;
      cut += row.cut;
    }
    return { count, cut };
  }, [model]);

  const max = Math.max(1, matches[0]?.[sort] ?? 1);
  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const end = Math.min(matches.length, Math.ceil((scrollTop + height) / ROW_HEIGHT) + OVERSCAN);
  const active = SORTS.find(([key]) => key === sort);

  return (
    <section className="ranked" aria-label="Ranked files">
      <div className="ranked-tools">
        <input
          type="search"
          value={query}
          placeholder="Filter files…"
          onChange={(event) => setQuery(event.target.value)}
        />
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          {SORTS.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <p className="ranked-hint">
        <span>{active[2]}.</span>
        {internals.count > 0 && (
          <button
            type="button"
            aria-pressed={!showInternals}
            onClick={() => setShowInternals(!showInternals)}
          >
            {showInternals ? "Hide" : "Show"} {internals.count} runtime files · {ms(internals.cut)}
          </button>
        )}
      </p>
      <div
        className="ranked-viewport"
        ref={viewport}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        {matches.length === 0 && (
          <p className="ranked-empty">
            No file matches “{query}”
            {!showInternals && internals > 0 ? ". Runtime files are hidden." : "."}
          </p>
        )}
        <div className="ranked-spacer" style={{ height: matches.length * ROW_HEIGHT }}>
          {matches.slice(start, end).map((row, offset) => (
            <button
              key={row.id}
              type="button"
              className="ranked-row"
              aria-current={row.index === focus}
              style={{ top: (start + offset) * ROW_HEIGHT, height: ROW_HEIGHT }}
              onClick={() => onFocus(row.index)}
            >
              <i className="ranked-fill" style={{ width: (row[sort] / max) * 100 + "%" }} />
              <FilePath className="ranked-path" path={row.path} />
              <strong className="ranked-cost">{ms(row[sort])}</strong>
              <span className="ranked-why">{why(model, row)}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="ranked-note">
        {matches.length.toLocaleString()} of {model.rows.length.toLocaleString()} files
        {query ? " match" : " measured"}. Every file stays reachable in the graph.
      </p>
    </section>
  );
}

const NODE = { width: 214, height: 64, gapY: 20, name: 22, cost: 40, owned: 55, scale: 1 };
const LARGE = { width: 288, height: 92, gapY: 28, name: 30, cost: 55, owned: 78, scale: 1.3 };

function heat(value, max) {
  const intensity = max > 0 ? Math.sqrt(Math.min(1, value / max)) : 0;
  return {
    fill: `hsl(${228 - intensity * 22} ${58 + intensity * 32}% ${97 - intensity * 34}%)`,
    ink: intensity > 0.62 ? "#fff" : "#172033",
  };
}

const COLUMN_CAP = 12;

/**
 * Build the filmstrip: one column per hop along `path`, plus a trailing column
 * of the focused file's own imports. Column i holds every direct import of
 * path[i-1], so the selection in each column is what you clicked to get to the
 * next one — which makes going back a click on a node that is already on screen.
 */
function filmstrip(model, path, size) {
  const columns = path.map((node, depth) => {
    const siblings = depth === 0 ? [node] : (model.outgoing[path[depth - 1]] ?? []);
    return { nodes: capped(siblings, node), selected: node, total: siblings.length };
  });
  const focus = path[path.length - 1];
  const children = model.outgoing[focus] ?? [];
  if (children.length > 0) {
    columns.push({ nodes: capped(children, -1), selected: -1, total: children.length });
  }

  const step = size.height + size.gapY;
  const columnGap = size.width + 92;
  // Align every column on its selected node so the path you walked reads as one
  // horizontal line rather than a zigzag.
  const offsets = columns.map((column) => {
    const anchor =
      column.selected >= 0 ? column.nodes.indexOf(column.selected) : (column.nodes.length - 1) / 2;
    return -anchor * step;
  });
  let top = 0;
  let bottom = 0;
  columns.forEach((column, index) => {
    top = Math.min(top, offsets[index]);
    bottom = Math.max(bottom, offsets[index] + (column.nodes.length - 1) * step);
  });

  const pad = 28;
  const centreline = pad - top;
  const positions = new Map();
  const placed = columns.map((column, index) =>
    column.nodes.map((node, row) => {
      const at = { x: 24 + index * columnGap, y: centreline + offsets[index] + row * step };
      positions.set(node, at);
      return { node, ...at };
    }),
  );

  // Only the selected node of a column feeds the next one, so the strip never
  // accumulates the cross-links that made the old neighbourhood view unreadable.
  const links = [];
  for (let index = 1; index < columns.length; index++) {
    const from = columns[index - 1].selected;
    if (from < 0 || !positions.has(from)) continue;
    for (const { node } of placed[index]) links.push([from, node]);
  }

  return {
    columns,
    placed,
    positions,
    links,
    columnGap,
    width: 48 + columns.length * columnGap,
    height: bottom - top + size.height + pad * 2,
  };
}

/**
 * Top nodes by cut cost, always keeping the one on the path even if it ranks low
 * — a column that dropped its own selection would anchor the whole strip wrong.
 */
function capped(nodes, keep) {
  const top = nodes.length <= COLUMN_CAP ? [...nodes] : nodes.slice(0, COLUMN_CAP);
  if (keep >= 0 && !top.includes(keep)) {
    if (top.length < COLUMN_CAP) top.push(keep);
    else top[COLUMN_CAP - 1] = keep;
  }
  return top;
}

function ImportGraph({ model, path, onNavigate, large }) {
  const size = large ? LARGE : NODE;
  const scroll = useRef(null);
  const view = useMemo(() => filmstrip(model, path, size), [model, path, size]);
  const focus = path[path.length - 1];
  const max = Math.max(1, ...[...view.positions.keys()].map((node) => model.rows[node].cut));

  // Keep the newest column rightmost with its ancestors still on screen, so the
  // strip advances like a carousel instead of jumping.
  useEffect(() => {
    const element = scroll.current;
    const at = view.positions.get(focus);
    if (!element || !at) return;
    const trailing = view.columns.length - path.length;
    const rightEdge = at.x + size.width + trailing * view.columnGap + 24;
    element.scrollTo({
      left: Math.max(0, rightEdge - element.clientWidth),
      top: Math.max(0, at.y + size.height / 2 - element.clientHeight / 2),
      behavior: "smooth",
    });
  }, [view, focus, path, size]);

  return (
    <div className="graph-scroll" ref={scroll}>
      <svg
        className="graph"
        width={view.width}
        height={view.height}
        viewBox={`0 0 ${view.width} ${view.height}`}
        role="img"
        aria-label="Import path, one column per hop"
      >
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
            <path d="M0,0 L0,6 L7,3z" fill="#8290aa" />
          </marker>
        </defs>
        <g>
          {view.links.map(([from, to]) => {
            const start = view.positions.get(from);
            const end = view.positions.get(to);
            const x1 = start.x + size.width;
            const y1 = start.y + size.height / 2;
            const y2 = end.y + size.height / 2;
            const curve = Math.max(40, (end.x - x1) * 0.45);
            return (
              <path
                key={from + ":" + to}
                className={path.includes(to) ? "edge edge-primary" : "edge"}
                markerEnd="url(#arrow)"
                d={`M${x1},${y1} C${x1 + curve},${y1} ${end.x - curve},${y2} ${end.x},${y2}`}
              />
            );
          })}
        </g>
        {view.placed.map((column, depth) => (
          <g key={depth}>
            {column.map(({ node, x, y }) => {
              const row = model.rows[node];
              const onPath = path[depth] === node;
              const paint = heat(row.cut, max);
              const ways = (model.incoming[node] ?? []).length;
              return (
                <g
                  key={row.id}
                  className={"node" + (node === focus ? " is-focus" : onPath ? " is-path" : "")}
                  transform={`translate(${x} ${y})`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${row.path}, ${ms(row.cut)} cut cost`}
                  aria-current={onPath}
                  onClick={() => onNavigate(depth, node)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    onNavigate(depth, node);
                  }}
                >
                  <rect
                    width={size.width}
                    height={size.height}
                    rx="8"
                    style={{ fill: paint.fill }}
                  />
                  <text
                    className="node-name"
                    x="13"
                    y={size.name}
                    style={{ fill: paint.ink, fontSize: 11 * size.scale }}
                  >
                    {clamp(basename(row.path), size.width, 11 * size.scale)}
                  </text>
                  <text
                    className="node-cost"
                    x="13"
                    y={size.cost}
                    style={{ fill: paint.ink, opacity: 0.78, fontSize: 10 * size.scale }}
                  >
                    {clamp(
                      `${ms(row.cut)} cut · ${ms(row.self)} self`,
                      size.width,
                      10 * size.scale,
                    )}
                  </text>
                  <text
                    className="node-owned"
                    x="13"
                    y={size.owned}
                    style={{ fill: paint.ink, opacity: 0.62, fontSize: 9 * size.scale }}
                  >
                    {clamp(
                      [
                        row.owned > 1 ? `owns ${(row.owned - 1).toLocaleString()}` : "",
                        ways > 1 ? `${ways} ways in` : "",
                      ]
                        .filter(Boolean)
                        .join(" · "),
                      size.width,
                      9 * size.scale,
                    )}
                  </text>
                </g>
              );
            })}
            {column.length > 0 && view.columns[depth].total > column.length && (
              <text
                className="column-more"
                x={column[0].x + 13}
                y={column[column.length - 1].y + size.height + 18}
              >
                +{(view.columns[depth].total - column.length).toLocaleString()} more
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

const LIST_CAP = 40;

/** A scrollable, complete list of modules — the escape hatch when a column is capped. */
function ModuleList({ model, nodes, onPick, empty }) {
  if (nodes.length === 0) return <p className="inspector-empty">{empty}</p>;
  return (
    <>
      <div className="inspector-list">
        {nodes.slice(0, LIST_CAP).map((node) => (
          <button key={model.rows[node].id} type="button" onClick={() => onPick(node)}>
            <FilePath path={model.rows[node].path} />
            <strong>{ms(model.rows[node].cut)}</strong>
          </button>
        ))}
      </div>
      {nodes.length > LIST_CAP && (
        <p className="inspector-empty">
          {(nodes.length - LIST_CAP).toLocaleString()} more not shown; filter the ranked list to
          reach them.
        </p>
      )}
    </>
  );
}

function Inspector({ model, focus, onFocus, onPivot }) {
  const row = model.rows[focus];
  if (!row) return null;
  const chain = dominatorChain(model, focus);
  const importers = model.incoming[focus] ?? [];
  const imports = model.outgoing[focus] ?? [];
  const metrics = [
    ["Cut cost", ms(row.cut)],
    ["Self CPU", ms(row.self)],
    ["Stack CPU", ms(row.total)],
    ["Loader", ms(row.loader)],
    ["Files owned", (row.owned - 1).toLocaleString()],
    ["Direct imports", imports.length.toLocaleString()],
    ["Imported by", importers.length.toLocaleString()],
    ["Size", bytes(row.size)],
  ];
  return (
    <aside className="inspector" aria-live="polite">
      <div className="inspector-head">
        <span className="kicker">Selected file</span>
        <p className="inspector-path">{row.path}</p>
      </div>
      <div className="inspector-metrics">
        {metrics.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <p className="inspector-diagnosis">{diagnosis(model, row)}</p>

      {importers.length > 1 && (
        <div className="inspector-section">
          <h3>{importers.length} ways in</h3>
          <p className="inspector-empty">
            The strip shows one of them. Pick another to rebuild the path through it.
          </p>
          <ModuleList model={model} nodes={importers} onPick={(node) => onPivot(node)} empty="" />
        </div>
      )}

      {chain.length > 0 && (
        <div className="inspector-section inspector-chain">
          <h3>{importers.length > 1 ? "Gated by" : "Only reachable through"}</h3>
          <ol>
            {chain.map((node) => (
              <li key={model.rows[node].id}>
                <button type="button" onClick={() => onFocus(node)}>
                  <FilePath path={model.rows[node].path} />
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="inspector-section">
        <h3>Imports, by cut cost</h3>
        <ModuleList
          model={model}
          nodes={imports}
          onPick={onFocus}
          empty="This file imports nothing the profiler captured."
        />
      </div>

      {row.reach > 1 && (
        <p className="inspector-shared">
          {row.reach.toLocaleString()} entry points import this file, so the saving repeats across
          the run.
        </p>
      )}
    </aside>
  );
}

function Empty({ message }) {
  return (
    <div className="empty">
      <span className="kicker">Roadtest import profile</span>
      <p>{message}</p>
      <code>{report.command}</code>
    </div>
  );
}

function Workbench() {
  const [model, testIndex, setTestIndex] = useTestModel();
  const [path, setPath] = useState([]);
  const [large, setLarge] = useState(false);

  useEffect(() => {
    if (model) setPath([Math.max(0, model.test.root)]);
  }, [model]);

  const focus = path[path.length - 1] ?? model?.test.root ?? 0;

  /** Jump anywhere: rebuild the whole path so the strip always shows how you got there. */
  const onFocus = useCallback(
    (node) => {
      if (model) setPath(pathTo(model, node));
    },
    [model],
  );

  /** A click inside the strip: `depth` is the column, so anything but the last truncates. */
  const onNavigate = useCallback((depth, node) => {
    setPath((current) => [...current.slice(0, depth), node]);
  }, []);

  /** Show the same file reached through a different importer. */
  const onPivot = useCallback(
    (importer) => {
      if (model) setPath([...pathTo(model, importer), focus]);
    },
    [model, focus],
  );

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== "Escape" && event.key !== "Backspace") return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement)
        return;
      setPath((current) => (current.length > 1 ? current.slice(0, -1) : current));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!model || model.rows.length === 0) {
    return <Empty message="This run recorded no module imports, so there is nothing to explore." />;
  }

  return (
    <>
      <header className="masthead">
        <div>
          <span className="kicker">Roadtest import profile</span>
          <h1>What is this test paying to import?</h1>
          <p>
            Files are ranked by cut cost — the CPU that disappears if the file stops being imported.
            Select one to see the import path that reaches it, then walk deeper one column at a
            time.
          </p>
        </div>
        <div className="masthead-meta">
          <select
            aria-label="Select test entry point"
            value={testIndex}
            onChange={(event) => setTestIndex(Number(event.target.value))}
          >
            {byCost.map((index) => (
              <option key={report.tests[index].file} value={index}>
                {report.tests[index].file} · {ms(report.tests[index].durationMs)}
              </option>
            ))}
          </select>
          <code>{report.command}</code>
          <span>{new Date(report.generatedAt).toLocaleString()}</span>
          <span>
            {report.uniqueModuleCount.toLocaleString()} unique files ·{" "}
            {report.sharedModuleCount.toLocaleString()} shared
          </span>
        </div>
      </header>
      <RunStrip model={model} testIndex={testIndex} onSelectTest={setTestIndex} />
      <div className="workbench">
        <RankedFiles model={model} focus={focus} onFocus={onFocus} />
        <section className="graph-panel" aria-label="Import graph">
          <div className="graph-bar">
            <nav className="crumbs" aria-label="Import path">
              {path.map((node, index) => (
                <button
                  key={model.rows[node].id + ":" + index}
                  type="button"
                  aria-current={index === path.length - 1}
                  onClick={() => setPath((current) => current.slice(0, index + 1))}
                >
                  {basename(model.rows[node].path)}
                </button>
              ))}
            </nav>
            <div className="graph-controls">
              <button type="button" aria-pressed={large} onClick={() => setLarge(!large)}>
                {large ? "Compact nodes" : "Large nodes"}
              </button>
            </div>
          </div>
          <div className="graph-body">
            <ImportGraph model={model} path={path} onNavigate={onNavigate} large={large} />
            <Inspector model={model} focus={focus} onFocus={onFocus} onPivot={onPivot} />
          </div>
        </section>
      </div>
    </>
  );
}

createRoot(document.getElementById("report")).render(
  report.tests.length > 0 ? <Workbench /> : <Empty message="This run profiled no test files." />,
);
