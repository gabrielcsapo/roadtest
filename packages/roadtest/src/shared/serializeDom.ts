/**
 * Pure-JS HTML serializer used by both the browser snapshot capture and the
 * Node runner's snapshot comparison. Produces byte-identical output in any
 * JavaScript environment (Node, browser, Bun, etc.) regardless of which CSS
 * engine or HTML parser produced the raw input.
 *
 * Why a shared serializer: browser `innerHTML` and happy-dom `innerHTML` are
 * superficially similar but differ in attribute order, shorthand preservation,
 * quote encoding, and whitespace. The old code had separate DOM-based and
 * regex-based normalizers that tried to agree — they didn't (regex split on
 * `;` inside `&quot;`, DOM-based depended on browser CSS quirks, etc.). This
 * module replaces both with a single implementation whose canonical form is
 * the same no matter what produced the input.
 */

// ─── HTML entity handling ────────────────────────────────────────────────────

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, body) => {
    if (body[0] === "#") {
      const cp =
        body[1] === "x" || body[1] === "X"
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      if (!Number.isFinite(cp) || cp < 0 || cp > 0x10ffff) return match;
      try {
        return String.fromCodePoint(cp);
      } catch {
        return match;
      }
    }
    return NAMED_ENTITIES[body] ?? match;
  });
}

function encodeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function encodeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ─── HTML tokenizer ──────────────────────────────────────────────────────────

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);

const RAW_TEXT_ELEMENTS = new Set(["script", "style", "textarea", "title"]);

type Attrs = Array<[string, string | null]>;

type Token =
  | { type: "open"; name: string; attrs: Attrs; selfClose: boolean }
  | { type: "close"; name: string }
  | { type: "text"; value: string; raw: boolean }
  | { type: "comment"; value: string }
  | { type: "doctype"; value: string };

function indexOfIgnoreCase(haystack: string, needle: string, from: number): number {
  const n = needle.toLowerCase();
  for (let i = from; i <= haystack.length - n.length; i++) {
    if (haystack.slice(i, i + n.length).toLowerCase() === n) return i;
  }
  return -1;
}

function parseOpenTag(
  html: string,
  start: number,
): { end: number; name: string; attrs: Attrs; selfClose: boolean } {
  let i = start + 1;
  const nameStart = i;
  while (i < html.length && /[a-zA-Z0-9:-]/.test(html[i]!)) i++;
  const name = html.slice(nameStart, i).toLowerCase();

  const attrs: Attrs = [];
  let selfClose = false;

  while (i < html.length) {
    while (i < html.length && /\s/.test(html[i]!)) i++;
    if (i >= html.length) break;
    if (html[i] === ">") return { end: i + 1, name, attrs, selfClose };
    if (html[i] === "/" && html[i + 1] === ">") {
      selfClose = true;
      return { end: i + 2, name, attrs, selfClose };
    }
    if (html[i] === "/") {
      i++;
      continue;
    }

    const attrStart = i;
    while (i < html.length && !/[\s=>/]/.test(html[i]!)) i++;
    const attrName = html.slice(attrStart, i).toLowerCase();
    if (!attrName) {
      i++;
      continue;
    }

    while (i < html.length && /\s/.test(html[i]!)) i++;

    if (html[i] === "=") {
      i++;
      while (i < html.length && /\s/.test(html[i]!)) i++;
      let value: string;
      if (html[i] === '"' || html[i] === "'") {
        const quote = html[i]!;
        i++;
        const valStart = i;
        while (i < html.length && html[i] !== quote) i++;
        value = html.slice(valStart, i);
        if (i < html.length) i++;
      } else {
        const valStart = i;
        while (i < html.length && !/[\s>]/.test(html[i]!)) i++;
        value = html.slice(valStart, i);
      }
      attrs.push([attrName, value]);
    } else {
      attrs.push([attrName, null]);
    }
  }

  return { end: i, name, attrs, selfClose };
}

