# -*- coding: utf-8 -*-
"""
Modèle Tenant pour la gestion multi-boutique/multi-marque.

Permet à chaque client d'avoir son propre branding (couleurs, logo, typographie)
tout en partageant la même instance Odoo.

Workflow automatique lors de la création :
1. Création de la company Odoo (si non fournie)
2. Création de l'abonnement (subscription) avec le plan choisi
3. Création de l'utilisateur admin (si email fourni)
"""

import json
import base64
import secrets
from datetime import timedelta
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


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

    # ═══════════════════════════════════════════════════════════════════════════
    # BRANDING
    # ═══════════════════════════════════════════════════════════════════════════

    logo = fields.Binary(
        string='Logo',
        help="Logo principal de la boutique"
    )
    logo_filename = fields.Char(
        string='Nom fichier logo'
    )
    favicon = fields.Binary(
        string='Favicon',
        help="Icône affichée dans l'onglet du navigateur"
    )
    favicon_filename = fields.Char(
        string='Nom fichier favicon'
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

    _sql_constraints = [
        ('code_unique', 'UNIQUE(code)', 'Le code du tenant doit être unique'),
        ('domain_unique', 'UNIQUE(domain)', 'Le domaine principal doit être unique'),
    ]

    # ═══════════════════════════════════════════════════════════════════════════
    # COMPUTED FIELDS
    # ═══════════════════════════════════════════════════════════════════════════

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

        return tenants

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

        # Créer l'utilisateur
        user = self.env['res.users'].sudo().create({
            'name': partner.name,
            'login': email,
            'password': temp_password,
            'partner_id': partner.id,
            'company_id': self.company_id.id,
            'company_ids': [(4, self.company_id.id)],
            'groups_id': [(6, 0, [
                self.env.ref('base.group_user').id,  # Internal User
            ])],
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
            'view_mode': 'tree,form',
            'domain': [('company_id', '=', self.company_id.id)],
            'context': {'default_company_id': self.company_id.id},
        }
