#!/usr/bin/env node
/**
 * Node test runner — run with: pnpm test:node
 * Watch mode:          pnpm test:node:watch
 *
 * In watch mode, builds a transitive import graph and renders an ASCII dep
 * tree showing exactly which test files are affected and why.
 */

// ─── 1. DOM environment ───────────────────────────────────────────────────────

import { Window } from 'happy-dom'

const win = new Window({ url: 'http://localhost/', width: 1024, height: 768 })

function setGlobal(name: string, value: unknown) {
  try {
    (globalThis as Record<string, unknown>)[name] = value
  } catch {
    try {
      Object.defineProperty(globalThis, name, { value, writable: true, configurable: true })
    } catch { /* already set */ }
  }
}

setGlobal('window', win); setGlobal('document', win.document)
setGlobal('navigator', win.navigator); setGlobal('location', win.location)
setGlobal('history', win.history); setGlobal('screen', win.screen)

for (const name of [
  'Element','HTMLElement','HTMLButtonElement','HTMLInputElement','HTMLDivElement',
  'HTMLSpanElement','HTMLAnchorElement','HTMLFormElement','Node','Text','Comment',
  'DocumentFragment','Event','CustomEvent','MouseEvent','KeyboardEvent','FocusEvent',
  'InputEvent','MutationObserver','ResizeObserver','IntersectionObserver',
  'getComputedStyle','requestAnimationFrame','cancelAnimationFrame','matchMedia',
]) {
  const val = (win as Record<string, unknown>)[name]
  if (val !== undefined) setGlobal(name, val)
}
setGlobal('IS_REACT_ACT_ENVIRONMENT', true)

// ─── 2. Dep graph ─────────────────────────────────────────────────────────────

import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'

/** Extract static import/from paths from TypeScript source */
function parseImports(content: string): string[] {
  const re = /(?:^|\s)(?:import|from)\s+['"]([^'"]+)['"]/gm
  const result: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) result.push(m[1])
  return result
}

/** Resolve a relative import to a real file (never returns a directory) */
function resolveImport(fromFile: string, imp: string): string | null {
  if (!imp.startsWith('.')) return null
  const base = resolve(dirname(fromFile), imp)
  for (const c of [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]) {
    if (existsSync(c)) return c
  }
  return null
}

interface DepGraph {
  /** sourceFile → all test files that transitively import it */
  dependents: Map<string, Set<string>>
  /**
   * For each test file, for each file it (transitively) imports, which file
   * imported it. Used to reconstruct the import path for the ASCII tree.
   *
   * importedBy[testFile][file] = the file that imported `file`
   */
  importedBy: Map<string, Map<string, string>>
}

function buildDepGraph(testFiles: string[]): DepGraph {
  const dependents = new Map<string, Set<string>>()
  const importedBy = new Map<string, Map<string, string>>()

  function visit(file: string, testFile: string, parent: string | null, visited: Set<string>) {
    if (visited.has(file)) return
    visited.add(file)

    if (!dependents.has(file)) dependents.set(file, new Set())
    dependents.get(file)!.add(testFile)

    if (parent !== null) {
      if (!importedBy.has(testFile)) importedBy.set(testFile, new Map())
      importedBy.get(testFile)!.set(file, parent)
    }

    let content: string
    try { content = readFileSync(file, 'utf-8') } catch { return }

    for (const imp of parseImports(content)) {
      const resolved = resolveImport(file, imp)
      if (resolved) visit(resolved, testFile, file, visited)
    }
  }

  for (const t of testFiles) visit(t, t, null, new Set())
  return { dependents, importedBy }
}

/**
 * Reconstruct the import chain from `changedFile` to `testFile`.
 * Returns the full path: [changedFile, ...intermediates, testFile]
 * Returns [changedFile] when changedFile IS testFile.
 */
function getImportPath(changedFile: string, testFile: string, graph: DepGraph): string[] {
  if (changedFile === testFile) return [changedFile]
  const parents = graph.importedBy.get(testFile)
  if (!parents?.has(changedFile)) return [changedFile, testFile]

  const path = [changedFile]
  let current = changedFile
  while (current !== testFile) {
    const parent = parents.get(current)
    if (!parent) break
    path.push(parent)
    current = parent
  }
  return path  // [changedFile, intermediate..., testFile]
}

// ─── 3. ASCII tree renderer ───────────────────────────────────────────────────

