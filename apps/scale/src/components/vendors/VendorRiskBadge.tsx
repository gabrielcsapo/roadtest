import React from "react";
import { Vendor, Risk } from "../../types";
import { RiskBadge } from "../ui/RiskBadge";
import { Badge } from "../ui/Badge";

type Trend = "up" | "down" | "stable";
type Size = "sm" | "md" | "lg";

interface VendorRiskBadgeProps {
  vendor: Vendor;
  showTrend?: boolean;
  showDate?: boolean;
  size?: Size;
  trend?: Trend;
  assessmentDate?: string;
}

const TREND_ICONS: Record<Trend, string> = {
  up: "↑",
  down: "↓",
  stable: "→",
};

const TREND_COLORS: Record<Trend, string> = {
  up: "#ef4444",
  down: "#22c55e",
  stable: "#6b7280",
};

const SIZE_STYLES: Record<Size, React.CSSProperties> = {
  sm: { fontSize: "11px", padding: "2px 6px" },
  md: { fontSize: "13px", padding: "4px 8px" },
  lg: { fontSize: "15px", padding: "6px 12px" },
};

export function VendorRiskBadge({
  vendor,
  showTrend = false,
  showDate = false,
  size = "md",
  trend = "stable",
  assessmentDate,
}: VendorRiskBadgeProps) {
  return (
    <div
      data-testid="vendor-risk-badge"
      data-size={size}
      style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
    >
      <RiskBadge data-testid="risk-badge-core" risk={vendor.riskLevel} style={SIZE_STYLES[size]} />
      {showTrend && (
        <span
          data-testid="risk-trend"
          data-trend={trend}
          style={{
            color: TREND_COLORS[trend],
            fontWeight: "bold",
            fontSize: SIZE_STYLES[size].fontSize,
          }}
        >
          {TREND_ICONS[trend]}
        </span>
      )}
      {showDate && assessmentDate && (
        <span data-testid="risk-assessment-date" style={{ color: "#6b7280", fontSize: "11px" }}>
          {assessmentDate}
        </span>
      )}
    </div>
  );
}

export default VendorRiskBadge;
