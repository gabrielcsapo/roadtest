export function isValidEmail(value: string): boolean {
  return /^[^\s@.][^\s@]*@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

export function minLength(s: string, min: number): boolean {
  return s.length >= min;
}

export function maxLength(s: string, max: number): boolean {
  return s.length <= max;
}

export function isAlphanumeric(s: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(s);
}

export function isNumeric(s: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(s);
}

export function matchesPattern(s: string, regex: RegExp): boolean {
  return regex.test(s);
}

export type ValidationRule =
  | { type: "required" }
  | { type: "email" }
  | { type: "url" }
  | { type: "minLength"; min: number }
  | { type: "maxLength"; max: number }
  | { type: "alphanumeric" }
  | { type: "numeric" }
  | { type: "pattern"; regex: RegExp; message?: string };

export function validateField(value: string, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    switch (rule.type) {
      case "required":
        if (!isRequired(value)) return "This field is required";
        break;
      case "email":
        if (!isValidEmail(value)) return "Invalid email address";
        break;
      case "url":
        if (!isValidUrl(value)) return "Invalid URL";
        break;
      case "minLength":
        if (!minLength(value, rule.min)) return `Minimum length is ${rule.min}`;
        break;
      case "maxLength":
        if (!maxLength(value, rule.max)) return `Maximum length is ${rule.max}`;
        break;
      case "alphanumeric":
        if (!isAlphanumeric(value)) return "Only letters and numbers are allowed";
        break;
      case "numeric":
        if (!isNumeric(value)) return "Must be a number";
        break;
      case "pattern":
        if (!matchesPattern(value, rule.regex)) return rule.message ?? "Invalid format";
        break;
    }
  }
  return null;
}
