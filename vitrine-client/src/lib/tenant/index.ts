/**
 * Module Tenant - Gestion multi-boutique/multi-marque
 *
 * Ce module fournit:
 * - TenantProvider: Contexte React pour la config tenant
 * - useTenant: Hook principal pour accéder au tenant
 * - useTenantTheme: Hook pour le thème du tenant
 * - useTenantBranding: Hook pour le branding du tenant
 * - useTenantConfig: Hook pour la config complète
 */

export {
  TenantProvider,
  useTenant,
  useTenantConfig,
  useTenantTheme,
  useTenantBranding,
} from './TenantProvider';

// Ré-export des types pour commodité
export type {
  TenantConfig,
  TenantTheme,
  TenantColors,
  TenantBranding,
  TenantContact,
  TenantSocial,
  TenantFeatures,
  TenantFormData,
} from '@/types/tenant';
