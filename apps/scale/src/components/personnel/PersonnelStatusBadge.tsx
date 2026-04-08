import React from "react";
import { Badge } from "../ui/Badge";
import { Personnel } from "../../types";

interface PersonnelStatusBadgeProps {
  status: Personnel["status"];
  size?: "sm" | "md";
  showIcon?: boolean;
}

const STATUS_CONFIG: Record<
  Personnel["status"],
  { label: string; icon: string; color: string; bg: string }
> = {
  active: { label: "Active", icon: "●", color: "#15803d", bg: "#dcfce7" },
  offboarding: { label: "Offboarding", icon: "◐", color: "#b45309", bg: "#fef3c7" },
  offboarded: { label: "Offboarded", icon: "○", color: "#6b7280", bg: "#f3f4f6" },
};

export function PersonnelStatusBadge({
  status,
  size = "md",
  showIcon = true,
}: PersonnelStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const fontSize = size === "sm" ? "11px" : "13px";
  const padding = size === "sm" ? "2px 6px" : "4px 10px";

  return (
    <span
      data-testid="personnel-status-badge"
      data-status={status}
      data-size={size}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontSize,
        padding,
        borderRadius: "9999px",
        fontWeight: 500,
        color: config.color,
        backgroundColor: config.bg,
        whiteSpace: "nowrap",
      }}
    >
      {showIcon && (
        <span
          data-testid="status-icon"
          aria-hidden="true"
          style={{ fontSize: size === "sm" ? "8px" : "10px" }}
        >
          {config.icon}
        </span>
      )}
      <span data-testid="status-label">{config.label}</span>
    </span>
  );
}
