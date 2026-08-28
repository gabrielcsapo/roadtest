import { statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Profiler } from "node:inspector";

export interface NsInterval {
  startNs: bigint;
  endNs: bigint;
}

export type ImportProfileEvent =
  | {
      kind: "resolve";
      phaseId: string;
      parentURL?: string;
      url: string;
      durationMs: number;
      startNs: bigint;
      endNs: bigint;
    }
  | {
      kind: "load";
      phaseId: string;
      url: string;
      durationMs: number;
      startNs: bigint;
      endNs: bigint;
    };

export interface AsyncResourceInterval extends NsInterval {
  type: string;
}

export interface ImportProfileSlice extends NsInterval {
  wallMs: number;
  cpuProfile?: Profiler.Profile;
  asyncIntervals?: AsyncResourceInterval[];
}

export interface TestImportTiming {
  testFile: string;
  durationMs: number;
  slices?: ImportProfileSlice[];
}

export interface TestImportProfile {
  testFile: string;
  rootUrl: string;
  durationMs: number;
  moduleCount: number;
  sharedModuleCount: number;
  cpuMs: number;
  loaderMs: number;
  asyncMs: number;
  unknownMs: number;
  modules: ModuleImportProfile[];
  asyncWaits: AsyncWaitProfile[];
}

export interface ModuleImportEdge {
  importerUrl: string;
  importedUrl: string;
}

export interface ModuleImportProfile {
  url: string;
  path: string;
  loadMs: number;
  resolveMs: number;
  selfCpuMs: number;
  totalCpuMs: number;
  sizeBytes?: number;
  testFiles: string[];
}

export interface AsyncWaitProfile {
  type: string;
  durationMs: number;
}

export interface ImportProfile {
  totalImportMs: number;
  uniqueModuleCount: number;
  sharedModuleCount: number;
  tests: TestImportProfile[];
  modules: ModuleImportProfile[];
  edges: ModuleImportEdge[];
  asyncWaits: AsyncWaitProfile[];
}

interface CpuAttribution {
  self: Map<string, number>;
  total: Map<string, number>;
  intervals: NsInterval[];
}

function mergeCost(target: Map<string, number>, source: Map<string, number>): void {
  for (const [url, ms] of source) target.set(url, (target.get(url) ?? 0) + ms);
}

function isProfilerOverhead(url: string): boolean {
  return url === "node:inspector" || /[/\\]cpu-profile\.[cm]?[jt]s$/.test(url);
}

function mergeIntervals(intervals: NsInterval[]): NsInterval[] {
  const sorted = intervals
    .filter((interval) => interval.endNs > interval.startNs)
    .sort((a, b) => (a.startNs < b.startNs ? -1 : a.startNs > b.startNs ? 1 : 0));
  const merged: NsInterval[] = [];
  for (const interval of sorted) {
    const previous = merged[merged.length - 1];
    if (!previous || interval.startNs > previous.endNs) {
      merged.push({ ...interval });
    } else if (interval.endNs > previous.endNs) {
      previous.endNs = interval.endNs;
    }
  }
  return merged;
}

function intervalDurationMs(intervals: NsInterval[]): number {
  return intervals.reduce(
    (sum, interval) => sum + Number(interval.endNs - interval.startNs) / 1_000_000,
    0,
  );
}

function intersectIntervals(left: NsInterval[], right: NsInterval[]): NsInterval[] {
  const a = mergeIntervals(left);
  const b = mergeIntervals(right);
  const out: NsInterval[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const startNs = a[i].startNs > b[j].startNs ? a[i].startNs : b[j].startNs;
    const endNs = a[i].endNs < b[j].endNs ? a[i].endNs : b[j].endNs;
    if (endNs > startNs) out.push({ startNs, endNs });
    if (a[i].endNs < b[j].endNs) i++;
    else j++;
  }
  return out;
}

function subtractIntervals(source: NsInterval[], exclusions: NsInterval[]): NsInterval[] {
  let result = mergeIntervals(source);
  for (const exclusion of mergeIntervals(exclusions)) {
    const next: NsInterval[] = [];
    for (const interval of result) {
      if (exclusion.endNs <= interval.startNs || exclusion.startNs >= interval.endNs) {
        next.push(interval);
        continue;
      }
      if (exclusion.startNs > interval.startNs) {
        next.push({ startNs: interval.startNs, endNs: exclusion.startNs });
      }
      if (exclusion.endNs < interval.endNs) {
        next.push({ startNs: exclusion.endNs, endNs: interval.endNs });
      }
    }
    result = next;
  }
  return result;
}

