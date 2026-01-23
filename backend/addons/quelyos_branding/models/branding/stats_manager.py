# -*- coding: utf-8 -*-

"""
Stats Manager for Quelyos Branding
Provides module statistics and information.
"""

from odoo import models, api


class StatsManager(models.AbstractModel):
    """
    Service for computing module statistics and information.
    Provides version info, installation date, usage stats.
    """
    _name = 'quelyos.branding.stats.manager'
    _description = 'Stats Manager for Quelyos Branding'

    @api.model
    def get_module_info(self):
        """
        Get module installation information.

        Returns:
            dict: Module version and installation date
        """
        module = self.env['ir.module.module'].search([
            ('name', '=', 'quelyos_branding')
        ], limit=1)

        if not module:
            return {
                'version': 'N/A',
                'active_since': False,
                'state': 'not_installed',
            }

        return {
            'version': module.installed_version or '19.0.1.0.0',
            'active_since': module.write_date.date() if module.write_date else False,
            'state': module.state,
            'installed': module.state == 'installed',
        }

    @api.model
    def get_custom_logos_count(self):
        """
        Count uploaded custom logos.

        Returns:
            int: Number of custom logos
        """
        logo_manager = self.env['quelyos.branding.logo.manager']
        return logo_manager.count_custom_logos()

    @api.model
    def get_branding_stats(self):
        """
        Get comprehensive branding statistics.

        Returns:
            dict: Complete branding stats
        """
        params = self.env['ir.config_parameter'].sudo()
        module_info = self.get_module_info()
        custom_logos = self.get_custom_logos_count()

        # Get active features count
        active_features = 0
        features = [
            'quelyos.branding.enable_full_debranding',
            'quelyos.branding.replace_odoo_text',
            'quelyos.branding.hide_enterprise_features',
            'quelyos.branding.hide_studio',
            'quelyos.branding.hide_upgrade_prompts',
            'quelyos.branding.hide_enterprise_menus',
        ]

        for feature in features:
            if params.get_param(feature, 'False') == 'True':
                active_features += 1

        # Get theme info
        theme_manager = self.env['quelyos.branding.theme.manager']
        current_theme = theme_manager.get_current_theme()

        return {
            'module_version': module_info['version'],
            'active_since': module_info['active_since'],
            'custom_logos': custom_logos,
            'active_features': active_features,
            'total_features': len(features),
            'current_theme': current_theme['name'],
            'theme_id': current_theme['id'],
        }

    @api.model
    def get_feature_status(self):
        """
        Get status of all branding features.

        Returns:
            dict: Feature name -> enabled status
        """
        params = self.env['ir.config_parameter'].sudo()

        features = {
            'full_debranding': {
                'param': 'quelyos.branding.enable_full_debranding',
                'name': 'Debranding complet',
                'description': 'Suppression complète des références Odoo',
            },
            'replace_text': {
                'param': 'quelyos.branding.replace_odoo_text',
                'name': 'Remplacement textes "Odoo"',
                'description': 'Remplace automatiquement "Odoo" par "Quelyos"',
            },
            'hide_enterprise': {
                'param': 'quelyos.branding.hide_enterprise_features',
                'name': 'Masquer fonctionnalités Entreprise',
                'description': 'Masque badges et promotions Enterprise',
            },
            'hide_studio': {
                'param': 'quelyos.branding.hide_studio',
                'name': 'Masquer Odoo Studio',
                'description': 'Masque tous les éléments Odoo Studio',
            },
            'hide_upgrade': {
                'param': 'quelyos.branding.hide_upgrade_prompts',
                'name': 'Masquer invitations mise à niveau',
                'description': 'Supprime les invitations Enterprise',
            },
            'hide_menus': {
                'param': 'quelyos.branding.hide_enterprise_menus',
                'name': 'Désactiver menus Entreprise',
                'description': 'Désactive menus modules Enterprise',
            },
        }

        status = {}
        for key, feature in features.items():
            enabled = params.get_param(feature['param'], 'False') == 'True'
            status[key] = {
                'name': feature['name'],
                'description': feature['description'],
                'enabled': enabled,
            }

        return status

    @api.model
    def get_configuration_summary(self):
        """
        Get a summary of the current branding configuration.

        Returns:
            dict: Configuration summary
        """
        params = self.env['ir.config_parameter'].sudo()
        logo_manager = self.env['quelyos.branding.logo.manager']
        theme_manager = self.env['quelyos.branding.theme.manager']

        # Get logos
        all_logos = logo_manager.get_all_logos()

        # Get theme
        current_theme = theme_manager.get_current_theme()

        # Get company info
        company_name = params.get_param('quelyos.branding.company_name', 'Quelyos')
        company_url = params.get_param('quelyos.branding.company_url', 'https://quelyos.com')
        slogan = params.get_param('quelyos.branding.slogan', 'La plateforme SaaS omnicanal pour le retail')

        # Get features
        feature_status = self.get_feature_status()
        active_features = sum(1 for f in feature_status.values() if f['enabled'])

        return {
            'company': {
                'name': company_name,
                'url': company_url,
                'slogan': slogan,
            },
            'theme': current_theme,
            'logos': {
                'total': len(all_logos),
                'types': list(all_logos.keys()),
            },
            'features': {
                'active': active_features,
                'total': len(feature_status),
                'details': feature_status,
            },
        }
