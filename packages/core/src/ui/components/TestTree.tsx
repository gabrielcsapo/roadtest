import { useState } from 'react'
import type { StoreState, TestCase, TestSuite } from '../../framework/types'
import { StatusIcon } from './StatusIcon'
import type { AppView } from '../App'

interface Props {
  state: StoreState
  selected: TestCase | null
  search: string
  view: AppView
  onSelect: (test: TestCase) => void
  onSearchChange: (q: string) => void
  onViewChange: (v: AppView) => void
  onRunAll: () => void
  onRunSuite: (suiteId: string) => void
  onRunTest: (suiteId: string, testId: string) => void
}

function RunButton({ onClick, disabled }: { onClick: (e: React.MouseEvent) => void; disabled: boolean }) {
  const [hover, setHover] = useState(false)
  return (
    <span
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title="Run"
      style={{
        marginLeft: 'auto', flexShrink: 0,
        width: 18, height: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 4,
        background: hover && !disabled ? 'rgba(99,102,241,0.3)' : 'transparent',
        color: disabled ? '#3a3a4e' : hover ? '#a5b4fc' : '#4b4b60',
        fontSize: 9,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.1s, color 0.1s',
      }}
    >
      ▶
    </span>
  )
}

function SuiteRow({
  suite, collapsed, onToggle, onRun, disabled, children,
}: {
  suite: TestSuite
  collapsed: boolean
  onToggle: () => void
  onRun: (e: React.MouseEvent) => void
  disabled: boolean
  children: React.ReactNode
}) {
  const [hover, setHover] = useState(false)
  return (
    <div>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ display: 'flex', alignItems: 'center' }}
      >
        <button
          onClick={onToggle}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 8px 6px 16px', background: 'transparent', border: 'none',
            cursor: 'pointer', textAlign: 'left', minWidth: 0,
          }}
        >
          <span style={{ color: '#6b7280', fontSize: 10, flexShrink: 0 }}>
            {collapsed ? '▶' : '▼'}
          </span>
          <StatusIcon status={suite.status} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#c4c4d4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {suite.name}
          </span>
        </button>
        <div style={{ paddingRight: 10, opacity: hover ? 1 : 0, transition: 'opacity 0.1s' }}>
          <RunButton onClick={onRun} disabled={disabled} />
        </div>
      </div>
      {!collapsed && children}
    </div>
  )
}

function TestRow({
  test, selected, onSelect, onRun, disabled,
}: {
  test: TestCase
  selected: boolean
  onSelect: () => void
  onRun: (e: React.MouseEvent) => void
  disabled: boolean
}) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center',
        background: selected ? '#1e1e2e' : 'transparent',
        borderLeft: selected ? '2px solid #6366f1' : '2px solid transparent',
      }}
    >
      <button
        onClick={onSelect}
        style={{
          flex: 1, display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '5px 4px 5px 34px', background: 'transparent',
          border: 'none', cursor: 'pointer', textAlign: 'left', minWidth: 0,
        }}
      >
        <StatusIcon status={test.status} />
        <span style={{ fontSize: 12, color: selected ? '#e2e2e8' : '#9898a8', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {test.name}
        </span>
      </button>
      {test.status !== 'skipped' && (
        <div style={{ paddingRight: 8, opacity: hover ? 1 : 0, transition: 'opacity 0.1s' }}>
          <RunButton onClick={onRun} disabled={disabled} />
        </div>
      )}
    </div>
  )
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function ViewToggle({ view, onChange }: { view: AppView; onChange: (v: AppView) => void }) {
  const btn = (v: AppView, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => onChange(v)}
      title={label}
      style={{
        background: view === v ? 'rgba(99,102,241,0.2)' : 'transparent',
        border: 'none', borderRadius: 4, padding: '3px 6px',
        cursor: 'pointer', color: view === v ? '#818cf8' : '#4b4b60',
        display: 'flex', alignItems: 'center',
      }}
    >
      {icon}
    </button>
  )

  return (
    <div style={{ display: 'flex', gap: 2, background: '#0f0f13', borderRadius: 6, padding: 2 }}>
      {btn('detail',
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="5" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        </svg>,
        'Detail view'
      )}
      {btn('gallery',
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        </svg>,
        'Gallery view'
      )}
      {btn('coverage',
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="7" width="2.5" height="6" rx="1" fill="currentColor" />
          <rect x="5" y="4" width="2.5" height="9" rx="1" fill="currentColor" />
          <rect x="9" y="1" width="2.5" height="12" rx="1" fill="currentColor" />
          <line x1="0" y1="13.4" x2="14" y2="13.4" stroke="currentColor" strokeWidth="1" />
        </svg>,
        'Coverage explorer'
      )}
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
        </svg>,
        'Graph view'
      )}
    </div>
  )
}

