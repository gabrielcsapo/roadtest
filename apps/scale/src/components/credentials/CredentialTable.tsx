import React, { useState } from "react";
import { Credential } from "../../types";
import { CredentialTypeBadge } from "./CredentialTypeBadge";
import { CredentialStatusBadge } from "./CredentialStatusBadge";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/EmptyState";

interface SortOptions {
  field: "name" | "expiresAt" | "status" | "type";
  direction: "asc" | "desc";
}

interface CredentialTableProps {
  credentials: Credential[];
  loading?: boolean;
  onSort?: (sort: SortOptions) => void;
  onRotate?: (credential: Credential) => void;
  onDelete?: (credential: Credential) => void;
  selectedIds?: string[];
  onSelect?: (ids: string[]) => void;
}

export function CredentialTable({
  credentials,
  loading = false,
  onSort,
  onRotate,
  onDelete,
  selectedIds = [],
  onSelect,
}: CredentialTableProps) {
  const [sort, setSort] = useState<SortOptions>({ field: "expiresAt", direction: "asc" });

  const handleSort = (field: SortOptions["field"]) => {
    const newSort: SortOptions = {
      field,
      direction: sort.field === field && sort.direction === "asc" ? "desc" : "asc",
    };
    setSort(newSort);
    onSort?.(newSort);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelect) return;
    onSelect(e.target.checked ? credentials.map((c) => c.id) : []);
  };

  const handleSelectRow = (id: string) => {
    if (!onSelect) return;
    if (selectedIds.includes(id)) {
      onSelect(selectedIds.filter((i) => i !== id));
    } else {
      onSelect([...selectedIds, id]);
    }
  };

  const allSelected =
    credentials.length > 0 && credentials.every((c) => selectedIds.includes(c.id));

  if (loading) {
    return (
      <div
        data-testid="credential-table-loading"
        style={{ display: "flex", justifyContent: "center", padding: "48px" }}
      >
        <Spinner />
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <div data-testid="credential-table-empty">
        <EmptyState message="No credentials found" />
      </div>
    );
  }

  return (
    <div data-testid="credential-table" style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb", background: "#f9fafb" }}>
            {onSelect && (
              <th style={{ padding: "12px 16px", width: "40px" }}>
                <input
                  data-testid="select-all-checkbox"
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                />
              </th>
            )}
            <th
              data-testid="sort-name"
              style={{
                padding: "12px 16px",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
              }}
              onClick={() => handleSort("name")}
            >
              Name {sort.field === "name" ? (sort.direction === "asc" ? "↑" : "↓") : ""}
            </th>
            <th
              data-testid="sort-type"
              style={{
                padding: "12px 16px",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
              }}
              onClick={() => handleSort("type")}
            >
              Type
            </th>
            <th
              data-testid="sort-status"
              style={{
                padding: "12px 16px",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
              }}
              onClick={() => handleSort("status")}
            >
              Status
            </th>
            <th
              data-testid="sort-expiry"
              style={{
                padding: "12px 16px",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
              }}
              onClick={() => handleSort("expiresAt")}
            >
              Expires {sort.field === "expiresAt" ? (sort.direction === "asc" ? "↑" : "↓") : ""}
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
              }}
            >
              Owner
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
              }}
            >
              Service
            </th>
            {(onRotate || onDelete) && (
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {credentials.map((cred) => {
            const isSelected = selectedIds.includes(cred.id);
            return (
              <tr
                key={cred.id}
                data-testid={`credential-row-${cred.id}`}
                style={{
                  borderBottom: "1px solid #f3f4f6",
                  background: isSelected ? "#eff6ff" : "#fff",
                }}
              >
                {onSelect && (
                  <td style={{ padding: "12px 16px" }}>
                    <input
                      data-testid={`row-checkbox-${cred.id}`}
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectRow(cred.id)}
                    />
                  </td>
                )}
                <td style={{ padding: "12px 16px" }}>
                  <div
                    data-testid={`cred-name-${cred.id}`}
                    style={{ fontWeight: 500, color: "#111827" }}
                  >
                    {cred.name}
                  </div>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <CredentialTypeBadge type={cred.type} size="sm" />
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <CredentialStatusBadge
                    status={cred.status}
                    expiresAt={cred.expiresAt}
                    showDaysRemaining={false}
                  />
                </td>
                <td
                  data-testid={`cred-expiry-${cred.id}`}
                  style={{ padding: "12px 16px", fontSize: "13px", color: "#6b7280" }}
                >
                  {cred.expiresAt ? new Date(cred.expiresAt).toLocaleDateString() : "Never"}
                </td>
                <td
                  data-testid={`cred-owner-${cred.id}`}
                  style={{ padding: "12px 16px", fontSize: "13px", color: "#374151" }}
                >
                  {cred.owner.name}
                </td>
                <td style={{ padding: "12px 16px", fontSize: "13px", color: "#374151" }}>
                  {cred.service}
                </td>
                {(onRotate || onDelete) && (
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {onRotate && (
                        <Button
                          data-testid={`rotate-${cred.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => onRotate(cred)}
                        >
                          Rotate
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          data-testid={`delete-${cred.id}`}
                          variant="danger"
                          size="sm"
                          onClick={() => onDelete(cred)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
