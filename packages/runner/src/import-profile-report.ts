import type { ImportProfile } from "./import-profile.js";

/** Number of consecutive entries each measured module occupies in {@link ReportTest.costs}. */
export const COST_STRIDE = 7;

/**
 * Offsets within one row of {@link ReportTest.costs}. Rows are sparse: at real
 * scale about 70% of a test's modules measure zero on every field, so only
 * modules with something to report get a row, keyed by `module`.
 *
 * `cut` is the CPU that disappears if the module stops being imported: its own
 * self CPU plus the self CPU of every module reachable *only* through it. It is
 * derived from the dominator tree, so no millisecond is counted twice and the
 * column sums to the graph-connected total.
 */
export const COST = {
  module: 0,
  self: 1,
  total: 2,
  load: 3,
  resolve: 4,
  cut: 5,
  owned: 6,
} as const;

export interface ReportTest {
  file: string;
  /** Index into {@link ReportTest.modules} of this test's entry point, or -1. */
  root: number;
  durationMs: number;
  cpuMs: number;
  loaderMs: number;
  asyncMs: number;
  unknownMs: number;
  moduleCount: number;
  sharedModuleCount: number;
  /** Global module ids involved in this test. Local index = position in this array. */
  modules: number[];
  /**
   * Immediate dominator per entry of {@link ReportTest.modules}, as a local
   * index. -1 for the root and for modules sampled without a captured import
   * edge, which is also what marks a module as disconnected from the root.
   */
  idoms: number[];
  /** Sparse {@link COST_STRIDE}-wide rows for modules that measured non-zero. */
  costs: number[];
  asyncWaits: Array<{ type: string; durationMs: number }>;
}

export interface ImportProfileReport {
  generatedAt: string;
  command: string;
  totalImportMs: number;
  uniqueModuleCount: number;
  sharedModuleCount: number;
  /**
   * Paths are split so the directory is stored once: module id `n` has path
   * `dirs[dirOf[n]] + names[n]`. Real runs share a few thousand directories
   * across tens of thousands of files.
   */
  dirs: string[];
  dirOf: number[];
  names: string[];
  /** File size in bytes per global module id, 0 when unknown. */
  sizes: number[];
  /** How many tests reach each global module id. */
  reach: number[];
  /** Global importer/imported id pairs, flattened. */
  edges: number[];
  tests: ReportTest[];
  asyncWaits: Array<{ type: string; durationMs: number }>;
}

/** CPU profiles sample at millisecond resolution, so 10µs is already past the noise floor. */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

interface Subgraph {
  successors: number[][];
  predecessors: number[][];
}

/** Restrict the global edge list to one test's modules, in local index space. */
function subgraph(edges: number[], local: Map<number, number>, size: number): Subgraph {
  const successors: number[][] = Array.from({ length: size }, () => []);
  const predecessors: number[][] = Array.from({ length: size }, () => []);
  for (let i = 0; i < edges.length; i += 2) {
    const from = local.get(edges[i]);
    const to = local.get(edges[i + 1]);
    if (from === undefined || to === undefined || from === to) continue;
    successors[from].push(to);
    predecessors[to].push(from);
  }
  return { successors, predecessors };
}

/** Reverse post-order from the root, plus each node's position in it. */
function reversePostOrder(
  successors: number[][],
  root: number,
): { order: number[]; rank: Int32Array } {
  const rank = new Int32Array(successors.length).fill(-1);
  const postOrder: number[] = [];
  const seen = new Uint8Array(successors.length);
  // Explicit stack: real dependency graphs nest deeply enough to blow the call stack.
  const stack: Array<{ node: number; next: number }> = [{ node: root, next: 0 }];
  seen[root] = 1;
  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    const children = successors[frame.node];
    if (frame.next < children.length) {
      const child = children[frame.next++];
      if (!seen[child]) {
        seen[child] = 1;
        stack.push({ node: child, next: 0 });
      }
      continue;
    }
    postOrder.push(frame.node);
    stack.pop();
  }
  const order = postOrder.reverse();
  for (let i = 0; i < order.length; i++) rank[order[i]] = i;
  return { order, rank };
}

/**
 * Immediate dominators by the Cooper–Harvey–Kennedy iterative algorithm, which
 * is simpler than Lengauer–Tarjan and fast enough on import graphs because they
 * are shallow and nearly reducible.
 */
function immediateDominators(
  graph: Subgraph,
  root: number,
  order: number[],
  rank: Int32Array,
): Int32Array {
  const idom = new Int32Array(graph.successors.length).fill(-1);
  idom[root] = root;
  const intersect = (a: number, b: number): number => {
    let left = a;
    let right = b;
    while (left !== right) {
      while (rank[left] > rank[right]) left = idom[left];
      while (rank[right] > rank[left]) right = idom[right];
    }
    return left;
  };
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of order) {
      if (node === root) continue;
      let candidate = -1;
      for (const predecessor of graph.predecessors[node]) {
        if (rank[predecessor] < 0 || idom[predecessor] < 0) continue;
        candidate = candidate < 0 ? predecessor : intersect(predecessor, candidate);
      }
      if (candidate >= 0 && idom[node] !== candidate) {
        idom[node] = candidate;
        changed = true;
      }
    }
  }
  return idom;
}

