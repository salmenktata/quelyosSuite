const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const logger = require("../../logger");
const { generateAccessToken, generateRefreshToken } = require("../utils/refreshToken");

// ==========================================
// Configuration OAuth
// ==========================================
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const OAUTH_REDIRECT_BASE = process.env.OAUTH_REDIRECT_BASE || "http://localhost:3004";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// ==========================================
// Helpers
// ==========================================
function generateRandomPassword() {
  return crypto.randomBytes(32).toString("hex");
}

async function findOrCreateOAuthUser({ email, provider, oauthId, avatarUrl, companyName }) {
  // 1. Chercher par oauthProvider + oauthId
  let user = await prisma.user.findFirst({
    where: { oauthProvider: provider, oauthId }
  });

  if (user) {
    // Mise à jour avatar si changé
    if (avatarUrl && user.avatarUrl !== avatarUrl) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl }
      });
    }
    return { user, isNew: false };
  }

  // 2. Chercher par email (lien compte existant)
  user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // Lier le compte OAuth à l'utilisateur existant
    user = await prisma.user.update({
      where: { id: user.id },
      data: { 
        oauthProvider: provider, 
        oauthId, 
        avatarUrl: avatarUrl || user.avatarUrl,
        emailVerified: true 
      }
    });
    return { user, isNew: false };
  }

  // 3. Créer un nouveau compte
  const company = await prisma.company.create({
    data: { name: companyName || `Société de ${email.split("@")[0]}` }
  });

  const randomPassword = await bcrypt.hash(generateRandomPassword(), 10);

  user = await prisma.user.create({
    data: {
      email,
      password: randomPassword,
      oauthProvider: provider,
      oauthId,
      avatarUrl,
      emailVerified: true,
      companyId: company.id,
      role: "ADMIN"
    }
  });

  // Créer compte principal par défaut
  await prisma.account.create({
    data: {
      name: "Compte Principal",
      companyId: company.id
    }
  });

  return { user, isNew: true };
}

async function generateTokensAndRedirect(res, user, isNew) {
  const accessToken = generateAccessToken({
    userId: user.id,
    companyId: user.companyId,
    role: user.role
  });

  const ipAddress = res.req.ip || res.req.headers["x-forwarded-for"];
  const userAgent = res.req.headers["user-agent"];
  const refreshToken = await generateRefreshToken(user.id, ipAddress, userAgent);

  // Créer un token temporaire pour transférer les données au frontend
  const authCode = jwt.sign(
    { 
      accessToken, 
      refreshToken, 
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      isNew,
      avatarUrl: user.avatarUrl
    },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );

  // Rediriger vers le frontend avec le code
  return res.redirect(`${FRONTEND_URL}/oauth/callback?code=${authCode}`);
}

// ==========================================
// GOOGLE OAuth
// ==========================================

// Étape 1: Rediriger vers Google
router.get("/google", (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: "Google OAuth non configuré" });
  }

  const redirectUri = `${OAUTH_REDIRECT_BASE}/auth/oauth/google/callback`;
  const scope = encodeURIComponent("email profile");
  const state = crypto.randomBytes(16).toString("hex");

  // Stocker state en cookie pour CSRF protection
  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 600000, // 10 min
    path: "/auth/oauth"
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${scope}&` +
    `state=${state}&` +
    `access_type=offline&` +
    `prompt=consent`;

  res.redirect(googleAuthUrl);
});

// Étape 2: Callback Google
router.get("/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    const storedState = req.cookies?.oauth_state;

    // Vérifier CSRF
    if (!state || state !== storedState) {
      logger.warn("Google OAuth: CSRF mismatch");
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_csrf`);
    }

    // Nettoyer le cookie state
    res.clearCookie("oauth_state");

    if (!code) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_no_code`);
    }

    // Échanger le code contre un access token
    const redirectUri = `${OAUTH_REDIRECT_BASE}/auth/oauth/google/callback`;
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      logger.error("Google OAuth: token exchange failed", tokenData);
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_token_failed`);
    }

    // Récupérer les infos utilisateur
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const userInfo = await userInfoResponse.json();

    if (!userInfo.email) {
      logger.error("Google OAuth: no email in user info", userInfo);
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_no_email`);
    }

    // Créer ou trouver l'utilisateur
    const { user, isNew } = await findOrCreateOAuthUser({
      email: userInfo.email,
      provider: "google",
      oauthId: userInfo.id,
      avatarUrl: userInfo.picture,
      companyName: userInfo.name ? `Société ${userInfo.name}` : undefined
    });

    logger.info("Google OAuth: user authenticated", { email: user.email, isNew });

    return generateTokensAndRedirect(res, user, isNew);

  } catch (error) {
    logger.error("Google OAuth callback error", error);
    return res.redirect(`${FRONTEND_URL}/login?error=oauth_error`);
  }
});

// ==========================================
// LINKEDIN OAuth
// ==========================================

// Étape 1: Rediriger vers LinkedIn
router.get("/linkedin", (req, res) => {
  if (!LINKEDIN_CLIENT_ID) {
    return res.status(503).json({ error: "LinkedIn OAuth non configuré" });
  }

  const redirectUri = `${OAUTH_REDIRECT_BASE}/auth/oauth/linkedin/callback`;
  const scope = encodeURIComponent("openid profile email");
  const state = crypto.randomBytes(16).toString("hex");

  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 600000,
    path: "/auth/oauth"
  });

  const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
    `response_type=code&` +
    `client_id=${LINKEDIN_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${state}&` +
    `scope=${scope}`;

  res.redirect(linkedinAuthUrl);
});

// Étape 2: Callback LinkedIn
router.get("/linkedin/callback", async (req, res) => {
  try {
    const { code, state, error } = req.query;
    const storedState = req.cookies?.oauth_state;

    if (error) {
      logger.warn("LinkedIn OAuth: user denied access", { error });
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_denied`);
    }

    // Vérifier CSRF
    if (!state || state !== storedState) {
      logger.warn("LinkedIn OAuth: CSRF mismatch");
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_csrf`);
    }

    res.clearCookie("oauth_state");

    if (!code) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_no_code`);
    }

    // Échanger le code contre un access token
    const redirectUri = `${OAUTH_REDIRECT_BASE}/auth/oauth/linkedin/callback`;
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      logger.error("LinkedIn OAuth: token exchange failed", tokenData);
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_token_failed`);
    }

    // Récupérer les infos utilisateur (LinkedIn OpenID Connect)
    const userInfoResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const userInfo = await userInfoResponse.json();

    if (!userInfo.email) {
      logger.error("LinkedIn OAuth: no email in user info", userInfo);
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_no_email`);
    }

    // Créer ou trouver l'utilisateur
    const { user, isNew } = await findOrCreateOAuthUser({
      email: userInfo.email,
      provider: "linkedin",
      oauthId: userInfo.sub,
      avatarUrl: userInfo.picture,
      companyName: userInfo.name ? `Société ${userInfo.name}` : undefined
    });

    logger.info("LinkedIn OAuth: user authenticated", { email: user.email, isNew });

    return generateTokensAndRedirect(res, user, isNew);

  } catch (error) {
    logger.error("LinkedIn OAuth callback error", error);
    return res.redirect(`${FRONTEND_URL}/login?error=oauth_error`);
  }
});

// ==========================================
// Exchange OAuth code for tokens (frontend call)
// ==========================================
router.post("/exchange", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code manquant" });
    }

    // Décoder le JWT temporaire
    const decoded = jwt.verify(code, process.env.JWT_SECRET);

    // Set httpOnly signed cookies for tokens
    res.cookie('quelyos_access_token', decoded.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
      signed: true
    });

    res.cookie('quelyos_refresh_token', decoded.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
      signed: true
    });

    // DO NOT expose tokens in response body
    return res.json({
      success: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        companyId: decoded.companyId,
        avatarUrl: decoded.avatarUrl
      },
      isNew: decoded.isNew
    });

  } catch (error) {
    logger.error("OAuth exchange error", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Code expiré" });
    }
    return res.status(400).json({ error: "Code invalide" });
  }
});

// ==========================================
// Vérifier état OAuth (pour le frontend)
// ==========================================
router.get("/providers", (req, res) => {
  res.json({
    google: !!GOOGLE_CLIENT_ID,
    linkedin: !!LINKEDIN_CLIENT_ID
  });
});

module.exports = router;
