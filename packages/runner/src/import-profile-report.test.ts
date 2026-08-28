import { describe, it, expect } from "roadtest";
import { pathToFileURL } from "node:url";
import { buildImportProfileReport, COST, COST_STRIDE } from "./import-profile-report.js";
import type { ImportProfile, ModuleImportEdge, ModuleImportProfile } from "./import-profile.js";

const CWD = "/project";
const url = (path: string) => pathToFileURL(`${CWD}/${path}`).href;

function module_(path: string, selfCpuMs: number): ModuleImportProfile {
  return {
    url: url(path),
    path,
    loadMs: 0,
    resolveMs: 0,
    selfCpuMs,
    totalCpuMs: selfCpuMs,
    sizeBytes: 100,
    testFiles: [`${CWD}/entry.test.ts`],
  };
}

function profileOf(modules: ModuleImportProfile[], edges: Array<[string, string]>): ImportProfile {
  const importEdges: ModuleImportEdge[] = edges.map(([from, to]) => ({
    importerUrl: url(from),
    importedUrl: url(to),
  }));
  return {
    totalImportMs: 100,
    uniqueModuleCount: modules.length,
    sharedModuleCount: 0,
    modules,
    edges: importEdges,
    asyncWaits: [],
    tests: [
      {
        testFile: `${CWD}/entry.test.ts`,
        rootUrl: url("entry.test.ts"),
        durationMs: 100,
        moduleCount: modules.length,
        sharedModuleCount: 0,
        cpuMs: 80,
        loaderMs: 10,
        asyncMs: 5,
        unknownMs: 5,
        modules,
        asyncWaits: [],
      },
    ],
  };
}

function build(profile: ImportProfile) {
  return buildImportProfileReport(profile, {
    cwd: CWD,
    generatedAt: new Date("2026-08-27T12:00:00.000Z"),
    command: "roadtest --profile-imports",
  });
}

function reader(report: ReturnType<typeof build>) {
  const test = report.tests[0];
  const pathOf = (id: number) => report.dirs[report.dirOf[id]] + report.names[id];
  const localOf = (path: string) => test.modules.findIndex((id) => pathOf(id) === path);
  /** Sparse rows omit modules that measured nothing, so a missing row reads as zero. */
  const rowOf = (path: string) => {
    const local = localOf(path);
    for (let at = 0; at < test.costs.length; at += COST_STRIDE) {
      if (test.costs[at + COST.module] === local) return test.costs.slice(at, at + COST_STRIDE);
    }
    return null;
  };
  return {
    test,
    pathOf,
    connected: () =>
      test.idoms.reduce(
        (count, idom, index) => count + (idom >= 0 || index === test.root ? 1 : 0),
        0,
      ),
    cut: (path: string) => rowOf(path)?.[COST.cut] ?? 0,
    owned: (path: string) => rowOf(path)?.[COST.owned] ?? 1,
    idom: (path: string) => {
      const parent = test.idoms[localOf(path)];
      return parent < 0 ? null : pathOf(test.modules[parent]);
    },
  };
}

describe("buildImportProfileReport", () => {
  it("charges a chain's whole tail to the single import that reaches it", () => {
    const report = build(
      profileOf(
        [module_("entry.test.ts", 1), module_("a.ts", 10), module_("b.ts", 100)],
        [
          ["entry.test.ts", "a.ts"],
          ["a.ts", "b.ts"],
        ],
      ),
    );
    const read = reader(report);

    expect(read.cut("b.ts")).toBe(100);
    expect(read.cut("a.ts")).toBe(110);
    expect(read.cut("entry.test.ts")).toBe(111);
    expect(read.owned("a.ts")).toBe(2);
    expect(read.idom("b.ts")).toBe("a.ts");
    expect(read.idom("entry.test.ts")).toBe(null);
  });

  it("charges a shared dependency to the branch point, not to either importer", () => {
    const report = build(
      profileOf(
        [
          module_("entry.test.ts", 1),
          module_("a.ts", 10),
          module_("b.ts", 20),
          module_("shared.ts", 500),
        ],
        [
          ["entry.test.ts", "a.ts"],
          ["entry.test.ts", "b.ts"],
          ["a.ts", "shared.ts"],
          ["b.ts", "shared.ts"],
        ],
      ),
    );
    const read = reader(report);

    // Cutting either importer alone saves nothing, because the other still reaches it.
    expect(read.cut("a.ts")).toBe(10);
    expect(read.cut("b.ts")).toBe(20);
    expect(read.cut("shared.ts")).toBe(500);
    expect(read.idom("shared.ts")).toBe("entry.test.ts");
    // Cut costs of the root's dominator children never double count.
    expect(read.cut("entry.test.ts")).toBe(531);
  });

  it("survives cycles between modules", () => {
    const report = build(
      profileOf(
        [module_("entry.test.ts", 1), module_("a.ts", 10), module_("b.ts", 20)],
        [
          ["entry.test.ts", "a.ts"],
          ["a.ts", "b.ts"],
          ["b.ts", "a.ts"],
        ],
      ),
    );
    const read = reader(report);

    expect(read.cut("a.ts")).toBe(30);
    expect(read.idom("b.ts")).toBe("a.ts");
  });

  it("describes each module once and refers to it by index everywhere else", () => {
    const shared = module_("shared.ts", 5);
    const profile = profileOf(
      [module_("entry.test.ts", 1), shared],
      [["entry.test.ts", "shared.ts"]],
    );
    profile.tests.push({ ...profile.tests[0], testFile: `${CWD}/second.test.ts` });

    const report = build(profile);

    expect(report.names.filter((name) => name === "shared.ts").length).toBe(1);
    expect(report.tests.map((test) => test.file)).toEqual(["entry.test.ts", "second.test.ts"]);
    expect(report.tests[0].idoms.length).toBe(report.tests[0].modules.length);
    expect(report.edges.length).toBe(2);
  });

  it("keeps modules sampled without a captured import edge rankable on their own cost", () => {
    const report = build(profileOf([module_("entry.test.ts", 1), module_("orphan.ts", 42)], []));
    const read = reader(report);

    expect(read.cut("orphan.ts")).toBe(42);
    expect(read.idom("orphan.ts")).toBe(null);
    expect(read.connected()).toBe(1);
  });
});
