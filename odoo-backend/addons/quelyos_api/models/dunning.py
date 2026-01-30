# -*- coding: utf-8 -*-
"""
Modèle Dunning pour la gestion des relances de paiement.

Stratégie de relance (aggressive par défaut) :
- J+1 : Email soft (reminder)
- J+3 : Email urgent
- J+7 : Suspension tenant
- J+14 : Annulation auto
"""

from odoo import models, fields, api, _
from odoo.exceptions import UserError
from datetime import datetime, timedelta
import logging

_logger = logging.getLogger(__name__)


class DunningStep(models.Model):
    _name = 'quelyos.dunning.step'
    _description = 'Étape de relance paiement'
    _order = 'subscription_id, step_number'

    subscription_id = fields.Many2one(
        'quelyos.subscription',
        string='Abonnement',
        required=True,
        ondelete='cascade',
        index=True,
    )

    step_number = fields.Integer(
        string='Numéro étape',
        required=True,
        help='1=Email soft, 2=Email urgent, 3=Suspend, 4=Cancel'
    )

    days_overdue = fields.Integer(
        string='Jours de retard',
        required=True,
        help='Nombre de jours après le passage en past_due'
    )

    action = fields.Selection([
        ('email_soft', 'Email de rappel'),
        ('email_urgent', 'Email urgent'),
        ('suspend', 'Suspendre accès'),
        ('cancel', 'Annuler abonnement'),
    ], string='Action', required=True)

    state = fields.Selection([
        ('pending', 'En attente'),
        ('executed', 'Exécutée'),
        ('skipped', 'Ignorée (paiement reçu)'),
    ], string='État', default='pending', required=True)

    scheduled_date = fields.Date(
        string='Date prévue',
        required=True,
        help='Date planifiée pour exécuter cette action'
    )

    executed_at = fields.Datetime(
        string='Date exécution',
        readonly=True,
    )

    email_sent = fields.Boolean(
        string='Email envoyé',
        default=False,
    )

    notes = fields.Text(
        string='Notes',
        help='Détails sur l\'exécution de cette étape'
    )

    # Champs computed
    tenant_name = fields.Char(
        string='Tenant',
        compute='_compute_tenant_info',
        store=True,
    )

    amount_due = fields.Float(
        string='Montant dû',
        compute='_compute_tenant_info',
        store=True,
    )

    @api.depends('subscription_id', 'subscription_id.tenant_ids', 'subscription_id.mrr')
    def _compute_tenant_info(self):
        for record in self:
            if record.subscription_id:
                tenant = record.subscription_id.tenant_ids[0] if record.subscription_id.tenant_ids else None
                record.tenant_name = tenant.name if tenant else record.subscription_id.name
                record.amount_due = record.subscription_id.mrr
            else:
                record.tenant_name = ''
                record.amount_due = 0

    def action_execute(self):
        """Exécute manuellement cette étape de dunning"""
        self.ensure_one()
        if self.state != 'pending':
            raise UserError(_("Cette étape ne peut pas être exécutée (état: %s)") % self.state)

        self._execute_step()

    def action_skip(self):
        """Marque l'étape comme ignorée (paiement reçu)"""
        self.ensure_one()
        self.write({
            'state': 'skipped',
            'notes': 'Ignorée manuellement par %s' % self.env.user.name,
        })
        _logger.info(
            f"[DUNNING] Step #{self.step_number} skipped for subscription {self.subscription_id.name}"
        )

    def _execute_step(self):
        """Exécute l'action de cette étape"""
        self.ensure_one()

        if self.action == 'email_soft':
            self._send_email('dunning_soft')
        elif self.action == 'email_urgent':
            self._send_email('dunning_urgent')
        elif self.action == 'suspend':
            self._suspend_tenant()
        elif self.action == 'cancel':
            self._cancel_subscription()

        self.write({
            'state': 'executed',
            'executed_at': datetime.now(),
        })

        _logger.info(
            f"[DUNNING] Executed step #{self.step_number} ({self.action}) "
            f"for subscription {self.subscription_id.name}"
        )

    def _send_email(self, template_type):
        """Envoie un email de relance"""
        # Note: En prod, utiliser les templates Odoo
        _logger.info(
            f"[DUNNING] Sending {template_type} email for {self.subscription_id.name}"
        )
        self.email_sent = True
        self.notes = f"Email {template_type} envoyé le {datetime.now().strftime('%Y-%m-%d %H:%M')}"

    def _suspend_tenant(self):
        """Suspend le tenant lié à la subscription"""
        tenant = self.subscription_id.tenant_ids[0] if self.subscription_id.tenant_ids else None
        if tenant and tenant.status == 'active':
            tenant.write({
                'status': 'suspended',
                'suspension_reason': 'Paiement en retard (dunning automatique)',
                'suspended_at': datetime.now(),
            })
            self.notes = f"Tenant {tenant.name} suspendu automatiquement"
            _logger.warning(
                f"[DUNNING] Tenant {tenant.name} suspended due to payment overdue"
            )

    def _cancel_subscription(self):
        """Annule la subscription"""
        self.subscription_id.write({
            'state': 'cancelled',
            'end_date': fields.Date.today(),
        })
        self.notes = "Abonnement annulé automatiquement pour non-paiement"
        _logger.warning(
            f"[DUNNING] Subscription {self.subscription_id.name} cancelled due to payment overdue"
        )


class DunningConfig(models.Model):
    """Configuration globale du dunning"""
    _name = 'quelyos.dunning.config'
    _description = 'Configuration Dunning'

    name = fields.Char(string='Nom', default='Configuration Dunning', readonly=True)

    enabled = fields.Boolean(string='Dunning activé', default=True)

    strategy = fields.Selection([
        ('soft', 'Douce (emails uniquement)'),
        ('aggressive', 'Agressive (suspension + annulation)'),
    ], string='Stratégie', default='aggressive')

    # Délais en jours
    step1_days = fields.Integer(string='Email rappel (jours)', default=1)
    step2_days = fields.Integer(string='Email urgent (jours)', default=3)
    step3_days = fields.Integer(string='Suspension (jours)', default=7)
    step4_days = fields.Integer(string='Annulation (jours)', default=14)

    @api.model
    def get_config(self):
        """Retourne la configuration dunning (crée si n'existe pas)"""
        config = self.search([], limit=1)
        if not config:
            config = self.create({})
        return config
