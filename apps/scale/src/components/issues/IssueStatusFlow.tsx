import React from "react";
import { Issue } from "../../types";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { Badge } from "../ui/Badge";

interface IssueStatusFlowProps {
  issue: Issue;
  onTransition: (newStatus: Issue["status"]) => void;
  loading?: boolean;
}

type IssueStatus = Issue["status"];

const statusColors: Record<IssueStatus, string> = {
  open: "red",
  "in-progress": "yellow",
  resolved: "green",
  "wont-fix": "gray",
};

const statusLabels: Record<IssueStatus, string> = {
  open: "Open",
  "in-progress": "In Progress",
  resolved: "Resolved",
  "wont-fix": "Won't Fix",
};

// Define available transitions from each status
const transitions: Record<IssueStatus, IssueStatus[]> = {
  open: ["in-progress", "wont-fix"],
  "in-progress": ["resolved", "open"],
  resolved: ["open"],
  "wont-fix": ["open"],
};

export function IssueStatusFlow({ issue, onTransition, loading = false }: IssueStatusFlowProps) {
  const availableTransitions = transitions[issue.status];

  return (
    <div data-testid="issue-status-flow" data-current-status={issue.status}>
      <div data-testid="current-status-section" style={{ marginBottom: "12px" }}>
        <span
          style={{ fontSize: "0.75rem", color: "#6b7280", display: "block", marginBottom: "4px" }}
        >
          Current Status
        </span>
        <Badge data-testid="current-status-badge" color={statusColors[issue.status]}>
          {statusLabels[issue.status]}
        </Badge>
      </div>

      {availableTransitions.length > 0 && (
        <div
          data-testid="transition-actions"
          style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
        >
          <span
            style={{ fontSize: "0.75rem", color: "#6b7280", width: "100%", marginBottom: "4px" }}
          >
            Transition to:
          </span>
          {availableTransitions.map((targetStatus) => (
            <Button
              key={targetStatus}
              data-testid={`transition-to-${targetStatus}`}
              variant={targetStatus === "resolved" ? "primary" : "secondary"}
              size="sm"
              onClick={() => onTransition(targetStatus)}
              disabled={loading}
            >
              {loading ? (
                <Spinner data-testid={`transition-spinner-${targetStatus}`} size="xs" />
              ) : (
                statusLabels[targetStatus]
              )}
            </Button>
          ))}
        </div>
      )}

      {loading && (
        <div
          data-testid="status-flow-loading"
          style={{ marginTop: "8px", fontSize: "0.75rem", color: "#6b7280" }}
        >
          Updating status...
        </div>
      )}

      <div
        data-testid="status-flow-history"
        style={{ marginTop: "16px", fontSize: "0.75rem", color: "#9ca3af" }}
      >
        Created: {issue.createdAt}
      </div>
    </div>
  );
}
