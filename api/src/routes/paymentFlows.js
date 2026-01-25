const express = require('express');
const auth = require('../middleware/auth');
const prisma = require('../../prismaClient');

const router = express.Router();

// Types de flux avec métadonnées pour le frontend
const FLOW_TYPES = {
  CASH: { label: 'Espèces', icon: '💵', color: '#22c55e' },
  CARD: { label: 'Carte bancaire', icon: '💳', color: '#3b82f6' },
  CHECK: { label: 'Chèque', icon: '📝', color: '#f59e0b' },
  TRANSFER: { label: 'Virement', icon: '🔄', color: '#8b5cf6' },
  DIRECT_DEBIT: { label: 'Prélèvement', icon: '⬇️', color: '#ec4899' },
  BILL_OF_EXCHANGE: { label: 'Traite / LCR', icon: '📄', color: '#06b6d4' },
  PROMISSORY_NOTE: { label: 'Billet à ordre', icon: '📋', color: '#14b8a6' },
  BANK_CHARGE: { label: 'Frais bancaires', icon: '🏦', color: '#6b7280' },
  OTHER: { label: 'Autre', icon: '📌', color: '#9ca3af' },
};

// GET /user/flow-types - Liste des types de flux disponibles
router.get('/flow-types', auth, (req, res) => {
  res.json(FLOW_TYPES);
});

