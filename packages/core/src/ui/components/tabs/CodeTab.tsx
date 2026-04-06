import { useState, useEffect, useCallback } from 'react'
import type { IstanbulFileCoverage, IstanbulCoverage, TestSuite } from '../../../framework/types'
import {
  computeLineCoverage, getEmbeddedSource,
  buildLineTestIndex, TestsModal,
} from '../coverageUtils'
import type { TestRef } from '../coverageUtils'

function coveragePct(fileCov: IstanbulFileCoverage): number {
  const stmts = Object.values(fileCov.s)
  if (stmts.length === 0) return 100
  const hit = stmts.filter(n => n > 0).length
  return Math.round((hit / stmts.length) * 100)
}

function pctColor(pct: number): string {
  if (pct >= 80) return '#22c55e'
  if (pct >= 50) return '#f59e0b'
  return '#ef4444'
}

function findFileForSuite(suiteName: string, coverage: IstanbulCoverage): string | null {
  const lower = suiteName.toLowerCase()
  const candidates = Object.keys(coverage).filter(p => {
    if (p.includes('.test.') || p.includes('.spec.')) return false
    const base = p.split('/').pop()?.toLowerCase() ?? ''
    return base.startsWith(lower) && /\.(tsx?|jsx?)$/.test(p)
  })
  return candidates[0] ?? null
}

function shortPath(absPath: string): string {
  const match = absPath.match(/\/src\/(.+)$/)
  return match ? `src/${match[1]}` : absPath.split('/').pop() ?? absPath
}

// ── FileView ─────────────────────────────────────────────────────────────────

interface FileViewProps {
  fileCov: IstanbulFileCoverage
  testFileCov: IstanbulFileCoverage | null
  source: string
  suites: TestSuite[]
  selectedFilePath: string
  onSelectTest: (suiteId: string, testId: string) => void
}

