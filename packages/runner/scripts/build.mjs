import { build } from "esbuild";
import { readdirSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourceRoot = join(root, "src");

function collectRuntimeSources(directory) {
  const sources = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      sources.push(...collectRuntimeSources(path));
      continue;
    }
    if (!entry.name.includes(".test.") && [".js", ".ts"].includes(extname(entry.name))) {
      sources.push(path);
    }
  }
  return sources;
}

await build({
  entryPoints: collectRuntimeSources(sourceRoot),
  outdir: join(root, "dist"),
  outbase: sourceRoot,
  platform: "node",
  format: "esm",
  bundle: false,
  sourcemap: true,
  target: "node22",
  logLevel: "info",
});

process.stdout.write(
  `Built ${collectRuntimeSources(sourceRoot).length} runner modules from ${relative(process.cwd(), sourceRoot)}\n`,
);
