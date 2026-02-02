import { useState, useEffect, useCallback } from 'react';

export interface SiteConfig {
  // Features
  compare_enabled: boolean;
  wishlist_enabled: boolean;
  reviews_enabled: boolean;
  newsletter_enabled: boolean;
  // Contact
  whatsapp_number: string;
  contact_email: string;
  contact_phone: string;
  // Shipping
  shipping_standard_days: string;
  shipping_express_days: string;
  free_shipping_threshold: number;
  // Returns
  return_delay_days: number;
  refund_delay_days: string;
  warranty_years: number;
  // Payment
  payment_methods: string[];
  // Customer Service
  customer_service_hours: string;
  customer_service_days: string;
  // Stats (optionnel)
  total_review_count?: number;
}

interface SiteConfigResponse {
  success?: boolean;
  data?: Partial<SiteConfig>;
}

// Configuration par défaut (utilisée pendant SSR ou en cas d'erreur)
const defaultConfig: SiteConfig = {
  compare_enabled: true,
  wishlist_enabled: true,
  reviews_enabled: true,
  newsletter_enabled: true,
  whatsapp_number: '21600000000',
  contact_email: 'contact@quelyos.com',
  contact_phone: '+21600000000',
  shipping_standard_days: '2-5',
  shipping_express_days: '1-2',
  free_shipping_threshold: 150,
  return_delay_days: 30,
  refund_delay_days: '7-10',
  warranty_years: 2,
  payment_methods: ['Carte bancaire', 'Espèces', 'Virement', 'Mobile money'],
  customer_service_hours: '9h à 18h',
  customer_service_days: 'lundi au vendredi',
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

  // L'API retourne { success: true, data: { ...config } }
  const configData = json.data || {};

  // Fusionner avec les valeurs par défaut pour garantir tous les champs
  const mergedConfig: SiteConfig = {
    ...defaultConfig,
    ...configData,
  };

  // Mettre en cache
  cachedConfig = mergedConfig;
  cacheTimestamp = now;

  return mergedConfig;
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
    } catch (_err) {
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
