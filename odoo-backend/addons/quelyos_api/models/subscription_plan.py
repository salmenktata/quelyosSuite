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
        ('enterprise', 'Enterprise'),
        ('custom', 'Custom'),
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

    trial_days = fields.Integer(
        string='Trial Period (Days)',
        default=14,
        help='Number of days for free trial period. Default: 14 days',
        required=True,
    )

    # Modules activés (computed depuis group_ids)
    enabled_modules = fields.Text(
        string='Modules activés (JSON)',
        help='Liste des modules Quelyos activés, calculée automatiquement depuis les groupes de sécurité',
        compute='_compute_enabled_modules',
        store=True
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

    # Droits d'accès par module
    group_ids = fields.Many2many(
        'res.groups',
        'subscription_plan_group_rel',
        'plan_id',
        'group_id',
        string='Groupes d\'accès',
        help='Groupes de sécurité assignés automatiquement aux utilisateurs lors de la souscription'
    )

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

    is_default = fields.Boolean(
        string='Plan par défaut',
        default=False,
        help='Plan assigné automatiquement aux nouveaux tenants (un seul plan peut être par défaut)'
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

    # Fonctionnalités booléennes (pour l'API super-admin)
    feature_wishlist = fields.Boolean(string='Wishlist', default=False)
    feature_reviews = fields.Boolean(string='Avis clients', default=False)
    feature_newsletter = fields.Boolean(string='Newsletter', default=False)
    feature_comparison = fields.Boolean(string='Comparateur produits', default=False)
    feature_guest_checkout = fields.Boolean(string='Commande invité', default=True)
    feature_api_access = fields.Boolean(string='Accès API', default=False)
    feature_priority_support = fields.Boolean(string='Support prioritaire', default=False)
    feature_custom_domain = fields.Boolean(string='Domaine personnalisé', default=False)

    # Alias pour is_active
    is_active = fields.Boolean(related='active', string='Actif', store=False)

    # Séquence pour tri
    sequence = fields.Integer(string='Séquence', default=10)

    # Statistiques
    subscription_count = fields.Integer(
        string='Nombre d\'abonnements',
        compute='_compute_subscription_count',
        store=False
    )

    @api.depends('group_ids')
    def _compute_enabled_modules(self):
        """
        Calcule automatiquement les modules activés depuis les groupes de sécurité.
        Un module est activé si au moins un groupe (User ou Manager) est assigné.
        """
        # Mapping des modules Quelyos
        MODULE_KEYS = ['home', 'finance', 'store', 'stock', 'crm', 'marketing', 'hr', 'support', 'pos']

        for plan in self:
            enabled = set()

            # Parser les noms de groupes pour extraire les modules
            for group in plan.group_ids:
                name_lower = group.name.lower()
                full_name_lower = (group.full_name or '').lower()

                # Chercher quel module correspond à ce groupe
                for module in MODULE_KEYS:
                    # Pattern: "quelyos [module] user" ou "quelyos [module] manager"
                    if f'quelyos {module} user' in name_lower or f'quelyos {module} user' in full_name_lower:
                        enabled.add(module)
                        break
                    if f'quelyos {module} manager' in name_lower or f'quelyos {module} manager' in full_name_lower:
                        enabled.add(module)
                        break

            # Si aucun module détecté, ajouter 'home' par défaut
            if not enabled:
                enabled.add('home')

            # Stocker en JSON
            plan.enabled_modules = json.dumps(sorted(list(enabled)))

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

    @api.constrains('trial_days')
    def _check_trial_days(self):
        """Vérifie que la période d'essai est valide."""
        for record in self:
            if record.trial_days < 0:
                raise ValidationError(_("Trial period must be non-negative."))
            if record.trial_days > 365:
                raise ValidationError(_("Trial period cannot exceed 365 days."))

    @api.constrains('is_default')
    def _check_unique_default(self):
        """Vérifie qu'un seul plan peut être marqué comme par défaut."""
        for record in self:
            if record.is_default:
                other_defaults = self.search([
                    ('is_default', '=', True),
                    ('id', '!=', record.id)
                ])
                if other_defaults:
                    raise ValidationError(_(
                        'Un seul plan peut être marqué comme plan par défaut. '
                        'Le plan "%s" est déjà défini comme plan par défaut.'
                    ) % other_defaults[0].name)

    @api.model
    def get_default_plan(self):
        """
        Retourne le plan par défaut pour les nouveaux tenants.
        Si aucun plan n'est marqué comme défaut, retourne le plan Starter.
        """
        default_plan = self.search([('is_default', '=', True)], limit=1)
        if not default_plan:
            # Fallback sur Starter si pas de plan par défaut
            default_plan = self.search([('code', '=', 'starter')], limit=1)
        return default_plan

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

    def get_enabled_modules_list(self):
        """
        Retourne la liste des modules activés sous forme de liste Python.
        Le champ enabled_modules est calculé automatiquement depuis group_ids.
        """
        self.ensure_one()
        try:
            return json.loads(self.enabled_modules) if self.enabled_modules else ['home']
        except (json.JSONDecodeError, TypeError):
            return ['home']

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
