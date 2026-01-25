const express = require('express');
const router = express.Router();
const { PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../../../middleware/auth');
const logger = console;

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/v1/finance/customer-invoices
// Créer une nouvelle facture client
// ═══════════════════════════════════════════════════════════════════════════

router.post('/', auth, async (req, res) => {
  try {
    const {
      customerId,
      invoiceNumber,
      reference,
      amount,
      currency = 'EUR',
      issuedDate,
      dueDate,
      notes
    } = req.body;

    // Validation
    if (!customerId || !amount || !dueDate) {
      return res.status(400).json({
        error: 'customerId, amount, and dueDate are required'
      });
    }

    // Vérifier que le client appartient à la société
    const customer = await prisma.customer.findFirst({
      where: {
        id: Number(customerId),
        companyId: req.user.companyId
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Générer numéro de facture si non fourni
    const finalInvoiceNumber = invoiceNumber || `INV-${Date.now()}`;

    const invoice = await prisma.customerInvoice.create({
      data: {
        customerId: Number(customerId),
        invoiceNumber: finalInvoiceNumber,
        reference,
        amount: Number(amount),
        amountRemaining: Number(amount),
        currency,
        issuedDate: issuedDate ? new Date(issuedDate) : new Date(),
        dueDate: new Date(dueDate),
        notes
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            paymentTerms: true
          }
        }
      }
    });

    logger.info(`✅ Customer invoice created: ${invoice.invoiceNumber} for ${customer.name}`);
    res.status(201).json(invoice);
  } catch (err) {
    logger.error('Create customer invoice error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/v1/finance/customer-invoices
// Liste des factures (avec filtres)
// ═══════════════════════════════════════════════════════════════════════════

router.get('/', auth, async (req, res) => {
  try {
    const { customerId, status, overdue, limit = 50, offset = 0 } = req.query;

    const where = {
      customer: {
        companyId: req.user.companyId
      }
    };

    if (customerId) {
      where.customerId = Number(customerId);
    }

    if (status) {
      where.status = status;
    }

    if (overdue === 'true') {
      where.status = 'OVERDUE';
    }

    const [invoices, total] = await Promise.all([
      prisma.customerInvoice.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset)
      }),
      prisma.customerInvoice.count({ where })
    ]);

    res.json({
      invoices,
      total,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (err) {
    logger.error('List customer invoices error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/v1/finance/customer-invoices/:id
// Détail facture
// ═══════════════════════════════════════════════════════════════════════════

router.get('/:id', auth, async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);

    const invoice = await prisma.customerInvoice.findFirst({
      where: {
        id: invoiceId,
        customer: {
          companyId: req.user.companyId
        }
      },
      include: {
        customer: true,
        transaction: {
          select: {
            id: true,
            amount: true,
            occurredAt: true,
            description: true
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (err) {
    logger.error('Get customer invoice error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PUT /api/v1/finance/customer-invoices/:id
// Modifier une facture
// ═══════════════════════════════════════════════════════════════════════════

router.put('/:id', auth, async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);
    const {
      reference,
      amount,
      amountPaid,
      dueDate,
      status,
      notes
    } = req.body;

    // Vérifier que la facture appartient à la société
    const existing = await prisma.customerInvoice.findFirst({
      where: {
        id: invoiceId,
        customer: {
          companyId: req.user.companyId
        }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const updateData = {};
    if (reference !== undefined) updateData.reference = reference;
    if (amount !== undefined) {
      updateData.amount = Number(amount);
      updateData.amountRemaining = Number(amount) - (amountPaid || existing.amountPaid);
    }
    if (amountPaid !== undefined) {
      updateData.amountPaid = Number(amountPaid);
      updateData.amountRemaining = (amount || existing.amount) - Number(amountPaid);
    }
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const invoice = await prisma.customerInvoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    logger.info(`✅ Customer invoice updated: ${invoice.invoiceNumber}`);
    res.json(invoice);
  } catch (err) {
    logger.error('Update customer invoice error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/v1/finance/customer-invoices/:id/mark-paid
// Marquer une facture comme payée et créer la transaction
// ═══════════════════════════════════════════════════════════════════════════

router.post('/:id/mark-paid', auth, async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);
    const { paidDate, accountId } = req.body;

    // Vérifier que la facture appartient à la société
    const invoice = await prisma.customerInvoice.findFirst({
      where: {
        id: invoiceId,
        customer: {
          companyId: req.user.companyId
        }
      },
      include: {
        customer: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'PAID') {
      return res.status(400).json({ error: 'Invoice already paid' });
    }

    const paidAt = paidDate ? new Date(paidDate) : new Date();
    const delay = Math.floor((paidAt - invoice.dueDate) / (1000 * 60 * 60 * 24));

    // Créer transaction si accountId fourni
    let transaction = null;
    if (accountId) {
      transaction = await prisma.transaction.create({
        data: {
          accountId: Number(accountId),
          amount: invoice.amount,
          description: `Paiement facture ${invoice.invoiceNumber} - ${invoice.customer.name}`,
          occurredAt: paidAt,
          kind: 'CREDIT'
        }
      });
    }

    // Mettre à jour la facture
    const updatedInvoice = await prisma.customerInvoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        amountPaid: invoice.amount,
        amountRemaining: 0,
        paidDate: paidAt,
        paymentDelay: delay,
        transactionId: transaction?.id
      },
      include: {
        customer: true,
        transaction: true
      }
    });

    logger.info(`✅ Invoice ${invoice.invoiceNumber} marked as paid (delay: ${delay} days)`);
    res.json(updatedInvoice);
  } catch (err) {
    logger.error('Mark invoice paid error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /api/v1/finance/customer-invoices/:id
// Supprimer une facture
// ═══════════════════════════════════════════════════════════════════════════

router.delete('/:id', auth, async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);

    // Vérifier que la facture appartient à la société
    const invoice = await prisma.customerInvoice.findFirst({
      where: {
        id: invoiceId,
        customer: {
          companyId: req.user.companyId
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Ne pas permettre la suppression si payée
    if (invoice.status === 'PAID') {
      return res.status(400).json({
        error: 'Cannot delete paid invoice'
      });
    }

    await prisma.customerInvoice.delete({
      where: { id: invoiceId }
    });

    logger.info(`✅ Customer invoice deleted: ${invoiceId}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('Delete customer invoice error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