const RESET = '\x1b[0m', BOLD = '\x1b[1m', DIM = '\x1b[2m'
const GREEN = '\x1b[32m', RED = '\x1b[31m', YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m', BLUE = '\x1b[34m'

function rel(abs: string, cwd: string) {
  return abs.startsWith(cwd + '/') ? abs.slice(cwd.length + 1) : abs
}

function renderDepTree(
  changedAbs: string,
  affectedTests: string[],
  reason: 'direct' | 'dep' | 'fallback',
  graph: DepGraph,
  cwd: string,
): string {
  const lines: string[] = []

  if (reason === 'fallback') {
    lines.push(`${YELLOW}${rel(changedAbs, cwd)}${RESET}  ${DIM}(not tracked — running all)${RESET}`)
    return lines.join('\n')
  }

  lines.push(`${CYAN}${rel(changedAbs, cwd)}${RESET}`)

  affectedTests.forEach((testFile, i) => {
    const isLast = i === affectedTests.length - 1
    const branch = isLast ? '└─' : '├─'
    const path = getImportPath(changedAbs, testFile, graph)
    // Intermediate files are everything between changedFile and testFile
    const via = path.slice(1, -1)

    const viaStr = via.length > 0
      ? `  ${DIM}via ${via.map(f => rel(f, cwd)).join(' → ')}${RESET}`
      : ''

    lines.push(`  ${DIM}${branch}${RESET} ${GREEN}${rel(testFile, cwd)}${RESET}${viaStr}`)
  })

  return lines.join('\n')
}

// ─── 4. Branch: watch vs single run ───────────────────────────────────────────

const watchMode = process.argv.includes('--watch')

if (watchMode) {
  const { watch } = await import('node:fs')
  const { spawn } = await import('node:child_process')
  const { fileURLToPath } = await import('node:url')
  const { glob } = await import('glob')

  const cwd = process.cwd()
  const tsxBin = resolve(cwd, 'node_modules', '.bin', 'tsx')
  const scriptPath = fileURLToPath(import.meta.url)
  const globPattern = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) ?? 'src/**/*.test.{ts,tsx}'

  let child: ReturnType<typeof spawn> | null = null
  let debounce: ReturnType<typeof setTimeout> | null = null

  function spawnRun(files: string[]) {
    child?.kill()
    child = spawn(tsxBin, [scriptPath, ...files], { stdio: 'inherit' })
  }

  // Initial full run
  const initial = (await glob(globPattern, { cwd })).map(f => resolve(cwd, f))
  console.log(`\n${CYAN}${BOLD}ViewTest${RESET} ${DIM}watch${RESET}\n`)
  console.log(`${DIM}watching src/  •  ${initial.length} test file(s) found${RESET}\n`)
  spawnRun(initial)

  watch(resolve(cwd, 'src'), { recursive: true }, async (_, filename) => {
    if (!filename?.match(/\.(ts|tsx)$/)) return
    if (debounce) clearTimeout(debounce)

    debounce = setTimeout(async () => {
      const changedAbs = resolve(cwd, 'src', filename)
      const freshTestFiles = (await glob(globPattern, { cwd })).map(f => resolve(cwd, f))
      const graph = buildDepGraph(freshTestFiles)

      const affected = graph.dependents.get(changedAbs)
      let filesToRun: string[]
      let reason: 'direct' | 'dep' | 'fallback'

      if (affected && affected.size > 0) {
        filesToRun = [...affected]
        const isDirect = freshTestFiles.includes(changedAbs)
        reason = isDirect ? 'direct' : 'dep'
      } else {
        filesToRun = freshTestFiles
        reason = 'fallback'
      }

      // Print the dep tree before spawning the child run
      process.stdout.write('\n' + renderDepTree(changedAbs, filesToRun, reason, graph, cwd) + '\n\n')
      spawnRun(filesToRun)
    }, 120)
  })

  process.on('SIGINT', () => { child?.kill(); process.exit(0) })
  process.stdin.resume()

} else {
  // ─── Single run ─────────────────────────────────────────────────────────────

  const { glob } = await import('glob')
  const { pathToFileURL } = await import('node:url')
  const { isAbsolute } = await import('node:path')

  const cwd = process.cwd()
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'))

  let files: string[]
  if (args.length === 0) {
    files = (await glob('src/**/*.test.{ts,tsx}', { cwd })).map(f => resolve(cwd, f))
  } else if (args.length === 1 && (args[0].includes('*') || args[0].includes('{'))) {
    files = (await glob(args[0], { cwd })).map(f => resolve(cwd, f))
  } else {
    files = args.map(f => isAbsolute(f) ? f : resolve(cwd, f)).filter(f => existsSync(f))
  }

  if (files.length === 0) {
    console.log(`${YELLOW}No test files found${RESET}`)
    process.exit(0)
  }

  console.log(`\n${CYAN}${BOLD}ViewTest${RESET} ${DIM}node runner${RESET}\n`)
  console.log(`${DIM}${files.length} file(s)${RESET}`)

  for (const file of files) await import(pathToFileURL(file).href)

  const { runAll, store } = await import('./index.js')
  await runAll()

  const { suites } = store.getState()
  let totalPass = 0, totalFail = 0, totalSkip = 0

  for (const suite of suites) {
    const icon = suite.status === 'pass' ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`
    console.log(`\n ${icon} ${BOLD}${suite.name}${RESET}`)

    for (const test of suite.tests) {
      if (test.status === 'skipped') {
        console.log(`   ${DIM}– ${test.name}${RESET}`); totalSkip++; continue
      }
      const ti = test.status === 'pass' ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`
      console.log(`   ${ti} ${test.status === 'pass' ? DIM : ''}${test.name}${RESET}`)
      for (const a of test.assertions) {
        const ai = a.status === 'pass' ? `${GREEN}·${RESET}` : `${RED}·${RESET}`
        console.log(`       ${ai} ${DIM}${a.label}${RESET}`)
        if (a.error) console.log(`         ${RED}${a.error}${RESET}`)
      }
      if (test.error && test.assertions.every(a => a.status === 'pass')) {
        console.log(`       ${RED}${test.error}${RESET}`)
      }
      test.status === 'pass' ? totalPass++ : totalFail++
    }
  }

  const total = totalPass + totalFail + totalSkip
  console.log(`\n${DIM}─────────────────────────────${RESET}`)
  const parts: string[] = []
  if (totalPass) parts.push(`${GREEN}${totalPass} passed${RESET}`)
  if (totalFail) parts.push(`${RED}${totalFail} failed${RESET}`)
  if (totalSkip) parts.push(`${DIM}${totalSkip} skipped${RESET}`)
  parts.push(`${DIM}${total} total${RESET}`)
  console.log(` ${parts.join('  ')}\n`)

  process.exit(totalFail > 0 ? 1 : 0)
}
