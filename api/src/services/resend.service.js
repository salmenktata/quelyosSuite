/**
 * Resend Email Service for Cash Alerts and Notifications
 *
 * Service pour envoyer des alertes trésorerie via Resend API
 */

const { Resend } = require('resend');
const logger = require('../../logger');

// Lazy initialization: N'instancier Resend que si la clé API est configurée
let resend = null;

function getResendClient() {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_...') {
    return null;
  }

  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }

  return resend;
}

class ResendService {
  /**
   * Envoyer une alerte trésorerie par email
   *
   * @param {Object} params - Paramètres de l'alerte
   * @param {string} params.to - Email du destinataire
   * @param {string} params.userName - Nom de l'utilisateur
   * @param {string} params.alertName - Nom de l'alerte
   * @param {string} params.message - Message de l'alerte
   * @param {number} params.currentBalance - Solde actuel
   * @param {number} params.threshold - Seuil d'alerte
   * @param {string} params.actionUrl - URL d'action
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async sendCashAlert({ to, userName, alertName, message, currentBalance, threshold, actionUrl }) {
    // Vérifier que Resend est configuré
    const client = getResendClient();
    if (!client) {
      logger.warn('Resend API key not configured, email not sent');
      return { success: false, error: 'Resend not configured' };
    }

    try {
      const { data, error } = await client.emails.send({
        from: 'Quelyos Finance <alerts@quelyos.com>',
        to,
        subject: `🚨 Alerte Trésorerie : ${alertName}`,
        html: this._generateCashAlertTemplate({
          userName,
          alertName,
          message,
          currentBalance,
          threshold,
          actionUrl
        }),
        tags: [
          { name: 'category', value: 'cash-alert' },
          { name: 'alert-type', value: 'threshold' }
        ]
      });

      if (error) {
        logger.error('Resend email error:', error);
        return { success: false, error };
      }

      logger.info('Cash alert email sent:', { to, alertName, messageId: data.id });
      return { success: true, messageId: data.id };

    } catch (err) {
      logger.error('Failed to send cash alert email:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Template HTML pour alertes trésorerie
   *
   * @private
   */
  _generateCashAlertTemplate({ userName, alertName, message, currentBalance, threshold, actionUrl }) {
    const money = (val) => new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(val);

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${alertName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: white;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .alert-card {
            background: rgba(239, 68, 68, 0.1);
            border: 2px solid #ef4444;
            border-radius: 16px;
            padding: 32px;
            margin: 24px 0;
          }
          .alert-icon {
            font-size: 48px;
            text-align: center;
            margin-bottom: 16px;
          }
          h1 {
            color: #ef4444;
            margin: 0 0 16px 0;
            font-size: 20px;
            font-weight: 600;
          }
          .message {
            color: #cbd5e1;
            line-height: 1.6;
            margin: 16px 0;
            font-size: 15px;
          }
          .metrics {
            display: flex;
            justify-content: space-around;
            margin: 24px 0;
            padding: 20px;
            background: rgba(15, 23, 42, 0.6);
            border-radius: 12px;
          }
          .metric {
            text-align: center;
            flex: 1;
          }
          .metric-label {
            color: #94a3b8;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
          }
          .metric-value {
            color: white;
            font-size: 24px;
            font-weight: bold;
          }
          .metric-value.warning {
            color: #f59e0b;
          }
          .metric-value.danger {
            color: #ef4444;
          }
          .cta-container {
            text-align: center;
            margin: 24px 0 16px 0;
          }
          .cta {
            display: inline-block;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 15px;
            transition: all 0.2s;
          }
          .cta:hover {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            color: #64748b;
            font-size: 12px;
            line-height: 1.6;
          }
          .footer a {
            color: #6366f1;
            text-decoration: none;
          }
          .footer a:hover {
            text-decoration: underline;
          }
          .divider {
            height: 1px;
            background: rgba(148, 163, 184, 0.2);
            margin: 16px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <div class="logo">
              ✨ Quelyos Finance
            </div>
          </div>

          <!-- Alert Card -->
          <div class="alert-card">
            <div class="alert-icon">🚨</div>
            <h1>${alertName}</h1>

            <p class="message">Bonjour ${userName},</p>
            <p class="message">${message}</p>

            <!-- Metrics -->
            <div class="metrics">
              <div class="metric">
                <div class="metric-label">Solde actuel</div>
                <div class="metric-value danger">${money(currentBalance)}</div>
              </div>
              <div class="metric">
                <div class="metric-label">Seuil d'alerte</div>
                <div class="metric-value warning">${money(threshold)}</div>
              </div>
            </div>

            <!-- Call to Action -->
            <div class="cta-container">
              <a href="${actionUrl}" class="cta">Voir la trésorerie →</a>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Cette alerte a été configurée dans vos paramètres Quelyos Finance.</p>
            <div class="divider"></div>
            <p>
              <a href="${actionUrl.replace('/forecast', '/alerts')}">Gérer mes alertes</a> •
              <a href="${actionUrl.replace('/dashboard/forecast', '/dashboard/settings/notifications')}">Paramètres de notifications</a>
            </p>
            <div class="divider"></div>
            <p>© 2026 Quelyos. Tous droits réservés.</p>
            <p style="margin-top: 8px; color: #475569;">
              Vous recevez cet email car vous avez activé les alertes trésorerie.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Tester la configuration Resend
   *
   * @returns {Promise<Object>} Résultat du test
   */
  async testConfiguration() {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_...') {
      return {
        configured: false,
        message: 'RESEND_API_KEY not set in environment'
      };
    }

    try {
      // Test en envoyant un email de test (commenté pour éviter les envois accidentels)
      // const { data, error } = await resend.emails.send({
      //   from: 'Quelyos Finance <alerts@quelyos.com>',
      //   to: 'test@example.com',
      //   subject: 'Test Configuration Resend',
      //   html: '<p>Test configuration successful</p>'
      // });

      return {
        configured: true,
        message: 'Resend API key is set (test send commented out)'
      };
    } catch (err) {
      return {
        configured: false,
        error: err.message
      };
    }
  }
}

// Export instance unique
module.exports = new ResendService();
