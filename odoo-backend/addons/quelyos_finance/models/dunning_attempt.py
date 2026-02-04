# -*- coding: utf-8 -*-
"""
Module Dunning - Gestion Retry Paiements Échoués

Stratégie Dunning :
- J+0 : Paiement échoué détecté → Email notification
- J+1 : 1ère tentative retry automatique
- J+3 : 2ème tentative (si J+1 échoué)
- J+7 : 3ème tentative (si J+3 échoué)
- J+14 : 4ème et dernière tentative (si J+7 échoué)
- J+15 : Suspension abonnement si toujours échec

Impact SaaS moyen : 40% paiements échoués récupérés via dunning intelligent
"""

import logging
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError, UserError
from datetime import datetime, timedelta

_logger = logging.getLogger(__name__)


class DunningAttempt(models.Model):
    _name = 'quelyos.dunning.attempt'
    _description = 'Tentative Dunning (Retry Paiement)'
    _order = 'attempt_date desc'

    # Abonnement concerné
    subscription_id = fields.Many2one(
        'quelyos.subscription',
        string='Abonnement',
        required=True,
        ondelete='cascade',
        help='Abonnement en dunning'
    )

    partner_id = fields.Many2one(
        related='subscription_id.partner_id',
        string='Client',
        store=True,
        readonly=True
    )

    tenant_id = fields.Many2one(
        related='subscription_id.tenant_id',
        string='Tenant',
        store=True,
        readonly=True
    )

    # Détails tentative
    attempt_number = fields.Integer(
        string='Numéro Tentative',
        required=True,
        help='1, 2, 3, 4 (max 4 tentatives)'
    )

    attempt_date = fields.Datetime(
        string='Date Tentative',
        default=fields.Datetime.now,
        required=True,
        help='Date/heure de la tentative de retry'
    )

    scheduled_date = fields.Datetime(
        string='Date Planifiée',
        help='Date/heure planifiée pour cette tentative'
    )

    # Statut
    state = fields.Selection([
        ('scheduled', 'Planifiée'),
        ('processing', 'En cours'),
        ('success', 'Réussie'),
        ('failed', 'Échouée'),
        ('skipped', 'Ignorée'),
    ], string='Statut', default='scheduled', required=True)

    # Résultat
    amount = fields.Float(
        string='Montant (€)',
        help='Montant tenté de prélever'
    )

    payment_method = fields.Char(
        string='Moyen Paiement',
        help='Carte bancaire se terminant par...'
    )

    failure_reason = fields.Char(
        string='Raison Échec',
        help='Message d\'erreur Stripe (insufficient_funds, card_declined, etc.)'
    )

    stripe_payment_intent_id = fields.Char(
        string='Stripe Payment Intent ID',
        help='ID de la tentative de paiement Stripe'
    )

    stripe_invoice_id = fields.Char(
        string='Stripe Invoice ID',
        help='ID de la facture Stripe associée'
    )

    # Communication client
    email_sent = fields.Boolean(
        string='Email Envoyé',
        default=False,
        help='Email de notification envoyé au client'
    )

    email_sent_date = fields.Datetime(
        string='Date Envoi Email',
        help='Date/heure d\'envoi de l\'email'
    )

    # Notes
    notes = fields.Text(
        string='Notes',
        help='Informations additionnelles sur cette tentative'
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # Methods
    # ═══════════════════════════════════════════════════════════════════════════

    def action_process_retry(self):
        """
        Traiter la tentative de retry (appel Stripe API)

        Returns:
            bool: True si succès, False si échec
        """
        self.ensure_one()

        if self.state != 'scheduled':
            raise UserError(_("Seules les tentatives planifiées peuvent être traitées"))

        self.write({'state': 'processing'})

        try:
            # Récupérer subscription Stripe
            subscription = self.subscription_id
            if not subscription.stripe_subscription_id:
                raise ValidationError(_("Pas de Stripe Subscription ID"))

            # Appeler Stripe API pour retry
            # TODO: Implémenter appel réel Stripe API
            # stripe.Invoice.pay(subscription.stripe_invoice_id)

            _logger.info(f"[Dunning] Retry tentative {self.attempt_number} - Subscription {subscription.name}")

            # Simuler succès pour développement
            success = True  # À remplacer par résultat réel Stripe

            if success:
                self.write({
                    'state': 'success',
                    'notes': 'Paiement réussi lors du retry automatique'
                })

                # Remettre subscription en état active
                subscription.write({
                    'state': 'active',
                    'next_billing_date': subscription.next_billing_date + timedelta(days=30)
                })

                # Envoyer email confirmation
                self._send_success_email()

                return True

            else:
                # Échec - planifier prochaine tentative ou suspendre
                self.write({
                    'state': 'failed',
                    'failure_reason': 'Paiement refusé (simulation)',
                })

                self._handle_failed_attempt()

                return False

        except Exception as e:
            _logger.error(f"[Dunning] Erreur retry: {e}", exc_info=True)
            self.write({
                'state': 'failed',
                'failure_reason': str(e),
            })
            return False

    def _handle_failed_attempt(self):
        """
        Gérer échec tentative : planifier suivante ou suspendre subscription
        """
        self.ensure_one()

        subscription = self.subscription_id

        # Stratégie délais : J+1, J+3, J+7, J+14
        delay_days = {
            1: 1,   # Après 1ère tentative → retry dans 2 jours (J+3 total)
            2: 4,   # Après 2ème → retry dans 4 jours (J+7 total)
            3: 7,   # Après 3ème → retry dans 7 jours (J+14 total)
            4: 0,   # Après 4ème → abandon
        }

        next_delay = delay_days.get(self.attempt_number, 0)

        if next_delay > 0 and self.attempt_number < 4:
            # Planifier prochaine tentative
            next_attempt_date = datetime.now() + timedelta(days=next_delay)

            self.create({
                'subscription_id': subscription.id,
                'attempt_number': self.attempt_number + 1,
                'scheduled_date': next_attempt_date,
                'state': 'scheduled',
                'amount': self.amount,
            })

            _logger.info(f"[Dunning] Prochaine tentative {self.attempt_number + 1} planifiée pour {next_attempt_date}")

            # Envoyer email avertissement
            self._send_retry_email(next_attempt_date)

        else:
            # Échec final : suspendre subscription
            subscription.write({
                'state': 'cancelled',
                'end_date': fields.Date.today(),
            })

            _logger.warning(f"[Dunning] Échec final - Subscription {subscription.name} suspendue")

            # Envoyer email suspension
            self._send_cancellation_email()

    def _send_success_email(self):
        """Envoyer email confirmation paiement réussi"""
        # TODO: Implémenter template email
        self.write({
            'email_sent': True,
            'email_sent_date': fields.Datetime.now(),
        })
        _logger.info(f"[Dunning] Email succès envoyé - Subscription {self.subscription_id.name}")

    def _send_retry_email(self, next_date):
        """Envoyer email avertissement prochaine tentative"""
        # TODO: Implémenter template email
        _logger.info(f"[Dunning] Email retry envoyé - Prochaine tentative: {next_date}")

    def _send_cancellation_email(self):
        """Envoyer email suspension abonnement"""
        # TODO: Implémenter template email
        _logger.info(f"[Dunning] Email suspension envoyé - Subscription {self.subscription_id.name}")

    # ═══════════════════════════════════════════════════════════════════════════
    # Cron Methods
    # ═══════════════════════════════════════════════════════════════════════════

    @api.model
    def cron_process_scheduled_retries(self):
        """
        Cron quotidien : Traiter toutes les tentatives planifiées dont la date est atteinte

        Exécution : Tous les jours à 10h00
        """
        _logger.info("[Dunning] Début traitement tentatives planifiées")

        now = fields.Datetime.now()

        # Chercher tentatives planifiées dont scheduled_date <= maintenant
        scheduled_attempts = self.search([
            ('state', '=', 'scheduled'),
            ('scheduled_date', '<=', now),
        ])

        _logger.info(f"[Dunning] {len(scheduled_attempts)} tentatives à traiter")

        success_count = 0
        failed_count = 0

        for attempt in scheduled_attempts:
            try:
                result = attempt.action_process_retry()
                if result:
                    success_count += 1
                else:
                    failed_count += 1
            except Exception as e:
                _logger.error(f"[Dunning] Erreur traitement tentative {attempt.id}: {e}", exc_info=True)
                failed_count += 1

        _logger.info(f"[Dunning] Terminé : {success_count} succès, {failed_count} échecs")

    @api.model
    def create_initial_attempt(self, subscription_id, amount, failure_reason, stripe_invoice_id=None):
        """
        Créer la première tentative dunning suite à échec paiement

        Args:
            subscription_id (int): ID subscription
            amount (float): Montant échoué
            failure_reason (str): Raison échec Stripe
            stripe_invoice_id (str): ID facture Stripe

        Returns:
            recordset: Première tentative créée
        """
        subscription = self.env['quelyos.subscription'].browse(subscription_id)

        # Marquer subscription en past_due
        subscription.write({'state': 'past_due'})

        # Créer 1ère tentative planifiée J+1
        next_attempt_date = datetime.now() + timedelta(days=1)

        attempt = self.create({
            'subscription_id': subscription_id,
            'attempt_number': 1,
            'scheduled_date': next_attempt_date,
            'state': 'scheduled',
            'amount': amount,
            'failure_reason': failure_reason,
            'stripe_invoice_id': stripe_invoice_id,
        })

        _logger.info(f"[Dunning] 1ère tentative créée pour {subscription.name} - Planifiée {next_attempt_date}")

        return attempt


class DunningStatistics(models.Model):
    _name = 'quelyos.dunning.statistics'
    _description = 'Statistiques Dunning Mensuel'
    _order = 'period_start desc'

    # Période
    period_start = fields.Date(
        string='Début Période',
        required=True
    )

    period_end = fields.Date(
        string='Fin Période',
        required=True
    )

    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        required=True,
        ondelete='cascade'
    )

    # Stats
    total_attempts = fields.Integer(
        string='Tentatives Totales',
        help='Nombre total de tentatives ce mois'
    )

    success_count = fields.Integer(
        string='Succès',
        help='Nombre de paiements récupérés'
    )

    failed_count = fields.Integer(
        string='Échecs',
        help='Nombre d\'échecs définitifs'
    )

    success_rate = fields.Float(
        string='Taux Succès (%)',
        compute='_compute_success_rate',
        store=True,
        help='(Succès / Total) × 100'
    )

    revenue_recovered = fields.Float(
        string='Revenus Récupérés (€)',
        help='Montant total récupéré via dunning'
    )

    revenue_lost = fields.Float(
        string='Revenus Perdus (€)',
        help='Montant perdu (échecs définitifs)'
    )

    @api.depends('success_count', 'total_attempts')
    def _compute_success_rate(self):
        for record in self:
            if record.total_attempts > 0:
                record.success_rate = (record.success_count / record.total_attempts) * 100
            else:
                record.success_rate = 0.0
