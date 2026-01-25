/**
 * Cookie Options Utility
 *
 * Provides standardized cookie configuration with security best practices
 */

/**
 * Get cookie domain from environment
 * Defaults to undefined (current domain) for development
 * Should be set to `.quelyos.com` in production for subdomain sharing
 */
function getCookieDomain() {
  const domain = process.env.COOKIE_DOMAIN;
  if (!domain) return undefined;

  // Validate domain format
  if (domain && !domain.startsWith('.')) {
    console.warn(`COOKIE_DOMAIN should start with '.' for subdomain sharing: ${domain}`);
  }

  return domain || undefined;
}

/**
 * Get standard cookie options for access tokens
 *
 * @returns {object} Cookie options
 */
function getAccessTokenCookieOptions() {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
    signed: true,
    domain: getCookieDomain()
  };

  // Only set sameSite in production - omit in dev to allow cross-port cookies on localhost
  if (process.env.NODE_ENV === 'production') {
    options.sameSite = 'strict';
  }

  return options;
}

/**
 * Get standard cookie options for refresh tokens
 *
 * @param {number} expiryDays - Days until expiry (default 7)
 * @returns {object} Cookie options
 */
function getRefreshTokenCookieOptions(expiryDays = 7) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: expiryDays * 24 * 60 * 60 * 1000,
    path: '/',
    signed: true,
    domain: getCookieDomain()
  };

  // Only set sameSite in production - omit in dev to allow cross-port cookies on localhost
  if (process.env.NODE_ENV === 'production') {
    options.sameSite = 'strict';
  }

  return options;
}

/**
 * Get standard cookie options for CSRF tokens
 * Note: NOT httpOnly - must be readable by JavaScript
 *
 * @returns {object} Cookie options
 */
function getCSRFCookieOptions() {
  const options = {
    httpOnly: false, // MUST be false - client needs to read this
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
    domain: getCookieDomain()
  };

  // Only set sameSite in production - omit in dev to allow cross-port cookies on localhost
  if (process.env.NODE_ENV === 'production') {
    options.sameSite = 'strict';
  }

  return options;
}

/**
 * Get options for clearing cookies
 *
 * @returns {object} Cookie clear options
 */
function getClearCookieOptions() {
  return {
    path: '/',
    signed: true,
    domain: getCookieDomain()
  };
}

module.exports = {
  getCookieDomain,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  getCSRFCookieOptions,
  getClearCookieOptions
};
