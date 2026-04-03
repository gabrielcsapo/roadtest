import { useState, useEffect } from 'react'
import { store, runAll, runSuite, runTest } from '../framework'
import type { StoreState, TestCase } from '../framework/types'
import { TestTree } from './components/TestTree'
import { Preview } from './components/Preview'

export function App() {
  const [state, setState] = useState<StoreState>(store.getState())
  const [selected, setSelected] = useState<TestCase | null>(null)

  useEffect(() => {
    const unsub = store.subscribe(s => {
      setState(s)
      setSelected(prev => prev
        ? s.suites.flatMap(su => su.tests).find(t => t.id === prev.id) ?? prev
        : prev
      )
    })
    runAll()
    return unsub
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ width: 280, minWidth: 220, borderRight: '1px solid #2a2a36', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <TestTree
          state={state}
          selected={selected}
          onSelect={setSelected}
          onRunAll={runAll}
          onRunSuite={runSuite}
          onRunTest={runTest}
        />
      </div>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Preview test={selected} />
      </div>
    </div>
  )
}
