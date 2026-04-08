import React from "react";

export type AlertVariant = "info" | "success" | "warning" | "danger";

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

const variantConfig: Record<
  AlertVariant,
  { color: string; bg: string; border: string; defaultIcon: string }
> = {
  info: { color: "#60a5fa", bg: "#1e3a5f", border: "#1d4ed8", defaultIcon: "ℹ" },
  success: { color: "#4ade80", bg: "#14532d", border: "#15803d", defaultIcon: "✓" },
  warning: { color: "#fbbf24", bg: "#713f12", border: "#b45309", defaultIcon: "⚠" },
  danger: { color: "#f87171", bg: "#7f1d1d", border: "#b91c1c", defaultIcon: "✕" },
};

export const Alert: React.FC<AlertProps> = ({
  variant = "info",
  title,
  dismissible = false,
  onDismiss,
  icon,
  children,
  className,
  "data-testid": testId = "alert",
}) => {
  const [dismissed, setDismissed] = React.useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed) return null;

  const config = variantConfig[variant];

  const alertStyle: React.CSSProperties = {
    display: "flex",
    gap: "12px",
    padding: "14px 16px",
    borderRadius: "8px",
    backgroundColor: config.bg,
    border: `1px solid ${config.border}`,
    color: config.color,
    position: "relative",
  };

  const iconStyle: React.CSSProperties = {
    fontSize: "16px",
    flexShrink: 0,
    marginTop: "1px",
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  };

  const titleStyle: React.CSSProperties = {
    fontWeight: 600,
    fontSize: "14px",
    margin: 0,
  };

  const bodyStyle: React.CSSProperties = {
    fontSize: "13px",
    opacity: 0.9,
  };

  const dismissStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: config.color,
    cursor: "pointer",
    fontSize: "18px",
    padding: "0 4px",
    opacity: 0.8,
    alignSelf: "flex-start",
    lineHeight: 1,
  };

  return (
    <div
      style={alertStyle}
      className={className}
      data-testid={testId}
      role="alert"
      data-variant={variant}
    >
      <span style={iconStyle} data-testid={`${testId}-icon`} aria-hidden="true">
        {icon || config.defaultIcon}
      </span>
      <div style={contentStyle} data-testid={`${testId}-content`}>
        {title && (
          <p style={titleStyle} data-testid={`${testId}-title`}>
            {title}
          </p>
        )}
        {children && (
          <div style={bodyStyle} data-testid={`${testId}-body`}>
            {children}
          </div>
        )}
      </div>
      {dismissible && (
        <button
          style={dismissStyle}
          onClick={handleDismiss}
          data-testid={`${testId}-dismiss`}
          aria-label="Dismiss alert"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;