function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  const n = html.length;
  let i = 0;

  while (i < n) {
    if (html[i] === "<") {
      if (html.startsWith("<!--", i)) {
        const end = html.indexOf("-->", i + 4);
        if (end === -1) {
          tokens.push({ type: "text", value: html.slice(i), raw: false });
          break;
        }
        tokens.push({ type: "comment", value: html.slice(i + 4, end) });
        i = end + 3;
        continue;
      }
      if (html[i + 1] === "!") {
        const end = html.indexOf(">", i);
        if (end === -1) break;
        tokens.push({ type: "doctype", value: html.slice(i + 2, end) });
        i = end + 1;
        continue;
      }
      if (html[i + 1] === "/") {
        const end = html.indexOf(">", i);
        if (end === -1) break;
        tokens.push({
          type: "close",
          name: html
            .slice(i + 2, end)
            .trim()
            .toLowerCase(),
        });
        i = end + 1;
        continue;
      }
      if (/[a-zA-Z]/.test(html[i + 1] ?? "")) {
        const { end, name, attrs, selfClose } = parseOpenTag(html, i);
        tokens.push({ type: "open", name, attrs, selfClose });
        i = end;
        if (RAW_TEXT_ELEMENTS.has(name) && !selfClose && !VOID_ELEMENTS.has(name)) {
          const closeIdx = indexOfIgnoreCase(html, `</${name}`, i);
          const rawEnd = closeIdx === -1 ? n : closeIdx;
          if (rawEnd > i) tokens.push({ type: "text", value: html.slice(i, rawEnd), raw: true });
          i = rawEnd;
        }
        continue;
      }
    }
    const nextLt = html.indexOf("<", i);
    const end = nextLt === -1 ? n : nextLt;
    tokens.push({ type: "text", value: html.slice(i, end), raw: false });
    i = end;
  }
  return tokens;
}

// ─── CSS declaration parsing (string + paren aware) ──────────────────────────

function parseCssDeclarations(css: string): Array<[string, string]> {
  const decls: Array<[string, string]> = [];
  let buf = "";
  let depth = 0;
  let str: '"' | "'" | null = null;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i]!;
    if (str) {
      buf += ch;
      if (ch === str && css[i - 1] !== "\\") str = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      str = ch;
      buf += ch;
      continue;
    }
    if (ch === "(") {
      depth++;
      buf += ch;
      continue;
    }
    if (ch === ")") {
      depth--;
      buf += ch;
      continue;
    }
    if (ch === ";" && depth === 0) {
      pushDecl(buf, decls);
      buf = "";
      continue;
    }
    buf += ch;
  }
  pushDecl(buf, decls);
  return decls;
}

function pushDecl(buf: string, decls: Array<[string, string]>): void {
  const s = buf.trim();
  if (!s) return;
  const colon = s.indexOf(":");
  if (colon < 1) return;
  decls.push([s.slice(0, colon).trim().toLowerCase(), s.slice(colon + 1).trim()]);
}

/**
 * Collapse runs of whitespace in a CSS value to single spaces, but preserve
 * whitespace inside quoted strings (e.g. `content: "a   b"`). Trims the result.
 * This makes multi-line pretty-printed values like
 *   `transition: border-color 0.15s,\n    color 0.15s`
 * compare equal to their single-line equivalents.
 */
function collapseCssWhitespace(v: string): string {
  let out = "";
  let str: '"' | "'" | null = null;
  let lastWasSpace = true;
  for (let i = 0; i < v.length; i++) {
    const ch = v[i]!;
    if (str) {
      out += ch;
      if (ch === str && v[i - 1] !== "\\") str = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      str = ch;
      out += ch;
      lastWasSpace = false;
      continue;
    }
    if (/\s/.test(ch)) {
      if (!lastWasSpace) out += " ";
      lastWasSpace = true;
      continue;
    }
    out += ch;
    lastWasSpace = false;
  }
  return out.trimEnd();
}

function splitCssValue(v: string): string[] {
  const tokens: string[] = [];
  let buf = "";
  let depth = 0;
  for (const ch of v) {
    if (ch === "(") {
      depth++;
      buf += ch;
      continue;
    }
    if (ch === ")") {
      depth--;
      buf += ch;
      continue;
    }
    if (/\s/.test(ch) && depth === 0) {
      if (buf) {
        tokens.push(buf);
        buf = "";
      }
      continue;
    }
    buf += ch;
  }
  if (buf) tokens.push(buf);
  return tokens;
}

// ─── CSS value normalization ─────────────────────────────────────────────────

