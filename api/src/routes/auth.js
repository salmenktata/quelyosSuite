const express = require("express");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logger = require("../../logger");
const { validate } = require("../middleware/validate");
const { registerSchema, loginSchema } = require("../schemas/validation");
const { loginLimiter, resetLimiter, resetShortLimiter, verificationLimiter, invitationLimiter } = require("../middleware/rateLimiters");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens
} = require("../utils/refreshToken");
const {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  getClearCookieOptions
} = require("../utils/cookieOptions");
const RESET_TOKEN_TTL_MIN = parseInt(process.env.RESET_TOKEN_TTL_MIN || "15", 10);

/**
 * @swagger
 * /auth/register-demo:
 *   post:
 *     summary: Register a demo user with pre-seeded data
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 default: demo
 *               companyName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Demo user registered successfully
 *       409:
 *         description: Email already in use
 */
// ------------------ REGISTER DEMO ------------------
router.post("/register-demo", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "demo";
    const companyName = (req.body.companyName || req.body.name || "Démo Société").trim();

    if (!email) {
      return res.status(400).json({ error: "Email requis" });
    }

    // Vérifier si user existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "Email déjà utilisé" });
    }

    // Vérifier si une société démo existe déjà
    let demoCompany = await prisma.company.findFirst({ where: { isDemo: true } });
    if (!demoCompany) {
      demoCompany = await prisma.company.create({ data: { name: companyName, isDemo: true } });
      // Seed démo complet
      const demoAccount = await prisma.account.create({ data: { name: "Compte Démo", companyId: demoCompany.id, balance: 1000 } });
      const demoCategory = await prisma.category.create({ data: { name: "Catégorie Démo", kind: "EXPENSE", companyId: demoCompany.id } });
      // Transactions fictives
      await prisma.transaction.createMany({
        data: [
          { amount: -50, type: "debit", accountId: demoAccount.id, categoryId: demoCategory.id, description: "Achat fournitures" },
          { amount: -120, type: "debit", accountId: demoAccount.id, categoryId: demoCategory.id, description: "Abonnement logiciel" },
          { amount: 500, type: "credit", accountId: demoAccount.id, description: "Vente client" }
        ]
      });
      // Budget fictif
      await prisma.budgets.create({ data: { name: "Budget Démo", companyId: demoCompany.id } });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Créer user démo
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        companyId: demoCompany.id,
        role: "USER",
        isDemo: true
      }
    });

    // Générer JWT avec flag isDemo
    const token = jwt.sign(
      { userId: user.id, companyId: demoCompany.id, role: user.role, isDemo: true },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Compte démo créé",
      companyId: demoCompany.id,
      userId: user.id,
      token,
      isDemo: true
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Création du compte démo échouée" });
  }
});

function buildResetLink(token) {
  const base = process.env.RESET_FRONT_URL;
  if (!base) return `TOKEN=${token}`;
  const url = new URL(base);
  url.searchParams.set("token", token);
  return url.toString();
}

async function sendResetEmail(email, token) {
  const link = buildResetLink(token);

  if (!process.env.SMTP_HOST) {
    logger.info("SMTP non configuré, reset link loggué", { email, link });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: false,
    auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    } : undefined
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "no-reply@quelyos.com",
    to: email,
    subject: "Réinitialisation de mot de passe",
    text: `Voici votre lien de réinitialisation (valide ${RESET_TOKEN_TTL_MIN} minutes) : ${link}`
  });
}

function nowPlusMinutes(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function generateResetToken(user, req) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  await prisma.passwordResetToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt: nowPlusMinutes(RESET_TOKEN_TTL_MIN),
      createdIp: req.ip,
      createdUserAgent: req.headers["user-agent"] || null
    }
  });

  return token;
}

function successResetResponse(res) {
  return res.json({ message: "Si un compte existe, un email de réinitialisation a été envoyé." });
}

// ===== Email Verification helpers =====
const EMAIL_VERIFICATION_TTL_HOURS = parseInt(process.env.EMAIL_VERIFICATION_TTL_HOURS || "24", 10);

async function generateEmailVerificationToken(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  await prisma.emailVerificationToken.create({
    data: {
      tokenHash,
      userId,
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000)
    }
  });

  return token;
}

function buildVerificationLink(token) {
  const base = process.env.FRONTEND_URL || "http://localhost:3000";
  return `${base}/verify-email?token=${token}`;
}

