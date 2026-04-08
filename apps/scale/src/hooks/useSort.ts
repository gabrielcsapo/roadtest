import { useState, useCallback } from "react";
import type { SortOptions } from "../types";

export interface UseSortReturn {
  sort: SortOptions;
  setSort: (field: string, direction?: "asc" | "desc") => void;
  toggleSort: (field: string) => void;
  resetSort: () => void;
  isSortedBy: (field: string) => boolean;
  getSortDirection: (field: string) => "asc" | "desc" | null;
}

export function useSort(
  initialField = "",
  initialDirection: "asc" | "desc" = "asc",
): UseSortReturn {
  const [sort, setSortState] = useState<SortOptions>({
    field: initialField,
    direction: initialDirection,
  });

  const setSort = useCallback((field: string, direction?: "asc" | "desc") => {
    setSortState({ field, direction: direction ?? "asc" });
  }, []);

  const toggleSort = useCallback((field: string) => {
    setSortState((prev) => {
      if (prev.field === field) {
        return { field, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { field, direction: "asc" };
    });
  }, []);

  const resetSort = useCallback(() => {
    setSortState({ field: initialField, direction: initialDirection });
  }, [initialField, initialDirection]);

  const isSortedBy = useCallback((field: string) => sort.field === field, [sort.field]);

  const getSortDirection = useCallback(
    (field: string): "asc" | "desc" | null => {
      if (sort.field !== field) return null;
      return sort.direction;
    },
    [sort],
  );

  return { sort, setSort, toggleSort, resetSort, isSortedBy, getSortDirection };
}
