# -*- coding: utf-8 -*-

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

    @api.model
    def get_values(self):
        """Récupérer les valeurs des paramètres de configuration"""
        res = super(ResConfigSettings, self).get_values()
        params = self.env['ir.config_parameter'].sudo()

        res.update(
            quelyos_branding_company_name=params.get_param('quelyos.branding.company_name', 'Quelyos'),
            quelyos_branding_company_url=params.get_param('quelyos.branding.company_url', 'https://quelyos.com'),
            quelyos_branding_support_url=params.get_param('quelyos.branding.support_url', 'https://support.quelyos.com'),
            quelyos_branding_docs_url=params.get_param('quelyos.branding.docs_url', 'https://docs.quelyos.com'),
            quelyos_branding_primary_color=params.get_param('quelyos.branding.primary_color', '#1e40af'),
            quelyos_branding_secondary_color=params.get_param('quelyos.branding.secondary_color', '#10b981'),
            quelyos_branding_slogan=params.get_param('quelyos.branding.slogan', 'La plateforme SaaS omnicanal pour le retail'),
            quelyos_branding_contact_email=params.get_param('quelyos.branding.contact_email', 'contact@quelyos.com'),
            quelyos_branding_show_logo_email=params.get_param('quelyos.branding.show_logo_email', True),
            quelyos_branding_email_footer_text=params.get_param('quelyos.branding.email_footer_text', 'Envoyé par Quelyos'),
            quelyos_branding_powered_by_text=params.get_param('quelyos.branding.powered_by_text', 'Powered by Quelyos'),
            quelyos_branding_copyright_text=params.get_param('quelyos.branding.copyright_text', '© 2026 Quelyos'),
            quelyos_branding_enable_full_debranding=params.get_param('quelyos.branding.enable_full_debranding', True),
            quelyos_branding_replace_odoo_text=params.get_param('quelyos.branding.replace_odoo_text', True),
            quelyos_branding_favicon_path=params.get_param('quelyos.branding.favicon_path', '/quelyos_branding/static/src/img/favicon/favicon.ico'),
            quelyos_branding_logo_navbar_path=params.get_param('quelyos.branding.logo_navbar_path', '/quelyos_branding/static/src/img/logo/quelyos_logo_white.png'),
            quelyos_branding_logo_email_path=params.get_param('quelyos.branding.logo_email_path', '/quelyos_branding/static/src/img/logo/quelyos_logo.png'),
            quelyos_branding_logo_login_path=params.get_param('quelyos.branding.logo_login_path', '/quelyos_branding/static/src/img/logo/quelyos_logo_white.png'),
            quelyos_branding_login_bg_path=params.get_param('quelyos.branding.login_bg_path', '/quelyos_branding/static/src/img/backgrounds/login_bg.jpg'),
        )
        return res

    def set_values(self):
        """Sauvegarder les valeurs des paramètres de configuration"""
        super(ResConfigSettings, self).set_values()
        params = self.env['ir.config_parameter'].sudo()

        params.set_param('quelyos.branding.company_name', self.quelyos_branding_company_name or 'Quelyos')
        params.set_param('quelyos.branding.company_url', self.quelyos_branding_company_url or 'https://quelyos.com')
        params.set_param('quelyos.branding.support_url', self.quelyos_branding_support_url or 'https://support.quelyos.com')
        params.set_param('quelyos.branding.docs_url', self.quelyos_branding_docs_url or 'https://docs.quelyos.com')
        params.set_param('quelyos.branding.primary_color', self.quelyos_branding_primary_color or '#1e40af')
        params.set_param('quelyos.branding.secondary_color', self.quelyos_branding_secondary_color or '#10b981')
        params.set_param('quelyos.branding.slogan', self.quelyos_branding_slogan or 'La plateforme SaaS omnicanal pour le retail')
        params.set_param('quelyos.branding.contact_email', self.quelyos_branding_contact_email or 'contact@quelyos.com')
        params.set_param('quelyos.branding.show_logo_email', self.quelyos_branding_show_logo_email)
        params.set_param('quelyos.branding.email_footer_text', self.quelyos_branding_email_footer_text or 'Envoyé par Quelyos')
        params.set_param('quelyos.branding.powered_by_text', self.quelyos_branding_powered_by_text or 'Powered by Quelyos')
        params.set_param('quelyos.branding.copyright_text', self.quelyos_branding_copyright_text or '© 2026 Quelyos')
        params.set_param('quelyos.branding.enable_full_debranding', self.quelyos_branding_enable_full_debranding)
        params.set_param('quelyos.branding.replace_odoo_text', self.quelyos_branding_replace_odoo_text)
        params.set_param('quelyos.branding.favicon_path', self.quelyos_branding_favicon_path or '/quelyos_branding/static/src/img/favicon/favicon.ico')
        params.set_param('quelyos.branding.logo_navbar_path', self.quelyos_branding_logo_navbar_path or '/quelyos_branding/static/src/img/logo/quelyos_logo_white.png')
        params.set_param('quelyos.branding.logo_email_path', self.quelyos_branding_logo_email_path or '/quelyos_branding/static/src/img/logo/quelyos_logo.png')
        params.set_param('quelyos.branding.logo_login_path', self.quelyos_branding_logo_login_path or '/quelyos_branding/static/src/img/logo/quelyos_logo_white.png')
        params.set_param('quelyos.branding.login_bg_path', self.quelyos_branding_login_bg_path or '/quelyos_branding/static/src/img/backgrounds/login_bg.jpg')
