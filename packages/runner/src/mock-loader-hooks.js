/**
 * Node.js module loader hook — mock hoisting for test files.
 *
 * Strategy: for test files that call mock(), read the raw TypeScript source
 * BEFORE tsx processes it (tsx minifies and prepends helpers which breaks import
 * scanning). Apply the same mock-hoisting transform as the Vite plugin on the
 * well-formatted TypeScript, then compile with esbuild and return the result
 * directly (shortCircuit: true) without going through tsx again.
 *
 * For test files without mock() calls the hook is a no-op: it calls nextLoad
 * and tsx handles everything normally.
 *
 * NOTE: This file intentionally avoids template literals. tsx's lightweight
 * transformDynamicImport lexer misparses backtick characters inside regex
 * character classes. All string building uses concatenation instead.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname, resolve } from "node:path";

const TEST_FILE_RE = /\.(test|spec)\.[jt]sx?($|\?)/;

// Detect which package name the consuming project uses for the fieldtest runtime.
// Checked once at hook load time (process.cwd() is the project root).
let _runtimePkg = null;
function getRuntimePkg() {
  if (_runtimePkg) return _runtimePkg;
  try {
    const raw = readFileSync(join(process.cwd(), "package.json"), "utf-8");
    const pkg = JSON.parse(raw);
    const all = Object.assign({}, pkg.dependencies, pkg.devDependencies);
    _runtimePkg = "fieldtest" in all ? "fieldtest" : "fieldtest";
  } catch {
    _runtimePkg = "fieldtest";
  }
  return _runtimePkg;
}

// Lazily resolved esbuild instance (tsx's dependency, available in node_modules)
let _esbuild = null;
async function getEsbuild() {
  if (!_esbuild) {
    try {
      _esbuild = await import("esbuild");
    } catch {
      /* not available */
    }
  }
  return _esbuild;
}

// CSS files are not meaningful in happy-dom — stub them as empty modules so
// imports like `import "./globals.css"` in preview.tsx don't throw.
const CSS_FILE_RE = /\.css(\?.*)?$/;

// Registry of mocked modules discovered via static analysis of test files.
// Key: resolved absolute path of the mocked module (no extension), or bare specifier.
// Value: the specifier string as passed to mock() — used for __ftImport lookup at runtime.
const _mockRegistry = new Map();

