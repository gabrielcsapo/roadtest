import React from "react";

export type ProgressSize = "sm" | "md" | "lg";

export interface ProgressProps {
  value: number;
  size?: ProgressSize;
  color?: string;
  label?: string;
  showValue?: boolean;
  striped?: boolean;
  animated?: boolean;
  className?: string;
  "data-testid"?: string;
}

const sizeHeights: Record<ProgressSize, string> = {
  sm: "4px",
  md: "8px",
  lg: "14px",
};

export const Progress: React.FC<ProgressProps> = ({
  value,
  size = "md",
  color = "#6366f1",
  label,
  showValue = false,
  striped = false,
  animated = false,
  className,
  "data-testid": testId = "progress",
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  const wrapperStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    width: "100%",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "13px",
    color: "#a0a0b0",
  };

  const trackStyle: React.CSSProperties = {
    width: "100%",
    height: sizeHeights[size],
    backgroundColor: "#2a2a3a",
    borderRadius: "9999px",
    overflow: "hidden",
  };

  const fillStyle: React.CSSProperties = {
    height: "100%",
    width: `${clampedValue}%`,
    backgroundColor: color,
    borderRadius: "9999px",
    transition: "width 0.3s ease",
    backgroundImage: striped
      ? "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.1) 5px, rgba(255,255,255,0.1) 10px)"
      : undefined,
    animation: animated ? "progress-stripe 1s linear infinite" : undefined,
  };

  return (
    <div style={wrapperStyle} className={className} data-testid={`${testId}-wrapper`}>
      {(label || showValue) && (
        <div style={headerStyle} data-testid={`${testId}-header`}>
          {label && <span data-testid={`${testId}-label`}>{label}</span>}
          {showValue && <span data-testid={`${testId}-value`}>{Math.round(clampedValue)}%</span>}
        </div>
      )}
      <div
        style={trackStyle}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Progress"}
        data-testid={testId}
      >
        <div style={fillStyle} data-testid={`${testId}-fill`} />
      </div>
    </div>
  );
};

export default Progress;
