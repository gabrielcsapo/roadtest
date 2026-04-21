import { type ReactNode } from "react";

const TRAFFIC_LIGHTS = ["#ff5f57", "#febc2e", "#28c840"] as const;

interface TrafficLightsProps {
  size?: number;
  gap?: number;
  dimmed?: boolean;
}

function TrafficLights({ size = 11, gap = 6, dimmed = false }: TrafficLightsProps) {
  return (
    <div style={{ display: "flex", gap }}>
      {TRAFFIC_LIGHTS.map((c) => (
        <div
          key={c}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: dimmed ? "#3d5a47" : c,
          }}
        />
      ))}
    </div>
  );
}

// ─── Browser window (with URL bar + optional expand/collapse) ────────────────

interface BrowserWindowProps {
  /** URL shown in the address bar */
  url?: string;
  /** Height of the content area */
  height?: number;
  /** Called when expand button is clicked */
  onExpand?: () => void;
  /** Called when collapse button is clicked (shows collapse button when provided) */
  onCollapse?: () => void;
  children: ReactNode;
  /** Extra style on the outer wrapper */
  style?: React.CSSProperties;
  className?: string;
}

export function BrowserWindow({
  url = "localhost:3333 — roadtest",
  height,
  onExpand,
  onCollapse,
  children,
  style,
  className,
}: BrowserWindowProps) {
  const expanded = !!onCollapse;

  return (
    <div
      className={className}
      style={{
        overflow: "hidden",
        borderRadius: 10,
        border: "1px solid #2a2a36",
        background: "#0f0f13",
        ...style,
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderBottom: "1px solid #2a2a36",
          background: "#0f0f13",
        }}
      >
        <TrafficLights size={11} />
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "#6b7280",
          }}
        >
          {url}
        </div>
        {(onExpand || onCollapse) && (
          <button
            onClick={expanded ? onCollapse : onExpand}
            title={expanded ? "Collapse preview" : "Expand preview"}
            style={{
              width: 24,
              height: 24,
              borderRadius: 5,
              border: expanded ? "1px solid rgba(99,102,241,0.4)" : "1px solid #2a2a36",
              background: expanded ? "rgba(99,102,241,0.15)" : "transparent",
              color: expanded ? "#a5b4fc" : "#6b7280",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            onMouseEnter={
              expanded
                ? undefined
                : (e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(99,102,241,0.6)";
                    (e.currentTarget as HTMLButtonElement).style.color = "#a5b4fc";
                  }
            }
            onMouseLeave={
              expanded
                ? undefined
                : (e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a36";
                    (e.currentTarget as HTMLButtonElement).style.color = "#6b7280";
                  }
            }
          >
            {expanded ? (
              // Collapse icon
              <svg
                width="11"
                height="11"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M4.5 1.5H1.5v3M7.5 1.5h3v3M4.5 10.5H1.5v-3M7.5 10.5h3v-3" />
              </svg>
            ) : (
              // Expand icon
              <svg
                width="11"
                height="11"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M1.5 4.5V1.5h3M10.5 4.5V1.5h-3M1.5 7.5v3h3M10.5 7.5v3h-3" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div style={height !== undefined ? { height } : undefined}>{children}</div>
    </div>
  );
}

// ─── Terminal / Node window ───────────────────────────────────────────────────

interface TerminalWindowProps {
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export function TerminalWindow({ children, style, className }: TerminalWindowProps) {
  return (
    <div
      className={className}
      style={{
        overflow: "hidden",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "var(--color-ft-bg, #0f0f13)",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 6,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "10px 14px",
        }}
      >
        <TrafficLights size={10} dimmed />
      </div>
      {children}
    </div>
  );
}

// ─── Code file window (editor-style, Tailwind-friendly) ──────────────────────

interface CodeWindowProps {
  /** Filename shown in the title bar */
  filename: string;
  children: ReactNode;
  className?: string;
}

export function CodeWindow({ filename, children, className }: CodeWindowProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-white/7 bg-ft-bg ${className ?? ""}`}
    >
      <div className="flex items-center gap-2.5 border-b border-white/7 bg-ft-surface px-4 py-2.5">
        <div className="flex gap-1.5">
          {TRAFFIC_LIGHTS.map((c) => (
            <div key={c} className="h-[11px] w-[11px] rounded-full" style={{ background: c }} />
          ))}
        </div>
        <span className="font-mono text-xs text-ft-dim">{filename}</span>
      </div>
      {children}
    </div>
  );
}
