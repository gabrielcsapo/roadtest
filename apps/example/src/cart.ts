import type { CartItem } from "./discounts";

export type { CartItem };

/** Sum a cart, applying the given discount strategy to each line */
export function calculateTotal(
  items: CartItem[],
  discount: (price: number, qty: number) => number,
): number {
  return (
    Math.round(items.reduce((sum, item) => sum + discount(item.price, item.qty), 0) * 100) / 100
  );
}
