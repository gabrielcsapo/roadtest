import { useState, useEffect, useCallback } from 'react'
import type { IstanbulCoverage, IstanbulFileCoverage, TestSuite } from '../../framework/types'
import { computeLineCoverage, uncoveredFunctions, getEmbeddedSource, buildLineTestIndex, TestsModal } from './coverageUtils'
import type { TestRef, LineTestIndex } from './coverageUtils'

// ── helpers ─────────────────────────────────────────────────────────────────

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

function shortPath(absPath: string): string {
  const m = absPath.match(/\/src\/(.+)$/)
  return m ? `src/${m[1]}` : absPath.split('/').pop() ?? absPath
}


// ── FileEntry ────────────────────────────────────────────────────────────────

interface FileEntry {
  path: string
  fileCov: IstanbulFileCoverage | null
  pct: number
}

// ── SourceView ───────────────────────────────────────────────────────────────

function SourceView({ entry, lineTestIndex, onLineClick }: {
  entry: FileEntry
  lineTestIndex: LineTestIndex
  onLineClick: (lineNum: number, tests: TestRef[]) => void
}) {
  const [source, setSource] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSource(null)
    setError(null)
    // Prefer embedded source from Istanbul's inputSourceMap (avoids instrumented code)
    const embedded = entry.fileCov ? getEmbeddedSource(entry.fileCov) : null
    if (embedded) { setSource(embedded); return }
    fetch(`/__fieldtest_source__?path=${encodeURIComponent(entry.path)}`)
      .then(r => r.ok ? r.text() : Promise.reject(`${r.status}`))
      .then(setSource)
      .catch((e: unknown) => setError(String(e)))
  }, [entry.path, entry.fileCov])

  if (error) return (
    <div style={{ padding: '20px', color: '#fca5a5', fontSize: 12, fontFamily: 'monospace' }}>
      Failed to load: {error}
    </div>
  )

  if (!source) return (
    <div style={{ padding: '20px', color: '#4b4b60', fontSize: 13, textAlign: 'center' }}>Loading…</div>
  )

  const lines = source.split('\n')

  if (!entry.fileCov) {
    return (
      <div>
        <div style={{ padding: '10px 16px', background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.2)', fontSize: 12, color: '#fca5a5' }}>
          This file was never imported during any test — 0% coverage
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 12, overflowX: 'auto' }}>
          {lines.map((text, i) => (
            <div key={i} style={{ display: 'flex', background: 'rgba(239,68,68,0.06)', minHeight: 20 }}>
              <div style={{ width: 3, flexShrink: 0, background: '#ef4444' }} />
              <div style={{ width: 40, flexShrink: 0, textAlign: 'right', paddingRight: 12, color: '#3a3a4e', userSelect: 'none', lineHeight: '20px' }}>{i + 1}</div>
              <pre style={{ margin: 0, padding: '0 16px', color: '#6b7280', lineHeight: '20px', whiteSpace: 'pre', flex: 1 }}>{text || ' '}</pre>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const { covered, uncovered } = computeLineCoverage(entry.fileCov)
  const missing = uncoveredFunctions(entry.fileCov, lines)
  const { map: testMap, totalTestsForFile } = lineTestIndex

  return (
    <div>
      {missing.length > 0 && (
        <div style={{ padding: '10px 16px', background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid #2a2a36', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, flexShrink: 0 }}>Untested functions:</span>
          {missing.map(fn => (
            <span
              key={`${fn.line}-${fn.display}`}
              title={`Line ${fn.line}`}
              style={{ fontSize: 11, color: '#fca5a5', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, padding: '1px 8px', fontFamily: 'monospace', cursor: 'default' }}
            >
              {fn.display}
              <span style={{ color: '#6b7280', marginLeft: 5 }}>:{fn.line}</span>
            </span>
          ))}
        </div>
      )}
      <div style={{ fontFamily: 'monospace', fontSize: 12, overflowX: 'auto' }}>
        {lines.map((text, i) => {
          const lineNum = i + 1
          const isCovered = covered.has(lineNum)
          const isUncovered = uncovered.has(lineNum)
          const tests = testMap.get(lineNum) ?? []
          const clickable = isCovered && tests.length > 0
          // A line covered by ALL tests isn't interesting — highlight only partial coverage
          const isPartial = clickable && totalTestsForFile > 0 && tests.length < totalTestsForFile
          const bg = isCovered
            ? isPartial ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.08)'
            : isUncovered ? 'rgba(239,68,68,0.1)' : 'transparent'
          const gutterColor = isCovered
            ? isPartial ? '#f59e0b' : '#22c55e'
            : isUncovered ? '#ef4444' : 'transparent'

          return (
            <div
              key={i}
              onClick={clickable ? () => onLineClick(lineNum, tests) : undefined}
              title={
                clickable
                  ? isPartial
                    ? `${tests.length} of ${totalTestsForFile} tests — click to see`
                    : `All ${tests.length} tests — click to see`
                  : undefined
              }
              style={{
                display: 'flex', background: bg, minHeight: 20,
                cursor: clickable ? 'pointer' : 'default',
              }}
            >
              <div style={{ width: 3, flexShrink: 0, background: gutterColor }} />
              <div style={{ width: 40, flexShrink: 0, textAlign: 'right', paddingRight: 12, color: '#3a3a4e', userSelect: 'none', lineHeight: '20px' }}>
                {lineNum}
              </div>
              <pre style={{ margin: 0, padding: '0 16px', color: '#c4c4d4', lineHeight: '20px', whiteSpace: 'pre', flex: 1 }}>{text || ' '}</pre>
              {clickable && (
                <div style={{ paddingRight: 10, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{
                    fontSize: 10, fontWeight: isPartial ? 700 : 400,
                    color: isPartial ? '#f59e0b' : '#4b4b60',
                    background: isPartial ? 'rgba(245,158,11,0.15)' : '#1e1e2e',
                    border: `1px solid ${isPartial ? 'rgba(245,158,11,0.4)' : '#2a2a36'}`,
                    borderRadius: 10, padding: '0 5px',
                  }}>
                    {totalTestsForFile > 0 ? `${tests.length}/${totalTestsForFile}` : tests.length}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── CoverageExplorer ─────────────────────────────────────────────────────────

interface Props {
  coverage: IstanbulCoverage | null
  suites: TestSuite[]
  onSelectTest: (suiteId: string, testId: string) => void
}

export function CoverageExplorer({ coverage, suites, onSelectTest }: Props) {
  const [allFiles, setAllFiles] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [modal, setModal] = useState<{ lineNum: number; tests: TestRef[] } | null>(null)

  useEffect(() => {
    fetch('/__fieldtest_files__')
      .then(r => r.json() as Promise<string[]>)
      .then(files => {
        setAllFiles(files)
        if (files.length > 0 && !selected) {
          const sorted = [...files].sort((a, b) => {
            const pa = coverage?.[a] ? coveragePct(coverage[a]) : 0
            const pb = coverage?.[b] ? coveragePct(coverage[b]) : 0
            return pa - pb
          })
          setSelected(sorted[0])
        }
      })
      .catch(() => {})
  }, [coverage])

  const handleLineClick = useCallback((lineNum: number, tests: TestRef[]) => {
    setModal({ lineNum, tests })
  }, [])

  if (!coverage) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#4b4b60' }}>
        <svg width="40" height="40" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.4 }}>
          <rect x="1" y="7" width="2.5" height="6" rx="1" fill="currentColor" />
          <rect x="5" y="4" width="2.5" height="9" rx="1" fill="currentColor" />
          <rect x="9" y="1" width="2.5" height="12" rx="1" fill="currentColor" />
        </svg>
        <div style={{ fontSize: 14 }}>Run tests to see coverage</div>
        <div style={{ fontSize: 12, color: '#3a3a4e' }}>Coverage data is collected when running via <code style={{ color: '#a5b4fc' }}>viewtest --ui</code></div>
      </div>
    )
  }

  const coveredPaths = new Set(Object.keys(coverage))
  const allPaths = new Set([...allFiles, ...coveredPaths])
  const entries: FileEntry[] = [...allPaths]
    .filter(p => !p.includes('.test.') && !p.includes('.spec.'))
    .map(p => {
      const fileCov = coverage[p] ?? null
      return { path: p, fileCov, pct: fileCov ? coveragePct(fileCov) : 0 }
    })
    .sort((a, b) => a.pct - b.pct)

  const totalStmts = entries.reduce((n, e) => n + (e.fileCov ? Object.keys(e.fileCov.s).length : 0), 0)
  const coveredStmts = entries.reduce((n, e) => n + (e.fileCov ? Object.values(e.fileCov.s).filter(c => c > 0).length : 0), 0)
  const overallPct = totalStmts === 0 ? 0 : Math.round((coveredStmts / totalStmts) * 100)
  const fullyTested = entries.filter(e => e.pct === 100).length
  const untested = entries.filter(e => e.pct === 0).length

  const selectedEntry = selected ? entries.find(e => e.path === selected) ?? null : null
  const lineTestIndex = selected
    ? buildLineTestIndex(selected, suites)
    : { map: new Map<number, TestRef[]>(), totalTestsForFile: 0 }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Summary header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #2a2a36', background: '#16161d', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#c4c4d4' }}>Coverage Explorer</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: pctColor(overallPct) }}>{overallPct}%</span>
          <span style={{ fontSize: 12, color: '#4b4b60' }}>{coveredStmts} / {totalStmts} statements</span>
          <span style={{ fontSize: 12, color: '#22c55e' }}>{fullyTested} fully covered</span>
          {untested > 0 && <span style={{ fontSize: 12, color: '#ef4444' }}>{untested} untested</span>}
          <div style={{ marginLeft: 'auto', fontSize: 11, color: '#3a3a4e' }}>
            Click a covered line to see which tests cover it
          </div>
        </div>
        <div style={{ height: 4, background: '#2a2a36', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${overallPct}%`, background: pctColor(overallPct), borderRadius: 2, transition: 'width 0.3s' }} />
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* File sidebar */}
        <div style={{ width: 240, minWidth: 180, borderRight: '1px solid #2a2a36', overflowY: 'auto', background: '#16161d' }}>
          {entries.map(entry => {
            const isActive = entry.path === selected
            return (
              <button
                key={entry.path}
                onClick={() => setSelected(entry.path)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 12px',
                  background: isActive ? '#1e1e2e' : 'transparent',
                  borderLeft: `2px solid ${isActive ? '#6366f1' : 'transparent'}`,
                  border: 'none', borderLeftWidth: 2, borderLeftStyle: 'solid',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ width: 28, height: 4, background: '#2a2a36', borderRadius: 2, flexShrink: 0, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${entry.pct}%`, background: pctColor(entry.pct), borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 11, color: pctColor(entry.pct), fontWeight: 700, flexShrink: 0, width: 30 }}>
                  {entry.pct}%
                </span>
                <span style={{ fontSize: 11, color: isActive ? '#c4c4d4' : '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {shortPath(entry.path)}
                </span>
              </button>
            )
          })}
        </div>

        {/* Source pane */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#0f0f13' }}>
          {selectedEntry ? (
            <>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid #2a2a36', background: '#16161d', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 1 }}>
                <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#6b7280' }}>{shortPath(selectedEntry.path)}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: pctColor(selectedEntry.pct), background: `${pctColor(selectedEntry.pct)}1a`, border: `1px solid ${pctColor(selectedEntry.pct)}40`, borderRadius: 4, padding: '1px 6px' }}>
                  {selectedEntry.pct}% statements
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                  {[
                    { color: 'rgba(34,197,94,0.3)', label: 'Covered' },
                    { color: 'rgba(239,68,68,0.3)', label: 'Not covered' },
                  ].map(({ color, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#4b4b60' }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
              <SourceView
                entry={selectedEntry}
                lineTestIndex={lineTestIndex}
                onLineClick={handleLineClick}
              />
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#4b4b60', fontSize: 13 }}>
              Select a file
            </div>
          )}
        </div>
      </div>

      {modal && (
        <TestsModal
          lineNum={modal.lineNum}
          tests={modal.tests}
          totalTests={lineTestIndex.totalTestsForFile}
          onSelect={onSelectTest}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
