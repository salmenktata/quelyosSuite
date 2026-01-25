const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Configuration
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "7d"; // 7 jours
const REFRESH_TOKEN_EXPIRY_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS || "30", 10); // 30 jours

/**
 * Générer un access token JWT
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY
  });
}

/**
 * Générer un refresh token opaque et le stocker en DB
 */
async function generateRefreshToken(userId, ipAddress, userAgent) {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null
    }
  });

  return token;
}

/**
 * Vérifier et consommer un refresh token
 */
async function verifyRefreshToken(token) {
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: { include: { company: true } } }
  });

  if (!refreshToken) {
    throw new Error("Invalid refresh token");
  }

  // Vérifier expiration
  if (new Date() > refreshToken.expiresAt) {
    // Supprimer le token expiré
    await prisma.refreshToken.delete({ where: { id: refreshToken.id } });
    throw new Error("Refresh token expired");
  }

  return refreshToken;
}

/**
 * Révoquer un refresh token
 */
async function revokeRefreshToken(token) {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

/**
 * Révoquer tous les refresh tokens d'un utilisateur
 */
async function revokeAllUserTokens(userId) {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

/**
 * Nettoyer les tokens expirés (à appeler périodiquement via cron)
 */
async function cleanExpiredTokens() {
  const deleted = await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });
  return deleted.count;
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  cleanExpiredTokens,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY_DAYS
};
