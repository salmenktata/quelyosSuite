# -*- coding: utf-8 -*-

from odoo import http
from odoo.http import request
from odoo.addons.quelyos_ecommerce.controllers.base_controller import BaseEcommerceController
from odoo.addons.quelyos_ecommerce.controllers.rate_limiter import rate_limit
import logging

_logger = logging.getLogger(__name__)


class EcommerceCheckoutController(BaseEcommerceController):
    """Controller pour le processus de checkout avec sécurité renforcée."""

    def _get_cart(self):
        """Récupère le panier actif."""
        if request.session.uid:
            partner = request.env.user.partner_id
            cart = request.env['sale.order'].sudo().get_or_create_cart(partner_id=partner.id)
        else:
            session_id = request.session.sid
            cart = request.env['sale.order'].sudo().get_or_create_cart(session_id=session_id)
        return cart

    @http.route('/api/ecommerce/checkout/validate', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    @rate_limit(limit=30, window=60)
    def validate_cart(self, **kwargs):
        """
        Valide que le panier peut être converti en commande.
        Vérifie stock, montant minimum, etc.

        Returns:
        {
            "valid": true/false,
            "errors": [],
            "cart": {...}
        }
        """
        try:
            cart = self._get_cart()

            if not cart or not cart.order_line:
                return self._success_response({
                    'valid': False,
                    'errors': ['Panier vide'],
                })

            validation_result = cart.validate_cart()

            return self._success_response(validation_result)

        except Exception as e:
            return self._handle_error(e, "validation du panier")

    @http.route('/api/ecommerce/checkout/shipping', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    @rate_limit(limit=20, window=60)
    def calculate_shipping(self, **kwargs):
        """
        Calcule les frais de livraison.

        Body JSON:
        {
            "delivery_method_id": 1,
            "address": {
                "street": "...",
                "city": "...",
                "zip": "...",
                "country_id": 75
            }
        }

        Returns:
        {
            "success": true,
            "shipping_cost": 10.00,
            "delivery_method": {...}
        }
        """
        try:
            params = request.jsonrequest
            cart = self._get_cart()

            if not cart:
                return self._handle_error(
                    Exception('Panier non trouvé'),
                    "calcul de livraison"
                )

            # Validation delivery_method_id
            self._validate_required_params(params, ['delivery_method_id'])

            input_validator = request.env['input.validator']
            delivery_method_id = input_validator.validate_id(
                params.get('delivery_method_id'),
                'delivery_method_id'
            )

            # Récupérer la méthode de livraison
            delivery_method = request.env['delivery.carrier'].sudo().browse(delivery_method_id)

            if not delivery_method.exists():
                return self._handle_error(
                    Exception('Méthode de livraison non trouvée'),
                    "calcul de livraison"
                )

            # Valider et mettre à jour l'adresse si fournie
            address_data = params.get('address')
            if address_data:
                partner = cart.partner_id
                if partner:
                    # Valider les données d'adresse avec PartnerValidator
                    partner_validator = request.env['partner.validator']
                    validated_address = partner_validator.validate_update_data(address_data, partner.id)
                    partner.sudo().write(validated_address)

            # Calculer les frais
            shipping_cost = delivery_method.get_shipping_price_from_so(cart)[0]

            _logger.info(f"Frais de livraison calculés: {shipping_cost} pour commande {cart.id}")

            return self._success_response({
                'shipping_cost': shipping_cost,
                'delivery_method': {
                    'id': delivery_method.id,
                    'name': delivery_method.name,
                    'description': delivery_method.delivery_description or '',
                },
            })

        except Exception as e:
            return self._handle_error(e, "calcul de livraison")

    @http.route('/api/ecommerce/checkout/confirm', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    @rate_limit(limit=5, window=300)  # 5 confirmations max par 5 minutes (protection spam)
    def confirm_order(self, **kwargs):
        """
        Confirme la commande et lance le processus de paiement avec validation sécurisée.

        Body JSON:
        {
            "delivery_method_id": 1,
            "payment_method_id": 1,
            "billing_address": {...},
            "shipping_address": {...},
            "notes": "..."
        }

        Returns:
        {
            "success": true,
            "order": {...},
            "payment_url": "https://..."  # Si paiement en ligne
        }
        """
        try:
            params = request.jsonrequest
            cart = self._get_cart()

            if not cart or not cart.order_line:
                return self._handle_error(
                    Exception('Panier non trouvé ou vide'),
                    "confirmation de commande"
                )

            # Valider le panier
            validation = cart.validate_cart()
            if not validation['valid']:
                return self._handle_error(
                    Exception(f"Panier invalide: {', '.join(validation['errors'])}"),
                    "confirmation de commande"
                )

            partner = request.env.user.partner_id
            partner_validator = request.env['partner.validator']
            input_validator = request.env['input.validator']

            # SÉCURITÉ: Valider et créer adresse de facturation avec whitelist
            billing_address = params.get('billing_address')
            if billing_address:
                # Validation stricte avec PartnerValidator
                validated_billing = partner_validator.validate_address_data(billing_address)
                validated_billing['parent_id'] = partner.id
                validated_billing['type'] = 'invoice'

                billing_partner = request.env['res.partner'].sudo().create(validated_billing)
                cart.partner_invoice_id = billing_partner
                _logger.info(f"Adresse de facturation créée: {billing_partner.id}")

            # SÉCURITÉ: Valider et créer adresse de livraison avec whitelist
            shipping_address = params.get('shipping_address')
            if shipping_address:
                # Validation stricte avec PartnerValidator
                validated_shipping = partner_validator.validate_address_data(shipping_address)
                validated_shipping['parent_id'] = partner.id
                validated_shipping['type'] = 'delivery'

                shipping_partner = request.env['res.partner'].sudo().create(validated_shipping)
                cart.partner_shipping_id = shipping_partner
                _logger.info(f"Adresse de livraison créée: {shipping_partner.id}")

            # Méthode de livraison
            delivery_method_id = params.get('delivery_method_id')
            if delivery_method_id:
                delivery_method_id = input_validator.validate_id(delivery_method_id, 'delivery_method_id')
                delivery_carrier = request.env['delivery.carrier'].sudo().browse(delivery_method_id)

                if delivery_carrier.exists():
                    shipping_cost = delivery_carrier.get_shipping_price_from_so(cart)[0]
                    cart.set_delivery_line(delivery_carrier, shipping_cost)
                    _logger.info(f"Méthode de livraison appliquée: {delivery_carrier.name}")

            # Notes (sanitize)
            notes = params.get('notes')
            if notes:
                notes_str = input_validator.validate_string(notes, field_name='notes', max_length=500)
                cart.frontend_notes = notes_str

            # Confirmer la commande
            cart.action_confirm()
            _logger.info(f"Commande confirmée: {cart.name} (id={cart.id})")

            # Méthode de paiement
            payment_method_id = params.get('payment_method_id')
            payment_url = None

            if payment_method_id:
                payment_method_id = input_validator.validate_id(payment_method_id, 'payment_method_id')
                payment_provider = request.env['payment.provider'].sudo().browse(payment_method_id)

                if payment_provider.exists() and payment_provider.state == 'enabled':
                    # Créer transaction de paiement
                    tx = request.env['payment.transaction'].sudo().create({
                        'provider_id': payment_provider.id,
                        'amount': cart.amount_total,
                        'currency_id': cart.currency_id.id,
                        'partner_id': partner.id,
                        'sale_order_ids': [(6, 0, [cart.id])],
                    })

                    # Générer l'URL de paiement
                    payment_values = tx._get_processing_values()
                    payment_url = payment_values.get('redirect_form_html')
                    _logger.info(f"Transaction de paiement créée: {tx.id}")

            return self._success_response(
                data={
                    'order': {
                        'id': cart.id,
                        'name': cart.name,
                        'amount_total': cart.amount_total,
                        'state': cart.state,
                    },
                    'payment_url': payment_url,
                },
                message='Commande confirmée'
            )

        except Exception as e:
            return self._handle_error(e, "confirmation de commande")

    @http.route('/api/ecommerce/payment-methods', type='json', auth='public', methods=['GET', 'POST'], csrf=False, cors='*')
    @rate_limit(limit=50, window=60)
    def get_payment_methods(self, **kwargs):
        """
        Liste les méthodes de paiement disponibles.

        Returns:
        {
            "payment_methods": [
                {
                    "id": 1,
                    "name": "Carte bancaire",
                    "type": "online",
                    ...
                }
            ]
        }
        """
        try:
            payment_providers = request.env['payment.provider'].sudo().search([
                ('state', '=', 'enabled')
            ])

            methods = []
            for provider in payment_providers:
                methods.append({
                    'id': provider.id,
                    'name': provider.name,
                    'code': provider.code,
                    'image_url': f'/web/image/payment.provider/{provider.id}/image_128' if provider.image_128 else None,
                })

            return self._success_response({
                'payment_methods': methods
            })

        except Exception as e:
            return self._handle_error(e, "récupération des méthodes de paiement")

    @http.route('/api/ecommerce/delivery-methods', type='json', auth='public', methods=['GET', 'POST'], csrf=False, cors='*')
    @rate_limit(limit=50, window=60)
    def get_delivery_methods(self, **kwargs):
        """
        Liste les méthodes de livraison disponibles.

        Returns:
        {
            "delivery_methods": [...]
        }
        """
        try:
            delivery_carriers = request.env['delivery.carrier'].sudo().search([])

            methods = []
            for carrier in delivery_carriers:
                methods.append({
                    'id': carrier.id,
                    'name': carrier.name,
                    'description': carrier.delivery_description or '',
                    'fixed_price': carrier.fixed_price if carrier.delivery_type == 'fixed' else None,
                })

            return self._success_response({
                'delivery_methods': methods
            })

        except Exception as e:
            return self._handle_error(e, "récupération des méthodes de livraison")

    @http.route('/api/ecommerce/checkout/complete', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    @rate_limit(limit=5, window=300)
    def complete_checkout(self, **kwargs):
        """
        Complete checkout in a single atomic transaction (One-Page Checkout)

        Accepts all checkout data at once:
        - Shipping address
        - Delivery method
        - Payment method
        - Order notes

        Args:
            shipping_address: dict with address fields
            delivery_method_id: int
            payment_method_id: int (or payment_method: 'stripe', 'paypal', etc.)
            notes: str (optional)
            save_address: bool (optional)

        Returns:
            dict: Complete order with payment info
        """
        try:
            params = kwargs or {}

            # Get user
            user = request.env.user
            if not user or user._is_public():
                return self._error_response("Authentication required", 401)

            partner = user.partner_id
            input_validator = request.env['input.validator']

            # Get cart
            cart = self._get_cart()

            if not cart or not cart.order_line:
                return self._error_response("Cart is empty", 400)

            # Start transaction (will rollback if any error occurs)
            with request.env.cr.savepoint():

                # STEP 1: Process Shipping Address
                shipping_address = params.get('shipping_address', {})
                shipping_partner = None

                if shipping_address:
                    # Validate and sanitize address fields
                    address_data = {
                        'name': input_validator.validate_string(
                            shipping_address.get('name', partner.name),
                            'name', max_length=100
                        ),
                        'street': input_validator.validate_string(
                            shipping_address.get('street', ''),
                            'street', max_length=200
                        ),
                        'street2': input_validator.validate_string(
                            shipping_address.get('street2', ''),
                            'street2', max_length=200, required=False
                        ),
                        'city': input_validator.validate_string(
                            shipping_address.get('city', ''),
                            'city', max_length=100
                        ),
                        'zip': input_validator.validate_string(
                            shipping_address.get('zip', ''),
                            'zip', max_length=20
                        ),
                        'phone': input_validator.validate_string(
                            shipping_address.get('phone', partner.phone or ''),
                            'phone', max_length=50
                        ),
                        'email': input_validator.validate_email(
                            shipping_address.get('email', partner.email or '')
                        ),
                        'type': 'delivery',
                        'parent_id': partner.id,
                    }

                    # Country
                    country_id = shipping_address.get('country_id')
                    if country_id:
                        address_data['country_id'] = input_validator.validate_id(country_id, 'country_id')

                    # State (optional)
                    state_id = shipping_address.get('state_id')
                    if state_id:
                        address_data['state_id'] = input_validator.validate_id(state_id, 'state_id')

                    # Create or update shipping address
                    shipping_partner = request.env['res.partner'].sudo().create(address_data)
                    cart.partner_shipping_id = shipping_partner.id

                    _logger.info(f"Shipping address created: {shipping_partner.id}")

                # STEP 2: Apply Delivery Method
                delivery_method_id = params.get('delivery_method_id')
                if delivery_method_id:
                    delivery_method_id = input_validator.validate_id(delivery_method_id, 'delivery_method_id')
                    delivery_carrier = request.env['delivery.carrier'].sudo().browse(delivery_method_id)

                    if delivery_carrier.exists():
                        shipping_cost = delivery_carrier.get_shipping_price_from_so(cart)[0]
                        cart.set_delivery_line(delivery_carrier, shipping_cost)
                        _logger.info(f"Delivery method applied: {delivery_carrier.name}")

                # STEP 3: Add Order Notes
                notes = params.get('notes')
                if notes:
                    notes_str = input_validator.validate_string(notes, field_name='notes', max_length=500)
                    cart.frontend_notes = notes_str

                # STEP 4: Confirm Order
                cart.action_confirm()
                _logger.info(f"Order confirmed: {cart.name} (id={cart.id})")

                # STEP 5: Handle Payment
                payment_method = params.get('payment_method')  # 'stripe', 'paypal', 'bank_transfer', etc.
                payment_method_id = params.get('payment_method_id')  # Alternative: provider ID

                payment_info = {}

                if payment_method == 'stripe' or (payment_method_id and 'stripe' in str(payment_method_id).lower()):
                    # Stripe payment - return client secret for frontend
                    payment_provider = request.env['payment.provider'].sudo().search([
                        ('code', '=', 'stripe'),
                        ('state', '=', 'enabled')
                    ], limit=1)

                    if payment_provider:
                        # Create payment transaction
                        tx = request.env['payment.transaction'].sudo().create({
                            'provider_id': payment_provider.id,
                            'amount': cart.amount_total,
                            'currency_id': cart.currency_id.id,
                            'partner_id': partner.id,
                            'sale_order_ids': [(6, 0, [cart.id])],
                            'reference': cart.name,
                        })

                        payment_info = {
                            'payment_method': 'stripe',
                            'transaction_id': tx.id,
                            'amount': cart.amount_total,
                            'currency': cart.currency_id.name,
                            # Client should use existing Stripe integration
                        }
                        _logger.info(f"Stripe transaction created: {tx.id}")

                elif payment_method == 'paypal':
                    # PayPal - order will be created separately via PayPal controller
                    payment_info = {
                        'payment_method': 'paypal',
                        'amount': cart.amount_total,
                        'currency': cart.currency_id.name,
                        'order_id': cart.id,
                    }

                elif payment_method == 'bank_transfer' or payment_method == 'cod':
                    # Cash on delivery or bank transfer - no immediate payment
                    payment_info = {
                        'payment_method': payment_method,
                        'amount': cart.amount_total,
                        'currency': cart.currency_id.name,
                        'instructions': 'Payment instructions will be sent by email',
                    }

                # STEP 6: Save address for future (if requested)
                save_address = params.get('save_address', False)
                if save_address and shipping_partner:
                    # Address is already created and linked to partner
                    pass

                # Return complete order info
                return self._success_response({
                    'order': {
                        'id': cart.id,
                        'name': cart.name,
                        'state': cart.state,
                        'amount_total': cart.amount_total,
                        'amount_tax': cart.amount_tax,
                        'amount_untaxed': cart.amount_untaxed,
                        'currency': cart.currency_id.name,
                        'date_order': cart.date_order.isoformat() if cart.date_order else None,
                    },
                    'payment': payment_info,
                    'shipping_address': {
                        'name': shipping_partner.name if shipping_partner else partner.name,
                        'street': shipping_partner.street if shipping_partner else partner.street,
                        'city': shipping_partner.city if shipping_partner else partner.city,
                        'zip': shipping_partner.zip if shipping_partner else partner.zip,
                        'country': shipping_partner.country_id.name if shipping_partner and shipping_partner.country_id else (partner.country_id.name if partner.country_id else None),
                    },
                    'message': 'Order completed successfully',
                })

        except Exception as e:
            _logger.error(f"Error completing checkout: {str(e)}", exc_info=True)
            return self._handle_error(e, "completion du checkout")
