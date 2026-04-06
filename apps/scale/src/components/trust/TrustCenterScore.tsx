import React from 'react'
import { Control, Framework, ComplianceStatus } from '../../types'
import { Spinner } from '../ui/Spinner'
import { EmptyState } from '../ui/EmptyState'
import { Progress } from '../ui/Progress'
import { PolicyFrameworkBadge } from '../policies/PolicyFrameworkBadge'

interface TrustCenterScoreProps {
  controls: Control[]
  showBreakdown?: boolean
  framework?: Framework
  loading?: boolean
}

const allFrameworks: Framework[] = ['SOC2', 'ISO27001', 'HIPAA', 'GDPR', 'PCI-DSS', 'FedRAMP']

function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Good'
  if (score >= 60) return 'Fair'
  return 'Needs Attention'
}

function calculateScore(controls: Control[]): number {
  if (controls.length === 0) return 0
  const compliantCount = controls.filter((c) => c.status === 'compliant').length
  return Math.round((compliantCount / controls.length) * 100)
}

export function TrustCenterScore({ controls, showBreakdown = false, framework, loading }: TrustCenterScoreProps) {
  if (loading) {
    return (
      <div data-testid="trust-score-loading" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner data-testid="trust-score-spinner" />
      </div>
    )
  }

  const filteredControls = framework ? controls.filter((c) => c.framework === framework) : controls
  const score = calculateScore(filteredControls)
  const scoreColor = getScoreColor(score)
  const scoreLabel = getScoreLabel(score)

  if (controls.length === 0) {
    return (
      <EmptyState
        data-testid="trust-score-empty"
        title="No controls"
        description="Add controls to calculate your trust score."
      />
    )
  }

  return (
    <div data-testid="trust-score-container" data-score={score}>
      <div
        data-testid="trust-score-circle"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          border: `8px solid ${scoreColor}`,
          margin: '0 auto 16px',
        }}
      >
        <span
          data-testid="trust-score-value"
          style={{ fontSize: '2.5rem', fontWeight: 700, color: scoreColor, lineHeight: 1 }}
        >
          {score}
        </span>
        <span style={{ fontSize: '1.25rem', color: scoreColor, fontWeight: 600 }}>%</span>
        <span
          data-testid="trust-score-label"
          style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}
        >
          {scoreLabel}
        </span>
      </div>

      <div data-testid="trust-score-summary" style={{ textAlign: 'center', marginBottom: '16px', color: '#6b7280', fontSize: '0.875rem' }}>
        {filteredControls.filter((c) => c.status === 'compliant').length} of {filteredControls.length} controls compliant
        {framework && <span data-testid="trust-score-framework-label"> ({framework})</span>}
      </div>

      {showBreakdown && (
        <div data-testid="trust-score-breakdown">
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
            By Framework
          </h4>
          {allFrameworks.map((fw) => {
            const fwControls = controls.filter((c) => c.framework === fw)
            if (fwControls.length === 0) return null
            const fwScore = calculateScore(fwControls)
            return (
              <div key={fw} data-testid={`breakdown-${fw}`} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <PolicyFrameworkBadge framework={fw} size="sm" />
                  <span
                    data-testid={`breakdown-score-${fw}`}
                    style={{ fontSize: '0.875rem', fontWeight: 600, color: getScoreColor(fwScore) }}
                  >
                    {fwScore}%
                  </span>
                </div>
                <Progress
                  data-testid={`breakdown-progress-${fw}`}
                  value={fwScore}
                  max={100}
                  color={fwScore >= 80 ? 'green' : fwScore >= 60 ? 'yellow' : 'red'}
                  height="6px"
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
