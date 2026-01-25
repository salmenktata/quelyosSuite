/**
 * F54 — Routes gestion équipe avancée
 * - Liste des membres
 * - Invitations par email
 * - Changement de rôles
 * - Audit log des actions
 */

const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// -------- Helpers --------

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN" && req.user.role !== "SUPERADMIN") {
    return res.status(403).json({ error: "Admin privileges required" });
  }
  return next();
};

/**
 * Générer un token d'invitation sécurisé
 */
function generateInviteToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Créer une entrée dans l'audit log
 */
async function createAuditLog(companyId, userId, action, targetType, data = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        companyId,
        userId,
        action,
        targetType,
        targetId: data.targetId || null,
        targetEmail: data.targetEmail || null,
        metadata: data.metadata || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    });
  } catch (err) {
    logger.error("Failed to create audit log:", err);
    // Ne pas faire échouer la requête principale si l'audit échoue
  }
}

/**
 * Envoyer l'email d'invitation
 */
async function sendInvitationEmail(email, token, companyName, inviterEmail) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";

  if (!smtpHost || !smtpUser || !smtpPass) {
    logger.warn("SMTP not configured, invitation email not sent");
    return { sent: false, reason: "SMTP not configured" };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const inviteUrl = `${frontendUrl}/join?token=${token}`;

  const mailOptions = {
    from: `"Quelyos" <${smtpUser}>`,
    to: email,
    subject: `Invitation à rejoindre ${companyName} sur Quelyos`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .logo { text-align: center; margin-bottom: 32px; }
          .logo-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; }
          .card { background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 16px; padding: 32px; }
          h1 { font-size: 24px; margin-bottom: 16px; color: white; }
          p { color: #94a3b8; line-height: 1.6; margin-bottom: 16px; }
          .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; margin: 24px 0; }
          .footer { text-align: center; margin-top: 32px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <div class="logo-icon">✨</div>
          </div>
          <div class="card">
            <h1>Vous êtes invité !</h1>
            <p><strong>${inviterEmail}</strong> vous invite à rejoindre <strong>${companyName}</strong> sur Quelyos.</p>
            <p>Quelyos est une plateforme de gestion financière qui vous permet de suivre vos dépenses, revenus et budgets en équipe.</p>
            <a href="${inviteUrl}" class="btn">Accepter l'invitation</a>
            <p style="font-size: 13px; color: #64748b;">Ce lien expire dans 7 jours. Si vous n'avez pas demandé cette invitation, ignorez cet email.</p>
          </div>
          <div class="footer">
            <p>© 2025 Quelyos. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `${inviterEmail} vous invite à rejoindre ${companyName} sur Quelyos. Cliquez ici pour accepter : ${inviteUrl}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { sent: true };
  } catch (err) {
    logger.error("Failed to send invitation email:", err);
    return { sent: false, reason: err.message };
  }
}

// -------- Routes Membres --------

/**
 * GET /company/team/members
 * Liste les membres de l'équipe
 */
router.get("/members", auth, async (req, res) => {
  try {
    const members = await prisma.user.findMany({
      where: { companyId: req.user.companyId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        isDemo: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(members);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to fetch team members" });
  }
});

/**
 * PATCH /company/team/members/:id/role
 * Modifier le rôle d'un membre
 */
router.patch("/members/:id/role", auth, requireAdmin, async (req, res) => {
  try {
    const memberId = Number(req.params.id);
    if (!Number.isFinite(memberId)) {
      return res.status(400).json({ error: "Invalid member id" });
    }

    const { role } = req.body;
    const validRoles = ["ADMIN", "USER"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role. Must be ADMIN or USER" });
    }

    // Vérifier que le membre appartient à la company
    const member = await prisma.user.findFirst({
      where: { id: memberId, companyId: req.user.companyId },
      select: { id: true, email: true, role: true },
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    // Ne pas se rétrograder soi-même
    if (memberId === req.user.userId && role !== "ADMIN") {
      return res.status(400).json({ error: "Cannot downgrade yourself from admin" });
    }

    // Empêcher de supprimer le dernier admin
    if (member.role === "ADMIN" && role === "USER") {
      const adminCount = await prisma.user.count({
        where: { companyId: req.user.companyId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return res.status(400).json({ error: "Cannot remove the last admin" });
      }
    }

    const oldRole = member.role;
    const updated = await prisma.user.update({
      where: { id: memberId },
      data: { role },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    // Audit log
    await createAuditLog(req.user.companyId, req.user.userId, "CHANGE_ROLE", "User", {
      targetId: memberId,
      targetEmail: member.email,
      metadata: { oldRole, newRole: role },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json(updated);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to update member role" });
  }
});

/**
 * DELETE /company/team/members/:id
 * Supprimer un membre de l'équipe
 */
router.delete("/members/:id", auth, requireAdmin, async (req, res) => {
  try {
    const memberId = Number(req.params.id);
    if (!Number.isFinite(memberId)) {
      return res.status(400).json({ error: "Invalid member id" });
    }

    // Ne pas se supprimer soi-même
    if (memberId === req.user.userId) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }

    const member = await prisma.user.findFirst({
      where: { id: memberId, companyId: req.user.companyId },
      select: { id: true, email: true, role: true },
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    // Empêcher de supprimer le dernier admin
    if (member.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { companyId: req.user.companyId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return res.status(400).json({ error: "Cannot delete the last admin" });
      }
    }

    await prisma.user.delete({ where: { id: memberId } });

    // Audit log
    await createAuditLog(req.user.companyId, req.user.userId, "DELETE_USER", "User", {
      targetId: memberId,
      targetEmail: member.email,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ message: "Member deleted successfully" });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to delete member" });
  }
});

// -------- Routes Invitations --------

/**
 * GET /company/team/invitations
 * Liste les invitations en attente
 */
router.get("/invitations", auth, requireAdmin, async (req, res) => {
  try {
    const invitations = await prisma.teamInvitation.findMany({
      where: {
        companyId: req.user.companyId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: {
        invitedBy: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(invitations);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to fetch invitations" });
  }
});

/**
 * POST /company/team/invitations
 * Créer une nouvelle invitation
 */
router.post("/invitations", auth, requireAdmin, async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const role = req.body.role === "ADMIN" ? "ADMIN" : "USER";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      if (existingUser.companyId === req.user.companyId) {
        return res.status(409).json({ error: "User is already a member of this team" });
      }
      return res.status(409).json({ error: "Email is already registered with another company" });
    }

    // Vérifier s'il y a déjà une invitation en attente
    const pendingInvite = await prisma.teamInvitation.findFirst({
      where: {
        email,
        companyId: req.user.companyId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (pendingInvite) {
      return res.status(409).json({ error: "An invitation is already pending for this email" });
    }

    // Récupérer les infos company pour l'email
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
      select: { name: true },
    });

    const inviter = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { email: true },
    });

    // Créer l'invitation
    const token = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 jours

    const invitation = await prisma.teamInvitation.create({
      data: {
        email,
        companyId: req.user.companyId,
        role,
        token,
        invitedById: req.user.userId,
        expiresAt,
      },
      include: {
        invitedBy: { select: { email: true } },
      },
    });

    // Envoyer l'email
    const emailResult = await sendInvitationEmail(
      email,
      token,
      company?.name || "Votre équipe",
      inviter?.email || "Un administrateur"
    );

    // Audit log
    await createAuditLog(req.user.companyId, req.user.userId, "INVITE_MEMBER", "TeamInvitation", {
      targetId: invitation.id,
      targetEmail: email,
      metadata: { role, emailSent: emailResult.sent },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      ...invitation,
      emailSent: emailResult.sent,
      emailError: emailResult.reason,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to create invitation" });
  }
});

/**
 * DELETE /company/team/invitations/:id
 * Annuler une invitation
 */
router.delete("/invitations/:id", auth, requireAdmin, async (req, res) => {
  try {
    const invitationId = Number(req.params.id);
    if (!Number.isFinite(invitationId)) {
      return res.status(400).json({ error: "Invalid invitation id" });
    }

    const invitation = await prisma.teamInvitation.findFirst({
      where: { id: invitationId, companyId: req.user.companyId },
    });

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    await prisma.teamInvitation.update({
      where: { id: invitationId },
      data: { status: "CANCELLED" },
    });

    // Audit log
    await createAuditLog(req.user.companyId, req.user.userId, "CANCEL_INVITATION", "TeamInvitation", {
      targetId: invitationId,
      targetEmail: invitation.email,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ message: "Invitation cancelled" });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to cancel invitation" });
  }
});

/**
 * POST /company/team/invitations/:id/resend
 * Renvoyer l'email d'invitation
 */
router.post("/invitations/:id/resend", auth, requireAdmin, async (req, res) => {
  try {
    const invitationId = Number(req.params.id);
    if (!Number.isFinite(invitationId)) {
      return res.status(400).json({ error: "Invalid invitation id" });
    }

    const invitation = await prisma.teamInvitation.findFirst({
      where: {
        id: invitationId,
        companyId: req.user.companyId,
        status: "PENDING",
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found or already used" });
    }

    // Récupérer les infos pour l'email
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
      select: { name: true },
    });

    const inviter = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { email: true },
    });

    // Renvoyer l'email
    const emailResult = await sendInvitationEmail(
      invitation.email,
      invitation.token,
      company?.name || "Votre équipe",
      inviter?.email || "Un administrateur"
    );

    res.json({ emailSent: emailResult.sent, emailError: emailResult.reason });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to resend invitation" });
  }
});

// -------- Routes Audit Log --------

/**
 * GET /company/team/audit
 * Récupérer l'historique des actions
 */
router.get("/audit", auth, requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { companyId: req.user.companyId },
        include: {
          user: { select: { email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where: { companyId: req.user.companyId } }),
    ]);

    res.json({ logs, total, limit, offset });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

module.exports = router;
