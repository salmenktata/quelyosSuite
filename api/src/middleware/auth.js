const jwt = require("jsonwebtoken");
const { constantTimeDelay } = require("../utils/timingProtection");

const authMiddleware = async function(req, res, next) {
  const startTime = Date.now();
  // Try to get token from Authorization header first (backward compatibility)
  const header = req.headers.authorization;
  let token;

  if (header && header.startsWith("Bearer ")) {
    token = header.split(" ")[1];
  } else if (req.signedCookies && req.signedCookies.quelyos_access_token) {
    // Primary method: New standardized cookie name with signature (most secure)
    token = req.signedCookies.quelyos_access_token;
  } else if (req.signedCookies && req.signedCookies.accessToken) {
    // Fallback: Old cookie name with signature (migration period)
    token = req.signedCookies.accessToken;
  } else if (req.cookies && req.cookies.quelyos_access_token) {
    // Fallback: New cookie name without signature (migration period)
    token = req.cookies.quelyos_access_token;
  } else if (req.cookies && req.cookies.accessToken) {
    // Fallback: Old unsigned cookie (migration period)
    token = req.cookies.accessToken;
  }

  if (!token) {
    await constantTimeDelay(50, 100, startTime);
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      companyId: decoded.companyId,
      role: decoded.role || "USER",
      exp: decoded.exp
    };

    // Small random delay to prevent timing attacks
    await constantTimeDelay(10, 30, startTime);
    next();
  } catch (err) {
    // Add delay even on error to prevent timing correlation
    await constantTimeDelay(50, 100, startTime);
    return res.status(401).json({ error: "Authentication required" });
  }
};

// Export as default and as named export for compatibility
module.exports = authMiddleware;
module.exports.requireAuth = authMiddleware;
