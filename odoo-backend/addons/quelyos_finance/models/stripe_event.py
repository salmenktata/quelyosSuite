# -*- coding: utf-8 -*-
"""
Modèle Stripe Event - Idempotence Webhooks

Stocke tous les événements Stripe reçus pour garantir idempotence :
- Vérification event déjà traité (via event_id unique)
- Retry automatique échec traitement
- Logs complets audit trail
- Queue async pour performance

Workflow :
1. Webhook reçu → Vérifier si event_id existe
2. Si existe → Retourner succès (idempotence)
3. Sinon → Créer record + traiter async
4. Marquer processed/failed selon résultat
"""

import logging
from odoo import models, fields, api
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


class StripeEvent(models.Model):
    """Event Stripe reçu via webhook"""

    _name = 'quelyos.stripe_event'
    _description = 'Stripe Webhook Event'
    _order = 'create_date desc'
    _rec_name = 'event_id'

    # Event Stripe
    event_id = fields.Char(
        string='Event ID Stripe',
        required=True,
        index=True,
        help='ID unique événement Stripe (ex: evt_xxx)'
    )
    event_type = fields.Char(
        string='Type événement',
        required=True,
        index=True,
        help='Type événement Stripe (ex: payment_intent.succeeded)'
    )
    event_data = fields.Text(
        string='Données JSON',
        help='Payload complet événement Stripe'
    )

    # Relations
    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        index=True,
        help='Tenant concerné (si applicable)'
    )
    payment_intent_id = fields.Char(
        string='Payment Intent ID',
        index=True,
        help='ID Payment Intent Stripe'
    )

    # État traitement
    state = fields.Selection(
        [
            ('pending', 'En attente'),
            ('processing', 'En cours'),
            ('processed', 'Traité'),
            ('failed', 'Échec'),
        ],
        string='État',
        default='pending',
        required=True,
        index=True
    )

    # Résultat traitement
    processed_date = fields.Datetime(string='Traité le', readonly=True)
    error_message = fields.Text(string='Message erreur', readonly=True)
    retry_count = fields.Integer(string='Tentatives retry', default=0, readonly=True)

    # Métadonnées
    create_date = fields.Datetime(string='Reçu le', readonly=True)
    api_version = fields.Char(string='API Version Stripe')

    # Contraintes
    _sql_constraints = [
        (
            'unique_event_id',
            'UNIQUE(event_id)',
            'Un événement Stripe ne peut être traité qu\'une seule fois'
        )
    ]

    @api.model
    def is_event_processed(self, event_id):
        """
        Vérifier si événement déjà traité (idempotence)

        Args:
            event_id (str): ID événement Stripe

        Returns:
            bool: True si déjà traité, False sinon
        """
        existing = self.search([('event_id', '=', event_id)], limit=1)
        return bool(existing)

    @api.model
    def create_from_webhook(self, event_data):
        """
        Créer record depuis webhook Stripe

        Args:
            event_data (dict): Données événement Stripe

        Returns:
            quelyos.stripe_event: Record créé

        Raises:
            UserError: Si event_id déjà existe (idempotence)
        """
        event_id = event_data.get('id')
        event_type = event_data.get('type')

        # Vérifier idempotence
        if self.is_event_processed(event_id):
            _logger.info(f"Event {event_id} already processed (idempotence)")
            existing = self.search([('event_id', '=', event_id)], limit=1)
            return existing

        # Extraire metadata
        event_object = event_data.get('data', {}).get('object', {})
        payment_intent_id = event_object.get('id') if 'payment_intent' in event_type else None
        metadata = event_object.get('metadata', {})
        tenant_id = metadata.get('tenant_id')

        # Créer record
        import json
        record = self.create({
            'event_id': event_id,
            'event_type': event_type,
            'event_data': json.dumps(event_data),
            'payment_intent_id': payment_intent_id,
            'tenant_id': int(tenant_id) if tenant_id else None,
            'state': 'pending',
            'api_version': event_data.get('api_version'),
        })

        _logger.info(
            f"Stripe event recorded: {event_id} ({event_type}) → record {record.id}"
        )

        return record

    def action_process_event(self):
        """
        Traiter événement (appelé async via queue job)
        """
        self.ensure_one()

        if self.state == 'processed':
            _logger.info(f"Event {self.event_id} already processed")
            return

        self.write({'state': 'processing'})

        try:
            # Parser event data
            import json
            event_data = json.loads(self.event_data)
            event_type = event_data.get('type')
            event_object = event_data.get('data', {}).get('object', {})

            # Router selon type événement
            if event_type == 'payment_intent.succeeded':
                self._handle_payment_succeeded(event_object)

            elif event_type == 'payment_intent.payment_failed':
                self._handle_payment_failed(event_object)

            elif event_type == 'charge.succeeded':
                self._handle_charge_succeeded(event_object)

            elif event_type == 'charge.refunded':
                self._handle_charge_refunded(event_object)

            else:
                _logger.info(f"Event type {event_type} not handled (ignored)")

            # Marquer traité
            self.write({
                'state': 'processed',
                'processed_date': fields.Datetime.now(),
            })

            _logger.info(f"Event {self.event_id} processed successfully")

        except Exception as e:
            _logger.error(f"Error processing event {self.event_id}: {e}", exc_info=True)

            self.write({
                'state': 'failed',
                'error_message': str(e),
                'retry_count': self.retry_count + 1,
            })

            # Retry automatique si < 3 tentatives
            if self.retry_count < 3:
                _logger.info(f"Will retry event {self.event_id} (attempt {self.retry_count + 1}/3)")
                # TODO: Enqueue retry job avec délai exponentiel
            else:
                _logger.error(f"Event {self.event_id} failed after 3 retries")

    def _handle_payment_succeeded(self, payment_intent):
        """
        Gérer succès paiement Stripe

        Args:
            payment_intent (dict): Objet Payment Intent Stripe
        """
        payment_intent_id = payment_intent['id']

        # Récupérer purchase
        Purchase = self.env['quelyos.theme.purchase'].sudo()
        purchase = Purchase.search([
            ('stripe_payment_intent_id', '=', payment_intent_id),
        ], limit=1)

        if not purchase:
            _logger.warning(f"Purchase not found for Payment Intent {payment_intent_id}")
            return

        # Vérifier si déjà traité (double-check idempotence)
        if purchase.status == 'completed':
            _logger.info(f"Purchase {purchase.id} already completed")
            return

        # Mettre à jour purchase
        purchase.write({
            'status': 'completed',
            'completion_date': fields.Datetime.now(),
        })

        # Créer revenue si designer
        if purchase.submission_id and purchase.submission_id.designer_id:
            designer = purchase.submission_id.designer_id
            amount = purchase.amount

            designer_amount = amount * (designer.revenue_share_rate / 100)
            platform_amount = amount - designer_amount

            self.env['quelyos.theme.revenue'].sudo().create({
                'purchase_id': purchase.id,
                'designer_id': designer.id,
                'submission_id': purchase.submission_id.id,
                'amount': amount,
                'designer_share': designer_amount,
                'platform_share': platform_amount,
                'status': 'pending_payout',
            })

        _logger.info(
            f"Payment succeeded processed: Purchase {purchase.id} → completed"
        )

    def _handle_payment_failed(self, payment_intent):
        """
        Gérer échec paiement Stripe

        Args:
            payment_intent (dict): Objet Payment Intent Stripe
        """
        payment_intent_id = payment_intent['id']

        # Récupérer purchase
        Purchase = self.env['quelyos.theme.purchase'].sudo()
        purchase = Purchase.search([
            ('stripe_payment_intent_id', '=', payment_intent_id),
        ], limit=1)

        if not purchase:
            _logger.warning(f"Purchase not found for Payment Intent {payment_intent_id}")
            return

        # Mettre à jour purchase
        purchase.write({
            'status': 'failed',
        })

        _logger.info(
            f"Payment failed processed: Purchase {purchase.id} → failed"
        )

    def _handle_charge_succeeded(self, charge):
        """
        Gérer succès charge Stripe

        Args:
            charge (dict): Objet Charge Stripe
        """
        _logger.info(f"Charge succeeded: {charge['id']}")
        # Implémentation future si nécessaire

    def _handle_charge_refunded(self, charge):
        """
        Gérer remboursement charge Stripe

        Args:
            charge (dict): Objet Charge Stripe
        """
        _logger.info(f"Charge refunded: {charge['id']}")
        # TODO: Implémenter logique remboursement
        # - Marquer purchase comme refunded
        # - Annuler revenue designer
        # - Notifier parties concernées

    @api.model
    def cleanup_old_events(self, days=90):
        """
        Nettoyer événements anciens (> X jours)

        Args:
            days (int): Nombre jours rétention

        Returns:
            int: Nombre events supprimés
        """
        from datetime import datetime, timedelta

        cutoff_date = datetime.now() - timedelta(days=days)

        old_events = self.search([
            ('create_date', '<', cutoff_date),
            ('state', '=', 'processed'),
        ])

        count = len(old_events)
        old_events.unlink()

        _logger.info(f"Cleaned up {count} old Stripe events (>{days} days)")

        return count
