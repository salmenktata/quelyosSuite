/**
 * Accounts Routes - Odoo Integration (Double Write Strategy)
 *
 * This file demonstrates the double-write pattern during migration:
 * 1. Write to Prisma (existing)
 * 2. Write to Odoo (new)
 * 3. Store ID mapping
 *
 * Once migration is complete, remove Prisma writes and use Odoo only.
 */

const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { OdooRPC } = require("@quelyos/odoo");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { createAccountSchema, updateAccountSchema } = require("../schemas/validation");
const { checkAccountLimit } = require("../middleware/paywall");

const {
  getOdooId,
  getPrismaId,
  storeMapping,
  mapAccountType,
  getCurrencyId,
  getOdooCompanyId,
  generateAccountCode
} = require("../utils/odoo-mapping");

// Initialize Odoo RPC client
const odoo = new OdooRPC(process.env.ODOO_URL || 'http://localhost:8069');

function resolveCompanyId(req) {
  if (req.user?.role === "SUPERADMIN" && req.query.companyId) {
    const cid = Number(req.query.companyId);
    if (Number.isFinite(cid)) return cid;
  }
  return req.user.companyId;
}

// ---------- CREATE ACCOUNT (DOUBLE WRITE) ----------
router.post("/", auth, checkAccountLimit, validate(createAccountSchema), async (req, res) => {
  try {
    const targetCompanyId = resolveCompanyId(req);
    const name = (req.body.name || "").trim();
    const type = (req.body.type || "banque").trim();
    const currency = (req.body.currency || "EUR").trim();
    const balance = Number.isFinite(Number(req.body.balance)) ? Number(req.body.balance) : 0;
    const status = req.body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
    const institution = req.body.institution ? String(req.body.institution).trim() : null;
    const notes = req.body.notes ? String(req.body.notes).trim() : null;
    const portfolioIds = Array.isArray(req.body.portfolioIds) ? req.body.portfolioIds : [];
    const isShared = portfolioIds.length === 0;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // STEP 1: Create in Prisma (existing behavior)
    const prismaAccount = await prisma.account.create({
      data: {
        name,
        type,
        currency,
        balance,
        institution,
        notes,
        isShared,
        status,
        companyId: targetCompanyId,
        portfolios: {
          create: portfolioIds.map(pid => ({ portfolioId: Number(pid) }))
        }
      },
      include: {
        portfolios: {
          include: { portfolio: true }
        }
      }
    });

    // STEP 2: Create in Odoo (new)
    try {
      const odooCompanyId = await getOdooCompanyId(targetCompanyId);
      const currencyId = await getCurrencyId(currency);
      const accountType = mapAccountType(type);
      const accountCode = generateAccountCode(accountType);

      const odooAccountData = {
        name: name,
        code: accountCode,
        account_type: accountType,
        currency_id: currencyId,
        company_id: odooCompanyId,
        // Custom fields (requires extension of account.account)
        // x_institution: institution,
        // x_notes: notes,
        // x_status: status,
      };

      const odooAccount = await odoo.create('account.account', odooAccountData);

      // STEP 3: Store mapping Prisma ID <-> Odoo ID
      if (odooAccount && odooAccount.id) {
        await storeMapping('Account', prismaAccount.id, 'account.account', odooAccount.id);
        logger.info(`[Accounts] Created account ${name}: Prisma#${prismaAccount.id} <-> Odoo#${odooAccount.id}`);
      }

      // STEP 4: Link to portfolios in Odoo (if needed)
      if (portfolioIds.length > 0) {
        for (const portfolioId of portfolioIds) {
          const odooPortfolioId = await getOdooId('Portfolio', portfolioId);
          if (odooPortfolioId) {
            // Update portfolio to link account
            await odoo.write('quelyos.portfolio', odooPortfolioId, {
              account_ids: [[4, odooAccount.id]] // Many2many add
            });
          }
        }
      }

    } catch (odooError) {
      // Log Odoo error but don't fail the request (Prisma succeeded)
      logger.error(`[Accounts] Odoo creation failed for account ${name}:`, odooError);
      logger.warn(`[Accounts] Account created in Prisma only (ID: ${prismaAccount.id})`);
    }

    // Return Prisma account (existing API contract)
    res.json(prismaAccount);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Account creation failed" });
  }
});

