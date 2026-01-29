import { useQuery } from "@tanstack/react-query";
import { reportingClient } from "@/lib/finance/reporting";
import { AuthenticationError } from "@/lib/finance/api";
import { isAuthenticated } from "@/lib/session";
import type { DashboardOverviewResponse, ReportingFilters } from "@/lib/finance/reporting";

interface UseDashboardDataOptions extends ReportingFilters {
  days?: number;
  // Enable auto-refetch every 5 minutes (default: false for better performance)
  enableAutoRefetch?: boolean;
  // Refetch interval in milliseconds (default: 300000 = 5 minutes)
  refetchInterval?: number;
}

/**
 * Hook to fetch dashboard overview data with React Query
 *
 * Features:
 * - Batched API call (single request for all dashboard data)
 * - Auto-refresh every 60 seconds (configurable)
 * - Caching with stale-while-revalidate
 * - Refetch on window focus
 * - Optimistic updates support
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useDashboardData({ days: 30 });
 * ```
 */
export function useDashboardData(options: UseDashboardDataOptions = {}) {
  const {
    days = 30,
    enableAutoRefetch = false, // Disabled by default for better performance
    refetchInterval = 300000, // 5 minutes instead of 1 minute
    ...filters
  } = options;

  return useQuery<DashboardOverviewResponse, Error>({
    // Query key includes all filter parameters for proper cache invalidation
    queryKey: ["dashboard", "overview", { days, ...filters }],

    // Fetch function
    queryFn: () => reportingClient.dashboardOverview({ days, ...filters }),

    // Only run query if user is authenticated
    enabled: isAuthenticated(),

    // Auto-refetch every 5 minutes (or custom interval) - disabled by default
    refetchInterval: enableAutoRefetch ? refetchInterval : false,

    // Don't refetch on window focus (uses global queryClient config)
    refetchOnWindowFocus: false,

    // Don't refetch on mount (uses cached data)
    refetchOnMount: false,

    // Keep previous data while fetching new data (smooth transitions)
    placeholderData: (previousData) => previousData,

    // Data is considered stale after 5 minutes (will trigger background refetch)
    staleTime: 5 * 60 * 1000,

    // Cache data for 10 minutes after last use
    gcTime: 10 * 60 * 1000,

    // Retry configuration - don't retry on auth errors
    retry: (failureCount, error) => {
      if (error instanceof AuthenticationError) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to get dashboard data without auto-refetch
 * Useful for static displays or when you want manual control over refetch
 */
export function useDashboardDataStatic(options: UseDashboardDataOptions = {}) {
  return useDashboardData({ ...options, enableAutoRefetch: false });
}
