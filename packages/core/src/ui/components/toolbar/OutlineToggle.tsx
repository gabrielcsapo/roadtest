import React, { useEffect } from 'react'

const STYLE_ID = 'fieldtest-outline-style'

export function OutlineToggle({ value, onChange, targetDocument }: {
  value: boolean
  onChange: (v: boolean) => void
  targetDocument?: Document | null
}) {
  useEffect(() => {
    const doc = targetDocument ?? document
    let el = doc.getElementById(STYLE_ID) as HTMLStyleElement | null
    if (value) {
      if (!el) {
        el = doc.createElement('style')
        el.id = STYLE_ID
        doc.head.appendChild(el)
      }
      el.textContent = `* { outline: 1px solid rgba(99,102,241,0.55) !important; outline-offset: 0 !important; }`
    } else {
      el?.remove()
    }
    return () => { doc.getElementById(STYLE_ID)?.remove() }
  }, [value, targetDocument])

  return (
    <button
      onClick={() => onChange(!value)}
      title="Toggle outlines"
      aria-pressed={value}
      style={{
        background: value ? 'rgba(99,102,241,0.2)' : 'transparent',
        border: '1px solid',
        borderColor: value ? 'rgba(99,102,241,0.5)' : '#2a2a36',
        borderRadius: 6, padding: '5px 8px',
        cursor: 'pointer', color: value ? '#818cf8' : '#6b7280',
        display: 'flex', alignItems: 'center',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="1.5" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
        <rect x="9.5" y="1.5" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
        <rect x="1.5" y="9.5" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
        <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </button>
  )
}
