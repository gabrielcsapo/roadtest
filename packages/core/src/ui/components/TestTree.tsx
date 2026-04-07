import { useState, useDeferredValue, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { StoreState, TestCase, TestSuite } from '../../framework/types'
import { StatusIcon } from './StatusIcon'
import type { AppView } from '../App'

interface Props {
  state: StoreState
  selected: TestCase | null
  selectedSuiteId: string | null
  search: string
  view: AppView
  onSelect: (test: TestCase) => void
  onSelectSuite: (suiteId: string) => void
  onSearchChange: (q: string) => void
  onViewChange: (v: AppView) => void
  onRunAll: () => void
  onRunSuite: (suiteId: string) => void
  onRunTest: (suiteId: string, testId: string) => void
}

// ─── Flat item types for the virtual list ─────────────────────────────────────

type FlatItem =
  | { kind: 'suite'; suite: TestSuite }
  | { kind: 'test'; test: TestCase; suite: TestSuite }

const SUITE_H           = 33  // px — suite header row height (no file label)
const SUITE_H_WITH_FILE = 46  // px — suite header row height (with file label)
const TEST_H            = 28  // px — test row height

// ─── Row components ───────────────────────────────────────────────────────────

function RunButton({ onClick, disabled }: { onClick: (e: React.MouseEvent) => void; disabled: boolean }) {
  const [hover, setHover] = useState(false)
  return (
    <span
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title="Run"
      style={{
        flexShrink: 0, width: 18, height: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 4,
        background: hover && !disabled ? 'rgba(99,102,241,0.3)' : 'transparent',
        color: disabled ? '#3a3a4e' : hover ? '#a5b4fc' : '#4b4b60',
        fontSize: 9, cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.1s, color 0.1s',
      }}
    >▶</span>
  )
}

function SuiteRow({ suite, collapsed, selected, onToggle, onSelect, onRun, disabled }: {
  suite: TestSuite; collapsed: boolean; selected: boolean
  onToggle: () => void; onSelect: () => void; onRun: (e: React.MouseEvent) => void; disabled: boolean
}) {
  const [hover, setHover] = useState(false)
  const fileName = suite.sourceFile ? suite.sourceFile.split('/').pop() : null
  const rowHeight = fileName ? SUITE_H_WITH_FILE : SUITE_H
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', height: rowHeight,
        background: selected ? '#1e1e2e' : 'transparent',
        borderLeft: selected ? '2px solid #6366f1' : '2px solid transparent',
      }}
    >
      {/* Chevron — toggles collapse only */}
      <button
        onClick={onToggle}
        style={{
          flexShrink: 0, width: 28, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 10,
          paddingLeft: selected ? 14 : 16,
        }}
      >
        {collapsed ? '▶' : '▼'}
      </button>
      {/* Name area — selects the suite */}
      <button
        onClick={onSelect}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          padding: '0 8px 0 0', height: '100%',
          background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', minWidth: 0,
        }}
      >
        <StatusIcon status={suite.status} />
        <span style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: selected ? '#e2e2e8' : '#c4c4d4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {suite.name}
          </span>
          {fileName && (
            <span style={{ fontSize: 10, color: '#4b4b60', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
              {fileName}
            </span>
          )}
        </span>
        {suite.duration !== undefined && suite.status !== 'pending' && suite.status !== 'running' && (
          <span style={{ fontSize: 10, color: '#3a3a4e', flexShrink: 0, fontFamily: 'monospace' }}>
            {formatDuration(suite.duration)}
          </span>
        )}
      </button>
      <div style={{ paddingRight: 10, opacity: hover ? 1 : 0, transition: 'opacity 0.1s' }}>
        <RunButton onClick={onRun} disabled={disabled} />
      </div>
    </div>
  )
}

