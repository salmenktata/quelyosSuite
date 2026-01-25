import { useState, useEffect, useCallback } from 'react';

export interface SiteConfig {
  compare_enabled: boolean;
  wishlist_enabled: boolean;
  reviews_enabled: boolean;
  newsletter_enabled: boolean;
}

interface SiteConfigResponse {
  success: boolean;
  data: SiteConfig;
}

// Configuration par défaut (utilisée pendant SSR ou en cas d'erreur)
const defaultConfig: SiteConfig = {
  compare_enabled: true,
  wishlist_enabled: true,
  reviews_enabled: true,
  newsletter_enabled: true,
};

// Cache global pour éviter les requêtes multiples
let cachedConfig: SiteConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchSiteConfigFromAPI(): Promise<SiteConfig> {
  // Vérifier le cache
  const now = Date.now();
  if (cachedConfig && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedConfig;
  }

  const response = await fetch('/api/ecommerce/site-config', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const json: SiteConfigResponse = await response.json();

  if (!json.success) {
    throw new Error('Failed to fetch site configuration');
  }

  // Mettre en cache
  cachedConfig = json.data;
  cacheTimestamp = now;

  return json.data;
}

// Type de retour compatible avec useQuery
interface UseSiteConfigResult {
  data: SiteConfig | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useSiteConfig(): UseSiteConfigResult {
  const [data, setData] = useState<SiteConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const config = await fetchSiteConfigFromAPI();
      setData(config);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      // Garder les valeurs par défaut en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Ne fetch que côté client
    if (typeof window !== 'undefined') {
      fetchConfig();
    }
  }, [fetchConfig]);

  return {
    data,
    isLoading,
    isError,
    error,
    refetch: fetchConfig,
  };
}
