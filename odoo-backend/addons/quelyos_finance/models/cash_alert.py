from odoo import models, fields, api
import logging

_logger = logging.getLogger(__name__)


class QuelyosCashAlert(models.Model):
    _name = 'quelyos.cash.alert'
    _description = 'Alerte de trésorerie'
    _order = 'name'

    name = fields.Char(string='Nom', required=True, index=True)
    alert_type = fields.Selection([
        ('threshold', 'Seuil minimum'),
        ('negative_forecast', 'Prévision négative'),
        ('variance', 'Variance'),
        ('budget_exceeded', 'Budget dépassé'),
    ], string='Type d\'alerte', required=True, default='threshold')
    is_active = fields.Boolean(string='Actif', default=True)
    threshold_amount = fields.Monetary(
        string='Montant seuil',
        currency_field='currency_id',
        help='Montant en dessous duquel l\'alerte se déclenche'
    )
    horizon_days = fields.Integer(
        string='Horizon (jours)',
        default=30,
        help='Nombre de jours pour la prévision'
    )
    cooldown_hours = fields.Integer(
        string='Délai entre alertes (heures)',
        default=24,
        help='Temps minimum entre deux alertes'
    )
    email_enabled = fields.Boolean(string='Notification email', default=True)
    email_recipients = fields.Char(
        string='Destinataires email',
        help='Adresses email séparées par des virgules'
    )
    account_id = fields.Many2one(
        'account.account',
        string='Compte surveillé',
        help='Laisser vide pour surveiller tous les comptes'
    )
    portfolio_id = fields.Many2one(
        'quelyos.portfolio',
        string='Portefeuille surveillé'
    )
    company_id = fields.Many2one(
        'res.company', string='Société',
        default=lambda self: self.env.company,
        required=True
    )
    currency_id = fields.Many2one(
        'res.currency',
        related='company_id.currency_id',
        string='Devise'
    )

    # Historique des déclenchements
    last_triggered = fields.Datetime(string='Dernier déclenchement')
    trigger_count = fields.Integer(string='Nombre de déclenchements', default=0)

    def _to_dict(self):
        """Convertit le record en dictionnaire pour l'API"""
        return {
            'id': self.id,
            'name': self.name,
            'type': self.alert_type,
            'isActive': self.is_active,
            'thresholdAmount': self.threshold_amount,
            'horizonDays': self.horizon_days,
            'cooldownHours': self.cooldown_hours,
            'emailEnabled': self.email_enabled,
            'emailRecipients': self.email_recipients.split(',') if self.email_recipients else [],
            'accountId': self.account_id.id if self.account_id else None,
            'portfolioId': self.portfolio_id.id if self.portfolio_id else None,
            'lastTriggered': self.last_triggered.isoformat() if self.last_triggered else None,
            'triggerCount': self.trigger_count,
        }

    def check_and_trigger(self):
        """Vérifie les conditions et déclenche l'alerte si nécessaire"""
        from datetime import datetime, timedelta

        for alert in self.search([('is_active', '=', True)]):
            # Vérifier le cooldown
            if alert.last_triggered:
                cooldown_end = alert.last_triggered + timedelta(hours=alert.cooldown_hours)
                if datetime.now() < cooldown_end:
                    continue

            should_trigger = False

            if alert.alert_type == 'threshold':
                # Calculer le solde actuel
                balance = alert._get_current_balance()
                should_trigger = balance < alert.threshold_amount

            elif alert.alert_type == 'negative_forecast':
                # Vérifier si le solde prévu est négatif
                forecast = alert._get_forecast_balance()
                should_trigger = forecast < 0

            if should_trigger:
                alert._trigger_alert()

    def _get_current_balance(self):
        """Calcule le solde actuel du compte ou portefeuille surveillé"""
        if self.account_id:
            return self.account_id.current_balance if hasattr(self.account_id, 'current_balance') else 0
        elif self.portfolio_id:
            return self.portfolio_id.total_balance
        return 0

    def _get_forecast_balance(self):
        """Calcule le solde prévisionnel basé sur les mouvements récents"""
        from datetime import datetime, timedelta

        current_balance = self._get_current_balance()

        if not self.horizon_days:
            return current_balance

        # Calculer la moyenne des mouvements quotidiens sur les 30 derniers jours
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)

        # Récupérer les mouvements comptables sur la période
        domain = [
            ('company_id', '=', self.company_id.id),
            ('date', '>=', start_date.date()),
            ('date', '<=', end_date.date()),
            ('parent_state', '=', 'posted'),
        ]

        if self.account_id:
            domain.append(('account_id', '=', self.account_id.id))
        elif self.portfolio_id:
            domain.append(('account_id', 'in', self.portfolio_id.account_ids.ids))

        move_lines = self.env['account.move.line'].search(domain)

        if not move_lines:
            return current_balance

        # Calculer le total des mouvements (débit - crédit)
        total_movement = sum(line.debit - line.credit for line in move_lines)

        # Moyenne quotidienne
        daily_avg = total_movement / 30

        # Projection sur l'horizon
        forecast_balance = current_balance + (daily_avg * self.horizon_days)

        return forecast_balance

    def _trigger_alert(self):
        """Déclenche l'alerte et envoie les notifications"""
        from datetime import datetime
        import logging

        _logger = logging.getLogger(__name__)

        self.write({
            'last_triggered': datetime.now(),
            'trigger_count': self.trigger_count + 1,
        })

        # Envoyer notification email si activé
        if self.email_enabled and self.email_recipients:
            try:
                self._send_alert_email()
            except Exception as e:
                _logger.error(f"Erreur lors de l'envoi d'email pour l'alerte {self.name}: {e}")

        # Créer une activité pour l'admin
        self._create_alert_activity()

    def _send_alert_email(self):
        """Envoie un email d'alerte"""
        template = self.env.ref('quelyos_finance.email_template_cash_alert', raise_if_not_found=False)

        if not template:
            # Créer email sans template
            recipients = [email.strip() for email in self.email_recipients.split(',')]
            balance = self._get_current_balance()

            subject = f"🚨 Alerte Trésorerie: {self.name}"
            body = f"""
                <html>
                <body>
                    <h2>Alerte de trésorerie déclenchée</h2>
                    <p><strong>Type d'alerte:</strong> {dict(self._fields['alert_type'].selection).get(self.alert_type)}</p>
                    <p><strong>Solde actuel:</strong> {balance:.2f} {self.currency_id.symbol}</p>
                    <p><strong>Seuil configuré:</strong> {self.threshold_amount:.2f} {self.currency_id.symbol}</p>
                    <hr>
                    <p>Cette alerte a été déclenchée {self.trigger_count} fois.</p>
                    <p><em>Email automatique - Quelyos Finance</em></p>
                </body>
                </html>
            """

            mail_values = {
                'subject': subject,
                'body_html': body,
                'email_to': ','.join(recipients),
                'email_from': self.env.user.email or 'noreply@quelyos.com',
            }
            mail = self.env['mail.mail'].create(mail_values)
            mail.send()

    def _create_alert_activity(self):
        """Crée une activité Odoo pour tracer l'alerte"""
        balance = self._get_current_balance()

        activity_type = self.env.ref('mail.mail_activity_data_warning', raise_if_not_found=False)
        if not activity_type:
            activity_type = self.env['mail.activity.type'].search([('name', '=', 'Warning')], limit=1)

        if activity_type:
            self.env['mail.activity'].create({
                'activity_type_id': activity_type.id,
                'summary': f"Alerte trésorerie: {self.name}",
                'note': f"""
                    Type: {dict(self._fields['alert_type'].selection).get(self.alert_type)}<br/>
                    Solde actuel: {balance:.2f} {self.currency_id.symbol}<br/>
                    Seuil: {self.threshold_amount:.2f} {self.currency_id.symbol}
                """,
                'res_model_id': self.env['ir.model']._get_id('res.company'),
                'res_id': self.company_id.id,
                'user_id': self.env.ref('base.user_admin').id,
            })
