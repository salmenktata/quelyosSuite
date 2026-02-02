/**
 * Site Configuration
 * Centralized configuration for all site-wide settings
 * Fetches from backend with fallback to defaults
 */

import { backendClient } from '@/lib/backend/client';
import { logger } from '@/lib/logger';

// Type definitions for site config
export interface SiteConfig {
  brand: {
    name: string;
    slogan: string;
    description: string;
    email: string;
    phone: string;
    phoneFormatted: string;
    whatsapp: string;
  };
  social: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
    linkedin: string;
    tiktok: string;
  };
  shipping: {
    freeThreshold: number;
    standardDaysMin: number;
    standardDaysMax: number;
    expressDaysMin: number;
    expressDaysMax: number;
  };
  returns: {
    windowDays: number;
    refundDaysMin: number;
    refundDaysMax: number;
    warrantyYears: number;
  };
  customerService: {
    hoursStart: number;
    hoursEnd: number;
    days: string;
  };
  loyalty: {
    pointsRatio: number;
    defaultDiscountPercent: number;
  };
  currency: {
    code: string;
    symbol: string;
  };
  seo: {
    siteUrl: string;
    title: string;
    description: string;
  };
  features?: {
    wishlist: boolean;
    comparison: boolean;
    reviews: boolean;
    guestCheckout: boolean;
  };
  assets?: {
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
  };
}

// Default configuration (fallback when API is unavailable)
const defaultConfig: SiteConfig = {
  brand: {
    name: 'Quelyos',
    slogan: 'Boutique en ligne',
    description: 'Votre boutique en ligne de confiance',
    email: 'contact@quelyos.com',
    phone: '+21600000000',
    phoneFormatted: '+216 00 000 000',
    whatsapp: '21600000000',
  },
  social: {
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    linkedin: '',
    tiktok: '',
  },
  shipping: {
    freeThreshold: 150,
    standardDaysMin: 2,
    standardDaysMax: 5,
    expressDaysMin: 1,
    expressDaysMax: 2,
  },
  returns: {
    windowDays: 30,
    refundDaysMin: 7,
    refundDaysMax: 10,
    warrantyYears: 2,
  },
  customerService: {
    hoursStart: 9,
    hoursEnd: 18,
    days: 'lundi au vendredi',
  },
  loyalty: {
    pointsRatio: 1,
    defaultDiscountPercent: 20,
  },
  currency: {
    code: 'TND',
    symbol: 'TND',
  },
  seo: {
    siteUrl: 'https://quelyos.com',
    title: 'Quelyos E-commerce',
    description: 'Boutique en ligne',
  },
  features: {
    wishlist: true,
    comparison: true,
    reviews: true,
    guestCheckout: false,
  },
  assets: {
    logoUrl: '',
    primaryColor: '#01613a',
    secondaryColor: '#c9c18f',
  },
};

// Cache for site configuration
let cachedConfig: SiteConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch site configuration from backend API
 * Uses caching to avoid excessive API calls
 */
export async function fetchSiteConfig(): Promise<SiteConfig> {
  // Return cached config if still valid
  const now = Date.now();
  if (cachedConfig && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedConfig;
  }

  try {
    const response = await backendClient.getSiteConfig();
    if (response.success && response.data) {
      cachedConfig = response.data as unknown as SiteConfig;
      cacheTimestamp = now;
      return cachedConfig;
    }
  } catch (_error) {
    logger.warn('Échec de récupération de la configuration, utilisation des valeurs par défaut:', error);
  }

  return defaultConfig;
}

/**
 * Get site configuration synchronously (uses cached or default)
 * Use this for initial render, then hydrate with fetchSiteConfig
 */
export function getSiteConfig(): SiteConfig {
  return cachedConfig || defaultConfig;
}

/**
 * Clear the configuration cache (useful after admin changes)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
  cacheTimestamp = 0;
}

// Export default config for backward compatibility
export const siteConfig = defaultConfig;

// Helper function to format phone number for display
export function formatPhone(phone: string): string {
  // Remove all non-digits except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Format for Tunisia (+216XXXXXXXX)
  if (cleaned.startsWith('+216') && cleaned.length === 12) {
    return `+216 ${cleaned.slice(4, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }

  return phone;
}

// Helper function to generate WhatsApp link
export function getWhatsAppLink(message?: string, config?: SiteConfig): string {
  const cfg = config || getSiteConfig();
  const baseUrl = `https://wa.me/${cfg.brand.whatsapp}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
}

// Helper function to format shipping text
export function getShippingText(config?: SiteConfig): string {
  const cfg = config || getSiteConfig();
  const { freeThreshold } = cfg.shipping;
  const { symbol } = cfg.currency;
  return `Livraison gratuite dès ${freeThreshold} ${symbol}`;
}

// Helper function to format delivery time
export function getDeliveryTimeText(express = false, config?: SiteConfig): string {
  const cfg = config || getSiteConfig();
  const { standardDaysMin, standardDaysMax, expressDaysMin, expressDaysMax } = cfg.shipping;
  if (express) {
    return `${expressDaysMin}-${expressDaysMax} jours ouvrables`;
  }
  return `${standardDaysMin}-${standardDaysMax} jours ouvrables`;
}

// Helper function to format customer service hours
export function getCustomerServiceHours(config?: SiteConfig): string {
  const cfg = config || getSiteConfig();
  const { hoursStart, hoursEnd, days } = cfg.customerService;
  return `du ${days} de ${hoursStart}h à ${hoursEnd}h`;
}

// Helper function to get return policy text
export function getReturnPolicyText(config?: SiteConfig): string {
  const cfg = config || getSiteConfig();
  return `${cfg.returns.windowDays} jours pour changer d'avis`;
}

// Helper function to get warranty text
export function getWarrantyText(config?: SiteConfig): string {
  const cfg = config || getSiteConfig();
  return `${cfg.returns.warrantyYears} ans`;
}

// Helper function to get refund time text
export function getRefundTimeText(config?: SiteConfig): string {
  const cfg = config || getSiteConfig();
  const { refundDaysMin, refundDaysMax } = cfg.returns;
  return `${refundDaysMin}-${refundDaysMax} jours`;
}

export default siteConfig;
