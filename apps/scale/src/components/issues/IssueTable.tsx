import React, { useState } from "react";
import { Issue, Risk } from "../../types";
import { Table } from "../ui/Table";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/EmptyState";
import { Checkbox } from "../ui/Checkbox";
import { IssueSeverityBadge } from "./IssueSeverityBadge";

interface IssueTableProps {
  issues: Issue[];
  loading?: boolean;
  onSort?: (field: string, direction: "asc" | "desc") => void;
  onResolve?: (issue: Issue) => void;
  onDismiss?: (issue: Issue) => void;
  selectedIds?: string[];
  onSelect?: (ids: string[]) => void;
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

const allSeverities: Risk[] = ["low", "medium", "high", "critical"];
const allStatuses = ["open", "in-progress", "resolved", "wont-fix"];

function isOverdue(dueDate: string | undefined): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export function IssueTable({
  issues,
  loading,
  onSort,
  onResolve,
  onDismiss,
  selectedIds = [],
  onSelect,
}: IssueTableProps) {
  const [severityFilter, setSeverityFilter] = useState<Risk | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: string) => {
    const newDir = sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDir);
    onSort?.(field, newDir);
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelect) return;
    onSelect(checked ? filteredIssues.map((i) => i.id) : []);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (!onSelect) return;
    onSelect(checked ? [...selectedIds, id] : selectedIds.filter((sid) => sid !== id));
  };

  const filteredIssues = issues.filter((i) => {
    if (severityFilter !== "all" && i.severity !== severityFilter) return false;
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    return true;
  });

  const allSelected =
    filteredIssues.length > 0 && filteredIssues.every((i) => selectedIds.includes(i.id));

  if (loading) {
    return (
      <div
        data-testid="issue-table-loading"
        style={{ display: "flex", justifyContent: "center", padding: "40px" }}
      >
        <Spinner data-testid="issue-table-spinner" />
      </div>
    );
  }

  return (
    <div data-testid="issue-table-container">
      <div
        data-testid="issue-table-filters"
        style={{ display: "flex", gap: "12px", marginBottom: "16px" }}
      >
        <Select
          data-testid="severity-filter"
          value={severityFilter}
          onChange={(v) => setSeverityFilter(v as Risk | "all")}
          options={[
            { value: "all", label: "All Severities" },
            ...allSeverities.map((s) => ({
              value: s,
              label: s.charAt(0).toUpperCase() + s.slice(1),
            })),
          ]}
        />
        <Select
          data-testid="status-filter"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          options={[
            { value: "all", label: "All Statuses" },
            ...allStatuses.map((s) => ({ value: s, label: statusLabels[s] })),
          ]}
        />
      </div>

      {filteredIssues.length === 0 ? (
        <EmptyState
          data-testid="issue-table-empty"
          title="No issues found"
          description="Try adjusting your filters."
        />
      ) : (
        <Table data-testid="issue-table">
          <thead>
            <tr data-testid="issue-table-header">
              {onSelect && (
                <th>
                  <Checkbox
                    data-testid="select-all-checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
              )}
              <th
                data-testid="sort-title"
                onClick={() => handleSort("title")}
                style={{ cursor: "pointer" }}
              >
                Title {sortField === "title" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                data-testid="sort-severity"
                onClick={() => handleSort("severity")}
                style={{ cursor: "pointer" }}
              >
                Severity {sortField === "severity" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                data-testid="sort-status"
                onClick={() => handleSort("status")}
                style={{ cursor: "pointer" }}
              >
                Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th data-testid="col-assignee">Assignee</th>
              <th
                data-testid="sort-due-date"
                onClick={() => handleSort("dueDate")}
                style={{ cursor: "pointer" }}
              >
                Due Date {sortField === "dueDate" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th data-testid="col-framework">Framework</th>
              {(onResolve || onDismiss) && <th data-testid="col-actions">Actions</th>}
            </tr>
          </thead>
          <tbody data-testid="issue-table-body">
            {filteredIssues.map((issue) => {
              const overdue = isOverdue(issue.dueDate);
              return (
                <tr
                  key={issue.id}
                  data-testid={`issue-row-${issue.id}`}
                  style={{ backgroundColor: overdue ? "#fff5f5" : undefined }}
                  data-overdue={overdue}
                >
                  {onSelect && (
                    <td>
                      <Checkbox
                        data-testid={`select-checkbox-${issue.id}`}
                        checked={selectedIds.includes(issue.id)}
                        onChange={(e) => handleSelectOne(issue.id, e.target.checked)}
                      />
                    </td>
                  )}
                  <td data-testid={`issue-title-${issue.id}`}>{issue.title}</td>
                  <td data-testid={`issue-severity-${issue.id}`}>
                    <IssueSeverityBadge severity={issue.severity} size="sm" />
                  </td>
                  <td data-testid={`issue-status-${issue.id}`}>
                    <Badge color={statusColors[issue.status]}>{statusLabels[issue.status]}</Badge>
                  </td>
                  <td data-testid={`issue-assignee-${issue.id}`}>
                    {issue.assignee?.name ?? "Unassigned"}
                  </td>
                  <td
                    data-testid={`issue-due-date-${issue.id}`}
                    style={{ color: overdue ? "#ef4444" : undefined }}
                  >
                    {issue.dueDate ?? "None"}
                  </td>
                  <td data-testid={`issue-framework-${issue.id}`}>{issue.framework ?? "—"}</td>
                  {(onResolve || onDismiss) && (
                    <td>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {onResolve && issue.status !== "resolved" && (
                          <Button
                            data-testid={`resolve-button-${issue.id}`}
                            size="sm"
                            variant="primary"
                            onClick={() => onResolve(issue)}
                          >
                            Resolve
                          </Button>
                        )}
                        {onDismiss && (
                          <Button
                            data-testid={`dismiss-button-${issue.id}`}
                            size="sm"
                            variant="secondary"
                            onClick={() => onDismiss(issue)}
                          >
                            Dismiss
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <div
        data-testid="issue-table-footer"
        style={{ marginTop: "8px", fontSize: "0.875rem", color: "#6b7280" }}
      >
        Showing {filteredIssues.length} of {issues.length} issues
      </div>
    </div>
  );
}
