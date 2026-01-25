const logger = require('../../../logger');
const prisma = require('../../../prismaClient');

const BATCH_SIZE = 100; // Nombre de transactions par batch

/**
 * Importe des transactions validées par batch
 * @param {Object[]} validatedRows - Lignes validées
 * @param {number} companyId - ID de l'entreprise (pour sécurité)
 * @returns {Promise<{imported: number, duplicates: number, failed: number, errors: Object[]}>}
 */
async function importTransactions(validatedRows, companyId) {
  const results = {
    imported: 0,
    duplicates: 0,
    failed: 0,
    errors: [],
  };

  try {
    logger.info(`[Importer] Starting batch import of ${validatedRows.length} transactions...`);

    // Traiter par batches pour performance
    for (let i = 0; i < validatedRows.length; i += BATCH_SIZE) {
      const batch = validatedRows.slice(i, i + BATCH_SIZE);

      logger.debug(`[Importer] Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} rows)...`);

      try {
        // Transaction Prisma pour atomicité du batch
        await prisma.$transaction(async (tx) => {
          for (const row of batch) {
            try {
              // Vérification de sécurité: le compte appartient bien à cette company
              const account = await tx.account.findUnique({
                where: { id: row.accountId },
                select: { companyId: true },
              });

              if (!account || account.companyId !== companyId) {
                logger.error(`[Importer] Security violation: account ${row.accountId} doesn't belong to company ${companyId}`);
                results.failed++;
                results.errors.push({
                  line: row.lineNumber,
                  message: 'Erreur de sécurité: compte invalide',
                  severity: 'error',
                });
                continue;
              }

              // Détection de doublons
              const duplicate = await tx.transaction.findFirst({
                where: {
                  accountId: row.accountId,
                  occurredAt: row.occurredAt,
                  amount: row.amount,
                  description: row.description || '',
                },
              });

              if (duplicate) {
                logger.debug(`[Importer] Duplicate detected at line ${row.lineNumber}`);
                results.duplicates++;
                results.errors.push({
                  line: row.lineNumber,
                  message: 'Transaction en double (ignorée)',
                  severity: 'info',
                });
                continue;
              }

              // Créer la transaction
              await tx.transaction.create({
                data: {
                  accountId: row.accountId,
                  occurredAt: row.occurredAt,
                  amount: row.amount,
                  type: row.type,
                  description: row.description || '',
                  categoryId: row.categoryId || null,
                  status: 'CONFIRMED', // Les imports sont toujours confirmés
                  currency: 'EUR', // Par défaut EUR (TODO: détecter depuis fichier)
                },
              });

              results.imported++;

            } catch (err) {
              logger.error(`[Importer] Error importing transaction at line ${row.lineNumber}:`, err);
              results.failed++;
              results.errors.push({
                line: row.lineNumber,
                message: `Erreur d'import: ${err.message}`,
                severity: 'error',
              });
            }
          }
        }, {
          timeout: 60000, // 60 secondes max par batch
        });

      } catch (err) {
        // Erreur de batch entier
        logger.error(`[Importer] Batch error starting at line ${batch[0].lineNumber}:`, err);

        // Marquer toutes les lignes du batch comme échouées
        for (const row of batch) {
          if (!results.errors.some(e => e.line === row.lineNumber)) {
            results.failed++;
            results.errors.push({
              line: row.lineNumber,
              message: `Erreur de batch: ${err.message}`,
              severity: 'error',
            });
          }
        }
      }
    }

    logger.info(`[Importer] Import complete: ${results.imported} imported, ${results.duplicates} duplicates, ${results.failed} failed`);

  } catch (err) {
    logger.error('[Importer] Fatal error during import:', err);
    throw new Error(`Erreur critique d'import: ${err.message}`);
  }

  return results;
}

/**
 * Compte les doublons potentiels sans importer
 * @param {Object[]} validatedRows - Lignes validées
 * @returns {Promise<number>} Nombre de doublons détectés
 */
async function countDuplicates(validatedRows) {
  let duplicateCount = 0;

  try {
    for (const row of validatedRows) {
      const duplicate = await prisma.transaction.findFirst({
        where: {
          accountId: row.accountId,
          occurredAt: row.occurredAt,
          amount: row.amount,
          description: row.description || '',
        },
      });

      if (duplicate) {
        duplicateCount++;
      }
    }
  } catch (err) {
    logger.error('[Importer] Error counting duplicates:', err);
  }

  return duplicateCount;
}

/**
 * Estime le temps d'import
 * @param {number} rowCount - Nombre de lignes
 * @returns {number} Temps estimé en secondes
 */
function estimateImportTime(rowCount) {
  // Estimation: ~10 lignes/seconde
  const linesPerSecond = 10;
  return Math.ceil(rowCount / linesPerSecond);
}

module.exports = {
  importTransactions,
  countDuplicates,
  estimateImportTime,
  BATCH_SIZE,
};
