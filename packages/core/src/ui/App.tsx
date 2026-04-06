import { useState, useEffect, useRef, useCallback } from 'react'
import type { Store } from '../framework/store'
import type { StoreState, TestCase, RunProgress } from '../framework/types'
import { TestTree } from './components/TestTree'
import { Preview } from './components/Preview'
import { Gallery } from './components/Gallery'
import { CoverageExplorer } from './components/CoverageExplorer'
import { GraphView } from './components/GraphView'

export type AppView = 'detail' | 'gallery' | 'coverage' | 'graph'

const SANDBOX_NAME = '__vt_sandbox'

interface SandboxApi {
  store: Store
  runAll: () => Promise<void>
  runSuite: (id: string) => Promise<void>
  runTest: (suiteId: string, testId: string) => Promise<void>
}

const EMPTY_STATE: StoreState = {
  suites: [],
  running: false,
  lastRunAt: null,
  coverage: null,
  runProgress: null,
}

function formatEta(progress: RunProgress): string {
  const elapsed = Date.now() - progress.startedAt
  if (progress.done === 0) return ''
  const msPerTest = elapsed / progress.done
  const remaining = (progress.total - progress.done) * msPerTest
  if (remaining < 1000) return '<1s left'
  if (remaining < 60000) return `~${Math.ceil(remaining / 1000)}s left`
  return `~${Math.ceil(remaining / 60000)}m left`
}

function RunProgressToast({ progress }: { progress: RunProgress }) {
  // Tick every 500ms so the ETA stays fresh even between test completions
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 500)
    return () => clearInterval(id)
  }, [])

  const pct = progress.total > 0 ? (progress.done / progress.total) * 100 : 0
  const eta = formatEta(progress)
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 200,
      background: 'rgba(22,22,29,0.95)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid #2a2a36',
      borderRadius: 12,
      padding: '12px 16px',
      minWidth: 220,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="8 4" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" from="0 6 6" to="360 6 6" dur="0.8s" repeatCount="indefinite"/>
            </circle>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#c4c4d4' }}>Running tests</span>
        </div>
        {eta && <span style={{ fontSize: 11, color: '#6b7280' }}>{eta}</span>}
      </div>
      <div style={{ height: 4, background: '#2a2a36', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'linear-gradient(90deg, #6366f1, #818cf8)',
          borderRadius: 2, transition: 'width 0.1s ease-out',
        }} />
      </div>
      <div style={{ fontSize: 11, color: '#6b7280' }}>
        <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{progress.done}</span>
        {' / '}
        <span>{progress.total}</span>
        {' tests'}
      </div>
    </div>
  )
}

export function App() {
  const sandboxRef = useRef<HTMLIFrameElement>(null)
  const apiRef = useRef<SandboxApi | null>(null)
  const [state, setState] = useState<StoreState>(EMPTY_STATE)
  const [selected, setSelected] = useState<TestCase | null>(null)
  const [view, setView] = useState<AppView>('detail')
  const [search, setSearch] = useState('')
  const [sandboxReady, setSandboxReady] = useState(false)

  // Subscribe to sandbox store once it signals readiness
  useEffect(() => {
    let unsub: (() => void) | undefined
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type !== '__vt_ready') return
      const win = sandboxRef.current?.contentWindow as Record<string, unknown> | null | undefined
      const api = win?.['__viewtest'] as SandboxApi | undefined
      if (!api) return
      apiRef.current = api
      setState(api.store.getState())
      unsub = api.store.subscribe(s => {
        setState(s)
        setSelected(prev => prev
          ? s.suites.flatMap(su => su.tests).find(t => t.id === prev.id) ?? prev
          : prev
        )
      })
      setSandboxReady(true)
    }
    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
      unsub?.()
    }
  }, [])

  const handleSelect = useCallback((test: TestCase) => {
    setSelected(test)
    setView('detail')
  }, [])

  const handlePlayTest = useCallback((test: TestCase) => {
    setSelected(test)
    setView('detail')
    apiRef.current?.runTest(test.suiteId, test.id)
  }, [])

  const handleRunAll = useCallback(() => { setSelected(null); apiRef.current?.runAll() }, [])
  const handleRunSuite = useCallback((id: string) => { setSelected(null); apiRef.current?.runSuite(id) }, [])
  const handleRunTest = useCallback((sid: string, tid: string) => {
    const test = state.suites.flatMap(s => s.tests).find(t => t.suiteId === sid && t.id === tid)
    if (test) { setSelected(test); setView('detail') }
    apiRef.current?.runTest(sid, tid)
  }, [state.suites])

  return (
    <>
      {/* Hidden sandbox iframe — all test execution happens here */}
      <iframe
        ref={sandboxRef}
        name={SANDBOX_NAME}
        src="/"
        title="ViewTest Sandbox"
        style={{ position: 'fixed', width: 0, height: 0, border: 'none', top: 0, left: 0, pointerEvents: 'none' }}
      />

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <div style={{ width: 280, minWidth: 220, borderRight: '1px solid #2a2a36', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <TestTree
            state={state}
            selected={selected}
            search={search}
            view={view}
            onSelect={handleSelect}
            onSearchChange={setSearch}
            onViewChange={setView}
            onRunAll={handleRunAll}
            onRunSuite={handleRunSuite}
            onRunTest={handleRunTest}
          />
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {!sandboxReady ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b4b60', flexDirection: 'column', gap: 12 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="12 6" strokeLinecap="round">
                  <animateTransform attributeName="transform" type="rotate" from="0 10 10" to="360 10 10" dur="0.8s" repeatCount="indefinite"/>
                </circle>
              </svg>
              <span style={{ fontSize: 13 }}>Loading test sandbox…</span>
            </div>
          ) : view === 'gallery' ? (
            <Gallery state={state} search={search} onSelect={handleSelect} onPlayTest={handlePlayTest} />
          ) : view === 'coverage' ? (
            <CoverageExplorer
              coverage={state.coverage}
              suites={state.suites}
              onSelectTest={(suiteId, testId) => {
                const test = state.suites.flatMap(s => s.tests).find(t => t.suiteId === suiteId && t.id === testId)
                if (test) { setSelected(test); setView('detail') }
              }}
            />
          ) : view === 'graph' ? (
            <GraphView
              suites={state.suites}
              coverage={state.coverage}
              onSelectSuite={suiteId => {
                const suite = state.suites.find(s => s.id === suiteId)
                if (suite?.tests[0]) { setSelected(suite.tests[0]); setView('detail') }
              }}
            />
          ) : (
            <Preview
              test={selected}
              coverage={state.coverage}
              suites={state.suites}
              onSelectTest={(suiteId, testId) => {
                const test = state.suites.flatMap(s => s.tests).find(t => t.suiteId === suiteId && t.id === testId)
                if (test) setSelected(test)
              }}
            />
          )}
        </div>
      </div>

      {state.running && state.runProgress && (
        <RunProgressToast progress={state.runProgress} />
      )}
    </>
  )
}