/**
 * Fold self CPU up the dominator tree so every module carries the cost of the
 * subtree it exclusively owns. Reverse RPO visits each node before its
 * dominator, so a single pass accumulates the whole tree.
 */
function accumulateOwnership(
  order: number[],
  idom: Int32Array,
  root: number,
  cut: Float64Array,
  owned: Int32Array,
): void {
  for (let i = order.length - 1; i >= 0; i--) {
    const node = order[i];
    if (node === root) continue;
    const parent = idom[node];
    if (parent < 0 || parent === node) continue;
    cut[parent] += cut[node];
    owned[parent] += owned[node];
  }
}

/**
 * Flatten a profile into the shape the HTML report ships: modules described
 * once globally, tests referring to them by index, and per-test cut costs
 * precomputed so the browser never has to traverse the graph to rank files.
 */
export function buildImportProfileReport(
  profile: ImportProfile,
  options: { cwd: string; generatedAt: Date; command: string },
): ImportProfileReport {
  const relative = (path: string): string =>
    path.startsWith(options.cwd + "/") ? path.slice(options.cwd.length + 1) : path;
  const ids = new Map<string, number>();
  const dirIds = new Map<string, number>();
  const dirs: string[] = [];
  const dirOf: number[] = [];
  const names: string[] = [];
  const sizes: number[] = [];
  const reach: number[] = [];
  const idFor = (url: string, path: string, sizeBytes: number | undefined): number => {
    const existing = ids.get(url);
    if (existing !== undefined) return existing;
    const id = names.length;
    ids.set(url, id);
    const cut = path.lastIndexOf("/") + 1;
    const dir = path.slice(0, cut);
    let dirId = dirIds.get(dir);
    if (dirId === undefined) {
      dirId = dirs.length;
      dirIds.set(dir, dirId);
      dirs.push(dir);
    }
    dirOf.push(dirId);
    names.push(path.slice(cut));
    sizes.push(sizeBytes ?? 0);
    reach.push(0);
    return id;
  };

  for (const module of profile.modules) {
    reach[idFor(module.url, module.path, module.sizeBytes)] = module.testFiles.length;
  }

  const edges: number[] = [];
  for (const edge of profile.edges) {
    const from = ids.get(edge.importerUrl);
    const to = ids.get(edge.importedUrl);
    if (from === undefined || to === undefined) continue;
    edges.push(from, to);
  }

  const tests = profile.tests.map((test): ReportTest => {
    const local = new Map<number, number>();
    const modules: number[] = [];
    const self: number[] = [];
    const totals: number[] = [];
    const loads: number[] = [];
    const resolves: number[] = [];
    for (const module of test.modules) {
      const id = idFor(module.url, module.path, module.sizeBytes);
      if (local.has(id)) continue;
      local.set(id, modules.length);
      modules.push(id);
      self.push(round(module.selfCpuMs));
      totals.push(round(module.totalCpuMs));
      loads.push(round(module.loadMs));
      resolves.push(round(module.resolveMs));
    }

    const cut = Float64Array.from(self);
    const owned = new Int32Array(modules.length).fill(1);
    const idoms: number[] = Array.from({ length: modules.length }, () => -1);

    const root = local.get(ids.get(test.rootUrl) ?? -1) ?? -1;
    if (root >= 0) {
      const graph = subgraph(edges, local, modules.length);
      const { order, rank } = reversePostOrder(graph.successors, root);
      const idom = immediateDominators(graph, root, order, rank);
      accumulateOwnership(order, idom, root, cut, owned);
      for (const node of order) idoms[node] = idom[node];
      idoms[root] = -1;
    }

    // Sparse: only modules that measured something get a row.
    const costs: number[] = [];
    for (let node = 0; node < modules.length; node++) {
      const cutMs = round(cut[node]);
      if (
        self[node] === 0 &&
        totals[node] === 0 &&
        loads[node] === 0 &&
        resolves[node] === 0 &&
        cutMs === 0 &&
        owned[node] === 1
      ) {
        continue;
      }
      costs.push(node, self[node], totals[node], loads[node], resolves[node], cutMs, owned[node]);
    }

    return {
      file: relative(test.testFile),
      root,
      durationMs: round(test.durationMs),
      cpuMs: round(test.cpuMs),
      loaderMs: round(test.loaderMs),
      asyncMs: round(test.asyncMs),
      unknownMs: round(test.unknownMs),
      moduleCount: test.moduleCount,
      sharedModuleCount: test.sharedModuleCount,
      modules,
      idoms,
      costs,
      asyncWaits: test.asyncWaits.map(({ type, durationMs }) => ({
        type,
        durationMs: round(durationMs),
      })),
    };
  });

  return {
    generatedAt: options.generatedAt.toISOString(),
    command: options.command,
    totalImportMs: round(profile.totalImportMs),
    uniqueModuleCount: profile.uniqueModuleCount,
    sharedModuleCount: profile.sharedModuleCount,
    dirs,
    dirOf,
    names,
    sizes,
    reach,
    edges,
    tests,
    asyncWaits: profile.asyncWaits.map(({ type, durationMs }) => ({
      type,
      durationMs: round(durationMs),
    })),
  };
}
