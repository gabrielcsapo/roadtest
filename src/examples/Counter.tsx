import { useState } from 'react'

interface CounterProps {
  initial?: number
  step?: number
}

export function Counter({ initial = 0, step = 1 }: CounterProps) {
  const [count, setCount] = useState(initial)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'sans-serif' }}>
      <button
        onClick={() => setCount(c => c - step)}
        style={btnStyle}
        aria-label="decrement"
      >−</button>
      <span
        data-testid="count"
        style={{ fontSize: 28, fontWeight: 700, minWidth: 48, textAlign: 'center', color: '#e2e2e8' }}
      >
        {count}
      </span>
      <button
        onClick={() => setCount(c => c + step)}
        style={btnStyle}
        aria-label="increment"
      >+</button>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 8,
  border: 'none', background: '#6366f1', color: '#fff',
  fontSize: 20, fontWeight: 700, cursor: 'pointer',
}
