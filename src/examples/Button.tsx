import { useState } from 'react'

interface ButtonProps {
  label: string
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  onClick?: () => void
}

export function Button({ label, variant = 'primary', disabled = false, onClick }: ButtonProps) {
  const [pressed, setPressed] = useState(false)

  const colors = {
    primary:   { bg: '#6366f1', hover: '#4f46e5' },
    secondary: { bg: '#374151', hover: '#1f2937' },
    danger:    { bg: '#ef4444', hover: '#dc2626' },
  }

  const c = colors[variant]

  return (
    <button
      disabled={disabled}
      onClick={() => { setPressed(true); onClick?.(); setTimeout(() => setPressed(false), 150) }}
      style={{
        padding: '8px 20px',
        borderRadius: 8,
        border: 'none',
        background: disabled ? '#374151' : pressed ? c.hover : c.bg,
        color: disabled ? '#6b7280' : '#fff',
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.1s',
        letterSpacing: '0.01em',
      }}
    >
      {label}
    </button>
  )
}