function FileView({ fileCov, testFileCov, source, suites, selectedFilePath, onSelectTest }: FileViewProps) {
  const [modal, setModal] = useState<{ lineNum: number; tests: TestRef[] } | null>(null)
  const handleLineClick = useCallback((lineNum: number, tests: TestRef[]) => setModal({ lineNum, tests }), [])

  // Lines touched by THIS test (purple), fall back to overall if no per-test data
  const activeCov = testFileCov ?? fileCov
  const { covered: thisCovered, uncovered } = computeLineCoverage(activeCov)
  const hasTestCov = testFileCov !== null

  // Cross-test index: which tests cover each line
  const { map: testMap, totalTestsForFile } = buildLineTestIndex(selectedFilePath, suites)

  const lines = source.split('\n')

  return (
    <div>
      {/* File header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderBottom: '1px solid #2a2a36', background: '#16161d' }}>
        <span style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>{shortPath(fileCov.path)}</span>
        <span style={{ fontSize: 11, color: '#4b4b60' }}>
          {hasTestCov ? 'lines touched by this test' : 'overall coverage'}
        </span>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, padding: '8px 20px', borderBottom: '1px solid #2a2a36', background: '#0d0d11' }}>
        {[
          { color: hasTestCov ? 'rgba(99,102,241,0.35)' : 'rgba(34,197,94,0.25)', label: hasTestCov ? 'Touched by this test' : 'Covered' },
          { color: 'rgba(239,68,68,0.25)', label: 'Not covered' },
          ...(totalTestsForFile > 0 ? [{ color: 'rgba(245,158,11,0.3)', label: 'Partial coverage (click)' }] : []),
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b4b60' }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: color, border: '1px solid rgba(255,255,255,0.1)' }} />
            {label}
          </div>
        ))}
      </div>

      {/* Source lines */}
      <div style={{ fontFamily: 'monospace', fontSize: 12, overflowX: 'auto' }}>
        {lines.map((text, i) => {
          const lineNum = i + 1
          const isCoveredByThis = thisCovered.has(lineNum)
          const isUncovered = uncovered.has(lineNum)
          const allTests = testMap.get(lineNum) ?? []
          const isPartial = allTests.length > 0 && totalTestsForFile > 0 && allTests.length < totalTestsForFile
          const clickable = allTests.length > 0

          // Background: partial coverage (amber) > this test (purple) > overall green > red > nothing
          const bg = isPartial
            ? 'rgba(245,158,11,0.1)'
            : isCoveredByThis
            ? hasTestCov ? 'rgba(99,102,241,0.1)' : 'rgba(34,197,94,0.08)'
            : isUncovered ? 'rgba(239,68,68,0.1)' : 'transparent'

          const gutterColor = isPartial
            ? '#f59e0b'
            : isCoveredByThis
            ? hasTestCov ? '#6366f1' : '#22c55e'
            : isUncovered ? '#ef4444' : 'transparent'

          return (
            <div
              key={i}
              onClick={clickable ? () => handleLineClick(lineNum, allTests) : undefined}
              title={
                clickable
                  ? isPartial
                    ? `${allTests.length}/${totalTestsForFile} tests — click to see`
                    : `All ${allTests.length} tests — click to see`
                  : undefined
              }
              style={{ display: 'flex', background: bg, minHeight: 20, cursor: clickable ? 'pointer' : 'default' }}
            >
              <div style={{ width: 3, flexShrink: 0, background: gutterColor }} />
              <div style={{ width: 40, flexShrink: 0, textAlign: 'right', paddingRight: 12, color: '#3a3a4e', userSelect: 'none', lineHeight: '20px' }}>
                {lineNum}
              </div>
              <pre style={{ margin: 0, padding: '0 16px', color: '#c4c4d4', lineHeight: '20px', whiteSpace: 'pre', flex: 1 }}>
                {text || ' '}
              </pre>
              {clickable && (
                <div style={{ paddingRight: 10, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{
                    fontSize: 10, fontWeight: isPartial ? 700 : 400,
                    color: isPartial ? '#f59e0b' : '#4b4b60',
                    background: isPartial ? 'rgba(245,158,11,0.15)' : '#1e1e2e',
                    border: `1px solid ${isPartial ? 'rgba(245,158,11,0.4)' : '#2a2a36'}`,
                    borderRadius: 10, padding: '0 5px',
                  }}>
                    {totalTestsForFile > 0 ? `${allTests.length}/${totalTestsForFile}` : allTests.length}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {modal && (
        <TestsModal
          lineNum={modal.lineNum}
          tests={modal.tests}
          totalTests={totalTestsForFile}
          onSelect={onSelectTest}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

// ── CodeTab ───────────────────────────────────────────────────────────────────

interface Props {
  suiteName: string
  coverage: IstanbulCoverage | null
  testCoverage: IstanbulCoverage | null
  suites: TestSuite[]
  onSelectTest: (suiteId: string, testId: string) => void
}

export function CodeTab({ suiteName, coverage, testCoverage, suites, onSelectTest }: Props) {
  const [source, setSource] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)

  useEffect(() => {
    if (!coverage) return
    // Prefer a file from this test's own coverage; fall back to suite name heuristic
    const pool = testCoverage ?? coverage
    const match = findFileForSuite(suiteName, pool) ?? (testCoverage ? Object.keys(testCoverage).find(p => !p.includes('.test.') && !p.includes('.spec.')) ?? null : null)
    setSelectedPath(match)
  }, [suiteName, coverage, testCoverage])

  useEffect(() => {
    if (!selectedPath) return
    setSource(null)
    setError(null)
    const fileCov = coverage?.[selectedPath]
    const embedded = fileCov ? getEmbeddedSource(fileCov) : null
    if (embedded) { setSource(embedded); return }
    fetch(`/__viewtest_source__?path=${encodeURIComponent(selectedPath)}`)
      .then(r => r.ok ? r.text() : Promise.reject(`${r.status} ${r.statusText}`))
      .then(setSource)
      .catch((e: unknown) => setError(String(e)))
  }, [selectedPath, coverage])

  if (!coverage) {
    return (
      <div style={{ padding: '32px 20px', textAlign: 'center', color: '#4b4b60', fontSize: 13 }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>◌</div>
        Coverage not available — run <code style={{ color: '#a5b4fc' }}>viewtest --ui</code> to enable
      </div>
    )
  }

  // When per-test coverage is available, only show files the test actually touched
  const filePool = testCoverage
    ? Object.keys(testCoverage).filter(p => !p.includes('.test.') && !p.includes('.spec.'))
    : Object.keys(coverage).filter(p => !p.includes('.test.') && !p.includes('.spec.'))

  const sortedFiles = filePool.sort((a, b) => coveragePct(coverage[a] ?? coverage[b]) - coveragePct(coverage[b] ?? coverage[a]))

  if (sortedFiles.length === 0) {
    return (
      <div style={{ padding: '32px 20px', textAlign: 'center', color: '#4b4b60', fontSize: 13 }}>
        No instrumented source files found
      </div>
    )
  }

  const activeCov = selectedPath ? coverage[selectedPath] : null
  const activeTestCov = (selectedPath && testCoverage) ? (testCoverage[selectedPath] ?? null) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* File picker */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a36', background: '#16161d', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {sortedFiles.map(p => {
          const pct = coveragePct(coverage[p])
          const isActive = p === selectedPath
          return (
            <button
              key={p}
              onClick={() => setSelectedPath(p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '3px 8px', borderRadius: 5, border: '1px solid',
                borderColor: isActive ? 'rgba(99,102,241,0.5)' : '#2a2a36',
                background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: isActive ? '#a5b4fc' : '#6b7280',
                fontSize: 11, cursor: 'pointer',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: pctColor(pct), flexShrink: 0 }} />
              {shortPath(p)}
              <span style={{ color: pctColor(pct), fontWeight: 700 }}>{pct}%</span>
            </button>
          )
        })}
      </div>

      {!activeCov && (
        <div style={{ padding: '32px 20px', textAlign: 'center', color: '#4b4b60', fontSize: 13 }}>Select a file above</div>
      )}
      {activeCov && !source && !error && (
        <div style={{ padding: '32px 20px', textAlign: 'center', color: '#4b4b60', fontSize: 13 }}>Loading…</div>
      )}
      {error && (
        <div style={{ padding: '16px 20px', color: '#fca5a5', fontSize: 12, fontFamily: 'monospace' }}>
          Failed to load source: {error}
        </div>
      )}
      {activeCov && source && (
        <FileView
          fileCov={activeCov}
          testFileCov={activeTestCov}
          source={source}
          suites={suites}
          selectedFilePath={selectedPath!}
          onSelectTest={onSelectTest}
        />
      )}
    </div>
  )
}
