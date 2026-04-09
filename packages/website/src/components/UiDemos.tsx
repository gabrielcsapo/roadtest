/**
 * Doc demos — fieldtest UI running as a separate Vite server, embedded via iframe.
 */
import { useState } from "react";

const DEMO_SRC = `${import.meta.env.BASE_URL}demo-ui/index.html`;

function ExpandIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M1.5 4.5V1.5h3M10.5 4.5V1.5h-3M1.5 7.5v3h3M10.5 7.5v3h-3" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M4.5 1.5H1.5v3M7.5 1.5h3v3M4.5 10.5H1.5v-3M7.5 10.5h3v-3" />
    </svg>
  );
}

function FieldtestIframe({ height = 480 }: { height?: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div style={{ position: "relative" }}>
        <iframe
          src={DEMO_SRC}
          title="fieldtest live demo"
          style={{ width: "100%", height, border: "none", display: "block" }}
        />
        <button
          onClick={() => setExpanded(true)}
          title="Expand preview"
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            width: 28,
            height: 28,
            borderRadius: 6,
            border: "1px solid rgba(99,102,241,0.4)",
            background: "rgba(15,15,19,0.85)",
            color: "#a5b4fc",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}
        >
          <ExpandIcon />
        </button>
      </div>

      {expanded && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setExpanded(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.75)",
              zIndex: 999,
            }}
          />
          {/* Expanded iframe */}
          <div
            style={{
              position: "fixed",
              top: "10vh",
              left: "10vw",
              width: "80vw",
              height: "80vh",
              zIndex: 1000,
              borderRadius: 10,
              overflow: "hidden",
              border: "1px solid rgba(99,102,241,0.4)",
              boxShadow: "0 0 0 4px rgba(99,102,241,0.06), 0 24px 64px rgba(0,0,0,0.6)",
            }}
          >
            <iframe
              src={DEMO_SRC}
              title="fieldtest live demo expanded"
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            />
            <button
              onClick={() => setExpanded(false)}
              title="Collapse preview"
              style={{
                position: "absolute",
                bottom: 10,
                right: 10,
                width: 28,
                height: 28,
                borderRadius: 6,
                border: "1px solid rgba(99,102,241,0.4)",
                background: "rgba(15,15,19,0.85)",
                color: "#a5b4fc",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(4px)",
              }}
            >
              <CollapseIcon />
            </button>
          </div>
        </>
      )}
    </>
  );
}

export function UiOverviewDemo() {
  return <FieldtestIframe height={480} />;
}

export function FilmstripDemo() {
  return <FieldtestIframe height={420} />;
}

export function TabsDemo() {
  return <FieldtestIframe height={420} />;
}

const DEMOS: Record<string, React.ComponentType> = {
  "ui-overview": UiOverviewDemo,
  filmstrip: FilmstripDemo,
  tabs: TabsDemo,
};

export function DocDemo({ id }: { id: string }) {
  const Component = DEMOS[id];
  if (!Component) return null;
  return <Component />;
}
