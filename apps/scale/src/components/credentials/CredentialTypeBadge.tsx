import React from "react";
import { Credential } from "../../types";

interface CredentialTypeBadgeProps {
  type: Credential["type"];
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const TYPE_CONFIG: Record<
  Credential["type"],
  { label: string; icon: string; color: string; bg: string }
> = {
  "api-key": { label: "API Key", icon: "⚿", color: "#1d4ed8", bg: "#eff6ff" },
  certificate: { label: "Certificate", icon: "🔒", color: "#7c3aed", bg: "#f5f3ff" },
  password: { label: "Password", icon: "●●●", color: "#374151", bg: "#f3f4f6" },
  "oauth-token": { label: "OAuth Token", icon: "⟳", color: "#0369a1", bg: "#e0f2fe" },
};

const SIZE_CONFIG = {
  sm: { fontSize: "11px", padding: "2px 6px", iconSize: "10px" },
  md: { fontSize: "13px", padding: "4px 10px", iconSize: "13px" },
  lg: { fontSize: "15px", padding: "6px 14px", iconSize: "16px" },
};

export function CredentialTypeBadge({
  type,
  size = "md",
  showLabel = true,
}: CredentialTypeBadgeProps) {
  const config = TYPE_CONFIG[type];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <span
      data-testid="credential-type-badge"
      data-type={type}
      data-size={size}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontSize: sizeConfig.fontSize,
        padding: sizeConfig.padding,
        borderRadius: "9999px",
        fontWeight: 500,
        color: config.color,
        backgroundColor: config.bg,
        whiteSpace: "nowrap",
      }}
    >
      <span data-testid="type-icon" aria-hidden="true" style={{ fontSize: sizeConfig.iconSize }}>
        {config.icon}
      </span>
      {showLabel && <span data-testid="type-label">{config.label}</span>}
    </span>
  );
}
