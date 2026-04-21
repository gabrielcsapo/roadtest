/**
 * Demonstrates RoadTest's module mocking via mock().
 *
 * The Vite plugin transforms the static `import { getGreeting }` below into
 * an `await __ftImport(...)` call, so the mock factory registered above it
 * takes effect before the import is resolved.
 */
import { describe, it, expect, mock } from "roadtest";
import { getGreeting } from "./greeting";

// ── Mock './greeting' so the time-of-day logic is predictable ────────────────
mock("./greeting", () => ({
  getGreeting: (name: string) => `Good morning, ${name}!`,
}));

describe("getGreeting() — mocked", () => {
  it("returns the mocked greeting", () => {
    expect(getGreeting("Alice")).toBe("Good morning, Alice!");
  });

  it("passes the name through the mock", () => {
    expect(getGreeting("Bob")).toBe("Good morning, Bob!");
  });
});
