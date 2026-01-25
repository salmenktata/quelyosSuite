/**
 * F44 — Routes notifications push/email
 * - Préférences de notifications
 * - Liste des notifications
 * - Marquer comme lues
 * - Envoi d'alertes budgétaires
 */

const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const nodemailer = require("nodemailer");

// -------- Helpers --------

/**
 * Obtenir ou créer les préférences de notification d'un utilisateur
 */
async function getOrCreatePreferences(userId) {
  let prefs = await prisma.notificationPreferences.findUnique({
    where: { userId },
  });

  if (!prefs) {
    prefs = await prisma.notificationPreferences.create({
      data: { userId },
    });
  }

  return prefs;
}

/**
 * Créer une notification in-app
 */
async function createNotification(userId, type, title, message, options = {}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        actionUrl: options.actionUrl || null,
        metadata: options.metadata || null,
      },
    });

    // Si email activé, l'envoyer
    if (options.sendEmail) {
      await sendNotificationEmail(userId, title, message, options.actionUrl);
      await prisma.notification.update({
        where: { id: notification.id },
        data: { sentEmail: true },
      });
    }

    return notification;
  } catch (err) {
    logger.error("Failed to create notification:", err);
    return null;
  }
}

/**
 * Envoyer une notification par email
 */
async function sendNotificationEmail(userId, title, message, actionUrl) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";

  if (!smtpHost || !smtpUser || !smtpPass) {
    logger.warn("SMTP not configured, notification email not sent");
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) return false;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const fullActionUrl = actionUrl ? `${frontendUrl}${actionUrl}` : frontendUrl;

  const mailOptions = {
    from: `"Quelyos" <${smtpUser}>`,
    to: user.email,
    subject: `Quelyos — ${title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .logo { text-align: center; margin-bottom: 32px; }
          .card { background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 16px; padding: 32px; }
          h1 { font-size: 20px; margin-bottom: 16px; color: white; }
          p { color: #94a3b8; line-height: 1.6; margin-bottom: 16px; }
          .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; margin: 16px 0; }
          .footer { text-align: center; margin-top: 32px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <span style="font-size: 24px; font-weight: bold; color: white;">✨ Quelyos</span>
          </div>
          <div class="card">
            <h1>${title}</h1>
            <p>${message}</p>
            <a href="${fullActionUrl}" class="btn">Voir dans Quelyos</a>
          </div>
          <div class="footer">
            <p>Vous recevez cet email car vous avez activé les notifications sur Quelyos.</p>
            <p>© 2025 Quelyos. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `${title}\n\n${message}\n\nVoir dans Quelyos: ${fullActionUrl}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    logger.error("Failed to send notification email:", err);
    return false;
  }
}

// -------- Routes Préférences --------

/**
 * GET /user/notifications/preferences
 * Récupérer les préférences de notification
 */
router.get("/preferences", auth, async (req, res) => {
  try {
    const prefs = await getOrCreatePreferences(req.user.userId);
    res.json(prefs);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to fetch notification preferences" });
  }
});

/**
 * PATCH /user/notifications/preferences
 * Mettre à jour les préférences
 */
router.patch("/preferences", auth, async (req, res) => {
  try {
    const allowedFields = [
      "emailOnTransaction",
      "emailOnBudgetAlert",
      "emailOnExpenseWarning",
      "weeklyDigest",
      "monthlyReport",
      "pushEnabled",
      "pushOnTransaction",
      "pushOnBudgetAlert",
      "budgetAlertThreshold",
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const prefs = await prisma.notificationPreferences.upsert({
      where: { userId: req.user.userId },
      update: updateData,
      create: { userId: req.user.userId, ...updateData },
    });

    res.json(prefs);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to update notification preferences" });
  }
});

// -------- Routes Notifications --------

/**
 * GET /user/notifications
 * Liste des notifications de l'utilisateur
 */
router.get("/", auth, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;
    const unreadOnly = req.query.unread === "true";

    const where = {
      userId: req.user.userId,
      ...(unreadOnly && { read: false }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: req.user.userId, read: false },
      }),
    ]);

    res.json({ notifications, total, unreadCount, limit, offset });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

/**
 * PATCH /user/notifications/:id/read
 * Marquer une notification comme lue
 */
router.patch("/:id/read", auth, async (req, res) => {
  try {
    const notificationId = Number(req.params.id);
    if (!Number.isFinite(notificationId)) {
      return res.status(400).json({ error: "Invalid notification id" });
    }

    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId: req.user.userId },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true, readAt: new Date() },
    });

    res.json(updated);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

/**
 * POST /user/notifications/read-all
 * Marquer toutes les notifications comme lues
 */
router.post("/read-all", auth, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.userId, read: false },
      data: { read: true, readAt: new Date() },
    });

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

