/**
 * Cron Job quotidien pour l'entraînement des modèles ML de catégorisation
 *
 * Exécution : Tous les jours à 3h00 (heure creuse)
 * Objectif : Ré-entraîner les modèles ML avec les nouvelles transactions catégorisées
 */

const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const categorizerClient = require('../services/ml/CategorizerClient');
const logger = require('../../logger');

const prisma = new PrismaClient();

// Configuration
const MIN_TRANSACTIONS_FOR_TRAINING = 100;
const MAX_TRANSACTIONS_PER_COMPANY = 10000;

/**
 * Démarrer le cron job quotidien pour l'entraînement ML
 */
function startDailyCategorizerTraining() {
  // Cron pattern : "0 3 * * *" = 3h00 chaque jour (heure locale)
  // Format : minute hour day month dayOfWeek
  cron.schedule('0 3 * * *', async () => {
    const startTime = Date.now();
    logger.info('Starting daily ML categorizer training...');

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

      // Entraîner le modèle pour chaque société
      for (const company of companies) {
        try {
          const trainingResult = await trainCompanyModel(company.id, company.name);

          if (trainingResult.trained) {
            totalTrained++;
            results.push({
              companyId: company.id,
              companyName: company.name,
              samplesUsed: trainingResult.samplesUsed,
              accuracy: trainingResult.accuracy
            });

            logger.info(`Company ${company.id} (${company.name}): Model trained with ${trainingResult.samplesUsed} transactions (accuracy: ${(trainingResult.accuracy * 100).toFixed(1)}%)`);
          } else {
            totalSkipped++;
            logger.info(`Company ${company.id} (${company.name}): Skipped - ${trainingResult.reason}`);
          }
        } catch (err) {
          logger.error(`Failed to train model for company ${company.id}:`, err);
          errors.push({
            companyId: company.id,
            companyName: company.name,
            error: err.message
          });
        }
      }

      const duration = Date.now() - startTime;
      logger.info('Daily ML categorizer training completed:', {
        duration: `${duration}ms`,
        companies: companies.length,
        totalTrained,
        totalSkipped,
        errors: errors.length
      });

      // Logger les modèles entraînés
      if (results.length > 0) {
        logger.info('Successfully trained models:', results);
      }

      // Logger les erreurs si présentes
      if (errors.length > 0) {
        logger.warn('Some companies failed during model training:', errors);
      }

    } catch (err) {
      logger.error('Daily categorizer training cron job failed:', err);
    }
  });

  logger.info('✅ Daily ML categorizer training cron job scheduled (every day at 3:00 AM)');
}

/**
 * Entraîner le modèle pour une société
 * @param {number} companyId - ID de la société
 * @param {string} companyName - Nom de la société (pour logs)
 * @returns {Promise<{trained: boolean, samplesUsed?: number, accuracy?: number, reason?: string}>}
 */
async function trainCompanyModel(companyId, companyName) {
  // Récupérer toutes les transactions catégorisées de la société
  const transactions = await prisma.transaction.findMany({
    where: {
      account: { companyId },
      categoryId: { not: null },
      description: { not: null }
    },
    include: {
      category: { select: { id: true, name: true } },
      paymentFlow: { select: { type: true } }
    },
    orderBy: { occurredAt: 'desc' },
    take: MAX_TRANSACTIONS_PER_COMPANY
  });

  // Vérifier si on a assez de transactions
  if (transactions.length < MIN_TRANSACTIONS_FOR_TRAINING) {
    return {
      trained: false,
      reason: `Only ${transactions.length} categorized transactions (minimum ${MIN_TRANSACTIONS_FOR_TRAINING} required)`
    };
  }

  // Préparer données pour training
  const trainingData = transactions.map(tx => ({
    description: tx.description,
    amount: tx.amount,
    type: tx.type,
    categoryId: tx.categoryId,
    categoryName: tx.category.name,
    paymentFlowType: tx.paymentFlow?.type || null
  }));

  // Entraîner le modèle via le client ML
  const result = await categorizerClient.train(
    companyId,
    trainingData,
    false // force_retrain = false (use existing model if already trained today)
  );

  return {
    trained: true,
    samplesUsed: result.samples_used,
    accuracy: result.accuracy_score || 0
  };
}

/**
 * Exécuter un entraînement manuel (pour tests)
 * @param {number} [companyId] - ID de la société (optionnel, sinon toutes les sociétés)
 */
async function runManualTraining(companyId = null) {
  logger.info('Running manual ML categorizer training...', companyId ? `for company ${companyId}` : 'for all companies');

  try {
    const companies = companyId
      ? await prisma.company.findMany({ where: { id: companyId } })
      : await prisma.company.findMany({ where: { isDemo: false } });

    for (const company of companies) {
      try {
        const result = await trainCompanyModel(company.id, company.name);

        if (result.trained) {
          logger.info(`✅ Company ${company.id} (${company.name}): Trained with ${result.samplesUsed} transactions (accuracy: ${(result.accuracy * 100).toFixed(1)}%)`);
        } else {
          logger.info(`⏭️  Company ${company.id} (${company.name}): ${result.reason}`);
        }
      } catch (err) {
        logger.error(`❌ Company ${company.id} (${company.name}): Failed - ${err.message}`);
      }
    }

    logger.info('Manual training completed');
  } catch (err) {
    logger.error('Manual training failed:', err);
  }
}

module.exports = {
  startDailyCategorizerTraining,
  runManualTraining
};
