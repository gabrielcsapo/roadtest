import { createServer, build } from "vite";
import type { Plugin } from "vite";
import { fieldtest, fieldtestCoverage } from "fieldtest/plugin";
import { readFile, readdir, stat, writeFile, unlink } from "node:fs/promises";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import type { IncomingMessage } from "node:http";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const IGNORE_PATTERNS = [".test.", ".spec.", "/node_modules/", "/__", ".d.ts"];
const IGNORE_PATTERNS_NO_TESTS = ["/node_modules/", "/__", ".d.ts"];

async function collectSourceFiles(dir: string, includeTests = false): Promise<string[]> {
  const ignore = includeTests ? IGNORE_PATTERNS_NO_TESTS : IGNORE_PATTERNS;
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
      results.push(...(await collectSourceFiles(fullPath, includeTests)));
    } else if (entry.isFile()) {
      const ext = entry.name.slice(entry.name.lastIndexOf("."));
      if (!SOURCE_EXTENSIONS.has(ext)) continue;
      if (ignore.some((p) => fullPath.includes(p))) continue;
      results.push(fullPath);
    }
  }
  return results;
}

async function buildGraphData(
  root: string,
  includeTests = false,
): Promise<{
  nodes: { id: string; shortPath: string }[];
  edges: { from: string; to: string }[];
}> {
  const srcDir = resolve(root, "src");
  await stat(srcDir);
  const allFiles = await collectSourceFiles(srcDir, includeTests);
  const fileSet = new Set(allFiles);

  const nodes = allFiles.map((f) => ({
    id: f,
    shortPath: f.replace(root + "/", ""),
  }));
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

interface SnapshotWriteEntry {
  sourceFile: string;
  suiteName: string;
  testName: string;
  label: string;
  html: string;
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

/** Serves raw source files and project file listings — configureServer runs before Vite's HTML fallback */
function fieldtestDevPlugin(options: { updateSnapshots?: boolean } = {}): Plugin {
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
      // Raw source endpoint — returns file content without Istanbul instrumentation.
      // Accepts either:
      //   ?path=/absolute/path/to/file.ts   (existing — used by CoverageExplorer / CodeTab)
      //   ?url=/src/App.tsx                 (new — Vite-relative path, resolved via server root)
      server.middlewares.use("/__fieldtest_source__", async (req, res) => {
        try {
          const reqUrl = new URL(req.url ?? "/", "http://localhost");
          const filePath = reqUrl.searchParams.get("path");
          const viteUrl = reqUrl.searchParams.get("url");

          let resolvedPath: string;
          if (filePath && filePath.startsWith("/")) {
            resolvedPath = filePath;
          } else if (viteUrl && viteUrl.startsWith("/")) {
            resolvedPath = join(root, viteUrl);
          } else {
            res.writeHead(400);
            res.end("Bad Request");
            return;
          }

          const content = await readFile(resolvedPath, "utf8");
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end(content);
        } catch {
          res.writeHead(404);
          res.end("Not Found");
        }
      });

      // Dependency graph endpoint — returns dep tree rooted at a specific test file
      server.middlewares.use("/__fieldtest_deps__", async (req, res) => {
        try {
          const url = new URL(req.url ?? "/", "http://localhost");
          const file = url.searchParams.get("file");
          if (!file) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Missing file param" }));
            return;
          }
          // file may be a Vite URL (/src/App.test.tsx) or absolute path
          const absRoot = resolve(root, file.startsWith("/") ? file.slice(1) : file);
          const srcDir = resolve(root, "src");
          const allFiles = await collectSourceFiles(srcDir);
          const fileSet = new Set(allFiles);

          // Build imports map: file → [files it imports]
          const importRe =
            /(?:^|\n)\s*(?:import|export)(?:\s+type)?\s+(?:[^'"]*?\s+from\s+)?['"](\.\.?\/[^'"]+)['"]/g;

          async function parseImports(f: string): Promise<string[]> {
            const deps: string[] = [];
            try {
              const content = await readFile(f, "utf8");
              const fileDir = dirname(f);
              importRe.lastIndex = 0;
              let m: RegExpExecArray | null;
              while ((m = importRe.exec(content)) !== null) {
                const base = resolve(fileDir, m[1]);
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
                if (resolved) deps.push(resolved);
              }
            } catch {
              /* skip unreadable */
            }
            return deps;
          }

          const importsOf = new Map<string, string[]>();
          // collectSourceFiles skips test/spec files — parse all source files including
          // the test file itself (added to fileSet so its deps can be resolved)
          fileSet.add(absRoot);
          const filesToParse = [...allFiles, absRoot];
          for (const f of filesToParse) {
            importsOf.set(f, await parseImports(f));
          }

          // BFS from the test file to collect its transitive dependency tree
          const graph: Record<string, string[]> = {};
          const queue: string[] = [absRoot];
          const visited = new Set<string>([absRoot]);
          while (queue.length > 0) {
            const current = queue.shift()!;
            const deps = importsOf.get(current) ?? [];
            graph[current] = deps;
            for (const dep of deps) {
              if (!visited.has(dep)) {
                visited.add(dep);
                queue.push(dep);
              }
            }
          }

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ root: absRoot, graph }));
        } catch {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ root: "", graph: {} }));
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

      // Returns all stored snapshot baselines as a JSON map (absolute path → HTML)
      server.middlewares.use("/__fieldtest_snapshots__", async (_req, res) => {
        try {
          const { glob } = await import("glob");
          const snapshotFiles = await glob("src/__snapshots__/**/*.html", {
            cwd: root,
            absolute: true,
          });
          const map: Record<string, string> = {};
          for (const f of snapshotFiles) {
            try {
              // Key as "/<root-relative-path>" so it matches the Vite module paths
              // the browser sees in suite.sourceFile (e.g. "/src/Card.test.tsx" → "/src/__snapshots__/...")
              map["/" + relative(root, f)] = await readFile(f, "utf8");
            } catch {
              /* skip */
            }
          }
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(map));
        } catch {
          res.setHeader("Content-Type", "application/json");
          res.end("{}");
        }
      });

      // Tells the sandbox whether --update-snapshots was passed at startup
      server.middlewares.use("/__fieldtest_update_snapshots__", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ enabled: options.updateSnapshots ?? false }));
      });

      // Accepts POST of snapshot HTML from the sandbox or the UI button
      server.middlewares.use("/__fieldtest_snapshot_write__", async (req, res) => {
        if (req.method !== "POST") {
          res.writeHead(405);
          res.end();
          return;
        }
        try {
          const body = await readBody(req);
          const entries = JSON.parse(body) as SnapshotWriteEntry[];
          const root = server.config.root;
          const sanitize = (n: string) =>
            n
              .replace(/[^a-zA-Z0-9._-]/g, "_")
              .replace(/_+/g, "_")
              .slice(0, 80);
          for (const e of entries) {
            // sourceFile from the browser is Vite-relative (e.g. "/src/App.test.tsx").
            // Resolve it to an absolute path so snapshot files land in the right place.
            const absSourceFile = e.sourceFile.startsWith("/")
              ? join(root, e.sourceFile)
              : e.sourceFile;
            const dir = join(dirname(absSourceFile), "__snapshots__", sanitize(e.suiteName));
            const filePath = join(dir, `${sanitize(e.testName)}__${sanitize(e.label)}.html`);
            mkdirSync(dir, { recursive: true });
            writeFileSync(filePath, e.html, "utf8");
            console.log("[fieldtest] snapshot written:", filePath);
          }
          res.writeHead(200);
          res.end("ok");
        } catch (err) {
          console.error("[fieldtest] /__fieldtest_snapshot_write__ error:", err);
          res.writeHead(500);
          res.end(String(err));
        }
      });
    },
  };
}

