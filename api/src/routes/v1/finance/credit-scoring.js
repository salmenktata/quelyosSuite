const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../../../middleware/auth');
const creditScoringClient = require('../../../services/ml/CreditScoringClient');
const logger = console;

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/v1/finance/credit-scoring/customers/:id/risk-score
// Obtenir le score de risque d'un client
// ═══════════════════════════════════════════════════════════════════════════

router.get('/customers/:customerId/risk-score', auth, async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);

    // Vérifier que le client appartient à la société
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId: req.user.companyId
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Vérifier si un score récent existe déjà
    const existingScore = await prisma.customerRiskScore.findFirst({
      where: {
        customerId: customerId,
        validUntil: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (existingScore) {
      logger.info(`Returning cached risk score for customer ${customerId}`);
      return res.json(existingScore);
    }

    // Récupérer l'historique des factures
    const invoices = await prisma.customerInvoice.findMany({
      where: {
        customerId: customerId,
        status: { in: ['PAID', 'OVERDUE', 'SENT'] }
      },
      select: {
        amount: true,
        dueDate: true,
        paidDate: true,
        paymentDelay: true,
        status: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Minimum 5 factures requises
    if (invoices.length < 5) {
      return res.status(400).json({
        error: 'Insufficient invoice history for credit scoring',
        minimum: 5,
        current: invoices.length,
        message: 'Au moins 5 factures sont nécessaires pour évaluer le risque'
      });
    }

    // Appeler le service ML
    const score = await creditScoringClient.scoreCustomer(
      customerId,
      req.user.companyId,
      invoices.map(inv => ({
        amount: inv.amount,
        dueDate: inv.dueDate.toISOString(),
        paidDate: inv.paidDate ? inv.paidDate.toISOString() : null,
        paymentDelay: inv.paymentDelay,
        status: inv.status
      }))
    );

    if (!score) {
      return res.status(503).json({
        error: 'Credit scoring service unavailable',
        message: 'Le service d\'évaluation de risque est temporairement indisponible'
      });
    }

    // Sauvegarder le score en DB
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + 1); // Valide 1 mois

    const savedScore = await prisma.customerRiskScore.create({
      data: {
        customerId: customerId,
        score: score.score,
        riskLevel: score.risk_level,
        predictedDelay: score.predicted_delay,
        confidence: score.confidence,
        features: score.features,
        recommendation: score.recommendation,
        modelVersion: score.model_version || '1.0',
        validUntil: validUntil
      }
    });

    logger.info(
      `✅ Credit score generated - Customer: ${customerId}, ` +
      `Score: ${score.score.toFixed(1)}, Risk: ${score.risk_level}`
    );

    res.json(savedScore);
  } catch (err) {
    logger.error('Get credit score error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/v1/finance/credit-scoring/customers/:id/risk-score/refresh
// Recalculer le score de risque
// ═══════════════════════════════════════════════════════════════════════════

router.post('/customers/:customerId/risk-score/refresh', auth, async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);

    // Vérifier que le client appartient à la société
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId: req.user.companyId
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Clear cache
    creditScoringClient.clearCache(req.user.companyId, customerId);

    // Récupérer factures
    const invoices = await prisma.customerInvoice.findMany({
      where: {
        customerId: customerId,
        status: { in: ['PAID', 'OVERDUE', 'SENT'] }
      },
      select: {
        amount: true,
        dueDate: true,
        paidDate: true,
        paymentDelay: true,
        status: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (invoices.length < 5) {
      return res.status(400).json({
        error: 'Insufficient invoice history',
        minimum: 5,
        current: invoices.length
      });
    }

    // Appeler le service ML
    const score = await creditScoringClient.scoreCustomer(
      customerId,
      req.user.companyId,
      invoices.map(inv => ({
        amount: inv.amount,
        dueDate: inv.dueDate.toISOString(),
        paidDate: inv.paidDate ? inv.paidDate.toISOString() : null,
        paymentDelay: inv.paymentDelay,
        status: inv.status
      }))
    );

    if (!score) {
      return res.status(503).json({ error: 'Service unavailable' });
    }

    // Sauvegarder le nouveau score
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + 1);

    const savedScore = await prisma.customerRiskScore.create({
      data: {
        customerId: customerId,
        score: score.score,
        riskLevel: score.risk_level,
        predictedDelay: score.predicted_delay,
        confidence: score.confidence,
        features: score.features,
        recommendation: score.recommendation,
        modelVersion: score.model_version || '1.0',
        validUntil: validUntil
      }
    });

    logger.info(`✅ Credit score refreshed - Customer: ${customerId}`);
    res.json(savedScore);
  } catch (err) {
    logger.error('Refresh credit score error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/v1/finance/credit-scoring/high-risk
// Liste des clients à risque élevé
// ═══════════════════════════════════════════════════════════════════════════

router.get('/high-risk', auth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Récupérer tous les clients avec leur score le plus récent
    const customers = await prisma.customer.findMany({
      where: {
        companyId: req.user.companyId,
        status: 'ACTIVE',
        riskScores: {
          some: {
            validUntil: { gte: new Date() },
            riskLevel: { in: ['HIGH', 'CRITICAL'] }
          }
        }
      },
      include: {
        riskScores: {
          where: { validUntil: { gte: new Date() } },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: {
            invoices: {
              where: { status: 'OVERDUE' }
            }
          }
        }
      },
      orderBy: {
        riskScores: {
          _count: 'desc'
        }
      },
      take: Number(limit)
    });

    // Flatten pour faciliter l'utilisation côté front
    const highRiskCustomers = customers.map(customer => ({
      ...customer,
      latestScore: customer.riskScores[0] || null,
      overdueInvoices: customer._count.invoices
    }));

    res.json(highRiskCustomers);
  } catch (err) {
    logger.error('List high-risk customers error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
