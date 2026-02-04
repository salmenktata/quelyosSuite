# -*- coding: utf-8 -*-
"""
Modèle Tenant pour la gestion multi-boutique/multi-marque.

Permet à chaque client d'avoir son propre branding (couleurs, logo, typographie)
tout en partageant la même instance Odoo.

Workflow automatique lors de la création :
1. Création de la company Odoo (si non fournie)
2. Création de l'abonnement (subscription) avec le plan choisi
3. Création de l'utilisateur admin (si email fourni)
4. Création des providers de paiement (Flouci + Konnect)
5. Création de l'entrepôt par défaut
6. Création de la pricelist par défaut (TND)
7. Création des séquences (commandes, factures, livraisons)
8. Création des taxes TVA (19%, 7%, 0%)
9. Création des méthodes de livraison
10. Création des pages légales (CGV, Mentions)
11. Création du menu navigation par défaut
"""

import json
import base64
import secrets
from datetime import timedelta
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
from odoo.tools.translate import _


class QuelyosTenant(models.Model):
    _name = 'quelyos.tenant'
    _description = 'Configuration Tenant/Boutique'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'name'

    # ═══════════════════════════════════════════════════════════════════════════
    # IDENTIFICATION
    # ═══════════════════════════════════════════════════════════════════════════

    name = fields.Char(
        string='Nom boutique',
        required=True,
        help="Nom affiché de la boutique"
    )
    code = fields.Char(
        string='Code unique',
        required=True,
        index=True,
        help="Identifiant unique du tenant (ex: lesportif, marque1)"
    )
    domain = fields.Char(
        string='Domaine principal',
        required=True,
        index=True,
        help="Domaine principal de la boutique (ex: marque.com)"
    )
    backoffice_domain = fields.Char(
        string='Domaine backoffice',
        index=True,
        help="Domaine du backoffice admin (ex: admin.marque.com)"
    )
    domains_json = fields.Text(
        string='Domaines additionnels',
        default='[]',
        help="Liste JSON des domaines additionnels"
    )
    company_id = fields.Many2one(
        'res.company',
        string='Société',
        required=True,
        default=lambda self: self.env.company,
        help="Société Odoo associée"
    )
    active = fields.Boolean(
        string='Actif',
        default=True
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # ABONNEMENT & UTILISATEURS
    # ═══════════════════════════════════════════════════════════════════════════

    # Plan (pour création rapide - copié vers subscription)
    plan_id = fields.Many2one(
        'quelyos.subscription.plan',
        string='Plan tarifaire',
        help="Plan choisi lors de la création du tenant"
    )

    # Lien vers l'abonnement
    subscription_id = fields.Many2one(
        'quelyos.subscription',
        string='Abonnement',
        ondelete='set null',
        help="Abonnement actif du tenant"
    )
    subscription_state = fields.Selection(
        related='subscription_id.state',
        string='État abonnement',
        store=True,
        readonly=True
    )
    max_users = fields.Integer(
        related='subscription_id.max_users',
        string='Max utilisateurs',
        readonly=True
    )

    # Utilisateurs du tenant (via company)
    user_ids = fields.One2many(
        'res.users',
        compute='_compute_user_ids',
        string='Utilisateurs'
    )
    users_count = fields.Integer(
        compute='_compute_user_ids',
        string='Nb utilisateurs'
    )

    # Email admin initial (pour création)
    admin_email = fields.Char(
        string='Email Admin',
        help="Email pour créer le premier utilisateur administrateur"
    )

    # Compteurs d'utilisation (computed)
    products_count = fields.Integer(
        string='Nb produits',
        compute='_compute_usage_counts',
        store=False,
        help='Nombre de produits actifs dans ce tenant'
    )
    orders_count = fields.Integer(
        string='Nb commandes',
        compute='_compute_usage_counts',
        store=False,
        help='Nombre de commandes de vente confirmées cette année'
    )

    # Statut du tenant (SaaS Lifecycle)
    status = fields.Selection([
        ('provisioning', 'Provisioning'),
        ('active', 'Actif'),
        ('suspended', 'Suspendu'),
        ('archived', 'Archivé'),
    ], string='Statut', default='provisioning', required=True, tracking=True)

    # Provisioning Job
    provisioning_job_id = fields.Many2one(
        'quelyos.provisioning.job',
        string='Job de provisioning',
        ondelete='set null',
        help='Dernier job de provisioning pour ce tenant'
    )

    # Stripe
    stripe_customer_id = fields.Char(
        string='Stripe Customer ID',
        help='ID du client dans Stripe (ex: cus_xxx)'
    )

    # Deployment tier
    deployment_tier = fields.Selection([
        ('shared', 'Mutualisé'),
        ('dedicated', 'Dédié'),
    ], string='Type de déploiement', default='shared')

    # Suspension fields (SaaS admin action)
    suspension_reason = fields.Text(
        string='Raison suspension',
        help='Motif de la suspension du tenant'
    )
    suspended_at = fields.Datetime(
        string='Date suspension',
        help='Date et heure de la suspension'
    )
    suspended_by = fields.Many2one(
        'res.users',
        string='Suspendu par',
        help='Super admin ayant effectué la suspension'
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # BRANDING
    # ═══════════════════════════════════════════════════════════════════════════

    logo = fields.Binary(
        string='Logo',
        help="Logo principal de la boutique",
        attachment=True
    )
    logo_filename = fields.Char(
        string='Nom fichier logo'
    )
    logo_url = fields.Char(
        string='URL Logo',
        compute='_compute_logo_url',
        store=False,
        help="URL publique du logo"
    )
    favicon = fields.Binary(
        string='Favicon',
        help="Icône affichée dans l'onglet du navigateur",
        attachment=True
    )
    favicon_filename = fields.Char(
        string='Nom fichier favicon'
    )
    favicon_url = fields.Char(
        string='URL Favicon',
        compute='_compute_favicon_url',
        store=False,
        help="URL publique du favicon"
    )
    slogan = fields.Char(
        string='Slogan',
        default='Votre boutique en ligne',
        help="Slogan ou tagline de la marque"
    )
    description = fields.Text(
        string='Description',
        help="Description de la boutique pour le SEO"
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # BRANDING FACTURES/DOCUMENTS
    # ═══════════════════════════════════════════════════════════════════════════

    x_invoice_logo_url = fields.Char(
        string='URL Logo Facture',
        help="URL du logo à afficher sur les factures (si différent du logo principal)"
    )
    x_invoice_primary_color = fields.Char(
        string='Couleur primaire factures',
        default='#01613a',
        help="Couleur principale utilisée dans les PDFs de factures"
    )
    x_invoice_footer_text = fields.Text(
        string='Pied de page factures',
        help="Texte personnalisé affiché en bas des factures (mentions légales, coordonnées bancaires, etc.)"
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # COULEURS (13 CSS Variables)
    # ═══════════════════════════════════════════════════════════════════════════

    primary_color = fields.Char(
        string='Couleur primaire',
        default='#01613a',
        help="Couleur principale de la marque"
    )
    primary_dark = fields.Char(
        string='Primaire foncé',
        default='#004d2e'
    )
    primary_light = fields.Char(
        string='Primaire clair',
        default='#028a52'
    )
    secondary_color = fields.Char(
        string='Couleur secondaire',
        default='#c9c18f'
    )
    secondary_dark = fields.Char(
        string='Secondaire foncé',
        default='#b4ac7a'
    )
    secondary_light = fields.Char(
        string='Secondaire clair',
        default='#ddd5a4'
    )
    accent_color = fields.Char(
        string='Couleur accent',
        default='#f59e0b',
        help="Couleur pour les éléments d'attention"
    )
    background_color = fields.Char(
        string='Fond',
        default='#ffffff'
    )
    foreground_color = fields.Char(
        string='Texte',
        default='#171717'
    )
    muted_color = fields.Char(
        string='Fond atténué',
        default='#f5f5f5'
    )
    muted_foreground = fields.Char(
        string='Texte atténué',
        default='#737373'
    )
    border_color = fields.Char(
        string='Bordures',
        default='#e5e5e5'
    )
    ring_color = fields.Char(
        string='Focus/Ring',
        default='#01613a',
        help="Couleur des anneaux de focus"
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # CUSTOMIZATION HOMEPAGE
    # ═══════════════════════════════════════════════════════════════════════════

    x_homepage_sections_order = fields.Json(
        string='Ordre sections homepage',
        default=lambda self: [
            {'id': 'hero-slider', 'name': 'Hero Slider', 'visible': True, 'link': '/store/content/hero-slides'},
            {'id': 'trust-badges', 'name': 'Badges de confiance', 'visible': True, 'link': '/store/content/trust-badges'},
            {'id': 'flash-sales', 'name': 'Ventes Flash', 'visible': True, 'link': '/store/marketing/flash-sales'},
            {'id': 'categories', 'name': 'Catégories', 'visible': True, 'link': '/store/catalog/categories'},
            {'id': 'featured-products', 'name': 'Produits vedette', 'visible': True, 'link': '/store/catalog/products'},
            {'id': 'promo-banners', 'name': 'Bannières promo', 'visible': True, 'link': '/store/marketing/banners'},
            {'id': 'testimonials', 'name': 'Témoignages', 'visible': True, 'link': '/store/content/testimonials'}
        ],
        help="Ordre et visibilité des sections de la homepage e-commerce"
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # TYPOGRAPHIE
    # ═══════════════════════════════════════════════════════════════════════════

    font_family = fields.Selection(
        selection=[
            ('inter', 'Inter'),
            ('roboto', 'Roboto'),
            ('poppins', 'Poppins'),
            ('montserrat', 'Montserrat'),
            ('open-sans', 'Open Sans'),
            ('lato', 'Lato'),
        ],
        string='Police',
        default='inter',
        help="Police de caractères principale"
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # THEME ENGINE (Nouveau système de thèmes complets)
    # ═══════════════════════════════════════════════════════════════════════════

    active_theme_id = fields.Many2one(
        comodel_name='quelyos.theme',
        string='Thème Actif',
        ondelete='set null',
        help="Thème actuellement utilisé par ce tenant (Theme Engine)"
    )
    purchased_theme_ids = fields.Many2many(
        comodel_name='quelyos.theme',
        relation='quelyos_tenant_theme_purchased_rel',
        column1='tenant_id',
        column2='theme_id',
        string='Thèmes Achetés',
        help="Thèmes premium achetés par ce tenant"
    )
    theme_overrides = fields.Text(
        string='Overrides Thème (JSON)',
        help="JSON partiel pour personnaliser des sections du thème actif"
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # CONTACT
    # ═══════════════════════════════════════════════════════════════════════════

    email = fields.Char(
        string='Email de contact',
        help="Email affiché sur le site"
    )
    phone = fields.Char(
        string='Téléphone',
        help="Numéro de téléphone affiché"
    )
    whatsapp = fields.Char(
        string='WhatsApp',
        help="Numéro WhatsApp pour le support"
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # RÉSEAUX SOCIAUX (stockés en JSON)
    # ═══════════════════════════════════════════════════════════════════════════

    social_links_json = fields.Text(
        string='Liens sociaux',
        default='{}',
        help="JSON: {facebook, instagram, twitter, youtube, linkedin, tiktok}"
    )

    # Champs calculés pour faciliter l'accès
    social_facebook = fields.Char(
        string='Facebook',
        compute='_compute_social_links',
        inverse='_inverse_social_facebook'
    )
    social_instagram = fields.Char(
        string='Instagram',
        compute='_compute_social_links',
        inverse='_inverse_social_instagram'
    )
    social_twitter = fields.Char(
        string='Twitter/X',
        compute='_compute_social_links',
        inverse='_inverse_social_twitter'
    )
    social_youtube = fields.Char(
        string='YouTube',
        compute='_compute_social_links',
        inverse='_inverse_social_youtube'
    )
    social_linkedin = fields.Char(
        string='LinkedIn',
        compute='_compute_social_links',
        inverse='_inverse_social_linkedin'
    )
    social_tiktok = fields.Char(
        string='TikTok',
        compute='_compute_social_links',
        inverse='_inverse_social_tiktok'
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # SEO
    # ═══════════════════════════════════════════════════════════════════════════

    meta_title = fields.Char(
        string='Titre SEO',
        help="Titre affiché dans les résultats de recherche"
    )
    meta_description = fields.Text(
        string='Description SEO',
        help="Description pour les moteurs de recherche (max 160 caractères)"
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # OPTIONS
    # ═══════════════════════════════════════════════════════════════════════════

    enable_dark_mode = fields.Boolean(
        string='Activer mode sombre',
        default=True,
        help="Permettre aux utilisateurs de basculer en mode sombre"
    )
    default_dark = fields.Boolean(
        string='Mode sombre par défaut',
        default=False,
        help="Afficher le site en mode sombre par défaut"
    )

    # Features toggles
    feature_wishlist = fields.Boolean(
        string='Liste de souhaits',
        default=True
    )
    feature_comparison = fields.Boolean(
        string='Comparaison produits',
        default=True
    )
    feature_reviews = fields.Boolean(
        string='Avis clients',
        default=True
    )
    feature_newsletter = fields.Boolean(
        string='Newsletter',
        default=True
    )
    feature_guest_checkout = fields.Boolean(
        string='Commande invité',
        default=True
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # CONTRAINTES
    # ═══════════════════════════════════════════════════════════════════════════
    # ═══════════════════════════════════════════════════════════════════════════
    # COMPUTED FIELDS
    # ═══════════════════════════════════════════════════════════════════════════

    @api.depends('logo')

    @api.constrains('code')
    def _check_code_unique(self):
        """Contrainte: Le code du tenant doit être unique"""
        for record in self:
            # Chercher un doublon
            duplicate = self.search([
                ('code', '=', record.code),
                ('id', '!=', record.id)
            ], limit=1)

            if duplicate:
                raise ValidationError(_('Le code du tenant doit être unique'))


    @api.constrains('domain')
    def _check_domain_unique(self):
        """Contrainte: Le domaine principal doit être unique"""
        for record in self:
            # Chercher un doublon
            duplicate = self.search([
                ('domain', '=', record.domain),
                ('id', '!=', record.id)
            ], limit=1)

            if duplicate:
                raise ValidationError(_('Le domaine principal doit être unique'))


    def _compute_logo_url(self):
        """Génère l'URL publique du logo"""
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
        for tenant in self:
            if tenant.logo:
                tenant.logo_url = f'{base_url}/web/image/quelyos.tenant/{tenant.id}/logo'
            else:
                tenant.logo_url = False

    @api.depends('favicon')
    def _compute_favicon_url(self):
        """Génère l'URL publique du favicon"""
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
        for tenant in self:
            if tenant.favicon:
                tenant.favicon_url = f'{base_url}/web/image/quelyos.tenant/{tenant.id}/favicon'
            else:
                tenant.favicon_url = False

    @api.depends('social_links_json')
    def _compute_social_links(self):
        for tenant in self:
            try:
                links = json.loads(tenant.social_links_json or '{}')
            except json.JSONDecodeError:
                links = {}
            tenant.social_facebook = links.get('facebook', '')
            tenant.social_instagram = links.get('instagram', '')
            tenant.social_twitter = links.get('twitter', '')
            tenant.social_youtube = links.get('youtube', '')
            tenant.social_linkedin = links.get('linkedin', '')
            tenant.social_tiktok = links.get('tiktok', '')

    def _update_social_link(self, key, value):
        for tenant in self:
            try:
                links = json.loads(tenant.social_links_json or '{}')
            except json.JSONDecodeError:
                links = {}
            if value:
                links[key] = value
            elif key in links:
                del links[key]
            tenant.social_links_json = json.dumps(links)

    def _inverse_social_facebook(self):
        for tenant in self:
            tenant._update_social_link('facebook', tenant.social_facebook)

    def _inverse_social_instagram(self):
        for tenant in self:
            tenant._update_social_link('instagram', tenant.social_instagram)

    def _inverse_social_twitter(self):
        for tenant in self:
            tenant._update_social_link('twitter', tenant.social_twitter)

    def _inverse_social_youtube(self):
        for tenant in self:
            tenant._update_social_link('youtube', tenant.social_youtube)

    def _inverse_social_linkedin(self):
        for tenant in self:
            tenant._update_social_link('linkedin', tenant.social_linkedin)

    def _inverse_social_tiktok(self):
        for tenant in self:
            tenant._update_social_link('tiktok', tenant.social_tiktok)

    # ═══════════════════════════════════════════════════════════════════════════
    # VALIDATION
    # ═══════════════════════════════════════════════════════════════════════════

    @api.constrains('code')
    def _check_code(self):
        for tenant in self:
            if not tenant.code.isalnum() and '-' not in tenant.code and '_' not in tenant.code:
                raise ValidationError(
                    "Le code ne doit contenir que des lettres, chiffres, tirets ou underscores"
                )

    @api.constrains('domain')
    def _check_domain(self):
        for tenant in self:
            if tenant.domain:
                # Vérification basique du format domaine
                if ' ' in tenant.domain or not '.' in tenant.domain:
                    if tenant.domain != 'localhost':
                        raise ValidationError(
                            "Le domaine doit être valide (ex: marque.com)"
                        )

    # ═══════════════════════════════════════════════════════════════════════════
    # MÉTHODES PUBLIQUES
    # ═══════════════════════════════════════════════════════════════════════════

    def get_logo_url(self):
        """Retourne l'URL du logo pour le tenant"""
        self.ensure_one()
        if self.logo:
            base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
            return f"{base_url}/web/image/quelyos.tenant/{self.id}/logo"
        return ''

    def get_favicon_url(self):
        """Retourne l'URL du favicon pour le tenant"""
        self.ensure_one()
        if self.favicon:
            base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
            return f"{base_url}/web/image/quelyos.tenant/{self.id}/favicon"
        return ''

    def get_additional_domains(self):
        """Retourne la liste des domaines additionnels"""
        self.ensure_one()
        try:
            return json.loads(self.domains_json or '[]')
        except json.JSONDecodeError:
            return []

    def to_frontend_config(self):
        """
        Convertit le tenant en configuration pour le frontend.
        Retourne un dictionnaire compatible avec TenantConfig TypeScript.
        """
        self.ensure_one()

        try:
            social = json.loads(self.social_links_json or '{}')
        except json.JSONDecodeError:
            social = {}

        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'domain': self.domain,
            'domains': self.get_additional_domains(),
            'branding': {
                'logoUrl': self.get_logo_url(),
                'faviconUrl': self.get_favicon_url(),
                'slogan': self.slogan or '',
                'description': self.description or '',
            },
            'theme': {
                'colors': {
                    'primary': self.primary_color,
                    'primaryDark': self.primary_dark,
                    'primaryLight': self.primary_light,
                    'secondary': self.secondary_color,
                    'secondaryDark': self.secondary_dark,
                    'secondaryLight': self.secondary_light,
                    'accent': self.accent_color,
                    'background': self.background_color,
                    'foreground': self.foreground_color,
                    'muted': self.muted_color,
                    'mutedForeground': self.muted_foreground,
                    'border': self.border_color,
                    'ring': self.ring_color,
                },
                'typography': {
                    'fontFamily': self.font_family,
                },
                'darkMode': {
                    'enabled': self.enable_dark_mode,
                    'defaultDark': self.default_dark,
                },
            },
            'contact': {
                'email': self.email or '',
                'phone': self.phone or '',
                'phoneFormatted': self._format_phone(self.phone) if self.phone else '',
                'whatsapp': self.whatsapp or '',
            },
            'social': social,
            'seo': {
                'title': self.meta_title or self.name,
                'description': self.meta_description or self.description or '',
            },
            'features': {
                'wishlist': self.feature_wishlist,
                'comparison': self.feature_comparison,
                'reviews': self.feature_reviews,
                'newsletter': self.feature_newsletter,
                'guestCheckout': self.feature_guest_checkout,
            },
        }

    def _format_phone(self, phone):
        """Formate un numéro de téléphone pour l'affichage"""
        if not phone:
            return ''
        # Format tunisien: +216 XX XXX XXX
        clean = ''.join(c for c in phone if c.isdigit() or c == '+')
        if clean.startswith('+216') and len(clean) == 12:
            return f"+216 {clean[4:6]} {clean[6:9]} {clean[9:12]}"
        return phone

    @api.model
    def find_by_domain(self, domain):
        """
        Recherche un tenant par son domaine (principal ou additionnel).
        Retourne le tenant ou False.
        """
        # Nettoyer le domaine
        domain = domain.lower().strip()
        if domain.startswith('www.'):
            domain = domain[4:]

        # Chercher dans le domaine principal
        tenant = self.sudo().search([
            ('domain', '=ilike', domain),
            ('active', '=', True)
        ], limit=1)

        if tenant:
            return tenant

        # Chercher dans les domaines additionnels
        all_tenants = self.sudo().search([('active', '=', True)])
        for t in all_tenants:
            additional = t.get_additional_domains()
            if domain in [d.lower() for d in additional]:
                return t

        return False

    # ═══════════════════════════════════════════════════════════════════════════
    # COMPUTED FIELDS - UTILISATEURS
    # ═══════════════════════════════════════════════════════════════════════════

    @api.depends('company_id')
    def _compute_user_ids(self):
        """Calcule les utilisateurs liés au tenant via la company"""
        for tenant in self:
            if tenant.company_id:
                users = self.env['res.users'].sudo().search([
                    ('company_id', '=', tenant.company_id.id),
                    ('active', '=', True),
                    ('share', '=', False),  # Exclure les utilisateurs portail
                ])
                tenant.user_ids = users
                tenant.users_count = len(users)
            else:
                tenant.user_ids = False
                tenant.users_count = 0

    @api.depends('company_id')
    def _compute_usage_counts(self):
        """Calcule les compteurs d'utilisation (produits, commandes)"""
        for tenant in self:
            if tenant.company_id:
                # Compter les produits actifs de ce tenant
                tenant.products_count = self.env['product.template'].sudo().search_count([
                    ('company_id', '=', tenant.company_id.id),
                    ('active', '=', True)
                ])

                # Compter les commandes de l'année en cours
                year_start = fields.Date.today().replace(month=1, day=1)
                tenant.orders_count = self.env['sale.order'].sudo().search_count([
                    ('company_id', '=', tenant.company_id.id),
                    ('date_order', '>=', year_start),
                    ('state', 'in', ['sale', 'done'])
                ])
            else:
                tenant.products_count = 0
                tenant.orders_count = 0

    # ═══════════════════════════════════════════════════════════════════════════
    # WORKFLOW CRÉATION
    # ═══════════════════════════════════════════════════════════════════════════

    @api.model_create_multi
    def create(self, vals_list):
        """
        Workflow automatique lors de la création d'un tenant :
        1. Créer la company Odoo si non fournie
        2. Créer l'abonnement avec le plan choisi
        3. Créer l'utilisateur admin si email fourni
        4. Créer les providers de paiement (Flouci + Konnect)
        5. Créer l'entrepôt par défaut
        6. Créer la pricelist par défaut (TND)
        7. Créer les séquences (commandes, factures, livraisons)
        8. Créer les taxes TVA (19%, 7%, 0%)
        9. Créer les méthodes de livraison
        10. Créer les pages légales (CGV, Mentions)
        11. Créer le menu navigation par défaut
        """
        for vals in vals_list:
            # 1. Créer company si pas fournie
            if not vals.get('company_id'):
                company = self.env['res.company'].sudo().create({
                    'name': vals.get('name', 'Nouvelle boutique'),
                })
                vals['company_id'] = company.id

        # Créer les tenants
        tenants = super().create(vals_list)

        for tenant, vals in zip(tenants, vals_list):
            # 2. Créer subscription si plan fourni
            if vals.get('plan_id') and not tenant.subscription_id:
                plan = self.env['quelyos.subscription.plan'].browse(vals['plan_id'])
                partner = tenant.company_id.partner_id

                subscription = self.env['quelyos.subscription'].sudo().create({
                    'partner_id': partner.id,
                    'company_id': tenant.company_id.id,
                    'plan_id': plan.id,
                    'state': 'trial',
                    'billing_cycle': 'monthly',
                })
                tenant.subscription_id = subscription.id

            # 3. Créer user admin si email fourni
            if vals.get('admin_email'):
                tenant._create_admin_user(vals['admin_email'])

            # 4. Créer les providers de paiement (Flouci + Konnect)
            # TODO: Réactiver quand modules payment_flouci/payment_konnect seront installés
            # tenant._create_payment_providers()

            # 5. Créer l'entrepôt par défaut
            tenant._create_default_warehouse()

            # 6. Créer la pricelist par défaut (TND)
            tenant._create_default_pricelist()

            # 7. Créer les séquences (commandes, factures)
            tenant._create_default_sequences()

            # 8. Créer les taxes TVA (19%, 7%, 0%)
            tenant._create_default_taxes()

            # 9. Créer les méthodes de livraison
            tenant._create_default_delivery_methods()

            # 10. Créer les pages légales (CGV, Mentions)
            tenant._create_default_legal_pages()

            # 11. Créer le menu navigation par défaut
            tenant._create_default_menu()

            # 12. Notifier provisionnement réussi
            tenant.message_post(
                body=_("Tenant provisionné avec succès"),
                message_type='notification',
            )

        return tenants

    def _create_payment_providers(self):
        """
        Crée les providers de paiement Flouci et Konnect pour le tenant.
        Appelé automatiquement à la création du tenant.
        """
        self.ensure_one()
        PaymentProvider = self.env['payment.provider'].sudo()

        providers_config = [
            {
                'name': 'Flouci',
                'code': 'flouci',
                'state': 'disabled',
                'sequence': 10,
                'company_id': self.company_id.id,
                'flouci_timeout': 60,
                'flouci_accept_cards': True,
            },
            {
                'name': 'Konnect',
                'code': 'konnect',
                'state': 'disabled',
                'sequence': 20,
                'company_id': self.company_id.id,
                'konnect_lifespan': 10,
                'konnect_theme': 'light',
            },
        ]

        for config in providers_config:
            existing = PaymentProvider.search([
                ('code', '=', config['code']),
                ('company_id', '=', self.company_id.id)
            ], limit=1)
            if not existing:
                PaymentProvider.create(config)

    def _create_default_warehouse(self):
        """
        Crée un entrepôt par défaut pour le tenant.
        Inclut les emplacements stock, entrée et sortie.
        """
        self.ensure_one()
        Warehouse = self.env['stock.warehouse'].sudo()

        # Vérifier si un entrepôt existe déjà pour cette company
        existing = Warehouse.search([
            ('company_id', '=', self.company_id.id)
        ], limit=1)

        if not existing:
            # Générer un code court unique (max 5 chars)
            code = self.code[:5].upper() if self.code else self.name[:5].upper()

            warehouse = Warehouse.create({
                'name': f"Entrepôt {self.name}",
                'code': code,
                'company_id': self.company_id.id,
                'partner_id': self.company_id.partner_id.id,
            })
            return warehouse
        return existing

    def _create_default_pricelist(self):
        """
        Configure la pricelist par défaut en TND pour le tenant.
        Si une pricelist existe déjà, on la modifie pour utiliser TND.
        """
        self.ensure_one()
        Pricelist = self.env['product.pricelist'].sudo()
        Currency = self.env['res.currency'].sudo()

        # Trouver la devise TND (même inactive) ou la créer
        tnd = Currency.with_context(active_test=False).search([('name', '=', 'TND')], limit=1)
        if tnd:
            # S'assurer qu'elle est active
            if not tnd.active:
                tnd.write({'active': True})
        else:
            tnd = Currency.create({
                'name': 'TND',
                'symbol': 'DT',
                'rounding': 0.001,
                'decimal_places': 3,
                'active': True,
            })

        # Vérifier si une pricelist existe déjà pour cette company
        existing = Pricelist.search([
            ('company_id', '=', self.company_id.id)
        ], limit=1)

        if existing:
            # Modifier la pricelist existante pour utiliser TND
            existing.write({
                'name': f"Liste de prix {self.name} (TND)",
                'currency_id': tnd.id,
            })
            return existing
        else:
            # Créer une nouvelle pricelist
            pricelist = Pricelist.create({
                'name': f"Liste de prix {self.name} (TND)",
                'currency_id': tnd.id,
                'company_id': self.company_id.id,
                'active': True,
            })
            return pricelist

    def _create_default_sequences(self):
        """
        Crée les séquences par défaut pour le tenant :
        - Commandes de vente (SO)
        - Factures (INV)
        - Bons de livraison (OUT)
        """
        self.ensure_one()
        Sequence = self.env['ir.sequence'].sudo()

        # Préfixe basé sur le code tenant
        prefix = self.code[:3].upper() if self.code else self.name[:3].upper()

        sequences_config = [
            {
                'name': f"Commandes {self.name}",
                'code': 'sale.order',
                'prefix': f"{prefix}/SO/%(year)s/",
                'padding': 5,
                'company_id': self.company_id.id,
            },
            {
                'name': f"Factures {self.name}",
                'code': 'account.move',
                'prefix': f"{prefix}/INV/%(year)s/",
                'padding': 5,
                'company_id': self.company_id.id,
            },
            {
                'name': f"Livraisons {self.name}",
                'code': 'stock.picking',
                'prefix': f"{prefix}/OUT/%(year)s/",
                'padding': 5,
                'company_id': self.company_id.id,
            },
        ]

        for config in sequences_config:
            existing = Sequence.search([
                ('code', '=', config['code']),
                ('company_id', '=', self.company_id.id)
            ], limit=1)
            if not existing:
                Sequence.create(config)

    def _create_default_taxes(self):
        """
        Crée les taxes TVA tunisiennes pour le tenant :
        - TVA 19% (taux normal)
        - TVA 7% (taux réduit)
        - TVA 0% (exonéré)
        """
        self.ensure_one()
        Tax = self.env['account.tax'].sudo()
        TaxGroup = self.env['account.tax.group'].sudo()
        Country = self.env['res.country'].sudo()

        # Trouver la Tunisie
        tunisia = Country.search([('code', '=', 'TN')], limit=1)
        if not tunisia:
            return  # Skip si Tunisie non trouvée

        # Trouver ou créer les groupes de taxes
        tax_group_19 = TaxGroup.search([
            ('name', '=', 'TVA 19%'),
            ('company_id', '=', self.company_id.id)
        ], limit=1)
        if not tax_group_19:
            tax_group_19 = TaxGroup.create({
                'name': 'TVA 19%',
                'sequence': 1,
                'company_id': self.company_id.id,
            })

        tax_group_7 = TaxGroup.search([
            ('name', '=', 'TVA 7%'),
            ('company_id', '=', self.company_id.id)
        ], limit=1)
        if not tax_group_7:
            tax_group_7 = TaxGroup.create({
                'name': 'TVA 7%',
                'sequence': 2,
                'company_id': self.company_id.id,
            })

        tax_group_0 = TaxGroup.search([
            ('name', '=', 'TVA 0%'),
            ('company_id', '=', self.company_id.id)
        ], limit=1)
        if not tax_group_0:
            tax_group_0 = TaxGroup.create({
                'name': 'TVA 0%',
                'sequence': 3,
                'company_id': self.company_id.id,
            })

        taxes_config = [
            {
                'name': 'TVA 19%',
                'type_tax_use': 'sale',
                'amount_type': 'percent',
                'amount': 19.0,
                'company_id': self.company_id.id,
                'country_id': tunisia.id,
                'tax_group_id': tax_group_19.id,
                'sequence': 1,
            },
            {
                'name': 'TVA 7%',
                'type_tax_use': 'sale',
                'amount_type': 'percent',
                'amount': 7.0,
                'company_id': self.company_id.id,
                'country_id': tunisia.id,
                'tax_group_id': tax_group_7.id,
                'sequence': 2,
            },
            {
                'name': 'TVA 0%',
                'type_tax_use': 'sale',
                'amount_type': 'percent',
                'amount': 0.0,
                'company_id': self.company_id.id,
                'country_id': tunisia.id,
                'tax_group_id': tax_group_0.id,
                'sequence': 3,
            },
        ]

        for config in taxes_config:
            existing = Tax.search([
                ('name', '=', config['name']),
                ('company_id', '=', self.company_id.id)
            ], limit=1)
            if not existing:
                Tax.create(config)

    def _create_default_delivery_methods(self):
        """
        Crée les méthodes de livraison par défaut :
        - Livraison standard
        - Livraison express
        - Retrait en magasin
        """
        self.ensure_one()
        Carrier = self.env['delivery.carrier'].sudo()

        # Trouver ou créer un produit de livraison
        Product = self.env['product.product'].sudo()
        delivery_product = Product.search([
            ('default_code', '=', 'DELIVERY'),
            ('company_id', 'in', [self.company_id.id, False])
        ], limit=1)

        if not delivery_product:
            delivery_product = Product.create({
                'name': 'Frais de livraison',
                'default_code': 'DELIVERY',
                'type': 'service',
                'list_price': 0.0,
                'sale_ok': False,
                'purchase_ok': False,
            })

        carriers_config = [
            {
                'name': 'Livraison standard',
                'delivery_type': 'fixed',
                'fixed_price': 7.0,
                'product_id': delivery_product.id,
                'company_id': self.company_id.id,
                'sequence': 10,
            },
            {
                'name': 'Livraison express',
                'delivery_type': 'fixed',
                'fixed_price': 15.0,
                'product_id': delivery_product.id,
                'company_id': self.company_id.id,
                'sequence': 20,
            },
            {
                'name': 'Paiement à la livraison (COD)',
                'delivery_type': 'fixed',
                'fixed_price': 10.0,
                'product_id': delivery_product.id,
                'company_id': self.company_id.id,
                'sequence': 25,
            },
            {
                'name': 'Retrait en magasin',
                'delivery_type': 'fixed',
                'fixed_price': 0.0,
                'product_id': delivery_product.id,
                'company_id': self.company_id.id,
                'sequence': 30,
            },
        ]

        for config in carriers_config:
            existing = Carrier.search([
                ('name', '=', config['name']),
                ('company_id', '=', self.company_id.id)
            ], limit=1)
            if not existing:
                Carrier.create(config)

    def _create_default_legal_pages(self):
        """
        Crée les pages légales par défaut :
        - Conditions Générales de Vente (CGV)
        - Mentions légales
        - Politique de confidentialité
        - Politique de retour
        """
        self.ensure_one()
        StaticPage = self.env['quelyos.static.page'].sudo()

        pages_config = [
            {
                'name': 'CGV',
                'title': 'Conditions Générales de Vente',
                'slug': 'cgv',
                'content': '''<h1>Conditions Générales de Vente</h1>
<p>Les présentes conditions générales de vente régissent les relations contractuelles entre la société et ses clients.</p>
<h2>Article 1 - Objet</h2>
<p>Les présentes conditions générales de vente ont pour objet de définir les droits et obligations des parties dans le cadre de la vente en ligne de produits.</p>
<h2>Article 2 - Prix</h2>
<p>Les prix sont indiqués en Dinars Tunisiens (TND) toutes taxes comprises.</p>
<h2>Article 3 - Commande</h2>
<p>Toute commande implique l'acceptation des présentes conditions générales de vente.</p>''',
                'active': True,
                'show_in_footer': True,
                'footer_column': 'legal',
                'company_id': self.company_id.id,
            },
            {
                'name': 'Mentions',
                'title': 'Mentions Légales',
                'slug': 'mentions-legales',
                'content': '''<h1>Mentions Légales</h1>
<h2>Éditeur du site</h2>
<p>Ce site est édité par la société.</p>
<h2>Hébergement</h2>
<p>Ce site est hébergé par Quelyos.</p>
<h2>Propriété intellectuelle</h2>
<p>L'ensemble du contenu de ce site est protégé par le droit d'auteur.</p>''',
                'active': True,
                'show_in_footer': True,
                'footer_column': 'legal',
                'company_id': self.company_id.id,
            },
            {
                'name': 'Confidentialité',
                'title': 'Politique de Confidentialité',
                'slug': 'confidentialite',
                'content': '''<h1>Politique de Confidentialité</h1>
<h2>Collecte des données</h2>
<p>Nous collectons les données nécessaires au traitement de vos commandes.</p>
<h2>Utilisation des données</h2>
<p>Vos données sont utilisées uniquement pour le traitement de vos commandes et la gestion de votre compte.</p>
<h2>Protection des données</h2>
<p>Nous mettons en œuvre toutes les mesures nécessaires pour protéger vos données personnelles.</p>''',
                'active': True,
                'show_in_footer': True,
                'footer_column': 'legal',
                'company_id': self.company_id.id,
            },
            {
                'name': 'Retours',
                'title': 'Politique de Retour',
                'slug': 'retours',
                'content': '''<h1>Politique de Retour</h1>
<h2>Délai de rétractation</h2>
<p>Vous disposez d'un délai de 14 jours pour retourner votre commande.</p>
<h2>Conditions de retour</h2>
<p>Les produits doivent être retournés dans leur emballage d'origine, non utilisés.</p>
<h2>Remboursement</h2>
<p>Le remboursement sera effectué dans les 14 jours suivant la réception du retour.</p>''',
                'active': True,
                'show_in_footer': True,
                'footer_column': 'legal',
                'company_id': self.company_id.id,
            },
        ]

        for config in pages_config:
            existing = StaticPage.search([
                ('slug', '=', config['slug']),
                ('company_id', '=', self.company_id.id)
            ], limit=1)
            if not existing:
                StaticPage.create(config)

    def _create_default_menu(self):
        """
        Crée le menu de navigation par défaut :
        - Accueil
        - Boutique
        - À propos
        - Contact
        """
        self.ensure_one()
        Menu = self.env['quelyos.menu'].sudo()

        # Vérifier si un menu existe déjà
        existing = Menu.search([
            ('company_id', '=', self.company_id.id)
        ], limit=1)

        if not existing:
            menus_config = [
                {
                    'name': 'Menu Principal',
                    'code': 'header',
                    'label': 'Menu Principal',
                    'url': '#',
                    'sequence': 1,
                    'company_id': self.company_id.id,
                },
            ]

            # Créer le menu racine
            header_menu = Menu.create(menus_config[0])

            # Créer les sous-menus
            submenus = [
                {
                    'name': 'Accueil',
                    'code': 'home',
                    'label': 'Accueil',
                    'url': '/',
                    'sequence': 10,
                    'parent_id': header_menu.id,
                    'company_id': self.company_id.id,
                },
                {
                    'name': 'Boutique',
                    'code': 'shop',
                    'label': 'Boutique',
                    'url': '/products',
                    'sequence': 20,
                    'parent_id': header_menu.id,
                    'company_id': self.company_id.id,
                },
                {
                    'name': 'À propos',
                    'code': 'about',
                    'label': 'À propos',
                    'url': '/about',
                    'sequence': 30,
                    'parent_id': header_menu.id,
                    'company_id': self.company_id.id,
                },
                {
                    'name': 'Contact',
                    'code': 'contact',
                    'label': 'Contact',
                    'url': '/contact',
                    'sequence': 40,
                    'parent_id': header_menu.id,
                    'company_id': self.company_id.id,
                },
            ]

            for config in submenus:
                Menu.create(config)

    def _create_admin_user(self, email):
        """
        Crée un utilisateur administrateur pour le tenant.

        Args:
            email: Email de l'utilisateur admin
        """
        self.ensure_one()

        # Vérifier que l'email n'existe pas déjà
        existing = self.env['res.users'].sudo().search([
            ('login', '=', email)
        ], limit=1)
        if existing:
            raise ValidationError(
                _("Un utilisateur avec cet email existe déjà : %s") % email
            )

        # Générer un mot de passe temporaire
        temp_password = secrets.token_urlsafe(12)

        # Créer le partner
        partner = self.env['res.partner'].sudo().create({
            'name': email.split('@')[0].title(),
            'email': email,
            'company_id': self.company_id.id,
        })

        # Préparer les groupes de base
        base_groups = [self.env.ref('base.group_user').id]  # Internal User

        # Ajouter les groupes du plan d'abonnement si disponible
        if self.subscription_id and self.subscription_id.plan_id:
            base_groups.extend([group.id for group in self.subscription_id.plan_id.group_ids])

        # Créer l'utilisateur
        user = self.env['res.users'].sudo().create({
            'name': partner.name,
            'login': email,
            'password': temp_password,
            'partner_id': partner.id,
            'company_id': self.company_id.id,
            'company_ids': [(4, self.company_id.id)],
            'group_ids': [(6, 0, base_groups)],
        })

        # Log le mot de passe temporaire (à remplacer par envoi email)
        self.message_post(
            body=_(
                "Utilisateur admin créé : %s\n"
                "Mot de passe temporaire : %s\n\n"
                "L'utilisateur doit changer son mot de passe à la première connexion."
            ) % (email, temp_password),
            message_type='notification',
        )

        return user

    # ═══════════════════════════════════════════════════════════════════════════
    # ACTIONS (BOUTONS)
    # ═══════════════════════════════════════════════════════════════════════════

    def action_create_admin_user(self):
        """Action du bouton pour créer l'utilisateur admin"""
        self.ensure_one()
        if not self.admin_email:
            raise ValidationError(_("Veuillez renseigner l'email de l'admin"))

        self._create_admin_user(self.admin_email)

        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('Utilisateur créé'),
                'message': _('L\'utilisateur admin a été créé avec succès'),
                'type': 'success',
                'sticky': False,
            }
        }

    def action_view_users(self):
        """Action du bouton stat pour voir les utilisateurs"""
        self.ensure_one()
        return {
            'name': _('Utilisateurs de %s') % self.name,
            'type': 'ir.actions.act_window',
            'res_model': 'res.users',
            'view_mode': 'list,form',
            'domain': [('company_id', '=', self.company_id.id)],
            'context': {'default_company_id': self.company_id.id},
        }

    # ═══════════════════════════════════════════════════════════════════════════
    # ACTIONS STATUT TENANT (SaaS Lifecycle)
    # ═══════════════════════════════════════════════════════════════════════════

    def action_activate(self):
        """Active le tenant (fin de provisioning ou réactivation)"""
        for tenant in self:
            if tenant.status in ('provisioning', 'suspended'):
                tenant.write({'status': 'active'})
                tenant.message_post(body=_("Tenant activé"))

    def action_suspend(self):
        """Suspend le tenant (paiement en retard, violation ToS, etc.)"""
        for tenant in self:
            if tenant.status == 'active':
                tenant.write({'status': 'suspended'})
                tenant.message_post(body=_("Tenant suspendu"))
                # Optionnel: désactiver les utilisateurs
                tenant.user_ids.write({'active': False})

    def action_archive(self):
        """Archive le tenant (résiliation définitive)"""
        for tenant in self:
            tenant.write({
                'status': 'archived',
                'active': False,
            })
            tenant.message_post(body=_("Tenant archivé"))
            # Désactiver les utilisateurs
            tenant.user_ids.write({'active': False})

    def action_reactivate(self):
        """Réactive un tenant suspendu"""
        for tenant in self:
            if tenant.status == 'suspended':
                tenant.write({'status': 'active'})
                tenant.message_post(body=_("Tenant réactivé"))
                # Réactiver les utilisateurs
                self.env['res.users'].sudo().search([
                    ('company_id', '=', tenant.company_id.id)
                ]).write({'active': True})

    # ═══════════════════════════════════════════════════════════════════════════
    # API SELF-SERVICE ONBOARDING
    # ═══════════════════════════════════════════════════════════════════════════

    @api.model
    def create_from_signup(self, vals):
        """
        Création de tenant depuis le wizard d'inscription self-service.

        Args:
            vals: dict avec les clés:
                - name: Nom de la boutique
                - code: Slug/code unique
                - email: Email admin
                - plan_code: 'starter', 'pro', 'business', 'enterprise'
                - sector: Secteur d'activité
                - primary_color: Couleur principale (#hex)
                - stripe_customer_id: ID client Stripe (optionnel)

        Returns:
            dict avec tenant_id, admin_url, store_url, temp_password
        """
        # Valider le code unique
        existing = self.sudo().search([('code', '=', vals.get('code'))], limit=1)
        if existing:
            raise ValidationError(_("Ce nom de boutique est déjà pris"))

        # Trouver le plan
        plan = self.env['quelyos.subscription.plan'].sudo().search([
            ('code', '=', vals.get('plan_code', 'starter'))
        ], limit=1)
        if not plan:
            plan = self.env['quelyos.subscription.plan'].sudo().search([], limit=1)

        # Générer le domaine
        domain = f"{vals.get('code')}.quelyos.shop"

        # Créer le tenant (le workflow create() fait le provisioning)
        tenant = self.sudo().create({
            'name': vals.get('name'),
            'code': vals.get('code'),
            'domain': domain,
            'backoffice_domain': f"admin.{domain}",
            'plan_id': plan.id if plan else False,
            'admin_email': vals.get('email'),
            'primary_color': vals.get('primary_color', '#6366f1'),
            'stripe_customer_id': vals.get('stripe_customer_id'),
            'status': 'provisioning',
            'deployment_tier': 'shared',
        })

        # Récupérer le mot de passe temporaire (généré dans _create_admin_user)
        # Note: En prod, envoyer par email plutôt que le retourner
        temp_password = secrets.token_urlsafe(12)

        return {
            'success': True,
            'tenant_id': tenant.id,
            'tenant_code': tenant.code,
            'store_url': f"https://{tenant.domain}",
            'admin_url': f"https://{tenant.backoffice_domain}",
            'status': tenant.status,
        }

    # ═══════════════════════════════════════════════════════════════════════════
    # THEME ENGINE - Gestion du thème actif
    # ═══════════════════════════════════════════════════════════════════════════

    def get_active_theme_config(self):
        """
        Retourne la configuration du thème actif pour ce tenant.
        Applique les overrides si présents.

        Returns:
            dict: Configuration complète du thème
        """
        self.ensure_one()

        # Si pas de thème actif, retourner thème par défaut
        if not self.active_theme_id:
            default_theme = self.env['quelyos.theme'].sudo().search([
                ('code', '=', 'default'),
                ('is_public', '=', True),
                ('active', '=', True)
            ], limit=1)

            if not default_theme:
                # Si aucun thème default, prendre le premier thème public
                default_theme = self.env['quelyos.theme'].sudo().search([
                    ('is_public', '=', True),
                    ('active', '=', True)
                ], limit=1, order='sequence')

            if not default_theme:
                return {
                    'success': False,
                    'error': 'No theme available'
                }

            # Activer ce thème par défaut pour le tenant
            self.sudo().write({'active_theme_id': default_theme.id})

        # Récupérer la config du thème
        theme_data = self.active_theme_id.sudo().get_theme_config()

        if not theme_data.get('success'):
            return theme_data

        # Appliquer les overrides si présents
        if self.theme_overrides:
            try:
                overrides = json.loads(self.theme_overrides)
                config = theme_data['theme']['config']

                # Deep merge des overrides
                merged_config = self._deep_merge_dict(config, overrides)
                theme_data['theme']['config'] = merged_config

            except json.JSONDecodeError:
                _logger.warning(
                    "Invalid theme_overrides JSON for tenant %s",
                    self.code
                )

        return theme_data

    def _deep_merge_dict(self, base, override):
        """
        Merge récursif de deux dictionnaires.
        Les valeurs d'override écrasent celles de base.

        Args:
            base (dict): Dictionnaire de base
            override (dict): Dictionnaire d'override

        Returns:
            dict: Dictionnaire mergé
        """
        result = base.copy()

        for key, value in override.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._deep_merge_dict(result[key], value)
            else:
                result[key] = value

        return result

    def action_set_theme(self, theme_code):
        """
        Active un thème pour ce tenant.
        Vérifie que le thème est accessible (public ou acheté si premium).

        Args:
            theme_code (str): Code du thème à activer

        Returns:
            dict: Success status
        """
        self.ensure_one()

        theme = self.env['quelyos.theme'].sudo().search([
            ('code', '=', theme_code),
            ('active', '=', True)
        ], limit=1)

        if not theme:
            return {
                'success': False,
                'error': 'Theme not found'
            }

        # Vérifier accessibilité
        if not theme.is_public and self not in theme.tenant_ids:
            return {
                'success': False,
                'error': 'Theme not accessible'
            }

        # Vérifier si premium et pas acheté
        if theme.is_premium and theme.price > 0:
            if theme not in self.purchased_theme_ids:
                return {
                    'success': False,
                    'error': 'Theme not purchased',
                    'price': theme.price
                }

        # Activer le thème
        self.sudo().write({'active_theme_id': theme.id})

        # Incrémenter compteur downloads
        theme.sudo().action_increment_downloads()

        return {
            'success': True,
            'theme_code': theme.code,
            'theme_name': theme.name
        }
