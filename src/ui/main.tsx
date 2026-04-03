import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

/**
 * Import all test files. Vite's glob import discovers them automatically.
 * Each file registers its describe/it blocks into the global store as a
 * side-effect of being imported.
 */
const testModules = import.meta.glob('../examples/**/*.test.{ts,tsx}', { eager: true })
// Ensure they're evaluated (the import itself is enough, but let's silence the lint)
void testModules

// StrictMode intentionally omitted — it causes useEffect to fire twice in dev,
// which would double-run all tests on mount.
createRoot(document.getElementById('root')!).render(<App />)
