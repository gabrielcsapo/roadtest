import { useState } from "react";
import type { ComponentNode } from "../../../framework/types";
import type { SerializedProp } from "../../../framework/traceUtils";

export type { ComponentNode };

// Distinct colors per depth level, cycling after 8
const DEPTH_COLORS = [
  "#a5b4fc", // indigo
  "#6ee7b7", // emerald
  "#fcd34d", // amber
  "#f9a8d4", // pink
  "#67e8f9", // cyan
  "#d8b4fe", // purple
  "#86efac", // green
  "#fda4af", // rose
];

const KIND_COLORS: Record<SerializedProp["kind"], string> = {
  string: "#6ee7b7",
  number: "#fcd34d",
  boolean: "#f9a8d4",
  function: "#d8b4fe",
  element: "#67e8f9",
  object: "#94a3b8",
  null: "#4b4b60",
};

function depthColor(depth: number): string {
  return DEPTH_COLORS[depth % DEPTH_COLORS.length];
}

function TypeBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.05em",
        color,
        background: `${color}1a`,
        border: `1px solid ${color}40`,
        borderRadius: 3,
        padding: "1px 4px",
        marginLeft: 4,
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

const MAX_INLINE_PROPS = 3;

function PropList({ props }: { props: Record<string, SerializedProp> }) {
  const entries = Object.entries(props);
  const visible = entries.slice(0, MAX_INLINE_PROPS);
  const overflow = entries.length - MAX_INLINE_PROPS;
  return (
    <span
      style={{
        marginLeft: 8,
        fontFamily: "monospace",
        fontSize: 11,
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0 6px",
        minWidth: 0,
      }}
    >
      {visible.map(([k, p]) => (
        <span key={k}>
          <span style={{ color: "#4b5563" }}>{k}</span>
          <span style={{ color: "#3a3a4e" }}>=</span>
          <span style={{ color: KIND_COLORS[p.kind] }}>{p.value}</span>
        </span>
      ))}
      {overflow > 0 && <span style={{ color: "#4b4b60" }}>+{overflow}</span>}
    </span>
  );
}

export function TraceTab({
  nodes = [],
  onHighlight,
}: {
  nodes: ComponentNode[];
  onHighlight?: (highlights: { path: number[]; color: string }[]) => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  function emit(selected: Set<number>, hovered: number | null) {
    const highlights: { path: number[]; color: string }[] = [];
    for (const idx of selected) {
      const node = nodes[idx];
      if (node?.domPath) highlights.push({ path: node.domPath, color: depthColor(node.depth) });
    }
    if (hovered !== null && !selected.has(hovered)) {
      const node = nodes[hovered];
      if (node?.domPath) highlights.push({ path: node.domPath, color: depthColor(node.depth) });
    }
    onHighlight?.(highlights);
  }

  if (nodes?.length === 0) {
    return (
      <div style={{ padding: "32px 20px", textAlign: "center", color: "#4b4b60", fontSize: 13 }}>
        Play the test or interact with it to see the component trace
      </div>
    );
  }

  return (
    <div
      style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 2 }}
      onMouseLeave={() => {
        setHoveredIndex(null);
        emit(selectedIndices, null);
      }}
    >
      {nodes.map((node: ComponentNode, i: number) => {
        const isHovered = hoveredIndex === i;
        const isSelected = selectedIndices.has(i);
        const color = depthColor(node.depth);
        const propEntries = node.props ? Object.entries(node.props) : [];
        return (
          <div
            key={i}
            onMouseEnter={() => {
              setHoveredIndex(i);
              emit(selectedIndices, i);
            }}
            onClick={() => {
              const next = new Set(selectedIndices);
              if (next.has(i)) next.delete(i);
              else next.add(i);
              setSelectedIndices(next);
              emit(next, hoveredIndex);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              paddingLeft: 8 + node.depth * 16,
              paddingTop: 4,
              paddingBottom: 4,
              borderRadius: 5,
              fontSize: 12,
              cursor: node.domPath ? "pointer" : "default",
              background: isSelected ? `${color}12` : isHovered ? "#ffffff08" : "transparent",
              outline: isSelected ? `1px solid ${color}40` : "none",
              minWidth: 0,
            }}
          >
            {/* Depth color swatch */}
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: color,
                flexShrink: 0,
                marginRight: 6,
                opacity: isHovered || isSelected ? 1 : 0.45,
              }}
            />
            <span style={{ color: "#3a3a4e", marginRight: 4, fontSize: 10, flexShrink: 0 }}>
              {node.depth > 0 ? "└" : "○"}
            </span>
            <span style={{ color, fontFamily: "monospace", fontWeight: 600, flexShrink: 0 }}>
              {"<"}
              {node.name}
              {">"}
            </span>
            {node.isMemo && <TypeBadge label="memo" color="#f59e0b" />}
            {node.isForwardRef && <TypeBadge label="ref" color="#06b6d4" />}
            {node.key && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  color: "#4b4b60",
                  fontFamily: "monospace",
                  flexShrink: 0,
                }}
              >
                key="{node.key}"
              </span>
            )}
            {propEntries.length > 0 && <PropList props={node.props!} />}
          </div>
        );
      })}
    </div>
  );
}
