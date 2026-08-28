import { describe, it, expect } from "roadtest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveTestFiles } from "./test-selection.js";

describe("resolveTestFiles", () => {
  it("recursively expands directories and de-duplicates explicit files", async () => {
    const root = mkdtempSync(join(tmpdir(), "roadtest-selection-"));
    const nested = join(root, "src", "nested");
    const testFile = join(nested, "one.test.ts");

    try {
      mkdirSync(nested, { recursive: true });
      writeFileSync(testFile, "export {}\n");
      writeFileSync(join(nested, "not-a-test.ts"), "export {}\n");
      writeFileSync(join(nested, "ignored.test.js"), "export {}\n");

      const files = await resolveTestFiles(root, [join(root, "src"), testFile]);
      expect(files).toEqual([testFile]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