/** Extract the first string argument from a mock() call text */
function extractMockSpecifier(callText) {
  const m = callText.match(/^mock\s*\(\s*(['"])(.*?)\1/);
  return m ? m[2] : null;
}

/**
 * Populate _mockRegistry by statically extracting mock() specifiers from a test file.
 * Called during the load hook so that subsequent dependency loads can check the registry.
 */
function trackMocksFromTestFile(testFileUrl, mockCalls) {
  if (mockCalls.length === 0) return;
  const testDir = dirname(fileURLToPath(testFileUrl));
  for (const call of mockCalls) {
    const specifier = extractMockSpecifier(call.text);
    if (!specifier) continue;
    if (specifier.startsWith(".")) {
      // Strip any extension so we can match regardless of whether the source
      // file is .ts, .tsx, .js, etc.
      const absBase = resolve(testDir, specifier).replace(/\.[jt]sx?$/, "");
      _mockRegistry.set(absBase, specifier);
    } else {
      // Bare specifier (node_modules) — key by the specifier string itself.
      _mockRegistry.set(specifier, specifier);
    }
  }
}

/**
 * Given the URL of a non-test source file and its parsed imports, return a Map
 * of { originalSpecifier -> registeredMockSpecifier } for any imports that are mocked.
 */
function findMockedImports(fileUrl, imports) {
  if (_mockRegistry.size === 0) return new Map();
  const fileDir = dirname(fileURLToPath(fileUrl));
  const matches = new Map();
  for (const imp of imports) {
    const spec = imp.source;
    if (spec.startsWith(".")) {
      const absBase = resolve(fileDir, spec).replace(/\.[jt]sx?$/, "");
      if (_mockRegistry.has(absBase)) {
        matches.set(spec, _mockRegistry.get(absBase));
      }
    } else if (_mockRegistry.has(spec)) {
      matches.set(spec, _mockRegistry.get(spec));
    }
  }
  return matches;
}

/**
 * Rewrite a non-test source file so that imports matching registered mocks are
 * redirected through __ftImport. Only the matched imports are converted; all
 * other imports remain as static ESM imports.
 */
function transformNonTestFile(code, allImports, mockedImports) {
  const toReplace = allImports.filter(function (imp) {
    return mockedImports.has(imp.source);
  });
  if (toReplace.length === 0) return null;

  toReplace.sort(function (a, b) {
    return a.start - b.start;
  });

  const headerParts = [];
  // Use the globalThis reference set by mocks.ts when fieldtest is first loaded.
  // This avoids adding a new `import` to the source file, which would pull in
  // the full test framework and risk duplicate React instances breaking hooks.
  headerParts.push("const __ftImport = globalThis.__ftImport;");
  for (const imp of toReplace) {
    const registeredSpec = mockedImports.get(imp.source);
    headerParts.push(toDynamicImportForNonTest(imp, registeredSpec));
  }

  let rest = "";
  let cursor = 0;
  for (const node of toReplace) {
    rest += code.slice(cursor, node.start);
    cursor = node.end;
    if (code[cursor] === "\n") cursor++;
  }
  rest += code.slice(cursor);

  return headerParts.join("\n") + "\n" + rest;
}

export async function load(url, context, nextLoad) {
  if (CSS_FILE_RE.test(url)) {
    return { shortCircuit: true, source: "export default {}", format: "module" };
  }

  const isTestFile = TEST_FILE_RE.test(url);

  if (!isTestFile) {
    // For non-test files: if any of their imports are mocked, redirect those
    // imports through __ftImport so the mock registry is consulted at runtime.
    if (_mockRegistry.size === 0) return nextLoad(url, context);

    let rawSource;
    try {
      rawSource = readFileSync(fileURLToPath(url), "utf-8");
    } catch {
      return nextLoad(url, context);
    }

    const imports = collectImports(rawSource);
    const mockedImports = findMockedImports(url, imports);
    if (mockedImports.size === 0) return nextLoad(url, context);

    const transformed = transformNonTestFile(rawSource, imports, mockedImports);
    if (transformed === null) return nextLoad(url, context);

    const eb = await getEsbuild();
    if (!eb) return nextLoad(url, context);

    const lang = url.endsWith(".tsx") ? "tsx" : "ts";
    let compiled;
    try {
      const xformed = await eb.transform(transformed, {
        loader: lang,
        format: "esm",
        target: "node20",
        jsx: "automatic",
        sourcefile: fileURLToPath(url),
        sourcemap: "inline",
      });
      compiled = xformed.code;
    } catch {
      return nextLoad(url, context);
    }

    return { source: compiled, format: "module", shortCircuit: true };
  }

  // Read raw TypeScript source directly from disk (before tsx touches it)
  let rawSource;
  try {
    rawSource = readFileSync(fileURLToPath(url), "utf-8");
  } catch {
    return nextLoad(url, context);
  }

  if (!rawSource.includes("mock(")) return nextLoad(url, context);

  // Each test file gets a fresh mock scope: clear any mocks registered by
  // previous test files so they don't contaminate this file's dependencies.
  _mockRegistry.clear();

  // Statically record which modules this test file mocks so that non-test
  // dependencies loaded afterward can have their imports redirected too.
  const mockCalls = collectTopLevelMockCalls(rawSource);
  trackMocksFromTestFile(url, mockCalls);

  const hoisted = mockHoist(rawSource);
  if (hoisted === null) return nextLoad(url, context);

  const eb = await getEsbuild();
  if (!eb) return nextLoad(url, context);

  const lang = url.endsWith(".tsx") ? "tsx" : "ts";
  let compiled;
  try {
    const xformed = await eb.transform(hoisted, {
      loader: lang,
      format: "esm",
      target: "node20",
      jsx: "automatic",
      sourcefile: fileURLToPath(url),
      sourcemap: "inline",
    });
    compiled = xformed.code;
  } catch {
    return nextLoad(url, context);
  }

  return { source: compiled, format: "module", shortCircuit: true };
}

// ---- Transform ---------------------------------------------------------------

/**
 * Rewrite a test file's TypeScript/JavaScript source so that mock() calls are
 * registered before module imports resolve. Returns null if no rewrite needed.
 */
// All package names that serve as the fieldtest runtime entry point.
// Checked statically so that projects using either name work regardless of
// which package.json getRuntimePkg() happens to read (e.g. monorepo roots
// that don't list the example app's deps).
const CORE_PKGS = new Set(["fieldtest", "fieldtest"]);

function mockHoist(code) {
  const imports = collectImports(code);
  const coreImports = imports.filter(function (n) {
    return CORE_PKGS.has(n.source);
  });
  const otherImports = imports.filter(function (n) {
    return !CORE_PKGS.has(n.source);
  });

  if (otherImports.length === 0) return null;

  const mockCalls = collectTopLevelMockCalls(code);

  const headerParts = [];
  for (const n of coreImports) headerParts.push(injectVtImport(n.text));
  for (const n of mockCalls) headerParts.push(n.text);
  for (const n of otherImports) headerParts.push(toDynamicImport(n));

  const header = headerParts.join("\n");

  const toRemove = coreImports.concat(otherImports).concat(mockCalls);
  toRemove.sort(function (a, b) {
    return a.start - b.start;
  });

  let rest = "";
  let cursor = 0;
  for (const node of toRemove) {
    rest += code.slice(cursor, node.start);
    cursor = node.end;
    if (code[cursor] === "\n") cursor++;
  }
  rest += code.slice(cursor);

  return header + "\n" + rest;
}

// ---- Import collection -------------------------------------------------------

const BACKTICK = "\x60";

/**
 * Scan the file collecting all ImportDeclarations.
 * Stops at the first token that is not an import / comment / whitespace.
 */
function collectImports(code) {
  const results = [];
  let i = 0;

  while (i < code.length) {
    i = skipBlank(code, i);
    if (!code.startsWith("import", i)) break;

    const start = i;
    i += 6; // 'import'
    i = skipWS(code, i);

    // Skip TypeScript "import type" (removed by esbuild, but keep scanning)
    if (
      (code.startsWith("type ", i) ||
        code.startsWith("type\t", i) ||
        code.startsWith("type\n", i)) &&
      !code.startsWith("type {", i)
    ) {
      while (i < code.length && code[i] !== "\n") i++;
      continue;
    }

    let source = null;
    let specifierText = "";

    if (code[i] === "'" || code[i] === '"') {
      // Side-effect import: import 'mod'
      const parsed = scanStringLiteral(code, i);
      source = parsed[0];
      i = parsed[1];
    } else {
      // import [specifiers] from 'mod'
      const specStart = i;
      let depth = 0;
      while (i < code.length) {
        const ch = code[i];
        if (ch === "{") {
          depth++;
          i++;
          continue;
        }
        if (ch === "}") {
          depth--;
          i++;
          continue;
        }
        if (ch === "'" || ch === '"' || ch === BACKTICK) {
          i = scanStringLiteral(code, i)[1];
          continue;
        }
        if (depth === 0 && code.startsWith("from", i)) {
          const after = code[i + 4] || " ";
          if (after === " " || after === "\t" || after === "\n" || after === '"' || after === "'") {
            specifierText = code.slice(specStart, i).trim();
            i += 4; // skip 'from'
            i = skipWS(code, i);
            if (code[i] === "'" || code[i] === '"') {
              const parsed = scanStringLiteral(code, i);
              source = parsed[0];
              i = parsed[1];
            }
            break;
          }
        }
        i++;
      }
    }

    i = skipWS(code, i);
    if (code[i] === ";") i++;

    if (source !== null) {
      results.push({
        source: source,
        specifierText: specifierText,
        text: code.slice(start, i).trimEnd(),
        start: start,
        end: i,
      });
    }
  }

  return results;
}

// ---- Top-level mock() call collection ----------------------------------------

/**
 * Find mock(...) calls that start at column 0 (unindented = top-level).
 * Extracts the complete statement including any trailing ';'.
 */
function collectTopLevelMockCalls(code) {
  const results = [];
  const re = /(?:^|\n)(mock\s*\()/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    const start = m.index === 0 ? 0 : m.index + 1;

    let i = start + m[1].length - 1; // points at the opening '('
    let depth = 0;
    let inStr = null;
    while (i < code.length) {
      const ch = code[i];
      if (inStr) {
        if (ch === "\\") {
          i += 2;
          continue;
        }
        if (ch === inStr) inStr = null;
        i++;
        continue;
      }
      if (ch === "'" || ch === '"' || ch === BACKTICK) {
        inStr = ch;
        i++;
        continue;
      }
      if (ch === "(") depth++;
      if (ch === ")") {
        if (--depth === 0) {
          i++;
          break;
        }
      }
      i++;
    }
    if (code[i] === ";") i++;

    results.push({ text: code.slice(start, i).trimEnd(), start: start, end: i });
  }
  return results;
}

// ---- Code generation ---------------------------------------------------------

/** Inject __ftImport into an existing fieldtest named-import list */
function injectVtImport(importText) {
  if (importText.includes("__ftImport")) return importText;
  const braceMatch = importText.match(/\{([^}]*)\}/);
  if (braceMatch) {
    const inner = braceMatch[1].trim();
    const updated = inner ? inner + ", __ftImport" : "__ftImport";
    return importText.replace(braceMatch[0], "{ " + updated + " }");
  }
  return importText + "\nimport { __ftImport } from '" + getRuntimePkg() + "'";
}

// Avoid the literal imp+ort( sequence so tsx's dynamic-import transform
// does not try to rewrite this code-generation string.
const _IMP = "imp" + "ort";

/** Build a dynamic __ftImport() replacement for a static import */
function toDynamicImport(imp) {
  const mod = imp.source;
  const fn = "() => " + _IMP + "('" + mod + "')";
  const spec = imp.specifierText;

  if (!spec) {
    return "await __ftImport('" + mod + "', " + fn + ")";
  }

  const nsMatch = spec.match(/^\*\s+as\s+(\w+)$/);
  if (nsMatch) {
    return "const " + nsMatch[1] + " = await __ftImport('" + mod + "', " + fn + ")";
  }

  const parts = [];
  const braceMatch = spec.match(/\{([^}]*)\}/);
  const beforeBrace = (braceMatch ? spec.slice(0, spec.indexOf("{")).trim() : spec.trim())
    .replace(/,$/, "")
    .trim();

  if (beforeBrace) parts.push("default: " + beforeBrace);

  if (braceMatch) {
    for (const entry of braceMatch[1]
      .split(",")
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean)) {
      const asMatch = entry.match(/^(\w+)\s+as\s+(\w+)$/);
      parts.push(asMatch ? asMatch[1] + ": " + asMatch[2] : entry);
    }
  }

  return "const { " + parts.join(", ") + " } = await __ftImport('" + mod + "', " + fn + ")";
}

/**
 * Like toDynamicImport but uses two specifiers:
 *   mockSpec     — key registered in mock(), used for __ftImport registry lookup
 *   imp.source   — original import path, used for the fallback import() so that
 *                  relative path resolution stays correct for the calling file
 */
function toDynamicImportForNonTest(imp, mockSpec) {
  const originalMod = imp.source;
  const fn = "() => " + _IMP + "('" + originalMod + "')";
  const spec = imp.specifierText;

  if (!spec) {
    return "await __ftImport('" + mockSpec + "', " + fn + ")";
  }

  const nsMatch = spec.match(/^\*\s+as\s+(\w+)$/);
  if (nsMatch) {
    return "const " + nsMatch[1] + " = await __ftImport('" + mockSpec + "', " + fn + ")";
  }

  const parts = [];
  const braceMatch = spec.match(/\{([^}]*)\}/);
  const beforeBrace = (braceMatch ? spec.slice(0, spec.indexOf("{")).trim() : spec.trim())
    .replace(/,$/, "")
    .trim();

  if (beforeBrace) parts.push("default: " + beforeBrace);

  if (braceMatch) {
    for (const entry of braceMatch[1]
      .split(",")
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean)) {
      const asMatch = entry.match(/^(\w+)\s+as\s+(\w+)$/);
      parts.push(asMatch ? asMatch[1] + ": " + asMatch[2] : entry);
    }
  }

  return "const { " + parts.join(", ") + " } = await __ftImport('" + mockSpec + "', " + fn + ")";
}

// ---- Scanning utilities ------------------------------------------------------

function skipWS(code, i) {
  while (i < code.length && (code[i] === " " || code[i] === "\t")) i++;
  return i;
}

function skipBlank(code, i) {
  while (i < code.length) {
    const prev = i;
    while (i < code.length && /\s/.test(code[i])) i++;
    if (code.startsWith("//", i)) {
      while (i < code.length && code[i] !== "\n") i++;
      continue;
    }
    if (code.startsWith("/*", i)) {
      i += 2;
      while (i < code.length && !code.startsWith("*/", i)) i++;
      i += 2;
      continue;
    }
    if (i === prev) break;
  }
  return i;
}

function scanStringLiteral(code, i) {
  const q = code[i++];
  let content = "";
  while (i < code.length) {
    const ch = code[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (ch === q) {
      i++;
      break;
    }
    if (q === BACKTICK && ch === "$" && code[i + 1] === "{") {
      let depth = 1;
      i += 2;
      while (i < code.length && depth > 0) {
        if (code[i] === "{") depth++;
        if (code[i] === "}") depth--;
        i++;
      }
      continue;
    }
    content += ch;
    i++;
  }
  return [content, i];
}
