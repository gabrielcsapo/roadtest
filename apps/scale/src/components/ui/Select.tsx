import React, { useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  multiple?: boolean;
  searchable?: boolean;
  className?: string;
  "data-testid"?: string;
  id?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  error,
  label,
  multiple = false,
  searchable = false,
  className,
  "data-testid": testId = "select",
  id,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);

  const inputId = id || testId;

  const filteredOptions =
    searchable && searchQuery
      ? options.filter((o) => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
      : options;

  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  const handleSelect = (optValue: string) => {
    if (multiple) {
      const next = selectedValues.includes(optValue)
        ? selectedValues.filter((v) => v !== optValue)
        : [...selectedValues, optValue];
      onChange?.(next);
    } else {
      onChange?.(optValue);
      setOpen(false);
    }
  };

  const getLabel = () => {
    if (selectedValues.length === 0) return placeholder;
    if (multiple) return `${selectedValues.length} selected`;
    const found = options.find((o) => o.value === selectedValues[0]);
    return found?.label || placeholder;
  };

  const wrapperStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    width: "100%",
    position: "relative",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 500,
    color: "#c0c0d0",
  };

  const triggerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    backgroundColor: "#1e1e2e",
    border: `1px solid ${error ? "#ef4444" : "#3a3a4a"}`,
    borderRadius: "6px",
    color: selectedValues.length > 0 ? "#e0e0f0" : "#6b6b8a",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    fontSize: "14px",
    fontFamily: "inherit",
  };

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#1e1e2e",
    border: "1px solid #3a3a4a",
    borderRadius: "6px",
    zIndex: 100,
    maxHeight: "200px",
    overflowY: "auto",
    marginTop: "4px",
  };

  const optionStyle = (isSelected: boolean, isDisabled: boolean): React.CSSProperties => ({
    padding: "8px 12px",
    cursor: isDisabled ? "not-allowed" : "pointer",
    color: isDisabled ? "#4a4a5a" : isSelected ? "#6366f1" : "#e0e0f0",
    backgroundColor: isSelected ? "#2a2a4a" : "transparent",
    opacity: isDisabled ? 0.5 : 1,
    fontSize: "14px",
  });

  const searchStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    backgroundColor: "#16162a",
    border: "none",
    borderBottom: "1px solid #3a3a4a",
    color: "#e0e0f0",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  const hintStyle: React.CSSProperties = {
    fontSize: "11px",
    color: error ? "#f87171" : "#6b6b8a",
  };

  return (
    <div style={wrapperStyle} className={className} data-testid={`${testId}-wrapper`}>
      {label && (
        <label htmlFor={inputId} style={labelStyle} data-testid={`${testId}-label`}>
          {label}
        </label>
      )}
      <div
        style={triggerStyle}
        onClick={() => !disabled && setOpen((o) => !o)}
        data-testid={`${testId}-trigger`}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
      >
        <span data-testid={`${testId}-value`}>{getLabel()}</span>
        <span data-testid={`${testId}-arrow`} aria-hidden>
          ▾
        </span>
      </div>
      {open && !disabled && (
        <div style={dropdownStyle} data-testid={`${testId}-dropdown`}>
          {searchable && (
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchStyle}
              data-testid={`${testId}-search`}
            />
          )}
          <ul role="listbox" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {filteredOptions.length === 0 && (
              <li
                style={{ padding: "8px 12px", color: "#6b6b8a", fontSize: "14px" }}
                data-testid={`${testId}-empty`}
              >
                No options
              </li>
            )}
            {filteredOptions.map((opt) => (
              <li
                key={opt.value}
                style={optionStyle(selectedValues.includes(opt.value), !!opt.disabled)}
                onClick={() => !opt.disabled && handleSelect(opt.value)}
                role="option"
                aria-selected={selectedValues.includes(opt.value)}
                aria-disabled={opt.disabled}
                data-testid={`${testId}-option-${opt.value}`}
              >
                {multiple && (
                  <span style={{ marginRight: "8px" }}>
                    {selectedValues.includes(opt.value) ? "☑" : "☐"}
                  </span>
                )}
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && (
        <span style={hintStyle} data-testid={`${testId}-error`}>
          {error}
        </span>
      )}
    </div>
  );
};

export default Select;
