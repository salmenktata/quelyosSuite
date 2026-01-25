/**
 * Token Rotation Utility
 *
 * Implements secure refresh token rotation to prevent token theft and replay attacks.
 *
 * Security Features:
 * - Automatic rotation: Each refresh generates a new token and revokes the old one
 * - Reuse detection: If a revoked token is used, entire token family is revoked
 * - Token families: Track token chains to detect compromised tokens
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

/**
 * Generate a cryptographically secure random token
 * @returns {string} - Random 64-character hex string
 */
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Rotate a refresh token
 *
 * Creates a new token, marks the old one as used, and links them for audit trail.
 *
 * @param {string} oldToken - The token being rotated
 * @param {number} userId - User ID
 * @param {string} ipAddress - Client IP address
 * @param {string} userAgent - Client user agent
 * @returns {Promise<{newRefreshToken: string, accessToken: string}>} - New tokens
 */
async function rotateRefreshToken(oldToken, userId, ipAddress = null, userAgent = null) {
  const JWT_SECRET = process.env.JWT_SECRET;
  const REFRESH_TOKEN_EXPIRY_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS || '7');
  const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';

  try {
    // 1. Find the old token in database
    const oldTokenRecord = await prisma.refreshToken.findUnique({
      where: { token: oldToken },
      include: { user: true }
    });

    if (!oldTokenRecord) {
      throw new Error('INVALID_TOKEN');
    }

    // 2. Check if token has expired
    if (new Date() > oldTokenRecord.expiresAt) {
      throw new Error('TOKEN_EXPIRED');
    }

    // 3. Check if token was already used (CRITICAL: Potential token theft)
    if (oldTokenRecord.isUsed || oldTokenRecord.revokedAt) {
      // Token reuse detected! Revoke entire token family for this user
      await revokeUserTokenFamily(userId);
      throw new Error('TOKEN_REUSE_DETECTED');
    }

    // 4. Verify user ID matches
    if (oldTokenRecord.userId !== userId) {
      throw new Error('USER_MISMATCH');
    }

    // 5. Generate new tokens
    const newRefreshToken = generateSecureToken();
    const newAccessToken = jwt.sign(
      {
        userId: oldTokenRecord.user.id,
        role: oldTokenRecord.user.role,
        companyId: oldTokenRecord.user.companyId
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // 6. Create new refresh token in database
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: oldTokenRecord.user.id,
        expiresAt: expiryDate,
        ipAddress,
        userAgent,
        isUsed: false,
      }
    });

    // 7. Mark old token as used and link to new token
    await prisma.refreshToken.update({
      where: { id: oldTokenRecord.id },
      data: {
        isUsed: true,
        replacedBy: newRefreshToken,
        revokedAt: new Date()
      }
    });

    return {
      newRefreshToken,
      accessToken: newAccessToken,
      user: {
        id: oldTokenRecord.user.id,
        email: oldTokenRecord.user.email,
        role: oldTokenRecord.user.role,
        companyId: oldTokenRecord.user.companyId
      }
    };

  } catch (error) {
    if (error.message === 'TOKEN_REUSE_DETECTED') {
      console.error(`[SECURITY] Token reuse detected for user ${userId} - revoking all tokens`);
    }
    throw error;
  }
}

/**
 * Detect and handle token reuse
 *
 * If a token that has already been used is presented again, this indicates
 * potential token theft. We revoke all tokens for the user as a security measure.
 *
 * @param {string} token - Token to check
 * @returns {Promise<{isReused: boolean, userId?: number}>}
 */
async function detectTokenReuse(token) {
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token }
  });

  if (!tokenRecord) {
    return { isReused: false };
  }

  if (tokenRecord.isUsed || tokenRecord.revokedAt) {
    // This token was already used - potential theft!
    return {
      isReused: true,
      userId: tokenRecord.userId
    };
  }

  return { isReused: false };
}

/**
 * Revoke an entire token family for a user
 *
 * Used when token reuse is detected to invalidate all tokens for the user,
 * forcing re-authentication.
 *
 * @param {number} userId - User ID
 * @returns {Promise<number>} - Number of tokens revoked
 */
async function revokeUserTokenFamily(userId) {
  const now = new Date();

  const result = await prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null
    },
    data: {
      revokedAt: now,
      isUsed: true
    }
  });

  console.log(`[SECURITY] Revoked ${result.count} tokens for user ${userId} due to token reuse`);

  return result.count;
}

/**
 * Clean up expired and used tokens
 *
 * Should be run periodically (e.g., daily cron job) to remove old tokens.
 *
 * @param {number} daysToKeep - Number of days to keep revoked/used tokens for audit
 * @returns {Promise<number>} - Number of tokens deleted
 */
async function cleanupOldTokens(daysToKeep = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        {
          AND: [
            { revokedAt: { not: null } },
            { revokedAt: { lt: cutoffDate } }
          ]
        }
      ]
    }
  });

  console.log(`[CLEANUP] Deleted ${result.count} old refresh tokens`);

  return result.count;
}

/**
 * Revoke a specific token
 *
 * @param {string} token - Token to revoke
 * @returns {Promise<boolean>} - True if revoked, false if not found
 */
async function revokeToken(token) {
  try {
    await prisma.refreshToken.update({
      where: { token },
      data: {
        revokedAt: new Date(),
        isUsed: true
      }
    });
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  rotateRefreshToken,
  detectTokenReuse,
  revokeUserTokenFamily,
  cleanupOldTokens,
  revokeToken,
  generateSecureToken
};
