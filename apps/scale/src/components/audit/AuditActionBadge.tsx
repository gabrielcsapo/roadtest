import React from "react";
import { Badge } from "../ui/Badge";

interface AuditActionBadgeProps {
  action: string;
  size?: "sm" | "md";
  "data-testid"?: string;
}

function getActionCategory(action: string): { color: string; label: string } {
  const verb = action.split(".")[1] || action;

  if (["created", "added", "uploaded", "registered"].includes(verb)) {
    return { color: "green", label: "Create" };
  }
  if (
    ["updated", "modified", "changed", "rotated", "renewed", "role_changed", "edited"].includes(
      verb,
    )
  ) {
    return { color: "blue", label: "Update" };
  }
  if (["deleted", "removed", "revoked", "terminated"].includes(verb)) {
    return { color: "red", label: "Delete" };
  }
  if (["viewed", "accessed", "downloaded", "exported", "read"].includes(verb)) {
    return { color: "gray", label: "View" };
  }
  return { color: "gray", label: "Action" };
}

export function AuditActionBadge({
  action,
  size = "md",
  "data-testid": testId,
}: AuditActionBadgeProps) {
  const { color, label } = getActionCategory(action);

  return (
    <Badge
      data-testid={testId || "audit-action-badge"}
      color={color}
      size={size}
      data-action={action}
      data-category={label.toLowerCase()}
    >
      <span data-testid="action-badge-label">{label}</span>
    </Badge>
  );
}
