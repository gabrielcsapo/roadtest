import React from "react";
import { Risk } from "../../types";
import { Card } from "../ui/Card";
import { Spinner } from "../ui/Spinner";
import { Badge } from "../ui/Badge";

interface OverviewSummary {
  vendors: {
    total: number;
    byRisk: Record<Risk, number>;
  };
  personnel: {
    total: number;
    offboarding: number;
    pendingBgCheck: number;
  };
  credentials: {
    total: number;
    expiringSoon: number;
    expired: number;
  };
  policies: {
    total: number;
    byStatus: Record<string, number>;
  };
  issues: {
    total: number;
    bySeverity: Record<Risk, number>;
  };
}

interface ComplianceOverviewProps {
  summary: OverviewSummary;
  loading?: boolean;
  onVendorsClick?: () => void;
  onPersonnelClick?: () => void;
  onCredentialsClick?: () => void;
  onPoliciesClick?: () => void;
  onIssuesClick?: () => void;
}

function getRiskColor(count: number, threshold: number): string {
  if (count === 0) return "#10b981";
  if (count <= threshold) return "#f59e0b";
  return "#ef4444";
}

export function ComplianceOverview({
  summary,
  loading,
  onVendorsClick,
  onPersonnelClick,
  onCredentialsClick,
  onPoliciesClick,
  onIssuesClick,
}: ComplianceOverviewProps) {
  if (loading) {
    return (
      <div
        data-testid="compliance-overview-loading"
        style={{ display: "flex", justifyContent: "center", padding: "40px" }}
      >
        <Spinner data-testid="overview-spinner" />
      </div>
    );
  }

  const criticalIssues = summary.issues.bySeverity.critical || 0;
  const highIssues = summary.issues.bySeverity.high || 0;
  const expiredCredentials = summary.credentials.expired || 0;
  const nonCompliantPolicies = summary.policies.byStatus["non-compliant"] || 0;

  return (
    <div
      data-testid="compliance-overview-container"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "16px",
      }}
    >
      {/* Vendors Card */}
      <Card
        data-testid="vendors-card"
        onClick={onVendorsClick}
        style={{ cursor: onVendorsClick ? "pointer" : "default" }}
      >
        <div data-testid="vendors-section">
          <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "4px" }}>Vendors</div>
          <div
            data-testid="vendors-total"
            style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827" }}
          >
            {summary.vendors.total}
          </div>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
            {(Object.keys(summary.vendors.byRisk) as Risk[]).map(
              (risk) =>
                summary.vendors.byRisk[risk] > 0 && (
                  <Badge
                    key={risk}
                    data-testid={`vendors-risk-${risk}`}
                    color={
                      risk === "critical"
                        ? "red"
                        : risk === "high"
                          ? "orange"
                          : risk === "medium"
                            ? "yellow"
                            : "green"
                    }
                    size="sm"
                  >
                    {risk}: {summary.vendors.byRisk[risk]}
                  </Badge>
                ),
            )}
          </div>
        </div>
      </Card>

      {/* Personnel Card */}
      <Card
        data-testid="personnel-card"
        onClick={onPersonnelClick}
        style={{ cursor: onPersonnelClick ? "pointer" : "default" }}
      >
        <div data-testid="personnel-section">
          <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "4px" }}>
            Personnel
          </div>
          <div
            data-testid="personnel-total"
            style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827" }}
          >
            {summary.personnel.total}
          </div>
          <div style={{ marginTop: "4px", fontSize: "0.75rem" }}>
            {summary.personnel.offboarding > 0 && (
              <span
                data-testid="personnel-offboarding"
                style={{ color: "#f59e0b", marginRight: "8px" }}
              >
                {summary.personnel.offboarding} offboarding
              </span>
            )}
            {summary.personnel.pendingBgCheck > 0 && (
              <span data-testid="personnel-pending-bg" style={{ color: "#6b7280" }}>
                {summary.personnel.pendingBgCheck} pending bg check
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Credentials Card */}
      <Card
        data-testid="credentials-card"
        onClick={onCredentialsClick}
        style={{ cursor: onCredentialsClick ? "pointer" : "default" }}
      >
        <div data-testid="credentials-section">
          <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "4px" }}>
            Credentials
          </div>
          <div
            data-testid="credentials-total"
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: expiredCredentials > 0 ? "#ef4444" : "#111827",
            }}
          >
            {summary.credentials.total}
          </div>
          <div style={{ marginTop: "4px", fontSize: "0.75rem" }}>
            {summary.credentials.expired > 0 && (
              <span
                data-testid="credentials-expired"
                style={{ color: "#ef4444", marginRight: "8px" }}
              >
                {summary.credentials.expired} expired
              </span>
            )}
            {summary.credentials.expiringSoon > 0 && (
              <span data-testid="credentials-expiring-soon" style={{ color: "#f59e0b" }}>
                {summary.credentials.expiringSoon} expiring soon
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Policies Card */}
      <Card
        data-testid="policies-card"
        onClick={onPoliciesClick}
        style={{ cursor: onPoliciesClick ? "pointer" : "default" }}
      >
        <div data-testid="policies-section">
          <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "4px" }}>Policies</div>
          <div
            data-testid="policies-total"
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: nonCompliantPolicies > 0 ? "#ef4444" : "#111827",
            }}
          >
            {summary.policies.total}
          </div>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
            {Object.entries(summary.policies.byStatus).map(
              ([status, count]) =>
                count > 0 && (
                  <Badge
                    key={status}
                    data-testid={`policies-status-${status}`}
                    color={
                      status === "compliant"
                        ? "green"
                        : status === "non-compliant"
                          ? "red"
                          : status === "in-progress"
                            ? "yellow"
                            : "gray"
                    }
                    size="sm"
                  >
                    {count}
                  </Badge>
                ),
            )}
          </div>
        </div>
      </Card>

      {/* Issues Card */}
      <Card
        data-testid="issues-card"
        onClick={onIssuesClick}
        style={{ cursor: onIssuesClick ? "pointer" : "default" }}
      >
        <div data-testid="issues-section">
          <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "4px" }}>Issues</div>
          <div
            data-testid="issues-total"
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: criticalIssues > 0 ? "#ef4444" : "#111827",
            }}
          >
            {summary.issues.total}
          </div>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
            {(Object.keys(summary.issues.bySeverity) as Risk[]).map(
              (severity) =>
                summary.issues.bySeverity[severity] > 0 && (
                  <Badge
                    key={severity}
                    data-testid={`issues-severity-${severity}`}
                    color={
                      severity === "critical"
                        ? "red"
                        : severity === "high"
                          ? "orange"
                          : severity === "medium"
                            ? "yellow"
                            : "green"
                    }
                    size="sm"
                  >
                    {severity}: {summary.issues.bySeverity[severity]}
                  </Badge>
                ),
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
