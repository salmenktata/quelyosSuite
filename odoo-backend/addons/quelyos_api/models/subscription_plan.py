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

    code = fields.Char(
        string='Code',
        required=True,
        help='Code interne unique (ex: suite_starter, ecom_pro, fin_free)'
    )

    plan_type = fields.Selection([
        ('module', 'Module additionnel'),
        ('solution', 'Solution métier'),
        ('user_pack', 'Pack utilisateurs'),
        ('enterprise', 'Enterprise'),
    ], string='Type de plan', default='module', required=True)

    # Modules inclus dans la solution métier (JSON array de module_keys)
    solution_modules = fields.Text(
        string='Modules inclus (JSON)',
        help='Liste des module_keys inclus dans cette solution métier (JSON array)',
        default='[]'
    )

    # Référence vers la page solution (pour solutions métier)
    solution_slug = fields.Char(
        string='Slug solution',
        help='Identifiant URL de la page solution (ex: restaurant, commerce)'
    )

    # Module associé (pour type='module')
    module_key = fields.Selection([
        ('finance', 'Finance'),
        ('store', 'Boutique'),
        ('stock', 'Stock'),
        ('crm', 'CRM'),
        ('marketing', 'Marketing'),
        ('hr', 'RH'),
        ('support', 'Support'),
        ('pos', 'Point de Vente'),
        ('maintenance', 'GMAO'),
    ], string='Module associé', help='Module Quelyos associé (pour plan_type=module)')

    # Limites spécifiques au module
    limit_name = fields.Char(
        string='Nom de la limite',
        help='Ex: products, orders_per_month, transactions_per_month'
    )

    limit_included = fields.Integer(
        string='Quantité incluse',
        default=0,
        help='Quantité incluse dans le prix du module (0 = illimité)'
    )

    surplus_price = fields.Float(
        string='Prix surplus par tranche (€/mois)',
        default=0.0,
        help='Prix pour chaque tranche supplémentaire au-delà de la limite incluse'
    )

    surplus_unit = fields.Integer(
        string='Taille tranche surplus',
        default=500,
        help='Nombre d\'unités par tranche de surplus'
    )

    # Users inclus (pour plan de base)
    users_included = fields.Integer(
        string='Utilisateurs inclus',
        default=5,
        help='Nombre d\'utilisateurs inclus dans le plan de base'
    )

    # Pack users
    pack_size = fields.Integer(
        string='Taille du pack',
        default=5,
        help='Nombre d\'utilisateurs par pack (pour type=user_pack)'
    )

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

    # Champs marketing (affichage vitrine)
    original_price = fields.Float(
        string='Prix barré (€)',
        help='Ancien prix affiché barré sur la vitrine'
    )

    badge_text = fields.Char(
        string='Badge',
        help='Ex: "Meilleure offre", "Le + populaire"'
    )

    cta_text = fields.Char(
        string='Bouton CTA',
        default='Essai gratuit 14 jours',
        help='Texte du bouton call-to-action'
    )

    cta_href = fields.Char(
        string='Lien CTA',
        default='/register',
        help='URL du bouton CTA'
    )

    yearly_discount_pct = fields.Integer(
        string='Remise annuelle (%)',
        default=20,
        help='Pourcentage de réduction pour la facturation annuelle'
    )

    features_marketing = fields.Text(
        string='Features marketing (JSON)',
        default='[]',
        help='Liste de strings marketing pour la vitrine (JSON array)'
    )

    icon_name = fields.Char(
        string='Icône Lucide',
        default='Layers',
        help='Nom icône lucide-react (ex: Rocket, Crown, PiggyBank)'
    )

    color_theme = fields.Selection([
        ('emerald', 'Emerald'),
        ('indigo', 'Indigo'),
        ('amber', 'Amber'),
        ('violet', 'Violet'),
    ], string='Couleur thème', default='emerald')

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

    _sql_constraints = [
        ('code_unique', 'UNIQUE(code)', 'Le code du plan doit être unique.'),
    ]

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
        Si aucun plan n'est marqué comme défaut, retourne le plan de base.
        """
        default_plan = self.search([('is_default', '=', True)], limit=1)
        if not default_plan:
            default_plan = self.search([('plan_type', '=', 'module'), ('active', '=', True)], limit=1, order='display_order')
        return default_plan

    @api.model
    def get_module_plans(self):
        """Retourne tous les plans de type module actifs."""
        return self.search([
            ('plan_type', '=', 'module'),
            ('active', '=', True)
        ], order='display_order, name')

    @api.model
    def get_pricing_grid(self):
        """Retourne la grille tarifaire structurée pour l'API publique."""
        module_plans = self.get_module_plans()
        user_pack = self.search([('plan_type', '=', 'user_pack'), ('active', '=', True)], limit=1)

        # Solutions métier
        solution_plans = self.search([
            ('plan_type', '=', 'solution'),
            ('active', '=', True)
        ], order='display_order, name')

        # Calculer total all-in
        all_in_regular = sum(m.price_monthly for m in module_plans)
        all_in_discounted = round(all_in_regular * 0.9)  # -10%

        return {
            'modules': [{
                'key': m.module_key,
                'name': m.name,
                'code': m.code,
                'price': m.price_monthly,
                'annualPrice': round(m.price_monthly * (1 - (m.yearly_discount_pct or 22) / 100)),
                'description': m.description or '',
                'icon': m.icon_name or 'Layers',
                'features': m.get_features_marketing_list(),
                'limits': {
                    'name': m.limit_name,
                    'included': m.limit_included,
                    'surplusPrice': m.surplus_price,
                    'surplusUnit': m.surplus_unit,
                } if m.limit_name else None,
            } for m in module_plans],
            'userPacks': {
                'size': user_pack.pack_size if user_pack else 5,
                'price': user_pack.price_monthly if user_pack else 15,
                'annualPrice': round(user_pack.price_monthly * (1 - (user_pack.yearly_discount_pct or 20) / 100)) if user_pack else 12,
            },
            'solutions': [{
                'slug': s.solution_slug or s.code,
                'name': s.name,
                'code': s.code,
                'price': s.price_monthly,
                'annualPrice': round(s.price_monthly * (1 - (s.yearly_discount_pct or 22) / 100)),
                'description': s.description or '',
                'icon': s.icon_name or 'Layers',
                'modules': json.loads(s.solution_modules or '[]'),
                'modulesValue': self._compute_solution_modules_value(s),
                'savings': self._compute_solution_savings(s),
                'features': s.get_features_marketing_list(),
            } for s in solution_plans],
            'allInDiscount': {
                'regularTotal': all_in_regular,
                'discountedPrice': all_in_discounted,
            },
        }

    def _compute_solution_modules_value(self, solution):
        """Calcule la valeur individuelle des modules d'une solution."""
        try:
            module_keys = json.loads(solution.solution_modules or '[]')
        except (json.JSONDecodeError, TypeError):
            return 0
        total = 0
        for key in module_keys:
            mod = self.search([('module_key', '=', key), ('plan_type', '=', 'module'), ('active', '=', True)], limit=1)
            if mod:
                total += mod.price_monthly
        return total

    def _compute_solution_savings(self, solution):
        """Calcule l'économie d'une solution vs modules individuels."""
        modules_value = self._compute_solution_modules_value(solution)
        if modules_value <= 0:
            return 0
        return round(modules_value - solution.price_monthly)

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

    def get_features_marketing_list(self):
        """Retourne la liste des features marketing sous forme de liste Python."""
        self.ensure_one()
        try:
            return json.loads(self.features_marketing) if self.features_marketing else []
        except (json.JSONDecodeError, TypeError):
            return []

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
