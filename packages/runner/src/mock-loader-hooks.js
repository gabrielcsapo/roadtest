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

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const TEST_FILE_RE = /\.(test|spec)\.[jt]sx?($|\?)/

// Lazily resolved esbuild instance (tsx's dependency, available in node_modules)
let _esbuild = null
async function getEsbuild() {
  if (!_esbuild) {
    try { _esbuild = await import('esbuild') } catch { /* not available */ }
  }
  return _esbuild
}

export async function load(url, context, nextLoad) {
  if (!TEST_FILE_RE.test(url)) return nextLoad(url, context)

  // Read raw TypeScript source directly from disk (before tsx touches it)
  let rawSource
  try {
    rawSource = readFileSync(fileURLToPath(url), 'utf-8')
  } catch {
    return nextLoad(url, context)
  }

  if (!rawSource.includes('mock(')) return nextLoad(url, context)

  const hoisted = mockHoist(rawSource)
  if (hoisted === null) return nextLoad(url, context)

  const eb = await getEsbuild()
  if (!eb) return nextLoad(url, context)

  const lang = url.endsWith('.tsx') ? 'tsx' : 'ts'
  let compiled
  try {
    const xformed = await eb.transform(hoisted, {
      loader: lang,
      format: 'esm',
      target: 'node20',
      sourcefile: fileURLToPath(url),
      sourcemap: 'inline',
    })
    compiled = xformed.code
  } catch {
    return nextLoad(url, context)
  }

  return { source: compiled, format: 'module', shortCircuit: true }
}

// ---- Transform ---------------------------------------------------------------

/**
 * Rewrite a test file's TypeScript/JavaScript source so that mock() calls are
 * registered before module imports resolve. Returns null if no rewrite needed.
 */
function mockHoist(code) {
  const imports = collectImports(code)
  const coreImports = imports.filter(function(n) { return n.source === '@fieldtest/core' })
  const otherImports = imports.filter(function(n) { return n.source !== '@fieldtest/core' })

  if (otherImports.length === 0) return null

  const mockCalls = collectTopLevelMockCalls(code)

  const headerParts = []
  for (const n of coreImports) headerParts.push(injectVtImport(n.text))
  for (const n of mockCalls) headerParts.push(n.text)
  for (const n of otherImports) headerParts.push(toDynamicImport(n))

  const header = headerParts.join('\n')

  const toRemove = coreImports.concat(otherImports).concat(mockCalls)
  toRemove.sort(function(a, b) { return a.start - b.start })

  let rest = ''
  let cursor = 0
  for (const node of toRemove) {
    rest += code.slice(cursor, node.start)
    cursor = node.end
    if (code[cursor] === '\n') cursor++
  }
  rest += code.slice(cursor)

  return header + '\n' + rest
}

// ---- Import collection -------------------------------------------------------

const BACKTICK = '\x60'

/**
 * Scan the file collecting all ImportDeclarations.
 * Stops at the first token that is not an import / comment / whitespace.
 */
function collectImports(code) {
  const results = []
  let i = 0

  while (i < code.length) {
    i = skipBlank(code, i)
    if (!code.startsWith('import', i)) break

    const start = i
    i += 6 // 'import'
    i = skipWS(code, i)

    // Skip TypeScript "import type" (removed by esbuild, but keep scanning)
    if (
      (code.startsWith('type ', i) || code.startsWith('type\t', i) || code.startsWith('type\n', i)) &&
      !code.startsWith('type {', i)
    ) {
      while (i < code.length && code[i] !== '\n') i++
      continue
    }

    let source = null
    let specifierText = ''

    if (code[i] === "'" || code[i] === '"') {
      // Side-effect import: import 'mod'
      const parsed = scanStringLiteral(code, i)
      source = parsed[0]
      i = parsed[1]
    } else {
      // import [specifiers] from 'mod'
      const specStart = i
      let depth = 0
      while (i < code.length) {
        const ch = code[i]
        if (ch === '{') { depth++; i++; continue }
        if (ch === '}') { depth--; i++; continue }
        if (ch === "'" || ch === '"' || ch === BACKTICK) {
          i = scanStringLiteral(code, i)[1]
          continue
        }
        if (depth === 0 && code.startsWith('from', i)) {
          const after = code[i + 4] || ' '
          if (after === ' ' || after === '\t' || after === '\n' || after === '"' || after === "'") {
            specifierText = code.slice(specStart, i).trim()
            i += 4 // skip 'from'
            i = skipWS(code, i)
            if (code[i] === "'" || code[i] === '"') {
              const parsed = scanStringLiteral(code, i)
              source = parsed[0]
              i = parsed[1]
            }
            break
          }
        }
        i++
      }
    }

    i = skipWS(code, i)
    if (code[i] === ';') i++

    if (source !== null) {
      results.push({
        source: source,
        specifierText: specifierText,
        text: code.slice(start, i).trimEnd(),
        start: start,
        end: i,
      })
    }
  }

  return results
}

