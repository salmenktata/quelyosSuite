/**
 * Alert Evaluator Service for Cash Alerts (F93)
 *
 * Service pour évaluer si les alertes de trésorerie doivent être déclenchées
 */

const logger = require('../../logger');
const prisma = require('../../prismaClient');

class AlertEvaluatorService {
  /**
   * Évaluer toutes les alertes actives pour une société
   *
   * @param {number} companyId - ID de la société
   * @returns {Promise<Array>} Liste des alertes déclenchées
   */
  async evaluateAll(companyId) {
    try {
      const alerts = await prisma.cashAlert.findMany({
        where: { companyId, isActive: true },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          triggers: {
            orderBy: { triggeredAt: 'desc' },
            take: 1
          }
        }
      });

      const results = [];
      for (const alert of alerts) {
        const result = await this.evaluate(alert);
        if (result.shouldTrigger) {
          results.push(result);
        }
      }

      logger.info(`Evaluated ${alerts.length} alerts for company ${companyId}, ${results.length} triggered`);
      return results;

    } catch (err) {
      logger.error('Failed to evaluate alerts:', err);
      throw err;
    }
  }

  /**
   * Évaluer une alerte individuelle
   *
   * @param {Object} alert - Alerte à évaluer (avec relations user et triggers)
   * @returns {Promise<Object>} Résultat de l'évaluation
   */
  async evaluate(alert) {
    // Vérifier cooldown
    if (!this._canTrigger(alert)) {
      return { shouldTrigger: false, reason: 'cooldown', alert };
    }

    // Récupérer les données nécessaires
    const data = await this._fetchAlertData(alert);

    // Évaluer selon le type
    let condition = false;
    let context = {};

    switch (alert.type) {
      case 'THRESHOLD':
        condition = this._evaluateThreshold(data.currentBalance, alert);
        context = {
          currentBalance: data.currentBalance,
          threshold: alert.thresholdAmount,
          operator: alert.compareOperator
        };
        break;

      case 'NEGATIVE_FORECAST':
        condition = this._evaluateNegativeForecast(data.forecast, alert);
        context = {
          forecast: data.forecast,
          horizonDays: alert.horizonDays,
          daysToNegative: data.forecast?.daysToNegative || null
        };
        break;

      case 'VARIANCE':
        condition = this._evaluateVariance(data.actual, data.forecast, alert);
        context = {
          actual: data.actual,
          forecast: data.forecast,
          variance: data.variance || 0
        };
        break;

      default:
        logger.warn(`Unknown alert type: ${alert.type}`);
        return { shouldTrigger: false, reason: 'unknown_type', alert };
    }

    return {
      shouldTrigger: condition,
      alert,
      context,
      value: data.currentBalance || data.forecast?.projectedBalance || 0
    };
  }

  /**
   * Vérifier si l'alerte peut être déclenchée (cooldown)
   *
   * @private
   */
  _canTrigger(alert) {
    if (!alert.triggers || alert.triggers.length === 0) {
      return true;
    }

    const lastTrigger = alert.triggers[0];
    const cooldownMs = alert.cooldownHours * 60 * 60 * 1000;
    const elapsed = Date.now() - new Date(lastTrigger.triggeredAt).getTime();

    return elapsed >= cooldownMs;
  }

  /**
   * Récupérer les données pour évaluer l'alerte
   *
   * @private
   */
  async _fetchAlertData(alert) {
    // 1. Solde actuel (somme de tous les comptes actifs)
    const accounts = await prisma.account.findMany({
      where: {
        companyId: alert.companyId,
        status: 'ACTIVE'
      },
      select: { balance: true }
    });

    const currentBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    // 2. Prévisions si nécessaire (pour NEGATIVE_FORECAST ou VARIANCE)
    let forecast = null;
    if (alert.type === 'NEGATIVE_FORECAST' || alert.type === 'VARIANCE') {
      forecast = await this._getForecast(alert.companyId, alert.horizonDays || 30);
    }

    // 3. Données actuelles pour variance
    let actual = null;
    if (alert.type === 'VARIANCE') {
      actual = await this._getActualData(alert.companyId);
    }

    return { currentBalance, forecast, actual };
  }

  /**
   * Évaluer seuil de trésorerie
   *
   * @private
   */
  _evaluateThreshold(currentBalance, alert) {
    const { thresholdAmount, compareOperator } = alert;

    if (!thresholdAmount) {
      logger.warn(`Alert ${alert.id} has no threshold amount`);
      return false;
    }

    switch (compareOperator) {
      case 'lt':
        return currentBalance < thresholdAmount;
      case 'lte':
        return currentBalance <= thresholdAmount;
      case 'gt':
        return currentBalance > thresholdAmount;
      case 'gte':
        return currentBalance >= thresholdAmount;
      default:
        logger.warn(`Unknown operator: ${compareOperator}`);
        return false;
    }
  }

  /**
   * Évaluer prévision négative
   *
   * @private
   */
  _evaluateNegativeForecast(forecast, alert) {
    if (!forecast || !forecast.daily) {
      logger.warn(`No forecast data for alert ${alert.id}`);
      return false;
    }

    // Chercher si un jour devient négatif dans l'horizon
    const negativeDays = forecast.daily.filter(day => day.balance < 0);

    if (negativeDays.length > 0) {
      // Calculer le nombre de jours avant le premier solde négatif
      const firstNegativeIndex = forecast.daily.findIndex(day => day.balance < 0);
      forecast.daysToNegative = firstNegativeIndex + 1;
      return true;
    }

    return false;
  }

  /**
   * Évaluer variance vs prévision
   *
   * @private
   */
  _evaluateVariance(actual, forecast, alert) {
    if (!actual || !forecast) {
      logger.warn(`Missing data for variance alert ${alert.id}`);
      return false;
    }

    // TODO: Implémenter logique variance pour V2
    // Comparer les données réelles vs prévisions sur les derniers jours
    // et déclencher si écart > X%

    return false;
  }

  /**
   * Récupérer prévisions simplifiées
   *
   * @private
   */
  async _getForecast(companyId, days = 30) {
    try {
      // Récupérer toutes les transactions confirmées
      const transactions = await prisma.transaction.findMany({
        where: {
          account: { companyId },
          status: 'CONFIRMED'
        },
        select: {
          amount: true,
          type: true,
          occurredAt: true
        },
        orderBy: { occurredAt: 'desc' },
        take: 100 // Limiter pour performance
      });

      // Calculer le solde actuel
      const accounts = await prisma.account.findMany({
        where: { companyId, status: 'ACTIVE' },
        select: { balance: true }
      });
      const baseBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

      // Calculer les moyennes quotidiennes
      const recentDays = 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - recentDays);

      const recentTransactions = transactions.filter(
        tx => new Date(tx.occurredAt) >= cutoffDate
      );

      const totalCredit = recentTransactions
        .filter(tx => tx.type === 'credit')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const totalDebit = recentTransactions
        .filter(tx => tx.type === 'debit')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const avgDailyCredit = totalCredit / recentDays;
      const avgDailyDebit = totalDebit / recentDays;
      const avgDailyNet = avgDailyCredit - avgDailyDebit;

      // Générer prévisions jour par jour
      const daily = [];
      let runningBalance = baseBalance;

      for (let i = 0; i < days; i++) {
        runningBalance += avgDailyNet;

        const date = new Date();
        date.setDate(date.getDate() + i + 1);

        daily.push({
          date: date.toISOString().split('T')[0],
          balance: Math.round(runningBalance * 100) / 100,
          credit: avgDailyCredit,
          debit: avgDailyDebit
        });
      }

      return {
        days,
        baseBalance,
        projectedBalance: runningBalance,
        daily,
        trends: {
          avgDailyCredit,
          avgDailyDebit,
          avgDailyNet
        }
      };

    } catch (err) {
      logger.error('Failed to generate forecast:', err);
      return null;
    }
  }

  /**
   * Récupérer données actuelles pour variance
   *
   * @private
   */
  async _getActualData(companyId) {
    // TODO: Implémenter pour V2
    // Récupérer les données réelles des derniers jours
    return null;
  }
}

// Export instance unique
module.exports = new AlertEvaluatorService();
