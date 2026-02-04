# -*- coding: utf-8 -*-
"""
API Homepage Builder
Endpoints pour gérer l'ordre et la visibilité des sections homepage
"""
from odoo import http
from odoo.http import request
from .base import BaseController


class HomepageBuilderController(BaseController):

    @http.route('/api/admin/homepage-builder/config', type='json', auth='public', methods=['POST'], csrf=False)
    def get_homepage_config(self, **kwargs):
        """
        Récupérer la configuration homepage du tenant.

        Returns:
            {
                'success': bool,
                'config': {
                    'sections_order': [
                        {
                            'id': str,
                            'name': str,
                            'description': str,
                            'visible': bool,
                            'icon': str,
                            'route': str
                        }
                    ]
                }
            }
        """
        # Authentifier l'utilisateur backoffice
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error

        # Récupérer le tenant depuis le header
        tenant = self._get_tenant()
        if not tenant:
            return {'success': False, 'error': 'Tenant invalide ou manquant'}

        HomepageConfig = request.env['quelyos.homepage.config'].sudo()
        config = HomepageConfig.get_config_for_tenant(tenant.id)

        return {
            'success': True,
            'config': {
                'id': config.id,
                'sections_order': config.sections_order
            }
        }

    @http.route('/api/admin/homepage-builder/config/save', type='json', auth='public', methods=['POST'], csrf=False)
    def save_homepage_config(self, **kwargs):
        """
        Sauvegarder la configuration homepage (ordre + visibilité).

        Params:
            sections_order: Liste des sections avec ordre et visibilité

        Returns:
            {
                'success': bool,
                'message': str
            }
        """
        # Authentifier l'utilisateur backoffice
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error

        # Récupérer le tenant depuis le header
        tenant = self._get_tenant()
        if not tenant:
            return {'success': False, 'error': 'Tenant invalide ou manquant'}

        sections_order = kwargs.get('sections_order')
        if not sections_order:
            return {'success': False, 'error': 'sections_order requis'}

        if not isinstance(sections_order, list):
            return {'success': False, 'error': 'sections_order doit être une liste'}

        # Valider format
        for section in sections_order:
            if not isinstance(section, dict):
                return {'success': False, 'error': 'Chaque section doit être un dictionnaire'}

            required_keys = ['id', 'name', 'visible']
            for key in required_keys:
                if key not in section:
                    return {'success': False, 'error': f'Section doit contenir la clé "{key}"'}

        # Sauvegarder
        HomepageConfig = request.env['quelyos.homepage.config'].sudo()
        config = HomepageConfig.get_config_for_tenant(tenant.id)

        config.write({
            'sections_order': sections_order
        })

        return {
            'success': True,
            'message': 'Configuration homepage sauvegardée'
        }

    @http.route('/api/admin/homepage-builder/config/reset', type='json', auth='public', methods=['POST'], csrf=False)
    def reset_homepage_config(self, **kwargs):
        """
        Réinitialiser la configuration homepage à l'ordre par défaut.

        Returns:
            {
                'success': bool,
                'message': str,
                'config': dict
            }
        """
        # Authentifier l'utilisateur backoffice
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error

        # Récupérer le tenant depuis le header
        tenant = self._get_tenant()
        if not tenant:
            return {'success': False, 'error': 'Tenant invalide ou manquant'}

        HomepageConfig = request.env['quelyos.homepage.config'].sudo()
        config = HomepageConfig.get_config_for_tenant(tenant.id)

        config.action_reset_to_default()

        return {
            'success': True,
            'message': 'Configuration réinitialisée à l\'ordre par défaut',
            'config': {
                'sections_order': config.sections_order
            }
        }

    @http.route('/api/ecommerce/homepage-config', type='json', auth='public', methods=['POST'], csrf=False)
    def get_public_homepage_config(self, **kwargs):
        """
        Récupérer la configuration homepage publique (pour e-commerce frontend).
        Retourne uniquement les sections visibles dans l'ordre configuré.

        Params:
            domain: Domain du tenant (depuis origin ou explicite)

        Returns:
            {
                'success': bool,
                'sections': [str] - IDs des sections visibles dans l'ordre
            }
        """
        # Récupérer domain depuis kwargs ou origin
        domain = kwargs.get('domain')
        if not domain:
            origin = request.httprequest.headers.get('Origin', '')
            if origin:
                domain = origin.replace('http://', '').replace('https://', '').split(':')[0]

        if not domain:
            return {'success': False, 'error': 'Domain requis'}

        # Récupérer tenant par domain
        Tenant = request.env['quelyos.tenant'].sudo()
        tenant = Tenant.search([('domain', '=', domain)], limit=1)

        if not tenant:
            return {'success': False, 'error': 'Tenant non trouvé'}

        # Récupérer config
        HomepageConfig = request.env['quelyos.homepage.config'].sudo()
        config = HomepageConfig.get_config_for_tenant(tenant.id)

        # Filtrer sections visibles uniquement
        visible_sections = [
            section['id']
            for section in config.sections_order
            if section.get('visible', True)
        ]

        return {
            'success': True,
            'sections': visible_sections
        }
