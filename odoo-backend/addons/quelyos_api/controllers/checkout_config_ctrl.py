# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
from .base import BaseController

class CheckoutConfigController(BaseController):

    @http.route('/api/admin/checkout-config', type='json', auth='public', methods=['POST'], csrf=False)
    def get_checkout_config(self, **kwargs):
        """Récupérer la configuration checkout du tenant"""
        tenant_id = self._authenticate_and_get_tenant()
        if not tenant_id:
            return {'success': False, 'error': 'Non authentifié'}

        Config = request.env['quelyos.checkout.config'].sudo()
        config = Config.get_config_for_tenant(tenant_id)

        return {
            'success': True,
            'config': {
                'id': config.id,
                # Étape 1
                'step1_label': config.step1_label,
                'step1_message': config.step1_message or '',
                'step1_icon': config.step1_icon,
                # Étape 2
                'step2_label': config.step2_label,
                'step2_message': config.step2_message or '',
                'step2_icon': config.step2_icon,
                'step2_active': config.step2_active,
                # Étape 3
                'step3_label': config.step3_label,
                'step3_message': config.step3_message or '',
                'step3_icon': config.step3_icon,
                # Étape 4
                'step4_label': config.step4_label,
                'step4_message': config.step4_message or '',
                'step4_icon': config.step4_icon,
                # Configuration générale
                'show_progress_bar': config.show_progress_bar,
                'allow_guest_checkout': config.allow_guest_checkout,
                'require_phone': config.require_phone,
                'require_company': config.require_company,
            }
        }

    @http.route('/api/admin/checkout-config/save', type='json', auth='public', methods=['POST'], csrf=False)
    def save_checkout_config(self, **kwargs):
        """Sauvegarder la configuration checkout"""
        tenant_id = self._authenticate_and_get_tenant()
        if not tenant_id:
            return {'success': False, 'error': 'Non authentifié'}

        Config = request.env['quelyos.checkout.config'].sudo()
        config = Config.get_config_for_tenant(tenant_id)

        # Données à mettre à jour
        data = {
            # Étape 1
            'step1_label': kwargs.get('step1_label', 'Panier'),
            'step1_message': kwargs.get('step1_message', ''),
            'step1_icon': kwargs.get('step1_icon', '🛒'),
            # Étape 2
            'step2_label': kwargs.get('step2_label', 'Livraison'),
            'step2_message': kwargs.get('step2_message', ''),
            'step2_icon': kwargs.get('step2_icon', '📦'),
            'step2_active': kwargs.get('step2_active', True),
            # Étape 3
            'step3_label': kwargs.get('step3_label', 'Paiement'),
            'step3_message': kwargs.get('step3_message', ''),
            'step3_icon': kwargs.get('step3_icon', '💳'),
            # Étape 4
            'step4_label': kwargs.get('step4_label', 'Confirmation'),
            'step4_message': kwargs.get('step4_message', ''),
            'step4_icon': kwargs.get('step4_icon', '✓'),
            # Configuration générale
            'show_progress_bar': kwargs.get('show_progress_bar', True),
            'allow_guest_checkout': kwargs.get('allow_guest_checkout', False),
            'require_phone': kwargs.get('require_phone', True),
            'require_company': kwargs.get('require_company', False),
        }

        config.write(data)

        return {'success': True, 'config_id': config.id}

    @http.route('/api/ecommerce/checkout-config', type='json', auth='public', methods=['POST'], csrf=False)
    def get_public_checkout_config(self, **kwargs):
        """Configuration checkout publique pour le frontend e-commerce"""
        domain = kwargs.get('domain', request.httprequest.headers.get('Origin', ''))
        tenant_id = self._get_tenant_by_domain(domain)

        if not tenant_id:
            return {'success': False, 'error': 'Tenant non trouvé'}

        Config = request.env['quelyos.checkout.config'].sudo()
        config = Config.get_config_for_tenant(tenant_id)

        # Retourner seulement les champs nécessaires au frontend
        steps = []

        # Étape 1 - Panier (toujours active)
        steps.append({
            'number': 1,
            'label': config.step1_label,
            'message': config.step1_message or '',
            'icon': config.step1_icon,
        })

        # Étape 2 - Livraison (si active)
        if config.step2_active:
            steps.append({
                'number': 2,
                'label': config.step2_label,
                'message': config.step2_message or '',
                'icon': config.step2_icon,
            })

        # Étape 3 - Paiement (toujours active)
        steps.append({
            'number': 3 if config.step2_active else 2,
            'label': config.step3_label,
            'message': config.step3_message or '',
            'icon': config.step3_icon,
        })

        # Étape 4 - Confirmation (toujours active)
        steps.append({
            'number': 4 if config.step2_active else 3,
            'label': config.step4_label,
            'message': config.step4_message or '',
            'icon': config.step4_icon,
        })

        return {
            'success': True,
            'config': {
                'steps': steps,
                'show_progress_bar': config.show_progress_bar,
                'allow_guest_checkout': config.allow_guest_checkout,
                'require_phone': config.require_phone,
                'require_company': config.require_company,
            }
        }
