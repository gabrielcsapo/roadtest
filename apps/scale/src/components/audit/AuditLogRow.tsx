import React from "react";
import { AuditLog } from "../../types";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { AuditActionBadge } from "./AuditActionBadge";

interface AuditLogRowProps {
  log: AuditLog;
  onClick?: (log: AuditLog) => void;
  compact?: boolean;
}

const targetTypeIcons: Record<string, string> = {
  vendor: "🏢",
  policy: "📄",
  credential: "🔑",
  user: "👤",
  control: "🛡️",
  report: "📊",
};

function formatTimestamp(timestamp: string, compact: boolean): string {
  const date = new Date(timestamp);
  if (compact) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleString();
}

function describeAction(action: string, target: string): string {
  const parts = action.split(".");
  const entity = parts[0] || "item";
  const verb = parts[1] || "modified";
  return `${verb.charAt(0).toUpperCase() + verb.slice(1).replace(/_/g, " ")} ${entity}: ${target}`;
}

export function AuditLogRow({ log, onClick, compact = false }: AuditLogRowProps) {
  const handleClick = () => onClick?.(log);
  const icon = targetTypeIcons[log.targetType] || "📋";
  const actionDescription = describeAction(log.action, log.target);

  return (
    <div
      data-testid="audit-log-row"
      data-log-id={log.id}
      data-compact={compact}
      onClick={handleClick}
      style={{
        display: "flex",
        alignItems: compact ? "center" : "flex-start",
        gap: compact ? "8px" : "12px",
        padding: compact ? "8px 12px" : "12px 16px",
        cursor: onClick ? "pointer" : "default",
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "white",
      }}
    >
      <span data-testid="action-icon" style={{ fontSize: compact ? "16px" : "20px" }}>
        {icon}
      </span>

      <Avatar
        data-testid="actor-avatar"
        src={log.actor.avatarUrl}
        name={log.actor.name}
        size={compact ? "xs" : "sm"}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span
            data-testid="actor-name"
            style={{ fontWeight: 500, fontSize: compact ? "0.75rem" : "0.875rem" }}
          >
            {log.actor.name}
          </span>
          <AuditActionBadge
            data-testid="action-badge"
            action={log.action}
            size={compact ? "sm" : "md"}
          />
        </div>
        {!compact && (
          <div
            data-testid="action-description"
            style={{ fontSize: "0.875rem", color: "#374151", marginTop: "2px" }}
          >
            {actionDescription}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
          <span
            data-testid="target-name"
            style={{
              fontSize: "0.75rem",
              color: "#6b7280",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: compact ? "120px" : "200px",
            }}
          >
            {log.target}
          </span>
          <span data-testid="target-type" style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
            ({log.targetType})
          </span>
        </div>
      </div>

      <span
        data-testid="log-timestamp"
        style={{ fontSize: "0.75rem", color: "#9ca3af", whiteSpace: "nowrap" }}
      >
        {formatTimestamp(log.timestamp, compact)}
      </span>
    </div>
  );
}
