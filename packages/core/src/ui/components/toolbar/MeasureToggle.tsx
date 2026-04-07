import { useState, useEffect } from 'react'

interface BoxInfo {
  rect: DOMRect
  containerRect: DOMRect
  margin: { top: number; right: number; bottom: number; left: number }
  padding: { top: number; right: number; bottom: number; left: number }
  border: { top: number; right: number; bottom: number; left: number }
}

function parsePx(v: string) { return parseFloat(v) || 0 }

function BoxOverlay({ info }: { info: BoxInfo }) {
  const { rect, containerRect: cr, margin: m, padding: p, border: b } = info

  // All positions relative to viewport (fixed)
  const cx = rect.left
  const cy = rect.top
  const cw = rect.width
  const ch = rect.height

  const layer = (
    x: number, y: number, w: number, h: number,
    bg: string, label?: string
  ) => (
    <div style={{ position: 'fixed', left: x, top: y, width: Math.max(w, 0), height: Math.max(h, 0), background: bg, pointerEvents: 'none', zIndex: 9999 }}>
      {label && w > 24 && h > 12 && (
        <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 9, fontFamily: 'monospace', color: 'rgba(0,0,0,0.7)', fontWeight: 700, whiteSpace: 'nowrap' }}>
          {label}
        </span>
      )}
    </div>
  )

  // Content area (inside border+padding)
  const contentX = cx + b.left + p.left
  const contentY = cy + b.top + p.top
  const contentW = cw - b.left - b.right - p.left - p.right
  const contentH = ch - b.top - b.bottom - p.top - p.bottom

  const tooltip = `${Math.round(cw)} × ${Math.round(ch)}`

  return (
    <>
      {/* Margin (orange) */}
      {layer(cx - m.left, cy - m.top, cw + m.left + m.right, m.top, 'rgba(255,165,0,0.35)')}
      {layer(cx - m.left, cy + ch, cw + m.left + m.right, m.bottom, 'rgba(255,165,0,0.35)')}
      {layer(cx - m.left, cy, m.left, ch, 'rgba(255,165,0,0.35)')}
      {layer(cx + cw, cy, m.right, ch, 'rgba(255,165,0,0.35)')}

      {/* Border (yellow) */}
      {layer(cx, cy, cw, b.top, 'rgba(255,215,0,0.45)')}
      {layer(cx, cy + ch - b.bottom, cw, b.bottom, 'rgba(255,215,0,0.45)')}
      {layer(cx, cy + b.top, b.left, ch - b.top - b.bottom, 'rgba(255,215,0,0.45)')}
      {layer(cx + cw - b.right, cy + b.top, b.right, ch - b.top - b.bottom, 'rgba(255,215,0,0.45)')}

      {/* Padding (green) */}
      {layer(cx + b.left, cy + b.top, cw - b.left - b.right, p.top, 'rgba(72,199,116,0.4)')}
      {layer(cx + b.left, cy + ch - b.bottom - p.bottom, cw - b.left - b.right, p.bottom, 'rgba(72,199,116,0.4)')}
      {layer(cx + b.left, cy + b.top + p.top, p.left, contentH, 'rgba(72,199,116,0.4)')}
      {layer(cx + cw - b.right - p.right, cy + b.top + p.top, p.right, contentH, 'rgba(72,199,116,0.4)')}

      {/* Content (blue) */}
      {layer(contentX, contentY, contentW, contentH, 'rgba(99,102,241,0.25)')}

      {/* Tooltip */}
      <div style={{
        position: 'fixed', left: cx, top: cy - 26,
        background: '#1a1a24', border: '1px solid #2a2a36',
        borderRadius: 4, padding: '2px 8px',
        fontSize: 11, fontFamily: 'monospace', color: '#c4c4d4',
        pointerEvents: 'none', zIndex: 10000, whiteSpace: 'nowrap',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      }}>
        {tooltip}
      </div>
    </>
  )
}

export function useMeasure(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean,
  iframeEl?: HTMLIFrameElement | null,
) {
  const [info, setInfo] = useState<BoxInfo | null>(null)

  useEffect(() => {
    if (!active) { setInfo(null); return }
    const el = containerRef.current
    if (!el) return

    function onOver(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target || target === el || !el!.contains(target)) return

      const rawRect = target.getBoundingClientRect()
      const containerRect = el!.getBoundingClientRect()

      // Rects inside an iframe are relative to the iframe's own viewport.
      // Offset them by the iframe's position in the parent document so that
      // the overlay (rendered with position:fixed in the parent) lands correctly.
      const iframeOffset = iframeEl ? iframeEl.getBoundingClientRect() : { left: 0, top: 0 }
      const rect = {
        left:   rawRect.left   + iframeOffset.left,
        top:    rawRect.top    + iframeOffset.top,
        right:  rawRect.right  + iframeOffset.left,
        bottom: rawRect.bottom + iframeOffset.top,
        width:  rawRect.width,
        height: rawRect.height,
        x:      rawRect.x      + iframeOffset.left,
        y:      rawRect.y      + iframeOffset.top,
      } as DOMRect

      const s = getComputedStyle(target)
      setInfo({
        rect, containerRect,
        margin:  { top: parsePx(s.marginTop),       right: parsePx(s.marginRight),       bottom: parsePx(s.marginBottom),       left: parsePx(s.marginLeft) },
        padding: { top: parsePx(s.paddingTop),      right: parsePx(s.paddingRight),      bottom: parsePx(s.paddingBottom),      left: parsePx(s.paddingLeft) },
        border:  { top: parsePx(s.borderTopWidth),  right: parsePx(s.borderRightWidth),  bottom: parsePx(s.borderBottomWidth),  left: parsePx(s.borderLeftWidth) },
      })
    }
    function onOut() { setInfo(null) }

    el.addEventListener('mouseover', onOver)
    el.addEventListener('mouseleave', onOut)
    return () => { el.removeEventListener('mouseover', onOver); el.removeEventListener('mouseleave', onOut) }
  }, [active, containerRef.current, iframeEl]) // eslint-disable-line react-hooks/exhaustive-deps

  return info
}

export function MeasureOverlay({ info }: { info: BoxInfo | null }) {
  if (!info) return null
  return <BoxOverlay info={info} />
}

export function MeasureToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      title="Measure element dimensions (M)"
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
        {/* Ruler body */}
        <rect x="1" y="5" width="14" height="6" rx="1" stroke="currentColor" strokeWidth="1.1" />
        {/* Tick marks */}
        <line x1="4" y1="5" x2="4" y2="8" stroke="currentColor" strokeWidth="1" />
        <line x1="7" y1="5" x2="7" y2="7" stroke="currentColor" strokeWidth="1" />
        <line x1="10" y1="5" x2="10" y2="8" stroke="currentColor" strokeWidth="1" />
        <line x1="13" y1="5" x2="13" y2="7" stroke="currentColor" strokeWidth="1" />
      </svg>
    </button>
  )
}
