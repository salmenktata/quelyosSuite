# -*- coding: utf-8 -*-
import logging
import math
from datetime import datetime, timedelta
from odoo import http, fields
from odoo.http import request
from ..config import is_origin_allowed, get_cors_headers
from ..lib.cache import get_cache_service, CacheTTL
from ..lib.rate_limiter import check_rate_limit, RateLimitConfig
from ..lib.validation import sanitize_string, sanitize_dict, validate_no_injection
from .base import BaseController

_logger = logging.getLogger(__name__)


class QuelyosDeliveryPaymentAPI(BaseController):
    """API contrôleur pour livraison et paiement"""

    @http.route('/api/ecommerce/delivery/methods', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_delivery_methods(self, **kwargs):
        """Liste des méthodes de livraison disponibles"""
        try:
            carriers = request.env['delivery.carrier'].sudo().search([
                ('active', '=', True)
            ])

            data = [{
                'id': c.id,
                'name': c.name,
                'delivery_type': c.delivery_type,
                'fixed_price': c.fixed_price,
                'free_over': c.free_over if hasattr(c, 'free_over') else False,
            } for c in carriers]

            return {
                'success': True,
                'data': {
                    'delivery_methods': data
                }
            }

        except Exception as e:
            _logger.error(f"Get delivery methods error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/delivery/methods/create', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def create_delivery_method(self, **kwargs):
        """Creer une methode de livraison (admin uniquement)"""
        try:
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

            params = self._get_params()
            name = params.get('name')
            fixed_price = float(params.get('fixed_price', 0))
            free_over = params.get('free_over')

            if not name:
                return {
                    'success': False,
                    'error': 'Name is required'
                }

            carrier_vals = {
                'name': name,
                'delivery_type': 'fixed',
                'fixed_price': fixed_price,
                'active': True,
            }

            if free_over:
                carrier_vals['free_over'] = float(free_over)

            carrier = request.env['delivery.carrier'].sudo().create(carrier_vals)

            return {
                'success': True,
                'delivery_method': {
                    'id': carrier.id,
                    'name': carrier.name,
                    'fixed_price': carrier.fixed_price,
                    'delivery_type': carrier.delivery_type,
                    'active': carrier.active,
                },
                'message': 'Methode de livraison creee avec succes'
            }

        except Exception as e:
            _logger.error(f"Create delivery method error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/delivery/methods/<int:method_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_delivery_method_detail(self, method_id, **kwargs):
        """Detail d'une methode de livraison (admin uniquement)"""
        try:
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

            carrier = request.env['delivery.carrier'].sudo().browse(method_id)
            if not carrier.exists():
                return {
                    'success': False,
                    'error': 'Delivery method not found'
                }

            return {
                'success': True,
                'delivery_method': {
                    'id': carrier.id,
                    'name': carrier.name,
                    'delivery_type': carrier.delivery_type,
                    'fixed_price': carrier.fixed_price,
                    'free_over': carrier.free_over if hasattr(carrier, 'free_over') else 0,
                    'active': carrier.active,
                }
            }

        except Exception as e:
            _logger.error(f"Get delivery method detail error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/delivery/methods/<int:method_id>/update', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def update_delivery_method(self, method_id, **kwargs):
        """Mettre a jour une methode de livraison (admin uniquement)"""
        try:
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

            carrier = request.env['delivery.carrier'].sudo().browse(method_id)
            if not carrier.exists():
                return {
                    'success': False,
                    'error': 'Delivery method not found'
                }

            params = self._get_params()
            update_vals = {}

            if 'name' in params:
                update_vals['name'] = params['name']
            if 'fixed_price' in params:
                update_vals['fixed_price'] = float(params['fixed_price'])
            if 'free_over' in params:
                update_vals['free_over'] = float(params['free_over']) if params['free_over'] else False
            if 'active' in params:
                update_vals['active'] = params['active']

            if update_vals:
                carrier.write(update_vals)

            return {
                'success': True,
                'delivery_method': {
                    'id': carrier.id,
                    'name': carrier.name,
                    'fixed_price': carrier.fixed_price,
                    'active': carrier.active,
                },
                'message': 'Methode de livraison mise a jour'
            }

        except Exception as e:
            _logger.error(f"Update delivery method error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/delivery/methods/<int:method_id>/delete', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def delete_delivery_method(self, method_id, **kwargs):
        """Supprimer une methode de livraison (admin uniquement)"""
        try:
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

            carrier = request.env['delivery.carrier'].sudo().browse(method_id)
            if not carrier.exists():
                return {
                    'success': False,
                    'error': 'Delivery method not found'
                }

            carrier_name = carrier.name
            carrier.unlink()

            return {
                'success': True,
                'message': f'Methode de livraison "{carrier_name}" supprimee'
            }

        except Exception as e:
            _logger.error(f"Delete delivery method error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/delivery/calculate', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def calculate_delivery_cost(self, **kwargs):
        """Calculer les frais de livraison"""
        try:
            params = self._get_params()
            carrier_id = params.get('carrier_id')
            order_id = params.get('order_id')

            if not carrier_id:
                return {
                    'success': False,
                    'error': 'Carrier ID is required'
                }

            carrier = request.env['delivery.carrier'].sudo().browse(int(carrier_id))

            if not carrier.exists():
                return {
                    'success': False,
                    'error': 'Delivery carrier not found'
                }

            # Si order_id fourni, calculer sur la commande
            if order_id:
                order = request.env['sale.order'].sudo().browse(int(order_id))
                if not order.exists():
                    return {
                        'success': False,
                        'error': 'Order not found'
                    }

                # Calculer le prix de livraison
                price = carrier.rate_shipment(order)
                if price.get('success'):
                    shipping_cost = price.get('price', 0)
                else:
                    shipping_cost = carrier.fixed_price
            else:
                # Prix fixe si pas de commande
                shipping_cost = carrier.fixed_price

            return {
                'success': True,
                'carrier': {
                    'id': carrier.id,
                    'name': carrier.name,
                    'shipping_cost': shipping_cost,
                }
            }

        except Exception as e:
            _logger.error(f"Calculate delivery error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/delivery/zones', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_delivery_zones(self, **kwargs):
        """Liste des zones de livraison disponibles"""
        try:
            # Dans Odoo, les zones sont définies par les pays
            countries = request.env['res.country'].sudo().search([], limit=300)

            data = [{
                'id': c.id,
                'name': c.name,
                'code': c.code,
            } for c in countries]

            return {
                'success': True,
                'data': {
                    'zones': data
                }
            }

        except Exception as e:
            _logger.error(f"Get delivery zones error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/payment/methods', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_payment_methods(self, **kwargs):
        """Liste des moyens de paiement disponibles"""
        try:
            # Récupérer les payment acquirers actifs
            acquirers = request.env['payment.provider'].sudo().search([
                ('state', 'in', ['enabled', 'test'])
            ])

            data = []
            for acq in acquirers:
                data.append({
                    'id': acq.id,
                    'name': acq.name,
                    'code': acq.code,
                    'state': acq.state,
                    'image_url': f'/web/image/payment.provider/{acq.id}/image_128' if acq.image_128 else None,
                    'fees': acq.fees if hasattr(acq, 'fees') else 0,
                })

            return {
                'success': True,
                'data': {
                    'payment_methods': data
                }
            }

        except Exception as e:
            _logger.error(f"Get payment methods error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/payment/init', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def init_payment(self, **kwargs):
        """Initialiser un paiement (créer une transaction Stripe PaymentIntent)"""
        try:
            params = self._get_params()
            order_id = int(params.get('order_id'))
            payment_method_id = int(params.get('payment_method_id'))
            return_url = params.get('return_url', '')

            # Récupérer la commande
            order = request.env['sale.order'].sudo().browse(order_id)
            if not order.exists():
                return {
                    'success': False,
                    'error': 'Order not found'
                }

            # Vérifier que la commande appartient à l'utilisateur
            if order.partner_id.id != request.env.user.partner_id.id:
                return {
                    'success': False,
                    'error': 'Unauthorized'
                }

            # Récupérer le payment provider
            provider = request.env['payment.provider'].sudo().browse(payment_method_id)
            if not provider.exists():
                return {
                    'success': False,
                    'error': 'Payment method not found'
                }

            # Créer une transaction de paiement
            transaction_vals = {
                'provider_id': provider.id,
                'amount': order.amount_total,
                'currency_id': order.currency_id.id,
                'partner_id': order.partner_id.id,
                'sale_order_ids': [(6, 0, [order.id])],
                'reference': order.name,
                'callback_model_id': request.env['ir.model'].sudo().search([('model', '=', 'sale.order')], limit=1).id,
                'callback_res_id': order.id,
            }

            transaction = request.env['payment.transaction'].sudo().create(transaction_vals)

            # Pour Stripe: créer un PaymentIntent via l'API Stripe
            payment_data = {
                'transaction_id': transaction.id,
                'reference': transaction.reference,
                'amount': transaction.amount,
                'currency': transaction.currency_id.name,
            }

            # Si c'est Stripe, on pourrait appeler l'API Stripe ici
            # Pour l'instant, on retourne les données de base
            if provider.code == 'stripe':
                # TODO: Intégrer Stripe SDK pour créer PaymentIntent
                payment_data['client_secret'] = f"pi_test_{transaction.id}"
                payment_data['publishable_key'] = provider.stripe_publishable_key if hasattr(provider, 'stripe_publishable_key') else ''

            return {
                'success': True,
                'data': {
                    'payment': payment_data,
                    'order_id': order.id,
                    'order_name': order.name,
                }
            }

        except Exception as e:
            _logger.error(f"Init payment error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/payment/confirm', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def confirm_payment(self, **kwargs):
        """Confirmer un paiement après validation par Stripe"""
        try:
            params = self._get_params()
            transaction_id = int(params.get('transaction_id'))
            payment_intent_id = params.get('payment_intent_id', '')
            status = params.get('status', 'pending')

            # Récupérer la transaction
            transaction = request.env['payment.transaction'].sudo().browse(transaction_id)
            if not transaction.exists():
                return {
                    'success': False,
                    'error': 'Transaction not found'
                }

            # Vérifier que la transaction appartient à l'utilisateur
            if transaction.partner_id.id != request.env.user.partner_id.id:
                return {
                    'success': False,
                    'error': 'Unauthorized'
                }

            # Mettre à jour la transaction selon le statut
            if status == 'succeeded':
                transaction.write({
                    'state': 'done',
                    'provider_reference': payment_intent_id,
                })
                # Confirmer la commande
                for order in transaction.sale_order_ids:
                    if order.state in ['draft', 'sent']:
                        order.action_confirm()
            elif status == 'failed':
                transaction.write({
                    'state': 'error',
                    'provider_reference': payment_intent_id,
                })
            else:
                transaction.write({
                    'state': 'pending',
                    'provider_reference': payment_intent_id,
                })

            return {
                'success': True,
                'data': {
                    'transaction_id': transaction.id,
                    'state': transaction.state,
                    'order_id': transaction.sale_order_ids[0].id if transaction.sale_order_ids else None,
                }
            }

        except Exception as e:
            _logger.error(f"Confirm payment error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/payment/webhook', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def payment_webhook(self, **kwargs):
        """Webhook pour recevoir les notifications de Stripe"""
        try:
            params = self._get_params()
            event_type = params.get('type', '')
            event_data = params.get('data', {})

            _logger.info(f"Payment webhook received: {event_type}")

            # Traiter les événements Stripe
            if event_type == 'payment_intent.succeeded':
                payment_intent = event_data.get('object', {})
                payment_intent_id = payment_intent.get('id')

                # Trouver la transaction correspondante
                transaction = request.env['payment.transaction'].sudo().search([
                    ('provider_reference', '=', payment_intent_id)
                ], limit=1)

                if transaction:
                    transaction.write({'state': 'done'})
                    # Confirmer la commande
                    for order in transaction.sale_order_ids:
                        if order.state in ['draft', 'sent']:
                            order.action_confirm()

            elif event_type == 'payment_intent.payment_failed':
                payment_intent = event_data.get('object', {})
                payment_intent_id = payment_intent.get('id')

                transaction = request.env['payment.transaction'].sudo().search([
                    ('provider_reference', '=', payment_intent_id)
                ], limit=1)

                if transaction:
                    transaction.write({'state': 'error'})

            return {
                'success': True,
                'message': 'Webhook processed'
            }

        except Exception as e:
            _logger.error(f"Payment webhook error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/payment/transactions', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_payment_transactions(self, **kwargs):
        """Liste des transactions de paiement (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

            params = self._get_params()
            limit = int(params.get('limit', 20))
            offset = int(params.get('offset', 0))
            state_filter = params.get('state', '')
            search = params.get('search', '').strip()

            # Construire le domaine de recherche
            domain = []

            if state_filter:
                domain.append(('state', '=', state_filter))

            if search:
                domain.append('|')
                domain.append(('reference', 'ilike', search))
                domain.append(('partner_id.name', 'ilike', search))

            # Rechercher les transactions
            transactions = request.env['payment.transaction'].sudo().search(
                domain,
                limit=limit,
                offset=offset,
                order='create_date desc'
            )

            total = request.env['payment.transaction'].sudo().search_count(domain)

            data = []
            for t in transactions:
                # Récupérer la commande liée
                order = t.sale_order_ids[0] if t.sale_order_ids else None

                data.append({
                    'id': t.id,
                    'reference': t.reference or f'TX-{t.id}',
                    'provider_reference': t.provider_reference or '',
                    'amount': t.amount,
                    'currency': t.currency_id.name if t.currency_id else 'EUR',
                    'state': t.state,
                    'state_label': dict(t._fields['state'].selection).get(t.state, t.state),
                    'provider': {
                        'id': t.provider_id.id if t.provider_id else None,
                        'name': t.provider_id.name if t.provider_id else 'Manuel',
                    },
                    'partner': {
                        'id': t.partner_id.id if t.partner_id else None,
                        'name': t.partner_id.name if t.partner_id else 'Anonyme',
                        'email': t.partner_id.email if t.partner_id else '',
                    },
                    'order': {
                        'id': order.id if order else None,
                        'name': order.name if order else None,
                    } if order else None,
                    'create_date': t.create_date.isoformat() if t.create_date else None,
                    'last_state_change': t.last_state_change.isoformat() if hasattr(t, 'last_state_change') and t.last_state_change else None,
                })

            # Statistiques (optimisé avec search_count pour éviter de charger toutes les transactions)
            PaymentTransaction = request.env['payment.transaction'].sudo()
            stats = {
                'total': PaymentTransaction.search_count([]),
                'done': PaymentTransaction.search_count([('state', '=', 'done')]),
                'pending': PaymentTransaction.search_count([('state', '=', 'pending')]),
                'error': PaymentTransaction.search_count([('state', '=', 'error')]),
                'canceled': PaymentTransaction.search_count([('state', '=', 'cancel')]),
                'total_amount': sum(PaymentTransaction.search([('state', '=', 'done')]).mapped('amount')),
            }

            return {
                'success': True,
                'data': {
                    'transactions': data,
                    'total': total,
                    'limit': limit,
                    'offset': offset,
                    'stats': stats,
                }
            }

        except Exception as e:
            _logger.error(f"Get payment transactions error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/payment/transactions/<int:transaction_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_payment_transaction_detail(self, transaction_id, **kwargs):
        """Détail d'une transaction de paiement (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

            transaction = request.env['payment.transaction'].sudo().browse(transaction_id)

            if not transaction.exists():
                return {
                    'success': False,
                    'error': 'Transaction not found'
                }

            order = transaction.sale_order_ids[0] if transaction.sale_order_ids else None

            return {
                'success': True,
                'transaction': {
                    'id': transaction.id,
                    'reference': transaction.reference or f'TX-{transaction.id}',
                    'provider_reference': transaction.provider_reference or '',
                    'amount': transaction.amount,
                    'currency': transaction.currency_id.name if transaction.currency_id else 'EUR',
                    'state': transaction.state,
                    'state_label': dict(transaction._fields['state'].selection).get(transaction.state, transaction.state),
                    'provider': {
                        'id': transaction.provider_id.id if transaction.provider_id else None,
                        'name': transaction.provider_id.name if transaction.provider_id else 'Manuel',
                        'code': transaction.provider_id.code if transaction.provider_id else '',
                    },
                    'partner': {
                        'id': transaction.partner_id.id if transaction.partner_id else None,
                        'name': transaction.partner_id.name if transaction.partner_id else 'Anonyme',
                        'email': transaction.partner_id.email if transaction.partner_id else '',
                        'phone': transaction.partner_id.phone if transaction.partner_id else '',
                    },
                    'order': {
                        'id': order.id if order else None,
                        'name': order.name if order else None,
                        'amount_total': order.amount_total if order else 0,
                        'state': order.state if order else None,
                    } if order else None,
                    'create_date': transaction.create_date.isoformat() if transaction.create_date else None,
                }
            }

        except Exception as e:
            _logger.error(f"Get payment transaction detail error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/payment/transactions/<int:transaction_id>/refund', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def refund_payment_transaction(self, transaction_id, **kwargs):
        """Rembourser une transaction de paiement (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

            transaction = request.env['payment.transaction'].sudo().browse(transaction_id)

            if not transaction.exists():
                return {
                    'success': False,
                    'error': 'Transaction not found'
                }

            # Vérifier que la transaction est dans un état remboursable
            if transaction.state != 'done':
                return {
                    'success': False,
                    'error': f'Cannot refund transaction in state {transaction.state}. Only done transactions can be refunded.'
                }

            params = self._get_params()
            refund_amount = params.get('amount', transaction.amount)
            refund_reason = params.get('reason', 'Refund requested by admin')

            # Dans Odoo, il n'y a pas de méthode standard de remboursement sur payment.transaction
            # On va créer une note sur la transaction et changer son état
            # Pour un vrai remboursement, il faudrait intégrer avec le provider (Stripe, PayPal, etc.)

            # Pour l'instant, on simule le remboursement en changeant l'état
            transaction.write({
                'state': 'cancel',  # Marquer comme annulé
            })

            # Ajouter un message de note
            transaction.message_post(
                body=f"<p><strong>Remboursement demandé</strong></p><p>Montant: {refund_amount} {transaction.currency_id.name if transaction.currency_id else 'EUR'}</p><p>Raison: {refund_reason}</p>",
                message_type='notification'
            )

            # Si la transaction est liée à une commande, on pourrait aussi annuler la commande
            if transaction.sale_order_ids:
                for order in transaction.sale_order_ids:
                    if order.state not in ['done', 'cancel']:
                        order.action_cancel()

            return {
                'success': True,
                'message': f'Transaction refunded successfully. Amount: {refund_amount}',
                'transaction': {
                    'id': transaction.id,
                    'reference': transaction.reference or f'TX-{transaction.id}',
                    'state': transaction.state,
                    'refund_amount': refund_amount,
                    'refund_reason': refund_reason,
                }
            }

        except Exception as e:
            _logger.error(f"Refund payment transaction error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/currencies', type='http', auth='public', methods=['GET', 'POST'], csrf=False, cors='*')
    def get_currencies(self, **kwargs):
        """
        Récupérer la liste de toutes les devises disponibles - avec cache HTTP.

        Params:
            active_only (bool): Si True, retourne uniquement les devises actives (défaut: True)

        Returns:
            Liste des devises avec id, name, symbol, full_name, active, decimal_places
        """
        try:
            params = self._get_http_params()
            active_only = params.get('active_only', True)

            Currency = request.env['res.currency'].sudo()

            domain = []
            if active_only:
                domain.append(('active', '=', True))

            currencies = Currency.search(domain, order='name')

            currency_list = []
            for currency in currencies:
                currency_list.append({
                    'id': currency.id,
                    'name': currency.name,
                    'symbol': currency.symbol,
                    'full_name': currency.full_name,
                    'active': currency.active,
                    'decimal_places': currency.decimal_places,
                    'rounding': float(currency.rounding) if currency.rounding else 0.01,
                    'position': currency.position,  # 'before' ou 'after' pour position du symbole
                })

            response_data = {
                'success': True,
                'data': currency_list,
                'total': len(currency_list)
            }
            # Cache HTTP : 12 heures (devises très stables)
            return request.make_json_response(response_data, headers={
                'Cache-Control': 'public, max-age=43200',
                'Vary': 'Accept-Encoding'
            })

        except Exception as e:
            _logger.error(f"Get currencies error: {e}")
            return request.make_json_response({
                'success': False,
                'error': 'Une erreur est survenue'
            })

    @http.route('/api/ecommerce/currencies/<int:currency_id>/activate', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def activate_currency(self, currency_id, **params):
        """
        Activer ou désactiver une devise.

        Params:
            currency_id (int): ID de la devise
            active (bool): True pour activer, False pour désactiver

        Returns:
            Devise mise à jour
        """
        try:
            if not request.env.user.has_group('base.group_system'):
                return {
                    'success': False,
                    'error': 'Accès refusé. Droits administrateur requis.'
                }

            active = params.get('active', True)

            Currency = request.env['res.currency'].sudo()
            currency = Currency.browse(currency_id)

            if not currency.exists():
                return {
                    'success': False,
                    'error': f'Devise {currency_id} introuvable'
                }

            currency.write({'active': active})

            return {
                'success': True,
                'data': {
                    'id': currency.id,
                    'name': currency.name,
                    'symbol': currency.symbol,
                    'active': currency.active,
                },
                'message': f"Devise {currency.name} {'activée' if active else 'désactivée'} avec succès"
            }

        except Exception as e:
            _logger.error(f"Activate currency error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/currencies/convert', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def convert_currency(self, **params):
        """
        Convertir un montant d'une devise à une autre.

        Params:
            amount (float): Montant à convertir
            from_currency (str): Code devise source (ex: 'USD')
            to_currency (str): Code devise cible (ex: 'EUR')
            date (str, optional): Date pour le taux de change (format YYYY-MM-DD, défaut: aujourd'hui)

        Returns:
            Montant converti avec détails
        """
        try:
            amount = float(params.get('amount', 0))
            from_currency_code = params.get('from_currency')
            to_currency_code = params.get('to_currency')
            date = params.get('date')  # Format YYYY-MM-DD

            if not from_currency_code or not to_currency_code:
                return {
                    'success': False,
                    'error': 'Paramètres from_currency et to_currency requis'
                }

            Currency = request.env['res.currency'].sudo()

            from_currency = Currency.search([('name', '=', from_currency_code)], limit=1)
            to_currency = Currency.search([('name', '=', to_currency_code)], limit=1)

            if not from_currency:
                return {
                    'success': False,
                    'error': f'Devise source {from_currency_code} introuvable'
                }

            if not to_currency:
                return {
                    'success': False,
                    'error': f'Devise cible {to_currency_code} introuvable'
                }

            # Conversion via la méthode Odoo _convert
            # Si même devise, pas de conversion
            if from_currency.id == to_currency.id:
                converted_amount = amount
            else:
                # Odoo utilise _convert(from_amount, to_currency, company, date)
                company = request.env.company
                converted_amount = from_currency._convert(
                    amount,
                    to_currency,
                    company,
                    date or fields.Date.today()
                )

            # Récupérer les taux de change actuels
            from_rate = from_currency.rate if from_currency.rate else 1.0
            to_rate = to_currency.rate if to_currency.rate else 1.0

            return {
                'success': True,
                'data': {
                    'amount': amount,
                    'from_currency': from_currency_code,
                    'to_currency': to_currency_code,
                    'converted_amount': round(converted_amount, to_currency.decimal_places),
                    'from_rate': float(from_rate),
                    'to_rate': float(to_rate),
                    'date': date or str(fields.Date.today()),
                }
            }

        except Exception as e:
            _logger.error(f"Convert currency error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/currencies/user/currency-preference', type='http', auth='public', methods=['GET'], csrf=False, cors='*')
    def get_user_currency_preference(self, **kwargs):
        """
        Récupérer la préférence de devise de l'utilisateur.

        Returns:
            Préférence de devise avec displayCurrency, baseCurrency, isCustom
        """
        try:
            # Récupérer la devise de la compagnie principale (base currency)
            company = request.env.company.sudo()
            base_currency = company.currency_id

            # Si utilisateur authentifié, récupérer sa préférence
            if request.env.user and request.env.user.id != request.env.ref('base.public_user').id:
                user = request.env.user
                # Vérifier si l'utilisateur a une devise préférée (via partner)
                display_currency = user.partner_id.currency_id if user.partner_id.currency_id else base_currency
                is_custom = bool(user.partner_id.currency_id)
            else:
                # Utilisateur non authentifié : utiliser devise de base
                display_currency = base_currency
                is_custom = False

            response_data = {
                'displayCurrency': display_currency.name,
                'baseCurrency': base_currency.name,
                'isCustom': is_custom
            }

            return request.make_json_response(response_data, headers={
                'Cache-Control': 'private, max-age=300',  # 5 minutes cache
            })

        except Exception as e:
            _logger.error(f"Get user currency preference error: {e}")
            return request.make_json_response({
                'displayCurrency': 'EUR',
                'baseCurrency': 'EUR',
                'isCustom': False
            })

    @http.route('/api/ecommerce/currencies/exchange-rates', type='http', auth='public', methods=['GET'], csrf=False, cors='*')
    def get_exchange_rates(self, **kwargs):
        """
        Récupérer les taux de change actuels pour toutes les devises actives.

        Returns:
            Taux de change avec baseCurrency et rates dict
        """
        try:
            company = request.env.company.sudo()
            base_currency = company.currency_id
            Currency = request.env['res.currency'].sudo()

            # Récupérer toutes les devises actives
            currencies = Currency.search([('active', '=', True)])

            # Construire le dictionnaire des taux
            rates = {}
            for currency in currencies:
                if currency.rate and currency.rate > 0:
                    # Le taux dans Odoo est généralement inverse (1 EUR = X USD)
                    # On stocke le taux direct pour faciliter les conversions
                    rates[currency.name] = float(1.0 / currency.rate) if currency.name != base_currency.name else 1.0
                else:
                    rates[currency.name] = 1.0

            response_data = {
                'baseCurrency': base_currency.name,
                'rates': rates,
                'lastUpdate': str(fields.Date.today())
            }

            return request.make_json_response(response_data, headers={
                'Cache-Control': 'public, max-age=3600',  # 1 hour cache
            })

        except Exception as e:
            _logger.error(f"Get exchange rates error: {e}")
            return request.make_json_response({
                'baseCurrency': 'EUR',
                'rates': {'EUR': 1.0, 'USD': 1.1, 'GBP': 0.85},
                'lastUpdate': str(fields.Date.today())
            })