function attributeCpu(slice: ImportProfileSlice): CpuAttribution {
  const profile = slice.cpuProfile;
  if (!profile) return { self: new Map(), total: new Map(), intervals: [] };

  const { nodes, samples = [], timeDeltas = [] } = profile;
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const parentById = new Map<number, number>();
  for (const node of nodes) {
    for (const child of node.children ?? []) parentById.set(child, node.id);
  }

  const self = new Map<string, number>();
  const total = new Map<string, number>();
  const intervals: NsInterval[] = [];
  const spanNs = slice.endNs - slice.startNs;
  const totalDelta = timeDeltas.reduce((sum, delta) => sum + Math.max(0, delta), 0);
  let cursorNs = slice.startNs;

  for (let i = 0; i < samples.length; i++) {
    const node = byId.get(samples[i]);
    const weight =
      totalDelta > 0 ? Math.max(0, timeDeltas[i] ?? 0) / totalDelta : 1 / samples.length;
    const deltaNs = BigInt(Math.max(0, Math.round(Number(spanNs) * weight)));
    const proposedEndNs = cursorNs + deltaNs;
    const endNs =
      i === samples.length - 1 || proposedEndNs > slice.endNs ? slice.endNs : proposedEndNs;
    const deltaMs = Number(endNs - cursorNs) / 1_000_000;

    const selfUrl = node?.callFrame.url ?? "";
    if (node && !isProfilerOverhead(selfUrl) && selfUrl) {
      self.set(selfUrl, (self.get(selfUrl) ?? 0) + deltaMs);
      intervals.push({ startNs: cursorNs, endNs });

      const stackUrls = new Set<string>();
      let current: number | undefined = node.id;
      while (current !== undefined) {
        const stackNode = byId.get(current);
        if (!stackNode) break;
        if (stackNode.callFrame.url && !isProfilerOverhead(stackNode.callFrame.url)) {
          stackUrls.add(stackNode.callFrame.url);
        }
        current = parentById.get(current);
      }
      for (const url of stackUrls) total.set(url, (total.get(url) ?? 0) + deltaMs);
    }
    cursorNs = endNs;
  }

  return { self, total, intervals: mergeIntervals(intervals) };
}

function modulePath(url: string, cwd: string): string {
  if (url.startsWith("file:")) {
    try {
      const file = fileURLToPath(url);
      const nodeModulesAt = file.lastIndexOf("/node_modules/");
      if (nodeModulesAt >= 0) return file.slice(nodeModulesAt + "/node_modules/".length);
      return file.startsWith(cwd + "/") ? file.slice(cwd.length + 1) : file;
    } catch {
      return url;
    }
  }
  return url;
}

function moduleSize(url: string): number | undefined {
  if (!url.startsWith("file:")) return undefined;
  try {
    return statSync(fileURLToPath(url)).size;
  } catch {
    return undefined;
  }
}

function asyncCategory(type: string): string | null {
  if (type === "PROMISE" || type === "TickObject" || type === "Microtask") return null;
  if (type.startsWith("FSREQ") || type === "FILEHANDLE") return "filesystem";
  if (type.includes("GETADDRINFO") || type.includes("GETNAMEINFO")) return "dns";
  if (/TCP|TLS|HTTP|PIPE|UDP/.test(type)) return "network";
  if (type === "Timeout" || type === "Immediate") return "timers";
  if (type === "WORKER" || type === "MESSAGEPORT") return "worker";
  return `other:${type.toLowerCase()}`;
}

const ASYNC_CATEGORY_PRIORITY = ["filesystem", "dns", "network", "timers", "worker"];

function categoryOrder(category: string): number {
  const index = ASYNC_CATEGORY_PRIORITY.indexOf(category);
  return index >= 0 ? index : ASYNC_CATEGORY_PRIORITY.length;
}

