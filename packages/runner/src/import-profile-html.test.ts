import { describe, it, expect } from "roadtest";
import { pathToFileURL } from "node:url";
import { renderImportProfileHtml } from "./import-profile-html.js";
import { buildImportProfile, type ImportProfileEvent } from "./import-profile.js";

function payloadOf(html: string): Record<string, any> {
  const match = html.match(
    /<script id="profile-data" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!match) throw new Error("report did not embed a profile payload");
  return JSON.parse(match[1]);
}

describe("renderImportProfileHtml", () => {
  it("ships a shell, one payload, and one bundle with no external references", () => {
    const testFiles = Array.from(
      { length: 12 },
      (_, index) => `/project/src/group-${index}/case-${index}.test.ts`,
    );
    const firstTestUrl = pathToFileURL(testFiles[0]).href;
    const dependencyUrl = pathToFileURL("/project/src/dependency.ts").href;
    const events: ImportProfileEvent[] = [
      {
        kind: "resolve",
        phaseId: testFiles[0],
        parentURL: firstTestUrl,
        url: dependencyUrl,
        durationMs: 2,
        startNs: 0n,
        endNs: 2_000_000n,
      },
    ];
    const profile = buildImportProfile(
      events,
      testFiles.map((testFile, index) => ({ testFile, durationMs: 100 - index })),
      "/project",
    );

    const html = renderImportProfileHtml(profile, {
      cwd: "/project",
      generatedAt: new Date("2026-08-27T12:00:00.000Z"),
      command: "roadtest src --profile-imports=report.html",
    });

    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html.includes('<div id="report">')).toBe(true);
    expect(html.includes("data-roadtest-react-app")).toBe(true);
    expect(html.includes("<script src=")).toBe(false);
    expect(html.includes("<link rel=")).toBe(false);

    const payload = payloadOf(html);
    expect(payload.tests.length).toBe(12);
    expect(payload.tests[0].file).toBe("src/group-0/case-0.test.ts");
    expect(payload.names.includes("dependency.ts")).toBe(true);
    expect(payload.command).toBe("roadtest src --profile-imports=report.html");
  });

  it("describes every module once no matter how many tests reach it", () => {
    const shared = pathToFileURL("/project/src/shared.ts").href;
    const testFiles = Array.from(
      { length: 30 },
      (_, index) => `/project/src/case-${index}.test.ts`,
    );
    const events: ImportProfileEvent[] = testFiles.map((testFile) => ({
      kind: "resolve",
      phaseId: testFile,
      parentURL: pathToFileURL(testFile).href,
      url: shared,
      durationMs: 1,
      startNs: 0n,
      endNs: 1_000_000n,
    }));
    const profile = buildImportProfile(
      events,
      testFiles.map((testFile) => ({ testFile, durationMs: 50 })),
      "/project",
    );

    const payload = payloadOf(renderImportProfileHtml(profile, { cwd: "/project" }));

    // The shared module is described once globally; tests refer to it by index.
    const sharedId = payload.names.indexOf("shared.ts");
    expect(payload.names.filter((name: string) => name === "shared.ts").length).toBe(1);
    expect(payload.dirs[payload.dirOf[sharedId]]).toBe("src/");
    expect(payload.reach[sharedId]).toBe(30);
    for (const test of payload.tests) {
      expect(test.modules.includes(sharedId)).toBe(true);
    }
  });

  it("escapes markup in the embedded payload", () => {
    const dangerous = '/project/src/</script><img src=x onerror="alert(1)">.test.ts';
    const profile = buildImportProfile([], [{ testFile: dangerous, durationMs: 5 }], "/project");

    const html = renderImportProfileHtml(profile, {
      cwd: "/project",
      command: 'roadtest <script>alert("no")</script>',
    });

    expect(html.includes("<img src=x")).toBe(false);
    expect(html.includes("<script>alert")).toBe(false);
    expect(html.includes("\\u003c/script\\u003e")).toBe(true);
    expect(payloadOf(html).command).toBe('roadtest <script>alert("no")</script>');
  });
});
