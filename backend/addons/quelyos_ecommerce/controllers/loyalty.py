# -*- coding: utf-8 -*-
"""
Loyalty Program Controller for E-commerce
Manages customer loyalty points and rewards
"""

import logging
from odoo import http
from odoo.http import request
from .base_controller import BaseEcommerceController

_logger = logging.getLogger(__name__)


class LoyaltyController(BaseEcommerceController):
    """Controller for loyalty program"""

    @http.route('/api/ecommerce/loyalty/balance', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def get_balance(self):
        """
        Get loyalty points balance and transaction history

        Returns:
            dict: Points balance, tier, and recent transactions
        """
        try:
            user = self._authenticate_user()
            if not user:
                return self._error_response("Authentication required", 401)

            # Get or create loyalty points record
            points_record = user.partner_id.get_or_create_loyalty_points()

            # Get recent transactions
            transactions = []
            for txn in points_record.transaction_ids[:20]:  # Last 20 transactions
                transactions.append({
                    'id': txn.id,
                    'points': txn.points,
                    'description': txn.description,
                    'type': txn.transaction_type,
                    'date': txn.create_date.strftime('%Y-%m-%d %H:%M:%S') if txn.create_date else None,
                    'order_id': txn.order_id.id if txn.order_id else None,
                    'order_name': txn.order_id.name if txn.order_id else None,
                })

            # Get tier information
            tier_info = None
            if points_record.current_tier_id:
                tier = points_record.current_tier_id
                tier_info = {
                    'id': tier.id,
                    'name': tier.name,
                    'discount_percentage': tier.discount_percentage,
                    'color': tier.color,
                    'points_threshold': tier.points_threshold,
                }

            # Get next tier information
            next_tier_info = None
            if points_record.current_tier_id:
                next_tier = request.env['loyalty.tier'].search([
                    ('points_threshold', '>', points_record.current_tier_id.points_threshold)
                ], order='points_threshold asc', limit=1)

                if next_tier:
                    points_needed = next_tier.points_threshold - points_record.lifetime_points
                    next_tier_info = {
                        'id': next_tier.id,
                        'name': next_tier.name,
                        'points_threshold': next_tier.points_threshold,
                        'points_needed': points_needed,
                    }

            # Get program info
            program = request.env['loyalty.program'].search([('active', '=', True)], limit=1)
            program_info = None
            if program:
                program_info = {
                    'points_per_euro': program.points_per_euro,
                    'points_to_euro_rate': program.points_to_euro_rate,
                    'min_order_amount': program.min_order_amount,
                }

            return self._success_response({
                'balance': points_record.points_balance,
                'lifetime_points': points_record.lifetime_points,
                'tier': tier_info,
                'next_tier': next_tier_info,
                'transactions': transactions,
                'program': program_info,
            })

        except Exception as e:
            _logger.error(f"Error getting loyalty balance: {str(e)}")
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/loyalty/redeem', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def redeem_points(self, points, order_id=None):
        """
        Redeem loyalty points for discount on current order

        Args:
            points: Number of points to redeem
            order_id: Optional order ID to apply discount to

        Returns:
            dict: Redemption result with discount amount
        """
        try:
            user = self._authenticate_user()
            if not user:
                return self._error_response("Authentication required", 401)

            # Validate points
            points = int(points)
            if points <= 0:
                return self._error_response("Points must be positive", 400)

            # Get loyalty points record
            points_record = user.partner_id.loyalty_points_id
            if not points_record:
                return self._error_response("No loyalty points account found", 404)

            # Check balance
            if points_record.points_balance < points:
                return self._error_response(
                    f"Insufficient points. Balance: {points_record.points_balance}, Required: {points}",
                    400
                )

            # Get program
            program = request.env['loyalty.program'].search([('active', '=', True)], limit=1)
            if not program:
                return self._error_response("No active loyalty program", 404)

            # Calculate discount
            discount_amount = program.get_discount_for_points(points)

            # If order_id provided, apply to that order
            if order_id:
                order = request.env['sale.order'].browse(order_id)

                # Verify order ownership
                if order.partner_id.id != user.partner_id.id:
                    return self._error_response("Unauthorized", 403)

                # Apply discount to order
                try:
                    order.apply_loyalty_discount(points)
                except ValueError as e:
                    return self._error_response(str(e), 400)

            return self._success_response({
                'success': True,
                'points_redeemed': points,
                'discount_amount': discount_amount,
                'new_balance': points_record.points_balance,
                'message': f'{points} points échangés contre {discount_amount:.2f}€ de réduction',
            })

        except ValueError as e:
            return self._error_response(str(e), 400)
        except Exception as e:
            _logger.error(f"Error redeeming points: {str(e)}")
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/loyalty/calculate-points', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def calculate_points(self, amount):
        """
        Calculate how many points would be earned for given amount

        Args:
            amount: Order amount

        Returns:
            dict: Points that would be earned
        """
        try:
            amount = float(amount)

            program = request.env['loyalty.program'].sudo().search([('active', '=', True)], limit=1)
            if not program:
                return self._success_response({'points': 0, 'program_active': False})

            points = program.get_points_for_amount(amount)

            return self._success_response({
                'points': points,
                'program_active': True,
                'points_per_euro': program.points_per_euro,
                'min_order_amount': program.min_order_amount,
            })

        except Exception as e:
            _logger.error(f"Error calculating points: {str(e)}")
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/loyalty/tiers', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_tiers(self):
        """
        Get all loyalty program tiers

        Returns:
            dict: List of all tiers
        """
        try:
            tiers = request.env['loyalty.tier'].sudo().search([], order='points_threshold')

            tiers_data = []
            for tier in tiers:
                tiers_data.append({
                    'id': tier.id,
                    'name': tier.name,
                    'points_threshold': tier.points_threshold,
                    'discount_percentage': tier.discount_percentage,
                    'color': tier.color,
                })

            return self._success_response({
                'tiers': tiers_data,
                'total': len(tiers_data),
            })

        except Exception as e:
            _logger.error(f"Error getting tiers: {str(e)}")
            return self._error_response(str(e), 500)
