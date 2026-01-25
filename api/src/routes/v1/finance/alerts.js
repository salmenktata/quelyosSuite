/**
 * F93 — Routes API pour les alertes de trésorerie
 *
 * CRUD complet + test dry-run
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../../../middleware/auth');
const alertEvaluator = require('../../../services/alert-evaluator.service');
const alertNotifier = require('../../../services/alert-notifier.service');
const logger = require('../../../../logger');

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/v1/finance/alerts - Liste des alertes
// ═══════════════════════════════════════════════════════════════════════════

router.get('/', auth, async (req, res) => {
  try {
    const alerts = await prisma.cashAlert.findMany({
      where: { companyId: req.user.companyId },
      include: {
        triggers: {
          orderBy: { triggeredAt: 'desc' },
          take: 5 // Derniers 5 déclenchements
        },
        _count: {
          select: { triggers: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ alerts });
  } catch (err) {
    logger.error('Failed to fetch alerts:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/v1/finance/alerts/:id - Détails d'une alerte
// ═══════════════════════════════════════════════════════════════════════════

router.get('/:id', auth, async (req, res) => {
  try {
    const alert = await prisma.cashAlert.findUnique({
      where: {
        id: Number(req.params.id),
        companyId: req.user.companyId // Sécurité : vérifier que l'alerte appartient à la société
      },
      include: {
        triggers: {
          orderBy: { triggeredAt: 'desc' },
          take: 20
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ alert });
  } catch (err) {
    logger.error('Failed to fetch alert:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/v1/finance/alerts - Créer une alerte
// ═══════════════════════════════════════════════════════════════════════════

router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      type,
      thresholdAmount,
      horizonDays,
      compareOperator,
      cooldownHours,
      emailEnabled,
      emailRecipients
    } = req.body;

    // Validation basique
    if (!name || !type) {
      return res.status(400).json({ error: 'name and type are required' });
    }

    if (!['THRESHOLD', 'NEGATIVE_FORECAST', 'VARIANCE'].includes(type)) {
      return res.status(400).json({ error: 'Invalid alert type' });
    }

    if (type === 'THRESHOLD' && !thresholdAmount) {
      return res.status(400).json({ error: 'thresholdAmount is required for THRESHOLD alerts' });
    }

    if (type === 'NEGATIVE_FORECAST' && !horizonDays) {
      return res.status(400).json({ error: 'horizonDays is required for NEGATIVE_FORECAST alerts' });
    }

    // Créer l'alerte
    const alert = await prisma.cashAlert.create({
      data: {
        userId: req.user.id,
        companyId: req.user.companyId,
        name,
        type,
        thresholdAmount: thresholdAmount || null,
        horizonDays: horizonDays || null,
        compareOperator: compareOperator || 'lt',
        cooldownHours: cooldownHours || 24,
        isActive: true,
        emailEnabled: emailEnabled !== undefined ? emailEnabled : true,
        emailRecipients: emailRecipients || []
      }
    });

    logger.info(`Alert created:`, {
      alertId: alert.id,
      userId: req.user.id,
      companyId: req.user.companyId,
      type: alert.type
    });

    res.status(201).json({ alert });
  } catch (err) {
    logger.error('Failed to create alert:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /api/v1/finance/alerts/:id - Modifier une alerte
// ═══════════════════════════════════════════════════════════════════════════

router.patch('/:id', auth, async (req, res) => {
  try {
    const alertId = Number(req.params.id);

    // Vérifier que l'alerte existe et appartient à la société
    const existingAlert = await prisma.cashAlert.findUnique({
      where: { id: alertId }
    });

    if (!existingAlert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    if (existingAlert.companyId !== req.user.companyId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Mettre à jour
    const alert = await prisma.cashAlert.update({
      where: { id: alertId },
      data: req.body
    });

    logger.info(`Alert updated:`, {
      alertId: alert.id,
      userId: req.user.id,
      updates: Object.keys(req.body)
    });

    res.json({ alert });
  } catch (err) {
    logger.error('Failed to update alert:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /api/v1/finance/alerts/:id - Supprimer une alerte
// ═══════════════════════════════════════════════════════════════════════════

router.delete('/:id', auth, async (req, res) => {
  try {
    const alertId = Number(req.params.id);

    // Vérifier que l'alerte existe et appartient à la société
    const existingAlert = await prisma.cashAlert.findUnique({
      where: { id: alertId }
    });

    if (!existingAlert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    if (existingAlert.companyId !== req.user.companyId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Supprimer (cascade automatique des triggers grâce à Prisma)
    await prisma.cashAlert.delete({
      where: { id: alertId }
    });

    logger.info(`Alert deleted:`, {
      alertId,
      userId: req.user.id
    });

    res.json({ success: true });
  } catch (err) {
    logger.error('Failed to delete alert:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/v1/finance/alerts/:id/test - Tester une alerte (dry-run)
// ═══════════════════════════════════════════════════════════════════════════

router.post('/:id/test', auth, async (req, res) => {
  try {
    const alertId = Number(req.params.id);

    // Récupérer l'alerte avec relations
    const alert = await prisma.cashAlert.findUnique({
      where: { id: alertId },
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true }
        },
        triggers: {
          orderBy: { triggeredAt: 'desc' },
          take: 1
        }
      }
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    if (alert.companyId !== req.user.companyId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Évaluer sans créer de trigger
    const result = await alertEvaluator.evaluate(alert);

    // Formatter la réponse
    let message;
    if (result.shouldTrigger) {
      message = `✅ Cette alerte serait déclenchée avec les données actuelles.`;
    } else if (result.reason === 'cooldown') {
      const lastTrigger = alert.triggers[0];
      const nextTriggerTime = new Date(
        new Date(lastTrigger.triggeredAt).getTime() +
        alert.cooldownHours * 60 * 60 * 1000
      );
      message = `⏳ Cette alerte est en cooldown. Prochaine évaluation possible : ${nextTriggerTime.toLocaleString('fr-FR')}`;
    } else {
      message = `ℹ️ Cette alerte ne serait pas déclenchée (condition non remplie).`;
    }

    res.json({
      shouldTrigger: result.shouldTrigger,
      reason: result.reason || null,
      context: result.context,
      message
    });

    logger.info(`Alert tested:`, {
      alertId,
      shouldTrigger: result.shouldTrigger,
      reason: result.reason
    });

  } catch (err) {
    logger.error('Failed to test alert:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/v1/finance/alerts/history - Historique des déclenchements
// ═══════════════════════════════════════════════════════════════════════════

router.get('/history/all', auth, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    // Récupérer tous les triggers pour les alertes de la société
    const alerts = await prisma.cashAlert.findMany({
      where: { companyId: req.user.companyId },
      select: { id: true }
    });

    const alertIds = alerts.map(a => a.id);

    const triggers = await prisma.alertTrigger.findMany({
      where: {
        alertId: { in: alertIds }
      },
      include: {
        alert: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: { triggeredAt: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    });

    const total = await prisma.alertTrigger.count({
      where: {
        alertId: { in: alertIds }
      }
    });

    res.json({
      triggers,
      total,
      limit: Number(limit),
      offset: Number(offset)
    });

  } catch (err) {
    logger.error('Failed to fetch alert history:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
