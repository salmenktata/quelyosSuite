import { useState, useEffect, useCallback, useRef } from "react";

export interface UseApiDataOptions<T> {
  /**
   * Function that returns a promise with the data
   */
  fetcher: () => Promise<T>;

  /**
   * Cache key for this data (optional)
   * If provided, data will be cached and reused across components
   */
  cacheKey?: string;

  /**
   * Cache time in milliseconds (default: 5 minutes)
   */
  cacheTime?: number;

  /**
   * Whether to fetch data immediately on mount (default: true)
   */
  fetchOnMount?: boolean;

  /**
   * Dependencies that trigger a refetch when changed
   */
  deps?: unknown[];

  /**
   * Callback when fetch succeeds
   */
  onSuccess?: (data: T) => void;

  /**
   * Callback when fetch fails
   */
  onError?: (error: Error) => void;
}

export interface UseApiDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  mutate: (newData: T) => void;
  reset: () => void;
}

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();

/**
 * Generic hook for fetching and caching API data
 *
 * @example
 * const { data, loading, error, refetch } = useApiData({
 *   fetcher: () => api('/accounts'),
 *   cacheKey: 'accounts',
 *   cacheTime: 60000, // 1 minute
 *   onSuccess: (data) => console.log('Loaded', data),
 * });
 *
 * @example
 * // With dependencies that trigger refetch
 * const { data } = useApiData({
 *   fetcher: () => api(`/budgets?category=${categoryId}`),
 *   deps: [categoryId],
 * });
 */
export function useApiData<T>({
  fetcher,
  cacheKey,
  cacheTime = 5 * 60 * 1000, // 5 minutes default
  fetchOnMount = true,
  deps = [],
  onSuccess,
  onError,
}: UseApiDataOptions<T>): UseApiDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(fetchOnMount);
  const [error, setError] = useState<Error | null>(null);
  const fetchingRef = useRef(false);

  const fetchData = useCallback(async () => {
    // Prevent duplicate fetches
    if (fetchingRef.current) {
      return;
    }

    // Check cache first
    if (cacheKey) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        setData(cached.data as T);
        setLoading(false);
        setError(null);
        return;
      }
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);

      // Update cache
      if (cacheKey) {
        cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });
      }

      onSuccess?.(result);
    } catch (_err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [fetcher, cacheKey, cacheTime, onSuccess, onError]);

  // Fetch on mount if enabled
  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when dependencies change
  useEffect(() => {
    if (deps.length > 0 && !fetchOnMount) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const mutate = useCallback((newData: T) => {
    setData(newData);
    // Update cache if key exists
    if (cacheKey) {
      cache.set(cacheKey, {
        data: newData,
        timestamp: Date.now(),
      });
    }
  }, [cacheKey]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    if (cacheKey) {
      cache.delete(cacheKey);
    }
  }, [cacheKey]);

  return {
    data,
    loading,
    error,
    refetch,
    mutate,
    reset,
  };
}

/**
 * Clear all cached data
 */
export function clearApiCache() {
  cache.clear();
}

/**
 * Clear specific cache entry
 */
export function clearCacheKey(key: string) {
  cache.delete(key);
}
