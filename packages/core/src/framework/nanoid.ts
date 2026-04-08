/** Tiny ID generator — avoids adding a dependency */
let counter = 0;

export function nanoid(): string {
  return `${Date.now().toString(36)}-${(++counter).toString(36)}`;
}
