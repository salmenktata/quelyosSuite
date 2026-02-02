'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SiteConfig, fetchSiteConfig, getSiteConfig } from './site';

interface SiteConfigContextType {
  config: SiteConfig;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

interface SiteConfigProviderProps {
  children: ReactNode;
  initialConfig?: SiteConfig;
}

/**
 * Provider component that fetches and provides site configuration
 * to all child components via React Context.
 */
export function SiteConfigProvider({ children, initialConfig }: SiteConfigProviderProps) {
  const [config, setConfig] = useState<SiteConfig>(initialConfig || getSiteConfig());
  const [isLoading, setIsLoading] = useState(!initialConfig);
  const [error, setError] = useState<Error | null>(null);

  const fetchConfig = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const newConfig = await fetchSiteConfig();
      setConfig(newConfig);
    } catch (_err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch config'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if no initial config was provided
    if (!initialConfig) {
      fetchConfig();
    }
  }, [initialConfig]);

  const value: SiteConfigContextType = {
    config,
    isLoading,
    error,
    refetch: fetchConfig,
  };

  return (
    <SiteConfigContext.Provider value={value}>
      {children}
    </SiteConfigContext.Provider>
  );
}

/**
 * Hook to access site configuration in components
 */
export function useSiteConfig(): SiteConfigContextType {
  const context = useContext(SiteConfigContext);
  if (context === undefined) {
    // Return default config if used outside provider
    return {
      config: getSiteConfig(),
      isLoading: false,
      error: null,
      refetch: async () => {},
    };
  }
  return context;
}

/**
 * Hook to access just the config values (convenience wrapper)
 */
export function useConfig(): SiteConfig {
  const { config } = useSiteConfig();
  return config;
}
