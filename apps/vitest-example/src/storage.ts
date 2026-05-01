/** Typed wrapper around localStorage with JSON serialization. */
export const storage = {
  get<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key: string): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    localStorage.clear();
  },
};

/** Save user preferences and return the stored value. */
export function savePreferences(prefs: Record<string, unknown>): Record<string, unknown> {
  storage.set("preferences", prefs);
  return storage.get<Record<string, unknown>>("preferences") ?? {};
}
