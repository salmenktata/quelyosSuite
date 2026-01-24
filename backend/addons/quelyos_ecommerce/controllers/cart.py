# -*- coding: utf-8 -*-

from odoo import http
from odoo.http import request
from odoo.addons.quelyos_ecommerce.controllers.base_controller import BaseEcommerceController
from odoo.addons.quelyos_ecommerce.controllers.rate_limiter import rate_limit
import logging

_logger = logging.getLogger(__name__)


class EcommerceCartController(BaseEcommerceController):
    """Controller pour l'API Panier avec sécurité renforcée."""

    def _get_cart(self):
        """Récupère ou crée le panier actif."""
        if request.session.uid:
            # Utilisateur authentifié
            partner = request.env.user.partner_id
            cart = request.env['sale.order'].sudo().get_or_create_cart(
                partner_id=partner.id
            )
        else:
            # Utilisateur invité (session ID)
            session_id = request.session.sid
            cart = request.env['sale.order'].sudo().get_or_create_cart(
                session_id=session_id
            )

        return cart

    @http.route('/api/ecommerce/cart', type='json', auth='public', methods=['GET', 'POST'], csrf=False, cors='*')
    @rate_limit(limit=50, window=60)
    def get_cart(self, **kwargs):
        """
        Récupère le panier actuel.

        Returns:
        {
            "success": true,
            "cart": {
                "id": 123,
                "lines": [...],
                "amount_total": 150.00,
                ...
            }
        }
        """
        try:
            cart = self._get_cart()

            if not cart:
                return self._success_response({
                    'cart': {
                        'id': None,
                        'lines': [],
                        'amount_total': 0,
                        'amount_untaxed': 0,
                        'amount_tax': 0,
                        'line_count': 0,
                        'item_count': 0,
                    }
                })

            return self._success_response({
                'cart': cart.get_cart_data()
            })

        except Exception as e:
            return self._handle_error(e, "récupération du panier")

    @http.route('/api/ecommerce/cart/add', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    @rate_limit(limit=20, window=60)
    def add_to_cart(self, **kwargs):
        """
        Ajoute un produit au panier avec validation stricte.

        Body JSON:
        {
            "product_id": 123,
            "quantity": 2
        }

        Returns:
        {
            "success": true,
            "cart": {...},
            "message": "Produit ajouté au panier"
        }
        """
        try:
            params = request.jsonrequest

            # Validation des paramètres requis
            self._validate_required_params(params, ['product_id'])

            # Validation et normalisation avec InputValidator
            input_validator = request.env['input.validator']
            product_id = input_validator.validate_id(params.get('product_id'), 'product_id')
            quantity = input_validator.validate_quantity(params.get('quantity', 1))

            # Vérifier que le produit existe et est vendable
            product = request.env['product.product'].sudo().browse(product_id)
            if not product.exists():
                return self._handle_error(
                    Exception('Produit non trouvé'),
                    "ajout au panier"
                )

            if not product.sale_ok:
                return self._handle_error(
                    Exception('Ce produit n\'est pas disponible à la vente'),
                    "ajout au panier"
                )

            # Vérifier stock disponible pour produits stockables
            if product.type == 'product':
                if product.qty_available < quantity:
                    return self._handle_error(
                        Exception(f'Stock insuffisant. Disponible: {int(product.qty_available)}'),
                        "ajout au panier"
                    )

            # Récupérer ou créer le panier
            cart = self._get_cart()

            # Ajouter la ligne
            cart_data = cart.add_cart_line(product_id, quantity)

            _logger.info(f"Produit {product_id} ajouté au panier (qty={quantity})")

            return self._success_response(
                data={'cart': cart_data},
                message='Produit ajouté au panier'
            )

        except Exception as e:
            return self._handle_error(e, "ajout au panier")

    @http.route('/api/ecommerce/cart/update/<int:line_id>', type='json', auth='public', methods=['PUT', 'POST'], csrf=False, cors='*')
    @rate_limit(limit=30, window=60)
    def update_cart_line(self, line_id, **kwargs):
        """
        Met à jour la quantité d'une ligne du panier.

        Body JSON:
        {
            "quantity": 3
        }

        Returns:
        {
            "success": true,
            "cart": {...}
        }
        """
        try:
            params = request.jsonrequest

            # Validation des paramètres
            self._validate_required_params(params, ['quantity'])

            # Validation quantité
            input_validator = request.env['input.validator']
            quantity = input_validator.validate_positive_int(params.get('quantity'), 'quantity')

            # Récupérer le panier
            cart = self._get_cart()

            if not cart:
                return self._handle_error(
                    Exception('Panier non trouvé'),
                    "mise à jour du panier"
                )

            # Vérifier que la ligne appartient au panier
            line = cart.order_line.filtered(lambda l: l.id == line_id)
            if not line:
                return self._handle_error(
                    Exception('Ligne non trouvée dans le panier'),
                    "mise à jour du panier"
                )

            # Vérifier stock si augmentation de quantité
            if quantity > line.product_uom_qty:
                if line.product_id.type == 'product':
                    needed = quantity - line.product_uom_qty
                    if line.product_id.qty_available < needed:
                        return self._handle_error(
                            Exception(f'Stock insuffisant. Disponible: {int(line.product_id.qty_available)}'),
                            "mise à jour du panier"
                        )

            # Mettre à jour la quantité
            cart_data = cart.update_cart_line(line_id, quantity)

            message = 'Ligne supprimée' if quantity == 0 else 'Quantité mise à jour'

            _logger.info(f"Ligne {line_id} mise à jour (qty={quantity})")

            return self._success_response(
                data={'cart': cart_data},
                message=message
            )

        except Exception as e:
            return self._handle_error(e, "mise à jour du panier")

    @http.route('/api/ecommerce/cart/remove/<int:line_id>', type='json', auth='public', methods=['DELETE', 'POST'], csrf=False, cors='*')
    @rate_limit(limit=30, window=60)
    def remove_cart_line(self, line_id, **kwargs):
        """
        Supprime une ligne du panier.

        Returns:
        {
            "success": true,
            "cart": {...},
            "message": "Ligne supprimée"
        }
        """
        try:
            cart = self._get_cart()

            if not cart:
                return self._handle_error(
                    Exception('Panier non trouvé'),
                    "suppression de ligne"
                )

            # Supprimer la ligne
            cart_data = cart.remove_cart_line(line_id)

            _logger.info(f"Ligne {line_id} supprimée du panier")

            return self._success_response(
                data={'cart': cart_data},
                message='Produit retiré du panier'
            )

        except Exception as e:
            return self._handle_error(e, "suppression de ligne")

    @http.route('/api/ecommerce/cart/clear', type='json', auth='public', methods=['DELETE', 'POST'], csrf=False, cors='*')
    @rate_limit(limit=10, window=60)
    def clear_cart(self, **kwargs):
        """
        Vide complètement le panier.

        Returns:
        {
            "success": true,
            "message": "Panier vidé"
        }
        """
        try:
            cart = self._get_cart()

            if cart:
                cart.clear_cart()
                _logger.info(f"Panier {cart.id} vidé")

            return self._success_response(
                data={
                    'cart': {
                        'id': None,
                        'lines': [],
                        'amount_total': 0,
                        'line_count': 0,
                        'item_count': 0,
                    }
                },
                message='Panier vidé'
            )

        except Exception as e:
            return self._handle_error(e, "vidage du panier")

    @http.route('/api/ecommerce/cart/count', type='json', auth='public', methods=['GET', 'POST'], csrf=False, cors='*')
    @rate_limit(limit=100, window=60)  # Endpoint très fréquemment appelé
    def get_cart_count(self, **kwargs):
        """
        Retourne le nombre d'articles dans le panier (rapide).

        Returns:
        {
            "success": true,
            "count": 5
        }
        """
        try:
            cart = self._get_cart()

            if not cart:
                return self._success_response({'count': 0})

            count = sum(line.product_uom_qty for line in cart.order_line)

            return self._success_response({'count': int(count)})

        except Exception as e:
            return self._handle_error(e, "comptage du panier")

    @http.route('/api/ecommerce/cart/recover/<string:token>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    @rate_limit(limit=10, window=60)
    def recover_cart(self, token, **kwargs):
        """
        Recover abandoned cart from recovery token

        Args:
            token: Recovery token from email link

        Returns:
            dict: Cart data or error
        """
        try:
            # Find abandoned cart by token
            abandoned_cart = request.env['abandoned.cart'].sudo().search([
                ('recovery_token', '=', token),
                ('state', 'in', ['pending', 'email_sent', 'reminded']),
            ], limit=1)

            if not abandoned_cart:
                return self._error_response("Invalid or expired recovery link", 404)

            # Get or create cart for current session
            cart = self._get_cart()

            # Parse cart data
            import json
            cart_data = json.loads(abandoned_cart.cart_data)

            # Add products back to cart
            products_added = 0
            for product_data in cart_data.get('products', []):
                product_id = product_data.get('id')
                quantity = product_data.get('quantity', 1)

                # Find product
                product = request.env['product.template'].sudo().browse(product_id)

                if product.exists() and product.sale_ok and product.active:
                    # Add to cart
                    cart_line = cart.order_line.filtered(lambda l: l.product_id.product_tmpl_id.id == product_id)

                    if cart_line:
                        # Update quantity if already in cart
                        cart_line[0].product_uom_qty += quantity
                    else:
                        # Add new line
                        request.env['sale.order.line'].sudo().create({
                            'order_id': cart.id,
                            'product_id': product.product_variant_id.id,
                            'product_uom_qty': quantity,
                            'price_unit': product.list_price,
                        })

                    products_added += 1

            # Apply coupon if available
            coupon_applied = False
            if abandoned_cart.coupon_code and abandoned_cart.coupon_id:
                try:
                    # Apply coupon to cart
                    cart.apply_coupon_code(abandoned_cart.coupon_code)
                    coupon_applied = True
                except Exception as e:
                    _logger.warning(f"Could not apply recovery coupon: {str(e)}")

            # Mark cart as recovered (will be fully marked when order is confirmed)
            # For now, just update the tracking
            abandoned_cart.write({
                'email_opened_date': request.env['ir.fields'].sudo().browse([]).now(),
            })

            _logger.info(f"Cart recovered: {abandoned_cart.id}, {products_added} products added")

            return self._success_response({
                'cart': cart.get_api_data(),
                'products_restored': products_added,
                'coupon_applied': coupon_applied,
                'coupon_code': abandoned_cart.coupon_code if coupon_applied else None,
                'message': f'{products_added} produit(s) restauré(s) dans votre panier',
            })

        except Exception as e:
            return self._handle_error(e, "récupération du panier")
