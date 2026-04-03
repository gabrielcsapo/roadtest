import type { TestStatus } from '../../framework/types'

const icons: Record<TestStatus, string> = {
  pending:  '○',
  running:  '◌',
  pass:     '✓',
  fail:     '✗',
  skipped:  '–',
}

const colors: Record<TestStatus, string> = {
  pending:  '#6b7280',
  running:  '#f59e0b',
  pass:     '#22c55e',
  fail:     '#ef4444',
  skipped:  '#6b7280',
}

export function StatusIcon({ status }: { status: TestStatus }) {
  return (
    <span style={{ color: colors[status], fontWeight: 700, fontSize: 12, minWidth: 14, display: 'inline-block' }}>
      {icons[status]}
    </span>
  )
}
