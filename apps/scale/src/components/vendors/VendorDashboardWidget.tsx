import React from 'react'
import { Vendor, Risk } from '../../types'
import { Card } from '../ui/Card'
import { RiskBadge } from '../ui/RiskBadge'
import { StatusBadge } from '../ui/StatusBadge'
import { Progress } from '../ui/Progress'
import { Spinner } from '../ui/Spinner'
import { Badge } from '../ui/Badge'

interface VendorDashboardWidgetProps {
  vendors: Vendor[]
  onClick?: (vendor?: Vendor) => void
  loading?: boolean
}

const RISK_ORDER: Risk[] = ['critical', 'high', 'medium', 'low']
const RISK_COLORS: Record<Risk, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
}

export function VendorDashboardWidget({ vendors, onClick, loading = false }: VendorDashboardWidgetProps) {
  if (loading) {
    return (
      <Card data-testid="vendor-dashboard-widget" data-loading="true">
        <div data-testid="widget-loading" style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
          <Spinner />
        </div>
      </Card>
    )
  }

  const total = vendors.length
  const riskCounts = RISK_ORDER.reduce<Record<Risk, number>>((acc, r) => {
    acc[r] = vendors.filter(v => v.riskLevel === r).length
    return acc
  }, { critical: 0, high: 0, medium: 0, low: 0 })

  const topRiskVendors = vendors
    .filter(v => v.riskLevel === 'critical' || v.riskLevel === 'high')
    .slice(0, 3)

  const activeCount = vendors.filter(v => v.status === 'active').length

  return (
    <Card
      data-testid="vendor-dashboard-widget"
      data-loading="false"
      onClick={() => onClick?.()}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div data-testid="widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 data-testid="widget-title" style={{ margin: 0 }}>Vendors</h3>
        <Badge data-testid="widget-total-badge">{total} total</Badge>
      </div>

      <div data-testid="widget-stats" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div data-testid="stat-total" style={{ textAlign: 'center' }}>
          <div data-testid="stat-total-count" style={{ fontSize: '28px', fontWeight: 'bold' }}>{total}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Total</div>
        </div>
        <div data-testid="stat-active" style={{ textAlign: 'center' }}>
          <div data-testid="stat-active-count" style={{ fontSize: '28px', fontWeight: 'bold', color: '#22c55e' }}>{activeCount}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Active</div>
        </div>
        <div data-testid="stat-critical" style={{ textAlign: 'center' }}>
          <div data-testid="stat-critical-count" style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>{riskCounts.critical}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Critical</div>
        </div>
      </div>

      <div data-testid="widget-risk-breakdown" style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600 }}>RISK BREAKDOWN</div>
        {RISK_ORDER.map(risk => {
          const count = riskCounts[risk]
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={risk} data-testid={`widget-risk-row-${risk}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span data-testid={`widget-risk-label-${risk}`} style={{ width: '60px', fontSize: '12px', textTransform: 'capitalize' }}>{risk}</span>
              <Progress data-testid={`widget-risk-progress-${risk}`} value={pct} color={RISK_COLORS[risk]} style={{ flex: 1 }} />
              <span data-testid={`widget-risk-count-${risk}`} style={{ fontSize: '12px', color: '#6b7280', width: '30px', textAlign: 'right' }}>{count}</span>
            </div>
          )
        })}
      </div>

      {topRiskVendors.length > 0 && (
        <div data-testid="widget-top-risk-vendors">
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600 }}>TOP RISK VENDORS</div>
          {topRiskVendors.map(vendor => (
            <div
              key={vendor.id}
              data-testid={`widget-vendor-${vendor.id}`}
              onClick={e => { e.stopPropagation(); onClick?.(vendor) }}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', cursor: onClick ? 'pointer' : 'default', borderBottom: '1px solid #f3f4f6' }}
            >
              <span data-testid={`widget-vendor-name-${vendor.id}`} style={{ fontSize: '13px' }}>{vendor.name}</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <RiskBadge risk={vendor.riskLevel} data-testid={`widget-vendor-risk-${vendor.id}`} />
                <StatusBadge status={vendor.status} data-testid={`widget-vendor-status-${vendor.id}`} />
              </div>
            </div>
          ))}
        </div>
      )}

      {topRiskVendors.length === 0 && (
        <div data-testid="widget-no-risk-vendors" style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', padding: '12px 0' }}>
          No high-risk vendors
        </div>
      )}
    </Card>
  )
}

export default VendorDashboardWidget
