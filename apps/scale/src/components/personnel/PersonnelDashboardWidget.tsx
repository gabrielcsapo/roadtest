import React from "react";
import { Personnel } from "../../types";
import { Spinner } from "../ui/Spinner";

interface PersonnelDashboardWidgetProps {
  people: Personnel[];
  loading?: boolean;
  onClick?: (view: "all" | "offboarding" | "pending-bgcheck") => void;
}

export function PersonnelDashboardWidget({
  people,
  loading = false,
  onClick,
}: PersonnelDashboardWidgetProps) {
  const total = people.length;
  const activeCount = people.filter((p) => p.status === "active").length;
  const offboardingCount = people.filter((p) => p.status === "offboarding").length;
  const offboardedCount = people.filter((p) => p.status === "offboarded").length;
  const pendingBgCheck = people.filter((p) => p.backgroundCheckStatus === "pending").length;
  const failedBgCheck = people.filter((p) => p.backgroundCheckStatus === "failed").length;

  if (loading) {
    return (
      <div
        data-testid="personnel-widget-loading"
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
        data-testid="personnel-widget-empty"
        style={{
          padding: "32px",
          textAlign: "center",
          background: "#fff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          color: "#9ca3af",
        }}
      >
        No personnel data
      </div>
    );
  }

  return (
    <div
      data-testid="personnel-dashboard-widget"
      style={{
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        padding: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div
        data-testid="widget-title"
        style={{ fontSize: "16px", fontWeight: 700, color: "#111827", marginBottom: "20px" }}
      >
        Personnel Overview
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div
          data-testid="stat-total"
          onClick={() => onClick?.("all")}
          style={{
            padding: "16px",
            borderRadius: "8px",
            background: "#f8fafc",
            border: "1px solid #e5e7eb",
            cursor: onClick ? "pointer" : "default",
            textAlign: "center",
          }}
        >
          <div
            data-testid="stat-total-count"
            style={{ fontSize: "28px", fontWeight: 700, color: "#111827" }}
          >
            {total}
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
            Total Headcount
          </div>
        </div>

        <div
          data-testid="stat-offboarding"
          onClick={() => onClick?.("offboarding")}
          style={{
            padding: "16px",
            borderRadius: "8px",
            background: offboardingCount > 0 ? "#fef3c7" : "#f8fafc",
            border: `1px solid ${offboardingCount > 0 ? "#fde68a" : "#e5e7eb"}`,
            cursor: onClick ? "pointer" : "default",
            textAlign: "center",
          }}
        >
          <div
            data-testid="stat-offboarding-count"
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: offboardingCount > 0 ? "#b45309" : "#111827",
            }}
          >
            {offboardingCount}
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>Offboarding</div>
        </div>

        <div
          data-testid="stat-pending-bgcheck"
          onClick={() => onClick?.("pending-bgcheck")}
          style={{
            padding: "16px",
            borderRadius: "8px",
            background: pendingBgCheck > 0 ? "#fef3c7" : "#f8fafc",
            border: `1px solid ${pendingBgCheck > 0 ? "#fde68a" : "#e5e7eb"}`,
            cursor: onClick ? "pointer" : "default",
            textAlign: "center",
          }}
        >
          <div
            data-testid="stat-pending-bgcheck-count"
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: pendingBgCheck > 0 ? "#b45309" : "#111827",
            }}
          >
            {pendingBgCheck}
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
            Pending BG Check
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div
          data-testid="stat-row-active"
          style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}
        >
          <span style={{ color: "#374151" }}>Active</span>
          <span data-testid="active-count" style={{ fontWeight: 600, color: "#111827" }}>
            {activeCount}
          </span>
        </div>

        <div
          data-testid="stat-row-offboarded"
          style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}
        >
          <span style={{ color: "#374151" }}>Offboarded</span>
          <span data-testid="offboarded-count" style={{ fontWeight: 600, color: "#111827" }}>
            {offboardedCount}
          </span>
        </div>

        {failedBgCheck > 0 && (
          <div
            data-testid="stat-row-failed-bgcheck"
            style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}
          >
            <span style={{ color: "#dc2626" }}>Failed BG Check</span>
            <span data-testid="failed-bgcheck-count" style={{ fontWeight: 600, color: "#dc2626" }}>
              {failedBgCheck}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
