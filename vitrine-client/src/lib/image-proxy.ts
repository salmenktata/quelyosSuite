/**
 * Image Proxy Utilities
 * Encodes backend image URLs to anonymize infrastructure patterns
 */

/**
 * Encode URL to base64 for anonymization
 */
function encodeImageUrl(url: string): string {
  if (typeof window !== 'undefined') {
    return btoa(url);
  }
  return Buffer.from(url).toString('base64');
}

/**
 * Get proxied image URL with anonymized path
 * @param url - Original image URL (may contain backend patterns)
 * @returns Anonymized proxy URL
 */
export function getProxiedImageUrl(url: string | undefined): string {
  if (!url) return '';

  // Already proxied
  if (url.startsWith('/api/image')) return url;

  // Local assets (not from backend)
  if (url.startsWith('/') && !url.includes('/web/image')) return url;

  // External URLs (CDN, etc.)
  if (url.startsWith('http') && !url.includes('localhost:8069') && !url.includes('/web/image')) {
    return url;
  }

  // Backend image: encode URL to hide patterns like /web/image
  const isBackendImage = url.includes('/web/image') || url.includes('localhost:8069');

  if (isBackendImage) {
    // Use 'id' param with base64-encoded URL (anonymized)
    const encoded = encodeImageUrl(url);
    return `/api/image?id=${encodeURIComponent(encoded)}`;
  }

  return url;
}

/**
 * Get backend image URL (for server-side usage only)
 * @param path - Image path from backend
 * @returns Full backend URL
 */
export function getBackendImageUrl(path: string): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8069';

  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return `${backendUrl}${path}`;
  return `${backendUrl}/${path}`;
}
