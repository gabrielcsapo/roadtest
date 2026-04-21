export interface SerializedProp {
  value: string;
  /** Coarse type used for syntax coloring in the UI */
  kind: "string" | "number" | "boolean" | "function" | "element" | "object" | "null";
}

function serializeValue(value: unknown, depth = 0): SerializedProp {
  if (value === null || value === undefined) return { value: String(value), kind: "null" };
  if (typeof value === "string") return { value: `"${value}"`, kind: "string" };
  if (typeof value === "number") return { value: String(value), kind: "number" };
  if (typeof value === "boolean") return { value: String(value), kind: "boolean" };
  if (typeof value === "function") {
    return { value: value.name ? `fn(${value.name})` : "fn()", kind: "function" };
  }
  if (typeof value === "symbol") return { value: value.toString(), kind: "string" };

  if (typeof value === "object") {
    // React element
    if ((value as any).$$typeof) {
      const t = value as any;
      const name =
        t.type?.displayName || t.type?.name || (typeof t.type === "string" ? t.type : null);
      return { value: name ? `<${name} />` : "<…>", kind: "element" };
    }
    if (depth > 1) {
      return { value: Array.isArray(value) ? "[…]" : "{…}", kind: "object" };
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return { value: "[]", kind: "object" };
      const items = value
        .slice(0, 3)
        .map((v) => serializeValue(v, depth + 1).value)
        .join(", ");
      return { value: `[${items}${value.length > 3 ? ", …" : ""}]`, kind: "object" };
    }
    const keys = Object.keys(value as object);
    if (keys.length === 0) return { value: "{}", kind: "object" };
    const entries = keys
      .slice(0, 3)
      .map((k) => `${k}: ${serializeValue((value as any)[k], depth + 1).value}`)
      .join(", ");
    return {
      value: `{${entries}${keys.length > 3 ? ", …" : ""}}`,
      kind: "object",
    };
  }

  return { value: String(value), kind: "object" };
}

export function captureProps(fiber: any): Record<string, SerializedProp> | undefined {
  const raw = fiber.memoizedProps;
  if (!raw || typeof raw !== "object") return undefined;
  const props: Record<string, SerializedProp> = {};
  let hasAny = false;
  for (const [k, v] of Object.entries(raw as object)) {
    if (k === "children") continue;
    try {
      props[k] = serializeValue(v);
      hasAny = true;
    } catch {
      props[k] = { value: "[error]", kind: "null" };
      hasAny = true;
    }
  }
  return hasAny ? props : undefined;
}