// ---------- LIST ACCOUNTS (READ FROM BOTH) ----------
router.get("/", auth, async (req, res) => {
  try {
    const targetCompanyId = resolveCompanyId(req);

    // Option 1: Read from Prisma (current behavior - safe during migration)
    const prismaAccounts = await prisma.account.findMany({
      where: { companyId: targetCompanyId },
      include: {
        portfolio: {
          select: {
            id: true,
            name: true,
          },
        },
        portfolios: {
          include: {
            portfolio: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Option 2: Read from Odoo (future - once migration complete)
    // Uncomment when ready to switch to Odoo
    /*
    const odooCompanyId = await getOdooCompanyId(targetCompanyId);
    const odooAccounts = await odoo.search('account.account', [
      ['company_id', '=', odooCompanyId],
      ['account_type', 'in', ['asset_cash', 'asset_current', 'liability_credit_card']]
    ]);

    // Transform Odoo format to API format
    const accounts = odooAccounts.map(acc => ({
      id: acc.id,
      name: acc.name,
      type: reverseMapAccountType(acc.account_type),
      currency: acc.currency_id ? acc.currency_id[1] : 'EUR',
      balance: acc.current_balance || 0,
      institution: acc.x_institution || null,
      notes: acc.x_notes || null,
      status: acc.x_status || 'ACTIVE',
      companyId: targetCompanyId,
      // ... map other fields
    }));
    */

    res.json(prismaAccounts);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Could not fetch accounts" });
  }
});

// ---------- GET SINGLE ACCOUNT ----------
router.get("/:id", auth, async (req, res) => {
  try {
    const accountId = Number(req.params.id);
    const targetCompanyId = resolveCompanyId(req);

    // Read from Prisma
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        companyId: targetCompanyId
      },
      include: {
        portfolios: {
          include: { portfolio: true }
        },
        transactions: {
          take: 10,
          orderBy: { occurredAt: 'desc' }
        }
      }
    });

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Optionally fetch additional data from Odoo
    try {
      const odooId = await getOdooId('Account', accountId);
      if (odooId) {
        const odooAccount = await odoo.read('account.account', [odooId], ['current_balance']);
        if (odooAccount && odooAccount[0]) {
          account.odooBalance = odooAccount[0].current_balance;
        }
      }
    } catch (odooError) {
      logger.warn(`[Accounts] Could not fetch Odoo data for account ${accountId}:`, odooError);
    }

    res.json(account);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Could not fetch account" });
  }
});

// ---------- UPDATE ACCOUNT (DOUBLE WRITE) ----------
router.put("/:id", auth, validate(updateAccountSchema), async (req, res) => {
  try {
    const accountId = Number(req.params.id);
    const targetCompanyId = resolveCompanyId(req);

    // Check ownership
    const existing = await prisma.account.findFirst({
      where: { id: accountId, companyId: targetCompanyId }
    });

    if (!existing) {
      return res.status(404).json({ error: "Account not found" });
    }

    // STEP 1: Update in Prisma
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name.trim();
    if (req.body.type !== undefined) updateData.type = req.body.type.trim();
    if (req.body.currency !== undefined) updateData.currency = req.body.currency.trim();
    if (req.body.institution !== undefined) updateData.institution = req.body.institution;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;
    if (req.body.status !== undefined) updateData.status = req.body.status;

    const updated = await prisma.account.update({
      where: { id: accountId },
      data: updateData,
      include: {
        portfolios: {
          include: { portfolio: true }
        }
      }
    });

    // STEP 2: Update in Odoo
    try {
      const odooId = await getOdooId('Account', accountId);
      if (odooId) {
        const odooUpdateData = {};
        if (req.body.name) odooUpdateData.name = req.body.name.trim();
        // Map other fields...

        await odoo.write('account.account', odooId, odooUpdateData);
        logger.info(`[Accounts] Updated account in Odoo: ${odooId}`);
      }
    } catch (odooError) {
      logger.error(`[Accounts] Odoo update failed:`, odooError);
    }

    res.json(updated);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Account update failed" });
  }
});

// ---------- DELETE ACCOUNT (DOUBLE DELETE) ----------
router.delete("/:id", auth, async (req, res) => {
  try {
    const accountId = Number(req.params.id);
    const targetCompanyId = resolveCompanyId(req);

    // Check ownership
    const account = await prisma.account.findFirst({
      where: { id: accountId, companyId: targetCompanyId }
    });

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    // STEP 1: Delete from Odoo first (to maintain referential integrity)
    try {
      const odooId = await getOdooId('Account', accountId);
      if (odooId) {
        await odoo.unlink('account.account', [odooId]);
        logger.info(`[Accounts] Deleted account from Odoo: ${odooId}`);
      }
    } catch (odooError) {
      logger.error(`[Accounts] Odoo deletion failed:`, odooError);
      // Continue with Prisma deletion anyway
    }

    // STEP 2: Delete from Prisma
    await prisma.account.delete({
      where: { id: accountId }
    });

    res.json({ success: true });

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Account deletion failed" });
  }
});

/**
 * Helper to reverse map Odoo account_type to Prisma type
 */
function reverseMapAccountType(odooType) {
  const reverseMapping = {
    'asset_cash': 'banque',
    'asset_current': 'compte courant',
    'liability_credit_card': 'carte de crédit',
    'asset_non_current': 'investissement'
  };
  return reverseMapping[odooType] || 'banque';
}

module.exports = router;
