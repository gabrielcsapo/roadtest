import React, { useEffect, useRef, useState } from 'react';
import axe from 'axe-core';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Impact = 'critical' | 'serious' | 'moderate' | 'minor';

const IMPACT_COLORS: Record<Impact, string> = {
  critical: '#ef4444',
  serious:  '#f97316',
  moderate: '#eab308',
  minor:    '#6b7280',
};

const IMPACT_ORDER: Impact[] = ['critical', 'serious', 'moderate', 'minor'];

// ---------------------------------------------------------------------------
// AxePanel
// ---------------------------------------------------------------------------

export interface AxePanelProps {
  containerRef: React.RefObject<HTMLElement | null>;
  active: boolean;
  onResults?: (violationCount: number) => void;
}

type RunState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'done'; violations: axe.Result[]; passes: axe.Result[] }
  | { phase: 'error'; message: string };

function applyHighlight(els: Element[], color: string) {
  els.forEach(el => {
    const h = el as HTMLElement
    h.dataset.axePrevOutline = h.style.outline
    h.dataset.axePrevBoxShadow = h.style.boxShadow
    h.style.outline = `2px solid ${color}`
    h.style.boxShadow = `0 0 0 4px ${color}33`
  })
}

function clearHighlight(els: Element[]) {
  els.forEach(el => {
    const h = el as HTMLElement
    h.style.outline = h.dataset.axePrevOutline ?? ''
    h.style.boxShadow = h.dataset.axePrevBoxShadow ?? ''
    delete h.dataset.axePrevOutline
    delete h.dataset.axePrevBoxShadow
  })
}

