const brevo = require("@getbrevo/brevo");
const logger = require("../../logger");

/**
 * Service d'envoi d'emails via Brevo (anciennement Sendinblue)
 * Documentation: https://developers.brevo.com/docs
 */
class BrevoService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.apiInstance = null;

    if (this.apiKey && this.apiKey !== "" && this.apiKey !== "your-brevo-api-key-here") {
      this.apiInstance = new brevo.TransactionalEmailsApi();
      this.apiInstance.setApiKey(
        brevo.TransactionalEmailsApiApiKeys.apiKey,
        this.apiKey
      );
      logger.info("[Brevo] Service initialized successfully");
    } else {
      logger.warn("[Brevo] API key not configured - emails will not be sent");
    }
  }

  /**
   * Envoyer une alerte trésorerie par email
   */
  async sendCashAlert({
    to,
    userName,
    alertName,
    message,
    currentBalance,
    threshold,
    actionUrl,
  }) {
    if (!this.apiInstance) {
      logger.warn("[Brevo] Email not sent - service not initialized");
      return { success: false, error: "Brevo service not configured" };
    }

    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();

      sendSmtpEmail.sender = {
        name: "Quelyos Finance",
        email: process.env.BREVO_SENDER_EMAIL || "noreply@quelyos.com",
      };

      sendSmtpEmail.to = [{ email: to, name: userName || to }];

      sendSmtpEmail.subject = `🚨 Alerte Trésorerie : ${alertName}`;

      sendSmtpEmail.htmlContent = this._generateCashAlertTemplate({
        userName,
        alertName,
        message,
        currentBalance,
        threshold,
        actionUrl,
      });

      // Tags pour le tracking dans Brevo
      sendSmtpEmail.tags = ["cash-alert", "f93", "quelyos-finance"];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);

      logger.info("[Brevo] Cash alert email sent:", {
        to,
        alertName,
        messageId: result.messageId,
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      logger.error("[Brevo] Failed to send cash alert email:", error);
      return {
        success: false,
        error: error.message || "Unknown error",
      };
    }
  }

  /**
   * Template HTML pour alertes trésorerie
   * Design moderne avec dark mode et glassmorphism
   */
  _generateCashAlertTemplate({
    userName,
    alertName,
    message,
    currentBalance,
    threshold,
    actionUrl,
  }) {
    const money = (val) =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(val);

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Alerte Trésorerie - Quelyos</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
            color: #e2e8f0;
            margin: 0;
            padding: 0;
            line-height: 1.6;
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
            backdrop-filter: blur(10px);
          }
          .alert-icon {
            font-size: 48px;
            text-align: center;
            margin-bottom: 16px;
          }
          h1 {
            color: #ef4444;
            margin: 0 0 16px 0;
            font-size: 24px;
            text-align: center;
          }
          .message {
            color: #cbd5e1;
            line-height: 1.8;
            margin: 16px 0;
            font-size: 16px;
          }
          .metrics {
            display: table;
            width: 100%;
            margin: 24px 0;
            background: rgba(15, 23, 42, 0.6);
            border-radius: 12px;
            padding: 20px;
            border-collapse: separate;
            border-spacing: 0;
          }
          .metric {
            display: table-cell;
            text-align: center;
            padding: 10px;
            width: 50%;
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
            font-size: 28px;
            font-weight: bold;
            display: block;
          }
          .metric-value.warning {
            color: #f59e0b;
          }
          .metric-value.danger {
            color: #ef4444;
          }
          .cta {
            display: inline-block;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white !important;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-weight: 600;
            margin: 16px 0;
            text-align: center;
            width: 100%;
            box-sizing: border-box;
          }
          .cta:hover {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            color: #64748b;
            font-size: 13px;
            line-height: 1.8;
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
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            margin: 24px 0;
          }
          @media only screen and (max-width: 600px) {
            .container {
              padding: 20px 10px;
            }
            .alert-card {
              padding: 20px;
            }
            h1 {
              font-size: 20px;
            }
            .metric-value {
              font-size: 22px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <span>✨</span>
              <span>Quelyos Finance</span>
            </div>
          </div>

          <div class="alert-card">
            <div class="alert-icon">🚨</div>
            <h1>${alertName}</h1>

            <p class="message">Bonjour ${userName || ""},</p>
            <p class="message">${message}</p>

            <div class="metrics">
              <div class="metric">
                <div class="metric-label">Solde actuel</div>
                <span class="metric-value danger">${money(currentBalance)}</span>
              </div>
              <div class="metric">
                <div class="metric-label">Seuil d'alerte</div>
                <span class="metric-value warning">${money(threshold)}</span>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="${actionUrl}" class="cta">Voir la trésorerie →</a>
            </div>
          </div>

          <div class="divider"></div>

          <div class="footer">
            <p>Cette alerte a été configurée dans vos paramètres Quelyos.</p>
            <p>
              <a href="${actionUrl.replace("/forecast", "/alerts")}">Gérer mes alertes</a>
            </p>
            <div class="divider"></div>
            <p>© ${new Date().getFullYear()} Quelyos. Tous droits réservés.</p>
            <p style="font-size: 11px; color: #475569; margin-top: 16px;">
              Cet email a été envoyé automatiquement par Quelyos Finance.<br>
              Si vous ne souhaitez plus recevoir ces alertes, désactivez-les dans vos paramètres.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Envoyer un email de test
   * Utile pour vérifier la configuration
   */
  async sendTestEmail(to) {
    if (!this.apiInstance) {
      return {
        success: false,
        error: "Brevo service not configured",
      };
    }

    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();

      sendSmtpEmail.sender = {
        name: "Quelyos Finance",
        email: process.env.BREVO_SENDER_EMAIL || "noreply@quelyos.com",
      };

      sendSmtpEmail.to = [{ email: to }];
      sendSmtpEmail.subject = "Test - Configuration Brevo Quelyos";
      sendSmtpEmail.htmlContent = `
        <h1>✅ Configuration Brevo réussie !</h1>
        <p>Votre service d'envoi d'emails Brevo est correctement configuré pour Quelyos Finance.</p>
        <p>Les alertes trésorerie pourront être envoyées sans problème.</p>
      `;

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);

      logger.info("[Brevo] Test email sent successfully:", {
        to,
        messageId: result.messageId,
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      logger.error("[Brevo] Test email failed:", error);
      return {
        success: false,
        error: error.message || "Unknown error",
      };
    }
  }
}

module.exports = new BrevoService();