export function TestTree({ state, selected, search, view, onSelect, onSearchChange, onViewChange, onRunAll, onRunSuite, onRunTest }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setCollapsed(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const q = search.toLowerCase()
  const filteredSuites = state.suites.map(suite => ({
    ...suite,
    tests: suite.tests.filter(t =>
      !q || t.name.toLowerCase().includes(q) || suite.name.toLowerCase().includes(q)
    ),
  })).filter(s => s.tests.length > 0)

  const allTests = state.suites.flatMap(s => s.tests)
  const pass = allTests.filter(t => t.status === 'pass').length
  const fail = allTests.filter(t => t.status === 'fail').length
  const pending = allTests.filter(t => t.status === 'pending').length
  const total = allTests.filter(t => t.status !== 'skipped').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#16161d' }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #2a2a36', flexShrink: 0 }}>
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
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {state.running ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 4" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 6 6" to="360 6 6" dur="0.8s" repeatCount="indefinite"/>
                  </circle>
                </svg>
              ) : (
                <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1.5L9 6L1 10.5V1.5Z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Stats + last-run timestamp */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, marginBottom: 10 }}>
          {state.lastRunAt || state.running ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ color: '#22c55e' }}>✓ {pass}</span>
              {fail > 0 && <span style={{ color: '#ef4444' }}>✗ {fail}</span>}
              {pending > 0 && <span style={{ color: '#6b7280' }}>○ {pending}</span>}
              <span style={{ color: '#4b4b60' }}>{total} total</span>
            </div>
          ) : <span />}
          {state.lastRunAt && !state.running && (
            <span style={{ color: '#3a3a4e' }}>ran {formatTime(state.lastRunAt)}</span>
          )}
          {state.running && <span style={{ color: '#f59e0b' }}>running…</span>}
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#4b4b60', pointerEvents: 'none' }}
          >
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
              padding: '5px 8px 5px 26px', fontSize: 12, color: '#c4c4d4',
              outline: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = '#6366f1')}
            onBlur={e => (e.target.style.borderColor = '#2a2a36')}
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#4b4b60', cursor: 'pointer',
                fontSize: 14, lineHeight: 1, padding: 0,
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Suite list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {filteredSuites.length === 0 && search && (
          <div style={{ padding: '20px 16px', fontSize: 12, color: '#4b4b60', textAlign: 'center' }}>
            No tests match "{search}"
          </div>
        )}
        {filteredSuites.length > 0 && !state.running && !state.lastRunAt && (
          <div style={{ padding: '12px 16px', margin: '8px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>
            <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{allTests.length} tests ready</span>
            {' — '}click ▶ to run all or ▶ on a suite.<br />
            Tests re-run automatically on save.
          </div>
        )}
        {filteredSuites.map(suite => (
          <SuiteRow
            key={suite.id}
            suite={suite}
            collapsed={collapsed.has(suite.id)}
            onToggle={() => toggle(suite.id)}
            onRun={e => { e.stopPropagation(); onRunSuite(suite.id) }}
            disabled={state.running}
          >
            {suite.tests.map(test => (
              <TestRow
                key={test.id}
                test={test}
                selected={selected?.id === test.id}
                onSelect={() => onSelect(test)}
                onRun={e => { e.stopPropagation(); onRunTest(suite.id, test.id) }}
                disabled={state.running}
              />
            ))}
          </SuiteRow>
        ))}
      </div>
    </div>
  )
}
