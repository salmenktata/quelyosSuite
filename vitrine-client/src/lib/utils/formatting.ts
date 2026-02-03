import { getBackendUrl } from '@quelyos/config';
/**
 * Utilitaires de formatage
 */

/**
 * Formate un prix avec symbole de devise
 */
export function formatPrice(price: number, currencySymbol = '€'): string {
  return `${price.toFixed(2)} ${currencySymbol}`;
}

/**
 * Formate une date en français
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Formate une date et heure
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Tronque un texte
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Génère une URL d'image backend
 */
export function getBackendImageUrl(path: string): string {
  const backendUrl = getBackendUrl(process.env.NODE_ENV as any);
  return `${backendUrl}${path}`;
}

/**
 * Formate un numéro de téléphone
 */
export function formatPhone(phone: string): string {
  // Format français: +33 6 12 34 56 78
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})$/);

  if (match) {
    return `+${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]} ${match[6]}`;
  }

  return phone;
}

/**
 * Génère une classe CSS conditionnelle
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
