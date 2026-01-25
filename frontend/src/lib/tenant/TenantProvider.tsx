'use client';

/**
 * TenantProvider - Contexte React pour la gestion multi-tenant.
 *
 * Ce provider charge la configuration du tenant depuis l'API Odoo
 * et la rend disponible dans toute l'application via le hook useTenant().
 *
 * Fonctionnalités:
 * - Détection automatique du tenant via cookie (set par le middleware)
 * - Cache desactive pour refleter les themes rapidement
 * - Fallback gracieux si pas de tenant (utilise le thème par défaut)
 * - Support SSR avec initialTenant prop
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { TenantConfig, TenantLookupResponse } from '@/types/tenant';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface TenantContextType {
  /** Configuration du tenant actuel (null si pas de tenant) */
  tenant: TenantConfig | null;
  /** Code du tenant (pour debug/logs) */
  tenantCode: string | null;
  /** Indique si le chargement est en cours */
  isLoading: boolean;
  /** Erreur éventuelle lors du chargement */
  error: Error | null;
  /** Force le rechargement de la config */
  refetch: () => Promise<void>;
}

interface TenantProviderProps {
  children: ReactNode;
  /** Config initiale pour SSR (optionnel) */
  initialTenant?: TenantConfig | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const CACHE_DURATION = 0; // Pas de cache pour refleter les themes en temps reel
const COOKIE_NAME = 'tenant_code';

// ═══════════════════════════════════════════════════════════════════════════
// CACHE
// ═══════════════════════════════════════════════════════════════════════════

let cachedTenant: TenantConfig | null = null;
let cachedTenantCode: string | null = null;
let cacheTimestamp = 0;

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Lit le code du tenant depuis le cookie
 */
function getTenantCodeFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`));
  return match ? match[2] : null;
}

/**
 * Récupère la config du tenant depuis l'API
 */
async function fetchTenantConfig(
  tenantCode: string
): Promise<TenantConfig | null> {
  const now = Date.now();

  // Vérifier le cache
  if (
    cachedTenant &&
    cachedTenantCode === tenantCode &&
    now - cacheTimestamp < CACHE_DURATION
  ) {
    return cachedTenant;
  }

  try {
    const response = await fetch(`/api/tenant/${tenantCode}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      logger.warn(`Tenant API returned ${response.status}`);
      return null;
    }

    const data: TenantLookupResponse = await response.json();

    if (data.success && data.tenant) {
      // Mettre en cache
      cachedTenant = data.tenant;
      cachedTenantCode = tenantCode;
      cacheTimestamp = now;
      return data.tenant;
    }

    return null;
  } catch (error) {
    logger.error('Failed to fetch tenant config:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

export function TenantProvider({
  children,
  initialTenant = null,
}: TenantProviderProps) {
  const [tenant, setTenant] = useState<TenantConfig | null>(initialTenant);
  const [tenantCode, setTenantCode] = useState<string | null>(
    initialTenant?.code || null
  );
  const [isLoading, setIsLoading] = useState(!initialTenant);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Charge la config du tenant
   */
  const loadTenant = useCallback(async () => {
    const code = getTenantCodeFromCookie();

    if (!code) {
      // Pas de tenant détecté, utiliser le thème par défaut
      setTenant(null);
      setTenantCode(null);
      setIsLoading(false);
      return;
    }

    setTenantCode(code);
    setIsLoading(true);
    setError(null);

    try {
      const config = await fetchTenantConfig(code);
      setTenant(config);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load tenant');
      setError(error);
      logger.error('Tenant loading error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Force le rechargement
   */
  const refetch = useCallback(async () => {
    // Invalider le cache
    cachedTenant = null;
    cachedTenantCode = null;
    cacheTimestamp = 0;

    await loadTenant();
  }, [loadTenant]);

  // Charger le tenant au montage (si pas de config initiale)
  useEffect(() => {
    if (!initialTenant) {
      loadTenant();
    }
  }, [initialTenant, loadTenant]);

  // Valeur du contexte
  const value: TenantContextType = {
    tenant,
    tenantCode,
    isLoading,
    error,
    refetch,
  };

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook pour accéder au contexte tenant
 */
export function useTenant(): TenantContextType {
  const context = useContext(TenantContext);

  if (context === undefined) {
    // Utilisé en dehors du provider, retourner des valeurs par défaut
    return {
      tenant: null,
      tenantCode: null,
      isLoading: false,
      error: null,
      refetch: async () => {},
    };
  }

  return context;
}

/**
 * Hook pour accéder uniquement à la config du tenant
 */
export function useTenantConfig(): TenantConfig | null {
  const { tenant } = useTenant();
  return tenant;
}

/**
 * Hook pour accéder au thème du tenant
 */
export function useTenantTheme() {
  const { tenant } = useTenant();
  return tenant?.theme || null;
}

/**
 * Hook pour accéder au branding du tenant
 */
export function useTenantBranding() {
  const { tenant } = useTenant();
  return tenant?.branding || null;
}
