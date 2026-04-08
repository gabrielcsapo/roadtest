import React from "react";
import { Credential } from "../../types";
import { Spinner } from "../ui/Spinner";

interface CredentialDashboardWidgetProps {
  credentials: Credential[];
  loading?: boolean;
  onViewExpiring?: () => void;
  onViewExpired?: () => void;
}

export function CredentialDashboardWidget({
  credentials,
  loading = false,
  onViewExpiring,
  onViewExpired,
}: CredentialDashboardWidgetProps) {
  const total = credentials.length;
  const validCount = credentials.filter((c) => c.status === "valid").length;
  const expiringSoonCount = credentials.filter((c) => c.status === "expiring-soon").length;
  const expiredCount = credentials.filter((c) => c.status === "expired").length;

  const byType = {
    "api-key": credentials.filter((c) => c.type === "api-key").length,
    certificate: credentials.filter((c) => c.type === "certificate").length,
    password: credentials.filter((c) => c.type === "password").length,
    "oauth-token": credentials.filter((c) => c.type === "oauth-token").length,
  };

  if (loading) {
    return (
      <div
        data-testid="cred-widget-loading"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px",
          background: "#fff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
        }}
      >
        <Spinner />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div
        data-testid="cred-widget-empty"
        style={{
          padding: "32px",
          textAlign: "center",
          background: "#fff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          color: "#9ca3af",
          fontSize: "14px",
        }}
      >
        No credentials
      </div>
    );
  }

  return (
    <div
      data-testid="credential-dashboard-widget"
      style={{
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        padding: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div
        data-testid="cred-widget-title"
        style={{ fontSize: "16px", fontWeight: 700, color: "#111827", marginBottom: "20px" }}
      >
        Credentials Overview
      </div>

      {/* Summary row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div
          data-testid="stat-total"
          style={{
            padding: "14px",
            borderRadius: "8px",
            background: "#f8fafc",
            border: "1px solid #e5e7eb",
            textAlign: "center",
          }}
        >
          <div
            data-testid="stat-total-count"
            style={{ fontSize: "26px", fontWeight: 700, color: "#111827" }}
          >
            {total}
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>Total</div>
        </div>

        <div
          data-testid="stat-expiring"
          onClick={onViewExpiring}
          style={{
            padding: "14px",
            borderRadius: "8px",
            background: expiringSoonCount > 0 ? "#fffbeb" : "#f8fafc",
            border: `1px solid ${expiringSoonCount > 0 ? "#fde68a" : "#e5e7eb"}`,
            textAlign: "center",
            cursor: onViewExpiring ? "pointer" : "default",
          }}
        >
          <div
            data-testid="stat-expiring-count"
            style={{
              fontSize: "26px",
              fontWeight: 700,
              color: expiringSoonCount > 0 ? "#b45309" : "#111827",
            }}
          >
            {expiringSoonCount}
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>Expiring Soon</div>
        </div>

        <div
          data-testid="stat-expired"
          onClick={onViewExpired}
          style={{
            padding: "14px",
            borderRadius: "8px",
            background: expiredCount > 0 ? "#fef2f2" : "#f8fafc",
            border: `1px solid ${expiredCount > 0 ? "#fecaca" : "#e5e7eb"}`,
            textAlign: "center",
            cursor: onViewExpired ? "pointer" : "default",
          }}
        >
          <div
            data-testid="stat-expired-count"
            style={{
              fontSize: "26px",
              fontWeight: 700,
              color: expiredCount > 0 ? "#dc2626" : "#111827",
            }}
          >
            {expiredCount}
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>Expired</div>
        </div>
      </div>

      {/* By type breakdown */}
      <div
        data-testid="type-breakdown"
        style={{ display: "flex", flexDirection: "column", gap: "8px" }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "4px",
          }}
        >
          By Type
        </div>

        {Object.entries(byType).map(([type, count]) => (
          <div
            key={type}
            data-testid={`type-row-${type}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "13px",
            }}
          >
            <span style={{ color: "#374151" }}>
              {type === "api-key"
                ? "API Keys"
                : type === "oauth-token"
                  ? "OAuth Tokens"
                  : type.charAt(0).toUpperCase() + type.slice(1) + "s"}
            </span>
            <span data-testid={`type-count-${type}`} style={{ fontWeight: 600, color: "#111827" }}>
              {count}
            </span>
          </div>
        ))}
      </div>

      <div data-testid="stat-valid-count" style={{ display: "none" }}>
        {validCount}
      </div>
    </div>
  );
}
