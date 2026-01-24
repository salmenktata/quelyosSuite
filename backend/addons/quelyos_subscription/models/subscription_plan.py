# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
import json


class SubscriptionPlan(models.Model):
    _name = 'quelyos.subscription.plan'
    _description = 'Plan d\'abonnement Quelyos'
    _order = 'display_order, name'

    name = fields.Char(
        string='Nom du plan',
        required=True,
        translate=True,
        help='Nom affiché au client (ex: Starter, Pro, Enterprise)'
    )

    code = fields.Selection([
        ('starter', 'Starter'),
        ('pro', 'Pro'),
        ('enterprise', 'Enterprise')
    ], string='Code', required=True, help='Code interne du plan')

    # Tarification
    price_monthly = fields.Float(
        string='Prix mensuel (€)',
        required=True,
        default=0.0,
        help='Prix mensuel HT en euros'
    )

    price_yearly = fields.Float(
        string='Prix annuel (€)',
        help='Prix annuel HT en euros (généralement -20% vs mensuel × 12)'
    )

    stripe_price_id_monthly = fields.Char(
        string='Stripe Price ID (mensuel)',
        help='ID du prix mensuel dans Stripe (ex: price_xxx)'
    )

    stripe_price_id_yearly = fields.Char(
        string='Stripe Price ID (annuel)',
        help='ID du prix annuel dans Stripe (ex: price_xxx)'
    )

    # Limites
    max_users = fields.Integer(
        string='Nombre max d\'utilisateurs',
        default=1,
        required=True,
        help='Nombre maximum d\'utilisateurs autorisés (0 = illimité)'
    )

    max_products = fields.Integer(
        string='Nombre max de produits',
        default=1000,
        required=True,
        help='Nombre maximum de produits actifs (0 = illimité)'
    )

    max_orders_per_year = fields.Integer(
        string='Nombre max de commandes/an',
        default=5000,
        required=True,
        help='Nombre maximum de commandes par année civile (0 = illimité)'
    )

    # Fonctionnalités
    features = fields.Text(
        string='Fonctionnalités (JSON)',
        help='Liste des features activées au format JSON array',
        default='[]'
    )

    support_level = fields.Selection([
        ('email_48h', 'Email (48h)'),
        ('email_chat_24h', 'Email + Chat (24h)'),
        ('dedicated_2h', 'Support dédié (2h)')
    ], string='Niveau de support', default='email_48h', required=True)

    # Marketing
    description = fields.Text(
        string='Description',
        translate=True,
        help='Description marketing du plan'
    )

    is_popular = fields.Boolean(
        string='Plan populaire',
        default=False,
        help='Afficher badge "Le plus populaire" sur ce plan'
    )

    display_order = fields.Integer(
        string='Ordre d\'affichage',
        default=10,
        help='Ordre d\'affichage dans la page pricing (plus petit = premier)'
    )

    active = fields.Boolean(
        string='Actif',
        default=True,
        help='Désactiver pour ne plus proposer ce plan aux nouveaux clients'
    )

    # Statistiques
    subscription_count = fields.Integer(
        string='Nombre d\'abonnements',
        compute='_compute_subscription_count',
        store=False
    )

    @api.depends('code')
    def _compute_subscription_count(self):
        """Compte le nombre d'abonnements actifs pour ce plan."""
        for plan in self:
            plan.subscription_count = self.env['quelyos.subscription'].search_count([
                ('plan_id', '=', plan.id),
                ('state', 'in', ['trial', 'active'])
            ])

    @api.constrains('price_monthly', 'price_yearly')
    def _check_prices(self):
        """Vérifie que les prix sont positifs."""
        for plan in self:
            if plan.price_monthly < 0:
                raise ValidationError(_('Le prix mensuel ne peut pas être négatif.'))
            if plan.price_yearly and plan.price_yearly < 0:
                raise ValidationError(_('Le prix annuel ne peut pas être négatif.'))

    @api.constrains('max_users', 'max_products', 'max_orders_per_year')
    def _check_limits(self):
        """Vérifie que les limites sont valides."""
        for plan in self:
            if plan.max_users < 0:
                raise ValidationError(_('Le nombre max d\'utilisateurs ne peut pas être négatif.'))
            if plan.max_products < 0:
                raise ValidationError(_('Le nombre max de produits ne peut pas être négatif.'))
            if plan.max_orders_per_year < 0:
                raise ValidationError(_('Le nombre max de commandes ne peut pas être négatif.'))

    def get_features_list(self):
        """
        Retourne la liste des features sous forme de liste Python.
        """
        self.ensure_one()
        try:
            return json.loads(self.features) if self.features else []
        except (json.JSONDecodeError, TypeError):
            return []

    def set_features_list(self, features_list):
        """
        Définit la liste des features à partir d'une liste Python.
        """
        self.ensure_one()
        self.features = json.dumps(features_list)

    def name_get(self):
        """Affichage personnalisé du plan."""
        result = []
        for plan in self:
            name = f"{plan.name}"
            if plan.price_monthly > 0:
                name += f" ({plan.price_monthly}€/mois)"
            else:
                name += " (Sur devis)"
            result.append((plan.id, name))
        return result
