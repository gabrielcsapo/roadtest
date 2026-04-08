import React from "react";
import { Credential } from "../../types";

interface CredentialStatusBadgeProps {
  status: Credential["status"];
  expiresAt?: string | null;
  showDaysRemaining?: boolean;
}

const STATUS_CONFIG: Record<
  Credential["status"],
  { label: string; icon: string; color: string; bg: string }
> = {
  valid: { label: "Valid", icon: "✓", color: "#15803d", bg: "#dcfce7" },
  "expiring-soon": { label: "Expiring Soon", icon: "⚠", color: "#b45309", bg: "#fef3c7" },
  expired: { label: "Expired", icon: "✗", color: "#dc2626", bg: "#fee2e2" },
};

function getDaysRemaining(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null;
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function CredentialStatusBadge({
  status,
  expiresAt,
  showDaysRemaining = false,
}: CredentialStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const daysRemaining = showDaysRemaining ? getDaysRemaining(expiresAt) : null;

  return (
    <span
      data-testid="credential-status-badge"
      data-status={status}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "13px",
        padding: "4px 10px",
        borderRadius: "9999px",
        fontWeight: 500,
        color: config.color,
        backgroundColor: config.bg,
        whiteSpace: "nowrap",
      }}
    >
      <span data-testid="status-icon" aria-hidden="true">
        {config.icon}
      </span>
      <span data-testid="status-label">{config.label}</span>
      {showDaysRemaining && daysRemaining !== null && (
        <span data-testid="days-remaining" style={{ fontSize: "11px", opacity: 0.85 }}>
          ({daysRemaining > 0 ? `${daysRemaining}d left` : `${Math.abs(daysRemaining)}d ago`})
        </span>
      )}
      {showDaysRemaining && expiresAt === null && (
        <span data-testid="no-expiry" style={{ fontSize: "11px", opacity: 0.85 }}>
          (no expiry)
        </span>
      )}
    </span>
  );
}
