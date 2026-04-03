import type { TestCase } from '../../framework/types'
import { StatusIcon } from './StatusIcon'

interface Props {
  test: TestCase | null
}

export function Preview({ test }: Props) {
  if (!test) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b4b60' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>◌</div>
          <div style={{ fontSize: 14 }}>Select a test to preview</div>
        </div>
      </div>
    )
  }

  const hasAssertions = test.assertions.length > 0

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        padding: '10px 20px', borderBottom: '1px solid #2a2a36',
        display: 'flex', alignItems: 'center', gap: 10, background: '#16161d',
        flexShrink: 0,
      }}>
        <StatusIcon status={test.status} />
        <span style={{ fontSize: 12, color: '#6b7280' }}>{test.suiteName}</span>
        <span style={{ color: '#3a3a4e' }}>/</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#c4c4d4' }}>{test.name}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', background: '#0f0f13' }}>

        {/* Component canvas — only shown when there's a visual element */}
        {test.element && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 40, borderBottom: hasAssertions ? '1px solid #2a2a36' : 'none',
          }}>
            <div style={{
              background: '#1a1a24', borderRadius: 12,
              padding: 40, border: '1px solid #2a2a36',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 200,
            }}>
              {test.element}
            </div>
          </div>
        )}

        {/* Assertions list */}
        {hasAssertions && (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4b4b60', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              Assertions
            </div>
            {test.assertions.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '8px 12px', borderRadius: 6,
                background: a.status === 'pass' ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
                border: `1px solid ${a.status === 'pass' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: a.status === 'pass' ? '#22c55e' : '#ef4444',
                  marginTop: 1, flexShrink: 0,
                }}>
                  {a.status === 'pass' ? '✓' : '✗'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <code style={{ fontSize: 12, color: '#c4c4d4', fontFamily: 'monospace' }}>
                    {a.label}
                  </code>
                  {a.error && (
                    <div style={{ marginTop: 4, fontSize: 12, color: '#fca5a5', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {a.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No element + no assertions: status placeholder */}
        {!test.element && !hasAssertions && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b4b60' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 10, color: test.status === 'pass' ? '#22c55e' : '#4b4b60' }}>
                {test.status === 'pass' ? '✓' : test.status === 'pending' ? '○' : '◌'}
              </div>
              <div style={{ fontSize: 13 }}>
                {test.status === 'pass' ? 'Passed — no visual output' : 'Run tests to see results'}
              </div>
            </div>
          </div>
        )}

        {/* Error bubble (only shown when there's a top-level error + no assertions captured it) */}
        {test.error && test.assertions.every(a => a.status === 'pass') && (
          <div style={{ margin: '0 20px 20px', padding: 16, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>Error</div>
            <pre style={{ fontSize: 12, color: '#fca5a5', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {test.error}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
