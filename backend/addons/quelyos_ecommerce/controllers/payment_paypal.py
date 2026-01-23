# -*- coding: utf-8 -*-
"""
PayPal Payment Integration for E-commerce
Uses PayPal Orders API v2
"""

import logging
import json
import requests
from odoo import http
from odoo.http import request
from .base_controller import BaseEcommerceController

_logger = logging.getLogger(__name__)


class PayPalPaymentController(BaseEcommerceController):
    """Controller for PayPal payment processing"""

    def _get_paypal_credentials(self):
        """
        Get PayPal credentials from config

        Returns:
            dict: client_id, client_secret, mode
        """
        config = request.env['ir.config_parameter'].sudo()
        return {
            'client_id': config.get_param('quelyos_ecommerce.paypal_client_id'),
            'client_secret': config.get_param('quelyos_ecommerce.paypal_client_secret'),
            'mode': config.get_param('quelyos_ecommerce.paypal_mode', 'sandbox'),  # sandbox or live
        }

    def _get_paypal_base_url(self, mode='sandbox'):
        """Get PayPal API base URL"""
        if mode == 'live':
            return 'https://api-m.paypal.com'
        return 'https://api-m.sandbox.paypal.com'

    def _get_paypal_access_token(self):
        """
        Get PayPal OAuth2 access token

        Returns:
            str: Access token or None
        """
        try:
            credentials = self._get_paypal_credentials()
            base_url = self._get_paypal_base_url(credentials['mode'])

            response = requests.post(
                f"{base_url}/v1/oauth2/token",
                auth=(credentials['client_id'], credentials['client_secret']),
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                data={'grant_type': 'client_credentials'}
            )

            if response.status_code == 200:
                return response.json().get('access_token')

            _logger.error(f"PayPal auth failed: {response.text}")
            return None

        except Exception as e:
            _logger.error(f"Error getting PayPal access token: {str(e)}")
            return None

    @http.route('/api/ecommerce/payment/paypal/create-order', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def create_paypal_order(self, order_id=None):
        """
        Create a PayPal order

        Args:
            order_id: Odoo sale.order ID

        Returns:
            dict: PayPal order details with approval URL
        """
        try:
            # Authenticate user
            user = self._authenticate_user()

            # Get sale order
            order = request.env['sale.order'].sudo().browse(order_id)

            if not order.exists():
                return self._error_response("Order not found", 404)

            # Verify partner ownership
            if user and order.partner_id.id != user.partner_id.id:
                return self._error_response("Unauthorized", 403)

            # Get PayPal access token
            access_token = self._get_paypal_access_token()
            if not access_token:
                return self._error_response("PayPal authentication failed", 500)

            # Prepare order items
            items = []
            for line in order.order_line:
                items.append({
                    'name': line.product_id.name[:127],  # PayPal max 127 chars
                    'description': (line.product_id.description_sale or '')[:127],
                    'unit_amount': {
                        'currency_code': order.currency_id.name,
                        'value': f"{line.price_unit:.2f}"
                    },
                    'quantity': str(int(line.product_uom_qty)),
                })

            # Prepare PayPal order payload
            credentials = self._get_paypal_credentials()
            base_url = self._get_paypal_base_url(credentials['mode'])

            # Get frontend URL for return/cancel
            frontend_url = request.env['ir.config_parameter'].sudo().get_param(
                'quelyos_ecommerce.frontend_url',
                'http://localhost:3000'
            )

            payload = {
                'intent': 'CAPTURE',
                'purchase_units': [{
                    'reference_id': order.name,
                    'amount': {
                        'currency_code': order.currency_id.name,
                        'value': f"{order.amount_total:.2f}",
                        'breakdown': {
                            'item_total': {
                                'currency_code': order.currency_id.name,
                                'value': f"{order.amount_untaxed:.2f}"
                            },
                            'tax_total': {
                                'currency_code': order.currency_id.name,
                                'value': f"{order.amount_tax:.2f}"
                            }
                        }
                    },
                    'items': items,
                    'description': f"Order {order.name}",
                }],
                'application_context': {
                    'brand_name': 'Quelyos',
                    'landing_page': 'BILLING',
                    'shipping_preference': 'NO_SHIPPING',  # We manage shipping ourselves
                    'user_action': 'PAY_NOW',
                    'return_url': f"{frontend_url}/checkout/success?paypal=true",
                    'cancel_url': f"{frontend_url}/checkout/payment?paypal=cancelled",
                }
            }

            # Create PayPal order
            response = requests.post(
                f"{base_url}/v2/checkout/orders",
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {access_token}',
                },
                json=payload
            )

            if response.status_code != 201:
                _logger.error(f"PayPal order creation failed: {response.text}")
                return self._error_response("PayPal order creation failed", 500)

            paypal_order = response.json()

            # Store PayPal order ID in sale order
            order.sudo().write({
                'client_order_ref': f"PayPal:{paypal_order['id']}"
            })

            # Get approval URL
            approval_url = None
            for link in paypal_order.get('links', []):
                if link['rel'] == 'approve':
                    approval_url = link['href']
                    break

            return self._success_response({
                'paypal_order_id': paypal_order['id'],
                'approval_url': approval_url,
                'status': paypal_order['status'],
            })

        except Exception as e:
            _logger.error(f"Error creating PayPal order: {str(e)}")
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/payment/paypal/capture-order', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def capture_paypal_order(self, paypal_order_id=None, order_id=None):
        """
        Capture a PayPal order after customer approval

        Args:
            paypal_order_id: PayPal order ID
            order_id: Odoo sale.order ID

        Returns:
            dict: Capture status and details
        """
        try:
            # Authenticate user
            user = self._authenticate_user()

            # Get sale order
            order = request.env['sale.order'].sudo().browse(order_id)

            if not order.exists():
                return self._error_response("Order not found", 404)

            # Verify partner ownership
            if user and order.partner_id.id != user.partner_id.id:
                return self._error_response("Unauthorized", 403)

            # Verify PayPal order ID matches
            if not order.client_order_ref or f"PayPal:{paypal_order_id}" not in order.client_order_ref:
                return self._error_response("PayPal order ID mismatch", 400)

            # Get PayPal access token
            access_token = self._get_paypal_access_token()
            if not access_token:
                return self._error_response("PayPal authentication failed", 500)

            # Capture the order
            credentials = self._get_paypal_credentials()
            base_url = self._get_paypal_base_url(credentials['mode'])

            response = requests.post(
                f"{base_url}/v2/checkout/orders/{paypal_order_id}/capture",
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {access_token}',
                }
            )

            if response.status_code not in [200, 201]:
                _logger.error(f"PayPal capture failed: {response.text}")
                return self._error_response("PayPal capture failed", 500)

            capture_data = response.json()

            # Check capture status
            if capture_data['status'] == 'COMPLETED':
                # Get capture details
                purchase_unit = capture_data.get('purchase_units', [{}])[0]
                capture = purchase_unit.get('payments', {}).get('captures', [{}])[0]

                # Confirm sale order
                if order.state == 'draft':
                    order.sudo().action_confirm()

                # Create payment transaction
                payment_vals = {
                    'payment_type': 'inbound',
                    'partner_type': 'customer',
                    'partner_id': order.partner_id.id,
                    'amount': float(capture['amount']['value']),
                    'currency_id': request.env['res.currency'].sudo().search([
                        ('name', '=', capture['amount']['currency_code'])
                    ], limit=1).id,
                    'payment_method_id': request.env['account.payment.method'].sudo().search([
                        ('code', '=', 'manual'),
                        ('payment_type', '=', 'inbound')
                    ], limit=1).id,
                    'ref': f"PayPal {capture['id']} - Order {order.name}",
                    'journal_id': request.env['account.journal'].sudo().search([
                        ('type', '=', 'bank')
                    ], limit=1).id,
                }

                payment = request.env['account.payment'].sudo().create(payment_vals)
                payment.action_post()

                # Link payment to invoice if exists
                if order.invoice_ids:
                    invoice = order.invoice_ids[0]
                    (payment.line_ids + invoice.line_ids).filtered(
                        lambda l: l.account_id == payment.destination_account_id
                    ).reconcile()

                # Log payment in order
                order.message_post(
                    body=f"PayPal payment captured: {capture['id']}<br/>Amount: {capture['amount']['value']} {capture['amount']['currency_code']}",
                    subject="PayPal Payment Received"
                )

                return self._success_response({
                    'status': 'completed',
                    'transaction_id': capture['id'],
                    'amount': float(capture['amount']['value']),
                    'currency': capture['amount']['currency_code'],
                    'order': {
                        'id': order.id,
                        'name': order.name,
                        'state': order.state,
                    }
                })

            else:
                return self._error_response(f"Payment not completed: {capture_data['status']}", 400)

        except Exception as e:
            _logger.error(f"Error capturing PayPal order: {str(e)}")
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/payment/paypal/webhook', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def paypal_webhook(self):
        """
        Webhook endpoint for PayPal IPN (Instant Payment Notifications)

        This handles async notifications from PayPal about payment status changes
        """
        try:
            payload = request.jsonrequest

            # Verify webhook signature
            # TODO: Implement webhook signature verification
            # https://developer.paypal.com/api/rest/webhooks/rest/

            event_type = payload.get('event_type')
            resource = payload.get('resource', {})

            _logger.info(f"PayPal webhook received: {event_type}")

            if event_type == 'CHECKOUT.ORDER.APPROVED':
                # Order approved by customer
                paypal_order_id = resource.get('id')
                _logger.info(f"PayPal order approved: {paypal_order_id}")

            elif event_type == 'PAYMENT.CAPTURE.COMPLETED':
                # Payment captured successfully
                capture_id = resource.get('id')
                _logger.info(f"PayPal payment captured: {capture_id}")

            elif event_type == 'PAYMENT.CAPTURE.REFUNDED':
                # Payment refunded
                refund_id = resource.get('id')
                _logger.info(f"PayPal payment refunded: {refund_id}")

            return {'status': 'success'}

        except Exception as e:
            _logger.error(f"Error processing PayPal webhook: {str(e)}")
            return {'status': 'error', 'message': str(e)}
