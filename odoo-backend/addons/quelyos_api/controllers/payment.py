# -*- coding: utf-8 -*-
import json
import logging
from odoo import http
from odoo.http import request, Response
from odoo.exceptions import UserError, ValidationError
from .base import BaseController

_logger = logging.getLogger(__name__)


class PaymentController(BaseController):
    """Controller for payment provider management and webhooks"""

    @http.route('/api/admin/payment/providers', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_payment_providers(self):
        """
        Get list of all payment providers (admin only)

        Returns:
            list: Payment providers with configuration
        """
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            # Get company from tenant header or use default
            company = self._get_company_from_tenant()
            providers = request.env['payment.provider'].sudo().search([
                ('code', 'in', ['flouci', 'konnect', 'stripe']),
                ('company_id', '=', company.id)
            ])

            return {
                'success': True,
                'providers': [p.to_frontend_config() for p in providers]
            }

        except Exception as e:
            _logger.error(f'Error fetching payment providers: {str(e)}', exc_info=True)
            return self._error_response('Erreur lors de la récupération des providers')

    @http.route('/api/admin/payment/provider/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def update_payment_provider(self, provider_id, **kwargs):
        """
        Update payment provider configuration (admin only)

        Args:
            provider_id: Provider ID
            **kwargs: Fields to update (state, flouci_app_token, konnect_api_key, etc.)

        Returns:
            dict: Updated provider configuration
        """
        try:
            error = self._authenticate_from_header()
            if error:
                return error
            if not request.env.user:
                return self._error_response('Authentication required')

            provider = request.env['payment.provider'].sudo().browse(provider_id)
            if not provider.exists():
                raise ValidationError('Provider not found')

            # Allowed fields for update (exclude sensitive auto-computed fields)
            allowed_fields = [
                'state', 'name',
                'flouci_app_token', 'flouci_app_secret', 'flouci_timeout', 'flouci_accept_cards',
                'konnect_api_key', 'konnect_wallet_id', 'konnect_lifespan', 'konnect_theme'
            ]

            update_vals = {k: v for k, v in kwargs.items() if k in allowed_fields}

            if update_vals:
                provider.write(update_vals)

            return {
                'success': True,
                'provider': provider.to_frontend_config(),
                'message': 'Provider updated successfully'
            }

        except Exception as e:
            _logger.error(f'Error updating payment provider: {str(e)}', exc_info=True)
            return self._error_response('Erreur lors de la mise à jour du provider')

    @http.route('/api/admin/payment/provider/test', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def test_payment_provider(self, provider_id):
        """
        Test payment provider API connection (admin only)

        Args:
            provider_id: Provider ID

        Returns:
            dict: Test result with success status and message
        """
        try:
            error = self._authenticate_from_header()
            if error:
                return error
            if not request.env.user:
                return self._error_response('Authentication required')

            provider = request.env['payment.provider'].sudo().browse(provider_id)
            if not provider.exists():
                raise ValidationError('Provider not found')

            result = provider.test_connection()

            return {
                'success': result.get('success', False),
                'message': result.get('message', 'Test completed'),
                'provider': provider.to_frontend_config()
            }

        except Exception as e:
            _logger.error(f'Error testing payment provider: {str(e)}', exc_info=True)
            return self._error_response('Erreur lors du test de connexion')

    @http.route('/api/ecommerce/payment/providers', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_active_payment_providers(self):
        """
        Get list of active payment providers for checkout (public endpoint)

        Returns:
            list: Active payment providers (minimal info, no credentials)
        """
        try:
            company = self._get_company_from_tenant()

            providers = request.env['payment.provider'].sudo().search([
                ('state', 'in', ['enabled', 'test']),
                ('company_id', '=', company.id)
            ])

            return {
                'success': True,
                'providers': [
                    {
                        'id': p.id,
                        'code': p.code,
                        'name': p.name,
                        'state': p.state,
                        'imageUrl': f'/web/image/payment.provider/{p.id}/image_128' if p.image_128 else None,
                    }
                    for p in providers
                ]
            }

        except Exception as e:
            _logger.error(f'Error fetching active providers: {str(e)}', exc_info=True)
            return self._error_response('Erreur lors de la récupération des moyens de paiement')

    @http.route('/api/ecommerce/payment/init', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def init_payment(self, provider_id, amount, currency_code, order_reference, customer_data, return_url):
        """
        Initialize payment session with selected provider

        Args:
            provider_id: Payment provider ID
            amount: Payment amount
            currency_code: Currency code (TND)
            order_reference: Order reference
            customer_data: Customer info (firstName, lastName, email, phoneNumber)
            return_url: URL to redirect after payment

        Returns:
            dict: Payment URL and transaction reference
        """
        try:
            company = self._get_company_from_tenant()

            provider = request.env['payment.provider'].sudo().browse(provider_id)
            if not provider.exists() or provider.state == 'disabled':
                raise ValidationError('Invalid or disabled payment provider')

            currency = request.env['res.currency'].sudo().search([('name', '=', currency_code)], limit=1)
            if not currency:
                raise ValidationError(f'Currency {currency_code} not found')

            # Generate unique transaction reference
            transaction_ref = f'TXN-{order_reference}-{provider.code.upper()}'

            # Create payment transaction
            transaction = request.env['payment.transaction'].sudo().create({
                'reference': transaction_ref,
                'amount': amount,
                'currency_id': currency.id,
                'provider_id': provider.id,
                'partner_id': request.env.user.partner_id.id if request.env.user._is_public() is False else None,
                'customer_phone': customer_data.get('phoneNumber'),
                'state': 'draft',
            })

            # Initialize payment with provider
            if provider.code == 'flouci':
                payment_data = provider._flouci_initiate_payment(
                    amount=amount,
                    currency=currency,
                    reference=transaction_ref,
                    return_url=return_url
                )
                transaction.write({
                    'provider_payment_id': payment_data['payment_id'],
                    'provider_request_payload': {
                        'amount': amount,
                        'reference': transaction_ref,
                        'return_url': return_url
                    }
                })
                transaction._set_pending()

                return {
                    'success': True,
                    'paymentUrl': payment_data['payment_url'],
                    'transactionRef': transaction_ref,
                    'transactionId': transaction.id
                }

            elif provider.code == 'konnect':
                payment_data = provider._konnect_initiate_payment(
                    amount=amount,
                    currency=currency,
                    reference=transaction_ref,
                    return_url=return_url,
                    customer_data=customer_data
                )
                transaction.write({
                    'provider_payment_id': payment_data['payment_ref'],
                    'provider_request_payload': {
                        'amount': amount,
                        'reference': transaction_ref,
                        'customer_data': customer_data,
                        'return_url': return_url
                    }
                })
                transaction._set_pending()

                return {
                    'success': True,
                    'paymentUrl': payment_data['payment_url'],
                    'transactionRef': transaction_ref,
                    'transactionId': transaction.id
                }

            else:
                raise ValidationError(f'Provider {provider.code} not supported')

        except Exception as e:
            _logger.error(f'Error initializing payment: {str(e)}', exc_info=True)
            return self._error_response('Erreur lors de l\'initialisation du paiement')

    @http.route('/api/payment/flouci/webhook', type='http', auth='public', methods=['POST'], csrf=False)
    def flouci_webhook(self):
        """
        Flouci webhook callback endpoint

        Returns:
            HTTP Response: 200 OK or error
        """
        try:
            # Parse webhook payload
            webhook_data = json.loads(request.httprequest.data.decode('utf-8'))
            signature = request.httprequest.headers.get('X-Flouci-Signature', '')

            _logger.info(f'Flouci webhook received: {webhook_data}')

            # Find transaction by provider payment ID
            payment_id = webhook_data.get('result', {}).get('payment_id')
            if not payment_id:
                raise ValidationError('Missing payment_id in webhook')

            transaction = request.env['payment.transaction'].sudo()._get_tx_from_provider_reference('flouci', payment_id)
            if not transaction:
                _logger.warning(f'Transaction not found for Flouci payment_id: {payment_id}')
                return Response(json.dumps({'error': 'Transaction not found'}), status=404, mimetype='application/json')

            # Validate webhook signature
            provider = transaction.provider_id
            if not provider._flouci_validate_webhook_signature(webhook_data, signature):
                _logger.error(f'Invalid Flouci webhook signature for payment_id: {payment_id}')
                return Response(json.dumps({'error': 'Invalid signature'}), status=401, mimetype='application/json')

            # Process webhook (idempotent)
            transaction._process_flouci_webhook(webhook_data)

            return Response(json.dumps({'success': True}), status=200, mimetype='application/json')

        except Exception as e:
            _logger.error(f'Error processing Flouci webhook: {str(e)}', exc_info=True)
            return Response(json.dumps({'error': 'Internal server error'}), status=500, mimetype='application/json')

    @http.route('/api/payment/konnect/webhook', type='http', auth='public', methods=['POST'], csrf=False)
    def konnect_webhook(self):
        """
        Konnect webhook callback endpoint

        Returns:
            HTTP Response: 200 OK or error
        """
        try:
            # Parse webhook payload
            webhook_data = json.loads(request.httprequest.data.decode('utf-8'))
            signature = request.httprequest.headers.get('X-Konnect-Signature', '')

            _logger.info(f'Konnect webhook received: {webhook_data}')

            # Find transaction by provider payment reference
            payment_ref = webhook_data.get('payment', {}).get('paymentRef')
            if not payment_ref:
                raise ValidationError('Missing paymentRef in webhook')

            transaction = request.env['payment.transaction'].sudo()._get_tx_from_provider_reference('konnect', payment_ref)
            if not transaction:
                _logger.warning(f'Transaction not found for Konnect paymentRef: {payment_ref}')
                return Response(json.dumps({'error': 'Transaction not found'}), status=404, mimetype='application/json')

            # Validate webhook signature
            provider = transaction.provider_id
            if not provider._konnect_validate_webhook_signature(webhook_data, signature):
                _logger.error(f'Invalid Konnect webhook signature for paymentRef: {payment_ref}')
                return Response(json.dumps({'error': 'Invalid signature'}), status=401, mimetype='application/json')

            # Process webhook (idempotent)
            transaction._process_konnect_webhook(webhook_data)

            return Response(json.dumps({'success': True}), status=200, mimetype='application/json')

        except Exception as e:
            _logger.error(f'Error processing Konnect webhook: {str(e)}', exc_info=True)
            return Response(json.dumps({'error': 'Internal server error'}), status=500, mimetype='application/json')

    def _check_admin_access(self):
        """Verify user has admin access"""
        if not request.env.user.has_group('base.group_system'):
            raise ValidationError('Admin access required')

    def _get_company_from_tenant(self):
        """Get company from tenant subdomain"""
        # Use existing tenant resolution logic
        tenant_domain = request.httprequest.headers.get('X-Tenant-Domain')
        if tenant_domain:
            tenant = request.env['quelyos.tenant'].sudo().search([('domain', '=', tenant_domain)], limit=1)
            if tenant and tenant.company_id:
                return tenant.company_id

        return request.env.company

    def _error_response(self, message):
        """Standard error response format"""
        return {
            'success': False,
            'error': str(message)
        }
