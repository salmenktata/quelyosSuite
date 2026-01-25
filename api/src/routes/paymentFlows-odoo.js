/**
 * Payment Flows Routes - Odoo Integration (Double Write Strategy)
 *
 * Maps to quelyos.payment.flow model
 */

const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { OdooRPC } = require("@quelyos/odoo");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const { getOdooId, getPrismaId, storeMapping, getOdooCompanyId } = require("../utils/odoo-mapping");

const odoo = new OdooRPC(process.env.ODOO_URL || 'http://localhost:8069');

/**
 * Map Prisma FlowType to Odoo flow_type
 */
function mapFlowType(prismaType) {
  const mapping = {
    'CASH': 'cash',
    'CARD': 'card',
    'CHECK': 'check',
    'TRANSFER': 'transfer',
    'DIRECT_DEBIT': 'direct_debit',
    'BILL_OF_EXCHANGE': 'bill_of_exchange',
    'PROMISSORY_NOTE': 'promissory_note',
    'BANK_CHARGE': 'bank_charge',
    'OTHER': 'other'
  };
  return mapping[prismaType] || 'other';
}

/**
 * Reverse map Odoo flow_type to Prisma FlowType
 */
function reverseMapFlowType(odooType) {
  const reverseMapping = {
    'cash': 'CASH',
    'card': 'CARD',
    'check': 'CHECK',
    'transfer': 'TRANSFER',
    'direct_debit': 'DIRECT_DEBIT',
    'bill_of_exchange': 'BILL_OF_EXCHANGE',
    'promissory_note': 'PROMISSORY_NOTE',
    'bank_charge': 'BANK_CHARGE',
    'other': 'OTHER'
  };
  return reverseMapping[odooType] || 'OTHER';
}

// ---------- CREATE PAYMENT FLOW (DOUBLE WRITE) ----------
router.post("/", auth, async (req, res) => {
  try {
    const {
      accountId,
      type,
      name,
      isActive,
      isDefault,
      reference,
      limitAmount,
      expiresAt,
      color,
      icon
    } = req.body;

    if (!accountId || !type || !name?.trim()) {
      return res.status(400).json({ error: "accountId, type, and name are required" });
    }

    // Verify account ownership
    const account = await prisma.account.findFirst({
      where: {
        id: Number(accountId),
        companyId: req.user.companyId
      }
    });

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    // STEP 1: Create in Prisma
    const prismaFlow = await prisma.paymentFlow.create({
      data: {
        accountId: Number(accountId),
        type: type,
        name: name.trim(),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        isDefault: isDefault !== undefined ? Boolean(isDefault) : false,
        reference: reference || null,
        limitAmount: limitAmount ? parseFloat(limitAmount) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        color: color || null,
        icon: icon || null
      }
    });

    // STEP 2: Create in Odoo
    try {
      const odooAccountId = await getOdooId('Account', accountId);

      if (odooAccountId) {
        const odooFlow = await odoo.create('quelyos.payment.flow', {
          account_id: odooAccountId,
          flow_type: mapFlowType(type),
          name: name.trim(),
          is_active: isActive !== undefined ? Boolean(isActive) : true,
          is_default: isDefault !== undefined ? Boolean(isDefault) : false,
          reference: reference || false,
          limit_amount: limitAmount ? parseFloat(limitAmount) : 0,
          expires_at: expiresAt || false,
          color: color || '#6366F1',
          icon: icon || 'payment'
        });

        if (odooFlow && odooFlow.id) {
          await storeMapping('PaymentFlow', prismaFlow.id, 'quelyos.payment.flow', odooFlow.id);
          logger.info(`[PaymentFlows] Created: Prisma#${prismaFlow.id} <-> Odoo#${odooFlow.id}`);
        }
      }

    } catch (odooError) {
      logger.error(`[PaymentFlows] Odoo creation failed:`, odooError);
    }

    res.json(prismaFlow);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Payment flow creation failed" });
  }
});

