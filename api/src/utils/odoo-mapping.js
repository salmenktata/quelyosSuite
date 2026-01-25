/**
 * Odoo Mapping Utility
 * Maps Prisma IDs to Odoo IDs and vice versa
 * Supports double-write strategy during migration
 */

const { PrismaClient } = require('@prisma/client');
const { OdooRPC } = require('@quelyos/odoo');

const prisma = new PrismaClient();

/**
 * Mapping table structure (stored in Prisma)
 *
 * model OdooMapping {
 *   id          Int    @id @default(autoincrement())
 *   prismaModel String // e.g., "Account", "Transaction"
 *   prismaId    Int
 *   odooModel   String // e.g., "account.account", "account.move.line"
 *   odooId      Int
 *   createdAt   DateTime @default(now())
 *
 *   @@unique([prismaModel, prismaId])
 *   @@unique([odooModel, odooId])
 *   @@index([prismaModel, prismaId])
 *   @@index([odooModel, odooId])
 * }
 */

/**
 * Get Odoo ID from Prisma ID
 * @param {string} prismaModel - Prisma model name (e.g., "Account")
 * @param {number} prismaId - Prisma record ID
 * @returns {Promise<number|null>} Odoo ID or null
 */
async function getOdooId(prismaModel, prismaId) {
  try {
    // Check if mapping exists in cache/DB
    // For now, return null (to be implemented with OdooMapping table)

    // TODO: Implement mapping lookup
    // const mapping = await prisma.odooMapping.findUnique({
    //   where: {
    //     prismaModel_prismaId: { prismaModel, prismaId }
    //   }
    // });
    // return mapping?.odooId || null;

    return null;
  } catch (error) {
    console.error(`[OdooMapping] Error getting Odoo ID for ${prismaModel}#${prismaId}:`, error);
    return null;
  }
}

/**
 * Get Prisma ID from Odoo ID
 * @param {string} odooModel - Odoo model name (e.g., "account.account")
 * @param {number} odooId - Odoo record ID
 * @returns {Promise<number|null>} Prisma ID or null
 */
async function getPrismaId(odooModel, odooId) {
  try {
    // Check if mapping exists
    // TODO: Implement mapping lookup
    // const mapping = await prisma.odooMapping.findUnique({
    //   where: {
    //     odooModel_odooId: { odooModel, odooId }
    //   }
    // });
    // return mapping?.prismaId || null;

    return null;
  } catch (error) {
    console.error(`[OdooMapping] Error getting Prisma ID for ${odooModel}#${odooId}:`, error);
    return null;
  }
}

/**
 * Store mapping between Prisma and Odoo IDs
 * @param {string} prismaModel - Prisma model name
 * @param {number} prismaId - Prisma record ID
 * @param {string} odooModel - Odoo model name
 * @param {number} odooId - Odoo record ID
 * @returns {Promise<object|null>} Created mapping or null
 */
async function storeMapping(prismaModel, prismaId, odooModel, odooId) {
  try {
    // TODO: Implement mapping storage
    // const mapping = await prisma.odooMapping.create({
    //   data: {
    //     prismaModel,
    //     prismaId,
    //     odooModel,
    //     odooId
    //   }
    // });
    // return mapping;

    console.log(`[OdooMapping] Would store: ${prismaModel}#${prismaId} <-> ${odooModel}#${odooId}`);
    return { prismaModel, prismaId, odooModel, odooId };
  } catch (error) {
    console.error(`[OdooMapping] Error storing mapping:`, error);
    return null;
  }
}

/**
 * Model name mapping Prisma -> Odoo
 */
const MODEL_MAPPING = {
  // Core models
  Company: 'res.company',
  User: 'res.users',

  // Finance models - Native Odoo
  Account: 'account.account',
  Transaction: 'account.move.line',
  Category: 'account.analytic.account',
  Invoice: 'account.move',

  // Finance models - Custom quelyos_finance
  Portfolio: 'quelyos.portfolio',
  PaymentFlow: 'quelyos.payment.flow',
  Budgets: 'quelyos.budget',
  Budget: 'quelyos.budget.line',
  PlanningItem: 'quelyos.planning.item',
  ForecastEvent: 'quelyos.forecast.event',

  // Partners
  Customer: 'res.partner',
  Supplier: 'res.partner',

  // Supplier Management
  SupplierInvoice: 'account.move',
  SupplierPayment: 'account.payment',
};

/**
 * Get Odoo model name from Prisma model name
 * @param {string} prismaModel - Prisma model name
 * @returns {string} Odoo model name
 */
function getOdooModelName(prismaModel) {
  return MODEL_MAPPING[prismaModel] || `quelyos.${prismaModel.toLowerCase()}`;
}

/**
 * Map Account type from Prisma to Odoo account_type
 * @param {string} prismaType - Prisma account type ("banque", "caisse", etc.)
 * @returns {string} Odoo account_type
 */
function mapAccountType(prismaType) {
  const typeMapping = {
    'banque': 'asset_cash',
    'caisse': 'asset_cash',
    'compte courant': 'asset_current',
    'carte de crédit': 'liability_credit_card',
    'épargne': 'asset_current',
    'investissement': 'asset_non_current'
  };

  return typeMapping[prismaType?.toLowerCase()] || 'asset_cash';
}

/**
 * Get currency ID from Odoo by currency code
 * @param {string} currencyCode - Currency code (EUR, USD, etc.)
 * @returns {Promise<number>} Odoo currency ID
 */
async function getCurrencyId(currencyCode = 'EUR') {
  try {
    const odoo = new OdooRPC(process.env.ODOO_URL || 'http://localhost:8069');

    const currencies = await odoo.search('res.currency', [
      ['name', '=', currencyCode]
    ]);

    if (currencies && currencies.length > 0) {
      return currencies[0].id;
    }

    // Default to EUR (usually ID 1 in Odoo)
    return 1;
  } catch (error) {
    console.error(`[OdooMapping] Error getting currency ID for ${currencyCode}:`, error);
    return 1; // Default EUR
  }
}

/**
 * Get Odoo company ID from Prisma company ID
 * @param {number} prismaCompanyId - Prisma company ID
 * @returns {Promise<number>} Odoo company ID
 */
async function getOdooCompanyId(prismaCompanyId) {
  try {
    // Check mapping first
    const odooId = await getOdooId('Company', prismaCompanyId);
    if (odooId) {
      return odooId;
    }

    // Fallback: assume 1:1 mapping or default to company ID 1
    return 1;
  } catch (error) {
    console.error(`[OdooMapping] Error getting Odoo company ID:`, error);
    return 1;
  }
}

/**
 * Generate account code for Odoo
 * @param {string} accountType - Account type
 * @returns {string} Account code (e.g., "512001")
 */
function generateAccountCode(accountType = 'asset_cash') {
  const prefixes = {
    'asset_cash': '512',           // Bank accounts
    'asset_current': '411',        // Receivables
    'asset_non_current': '271',    // Investments
    'liability_credit_card': '512', // Credit cards (also 512)
    'liability_current': '401'     // Payables
  };

  const prefix = prefixes[accountType] || '512';
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  return `${prefix}${randomSuffix}`;
}

module.exports = {
  getOdooId,
  getPrismaId,
  storeMapping,
  getOdooModelName,
  mapAccountType,
  getCurrencyId,
  getOdooCompanyId,
  generateAccountCode
};
