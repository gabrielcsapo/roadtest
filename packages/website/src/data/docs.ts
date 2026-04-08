export interface DocEntry {
  id: string;
  category: string;
  title: string;
  /** Markdown content */
  body: string;
  /** Optional demo component id — rendered below the markdown */
  demo?: string;
}

export const docs: DocEntry[] = [
  // ── Getting Started ──────────────────────────────────────────────────────
  {
    id: "installation",
    category: "Getting Started",
    title: "Installation",
    body: `
## Installation

Install fieldtest into any Vite + React project:

\`\`\`bash
npm install --save-dev @fieldtest/core @fieldtest/runner
\`\`\`

Or with pnpm / yarn:

\`\`\`bash
pnpm add -D @fieldtest/core @fieldtest/runner
yarn add -D @fieldtest/core @fieldtest/runner
\`\`\`

Add the Vite plugin to your \`vite.config.ts\`:

\`\`\`ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fieldtest } from '@fieldtest/core/plugin'

export default defineConfig({
  plugins: [react(), fieldtest({ include: 'src/**/*.test.{ts,tsx}' })]
})
\`\`\`
`,
  },
  {
    id: "quick-start",
    category: "Getting Started",
    title: "Quick Start",
    body: `
## Quick Start

Write a test file next to your component:

\`\`\`tsx
// Button.test.tsx
import { describe, it, expect, render, fireEvent, snapshot } from '@fieldtest/core'
import { Button } from './Button'

describe('Button', () => {
  it('renders the label', async () => {
    const { getByText } = await render(<Button label="Click me" />)
    expect(getByText('Click me')).toBeTruthy()
  })

  it('fires onClick when clicked', async () => {
    let clicked = false
    const { getByRole } = await render(
      <Button label="Click me" onClick={() => { clicked = true }} />
    )
    await snapshot('before click')
    await fireEvent.click(getByRole('button'))
    expect(clicked).toBe(true)
  })
})
\`\`\`

Run in the browser:

\`\`\`bash
fieldtest --ui
\`\`\`

Or headlessly in Node:

\`\`\`bash
fieldtest
\`\`\`
`,
  },
  {
    id: "project-setup",
    category: "Getting Started",
    title: "Project Setup",
    body: `
## Project Setup

fieldtest looks for a \`.fieldtest/\` directory in your project root for optional configuration files.

\`\`\`
your-app/
├── .fieldtest/
│   ├── setup.ts       # global setup (MSW, providers, etc.)
│   └── preview.tsx    # wrap every test render in a provider
├── src/
│   └── Button.test.tsx
└── vite.config.ts
\`\`\`

### setup.ts

Runs once before any tests. Use it to start MSW, set global mocks, or configure libraries:

\`\`\`ts
// .fieldtest/setup.ts
import { setupServer } from 'msw/browser'
import { handlers } from '../src/mocks/handlers'

export const worker = setupServer(...handlers)
await worker.start({ onUnhandledRequest: 'bypass' })
\`\`\`

### preview.tsx

Wraps every \`render()\` call in your providers automatically:

\`\`\`tsx
// .fieldtest/preview.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function Preview({ children }: { children: React.ReactNode }) {
  const client = new QueryClient()
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
\`\`\`
`,
  },

  // ── Core API ─────────────────────────────────────────────────────────────
  {
    id: "describe-it",
    category: "Core API",
    title: "describe / it / test",
    body: `
## describe / it / test

fieldtest uses a familiar Jest-compatible DSL for structuring tests.

\`\`\`ts
import { describe, it, test, expect } from '@fieldtest/core'

describe('MyComponent', () => {
  it('does something', async () => {
    expect(1 + 1).toBe(2)
  })

  test('alias for it', async () => {
    expect(true).toBeTruthy()
  })
})
\`\`\`

Test callbacks are always **async**. \`await\` any render or event call.

### Nesting

\`describe\` blocks can be nested:

\`\`\`ts
describe('Form', () => {
  describe('validation', () => {
    it('rejects empty fields', async () => { ... })
    it('rejects invalid email', async () => { ... })
  })
})
\`\`\`
`,
  },
  {
    id: "expect",
    category: "Core API",
    title: "expect",
    body: `
## expect

fieldtest's \`expect\` supports the most common Jest matchers:

\`\`\`ts
expect(value).toBe(expected)
expect(value).toEqual(expected)
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()
expect(value).toBeUndefined()
expect(value).toBeDefined()
expect(value).toContain(item)
expect(value).toHaveLength(n)
expect(fn).toThrow()
expect(fn).toThrow('message')
\`\`\`

### Negation

\`\`\`ts
expect(value).not.toBe(expected)
expect(value).not.toBeNull()
\`\`\`

### DOM matchers

\`\`\`ts
const { getByRole } = await render(<Button label="Save" />)
const btn = getByRole('button')

expect(btn.textContent).toBe('Save')
expect(btn.hasAttribute('disabled')).toBeFalsy()
\`\`\`
`,
  },
  {
    id: "render",
    category: "Core API",
    title: "render",
    body: `
## render

\`render()\` mounts a React component into a sandbox DOM and returns React Testing Library queries.

\`\`\`ts
import { render } from '@fieldtest/core'

const {
  getByText,
  getByRole,
  getByTestId,
  queryByText,
  findByText,
  container,
} = await render(<MyComponent prop="value" />)
\`\`\`

Every \`render()\` call is isolated — the DOM is reset between tests automatically.

### With a provider wrapper

If you've set up \`.fieldtest/preview.tsx\`, your providers wrap the rendered component automatically. No extra setup needed per test.

### container

The raw DOM node the component mounted into:

\`\`\`ts
const { container } = await render(<Badge text="new" />)
expect(container.querySelector('.badge')?.textContent).toBe('new')
\`\`\`
`,
  },
  {
    id: "snapshot",
    category: "Core API",
    title: "snapshot",
    body: `
## snapshot

\`snapshot(label)\` captures the current rendered DOM state and adds a frame to the filmstrip in the browser UI.

\`\`\`ts
import { render, snapshot, fireEvent } from '@fieldtest/core'

it('shows loading then content', async () => {
  const { getByText } = await render(<AsyncCard />)

  await snapshot('initial — loading state')

  // wait for async content
  await findByText('Loaded!')
  await snapshot('after load')
})
\`\`\`

Snapshots are **visual only** — they don't assert anything. They're checkpoints for you to scrub through in the UI.

> In Node mode, \`snapshot()\` is a no-op and adds no overhead.
`,
  },
  {
    id: "fire-event",
    category: "Core API",
    title: "fireEvent",
    body: `
## fireEvent

Async wrappers around standard DOM events. Always \`await\` them so React has time to re-render.

\`\`\`ts
import { fireEvent } from '@fieldtest/core'

await fireEvent.click(element)
await fireEvent.input(element, { target: { value: 'hello' } })
await fireEvent.change(element, { target: { value: 'new' } })
await fireEvent.submit(formElement)
await fireEvent.keyDown(element, { key: 'Enter' })
await fireEvent.focus(element)
await fireEvent.blur(element)
\`\`\`

### Example

\`\`\`tsx
it('updates on input', async () => {
  const { getByRole, getByDisplayValue } = await render(<SearchBox />)
  const input = getByRole('textbox')

  await fireEvent.input(input, { target: { value: 'react' } })
  expect(getByDisplayValue('react')).toBeTruthy()
})
\`\`\`
`,
  },
  {
    id: "mock",
    category: "Core API",
    title: "mock / unmock",
    body: `
## mock / unmock

Replace module imports with controlled fakes. \`mock()\` calls are automatically hoisted before imports — the same pattern as Vitest's \`vi.mock()\`.

\`\`\`ts
import { describe, it, expect, mock } from '@fieldtest/core'

const { useFeatureFlag } = mock('../hooks/useFeatureFlag', () => ({
  useFeatureFlag: () => true,
}))

describe('FeatureGate', () => {
  it('shows content when flag is on', async () => {
    const { getByText } = await render(<FeatureGate flag="new-ui" />)
    expect(getByText('New UI')).toBeTruthy()
  })
})
\`\`\`

### Spy on calls

\`\`\`ts
const { fetchUser } = mock('../api/user', () => ({
  fetchUser: async (id: string) => ({ id, name: 'Test User' }),
}))

it('calls fetchUser with the right id', async () => {
  await render(<UserProfile id="abc" />)
  expect(fetchUser.mock.calls[0][0]).toBe('abc')
})
\`\`\`

### unmock

\`\`\`ts
import { unmock } from '@fieldtest/core'
unmock('../api/user')
\`\`\`
`,
  },

  // ── Browser UI ───────────────────────────────────────────────────────────
  {
    id: "ui-overview",
    category: "Browser UI",
    title: "Overview",
    demo: "ui-overview",
    body: `
## Browser UI

Start the browser UI with:

\`\`\`bash
fieldtest --ui
\`\`\`

This starts a Vite dev server at \`http://localhost:3333\` with the full interactive test environment.

### Layout

The UI has two main panels:

- **Left — Test tree**: your suites and tests, with pass/fail/skip indicators. Click any test to select it.
- **Right — Detail view**: the selected test's filmstrip, tabs, and live component preview.

### Gallery view

Toggle to gallery mode to see all tests at once as a grid of thumbnails — useful for spotting visual regressions across an entire suite.

### Hot reload

Saving any file re-runs affected tests automatically. Only tests whose dependency graph was touched are re-run.
`,
  },
  {
    id: "filmstrip",
    category: "Browser UI",
    title: "Filmstrip",
    demo: "filmstrip",
    body: `
## Filmstrip

The filmstrip captures a frame for every \`render()\` call and every explicit \`snapshot()\` call in a test. Each frame is a live snapshot of the DOM at that exact moment.

Each frame displays:
- A thumbnail of the component at that point in the test
- The label — either the one you passed to \`snapshot()\`, or auto-generated for \`render()\` calls
- A timestamp relative to test start

Clicking a frame jumps the preview pane to that exact DOM state. This makes it easy to scrub through exactly how your component changed during the test — render by render.

### Grid / measure overlays

The toolbar above the preview has toggles for:

- **Grid** — overlay an 8px grid for alignment checks
- **Measure** — highlight element dimensions on hover
- **Outline** — draw outlines around every DOM element
- **Vision** — simulate color blindness or blur

These overlays apply to the live preview only and don't affect your test results.
`,
  },
  {
    id: "tabs",
    category: "Browser UI",
    title: "Tabs",
    demo: "tabs",
    body: `
## Tabs

Each selected test shows multiple inspection tabs:

### Assertions
A list of every \`expect()\` call in the test, showing the matcher, actual value, and pass/fail status. Failed assertions show a diff.

### Trace
A timeline of all render calls, effect runs, and state updates during the test.

### Coverage
Line-by-line source coverage for just this test. Lines hit are highlighted green; missed lines are dim. Click any file in the coverage explorer to see its annotated source.

### Console
All \`console.log\`, \`console.warn\`, and \`console.error\` calls captured during the test, with the originating line.

### Network
Every outgoing fetch/XHR intercepted by MSW, showing method, URL, request body, response status, and response body.

### Axe
Accessibility audit results from axe-core. Failing rules show the impacted DOM nodes highlighted in the preview. Passing rules are listed in green.
`,
  },
  {
    id: "graph-view",
    category: "Browser UI",
    title: "Graph View",
    body: `
## Graph View

The graph view renders an interactive 3D force-directed graph of your entire test suite's dependency structure.

- **Nodes** represent source files and test suites
- **Edges** represent import relationships and coverage links
- **Node size** scales with the number of tests that cover the file
- **Node color** differentiates source files, test files, and entry points

### Interacting

- **Orbit** — click and drag to rotate
- **Zoom** — scroll to zoom in/out
- **Hover** — shows the file path and coverage percentage
- **Click** — selects the file and shows its coverage details

The graph makes it easy to see which parts of your codebase have no test coverage (isolated nodes with no edges).
`,
  },

  // ── Node / CI ────────────────────────────────────────────────────────────
  {
    id: "node-mode",
    category: "Node / CI",
    title: "Running Tests",
    body: `
## Running Tests in Node

Run all tests headlessly:

\`\`\`bash
fieldtest
\`\`\`

fieldtest uses [happy-dom](https://github.com/capricorn86/happy-dom) as a lightweight DOM implementation and [tsx](https://github.com/privatenumber/tsx) to transpile TypeScript on the fly — no separate build step needed.

### Output

\`\`\`
✓ Button › renders the label        12ms
✓ Button › primary variant           8ms
✓ Button › fires onClick when clicked 14ms
✗ Button › wrong label
  Expected "Save" · Received "Submit"

─────────────────────────────────────────
7 passed  1 failed  42ms total
\`\`\`

### Exit codes

- \`0\` — all tests passed
- \`1\` — one or more tests failed
`,
  },
  {
    id: "watch-mode",
    category: "Node / CI",
    title: "Watch Mode",
    body: `
## Watch Mode

\`\`\`bash
fieldtest --watch
\`\`\`

Watch mode monitors your source files and re-runs only the tests affected by each change, using a dependency graph computed from your imports.

If you edit \`Button.tsx\`, only tests that import \`Button.tsx\` (directly or transitively) will re-run. Tests with no connection to the changed file are skipped entirely.

This makes watch mode fast even in large codebases.
`,
  },
  {
    id: "coverage",
    category: "Node / CI",
    title: "Coverage",
    body: `
## Coverage

\`\`\`bash
fieldtest --coverage
\`\`\`

Coverage uses Node's built-in V8 instrumentation via \`NODE_V8_COVERAGE\`, which captures everything — including code loaded through tsx's ESM loader hook. The output is converted to Istanbul format.

### Output

\`\`\`
Coverage: 94.2% statements  88.6% branches  91.0% functions
\`\`\`

A full Istanbul-format JSON report is written to \`coverage/\` for consumption by tools like codecov or your CI coverage reporter.

### Per-test coverage

In the browser UI, coverage is tracked per individual test — not just in aggregate. This means you can see exactly which lines test X exercises versus test Y.
`,
  },
  {
    id: "sharding",
    category: "Node / CI",
    title: "Sharding",
    body: `
## Sharding

Split your test suite across multiple CI workers:

\`\`\`bash
# Worker 1 of 4
fieldtest --shard=1/4

# Worker 2 of 4
fieldtest --shard=2/4
\`\`\`

Each shard runs its slice of tests independently. Results are written to \`.fieldtest/results/shard-N-of-M.json\`.

### Merging results

After all shards complete, merge results for a combined report:

\`\`\`bash
fieldtest --merge-shards
\`\`\`

### Example GitHub Actions matrix

\`\`\`yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - run: fieldtest --shard=\${{ matrix.shard }}/4 --coverage
\`\`\`
`,
  },
  {
    id: "caching",
    category: "Node / CI",
    title: "Caching",
    body: `
## Caching

fieldtest caches test results keyed by a hash of each test file and its full dependency graph. On subsequent runs, unchanged tests are skipped instantly.

The cache lives in \`.fieldtest/cache/\`. Add it to \`.gitignore\`:

\`\`\`
.fieldtest/cache/
\`\`\`

### Clearing the cache

\`\`\`bash
fieldtest --clear-cache
\`\`\`

### In CI

Cache the \`.fieldtest/cache/\` directory between runs for maximum speed:

\`\`\`yaml
- uses: actions/cache@v3
  with:
    path: .fieldtest/cache
    key: fieldtest-\${{ hashFiles('src/**') }}
\`\`\`
`,
  },

  // ── Configuration ─────────────────────────────────────────────────────────
  {
    id: "vite-plugin",
    category: "Configuration",
    title: "Vite Plugin",
    body: `
## Vite Plugin

The fieldtest Vite plugin enables the browser UI and handles test file transforms.

\`\`\`ts
import { fieldtest } from '@fieldtest/core/plugin'

export default defineConfig({
  plugins: [
    react(),
    fieldtest({
      include: 'src/**/*.test.{ts,tsx}',
    })
  ]
})
\`\`\`

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`include\` | \`string | string[]\` | \`**/*.test.{ts,tsx}\` | Glob pattern(s) for test files |

The plugin does two things:

1. **Transform** — rewrites test files to hoist \`mock()\` calls before imports (required for proper mock isolation)
2. **Serve** — exposes middleware endpoints the browser UI uses to list files, fetch source, and stream coverage data
`,
  },
  {
    id: "env-override",
    category: "Configuration",
    title: "Environment Override",
    body: `
## Environment Override

By default, test files run in whatever environment fieldtest was invoked in (browser or Node). You can force a specific file to always run in Node with a comment at the top:

\`\`\`ts
// @fieldtest-env node
import { describe, it, expect } from '@fieldtest/core'

describe('pure logic', () => {
  it('sorts correctly', () => {
    expect([3,1,2].sort()).toEqual([1,2,3])
  })
})
\`\`\`

This is useful for tests that involve Node-only APIs or where a DOM is unnecessary overhead.
`,
  },

  // ── Plugins ───────────────────────────────────────────────────────────────
  {
    id: "register-tab",
    category: "Plugins",
    title: "registerTab",
    body: `
## registerTab

Add custom tabs to the browser UI's detail view. Tabs receive the full test case data and can render anything.

\`\`\`tsx
// .fieldtest/NetworkTab.tsx
import { registerTab } from '@fieldtest/core'
import type { TestCase } from '@fieldtest/core'

registerTab({
  id: 'network',
  label: 'Network',
  render(test: TestCase) {
    return (
      <div>
        {test.networkEntries?.map(entry => (
          <div key={entry.id}>
            <span>{entry.method}</span>
            <span>{entry.url}</span>
            <span>{entry.status}</span>
          </div>
        ))}
      </div>
    )
  }
})
\`\`\`

Register tabs in your \`.fieldtest/setup.ts\` or \`.fieldtest/preview.tsx\`.
`,
  },
  {
    id: "after-test-hook",
    category: "Plugins",
    title: "registerAfterTestHook",
    body: `
## registerAfterTestHook

Run custom logic after every test completes. Useful for cleanup, logging, or attaching extra data to the test result.

\`\`\`ts
import { registerAfterTestHook, currentTest } from '@fieldtest/core'

registerAfterTestHook(async () => {
  const test = currentTest()
  if (!test) return

  // e.g. attach performance metrics
  console.log(\`[\${test.name}] render count: \${getRenderCount()}\`)
})
\`\`\`

The hook runs in the same environment as the test (browser or Node). In browser mode, you can access the DOM. In Node mode, \`currentTest()\` still gives you full test metadata.
`,
  },
];

export const categories = [...new Set(docs.map((d) => d.category))];
