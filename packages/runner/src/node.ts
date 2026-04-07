import { Window } from 'happy-dom'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findSourceMap, register } from 'node:module'
import { takeCoverage } from 'node:v8'
import type { Profiler } from 'node:inspector'

// Register the mock-hoisting loader hook for test files.
// Must happen before any test files are imported. The hook intercepts test
// files after tsx has processed them (receives JS), then rewrites static imports
// to __ftImport() calls and hoists mock() registrations before them —
// the same transform the Vite plugin applies in the browser runner.
register(new URL('./mock-loader-hooks.js', import.meta.url))
import type { DepGraph } from './cache.js'
import { getCacheDir, computeCacheKey, readCache, readCacheByTestFile, writeCache, clearCache } from './cache.js'
import { parseShardArg, applySharding, getResultsDir, writeShardResult, readAllShardResults, mergeShardResults } from './shard.js'
import { serializeTestSuite } from './serialize.js'
import type { SerializableTestSuite } from './serialize.js'
import type { IstanbulCoverage } from '@fieldtest/core'

// ─── V8 coverage via NODE_V8_COVERAGE ────────────────────────────────────────

type V8ScriptCoverage = Profiler.ScriptCoverage

/**
 * Flush V8 coverage to disk (NODE_V8_COVERAGE dir) and convert all source
 * files under srcDir to Istanbul format. Uses NODE_V8_COVERAGE which Node.js
 * sets up at process start — unlike the inspector Profiler API, it tracks
 * scripts loaded through tsx's ESM loader hook.
 */
async function readNodeCoverage(srcDir: string): Promise<IstanbulCoverage | null> {
  const covDir = process.env.NODE_V8_COVERAGE
  if (!covDir) return null

  // Flush current coverage counters to a JSON file in covDir
  takeCoverage()

  const files = readdirSync(covDir).filter(f => f.endsWith('.json'))
  if (files.length === 0) return null

  const { default: V8ToIstanbul } = await import('v8-to-istanbul')

  // Collect all source scripts from every written coverage file
  const srcScripts: V8ScriptCoverage[] = []
  for (const file of files) {
    try {
      const data = JSON.parse(readFileSync(join(covDir, file), 'utf-8')) as { result?: V8ScriptCoverage[] }
      if (!Array.isArray(data.result)) continue
      for (const script of data.result) {
        if (!script.url.startsWith('file://')) continue
        try {
          const p = fileURLToPath(script.url)
          if (p.startsWith(srcDir) && !p.includes('node_modules')) srcScripts.push(script)
        } catch { /* skip non-file URLs */ }
      }
    } catch { /* skip malformed files */ }
  }

  if (srcScripts.length === 0) return null

  // Convert V8 byte-range coverage to Istanbul statement/branch/function format.
  // tsx registers source maps with Node's source map registry so findSourceMap()
  // returns the map needed to translate byte offsets back to TypeScript lines.
  // Note: branch coverage accuracy is limited by esbuild's coarser source maps —
  // statement and function percentages are more reliable.
  const out: IstanbulCoverage = {}
  for (const script of srcScripts) {
    try {
      const filePath = fileURLToPath(script.url)
      const sm = findSourceMap(script.url)
      const sources = sm ? { sourceMap: { sourcemap: sm.payload } } : undefined
      const conv = new V8ToIstanbul(filePath, 0, sources as never)
      await conv.load()
      conv.applyCoverage(script.functions)
      Object.assign(out, conv.toIstanbul())
    } catch { /* skip files that fail conversion */ }
  }

  return Object.keys(out).length > 0 ? out : null
}

// ─── DOM environment ──────────────────────────────────────────────────────────

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

// ─── Dep graph ────────────────────────────────────────────────────────────────

function parseImports(content: string): string[] {
  const re = /(?:^|\s)(?:import|from)\s+['"]([^'"]+)['"]/gm
  const result: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) result.push(m[1])
  return result
}

function resolveImport(fromFile: string, imp: string): string | null {
  if (!imp.startsWith('.')) return null
  const base = resolve(dirname(fromFile), imp)
  for (const c of [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]) {
    if (existsSync(c)) return c
  }
  return null
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
  return path
}

// ─── ASCII tree renderer ──────────────────────────────────────────────────────

