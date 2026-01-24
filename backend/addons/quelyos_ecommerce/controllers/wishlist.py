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

    @http.route('/api/ecommerce/wishlist/share', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def share_wishlist(self, **kwargs):
        """
        Generate a sharing token for the wishlist

        Returns:
            {
                'success': bool,
                'token': str,
                'url': str,
                'message': str
            }
        """
        try:
            partner = request.env.user.partner_id
            if not partner:
                return {
                    'success': False,
                    'error': 'User not authenticated'
                }

            # Check if wishlist has items
            if not partner.wishlist_ids:
                return {
                    'success': False,
                    'error': 'Wishlist is empty. Add items before sharing.'
                }

            # Generate or get existing token
            token = partner.generate_wishlist_share_token()

            # Generate public URL
            base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url')
            frontend_url = base_url.replace(':8069', ':3000')  # Adjust for Next.js port
            share_url = f"{frontend_url}/wishlist/{token}"

            return {
                'success': True,
                'token': token,
                'url': share_url,
                'message': 'Wishlist share link generated successfully'
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/wishlist/public/<string:token>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_public_wishlist(self, token, **kwargs):
        """
        Get public wishlist by share token

        Args:
            token: Wishlist share token

        Returns:
            {
                'success': bool,
                'wishlist': {
                    'owner_name': str,
                    'items': [product_details],
                    'total_items': int
                }
            }
        """
        try:
            # Find partner by token
            partner = request.env['res.partner'].sudo().search([
                ('wishlist_share_token', '=', token)
            ], limit=1)

            if not partner:
                return {
                    'success': False,
                    'error': 'Invalid or expired wishlist share link'
                }

            # Check if wishlist has items
            if not partner.wishlist_ids:
                return {
                    'success': False,
                    'error': 'This wishlist is empty'
                }

            # Get wishlist items with full product details
            items = []
            for wishlist_item in partner.wishlist_ids:
                product = wishlist_item.product_id
                if product.exists() and product.active and product.sale_ok:
                    items.append({
                        'id': product.id,
                        'name': product.name,
                        'slug': product.slug if hasattr(product, 'slug') else product.name.lower().replace(' ', '-'),
                        'description': product.description_sale or '',
                        'price': product.list_price,
                        'image_url': f'/web/image/product.template/{product.id}/image_512' if product.image_1920 else None,
                        'stock_available': product.qty_available > 0 if hasattr(product, 'qty_available') else True,
                        'added_date': wishlist_item.create_date.strftime('%Y-%m-%d') if wishlist_item.create_date else None,
                    })

            return {
                'success': True,
                'wishlist': {
                    'owner_name': partner.name,
                    'items': items,
                    'total_items': len(items)
                }
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
