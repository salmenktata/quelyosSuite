/**
 * Cron Job hebdomadaire pour l'entraînement des modèles ML de détection d'anomalies
 *
 * Exécution : Tous les dimanches à 4h00 (heure creuse)
 * Objectif : Entraîner les modèles par catégorie avec les transactions récentes
 */

const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const anomalyClient = require('../services/ml/AnomalyDetectorClient');
const logger = require('../../logger');

const prisma = new PrismaClient();

// Configuration
const MIN_TRANSACTIONS_FOR_TRAINING = 50;
const DAYS_HISTORY = 90; // 90 derniers jours

/**
 * Démarrer le cron job hebdomadaire pour l'entraînement ML anomalies
 */
function startWeeklyAnomalyTraining() {
  // Cron pattern : "0 4 * * 0" = 4h00 chaque dimanche
  // Format : minute hour day month dayOfWeek (0=Sunday)
  cron.schedule('0 4 * * 0', async () => {
    const startTime = Date.now();
    logger.info('Starting weekly ML anomaly detector training...');

    try {
      // Récupérer toutes les sociétés actives (non-demo)
      const companies = await prisma.company.findMany({
        where: { isDemo: false },
        select: { id: true, name: true }
      });

      let totalTrained = 0;
      let totalSkipped = 0;
      const errors = [];
      const results = [];

      // Entraîner les modèles pour chaque société
      for (const company of companies) {
        try {
          const companyResults = await trainCompanyModels(company.id, company.name);

          totalTrained += companyResults.trained;
          totalSkipped += companyResults.skipped;

          if (companyResults.models.length > 0) {
            results.push({
              companyId: company.id,
              companyName: company.name,
              modelsTrained: companyResults.models
            });
          }

          logger.info(`Company ${company.id} (${company.name}): ${companyResults.trained} models trained, ${companyResults.skipped} skipped`);
        } catch (err) {
          logger.error(`Failed to train models for company ${company.id}:`, err);
          errors.push({
            companyId: company.id,
            companyName: company.name,
            error: err.message
          });
        }
      }

      const duration = Date.now() - startTime;
      logger.info('Weekly ML anomaly training completed:', {
        duration: `${duration}ms`,
        companies: companies.length,
        totalTrained,
        totalSkipped,
        errors: errors.length
      });

      // Logger les modèles entraînés
      if (results.length > 0) {
        logger.info('Successfully trained anomaly models:', results);
      }

      // Logger les erreurs si présentes
      if (errors.length > 0) {
        logger.warn('Some companies failed during anomaly model training:', errors);
      }

    } catch (err) {
      logger.error('Weekly anomaly training cron job failed:', err);
    }
  });

  logger.info('✅ Weekly ML anomaly training cron job scheduled (every Sunday at 4:00 AM)');
}

/**
 * Entraîner les modèles d'anomalies pour toutes les catégories d'une société
 *
 * @param {number} companyId
 * @param {string} companyName
 * @returns {Promise<{trained: number, skipped: number, models: Array}>}
 */
async function trainCompanyModels(companyId, companyName) {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - DAYS_HISTORY);

  // Récupérer toutes les catégories de la société
  const categories = await prisma.category.findMany({
    where: { companyId },
    select: { id: true, name: true }
  });

  let trained = 0;
  let skipped = 0;
  const models = [];

  for (const category of categories) {
    try {
      // Récupérer transactions pour cette catégorie
      const transactions = await prisma.transaction.findMany({
        where: {
          account: { companyId },
          categoryId: category.id,
          occurredAt: { gte: ninetyDaysAgo }
        },
        select: {
          amount: true,
          occurredAt: true
        },
        orderBy: { occurredAt: 'desc' },
        take: 1000
      });

      // Skip si pas assez de transactions
      if (transactions.length < MIN_TRANSACTIONS_FOR_TRAINING) {
        skipped++;
        continue;
      }

      // Entraîner modèle
      const result = await anomalyClient.train(
        companyId,
        category.id,
        transactions,
        false // force_retrain = false
      );

      if (result.success) {
        trained++;
        models.push({
          categoryId: category.id,
          categoryName: category.name,
          samplesUsed: result.samples_used
        });
      }

    } catch (err) {
      logger.error(`Failed to train model for category ${category.id} (${category.name}):`, err);
      skipped++;
    }
  }

  return { trained, skipped, models };
}

/**
 * Exécuter un entraînement manuel (pour tests)
 *
 * @param {number} [companyId] - ID de la société (optionnel, sinon toutes)
 */
async function runManualAnomalyTraining(companyId = null) {
  logger.info('Running manual ML anomaly training...', companyId ? `for company ${companyId}` : 'for all companies');

  try {
    const companies = companyId
      ? await prisma.company.findMany({ where: { id: companyId } })
      : await prisma.company.findMany({ where: { isDemo: false } });

    for (const company of companies) {
      try {
        const result = await trainCompanyModels(company.id, company.name);

        logger.info(`✅ Company ${company.id} (${company.name}): ${result.trained} models trained, ${result.skipped} skipped`);

        if (result.models.length > 0) {
          logger.info(`  Models: ${result.models.map(m => `${m.categoryName} (${m.samplesUsed} samples)`).join(', ')}`);
        }
      } catch (err) {
        logger.error(`❌ Company ${company.id} (${company.name}): Failed - ${err.message}`);
      }
    }

    logger.info('Manual anomaly training completed');
  } catch (err) {
    logger.error('Manual anomaly training failed:', err);
  }
}

module.exports = {
  startWeeklyAnomalyTraining,
  runManualAnomalyTraining
};
