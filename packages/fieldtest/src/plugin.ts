import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname, resolve as resolvePath, relative } from "node:path";
import { createHash } from "node:crypto";
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
 * ID for the virtual module that replaces `fieldtest` when a test file is
 * loaded via ssrLoadModule. Provides a DOM-free describe/it/expect that routes
 * calls through globalThis.__vtNodeCtx, which is set fresh for every test run.
 */
const SSR_CORE_ID = "\0viewtest-ssr-core";

/**
 * The code served as `fieldtest` in SSR (Node) context.
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
export const render = () => { throw new Error('[fieldtest] render() is not available in node tests') }
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

/** Inject __ftImport into an existing `import { ... } from '<runtimePkg>'` line */
function injectVtImport(importText: string, runtimePkg: string): string {
  if (importText.includes("__ftImport")) return importText;
  // Named import block: import { a, b } from '...'
  const braceMatch = importText.match(/\{([^}]*)\}/);
  if (braceMatch) {
    const trimmed = braceMatch[1].trim();
    const updated = trimmed ? `${trimmed}, __ftImport` : "__ftImport";
    return importText.replace(braceMatch[0], `{ ${updated} }`);
  }
  // Fallback: append a separate import
  return importText + `\nimport { __ftImport } from '${runtimePkg}'`;
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
async function transformTestFile(
  code: string,
  id: string,
  runtimePkg = "fieldtest",
): Promise<{ code: string } | null> {
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
    // Accept both the public package name and the internal one
    if (node.source.value === runtimePkg || node.source.value === "fieldtest")
      coreImports.push(node);
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
    headerLines.push(injectVtImport(jsCode.slice(node.start, node.end), runtimePkg));
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
  const firstImportStart = allImports[0]?.start ?? 0;
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

  // OXC (Vite's JSX dev transform) auto-injects `import { jsxDEV } from "react/jsx-dev-runtime"`
  // at position 0, then places `var _jsxFileName = "..."` in the gap between that auto-import
  // and the original file imports. Our reconstruction only emits import nodes (re-written) and
  // code after the last import, so anything sandwiched between two imports gets silently dropped.
  //
  // Fix: collect non-import, non-mock top-level AST nodes that appear between imports and
  // re-emit them after the rewritten import block. Also handle the rare case where something
  // appears before the very first import (preamble).
  const preamble = firstImportStart > 0 ? jsCode.slice(0, firstImportStart) : "";
  const interstitial = (ast.body as any[])
    .filter(
      (n) =>
        n.type !== "ImportDeclaration" &&
        !mockCallRanges.has(n.start) &&
        n.start >= firstImportStart &&
        n.start < lastImportEnd,
    )
    .map((n) => jsCode.slice(n.start, n.end));

  const newCode =
    preamble +
    headerLines.join("\n") +
    "\n" +
    (interstitial.length ? interstitial.join("\n") + "\n" : "") +
    restParts.join("");

  return { code: newCode };
}

/**
 * Extract the specifier strings from top-level mock() calls in a test file.
 * Uses a simple regex rather than a full AST parse — called before OXC stripping
 * so it operates on the raw TypeScript source.
 */
