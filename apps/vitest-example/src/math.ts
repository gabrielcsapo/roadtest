/** Clamp a number between min and max (inclusive). */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Sum an array of numbers. */
export function sum(nums: number[]): number {
  return nums.reduce((acc, n) => acc + n, 0);
}

/** Round a number to a given number of decimal places. */
export function round(value: number, places = 2): number {
  const factor = Math.pow(10, places);
  return Math.round(value * factor) / factor;
}

/** Return true if n is prime. */
export function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
}

/** Factorial of n (throws for negative inputs). */
export function factorial(n: number): number {
  if (n < 0) throw new RangeError("factorial is not defined for negative numbers");
  if (n === 0 || n === 1) return 1;
  return n * factorial(n - 1);
}
