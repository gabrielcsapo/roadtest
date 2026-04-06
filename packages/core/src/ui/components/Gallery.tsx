import { useState, useDeferredValue, useRef, useEffect, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { StoreState, TestCase } from '../../framework/types'
import { StatusIcon } from './StatusIcon'

interface Props {
  state: StoreState
  search: string
  onSelect: (test: TestCase) => void
  onPlayTest: (test: TestCase) => void
}

const CARD_MIN_W = 260
const GAP        = 16
const CARD_H     = 172  // 120px preview + ~52px footer
const PAD        = 24   // container padding

function PendingPlaceholder() {
  return (
    <div style={{
      width: '100%', height: '100%',
      backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.12) 1px, transparent 1px)',
      backgroundSize: '16px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '1.5px solid rgba(99,102,241,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(99,102,241,0.35)', fontSize: 13,
      }}>○</div>
    </div>
  )
}

function RunningPlaceholder() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="12 6" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 10 10" to="360 10 10" dur="0.8s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </div>
  )
}

function GalleryCard({ test, suiteName, onSelect, onPlayTest }: {
  test: TestCase
  suiteName: string
  onSelect: () => void
  onPlayTest: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onSelect}
        style={{
          width: '100%',
          background: '#16161d',
          border: `1px solid ${hovered ? '#6366f1' : '#2a2a36'}`,
          borderRadius: 12, padding: 0, cursor: 'pointer', textAlign: 'left',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          transition: 'border-color 0.15s',
        }}
      >
        <div style={{
          background: '#0f0f13', height: 120,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '1px solid #2a2a36', overflow: 'hidden',
        }}>
          {test.status === 'running' ? (
            <RunningPlaceholder />
          ) : test.snapshots[0] ? (
            <div
              style={{ pointerEvents: 'none', transform: 'scale(0.85)', transformOrigin: 'center' }}
              dangerouslySetInnerHTML={{ __html: test.snapshots[0].html }}
            />
          ) : test.status === 'fail' ? (
            <div style={{ color: '#ef4444', fontSize: 28 }}>✗</div>
          ) : test.status === 'pass' ? (
            <div style={{ color: '#22c55e', fontSize: 28 }}>✓</div>
          ) : (
            <PendingPlaceholder />
          )}
        </div>
        <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusIcon status={test.status} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, color: '#4b4b60', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {suiteName}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#c4c4d4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {test.name}
            </div>
          </div>
        </div>
      </button>

      {test.status !== 'skipped' && test.status !== 'running' && (
        <button
          onClick={e => { e.stopPropagation(); onPlayTest() }}
          title="Run and focus this test"
          style={{
            position: 'absolute', top: 8, right: 8,
            width: 26, height: 26, borderRadius: 6,
            border: '1px solid rgba(99,102,241,0.4)',
            background: 'rgba(22,22,29,0.85)',
            backdropFilter: 'blur(4px)',
            color: '#a5b4fc', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.15s',
            pointerEvents: hovered ? 'auto' : 'none',
            zIndex: 2,
          }}
        >
          <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
            <path d="M1 1L7 5L1 9V1Z" fill="currentColor" stroke="currentColor" strokeWidth="0.5" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  )
}

export function Gallery({ state, search, onSelect, onPlayTest }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Measure available width for column calculation
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width - PAD * 2)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const deferredSearch = useDeferredValue(search)
  const q = deferredSearch.toLowerCase()

  const tests = useMemo(() =>
    state.suites.flatMap(suite =>
      suite.tests
        .filter(t => t.snapshots.length > 0)
        .filter(t => !q || t.name.toLowerCase().includes(q) || suite.name.toLowerCase().includes(q))
        .map(t => ({ test: t, suiteName: suite.name }))
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.suites, q]
  )

  // How many columns fit — minimum 1
  const cols = containerWidth > 0
    ? Math.max(1, Math.floor((containerWidth + GAP) / (CARD_MIN_W + GAP)))
    : 1

  // Chunk tests into rows of `cols`
  const rows = useMemo(() => {
    const result: (typeof tests)[] = []
    for (let i = 0; i < tests.length; i += cols) result.push(tests.slice(i, i + cols))
    return result
  }, [tests, cols])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CARD_H + GAP,
    overscan: 3,
  })

  const hasAnyVisual = state.suites.some(s => s.tests.some(t => t.snapshots.length > 0))

  if (tests.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b4b60' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>◌</div>
          {!hasAnyVisual
            ? <div style={{ fontSize: 14 }}>No tests have rendered output yet</div>
            : search
            ? <div style={{ fontSize: 14 }}>No visual tests match "{search}"</div>
            : <div style={{ fontSize: 14 }}>No visual tests found</div>
          }
        </div>
      </div>
    )
  }

  return (
    <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: PAD }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(vRow => {
          const rowItems = rows[vRow.index]
          return (
            <div
              key={vRow.key}
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%',
                transform: `translateY(${vRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: GAP,
                paddingBottom: GAP,
              }}
            >
              {rowItems.map(({ test, suiteName }) => (
                <GalleryCard
                  key={test.id}
                  test={test}
                  suiteName={suiteName}
                  onSelect={() => onSelect(test)}
                  onPlayTest={() => onPlayTest(test)}
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