const RESET = '\x1b[0m', BOLD = '\x1b[1m', DIM = '\x1b[2m'
const GREEN = '\x1b[32m', RED = '\x1b[31m', YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'

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
    const via = path.slice(1, -1)
    const viaStr = via.length > 0
      ? `  ${DIM}via ${via.map(f => rel(f, cwd)).join(' → ')}${RESET}`
      : ''
    lines.push(`  ${DIM}${branch}${RESET} ${GREEN}${rel(testFile, cwd)}${RESET}${viaStr}`)
  })

  return lines.join('\n')
}

// ─── Result rendering ─────────────────────────────────────────────────────────

function renderResults(suites: SerializableTestSuite[], verbose = false): { totalPass: number; totalFail: number; totalSkip: number } {
  let totalPass = 0, totalFail = 0, totalSkip = 0

  for (const suite of suites) {
    let suitePass = 0, suiteFail = 0, suiteSkip = 0

    for (const test of suite.tests) {
      if (test.status === 'skipped') { suiteSkip++; totalSkip++; continue }
      test.status === 'pass' ? (suitePass++, totalPass++) : (suiteFail++, totalFail++)
    }

    if (verbose) {
      const icon = suite.status === 'pass' ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`
      console.log(`\n ${icon} ${BOLD}${suite.name}${RESET}`)

      for (const test of suite.tests) {
        if (test.status === 'skipped') {
          console.log(`   ${DIM}– ${test.name}${RESET}`); continue
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
      }
    } else {
      // Condensed: one line per suite with counts, then only failing tests
      const icon = suiteFail > 0 ? `${RED}✗${RESET}` : `${GREEN}✓${RESET}`
      const counts: string[] = []
      if (suitePass > 0) counts.push(`${GREEN}${suitePass} passed${RESET}`)
      if (suiteFail > 0) counts.push(`${RED}${suiteFail} failed${RESET}`)
      if (suiteSkip > 0) counts.push(`${DIM}${suiteSkip} skipped${RESET}`)
      console.log(`\n ${icon} ${BOLD}${suite.name}${RESET}  ${DIM}(${counts.join(', ')})${RESET}`)

      for (const test of suite.tests) {
        if (test.status !== 'fail') continue
        console.log(`   ${RED}✗${RESET} ${test.name}`)
        for (const a of test.assertions) {
          if (a.status !== 'fail') continue
          console.log(`       ${RED}·${RESET} ${DIM}${a.label}${RESET}`)
          if (a.error) console.log(`         ${RED}${a.error}${RESET}`)
        }
        if (test.error && test.assertions.every(a => a.status === 'pass')) {
          console.log(`       ${RED}${test.error}${RESET}`)
        }
      }
    }
  }

  return { totalPass, totalFail, totalSkip }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(2)}s`
  const m = Math.floor(s / 60)
  const rem = (s % 60).toFixed(0).padStart(2, '0')
  return `${m}m ${rem}s`
}

function printCoverage(coverage: IstanbulCoverage, cwd: string) {
  type FileStats = { stmts: number; stmtsCov: number; fns: number; fnsCov: number; branches: number; branchesCov: number }

  function fileStats(fc: IstanbulCoverage[string]): FileStats {
    const stmts = Object.keys(fc.statementMap ?? {}).length
    const stmtsCov = Object.values(fc.s).filter(v => (v as number) > 0).length
    const fns = Object.keys(fc.fnMap ?? {}).length
    const fnsCov = Object.values(fc.f).filter(v => (v as number) > 0).length
    const allBranches = Object.values(fc.b ?? {}).flat() as number[]
    const branches = allBranches.length
    const branchesCov = allBranches.filter(v => v > 0).length
    return { stmts, stmtsCov, fns, fnsCov, branches, branchesCov }
  }

  function pct(covered: number, total: number): number {
    return total === 0 ? 100 : Math.round(covered / total * 100)
  }

  function colorPct(covered: number, total: number): string {
    const p = pct(covered, total)
    const raw = `${p}%`.padStart(5)
    const color = p >= 80 ? GREEN : p >= 60 ? YELLOW : RED
    return `${color}${raw}${RESET}`
  }

  const entries = Object.entries(coverage)
    .filter(([p]) => !p.includes('.test.') && !p.includes('.spec.') && !p.includes('node_modules'))
    .sort(([a], [b]) => a.localeCompare(b))

  if (entries.length === 0) {
    console.log(`  ${DIM}no coverage data${RESET}`)
    return
  }

  const rows = entries.map(([path, fc]) => ({ path: rel(path, cwd), ...fileStats(fc) }))
  const maxPathLen = Math.max(20, ...rows.map(r => r.path.length))

  const totals = rows.reduce(
    (acc, r) => ({
      stmts: acc.stmts + r.stmts, stmtsCov: acc.stmtsCov + r.stmtsCov,
      fns: acc.fns + r.fns, fnsCov: acc.fnsCov + r.fnsCov,
      branches: acc.branches + r.branches, branchesCov: acc.branchesCov + r.branchesCov,
    }),
    { stmts: 0, stmtsCov: 0, fns: 0, fnsCov: 0, branches: 0, branchesCov: 0 },
  )

  const divider = `${DIM}${'─'.repeat(maxPathLen + 22)}${RESET}`
  const header = `  ${DIM}${'File'.padEnd(maxPathLen)}  Stmts  Branch    Fns${RESET}`

  console.log(`\n${CYAN}${BOLD}Coverage${RESET}`)
  console.log(divider)
  console.log(header)
  for (const r of rows) {
    console.log(`  ${DIM}${r.path.padEnd(maxPathLen)}${RESET}  ${colorPct(r.stmtsCov, r.stmts)}  ${colorPct(r.branchesCov, r.branches)}  ${colorPct(r.fnsCov, r.fns)}`)
  }
  console.log(divider)
  console.log(`  ${'Total'.padEnd(maxPathLen)}  ${colorPct(totals.stmtsCov, totals.stmts)}  ${colorPct(totals.branchesCov, totals.branches)}  ${colorPct(totals.fnsCov, totals.fns)}\n`)
}

function printSummary(totalPass: number, totalFail: number, totalSkip: number, durationMs?: number, cachedCount?: number) {
  const total = totalPass + totalFail + totalSkip
  console.log(`\n${DIM}─────────────────────────────${RESET}`)
  const parts: string[] = []
  if (totalPass) parts.push(`${GREEN}${totalPass} passed${RESET}`)
  if (totalFail) parts.push(`${RED}${totalFail} failed${RESET}`)
  if (totalSkip) parts.push(`${DIM}${totalSkip} skipped${RESET}`)
  parts.push(`${DIM}${total} total${RESET}`)
  if (durationMs !== undefined) parts.push(`${DIM}${formatDuration(durationMs)}${RESET}`)
  if (cachedCount) parts.push(`${DIM}${cachedCount} cached${RESET}`)
  console.log(` ${parts.join('  ')}\n`)
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function runNode() {
  const args = process.argv.slice(2)
  const watchMode = args.includes('--watch')
  const mergeShards = args.includes('--merge-shards')
  const clearCacheFlag = args.includes('--clear-cache')
  const coverageFlag = args.includes('--coverage')
  const verboseFlag = args.includes('--verbose')
  const shardArg = args.find(a => a.startsWith('--shard='))?.slice('--shard='.length)
  const outputJsonArg = args.find(a => a.startsWith('--output-json='))?.slice('--output-json='.length)
  const cwd = process.cwd()

  // ── --clear-cache ──────────────────────────────────────────────────────────
  if (clearCacheFlag) {
    clearCache(getCacheDir(cwd))
    console.log(`${CYAN}${BOLD}ViewTest${RESET} ${DIM}cache cleared${RESET}`)
    const otherArgs = args.filter(a => a !== '--clear-cache')
    if (otherArgs.length === 0) return
  }

  // ── --merge-shards ─────────────────────────────────────────────────────────
  if (mergeShards) {
    const resultsDir = getResultsDir(cwd)
    const shardResults = readAllShardResults(resultsDir)
    if (shardResults.length === 0) {
      console.log(`${YELLOW}No shard result files found in ${rel(resultsDir, cwd)}${RESET}`)
      process.exit(1)
    }

    const { suites, shards } = mergeShardResults(shardResults)
    console.log(`\n${CYAN}${BOLD}ViewTest${RESET} ${DIM}merged ${shards.length} shard(s)${RESET}\n`)

    const mergeStart = Date.now()
    const { totalPass, totalFail, totalSkip } = renderResults(suites)
    printSummary(totalPass, totalFail, totalSkip, Date.now() - mergeStart)
    process.exit(totalFail > 0 ? 1 : 0)
    return
  }

  // ── Watch mode ─────────────────────────────────────────────────────────────
  if (watchMode) {
    const { watch } = await import('node:fs')
    const { spawn } = await import('node:child_process')
    const { fileURLToPath } = await import('node:url')
    const { glob } = await import('glob')

    const tsxBin = resolve(cwd, 'node_modules', '.bin', 'tsx')
    const scriptPath = fileURLToPath(import.meta.url)
    const globPattern = args.find((a, i) => i > 0 && !a.startsWith('--')) ?? 'src/**/*.test.{ts,tsx}'

    let child: ReturnType<typeof spawn> | null = null
    let debounce: ReturnType<typeof setTimeout> | null = null

    function spawnRun(files: string[]) {
      child?.kill()
      child = spawn(tsxBin, [scriptPath, ...files], { stdio: 'inherit' })
    }

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

        process.stdout.write('\n' + renderDepTree(changedAbs, filesToRun, reason, graph, cwd) + '\n\n')
        spawnRun(filesToRun)
      }, 120)
    })

    process.on('SIGINT', () => { child?.kill(); process.exit(0) })
    process.stdin.resume()
    return
  }

  // ── Non-watch (run) mode ───────────────────────────────────────────────────
  const { glob } = await import('glob')
  const { pathToFileURL } = await import('node:url')
  const { isAbsolute } = await import('node:path')

  const positional = args.filter(a => !a.startsWith('--'))

  let files: string[]
  if (positional.length === 0) {
    files = (await glob('src/**/*.test.{ts,tsx}', { cwd })).map(f => resolve(cwd, f))
  } else if (positional.length === 1 && (positional[0].includes('*') || positional[0].includes('{'))) {
    files = (await glob(positional[0], { cwd })).map(f => resolve(cwd, f))
  } else {
    files = positional.map(f => isAbsolute(f) ? f : resolve(cwd, f)).filter(f => existsSync(f))
  }

  if (files.length === 0) {
    console.log(`${YELLOW}No test files found${RESET}`)
    process.exit(0)
  }

  // ── Sharding ───────────────────────────────────────────────────────────────
  const shard = shardArg ? parseShardArg(shardArg) : null
  if (shard) files = applySharding(files, shard)

  if (files.length === 0) {
    console.log(`${DIM}Shard ${shard!.index}/${shard!.total}: no files assigned to this shard${RESET}`)
    process.exit(0)
  }

  const shardLabel = shard ? ` ${DIM}[shard ${shard.index}/${shard.total}]${RESET}` : ''
  console.log(`\n${CYAN}${BOLD}ViewTest${RESET} ${DIM}node runner${RESET}${shardLabel}\n`)
  const runStart = Date.now()

  // ── Build dep graph + cache lookup ─────────────────────────────────────────
  const graph = buildDepGraph(files)
  const cacheDir = getCacheDir(cwd)

  const cacheHits: SerializableTestSuite[] = []
  const cacheMisses: string[] = []
  const cacheMissReasons = new Map<string, string[]>()
  const cacheKeys = new Map<string, { key: string; fileHashes: Record<string, string> }>()
  const cachedCoverage: IstanbulCoverage = {}
  let cachedTestCount = 0

  for (const file of files) {
    const computed = computeCacheKey(file, graph)
    cacheKeys.set(file, computed)
    const entry = readCache(cacheDir, computed.key)
    if (entry) {
      cacheHits.push(...entry.suites)
      cachedTestCount += entry.suites.reduce((sum, s) => sum + s.tests.length, 0)
      if (entry.coverage) Object.assign(cachedCoverage, entry.coverage)
    } else {
      cacheMisses.push(file)
      // Determine why: compare current hashes against the previously stored entry
      const oldEntry = readCacheByTestFile(cacheDir, file)
      if (oldEntry?.fileHashes) {
        const changed: string[] = []
        for (const [f, h] of Object.entries(computed.fileHashes)) {
          if (oldEntry.fileHashes[f] !== h) changed.push(rel(f, cwd))
        }
        for (const f of Object.keys(oldEntry.fileHashes)) {
          if (!(f in computed.fileHashes)) changed.push(`${rel(f, cwd)} (removed)`)
        }
        if (changed.length > 0) cacheMissReasons.set(file, changed)
      }
    }
  }

  if (cachedTestCount > 0) {
    console.log(`  ${DIM}${cacheHits.length} file(s) cached  •  ${cacheMisses.length} to run${RESET}`)
    for (const file of cacheMisses) {
      const reasons = cacheMissReasons.get(file)
      const why = reasons ? `  ${DIM}← ${reasons.join(', ')} changed${RESET}` : ''
      console.log(`  ${YELLOW}↺${RESET}  ${DIM}${rel(file, cwd)}${RESET}${why}`)
    }
  } else {
    console.log(`  ${DIM}${files.length} file(s)${RESET}`)
  }

  // ── Run cache misses ───────────────────────────────────────────────────────
  const freshSuites: SerializableTestSuite[] = []
  let freshCoverage: IstanbulCoverage | null = null

  if (cacheMisses.length > 0) {
    // setCurrentSourceFile must be called before each import so suite.sourceFile
    // is populated. Imports are sequential to avoid races on the shared global.
    const { setCurrentSourceFile, runAll, store } = await import('@fieldtest/core')

    for (const file of cacheMisses) {
      setCurrentSourceFile(file)
      await import(pathToFileURL(file).href)
    }
    setCurrentSourceFile(null)

    await runAll()

    // NODE_V8_COVERAGE was set by the bin script before this process started,
    // so all scripts are instrumented. Flush and convert now.
    freshCoverage = await readNodeCoverage(resolve(cwd, 'src'))

    const state = store.getState()

    // Group suites back to their source file, write each to cache
    for (const file of cacheMisses) {
      const fileSuites = state.suites.filter(s => s.sourceFile === file)
      const serialized = fileSuites.map(serializeTestSuite)
      freshSuites.push(...serialized)

      const { key, fileHashes } = cacheKeys.get(file)!
      writeCache(cacheDir, key, file, {
        suites: serialized,
        // Store the real V8 total coverage so subsequent cached runs can report it
        coverage: freshCoverage,
        fileHashes,
      })
    }
  }

  // ── Render results ─────────────────────────────────────────────────────────
  // Preserve original file order: cached hits first (in file order), then fresh
  const allSuites: SerializableTestSuite[] = []
  for (const file of files) {
    const fromCache = cacheHits.filter(s => s.sourceFile === file)
    const fromFresh = freshSuites.filter(s => s.sourceFile === file)
    allSuites.push(...fromCache, ...fromFresh)
  }

  // When only some files were re-run, only show those results — the rest haven't changed.
  // Summary totals still include everything.
  const partialRun = cacheMisses.length > 0 && cacheHits.length > 0
  const { totalPass, totalFail, totalSkip } = renderResults(partialRun ? freshSuites : allSuites, verboseFlag)

  let summaryPass = totalPass, summaryFail = totalFail, summarySkip = totalSkip
  if (partialRun) {
    summaryPass += cacheHits.reduce((n, s) => n + s.tests.filter(t => t.status === 'pass').length, 0)
    summaryFail += cacheHits.reduce((n, s) => n + s.tests.filter(t => t.status === 'fail').length, 0)
    summarySkip += cacheHits.reduce((n, s) => n + s.tests.filter(t => t.status === 'skipped').length, 0)
  }
  printSummary(summaryPass, summaryFail, summarySkip, Date.now() - runStart, cachedTestCount)

  // ── Coverage report ────────────────────────────────────────────────────────
  if (coverageFlag) {
    const merged: IstanbulCoverage = { ...cachedCoverage, ...freshCoverage }

    if (Object.keys(merged).length > 0) {
      printCoverage(merged, cwd)
    } else {
      console.log(`${DIM}No coverage data — run with --clear-cache if all tests were cached${RESET}\n`)
    }
  }

  // ── Write JSON output ──────────────────────────────────────────────────────
  if (outputJsonArg) {
    const outPath = resolve(cwd, outputJsonArg)
    const { writeFileSync, mkdirSync } = await import('node:fs')
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, JSON.stringify(allSuites, null, 2), 'utf-8')
    console.log(`${DIM}results written → ${outPath}${RESET}\n`)
  }

  // ── Write shard result file ────────────────────────────────────────────────
  if (shard) {
    writeShardResult(getResultsDir(cwd), {
      shard,
      completedAt: Date.now(),
      suites: allSuites,
      coverage: null, // full coverage merge happens at --merge-shards time
    })
    console.log(`${DIM}shard result written → .fieldtest/results/shard-${shard.index}-of-${shard.total}.json${RESET}\n`)
  }

  process.exit(totalFail > 0 ? 1 : 0)
}
