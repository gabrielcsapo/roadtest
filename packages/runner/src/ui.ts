import { createServer, build } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { fieldtest } from "@fieldtest/core/plugin";
import istanbul from "vite-plugin-istanbul";
import { readFile, readdir, stat, writeFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const IGNORE_PATTERNS = [".test.", ".spec.", "/node_modules/", "/__", ".d.ts"];

async function collectSourceFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  let entries: Awaited<ReturnType<typeof readdir>>;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      results.push(...(await collectSourceFiles(fullPath)));
    } else if (entry.isFile()) {
      const ext = entry.name.slice(entry.name.lastIndexOf("."));
      if (!SOURCE_EXTENSIONS.has(ext)) continue;
      if (IGNORE_PATTERNS.some((p) => fullPath.includes(p))) continue;
      results.push(fullPath);
    }
  }
  return results;
}

async function buildGraphData(
  root: string,
): Promise<{ nodes: { id: string; shortPath: string }[]; edges: { from: string; to: string }[] }> {
  const srcDir = resolve(root, "src");
  await stat(srcDir);
  const allFiles = await collectSourceFiles(srcDir);
  const fileSet = new Set(allFiles);

  const nodes = allFiles.map((f) => ({ id: f, shortPath: f.replace(root + "/", "") }));
  const edges: { from: string; to: string }[] = [];

  const importRe =
    /(?:^|\n)\s*(?:import|export)(?:\s+type)?\s+(?:[^'"]*?\s+from\s+)?['"](\.\.?\/[^'"]+)['"]/g;
  for (const file of allFiles) {
    try {
      const content = await readFile(file, "utf8");
      const fileDir = dirname(file);
      let m: RegExpExecArray | null;
      importRe.lastIndex = 0;
      while ((m = importRe.exec(content)) !== null) {
        const spec = m[1];
        const base = resolve(fileDir, spec);
        let resolved: string | null = null;
        for (const ext of ["", ".ts", ".tsx", ".js", ".jsx"]) {
          if (fileSet.has(base + ext)) {
            resolved = base + ext;
            break;
          }
        }
        if (!resolved) {
          for (const idx of ["/index.ts", "/index.tsx", "/index.js", "/index.jsx"]) {
            if (fileSet.has(base + idx)) {
              resolved = base + idx;
              break;
            }
          }
        }
        if (resolved) edges.push({ from: resolved, to: file });
      }
    } catch {
      /* skip unreadable */
    }
  }

  return { nodes, edges };
}

/** Serves raw source files and project file listings — configureServer runs before Vite's HTML fallback */
function fieldtestDevPlugin(): Plugin {
  let root = process.cwd();
  return {
    name: "fieldtest-dev",
    configResolved(config) {
      root = config.root;
    },
    // Strip app entry scripts so only the fieldtest entry runs in --ui mode.
    // Without this, index.html's <script src="/src/main.tsx"> would pull the full
    // app (and MSW worker) into the same Vite pipeline as the test runner, causing
    // the Istanbul + React Fast Refresh double-transform conflict.
    transformIndexHtml(html) {
      return html.replace(
        /<script\s[^>]*\bsrc=["'][^"']*\/src\/[^"']+["'][^>]*><\/script>\s*/gi,
        "",
      );
    },
    configureServer(server) {
      // Raw source endpoint — returns file content without Istanbul instrumentation
      server.middlewares.use("/__fieldtest_source__", async (req, res) => {
        try {
          const url = new URL(req.url ?? "/", "http://localhost");
          const filePath = url.searchParams.get("path");
          if (!filePath || !filePath.startsWith("/")) {
            res.writeHead(400);
            res.end("Bad Request");
            return;
          }
          const content = await readFile(filePath, "utf8");
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end(content);
        } catch {
          res.writeHead(404);
          res.end("Not Found");
        }
      });

      // Module graph endpoint — returns source files + static import relationships
      server.middlewares.use("/__fieldtest_graph__", async (_req, res) => {
        try {
          const data = await buildGraphData(root);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        } catch {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ nodes: [], edges: [] }));
        }
      });

      // File listing endpoint — returns all source files under src/
      server.middlewares.use("/__fieldtest_files__", async (_req, res) => {
        try {
          const srcDir = resolve(root, "src");
          await stat(srcDir); // throws if doesn't exist
          const files = await collectSourceFiles(srcDir);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(files));
        } catch {
          res.setHeader("Content-Type", "application/json");
          res.end("[]");
        }
      });
    },
  };
}

export async function startUi() {
  const include =
    process.argv.find(
      (a, i) => i > 1 && !a.startsWith("--") && !process.argv[i - 1]?.includes("--"),
    ) ?? "src/**/*.test.{ts,tsx}";

  const server = await createServer({
    plugins: [
      fieldtestDevPlugin(),
      fieldtest({ include }),
      istanbul({
        include: "src/**/*",
        exclude: ["node_modules", "**/*.test.*", "**/*.spec.*"],
        extension: [".ts", ".tsx", ".js", ".jsx"],
        forceBuildInstrument: false,
        requireEnv: false,
      }),
    ],
    server: { port: 3333, open: true },
  });

  await server.listen();
  server.printUrls();

  process.stdin.resume();
  process.on("SIGINT", () => server.close().then(() => process.exit(0)));
}