/**
 * DELETE /user/notifications/:id
 * Supprimer une notification
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const notificationId = Number(req.params.id);
    if (!Number.isFinite(notificationId)) {
      return res.status(400).json({ error: "Invalid notification id" });
    }

    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId: req.user.userId },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await prisma.notification.delete({ where: { id: notificationId } });

    res.json({ message: "Notification deleted" });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

/**
 * DELETE /user/notifications
 * Supprimer toutes les notifications
 */
router.delete("/", auth, async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { userId: req.user.userId },
    });

    res.json({ message: "All notifications deleted" });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to delete notifications" });
  }
});

// -------- Routes internes (appelées par d'autres services) --------

/**
 * Helper to calculate budget period (same as in budgets.js)
 */
function calculateBudgetPeriod(budget) {
  const start = budget.startDate ? new Date(budget.startDate) : new Date();
  let end = new Date(start);

  switch(budget.period) {
    case 'WEEKLY':
      end.setDate(start.getDate() + 7);
      break;
    case 'MONTHLY':
      end.setMonth(start.getMonth() + 1);
      break;
    case 'QUARTERLY':
      end.setMonth(start.getMonth() + 3);
      break;
    case 'YEARLY':
      end.setFullYear(start.getFullYear() + 1);
      break;
    case 'CUSTOM':
      end = budget.endDate ? new Date(budget.endDate) : end;
      break;
    default:
      end.setMonth(start.getMonth() + 1);
  }

  return { periodStart: start, periodEnd: end };
}

/**
 * Vérifier les budgets et créer des alertes
 * Cette fonction est appelée périodiquement (cron) ou après chaque transaction
 */
async function checkBudgetAlerts(companyId, userId) {
  try {
    // Récupérer les préférences
    const prefs = await getOrCreatePreferences(userId);
    if (!prefs.emailOnBudgetAlert && !prefs.pushOnBudgetAlert) return;

    const threshold = prefs.budgetAlertThreshold || 80;

    // Récupérer tous les budgets de l'entreprise
    const budgets = await prisma.budgets.findMany({
      where: { companyId },
      include: { category: true }
    });

    for (const budget of budgets) {
      if (!budget.amount || budget.amount <= 0) continue;

      // Calculer période actuelle
      const { periodStart, periodEnd } = calculateBudgetPeriod(budget);

      // Fetch transactions de la période
      const where = {
        account: { companyId },
        type: "debit",
        status: "CONFIRMED",
        occurredAt: { gte: periodStart, lte: periodEnd }
      };

      if (budget.categoryId) {
        where.categoryId = budget.categoryId;
      }

      const transactions = await prisma.transaction.findMany({ where });
      const currentSpending = transactions.reduce((sum, t) => sum + t.amount, 0);
      const percentageUsed = budget.amount > 0 ? (currentSpending / budget.amount) * 100 : 0;

      // Vérifier si alerte nécessaire
      const shouldAlertExceeded = percentageUsed >= 100;
      const shouldAlertWarning = percentageUsed >= threshold && percentageUsed < 100;

      if (!shouldAlertExceeded && !shouldAlertWarning) continue;

      // Vérifier si alerte déjà envoyée aujourd'hui
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const type = shouldAlertExceeded ? "BUDGET_EXCEEDED" : "BUDGET_ALERT";
      const existingAlert = await prisma.notification.findFirst({
        where: {
          userId,
          type,
          createdAt: { gte: startOfToday },
          metadata: { path: ["budgetId"], equals: budget.id }
        }
      });

      if (existingAlert) continue;

      // Créer notification
      await createNotification(
        userId,
        type,
        shouldAlertExceeded
          ? `🚨 Budget "${budget.name}" dépassé`
          : `⚠️ Budget "${budget.name}" à ${percentageUsed.toFixed(0)}%`,
        shouldAlertExceeded
          ? `Vous avez dépensé ${percentageUsed.toFixed(0)}% de votre budget (${currentSpending.toFixed(2)}€ / ${budget.amount}€).`
          : `Vous approchez de la limite de votre budget (${currentSpending.toFixed(2)}€ / ${budget.amount}€).`,
        {
          actionUrl: `/dashboard/budgets/${budget.id}`,
          metadata: { budgetId: budget.id, percentage: percentageUsed, spent: currentSpending },
          sendEmail: prefs.emailOnBudgetAlert
        }
      );
    }
  } catch (err) {
    logger.error("Failed to check budget alerts:", err);
  }
}

// Export pour usage dans d'autres modules
module.exports = router;
module.exports.createNotification = createNotification;
module.exports.checkBudgetAlerts = checkBudgetAlerts;
module.exports.sendNotificationEmail = sendNotificationEmail;
