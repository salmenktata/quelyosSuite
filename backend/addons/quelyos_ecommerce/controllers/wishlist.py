# -*- coding: utf-8 -*-

from odoo import http
from odoo.http import request


class WishlistController(http.Controller):

    @http.route('/api/ecommerce/wishlist', type='json', auth='user', methods=['GET'], csrf=False)
    def get_wishlist(self, **kwargs):
        """
        Get current user's wishlist
        
        Returns:
            {
                'success': bool,
                'items': [product_ids],
                'details': [{product details}]
            }
        """
        try:
            partner = request.env.user.partner_id
            if not partner:
                return {
                    'success': False,
                    'error': 'User not authenticated'
                }

            wishlist_data = partner.sudo().get_wishlist()

            return {
                'success': True,
                **wishlist_data
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/wishlist/add', type='json', auth='user', methods=['POST'], csrf=False)
    def add_to_wishlist(self, product_id, **kwargs):
        """
        Add product to wishlist
        
        Args:
            product_id: Product template ID
        
        Returns:
            {'success': bool, 'message': str}
        """
        try:
            partner = request.env.user.partner_id
            if not partner:
                return {
                    'success': False,
                    'error': 'User not authenticated'
                }

            result = partner.sudo().add_to_wishlist(product_id)
            return result

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/wishlist/remove/<int:product_id>', type='json', auth='user', methods=['DELETE'], csrf=False)
    def remove_from_wishlist(self, product_id, **kwargs):
        """
        Remove product from wishlist
        
        Args:
            product_id: Product template ID
        
        Returns:
            {'success': bool, 'message': str}
        """
        try:
            partner = request.env.user.partner_id
            if not partner:
                return {
                    'success': False,
                    'error': 'User not authenticated'
                }

            result = partner.sudo().remove_from_wishlist(product_id)
            return result

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/wishlist/clear', type='json', auth='user', methods=['POST'], csrf=False)
    def clear_wishlist(self, **kwargs):
        """
        Clear all items from wishlist
        
        Returns:
            {'success': bool, 'message': str}
        """
        try:
            partner = request.env.user.partner_id
            if not partner:
                return {
                    'success': False,
                    'error': 'User not authenticated'
                }

            # Delete all wishlist items for this partner
            partner.sudo().wishlist_ids.unlink()

            return {
                'success': True,
                'message': 'Wishlist cleared successfully'
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
