import { useEffect, useState } from "react";

interface ComponentNode {
  name: string;
  depth: number;
  key: string | null;
  isForwardRef: boolean;
  isMemo: boolean;
}

function getFiberKey(el: HTMLElement): string | null {
  return Object.keys(el).find((k) => k.startsWith("__reactFiber$")) ?? null;
}

function collectComponents(fiber: any, depth: number, results: ComponentNode[]) {
  if (!fiber) return;

  let name = "";
  let isForwardRef = false;
  let isMemo = false;

  if (typeof fiber.type === "function") {
    name = fiber.type.displayName || fiber.type.name || "";
  } else if (fiber.type && typeof fiber.type === "object") {
    // memo, forwardRef, lazy, etc.
    const inner = fiber.type;
    if (inner.$$typeof) {
      const sym = String(inner.$$typeof);
      isForwardRef = sym.includes("forward_ref");
      isMemo = sym.includes("memo");
    }
    name =
      inner.displayName || inner.render?.name || inner.type?.name || inner.type?.displayName || "";
  }

  const isComponent = !!name && name !== "Anonymous";
  const nextDepth = isComponent ? depth + 1 : depth;

  if (isComponent) {
    results.push({
      name,
      depth,
      key: fiber.key ?? null,
      isForwardRef,
      isMemo,
    });
  }

  collectComponents(fiber.child, nextDepth, results);
  collectComponents(fiber.sibling, depth, results);
}

function buildTree(container: HTMLElement): ComponentNode[] {
  const fiberKey = getFiberKey(container);
  if (!fiberKey) return [];
  const fiber = (container as any)[fiberKey];
  const results: ComponentNode[] = [];
  collectComponents(fiber?.child, 0, results);
  return results;
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

export function TraceTab({ containerRef }: { containerRef: React.RefObject<HTMLElement | null> }) {
  const [nodes, setNodes] = useState<ComponentNode[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Small delay to ensure React has finished rendering into the container
    const id = setTimeout(() => setNodes(buildTree(el)), 50);
    return () => clearTimeout(id);
  }, [containerRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  if (nodes.length === 0) {
    return (
      <div style={{ padding: "32px 20px", textAlign: "center", color: "#4b4b60", fontSize: 13 }}>
        No React components detected
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 2 }}>
      {nodes.map((node, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            paddingLeft: 8 + node.depth * 16,
            paddingTop: 4,
            paddingBottom: 4,
            borderRadius: 5,
            fontSize: 12,
          }}
        >
          {/* Tree connector */}
          <span style={{ color: "#3a3a4e", marginRight: 6, fontSize: 10, flexShrink: 0 }}>
            {node.depth > 0 ? "└" : "○"}
          </span>

          {/* Component name */}
          <span style={{ color: "#a5b4fc", fontFamily: "monospace", fontWeight: 600 }}>
            {"<"}
            {node.name}
            {">"}
          </span>

          {/* Badges */}
          {node.isMemo && <TypeBadge label="memo" color="#f59e0b" />}
          {node.isForwardRef && <TypeBadge label="ref" color="#06b6d4" />}
          {node.key && (
            <span
              style={{ marginLeft: 8, fontSize: 11, color: "#4b4b60", fontFamily: "monospace" }}
            >
              key="{node.key}"
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
