import React from "react";
import { Issue, Risk } from "../../types";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { IssueSeverityBadge } from "./IssueSeverityBadge";

interface IssueCardProps {
  issue: Issue;
  onClick?: (issue: Issue) => void;
  onAssign?: (issue: Issue) => void;
  onResolve?: (issue: Issue) => void;
  onDismiss?: (issue: Issue) => void;
}

const statusColors: Record<string, string> = {
  open: "red",
  "in-progress": "yellow",
  resolved: "green",
  "wont-fix": "gray",
};

const statusLabels: Record<string, string> = {
  open: "Open",
  "in-progress": "In Progress",
  resolved: "Resolved",
  "wont-fix": "Won't Fix",
};

function isOverdue(dueDate: string | undefined): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export function IssueCard({ issue, onClick, onAssign, onResolve, onDismiss }: IssueCardProps) {
  const handleClick = () => onClick?.(issue);
  const handleAssign = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAssign?.(issue);
  };
  const handleResolve = (e: React.MouseEvent) => {
    e.stopPropagation();
    onResolve?.(issue);
  };
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss?.(issue);
  };

  const overdue = isOverdue(issue.dueDate);

  return (
    <Card
      data-testid="issue-card"
      data-issue-id={issue.id}
      onClick={handleClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div
        data-testid="issue-card-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "8px",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "6px",
              flexWrap: "wrap",
            }}
          >
            <IssueSeverityBadge severity={issue.severity} size="sm" />
            <Badge data-testid="issue-status-badge" color={statusColors[issue.status] || "gray"}>
              {statusLabels[issue.status] || issue.status}
            </Badge>
            {issue.framework && (
              <Badge data-testid="issue-framework-badge" color="blue" size="sm">
                {issue.framework}
              </Badge>
            )}
          </div>
          <h3
            data-testid="issue-title"
            style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600 }}
          >
            {issue.title}
          </h3>
          <p
            data-testid="issue-description"
            style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "0.875rem" }}
          >
            {issue.description}
          </p>
        </div>
      </div>

      <div
        data-testid="issue-meta"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "12px",
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {issue.assignee ? (
            <div
              data-testid="issue-assignee"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Avatar
                src={issue.assignee.avatarUrl}
                name={issue.assignee.name}
                size="xs"
                data-testid="assignee-avatar"
              />
              <span data-testid="assignee-name" style={{ fontSize: "0.75rem", color: "#374151" }}>
                {issue.assignee.name}
              </span>
            </div>
          ) : (
            <span data-testid="unassigned-label" style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
              Unassigned
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {issue.dueDate ? (
            <span
              data-testid="issue-due-date"
              style={{
                fontSize: "0.75rem",
                color: overdue ? "#ef4444" : "#6b7280",
                fontWeight: overdue ? 600 : 400,
              }}
            >
              {overdue ? "Overdue: " : "Due: "}
              {issue.dueDate}
            </span>
          ) : (
            <span data-testid="no-due-date" style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
              No due date
            </span>
          )}
          <span data-testid="issue-created-at" style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
            {issue.createdAt}
          </span>
        </div>
      </div>

      {(onAssign || onResolve || onDismiss) && (
        <div
          data-testid="issue-actions"
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "12px",
            borderTop: "1px solid #e5e7eb",
            paddingTop: "12px",
          }}
        >
          {onAssign && (
            <Button
              data-testid="assign-button"
              variant="secondary"
              size="sm"
              onClick={handleAssign}
            >
              Assign
            </Button>
          )}
          {onResolve && issue.status !== "resolved" && (
            <Button
              data-testid="resolve-button"
              variant="primary"
              size="sm"
              onClick={handleResolve}
            >
              Resolve
            </Button>
          )}
          {onDismiss && (
            <Button
              data-testid="dismiss-button"
              variant="secondary"
              size="sm"
              onClick={handleDismiss}
            >
              Dismiss
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
