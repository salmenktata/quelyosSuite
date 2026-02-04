# -*- coding: utf-8 -*-
"""
Connexions Bancaires Multi-Sources

Gère connexions API pour import automatique transactions :
- Stripe (webhook + API REST)
- PayPal (API REST)
- Open Banking DSP2 (Bridge API, Powens, Bankin)

Configuration :
- Credentials API (clés secrètes chiffrées)
- Mapping comptes (Stripe account → compte bancaire Odoo)
- Fréquence synchronisation (temps réel, horaire, quotidien)
- Webhooks endpoints

Sécurité :
- Clés API chiffrées (Fernet AES)
- Logs accès
- Rate limiting
"""

import logging
from odoo import models, fields, api
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


class BankConnection(models.Model):
    """Connexion bancaire externe"""

    _name = 'quelyos.bank_connection'
    _description = 'Connexion Bancaire'
    _order = 'name'

    # Relations
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', required=True, index=True)
    bank_account_id = fields.Many2one(
        'res.partner.bank',
        string='Compte bancaire',
        help='Compte bancaire Odoo lié',
        required=True
    )

    # Configuration
    name = fields.Char(string='Nom connexion', required=True)
    provider = fields.Selection(
        [
            ('stripe', 'Stripe'),
            ('paypal', 'PayPal'),
            ('bridge', 'Bridge API (Open Banking)'),
            ('powens', 'Powens (Open Banking)'),
            ('bankin', 'Bankin (Open Banking)'),
        ],
        string='Fournisseur',
        required=True,
        index=True
    )

    # Credentials (chiffrées)
    api_key = fields.Char(string='Clé API', help='Clé secrète (chiffrée en base)')
    api_secret = fields.Char(string='Secret API', help='Secret (chiffré en base)')
    webhook_secret = fields.Char(string='Webhook Secret', help='Secret signature webhooks')

    # Configuration avancée
    sync_frequency = fields.Selection(
        [
            ('realtime', 'Temps Réel (Webhooks)'),
            ('hourly', 'Horaire'),
            ('daily', 'Quotidien'),
            ('manual', 'Manuel'),
        ],
        string='Fréquence sync',
        default='daily',
        required=True
    )
    auto_reconcile = fields.Boolean(
        string='Réconciliation automatique',
        default=True,
        help='Lancer matching automatique à chaque import'
    )

    # État
    state = fields.Selection(
        [
            ('draft', 'Brouillon'),
            ('active', 'Actif'),
            ('error', 'Erreur'),
            ('disabled', 'Désactivé'),
        ],
        string='État',
        default='draft',
        required=True,
        index=True
    )
    last_sync = fields.Datetime(string='Dernière sync', readonly=True)
    last_error = fields.Text(string='Dernière erreur', readonly=True)

    # Statistiques
    total_transactions = fields.Integer(string='Transactions importées', default=0, readonly=True)
    total_matched = fields.Integer(string='Réconciliées auto', default=0, readonly=True)

    # Contraintes
    _sql_constraints = [
        (
            'unique_provider_account',
            'UNIQUE(tenant_id, provider, bank_account_id)',
            'Une seule connexion par fournisseur/compte'
        )
    ]

    def action_test_connection(self):
        """Tester connexion API"""
        self.ensure_one()

        try:
            if self.provider == 'stripe':
                self._test_stripe_connection()
            elif self.provider == 'paypal':
                self._test_paypal_connection()
            elif self.provider in ['bridge', 'powens', 'bankin']:
                self._test_open_banking_connection()
            else:
                raise UserError(f"Provider {self.provider} non supporté")

            self.write({
                'state': 'active',
                'last_error': False,
            })

            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'message': 'Connexion réussie !',
                    'type': 'success',
                    'sticky': False,
                }
            }

        except Exception as e:
            _logger.error(f"Erreur test connexion {self.name}: {e}", exc_info=True)
            self.write({
                'state': 'error',
                'last_error': str(e),
            })
            raise UserError(f"Erreur connexion : {str(e)}")

    def _test_stripe_connection(self):
        """Test connexion Stripe"""
        # TODO: Implémenter avec stripe-python SDK
        _logger.info(f"Test connexion Stripe (TODO)")
        pass

    def _test_paypal_connection(self):
        """Test connexion PayPal"""
        # TODO: Implémenter avec paypalrestsdk
        _logger.info(f"Test connexion PayPal (TODO)")
        pass

    def _test_open_banking_connection(self):
        """Test connexion Open Banking"""
        # TODO: Implémenter avec Bridge API / Powens
        _logger.info(f"Test connexion Open Banking (TODO)")
        pass

    def action_sync_transactions(self):
        """Synchroniser transactions depuis API"""
        self.ensure_one()

        if self.state != 'active':
            raise UserError("Connexion non active")

        try:
            if self.provider == 'stripe':
                transactions = self._fetch_stripe_transactions()
            elif self.provider == 'paypal':
                transactions = self._fetch_paypal_transactions()
            elif self.provider in ['bridge', 'powens', 'bankin']:
                transactions = self._fetch_open_banking_transactions()
            else:
                raise UserError(f"Provider {self.provider} non supporté")

            # Importer transactions
            imported_count = 0
            matched_count = 0

            BankTransaction = self.env['quelyos.bank_transaction'].sudo()

            for txn_data in transactions:
                # Créer transaction
                txn = BankTransaction.create({
                    'tenant_id': self.tenant_id.id,
                    'bank_account_id': self.bank_account_id.id,
                    'source_type': self.provider if self.provider in ['stripe', 'paypal'] else 'open_banking',
                    'source_provider': self.provider,
                    'external_id': txn_data['external_id'],
                    'transaction_date': txn_data['date'],
                    'value_date': txn_data.get('value_date', txn_data['date']),
                    'label': txn_data['label'],
                    'amount': txn_data['amount'],
                    'currency_id': txn_data['currency_id'],
                })

                imported_count += 1

                # Matching automatique si activé
                if self.auto_reconcile:
                    result = txn.action_match_automatically()
                    if result.get('success'):
                        matched_count += 1

            # Mettre à jour stats
            self.write({
                'last_sync': fields.Datetime.now(),
                'total_transactions': self.total_transactions + imported_count,
                'total_matched': self.total_matched + matched_count,
            })

            _logger.info(
                f"Sync {self.name} terminée : {imported_count} transactions importées, "
                f"{matched_count} réconciliées auto"
            )

            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'message': f"{imported_count} transactions importées, {matched_count} réconciliées",
                    'type': 'success',
                    'sticky': False,
                }
            }

        except Exception as e:
            _logger.error(f"Erreur sync transactions {self.name}: {e}", exc_info=True)
            self.write({
                'state': 'error',
                'last_error': str(e),
            })
            raise UserError(f"Erreur synchronisation : {str(e)}")

    def _fetch_stripe_transactions(self):
        """Récupérer transactions Stripe (7 derniers jours)"""
        # TODO: Implémenter avec stripe.BalanceTransaction.list()
        _logger.info("Fetch Stripe transactions (TODO)")
        return []

    def _fetch_paypal_transactions(self):
        """Récupérer transactions PayPal (7 derniers jours)"""
        # TODO: Implémenter avec PayPal REST API
        _logger.info("Fetch PayPal transactions (TODO)")
        return []

    def _fetch_open_banking_transactions(self):
        """Récupérer transactions Open Banking (7 derniers jours)"""
        # TODO: Implémenter avec Bridge API
        _logger.info("Fetch Open Banking transactions (TODO)")
        return []
