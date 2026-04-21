/**
 * Tests the REAL getGreeting() implementation (no mocking).
 * The existing greeting.test.ts only tests a mocked version — this file
 * verifies the actual time-of-day logic and output format.
 */
import { describe, it, expect } from "roadtest";
import { getGreeting } from "./greeting";

describe("getGreeting() — real implementation", () => {
  it("always returns a string", () => {
    const result = getGreeting("Alice");
    expect(typeof result).toBe("string");
  });

  it("always includes the provided name", () => {
    expect(getGreeting("Alice")).toContain("Alice");
    expect(getGreeting("Bob")).toContain("Bob");
  });

  it("always starts with 'Good '", () => {
    const result = getGreeting("Team");
    expect(result.startsWith("Good ")).toBe(true);
  });

  it("ends with an exclamation mark", () => {
    const result = getGreeting("Team");
    expect(result.endsWith("!")).toBe(true);
  });

  it("contains one of the three time-of-day words", () => {
    const result = getGreeting("Team");
    const hasTimeOfDay =
      result.includes("morning") || result.includes("afternoon") || result.includes("evening");
    expect(hasTimeOfDay).toBe(true);
  });

  it("uses 'morning' between midnight and 11:59", () => {
    // Stub Date to a morning hour (8 AM)
    const OriginalDate = globalThis.Date;
    class MockDate extends OriginalDate {
      getHours() {
        return 8;
      }
    }
    globalThis.Date = MockDate as unknown as typeof Date;
    try {
      expect(getGreeting("Team")).toBe("Good morning, Team!");
    } finally {
      globalThis.Date = OriginalDate;
    }
  });

  it("uses 'afternoon' between noon and 17:59", () => {
    const OriginalDate = globalThis.Date;
    class MockDate extends OriginalDate {
      getHours() {
        return 14;
      }
    }
    globalThis.Date = MockDate as unknown as typeof Date;
    try {
      expect(getGreeting("Team")).toBe("Good afternoon, Team!");
    } finally {
      globalThis.Date = OriginalDate;
    }
  });

  it("uses 'evening' from 18:00 onwards", () => {
    const OriginalDate = globalThis.Date;
    class MockDate extends OriginalDate {
      getHours() {
        return 20;
      }
    }
    globalThis.Date = MockDate as unknown as typeof Date;
    try {
      expect(getGreeting("Team")).toBe("Good evening, Team!");
    } finally {
      globalThis.Date = OriginalDate;
    }
  });

  it("uses 'morning' at the boundary hour 0 (midnight)", () => {
    const OriginalDate = globalThis.Date;
    class MockDate extends OriginalDate {
      getHours() {
        return 0;
      }
    }
    globalThis.Date = MockDate as unknown as typeof Date;
    try {
      expect(getGreeting("Night Owl")).toBe("Good morning, Night Owl!");
    } finally {
      globalThis.Date = OriginalDate;
    }
  });

  it("uses 'afternoon' at the boundary hour 12 (noon)", () => {
    const OriginalDate = globalThis.Date;
    class MockDate extends OriginalDate {
      getHours() {
        return 12;
      }
    }
    globalThis.Date = MockDate as unknown as typeof Date;
    try {
      expect(getGreeting("Team")).toBe("Good afternoon, Team!");
    } finally {
      globalThis.Date = OriginalDate;
    }
  });

  it("uses 'evening' at the boundary hour 18", () => {
    const OriginalDate = globalThis.Date;
    class MockDate extends OriginalDate {
      getHours() {
        return 18;
      }
    }
    globalThis.Date = MockDate as unknown as typeof Date;
    try {
      expect(getGreeting("Team")).toBe("Good evening, Team!");
    } finally {
      globalThis.Date = OriginalDate;
    }
  });
});
