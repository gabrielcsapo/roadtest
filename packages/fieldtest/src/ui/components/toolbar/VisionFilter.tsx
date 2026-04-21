import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export type VisionFilter =
  | "none"
  | "blurred"
  | "deuteranomaly"
  | "deuteranopia"
  | "protanomaly"
  | "protanopia"
  | "tritanomaly"
  | "tritanopia"
  | "achromatopsia"
  | "grayscale";

interface FilterDef {
  label: string;
  prevalence: string;
  /** left and right gradient stop colors for the color ball */
  ball: [string, string];
  blur?: boolean;
  matrix?: string;
}

const FILTERS: Record<VisionFilter, FilterDef> = {
  none: { label: "Reset color filter", prevalence: "", ball: ["#f87171", "#60a5fa"] },
  blurred: {
    label: "Blurred vision",
    prevalence: "22.9% of users",
    ball: ["#fb923c", "#818cf8"],
    blur: true,
  },
  deuteranomaly: {
    label: "Deuteranomaly",
    prevalence: "2.7% of users",
    ball: ["#a78040", "#607860"],
    matrix: "0.8 0.2 0 0 0  0.258 0.742 0 0 0  0 0.142 0.858 0 0  0 0 0 1 0",
  },
  deuteranopia: {
    label: "Deuteranopia",
    prevalence: "0.56% of users",
    ball: ["#8a6a30", "#4a6a4a"],
    matrix: "0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0",
  },
  protanomaly: {
    label: "Protanomaly",
    prevalence: "0.66% of users",
    ball: ["#6060a0", "#508050"],
    matrix: "0.817 0.183 0 0 0  0.333 0.667 0 0 0  0 0.125 0.875 0 0  0 0 0 1 0",
  },
  protanopia: {
    label: "Protanopia",
    prevalence: "0.59% of users",
    ball: ["#4a4a88", "#406840"],
    matrix: "0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0",
  },
  tritanomaly: {
    label: "Tritanomaly",
    prevalence: "0.01% of users",
    ball: ["#e05050", "#5050c8"],
    matrix: "0.967 0.033 0 0 0  0 0.733 0.267 0 0  0 0.183 0.817 0 0  0 0 0 1 0",
  },
  tritanopia: {
    label: "Tritanopia",
    prevalence: "0.016% of users",
    ball: ["#cc2222", "#2222cc"],
    matrix: "0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0",
  },
  achromatopsia: {
    label: "Achromatopsia",
    prevalence: "0.0001% of users",
    ball: ["#888", "#ccc"],
    matrix: "0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0",
  },
  grayscale: {
    label: "Grayscale",
    prevalence: "",
    ball: ["#666", "#aaa"],
    matrix: "0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0",
  },
};

export function visionFilterStyle(filter: VisionFilter): React.CSSProperties {
  if (filter === "none") return {};
  if (filter === "blurred") return { filter: "blur(2px)" };
  return { filter: "url(#fieldtest-vision-filter)" };
}

function ColorBall({ filter, size = 20 }: { filter: VisionFilter; size?: number }) {
  const def = FILTERS[filter];
  const id = `vt-ball-${filter}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      style={{ flexShrink: 0, ...(def.blur ? { filter: "blur(1.5px)" } : {}) }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={def.ball[0]} />
          <stop offset="100%" stopColor={def.ball[1]} />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <circle cx="10" cy="10" r="9" />
        </clipPath>
      </defs>
      <circle cx="10" cy="10" r="9" fill={`url(#${id})`} clipPath={`url(#${id}-clip)`} />
      <circle cx="10" cy="10" r="9" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
    </svg>
  );
}

function VisionSvgFilter({ value }: { value: VisionFilter }) {
  const def = FILTERS[value];
  if (!def.matrix) return null;
  return (
    <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} aria-hidden>
      <defs>
        <filter id="fieldtest-vision-filter">
          <feColorMatrix type="matrix" values={def.matrix} />
        </filter>
      </defs>
    </svg>
  );
}

export interface VisionFilterProps {
  value: VisionFilter;
  onChange: (v: VisionFilter) => void;
}

export function VisionFilter({ value, onChange }: VisionFilterProps) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        ref.current &&
        !ref.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setOpen((o) => !o);
  };

  const isActive = value !== "none";

  return (
    <>
      <VisionSvgFilter value={value} />
      <div ref={ref} style={{ position: "relative" }}>
        {/* Trigger button */}
        <button
          ref={btnRef}
          onClick={handleOpen}
          title="Vision simulation"
          style={{
            background: isActive ? "rgba(99,102,241,0.2)" : "transparent",
            border: "1px solid",
            borderColor: isActive ? "rgba(99,102,241,0.5)" : "#2a2a36",
            borderRadius: 6,
            padding: "4px 6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <ColorBall filter={value} size={16} />
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ color: "#6b7280" }}>
            <path
              d="M1 2.5L4 5.5L7 2.5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Popover — rendered in a portal to escape overflow:auto clipping on the toolbar */}
        {open &&
          dropdownPos &&
          createPortal(
            <div
              ref={popoverRef}
              style={{
                position: "fixed",
                top: dropdownPos.top,
                right: dropdownPos.right,
                background: "#1a1a24",
                border: "1px solid #2a2a36",
                borderRadius: 10,
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                minWidth: 240,
                zIndex: 9999,
              }}
            >
              {(Object.keys(FILTERS) as VisionFilter[]).map((key, i) => {
                const def = FILTERS[key];
                const isSelected = key === value;
                const isReset = key === "none";
                return (
                  <button
                    key={key}
                    onClick={() => {
                      onChange(key);
                      setOpen(false);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      background: isSelected ? "rgba(99,102,241,0.15)" : "transparent",
                      border: "none",
                      borderTop: isReset || i === 0 ? "none" : "1px solid #1e1e2e",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLElement).style.background =
                          "rgba(255,255,255,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    {isReset ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        style={{ flexShrink: 0 }}
                      >
                        <path
                          d="M10 4a6 6 0 1 0 5.66 4H14a4 4 0 1 1-4-4V2l3 3-3 3V6a6 6 0 0 0-6 6"
                          stroke="#6b7280"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 4V2l3 3-3 3"
                          stroke="#6b7280"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <ColorBall filter={key} size={20} />
                    )}
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: isSelected ? "#a5b4fc" : "#c4c4d4",
                        }}
                      >
                        {def.label}
                      </div>
                      {def.prevalence && (
                        <div style={{ fontSize: 11, color: "#4b4b60", marginTop: 1 }}>
                          {def.prevalence}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>,
            document.body,
          )}
      </div>
    </>
  );
}

export default VisionFilter;
