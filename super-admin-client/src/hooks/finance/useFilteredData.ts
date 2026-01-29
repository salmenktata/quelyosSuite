import { useMemo } from "react";

export type SortDirection = "asc" | "desc";

export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

export interface FilterConfig<T> {
  searchQuery?: string;
  searchFields?: (keyof T)[];
  filters?: Partial<Record<keyof T, any>>;
}

interface UseFilteredDataOptions<T> {
  data: T[];
  filterConfig: FilterConfig<T>;
  sortConfig?: SortConfig<T> | null;
}

/**
 * Generic hook for filtering and sorting data
 *
 * @example
 * const { filteredData, sortedData } = useFilteredData({
 *   data: accounts,
 *   filterConfig: {
 *     searchQuery,
 *     searchFields: ['name', 'institution'],
 *     filters: {
 *       type: typeFilter,
 *       status: statusFilter,
 *     }
 *   },
 *   sortConfig: { key: 'name', direction: 'asc' }
 * });
 */
export function useFilteredData<T extends Record<string, any>>({
  data,
  filterConfig,
  sortConfig,
}: UseFilteredDataOptions<T>) {
  // Step 1: Filter by search query
  const searchFiltered = useMemo(() => {
    if (!filterConfig.searchQuery || !filterConfig.searchFields) {
      return data;
    }

    const query = filterConfig.searchQuery.toLowerCase();
    return data.filter((item) =>
      filterConfig.searchFields!.some((field) => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(query);
      })
    );
  }, [data, filterConfig.searchQuery, filterConfig.searchFields]);

  // Step 2: Apply additional filters
  const filtered = useMemo(() => {
    if (!filterConfig.filters) {
      return searchFiltered;
    }

    return searchFiltered.filter((item) => {
      return Object.entries(filterConfig.filters!).every(([key, value]) => {
        // Skip if filter value is empty/null/undefined
        if (value === null || value === undefined || value === "") {
          return true;
        }
        return item[key] === value;
      });
    });
  }, [searchFiltered, filterConfig.filters]);

  // Step 3: Sort
  const sorted = useMemo(() => {
    if (!sortConfig) {
      return filtered;
    }

    return [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle null/undefined
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Compare based on type
      let comparison = 0;
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [filtered, sortConfig]);

  return {
    /** Data after filtering only */
    filteredData: filtered,
    /** Data after filtering and sorting */
    sortedData: sorted,
    /** Number of items after filtering */
    count: filtered.length,
  };
}
