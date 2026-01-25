const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../../../middleware/auth');
const anomalyClient = require('../../../services/ml/AnomalyDetectorClient');
const logger = console;

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/v1/finance/anomalies/detect
// Détecte les anomalies dans les transactions récentes
// ═══════════════════════════════════════════════════════════════════════════

router.post('/detect', auth, async (req, res) => {
  try {
    const { days = 7 } = req.body;

    // Récupérer transactions récentes avec catégorie
    const since = new Date();
    since.setDate(since.getDate() - days);

    const transactions = await prisma.transaction.findMany({
      where: {
        account: { companyId: req.user.companyId },
        categoryId: { not: null },
        occurredAt: { gte: since }
      },
      select: {
        id: true,
        amount: true,
        occurredAt: true,
        categoryId: true
      },
      orderBy: { occurredAt: 'desc' }
    });

    // Appeler service ML
    const result = await anomalyClient.detect(req.user.companyId, transactions);

    res.json(result);
  } catch (err) {
    logger.error('Anomaly detection error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/v1/finance/anomalies/train/:categoryId
// Entraîne le modèle pour une catégorie
// ═══════════════════════════════════════════════════════════════════════════

router.post('/train/:categoryId', auth, async (req, res) => {
  try {
    const categoryId = Number(req.params.categoryId);

    // Vérifier que la catégorie appartient à la société
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        companyId: req.user.companyId
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Récupérer transactions de cette catégorie (90 derniers jours)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const transactions = await prisma.transaction.findMany({
      where: {
        account: { companyId: req.user.companyId },
        categoryId,
        occurredAt: { gte: ninetyDaysAgo }
      },
      select: {
        amount: true,
        occurredAt: true
      },
      orderBy: { occurredAt: 'desc' },
      take: 1000
    });

    if (transactions.length < 50) {
      return res.status(400).json({
        error: 'Minimum 50 transactions required for training',
        current: transactions.length
      });
    }

    // Entraîner modèle
    const result = await anomalyClient.train(
      req.user.companyId,
      categoryId,
      transactions,
      req.body.force_retrain || false
    );

    res.json(result);
  } catch (err) {
    logger.error('Anomaly training error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/v1/finance/anomalies
// Liste des anomalies enregistrées
// ═══════════════════════════════════════════════════════════════════════════

router.get('/', auth, async (req, res) => {
  try {
    const { dismissed, limit = 50 } = req.query;

    const where = {
      transaction: {
        account: { companyId: req.user.companyId }
      }
    };

    if (dismissed !== undefined) {
      where.dismissed = dismissed === 'true';
    }

    const anomalies = await prisma.transactionAnomaly.findMany({
      where,
      include: {
        transaction: {
          select: {
            id: true,
            amount: true,
            description: true,
            occurredAt: true,
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    });

    res.json(anomalies);
  } catch (err) {
    logger.error('List anomalies error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /api/v1/finance/anomalies/:id/dismiss
// Marquer une anomalie comme ignorée
// ═══════════════════════════════════════════════════════════════════════════

router.patch('/:id/dismiss', auth, async (req, res) => {
  try {
    const anomalyId = Number(req.params.id);

    // Vérifier que l'anomalie appartient à la société
    const anomaly = await prisma.transactionAnomaly.findFirst({
      where: {
        id: anomalyId,
        transaction: {
          account: { companyId: req.user.companyId }
        }
      }
    });

    if (!anomaly) {
      return res.status(404).json({ error: 'Anomaly not found' });
    }

    // Marquer comme dismissed
    const updated = await prisma.transactionAnomaly.update({
      where: { id: anomalyId },
      data: { dismissed: true }
    });

    res.json(updated);
  } catch (err) {
    logger.error('Dismiss anomaly error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
