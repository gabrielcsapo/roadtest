import React from "react";
import { Vendor, ComplianceStatus } from "../../types";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Progress } from "../ui/Progress";

interface Framework {
  name: string;
  status: ComplianceStatus;
}

interface VendorComplianceStatusProps {
  vendor: Vendor;
  frameworks: Framework[];
  compact?: boolean;
}

const STATUS_COLORS: Record<ComplianceStatus, string> = {
  compliant: "#22c55e",
  "non-compliant": "#ef4444",
  "in-progress": "#f59e0b",
  "not-applicable": "#9ca3af",
};

const STATUS_LABELS: Record<ComplianceStatus, string> = {
  compliant: "Compliant",
  "non-compliant": "Non-Compliant",
  "in-progress": "In Progress",
  "not-applicable": "N/A",
};

export function VendorComplianceStatus({
  vendor,
  frameworks,
  compact = false,
}: VendorComplianceStatusProps) {
  const compliantCount = frameworks.filter((f) => f.status === "compliant").length;
  const total = frameworks.length;
  const complianceScore = total > 0 ? Math.round((compliantCount / total) * 100) : 0;

  return (
    <Card data-testid="vendor-compliance-status">
      <div
        data-testid="compliance-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div>
          <h3 data-testid="compliance-title" style={{ margin: 0 }}>
            {compact ? "Compliance" : `${vendor.name} Compliance`}
          </h3>
          {!compact && (
            <span data-testid="compliance-subtitle" style={{ color: "#6b7280", fontSize: "13px" }}>
              {vendor.category}
            </span>
          )}
        </div>
        <div data-testid="compliance-score-badge" style={{ textAlign: "right" }}>
          <span
            data-testid="compliance-score"
            style={{
              fontSize: compact ? "20px" : "28px",
              fontWeight: "bold",
              color:
                complianceScore >= 80 ? "#22c55e" : complianceScore >= 50 ? "#f59e0b" : "#ef4444",
            }}
          >
            {complianceScore}%
          </span>
        </div>
      </div>

      <Progress data-testid="compliance-progress" value={complianceScore} />

      <div
        data-testid="compliance-summary"
        style={{ marginTop: "8px", fontSize: "13px", color: "#6b7280" }}
      >
        {compliantCount} of {total} frameworks compliant
      </div>

      {!compact && frameworks.length > 0 && (
        <div
          data-testid="compliance-frameworks"
          style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}
        >
          {frameworks.map((fw) => (
            <div
              key={fw.name}
              data-testid={`framework-item-${fw.name.replace(/\s+/g, "-").toLowerCase()}`}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span data-testid={`framework-name-${fw.name.replace(/\s+/g, "-").toLowerCase()}`}>
                {fw.name}
              </span>
              <Badge
                data-testid={`framework-status-${fw.name.replace(/\s+/g, "-").toLowerCase()}`}
                style={{ backgroundColor: STATUS_COLORS[fw.status], color: "white" }}
              >
                {STATUS_LABELS[fw.status]}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {compact && frameworks.length > 0 && (
        <div
          data-testid="compliance-compact-badges"
          style={{ marginTop: "8px", display: "flex", gap: "4px", flexWrap: "wrap" }}
        >
          {frameworks.map((fw) => (
            <Badge
              key={fw.name}
              data-testid={`compact-framework-${fw.name.replace(/\s+/g, "-").toLowerCase()}`}
              style={{
                backgroundColor: STATUS_COLORS[fw.status],
                color: "white",
                fontSize: "10px",
              }}
            >
              {fw.name}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}

export default VendorComplianceStatus;
