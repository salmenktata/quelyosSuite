const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../../../middleware/auth');
const logger = console;

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/v1/finance/customers
// Créer un nouveau client
// ═══════════════════════════════════════════════════════════════════════════

router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      legalId,
      address,
      status = 'ACTIVE',
      paymentTerms = 30,
      creditLimit
    } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        legalId,
        address,
        status,
        paymentTerms,
        creditLimit,
        companyId: req.user.companyId
      }
    });

    logger.info(`✅ Customer created: ${customer.id} - ${customer.name}`);
    res.status(201).json(customer);
  } catch (err) {
    logger.error('Create customer error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/v1/finance/customers
// Liste des clients (avec filtres)
// ═══════════════════════════════════════════════════════════════════════════

router.get('/', auth, async (req, res) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;

    const where = {
      companyId: req.user.companyId
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { legalId: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: {
            select: {
              invoices: true,
              riskScores: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset)
      }),
      prisma.customer.count({ where })
    ]);

    res.json({
      customers,
      total,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (err) {
    logger.error('List customers error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/v1/finance/customers/:id
// Détail client + statistiques factures
// ═══════════════════════════════════════════════════════════════════════════

router.get('/:id', auth, async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId: req.user.companyId
      },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        riskScores: {
          where: { validUntil: { gte: new Date() } },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Calculer des statistiques
    const stats = await prisma.customerInvoice.aggregate({
      where: {
        customerId: customerId,
        status: { in: ['PAID', 'OVERDUE'] }
      },
      _sum: {
        amount: true,
        amountPaid: true,
        paymentDelay: true
      },
      _avg: {
        paymentDelay: true
      },
      _count: true
    });

    res.json({
      ...customer,
      stats: {
        totalInvoiced: stats._sum.amount || 0,
        totalPaid: stats._sum.amountPaid || 0,
        invoiceCount: stats._count,
        avgPaymentDelay: stats._avg.paymentDelay || 0
      }
    });
  } catch (err) {
    logger.error('Get customer error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PUT /api/v1/finance/customers/:id
// Modifier un client
// ═══════════════════════════════════════════════════════════════════════════

router.put('/:id', auth, async (req, res) => {
  try {
    const customerId = Number(req.params.id);
    const {
      name,
      email,
      phone,
      legalId,
      address,
      status,
      paymentTerms,
      creditLimit
    } = req.body;

    // Vérifier que le client appartient à la société
    const existing = await prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId: req.user.companyId
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name,
        email,
        phone,
        legalId,
        address,
        status,
        paymentTerms,
        creditLimit
      }
    });

    logger.info(`✅ Customer updated: ${customer.id} - ${customer.name}`);
    res.json(customer);
  } catch (err) {
    logger.error('Update customer error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /api/v1/finance/customers/:id
// Supprimer un client
// ═══════════════════════════════════════════════════════════════════════════

router.delete('/:id', auth, async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    // Vérifier que le client appartient à la société
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId: req.user.companyId
      },
      include: {
        _count: {
          select: { invoices: true }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Vérifier qu'il n'y a pas de factures liées
    if (customer._count.invoices > 0) {
      return res.status(400).json({
        error: 'Cannot delete customer with existing invoices',
        invoiceCount: customer._count.invoices
      });
    }

    await prisma.customer.delete({
      where: { id: customerId }
    });

    logger.info(`✅ Customer deleted: ${customerId}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('Delete customer error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
