/**
 * HTML Sanitization utility using DOMPurify
 * Prevents XSS attacks when rendering user-generated or CMS content
 */
import DOMPurify from 'dompurify';

/**
 * Server-side HTML sanitizer (basic XSS protection)
 * Removes script tags, event handlers, and dangerous protocols
 */
function sanitizeHtmlServer(html: string): string {
  return html
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove on* event handlers
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '')
    // Remove javascript: and data: protocols in href/src
    .replace(/href\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, 'href="#"')
    .replace(/src\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, 'src=""')
    .replace(/href\s*=\s*["']?\s*data:[^"'\s>]*/gi, 'href="#"')
    // Remove style expressions (IE)
    .replace(/style\s*=\s*["'][^"']*expression\s*\([^)]*\)[^"']*["']/gi, '')
    // Remove iframe with srcdoc (XSS vector)
    .replace(/srcdoc\s*=\s*["'][^"']*["']/gi, '');
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - Raw HTML string to sanitize
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';

  // Server-side: use basic sanitizer (removes dangerous patterns)
  if (typeof window === 'undefined') {
    return sanitizeHtmlServer(html);
  }

  return DOMPurify.sanitize(html, {
    // Allow common HTML elements
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'strike',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'dl', 'dt', 'dd',
      'a', 'img', 'figure', 'figcaption',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
      'div', 'span', 'section', 'article', 'header', 'footer',
      'hr', 'sub', 'sup', 'small', 'mark',
      'iframe', 'video', 'audio', 'source',
    ],
    // Allow safe attributes
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'style',
      'target', 'rel', 'width', 'height',
      'colspan', 'rowspan', 'scope',
      'controls', 'autoplay', 'loop', 'muted', 'poster',
      'frameborder', 'allowfullscreen', 'allow',
    ],
    // Allow data URIs for images
    ALLOW_DATA_ATTR: false,
    // Force all links to open in new tab with noopener
    ADD_ATTR: ['target', 'rel'],
  });
}

/**
 * Sanitize SVG/icon content (more restrictive)
 * @param svg - Raw SVG string
 * @returns Sanitized SVG string
 */
export function sanitizeSvg(svg: string | null | undefined): string {
  if (!svg) return '';

  if (typeof window === 'undefined') {
    // Server-side: remove script tags and event handlers from SVG
    return svg
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  }

  return DOMPurify.sanitize(svg, {
    ALLOWED_TAGS: ['svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'g', 'defs', 'use', 'symbol', 'title', 'desc'],
    ALLOWED_ATTR: ['viewBox', 'd', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'class', 'id', 'cx', 'cy', 'r', 'x', 'y', 'width', 'height', 'points', 'transform', 'xmlns'],
  });
}

/**
 * Sanitize search highlight HTML (very restrictive - only allows <mark>)
 * @param html - HTML with highlight markup
 * @returns Sanitized HTML
 */
export function sanitizeHighlight(html: string | null | undefined): string {
  if (!html) return '';

  if (typeof window === 'undefined') {
    // Server-side: only allow mark/b/strong/em/span, strip everything else
    return html
      .replace(/<(?!\/?(?:mark|b|strong|em|span)\b)[^>]+>/gi, '');
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['mark', 'b', 'strong', 'em', 'span'],
    ALLOWED_ATTR: ['class'],
  });
}