// ---- Top-level mock() call collection ----------------------------------------

/**
 * Find mock(...) calls that start at column 0 (unindented = top-level).
 * Extracts the complete statement including any trailing ';'.
 */
function collectTopLevelMockCalls(code) {
  const results = []
  const re = /(?:^|\n)(mock\s*\()/g
  let m
  while ((m = re.exec(code)) !== null) {
    const start = m.index === 0 ? 0 : m.index + 1

    let i = start + m[1].length - 1 // points at the opening '('
    let depth = 0
    let inStr = null
    while (i < code.length) {
      const ch = code[i]
      if (inStr) {
        if (ch === '\\') { i += 2; continue }
        if (ch === inStr) inStr = null
        i++; continue
      }
      if (ch === "'" || ch === '"' || ch === BACKTICK) { inStr = ch; i++; continue }
      if (ch === '(') depth++
      if (ch === ')') { if (--depth === 0) { i++; break } }
      i++
    }
    if (code[i] === ';') i++

    results.push({ text: code.slice(start, i).trimEnd(), start: start, end: i })
  }
  return results
}

// ---- Code generation ---------------------------------------------------------

/** Inject __ftImport into an existing @fieldtest/core named-import list */
function injectVtImport(importText) {
  if (importText.includes('__ftImport')) return importText
  const braceMatch = importText.match(/\{([^}]*)\}/)
  if (braceMatch) {
    const inner = braceMatch[1].trim()
    const updated = inner ? inner + ', __ftImport' : '__ftImport'
    return importText.replace(braceMatch[0], '{ ' + updated + ' }')
  }
  return importText + "\nimport { __ftImport } from '@fieldtest/core'"
}

// Avoid the literal imp+ort( sequence so tsx's dynamic-import transform
// does not try to rewrite this code-generation string.
const _IMP = 'imp' + 'ort'

/** Build a dynamic __ftImport() replacement for a static import */
function toDynamicImport(imp) {
  const mod = imp.source
  const fn = '() => ' + _IMP + '(\'' + mod + '\')'
  const spec = imp.specifierText

  if (!spec) {
    return 'await __ftImport(\'' + mod + '\', ' + fn + ')'
  }

  const nsMatch = spec.match(/^\*\s+as\s+(\w+)$/)
  if (nsMatch) {
    return 'const ' + nsMatch[1] + ' = await __ftImport(\'' + mod + '\', ' + fn + ')'
  }

  const parts = []
  const braceMatch = spec.match(/\{([^}]*)\}/)
  const beforeBrace = (braceMatch
    ? spec.slice(0, spec.indexOf('{')).trim()
    : spec.trim()
  ).replace(/,$/, '').trim()

  if (beforeBrace) parts.push('default: ' + beforeBrace)

  if (braceMatch) {
    for (const entry of braceMatch[1].split(',').map(function(s) { return s.trim() }).filter(Boolean)) {
      const asMatch = entry.match(/^(\w+)\s+as\s+(\w+)$/)
      parts.push(asMatch ? asMatch[1] + ': ' + asMatch[2] : entry)
    }
  }

  return 'const { ' + parts.join(', ') + ' } = await __ftImport(\'' + mod + '\', ' + fn + ')'
}

// ---- Scanning utilities ------------------------------------------------------

function skipWS(code, i) {
  while (i < code.length && (code[i] === ' ' || code[i] === '\t')) i++
  return i
}

function skipBlank(code, i) {
  while (i < code.length) {
    const prev = i
    while (i < code.length && /\s/.test(code[i])) i++
    if (code.startsWith('//', i)) { while (i < code.length && code[i] !== '\n') i++; continue }
    if (code.startsWith('/*', i)) {
      i += 2
      while (i < code.length && !code.startsWith('*/', i)) i++
      i += 2; continue
    }
    if (i === prev) break
  }
  return i
}

function scanStringLiteral(code, i) {
  const q = code[i++]
  let content = ''
  while (i < code.length) {
    const ch = code[i]
    if (ch === '\\') { i += 2; continue }
    if (ch === q) { i++; break }
    if (q === BACKTICK && ch === '$' && code[i + 1] === '{') {
      let depth = 1; i += 2
      while (i < code.length && depth > 0) {
        if (code[i] === '{') depth++
        if (code[i] === '}') depth--
        i++
      }
      continue
    }
    content += ch; i++
  }
  return [content, i]
}
