const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

// ═══════════════════════════════════════════════════════════════════════════
// CHANGE PASSWORD
// ═══════════════════════════════════════════════════════════════════════════

router.post("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Mot de passe actuel et nouveau requis" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, password: true }
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Mot de passe actuel incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { password: hashedPassword }
    });

    // Invalidate all other refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId: req.user.userId }
    });

    logger.info(`Password changed for user ${req.user.userId}`);
    res.json({ message: "Mot de passe modifié avec succès" });
  } catch (err) {
    logger.error("Change password error:", err);
    res.status(500).json({ error: "Erreur lors du changement de mot de passe" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 2FA SETUP
// ═══════════════════════════════════════════════════════════════════════════

router.get("/security/status", auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { twoFAEnabled: true }
    });

    res.json({ twoFAEnabled: user?.twoFAEnabled || false });
  } catch (err) {
    logger.error("Security status error:", err);
    res.status(500).json({ error: "Erreur lors de la récupération du statut" });
  }
});

router.post("/2fa/setup", auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { email: true, twoFAEnabled: true }
    });

    if (user?.twoFAEnabled) {
      return res.status(400).json({ error: "2FA déjà activée" });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Quelyos (${user.email})`,
      length: 20
    });

    // Store temporary secret
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { twoFASecret: secret.base32 }
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCode
    });
  } catch (err) {
    logger.error("2FA setup error:", err);
    res.status(500).json({ error: "Erreur lors de la configuration 2FA" });
  }
});

router.post("/2fa/verify", auth, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code requis" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { twoFASecret: true }
    });

    if (!user?.twoFASecret) {
      return res.status(400).json({ error: "Configuration 2FA non initiée" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: "base32",
      token: code,
      window: 1
    });

    if (!verified) {
      return res.status(401).json({ error: "Code invalide" });
    }

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { twoFAEnabled: true }
    });

    logger.info(`2FA enabled for user ${req.user.userId}`);
    res.json({ message: "2FA activée avec succès" });
  } catch (err) {
    logger.error("2FA verify error:", err);
    res.status(500).json({ error: "Erreur lors de la vérification" });
  }
});

router.post("/2fa/disable", auth, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { 
        twoFAEnabled: false,
        twoFASecret: null
      }
    });

    logger.info(`2FA disabled for user ${req.user.userId}`);
    res.json({ message: "2FA désactivée" });
  } catch (err) {
    logger.error("2FA disable error:", err);
    res.status(500).json({ error: "Erreur lors de la désactivation" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SESSIONS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

router.get("/sessions", auth, async (req, res) => {
  try {
    const sessions = await prisma.refreshToken.findMany({
      where: { userId: req.user.userId },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        token: true
      },
      orderBy: { createdAt: "desc" }
    });

    // Mark current session
    const currentToken = req.headers.authorization?.replace("Bearer ", "");
    const sessionsWithCurrent = sessions.map(s => ({
      ...s,
      token: undefined, // Don't expose token
      isCurrent: s.token === currentToken
    }));

    res.json(sessionsWithCurrent);
  } catch (err) {
    logger.error("Sessions fetch error:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des sessions" });
  }
});

router.delete("/sessions/:id", auth, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);

    const session = await prisma.refreshToken.findFirst({
      where: { 
        id: sessionId,
        userId: req.user.userId
      }
    });

    if (!session) {
      return res.status(404).json({ error: "Session non trouvée" });
    }

    await prisma.refreshToken.delete({ where: { id: sessionId } });

    logger.info(`Session ${sessionId} revoked for user ${req.user.userId}`);
    res.json({ message: "Session révoquée" });
  } catch (err) {
    logger.error("Session revoke error:", err);
    res.status(500).json({ error: "Erreur lors de la révocation" });
  }
});

module.exports = router;