function TestRow({ test, selected, onSelect, onRun, disabled }: {
  test: TestCase; selected: boolean
  onSelect: () => void; onRun: (e: React.MouseEvent) => void; disabled: boolean
}) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', height: TEST_H,
        background: selected ? '#1e1e2e' : 'transparent',
        borderLeft: selected ? '2px solid #6366f1' : '2px solid transparent',
      }}
    >
      <button
        onClick={onSelect}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          padding: '0 4px 0 34px', height: '100%',
          background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', minWidth: 0,
        }}
      >
        <StatusIcon status={test.status} />
        <span style={{ fontSize: 12, color: selected ? '#e2e2e8' : '#9898a8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {test.name}
        </span>
        {test.duration !== undefined && test.status !== 'pending' && test.status !== 'running' && (
          <span style={{ fontSize: 10, color: '#3a3a4e', flexShrink: 0, fontFamily: 'monospace' }}>
            {formatDuration(test.duration)}
          </span>
        )}
      </button>
      {test.status !== 'skipped' && (
        <div style={{ paddingRight: 8, opacity: hover ? 1 : 0, transition: 'opacity 0.1s' }}>
          <RunButton onClick={onRun} disabled={disabled} />
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatDuration(ms: number): string {
  if (ms < 1) return '<1ms'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function ViewToggle({ view, onChange }: { view: AppView; onChange: (v: AppView) => void }) {
  const btn = (v: AppView, icon: React.ReactNode, label: string) => (
    <button onClick={() => onChange(v)} title={label} style={{
      background: view === v ? 'rgba(99,102,241,0.2)' : 'transparent',
      border: 'none', borderRadius: 4, padding: '3px 6px',
      cursor: 'pointer', color: view === v ? '#818cf8' : '#4b4b60',
      display: 'flex', alignItems: 'center',
    }}>{icon}</button>
  )
  return (
    <div style={{ display: 'flex', gap: 2, background: '#0f0f13', borderRadius: 6, padding: 2 }}>
      {btn('detail',
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="5" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        </svg>, 'Detail view')}
      {btn('gallery',
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        </svg>, 'Gallery view')}
      {btn('coverage',
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="7" width="2.5" height="6" rx="1" fill="currentColor" />
          <rect x="5" y="4" width="2.5" height="9" rx="1" fill="currentColor" />
          <rect x="9" y="1" width="2.5" height="12" rx="1" fill="currentColor" />
          <line x1="0" y1="13.4" x2="14" y2="13.4" stroke="currentColor" strokeWidth="1" />
        </svg>, 'Coverage explorer')}
      {btn('graph',
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="1.8" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="2" cy="2" r="1.2" stroke="currentColor" strokeWidth="1.1" />
          <circle cx="12" cy="2" r="1.2" stroke="currentColor" strokeWidth="1.1" />
          <circle cx="2" cy="12" r="1.2" stroke="currentColor" strokeWidth="1.1" />
          <circle cx="12" cy="12" r="1.2" stroke="currentColor" strokeWidth="1.1" />
          <line x1="3.2" y1="2.8" x2="5.5" y2="5.8" stroke="currentColor" strokeWidth="1" />
          <line x1="10.8" y1="2.8" x2="8.5" y2="5.8" stroke="currentColor" strokeWidth="1" />
          <line x1="3.2" y1="11.2" x2="5.5" y2="8.2" stroke="currentColor" strokeWidth="1" />
          <line x1="10.8" y1="11.2" x2="8.5" y2="8.2" stroke="currentColor" strokeWidth="1" />
        </svg>, 'Graph view')}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TestTree({ state, selected, selectedSuiteId, search, view, onSelect, onSelectSuite, onSearchChange, onViewChange, onRunAll, onRunSuite, onRunTest }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'default' | 'duration'>('default')
  const scrollRef = useRef<HTMLDivElement>(null)

  const toggle = (id: string) =>
    setCollapsed(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const deferredSearch = useDeferredValue(search)
  const q = deferredSearch.toLowerCase()
  const hasDurations = state.suites.some(s => s.duration !== undefined)

  // Filter suites/tests by search
  const filteredSuites = state.suites.map(suite => ({
    ...suite,
    tests: suite.tests.filter(t =>
      !q || t.name.toLowerCase().includes(q) || suite.name.toLowerCase().includes(q)
    ),
  })).filter(s => s.tests.length > 0)

  // Sort by duration when requested
  const sortedSuites = sortBy === 'duration' && hasDurations
    ? [...filteredSuites].sort((a, b) => (b.duration ?? -1) - (a.duration ?? -1))
    : filteredSuites

  // Flatten into a single array for the virtual list
  const items: FlatItem[] = []
  for (const suite of sortedSuites) {
    items.push({ kind: 'suite', suite })
    if (!collapsed.has(suite.id)) {
      for (const test of suite.tests) {
        items.push({ kind: 'test', test, suite })
      }
    }
  }

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => {
      const item = items[i]
      if (item?.kind === 'suite') {
        return item.suite.sourceFile ? SUITE_H_WITH_FILE : SUITE_H
      }
      return TEST_H
    },
    overscan: 10,
  })

  const allTests = state.suites.flatMap(s => s.tests)
  const pass    = allTests.filter(t => t.status === 'pass').length
  const fail    = allTests.filter(t => t.status === 'fail').length
  const pending = allTests.filter(t => t.status === 'pending').length
  const total   = allTests.filter(t => t.status !== 'skipped').length
  const totalDuration = state.lastRunAt && !state.running
    ? state.suites.reduce((sum, s) => sum + (s.duration ?? 0), 0)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#16161d' }}>

      {/* ── Header ── */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #2a2a36', flexShrink: 0 }}>

        {/* Title + controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#a5b4fc', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            ViewTest
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ViewToggle view={view} onChange={onViewChange} />
            <button
              onClick={onRunAll}
              disabled={state.running}
              title="Run all"
              style={{
                width: 28, height: 28, borderRadius: 6, border: 'none',
                background: state.running ? '#1e1e2e' : '#6366f1',
                color: state.running ? '#6b7280' : '#fff',
                cursor: state.running ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              {state.running
                ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 4" strokeLinecap="round"><animateTransform attributeName="transform" type="rotate" from="0 6 6" to="360 6 6" dur="0.8s" repeatCount="indefinite"/></circle></svg>
                : <svg width="10" height="12" viewBox="0 0 10 12" fill="none"><path d="M1 1.5L9 6L1 10.5V1.5Z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/></svg>
              }
            </button>
          </div>
        </div>

        {/* Stats card */}
        {(state.lastRunAt || state.running) && (
          <div style={{
            marginBottom: 10, borderRadius: 8,
            background: '#0f0f13', border: '1px solid #1e1e2e',
            padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            {/* Progress bar */}
            {total > 0 && (
              <div style={{ height: 3, borderRadius: 99, background: '#1e1e2e', overflow: 'hidden', display: 'flex' }}>
                <div style={{
                  height: '100%', width: `${(pass / total) * 100}%`,
                  background: '#22c55e', transition: 'width 0.2s ease-out', flexShrink: 0,
                }} />
                <div style={{
                  height: '100%', width: `${(fail / total) * 100}%`,
                  background: '#ef4444', transition: 'width 0.2s ease-out', flexShrink: 0,
                }} />
              </div>
            )}
            {/* Badges row */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', fontVariantNumeric: 'tabular-nums' }}>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
                background: 'rgba(34,197,94,0.12)', color: '#22c55e',
              }}>✓ {pass}</span>
              {fail > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
                  background: 'rgba(239,68,68,0.12)', color: '#ef4444',
                }}>✗ {fail}</span>
              )}
              {pending > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
                  background: '#1e1e2e', color: '#6b7280',
                }}>○ {pending}</span>
              )}
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
                background: '#1e1e2e', color: '#4b4b60', marginLeft: 'auto',
              }}>{total} tests</span>
            </div>
            {/* Timestamp + duration */}
            {state.lastRunAt && !state.running && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#3a3a4e' }}>
                <span>{formatTime(state.lastRunAt)}</span>
                {totalDuration !== null && <span style={{ fontFamily: 'monospace' }}>{formatDuration(totalDuration)}</span>}
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
            style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#4b4b60', pointerEvents: 'none' }}>
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
            <line x1="7.5" y1="7.5" x2="11" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search tests…"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#0f0f13', border: '1px solid #2a2a36', borderRadius: 6,
              padding: '5px 8px 5px 26px', fontSize: 12, color: '#c4c4d4', outline: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = '#6366f1')}
            onBlur={e => (e.target.style.borderColor = '#2a2a36')}
          />
          {search && (
            <button onClick={() => onSearchChange('')} style={{
              position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: '#4b4b60', cursor: 'pointer',
              fontSize: 14, lineHeight: 1, padding: 0,
            }}>×</button>
          )}
        </div>

        {/* Sort — shown after first run */}
        {hasDurations && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 10, color: '#4b4b60', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sort</span>
            <div style={{ display: 'flex', gap: 2, background: '#0f0f13', borderRadius: 5, padding: 2 }}>
              {(['default', 'duration'] as const).map(opt => (
                <button key={opt} onClick={() => setSortBy(opt)} style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 3, border: 'none', cursor: 'pointer',
                  background: sortBy === opt ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: sortBy === opt ? '#a5b4fc' : '#4b4b60',
                  fontWeight: sortBy === opt ? 600 : 400,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {opt === 'duration' && (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <line x1="1" y1="8" x2="1" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <line x1="4.5" y1="8" x2="4.5" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <line x1="8" y1="8" x2="8" y2="0.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                  {opt === 'default' ? 'Default' : 'Slowest first'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Virtual list ── */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>

        {/* Empty / ready states */}
        {items.length === 0 && q && (
          <div style={{ padding: '20px 16px', fontSize: 12, color: '#4b4b60', textAlign: 'center' }}>
            No tests match "{search}"
          </div>
        )}
        {sortedSuites.length > 0 && !state.running && !state.lastRunAt && (
          <div style={{ padding: '12px 16px', margin: '8px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>
            <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{allTests.length} tests ready</span>
            {' — '}click ▶ to run all or ▶ on a suite.<br />
            Tests re-run automatically on save.
          </div>
        )}

        {/* Virtualised rows */}
        {items.length > 0 && (
          <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
            {virtualizer.getVirtualItems().map(vItem => {
              const item = items[vItem.index]
              return (
                <div
                  key={vItem.key}
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '100%',
                    transform: `translateY(${vItem.start}px)`,
                  }}
                >
                  {item.kind === 'suite' ? (
                    <SuiteRow
                      suite={item.suite}
                      collapsed={collapsed.has(item.suite.id)}
                      selected={selectedSuiteId === item.suite.id}
                      onToggle={() => toggle(item.suite.id)}
                      onSelect={() => onSelectSuite(item.suite.id)}
                      onRun={e => { e.stopPropagation(); onRunSuite(item.suite.id) }}
                      disabled={state.running}
                    />
                  ) : (
                    <TestRow
                      test={item.test}
                      selected={selected?.id === item.test.id}
                      onSelect={() => onSelect(item.test)}
                      onRun={e => { e.stopPropagation(); onRunTest(item.suite.id, item.test.id) }}
                      disabled={state.running}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
