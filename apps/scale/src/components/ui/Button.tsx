import React from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "link";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  children?: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: "#6366f1",
    color: "#ffffff",
    border: "1px solid #6366f1",
  },
  secondary: {
    backgroundColor: "#1e1e2e",
    color: "#a0a0b0",
    border: "1px solid #3a3a4a",
  },
  danger: {
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "1px solid #ef4444",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "#a0a0b0",
    border: "1px solid transparent",
  },
  link: {
    backgroundColor: "transparent",
    color: "#6366f1",
    border: "none",
    textDecoration: "underline",
    padding: "0",
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  xs: { fontSize: "11px", padding: "4px 8px", borderRadius: "4px" },
  sm: { fontSize: "13px", padding: "6px 12px", borderRadius: "6px" },
  md: { fontSize: "14px", padding: "8px 16px", borderRadius: "6px" },
  lg: { fontSize: "16px", padding: "12px 24px", borderRadius: "8px" },
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  onClick,
  type = "button",
  children,
  className,
  "data-testid": testId = "button",
}) => {
  const isDisabled = disabled || loading;

  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontWeight: 500,
    cursor: isDisabled ? "not-allowed" : "pointer",
    opacity: isDisabled ? 0.6 : 1,
    fontFamily: "inherit",
    transition: "all 0.15s ease",
    width: fullWidth ? "100%" : undefined,
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      style={baseStyle}
      className={className}
      data-testid={testId}
      aria-busy={loading}
      aria-disabled={isDisabled}
    >
      {loading && (
        <span
          data-testid="button-spinner"
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: "12px",
            height: "12px",
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
          }}
        />
      )}
      {!loading && icon && <span data-testid="button-icon">{icon}</span>}
      {children && <span data-testid="button-label">{children}</span>}
    </button>
  );
};

export default Button;
