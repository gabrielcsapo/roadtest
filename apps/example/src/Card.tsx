import { Button } from "./Button";

interface CardProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "danger";
}

export function Card({
  title,
  description,
  actionLabel,
  onAction,
  variant = "default",
}: CardProps) {
  return (
    <div
      data-testid="card"
      style={{
        background: "#1a1a24",
        border: `1px solid ${variant === "danger" ? "rgba(239,68,68,0.3)" : "#2a2a36"}`,
        borderRadius: 12,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxWidth: 320,
      }}
    >
      hu
      <h3
        data-testid="card-title"
        style={{ color: "#e2e2e8", fontSize: 16, fontWeight: 700, margin: 0 }}
      >
        {title}
      </h3>
      <p
        data-testid="card-description"
        style={{ color: "#6b7280", fontSize: 13, margin: 0, lineHeight: 1.5 }}
      >
        {description}
      </p>
      {actionLabel && (
        <div>
          <Button
            label={actionLabel}
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={onAction}
          />
        </div>
      )}
    </div>
  );
}