// ---------- LIST PAYMENT FLOWS ----------
router.get("/", auth, async (req, res) => {
  try {
    const { accountId } = req.query;

    const where = {
      account: { companyId: req.user.companyId }
    };

    if (accountId) {
      where.accountId = Number(accountId);
    }

    const flows = await prisma.paymentFlow.findMany({
      where,
      include: {
        account: true
      },
      orderBy: [
        { accountId: 'asc' },
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json(flows);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Could not fetch payment flows" });
  }
});

// ---------- UPDATE PAYMENT FLOW (DOUBLE WRITE) ----------
router.put("/:id", auth, async (req, res) => {
  try {
    const flowId = Number(req.params.id);

    // Check ownership via account
    const existing = await prisma.paymentFlow.findFirst({
      where: {
        id: flowId,
        account: { companyId: req.user.companyId }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: "Payment flow not found" });
    }

    // STEP 1: Update Prisma
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name.trim();
    if (req.body.isActive !== undefined) updateData.isActive = Boolean(req.body.isActive);
    if (req.body.isDefault !== undefined) updateData.isDefault = Boolean(req.body.isDefault);
    if (req.body.reference !== undefined) updateData.reference = req.body.reference;
    if (req.body.limitAmount !== undefined) updateData.limitAmount = req.body.limitAmount ? parseFloat(req.body.limitAmount) : null;
    if (req.body.expiresAt !== undefined) updateData.expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
    if (req.body.color !== undefined) updateData.color = req.body.color;
    if (req.body.icon !== undefined) updateData.icon = req.body.icon;

    const updated = await prisma.paymentFlow.update({
      where: { id: flowId },
      data: updateData
    });

    // STEP 2: Update Odoo
    try {
      const odooId = await getOdooId('PaymentFlow', flowId);
      if (odooId) {
        const odooUpdateData = {};
        if (req.body.name) odooUpdateData.name = req.body.name.trim();
        if (req.body.isActive !== undefined) odooUpdateData.is_active = Boolean(req.body.isActive);
        if (req.body.isDefault !== undefined) odooUpdateData.is_default = Boolean(req.body.isDefault);
        if (req.body.reference !== undefined) odooUpdateData.reference = req.body.reference || false;
        if (req.body.limitAmount !== undefined) odooUpdateData.limit_amount = req.body.limitAmount ? parseFloat(req.body.limitAmount) : 0;
        if (req.body.expiresAt !== undefined) odooUpdateData.expires_at = req.body.expiresAt || false;
        if (req.body.color) odooUpdateData.color = req.body.color;
        if (req.body.icon) odooUpdateData.icon = req.body.icon;

        await odoo.write('quelyos.payment.flow', odooId, odooUpdateData);
        logger.info(`[PaymentFlows] Updated in Odoo: ${odooId}`);
      }
    } catch (odooError) {
      logger.error(`[PaymentFlows] Odoo update failed:`, odooError);
    }

    res.json(updated);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Payment flow update failed" });
  }
});

// ---------- DELETE PAYMENT FLOW (DOUBLE DELETE) ----------
router.delete("/:id", auth, async (req, res) => {
  try {
    const flowId = Number(req.params.id);

    const flow = await prisma.paymentFlow.findFirst({
      where: {
        id: flowId,
        account: { companyId: req.user.companyId }
      }
    });

    if (!flow) {
      return res.status(404).json({ error: "Payment flow not found" });
    }

    // Delete from Odoo first
    try {
      const odooId = await getOdooId('PaymentFlow', flowId);
      if (odooId) {
        await odoo.unlink('quelyos.payment.flow', [odooId]);
        logger.info(`[PaymentFlows] Deleted from Odoo: ${odooId}`);
      }
    } catch (odooError) {
      logger.error(`[PaymentFlows] Odoo deletion failed:`, odooError);
    }

    // Delete from Prisma
    await prisma.paymentFlow.delete({ where: { id: flowId } });

    res.json({ success: true });

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Payment flow deletion failed" });
  }
});

module.exports = router;
