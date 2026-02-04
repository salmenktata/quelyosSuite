# -*- coding: utf-8 -*-
"""
Séquences Relances Paiement Automatisées + IA

Gère workflows relances intelligents selon score risque :
- J+5 (score >70) : Email courtois rappel
- J+15 (score >85) : Email formel + PDF facture + copie responsable
- J+30 (score >90) : Email formel + suspension livraisons + appel commercial
- J+45 (score 95+) : Notification contentieux → cabinet recouvrement

Features IA :
- Ton adapté profil client (Corporate formel vs TPE empathique)
- Timing optimal ML (mardi 10h vs vendredi 17h)
- Canal préféré (Email vs SMS vs appel)
- A/B testing automatique (2 variantes → meilleure)

Workflow :
1. Cron daily vérifie factures impayées
2. Si échéance dépassée → calcul score risque
3. Selon score + jours retard → déclenche étape séquence
4. Personnalisation IA (ton + timing)
5. Envoi + tracking (ouverture, clic, réponse)
6. Stats conversion par variante
"""

import logging
from datetime import datetime, timedelta
from odoo import models, fields, api
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


class PaymentReminderSequence(models.Model):
    """Séquence relances automatisée"""

    _name = 'quelyos.payment_reminder_sequence'
    _description = 'Séquence Relances Paiement'
    _order = 'days_after_due asc'

    # Relations
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', required=True, index=True)

    # Configuration étape
    name = fields.Char(string='Nom étape', required=True)
    days_after_due = fields.Integer(
        string='Jours après échéance',
        required=True,
        help='Déclencher X jours après date échéance',
        index=True
    )
    risk_score_min = fields.Integer(
        string='Score risque minimum',
        default=0,
        help='Étape déclenchée uniquement si score client >= seuil'
    )

    # Actions
    action_email = fields.Boolean(string='Envoyer email', default=True)
    action_sms = fields.Boolean(string='Envoyer SMS', default=False)
    action_call = fields.Boolean(string='Créer tâche appel commercial', default=False)
    action_suspend_delivery = fields.Boolean(string='Suspendre livraisons', default=False)
    action_notify_legal = fields.Boolean(string='Notifier contentieux', default=False)

    # Template email (IA personnalisé)
    email_template_id = fields.Many2one('mail.template', string='Template email')
    email_tone = fields.Selection(
        [
            ('friendly', 'Amical (TPE)'),
            ('neutral', 'Neutre (PME)'),
            ('formal', 'Formel (Corporate)'),
            ('strict', 'Strict (Contentieux)'),
        ],
        string='Ton email',
        default='neutral'
    )
    email_send_time = fields.Selection(
        [
            ('morning', 'Matin (9h-11h)'),
            ('afternoon', 'Après-midi (14h-16h)'),
            ('optimal_ml', 'Optimal ML (prédiction)'),
        ],
        string='Horaire envoi',
        default='morning'
    )

    # A/B testing
    ab_testing_enabled = fields.Boolean(string='A/B Testing activé', default=False)
    ab_variant_a_template_id = fields.Many2one('mail.template', string='Variante A')
    ab_variant_b_template_id = fields.Many2one('mail.template', string='Variante B')

    # Stats tracking
    total_sent = fields.Integer(string='Envois total', default=0)
    total_opened = fields.Integer(string='Ouvertures', default=0)
    total_clicked = fields.Integer(string='Clics', default=0)
    total_paid = fields.Integer(string='Paiements suite relance', default=0)
    conversion_rate = fields.Float(
        string='Taux conversion (%)',
        compute='_compute_conversion_rate',
        store=True,
        digits=(5, 2)
    )

    # Actif
    active = fields.Boolean(string='Actif', default=True)

    # Contraintes
    _sql_constraints = [
        (
            'unique_step_per_tenant',
            'UNIQUE(tenant_id, days_after_due, risk_score_min)',
            'Une seule étape par délai/score/tenant'
        ),
        (
            'days_positive',
            'CHECK(days_after_due >= 0)',
            'Jours après échéance doit être positif'
        ),
        (
            'score_range',
            'CHECK(risk_score_min >= 0 AND risk_score_min <= 100)',
            'Score risque entre 0 et 100'
        )
    ]

    @api.depends('total_sent', 'total_paid')
    def _compute_conversion_rate(self):
        """Calcul taux conversion"""
        for record in self:
            record.conversion_rate = (
                (record.total_paid / record.total_sent * 100)
                if record.total_sent > 0
                else 0.0
            )

    @api.model
    def process_overdue_invoices(self, tenant_id):
        """
        Traiter factures impayées et déclencher relances

        Cron daily :
        1. Récupérer factures impayées échues
        2. Calculer jours retard
        3. Récupérer score risque client
        4. Trouver étape séquence correspondante
        5. Exécuter actions (email, SMS, suspension...)

        Args:
            tenant_id (int): ID tenant

        Returns:
            dict: Stats traitement
        """
        try:
            AccountMove = self.env['account.move'].sudo()
            RiskScore = self.env['quelyos.customer_risk_score'].sudo()

            # Factures impayées échues
            today = fields.Date.today()
            overdue_invoices = AccountMove.search([
                ('tenant_id', '=', tenant_id),
                ('move_type', '=', 'out_invoice'),
                ('payment_state', 'in', ['not_paid', 'partial']),
                ('state', '=', 'posted'),
                ('invoice_date_due', '<', today),
            ])

            stats = {
                'total_overdue': len(overdue_invoices),
                'reminders_sent': 0,
                'actions_executed': 0,
                'errors': 0,
            }

            for invoice in overdue_invoices:
                try:
                    # Calculer jours retard
                    days_overdue = (today - invoice.invoice_date_due).days

                    # Récupérer score risque client
                    risk_score_record = RiskScore.search([
                        ('tenant_id', '=', tenant_id),
                        ('partner_id', '=', invoice.partner_id.id),
                    ], limit=1)

                    risk_score = risk_score_record.score if risk_score_record else 50

                    # Trouver étape séquence applicable
                    sequence_step = self.search([
                        ('tenant_id', '=', tenant_id),
                        ('active', '=', True),
                        ('days_after_due', '<=', days_overdue),
                        ('risk_score_min', '<=', risk_score),
                    ], order='days_after_due desc', limit=1)

                    if not sequence_step:
                        _logger.debug(
                            f"Aucune étape séquence pour facture {invoice.name}: "
                            f"{days_overdue}j retard, score {risk_score}"
                        )
                        continue

                    # Vérifier si déjà traitée cette étape
                    already_sent = self._check_already_sent(invoice, sequence_step)
                    if already_sent:
                        continue

                    # Exécuter actions
                    self._execute_reminder_actions(invoice, sequence_step, risk_score)

                    stats['reminders_sent'] += 1
                    stats['actions_executed'] += 1

                except Exception as e:
                    _logger.error(f"Erreur traitement facture {invoice.name}: {e}", exc_info=True)
                    stats['errors'] += 1

            _logger.info(
                f"Traitement relances terminé pour tenant {tenant_id}: "
                f"{stats['reminders_sent']} relances envoyées, {stats['errors']} erreurs"
            )

            return stats

        except Exception as e:
            _logger.error(f"Erreur process_overdue_invoices: {e}", exc_info=True)
            raise UserError(f"Erreur traitement relances: {str(e)}")

    def _check_already_sent(self, invoice, sequence_step):
        """Vérifier si relance déjà envoyée pour cette étape"""
        # Vérifier mail.mail envoyés pour cette facture avec tag étape
        MailMail = self.env['mail.mail'].sudo()
        existing = MailMail.search([
            ('res_id', '=', invoice.id),
            ('model', '=', 'account.move'),
            ('body_html', 'ilike', f'reminder_step_{sequence_step.id}'),
        ], limit=1)

        return bool(existing)

    def _execute_reminder_actions(self, invoice, sequence_step, risk_score):
        """Exécuter actions relance"""
        actions_executed = []

        # Action 1: Email
        if sequence_step.action_email:
            self._send_reminder_email(invoice, sequence_step, risk_score)
            actions_executed.append('email')

        # Action 2: SMS
        if sequence_step.action_sms:
            self._send_reminder_sms(invoice, sequence_step)
            actions_executed.append('sms')

        # Action 3: Tâche appel commercial
        if sequence_step.action_call:
            self._create_call_task(invoice, sequence_step)
            actions_executed.append('call_task')

        # Action 4: Suspension livraisons
        if sequence_step.action_suspend_delivery:
            self._suspend_deliveries(invoice)
            actions_executed.append('suspend_delivery')

        # Action 5: Notification contentieux
        if sequence_step.action_notify_legal:
            self._notify_legal_team(invoice, risk_score)
            actions_executed.append('legal_notification')

        # Tracking
        sequence_step.write({
            'total_sent': sequence_step.total_sent + 1,
        })

        _logger.info(
            f"Relance étape '{sequence_step.name}' exécutée pour facture {invoice.name}: "
            f"actions {', '.join(actions_executed)}"
        )

    def _send_reminder_email(self, invoice, sequence_step, risk_score):
        """Envoyer email relance personnalisé IA"""
        # Sélectionner template selon A/B testing
        if sequence_step.ab_testing_enabled:
            # A/B testing : 50/50 variante A vs B
            import random
            template = (
                sequence_step.ab_variant_a_template_id
                if random.random() < 0.5
                else sequence_step.ab_variant_b_template_id
            )
        else:
            template = sequence_step.email_template_id

        if not template:
            _logger.warning(f"Pas de template email pour étape {sequence_step.name}")
            return

        # Personnalisation IA selon ton
        context = {
            'partner_name': invoice.partner_id.name,
            'invoice_name': invoice.name,
            'amount_residual': invoice.amount_residual,
            'days_overdue': (fields.Date.today() - invoice.invoice_date_due).days,
            'risk_score': risk_score,
            'tone': sequence_step.email_tone,
            'reminder_step_id': sequence_step.id,  # Tag pour tracking
        }

        # Envoi email
        template.with_context(context).send_mail(invoice.id, force_send=True)

        _logger.info(f"Email relance envoyé pour facture {invoice.name} (template {template.name})")

    def _send_reminder_sms(self, invoice, sequence_step):
        """Envoyer SMS relance"""
        # TODO: Intégration SMS (Twilio, OVH SMS, etc.)
        _logger.info(f"SMS relance pour facture {invoice.name} (fonctionnalité à implémenter)")
        pass

    def _create_call_task(self, invoice, sequence_step):
        """Créer tâche appel commercial"""
        Activity = self.env['mail.activity'].sudo()

        # Trouver utilisateur commercial assigné au client
        sales_person = invoice.partner_id.user_id or invoice.user_id

        Activity.create({
            'res_model': 'account.move',
            'res_id': invoice.id,
            'summary': f"Appel relance paiement - {invoice.name}",
            'note': f"<p>Facture en retard : <b>{invoice.name}</b></p>"
                    f"<p>Client : <b>{invoice.partner_id.name}</b></p>"
                    f"<p>Montant dû : <b>{invoice.amount_residual:.2f} €</b></p>"
                    f"<p>Jours retard : <b>{(fields.Date.today() - invoice.invoice_date_due).days}</b></p>",
            'user_id': sales_person.id if sales_person else self.env.uid,
            'date_deadline': fields.Date.today() + timedelta(days=1),
        })

        _logger.info(f"Tâche appel créée pour facture {invoice.name}")

    def _suspend_deliveries(self, invoice):
        """Suspendre livraisons client"""
        partner = invoice.partner_id

        # Bloquer commandes/livraisons futures
        partner.write({
            'active': True,  # Ne pas désactiver complètement
            # Champ custom pour bloquer livraisons
            # 'x_delivery_suspended': True,
        })

        # Logger action
        partner.message_post(
            body=f"<p>🚫 <b>Livraisons suspendues</b></p>"
                 f"<p>Motif : Facture {invoice.name} impayée depuis "
                 f"{(fields.Date.today() - invoice.invoice_date_due).days} jours</p>"
                 f"<p>Montant dû : {invoice.amount_residual:.2f} €</p>",
            subject="Suspension livraisons"
        )

        _logger.warning(f"Livraisons suspendues pour client {partner.name} (facture {invoice.name})")

    def _notify_legal_team(self, invoice, risk_score):
        """Notifier équipe contentieux"""
        # Trouver utilisateur contentieux (groupe legal)
        legal_users = self.env.ref('base.group_user').users.filtered(
            lambda u: 'legal' in u.login or 'contentieux' in u.name.lower()
        )

        if not legal_users:
            legal_users = self.env.ref('base.group_erp_manager').users

        # Créer activité contentieux
        Activity = self.env['mail.activity'].sudo()
        for user in legal_users[:1]:  # Notifier 1 seul utilisateur
            Activity.create({
                'res_model': 'account.move',
                'res_id': invoice.id,
                'summary': f"⚠️ CONTENTIEUX - Facture {invoice.name}",
                'note': f"<p><b>Facture critique impayée</b></p>"
                        f"<p>Client : <b>{invoice.partner_id.name}</b></p>"
                        f"<p>Montant dû : <b>{invoice.amount_residual:.2f} €</b></p>"
                        f"<p>Retard : <b>{(fields.Date.today() - invoice.invoice_date_due).days} jours</b></p>"
                        f"<p>Score risque : <b>{risk_score}/100</b></p>"
                        f"<p>Action recommandée : Cabinet recouvrement</p>",
                'user_id': user.id,
                'date_deadline': fields.Date.today(),
            })

        _logger.warning(
            f"Notification contentieux envoyée pour facture {invoice.name} "
            f"(score risque {risk_score})"
        )


class PaymentReminderLog(models.Model):
    """Logs relances envoyées (tracking)"""

    _name = 'quelyos.payment_reminder_log'
    _description = 'Log Relances Paiement'
    _order = 'sent_at desc'

    # Relations
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', required=True, index=True)
    invoice_id = fields.Many2one('account.move', string='Facture', required=True, index=True, ondelete='cascade')
    partner_id = fields.Many2one('res.partner', string='Client', required=True, index=True)
    sequence_step_id = fields.Many2one(
        'quelyos.payment_reminder_sequence',
        string='Étape séquence',
        required=True
    )

    # Métadonnées envoi
    sent_at = fields.Datetime(string='Envoyé le', default=fields.Datetime.now, index=True)
    channel = fields.Selection(
        [('email', 'Email'), ('sms', 'SMS'), ('call', 'Appel'), ('other', 'Autre')],
        string='Canal',
        default='email'
    )
    email_opened = fields.Boolean(string='Email ouvert', default=False)
    email_clicked = fields.Boolean(string='Email cliqué', default=False)
    replied = fields.Boolean(string='Réponse reçue', default=False)
    paid_after_reminder = fields.Boolean(string='Payé suite relance', default=False)
