/**
 * URLs des services externes utilisés par Quelyos Suite
 *
 * Centralise toutes les URLs de services tiers (APIs, CDN, etc.)
 */

/**
 * Configuration Stripe
 */
export const STRIPE = {
  /** URL dashboard Stripe */
  dashboard: 'https://dashboard.stripe.com',

  /** URL API Stripe */
  api: 'https://api.stripe.com',

  /** URL checkout Stripe */
  checkout: 'https://checkout.stripe.com',
} as const;

/**
 * Configuration services d'images
 */
export const IMAGES = {
  /** Unsplash API */
  unsplash: {
    api: 'https://api.unsplash.com',
    source: 'https://source.unsplash.com',
  },

  /** Pexels API */
  pexels: {
    api: 'https://api.pexels.com',
  },

  /** Placeholder services */
  placeholder: {
    picsum: 'https://picsum.photos',
    placehold: 'https://placehold.co',
  },
} as const;

/**
 * Configuration Google Services
 */
export const GOOGLE = {
  /** Google Fonts CDN */
  fonts: 'https://fonts.googleapis.com',
  fontsStatic: 'https://fonts.gstatic.com',

  /** Google Analytics */
  analytics: 'https://www.google-analytics.com',

  /** Google Maps */
  maps: {
    api: 'https://maps.googleapis.com',
    embed: 'https://www.google.com/maps/embed',
  },
} as const;

/**
 * Configuration CDN externes
 */
export const CDN = {
  /** Cloudflare CDN */
  cloudflare: 'https://cdnjs.cloudflare.com',

  /** jsDelivr CDN */
  jsdelivr: 'https://cdn.jsdelivr.net',

  /** unpkg CDN */
  unpkg: 'https://unpkg.com',
} as const;

/**
 * Configuration services de communication
 */
export const COMMUNICATION = {
  /** Mailgun API */
  mailgun: 'https://api.mailgun.net',

  /** SendGrid API */
  sendgrid: 'https://api.sendgrid.com',

  /** Twilio API */
  twilio: 'https://api.twilio.com',
} as const;

/**
 * Configuration réseaux sociaux
 */
export const SOCIAL = {
  /** Facebook */
  facebook: {
    api: 'https://graph.facebook.com',
    oauth: 'https://www.facebook.com/v18.0/dialog/oauth',
  },

  /** Instagram */
  instagram: {
    api: 'https://graph.instagram.com',
  },

  /** LinkedIn */
  linkedin: {
    api: 'https://api.linkedin.com',
    oauth: 'https://www.linkedin.com/oauth/v2/authorization',
  },

  /** Twitter/X */
  twitter: {
    api: 'https://api.twitter.com',
  },
} as const;

/**
 * Vérifie si une URL pointe vers un service externe connu
 *
 * @param url - URL à vérifier
 * @returns true si l'URL est un service externe référencé
 */
export function isExternalService(url: string): boolean {
  const allExternalUrls = [
    ...Object.values(STRIPE),
    IMAGES.unsplash.api,
    IMAGES.unsplash.source,
    IMAGES.pexels.api,
    IMAGES.placeholder.picsum,
    IMAGES.placeholder.placehold,
    GOOGLE.fonts,
    GOOGLE.fontsStatic,
    GOOGLE.analytics,
    GOOGLE.maps.api,
    GOOGLE.maps.embed,
    ...Object.values(CDN),
    ...Object.values(COMMUNICATION),
    SOCIAL.facebook.api,
    SOCIAL.facebook.oauth,
    SOCIAL.instagram.api,
    SOCIAL.linkedin.api,
    SOCIAL.linkedin.oauth,
    SOCIAL.twitter.api,
  ];

  return allExternalUrls.some((externalUrl) => url.startsWith(externalUrl));
}

/**
 * Récupère le nom du service externe depuis l'URL
 *
 * @param url - URL du service externe
 * @returns Nom du service ou null si non trouvé
 */
export function getExternalServiceName(url: string): string | null {
  if (url.includes('stripe.com')) return 'Stripe';
  if (url.includes('unsplash.com')) return 'Unsplash';
  if (url.includes('pexels.com')) return 'Pexels';
  if (url.includes('picsum.photos')) return 'Lorem Picsum';
  if (url.includes('placehold.co')) return 'Placehold';
  if (url.includes('googleapis.com') || url.includes('gstatic.com')) return 'Google';
  if (url.includes('cloudflare.com')) return 'Cloudflare CDN';
  if (url.includes('jsdelivr.net')) return 'jsDelivr CDN';
  if (url.includes('unpkg.com')) return 'unpkg CDN';
  if (url.includes('mailgun.net')) return 'Mailgun';
  if (url.includes('sendgrid.com')) return 'SendGrid';
  if (url.includes('twilio.com')) return 'Twilio';
  if (url.includes('facebook.com')) return 'Facebook';
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('linkedin.com')) return 'LinkedIn';
  if (url.includes('twitter.com')) return 'Twitter/X';

  return null;
}