/** Parse a --flag=value or --flag value pair from process.argv */
function getArgValue(flag: string): string | undefined {
  const prefix = `${flag}=`;
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i].startsWith(prefix)) return process.argv[i].slice(prefix.length);
    if (process.argv[i] === flag && i + 1 < process.argv.length) return process.argv[i + 1];
  }
  return undefined;
}

const PREVIEW_CANDIDATES = [
  ".fieldtest/preview.tsx",
  ".fieldtest/preview.ts",
  ".fieldtest/preview.jsx",
  ".fieldtest/preview.js",
];
const SETUP_CANDIDATES = [
  ".fieldtest/setup.ts",
  ".fieldtest/setup.tsx",
  ".fieldtest/setup.js",
  ".fieldtest/setup.jsx",
];

export async function buildUi() {
  // Collect positional args — skip flag names and their values (--flag value pairs)
  const positional: string[] = [];
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i].startsWith("--")) {
      // Skip the next arg if this flag takes a value (no '=' in this arg)
      if (
        !process.argv[i].includes("=") &&
        i + 1 < process.argv.length &&
        !process.argv[i + 1].startsWith("--")
      )
        i++;
    } else {
      positional.push(process.argv[i]);
    }
  }
  const include = positional[0] ?? "src/**/*.test.{ts,tsx}";

  const outDir = getArgValue("--outDir") ?? "dist";
  const base = getArgValue("--base") ?? "/";
  const root = process.cwd();

  const previewFile = PREVIEW_CANDIDATES.find((f) => existsSync(join(root, f)));
  const setupFile = SETUP_CANDIDATES.find((f) => existsSync(join(root, f)));
  // Use relative pattern (./) so import.meta.glob resolves from the entry file's
  // location rather than absolute-from-root — Rolldown/Vite 8 is more reliable
  // with relative patterns when the entry file sits inside the project root.
  const relPattern = "./" + (include.startsWith("/") ? include.slice(1) : include);

  // Write a real entry file so Rollup can discover it through the HTML pipeline.
  // (Virtual modules work in dev but the /@id/ URL is not followed during builds.)
  const tempEntry = join(root, "__fieldtest_entry__.ts");
  const entryLines = [
    `import { startApp } from '@fieldtest/core'`,
    setupFile ? `import '/${setupFile}'` : null,
    previewFile ? `import _wrapper from '/${previewFile}'` : null,
    `const tests = import.meta.glob(${JSON.stringify(relPattern)})`,
    `await startApp(tests${previewFile ? ", { wrapper: _wrapper }" : ""})`,
  ].filter(Boolean) as string[];
  await writeFile(tempEntry, entryLines.join("\n"));

  // Patch index.html to include the entry script before building, then restore.
  // (transformIndexHtml injections are not picked up as Rollup entry points in Vite v8.)
  const indexPath = join(root, "index.html");
  const originalHtml = await readFile(indexPath, "utf8");
  const patchedHtml = originalHtml
    // Strip app entry scripts (same as the dev-mode transformIndexHtml plugin) so
    // bootstrap() / main.tsx doesn't mount the full app inside fieldtest frames.
    .replace(/<script\s[^>]*\bsrc=["'][^"']*\/src\/[^"']+["'][^>]*><\/script>\s*/gi, "")
    .replace(
      "</body>",
      `  <script type="module" src="/__fieldtest_entry__.ts"></script>\n  </body>`,
    );
  await writeFile(indexPath, patchedHtml);

  try {
    await build({
      root,
      plugins: [
        react(),
        fieldtest({ include, injectHtml: false }),
        istanbul({
          include: "src/**/*",
          exclude: ["node_modules", "**/*.test.*", "**/*.spec.*"],
          extension: [".ts", ".tsx", ".js", ".jsx"],
          forceBuildInstrument: true,
          requireEnv: false,
        }),
      ],
      base,
      // Define NODE_ENV as 'test' so React includes act() and testing utilities.
      // The fieldtest UI is a test runner — it needs React's test-mode APIs.
      define: { "process.env.NODE_ENV": '"test"' },
      build: { outDir, emptyOutDir: true },
    });
  } finally {
    await writeFile(indexPath, originalHtml);
    await unlink(tempEntry).catch(() => {});
  }

  // Write graph data as a static JSON file so the UI can load it without a dev server.
  // GraphView fetches this from ./fieldtest-graph.json relative to the page.
  const absOutDir = resolve(root, outDir);
  const graphData = await buildGraphData(root).catch(() => ({ nodes: [], edges: [] }));
  await writeFile(join(absOutDir, "fieldtest-graph.json"), JSON.stringify(graphData));
}
