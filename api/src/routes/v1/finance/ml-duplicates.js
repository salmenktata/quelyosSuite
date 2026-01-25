const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../../../middleware/auth');
const duplicateClient = require('../../../services/ml/DuplicateDetectorClient');
const logger = console;

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/v1/finance/duplicates/check
// Vérifie si une transaction est un doublon potentiel
// ═══════════════════════════════════════════════════════════════════════════

router.post('/check', auth, async (req, res) => {
  try {
    const { description, amount, date, accountId } = req.body;

    if (!description || !amount || !date || !accountId) {
      return res.status(400).json({
        error: 'description, amount, date, accountId required'
      });
    }

    // Vérifier que le compte appartient à la société de l'utilisateur
    const account = await prisma.account.findFirst({
      where: {
        id: Number(accountId),
        companyId: req.user.companyId
      }
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Récupérer transactions du même compte (30 derniers jours)
    const thirtyDaysAgo = new Date(date);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const existingTransactions = await prisma.transaction.findMany({
      where: {
        accountId: Number(accountId),
        occurredAt: {
          gte: thirtyDaysAgo,
          lte: new Date(date)
        },
        description: { not: null }
      },
      select: {
        id: true,
        description: true,
        amount: true,
        occurredAt: true
      },
      orderBy: { occurredAt: 'desc' },
      take: 100 // Limite 100 transactions max
    });

    // Appeler service ML
    const result = await duplicateClient.checkDuplicates(
      {
        description,
        amount: Number(amount),
        date,
        accountId: Number(accountId)
      },
      existingTransactions
    );

    res.json(result);
  } catch (err) {
    logger.error('Duplicate check error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/v1/finance/duplicates/:id/confirm
// Confirme qu'une transaction est un doublon (ne pas créer)
// ═══════════════════════════════════════════════════════════════════════════

router.post('/:id/confirm', auth, async (req, res) => {
  try {
    const { description, amount, occurredAt, accountId } = req.body;
    const originalTransactionId = Number(req.params.id);

    // Vérifier que la transaction originale appartient à la société
    const originalTransaction = await prisma.transaction.findFirst({
      where: {
        id: originalTransactionId,
        account: { companyId: req.user.companyId }
      }
    });

    if (!originalTransaction) {
      return res.status(404).json({ error: 'Original transaction not found' });
    }

    // Créer record de doublon confirmé
    const duplicateDetection = await prisma.duplicateDetection.create({
      data: {
        accountId: Number(accountId),
        originalTransactionId,
        description: description || null,
        amount: Number(amount),
        occurredAt: new Date(occurredAt),
        similarityScore: req.body.similarityScore || 1.0,
        status: 'CONFIRMED_DUPLICATE'
      }
    });

    res.json({
      success: true,
      message: 'Duplicate confirmed, transaction not created',
      duplicateDetection
    });
  } catch (err) {
    logger.error('Confirm duplicate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/v1/finance/duplicates/:id/ignore
// Ignore l'alerte de doublon et créera la transaction
// ═══════════════════════════════════════════════════════════════════════════

router.post('/:id/ignore', auth, async (req, res) => {
  try {
    const { description, amount, occurredAt, accountId } = req.body;
    const originalTransactionId = Number(req.params.id);

    // Créer record de doublon ignoré (transaction sera créée par l'appelant)
    const duplicateDetection = await prisma.duplicateDetection.create({
      data: {
        accountId: Number(accountId),
        originalTransactionId,
        description: description || null,
        amount: Number(amount),
        occurredAt: new Date(occurredAt),
        similarityScore: req.body.similarityScore || 0.75,
        status: 'IGNORED'
      }
    });

    res.json({
      success: true,
      message: 'Duplicate alert ignored, proceed with transaction creation',
      duplicateDetection
    });
  } catch (err) {
    logger.error('Ignore duplicate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/v1/finance/duplicates
// Liste des doublons détectés
// ═══════════════════════════════════════════════════════════════════════════

router.get('/', auth, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    const where = {
      account: { companyId: req.user.companyId }
    };

    if (status) {
      where.status = status;
    }

    const duplicates = await prisma.duplicateDetection.findMany({
      where,
      include: {
        originalTransaction: {
          select: {
            id: true,
            description: true,
            amount: true,
            occurredAt: true
          }
        },
        account: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    });

    res.json(duplicates);
  } catch (err) {
    logger.error('List duplicates error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
