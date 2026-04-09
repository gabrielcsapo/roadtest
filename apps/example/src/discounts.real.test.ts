/**
 * Tests the REAL discount implementations (no mocking).
 * The existing discounts.test.ts only tests mocked versions — this file
 * covers the actual business logic and its boundary conditions.
 */
import { describe, it, expect } from "@fieldtest/core";
import { noDiscount, bulkDiscount, memberDiscount } from "./discounts";

describe("noDiscount()", () => {
  it("returns price × qty", () => {
    expect(noDiscount(10, 3)).toBe(30);
  });

  it("returns the unit price when qty is 1", () => {
    expect(noDiscount(49, 1)).toBe(49);
  });

  it("returns 0 when qty is 0", () => {
    expect(noDiscount(10, 0)).toBe(0);
  });

  it("returns 0 when price is 0", () => {
    expect(noDiscount(0, 5)).toBe(0);
  });

  it("handles fractional prices", () => {
    expect(noDiscount(9.99, 2)).toBe(19.98);
  });
});

describe("bulkDiscount()", () => {
  it("applies no discount when qty is below 3 (qty=1)", () => {
    expect(bulkDiscount(10, 1)).toBe(10);
  });

  it("applies no discount when qty is below 3 (qty=2)", () => {
    expect(bulkDiscount(10, 2)).toBe(20);
  });

  it("applies 10% discount at the boundary (qty=3)", () => {
    expect(bulkDiscount(10, 3)).toBe(27);
  });

  it("applies 10% discount above the boundary (qty=4)", () => {
    expect(bulkDiscount(10, 4)).toBe(36);
  });

  it("bulk price is always less than full price for qty >= 3", () => {
    const full = noDiscount(25, 5);
    const discounted = bulkDiscount(25, 5);
    expect(discounted).toBeLessThan(full);
  });

  it("returns 0 when qty is 0", () => {
    expect(bulkDiscount(10, 0)).toBe(0);
  });

  it("returns 0 when price is 0", () => {
    expect(bulkDiscount(0, 5)).toBe(0);
  });
});

describe("memberDiscount()", () => {
  it("applies flat 15% off regardless of qty", () => {
    expect(memberDiscount(100, 1)).toBe(85);
  });

  it("15% off applies to the line total, not unit price", () => {
    expect(memberDiscount(100, 2)).toBe(170);
  });

  it("member price is always less than full price", () => {
    const full = noDiscount(50, 3);
    const discounted = memberDiscount(50, 3);
    expect(discounted).toBeLessThan(full);
  });

  it("member discount is always less than bulk discount for qty < 3", () => {
    // bulk applies no discount below qty 3, so member should always be less
    const bulk = bulkDiscount(100, 2);
    const member = memberDiscount(100, 2);
    expect(member).toBeLessThan(bulk);
  });

  it("returns 0 when qty is 0", () => {
    expect(memberDiscount(10, 0)).toBe(0);
  });

  it("returns 0 when price is 0", () => {
    expect(memberDiscount(0, 3)).toBe(0);
  });
});
