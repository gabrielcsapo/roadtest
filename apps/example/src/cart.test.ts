/**
 * Tests for calculateTotal() using the real discount functions.
 * The existing discounts.test.ts mocks the discount strategies — this file
 * exercises the real implementations and covers edge cases in the cart itself.
 */
import { describe, it, expect } from "roadtest";
import { calculateTotal } from "./cart";
import { noDiscount, bulkDiscount, memberDiscount } from "./discounts";
import type { CartItem } from "./discounts";

const SINGLE_ITEM: CartItem[] = [{ name: "Widget", price: 10, qty: 1 }];
const MULTI_ITEM: CartItem[] = [
  { name: "Pro Seat", price: 49, qty: 1 },
  { name: "Storage Add-on", price: 12, qty: 3 },
  { name: "SSO Module", price: 99, qty: 1 },
];

describe("calculateTotal() — edge cases", () => {
  it("returns 0 for an empty cart", () => {
    expect(calculateTotal([], noDiscount)).toBe(0);
  });

  it("returns the correct total for a single item with no discount", () => {
    expect(calculateTotal(SINGLE_ITEM, noDiscount)).toBe(10);
  });

  it("returns 0 when all items have zero price", () => {
    const items: CartItem[] = [
      { name: "Free", price: 0, qty: 5 },
      { name: "Also Free", price: 0, qty: 2 },
    ];
    expect(calculateTotal(items, noDiscount)).toBe(0);
  });

  it("returns 0 when all items have zero qty", () => {
    const items: CartItem[] = [
      { name: "Widget", price: 99, qty: 0 },
      { name: "Gadget", price: 49, qty: 0 },
    ];
    expect(calculateTotal(items, noDiscount)).toBe(0);
  });

  it("rounds result to 2 decimal places", () => {
    // memberDiscount(10, 3) = 10 * 3 * 0.85 = 25.5 — already clean
    // Use a price that produces a repeating decimal: $1 × 3 at 15% off = 2.55
    const items: CartItem[] = [{ name: "Item", price: 1, qty: 3 }];
    const result = calculateTotal(items, memberDiscount);
    expect(result).toBe(2.55);
    // Verify it's truly rounded, not a floating-point string like "2.5500000000000003"
    expect(String(result).split(".")[1]?.length ?? 0).toBeLessThan(3);
  });
});

describe("calculateTotal() — with real discounts", () => {
  it("noDiscount: sums all line totals", () => {
    // 49 + 36 + 99 = 184
    expect(calculateTotal(MULTI_ITEM, noDiscount)).toBe(184);
  });

  it("bulkDiscount: applies 10% only to items with qty >= 3", () => {
    // Pro Seat:       49 × 1        = 49     (no discount, qty < 3)
    // Storage Add-on: 12 × 3 × 0.9  = 32.4   (discounted, qty = 3)
    // SSO Module:     99 × 1        = 99     (no discount, qty < 3)
    expect(calculateTotal(MULTI_ITEM, bulkDiscount)).toBe(180.4);
  });

  it("memberDiscount: applies 15% off to every line item", () => {
    // Pro Seat:       49 × 1 × 0.85 = 41.65
    // Storage Add-on: 12 × 3 × 0.85 = 30.6
    // SSO Module:     99 × 1 × 0.85 = 84.15
    expect(calculateTotal(MULTI_ITEM, memberDiscount)).toBe(156.4);
  });

  it("memberDiscount total is always less than noDiscount total", () => {
    const full = calculateTotal(MULTI_ITEM, noDiscount);
    const discounted = calculateTotal(MULTI_ITEM, memberDiscount);
    expect(discounted).toBeLessThan(full);
  });

  it("does not mutate the items array", () => {
    const items: CartItem[] = [{ name: "Widget", price: 10, qty: 2 }];
    const originalPrice = items[0].price;
    calculateTotal(items, memberDiscount);
    expect(items[0].price).toBe(originalPrice);
  });
});
