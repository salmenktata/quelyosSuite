const rateLimit = require('express-rate-limit');

function envInt(key, fallback) {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function buildLimiter({ windowSeconds, max, standardHeaders = true }) {
  // En développement (mais pas en test), on est plus permissif
  const isDev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
  
  return rateLimit({
    windowMs: windowSeconds * 1000,
    limit: isDev ? max * 10 : max, // x10 en dev uniquement
    standardHeaders,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting pour health check
      return req.path === '/health';
    }
  });
}

const loginLimiter = buildLimiter({
  windowSeconds: envInt('RATE_LIMIT_LOGIN_WINDOW', 15 * 60),
  max: envInt('RATE_LIMIT_LOGIN', 5)
});

const resetLimiter = buildLimiter({
  windowSeconds: envInt('RATE_LIMIT_RESET_WINDOW', 60 * 60),
  max: envInt('RATE_LIMIT_RESET', 3)
});

const resetShortLimiter = buildLimiter({
  windowSeconds: envInt('RATE_LIMIT_RESET_SHORT_WINDOW', 15 * 60),
  max: envInt('RATE_LIMIT_RESET_SHORT', 5)
});

const authedLimiter = buildLimiter({
  windowSeconds: envInt('RATE_LIMIT_AUTHED_WINDOW', 5 * 60),
  max: envInt('RATE_LIMIT_AUTHED', 300)
});

// Week 4 - Additional rate limiters for enhanced security

const invitationLimiter = buildLimiter({
  windowSeconds: envInt('RATE_LIMIT_INVITATION_WINDOW', 60 * 60), // 1 hour
  max: envInt('RATE_LIMIT_INVITATION', 10) // 10 invitations per hour
});

const superAdminLimiter = buildLimiter({
  windowSeconds: envInt('RATE_LIMIT_SUPERADMIN_WINDOW', 5 * 60), // 5 minutes
  max: envInt('RATE_LIMIT_SUPERADMIN', 50) // 50 operations per 5 minutes
});

const verificationLimiter = buildLimiter({
  windowSeconds: envInt('RATE_LIMIT_VERIFICATION_WINDOW', 60 * 60), // 1 hour
  max: envInt('RATE_LIMIT_VERIFICATION', 3) // 3 verification emails per hour
});

const importLimiter = buildLimiter({
  windowSeconds: envInt('RATE_LIMIT_IMPORT_WINDOW', 15 * 60), // 15 minutes
  max: envInt('RATE_LIMIT_IMPORT', 10) // 10 imports per 15 minutes
});

module.exports = {
  loginLimiter,
  resetLimiter,
  resetShortLimiter,
  authedLimiter,
  invitationLimiter,
  superAdminLimiter,
  verificationLimiter,
  importLimiter
};
