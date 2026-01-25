/**
 * Branding Configuration
 * Uses centralized site configuration from Odoo API.
 * This file provides computed values and backward compatibility.
 */

import { getSiteConfig, SiteConfig } from './site';

/**
 * Get branding configuration based on current site config
 */
export function getBranding(config?: SiteConfig) {
  const cfg = config || getSiteConfig();

  return {
    name: cfg.brand.name,
    slogan: cfg.brand.slogan,
    email: cfg.brand.email,
    phone: cfg.brand.phone,
    phoneFormatted: cfg.brand.phoneFormatted,
    whatsapp: cfg.brand.whatsapp,
    description: cfg.brand.description,

    // Computed values
    get fullTitle() {
      return `${this.name} - ${this.slogan}`;
    },

    get copyright() {
      const year = new Date().getFullYear();
      return `© ${year} ${this.name}. Tous droits réservés.`;
    },

    // Logo initial (first letter of brand name)
    get initial() {
      return this.name.charAt(0).toUpperCase();
    },
  };
}

// Default branding instance for backward compatibility
export const branding = getBranding();

export type Branding = ReturnType<typeof getBranding>;
