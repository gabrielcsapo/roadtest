import React from "react";

export interface GridToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
}

export function gridStyle(active: boolean): React.CSSProperties {
  if (!active) return {};
  return {
    backgroundImage: [
      "repeating-linear-gradient(0deg, rgba(99,102,241,0.15) 0px, rgba(99,102,241,0.15) 1px, transparent 1px, transparent 8px)",
      "repeating-linear-gradient(90deg, rgba(99,102,241,0.15) 0px, rgba(99,102,241,0.15) 1px, transparent 1px, transparent 8px)",
    ].join(", "),
  };
}

export function GridToggle({ value, onChange }: GridToggleProps): React.ReactElement {
  const buttonStyle: React.CSSProperties = {
    background: value ? "rgba(99,102,241,0.2)" : "transparent",
    border: "1px solid",
    borderColor: value ? "rgba(99,102,241,0.5)" : "#2a2a36",
    borderRadius: 6,
    padding: "5px 8px",
    cursor: "pointer",
    color: value ? "#818cf8" : "#6b7280",
    display: "flex",
    alignItems: "center",
  };

  return (
    <button
      style={buttonStyle}
      onClick={() => onChange(!value)}
      title="Toggle baseline grid"
      aria-pressed={value}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Vertical lines */}
        <line x1="5" y1="1" x2="5" y2="15" stroke="currentColor" strokeWidth="1" />
        <line x1="11" y1="1" x2="11" y2="15" stroke="currentColor" strokeWidth="1" />
        {/* Horizontal lines */}
        <line x1="1" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="1" />
        <line x1="1" y1="11" x2="15" y2="11" stroke="currentColor" strokeWidth="1" />
        {/* Outer border */}
        <rect
          x="1"
          y="1"
          width="14"
          height="14"
          rx="1"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
      </svg>
    </button>
  );
}

export default GridToggle;
