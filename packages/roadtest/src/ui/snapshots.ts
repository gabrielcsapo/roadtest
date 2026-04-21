import type { TestSuite } from "../framework/types";
import { store } from "../framework/store";
import { snapshotsAreEquivalent } from "./css-normalize";

interface SnapshotWriteEntry {
  sourceFile: string;
  suiteName: string;
  testName: string;
  label: string;
  html: string;
}

export function collectSnapshotEntries(suites: TestSuite[]): SnapshotWriteEntry[] {
  return suites
    .flatMap((suite) =>
      suite.tests.flatMap((test) =>
        (test.assertions ?? [])
          .filter((a) => a.snapshot?.html)
          .map((a) => ({
            sourceFile: suite.sourceFile ?? "",
            suiteName: suite.name,
            testName: test.name,
            label: a.snapshot!.label,
            html: a.snapshot!.html,
          })),
      ),
    )
    .filter((e) => e.sourceFile !== "" && e.html !== "");
}

export async function writeSnapshotsToServer(suites: TestSuite[]): Promise<void> {
  const entries = collectSnapshotEntries(suites);
  if (entries.length === 0) return;
  await fetch("/__roadtest_snapshot_write__", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-MSW-Intention": "bypass" },
    body: JSON.stringify(entries),
  });
}

// Replicates the server-side sanitize() + snapshotPath() so the browser can
// reconstruct the exact file path used when baselines were written.
function sanitize(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
}

function snapshotFilePath(
  sourceFile: string,
  suiteName: string,
  testName: string,
  label: string,
): string {
  const dir = sourceFile.replace(/\/[^/]+$/, ""); // dirname
  return `${dir}/__snapshots__/${sanitize(suiteName)}/${sanitize(testName)}__${sanitize(label)}.html`;
}

/**
 * Fetch stored snapshot baselines from the dev server, compare against the
 * current run's captured HTML, and mark mismatching tests as failed in the store.
 * No-ops when the fetch fails (static build or no baselines written yet).
 */
export async function compareSnapshotsWithServer(suites: TestSuite[]): Promise<void> {
  let baselines: Record<string, string>;
  try {
    const res = await fetch("/__roadtest_snapshots__", {
      headers: { "X-MSW-Intention": "bypass" },
    });
    if (!res.ok) {
      console.log(
        "[roadtest] snapshot comparison skipped: /__roadtest_snapshots__ returned",
        res.status,
      );
      return;
    }
    baselines = (await res.json()) as Record<string, string>;
    console.log("[roadtest] snapshot baselines loaded:", Object.keys(baselines).length, "files");
  } catch (e) {
    console.log("[roadtest] snapshot comparison skipped: fetch failed", e);
    return;
  }

  let totalPass = 0;
  let totalFail = 0;

  for (const suite of suites) {
    if (!suite.sourceFile) continue;
    let suiteHasMismatch = false;
    for (const test of suite.tests) {
      if (test.status === "skipped") continue;
      // Compare snapshot assertions (created by snapshot() / toMatchSnapshot()).
      const snapshotAssertions = test.assertions.filter((a) => a.snapshot);
      if (!snapshotAssertions.length) continue;
      const mismatchLabels: string[] = [];
      const updatedAssertions = test.assertions.map((assertion) => {
        if (!assertion.snapshot) return assertion;
        const path = snapshotFilePath(
          suite.sourceFile!,
          suite.name,
          test.name,
          assertion.snapshot.label,
        );
        const stored = baselines[path];
        if (stored === undefined || stored === "") return assertion; // no baseline yet
        if (!snapshotsAreEquivalent(stored, assertion.snapshot.html)) {
          mismatchLabels.push(assertion.snapshot.label);
          totalFail++;
          return {
            ...assertion,
            status: "fail" as const,
            error: "Snapshot mismatch",
            snapshot: { ...assertion.snapshot, baselineHtml: stored },
          };
        }
        totalPass++;
        return assertion;
      });
      if (mismatchLabels.length > 0) {
        store.updateTest(suite.id, test.id, {
          status: "fail",
          error: `Snapshot mismatch in: ${mismatchLabels.join(", ")}. Run with --update-snapshots to update.`,
          assertions: updatedAssertions,
        });
        suiteHasMismatch = true;
      }
    }
    if (suiteHasMismatch) {
      store.updateSuite(suite.id, { status: "fail" });
    }
  }

  console.log(`[roadtest] snapshot comparison complete: ${totalPass} passed, ${totalFail} failed`);
}

/**
 * Check whether the RoadTest dev server is running and whether
 * --update-snapshots was passed. Returns { devServer: boolean, autoWrite: boolean }.
 * In a static build, the fetch will fail → both will be false.
 */
export async function checkDevServer(): Promise<{ devServer: boolean; autoWrite: boolean }> {
  try {
    const res = await fetch("/__roadtest_update_snapshots__", {
      headers: { "X-MSW-Intention": "bypass" },
    });
    if (!res.ok) return { devServer: false, autoWrite: false };
    const { enabled } = (await res.json()) as { enabled: boolean };
    return { devServer: true, autoWrite: enabled };
  } catch {
    return { devServer: false, autoWrite: false };
  }
}
