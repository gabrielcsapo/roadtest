import { describe, it, expect, vi } from "vitest";
import { fetchUser, fetchUserWithPosts } from "./api";

// ─── resolves / rejects chains ────────────────────────────────────────────────

describe("resolves / rejects chains", () => {
  it("resolves — awaits a resolved promise and runs matchers on the value", async () => {
    const fn = vi.fn().mockResolvedValue({ id: 1, name: "Alice" });
    await expect(fn()).resolves.toEqual({ id: 1, name: "Alice" });
    await expect(fn()).resolves.toMatchObject({ name: "Alice" });
  });

  it("rejects — awaits a rejected promise and runs matchers on the error", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("network error"));
    await expect(fn()).rejects.toThrow("network error");
    await expect(fn()).rejects.toBeInstanceOf(Error);
  });

  it("resolves.not — fails when promise resolves to wrong value", async () => {
    const fn = vi.fn().mockResolvedValue(42);
    await expect(fn()).resolves.not.toBe(99);
  });
});

// ─── mockResolvedValue / mockRejectedValue ───────────────────────────────────

describe("mockResolvedValue and mockRejectedValue", () => {
  it("mockResolvedValue makes the spy return a resolved promise", async () => {
    const spy = vi.fn().mockResolvedValue("hello");
    const result = await spy();
    expect(result).toBe("hello");
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("mockRejectedValue makes the spy return a rejected promise", async () => {
    const spy = vi.fn().mockRejectedValue(new Error("oops"));
    await expect(spy()).rejects.toThrow("oops");
  });

  it("mockResolvedValueOnce sequences resolved values", async () => {
    const spy = vi
      .fn()
      .mockResolvedValueOnce("first")
      .mockResolvedValueOnce("second")
      .mockResolvedValue("default");

    expect(await spy()).toBe("first");
    expect(await spy()).toBe("second");
    expect(await spy()).toBe("default");
  });

  it("mockRejectedValueOnce fails once then resolves", async () => {
    const spy = vi
      .fn()
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValue("ok");

    await expect(spy()).rejects.toThrow("temporary failure");
    expect(await spy()).toBe("ok");
  });
});

// ─── mocking fetch-based API functions ───────────────────────────────────────

describe("API functions with mocked fetch", () => {
  it("fetchUser resolves to a user object", async () => {
    const mockUser = { id: 1, name: "Leanne Graham", email: "Sincere@april.biz" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser),
      }),
    );

    const user = await fetchUser(1);
    expect(user).toEqual(mockUser);
    expect(user.id).toEqual(expect.any(Number));
    expect(user.name).toEqual(expect.any(String));

    vi.unstubAllGlobals();
  });

  it("fetchUser rejects when response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    await expect(fetchUser(999)).rejects.toThrow("Failed to fetch user 999: 404");

    vi.unstubAllGlobals();
  });

  it("fetchUserWithPosts resolves to user and posts together", async () => {
    const mockUser = { id: 2, name: "Bob", email: "bob@test.com" };
    const mockPosts = [{ id: 1, userId: 2, title: "Hello", body: "World" }];

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockUser) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockPosts) });

    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchUserWithPosts(2);
    expect(result).toMatchObject({
      user: expect.objectContaining({ id: 2, name: "Bob" }),
      posts: expect.arrayContaining([expect.objectContaining({ title: "Hello" })]),
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    vi.unstubAllGlobals();
  });
});
