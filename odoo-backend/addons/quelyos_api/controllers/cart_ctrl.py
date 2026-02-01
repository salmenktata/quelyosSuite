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


class QuelyosCartAPI(BaseController):
    """API contrôleur pour le panier, coupons et parrainage"""

    def _get_or_create_cart(self, partner_id):
        """Récupérer ou créer un panier pour le client"""
        # Chercher un panier existant (commande en brouillon sans date de commande)
        cart = request.env['sale.order'].sudo().search([
            ('partner_id', '=', partner_id),
            ('state', '=', 'draft'),
            ('date_order', '=', False),
        ], limit=1)

        # Créer un panier si inexistant
        if not cart:
            cart = request.env['sale.order'].sudo().create({
                'partner_id': partner_id,
                'state': 'draft',
            })

        return cart

    @http.route('/api/ecommerce/cart/add', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def add_to_cart(self, **kwargs):
        """Ajouter un produit au panier"""
        try:
            params = self._get_params()
            product_id = params.get('product_id')
            quantity = float(params.get('quantity', 1))

            if not product_id:
                return {
                    'success': False,
                    'error': 'Product ID is required'
                }

            # Déterminer le partner_id
            if request.session.uid:
                partner_id = request.env.user.partner_id.id
            else:
                guest_email = params.get('guest_email')
                if not guest_email:
                    return {
                        'success': False,
                        'error': 'Authentication required or guest_email needed'
                    }

                partner = request.env['res.partner'].sudo().search([
                    ('email', '=', guest_email)
                ], limit=1)

                if not partner:
                    partner = request.env['res.partner'].sudo().create({
                        'name': 'Guest',
                        'email': guest_email,
                        'customer_rank': 1,
                    })

                partner_id = partner.id

            cart = self._get_or_create_cart(partner_id)

            # Vérifier si le produit existe déjà dans le panier
            existing_line = request.env['sale.order.line'].sudo().search([
                ('order_id', '=', cart.id),
                ('product_id', '=', int(product_id))
            ], limit=1)

            if existing_line:
                # Augmenter la quantité
                existing_line.write({
                    'product_uom_qty': existing_line.product_uom_qty + quantity
                })
            else:
                # Créer une nouvelle ligne
                product = request.env['product.product'].sudo().browse(int(product_id))
                if not product.exists():
                    return {
                        'success': False,
                        'error': 'Product not found'
                    }

                request.env['sale.order.line'].sudo().create({
                    'order_id': cart.id,
                    'product_id': int(product_id),
                    'product_uom_qty': quantity,
                })

            return {
                'success': True,
                'cart': {
                    'id': cart.id,
                    'amount_total': cart.amount_total,
                    'lines_count': len(cart.order_line),
                }
            }

        except Exception as e:
            _logger.error(f"Add to cart error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/cart/update', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def update_cart_line(self, **kwargs):
        """Modifier la quantité d'une ligne du panier"""
        try:
            params = self._get_params()
            line_id = params.get('line_id')
            quantity = float(params.get('quantity', 1))

            if not line_id:
                return {
                    'success': False,
                    'error': 'Line ID is required'
                }

            line = request.env['sale.order.line'].sudo().browse(int(line_id))

            if not line.exists():
                return {
                    'success': False,
                    'error': 'Cart line not found'
                }

            # Vérifier que c'est bien le panier de l'utilisateur
            if request.session.uid:
                partner_id = request.env.user.partner_id.id
            else:
                guest_email = params.get('guest_email')
                if not guest_email:
                    return {
                        'success': False,
                        'error': 'Authentication required or guest_email needed'
                    }
                partner = request.env['res.partner'].sudo().search([
                    ('email', '=', guest_email)
                ], limit=1)
                if not partner:
                    return {
                        'success': False,
                        'error': 'Partner not found'
                    }
                partner_id = partner.id

            if line.order_id.partner_id.id != partner_id:
                return {
                    'success': False,
                    'error': 'Unauthorized'
                }

            if quantity <= 0:
                line.unlink()
            else:
                line.write({'product_uom_qty': quantity})

            return {
                'success': True,
                'cart': {
                    'id': line.order_id.id,
                    'amount_total': line.order_id.amount_total,
                    'lines_count': len(line.order_id.order_line),
                }
            }

        except Exception as e:
            _logger.error(f"Update cart error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/cart/remove/<int:line_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def remove_from_cart(self, line_id, **kwargs):
        """Supprimer une ligne du panier"""
        try:
            line = request.env['sale.order.line'].sudo().browse(line_id)

            if not line.exists():
                return {
                    'success': False,
                    'error': 'Cart line not found'
                }

            # Vérifier que c'est bien le panier de l'utilisateur
            params = self._get_params()
            if request.session.uid:
                partner_id = request.env.user.partner_id.id
            else:
                guest_email = params.get('guest_email')
                if not guest_email:
                    return {
                        'success': False,
                        'error': 'Authentication required or guest_email needed'
                    }
                partner = request.env['res.partner'].sudo().search([
                    ('email', '=', guest_email)
                ], limit=1)
                if not partner:
                    return {
                        'success': False,
                        'error': 'Partner not found'
                    }
                partner_id = partner.id

            if line.order_id.partner_id.id != partner_id:
                return {
                    'success': False,
                    'error': 'Unauthorized'
                }

            cart_id = line.order_id.id
            line.unlink()

            cart = request.env['sale.order'].sudo().browse(cart_id)

            return {
                'success': True,
                'cart': {
                    'id': cart.id,
                    'amount_total': cart.amount_total,
                    'lines_count': len(cart.order_line),
                }
            }

        except Exception as e:
            _logger.error(f"Remove from cart error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/cart/clear', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def clear_cart(self, **kwargs):
        """Vider le panier"""
        try:
            params = self._get_params()

            # Déterminer le partner_id
            if request.session.uid:
                partner_id = request.env.user.partner_id.id
            else:
                guest_email = params.get('guest_email')
                if not guest_email:
                    return {
                        'success': False,
                        'error': 'Authentication required or guest_email needed'
                    }
                partner = request.env['res.partner'].sudo().search([
                    ('email', '=', guest_email)
                ], limit=1)
                if not partner:
                    return {
                        'success': False,
                        'error': 'Partner not found'
                    }
                partner_id = partner.id

            cart = self._get_or_create_cart(partner_id)

            # Supprimer toutes les lignes
            cart.order_line.unlink()

            return {
                'success': True,
                'cart': {
                    'id': cart.id,
                    'amount_total': 0,
                    'lines_count': 0,
                }
            }

        except Exception as e:
            _logger.error(f"Clear cart error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/cart/save', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def save_cart_for_guest(self, **kwargs):
        """
        Sauvegarder le panier pour un invité (non connecté)
        Génère un token de récupération et envoie un email immédiatement

        Args:
            email (str): Email de l'invité pour sauvegarder le panier

        Returns:
            dict: {
                'success': bool,
                'message': str,
                'recovery_url': str,  # Lien de récupération
                'token': str  # Token sécurisé (pour debug)
            }
        """
        try:
            params = self._get_params()
            guest_email = params.get('email')

            if not guest_email:
                return {
                    'success': False,
                    'error': 'Email requis pour sauvegarder votre panier'
                }

            # Valider format email
            import re
            email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_regex, guest_email):
                return {
                    'success': False,
                    'error': 'Format email invalide'
                }

            _logger.info(f"Demande sauvegarde panier pour: {guest_email}")

            # Rechercher ou créer le partner
            partner = request.env['res.partner'].sudo().search([
                ('email', '=', guest_email)
            ], limit=1)

            if not partner:
                # Créer un nouveau partner invité
                partner = request.env['res.partner'].sudo().create({
                    'name': guest_email.split('@')[0].title(),
                    'email': guest_email,
                    'customer_rank': 1,
                })
                _logger.info(f"Nouveau partner créé: {partner.id} ({guest_email})")

            # Récupérer ou créer le panier
            cart = self._get_or_create_cart(partner.id)

            # Vérifier que le panier contient des produits
            if not cart.order_line:
                return {
                    'success': False,
                    'error': 'Votre panier est vide. Ajoutez des produits avant de le sauvegarder.'
                }

            # Générer un token de récupération sécurisé
            import secrets
            if not cart.recovery_token:
                cart.recovery_token = secrets.token_urlsafe(32)

            # Construire l'URL de récupération
            base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url')
            recovery_url = f"{base_url}/cart/recover?token={cart.recovery_token}"

            # Envoyer l'email de sauvegarde immédiatement
            try:
                SaleOrder = request.env['sale.order']
                sale_order_obj = SaleOrder.browse(cart.id)
                sale_order_obj.sudo()._send_abandoned_cart_email(cart)

                # Marquer la date d'envoi
                cart.recovery_email_sent_date = fields.Datetime.now()

                _logger.info(f"Email de sauvegarde panier envoyé avec succès à {guest_email}")
            except Exception as e:
                _logger.error(f"Erreur envoi email sauvegarde panier: {e}")
                # On continue même si l'email échoue, on retourne le lien

            return {
                'success': True,
                'message': f'Panier sauvegardé ! Un email avec le lien de récupération a été envoyé à {guest_email}',
                'recovery_url': recovery_url,
                'token': cart.recovery_token,
                'cart': {
                    'id': cart.id,
                    'lines_count': len(cart.order_line),
                    'amount_total': cart.amount_total,
                }
            }

        except Exception as e:
            _logger.error(f"Save cart error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/cart/abandoned', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_abandoned_carts(self, **kwargs):
        """Liste des paniers abandonnés (admin only)"""
        try:
            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            params = self._get_params()
            limit = params.get('limit', 20)
            offset = params.get('offset', 0)
            hours_threshold = params.get('hours_threshold', 24)  # Par défaut paniers > 24h

            from datetime import datetime, timedelta

            threshold_date = datetime.now() - timedelta(hours=hours_threshold)

            # Rechercher les commandes draft (paniers) non modifiées depuis X heures
            domain = [
                ('state', '=', 'draft'),
                ('write_date', '<', threshold_date.strftime('%Y-%m-%d %H:%M:%S')),
                ('order_line', '!=', False),  # Au moins une ligne
            ]

            # Filtres optionnels
            if params.get('search'):
                search = params['search']
                domain.append('|')
                domain.append(('name', 'ilike', search))
                domain.append(('partner_id.name', 'ilike', search))

            Order = request.env['sale.order'].sudo()
            total = Order.search_count(domain)
            carts = Order.search(domain, limit=limit, offset=offset, order='write_date desc')

            carts_data = []
            for cart in carts:
                # Calculer le temps depuis dernière modification
                write_date = cart.write_date
                hours_ago = (datetime.now() - write_date).total_seconds() / 3600

                carts_data.append({
                    'id': cart.id,
                    'name': cart.name,
                    'partner_id': cart.partner_id.id if cart.partner_id else None,
                    'partner_name': cart.partner_id.name if cart.partner_id else 'Invité',
                    'partner_email': cart.partner_id.email if cart.partner_id else None,
                    'write_date': write_date.isoformat() if write_date else None,
                    'hours_ago': round(hours_ago, 1),
                    'amount_total': cart.amount_total,
                    'lines_count': len(cart.order_line),
                    'items': [
                        {
                            'product_name': line.product_id.name if line.product_id else '',
                            'quantity': line.product_uom_qty,
                            'price': line.price_unit,
                        }
                        for line in cart.order_line[:3]  # Premières 3 lignes seulement
                    ]
                })

            return {
                'success': True,
                'data': {
                    'abandoned_carts': carts_data,
                    'total': total,
                    'limit': limit,
                    'offset': offset,
                }
            }

        except Exception as e:
            _logger.error(f"Get abandoned carts error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/cart/<int:cart_id>/send-reminder', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def send_cart_reminder(self, cart_id, **kwargs):
        """Envoyer un email de relance pour panier abandonné"""
        try:
            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            cart = request.env['sale.order'].sudo().browse(cart_id)

            if not cart.exists():
                return {
                    'success': False,
                    'error': 'Cart not found'
                }

            if cart.state != 'draft':
                return {
                    'success': False,
                    'error': 'Cart is not in draft state'
                }

            if not cart.partner_id or not cart.partner_id.email:
                return {
                    'success': False,
                    'error': 'No email address for this customer'
                }

            # Rechercher le template email pour panier abandonné
            # Si pas de template custom, utiliser un template générique
            template = request.env.ref('sale.email_template_edi_sale', raise_if_not_found=False)

            if template:
                template.sudo().send_mail(cart.id, force_send=True)

            # Marquer qu'un reminder a été envoyé (via note interne)
            cart.sudo().message_post(
                body=f"Email de relance panier abandonné envoyé à {cart.partner_id.email}",
                message_type='notification'
            )

            return {
                'success': True,
                'message': f'Reminder email sent to {cart.partner_id.email}'
            }

        except Exception as e:
            _logger.error(f"Send cart reminder error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/cart/recovery-stats', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_cart_recovery_stats(self, **kwargs):
        """Statistiques de récupération des paniers abandonnés"""
        try:
            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            params = self._get_params()
            period = params.get('period', '30d')  # 7d, 30d, 12m

            from datetime import datetime, timedelta
            from dateutil.relativedelta import relativedelta

            today = datetime.now()

            if period == '7d':
                start_date = today - timedelta(days=7)
            elif period == '30d':
                start_date = today - timedelta(days=30)
            elif period == '12m':
                start_date = today - relativedelta(months=12)
            else:
                start_date = today - timedelta(days=30)

            Order = request.env['sale.order'].sudo()

            # Paniers abandonnés (draft > 24h)
            threshold_24h = today - timedelta(hours=24)
            abandoned_domain = [
                ('state', '=', 'draft'),
                ('write_date', '<', threshold_24h.strftime('%Y-%m-%d %H:%M:%S')),
                ('write_date', '>=', start_date.strftime('%Y-%m-%d')),
                ('order_line', '!=', False),
            ]
            abandoned_count = Order.search_count(abandoned_domain)
            abandoned_carts = Order.search(abandoned_domain)
            abandoned_value = sum(abandoned_carts.mapped('amount_total'))

            # Paniers récupérés (commandes confirmées issues de paniers qui étaient abandonnés)
            # Note : Cette logique est simplifiée, dans un vrai système il faudrait tracker
            # les relances envoyées et les conversions
            recovered_domain = [
                ('state', 'in', ['sale', 'done']),
                ('date_order', '>=', start_date.strftime('%Y-%m-%d')),
            ]
            recovered_count = Order.search_count(recovered_domain)
            recovered_orders = Order.search(recovered_domain)
            recovered_value = sum(recovered_orders.mapped('amount_total'))

            # Taux de récupération (approximatif)
            recovery_rate = 0
            if abandoned_count > 0:
                recovery_rate = round((recovered_count / (abandoned_count + recovered_count)) * 100, 1)

            return {
                'success': True,
                'data': {
                    'period': period,
                    'abandoned_count': abandoned_count,
                    'abandoned_value': abandoned_value,
                    'recovered_count': recovered_count,
                    'recovered_value': recovered_value,
                    'recovery_rate': recovery_rate,
                }
            }

        except Exception as e:
            _logger.error(f"Get cart recovery stats error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/coupons', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_coupons_list(self, **kwargs):
        """Liste des coupons (admin uniquement)"""
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            params = self._get_params()
            limit = int(params.get('limit', 20))
            offset = int(params.get('offset', 0))
            active_only = params.get('active_only', False)

            # Chercher les programmes de coupons/loyalty
            domain = []
            if active_only:
                domain.append(('active', '=', True))

            # Utiliser le modèle loyalty.program (Odoo 19)
            coupons = request.env['loyalty.program'].sudo().search(
                domain,
                limit=limit,
                offset=offset,
                order='create_date desc'
            )

            total = request.env['loyalty.program'].sudo().search_count(domain)

            data = []
            for c in coupons:
                coupon_data = {
                    'id': c.id,
                    'name': c.name,
                    'active': c.active,
                    'program_type': c.program_type,
                    'trigger': c.trigger,
                    'applies_on': c.applies_on,
                    'date_from': c.date_from.isoformat() if c.date_from else None,
                    'date_to': c.date_to.isoformat() if c.date_to else None,
                    'limit_usage': c.limit_usage if hasattr(c, 'limit_usage') else False,
                    'max_usage': c.max_usage if hasattr(c, 'max_usage') else 0,
                }

                # Ajouter les règles de récompense
                if c.reward_ids:
                    reward = c.reward_ids[0]
                    coupon_data['reward'] = {
                        'reward_type': reward.reward_type,
                        'discount': reward.discount if hasattr(reward, 'discount') else 0,
                        'discount_mode': reward.discount_mode if hasattr(reward, 'discount_mode') else 'percent',
                    }

                data.append(coupon_data)

            return {
                'success': True,
                'data': {
                    'coupons': data,
                    'total': total,
                    'limit': limit,
                    'offset': offset,
                }
            }

        except Exception as e:
            _logger.error(f"Get coupons error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/coupons/create', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def create_coupon(self, **kwargs):
        """Créer coupon (ADMIN UNIQUEMENT)
        PROTECTION: Marketing User minimum requis
        """
        try:
            # Vérifier permissions Marketing User minimum
            error = self._check_any_group('group_quelyos_marketing_user', 'group_quelyos_marketing_manager')
            if error:
                return error

            params = self._get_params()
            name = params.get('name')
            code = params.get('code')
            discount_type = params.get('discount_type', 'percent')  # percent ou fixed
            discount_value = float(params.get('discount_value', 0))
            date_from = params.get('date_from')
            date_to = params.get('date_to')
            max_usage = int(params.get('max_usage', 0))

            if not name:
                return {
                    'success': False,
                    'error': 'Coupon name is required'
                }

            # Créer le programme de fidélité/coupon
            program_vals = {
                'name': name,
                'program_type': 'coupons',
                'trigger': 'with_code',
                'applies_on': 'current',
                'active': True,
            }

            if date_from:
                program_vals['date_from'] = date_from
            if date_to:
                program_vals['date_to'] = date_to

            program = request.env['loyalty.program'].sudo().create(program_vals)

            # Créer la règle de récompense
            reward_vals = {
                'program_id': program.id,
                'reward_type': 'discount',
                'discount_mode': discount_type,
            }

            if discount_type == 'percent':
                reward_vals['discount'] = discount_value
            else:
                reward_vals['discount_fixed_amount'] = discount_value

            request.env['loyalty.reward'].sudo().create(reward_vals)

            # Si un code est fourni, créer un coupon code
            if code:
                request.env['loyalty.card'].sudo().create({
                    'program_id': program.id,
                    'code': code,
                })

            return {
                'success': True,
                'coupon': {
                    'id': program.id,
                    'name': program.name,
                    'code': code,
                    'discount_type': discount_type,
                    'discount_value': discount_value,
                }
            }

        except Exception as e:
            _logger.error(f"Create coupon error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/coupons/<int:coupon_id>', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def get_coupon_detail(self, coupon_id, **kwargs):
        """Détail coupon (ADMIN UNIQUEMENT)
        PROTECTION: Marketing User minimum requis
        """
        try:
            # Vérifier permissions Marketing User minimum
            error = self._check_any_group('group_quelyos_marketing_user', 'group_quelyos_marketing_manager')
            if error:
                return error

            program = request.env['loyalty.program'].sudo().browse(coupon_id)
            if not program.exists():
                return {
                    'success': False,
                    'error': 'Coupon not found'
                }

            reward = program.reward_ids[0] if program.reward_ids else None
            codes = program.coupon_ids.mapped('code')

            return {
                'success': True,
                'coupon': {
                    'id': program.id,
                    'name': program.name,
                    'program_type': program.program_type,
                    'trigger': program.trigger,
                    'active': program.active,
                    'date_from': program.date_from.isoformat() if program.date_from else None,
                    'date_to': program.date_to.isoformat() if program.date_to else None,
                    'codes': codes,
                    'reward': {
                        'id': reward.id if reward else None,
                        'discount': reward.discount if reward else 0,
                        'discount_mode': reward.discount_mode if reward else 'percent',
                        'discount_fixed_amount': reward.discount_fixed_amount if reward else 0,
                    } if reward else None,
                }
            }

        except Exception as e:
            _logger.error(f"Get coupon detail error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/coupons/<int:coupon_id>/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def update_coupon(self, coupon_id, **kwargs):
        """Mettre à jour coupon (ADMIN UNIQUEMENT)
        PROTECTION: Marketing User minimum requis
        """
        try:
            # Vérifier permissions Marketing User minimum
            error = self._check_any_group('group_quelyos_marketing_user', 'group_quelyos_marketing_manager')
            if error:
                return error

            program = request.env['loyalty.program'].sudo().browse(coupon_id)
            if not program.exists():
                return {
                    'success': False,
                    'error': 'Coupon not found'
                }

            params = self._get_params()

            # Mise à jour des champs du programme
            update_vals = {}
            if 'name' in params:
                update_vals['name'] = params['name']
            if 'active' in params:
                update_vals['active'] = params['active']
            if 'date_from' in params:
                update_vals['date_from'] = params['date_from'] if params['date_from'] else False
            if 'date_to' in params:
                update_vals['date_to'] = params['date_to'] if params['date_to'] else False

            if update_vals:
                program.write(update_vals)

            # Mise à jour de la récompense si fournie
            if 'discount_type' in params or 'discount_value' in params:
                reward = program.reward_ids[0] if program.reward_ids else None
                if reward:
                    reward_vals = {}
                    discount_type = params.get('discount_type', reward.discount_mode)
                    discount_value = float(params.get('discount_value', reward.discount or reward.discount_fixed_amount))

                    reward_vals['discount_mode'] = discount_type
                    if discount_type == 'percent':
                        reward_vals['discount'] = discount_value
                        reward_vals['discount_fixed_amount'] = 0
                    else:
                        reward_vals['discount'] = 0
                        reward_vals['discount_fixed_amount'] = discount_value

                    reward.write(reward_vals)

            return {
                'success': True,
                'coupon': {
                    'id': program.id,
                    'name': program.name,
                    'active': program.active,
                },
                'message': 'Coupon mis à jour avec succès'
            }

        except Exception as e:
            _logger.error(f"Update coupon error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/coupons/<int:coupon_id>/delete', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def delete_coupon(self, coupon_id, **kwargs):
        """Supprimer coupon (ADMIN UNIQUEMENT)
        PROTECTION: Marketing User minimum requis
        """
        try:
            # Vérifier permissions Marketing User minimum
            error = self._check_any_group('group_quelyos_marketing_user', 'group_quelyos_marketing_manager')
            if error:
                return error

            program = request.env['loyalty.program'].sudo().browse(coupon_id)
            if not program.exists():
                return {
                    'success': False,
                    'error': 'Coupon not found'
                }

            coupon_name = program.name
            program.unlink()

            return {
                'success': True,
                'message': f'Coupon "{coupon_name}" supprimé avec succès'
            }

        except Exception as e:
            _logger.error(f"Delete coupon error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/cart/coupon/apply', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def apply_coupon_to_cart(self, **kwargs):
        """Appliquer un code promo au panier"""
        try:
            params = self._get_params()
            code = params.get('code')

            if not code:
                return {
                    'success': False,
                    'error': 'Coupon code is required'
                }

            # Déterminer le partner_id
            if request.session.uid:
                partner_id = request.env.user.partner_id.id
            else:
                guest_email = params.get('guest_email')
                if not guest_email:
                    return {
                        'success': False,
                        'error': 'Authentication required or guest_email needed'
                    }
                partner = request.env['res.partner'].sudo().search([
                    ('email', '=', guest_email)
                ], limit=1)
                if not partner:
                    return {
                        'success': False,
                        'error': 'Partner not found'
                    }
                partner_id = partner.id

            # Récupérer le panier
            cart = self._get_or_create_cart(partner_id)

            # Chercher le coupon par code
            coupon_card = request.env['loyalty.card'].sudo().search([
                ('code', '=', code)
            ], limit=1)

            if not coupon_card:
                return {
                    'success': False,
                    'error': 'Invalid coupon code'
                }

            program = coupon_card.program_id

            # Vérifier si le programme est actif
            if not program.active:
                return {
                    'success': False,
                    'error': 'Coupon is not active'
                }

            # Vérifier les dates de validité
            from datetime import datetime
            now = datetime.now()
            if program.date_from and program.date_from > now:
                return {
                    'success': False,
                    'error': 'Coupon is not yet valid'
                }
            if program.date_to and program.date_to < now:
                return {
                    'success': False,
                    'error': 'Coupon has expired'
                }

            # Appliquer le coupon à la commande
            # On stocke le coupon_id dans un champ personnalisé ou on l'applique directement
            cart.write({
                'pricelist_id': program.pricelist_id.id if program.pricelist_id else cart.pricelist_id.id,
            })

            # Calculer la réduction
            discount_amount = 0
            if program.reward_ids:
                reward = program.reward_ids[0]
                if reward.discount_mode == 'percent':
                    discount_amount = cart.amount_total * (reward.discount / 100)
                elif hasattr(reward, 'discount_fixed_amount'):
                    discount_amount = reward.discount_fixed_amount

            return {
                'success': True,
                'message': 'Coupon applied successfully',
                'cart': {
                    'id': cart.id,
                    'amount_total': cart.amount_total,
                    'discount_amount': discount_amount,
                    'coupon_code': code,
                }
            }

        except Exception as e:
            _logger.error(f"Apply coupon error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/cart/coupon/remove', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def remove_coupon_from_cart(self, **kwargs):
        """Retirer un code promo du panier"""
        try:
            params = self._get_params()

            # Déterminer le partner_id
            if request.session.uid:
                partner_id = request.env.user.partner_id.id
            else:
                guest_email = params.get('guest_email')
                if not guest_email:
                    return {
                        'success': False,
                        'error': 'Authentication required or guest_email needed'
                    }
                partner = request.env['res.partner'].sudo().search([
                    ('email', '=', guest_email)
                ], limit=1)
                if not partner:
                    return {
                        'success': False,
                        'error': 'Partner not found'
                    }
                partner_id = partner.id

            # Récupérer le panier
            cart = self._get_or_create_cart(partner_id)

            # Réinitialiser la pricelist par défaut
            default_pricelist = request.env['product.pricelist'].sudo().search([
                ('currency_id', '=', cart.currency_id.id)
            ], limit=1)

            if default_pricelist:
                cart.write({'pricelist_id': default_pricelist.id})

            return {
                'success': True,
                'message': 'Coupon removed successfully',
                'cart': {
                    'id': cart.id,
                    'amount_total': cart.amount_total,
                }
            }

        except Exception as e:
            _logger.error(f"Remove coupon error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/referral/info', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def get_referral_info(self, **kwargs):
        """
        Récupérer les informations de parrainage de l'utilisateur connecté
        """
        try:
            user = request.env.user
            if not user or user._is_public():
                return {'success': False, 'error': 'Authentification requise'}

            partner = user.partner_id
            if not partner:
                return {'success': False, 'error': 'Profil utilisateur introuvable'}

            # Générer ou récupérer le code de parrainage
            referral_code = partner.ref or self._generate_referral_code(partner)

            # Compter les filleuls (partenaires référés par cet utilisateur)
            referred_count = request.env['res.partner'].sudo().search_count([
                ('referred_by', '=', partner.id)
            ])

            # Calculer les récompenses gagnées
            # Rechercher les commandes des filleuls
            referred_partners = request.env['res.partner'].sudo().search([
                ('referred_by', '=', partner.id)
            ])
            referred_orders = request.env['sale.order'].sudo().search([
                ('partner_id', 'in', referred_partners.ids),
                ('state', 'in', ['sale', 'done'])
            ])
            total_referred_amount = sum(referred_orders.mapped('amount_total'))
            earned_rewards = round(total_referred_amount * 0.05, 2)  # 5% de récompense

            return {
                'success': True,
                'data': {
                    'referral_code': referral_code,
                    'referral_link': f'{request.httprequest.host_url}?ref={referral_code}',
                    'referred_count': referred_count,
                    'successful_referrals': len(referred_orders),
                    'pending_referrals': referred_count - len(set(referred_orders.mapped('partner_id').ids)),
                    'earned_rewards': earned_rewards,
                    'reward_rate': 5,  # 5%
                    'rewards': {
                        'referrer': '10% de réduction + 5% sur les achats du filleul',
                        'referee': '15% de réduction sur la première commande',
                    }
                }
            }
        except Exception as e:
            _logger.error(f"Get referral info error: {e}", exc_info=True)
            return {'success': False, 'error': 'Une erreur est survenue'}

    def _generate_referral_code(self, partner):
        """Génère un code de parrainage unique pour un partenaire"""
        import hashlib
        base = f"{partner.id}-{partner.create_date}"
        code = hashlib.md5(base.encode()).hexdigest()[:8].upper()
        partner.sudo().write({'ref': code})
        return code

    @http.route('/api/ecommerce/referral/apply', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def apply_referral_code(self, **kwargs):
        """
        Appliquer un code de parrainage lors de l'inscription
        """
        try:
            params = self._get_params()
            code = params.get('code', '').strip().upper()

            if not code:
                return {'success': False, 'error': 'Code de parrainage requis'}

            # Trouver le parrain
            referrer = request.env['res.partner'].sudo().search([
                ('ref', '=', code)
            ], limit=1)

            if not referrer:
                return {'success': False, 'error': 'Code de parrainage invalide'}

            return {
                'success': True,
                'data': {
                    'referrer_name': referrer.name.split()[0] if referrer.name else 'Un ami',
                    'discount': '15%',
                    'message': f'Code valide ! Vous bénéficierez de 15% de réduction sur votre première commande.'
                }
            }
        except Exception as e:
            _logger.error(f"Apply referral code error: {e}", exc_info=True)
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/referral/register-with-code', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def register_with_referral(self, **kwargs):
        """
        Enregistrer un lien de parrainage lors de l'inscription
        """
        try:
            params = self._get_params()
            code = params.get('referral_code', '').strip().upper()
            new_partner_id = params.get('partner_id')

            if not code or not new_partner_id:
                return {'success': False, 'error': 'Paramètres manquants'}

            # Trouver le parrain
            referrer = request.env['res.partner'].sudo().search([
                ('ref', '=', code)
            ], limit=1)

            if not referrer:
                return {'success': True, 'data': {'linked': False}}

            # Lier le filleul au parrain
            new_partner = request.env['res.partner'].sudo().browse(int(new_partner_id))
            if new_partner.exists() and not new_partner.referred_by:
                new_partner.write({'referred_by': referrer.id})

            return {
                'success': True,
                'data': {
                    'linked': True,
                    'referrer_name': referrer.name.split()[0] if referrer.name else 'Votre parrain'
                }
            }
        except Exception as e:
            _logger.error(f"Register with referral error: {e}", exc_info=True)
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/cart/recover', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def recover_abandoned_cart(self, token, **kwargs):
        """
        Récupérer un panier abandonné via le token sécurisé envoyé par email

        Args:
            token (str): Token de récupération sécurisé

        Returns:
            dict: {
                'success': bool,
                'cart': {...},  # Détails du panier si trouvé
                'error': str    # Message d'erreur si échec
            }
        """
        try:
            _logger.info(f"Tentative de récupération panier avec token: {token[:10]}...")

            # Rechercher le panier avec ce token
            order = request.env['sale.order'].sudo().search([
                ('recovery_token', '=', token),
                ('state', '=', 'draft'),  # Seulement les paniers non confirmés
            ], limit=1)

            if not order:
                _logger.warning(f"Aucun panier trouvé avec le token: {token[:10]}")
                return {
                    'success': False,
                    'error': 'Panier non trouvé ou déjà confirmé'
                }

            # Vérifier que le token n'est pas expiré (7 jours max)
            from datetime import datetime, timedelta
            if order.recovery_email_sent_date:
                expiry_date = order.recovery_email_sent_date + timedelta(days=7)
                if datetime.now() > expiry_date:
                    _logger.warning(f"Token expiré pour le panier #{order.id}")
                    return {
                        'success': False,
                        'error': 'Le lien de récupération a expiré. Veuillez créer un nouveau panier.'
                    }

            # Formater les lignes de commande
            lines = []
            for line in order.order_line:
                product = line.product_id

                # Image du produit
                image_url = f'/web/image/product.product/{product.id}/image_512' if product.image_128 else None

                lines.append({
                    'id': line.id,
                    'product_id': product.id,
                    'product_name': product.name,
                    'product_sku': product.default_code or '',
                    'product_image': image_url,
                    'quantity': line.product_uom_qty,
                    'price_unit': line.price_unit,
                    'price_subtotal': line.price_subtotal,
                    'price_total': line.price_total,
                })

            # Retourner les détails du panier
            cart_data = {
                'id': order.id,
                'name': order.name,
                'partner_id': order.partner_id.id,
                'partner_name': order.partner_id.name,
                'partner_email': order.partner_id.email,
                'date_order': order.date_order.isoformat() if order.date_order else None,
                'create_date': order.create_date.isoformat() if order.create_date else None,
                'amount_untaxed': order.amount_untaxed,
                'amount_tax': order.amount_tax,
                'amount_total': order.amount_total,
                'currency': {
                    'id': order.currency_id.id,
                    'name': order.currency_id.name,
                    'symbol': order.currency_id.symbol,
                },
                'state': order.state,
                'lines': lines,
                'lines_count': len(lines),
            }

            _logger.info(f"Panier #{order.id} récupéré avec succès ({len(lines)} produits)")

            return {
                'success': True,
                'cart': cart_data,
                'message': f'Panier récupéré avec succès ! {len(lines)} produit(s) vous attendent.'
            }

        except Exception as e:
            _logger.error(f"Cart recovery error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/cart', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_cart(self, **kwargs):
        """Récupérer le panier du client"""
        try:
            # Pour les utilisateurs connectés
            if request.session.uid:
                partner_id = request.env.user.partner_id.id
            else:
                # Pour les invités, créer un partenaire temporaire si nécessaire
                params = self._get_params()
                guest_email = params.get('guest_email')

                if guest_email:
                    # Chercher ou créer un partenaire invité
                    partner = request.env['res.partner'].sudo().search([
                        ('email', '=', guest_email),
                        ('customer_rank', '>', 0)
                    ], limit=1)

                    if not partner:
                        partner = request.env['res.partner'].sudo().create({
                            'name': 'Guest',
                            'email': guest_email,
                            'customer_rank': 1,
                        })

                    partner_id = partner.id
                else:
                    return {
                        'success': False,
                        'error': 'Authentication required or guest_email needed'
                    }

            cart = self._get_or_create_cart(partner_id)

            lines = [{
                'id': line.id,
                'product': {
                    'id': line.product_id.id,
                    'name': line.product_id.name,
                    'image': f'/web/image/product.product/{line.product_id.id}/image_128',
                },
                'quantity': line.product_uom_qty,
                'price_unit': line.price_unit,
                'price_subtotal': line.price_subtotal,
                'price_total': line.price_total,
            } for line in cart.order_line]

            return {
                'success': True,
                'cart': {
                    'id': cart.id,
                    'lines': lines,
                    'amount_untaxed': cart.amount_untaxed,
                    'amount_tax': cart.amount_tax,
                    'amount_total': cart.amount_total,
                    'lines_count': len(cart.order_line),
                }
            }

        except Exception as e:
            _logger.error(f"Get cart error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }
