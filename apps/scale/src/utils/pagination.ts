import type { PaginatedResponse } from "../types";

export function paginate<T>(arr: T[], page: number, size: number): PaginatedResponse<T> {
  const total = arr.length;
  const totalPages = getTotalPages(total, size);
  const safePage = clampPage(page, total, size);
  const { start, end } = getPageSlice(total, safePage, size);
  return {
    items: arr.slice(start, end),
    total,
    page: safePage,
    pageSize: size,
    totalPages,
  };
}

export function getTotalPages(total: number, size: number): number {
  if (size <= 0) return 0;
  return Math.ceil(total / size);
}

export function getPageSlice(
  total: number,
  page: number,
  size: number,
): { start: number; end: number } {
  const start = (page - 1) * size;
  const end = Math.min(start + size, total);
  return { start: Math.max(0, start), end: Math.max(0, end) };
}

export function isValidPage(page: number, total: number, size: number): boolean {
  if (page < 1) return false;
  const totalPages = getTotalPages(total, size);
  if (totalPages === 0) return page === 1;
  return page <= totalPages;
}

export function clampPage(page: number, total: number, size: number): number {
  const totalPages = getTotalPages(total, size);
  if (totalPages === 0) return 1;
  return Math.max(1, Math.min(page, totalPages));
}

export function getPageNumbers(current: number, total: number, delta = 2): (number | "...")[] {
  if (total <= 0) return [];
  const range: (number | "...")[] = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  range.push(1);
  if (left > 2) range.push("...");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push("...");
  if (total > 1) range.push(total);

  return range;
}
