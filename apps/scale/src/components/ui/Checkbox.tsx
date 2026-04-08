import React, { useRef, useEffect } from "react";

export type CheckboxSize = "sm" | "md" | "lg";

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  label?: string;
  size?: CheckboxSize;
  error?: string;
  className?: string;
  "data-testid"?: string;
  id?: string;
}

const sizeMap: Record<CheckboxSize, { box: number; font: number }> = {
  sm: { box: 14, font: 12 },
  md: { box: 16, font: 14 },
  lg: { box: 20, font: 16 },
};

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  indeterminate = false,
  disabled = false,
  label,
  size = "md",
  error,
  className,
  "data-testid": testId = "checkbox",
  id,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = id || testId;
  const { box, font } = sizeMap[size];

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const wrapperStyle: React.CSSProperties = {
    display: "inline-flex",
    flexDirection: "column",
    gap: "4px",
  };

  const rowStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };

  const checkboxStyle: React.CSSProperties = {
    width: `${box}px`,
    height: `${box}px`,
    accentColor: "#6366f1",
    cursor: disabled ? "not-allowed" : "pointer",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: `${font}px`,
    color: "#c0c0d0",
    userSelect: "none",
  };

  const errorStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "#f87171",
  };

  return (
    <div style={wrapperStyle} className={className} data-testid={`${testId}-wrapper`}>
      <div style={rowStyle}>
        <input
          ref={inputRef}
          type="checkbox"
          id={inputId}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          style={checkboxStyle}
          data-testid={testId}
          aria-invalid={!!error}
          aria-checked={indeterminate ? "mixed" : checked}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />
        {label && (
          <label htmlFor={inputId} style={labelStyle} data-testid={`${testId}-label`}>
            {label}
          </label>
        )}
      </div>
      {error && (
        <span id={`${inputId}-error`} style={errorStyle} data-testid={`${testId}-error`}>
          {error}
        </span>
      )}
    </div>
  );
};

export default Checkbox;
