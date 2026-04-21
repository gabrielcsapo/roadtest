// CVD (Color Vision Deficiency) contrast analysis
// Applies color-matrix simulation to computed element colors, then checks WCAG AA contrast.

export type VisionKey =
  | "deuteranomaly"
  | "deuteranopia"
  | "protanomaly"
  | "protanopia"
  | "tritanomaly"
  | "tritanopia"
  | "achromatopsia"
  | "grayscale";

interface CvdFilterDef {
  label: string;
  matrix: string; // space-separated feColorMatrix values (4×5 = 20 numbers)
}

// Matrices match the SVG feColorMatrix values in VisionFilter.tsx
const CVD_FILTERS: Record<VisionKey, CvdFilterDef> = {
  deuteranomaly: {
    label: "Deuteranomaly",
    matrix: "0.8 0.2 0 0 0  0.258 0.742 0 0 0  0 0.142 0.858 0 0  0 0 0 1 0",
  },
  deuteranopia: {
    label: "Deuteranopia",
    matrix: "0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0",
  },
  protanomaly: {
    label: "Protanomaly",
    matrix: "0.817 0.183 0 0 0  0.333 0.667 0 0 0  0 0.125 0.875 0 0  0 0 0 1 0",
  },
  protanopia: {
    label: "Protanopia",
    matrix: "0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0",
  },
  tritanomaly: {
    label: "Tritanomaly",
    matrix: "0.967 0.033 0 0 0  0 0.733 0.267 0 0  0 0.183 0.817 0 0  0 0 0 1 0",
  },
  tritanopia: {
    label: "Tritanopia",
    matrix: "0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0",
  },
  achromatopsia: {
    label: "Achromatopsia",
    matrix: "0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0",
  },
  grayscale: {
    label: "Grayscale",
    matrix: "0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0",
  },
};

type RGB = [number, number, number];

function parseRgb(color: string): RGB | null {
  const m = color.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
}

function parseAlpha(color: string): number {
  const m = color.match(/rgba\(\s*\d+,\s*\d+,\s*\d+,\s*([\d.]+)\s*\)/);
  return m ? parseFloat(m[1]) : 1;
}

function applyCVDMatrix(matrix: string, rgb: RGB): RGB {
  const m = matrix.trim().split(/\s+/).map(Number);
  // Normalize to 0–1, apply 4×5 matrix (R' = m[0]*R + m[1]*G + m[2]*B + m[3]*A + m[4])
  const r = rgb[0] / 255,
    g = rgb[1] / 255,
    b = rgb[2] / 255;
  const rn = m[0] * r + m[1] * g + m[2] * b + m[4];
  const gn = m[5] * r + m[6] * g + m[7] * b + m[9];
  const bn = m[10] * r + m[11] * g + m[12] * b + m[14];
  return [
    Math.round(Math.max(0, Math.min(1, rn)) * 255),
    Math.round(Math.max(0, Math.min(1, gn)) * 255),
    Math.round(Math.max(0, Math.min(1, bn)) * 255),
  ];
}

function toLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(rgb: RGB): number {
  return 0.2126 * toLinear(rgb[0]) + 0.7152 * toLinear(rgb[1]) + 0.0722 * toLinear(rgb[2]);
}

function contrastRatio(a: RGB, b: RGB): number {
  const l1 = relativeLuminance(a),
    l2 = relativeLuminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function getEffectiveBackground(el: Element): RGB {
  const win = el.ownerDocument.defaultView!;
  let cur: Element | null = el;
  while (cur instanceof HTMLElement) {
    const bg = win.getComputedStyle(cur).backgroundColor;
    if (parseAlpha(bg) > 0.5) {
      const rgb = parseRgb(bg);
      if (rgb) return rgb;
    }
    cur = cur.parentElement;
  }
  return [255, 255, 255]; // assume white when fully transparent
}

function isLargeText(el: Element): boolean {
  const win = el.ownerDocument.defaultView!;
  const style = win.getComputedStyle(el);
  const size = parseFloat(style.fontSize);
  const weight = parseInt(style.fontWeight) || 400;
  return size >= 24 || (weight >= 700 && size >= 18.67);
}

function isVisible(el: Element): boolean {
  const win = el.ownerDocument.defaultView!;
  const s = win.getComputedStyle(el);
  return s.display !== "none" && s.visibility !== "hidden" && s.opacity !== "0";
}

function hasDirectText(el: Element): boolean {
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) return true;
  }
  return false;
}

function buildSelector(el: Element, root: Element): string {
  const parts: string[] = [];
  let current: Element | null = el;
  while (current && current !== root) {
    let part = current.tagName.toLowerCase();
    if (current.id) {
      part += `#${current.id}`;
      parts.unshift(part);
      break;
    }
    const parent = current.parentElement;
    if (parent) {
      const same = Array.from(parent.children).filter((c) => c.tagName === current!.tagName);
      if (same.length > 1) part += `:nth-of-type(${same.indexOf(current) + 1})`;
    }
    parts.unshift(part);
    current = current.parentElement;
  }
  return parts.join(" > ");
}

export interface ContrastViolation {
  html: string;
  selector: string;
  originalContrast: number;
  simulatedContrast: number;
  required: number;
}

export interface VisionContrastResult {
  visionKey: VisionKey;
  label: string;
  violations: ContrastViolation[];
}

export interface VisionContrastReport {
  results: VisionContrastResult[];
}

export function checkVisionContrast(root: HTMLElement): VisionContrastReport {
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);

  const textEls: HTMLElement[] = [];
  let node: Node | null = walker.currentNode;
  while (node) {
    if (node instanceof HTMLElement && isVisible(node) && hasDirectText(node)) {
      textEls.push(node);
    }
    node = walker.nextNode();
  }

  const results: VisionContrastResult[] = [];

  for (const [visionKey, def] of Object.entries(CVD_FILTERS) as [VisionKey, CvdFilterDef][]) {
    const violations: ContrastViolation[] = [];

    for (const el of textEls) {
      const win = el.ownerDocument.defaultView!;
      const fgRaw = parseRgb(win.getComputedStyle(el).color);
      if (!fgRaw) continue;

      const bgRaw = getEffectiveBackground(el);
      const origContrast = contrastRatio(fgRaw, bgRaw);
      const simFg = applyCVDMatrix(def.matrix, fgRaw);
      const simBg = applyCVDMatrix(def.matrix, bgRaw);
      const simContrast = contrastRatio(simFg, simBg);
      const required = isLargeText(el) ? 3.0 : 4.5;

      if (simContrast < required) {
        violations.push({
          html: el.outerHTML.slice(0, 150),
          selector: buildSelector(el, root),
          originalContrast: Math.round(origContrast * 100) / 100,
          simulatedContrast: Math.round(simContrast * 100) / 100,
          required,
        });
      }
    }

    results.push({ visionKey, label: def.label, violations });
  }

  return { results };
}
