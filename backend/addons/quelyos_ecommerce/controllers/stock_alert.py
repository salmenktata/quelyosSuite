# -*- coding: utf-8 -*-
"""
Stock Alert Controller
Handles stock alert subscriptions
"""

import logging
from odoo import http
from odoo.http import request
from .base_controller import BaseEcommerceController

_logger = logging.getLogger(__name__)


class StockAlertController(BaseEcommerceController):
    """Controller for stock alert subscriptions"""

    @http.route('/api/ecommerce/products/<int:product_id>/notify-restock', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def subscribe_stock_alert(self, product_id, email=None, **kwargs):
        """
        Subscribe to stock alert for a product

        Args:
            product_id: Product template ID
            email: Email address (optional if authenticated)

        Returns:
            dict: Success response
        """
        try:
            # Get user (optional)
            user = self._authenticate_user(raise_exception=False)

            # Determine partner and email
            partner_id = None
            notification_email = email

            if user:
                partner_id = user.partner_id.id
                if not notification_email:
                    notification_email = user.partner_id.email

            # Validate email
            if not notification_email:
                return self._error_response("Email is required", 400)

            input_validator = request.env['input.validator']
            notification_email = input_validator.validate_email(notification_email)

            # Check if product exists
            product = request.env['product.template'].sudo().browse(product_id)
            if not product.exists():
                return self._error_response("Product not found", 404)

            # Check if product is already in stock
            if hasattr(product, 'qty_available') and product.qty_available > 0:
                return self._error_response("Product is already in stock", 400)

            # Create partner if not authenticated
            if not partner_id:
                # Find or create guest partner with this email
                partner = request.env['res.partner'].sudo().search([
                    ('email', '=', notification_email),
                    ('is_company', '=', False)
                ], limit=1)

                if not partner:
                    partner = request.env['res.partner'].sudo().create({
                        'name': notification_email,
                        'email': notification_email,
                        'type': 'contact',
                    })

                partner_id = partner.id

            # Check if subscription already exists
            existing = request.env['stock.alert.subscription'].sudo().search([
                ('partner_id', '=', partner_id),
                ('product_id', '=', product_id),
                ('active', '=', True),
                ('email_sent', '=', False),
            ], limit=1)

            if existing:
                return self._success_response({
                    'message': 'Vous êtes déjà abonné aux alertes pour ce produit',
                    'subscription_id': existing.id,
                    'already_subscribed': True,
                })

            # Create subscription
            subscription = request.env['stock.alert.subscription'].sudo().create({
                'partner_id': partner_id,
                'product_id': product_id,
                'email': notification_email,
                'active': True,
                'email_sent': False,
            })

            _logger.info(f"Stock alert subscription created: {subscription.id} for product {product_id}")

            return self._success_response({
                'message': 'Vous serez notifié par email dès que le produit sera disponible',
                'subscription_id': subscription.id,
                'product_name': product.name,
                'email': notification_email,
            })

        except Exception as e:
            _logger.error(f"Error creating stock alert subscription: {str(e)}")
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/products/<int:product_id>/stock-alert-status', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_stock_alert_status(self, product_id, **kwargs):
        """
        Check if user is subscribed to stock alerts for a product

        Args:
            product_id: Product template ID

        Returns:
            dict: Subscription status
        """
        try:
            user = self._authenticate_user(raise_exception=False)

            if not user:
                return self._success_response({
                    'subscribed': False,
                    'can_subscribe': True,
                })

            # Check for active subscription
            subscription = request.env['stock.alert.subscription'].sudo().search([
                ('partner_id', '=', user.partner_id.id),
                ('product_id', '=', product_id),
                ('active', '=', True),
                ('email_sent', '=', False),
            ], limit=1)

            return self._success_response({
                'subscribed': bool(subscription),
                'subscription_id': subscription.id if subscription else None,
                'can_subscribe': not bool(subscription),
            })

        except Exception as e:
            _logger.error(f"Error checking stock alert status: {str(e)}")
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/stock-alerts/unsubscribe/<int:subscription_id>', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def unsubscribe_stock_alert(self, subscription_id, **kwargs):
        """
        Unsubscribe from stock alert

        Args:
            subscription_id: Subscription ID

        Returns:
            dict: Success response
        """
        try:
            user = self._authenticate_user()
            if not user:
                return self._error_response("Authentication required", 401)

            # Find subscription
            subscription = request.env['stock.alert.subscription'].sudo().search([
                ('id', '=', subscription_id),
                ('partner_id', '=', user.partner_id.id),
            ], limit=1)

            if not subscription:
                return self._error_response("Subscription not found", 404)

            # Deactivate subscription
            subscription.write({'active': False})

            _logger.info(f"Stock alert subscription {subscription_id} unsubscribed")

            return self._success_response({
                'message': 'Vous avez été désinscrit des alertes pour ce produit',
            })

        except Exception as e:
            _logger.error(f"Error unsubscribing from stock alert: {str(e)}")
            return self._error_response(str(e), 500)
