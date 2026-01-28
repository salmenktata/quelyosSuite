# -*- coding: utf-8 -*-
"""
Contrôleurs Checkout et Paiement pour l'e-commerce
"""
import logging
import json
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class QuelyosCheckout(http.Controller):
    """API Checkout et Paiement pour frontend e-commerce"""

    def _get_params(self):
        """Extrait les paramètres de la requête JSON-RPC"""
        return request.params if hasattr(request, 'params') and request.params else {}

    # ==================== STATES / GOVERNORATES ====================

    @http.route('/api/ecommerce/states', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_states(self, **kwargs):
        """
        Récupérer les états/gouvernorats d'un pays avec leurs zones de livraison

        Args:
            country_code (str): Code ISO du pays (défaut: 'TN')

        Returns:
            dict: {
                'success': bool,
                'states': [
                    {
                        'id': int,
                        'name': str,
                        'code': str,
                        'zone': str,
                        'zone_label': str,
                        'shipping_price': float
                    }
                ],
                'zones': {
                    'grand-tunis': {'label': 'Grand Tunis', 'price': 7.0},
                    ...
                },
                'free_threshold': float
            }
        """
        try:
            params = self._get_params()
            country_code = params.get('country_code', 'TN')

            # Récupérer le pays
            Country = request.env['res.country'].sudo()
            country = Country.search([('code', '=', country_code.upper())], limit=1)

            if not country:
                return {
                    'success': False,
                    'error': f'Pays non trouvé: {country_code}'
                }

            # Récupérer les états du pays
            State = request.env['res.country.state'].sudo()
            states = State.search([('country_id', '=', country.id)], order='name')

            # Récupérer les tarifs par zone depuis ir.config_parameter
            IrConfig = request.env['ir.config_parameter'].sudo()
            zone_prices = {
                'grand-tunis': float(IrConfig.get_param('shipping.zone.grand-tunis.price', '7.0')),
                'nord': float(IrConfig.get_param('shipping.zone.nord.price', '9.0')),
                'centre': float(IrConfig.get_param('shipping.zone.centre.price', '9.0')),
                'sud': float(IrConfig.get_param('shipping.zone.sud.price', '12.0')),
            }
            free_threshold = float(IrConfig.get_param('shipping.free_threshold', '150.0'))

            zone_labels = {
                'grand-tunis': 'Grand Tunis',
                'nord': 'Nord',
                'centre': 'Centre',
                'sud': 'Sud',
            }

            states_data = []
            for state in states:
                zone = state.x_shipping_zone or 'nord'  # Default to nord if not set
                states_data.append({
                    'id': state.id,
                    'name': state.name,
                    'code': state.code,
                    'zone': zone,
                    'zone_label': zone_labels.get(zone, zone),
                    'shipping_price': zone_prices.get(zone, 9.0),
                })

            zones_data = {
                zone: {
                    'label': zone_labels.get(zone, zone),
                    'price': price
                }
                for zone, price in zone_prices.items()
            }

            return {
                'success': True,
                'states': states_data,
                'zones': zones_data,
                'free_threshold': free_threshold,
                'country': {
                    'id': country.id,
                    'name': country.name,
                    'code': country.code,
                }
            }

        except Exception as e:
            _logger.error(f"Get states error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/admin/shipping/zones', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def get_shipping_zones(self, **kwargs):
        """
        Récupérer les zones de livraison et leurs tarifs (Admin)

        Returns:
            dict: {
                'success': bool,
                'zones': [
                    {
                        'code': str,
                        'label': str,
                        'price': float,
                        'governorates': [str]
                    }
                ],
                'free_threshold': float
            }
        """
        try:
            IrConfig = request.env['ir.config_parameter'].sudo()
            State = request.env['res.country.state'].sudo()
            Country = request.env['res.country'].sudo()

            tunisia = Country.search([('code', '=', 'TN')], limit=1)
            states = State.search([('country_id', '=', tunisia.id)]) if tunisia else State.browse()

            zone_codes = ['grand-tunis', 'nord', 'centre', 'sud']
            zone_labels = {
                'grand-tunis': 'Grand Tunis',
                'nord': 'Nord',
                'centre': 'Centre',
                'sud': 'Sud',
            }

            zones = []
            for zone_code in zone_codes:
                price = float(IrConfig.get_param(f'shipping.zone.{zone_code}.price', '9.0'))
                governorates = [s.name for s in states if s.x_shipping_zone == zone_code]
                zones.append({
                    'code': zone_code,
                    'label': zone_labels.get(zone_code, zone_code),
                    'price': price,
                    'governorates': governorates,
                })

            free_threshold = float(IrConfig.get_param('shipping.free_threshold', '150.0'))

            return {
                'success': True,
                'zones': zones,
                'free_threshold': free_threshold,
            }

        except Exception as e:
            _logger.error(f"Get shipping zones error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/admin/shipping/zones/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def update_shipping_zones(self, **kwargs):
        """
        Mettre à jour les tarifs des zones de livraison (Admin)

        Args:
            zones (dict): {'grand-tunis': 7.0, 'nord': 9.0, ...}
            free_threshold (float, optional): Seuil livraison gratuite

        Returns:
            dict: {'success': bool}
        """
        try:
            params = self._get_params()
            zones = params.get('zones', {})
            free_threshold = params.get('free_threshold')

            IrConfig = request.env['ir.config_parameter'].sudo()

            for zone_code, price in zones.items():
                if zone_code in ['grand-tunis', 'nord', 'centre', 'sud']:
                    IrConfig.set_param(f'shipping.zone.{zone_code}.price', str(float(price)))
                    _logger.info(f"Updated shipping zone {zone_code} price to {price}")

            if free_threshold is not None:
                IrConfig.set_param('shipping.free_threshold', str(float(free_threshold)))
                _logger.info(f"Updated free shipping threshold to {free_threshold}")

            return {
                'success': True,
                'message': 'Zones de livraison mises à jour'
            }

        except Exception as e:
            _logger.error(f"Update shipping zones error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    # ==================== CHECKOUT ====================

    @http.route('/api/ecommerce/checkout/validate', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def checkout_validate(self, **kwargs):
        """
        Valider le panier avant checkout

        Vérifie :
        - Stock disponible pour chaque produit
        - Prix à jour (pas de changement depuis ajout panier)
        - Produits toujours actifs
        - Quantités minimales/maximales respectées

        Returns:
            dict: {
                'success': bool,
                'valid': bool,
                'errors': [
                    {
                        'line_id': int,
                        'product_id': int,
                        'product_name': str,
                        'error_type': 'stock' | 'price' | 'inactive' | 'quantity',
                        'message': str,
                        'current_stock': int (si stock),
                        'requested_qty': int (si stock),
                        'old_price': float (si price),
                        'new_price': float (si price)
                    }
                ],
                'warnings': [
                    {
                        'line_id': int,
                        'message': str
                    }
                ]
            }
        """
        try:
            params = self._get_params()
            tenant_id = params.get('tenant_id')
            guest_email = params.get('guest_email')

            _logger.info(f"Validating cart for guest_email: {guest_email}, tenant_id: {tenant_id}")

            # SUDO justifié : Endpoint public permettant validation panier invité.
            # sudo() nécessaire pour accéder aux paniers sans session utilisateur (guests).
            # Sécurité : Filtrage strict sur guest_email ou session.uid (ligne 69-86)
            # Récupérer le panier
            Order = request.env['sale.order'].sudo()

            # Chercher le panier actif avec filtrage multi-tenant
            domain = [('state', '=', 'draft')]
            if tenant_id:
                domain.append(('tenant_id', '=', tenant_id))
            if request.session.uid:
                domain.append(('partner_id', '=', request.session.uid))
            elif guest_email:
                # SUDO justifié : Recherche partner par email pour panier invité.
                # sudo() nécessaire car pas de session utilisateur (guest checkout).
                # Sécurité : Email fourni par frontend, filtrage strict après sur partner.id
                partner = request.env['res.partner'].sudo().search([('email', '=', guest_email)], limit=1)
                if partner:
                    domain.append(('partner_id', '=', partner.id))
                else:
                    return {
                        'success': True,
                        'valid': False,
                        'errors': [{'message': 'Panier non trouvé'}]
                    }
            else:
                return {
                    'success': True,
                    'valid': False,
                    'errors': [{'message': 'Authentification requise ou email invité manquant'}]
                }

            cart = Order.search(domain, limit=1, order='write_date desc')

            if not cart:
                return {
                    'success': True,
                    'valid': False,
                    'errors': [{'message': 'Panier vide'}]
                }

            errors = []
            warnings = []

            # Vérifier chaque ligne du panier
            for line in cart.order_line:
                product = line.product_id

                # Vérifier si le produit est toujours actif
                if not product.active:
                    errors.append({
                        'line_id': line.id,
                        'product_id': product.id,
                        'product_name': product.name,
                        'error_type': 'inactive',
                        'message': f'Le produit "{product.name}" n\'est plus disponible'
                    })
                    continue

                # Vérifier le stock disponible
                if product.type == 'product':  # Produit stockable
                    if line.product_uom_qty > product.qty_available:
                        errors.append({
                            'line_id': line.id,
                            'product_id': product.id,
                            'product_name': product.name,
                            'error_type': 'stock',
                            'message': f'Stock insuffisant pour "{product.name}"',
                            'current_stock': int(product.qty_available),
                            'requested_qty': int(line.product_uom_qty)
                        })
                    elif line.product_uom_qty > product.qty_available - 5:  # Warning si stock faible
                        warnings.append({
                            'line_id': line.id,
                            'message': f'Stock limité pour "{product.name}" ({int(product.qty_available)} disponibles)'
                        })

                # Vérifier si le prix a changé
                current_price = product.list_price
                if abs(line.price_unit - current_price) > 0.01:
                    warnings.append({
                        'line_id': line.id,
                        'message': f'Le prix de "{product.name}" a changé',
                        'old_price': line.price_unit,
                        'new_price': current_price
                    })

            is_valid = len(errors) == 0

            return {
                'success': True,
                'valid': is_valid,
                'cart_id': cart.id,
                'errors': errors,
                'warnings': warnings
            }

        except Exception as e:
            _logger.error(f"Checkout validation error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/checkout/shipping', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def checkout_calculate_shipping(self, **kwargs):
        """
        Calculer les frais de livraison

        Args:
            delivery_method_id (int, optional): ID de la méthode de livraison
            state_id (int, optional): ID du gouvernorat pour calcul par zone
            guest_email (str, optional): Email invité

        Returns:
            dict: {
                'success': bool,
                'shipping_cost': float,
                'is_free': bool,
                'zone': str,
                'zone_label': str,
                'delivery_method': {
                    'id': int,
                    'name': str,
                    'description': str
                },
                'estimated_days_min': int,
                'estimated_days_max': int,
                'free_threshold': float
            }
        """
        try:
            params = self._get_params()
            delivery_method_id = params.get('delivery_method_id')
            state_id = params.get('state_id')
            guest_email = params.get('guest_email')

            IrConfig = request.env['ir.config_parameter'].sudo()
            free_threshold = float(IrConfig.get_param('shipping.free_threshold', '150.0'))

            # Récupérer le panier pour vérifier le montant
            Order = request.env['sale.order'].sudo()
            domain = [('state', '=', 'draft')]

            if request.session.uid:
                domain.append(('partner_id', '=', request.session.uid))
            elif guest_email:
                partner = request.env['res.partner'].sudo().search([('email', '=', guest_email)], limit=1)
                if partner:
                    domain.append(('partner_id', '=', partner.id))

            cart = Order.search(domain, limit=1, order='write_date desc')
            cart_total = cart.amount_untaxed if cart else 0.0

            # Calcul par zone (prioritaire si state_id fourni)
            if state_id:
                State = request.env['res.country.state'].sudo()
                state = State.browse(state_id)

                if not state.exists():
                    return {
                        'success': False,
                        'error': 'Gouvernorat non trouvé'
                    }

                zone = state.x_shipping_zone or 'nord'
                zone_labels = {
                    'grand-tunis': 'Grand Tunis',
                    'nord': 'Nord',
                    'centre': 'Centre',
                    'sud': 'Sud',
                }
                zone_label = zone_labels.get(zone, zone)

                # Récupérer le tarif de la zone
                shipping_cost = float(IrConfig.get_param(f'shipping.zone.{zone}.price', '9.0'))

                # Vérifier livraison gratuite
                is_free = False
                if free_threshold > 0 and cart_total >= free_threshold:
                    shipping_cost = 0.0
                    is_free = True

                return {
                    'success': True,
                    'shipping_cost': shipping_cost,
                    'is_free': is_free,
                    'zone': zone,
                    'zone_label': zone_label,
                    'state': {
                        'id': state.id,
                        'name': state.name,
                        'code': state.code,
                    },
                    'estimated_days_min': 2 if zone == 'grand-tunis' else 3,
                    'estimated_days_max': 3 if zone == 'grand-tunis' else 5,
                    'free_threshold': free_threshold,
                    'cart_total': cart_total,
                }

            # Fallback: calcul par delivery_method_id (ancien comportement)
            if not delivery_method_id:
                return {
                    'success': False,
                    'error': 'state_id ou delivery_method_id requis'
                }

            DeliveryCarrier = request.env['delivery.carrier'].sudo()
            carrier = DeliveryCarrier.browse(delivery_method_id)

            if not carrier.exists():
                return {
                    'success': False,
                    'error': 'Méthode de livraison non trouvée'
                }

            shipping_cost = carrier.fixed_price

            is_free = False
            if carrier.free_over and cart_total >= carrier.free_over:
                shipping_cost = 0.0
                is_free = True

            return {
                'success': True,
                'shipping_cost': shipping_cost,
                'is_free': is_free,
                'delivery_method': {
                    'id': carrier.id,
                    'name': carrier.name,
                    'description': carrier.product_id.description_sale or ''
                },
                'estimated_days_min': 2,
                'estimated_days_max': 5,
                'free_threshold': free_threshold,
                'cart_total': cart_total,
            }

        except Exception as e:
            _logger.error(f"Shipping calculation error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/checkout/complete', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def checkout_complete(self, **kwargs):
        """
        Finaliser la commande (créer sale.order confirmée)

        Args:
            shipping_address_id (int): ID adresse livraison
            billing_address_id (int, optional): ID adresse facturation (sinon = shipping)
            delivery_method_id (int): ID méthode de livraison
            payment_method_id (int): ID méthode de paiement
            notes (str, optional): Notes commande
            guest_email (str, optional): Email invité

        Returns:
            dict: {
                'success': bool,
                'order': {
                    'id': int,
                    'name': str,
                    'amount_total': float,
                    'state': str
                }
            }
        """
        try:
            params = self._get_params()
            shipping_address_id = params.get('shipping_address_id')
            billing_address_id = params.get('billing_address_id', shipping_address_id)
            delivery_method_id = params.get('delivery_method_id')
            payment_method_id = params.get('payment_method_id')
            notes = params.get('notes', '')
            guest_email = params.get('guest_email')

            if not all([shipping_address_id, delivery_method_id, payment_method_id]):
                return {
                    'success': False,
                    'error': 'Paramètres manquants (shipping_address_id, delivery_method_id, payment_method_id requis)'
                }

            # Récupérer le panier
            Order = request.env['sale.order'].sudo()
            domain = [('state', '=', 'draft')]

            if request.session.uid:
                domain.append(('partner_id', '=', request.session.uid))
            elif guest_email:
                # SUDO justifié : Recherche partner par email pour panier invité.
                # sudo() nécessaire car pas de session utilisateur (guest checkout).
                # Sécurité : Email fourni par frontend, filtrage strict après sur partner.id
                partner = request.env['res.partner'].sudo().search([('email', '=', guest_email)], limit=1)
                if partner:
                    domain.append(('partner_id', '=', partner.id))
                else:
                    return {
                        'success': False,
                        'error': 'Client non trouvé'
                    }
            else:
                return {
                    'success': False,
                    'error': 'Authentification requise'
                }

            cart = Order.search(domain, limit=1, order='write_date desc')

            if not cart or not cart.order_line:
                return {
                    'success': False,
                    'error': 'Panier vide'
                }

            # Récupérer les adresses
            Partner = request.env['res.partner'].sudo()
            shipping_address = Partner.browse(shipping_address_id)
            billing_address = Partner.browse(billing_address_id)

            if not shipping_address.exists() or not billing_address.exists():
                return {
                    'success': False,
                    'error': 'Adresse invalide'
                }

            # Mettre à jour la commande
            cart.write({
                'partner_shipping_id': shipping_address.id,
                'partner_invoice_id': billing_address.id,
                'carrier_id': delivery_method_id,
                'note': notes,
            })

            # Ajouter les frais de livraison
            carrier = request.env['delivery.carrier'].sudo().browse(delivery_method_id)
            if carrier.exists():
                shipping_cost = carrier.fixed_price
                if carrier.free_over and cart.amount_untaxed >= carrier.free_over:
                    shipping_cost = 0.0

                if shipping_cost > 0:
                    # Créer une ligne de commande pour les frais de livraison
                    delivery_product = carrier.product_id
                    if delivery_product:
                        cart.order_line.create({
                            'order_id': cart.id,
                            'product_id': delivery_product.id,
                            'name': f'Livraison - {carrier.name}',
                            'product_uom_qty': 1,
                            'price_unit': shipping_cost
                        })

            # NE PAS confirmer automatiquement - attendre validation paiement
            # La confirmation se fera via /checkout/confirm après paiement

            return {
                'success': True,
                'order': {
                    'id': cart.id,
                    'name': cart.name,
                    'amount_total': cart.amount_total,
                    'amount_untaxed': cart.amount_untaxed,
                    'amount_tax': cart.amount_tax,
                    'state': cart.state,
                    'currency': cart.currency_id.name
                },
                'message': 'Commande créée, en attente de paiement'
            }

        except Exception as e:
            _logger.error(f"Checkout complete error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/checkout/confirm', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def checkout_confirm(self, **kwargs):
        """
        Confirmer la commande (après paiement validé)

        Args:
            order_id (int): ID de la commande
            payment_reference (str): Référence du paiement

        Returns:
            dict: {
                'success': bool,
                'order': {
                    'id': int,
                    'name': str,
                    'state': str,
                    'amount_total': float
                }
            }
        """
        try:
            params = self._get_params()
            order_id = params.get('order_id')
            payment_reference = params.get('payment_reference', '')

            if not order_id:
                return {
                    'success': False,
                    'error': 'order_id requis'
                }

            Order = request.env['sale.order'].sudo()
            order = Order.browse(order_id)

            if not order.exists():
                return {
                    'success': False,
                    'error': 'Commande non trouvée'
                }

            # SECURITE : Vérifier que la commande appartient à l'utilisateur (authentifié OU invité)
            if request.session.uid:
                # Utilisateur authentifié : vérifier ownership par UID
                if order.partner_id.id != request.session.uid:
                    _logger.warning(f"Unauthorized order confirm attempt: user {request.session.uid} tried to access order {order_id}")
                    return {
                        'success': False,
                        'error': 'Accès non autorisé'
                    }
            else:
                # Invité : vérifier ownership par email
                guest_email = params.get('guest_email')
                if not guest_email:
                    return {
                        'success': False,
                        'error': 'Authentification requise ou guest_email manquant'
                    }

                # Vérifier que l'email correspond au partenaire de la commande
                if order.partner_id.email != guest_email:
                    _logger.warning(f"Unauthorized order confirm attempt: guest {guest_email} tried to access order {order_id}")
                    return {
                        'success': False,
                        'error': 'Accès non autorisé'
                    }

            # Vérifier l'état de la commande
            if order.state != 'draft':
                return {
                    'success': False,
                    'error': f'Commande déjà dans l\'état : {order.state}'
                }

            # Confirmer la commande
            order.action_confirm()

            # Ajouter la référence de paiement dans les notes internes
            if payment_reference:
                order.write({
                    'note': (order.note or '') + f'\n\nRéférence paiement: {payment_reference}'
                })

            _logger.info(f"Order {order.name} confirmed with payment reference: {payment_reference}")

            return {
                'success': True,
                'order': {
                    'id': order.id,
                    'name': order.name,
                    'state': order.state,
                    'amount_total': order.amount_total,
                    'currency': order.currency_id.name
                },
                'message': f'Commande {order.name} confirmée avec succès'
            }

        except Exception as e:
            _logger.error(f"Checkout confirm error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    # ==================== PAYMENT ====================

    @http.route('/api/ecommerce/payment/paypal/create-order', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def paypal_create_order(self, **kwargs):
        """
        Créer un ordre PayPal

        Args:
            order_id (int): ID de la commande Odoo

        Returns:
            dict: {
                'success': bool,
                'paypal_order_id': str,
                'approval_url': str
            }
        """
        try:
            params = self._get_params()
            order_id = params.get('order_id')

            if not order_id:
                return {
                    'success': False,
                    'error': 'order_id requis'
                }

            Order = request.env['sale.order'].sudo()
            order = Order.browse(order_id)

            if not order.exists():
                return {
                    'success': False,
                    'error': 'Commande non trouvée'
                }

            # TODO: Intégration PayPal SDK
            # Pour l'instant, retourner un mock pour développement frontend
            _logger.warning("PayPal integration not implemented - returning mock data")

            mock_paypal_order_id = f"PAYPAL-{order.name}-{order.id}"

            return {
                'success': True,
                'paypal_order_id': mock_paypal_order_id,
                'approval_url': f'https://www.sandbox.paypal.com/checkoutnow?token={mock_paypal_order_id}',
                'message': 'PayPal order created (MOCK - not implemented yet)'
            }

        except Exception as e:
            _logger.error(f"PayPal create order error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/payment/paypal/capture-order', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def paypal_capture_order(self, **kwargs):
        """
        Capturer un paiement PayPal

        Args:
            paypal_order_id (str): ID de l'ordre PayPal
            order_id (int): ID de la commande Odoo

        Returns:
            dict: {
                'success': bool,
                'status': str,
                'transaction_id': str
            }
        """
        try:
            params = self._get_params()
            paypal_order_id = params.get('paypal_order_id')
            order_id = params.get('order_id')

            if not all([paypal_order_id, order_id]):
                return {
                    'success': False,
                    'error': 'paypal_order_id et order_id requis'
                }

            # TODO: Intégration PayPal SDK pour capturer le paiement
            # Pour l'instant, retourner un mock pour développement frontend
            _logger.warning("PayPal capture not implemented - returning mock data")

            mock_transaction_id = f"TXN-{paypal_order_id}"

            return {
                'success': True,
                'status': 'COMPLETED',
                'transaction_id': mock_transaction_id,
                'message': 'PayPal payment captured (MOCK - not implemented yet)'
            }

        except Exception as e:
            _logger.error(f"PayPal capture order error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/payment/wallet/create', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def wallet_create_payment(self, **kwargs):
        """
        Créer un paiement Wallet (Apple Pay / Google Pay)

        Args:
            amount (float): Montant du paiement
            payment_method_id (int): ID de la méthode de paiement
            shipping_address (dict): Adresse de livraison
            order_id (int, optional): ID de la commande existante

        Returns:
            dict: {
                'success': bool,
                'payment_intent_id': str,
                'client_secret': str
            }
        """
        try:
            params = self._get_params()
            amount = params.get('amount')
            payment_method_id = params.get('payment_method_id')
            shipping_address = params.get('shipping_address')
            order_id = params.get('order_id')

            if not all([amount, payment_method_id, shipping_address]):
                return {
                    'success': False,
                    'error': 'amount, payment_method_id et shipping_address requis'
                }

            # TODO: Intégration Stripe Payment Intents pour Apple Pay / Google Pay
            # Pour l'instant, retourner un mock pour développement frontend
            _logger.warning("Wallet payment not implemented - returning mock data")

            mock_payment_intent_id = f"pi_mock_{int(amount * 100)}"
            mock_client_secret = f"{mock_payment_intent_id}_secret_mock"

            return {
                'success': True,
                'payment_intent_id': mock_payment_intent_id,
                'client_secret': mock_client_secret,
                'message': 'Wallet payment created (MOCK - not implemented yet)'
            }

        except Exception as e:
            _logger.error(f"Wallet payment creation error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/payment/stripe/create-intent', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def stripe_create_payment_intent(self, **kwargs):
        """
        Créer un Payment Intent Stripe pour un paiement par carte bancaire

        Args:
            order_id (int): ID de la commande Odoo
            return_url (str, optional): URL de retour après paiement 3D Secure

        Returns:
            dict: {
                'success': bool,
                'client_secret': str,
                'payment_intent_id': str,
                'amount': float,
                'currency': str
            }
        """
        try:
            params = self._get_params()
            order_id = params.get('order_id')
            return_url = params.get('return_url', '')

            if not order_id:
                return {
                    'success': False,
                    'error': 'order_id requis'
                }

            # Récupérer la commande
            Order = request.env['sale.order'].sudo()
            order = Order.browse(order_id)

            if not order.exists():
                return {
                    'success': False,
                    'error': 'Commande non trouvée'
                }

            if not order.order_line:
                return {
                    'success': False,
                    'error': 'Commande vide'
                }

            # Récupérer la clé secrète Stripe depuis les paramètres système
            IrConfigParameter = request.env['ir.config_parameter'].sudo()
            stripe_secret_key = IrConfigParameter.get_param('payment.stripe.secret_key', '')

            if not stripe_secret_key:
                _logger.error("Stripe secret key not configured in system parameters")
                return {
                    'success': False,
                    'error': 'Configuration Stripe manquante. Veuillez contacter l\'administrateur.'
                }

            # Importer Stripe (installation requise: pip install stripe)
            try:
                import stripe
            except ImportError:
                _logger.error("Stripe Python library not installed")
                return {
                    'success': False,
                    'error': 'Bibliothèque Stripe non installée sur le serveur'
                }

            stripe.api_key = stripe_secret_key

            # Convertir le montant en centimes (Stripe utilise les plus petites unités)
            # EUR → cents, USD → cents, etc.
            amount_cents = int(order.amount_total * 100)
            currency = order.currency_id.name.lower()

            # Créer le Payment Intent
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency,
                description=f'Commande {order.name}',
                metadata={
                    'order_id': order.id,
                    'order_name': order.name,
                    'customer_email': order.partner_id.email or '',
                },
                automatic_payment_methods={'enabled': True},
            )

            _logger.info(f"Payment Intent created: {payment_intent.id} for order {order.name}")

            return {
                'success': True,
                'client_secret': payment_intent.client_secret,
                'payment_intent_id': payment_intent.id,
                'amount': order.amount_total,
                'currency': currency,
                'order': {
                    'id': order.id,
                    'name': order.name,
                }
            }

        except Exception as e:
            _logger.error(f"Stripe create payment intent error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/payment/stripe/confirm', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def stripe_confirm_payment(self, **kwargs):
        """
        Confirmer un paiement Stripe et finaliser la commande

        Args:
            payment_intent_id (str): ID du Payment Intent Stripe
            order_id (int): ID de la commande Odoo

        Returns:
            dict: {
                'success': bool,
                'status': str,
                'order': {
                    'id': int,
                    'name': str,
                    'state': str
                }
            }
        """
        try:
            params = self._get_params()
            payment_intent_id = params.get('payment_intent_id')
            order_id = params.get('order_id')

            if not all([payment_intent_id, order_id]):
                return {
                    'success': False,
                    'error': 'payment_intent_id et order_id requis'
                }

            # Récupérer la commande
            Order = request.env['sale.order'].sudo()
            order = Order.browse(order_id)

            if not order.exists():
                return {
                    'success': False,
                    'error': 'Commande non trouvée'
                }

            # Récupérer la clé secrète Stripe
            IrConfigParameter = request.env['ir.config_parameter'].sudo()
            stripe_secret_key = IrConfigParameter.get_param('payment.stripe.secret_key', '')

            if not stripe_secret_key:
                return {
                    'success': False,
                    'error': 'Configuration Stripe manquante'
                }

            try:
                import stripe
            except ImportError:
                return {
                    'success': False,
                    'error': 'Bibliothèque Stripe non installée'
                }

            stripe.api_key = stripe_secret_key

            # Récupérer le Payment Intent pour vérifier son statut
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)

            # Vérifier que le paiement a réussi
            if payment_intent.status != 'succeeded':
                _logger.warning(f"Payment Intent {payment_intent_id} status is {payment_intent.status}, not succeeded")
                return {
                    'success': False,
                    'error': f'Paiement non confirmé. Statut: {payment_intent.status}',
                    'status': payment_intent.status
                }

            # Vérifier que le montant correspond
            expected_amount_cents = int(order.amount_total * 100)
            if payment_intent.amount != expected_amount_cents:
                _logger.error(f"Payment Intent amount mismatch: expected {expected_amount_cents}, got {payment_intent.amount}")
                return {
                    'success': False,
                    'error': 'Montant du paiement incorrect'
                }

            # Confirmer la commande Odoo
            if order.state == 'draft':
                order.action_confirm()

                # Ajouter la référence Stripe dans les notes
                order.write({
                    'note': (order.note or '') + f'\n\nPaiement Stripe: {payment_intent_id}\nStatut: {payment_intent.status}'
                })

                _logger.info(f"Order {order.name} confirmed with Stripe payment {payment_intent_id}")

            return {
                'success': True,
                'status': payment_intent.status,
                'order': {
                    'id': order.id,
                    'name': order.name,
                    'state': order.state,
                    'amount_total': order.amount_total,
                },
                'message': f'Paiement confirmé pour la commande {order.name}'
            }

        except Exception as e:
            _logger.error(f"Stripe confirm payment error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }
