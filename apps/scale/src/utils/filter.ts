import type { Risk, Status } from "../types";

export function filterByStatus<T extends { status: Status }>(arr: T[], statuses: Status[]): T[] {
  if (statuses.length === 0) return arr;
  return arr.filter((item) => statuses.includes(item.status));
}

export function filterByRisk<T extends { riskLevel: Risk }>(arr: T[], risks: Risk[]): T[] {
  if (risks.length === 0) return arr;
  return arr.filter((item) => risks.includes(item.riskLevel));
}

export function filterByDateRange<T extends Record<string, unknown>>(
  arr: T[],
  field: keyof T,
  from: string | null,
  to: string | null,
): T[] {
  return arr.filter((item) => {
    const date = new Date(item[field] as string).getTime();
    if (from && date < new Date(from).getTime()) return false;
    if (to && date > new Date(to).getTime()) return false;
    return true;
  });
}

export function filterBySearch<T extends Record<string, unknown>>(
  arr: T[],
  fields: (keyof T)[],
  query: string,
): T[] {
  if (!query.trim()) return arr;
  const lowerQuery = query.toLowerCase();
  return arr.filter((item) =>
    fields.some((field) => {
      const val = item[field];
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(lowerQuery);
    }),
  );
}

export interface FilterSet<T> {
  status?: Status[];
  risk?: Risk[];
  search?: { fields: (keyof T)[]; query: string };
  dateRange?: { field: keyof T; from: string | null; to: string | null };
  custom?: (item: T) => boolean;
}

export function applyFilters<T extends Record<string, unknown>>(
  arr: T[],
  filters: FilterSet<T>,
): T[] {
  let result = arr;
  if (filters.status && filters.status.length > 0) {
    result = filterByStatus(result as (T & { status: Status })[], filters.status) as T[];
  }
  if (filters.risk && filters.risk.length > 0) {
    result = filterByRisk(result as (T & { riskLevel: Risk })[], filters.risk) as T[];
  }
  if (filters.search && filters.search.query.trim()) {
    result = filterBySearch(result, filters.search.fields, filters.search.query);
  }
  if (filters.dateRange) {
    const { field, from, to } = filters.dateRange;
    result = filterByDateRange(result, field, from, to);
  }
  if (filters.custom) {
    result = result.filter(filters.custom);
  }
  return result;
}

export function countByStatus<T extends { status: string }>(arr: T[]): Record<string, number> {
  return arr.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});
}
