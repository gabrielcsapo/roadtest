import React from "react";
import { Vendor, Risk } from "../../types";
import { Card } from "../ui/Card";
import { Progress } from "../ui/Progress";
import { RiskBadge } from "../ui/RiskBadge";

interface VendorRiskSummaryProps {
  vendors: Vendor[];
  onClick?: (risk: Risk) => void;
}

const RISK_ORDER: Risk[] = ["critical", "high", "medium", "low"];
const RISK_COLORS: Record<Risk, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

export function VendorRiskSummary({ vendors, onClick }: VendorRiskSummaryProps) {
  const total = vendors.length;

  const counts = RISK_ORDER.reduce<Record<Risk, number>>(
    (acc, risk) => {
      acc[risk] = vendors.filter((v) => v.riskLevel === risk).length;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0 },
  );

  return (
    <Card data-testid="vendor-risk-summary">
      <h3 data-testid="risk-summary-title" style={{ margin: "0 0 16px 0" }}>
        Vendor Risk Summary
      </h3>
      <div
        data-testid="risk-summary-total"
        style={{ marginBottom: "16px", color: "#6b7280", fontSize: "14px" }}
      >
        Total vendors: <strong>{total}</strong>
      </div>
      <div
        data-testid="risk-summary-items"
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        {RISK_ORDER.map((risk) => {
          const count = counts[risk];
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div
              key={risk}
              data-testid={`risk-item-${risk}`}
              onClick={() => onClick?.(risk)}
              style={{ cursor: onClick ? "pointer" : "default" }}
            >
              <div
                style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}
              >
                <RiskBadge risk={risk} data-testid={`risk-badge-${risk}`} />
                <span data-testid={`risk-count-${risk}`}>
                  {count} ({pct}%)
                </span>
              </div>
              <Progress
                value={pct}
                color={RISK_COLORS[risk]}
                data-testid={`risk-progress-${risk}`}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default VendorRiskSummary;
