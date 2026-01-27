# -*- coding: utf-8 -*-
"""
Contrôleur Wishlist pour l'e-commerce
"""
import logging
import secrets
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class QuelyosWishlist(http.Controller):
    """API Wishlist pour frontend e-commerce"""

    def _get_params(self):
        """Extrait les paramètres de la requête JSON-RPC"""
        return request.params if hasattr(request, 'params') and request.params else {}

    def _get_or_create_wishlist(self, partner):
        """Récupère ou crée la wishlist pour un partenaire"""
        Wishlist = request.env['product.wishlist'].sudo()

        # Chercher wishlist existante
        wishlist = Wishlist.search([('partner_id', '=', partner.id)], limit=1)

        if not wishlist:
            # Créer nouvelle wishlist
            wishlist = Wishlist.create({
                'partner_id': partner.id,
            })

        return wishlist

    # ==================== WISHLIST ====================

    @http.route('/api/ecommerce/wishlist', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_wishlist(self, **kwargs):
        """
        Récupérer la wishlist de l'utilisateur

        Returns:
            dict: {
                'success': bool,
                'data': {
                    'wishlist': [
                        {
                            'id': int,
                            'product_id': int,
                            'product_name': str,
                            'product_slug': str,
                            'price': float,
                            'image_url': str,
                            'in_stock': bool,
                            'stock_qty': int,
                            'currency': str,
                            'added_date': str
                        }
                    ],
                    'count': int
                }
            }
        """
        try:
            # Vérifier l'authentification
            if not request.session.uid:
                return {
                    'success': False,
                    'error': 'Authentification requise pour accéder à la wishlist'
                }

            Partner = request.env['res.partner'].sudo()
            partner = Partner.browse(request.session.uid)

            if not partner.exists():
                return {
                    'success': False,
                    'error': 'Utilisateur non trouvé'
                }

            # Récupérer les items de wishlist via product.wishlist
            Wishlist = request.env['product.wishlist'].sudo()
            wishlist_items = Wishlist.search([('partner_id', '=', partner.id)])

            # Prefetch products pour éviter N+1 queries
            wishlist_items.mapped('product_id')

            items = []
            for item in wishlist_items:
                product = item.product_id

                # Récupérer l'image
                image_url = None
                if product.image_1920:
                    image_url = f'/web/image/product.template/{product.id}/image_1920'

                # Générer slug simple (à améliorer si module website_sale installé)
                slug = product.name.lower().replace(' ', '-').replace('/', '-')

                items.append({
                    'id': item.id,
                    'product_id': product.id,
                    'product_name': product.name,
                    'product_slug': slug,
                    'price': product.list_price,
                    'image_url': image_url,
                    'in_stock': product.qty_available > 0 if product.type == 'product' else True,
                    'stock_qty': int(product.qty_available) if product.type == 'product' else 999,
                    'currency': product.currency_id.name or 'EUR',
                    'added_date': item.create_date.isoformat() if item.create_date else None
                })

            return {
                'success': True,
                'data': {
                    'wishlist': items,
                    'count': len(items)
                }
            }

        except Exception as e:
            _logger.error(f"Get wishlist error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/wishlist/add', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def add_to_wishlist(self, **kwargs):
        """
        Ajouter un produit à la wishlist

        Args:
            product_id (int): ID du produit

        Returns:
            dict: {
                'success': bool,
                'message': str,
                'wishlist_count': int
            }
        """
        try:
            params = self._get_params()
            product_id = params.get('product_id')

            if not product_id:
                return {
                    'success': False,
                    'error': 'product_id requis'
                }

            # Vérifier l'authentification
            if not request.session.uid:
                return {
                    'success': False,
                    'error': 'Authentification requise pour ajouter à la wishlist'
                }

            Partner = request.env['res.partner'].sudo()
            partner = Partner.browse(request.session.uid)

            if not partner.exists():
                return {
                    'success': False,
                    'error': 'Utilisateur non trouvé'
                }

            # Vérifier que le produit existe
            Product = request.env['product.template'].sudo()
            product = Product.browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Produit non trouvé'
                }

            # Vérifier si le produit est déjà dans la wishlist
            Wishlist = request.env['product.wishlist'].sudo()
            existing = Wishlist.search([
                ('partner_id', '=', partner.id),
                ('product_id', '=', product_id)
            ], limit=1)

            if existing:
                return {
                    'success': True,
                    'message': f'{product.name} est déjà dans votre liste de souhaits',
                    'wishlist_count': Wishlist.search_count([('partner_id', '=', partner.id)]),
                    'already_in_wishlist': True
                }

            # Ajouter à la wishlist
            Wishlist.create({
                'partner_id': partner.id,
                'product_id': product_id
            })

            wishlist_count = Wishlist.search_count([('partner_id', '=', partner.id)])

            _logger.info(f"Product {product_id} added to wishlist for partner {partner.id}")

            return {
                'success': True,
                'message': f'{product.name} ajouté à votre liste de souhaits',
                'wishlist_count': wishlist_count,
                'already_in_wishlist': False
            }

        except Exception as e:
            _logger.error(f"Add to wishlist error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/wishlist/remove/<int:product_id>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def remove_from_wishlist(self, product_id, **kwargs):
        """
        Retirer un produit de la wishlist

        Args:
            product_id (int): ID du produit à retirer

        Returns:
            dict: {
                'success': bool,
                'message': str,
                'wishlist_count': int
            }
        """
        try:
            # Vérifier l'authentification
            if not request.session.uid:
                return {
                    'success': False,
                    'error': 'Authentification requise'
                }

            Partner = request.env['res.partner'].sudo()
            partner = Partner.browse(request.session.uid)

            if not partner.exists():
                return {
                    'success': False,
                    'error': 'Utilisateur non trouvé'
                }

            # Chercher l'item dans la wishlist
            Wishlist = request.env['product.wishlist'].sudo()
            wishlist_item = Wishlist.search([
                ('partner_id', '=', partner.id),
                ('product_id', '=', product_id)
            ], limit=1)

            if not wishlist_item:
                return {
                    'success': False,
                    'error': 'Produit non trouvé dans la wishlist'
                }

            product_name = wishlist_item.product_id.name
            wishlist_item.unlink()

            wishlist_count = Wishlist.search_count([('partner_id', '=', partner.id)])

            _logger.info(f"Product {product_id} removed from wishlist for partner {partner.id}")

            return {
                'success': True,
                'message': f'{product_name} retiré de votre liste de souhaits',
                'wishlist_count': wishlist_count
            }

        except Exception as e:
            _logger.error(f"Remove from wishlist error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/wishlist/public/<string:token>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_public_wishlist(self, token, **kwargs):
        """
        Récupérer une wishlist publique partageable via token

        Args:
            token (str): Token de partage

        Returns:
            dict: {
                'success': bool,
                'data': {
                    'wishlist': [...],
                    'owner_name': str,
                    'count': int,
                    'share_token': str
                }
            }
        """
        try:
            # Pour l'instant, retourner une wishlist vide
            # TODO: Implémenter le système de partage avec tokens
            # Nécessite d'ajouter un champ 'share_token' au modèle product.wishlist

            _logger.warning(f"Public wishlist sharing not fully implemented - token: {token}")

            return {
                'success': True,
                'data': {
                    'wishlist': [],
                    'owner_name': 'Utilisateur',
                    'count': 0,
                    'share_token': token,
                    'message': 'Partage de wishlist non encore implémenté - Nécessite extension du modèle Odoo'
                }
            }

        except Exception as e:
            _logger.error(f"Get public wishlist error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }
