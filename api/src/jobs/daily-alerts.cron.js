/**
 * Cron Job quotidien pour l'évaluation des alertes de trésorerie (F93)
 *
 * Exécution : Tous les jours à 8h00
 * Objectif : Évaluer les alertes de type NEGATIVE_FORECAST et autres
 */

const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const alertEvaluator = require('../services/alert-evaluator.service');
const alertNotifier = require('../services/alert-notifier.service');
const logger = require('../../logger');

const prisma = new PrismaClient();

/**
 * Démarrer le cron job quotidien pour les alertes
 */
function startDailyAlertsCron() {
  // Cron pattern : "0 8 * * *" = 8h00 chaque jour (heure locale)
  // Format : minute hour day month dayOfWeek
  cron.schedule('0 8 * * *', async () => {
    const startTime = Date.now();
    logger.info('Starting daily alerts evaluation...');

    try {
      // Récupérer toutes les sociétés actives (non-demo)
      const companies = await prisma.company.findMany({
        where: { isDemo: false },
        select: { id: true, name: true }
      });

      let totalAlerts = 0;
      let totalTriggered = 0;
      const errors = [];

      // Évaluer les alertes pour chaque société
      for (const company of companies) {
        try {
          const results = await alertEvaluator.evaluateAll(company.id);
          totalAlerts += results.length;

          // Notifier les alertes déclenchées
          if (results.length > 0) {
            const triggers = await alertNotifier.notifyBatch(results);
            totalTriggered += triggers.length;

            logger.info(`Company ${company.id} (${company.name}): ${triggers.length}/${results.length} alerts notified`);
          }
        } catch (err) {
          logger.error(`Failed to evaluate alerts for company ${company.id}:`, err);
          errors.push({
            companyId: company.id,
            companyName: company.name,
            error: err.message
          });
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`Daily alerts evaluation completed:`, {
        duration: `${duration}ms`,
        companies: companies.length,
        totalAlerts,
        totalTriggered,
        errors: errors.length
      });

      // Logger les erreurs si présentes
      if (errors.length > 0) {
        logger.warn('Some companies failed during alert evaluation:', errors);
      }

    } catch (err) {
      logger.error('Daily alerts cron job failed:', err);
    }
  });

  logger.info('✅ Daily alerts cron job scheduled (every day at 8:00 AM)');
}

/**
 * Exécuter une évaluation manuelle (pour tests)
 */
async function runManualEvaluation() {
  logger.info('Running manual alerts evaluation...');

  try {
    const companies = await prisma.company.findMany({
      where: { isDemo: false },
      select: { id: true, name: true }
    });

    for (const company of companies) {
      const results = await alertEvaluator.evaluateAll(company.id);

      if (results.length > 0) {
        logger.info(`Company ${company.id}: Would trigger ${results.length} alerts`);
        results.forEach(r => {
          logger.info(`  - Alert ${r.alert.id} (${r.alert.name}):`, r.context);
        });
      } else {
        logger.info(`Company ${company.id}: No alerts to trigger`);
      }
    }

    logger.info('Manual evaluation completed');
  } catch (err) {
    logger.error('Manual evaluation failed:', err);
  }
}

module.exports = {
  startDailyAlertsCron,
  runManualEvaluation
};
