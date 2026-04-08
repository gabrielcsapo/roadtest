import React from "react";

export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  empty?: React.ReactNode;
  onSort?: (key: string, direction: "asc" | "desc") => void;
  selectedRows?: string[];
  onRowSelect?: (ids: string[]) => void;
  rowKey?: (row: T) => string;
  className?: string;
  "data-testid"?: string;
}

export function Table<T = any>({
  data,
  columns,
  loading = false,
  empty,
  onSort,
  selectedRows = [],
  onRowSelect,
  rowKey = (row: any) => row.id,
  className,
  "data-testid": testId = "table",
}: TableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    const newDir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    setSortKey(key);
    setSortDir(newDir);
    onSort?.(key, newDir);
  };

  const handleRowSelect = (id: string) => {
    const next = selectedRows.includes(id)
      ? selectedRows.filter((r) => r !== id)
      : [...selectedRows, id];
    onRowSelect?.(next);
  };

  const handleSelectAll = () => {
    if (!onRowSelect) return;
    const allIds = data.map((row) => rowKey(row));
    const allSelected = allIds.every((id) => selectedRows.includes(id));
    onRowSelect(allSelected ? [] : allIds);
  };

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
    color: "#e0e0f0",
  };

  const thStyle: React.CSSProperties = {
    padding: "10px 14px",
    textAlign: "left",
    fontWeight: 600,
    color: "#a0a0b0",
    borderBottom: "1px solid #3a3a4a",
    backgroundColor: "#16162a",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const tdStyle: React.CSSProperties = {
    padding: "12px 14px",
    borderBottom: "1px solid #2a2a3a",
    verticalAlign: "middle",
  };

  const trStyle = (isSelected: boolean): React.CSSProperties => ({
    backgroundColor: isSelected ? "#2a2a4a" : "transparent",
    cursor: onRowSelect ? "pointer" : "default",
  });

  const wrapperStyle: React.CSSProperties = {
    width: "100%",
    overflowX: "auto",
    borderRadius: "8px",
    border: "1px solid #3a3a4a",
  };

  if (loading) {
    return (
      <div style={wrapperStyle} className={className} data-testid={`${testId}-loading`}>
        <div style={{ padding: "40px", textAlign: "center", color: "#6b6b8a" }}>
          <div
            data-testid={`${testId}-spinner`}
            style={{
              display: "inline-block",
              width: "24px",
              height: "24px",
              border: "3px solid #3a3a4a",
              borderTopColor: "#6366f1",
              borderRadius: "50%",
            }}
          />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapperStyle} className={className} data-testid={testId}>
      {data.length === 0 ? (
        <div
          data-testid={`${testId}-empty`}
          style={{ padding: "40px", textAlign: "center", color: "#6b6b8a" }}
        >
          {empty || "No data available"}
        </div>
      ) : (
        <table style={tableStyle} data-testid={`${testId}-table`}>
          <thead>
            <tr>
              {onRowSelect && (
                <th style={{ ...thStyle, width: "40px" }}>
                  <input
                    type="checkbox"
                    checked={
                      data.length > 0 && data.every((row) => selectedRows.includes(rowKey(row)))
                    }
                    onChange={handleSelectAll}
                    data-testid={`${testId}-select-all`}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ ...thStyle, cursor: col.sortable ? "pointer" : "default" }}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  data-testid={`${testId}-th-${col.key}`}
                >
                  {col.label}
                  {col.sortable && (
                    <span
                      style={{ marginLeft: "4px", opacity: sortKey === col.key ? 1 : 0.4 }}
                      data-testid={`${testId}-sort-${col.key}`}
                    >
                      {sortKey === col.key ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row: any) => {
              const id = rowKey(row);
              const isSelected = selectedRows.includes(id);
              return (
                <tr
                  key={id}
                  style={trStyle(isSelected)}
                  onClick={onRowSelect ? () => handleRowSelect(id) : undefined}
                  data-testid={`${testId}-row-${id}`}
                  aria-selected={isSelected}
                >
                  {onRowSelect && (
                    <td style={tdStyle}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleRowSelect(id)}
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`${testId}-checkbox-${id}`}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={tdStyle}
                      data-testid={`${testId}-cell-${id}-${col.key}`}
                    >
                      {col.render ? col.render((row as any)[col.key], row) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Table;
