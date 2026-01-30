'use client';

/**
 * AppProviders - Composant client qui connecte tous les providers.
 *
 * Ordre des providers (de l&apos;extérieur vers l&apos;intérieur):
 * 1. TenantProvider - Détecte et charge la config du tenant
 * 2. SiteConfigProvider - Charge la config du site (legacy, sera fusionné avec tenant)
 * 3. ThemeProvider - Applique le thème (tenant > site config > default)
 *
 * Ce composant est nécessaire car les providers utilisent des hooks
 * et doivent être dans un composant client.
 */

import React, { ReactNode, useEffect } from 'react';
import { TenantProvider, useTenant } from '@/lib/tenant';
import { SiteConfigProvider, useSiteConfig } from '@/lib/config/SiteConfigProvider';
import { ThemeProvider } from '@/lib/theme';
import { FaviconApplier } from './ThemeApplier';
import { useAuthStore } from '@/store/authStore';
import { usePurchasedStore } from '@/store/purchasedStore';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Charge les produits déjà achetés quand l&apos;utilisateur est connecté.
 */
function PurchasedProductsLoader() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { fetchPurchasedProducts, clear } = usePurchasedStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchPurchasedProducts();
    } else {
      clear();
    }
  }, [isAuthenticated, fetchPurchasedProducts, clear]);

  return null;
}

/**
 * Composant interne qui connecte le tenant au ThemeProvider.
 * Doit être enfant de TenantProvider et SiteConfigProvider.
 */
function ThemeWrapper({ children }: { children: ReactNode }) {
  const { tenant } = useTenant();
  const { config } = useSiteConfig();

  return (
    <ThemeProvider
      tenantTheme={tenant?.theme}
      configColors={{
        primaryColor: config.assets?.primaryColor,
        secondaryColor: config.assets?.secondaryColor,
      }}
    >
      {children}
    </ThemeProvider>
  );
}

/**
 * Provider principal de l'application.
 * Encapsule tous les providers dans le bon ordre.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <TenantProvider>
      <FaviconApplier />
      <PurchasedProductsLoader />
      <SiteConfigProvider>
        <ThemeWrapper>{children}</ThemeWrapper>
      </SiteConfigProvider>
    </TenantProvider>
  );
}
