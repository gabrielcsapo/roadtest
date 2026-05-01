import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchUser } from "./api";
import { storage, savePreferences } from "./storage";

// ─── vi.mock() — module-level mocking ────────────────────────────────────────
//
// vi.mock() is hoisted by the Vite plugin before any imports are resolved,
// so the mocked version of './api' is what `fetchUser` refers to here.

vi.mock("./api", () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: 1, name: "Mocked User", email: "mock@test.com" }),
  fetchUserPosts: vi.fn().mockResolvedValue([]),
  fetchUserWithPosts: vi
    .fn()
    .mockResolvedValue({ user: { id: 1, name: "Mocked User", email: "" }, posts: [] }),
}));

describe("vi.mock() — replaces module exports with spies", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetchUser returns the mocked value", async () => {
    const user = await fetchUser(99);
    expect(user).toEqual({ id: 1, name: "Mocked User", email: "mock@test.com" });
  });

  it("spy records that fetchUser was called", async () => {
    await fetchUser(1);
    expect(fetchUser).toHaveBeenCalledTimes(1);
    expect(fetchUser).toHaveBeenCalledWith(1);
  });

  it("spy return value matchers work with mocked promises", async () => {
    await fetchUser(5);
    expect(fetchUser).toHaveBeenLastCalledWith(5);
  });
});

// ─── vi.mock() with storage module ───────────────────────────────────────────

vi.mock("./storage", () => ({
  storage: {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  },
  savePreferences: vi.fn().mockImplementation((prefs: Record<string, unknown>) => prefs),
}));

describe("vi.mock() — storage module", () => {
  beforeEach(() => vi.clearAllMocks());

  it("storage.set is a spy that records calls", () => {
    storage.set("theme", "dark");
    expect(storage.set).toHaveBeenCalledWith("theme", "dark");
    expect(storage.set).toHaveBeenCalledTimes(1);
  });

  it("savePreferences passes through prefs via mocked implementation", () => {
    const prefs = { theme: "dark", language: "en" };
    const result = savePreferences(prefs);
    expect(result).toEqual(prefs);
    expect(savePreferences).toHaveBeenCalledWith(prefs);
  });

  it("mocked storage.get returns null by default", () => {
    expect(storage.get("anything")).toBeNull();
  });

  it("can override with mockReturnValueOnce per-test", () => {
    (storage.get as ReturnType<typeof vi.fn>).mockReturnValueOnce({ cached: true });
    expect(storage.get("preferences")).toEqual({ cached: true });
    expect(storage.get("preferences")).toBeNull(); // back to default
  });
});
