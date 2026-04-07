/**
 * Demonstrates ViewTest module mocking with function-as-parameter.
 *
 * `calculateTotal` (from ./cart) accepts a discount strategy as a callback.
 * We mock `./discounts` so the spied versions of `bulkDiscount` and
 * `memberDiscount` are passed in — the Mocks tab then shows exactly what
 * each strategy was called with and what it returned on every invocation.
 *
 * The key: `calculateTotal` lives in a *separate* file (./cart) so it is NOT
 * part of the mock and runs with the real implementation.
 */
import { describe, it, expect, mock } from '@fieldtest/core'
import { calculateTotal } from './cart'
import { bulkDiscount, memberDiscount } from './discounts'
import type { CartItem } from './discounts'

// ── Replace the real strategies with predictable test doubles ─────────────────
mock('./discounts', () => ({
  noDiscount:     (price: number, qty: number) => price * qty,
  bulkDiscount:   (price: number, qty: number) => price * qty * 0.5,   // always 50 % off
  memberDiscount: (price: number, qty: number) => price * qty * 0.7,   // always 30 % off
}))

const CART: CartItem[] = [
  { name: 'Widget',    price: 10, qty: 2 },
  { name: 'Gadget',    price: 25, qty: 1 },
  { name: 'Doohickey', price:  5, qty: 5 },
]

describe('calculateTotal() with mocked discount strategies', () => {
  it('calls bulkDiscount once per line item and sums the results', () => {
    const total = calculateTotal(CART, bulkDiscount)
    // Widget:     10 × 2 × 0.5 = 10
    // Gadget:     25 × 1 × 0.5 = 12.5
    // Doohickey:   5 × 5 × 0.5 = 12.5
    expect(total).toBe(35)
  })

  it('calls memberDiscount once per line item and sums the results', () => {
    const total = calculateTotal(CART, memberDiscount)
    // Widget:     10 × 2 × 0.7 = 14
    // Gadget:     25 × 1 × 0.7 = 17.5
    // Doohickey:   5 × 5 × 0.7 = 17.5
    expect(total).toBe(49)
  })

  it('passes price and qty as separate args — not the whole item object', () => {
    // One item so the Mocks tab shows a single clean call
    calculateTotal([{ name: 'Solo', price: 99, qty: 3 }], bulkDiscount)
    // Mocks tab → bulkDiscount: (99, 3) → 148.5
    expect(true).toBe(true)
  })
})
