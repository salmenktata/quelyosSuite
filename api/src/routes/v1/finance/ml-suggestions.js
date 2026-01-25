const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../../../middleware/auth');
const categorizerClient = require('../../../services/ml/CategorizerClient');
const logger = console;

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/v1/finance/suggestions/categorize
// Suggère des catégories pour une transaction
// ═══════════════════════════════════════════════════════════════════════════

router.post('/categorize', auth, async (req, res) => {
  try {
    const { description, amount, type, paymentFlowType } = req.body;

    if (!description || !amount || !type) {
      return res.status(400).json({ error: 'description, amount, type required' });
    }

    const result = await categorizerClient.categorize(
      req.user.companyId,
      { description, amount, type, paymentFlowType }
    );

    res.json(result);
  } catch (err) {
    logger.error('Categorization error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/v1/finance/suggestions/train
// Entraîne le modèle de catégorisation
// ═══════════════════════════════════════════════════════════════════════════

router.post('/train', auth, async (req, res) => {
  try {
    // Récupérer toutes les transactions catégorisées de la société
    const transactions = await prisma.transaction.findMany({
      where: {
        account: { companyId: req.user.companyId },
        categoryId: { not: null },
        description: { not: null }
      },
      include: {
        category: { select: { id: true, name: true } },
        paymentFlow: { select: { type: true } }
      },
      orderBy: { occurredAt: 'desc' },
      take: 10000 // Limite 10k transactions
    });

    if (transactions.length < 100) {
      return res.status(400).json({
        error: 'Minimum 100 categorized transactions required',
        current: transactions.length
      });
    }

    // Préparer données pour training
    const trainingData = transactions.map(tx => ({
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      categoryId: tx.categoryId,
      categoryName: tx.category.name,
      paymentFlowType: tx.paymentFlow?.type || null
    }));

    const result = await categorizerClient.train(
      req.user.companyId,
      trainingData,
      req.body.force_retrain || false
    );

    res.json(result);
  } catch (err) {
    logger.error('Training error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/v1/finance/suggestions/accept
// Enregistre l'acceptation d'une suggestion
// ═══════════════════════════════════════════════════════════════════════════

router.post('/accept', auth, async (req, res) => {
  try {
    const { transactionId, suggestedCategoryId, confidence } = req.body;

    // Vérifier que la transaction appartient à la société
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        account: { companyId: req.user.companyId }
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Créer record de suggestion acceptée
    const suggestion = await prisma.categorySuggestion.create({
      data: {
        transactionId,
        suggestedCategoryId,
        confidence,
        accepted: true,
        userId: req.user.id
      }
    });

    // Mettre à jour la transaction
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { categoryId: suggestedCategoryId }
    });

    res.json({ success: true, suggestion });
  } catch (err) {
    logger.error('Accept suggestion error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/v1/finance/suggestions/reject
// Enregistre le rejet d'une suggestion
// ═══════════════════════════════════════════════════════════════════════════

router.post('/reject', auth, async (req, res) => {
  try {
    const { transactionId, suggestedCategoryId, confidence, correctCategoryId } = req.body;

    const suggestion = await prisma.categorySuggestion.create({
      data: {
        transactionId,
        suggestedCategoryId,
        confidence,
        accepted: false,
        correctCategoryId,
        userId: req.user.id
      }
    });

    res.json({ success: true, suggestion });
  } catch (err) {
    logger.error('Reject suggestion error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
