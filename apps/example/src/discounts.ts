export interface CartItem {
  name: string;
  price: number;
  qty: number;
}

/** No discount — pay full price */
export function noDiscount(price: number, qty: number): number {
  console.log("hi", price, qty);
  return price * qty;
}

/** 10% off when buying 3 or more of the same item */
export function bulkDiscount(price: number, qty: number): number {
  return qty >= 3 ? price * qty * 0.9 : price * qty;
}

/** Flat 15% off for members */
export function memberDiscount(price: number, qty: number): number {
  return price * qty * 0.85;
}
