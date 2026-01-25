const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../../../middleware/auth');
const budgetOptimizerClient = require('../../../services/ml/BudgetOptimizerClient');
const logger = console;

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/v1/finance/budgets/:id/recommendation
// Obtenir la recommandation de budget pour une catégorie
// ═══════════════════════════════════════════════════════════════════════════

router.get('/:budgetId/recommendation', auth, async (req, res) => {
  try {
    const budgetId = Number(req.params.budgetId);

    // Vérifier que le budget appartient à la société
    const budget = await prisma.budgets.findFirst({
      where: {
        id: budgetId,
        companyId: req.user.companyId
      },
      include: {
        category: true
      }
    });

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    // Vérifier si une recommandation récente existe déjà
    const existingRecommendation = await prisma.budgetRecommendation.findFirst({
      where: {
        budgetId: budgetId,
        validUntil: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (existingRecommendation) {
      logger.info(`Returning cached recommendation for budget ${budgetId}`);
      return res.json(existingRecommendation);
    }

    // Récupérer les transactions des 12 derniers mois pour cette catégorie
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const transactions = await prisma.transaction.findMany({
      where: {
        account: { companyId: req.user.companyId },
        categoryId: budget.categoryId,
        occurredAt: { gte: twelveMonthsAgo }
      },
      select: {
        amount: true,
        occurredAt: true
      },
      orderBy: { occurredAt: 'desc' }
    });

    // Minimum 3 transactions requises
    if (transactions.length < 3) {
      return res.status(400).json({
        error: 'Insufficient data for recommendation',
        minimum: 3,
        current: transactions.length,
        message: 'Au moins 3 transactions sont nécessaires pour générer une recommandation'
      });
    }

    // Appeler le service ML
    const recommendation = await budgetOptimizerClient.recommendBudget(
      req.user.companyId,
      budget.categoryId,
      transactions.map(tx => ({
        amount: Math.abs(tx.amount),
        date: tx.occurredAt.toISOString()
      })),
      12 // 12 mois
    );

    if (!recommendation) {
      return res.status(503).json({
        error: 'Budget optimization service unavailable',
        message: 'Le service de recommandation est temporairement indisponible'
      });
    }

    // Sauvegarder la recommandation en DB
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7); // Valide 7 jours

    const savedRecommendation = await prisma.budgetRecommendation.create({
      data: {
        budgetId: budgetId,
        categoryId: budget.categoryId,
        companyId: req.user.companyId,
        recommendedAmount: recommendation.recommended_amount,
        confidence: recommendation.confidence,
        seasonalPattern: recommendation.seasonal_pattern,
        breakdown: recommendation.breakdown,
        seasonalFactors: recommendation.seasonal_factors,
        analysisMonths: recommendation.analysis_months,
        validUntil: validUntil
      }
    });

    logger.info(
      `✅ Budget recommendation generated - Budget: ${budgetId}, ` +
      `Amount: ${recommendation.recommended_amount}, Confidence: ${recommendation.confidence}%`
    );

    res.json(savedRecommendation);
  } catch (err) {
    logger.error('Budget recommendation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/v1/finance/budgets/:id/apply-recommendation
// Appliquer la recommandation au budget
// ═══════════════════════════════════════════════════════════════════════════

router.post('/:budgetId/apply-recommendation', auth, async (req, res) => {
  try {
    const budgetId = Number(req.params.budgetId);

    // Vérifier que le budget appartient à la société
    const budget = await prisma.budgets.findFirst({
      where: {
        id: budgetId,
        companyId: req.user.companyId
      }
    });

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    // Récupérer la dernière recommandation valide
    const recommendation = await prisma.budgetRecommendation.findFirst({
      where: {
        budgetId: budgetId,
        validUntil: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!recommendation) {
      return res.status(404).json({
        error: 'No valid recommendation found',
        message: 'Générez d\'abord une recommandation'
      });
    }

    // Mettre à jour le budget
    const updatedBudget = await prisma.budgets.update({
      where: { id: budgetId },
      data: {
        amount: recommendation.recommendedAmount
      }
    });

    logger.info(
      `✅ Budget ${budgetId} updated with recommendation: ${recommendation.recommendedAmount}`
    );

    res.json({
      success: true,
      budget: updatedBudget,
      recommendation: recommendation
    });
  } catch (err) {
    logger.error('Apply recommendation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/v1/finance/budget-recommendations/category/:categoryId
// Obtenir une recommandation pour une catégorie (sans budget existant)
// ═══════════════════════════════════════════════════════════════════════════

router.get('/category/:categoryId', auth, async (req, res) => {
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

    // Récupérer les transactions des 12 derniers mois
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const transactions = await prisma.transaction.findMany({
      where: {
        account: { companyId: req.user.companyId },
        categoryId: categoryId,
        occurredAt: { gte: twelveMonthsAgo }
      },
      select: {
        amount: true,
        occurredAt: true
      },
      orderBy: { occurredAt: 'desc' }
    });

    if (transactions.length < 3) {
      return res.status(400).json({
        error: 'Insufficient data',
        minimum: 3,
        current: transactions.length
      });
    }

    // Appeler le service ML
    const recommendation = await budgetOptimizerClient.recommendBudget(
      req.user.companyId,
      categoryId,
      transactions.map(tx => ({
        amount: Math.abs(tx.amount),
        date: tx.occurredAt.toISOString()
      })),
      12
    );

    if (!recommendation) {
      return res.status(503).json({
        error: 'Service unavailable'
      });
    }

    res.json({
      categoryId,
      categoryName: category.name,
      recommendation
    });
  } catch (err) {
    logger.error('Category recommendation error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
