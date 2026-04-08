import React from "react";

export type TabsVariant = "line" | "pill" | "card";

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  variant?: TabsVariant;
  className?: string;
  "data-testid"?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  active,
  onChange,
  variant = "line",
  className,
  "data-testid": testId = "tabs",
}) => {
  const containerStyle: React.CSSProperties = {
    display: "flex",
    gap: variant === "pill" ? "4px" : "0",
    borderBottom: variant === "line" ? "1px solid #3a3a4a" : "none",
    backgroundColor: variant === "card" ? "#16162a" : "transparent",
    padding: variant === "card" ? "4px" : "0",
    borderRadius: variant === "card" ? "8px" : "0",
    overflowX: "auto",
  };

  const getTabStyle = (tab: TabItem): React.CSSProperties => {
    const isActive = tab.id === active;
    const isDisabled = tab.disabled;

    const base: React.CSSProperties = {
      padding: variant === "pill" ? "6px 14px" : "10px 16px",
      fontSize: "14px",
      fontWeight: isActive ? 600 : 400,
      cursor: isDisabled ? "not-allowed" : "pointer",
      border: "none",
      fontFamily: "inherit",
      transition: "all 0.15s ease",
      whiteSpace: "nowrap",
      opacity: isDisabled ? 0.4 : 1,
    };

    if (variant === "line") {
      return {
        ...base,
        backgroundColor: "transparent",
        color: isActive ? "#6366f1" : "#a0a0b0",
        borderBottom: isActive ? "2px solid #6366f1" : "2px solid transparent",
        marginBottom: "-1px",
      };
    }

    if (variant === "pill") {
      return {
        ...base,
        backgroundColor: isActive ? "#6366f1" : "transparent",
        color: isActive ? "#ffffff" : "#a0a0b0",
        borderRadius: "9999px",
      };
    }

    // card
    return {
      ...base,
      backgroundColor: isActive ? "#1a1a2e" : "transparent",
      color: isActive ? "#e0e0f0" : "#a0a0b0",
      borderRadius: "6px",
    };
  };

  return (
    <div style={{ width: "100%" }} className={className} data-testid={`${testId}-wrapper`}>
      <div style={containerStyle} role="tablist" data-testid={testId} data-variant={variant}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            style={getTabStyle(tab)}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            aria-selected={tab.id === active}
            aria-disabled={tab.disabled}
            data-testid={`${testId}-tab-${tab.id}`}
            data-active={tab.id === active}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
