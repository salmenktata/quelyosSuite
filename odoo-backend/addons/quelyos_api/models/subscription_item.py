# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class SubscriptionItem(models.Model):
    _name = 'quelyos.subscription.item'
    _description = 'Module souscrit (pivot tenant/module)'
    _order = 'create_date desc'

    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        required=True,
        ondelete='cascade',
        index=True,
    )

    plan_id = fields.Many2one(
        'quelyos.subscription.plan',
        string='Module/Plan',
        required=True,
        ondelete='restrict',
        help='Plan ou module souscrit',
    )

    is_free_choice = fields.Boolean(
        string='Module offert (choix client)',
        default=False,
        help='Module gratuit inclus dans le plan de base',
    )

    active = fields.Boolean(
        string='Actif',
        default=True,
    )

    start_date = fields.Date(
        string='Date de début',
        default=fields.Date.context_today,
    )

    end_date = fields.Date(
        string='Date de fin',
        help='Date de fin si le module a été désactivé',
    )

    stripe_subscription_item_id = fields.Char(
        string='Stripe Subscription Item ID',
        help='ID de l\'item dans Stripe pour la facturation',
    )

    # Champs calculés
    module_key = fields.Selection(
        related='plan_id.module_key',
        string='Module',
        store=True,
        readonly=True,
    )

    monthly_price = fields.Float(
        string='Prix mensuel',
        compute='_compute_monthly_price',
        store=True,
    )

    @api.depends('plan_id', 'plan_id.price_monthly', 'is_free_choice')
    def _compute_monthly_price(self):
        for item in self:
            if item.is_free_choice:
                item.monthly_price = 0.0
            else:
                item.monthly_price = item.plan_id.price_monthly if item.plan_id else 0.0

    _sql_constraints = [
        ('tenant_plan_unique', 'UNIQUE(tenant_id, plan_id)',
         'Un tenant ne peut souscrire qu\'une seule fois au même module.'),
    ]

    @api.constrains('is_free_choice', 'tenant_id')
    def _check_single_free_choice(self):
        """Un seul module gratuit par tenant."""
        for item in self:
            if item.is_free_choice and item.active:
                other_free = self.search([
                    ('tenant_id', '=', item.tenant_id.id),
                    ('is_free_choice', '=', True),
                    ('active', '=', True),
                    ('id', '!=', item.id),
                ])
                if other_free:
                    raise ValidationError(_(
                        'Un seul module gratuit est autorisé par tenant. '
                        'Le module "%s" est déjà le choix gratuit.'
                    ) % other_free[0].plan_id.name)
