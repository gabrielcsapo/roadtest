import React from "react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarShape = "circle" | "square";
export type AvatarStatus = "online" | "offline" | "away";

export interface AvatarProps {
  name: string;
  src?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  status?: AvatarStatus;
  className?: string;
  "data-testid"?: string;
}

const sizeDimensions: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
};

const fontSizes: Record<AvatarSize, number> = {
  xs: 10,
  sm: 12,
  md: 15,
  lg: 20,
  xl: 26,
};

const statusColors: Record<AvatarStatus, string> = {
  online: "#4ade80",
  offline: "#6b6b8a",
  away: "#fbbf24",
};

const statusSizes: Record<AvatarSize, number> = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 14,
  xl: 18,
};

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

function hashColor(name: string): string {
  const colors = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#14b8a6",
    "#3b82f6",
    "#06b6d4",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = "md",
  shape = "circle",
  status,
  className,
  "data-testid": testId = "avatar",
}) => {
  const dim = sizeDimensions[size];
  const borderRadius = shape === "circle" ? "50%" : "8px";
  const initials = getInitials(name);
  const bg = hashColor(name);

  const wrapperStyle: React.CSSProperties = {
    position: "relative",
    display: "inline-flex",
    flexShrink: 0,
  };

  const avatarStyle: React.CSSProperties = {
    width: `${dim}px`,
    height: `${dim}px`,
    borderRadius,
    backgroundColor: bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: `${fontSizes[size]}px`,
    overflow: "hidden",
    userSelect: "none",
    flexShrink: 0,
  };

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius,
  };

  const statusIndicatorSize = statusSizes[size];
  const statusStyle: React.CSSProperties = {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: `${statusIndicatorSize}px`,
    height: `${statusIndicatorSize}px`,
    borderRadius: "50%",
    backgroundColor: status ? statusColors[status] : "transparent",
    border: "2px solid #1a1a2e",
  };

  return (
    <div style={wrapperStyle} className={className} data-testid={`${testId}-wrapper`}>
      <div
        style={avatarStyle}
        data-testid={testId}
        data-size={size}
        data-shape={shape}
        role="img"
        aria-label={name}
        title={name}
      >
        {src ? (
          <img src={src} alt={name} style={imgStyle} data-testid={`${testId}-img`} />
        ) : (
          <span data-testid={`${testId}-initials`}>{initials}</span>
        )}
      </div>
      {status && (
        <span
          style={statusStyle}
          data-testid={`${testId}-status`}
          data-status={status}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
};

export default Avatar;
