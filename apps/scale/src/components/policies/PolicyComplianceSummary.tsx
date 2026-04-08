import React from "react";
import { Policy, ComplianceStatus } from "../../types";
import { Card } from "../ui/Card";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/EmptyState";

interface PolicyComplianceSummaryProps {
  policies: Policy[];
  onFilterByStatus?: (status: ComplianceStatus) => void;
  loading?: boolean;
}

const statusConfig: Record<ComplianceStatus, { label: string; color: string; bgColor: string }> = {
  compliant: { label: "Compliant", color: "#10b981", bgColor: "#d1fae5" },
  "non-compliant": { label: "Non-Compliant", color: "#ef4444", bgColor: "#fee2e2" },
  "in-progress": { label: "In Progress", color: "#f59e0b", bgColor: "#fef3c7" },
  "not-applicable": { label: "Not Applicable", color: "#6b7280", bgColor: "#f3f4f6" },
};

const allStatuses: ComplianceStatus[] = [
  "compliant",
  "non-compliant",
  "in-progress",
  "not-applicable",
];

export function PolicyComplianceSummary({
  policies,
  onFilterByStatus,
  loading,
}: PolicyComplianceSummaryProps) {
  if (loading) {
    return (
      <div
        data-testid="compliance-summary-loading"
        style={{ display: "flex", justifyContent: "center", padding: "40px" }}
      >
        <Spinner data-testid="compliance-summary-spinner" />
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <EmptyState
        data-testid="compliance-summary-empty"
        title="No policies"
        description="Add policies to see compliance summary."
      />
    );
  }

  const counts = allStatuses.reduce(
    (acc, status) => {
      acc[status] = policies.filter((p) => p.status === status).length;
      return acc;
    },
    {} as Record<ComplianceStatus, number>,
  );

  const total = policies.length;

  return (
    <div data-testid="compliance-summary-container">
      <h3
        data-testid="compliance-summary-title"
        style={{ marginBottom: "16px", fontSize: "1rem", fontWeight: 600 }}
      >
        Compliance Summary
      </h3>
      <div
        data-testid="compliance-summary-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}
      >
        {allStatuses.map((status) => {
          const config = statusConfig[status];
          const count = counts[status];
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <Card
              key={status}
              data-testid={`status-card-${status}`}
              onClick={onFilterByStatus ? () => onFilterByStatus(status) : undefined}
              style={{
                cursor: onFilterByStatus ? "pointer" : "default",
                backgroundColor: config.bgColor,
                border: `1px solid ${config.color}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div
                    data-testid={`status-label-${status}`}
                    style={{ fontSize: "0.875rem", color: "#374151", fontWeight: 500 }}
                  >
                    {config.label}
                  </div>
                  <div
                    data-testid={`status-count-${status}`}
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: config.color,
                      marginTop: "4px",
                    }}
                  >
                    {count}
                  </div>
                </div>
                <div
                  data-testid={`status-percentage-${status}`}
                  style={{ fontSize: "0.875rem", color: config.color, fontWeight: 600 }}
                >
                  {percentage}%
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <div
        data-testid="compliance-summary-total"
        style={{ marginTop: "12px", fontSize: "0.875rem", color: "#6b7280" }}
      >
        Total: {total} policies
      </div>
    </div>
  );
}
