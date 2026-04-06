import { Window } from 'happy-dom'
import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import type { DepGraph } from './cache.js'
import { getCacheDir, computeCacheKey, readCache, writeCache, clearCache } from './cache.js'
import { parseShardArg, applySharding, getResultsDir, writeShardResult, readAllShardResults, mergeShardResults } from './shard.js'
import { serializeTestSuite } from './serialize.js'
import type { SerializableTestSuite } from './serialize.js'

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

function renderResults(suites: SerializableTestSuite[]): { totalPass: number; totalFail: number; totalSkip: number } {
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
  const shardArg = args.find(a => a.startsWith('--shard='))?.slice('--shard='.length)
  const cwd = process.cwd()

  // ── --clear-cache ──────────────────────────────────────────────────────────
  if (clearCacheFlag) {
    clearCache(getCacheDir(cwd))
    console.log(`${CYAN}${BOLD}ViewTest${RESET} ${DIM}cache cleared${RESET}`)
    return
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
  let cachedTestCount = 0

  for (const file of files) {
    const key = computeCacheKey(file, graph)
    const entry = readCache(cacheDir, key)
    if (entry) {
      cacheHits.push(...entry.suites)
      cachedTestCount += entry.suites.reduce((sum, s) => sum + s.tests.length, 0)
    } else {
      cacheMisses.push(file)
    }
  }

  const cacheInfo = cachedTestCount > 0
    ? `  ${DIM}${cacheHits.length} files cached (${cacheMisses.length} to run)${RESET}`
    : `  ${DIM}${files.length} file(s)${RESET}`
  console.log(cacheInfo)

  // ── Run cache misses ───────────────────────────────────────────────────────
  const freshSuites: SerializableTestSuite[] = []

  if (cacheMisses.length > 0) {
    // setCurrentSourceFile must be called before each import so suite.sourceFile
    // is populated. Imports are sequential to avoid races on the shared global.
    const { setCurrentSourceFile, runAll, store } = await import('@viewtest/core')

    for (const file of cacheMisses) {
      setCurrentSourceFile(file)
      await import(pathToFileURL(file).href)
    }
    setCurrentSourceFile(null)

    await runAll()

    const { suites } = store.getState()

    // Group suites back to their source file, write each to cache
    for (const file of cacheMisses) {
      const fileSuites = suites.filter(s => s.sourceFile === file)
      const serialized = fileSuites.map(serializeTestSuite)
      freshSuites.push(...serialized)

      const key = computeCacheKey(file, graph)
      const fileCoverage = fileSuites
        .flatMap(s => s.tests.map(t => t.testCoverage))
        .filter(Boolean)
        .reduce<Record<string, unknown>>((acc, c) => Object.assign(acc, c), {})
      writeCache(cacheDir, key, {
        suites: serialized,
        coverage: Object.keys(fileCoverage).length > 0 ? fileCoverage as never : null,
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

  const { totalPass, totalFail, totalSkip } = renderResults(allSuites)
  printSummary(totalPass, totalFail, totalSkip, Date.now() - runStart, cachedTestCount)

  // ── Write shard result file ────────────────────────────────────────────────
  if (shard) {
    writeShardResult(getResultsDir(cwd), {
      shard,
      completedAt: Date.now(),
      suites: allSuites,
      coverage: null, // full coverage merge happens at --merge-shards time
    })
    console.log(`${DIM}shard result written → .viewtest/results/shard-${shard.index}-of-${shard.total}.json${RESET}\n`)
  }

  process.exit(totalFail > 0 ? 1 : 0)
}
