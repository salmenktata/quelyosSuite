# -*- coding: utf-8 -*-

"""
Quelyos Branding Configuration Settings
REFACTORED: Delegates to specialized services for better maintainability.
"""

from odoo import models, fields, api


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    # ========================================
    # Champs de configuration du branding
    # ========================================

    quelyos_branding_company_name = fields.Char(
        string='Nom de l\'entreprise',
        config_parameter='quelyos.branding.company_name',
        default='Quelyos',
        help='Nom de l\'entreprise affiché dans l\'interface'
    )

    quelyos_branding_company_url = fields.Char(
        string='URL du site web',
        config_parameter='quelyos.branding.company_url',
        default='https://quelyos.com',
        help='URL du site web de l\'entreprise'
    )

    quelyos_branding_support_url = fields.Char(
        string='URL du support',
        config_parameter='quelyos.branding.support_url',
        default='https://support.quelyos.com',
        help='URL de la page de support'
    )

    quelyos_branding_docs_url = fields.Char(
        string='URL de la documentation',
        config_parameter='quelyos.branding.docs_url',
        default='https://docs.quelyos.com',
        help='URL de la documentation'
    )

    quelyos_branding_primary_color = fields.Char(
        string='Couleur principale',
        config_parameter='quelyos.branding.primary_color',
        default='#1e40af',
        help='Couleur principale en format hexadécimal (ex: #1e40af)'
    )

    quelyos_branding_secondary_color = fields.Char(
        string='Couleur secondaire',
        config_parameter='quelyos.branding.secondary_color',
        default='#10b981',
        help='Couleur secondaire en format hexadécimal (ex: #10b981)'
    )

    quelyos_branding_slogan = fields.Char(
        string='Slogan',
        config_parameter='quelyos.branding.slogan',
        default='La plateforme SaaS omnicanal pour le retail',
        help='Slogan affiché sur la page de connexion et le site web'
    )

    quelyos_branding_contact_email = fields.Char(
        string='Email de contact',
        config_parameter='quelyos.branding.contact_email',
        default='contact@quelyos.com',
        help='Email de contact affiché dans le footer'
    )

    quelyos_branding_show_logo_email = fields.Boolean(
        string='Afficher le logo dans les emails',
        config_parameter='quelyos.branding.show_logo_email',
        default=True,
        help='Afficher le logo Quelyos dans les emails'
    )

    quelyos_branding_email_footer_text = fields.Char(
        string='Texte du footer des emails',
        config_parameter='quelyos.branding.email_footer_text',
        default='Envoyé par Quelyos - La plateforme retail omnicanal',
        help='Texte affiché dans le footer des emails'
    )

    quelyos_branding_powered_by_text = fields.Char(
        string='Texte "Powered by"',
        config_parameter='quelyos.branding.powered_by_text',
        default='Powered by Quelyos',
        help='Texte "Powered by" affiché dans le footer'
    )

    quelyos_branding_copyright_text = fields.Char(
        string='Texte du copyright',
        config_parameter='quelyos.branding.copyright_text',
        default='© 2026 Quelyos - Tous droits réservés',
        help='Texte du copyright affiché dans le footer'
    )

    quelyos_branding_enable_full_debranding = fields.Boolean(
        string='Activer le debranding complet',
        config_parameter='quelyos.branding.enable_full_debranding',
        default=True,
        help='Activer la suppression complète de toutes les références Odoo'
    )

    quelyos_branding_replace_odoo_text = fields.Boolean(
        string='Remplacer les textes "Odoo"',
        config_parameter='quelyos.branding.replace_odoo_text',
        default=True,
        help='Remplacer automatiquement les textes "Odoo" par "Quelyos" dans l\'interface'
    )

    quelyos_branding_hide_enterprise_features = fields.Boolean(
        string='Masquer les fonctionnalités Entreprise',
        config_parameter='quelyos.branding.hide_enterprise_features',
        default=True,
        help='Masquer tous les éléments liés à Odoo Enterprise (badges, promotions, etc.)'
    )

    quelyos_branding_hide_studio = fields.Boolean(
        string='Masquer Odoo Studio',
        config_parameter='quelyos.branding.hide_studio',
        default=True,
        help='Masquer tous les éléments Odoo Studio (boutons "Edit in Studio", menus, etc.)'
    )

    quelyos_branding_hide_upgrade_prompts = fields.Boolean(
        string='Masquer les invitations de mise à niveau',
        config_parameter='quelyos.branding.hide_upgrade_prompts',
        default=True,
        help='Supprimer toutes les invitations de mise à niveau Enterprise'
    )

    quelyos_branding_hide_enterprise_menus = fields.Boolean(
        string='Désactiver les menus Entreprise',
        config_parameter='quelyos.branding.hide_enterprise_menus',
        default=True,
        help='Désactiver les menus des modules entreprise (Studio, Helpdesk, Planning, etc.)'
    )

    # Champs pour les chemins des assets
    quelyos_branding_favicon_path = fields.Char(
        string='Chemin du favicon',
        config_parameter='quelyos.branding.favicon_path',
        default='/quelyos_branding/static/src/img/favicon/favicon.ico',
        help='Chemin vers le fichier favicon'
    )

    quelyos_branding_logo_navbar_path = fields.Char(
        string='Chemin du logo navbar',
        config_parameter='quelyos.branding.logo_navbar_path',
        default='/quelyos_branding/static/src/img/logo/quelyos_logo_white.png',
        help='Chemin vers le logo affiché dans la navbar'
    )

    quelyos_branding_logo_email_path = fields.Char(
        string='Chemin du logo email',
        config_parameter='quelyos.branding.logo_email_path',
        default='/quelyos_branding/static/src/img/logo/quelyos_logo.png',
        help='Chemin vers le logo affiché dans les emails'
    )

    quelyos_branding_logo_login_path = fields.Char(
        string='Chemin du logo login',
        config_parameter='quelyos.branding.logo_login_path',
        default='/quelyos_branding/static/src/img/logo/quelyos_logo_white.png',
        help='Chemin vers le logo affiché sur la page de connexion'
    )

    quelyos_branding_login_bg_path = fields.Char(
        string='Chemin du background login',
        config_parameter='quelyos.branding.login_bg_path',
        default='/quelyos_branding/static/src/img/backgrounds/login_bg.jpg',
        help='Chemin vers l\'image de fond de la page de connexion'
    )

    # ========================================
    # Champs pour l'upload de logos (Binary)
    # ========================================

    quelyos_branding_logo_main = fields.Binary(
        string='Logo Principal',
        help='Logo principal (recommandé: 1000x250px, PNG/SVG, max 2MB)',
        attachment=True
    )

    quelyos_branding_logo_white = fields.Binary(
        string='Logo Blanc (Navbar)',
        help='Logo blanc pour navbar (recommandé: 1000x250px, PNG/SVG, max 2MB)',
        attachment=True
    )

    quelyos_branding_logo_small = fields.Binary(
        string='Logo Petit',
        help='Logo petit pour emails/receipts (recommandé: 180x46px, PNG, max 1MB)',
        attachment=True
    )

    quelyos_branding_logo_email = fields.Binary(
        string='Logo Email',
        help='Logo pour templates email (recommandé: 600x150px, PNG, max 1MB)',
        attachment=True
    )

    quelyos_branding_favicon = fields.Binary(
        string='Favicon',
        help='Icône favicon (recommandé: 32x32px, ICO/PNG, max 500KB)',
        attachment=True
    )

    # ========================================
    # Champs computed pour statistiques
    # ========================================

    quelyos_branding_module_version = fields.Char(
        string='Version du module',
        compute='_compute_module_info',
        store=False
    )

    quelyos_branding_active_since = fields.Date(
        string='Actif depuis',
        compute='_compute_module_info',
        store=False
    )

    quelyos_branding_custom_logos = fields.Integer(
        string='Nombre de logos personnalisés',
        compute='_compute_custom_logos',
        store=False
    )

    # ========================================
    # Validation des logos (délégué à ImageValidator)
    # ========================================

    @api.onchange('quelyos_branding_logo_main', 'quelyos_branding_logo_white')
    def _onchange_logo_main(self):
        """Validate main and white logos."""
        validator = self.env['quelyos.branding.image.validator']

        if self.quelyos_branding_logo_main:
            validator.validate_logo('logo_main', self.quelyos_branding_logo_main)

        if self.quelyos_branding_logo_white:
            validator.validate_logo('logo_white', self.quelyos_branding_logo_white)

    @api.onchange('quelyos_branding_logo_small', 'quelyos_branding_logo_email')
    def _onchange_logo_small_email(self):
        """Validate small and email logos."""
        validator = self.env['quelyos.branding.image.validator']

        if self.quelyos_branding_logo_small:
            validator.validate_logo('logo_small', self.quelyos_branding_logo_small)

        if self.quelyos_branding_logo_email:
            validator.validate_logo('logo_email', self.quelyos_branding_logo_email)

    @api.onchange('quelyos_branding_favicon')
    def _onchange_favicon(self):
        """Validate favicon."""
        validator = self.env['quelyos.branding.image.validator']

        if self.quelyos_branding_favicon:
            validator.validate_logo('favicon', self.quelyos_branding_favicon)

    # ========================================
    # Méthodes computed (délégué à StatsManager)
    # ========================================

    def _compute_module_info(self):
        """Compute module installation info."""
        stats_manager = self.env['quelyos.branding.stats.manager']
        module_info = stats_manager.get_module_info()

        for record in self:
            record.quelyos_branding_module_version = module_info['version']
            record.quelyos_branding_active_since = module_info['active_since']

    def _compute_custom_logos(self):
        """Count uploaded custom logos."""
        stats_manager = self.env['quelyos.branding.stats.manager']
        count = stats_manager.get_custom_logos_count()

        for record in self:
            record.quelyos_branding_custom_logos = count

    # ========================================
    # Actions pour theme presets (délégué à ThemeManager)
    # ========================================

    def action_reset_to_defaults(self):
        """Reset all branding settings to default values."""
        params = self.env['ir.config_parameter'].sudo()

        default_values = {
            'quelyos.branding.company_name': 'Quelyos',
            'quelyos.branding.company_url': 'https://quelyos.com',
            'quelyos.branding.support_url': 'https://support.quelyos.com',
            'quelyos.branding.docs_url': 'https://docs.quelyos.com',
            'quelyos.branding.primary_color': '#1e40af',
            'quelyos.branding.secondary_color': '#10b981',
            'quelyos.branding.slogan': 'La plateforme SaaS omnicanal pour le retail',
            'quelyos.branding.contact_email': 'contact@quelyos.com',
            'quelyos.branding.show_logo_email': 'True',
            'quelyos.branding.email_footer_text': 'Envoyé par Quelyos - La plateforme retail omnicanal',
            'quelyos.branding.powered_by_text': 'Powered by Quelyos',
            'quelyos.branding.copyright_text': '© 2026 Quelyos - Tous droits réservés',
            'quelyos.branding.enable_full_debranding': 'True',
            'quelyos.branding.replace_odoo_text': 'True',
            'quelyos.branding.hide_enterprise_features': 'True',
            'quelyos.branding.hide_studio': 'True',
            'quelyos.branding.hide_upgrade_prompts': 'True',
            'quelyos.branding.hide_enterprise_menus': 'True',
        }

        for key, value in default_values.items():
            params.set_param(key, value)

        theme_manager = self.env['quelyos.branding.theme.manager']
        return theme_manager.create_notification(
            'Réinitialisé',
            'Les paramètres ont été réinitialisés aux valeurs par défaut.'
        )

    def action_set_blue_theme(self):
        """Set blue professional theme."""
        theme_manager = self.env['quelyos.branding.theme.manager']
        theme_manager.apply_theme('blue')
        return theme_manager.create_notification(
            'Thème modifié',
            'Thème bleu professionnel appliqué',
            'info'
        )

    def action_set_green_theme(self):
        """Set green ecological theme."""
        theme_manager = self.env['quelyos.branding.theme.manager']
        theme_manager.apply_theme('green')
        return theme_manager.create_notification(
            'Thème modifié',
            'Thème vert écologique appliqué',
            'info'
        )

    def action_set_purple_theme(self):
        """Set purple creative theme."""
        theme_manager = self.env['quelyos.branding.theme.manager']
        theme_manager.apply_theme('purple')
        return theme_manager.create_notification(
            'Thème modifié',
            'Thème violet créatif appliqué',
            'info'
        )

    def action_set_red_theme(self):
        """Set red energetic theme."""
        theme_manager = self.env['quelyos.branding.theme.manager']
        theme_manager.apply_theme('red')
        return theme_manager.create_notification(
            'Thème modifié',
            'Thème rouge énergique appliqué',
            'info'
        )

    # ========================================
    # Sauvegarde des logos (délégué à LogoManager)
    # ========================================

    def set_values(self):
        """Sauvegarder les valeurs des paramètres de configuration."""
        super(ResConfigSettings, self).set_values()

        logo_manager = self.env['quelyos.branding.logo.manager']

        # Sauvegarder les logos uploadés
        if self.quelyos_branding_logo_main:
            logo_manager.save_logo('logo_main', self.quelyos_branding_logo_main)

        if self.quelyos_branding_logo_white:
            logo_manager.save_logo('logo_white', self.quelyos_branding_logo_white)

        if self.quelyos_branding_logo_small:
            logo_manager.save_logo('logo_small', self.quelyos_branding_logo_small)

        if self.quelyos_branding_logo_email:
            logo_manager.save_logo('logo_email', self.quelyos_branding_logo_email)

        if self.quelyos_branding_favicon:
            logo_manager.save_logo('favicon', self.quelyos_branding_favicon)
