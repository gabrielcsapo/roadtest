import { describe, it, expect } from "roadtest";
import { pathToFileURL } from "node:url";
import type { Profiler, Runtime } from "node:inspector";
import { buildImportProfile, type ImportProfileEvent } from "./import-profile.js";
import { renderImportProfile } from "./render.js";

function frame(functionName: string, url: string): Runtime.CallFrame {
  return { functionName, url, scriptId: "1", lineNumber: 0, columnNumber: 0 };
}

function ns(ms: number): bigint {
  return BigInt(ms * 1_000_000);
}

describe("buildImportProfile", () => {
  it("attributes a shared transitive DAG to every selected test", () => {
    const testA = "/project/src/a.test.ts";
    const testB = "/project/src/b.test.ts";
    const shared = pathToFileURL("/project/src/shared.ts").href;
    const leaf = pathToFileURL("/project/src/leaf.ts").href;
    const events: ImportProfileEvent[] = [
      {
        kind: "resolve",
        phaseId: testA,
        parentURL: pathToFileURL(testA).href,
        url: shared,
        durationMs: 2,
        startNs: ns(0),
        endNs: ns(2),
      },
      {
        kind: "resolve",
        phaseId: testB,
        parentURL: pathToFileURL(testB).href,
        url: shared,
        durationMs: 1,
        startNs: ns(40),
        endNs: ns(41),
      },
      {
        kind: "resolve",
        phaseId: testA,
        parentURL: shared,
        url: leaf,
        durationMs: 3,
        startNs: ns(2),
        endNs: ns(5),
      },
      {
        kind: "load",
        phaseId: testA,
        url: shared,
        durationMs: 12,
        startNs: ns(5),
        endNs: ns(17),
      },
      {
        kind: "load",
        phaseId: testA,
        url: leaf,
        durationMs: 8,
        startNs: ns(17),
        endNs: ns(25),
      },
    ];

    const profile = buildImportProfile(
      events,
      [
        { testFile: testA, durationMs: 40 },
        { testFile: testB, durationMs: 15 },
      ],
      "/project",
    );

    expect(profile.totalImportMs).toBe(55);
    expect(profile.uniqueModuleCount).toBe(4);
    expect(profile.sharedModuleCount).toBe(2);
    expect(profile.tests[0].rootUrl).toBe(pathToFileURL(testA).href);
    expect(profile.tests[0].moduleCount).toBe(3);
    expect(profile.tests[0].sharedModuleCount).toBe(2);
    expect(profile.modules.find((module) => module.url === shared)?.testFiles.length).toBe(2);
    expect(profile.modules.find((module) => module.url === shared)?.loadMs).toBe(12);
    expect(profile.edges).toEqual([
      { importerUrl: pathToFileURL(testA).href, importedUrl: shared },
      { importerUrl: pathToFileURL(testB).href, importedUrl: shared },
      { importerUrl: shared, importedUrl: leaf },
    ]);
  });

  it("renders the slowest test first", () => {
    const profile = buildImportProfile(
      [],
      [
        { testFile: "/project/src/fast.test.ts", durationMs: 5 },
        { testFile: "/project/src/slow.test.ts", durationMs: 50 },
      ],
      "/project",
    );

    const output = renderImportProfile(profile, "/project").join("\n");
    expect(output.indexOf("slow.test.ts")).toBeLessThan(output.indexOf("fast.test.ts"));
  });

  it("attributes sampled self and total CPU while preserving unknown time", () => {
    const testFile = "/project/src/profiled.test.ts";
    const testUrl = pathToFileURL(testFile).href;
    const slowUrl = pathToFileURL("/project/src/slow-module.ts").href;
    const cpuProfile: Profiler.Profile = {
      startTime: 0,
      endTime: 8_000,
      nodes: [
        { id: 1, callFrame: frame("(root)", ""), children: [2, 4] },
        { id: 2, callFrame: frame("evaluate test", testUrl), children: [3] },
        { id: 3, callFrame: frame("expensive setup", slowUrl) },
        { id: 4, callFrame: frame("(idle)", "") },
      ],
      samples: [3, 3, 2, 4],
      timeDeltas: [2_000, 2_000, 2_000, 2_000],
    };

    const profile = buildImportProfile(
      [],
      [
        {
          testFile,
          durationMs: 8,
          slices: [
            {
              wallMs: 8,
              startNs: ns(0),
              endNs: ns(8),
              cpuProfile,
            },
          ],
        },
      ],
      "/project",
    );

    expect(profile.tests[0].cpuMs).toBe(6);
    expect(profile.tests[0].unknownMs).toBe(2);
    expect(profile.modules.find((module) => module.url === slowUrl)?.selfCpuMs).toBe(4);
    expect(profile.modules.find((module) => module.url === testUrl)?.totalCpuMs).toBe(6);
  });

  it("attributes overlapping work once using CPU, loader, async, then unknown priority", () => {
    const testFile = "/project/src/profiled.test.ts";
    const testUrl = pathToFileURL(testFile).href;
    const cpuProfile: Profiler.Profile = {
      startTime: 0,
      endTime: 20_000,
      nodes: [
        { id: 1, callFrame: frame("(root)", ""), children: [2, 3] },
        { id: 2, callFrame: frame("evaluate test", testUrl) },
        { id: 3, callFrame: frame("(idle)", "") },
      ],
      samples: [2, 3],
      timeDeltas: [4_000, 16_000],
    };
    const events: ImportProfileEvent[] = [
      {
        kind: "load",
        phaseId: testFile,
        url: testUrl,
        durationMs: 8,
        startNs: ns(2),
        endNs: ns(10),
      },
      {
        kind: "load",
        phaseId: testFile,
        url: testUrl,
        durationMs: 5,
        startNs: ns(3),
        endNs: ns(8),
      },
      {
        kind: "load",
        phaseId: "/project/src/other.test.ts",
        url: testUrl,
        durationMs: 20,
        startNs: ns(0),
        endNs: ns(20),
      },
    ];

    const profile = buildImportProfile(
      events,
      [
        {
          testFile,
          durationMs: 20,
          slices: [
            {
              wallMs: 20,
              startNs: ns(0),
              endNs: ns(20),
              cpuProfile,
              asyncIntervals: [{ type: "Timeout", startNs: ns(8), endNs: ns(16) }],
            },
          ],
        },
      ],
      "/project",
    );

    const test = profile.tests[0];
    expect(test.cpuMs).toBe(4);
    expect(test.loaderMs).toBe(6);
    expect(test.asyncMs).toBe(6);
    expect(test.unknownMs).toBe(4);
    expect(test.cpuMs + test.loaderMs + test.asyncMs + test.unknownMs).toBe(20);
    expect(test.asyncWaits[0].type).toBe("timers");
    expect(test.asyncWaits[0].durationMs).toBe(6);
    expect(test.modules.find((module) => module.url === testUrl)?.loadMs).toBe(13);
    expect(profile.asyncWaits[0].type).toBe("timers");
    expect(profile.asyncWaits[0].durationMs).toBe(6);
  });
});
