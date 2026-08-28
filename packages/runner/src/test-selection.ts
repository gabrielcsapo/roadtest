import { existsSync, statSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { glob } from "glob";

const DEFAULT_PATTERN = "src/**/*.test.{ts,tsx}";
const DIRECTORY_PATTERN = "**/*.test.{ts,tsx}";

function hasGlobMagic(value: string): boolean {
  return /[*?{}[\]]/.test(value);
}

/** Resolve files, directories, and glob patterns into a stable, de-duplicated test list. */
export async function resolveTestFiles(cwd: string, positional: string[]): Promise<string[]> {
  const inputs = positional.length > 0 ? positional : [DEFAULT_PATTERN];
  const files: string[] = [];

  for (const input of inputs) {
    if (hasGlobMagic(input)) {
      const matches = await glob(input, { cwd, nodir: true });
      files.push(...matches.map((file) => resolve(cwd, file)));
      continue;
    }

    const absolute = isAbsolute(input) ? input : resolve(cwd, input);
    if (!existsSync(absolute)) continue;

    if (statSync(absolute).isDirectory()) {
      const matches = await glob(DIRECTORY_PATTERN, { cwd: absolute, nodir: true });
      files.push(...matches.map((file) => resolve(absolute, file)));
    } else {
      files.push(absolute);
    }
  }

  return [...new Set(files)];
}