export function AxePanel({ containerRef, active, onResults }: AxePanelProps): React.ReactElement | null {
  const [state, setState] = useState<RunState>({ phase: 'idle' });
  const [activeViolationId, setActiveViolationId] = useState<string | null>(null);
  const [passesExpanded, setPassesExpanded] = useState(false);
  const highlightedEls = useRef<Element[]>([]);

  // Clear highlights when tab becomes inactive or component unmounts
  useEffect(() => {
    if (!active) {
      clearHighlight(highlightedEls.current)
      highlightedEls.current = []
      setActiveViolationId(null)
    }
  }, [active])

  useEffect(() => {
    return () => { clearHighlight(highlightedEls.current) }
  }, [])

  function handleViolationClick(violation: axe.Result) {
    clearHighlight(highlightedEls.current)
    if (activeViolationId === violation.id) {
      highlightedEls.current = []
      setActiveViolationId(null)
      return
    }
    const container = containerRef.current
    if (!container) return
    const matched: Element[] = []
    for (const node of violation.nodes) {
      const selector = Array.isArray(node.target) ? node.target.join(' ') : String(node.target)
      try {
        const found = container.querySelector(selector)
        if (found) {
          matched.push(found)
          found.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }
      } catch { /* invalid selector */ }
    }
    const color = IMPACT_COLORS[violation.impact as Impact] ?? '#6366f1'
    applyHighlight(matched, color)
    highlightedEls.current = matched
    setActiveViolationId(violation.id)
  }

  useEffect(() => {
    if (!active) return;

    const el = containerRef.current;
    if (!el) return;

    setState({ phase: 'running' });

    axe
      .run(el)
      .then((results) => {
        setState({ phase: 'done', violations: results.violations, passes: results.passes });
        onResults?.(results.violations.length);
      })
      .catch((err: unknown) => {
        setState({
          phase: 'error',
          message: err instanceof Error ? err.message : String(err),
        });
      });
  }, [active, containerRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!active) return null;

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Section header — matches "Assertions" style */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#4b4b60',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        Accessibility
      </div>

      {/* Loading */}
      {state.phase === 'running' && (
        <div style={{ fontSize: 12, color: '#6b7280', padding: '8px 0' }}>
          Running accessibility check…
        </div>
      )}

      {/* Error */}
      {state.phase === 'error' && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 6,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            fontSize: 12,
            color: '#fca5a5',
            fontFamily: 'monospace',
          }}
        >
          {state.message}
        </div>
      )}

      {/* No violations */}
      {state.phase === 'done' && state.violations.length === 0 && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 6,
            background: 'rgba(34,197,94,0.07)',
            border: '1px solid rgba(34,197,94,0.2)',
            fontSize: 12,
            color: '#22c55e',
            fontWeight: 600,
          }}
        >
          No accessibility violations — {state.passes.length} rule{state.passes.length !== 1 ? 's' : ''} passed
        </div>
      )}

      {/* Violations grouped by impact */}
      {state.phase === 'done' && state.violations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {IMPACT_ORDER.map((impact) => {
            const group = state.violations.filter((v) => v.impact === impact);
            if (group.length === 0) return null;

            const color = IMPACT_COLORS[impact];

            return (
              <div key={impact} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {group.map((violation, vi) => {
                  const isActive = activeViolationId === violation.id
                  return (
                  <div
                    key={vi}
                    style={{
                      borderRadius: 6,
                      background: isActive ? `${color}0d` : '#1a1a24',
                      border: `1px solid ${isActive ? `${color}60` : '#2a2a36'}`,
                      overflow: 'hidden',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    {/* Violation header */}
                    <div
                      onClick={() => handleViolationClick(violation)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        borderBottom: '1px solid #2a2a36',
                        cursor: 'pointer',
                      }}
                    >
                      {/* Impact badge */}
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          background: `${color}1a`,
                          border: `1px solid ${color}40`,
                          borderRadius: 4,
                          padding: '2px 6px',
                          flexShrink: 0,
                        }}
                      >
                        {impact}
                      </span>
                      <span style={{ fontSize: 12, color: '#c4c4d4' }}>
                        {violation.description}
                      </span>
                    </div>

                    {/* Affected nodes */}
                    <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {violation.nodes.map((node, ni) => {
                        const raw = node.html ?? '';
                        const snippet = raw.length > 80 ? raw.slice(0, 77) + '…' : raw;
                        return (
                          <div
                            key={ni}
                            style={{
                              fontSize: 11,
                              fontFamily: 'monospace',
                              color: '#6b7280',
                              background: '#0f0f13',
                              borderRadius: 4,
                              padding: '4px 8px',
                              whiteSpace: 'pre',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={raw}
                          >
                            {snippet}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  )
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Passes — collapsible */}
      {state.phase === 'done' && state.passes.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <button
            onClick={() => setPassesExpanded(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 12px', borderRadius: 6,
              background: passesExpanded ? 'rgba(34,197,94,0.07)' : 'transparent',
              border: '1px solid rgba(34,197,94,0.2)',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, transition: 'transform 0.15s', transform: passesExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
              <path d="M4 2l4 4-4 4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
              {state.passes.length} rule{state.passes.length !== 1 ? 's' : ''} passed
            </span>
          </button>
          {passesExpanded && (
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {state.passes.map((pass, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 12px', borderRadius: 6,
                  background: '#0f0f13', border: '1px solid #1e1e2e',
                }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                    <circle cx="6" cy="6" r="5.5" stroke="#22c55e" strokeWidth="1"/>
                    <path d="M3.5 6l2 2 3-3.5" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{pass.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AxeToggle — toolbar button (mirrors GridToggle style)
// ---------------------------------------------------------------------------

export interface AxeToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
}

export function AxeToggle({ value, onChange }: AxeToggleProps): React.ReactElement {
  const buttonStyle: React.CSSProperties = {
    background: value ? 'rgba(34,197,94,0.15)' : 'transparent',
    border: '1px solid',
    borderColor: value ? 'rgba(34,197,94,0.5)' : '#2a2a36',
    borderRadius: 6,
    padding: '5px 8px',
    cursor: 'pointer',
    color: value ? '#22c55e' : '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    fontWeight: 600,
  };

  return (
    <button
      style={buttonStyle}
      onClick={() => onChange(!value)}
      title="Toggle accessibility check"
      aria-pressed={value}
    >
      {/* Simple "A11y" icon — eye-like circle with tick */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1" />
        <path d="M5.5 8.5 L7.5 10.5 L10.5 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      A11y
    </button>
  );
}

export default AxePanel;
