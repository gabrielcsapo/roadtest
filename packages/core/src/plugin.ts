import { existsSync, readFileSync } from "node:fs";
import { join, dirname, resolve as resolvePath, relative } from "node:path";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";
import { parseAstAsync, transformWithOxc } from "vite";

interface FieldtestOptions {
  /**
   * Glob pattern for test files, relative to Vite's root.
   * @default 'src/**\/*.test.{ts,tsx}'
   */
  include?: string;
  /**
   * Inject the fieldtest entry script into index.html via transformIndexHtml.
   * Set to false when providing a real entry file for production builds.
   * @default true
   */
  injectHtml?: boolean;
}

const VIRTUAL_ID = "virtual:fieldtest-entry";
const RESOLVED_ID = "\0" + VIRTUAL_ID;

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

// ─── Node built-in detection ──────────────────────────────────────────────────

const TEST_FILE_RE = /\.(test|spec)\.[jt]sx?$/;

/** Comment override: any line matching this in the test file forces node routing */
const NODE_ENV_OVERRIDE_RE = /^\s*\/\/\s*@fieldtest-env\s+node\s*$/m;

const NODE_BUILTINS = new Set([
  "assert",
  "buffer",
  "child_process",
  "cluster",
  "console",
  "crypto",
  "dgram",
  "diagnostics_channel",
  "dns",
  "domain",
  "events",
  "fs",
  "http",
  "http2",
  "https",
  "inspector",
  "module",
  "net",
  "os",
  "path",
  "perf_hooks",
  "process",
  "querystring",
  "readline",
  "repl",
  "stream",
  "string_decoder",
  "timers",
  "tls",
  "trace_events",
  "tty",
  "url",
  "util",
  "v8",
  "vm",
  "wasi",
  "worker_threads",
  "zlib",
]);

function isNodeBuiltin(specifier: string): boolean {
  return specifier.startsWith("node:") || NODE_BUILTINS.has(specifier);
}