export async function startUi() {
  const args = process.argv.slice(2);
  const include =
    args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--")) ??
    "src/**/*.test.{ts,tsx}";
  const updateSnapshots = args.includes("--update-snapshots");

  const server = await createServer({
    plugins: [fieldtestDevPlugin({ updateSnapshots }), fieldtest({ include }), fieldtestCoverage()],
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

  // Detect whether the consuming project depends on "fieldtest" or "fieldtest"
  // so the generated entry imports from the same package name the project uses.
  let runtimePkg = "fieldtest";
  try {
    const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    if ("fieldtest" in all) runtimePkg = "fieldtest";
  } catch {
    /* ignore — fall back to fieldtest */
  }

  // Write a real entry file so Rollup can discover it through the HTML pipeline.
  // (Virtual modules work in dev but the /@id/ URL is not followed during builds.)
  const tempEntry = join(root, "__fieldtest_entry__.ts");
  const entryLines = [
    `import { startApp } from '${runtimePkg}'`,
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
      plugins: [fieldtest({ include, injectHtml: false }), fieldtestCoverage()],
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
  // includeTests=true so the DepsTab can trace dep trees rooted at test files.
  const absOutDir = resolve(root, outDir);
  const graphData = await buildGraphData(root, true).catch(() => ({
    nodes: [],
    edges: [],
  }));
  await writeFile(join(absOutDir, "fieldtest-graph.json"), JSON.stringify(graphData));

  // Write source file contents so CoverageExplorer can display source in static deployments.
  // Without this, /__fieldtest_source__ requests 404 when served from a CDN/static host.
  const srcDir = resolve(root, "src");
  const allSourceFiles = await collectSourceFiles(srcDir).catch(() => [] as string[]);
  const sourcesMap: Record<string, string> = {};
  for (const f of allSourceFiles) {
    try {
      sourcesMap[f] = await readFile(f, "utf8");
    } catch {
      /* skip unreadable */
    }
  }
  await writeFile(join(absOutDir, "fieldtest-sources.json"), JSON.stringify(sourcesMap));

  // Bundle snapshot baselines so the static site can load them without a dev server.
  // Keys are paths relative to the project root (e.g. "src/__snapshots__/Card/test__initial.html").
  const { glob } = await import("glob");
  const snapshotFiles = await glob("src/__snapshots__/**/*.html", {
    cwd: root,
    absolute: true,
  });
  const snapshotsMap: Record<string, string> = {};
  for (const f of snapshotFiles) {
    const key = relative(root, f);
    try {
      snapshotsMap[key] = await readFile(f, "utf8");
    } catch {
      /* skip unreadable */
    }
  }
  await writeFile(join(absOutDir, "fieldtest-snapshots.json"), JSON.stringify(snapshotsMap));
}
