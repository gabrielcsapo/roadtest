import type { Risk, Status } from "../types";
import { riskToScore } from "./risk";
import { getStatusWeight } from "./status";

export function sortByField<T extends Record<string, unknown>>(
  arr: T[],
  field: keyof T,
  dir: "asc" | "desc" = "asc",
): T[] {
  return [...arr].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    if (aVal === undefined && bVal === undefined) return 0;
    if (aVal === undefined) return 1;
    if (bVal === undefined) return -1;
    let cmp = 0;
    if (typeof aVal === "string" && typeof bVal === "string") {
      cmp = aVal.localeCompare(bVal);
    } else if (typeof aVal === "number" && typeof bVal === "number") {
      cmp = aVal - bVal;
    } else {
      cmp = String(aVal).localeCompare(String(bVal));
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

export interface SortSpec<T> {
  field: keyof T;
  dir: "asc" | "desc";
}

export function sortByMultiple<T extends Record<string, unknown>>(
  arr: T[],
  sorts: SortSpec<T>[],
): T[] {
  return [...arr].sort((a, b) => {
    for (const sort of sorts) {
      const aVal = a[sort.field];
      const bVal = b[sort.field];
      let cmp = 0;
      if (aVal === undefined && bVal === undefined) cmp = 0;
      else if (aVal === undefined) cmp = 1;
      else if (bVal === undefined) cmp = -1;
      else if (typeof aVal === "string" && typeof bVal === "string") {
        cmp = aVal.localeCompare(bVal);
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }
      if (sort.dir === "desc") cmp = -cmp;
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
}

export function sortByRisk<T extends { riskLevel: Risk }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => riskToScore(a.riskLevel) - riskToScore(b.riskLevel));
}

export function sortByStatus<T extends { status: Status }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => getStatusWeight(a.status) - getStatusWeight(b.status));
}

export function sortByDate<T extends Record<string, unknown>>(
  arr: T[],
  field: keyof T,
  dir: "asc" | "desc" = "asc",
): T[] {
  return [...arr].sort((a, b) => {
    const aDate = new Date(a[field] as string).getTime();
    const bDate = new Date(b[field] as string).getTime();
    return dir === "asc" ? aDate - bDate : bDate - aDate;
  });
}

export function naturalSort<T extends Record<string, unknown>>(arr: T[], key: keyof T): T[] {
  return [...arr].sort((a, b) =>
    String(a[key]).localeCompare(String(b[key]), undefined, { numeric: true, sensitivity: "base" }),
  );
}