/** Extract static import specifiers from source via OXC + AST parse. */
async function extractStaticImports(code: string, id: string): Promise<string[]> {
  let jsCode: string;
  try {
    const lang = id.endsWith(".tsx")
      ? "tsx"
      : id.endsWith(".jsx")
        ? "jsx"
        : id.endsWith(".js")
          ? "js"
          : "ts";
    jsCode = (await transformWithOxc(code, id, { lang })).code;
  } catch {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ast: any;
  try {
    ast = await parseAstAsync(jsCode);
  } catch {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ast.body
    .filter((n: any) => n.type === "ImportDeclaration")
    .map((n: any) => n.source.value as string);
}

const RELATIVE_RE = /^\.\.?\//;

/**
 * Walk the import DAG of a test file and return true if any reachable module
 * is a Node built-in. node_modules are skipped — use `// @fieldtest-env node`
 * in the test file to force Node routing when the dep is in node_modules.
 */
async function hasNodeBuiltinDep(
  code: string,
  id: string,
  visited = new Set<string>(),
): Promise<boolean> {
  if (visited.has(id)) return false;
  visited.add(id);

  const specifiers = await extractStaticImports(code, id);

  for (const specifier of specifiers) {
    if (isNodeBuiltin(specifier)) return true;

    // Only follow relative imports — skip node_modules
    if (!RELATIVE_RE.test(specifier)) continue;

    // Resolve the specifier relative to the importing file
    const base = dirname(id);
    const candidates = [
      resolvePath(base, specifier),
      resolvePath(base, specifier + ".ts"),
      resolvePath(base, specifier + ".tsx"),
      resolvePath(base, specifier + ".js"),
      resolvePath(base, specifier + ".jsx"),
    ];
    const resolvedPath = candidates.find(existsSync);
    if (!resolvedPath) continue;

    let src: string;
    try {
      src = readFileSync(resolvedPath, "utf-8");
    } catch {
      continue;
    }

    if (await hasNodeBuiltinDep(src, resolvedPath, visited)) return true;
  }

  return false;
}

// ─── Node test runner (server-side) ──────────────────────────────────────────

/**
 * ID for the virtual module that replaces `@viewtest/core` when a test file is
 * loaded via ssrLoadModule. Provides a DOM-free describe/it/expect that routes
 * calls through globalThis.__vtNodeCtx, which is set fresh for every test run.
 */
const SSR_CORE_ID = "\0viewtest-ssr-core";

/**
 * The code served as `@viewtest/core` in SSR (Node) context.
 * All DSL calls proxy through globalThis.__vtNodeCtx so each run gets
 * an isolated context without needing to invalidate the module cache.
 */
const SSR_CORE_CODE = `
export function describe(name, fn) { globalThis.__vtNodeCtx?.describe(name, fn) }
export function it(name, fn) { globalThis.__vtNodeCtx?.it(name, fn) }
export const test = it
it.skip = () => {}
test.skip = () => {}
export function expect(val) { return globalThis.__vtNodeCtx?.expect(val) }
export function mock(id, factory) { globalThis.__vtNodeCtx?.mock(id, factory) }
export function unmock() {}
export function clearAllMocks() {}
export const render = () => { throw new Error('[viewtest] render() is not available in node tests') }
export const snapshot = async () => {}
export const fireEvent = new Proxy({}, { get: () => async () => {} })
export const act = async (fn) => fn()
export const store = null
export const currentTest = null
export const runAll = async () => {}
export const runSuite = async () => {}
export const runTest = async () => {}
export const setCoverageProvider = () => {}
export const registerAfterTestHook = () => {}
export const registerTab = () => {}
export const startApp = async () => {}
export const reloadFile = async () => {}
export const __vtImport = async (_id, fn) => fn()
export const __vtSetMockScope = () => {}
export const setCurrentSourceFile = () => {}
export const __vtRegisterNodeTest = () => {}
`;

interface NodeAssertion {
  label: string;
  status: "pass" | "fail";
  error?: string;
}
interface NodeConsoleEntry {
  level: string;
  args: string[];
  timestamp: number;
}

interface NodeTestCase {
  id: string;
  name: string;
  suiteId: string;
  suiteName: string;
  status: "pending" | "running" | "pass" | "fail" | "skipped";
  error?: string;
  assertions: NodeAssertion[];
  consoleLogs: NodeConsoleEntry[];
  snapshots: never[];
  networkEntries: never[];
  mockEntries: never[];
  testCoverage: null;
  duration?: number;
  fn: () => void | Promise<void>;
}

interface NodeTestSuite {
  id: string;
  name: string;
  tests: NodeTestCase[];
  status: "pending" | "running" | "pass" | "fail";
  sourceFile: string;
  runtime: "node";
  duration?: number;
}

/**
 * Creates a self-contained test framework context for a single Node test run.
 * Exposed on globalThis.__vtNodeCtx before ssrLoadModule executes the test file,
 * so the SSR core virtual module can route describe/it/expect into this instance.
 */
function createNodeContext(sourceFile: string) {
  let _id = 0;
  const suites: NodeTestSuite[] = [];
  let currentSuite: NodeTestSuite | null = null;
  let currentTest: NodeTestCase | null = null;
  const mockRegistry = new Map<string, (() => Record<string, unknown>) | null>();

  function makeId() {
    return String(_id++);
  }

  function stringify(v: unknown): string {
    if (v === null) return "null";
    if (v === undefined) return "undefined";
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function createMatchers(received: unknown, negated = false): any {
    function assert(pass: boolean, failMsg: string, label: string) {
      const finalPass = negated ? !pass : pass;
      const error = finalPass ? undefined : negated ? `Expected NOT: ${failMsg}` : failMsg;
      if (currentTest) {
        currentTest.assertions.push({
          label: negated ? `expect(…).not.${label}` : `expect(…).${label}`,
          status: finalPass ? "pass" : "fail",
          error,
        });
      }
      if (!finalPass) {
        const e = new Error(error!);
        e.name = "AssertionError";
        throw e;
      }
    }
    return {
      get not() {
        return createMatchers(received, !negated);
      },
      toBe: (e: unknown) =>
        assert(
          Object.is(received, e),
          `Expected ${stringify(e)} but received ${stringify(received)}`,
          `toBe(${stringify(e)})`,
        ),
      toEqual: (e: unknown) =>
        assert(
          JSON.stringify(received) === JSON.stringify(e),
          `Expected ${stringify(e)} but received ${stringify(received)}`,
          `toEqual(${stringify(e)})`,
        ),
      toBeTruthy: () =>
        assert(
          Boolean(received),
          `Expected truthy but received ${stringify(received)}`,
          "toBeTruthy()",
        ),
      toBeFalsy: () =>
        assert(!received, `Expected falsy but received ${stringify(received)}`, "toBeFalsy()"),
      toBeNull: () =>
        assert(
          received === null,
          `Expected null but received ${stringify(received)}`,
          "toBeNull()",
        ),
      toBeUndefined: () =>
        assert(
          received === undefined,
          `Expected undefined but received ${stringify(received)}`,
          "toBeUndefined()",
        ),
      toBeDefined: () =>
        assert(received !== undefined, "Expected a defined value", "toBeDefined()"),
      toContain: (item: unknown) => {
        const ok = Array.isArray(received)
          ? received.includes(item)
          : typeof received === "string" && received.includes(String(item));
        assert(
          ok,
          `Expected ${stringify(received)} to contain ${stringify(item)}`,
          `toContain(${stringify(item)})`,
        );
      },
      toHaveLength: (n: number) => {
        const len = (received as { length?: number }).length;
        assert(len === n, `Expected length ${n} but got ${len}`, `toHaveLength(${n})`);
      },
      toThrow: (msg?: string) => {
        let threw = false;
        let thrownMsg = "";
        try {
          (received as () => void)();
        } catch (e) {
          threw = true;
          thrownMsg = String(e);
        }
        assert(threw, "Expected function to throw", "toThrow()");
        if (msg)
          assert(
            thrownMsg.includes(msg),
            `Expected to throw "${msg}" but got "${thrownMsg}"`,
            `toThrow(${stringify(msg)})`,
          );
      },
      toBeGreaterThan: (n: number) =>
        assert((received as number) > n, `Expected ${received} > ${n}`, `toBeGreaterThan(${n})`),
      toBeLessThan: (n: number) =>
        assert((received as number) < n, `Expected ${received} < ${n}`, `toBeLessThan(${n})`),
    };
  }

  function describe(name: string, fn: () => void) {
    const suite: NodeTestSuite = {
      id: makeId(),
      name,
      tests: [],
      status: "pending",
      sourceFile,
      runtime: "node",
    };
    const prev = currentSuite;
    currentSuite = suite;
    fn();
    currentSuite = prev;
    suites.push(suite);
  }

  function it(name: string, fn: () => void | Promise<void>) {
    const suite =
      currentSuite ??
      (() => {
        const s: NodeTestSuite = {
          id: makeId(),
          name: "(root)",
          tests: [],
          status: "pending",
          sourceFile,
          runtime: "node",
        };
        suites.push(s);
        currentSuite = s;
        return s;
      })();
    suite.tests.push({
      id: makeId(),
      name,
      suiteId: suite.id,
      suiteName: suite.name,
      status: "pending",
      assertions: [],
      consoleLogs: [],
      snapshots: [],
      networkEntries: [],
      mockEntries: [],
      testCoverage: null,
      fn,
    });
  }

  function mock(moduleId: string, factory?: () => Record<string, unknown>) {
    mockRegistry.set(moduleId, factory ?? null);
  }

  async function runAll(): Promise<NodeTestSuite[]> {
    const LEVELS = ["log", "warn", "error", "info", "debug"] as const;
    for (const suite of suites) {
      suite.status = "running";
      const t0 = Date.now();
      let allPass = true;
      for (const test of suite.tests) {
        if (test.status === "skipped") continue;
        currentTest = test;
        test.status = "running";
        const t1 = Date.now();
        const logs: NodeConsoleEntry[] = [];
        // Intercept console for this test
        const originals = {} as Record<string, (...a: unknown[]) => void>;
        for (const lvl of LEVELS) {
          originals[lvl] = console[lvl].bind(console);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (console as any)[lvl] = (...args: unknown[]) =>
            logs.push({
              level: lvl,
              args: args.map((a) =>
                typeof a === "string"
                  ? a
                  : (() => {
                      try {
                        return JSON.stringify(a);
                      } catch {
                        return String(a);
                      }
                    })(),
              ),
              timestamp: Date.now(),
            });
        }
        try {
          await test.fn();
          test.status = "pass";
        } catch (e) {
          test.status = "fail";
          test.error = e instanceof Error ? e.message : String(e);
          allPass = false;
        } finally {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const lvl of LEVELS) (console as any)[lvl] = originals[lvl];
          test.consoleLogs = logs;
          test.duration = Date.now() - t1;
          currentTest = null;
        }
      }
      suite.status = allPass ? "pass" : "fail";
      suite.duration = Date.now() - t0;
    }
    return suites;
  }

  return { describe, it, expect: (v: unknown) => createMatchers(v), mock, mockRegistry, runAll };
}

async function runNodeTestFile(
  server: ViteDevServer,
  filePath: string,
  root: string,
): Promise<NodeTestSuite[]> {
  const url = "/" + relative(root, filePath).replace(/\\/g, "/");

  // Invalidate so the file re-executes on each run (handles HMR re-runs)
  const mod = await server.moduleGraph.getModuleByUrl(url);
  if (mod) server.moduleGraph.invalidateModule(mod);

  const ctx = createNodeContext(filePath);
  (globalThis as Record<string, unknown>)["__vtNodeCtx"] = ctx;

  try {
    await server.ssrLoadModule(url);
    return await ctx.runAll();
  } finally {
    delete (globalThis as Record<string, unknown>)["__vtNodeCtx"];
  }
}

// ─── Mock transform helpers ───────────────────────────────────────────────────

/** Inject __ftImport into an existing `import { ... } from '@fieldtest/core'` line */
function injectVtImport(importText: string): string {
  if (importText.includes("__ftImport")) return importText;
  // Named import block: import { a, b } from '...'
  const braceMatch = importText.match(/\{([^}]*)\}/);
  if (braceMatch) {
    const trimmed = braceMatch[1].trim();
    const updated = trimmed ? `${trimmed}, __ftImport` : "__ftImport";
    return importText.replace(braceMatch[0], `{ ${updated} }`);
  }
  // Fallback: append a separate import
  return importText + "\nimport { __ftImport } from '@fieldtest/core'";
}

interface ImportSpecifier {
  type: "default" | "named" | "namespace";
  imported: string;
  local: string;
}

/** Build the `const { ... } = await __ftImport(...)` replacement for a non-core import */
function buildDynamicImport(specifiers: ImportSpecifier[], source: string): string {
  const q = JSON.stringify(source);
  const fn = `() => import(${q})`;

  if (specifiers.length === 0) {
    // Side-effect import
    return `await __ftImport(${q}, ${fn})`;
  }

  const ns = specifiers.find((s) => s.type === "namespace");
  if (ns) {
    return `const ${ns.local} = await __ftImport(${q}, ${fn})`;
  }

  const parts: string[] = [];
  for (const s of specifiers) {
    if (s.type === "default") {
      parts.push(`default: ${s.local}`);
    } else {
      parts.push(s.imported === s.local ? s.imported : `${s.imported}: ${s.local}`);
    }
  }
  return `const { ${parts.join(", ")} } = await __ftImport(${q}, ${fn})`;
}

/** Transform a test file: convert non-core static imports to __ftImport calls */
async function transformTestFile(code: string, id: string): Promise<{ code: string } | null> {
  // Quick bail-out: only transform files that actually call mock()
  if (!code.includes("mock(")) return null;

  // parseAstAsync only handles JavaScript — strip TypeScript types with OXC first
  let jsCode: string;
  try {
    const lang = id.endsWith(".tsx")
      ? "tsx"
      : id.endsWith(".jsx")
        ? "jsx"
        : id.endsWith(".js")
          ? "js"
          : "ts";
    const result = await transformWithOxc(code, id, { lang });
    jsCode = result.code;
  } catch {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ast: any;
  try {
    ast = await parseAstAsync(jsCode);
  } catch {
    return null; // parse failed — leave as-is
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allImports: any[] = ast.body.filter((n: any) => n.type === "ImportDeclaration");
  if (allImports.length === 0) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coreImports: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const otherImports: any[] = [];

  for (const node of allImports) {
    // After esbuild strips types, there are no `import type` declarations left
    if (node.source.value === "@fieldtest/core") coreImports.push(node);
    else otherImports.push(node);
  }

  if (otherImports.length === 0) return null; // nothing to transform

  // Find top-level mock() calls that need to be hoisted before dynamic imports.
  // Only hoist direct `mock(...)` ExpressionStatements at the module's top level
  // (not mock() calls inside describe/it blocks).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topLevelMockCalls: any[] = ast.body.filter(
    (n: any) =>
      n.type === "ExpressionStatement" &&
      n.expression.type === "CallExpression" &&
      n.expression.callee.type === "Identifier" &&
      n.expression.callee.name === "mock",
  );
  const mockCallRanges = new Set(topLevelMockCalls.map((n: any) => n.start));

  // Build the new file:
  //   1. Core imports (with __ftImport injected)
  //   2. Hoisted mock() calls
  //   3. Dynamic __ftImport() lines (replacing the static non-core imports)
  //   4. Rest of the file body, with mock() calls removed (already hoisted)

  const headerLines: string[] = [];

  // Core imports with __ftImport injected
  for (const node of coreImports) {
    headerLines.push(injectVtImport(jsCode.slice(node.start, node.end)));
  }

  // Hoisted mock() calls
  for (const node of topLevelMockCalls) {
    headerLines.push(jsCode.slice(node.start, node.end));
  }

  // Dynamic import replacements (preserve original declaration order)
  for (const node of otherImports) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const specifiers: ImportSpecifier[] = (node.specifiers ?? []).map((s: any) => {
      if (s.type === "ImportDefaultSpecifier")
        return { type: "default" as const, imported: "default", local: s.local.name };
      if (s.type === "ImportNamespaceSpecifier")
        return { type: "namespace" as const, imported: "*", local: s.local.name };
      return { type: "named" as const, imported: s.imported.name, local: s.local.name };
    });
    headerLines.push(buildDynamicImport(specifiers, node.source.value));
  }

  // Build the rest: everything after imports, skipping the hoisted mock() calls
  const lastImportEnd = Math.max(...allImports.map((n: any) => n.end));
  let restStart = lastImportEnd;
  if (jsCode[restStart] === "\n") restStart++;

  // Walk the remaining body nodes and skip the already-hoisted mock() calls
  const bodyAfterImports = ast.body.filter((n: any) => n.start >= restStart);
  const restParts: string[] = [];
  let cursor = restStart;
  for (const node of bodyAfterImports) {
    if (mockCallRanges.has(node.start)) {
      // Emit code before this node, then skip the node itself
      restParts.push(jsCode.slice(cursor, node.start));
      cursor = node.end;
      if (jsCode[cursor] === "\n") cursor++; // consume trailing newline
    }
  }
  restParts.push(jsCode.slice(cursor));

  const newCode = headerLines.join("\n") + "\n" + restParts.join("");

  return { code: newCode };
}

export function fieldtest(options: FieldtestOptions = {}): Plugin {
  const { include = "src/**/*.test.{ts,tsx}", injectHtml = true } = options;
  let config: ResolvedConfig;

  return {
    name: "fieldtest",

    configResolved(resolved) {
      config = resolved;
    },

    async transform(code, id) {
      if (!TEST_FILE_RE.test(id)) return null;

      // Check comment override first (cheap), then walk the import DAG
      const needsNode = NODE_ENV_OVERRIDE_RE.test(code) || (await hasNodeBuiltinDep(code, id));
      if (needsNode) {
        return {
          code: `import { __vtRegisterNodeTest } from '@viewtest/core'\n__vtRegisterNodeTest(${JSON.stringify(id)})`,
        };
      }

      return transformTestFile(code, id);
    },

    configureServer(server) {
      server.ws.on("vt:run-node-test", async (data: { path: string }, client) => {
        try {
          const suites = await runNodeTestFile(server, data.path, config?.root ?? process.cwd());
          // Strip fn — not serializable over WS
          const serialized = suites.map((suite) => ({
            ...suite,
            tests: suite.tests.map(({ fn: _fn, ...rest }) => rest),
          }));
          client.send("vt:node-results", { suites: serialized });
        } catch (e) {
          client.send("vt:node-results", {
            suites: [
              {
                id: `node:${data.path}:error`,
                name: data.path,
                tests: [],
                status: "fail",
                sourceFile: data.path,
                runtime: "node",
                error: e instanceof Error ? e.message : String(e),
              },
            ],
          });
        }
      });
    },

    resolveId(id, _importer, options) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
      // In SSR (Node) context, replace @viewtest/core with a DOM-free stub
      if (id === "@viewtest/core" && options?.ssr) return SSR_CORE_ID;
    },

    load(id, options) {
      if (id === SSR_CORE_ID && options?.ssr) return SSR_CORE_CODE;
      if (id !== RESOLVED_ID) return;

      const root = config?.root ?? process.cwd();
      const pattern = include.startsWith("/") ? include : `/${include}`;

      const previewFile = PREVIEW_CANDIDATES.find((f) => existsSync(join(root, f)));
      const previewImport = previewFile ? `import _wrapper from '/${previewFile}'` : null;

      // setup.ts runs before startApp — supports top-level await for async init
      // (e.g. starting an MSW worker, registering tab plugins)
      const setupFile = SETUP_CANDIDATES.find((f) => existsSync(join(root, f)));
      const setupImport = setupFile ? `import '/${setupFile}'` : null;

      return [
        `import { startApp, reloadFile } from '@fieldtest/core'`,
        setupImport,
        previewImport,
        // Lazy glob — modules are loaded one at a time so sourceFile can be tracked
        `const tests = import.meta.glob(${JSON.stringify(pattern)})`,
        `await startApp(tests${previewImport ? ", { wrapper: _wrapper }" : ""})`,
        // HMR: when a test file (or its dependency) changes, re-run only that file's suites
        `if (import.meta.hot) {`,
        `  import.meta.hot.accept()`,
        `  import.meta.hot.on('vite:afterUpdate', async (payload) => {`,
        `    const testPaths = new Set(Object.keys(tests))`,
        `    for (const update of payload.updates) {`,
        `      const match = [...testPaths].find(p => update.path.endsWith(p) || p.endsWith(update.path))`,
        `      if (match) await reloadFile(match, tests[match])`,
        `    }`,
        `  })`,
        `}`,
      ]
        .filter(Boolean)
        .join("\n");
    },

    transformIndexHtml: injectHtml
      ? () => [
          {
            tag: "script",
            attrs: { type: "module", src: `/@id/${VIRTUAL_ID}` },
            injectTo: "body",
          },
        ]
      : undefined,
  };
}
