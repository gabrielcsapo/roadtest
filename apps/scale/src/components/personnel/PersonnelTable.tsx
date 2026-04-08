import React, { useState } from "react";
import { Personnel } from "../../types";
import { PersonnelStatusBadge } from "./PersonnelStatusBadge";
import { BackgroundCheckBadge } from "./BackgroundCheckBadge";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/EmptyState";
import { Button } from "../ui/Button";
import { Checkbox } from "../ui/Checkbox";

interface SortOptions {
  field: "name" | "department" | "startDate";
  direction: "asc" | "desc";
}

interface PersonnelTableProps {
  people: Personnel[];
  loading?: boolean;
  onSort?: (sort: SortOptions) => void;
  onEdit?: (person: Personnel) => void;
  onOffboard?: (person: Personnel) => void;
  selectedIds?: string[];
  onSelect?: (ids: string[]) => void;
}

export function PersonnelTable({
  people,
  loading = false,
  onSort,
  onEdit,
  onOffboard,
  selectedIds = [],
  onSelect,
}: PersonnelTableProps) {
  const [sort, setSort] = useState<SortOptions>({ field: "name", direction: "asc" });

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
    if (e.target.checked) {
      onSelect(people.map((p) => p.id));
    } else {
      onSelect([]);
    }
  };

  const handleSelectRow = (id: string) => {
    if (!onSelect) return;
    if (selectedIds.includes(id)) {
      onSelect(selectedIds.filter((i) => i !== id));
    } else {
      onSelect([...selectedIds, id]);
    }
  };

  const allSelected = people.length > 0 && people.every((p) => selectedIds.includes(p.id));

  if (loading) {
    return (
      <div
        data-testid="personnel-table-loading"
        style={{ display: "flex", justifyContent: "center", padding: "48px" }}
      >
        <Spinner />
      </div>
    );
  }

  if (people.length === 0) {
    return (
      <div data-testid="personnel-table-empty">
        <EmptyState message="No personnel found" />
      </div>
    );
  }

  return (
    <div data-testid="personnel-table" style={{ overflowX: "auto" }}>
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
                userSelect: "none",
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
              }}
              onClick={() => handleSort("name")}
            >
              Name {sort.field === "name" ? (sort.direction === "asc" ? "↑" : "↓") : ""}
            </th>
            <th
              data-testid="sort-department"
              style={{
                padding: "12px 16px",
                textAlign: "left",
                cursor: "pointer",
                userSelect: "none",
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
              }}
              onClick={() => handleSort("department")}
            >
              Department {sort.field === "department" ? (sort.direction === "asc" ? "↑" : "↓") : ""}
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
              Job Title
            </th>
            <th
              data-testid="sort-startDate"
              style={{
                padding: "12px 16px",
                textAlign: "left",
                cursor: "pointer",
                userSelect: "none",
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
              }}
              onClick={() => handleSort("startDate")}
            >
              Start Date {sort.field === "startDate" ? (sort.direction === "asc" ? "↑" : "↓") : ""}
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
              Status
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
              Background Check
            </th>
            {(onEdit || onOffboard) && (
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
          {people.map((person) => {
            const isSelected = selectedIds.includes(person.id);
            return (
              <tr
                key={person.id}
                data-testid={`personnel-row-${person.id}`}
                style={{
                  borderBottom: "1px solid #f3f4f6",
                  background: isSelected ? "#eff6ff" : "#fff",
                }}
              >
                {onSelect && (
                  <td style={{ padding: "12px 16px" }}>
                    <input
                      data-testid={`row-checkbox-${person.id}`}
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectRow(person.id)}
                    />
                  </td>
                )}
                <td style={{ padding: "12px 16px" }}>
                  <div
                    data-testid={`personnel-name-${person.id}`}
                    style={{ fontWeight: 500, color: "#111827" }}
                  >
                    {person.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>{person.email}</div>
                </td>
                <td
                  data-testid={`personnel-dept-${person.id}`}
                  style={{ padding: "12px 16px", color: "#374151" }}
                >
                  {person.department}
                </td>
                <td style={{ padding: "12px 16px", color: "#374151", fontSize: "14px" }}>
                  {person.jobTitle}
                </td>
                <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "14px" }}>
                  {person.startDate}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <PersonnelStatusBadge status={person.status} size="sm" />
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <BackgroundCheckBadge status={person.backgroundCheckStatus} size="sm" />
                </td>
                {(onEdit || onOffboard) && (
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {onEdit && (
                        <Button
                          data-testid={`edit-${person.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(person)}
                        >
                          Edit
                        </Button>
                      )}
                      {onOffboard && person.status !== "offboarded" && (
                        <Button
                          data-testid={`offboard-${person.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => onOffboard(person)}
                        >
                          Offboard
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
