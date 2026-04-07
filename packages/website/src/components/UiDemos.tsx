/**
 * Doc demos — fieldtest UI running as a separate Vite server, embedded via iframe.
 */

const DEMO_SRC = `${import.meta.env.BASE_URL}demo-ui/index.html`

function FieldtestIframe({ height = 480 }: { height?: number }) {
  return (
    <iframe
      src={DEMO_SRC}
      title="fieldtest live demo"
      style={{ width: '100%', height, border: 'none', display: 'block' }}
    />
  )
}

export function UiOverviewDemo() {
  return <FieldtestIframe height={480} />
}

export function FilmstripDemo() {
  return <FieldtestIframe height={420} />
}

export function TabsDemo() {
  return <FieldtestIframe height={420} />
}

const DEMOS: Record<string, React.ComponentType> = {
  'ui-overview': UiOverviewDemo,
  'filmstrip':   FilmstripDemo,
  'tabs':        TabsDemo,
}

export function DocDemo({ id }: { id: string }) {
  const Component = DEMOS[id]
  if (!Component) return null
  return <Component />
}