export function buildImportProfile(
  events: ImportProfileEvent[],
  timings: TestImportTiming[],
  cwd: string,
): ImportProfile {
  const children = new Map<string, Set<string>>();
  const loadMs = new Map<string, number>();
  const resolveMs = new Map<string, number>();

  for (const event of events) {
    if (event.kind === "resolve") {
      if (event.parentURL) {
        let next = children.get(event.parentURL);
        if (!next) {
          next = new Set();
          children.set(event.parentURL, next);
        }
        next.add(event.url);
      }
      resolveMs.set(event.url, (resolveMs.get(event.url) ?? 0) + event.durationMs);
    } else {
      loadMs.set(event.url, (loadMs.get(event.url) ?? 0) + event.durationMs);
    }
  }

  const testsByModule = new Map<string, Set<string>>();
  const modulesByTest = new Map<string, Set<string>>();
  const dependencyUrls = new Set<string>();
  const selfCpuMs = new Map<string, number>();
  const totalCpuMs = new Map<string, number>();
  const waitBudgetByTest = new Map<
    string,
    { cpuMs: number; loaderMs: number; asyncMs: number; unknownMs: number }
  >();
  const asyncWaitMs = new Map<string, number>();
  const asyncWaitsByTest = new Map<string, Map<string, number>>();
  const moduleCostsByTest = new Map<
    string,
    {
      selfCpuMs: Map<string, number>;
      totalCpuMs: Map<string, number>;
      loadMs: Map<string, number>;
      resolveMs: Map<string, number>;
    }
  >();

  for (const timing of timings) {
    const root = pathToFileURL(timing.testFile).href;
    const visited = new Set<string>();
    const queue = [root];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      dependencyUrls.add(current);

      let owners = testsByModule.get(current);
      if (!owners) {
        owners = new Set();
        testsByModule.set(current, owners);
      }
      owners.add(timing.testFile);
      for (const child of children.get(current) ?? []) queue.push(child);
    }

    const slices = timing.slices ?? [];
    const wallIntervals = slices.map(({ startNs, endNs }) => ({ startNs, endNs }));
    const cpu: CpuAttribution = { self: new Map(), total: new Map(), intervals: [] };
    for (const slice of slices) {
      const attributed = attributeCpu(slice);
      mergeCost(cpu.self, attributed.self);
      mergeCost(cpu.total, attributed.total);
      cpu.intervals.push(...attributed.intervals);
    }
    cpu.intervals = mergeIntervals(cpu.intervals);
    mergeCost(selfCpuMs, cpu.self);
    mergeCost(totalCpuMs, cpu.total);

    for (const url of new Set([...cpu.self.keys(), ...cpu.total.keys()])) {
      let owners = testsByModule.get(url);
      if (!owners) {
        owners = new Set();
        testsByModule.set(url, owners);
      }
      owners.add(timing.testFile);
    }

    const phaseEvents = events.filter((event) => event.phaseId === timing.testFile);
    const phaseLoadMs = new Map<string, number>();
    const phaseResolveMs = new Map<string, number>();
    for (const event of phaseEvents) {
      const costs = event.kind === "load" ? phaseLoadMs : phaseResolveMs;
      costs.set(event.url, (costs.get(event.url) ?? 0) + event.durationMs);
    }
    const loaderRaw = phaseEvents.map(({ startNs, endNs }) => ({ startNs, endNs }));
    const loaderWithinWall = intersectIntervals(loaderRaw, wallIntervals);
    const loaderIntervals = subtractIntervals(loaderWithinWall, cpu.intervals);

    const asyncByCategory = new Map<string, NsInterval[]>();
    for (const slice of slices) {
      for (const interval of slice.asyncIntervals ?? []) {
        const category = asyncCategory(interval.type);
        if (!category) continue;
        const group = asyncByCategory.get(category);
        if (group) group.push(interval);
        else asyncByCategory.set(category, [interval]);
      }
    }

    const busy = mergeIntervals([...cpu.intervals, ...loaderIntervals]);
    let remainingAsyncSpace = subtractIntervals(wallIntervals, busy);
    let asyncMs = 0;
    const testAsyncWaitMs = new Map<string, number>();
    for (const [category, intervals] of [...asyncByCategory.entries()].sort(
      ([a], [b]) => categoryOrder(a) - categoryOrder(b),
    )) {
      const attributed = intersectIntervals(intervals, remainingAsyncSpace);
      const durationMs = intervalDurationMs(attributed);
      if (durationMs <= 0) continue;
      asyncWaitMs.set(category, (asyncWaitMs.get(category) ?? 0) + durationMs);
      testAsyncWaitMs.set(category, durationMs);
      asyncMs += durationMs;
      remainingAsyncSpace = subtractIntervals(remainingAsyncSpace, attributed);
    }

    const cpuMs = Math.min(timing.durationMs, intervalDurationMs(cpu.intervals));
    const loaderMs = Math.min(timing.durationMs - cpuMs, intervalDurationMs(loaderIntervals));
    const boundedAsyncMs = Math.min(timing.durationMs - cpuMs - loaderMs, asyncMs);
    const unknownMs = Math.max(0, timing.durationMs - cpuMs - loaderMs - boundedAsyncMs);
    waitBudgetByTest.set(timing.testFile, {
      cpuMs,
      loaderMs,
      asyncMs: boundedAsyncMs,
      unknownMs,
    });
    modulesByTest.set(timing.testFile, visited);
    asyncWaitsByTest.set(timing.testFile, testAsyncWaitMs);
    moduleCostsByTest.set(timing.testFile, {
      selfCpuMs: cpu.self,
      totalCpuMs: cpu.total,
      loadMs: phaseLoadMs,
      resolveMs: phaseResolveMs,
    });
  }

  const modules: ModuleImportProfile[] = [...testsByModule.entries()].map(([url, testFiles]) => ({
    url,
    path: modulePath(url, cwd),
    loadMs: loadMs.get(url) ?? 0,
    resolveMs: resolveMs.get(url) ?? 0,
    selfCpuMs: selfCpuMs.get(url) ?? 0,
    totalCpuMs: totalCpuMs.get(url) ?? 0,
    sizeBytes: moduleSize(url),
    testFiles: [...testFiles],
  }));

  const shared = new Set(
    modules
      .filter((module) => dependencyUrls.has(module.url) && module.testFiles.length > 1)
      .map((module) => module.url),
  );
  const modulesByUrl = new Map(modules.map((module) => [module.url, module]));

  const tests = timings.map((timing) => {
    const reachable = modulesByTest.get(timing.testFile) ?? new Set();
    const costs = moduleCostsByTest.get(timing.testFile);
    const budget = waitBudgetByTest.get(timing.testFile) ?? {
      cpuMs: 0,
      loaderMs: 0,
      asyncMs: 0,
      unknownMs: timing.durationMs,
    };
    let sharedModuleCount = 0;
    for (const url of reachable) if (shared.has(url)) sharedModuleCount++;
    const relevantUrls = new Set([
      ...reachable,
      ...(costs?.selfCpuMs.keys() ?? []),
      ...(costs?.totalCpuMs.keys() ?? []),
      ...(costs?.loadMs.keys() ?? []),
      ...(costs?.resolveMs.keys() ?? []),
    ]);
    const testModules = [...relevantUrls].map((url) => {
      const aggregate = modulesByUrl.get(url);
      return {
        url,
        path: aggregate?.path ?? modulePath(url, cwd),
        loadMs: costs?.loadMs.get(url) ?? 0,
        resolveMs: costs?.resolveMs.get(url) ?? 0,
        selfCpuMs: costs?.selfCpuMs.get(url) ?? 0,
        totalCpuMs: costs?.totalCpuMs.get(url) ?? 0,
        sizeBytes: aggregate?.sizeBytes ?? moduleSize(url),
        testFiles: aggregate?.testFiles ?? [timing.testFile],
      };
    });
    return {
      testFile: timing.testFile,
      rootUrl: pathToFileURL(timing.testFile).href,
      durationMs: timing.durationMs,
      moduleCount: reachable.size,
      sharedModuleCount,
      ...budget,
      modules: testModules,
      asyncWaits: [...(asyncWaitsByTest.get(timing.testFile) ?? new Map()).entries()]
        .map(([type, durationMs]) => ({ type, durationMs }))
        .sort((a, b) => b.durationMs - a.durationMs),
    };
  });

  return {
    totalImportMs: timings.reduce((sum, timing) => sum + timing.durationMs, 0),
    uniqueModuleCount: dependencyUrls.size,
    sharedModuleCount: shared.size,
    tests,
    modules,
    edges: [...children.entries()].flatMap(([importerUrl, importedUrls]) =>
      [...importedUrls].map((importedUrl) => ({ importerUrl, importedUrl })),
    ),
    asyncWaits: [...asyncWaitMs.entries()]
      .map(([type, durationMs]) => ({ type, durationMs }))
      .sort((a, b) => b.durationMs - a.durationMs),
  };
}
