/**
 * Branding Configuration
 * Centralized configuration for store branding.
 * Values can be overridden via environment variables.
 */

export const branding = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'Ma Boutique',
  slogan: process.env.NEXT_PUBLIC_BRAND_SLOGAN || 'Boutique en ligne',
  email: process.env.NEXT_PUBLIC_BRAND_EMAIL || 'contact@example.com',
  phone: process.env.NEXT_PUBLIC_BRAND_PHONE || '+33 X XX XX XX XX',
  description: process.env.NEXT_PUBLIC_BRAND_DESCRIPTION || 'Votre boutique en ligne de confiance.',

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
} as const;

export type Branding = typeof branding;