function extractMockSpecifiersFromSource(code: string): string[] {
  const specifiers: string[] = [];
  const re = /(?:^|\n)mock\s*\(\s*(['"])(.*?)\1/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    specifiers.push(m[2]);
  }
  return specifiers;
}

/**
 * Transform a non-test source file so that imports of mocked modules are
 * redirected through globalThis.__ftImport at runtime (set by mocks.ts).
 * Mirrors the node runner's transformNonTestFile in mock-loader-hooks.js.
 *
 * Only the specifically mocked imports are converted; all other imports remain
 * as static ESM declarations. Falls back to the real import() if __ftImport
 * is not available (e.g. in a production build or non-test context).
 */
async function transformSourceFileForMocks(
  code: string,
  id: string,
  // Key: absolute path of mocked module (no extension); value: specifier string passed to mock()
  knownMocks: Map<string, string>,
): Promise<{ code: string } | null> {
  // Quick bail-out: check if any mocked specifier string appears in the source
  let hasMockRef = false;
  for (const spec of knownMocks.values()) {
    if (code.includes(spec)) {
      hasMockRef = true;
      break;
    }
  }
  if (!hasMockRef) return null;

  // Strip TypeScript types with OXC first (parseAstAsync only handles JS)
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
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ast: any;
  try {
    ast = await parseAstAsync(jsCode);
  } catch {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allImports: any[] = ast.body.filter((n: any) => n.type === "ImportDeclaration");
  if (allImports.length === 0) return null;

  const fileDir = dirname(id);

  // Identify which imports need to be redirected through __ftImport
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toRedirect = new Map<any, string>(); // AST node -> mockSpec
  for (const node of allImports) {
    const source: string = node.source.value;
    if (source.startsWith(".")) {
      const absBase = resolvePath(fileDir, source).replace(/\.[jt]sx?$/, "");
      if (knownMocks.has(absBase)) {
        toRedirect.set(node, knownMocks.get(absBase)!);
      }
    } else if (knownMocks.has(source)) {
      toRedirect.set(node, knownMocks.get(source)!);
    }
  }

  if (toRedirect.size === 0) return null;

  // Compute preamble and interstitial ranges (same logic as transformTestFile).
  // OXC may inject `import { jsxDEV }` at position 0 and `var _jsxFileName` between
  // imports — preserve them in the output.
  const firstImportStart = allImports[0].start;
  const lastImportEnd = Math.max(...allImports.map((n: any) => n.end));
  const preamble = firstImportStart > 0 ? jsCode.slice(0, firstImportStart) : "";
  const interstitial = (ast.body as any[])
    .filter(
      (n) =>
        n.type !== "ImportDeclaration" && n.start >= firstImportStart && n.start < lastImportEnd,
    )
    .map((n) => jsCode.slice(n.start, n.end));

  let restStart = lastImportEnd;
  if (jsCode[restStart] === "\n") restStart++;
  const rest = jsCode.slice(restStart);

  // Build the output in four sections:
  //   1. Static imports (non-redirected) — must precede any executable code
  //   2. const __ftImport = globalThis.__ftImport ?? fallback
  //   3. await __ftImport(...) for each redirected import (top-level await)
  //   4. interstitial + rest of file
  const staticImportLines: string[] = [];
  const dynamicImportLines: string[] = [];

  for (const node of allImports) {
    if (!toRedirect.has(node)) {
      staticImportLines.push(jsCode.slice(node.start, node.end));
      continue;
    }
    const mockSpec = toRedirect.get(node)!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const specifiers: ImportSpecifier[] = (node.specifiers ?? []).map((s: any) => {
      if (s.type === "ImportDefaultSpecifier")
        return { type: "default" as const, imported: "default", local: s.local.name };
      if (s.type === "ImportNamespaceSpecifier")
        return { type: "namespace" as const, imported: "*", local: s.local.name };
      return { type: "named" as const, imported: s.imported.name, local: s.local.name };
    });

    // Use mockSpec as the registry key; original source as the fallback import() path
    // so that relative path resolution stays correct for the calling file.
    const mockQ = JSON.stringify(mockSpec);
    const origQ = JSON.stringify(node.source.value);
    const fn = `() => import(${origQ})`;

    if (specifiers.length === 0) {
      dynamicImportLines.push(`await __ftImport(${mockQ}, ${fn})`);
    } else {
      const ns = specifiers.find((s) => s.type === "namespace");
      if (ns) {
        dynamicImportLines.push(`const ${ns.local} = await __ftImport(${mockQ}, ${fn})`);
      } else {
        const parts: string[] = [];
        for (const s of specifiers) {
          if (s.type === "default") parts.push(`default: ${s.local}`);
          else parts.push(s.imported === s.local ? s.imported : `${s.imported}: ${s.local}`);
        }
        dynamicImportLines.push(
          `const { ${parts.join(", ")} } = await __ftImport(${mockQ}, ${fn})`,
        );
      }
    }
  }

  // Avoid importing the test framework into source files (duplicate React risk).
  // Use the globalThis reference set by mocks.ts; fall back to direct import() when
  // running outside the test runner (production builds, static deployments, etc.).
  const ftImportDecl = "const __ftImport = globalThis.__ftImport ?? ((_id, fn) => fn());";

  const parts = [preamble, staticImportLines.join("\n"), ftImportDecl];
  if (dynamicImportLines.length) parts.push(dynamicImportLines.join("\n"));
  if (interstitial.length) parts.push(interstitial.join("\n"));
  parts.push(rest);

  return { code: parts.filter(Boolean).join("\n") };
}

/** Detect which package name the consuming project uses for the fieldtest runtime. */
function detectRuntimePkg(root: string): string {
  try {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    if ("fieldtest" in all) return "fieldtest";
  } catch {
    /* ignore — fall back to internal name */
  }
  return "fieldtest";
}

export function fieldtest(options: FieldtestOptions = {}): Plugin {
  const { include = "src/**/*.test.{ts,tsx}", injectHtml = true } = options;
  let config: ResolvedConfig;
  let runtimePkg = "fieldtest";

  // Map from resolved absolute path base (no extension) → specifier string passed to mock().
  // Populated during server startup (pre-scan) and when browser test files are transformed.
  // Consulted when transforming non-test source files so that their imports of mocked modules
  // can be redirected through __ftImport. Mirrors mock-loader-hooks.js for the node runner.
  const _knownMocks = new Map<string, string>();

  // Stored server reference — used to invalidate cached source modules when _knownMocks updates.
  let _server: ViteDevServer | null = null;

  return {
    name: "fieldtest",

    configResolved(resolved) {
      config = resolved;
      runtimePkg = detectRuntimePkg(resolved.root);
    },

    async transform(code, id) {
      if (!TEST_FILE_RE.test(id)) {
        // Non-test source file: if any mocked modules might be imported here,
        // redirect those imports through globalThis.__ftImport so test mocks apply.
        if (_knownMocks.size > 0 && /\.[jt]sx?$/.test(id.split("?")[0])) {
          return transformSourceFileForMocks(code, id, _knownMocks);
        }
        return null;
      }

      // Check comment override first (cheap), then walk the import DAG
      const needsNode = NODE_ENV_OVERRIDE_RE.test(code) || (await hasNodeBuiltinDep(code, id));
      if (needsNode) {
        return {
          code: `import { __vtRegisterNodeTest } from '${runtimePkg}'\n__vtRegisterNodeTest(${JSON.stringify(id)})`,
        };
      }

      // Browser test file: record which modules it mocks so we can intercept those
      // imports in non-test source files that load as dependencies.
      if (code.includes("mock(")) {
        const newlyMocked: string[] = [];
        for (const spec of extractMockSpecifiersFromSource(code)) {
          if (spec.startsWith(".")) {
            const absBase = resolvePath(dirname(id), spec).replace(/\.[jt]sx?$/, "");
            if (!_knownMocks.has(absBase)) newlyMocked.push(absBase);
            _knownMocks.set(absBase, spec);
          } else {
            if (!_knownMocks.has(spec)) newlyMocked.push(spec);
            _knownMocks.set(spec, spec);
          }
        }
        // Invalidate any already-cached source modules that import newly mocked paths.
        // This handles the case where a source file was transformed before the pre-scan
        // populated _knownMocks (e.g. HMR or dynamically added test files).
        if (newlyMocked.length > 0 && _server) {
          for (const [, mod] of _server.moduleGraph.idToModuleMap) {
            if (!mod.id || TEST_FILE_RE.test(mod.id)) continue;
            for (const imported of mod.importedModules) {
              const importedBase = imported.id?.split("?")[0].replace(/\.[jt]sx?$/, "");
              if (importedBase && newlyMocked.includes(importedBase)) {
                _server.moduleGraph.invalidateModule(mod);
                break;
              }
            }
          }
        }
      }

      return transformTestFile(code, id, runtimePkg);
    },

    configureServer(server) {
      _server = server;

      // Pre-scan all test files so that _knownMocks is populated before the first
      // browser request arrives. Without this, App.tsx can be transformed while
      // _knownMocks is still empty (race between test-file transform and source-file
      // transform), causing mock("./greeting") to register too late.
      const root = config?.root ?? process.cwd();
      const srcBase = include.split("/**")[0].replace(/^\//, ""); // e.g. "src"
      const srcDir = join(root, srcBase);

      function scanForMocks(dir: string): void {
        let entries: import("node:fs").Dirent[];
        try {
          entries = readdirSync(dir, { withFileTypes: true });
        } catch {
          return;
        }
        for (const entry of entries) {
          const full = join(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
            scanForMocks(full);
          } else if (TEST_FILE_RE.test(entry.name)) {
            try {
              const src = readFileSync(full, "utf-8");
              if (!src.includes("mock(")) continue;
              for (const spec of extractMockSpecifiersFromSource(src)) {
                if (spec.startsWith(".")) {
                  const absBase = resolvePath(dirname(full), spec).replace(/\.[jt]sx?$/, "");
                  _knownMocks.set(absBase, spec);
                } else {
                  _knownMocks.set(spec, spec);
                }
              }
            } catch {
              /* ignore unreadable files */
            }
          }
        }
      }

      scanForMocks(srcDir);

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
      // In SSR (Node) context, replace the runtime package with a DOM-free stub
      if ((id === "fieldtest" || id === runtimePkg) && options?.ssr) return SSR_CORE_ID;
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
        `import { startApp, reloadFile } from '${runtimePkg}'`,
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

// ─── Coverage plugin ──────────────────────────────────────────────────────────

interface CoverageOptions {
  /** Glob pattern(s) of files to instrument. @default "src/**\/*" */
  include?: string | string[];
  /** Patterns to exclude. Defaults exclude node_modules, test/spec files, .d.ts */
  exclude?: string | string[];
  /** Extensions to instrument. @default [".ts",".tsx",".js",".jsx"] */
  extension?: string[];
}

const COVERAGE_EXCLUDE_RE = /node_modules|\.test\.[jt]sx?$|\.spec\.[jt]sx?$|\.d\.ts$/;
const COVERAGE_EXT = new Set([".ts", ".tsx", ".js", ".jsx"]);

// Shared cache across plugin instances — keyed by `cleanId:contentHash` so HMR
// invalidates naturally when file content changes.
const _instrumentationCache = new Map<string, { code: string; map: unknown }>();

// Lazy-loaded to avoid pulling istanbul-lib-instrument into non-coverage paths.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _createInstrumenter: ((opts: object) => any) | null | undefined;

async function getCreateInstrumenter() {
  if (_createInstrumenter !== undefined) return _createInstrumenter;
  try {
    const mod = await import("istanbul-lib-instrument");
    _createInstrumenter = mod.createInstrumenter;
  } catch {
    _createInstrumenter = null;
  }
  return _createInstrumenter;
}

/**
 * Vite plugin that instruments source files for Istanbul-compatible coverage
 * using istanbul-lib-instrument directly — no Babel JSX/TS transforms, so no
 * `_jsxFileName` injection. Vite's own OXC handles type-stripping and JSX after
 * instrumentation.
 */
export function fieldtestCoverage(options: CoverageOptions = {}): Plugin {
  const { extension = [".ts", ".tsx", ".js", ".jsx"] } = options;
  const extSet = new Set(extension);
  // Reuse a single instrumenter instance across all transform calls — construction
  // is expensive (Babel parser setup) and the instrumenter is stateless between files.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let _instrumenter: any | null = null;

  return {
    name: "fieldtest-coverage",
    apply: "serve",

    async transform(code, id) {
      // Strip query strings (e.g. ?t=123 from HMR)
      const cleanId = id.split("?")[0];

      if (COVERAGE_EXCLUDE_RE.test(cleanId)) return null;
      if (cleanId.startsWith("\0")) return null; // virtual modules

      const ext = cleanId.slice(cleanId.lastIndexOf("."));
      if (!extSet.has(ext) && !COVERAGE_EXT.has(ext)) return null;

      const createInstrumenter = await getCreateInstrumenter();
      if (!createInstrumenter) return null;

      // Use TypeScript + JSX parser plugins so istanbul can parse .ts/.tsx source.
      // We do NOT run Babel's React JSX transform — only the instrumentation pass —
      // so no `_jsxFileName` variable is injected. Vite's OXC handles JSX later.
      if (!_instrumenter) {
        _instrumenter = createInstrumenter({
          esModules: true,
          compact: false,
          produceSourceMap: true,
          autoWrap: false,
          parserPlugins: ["typescript", "jsx"],
        });
      }

      const contentHash = createHash("sha1").update(code).digest("hex");
      const instrCacheKey = `${cleanId}:${contentHash}`;
      const cached = _instrumentationCache.get(instrCacheKey);
      if (cached) return cached;

      try {
        const instrumented = _instrumenter.instrumentSync(code, cleanId);
        const map = _instrumenter.lastSourceMap();
        const result = { code: instrumented, map: map ?? null };
        _instrumentationCache.set(instrCacheKey, result);
        return result;
      } catch {
        // Parse/instrument failed (e.g. unsupported syntax) — leave file as-is
        return null;
      }
    },
  };
}