// GET /user/accounts/:accountId/flows - Liste des flux d'un compte
router.get('/accounts/:accountId/flows', auth, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { companyId } = req.user;

    // Vérifier que le compte appartient à la company
    const account = await prisma.account.findFirst({
      where: { id: parseInt(accountId), companyId },
    });

    if (!account) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    const flows = await prisma.paymentFlow.findMany({
      where: { accountId: parseInt(accountId) },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    // Calculer le solde par flux
    const flowsWithBalance = await Promise.all(
      flows.map(async (flow) => {
        const transactions = await prisma.transaction.findMany({
          where: { paymentFlowId: flow.id },
          select: { amount: true, type: true },
        });

        const balance = transactions.reduce((sum, t) => {
          return sum + (t.type === 'credit' ? t.amount : -t.amount);
        }, 0);

        return {
          ...flow,
          balance,
          transactionCount: flow._count.transactions,
          typeInfo: FLOW_TYPES[flow.type] || FLOW_TYPES.OTHER,
        };
      })
    );

    res.json(flowsWithBalance);
  } catch (error) {
    console.error('Erreur récupération flux:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /user/accounts/:accountId/flows - Créer un flux
router.post('/accounts/:accountId/flows', auth, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { companyId } = req.user;
    const { type, name, reference, limitAmount, expiresAt, color, icon, isDefault } = req.body;

    // Vérifier que le compte appartient à la company
    const account = await prisma.account.findFirst({
      where: { id: parseInt(accountId), companyId },
    });

    if (!account) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    // Validation
    if (!type || !name) {
      return res.status(400).json({ error: 'Type et nom requis' });
    }

    if (!Object.keys(FLOW_TYPES).includes(type)) {
      return res.status(400).json({ error: 'Type de flux invalide' });
    }

    // Si ce flux est par défaut, désactiver les autres
    if (isDefault) {
      await prisma.paymentFlow.updateMany({
        where: { accountId: parseInt(accountId), isDefault: true },
        data: { isDefault: false },
      });
    }

    const flow = await prisma.paymentFlow.create({
      data: {
        accountId: parseInt(accountId),
        type,
        name,
        reference: reference || null,
        limitAmount: limitAmount ? parseFloat(limitAmount) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        color: color || FLOW_TYPES[type]?.color || '#6b7280',
        icon: icon || null,
        isDefault: isDefault || false,
      },
    });

    res.status(201).json({
      ...flow,
      typeInfo: FLOW_TYPES[flow.type],
    });
  } catch (error) {
    console.error('Erreur création flux:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Un flux avec cette référence existe déjà' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /user/flows/:id - Modifier un flux
router.put('/flows/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;
    const { name, reference, limitAmount, expiresAt, color, icon, isActive, isDefault } = req.body;

    // Vérifier que le flux appartient à un compte de la company
    const existingFlow = await prisma.paymentFlow.findFirst({
      where: { id: parseInt(id) },
      include: { account: true },
    });

    if (!existingFlow || existingFlow.account.companyId !== companyId) {
      return res.status(404).json({ error: 'Flux non trouvé' });
    }

    // Si ce flux devient par défaut, désactiver les autres
    if (isDefault && !existingFlow.isDefault) {
      await prisma.paymentFlow.updateMany({
        where: { 
          accountId: existingFlow.accountId, 
          isDefault: true,
          id: { not: parseInt(id) }
        },
        data: { isDefault: false },
      });
    }

    const flow = await prisma.paymentFlow.update({
      where: { id: parseInt(id) },
      data: {
        name: name !== undefined ? name : existingFlow.name,
        reference: reference !== undefined ? reference : existingFlow.reference,
        limitAmount: limitAmount !== undefined ? (limitAmount ? parseFloat(limitAmount) : null) : existingFlow.limitAmount,
        expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : existingFlow.expiresAt,
        color: color !== undefined ? color : existingFlow.color,
        icon: icon !== undefined ? icon : existingFlow.icon,
        isActive: isActive !== undefined ? isActive : existingFlow.isActive,
        isDefault: isDefault !== undefined ? isDefault : existingFlow.isDefault,
      },
    });

    res.json({
      ...flow,
      typeInfo: FLOW_TYPES[flow.type],
    });
  } catch (error) {
    console.error('Erreur modification flux:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /user/flows/:id - Supprimer un flux
router.delete('/flows/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    // Vérifier que le flux appartient à un compte de la company
    const existingFlow = await prisma.paymentFlow.findFirst({
      where: { id: parseInt(id) },
      include: { account: true },
    });

    if (!existingFlow || existingFlow.account.companyId !== companyId) {
      return res.status(404).json({ error: 'Flux non trouvé' });
    }

    // Vérifier s'il y a des transactions liées
    const transactionCount = await prisma.transaction.count({
      where: { paymentFlowId: parseInt(id) },
    });

    if (transactionCount > 0) {
      // Option: désactiver plutôt que supprimer
      const flow = await prisma.paymentFlow.update({
        where: { id: parseInt(id) },
        data: { isActive: false },
      });
      return res.json({ 
        ...flow, 
        message: `Flux désactivé (${transactionCount} transactions liées)`,
        typeInfo: FLOW_TYPES[flow.type],
      });
    }

    await prisma.paymentFlow.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Flux supprimé', id: parseInt(id) });
  } catch (error) {
    console.error('Erreur suppression flux:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /user/flows/:id/transactions - Transactions d'un flux
router.get('/flows/:id/transactions', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;
    const { limit = 50, offset = 0 } = req.query;

    // Vérifier que le flux appartient à un compte de la company
    const flow = await prisma.paymentFlow.findFirst({
      where: { id: parseInt(id) },
      include: { account: true },
    });

    if (!flow || flow.account.companyId !== companyId) {
      return res.status(404).json({ error: 'Flux non trouvé' });
    }

    const transactions = await prisma.transaction.findMany({
      where: { paymentFlowId: parseInt(id) },
      include: {
        category: true,
        account: { select: { id: true, name: true } },
      },
      orderBy: { occurredAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.transaction.count({
      where: { paymentFlowId: parseInt(id) },
    });

    res.json({
      transactions,
      total,
      flow: {
        ...flow,
        typeInfo: FLOW_TYPES[flow.type],
      },
    });
  } catch (error) {
    console.error('Erreur récupération transactions flux:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /user/flows/:id/balance - Solde d'un flux
router.get('/flows/:id/balance', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    // Vérifier que le flux appartient à un compte de la company
    const flow = await prisma.paymentFlow.findFirst({
      where: { id: parseInt(id) },
      include: { account: true },
    });

    if (!flow || flow.account.companyId !== companyId) {
      return res.status(404).json({ error: 'Flux non trouvé' });
    }

    const transactions = await prisma.transaction.findMany({
      where: { paymentFlowId: parseInt(id) },
      select: { amount: true, type: true },
    });

    const credits = transactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    const debits = transactions
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      flowId: parseInt(id),
      flowName: flow.name,
      flowType: flow.type,
      typeInfo: FLOW_TYPES[flow.type],
      balance: credits - debits,
      credits,
      debits,
      transactionCount: transactions.length,
    });
  } catch (error) {
    console.error('Erreur calcul solde flux:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