async function sendVerificationEmail(email, token) {
  const link = buildVerificationLink(token);

  if (!process.env.SMTP_HOST) {
    logger.info("SMTP non configuré, verification link loggué", { email, link });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: false,
    auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    } : undefined
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "no-reply@quelyos.com",
    to: email,
    subject: "Confirmez votre adresse email - Quelyos",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Quelyos</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937;">Bienvenue sur Quelyos !</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Merci de vous être inscrit. Pour activer votre compte et accéder à toutes les fonctionnalités, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Confirmer mon email
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Ce lien est valide pendant ${EMAIL_VERIFICATION_TTL_HOURS} heures. Si vous n'avez pas créé de compte, ignorez cet email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            © 2025 Quelyos. Tous droits réservés.
          </p>
        </div>
      </div>
    `
  });
}

// ------------------ REGISTER ------------------
router.post("/register", validate(registerSchema), async (req, res) => {
  try {
    const companyName = (req.body.companyName || req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password;

    if (!companyName || !email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // 1. Create company
    const company = await prisma.company.create({
      data: { name: companyName }
    });

    // 2. Create admin user (emailVerified = false by default)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        companyId: company.id,
        role: "ADMIN",
        emailVerified: false
      }
    });

    // 3. Create default main account
    const mainAccount = await prisma.account.create({
      data: {
        name: "Compte Principal",
        companyId: company.id
      }
    });

    // 4. Optional initial transaction (solde = 0)
    await prisma.transaction.create({
      data: {
        amount: 0,
        type: "credit",
        accountId: mainAccount.id
      }
    });

    // 5. Send verification email
    try {
      const verificationToken = await generateEmailVerificationToken(user.id);
      await sendVerificationEmail(email, verificationToken);
      logger.info("Verification email sent", { email });
    } catch (emailErr) {
      logger.warn("Failed to send verification email", { email, error: emailErr.message });
    }

    // 6. Generate JWT (user can use app but with limited features until verified)
    const token = jwt.sign(
      { userId: user.id, companyId: company.id, role: user.role, emailVerified: false },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Company + user created. Please verify your email.",
      companyId: company.id,
      userId: user.id,
      token,
      emailVerified: false
    });

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// ------------------ VERIFY EMAIL ------------------
router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const tokenHash = hashToken(token);

    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!verificationToken) {
      return res.status(400).json({ error: "Token invalide ou expiré" });
    }

    if (verificationToken.usedAt) {
      return res.status(400).json({ error: "Ce lien a déjà été utilisé" });
    }

    if (new Date() > verificationToken.expiresAt) {
      return res.status(400).json({ error: "Ce lien a expiré. Demandez un nouveau lien de vérification." });
    }

    // Marquer l'email comme vérifié
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: true }
      }),
      prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() }
      })
    ]);

    logger.info("Email verified", { email: verificationToken.user.email });

    res.json({ 
      message: "Email vérifié avec succès !",
      email: verificationToken.user.email
    });

  } catch (err) {
    logger.error("Email verification error", err);
    res.status(500).json({ error: "Erreur lors de la vérification" });
  }
});

// ------------------ RESEND VERIFICATION EMAIL ------------------
router.post("/resend-verification", verificationLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email requis" });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // SECURITY: Always return generic message to prevent email enumeration
    const genericMessage = "Si un compte non vérifié existe, un email de vérification a été envoyé.";

    if (!user) {
      return res.json({ message: genericMessage });
    }

    if (user.emailVerified) {
      // Don't reveal that email is verified - prevents enumeration
      return res.json({ message: genericMessage });
    }

    // Invalider les anciens tokens
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id, usedAt: null }
    });

    // Générer et envoyer un nouveau token
    const verificationToken = await generateEmailVerificationToken(user.id);
    await sendVerificationEmail(user.email, verificationToken);

    logger.info("Verification email resent", { email: user.email });

    res.json({ message: genericMessage });

  } catch (err) {
    logger.error("Resend verification error", err);
    res.status(500).json({ error: "Erreur lors de l'envoi" });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     description: Authenticates user and sets httpOnly cookies containing JWT tokens (accessToken + refreshToken). Supports 2FA.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful - httpOnly cookies set
 *         headers:
 *           Set-Cookie:
 *             description: accessToken and refreshToken cookies
 *             schema:
 *               type: string
 *               example: accessToken=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Max-Age=900
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many login attempts - rate limited
 */
// ------------------ LOGIN ------------------
router.post("/login", loginLimiter, validate(loginSchema), async (req, res) => {
  const { dummyBcryptHash, constantTimeDelay } = require('../utils/timingProtection');
  const startTime = Date.now();

  try {
    const { email, password, twoFACode } = req.body;
    logger.info("LOGIN attempt", { email });

    const user = await prisma.user.findUnique({ where: { email } });

    // SECURITY: Always perform bcrypt comparison to prevent timing attacks
    // If user doesn't exist, use a dummy hash to keep timing constant
    let valid = false;
    if (!user) {
      // Perform dummy bcrypt comparison to match timing of real auth
      await dummyBcryptHash();
      logger.warn("LOGIN failed - user not found", { email });
      // Add constant delay before returning error
      await constantTimeDelay(100, 200, startTime);
      return res.status(400).json({ error: "Invalid credentials" });
    } else {
      valid = await bcrypt.compare(password, user.password);
    }

    if (!valid) {
      logger.warn("LOGIN failed - invalid password", { email });
      // Add constant delay before returning error
      await constantTimeDelay(100, 200, startTime);
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Vérification 2FA si activée
    if (user.twoFAEnabled) {
      if (!twoFACode) {
        // Retourner un indicateur que la 2FA est requise
        logger.info("LOGIN requires 2FA", { email, userId: user.id });
        return res.status(200).json({ 
          requires2FA: true,
          message: "Code 2FA requis"
        });
      }

      // Vérifier le code TOTP
      const speakeasy = require("speakeasy");
      const verified = speakeasy.totp.verify({
        secret: user.twoFASecret,
        encoding: "base32",
        token: twoFACode,
        window: 1
      });

      if (!verified) {
        logger.warn("LOGIN failed - invalid 2FA code", { email });
        return res.status(401).json({ error: "Code 2FA invalide" });
      }
    }

    const role = user.role || "USER";
    logger.info("LOGIN successful", { email, userId: user.id });

    // Générer access token (short-lived)
    const accessToken = generateAccessToken({
      userId: user.id,
      companyId: user.companyId,
      role
    });

    // Générer refresh token (long-lived)
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const refreshToken = await generateRefreshToken(user.id, ipAddress, userAgent);

    // Set httpOnly signed cookies for security with standardized options
    res.cookie('quelyos_access_token', accessToken, getAccessTokenCookieOptions());
    res.cookie('quelyos_refresh_token', refreshToken, getRefreshTokenCookieOptions());

    // DO NOT expose tokens in response body - they are in httpOnly cookies only
    res.json({
      success: true,
      role,
      userId: user.id,
      companyId: user.companyId,
      user: {
        id: user.id,
        email: user.email,
        role: role
      }
    });

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ------------------ VALIDATE TOKEN ------------------
// Endpoint pour valider qu'un token JWT est encore valide
// Utilisé par le frontend pour vérifier la session au chargement
const auth = require("../middleware/auth");

router.get("/validate", auth, async (req, res) => {
  try {
    // Si on arrive ici, le middleware auth a validé le token
    // Vérifier que l'utilisateur existe toujours
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        company: {
          select: {
            id: true,
            name: true,
            sector: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(401).json({ error: "User not found", code: "USER_DELETED" });
    }
    
    // Token valide et utilisateur existe
    res.json({
      valid: true,
      user: user,
      expiresAt: req.user.exp ? new Date(req.user.exp * 1000).toISOString() : null
    });
  } catch (err) {
    logger.error("Token validation error", err);
    res.status(500).json({ error: "Validation failed" });
  }
});

// ------------------ RESET PASSWORD (REQUEST) ------------------
async function handleResetRequest(req, res) {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Email requis" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Réponse générique pour éviter l'énumération
      return successResetResponse(res);
    }

    const token = await generateResetToken(user, req);
    await sendResetEmail(email, token);
    logger.audit("reset_requested", { userId: user.id, companyId: user.companyId, email });

    return successResetResponse(res);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: "Impossible de générer le lien de réinitialisation" });
  }
}

router.post("/forgot", [resetShortLimiter, resetLimiter], handleResetRequest);
router.post("/password/reset-request", [resetShortLimiter, resetLimiter], handleResetRequest);

// ------------------ RESET PASSWORD (CONFIRM) ------------------
const resetConfirmHandlers = [resetShortLimiter, resetLimiter];

router.post(["/password/reset-confirm", "/reset"], ...resetConfirmHandlers, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token et nouveau mot de passe requis" });
    }

    const tokenHash = hashToken(token);
    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      include: { user: true }
    });

    if (!resetRecord || !resetRecord.user) {
      return res.status(400).json({ error: "Lien invalide ou expiré" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({ where: { id: resetRecord.userId }, data: { password: hashed } }),
      prisma.passwordResetToken.update({ where: { id: resetRecord.id }, data: { usedAt: new Date() } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: resetRecord.userId, id: { not: resetRecord.id }, expiresAt: { lt: new Date() } } })
    ]);

    logger.audit("reset_completed", {
      userId: resetRecord.userId,
      companyId: resetRecord.user.companyId,
      email: resetRecord.user.email
    });

    return res.json({ message: "Mot de passe réinitialisé" });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: "Impossible de réinitialiser le mot de passe" });
  }
});

// ------------------ REFRESH TOKEN ------------------
router.post("/refresh", async (req, res) => {
  let lockRelease = null;

  try {
    // Try to get refresh token from cookie first, then body (backward compatibility)
    const oldRefreshToken = req.signedCookies?.quelyos_refresh_token || req.signedCookies?.refreshToken || req.cookies?.quelyos_refresh_token || req.cookies?.refreshToken || req.body.refreshToken;

    if (!oldRefreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    // SECURITY: Import utilities
    const { rotateRefreshToken } = require('../utils/tokenRotation');
    const tokenRefreshLock = require('../utils/tokenRefreshLock');

    // Get client info for audit trail
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // First verify the token exists and get user ID
    const tokenData = await verifyRefreshToken(oldRefreshToken);
    const userId = tokenData.user.id;

    // SECURITY: Check for existing lock to prevent race conditions
    const existingRefresh = tokenRefreshLock.getPendingRefresh(userId);
    if (existingRefresh) {
      logger.info("Waiting for existing refresh operation", { userId });

      try {
        // Wait for existing refresh to complete and return its result
        const result = await Promise.race([
          existingRefresh,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('REFRESH_TIMEOUT')), 3000)
          )
        ]);
        return res.json(result);
      } catch (waitErr) {
        logger.warn("Failed to wait for existing refresh", { userId, error: waitErr.message });
        // Fall through to try acquiring lock
      }
    }

    // Try to acquire lock
    const lockResult = await tokenRefreshLock.acquire(userId);
    if (!lockResult.acquired) {
      logger.warn("Token refresh already in progress", { userId, waitTime: lockResult.waitTime });
      return res.status(429).json({
        error: "Token refresh already in progress. Please retry in a moment.",
        retryAfter: Math.ceil(lockResult.waitTime / 1000)
      });
    }

    lockRelease = lockResult.release;

    // Create refresh operation promise
    const refreshPromise = (async () => {
      // SECURITY: Rotate refresh token (marks old as used, generates new)
      // This prevents token reuse and detects potential token theft
      const { newRefreshToken, accessToken, user } = await rotateRefreshToken(
        oldRefreshToken,
        userId,
        ipAddress,
        userAgent
      );

      logger.info("Token refreshed and rotated", { userId: user.id });

      return {
        newRefreshToken,
        accessToken,
        user
      };
    })();

    // Store pending refresh
    tokenRefreshLock.setPendingRefresh(userId, refreshPromise);

    // Wait for refresh to complete
    const { newRefreshToken, accessToken, user } = await refreshPromise;

    // Set new access token in httpOnly signed cookie
    res.cookie('quelyos_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
      signed: true
    });

    // Set new refresh token in httpOnly signed cookie
    const REFRESH_TOKEN_EXPIRY_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS || '7');
    res.cookie('quelyos_refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      path: '/',
      signed: true
    });

    // DO NOT expose tokens in response body
    res.json({
      success: true,
      userId: user.id,
      companyId: user.companyId,
      role: user.role
    });

  } catch (err) {
    logger.warn("Refresh token failed", { error: err.message });

    // SECURITY: Enhanced error handling for token reuse detection
    if (err.message === 'TOKEN_REUSE_DETECTED') {
      logger.error("SECURITY ALERT: Token reuse detected - possible token theft");
      return res.status(401).json({
        error: "Token reuse detected. All sessions have been revoked. Please log in again."
      });
    }

    return res.status(401).json({ error: "Invalid or expired refresh token" });
  } finally {
    // Always release lock when done
    if (lockRelease) {
      lockRelease();
    }
  }
});

// ------------------ LOGOUT ------------------
router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    // Try to get from signed cookie first, then unsigned (migration), then body
    const refreshTokenFromCookie = req.signedCookies?.quelyos_refresh_token || req.signedCookies?.refreshToken || req.cookies?.quelyos_refresh_token || req.cookies?.refreshToken;
    const tokenToRevoke = refreshToken || refreshTokenFromCookie;

    if (tokenToRevoke) {
      await revokeRefreshToken(tokenToRevoke);
      logger.info("User logged out", { refreshToken: tokenToRevoke.substring(0, 10) + "..." });
    }

    // Clear cookies (both old and new names, signed and unsigned during migration)
    res.clearCookie('quelyos_access_token', { path: '/', signed: true });
    res.clearCookie('quelyos_refresh_token', { path: '/', signed: true });
    res.clearCookie('quelyos_access_token', { path: '/' });
    res.clearCookie('quelyos_refresh_token', { path: '/' });
    res.clearCookie('accessToken', { path: '/', signed: true });
    res.clearCookie('refreshToken', { path: '/', signed: true });
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });

    res.json({ message: "Logged out successfully" });

  } catch (err) {
    logger.error("Logout error", { error: err.message });
    res.status(500).json({ error: "Logout failed" });
  }
});

// ------------------ REVOKE ALL TOKENS ------------------
router.post("/revoke-all", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    await revokeAllUserTokens(userId);
    logger.info("All tokens revoked", { userId });

    res.json({ message: "All tokens revoked successfully" });

  } catch (err) {
    logger.error("Revoke all tokens error", { error: err.message });
    res.status(500).json({ error: "Failed to revoke tokens" });
  }
});

// ------------------ F54: ACCEPT INVITATION ------------------
router.post("/accept-invite", invitationLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Token and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    // Find the invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: { company: true }
    });

    if (!invitation) {
      return res.status(404).json({ error: "Invalid invitation token" });
    }

    if (invitation.status !== "PENDING") {
      return res.status(400).json({ error: "Invitation already used or cancelled" });
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" }
      });
      return res.status(400).json({ error: "Invitation has expired" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email }
    });

    if (existingUser) {
      return res.status(409).json({ error: "A user with this email already exists" });
    }

    // Create the user
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: invitation.email,
        password: hashed,
        companyId: invitation.companyId,
        role: invitation.role
      }
    });

    // Mark invitation as accepted
    await prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date()
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        companyId: invitation.companyId,
        userId: user.id,
        action: "ACCEPT_INVITATION",
        targetType: "User",
        targetId: user.id,
        targetEmail: user.email,
        metadata: { role: invitation.role, invitedById: invitation.invitedById }
      }
    });

    // Generate JWT tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      companyId: user.companyId,
      role: user.role
    });

    const refreshToken = await generateRefreshToken(
      user.id,
      req.ip,
      req.headers["user-agent"]
    );

    logger.info("User joined via invitation", {
      userId: user.id,
      companyId: invitation.companyId,
      email: user.email
    });

    // Set httpOnly signed cookies
    res.cookie('quelyos_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
      signed: true
    });

    res.cookie('quelyos_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
      signed: true
    });

    // DO NOT expose tokens in response body
    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: invitation.company.name
      }
    });

  } catch (err) {
    logger.error("Accept invitation error", { error: err.message });
    res.status(500).json({ error: "Failed to accept invitation" });
  }
});

// ------------------ F54: VERIFY INVITATION ------------------
router.get("/verify-invite/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        company: { select: { name: true } },
        invitedBy: { select: { email: true } }
      }
    });

    if (!invitation) {
      return res.status(404).json({ valid: false, error: "Invalid invitation" });
    }

    if (invitation.status !== "PENDING") {
      return res.status(400).json({
        valid: false,
        error: invitation.status === "ACCEPTED" ? "Invitation already used" : "Invitation cancelled"
      });
    }

    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({ valid: false, error: "Invitation has expired" });
    }

    res.json({
      valid: true,
      email: invitation.email,
      role: invitation.role,
      companyName: invitation.company.name,
      invitedBy: invitation.invitedBy.email,
      expiresAt: invitation.expiresAt
    });

  } catch (err) {
    logger.error("Verify invitation error", { error: err.message });
    res.status(500).json({ valid: false, error: "Failed to verify invitation" });
  }
});

module.exports = router;
