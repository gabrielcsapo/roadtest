import React from "react";
import { Button } from "../ui/Button";

interface FilterValue {
  types: string[];
  statuses: string[];
  services: string[];
}

interface CredentialFilterPanelProps {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
  services: string[];
  counts?: Record<string, number>;
}

const CREDENTIAL_TYPES = ["api-key", "certificate", "password", "oauth-token"] as const;
const CREDENTIAL_STATUSES = ["valid", "expiring-soon", "expired"] as const;

const TYPE_LABELS: Record<string, string> = {
  "api-key": "API Key",
  certificate: "Certificate",
  password: "Password",
  "oauth-token": "OAuth Token",
};

const STATUS_LABELS: Record<string, string> = {
  valid: "Valid",
  "expiring-soon": "Expiring Soon",
  expired: "Expired",
};

export function CredentialFilterPanel({
  value,
  onChange,
  services,
  counts,
}: CredentialFilterPanelProps) {
  const toggleType = (type: string) => {
    const next = value.types.includes(type)
      ? value.types.filter((t) => t !== type)
      : [...value.types, type];
    onChange({ ...value, types: next });
  };

  const toggleStatus = (status: string) => {
    const next = value.statuses.includes(status)
      ? value.statuses.filter((s) => s !== status)
      : [...value.statuses, status];
    onChange({ ...value, statuses: next });
  };

  const toggleService = (service: string) => {
    const next = value.services.includes(service)
      ? value.services.filter((s) => s !== service)
      : [...value.services, service];
    onChange({ ...value, services: next });
  };

  const clearAll = () => {
    onChange({ types: [], statuses: [], services: [] });
  };

  const hasFilters =
    value.types.length > 0 || value.statuses.length > 0 || value.services.length > 0;

  return (
    <div
      data-testid="credential-filter-panel"
      style={{
        padding: "16px",
        background: "#fff",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        minWidth: "220px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>Filters</span>
        {hasFilters && (
          <Button data-testid="clear-all-btn" variant="ghost" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        )}
      </div>

      {/* Type filter */}
      <div data-testid="type-section" style={{ marginBottom: "20px" }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "8px",
          }}
        >
          Type
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {CREDENTIAL_TYPES.map((type) => {
            const isChecked = value.types.includes(type);
            return (
              <label
                key={type}
                data-testid={`type-option-${type}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#374151",
                }}
              >
                <input
                  data-testid={`type-checkbox-${type}`}
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleType(type)}
                />
                <span>{TYPE_LABELS[type]}</span>
                {counts?.[type] !== undefined && (
                  <span
                    data-testid={`type-count-${type}`}
                    style={{ marginLeft: "auto", fontSize: "12px", color: "#9ca3af" }}
                  >
                    {counts[type]}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* Status filter */}
      <div data-testid="status-section" style={{ marginBottom: "20px" }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "8px",
          }}
        >
          Status
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {CREDENTIAL_STATUSES.map((status) => {
            const isChecked = value.statuses.includes(status);
            return (
              <label
                key={status}
                data-testid={`status-option-${status}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#374151",
                }}
              >
                <input
                  data-testid={`status-checkbox-${status}`}
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleStatus(status)}
                />
                <span>{STATUS_LABELS[status]}</span>
                {counts?.[status] !== undefined && (
                  <span
                    data-testid={`status-count-${status}`}
                    style={{ marginLeft: "auto", fontSize: "12px", color: "#9ca3af" }}
                  >
                    {counts[status]}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* Service filter */}
      {services.length > 0 && (
        <div data-testid="service-section">
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "8px",
            }}
          >
            Service
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {services.map((service) => {
              const svcId = service.toLowerCase().replace(/\s+/g, "-");
              const isChecked = value.services.includes(service);
              return (
                <label
                  key={service}
                  data-testid={`service-option-${svcId}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#374151",
                  }}
                >
                  <input
                    data-testid={`service-checkbox-${svcId}`}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleService(service)}
                  />
                  <span>{service}</span>
                  {counts?.[service] !== undefined && (
                    <span
                      data-testid={`service-count-${svcId}`}
                      style={{ marginLeft: "auto", fontSize: "12px", color: "#9ca3af" }}
                    >
                      {counts[service]}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
