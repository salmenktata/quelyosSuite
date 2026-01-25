/**
 * Alert Notifier Service for Cash Alerts (F93)
 *
 * Service pour notifier les alertes de trésorerie déclenchées
 */

const resendService = require('./resend.service');
const logger = require('../../logger');
const prisma = require('../../prismaClient');

class AlertNotifierService {
  /**
   * Notifier une alerte déclenchée
   *
   * @param {Object} evaluationResult - Résultat de l'évaluation
   * @returns {Promise<Object>} Trigger créé
   */
  async notify(evaluationResult) {
    const { alert, context, value } = evaluationResult;

    try {
      // 1. Créer le trigger en DB (historique)
      const trigger = await prisma.alertTrigger.create({
        data: {
          alertId: alert.id,
          triggeredAt: new Date(),
          value,
          context: context || {}
        }
      });

      logger.info(`Alert ${alert.id} triggered:`, {
        alertId: alert.id,
        triggerId: trigger.id,
        type: alert.type,
        value
      });

      // 2. Créer notification in-app
      await this._createInAppNotification(alert, context, trigger);

      // 3. Envoyer email si activé
      if (alert.emailEnabled) {
        const emailResult = await this._sendEmailNotification(alert, context, trigger);

        // Mettre à jour le trigger avec le statut email
        if (emailResult.success) {
          await prisma.alertTrigger.update({
            where: { id: trigger.id },
            data: {
              emailSent: true,
              emailSentAt: new Date()
            }
          });
        }
      }

      return trigger;

    } catch (err) {
      logger.error('Failed to notify alert:', err);
      throw err;
    }
  }

  /**
   * Créer une notification in-app
   *
   * @private
   */
  async _createInAppNotification(alert, context, trigger) {
    try {
      await prisma.notification.create({
        data: {
          userId: alert.userId,
          type: 'CASH_ALERT',
          title: alert.name,
          message: this._generateMessage(alert, context),
          actionUrl: '/dashboard/forecast',
          metadata: {
            alertId: alert.id,
            triggerId: trigger.id,
            alertType: alert.type,
            context
          }
        }
      });

      logger.info(`In-app notification created for alert ${alert.id}`);
    } catch (err) {
      logger.error('Failed to create in-app notification:', err);
      // Ne pas throw, continuer avec email
    }
  }

  /**
   * Envoyer notification par email
   *
   * @private
   */
  async _sendEmailNotification(alert, context, trigger) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3007';

    try {
      // Email principal à l'utilisateur
      const primaryEmail = await resendService.sendCashAlert({
        to: alert.user.email,
        userName: alert.user.firstName || alert.user.lastName || 'Utilisateur',
        alertName: alert.name,
        message: this._generateMessage(alert, context),
        currentBalance: context.currentBalance || context.forecast?.baseBalance || 0,
        threshold: alert.thresholdAmount || 0,
        actionUrl: `${frontendUrl}/dashboard/forecast`
      });

      // Emails additionnels (CC)
      if (alert.emailRecipients && alert.emailRecipients.length > 0) {
        for (const email of alert.emailRecipients) {
          await resendService.sendCashAlert({
            to: email,
            userName: 'Équipe',
            alertName: alert.name,
            message: this._generateMessage(alert, context),
            currentBalance: context.currentBalance || 0,
            threshold: alert.thresholdAmount || 0,
            actionUrl: `${frontendUrl}/dashboard/forecast`
          });
        }
      }

      return primaryEmail;

    } catch (err) {
      logger.error('Failed to send email notification:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Générer message d'alerte personnalisé selon le type
   *
   * @private
   */
  _generateMessage(alert, context) {
    const money = (val) => {
      if (val === null || val === undefined) return 'N/A';
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0
      }).format(val);
    };

    switch (alert.type) {
      case 'THRESHOLD':
        return `Votre trésorerie est passée ${this._getOperatorText(alert.compareOperator)} le seuil de ${money(alert.thresholdAmount)}. Solde actuel : ${money(context.currentBalance)}.`;

      case 'NEGATIVE_FORECAST':
        if (context.daysToNegative) {
          return `⚠️ Attention : vos prévisions indiquent un risque de trésorerie négative dans ${context.daysToNegative} jour${context.daysToNegative > 1 ? 's' : ''} (horizon ${alert.horizonDays} jours).`;
        }
        return `⚠️ Attention : vos prévisions indiquent un risque de trésorerie négative dans les ${alert.horizonDays} prochains jours.`;

      case 'VARIANCE':
        if (context.variance) {
          return `Écart significatif détecté entre vos prévisions et la réalité (${Math.round(context.variance)}%).`;
        }
        return `Écart significatif détecté entre vos prévisions et la réalité.`;

      default:
        return `Alerte trésorerie : ${alert.name}`;
    }
  }

  /**
   * Obtenir texte lisible pour l'opérateur de comparaison
   *
   * @private
   */
  _getOperatorText(operator) {
    switch (operator) {
      case 'lt':
        return 'sous';
      case 'lte':
        return 'sous ou égal à';
      case 'gt':
        return 'au-dessus de';
      case 'gte':
        return 'au-dessus ou égal à';
      default:
        return 'par rapport à';
    }
  }

  /**
   * Notifier plusieurs alertes en batch
   *
   * @param {Array} evaluationResults - Résultats d'évaluation
   * @returns {Promise<Array>} Triggers créés
   */
  async notifyBatch(evaluationResults) {
    const triggers = [];

    for (const result of evaluationResults) {
      try {
        const trigger = await this.notify(result);
        triggers.push(trigger);
      } catch (err) {
        logger.error(`Failed to notify alert ${result.alert.id}:`, err);
        // Continuer avec les autres alertes
      }
    }

    return triggers;
  }
}

// Export instance unique
module.exports = new AlertNotifierService();
