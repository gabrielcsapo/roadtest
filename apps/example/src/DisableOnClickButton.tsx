import { useState } from "react";

export function DisableOnClickButton({ label = "Click me" }: { label?: string }) {
  const [disabled, setDisabled] = useState(false);

  return (
    <button
      disabled={disabled}
      onClick={() => setDisabled(true)}
      style={{
        padding: "8px 20px",
        borderRadius: 8,
        border: "none",
        background: disabled ? "#374151" : "#6366f1",
        color: disabled ? "#6b7280" : "#fff",
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.15s, color 0.15s",
      }}
    >
      {disabled ? "Disabled" : label}
    </button>
  );
}
