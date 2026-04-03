import { useState } from 'react'
import type { StoreState, TestCase, TestSuite } from '../../framework/types'
import { StatusIcon } from './StatusIcon'

interface Props {
  state: StoreState
  selected: TestCase | null
  onSelect: (test: TestCase) => void
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

export function TestTree({ state, selected, onSelect, onRunAll, onRunSuite, onRunTest }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setCollapsed(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const pass = state.suites.flatMap(s => s.tests).filter(t => t.status === 'pass').length
  const fail = state.suites.flatMap(s => s.tests).filter(t => t.status === 'fail').length
  const total = state.suites.flatMap(s => s.tests).filter(t => t.status !== 'skipped').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#16161d' }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #2a2a36', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#a5b4fc', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            ViewTest
          </span>
          <button
            onClick={onRunAll}
            disabled={state.running}
            style={{
              padding: '4px 12px', borderRadius: 6, border: 'none',
              background: state.running ? '#1e1e2e' : '#6366f1',
              color: state.running ? '#6b7280' : '#fff',
              fontSize: 12, fontWeight: 600, cursor: state.running ? 'not-allowed' : 'pointer',
            }}
          >
            {state.running ? 'Running…' : 'Run all'}
          </button>
        </div>

        {/* Stats + last-run timestamp */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
          {total > 0 ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ color: '#22c55e' }}>✓ {pass}</span>
              {fail > 0 && <span style={{ color: '#ef4444' }}>✗ {fail}</span>}
              <span style={{ color: '#4b4b60' }}>{total} total</span>
            </div>
          ) : <span />}
          {state.lastRunAt && !state.running && (
            <span style={{ color: '#3a3a4e' }}>
              ran {formatTime(state.lastRunAt)}
            </span>
          )}
          {state.running && (
            <span style={{ color: '#f59e0b' }}>running…</span>
          )}
        </div>
      </div>

      {/* Suite list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {state.suites.map(suite => (
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
