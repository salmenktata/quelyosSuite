# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
from .base import BaseController

class QuelyApiSettings(BaseController):
    """API Settings Management Controller"""

    @http.route('/api/settings/images', type='http', auth='public', methods=['GET'], csrf=False)
    def get_image_api_settings(self):
        """Get all image API settings (public pour usage frontend)"""
        try:
            settings = request.env['quelyos.api.settings'].sudo().get_image_api_settings()

            # Structure pour le frontend
            return request.make_json_response({
                'success': True,
                'settings': {
                    'unsplash_key': settings.get('unsplash_access_key', {}).get('value', ''),
                    'pexels_key': settings.get('pexels_api_key', {}).get('value', ''),
                }
            })
        except Exception as e:
            return request.make_json_response({
                'success': False,
                'error': 'Erreur serveur'
            })

    @http.route('/api/settings/images', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def update_image_api_settings(self):
        """Update image API settings (authentification requise)"""
        try:
            error = self._check_auth()
            if error:
                return error

            params = self._get_params()
            settings_model = request.env['quelyos.api.settings'].sudo()

            # Update Unsplash key
            if 'unsplash_key' in params:
                settings_model.set_setting(
                    'unsplash_access_key',
                    params['unsplash_key'],
                    description='Unsplash API Access Key (50 req/h)',
                    category='images'
                )

            # Update Pexels key
            if 'pexels_key' in params:
                settings_model.set_setting(
                    'pexels_api_key',
                    params['pexels_key'],
                    description='Pexels API Key (200 req/h)',
                    category='images'
                )

            return {
                'success': True,
                'message': 'Clés API mises à jour avec succès'
            }
        except Exception as e:
            return {
                'success': False,
                'error': 'Erreur serveur'
            }

    @http.route('/api/settings/all', type='http', auth='user', methods=['GET'], csrf=False)
    def get_all_settings(self):
        """Get all settings grouped by category (admin only)"""
        try:
            error = self._check_auth()
            if error:
                return request.make_json_response(error)

            settings = request.env['quelyos.api.settings'].sudo().search([])

            result = {}
            for setting in settings:
                if setting.category not in result:
                    result[setting.category] = []

                result[setting.category].append({
                    'id': setting.id,
                    'name': setting.name,
                    'value': setting.value or '',
                    'description': setting.description or '',
                    'is_active': setting.is_active
                })

            return request.make_json_response({
                'success': True,
                'settings': result
            })
        except Exception as e:
            return request.make_json_response({
                'success': False,
                'error': 'Erreur serveur'
            })
