import React, { useEffect, useCallback } from "react";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOverlay?: boolean;
  className?: string;
  "data-testid"?: string;
}

const sizeWidths: Record<ModalSize, string> = {
  sm: "400px",
  md: "560px",
  lg: "720px",
  xl: "900px",
  full: "100vw",
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  size = "md",
  children,
  footer,
  closeOnOverlay = true,
  className,
  "data-testid": testId = "modal",
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    },
    [open, onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!open) return null;

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: size === "full" ? "stretch" : "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: size === "full" ? "0" : "16px",
  };

  const dialogStyle: React.CSSProperties = {
    backgroundColor: "#1a1a2e",
    borderRadius: size === "full" ? "0" : "12px",
    border: "1px solid #3a3a4a",
    width: sizeWidths[size],
    maxWidth: "100%",
    maxHeight: size === "full" ? "100vh" : "85vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid #3a3a4a",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: 600,
    color: "#e0e0f0",
    margin: 0,
  };

  const closeButtonStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "#6b6b8a",
    cursor: "pointer",
    fontSize: "20px",
    padding: "4px",
    lineHeight: 1,
  };

  const bodyStyle: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
  };

  const footerStyle: React.CSSProperties = {
    padding: "16px 20px",
    borderTop: "1px solid #3a3a4a",
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
  };

  return (
    <div
      style={overlayStyle}
      data-testid={`${testId}-overlay`}
      onClick={
        closeOnOverlay
          ? (e) => {
              if (e.target === e.currentTarget) onClose();
            }
          : undefined
      }
      role="presentation"
    >
      <div
        style={dialogStyle}
        className={className}
        data-testid={testId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? `${testId}-title` : undefined}
      >
        {title !== undefined && (
          <div style={headerStyle} data-testid={`${testId}-header`}>
            <h2 id={`${testId}-title`} style={titleStyle} data-testid={`${testId}-title`}>
              {title}
            </h2>
            <button
              style={closeButtonStyle}
              onClick={onClose}
              data-testid={`${testId}-close`}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        )}
        {title === undefined && (
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 12px" }}>
            <button
              style={closeButtonStyle}
              onClick={onClose}
              data-testid={`${testId}-close`}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        )}
        <div style={bodyStyle} data-testid={`${testId}-body`}>
          {children}
        </div>
        {footer && (
          <div style={footerStyle} data-testid={`${testId}-footer`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