/**
 * Format an 8-bit alpha byte (0-255) the way Chrome's CSSOM does: the shortest
 * decimal representation that round-trips to the same byte when multiplied by
 * 255 and rounded. For 0x40 that's `0.25` (not `0.251`); for 0x20 it's `0.125`.
 * Matching Chrome's algorithm avoids rgba() precision drift between Node
 * (serialized from hex via this function) and the real browser (serialized by
 * its CSS engine).
 */
function alphaByteToDecimal(byte: number): string {
  if (byte === 0) return "0";
  if (byte === 255) return "1";
  for (let digits = 1; digits <= 3; digits++) {
    const trial = Number((byte / 255).toFixed(digits));
    if (Math.round(trial * 255) === byte) return String(trial);
  }
  return String(byte / 255);
}

function hexToRgb(hex: string): string {
  const h = hex.slice(1);
  if (h.length === 3) {
    const r = parseInt(h[0]! + h[0], 16);
    const g = parseInt(h[1]! + h[1], 16);
    const b = parseInt(h[2]! + h[2], 16);
    return `rgb(${r}, ${g}, ${b})`;
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgb(${r}, ${g}, ${b})`;
  }
  if (h.length === 8) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = alphaByteToDecimal(parseInt(h.slice(6, 8), 16));
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  return hex;
}

function normalizeColorsInValue(value: string): string {
  return value.replace(/#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/g, hexToRgb);
}

/** Normalize a numeric zero to its unitless form so `0px` and `0` compare equal. */
function normalizeZero(value: string): string {
  return value.replace(/(^|[\s,(])0(?:px|em|rem|%|pt|vh|vw|pc|ex|ch)(?=[\s,);]|$)/g, "$10");
}

// ─── CSS shorthand expansion ─────────────────────────────────────────────────

const BORDER_STYLES = new Set([
  "none",
  "hidden",
  "dotted",
  "dashed",
  "solid",
  "double",
  "groove",
  "ridge",
  "inset",
  "outset",
]);

function isBorderWidth(tok: string): boolean {
  return (
    tok === "thin" ||
    tok === "medium" ||
    tok === "thick" ||
    /^-?[\d.]+(?:px|em|rem|%|pt|cm|mm|in|vh|vw|pc|ex|ch)?$/i.test(tok)
  );
}

function expandBoxShorthand(prop: "margin" | "padding", value: string): Array<[string, string]> {
  const parts = splitCssValue(value);
  const [t, r = t, b = t, l = r] = parts;
  return [
    [`${prop}-top`, t!],
    [`${prop}-right`, r!],
    [`${prop}-bottom`, b!],
    [`${prop}-left`, l!],
  ];
}

function expandBorderRadius(value: string): Array<[string, string]> {
  const [horizontal, vertical] = value.split("/").map((s) => s.trim());
  const hParts = splitCssValue(horizontal ?? "");
  const [htl, htr = htl, hbr = htl, hbl = htr] = hParts;
  if (!vertical) {
    return [
      ["border-top-left-radius", htl!],
      ["border-top-right-radius", htr!],
      ["border-bottom-right-radius", hbr!],
      ["border-bottom-left-radius", hbl!],
    ];
  }
  const vParts = splitCssValue(vertical);
  const [vtl, vtr = vtl, vbr = vtl, vbl = vtr] = vParts;
  return [
    ["border-top-left-radius", `${htl} ${vtl}`],
    ["border-top-right-radius", `${htr} ${vtr}`],
    ["border-bottom-right-radius", `${hbr} ${vbr}`],
    ["border-bottom-left-radius", `${hbl} ${vbl}`],
  ];
}

function expandBorderSide(
  prop: "border" | "border-top" | "border-right" | "border-bottom" | "border-left",
  value: string,
): Array<[string, string]> {
  // happy-dom quirk: "border: none" serializes as "border: none none" (invalid) —
  // collapse repeated tokens before parsing.
  const v = value.trim().replace(/^(none)(?:\s+none)+$/, "none");
  const sides =
    prop === "border"
      ? (["border-top", "border-right", "border-bottom", "border-left"] as const)
      : ([prop] as const);

  if (v === "none" || v === "0") {
    // CSS spec default width for `border: none` is `medium` (not 0) — Chrome's
    // CSS engine emits `medium` when reading back an element styled with
    // `border: none`, so our canonical form must match to avoid a false diff.
    const out: Array<[string, string]> = [];
    for (const s of sides) {
      out.push([`${s}-width`, "medium"]);
      out.push([`${s}-style`, "none"]);
      out.push([`${s}-color`, "currentcolor"]);
    }
    return out;
  }

  const tokens = splitCssValue(v);
  let width: string | null = null;
  let style: string | null = null;
  let color: string | null = null;
  for (const tok of tokens) {
    if (width === null && isBorderWidth(tok)) {
      width = tok;
      continue;
    }
    if (style === null && BORDER_STYLES.has(tok.toLowerCase())) {
      style = tok.toLowerCase();
      continue;
    }
    color = color ? `${color} ${tok}` : tok;
  }

  const out: Array<[string, string]> = [];
  for (const s of sides) {
    out.push([`${s}-width`, width ?? "medium"]);
    out.push([`${s}-style`, style ?? "none"]);
    out.push([`${s}-color`, color ?? "currentcolor"]);
  }
  return out;
}

function expandBorderSubSide(
  prop: "border-width" | "border-style" | "border-color",
  value: string,
): Array<[string, string]> {
  const parts = splitCssValue(value);
  const [t, r = t, b = t, l = r] = parts;
  const suffix = prop.slice("border-".length);
  return [
    [`border-top-${suffix}`, t!],
    [`border-right-${suffix}`, r!],
    [`border-bottom-${suffix}`, b!],
    [`border-left-${suffix}`, l!],
  ];
}

function expandFlex(value: string): Array<[string, string]> {
  const v = value.trim().toLowerCase();
  if (v === "none") {
    return [
      ["flex-grow", "0"],
      ["flex-shrink", "0"],
      ["flex-basis", "auto"],
    ];
  }
  if (v === "auto") {
    return [
      ["flex-grow", "1"],
      ["flex-shrink", "1"],
      ["flex-basis", "auto"],
    ];
  }
  const parts = splitCssValue(value);
  const num = /^-?[\d.]+$/;
  let grow = "1";
  let shrink = "1";
  let basis = "0%";
  if (parts.length === 1) {
    const p = parts[0]!;
    if (num.test(p)) grow = p;
    else basis = p;
  } else if (parts.length === 2) {
    grow = parts[0]!;
    if (num.test(parts[1]!)) shrink = parts[1]!;
    else basis = parts[1]!;
  } else if (parts.length >= 3) {
    grow = parts[0]!;
    shrink = parts[1]!;
    basis = parts.slice(2).join(" ");
  }
  return [
    ["flex-grow", grow],
    ["flex-shrink", shrink],
    ["flex-basis", basis],
  ];
}

function expandDeclaration(prop: string, value: string): Array<[string, string]> {
  switch (prop) {
    case "margin":
    case "padding":
      return expandBoxShorthand(prop, value);
    case "border":
    case "border-top":
    case "border-right":
    case "border-bottom":
    case "border-left":
      return expandBorderSide(prop, value);
    case "border-width":
    case "border-style":
    case "border-color":
      return expandBorderSubSide(prop, value);
    case "border-radius":
      return expandBorderRadius(value);
    case "flex":
      return expandFlex(value);
    default:
      return [[prop, value]];
  }
}

/**
 * Declarations whose value is this set are dropped from canonical output.
 * `initial` is the CSS default; Chrome's CSSOM emits e.g. `border-image: initial`
 * whenever the `border` shorthand is used, while happy-dom doesn't. Treating
 * `initial` as a no-op eliminates that cross-engine asymmetry.
 */
const DROP_IF_INITIAL = new Set([
  "border-image",
  "border-image-source",
  "border-image-slice",
  "border-image-width",
  "border-image-outset",
  "border-image-repeat",
]);

function canonicalStyleValue(raw: string): string {
  // Decode entities first so `;` inside `&quot;...&quot;` doesn't terminate a declaration.
  const decoded = decodeEntities(raw);
  const expanded = new Map<string, string>();
  for (const [prop, value] of parseCssDeclarations(decoded)) {
    const collapsed = collapseCssWhitespace(value);
    for (const [p, v] of expandDeclaration(prop, collapsed)) {
      if (DROP_IF_INITIAL.has(p) && v.trim().toLowerCase() === "initial") continue;
      expanded.set(p, collapseCssWhitespace(normalizeZero(normalizeColorsInValue(v))));
    }
  }
  return [...expanded.keys()]
    .sort()
    .map((p) => `${p}: ${expanded.get(p)}`)
    .join("; ");
}

// ─── Attribute serialization ─────────────────────────────────────────────────

function serializeAttrs(attrs: Attrs): string {
  // Sort alphabetically, normalize style, drop meaningless empty attributes.
  const sorted = [...attrs].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return sorted
    .map(([name, value]) => {
      if (value === null) return ` ${name}`;
      const normalized = name === "style" ? canonicalStyleValue(value) : decodeEntities(value);
      if (name === "style" && !normalized) return "";
      return ` ${name}="${encodeAttr(normalized)}"`;
    })
    .join("");
}

// ─── Main serializer ─────────────────────────────────────────────────────────

/**
 * Serialize raw HTML to a canonical form. Identical output in Node + browser
 * for inputs that differ only in:
 *   - attribute order
 *   - style-declaration order
 *   - style shorthand vs longhand expansion (border, margin, padding, flex,
 *     border-radius)
 *   - hex vs rgb() color notation
 *   - `0` vs `0px` zero-length notation
 *   - `&quot;` vs `"` attribute encoding
 *   - whitespace between tags and around text
 *   - pretty-printing / indentation
 *   - happy-dom "border: none none" quirk
 */
export function serializeDom(html: string): string {
  const tokens = tokenize(html);
  let out = "";

  for (const tok of tokens) {
    if (tok.type === "open") {
      out += `<${tok.name}${serializeAttrs(tok.attrs)}`;
      out += tok.selfClose || VOID_ELEMENTS.has(tok.name) ? "/>" : ">";
    } else if (tok.type === "close") {
      out += `</${tok.name}>`;
    } else if (tok.type === "comment") {
      out += `<!--${tok.value}-->`;
    } else if (tok.type === "doctype") {
      out += `<!${tok.value}>`;
    } else if (tok.raw) {
      // script/style/textarea: preserve content verbatim.
      out += tok.value;
    } else {
      // Text between tags: trim leading/trailing whitespace so pretty-printer
      // indentation doesn't matter, but preserve inner whitespace so content
      // like `hello   world` stays distinct from `hello world`.
      const trimmed = decodeEntities(tok.value).trim();
      if (trimmed) out += encodeText(trimmed);
    }
  }

  return out;
}

// ─── Passthrough-wrapper detection ───────────────────────────────────────────

/**
 * If exactly one side wraps its content in a passthrough `<div>` whose only
 * attribute is a style of `property: inherit` declarations, strip it so both
 * sides compare on the same content root. Handles the `.roadtest/preview.tsx`
 * wrapper that's present in browser renders but absent in Node captures.
 *
 * Operates on already-canonicalized HTML strings (output of serializeDom).
 */
export function stripPassthroughWrapper(
  baseHtml: string,
  currHtml: string,
): { base: string; curr: string } {
  const unwrap = (h: string): string | null => {
    const m = h.match(/^<div(?: style="([^"]*)")?>([\s\S]*)<\/div>$/);
    if (!m) return null;
    const style = m[1] ?? "";
    if (style && !/^(?:[\w-]+: inherit(?:; )?)+$/.test(style)) return null;
    return m[2]!;
  };
  const uBase = unwrap(baseHtml);
  const uCurr = unwrap(currHtml);
  if (uCurr !== null && uBase === null) return { base: baseHtml, curr: uCurr };
  if (uBase !== null && uCurr === null) return { base: uBase, curr: currHtml };
  return { base: baseHtml, curr: currHtml };
}

/**
 * Canonical equality check for snapshot comparison. Both sides are run through
 * `serializeDom` so the comparison is pure string equality on canonical form.
 */
export function snapshotsAreEquivalent(stored: string, current: string): boolean {
  const a = serializeDom(stored);
  const b = serializeDom(current);
  const { base, curr } = stripPassthroughWrapper(a, b);
  return base === curr;
}
