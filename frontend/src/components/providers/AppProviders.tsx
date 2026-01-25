'use client';

/**
 * AppProviders - Composant client qui connecte tous les providers.
 *
 * Ordre des providers (de l'extérieur vers l'intérieur):
 * 1. TenantProvider - Détecte et charge la config du tenant
 * 2. SiteConfigProvider - Charge la config du site (legacy, sera fusionné avec tenant)
 * 3. ThemeProvider - Applique le thème (tenant > site config > default)
 *
 * Ce composant est nécessaire car les providers utilisent des hooks
 * et doivent être dans un composant client.
 */

import React, { ReactNode } from 'react';
import { TenantProvider, useTenant } from '@/lib/tenant';
import { SiteConfigProvider, useSiteConfig } from '@/lib/config/SiteConfigProvider';
import { ThemeProvider } from '@/lib/theme';
import { FaviconApplier } from './ThemeApplier';

interface AppProvidersProps {
  children: ReactNode;
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
      <SiteConfigProvider>
        <ThemeWrapper>{children}</ThemeWrapper>
      </SiteConfigProvider>
    </TenantProvider>
  );
}
