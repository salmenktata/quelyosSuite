/**
 * CSRF Protection Middleware
 *
 * Implements the Double Submit Cookie pattern for CSRF protection.
 *
 * How it works:
 * 1. Server sets a random CSRF token in a cookie (NOT httpOnly, so JS can read it)
 * 2. Client reads the cookie and sends the token in a custom header (X-CSRF-Token)
 * 3. Server validates that cookie value matches header value
 * 4. CSRF attacks fail because attacker can't read cookies from other domains (same-origin policy)
 *
 * Why this works:
 * - Attacker can't read the cookie value (cross-origin restriction)
 * - Attacker can't set custom headers in CSRF attacks (XMLHttpRequest/fetch only)
 * - Form-based CSRF attacks can't send custom headers
 */

const crypto = require('crypto');

// Exempt routes from CSRF protection
const CSRF_EXEMPT_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot',
  '/auth/reset',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/oauth',
  '/health',
  '/api-docs',
  '/metrics',
  // Add other public endpoints here
];

// Exempt HTTP methods (safe methods don't need CSRF protection)
const CSRF_EXEMPT_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Generate a cryptographically secure CSRF token
 */
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Check if a path is exempt from CSRF protection
 */
function isExemptPath(path) {
  return CSRF_EXEMPT_PATHS.some(exemptPath => {
    if (exemptPath.endsWith('*')) {
      // Wildcard match
      return path.startsWith(exemptPath.slice(0, -1));
    }
    return path.startsWith(exemptPath);
  });
}

/**
 * CSRF Middleware
 */
function csrfProtection(req, res, next) {
  // Skip CSRF for safe methods
  if (CSRF_EXEMPT_METHODS.includes(req.method)) {
    // Still set CSRF cookie for future requests
    ensureCSRFCookie(req, res);
    return next();
  }

  // Skip CSRF for exempt paths
  if (isExemptPath(req.path)) {
    ensureCSRFCookie(req, res);
    return next();
  }

  // Get CSRF token from cookie
  const cookieToken = req.cookies['quelyos_csrf_token'];

  // Get CSRF token from header
  const headerToken = req.get('X-CSRF-Token') || req.get('x-csrf-token');

  // Validate tokens
  if (!cookieToken) {
    console.warn('[CSRF] Missing CSRF cookie', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    return res.status(403).json({
      error: 'CSRF token missing. Please refresh the page and try again.'
    });
  }

  if (!headerToken) {
    console.warn('[CSRF] Missing CSRF header', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    return res.status(403).json({
      error: 'CSRF token missing in request. Please include X-CSRF-Token header.'
    });
  }

  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
    console.warn('[CSRF] Token mismatch', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    return res.status(403).json({
      error: 'CSRF token validation failed. Please refresh the page and try again.'
    });
  }

  // CSRF validation passed
  next();
}

/**
 * Ensure CSRF cookie exists
 *
 * Sets a CSRF cookie if one doesn't exist or is expired
 */
function ensureCSRFCookie(req, res) {
  // Check if valid CSRF cookie already exists
  if (req.cookies['quelyos_csrf_token']) {
    return;
  }

  // Generate new CSRF token
  const csrfToken = generateCSRFToken();

  // Import cookie options utility
  const { getCSRFCookieOptions } = require('../utils/cookieOptions');

  // Set cookie (NOT httpOnly - must be readable by JavaScript)
  res.cookie('quelyos_csrf_token', csrfToken, getCSRFCookieOptions());
}

/**
 * Middleware to explicitly set CSRF cookie
 *
 * Use this on GET endpoints that render pages needing CSRF tokens
 */
function setCSRFCookie(req, res, next) {
  ensureCSRFCookie(req, res);
  next();
}

/**
 * Get CSRF token from request (for including in responses)
 */
function getCSRFToken(req) {
  return req.cookies['quelyos_csrf_token'];
}

module.exports = {
  csrfProtection,
  setCSRFCookie,
  getCSRFToken,
  generateCSRFToken
};
