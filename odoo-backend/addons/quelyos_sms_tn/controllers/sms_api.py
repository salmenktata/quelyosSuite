# -*- coding: utf-8 -*-
import json
import logging
from odoo import http
from odoo.http import request, Response
from odoo.exceptions import ValidationError

_logger = logging.getLogger(__name__)


class SMSAPIController(http.Controller):
    """Controller for SMS administration endpoints"""

    @http.route('/api/admin/sms/config', type='jsonrpc', auth='user', methods=['POST'])
    def get_sms_config(self):
        """Get SMS configuration for current company"""
        try:
            self._check_admin_access()

            config = request.env['quelyos.sms.config'].get_config_for_company()

            return {
                'success': True,
                'config': config.to_frontend_config()
            }

        except Exception as e:
            _logger.error(f'Error fetching SMS config: {str(e)}', exc_info=True)
            return self._error_response(str(e))

    @http.route('/api/admin/sms/config/update', type='jsonrpc', auth='user', methods=['POST'])
    def update_sms_config(self, **kwargs):
        """Update SMS configuration"""
        try:
            self._check_admin_access()

            config = request.env['quelyos.sms.config'].get_config_for_company()

            # Allowed fields for update
            allowed_fields = [
                'api_key', 'sender_name', 'endpoint', 'is_active',
                'abandoned_cart_sms_enabled', 'abandoned_cart_delay',
                'order_confirmation_sms_enabled', 'shipping_update_sms_enabled'
            ]

            # Convert camelCase to snake_case
            field_mapping = {
                'apiKey': 'api_key',
                'senderName': 'sender_name',
                'endpoint': 'endpoint',
                'isActive': 'is_active',
                'abandonedCartSmsEnabled': 'abandoned_cart_sms_enabled',
                'abandonedCartDelay': 'abandoned_cart_delay',
                'orderConfirmationSmsEnabled': 'order_confirmation_sms_enabled',
                'shippingUpdateSmsEnabled': 'shipping_update_sms_enabled',
            }

            update_vals = {}
            for frontend_key, backend_key in field_mapping.items():
                if frontend_key in kwargs and backend_key in allowed_fields:
                    update_vals[backend_key] = kwargs[frontend_key]

            if update_vals:
                config.write(update_vals)

            return {
                'success': True,
                'config': config.to_frontend_config(),
                'message': 'Configuration SMS mise à jour'
            }

        except Exception as e:
            _logger.error(f'Error updating SMS config: {str(e)}', exc_info=True)
            return self._error_response(str(e))

    @http.route('/api/admin/sms/send-test', type='jsonrpc', auth='user', methods=['POST'])
    def send_test_sms(self, mobile, message):
        """Send a test SMS"""
        try:
            self._check_admin_access()

            if not mobile or not message:
                raise ValidationError('Mobile et message requis')

            # Send SMS
            provider = request.env['quelyos.sms.provider.tunisie']
            sms_log = provider.send_sms(
                mobile=mobile,
                message=message,
                notification_type='test'
            )

            if sms_log.status == 'sent':
                return {
                    'success': True,
                    'message': 'SMS de test envoyé avec succès',
                    'smsLog': sms_log.to_frontend_config()
                }
            else:
                return {
                    'success': False,
                    'error': sms_log.error_message or 'Échec envoi SMS',
                    'smsLog': sms_log.to_frontend_config()
                }

        except Exception as e:
            _logger.error(f'Error sending test SMS: {str(e)}', exc_info=True)
            return self._error_response(str(e))

    @http.route('/api/admin/sms/history', type='jsonrpc', auth='user', methods=['POST'])
    def get_sms_history(self, limit=10, offset=0):
        """Get SMS history for current company"""
        try:
            self._check_admin_access()

            logs = request.env['quelyos.sms.log'].search(
                [('company_id', '=', request.env.company.id)],
                limit=limit,
                offset=offset,
                order='create_date desc'
            )

            return {
                'success': True,
                'logs': [log.to_frontend_config() for log in logs],
                'total': request.env['quelyos.sms.log'].search_count([
                    ('company_id', '=', request.env.company.id)
                ])
            }

        except Exception as e:
            _logger.error(f'Error fetching SMS history: {str(e)}', exc_info=True)
            return self._error_response(str(e))

    @http.route('/api/admin/sms/quota', type='jsonrpc', auth='user', methods=['POST'])
    def get_sms_quota(self):
        """Get SMS quota information for current company"""
        try:
            self._check_admin_access()

            quota_ok, remaining, total = request.env['quelyos.sms.log'].check_quota_available()

            return {
                'success': True,
                'quota': {
                    'used': total - remaining,
                    'total': total,
                    'remaining': remaining,
                    'period': 'month'
                }
            }

        except Exception as e:
            _logger.error(f'Error fetching SMS quota: {str(e)}', exc_info=True)
            return self._error_response(str(e))

    @http.route('/api/admin/sms/preferences', type='jsonrpc', auth='user', methods=['POST'])
    def get_sms_preferences(self):
        """Get SMS notification preferences"""
        try:
            self._check_admin_access()

            config = request.env['quelyos.sms.config'].get_config_for_company()

            # Also get email preferences (assume they exist in quelyos.api.settings or similar)
            preferences = {
                'abandonedCartEmailEnabled': True,  # TODO: Get from actual setting
                'abandonedCartSmsEnabled': config.abandoned_cart_sms_enabled,
                'abandonedCartDelay': config.abandoned_cart_delay,
                'orderConfirmationEmailEnabled': True,  # TODO: Get from actual setting
                'orderConfirmationSmsEnabled': config.order_confirmation_sms_enabled,
                'shippingUpdateEmailEnabled': True,  # TODO: Get from actual setting
                'shippingUpdateSmsEnabled': config.shipping_update_sms_enabled,
            }

            return {
                'success': True,
                'preferences': preferences
            }

        except Exception as e:
            _logger.error(f'Error fetching SMS preferences: {str(e)}', exc_info=True)
            return self._error_response(str(e))

    @http.route('/api/admin/sms/preferences/update', type='jsonrpc', auth='user', methods=['POST'])
    def update_sms_preferences(self, **kwargs):
        """Update SMS notification preferences"""
        try:
            self._check_admin_access()

            config = request.env['quelyos.sms.config'].get_config_for_company()

            # Update SMS preferences
            update_vals = {}

            if 'abandonedCartSmsEnabled' in kwargs:
                update_vals['abandoned_cart_sms_enabled'] = kwargs['abandonedCartSmsEnabled']

            if 'abandonedCartDelay' in kwargs:
                update_vals['abandoned_cart_delay'] = kwargs['abandonedCartDelay']

            if 'orderConfirmationSmsEnabled' in kwargs:
                update_vals['order_confirmation_sms_enabled'] = kwargs['orderConfirmationSmsEnabled']

            if 'shippingUpdateSmsEnabled' in kwargs:
                update_vals['shipping_update_sms_enabled'] = kwargs['shippingUpdateSmsEnabled']

            if update_vals:
                config.write(update_vals)

            # TODO: Update email preferences if they are in the payload

            return {
                'success': True,
                'message': 'Préférences mises à jour',
                'preferences': config.to_frontend_config()
            }

        except Exception as e:
            _logger.error(f'Error updating SMS preferences: {str(e)}', exc_info=True)
            return self._error_response(str(e))

    def _check_admin_access(self):
        """Verify user has admin access"""
        if not request.env.user.has_group('base.group_system'):
            raise ValidationError('Accès administrateur requis')

    def _error_response(self, message):
        """Standard error response format"""
        return {
            'success': False,
            'error': str(message)
        }
