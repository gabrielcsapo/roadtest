import { type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { setWrapper, setRenderTarget, setStopAfterFirstRender } from '../framework/render'
import { setCurrentSourceFile } from '../framework/dsl'
import { store } from '../framework/store'
import { runAll, runSuite, runTest } from '../framework/runner'

interface StartOptions {
  wrapper?: ComponentType<{ children: React.ReactNode }>
}

async function loadTestFiles(testFiles: Record<string, () => Promise<unknown>>) {
  for (const [path, loader] of Object.entries(testFiles)) {
    setCurrentSourceFile(path)
    try { await loader() } catch (e) { console.error(`[viewtest] Failed to load ${path}:`, e) }
  }
  setCurrentSourceFile(null)
}

export async function reloadFile(path: string, loader: () => Promise<unknown>) {
  if (window.name !== '__vt_sandbox') return
  store.removeSuitesForFile(path)
  setCurrentSourceFile(path)
  try { await loader() } catch (e) { console.error(`[viewtest] Failed to reload ${path}:`, e) }
  setCurrentSourceFile(null)
  const fresh = store.getState().suites.filter(s => s.sourceFile === path)
  for (const suite of fresh) runSuite(suite.id)
}

export async function startApp(
  testFiles: Record<string, () => Promise<unknown>>,
  options?: StartOptions,
) {
  // ── Sandbox frame: runs all tests ──────────────────────────────────────────
  if (window.name === '__vt_sandbox') {
    if (options?.wrapper) setWrapper(options.wrapper)
    await loadTestFiles(testFiles)
    ;(window as unknown as Record<string, unknown>)['__viewtest'] = {
      store, runAll, runSuite, runTest,
    }
    window.parent?.postMessage({ type: '__vt_ready' }, '*')
    return
  }

  // ── Display frame: renders selected test interactively ─────────────────────
  if (window.name === '__vt_display') {
    if (options?.wrapper) setWrapper(options.wrapper)
    await loadTestFiles(testFiles)

    // Minimal reset so only the component shows, with transparent background and flex centering
    Object.assign(document.documentElement.style, { background: 'transparent', overflow: 'visible', height: '100%' })
    Object.assign(document.body.style, {
      margin: '0', padding: '24px', background: 'transparent',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      boxSizing: 'border-box', minHeight: '100%',
    })
    const displayRoot = document.createElement('div')
    displayRoot.id = '__vt_display_root__'
    document.body.appendChild(displayRoot)

    async function showTest(suiteName: string, testName: string): Promise<boolean> {
      const { cleanup } = await import('@testing-library/react')
      cleanup()
      // Replace displayRoot's contents with a fresh element each time.
      // Reusing the same DOM node as a React root causes createRoot() to throw
      // on the second call (stale __reactContainer$ property), which is silently
      // swallowed and leaves the canvas empty.
      displayRoot.innerHTML = ''
      const container = document.createElement('div')
      displayRoot.appendChild(container)

      const test = store.getState().suites
        .find(s => s.name === suiteName)?.tests.find(t => t.name === testName)
      if (!test) return false

      setRenderTarget(container)
      setStopAfterFirstRender(true)
      try {
        await test.fn()
      } catch (e: unknown) {
        // Swallow the display-stop sentinel and any assertion errors
        if (!(e instanceof Error) || !('__vtDisplayStop' in e)) {
          console.debug('[viewtest display]', e)
        }
      } finally {
        setRenderTarget(null)
        setStopAfterFirstRender(false)
      }

      return container.innerHTML !== ''
    }

    ;(window as unknown as Record<string, unknown>)['__vtDisplay'] = { showTest, displayRoot }
    window.parent?.postMessage({ type: '__vt_display_ready' }, '*')
    return
  }

  // ── UI frame: mounts the React app ─────────────────────────────────────────
  createRoot(document.getElementById('root')!).render(<App />)
}
