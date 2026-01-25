const { z } = require('zod');
const logger = require('../../../logger');
const prisma = require('../../../prismaClient');

/**
 * Schéma de validation pour une ligne transformée
 */
const importRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (format YYYY-MM-DD requis)'),
  amount: z.number().positive('Le montant doit être positif'),
  type: z.enum(['credit', 'debit'], { message: 'Type invalide (credit ou debit requis)' }),
  description: z.string().max(255, 'Description trop longue (max 255 caractères)').optional(),
  accountName: z.string().optional(),
  categoryName: z.string().optional(),
  balance: z.number().optional(),
});

/**
 * Valide et enrichit les lignes transformées
 * @param {Object[]} rows - Lignes transformées
 * @param {number} companyId - ID de l'entreprise
 * @param {number} defaultAccountId - ID du compte par défaut
 * @returns {Promise<{valid: Object[], errors: Object[]}>}
 */
async function validateRows(rows, companyId, defaultAccountId) {
  const results = {
    valid: [],
    errors: [],
  };

  try {
    // Charger les comptes et catégories de l'entreprise (une seule fois)
    logger.debug(`[Validator] Loading accounts and categories for company ${companyId}...`);

    const [accounts, categories] = await Promise.all([
      prisma.account.findMany({
        where: { companyId },
        select: { id: true, name: true },
      }),
      prisma.category.findMany({
        where: { companyId },
        select: { id: true, name: true, kind: true },
      }),
    ]);

    // Créer maps pour lookup rapide
    const accountMap = new Map(
      accounts.map(a => [a.name.toLowerCase().trim(), a.id])
    );

    const categoryMap = new Map(
      categories.map(c => [c.name.toLowerCase().trim(), { id: c.id, kind: c.kind }])
    );

    logger.debug(`[Validator] Loaded ${accounts.length} accounts, ${categories.length} categories`);

    // Valider chaque ligne
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNumber = i + 2; // +1 pour header, +1 pour index 0

      try {
        // Validation schéma Zod
        const validated = importRowSchema.parse(row);

        // Résolution du compte
        let accountId = defaultAccountId;
        if (row.accountName) {
          const foundAccountId = accountMap.get(row.accountName.toLowerCase().trim());
          if (foundAccountId) {
            accountId = foundAccountId;
          } else {
            results.errors.push({
              line: lineNumber,
              field: 'account',
              message: `Compte "${row.accountName}" introuvable`,
              severity: 'warning', // Warning: utilise compte par défaut
              data: row,
            });
          }
        }

        // Résolution et validation de la catégorie
        let categoryId = null;
        if (row.categoryName) {
          const categoryInfo = categoryMap.get(row.categoryName.toLowerCase().trim());

          if (categoryInfo) {
            // Validation: type de catégorie doit matcher type transaction
            const expectedKind = validated.type === 'credit' ? 'INCOME' : 'EXPENSE';

            if (categoryInfo.kind !== expectedKind) {
              results.errors.push({
                line: lineNumber,
                field: 'category',
                message: `Catégorie "${row.categoryName}" incompatible (type ${categoryInfo.kind} vs transaction ${validated.type})`,
                severity: 'warning',
                data: row,
              });
            } else {
              categoryId = categoryInfo.id;
            }
          } else {
            results.errors.push({
              line: lineNumber,
              field: 'category',
              message: `Catégorie "${row.categoryName}" introuvable`,
              severity: 'warning',
              data: row,
            });
          }
        }

        // Validation de la date (doit être dans le passé ou aujourd'hui)
        const transactionDate = new Date(validated.date);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Fin de journée

        if (transactionDate > today) {
          results.errors.push({
            line: lineNumber,
            field: 'date',
            message: `Date dans le futur (${validated.date})`,
            severity: 'warning',
            data: row,
          });
        }

        // Ajouter aux lignes valides
        results.valid.push({
          ...validated,
          accountId,
          categoryId,
          occurredAt: transactionDate,
          lineNumber,
          originalData: row,
        });

      } catch (err) {
        if (err instanceof z.ZodError) {
          // Erreur de validation Zod
          const firstError = err.errors[0];
          results.errors.push({
            line: lineNumber,
            field: firstError.path.join('.'),
            message: firstError.message,
            severity: 'error', // Erreur bloquante
            data: row,
          });
        } else {
          // Autre erreur
          results.errors.push({
            line: lineNumber,
            message: `Erreur de validation: ${err.message}`,
            severity: 'error',
            data: row,
          });
        }
      }
    }

    logger.info(`[Validator] Validation complete: ${results.valid.length} valid, ${results.errors.length} errors`);

  } catch (err) {
    logger.error('[Validator] Fatal error during validation:', err);
    throw new Error(`Erreur critique de validation: ${err.message}`);
  }

  return results;
}

/**
 * Valide un mapping utilisateur
 * @param {Object} mappings - Mappings fournis par l'utilisateur
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateMappings(mappings) {
  const errors = [];

  // Champs requis
  const requiredFields = ['date', 'description'];

  for (const field of requiredFields) {
    if (!mappings[field]) {
      errors.push(`Le champ "${field}" est obligatoire`);
    }
  }

  // Amount OU (debit + credit) requis
  const hasAmount = mappings.amount;
  const hasDebitCredit = mappings.debit && mappings.credit;

  if (!hasAmount && !hasDebitCredit) {
    errors.push('Le champ "amount" ou les champs "debit" et "credit" sont requis');
  }

  // Vérifier doublons (même colonne mappée 2 fois)
  const usedColumns = Object.values(mappings)
    .map(m => m.columnIndex)
    .filter(idx => idx !== undefined);

  const duplicates = usedColumns.filter((item, index) => usedColumns.indexOf(item) !== index);

  if (duplicates.length > 0) {
    errors.push(`Certaines colonnes sont utilisées plusieurs fois: ${duplicates.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateRows,
  validateMappings,
  importRowSchema,
};
