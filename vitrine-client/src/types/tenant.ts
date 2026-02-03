/**
 * Types pour le système multi-tenant.
 * Correspond au modèle backend quelyos.tenant.
 */

/**
 * Couleurs du thème (13 CSS Variables)
 */
export interface TenantColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  ring: string;
}

/**
 * Configuration de typographie
 */
export interface TenantTypography {
  fontFamily: 'inter' | 'roboto' | 'poppins' | 'montserrat' | 'open-sans' | 'lato';
}

/**
 * Configuration du mode sombre
 */
export interface TenantDarkMode {
  enabled: boolean;
  defaultDark: boolean;
}

/**
 * Thème complet du tenant
 */
export interface TenantTheme {
  colors: TenantColors;
  typography: TenantTypography;
  darkMode: TenantDarkMode;
}

/**
 * Branding du tenant (logo, slogan, etc.)
 */
export interface TenantBranding {
  logoUrl: string;
  faviconUrl: string;
  slogan: string;
  description: string;
}

/**
 * Informations de contact
 */
export interface TenantContact {
  email: string;
  phone: string;
  phoneFormatted: string;
  whatsapp: string;
}

/**
 * Liens réseaux sociaux
 */
export interface TenantSocial {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
  tiktok?: string;
}

/**
 * Métadonnées SEO
 */
export interface TenantSEO {
  title: string;
  description: string;
}

/**
 * Feature flags du tenant
 */
export interface TenantFeatures {
  wishlist: boolean;
  comparison: boolean;
  reviews: boolean;
  newsletter: boolean;
  guestCheckout: boolean;
}

/**
 * Configuration complète d'un tenant
 * Retournée par l'API /api/ecommerce/tenant/*
 */
export interface TenantConfig {
  id: number;
  code: string;
  name: string;
  domain: string;
  domains: string[];

  branding: TenantBranding;
  theme: TenantTheme;
  contact: TenantContact;
  social: TenantSocial;
  seo: TenantSEO;
  features: TenantFeatures;
}

/**
 * Réponse API pour lookup par domaine
 */
export interface TenantLookupResponse {
  success: boolean;
  tenant?: TenantConfig;
  error?: string;
  error_code?: string;
}

/**
 * Réponse API pour liste des tenants
 */
export interface TenantListResponse {
  success: boolean;
  tenants: TenantConfig[];
  total: number;
  error?: string;
}

/**
 * Données pour création/mise à jour d'un tenant
 */
export interface TenantFormData {
  name: string;
  code: string;
  domain: string;
  domains?: string[];
  slogan?: string;
  description?: string;

  // Couleurs
  primary_color?: string;
  primary_dark?: string;
  primary_light?: string;
  secondary_color?: string;
  secondary_dark?: string;
  secondary_light?: string;
  accent_color?: string;
  background_color?: string;
  foreground_color?: string;
  muted_color?: string;
  muted_foreground?: string;
  border_color?: string;
  ring_color?: string;

  // Typographie
  font_family?: TenantTypography['fontFamily'];

  // Contact
  email?: string;
  phone?: string;
  whatsapp?: string;

  // Social
  social?: TenantSocial;

  // SEO
  meta_title?: string;
  meta_description?: string;

  // Options
  enable_dark_mode?: boolean;
  default_dark?: boolean;
  feature_wishlist?: boolean;
  feature_comparison?: boolean;
  feature_reviews?: boolean;
  feature_newsletter?: boolean;
  feature_guest_checkout?: boolean;

  // Assets (base64)
  logo?: string;
  logo_filename?: string;
  favicon?: string;
  favicon_filename?: string;

  // Status
  active?: boolean;
}

/**
 * Polices disponibles avec leurs URLs Google Fonts
 */
export const FONT_FAMILIES: Record<TenantTypography['fontFamily'], { label: string; url: string }> = {
  inter: {
    label: 'Inter',
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  },
  roboto: {
    label: 'Roboto',
    url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap',
  },
  poppins: {
    label: 'Poppins',
    url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap',
  },
  montserrat: {
    label: 'Montserrat',
    url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap',
  },
  'open-sans': {
    label: 'Open Sans',
    url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap',
  },
  lato: {
    label: 'Lato',
    url: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap',
  },
};

/**
 * Couleurs par défaut (thème Vert Émeraude)
 */
export const DEFAULT_TENANT_COLORS: TenantColors = {
  primary: '#10b981',
  primaryDark: '#059669',
  primaryLight: '#34d399',
  secondary: '#6ee7b7',
  secondaryDark: '#4ade80',
  secondaryLight: '#a7f3d0',
  accent: '#34d399',
  background: '#ffffff',
  foreground: '#171717',
  muted: '#f5f5f5',
  mutedForeground: '#737373',
  border: '#e5e5e5',
  ring: '#10b981',
};
