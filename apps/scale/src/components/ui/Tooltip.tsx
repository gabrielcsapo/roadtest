import React, { useState, useRef, useCallback } from "react";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  content: string;
  placement?: TooltipPlacement;
  delay?: number;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

const placementStyles: Record<TooltipPlacement, React.CSSProperties> = {
  top: { bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: "8px" },
  bottom: { top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: "8px" },
  left: { right: "100%", top: "50%", transform: "translateY(-50%)", marginRight: "8px" },
  right: { left: "100%", top: "50%", transform: "translateY(-50%)", marginLeft: "8px" },
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  placement = "top",
  delay = 0,
  disabled = false,
  children,
  className,
  "data-testid": testId = "tooltip",
}) => {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (disabled) return;
    if (delay > 0) {
      timerRef.current = setTimeout(() => setVisible(true), delay);
    } else {
      setVisible(true);
    }
  }, [disabled, delay]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  const wrapperStyle: React.CSSProperties = {
    display: "inline-block",
    position: "relative",
  };

  const tooltipStyle: React.CSSProperties = {
    position: "absolute",
    backgroundColor: "#0f0f1a",
    color: "#e0e0f0",
    fontSize: "12px",
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid #3a3a4a",
    whiteSpace: "nowrap",
    zIndex: 1000,
    pointerEvents: "none",
    ...placementStyles[placement],
  };

  return (
    <span
      style={wrapperStyle}
      className={className}
      data-testid={`${testId}-wrapper`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <span data-testid={`${testId}-trigger`}>{children}</span>
      {visible && !disabled && (
        <span role="tooltip" style={tooltipStyle} data-testid={testId} data-placement={placement}>
          {content}
        </span>
      )}
    </span>
  );
};

export default Tooltip;
