import React, { useState } from "react";
import { Policy, ComplianceStatus, Framework } from "../../types";
import { Table } from "../ui/Table";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/EmptyState";
import { Checkbox } from "../ui/Checkbox";
import { PolicyFrameworkBadge } from "./PolicyFrameworkBadge";

interface PolicyTableProps {
  policies: Policy[];
  loading?: boolean;
  onSort?: (field: string, direction: "asc" | "desc") => void;
  onEdit?: (policy: Policy) => void;
  selectedIds?: string[];
  onSelect?: (ids: string[]) => void;
}

const statusColors: Record<ComplianceStatus, string> = {
  compliant: "green",
  "non-compliant": "red",
  "in-progress": "yellow",
  "not-applicable": "gray",
};

const statusLabels: Record<ComplianceStatus, string> = {
  compliant: "Compliant",
  "non-compliant": "Non-Compliant",
  "in-progress": "In Progress",
  "not-applicable": "Not Applicable",
};

const allFrameworks: Framework[] = ["SOC2", "ISO27001", "HIPAA", "GDPR", "PCI-DSS", "FedRAMP"];
const allStatuses: ComplianceStatus[] = [
  "compliant",
  "non-compliant",
  "in-progress",
  "not-applicable",
];

export function PolicyTable({
  policies,
  loading,
  onSort,
  onEdit,
  selectedIds = [],
  onSelect,
}: PolicyTableProps) {
  const [frameworkFilter, setFrameworkFilter] = useState<Framework | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | "all">("all");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
    onSort?.(field, newDirection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelect) return;
    if (checked) {
      onSelect(filteredPolicies.map((p) => p.id));
    } else {
      onSelect([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (!onSelect) return;
    if (checked) {
      onSelect([...selectedIds, id]);
    } else {
      onSelect(selectedIds.filter((sid) => sid !== id));
    }
  };

  const filteredPolicies = policies.filter((p) => {
    if (frameworkFilter !== "all" && !p.frameworks.includes(frameworkFilter)) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  const allSelected =
    filteredPolicies.length > 0 && filteredPolicies.every((p) => selectedIds.includes(p.id));

  if (loading) {
    return (
      <div
        data-testid="policy-table-loading"
        style={{ display: "flex", justifyContent: "center", padding: "40px" }}
      >
        <Spinner data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div data-testid="policy-table-container">
      <div
        data-testid="policy-table-filters"
        style={{ display: "flex", gap: "12px", marginBottom: "16px" }}
      >
        <Select
          data-testid="framework-filter"
          value={frameworkFilter}
          onChange={(v) => setFrameworkFilter(v as Framework | "all")}
          options={[
            { value: "all", label: "All Frameworks" },
            ...allFrameworks.map((fw) => ({ value: fw, label: fw })),
          ]}
        />
        <Select
          data-testid="status-filter"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as ComplianceStatus | "all")}
          options={[
            { value: "all", label: "All Statuses" },
            ...allStatuses.map((s) => ({ value: s, label: statusLabels[s] })),
          ]}
        />
      </div>

      {filteredPolicies.length === 0 ? (
        <EmptyState
          data-testid="policy-table-empty"
          title="No policies found"
          description="Try adjusting your filters."
        />
      ) : (
        <Table data-testid="policy-table">
          <thead>
            <tr data-testid="policy-table-header">
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
              <th data-testid="col-frameworks">Frameworks</th>
              <th
                data-testid="sort-status"
                onClick={() => handleSort("status")}
                style={{ cursor: "pointer" }}
              >
                Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                data-testid="sort-acceptance"
                onClick={() => handleSort("acceptanceRate")}
                style={{ cursor: "pointer" }}
              >
                Acceptance {sortField === "acceptanceRate" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th data-testid="col-owner">Owner</th>
              <th data-testid="col-updated">Last Updated</th>
              {onEdit && <th data-testid="col-actions">Actions</th>}
            </tr>
          </thead>
          <tbody data-testid="policy-table-body">
            {filteredPolicies.map((policy) => (
              <tr key={policy.id} data-testid={`policy-row-${policy.id}`}>
                {onSelect && (
                  <td>
                    <Checkbox
                      data-testid={`select-checkbox-${policy.id}`}
                      checked={selectedIds.includes(policy.id)}
                      onChange={(e) => handleSelectOne(policy.id, e.target.checked)}
                    />
                  </td>
                )}
                <td data-testid={`policy-title-${policy.id}`}>{policy.title}</td>
                <td data-testid={`policy-frameworks-${policy.id}`}>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {policy.frameworks.map((fw) => (
                      <PolicyFrameworkBadge key={fw} framework={fw} size="sm" />
                    ))}
                  </div>
                </td>
                <td data-testid={`policy-status-${policy.id}`}>
                  <Badge color={statusColors[policy.status]}>{statusLabels[policy.status]}</Badge>
                </td>
                <td data-testid={`policy-acceptance-${policy.id}`}>{policy.acceptanceRate}%</td>
                <td data-testid={`policy-owner-${policy.id}`}>{policy.owner.name}</td>
                <td data-testid={`policy-updated-${policy.id}`}>{policy.lastUpdated}</td>
                {onEdit && (
                  <td>
                    <Button
                      data-testid={`edit-button-${policy.id}`}
                      size="sm"
                      variant="secondary"
                      onClick={() => onEdit(policy)}
                    >
                      Edit
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <div
        data-testid="policy-table-footer"
        style={{ marginTop: "8px", fontSize: "0.875rem", color: "#6b7280" }}
      >
        Showing {filteredPolicies.length} of {policies.length} policies
      </div>
    </div>
  );
}
