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


class QuelyosOrdersAPI(BaseController):
    """API contrôleur pour les commandes, factures et livraisons"""

    @http.route('/api/ecommerce/orders', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_orders_list(self, **kwargs):
        """Liste des commandes (admin uniquement)"""
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
            status = params.get('status')  # draft, sent, sale, done, cancel
            search = params.get('search')  # recherche par nom commande ou client
            date_from = params.get('date_from')  # date debut (YYYY-MM-DD)
            date_to = params.get('date_to')  # date fin (YYYY-MM-DD)

            domain = []
            if status:
                domain.append(('state', '=', status))

            if search:
                domain.append('|')
                domain.append(('name', 'ilike', search))
                domain.append(('partner_id.name', 'ilike', search))

            if date_from:
                domain.append(('date_order', '>=', date_from))
            if date_to:
                domain.append(('date_order', '<=', date_to + ' 23:59:59'))

            orders = request.env['sale.order'].sudo().search(
                domain,
                limit=limit,
                offset=offset,
                order='date_order desc'
            )

            total = request.env['sale.order'].sudo().search_count(domain)

            data = [{
                'id': o.id,
                'name': o.name,
                'date_order': o.date_order.isoformat() if o.date_order else None,
                'state': o.state,
                'amount_total': o.amount_total,
                'customer': {
                    'id': o.partner_id.id,
                    'name': o.partner_id.name,
                    'email': o.partner_id.email or '',
                } if o.partner_id else None,
            } for o in orders]

            return {
                'success': True,
                'data': {
                    'orders': data,
                    'total': total,
                    'limit': limit,
                    'offset': offset,
                }
            }

        except Exception as e:
            _logger.error(f"Get orders error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/orders/<int:order_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_order_detail(self, order_id, **kwargs):
        """Détail d'une commande"""
        try:
            # Vérifier la session
            session_check = self._check_session()
            if session_check:
                return session_check

            order = request.env['sale.order'].sudo().browse(order_id)

            if not order.exists():
                return {
                    'success': False,
                    'error': 'Order not found'
                }

            # Vérifier les permissions : admin ou propriétaire
            is_admin = request.env.user.has_group('base.group_system')
            is_owner = order.partner_id.id == request.env.user.partner_id.id

            if not is_admin and not is_owner:
                return {
                    'success': False,
                    'error': 'Insufficient permissions'
                }

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
            } for line in order.order_line]

            data = {
                'id': order.id,
                'name': order.name,
                'date_order': order.date_order.isoformat() if order.date_order else None,
                'state': order.state,
                'amount_untaxed': order.amount_untaxed,
                'amount_tax': order.amount_tax,
                'amount_total': order.amount_total,
                'customer': {
                    'id': order.partner_id.id,
                    'name': order.partner_id.name,
                    'email': order.partner_id.email or '',
                    'phone': order.partner_id.phone or '',
                    'street': order.partner_id.street or '',
                    'city': order.partner_id.city or '',
                    'zip': order.partner_id.zip or '',
                    'country': order.partner_id.country_id.name if order.partner_id.country_id else '',
                } if order.partner_id else None,
                'lines': lines,
            }

            return {
                'success': True,
                'order': data
            }

        except Exception as e:
            _logger.error(f"Get order error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/orders/create', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def create_order(self, **kwargs):
        """Créer une commande depuis le panier"""
        # Rate limiting: 20 créations de commandes/min par IP
        rate_error = check_rate_limit(request, RateLimitConfig.CHECKOUT, 'create_order')
        if rate_error:
            return rate_error
        try:
            params = self._get_params()
            partner_id = params.get('partner_id') or request.env.user.partner_id.id

            # Créer la commande
            order_data = {
                'partner_id': int(partner_id),
                'state': 'draft',
            }

            order = request.env['sale.order'].sudo().create(order_data)

            # Ajouter les lignes de commande si fournies
            lines = params.get('lines', [])
            for line in lines:
                request.env['sale.order.line'].sudo().create({
                    'order_id': order.id,
                    'product_id': int(line['product_id']),
                    'product_uom_qty': float(line['quantity']),
                    'price_unit': float(line.get('price_unit', 0)),
                })

            # Confirmer la commande si demandé
            if params.get('confirm', False):
                order.action_confirm()

            return {
                'success': True,
                'order': {
                    'id': order.id,
                    'name': order.name,
                    'state': order.state,
                    'amount_total': order.amount_total,
                }
            }

        except Exception as e:
            _logger.error(f"Create order error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/orders/<int:order_id>/status', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def update_order_status(self, order_id, **kwargs):
        """Changer le statut d'une commande (admin uniquement)"""
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            order = request.env['sale.order'].sudo().browse(order_id)

            if not order.exists():
                return {
                    'success': False,
                    'error': 'Order not found'
                }

            params = self._get_params()
            action = params.get('action')  # confirm, cancel, done

            if action == 'confirm':
                order.action_confirm()
            elif action == 'cancel':
                order.action_cancel()
            elif action == 'done':
                order.action_done()
            else:
                return {
                    'success': False,
                    'error': 'Invalid action. Use: confirm, cancel, or done'
                }

            return {
                'success': True,
                'order': {
                    'id': order.id,
                    'name': order.name,
                    'state': order.state,
                }
            }

        except Exception as e:
            _logger.error(f"Update order status error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/orders/<int:order_id>/tracking', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_order_tracking(self, order_id, **kwargs):
        """Récupérer les informations de suivi d'une commande"""
        try:
            order = request.env['sale.order'].sudo().browse(order_id)

            if not order.exists():
                return {'success': False, 'error': 'Order not found'}

            # Récupérer le picking (bon de livraison) de la commande
            picking = order.picking_ids.filtered(lambda p: p.state == 'done')[:1]

            if not picking:
                return {
                    'success': True,
                    'data': {
                        'status': 'no_tracking',
                        'message': 'Aucun suivi disponible pour cette commande',
                    }
                }

            tracking_ref = picking.carrier_tracking_ref
            carrier = picking.carrier_id

            if not tracking_ref or not carrier:
                return {
                    'success': True,
                    'data': {
                        'status': 'no_tracking',
                        'message': 'Numéro de suivi non disponible',
                    }
                }

            # Déterminer le transporteur et construire l'URL de suivi
            tracking_url = None
            carrier_name = carrier.name.lower()

            if 'colissimo' in carrier_name:
                tracking_url = f'https://www.laposte.fr/outils/suivre-vos-envois?code={tracking_ref}'
            elif 'mondial' in carrier_name or 'relay' in carrier_name:
                tracking_url = f'https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition={tracking_ref}'
            elif 'chronopost' in carrier_name:
                tracking_url = f'https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT={tracking_ref}'
            elif 'ups' in carrier_name:
                tracking_url = f'https://www.ups.com/track?tracknum={tracking_ref}'
            elif 'dhl' in carrier_name:
                tracking_url = f'https://www.dhl.com/fr-fr/home/tracking.html?tracking-id={tracking_ref}'
            elif 'fedex' in carrier_name:
                tracking_url = f'https://www.fedex.com/fedextrack/?trknbr={tracking_ref}'

            return {
                'success': True,
                'data': {
                    'status': 'tracked',
                    'tracking_ref': tracking_ref,
                    'carrier_name': carrier.name,
                    'carrier_code': carrier_name,
                    'tracking_url': tracking_url,
                    'shipment_date': picking.date_done.strftime('%Y-%m-%d %H:%M:%S') if picking.date_done else None,
                }
            }

        except Exception as e:
            _logger.error(f"Get order tracking error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/orders/<int:order_id>/tracking/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def update_order_tracking(self, order_id, **kwargs):
        """Mettre à jour le numéro de tracking d'une commande (ADMIN UNIQUEMENT)"""
        # SECURITE : Vérifier droits admin
        error = self._require_admin()
        if error:
            return error

        try:
            order = request.env['sale.order'].sudo().browse(order_id)

            if not order.exists():
                return {
                    'success': False,
                    'error': 'Order not found'
                }

            params = self._get_params()
            picking_id = params.get('picking_id')
            tracking_ref = params.get('tracking_ref', '')
            carrier_id = params.get('carrier_id')

            if not picking_id:
                return {
                    'success': False,
                    'error': 'picking_id is required'
                }

            picking = request.env['stock.picking'].sudo().browse(picking_id)

            if not picking.exists():
                return {
                    'success': False,
                    'error': 'Picking not found'
                }

            # Vérifier que le picking appartient bien à cette commande
            if picking.sale_id.id != order_id:
                return {
                    'success': False,
                    'error': 'Picking does not belong to this order'
                }

            # Mettre à jour le tracking
            picking.write({
                'carrier_tracking_ref': tracking_ref,
                'carrier_id': carrier_id if carrier_id else picking.carrier_id.id,
            })

            return {
                'success': True,
                'message': 'Tracking information updated successfully',
                'data': {
                    'picking_id': picking.id,
                    'picking_name': picking.name,
                    'carrier_tracking_ref': picking.carrier_tracking_ref or '',
                    'carrier_tracking_url': picking.carrier_tracking_url or '',
                }
            }

        except Exception as e:
            _logger.error(f"Update order tracking error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/orders/<int:order_id>/history', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_order_history(self, order_id, **kwargs):
        """Obtenir l'historique des modifications d'une commande (admin uniquement)"""
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            order = request.env['sale.order'].sudo().browse(order_id)

            if not order.exists():
                return {
                    'success': False,
                    'error': 'Order not found'
                }

            # Récupérer les messages liés à cette commande
            messages = request.env['mail.message'].sudo().search([
                ('model', '=', 'sale.order'),
                ('res_id', '=', order_id),
            ], order='date desc')

            history = []
            for msg in messages:
                # Filtrer les messages importants (changements d'état, notes, activités)
                if msg.message_type in ['notification', 'comment'] or msg.subtype_id:
                    history.append({
                        'id': msg.id,
                        'date': msg.date.isoformat() if msg.date else None,
                        'author': msg.author_id.name if msg.author_id else 'Système',
                        'body': msg.body or '',
                        'message_type': msg.message_type,
                        'subtype': msg.subtype_id.name if msg.subtype_id else None,
                        'tracking_values': [
                            {
                                'field': tracking.field,
                                'field_desc': tracking.field_desc,
                                'old_value': tracking.old_value_char or tracking.old_value_text or str(tracking.old_value_integer) if tracking.old_value_integer else tracking.old_value_float or '',
                                'new_value': tracking.new_value_char or tracking.new_value_text or str(tracking.new_value_integer) if tracking.new_value_integer else tracking.new_value_float or '',
                            }
                            for tracking in msg.tracking_value_ids
                        ] if msg.tracking_value_ids else []
                    })

            return {
                'success': True,
                'data': {
                    'history': history,
                    'total': len(history),
                }
            }

        except Exception as e:
            _logger.error(f"Get order history error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/orders/<int:order_id>/delivery-slip/pdf', type='http', auth='public', methods=['GET'], csrf=False)
    def get_delivery_slip_pdf(self, order_id, **kwargs):
        """Télécharger le bon de livraison PDF d'une commande (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            if not request.env.user.has_group('base.group_system'):
                return request.make_response(
                    json.dumps({'error': 'Insufficient permissions'}),
                    headers=[('Content-Type', 'application/json')]
                )

            order = request.env['sale.order'].sudo().browse(order_id)

            if not order.exists():
                return request.make_response(
                    json.dumps({'error': 'Order not found'}),
                    headers=[('Content-Type', 'application/json')]
                )

            # Récupérer les pickings (bons de livraison) de la commande
            pickings = order.picking_ids.filtered(lambda p: p.state in ['assigned', 'done'])

            if not pickings:
                return request.make_response(
                    json.dumps({'error': 'No delivery order found for this sale order'}),
                    headers=[('Content-Type', 'application/json')]
                )

            # Utiliser le premier picking (ou le dernier livré)
            picking = pickings.filtered(lambda p: p.state == 'done')[:1] or pickings[:1]

            # Générer le PDF avec le rapport Odoo standard
            # Le rapport 'stock.report_deliveryslip' est le rapport standard de bon de livraison
            report = request.env.ref('stock.action_report_delivery')
            pdf_content, _ = report.sudo()._render_qweb_pdf(picking.ids)

            # Nom du fichier
            filename = f"bon_livraison_{order.name.replace('/', '_')}.pdf"

            pdfhttpheaders = [
                ('Content-Type', 'application/pdf'),
                ('Content-Length', len(pdf_content)),
                ('Content-Disposition', f'attachment; filename="{filename}"')
            ]

            return request.make_response(pdf_content, headers=pdfhttpheaders)

        except Exception as e:
            _logger.error(f"Get delivery slip PDF error: {e}")
            return request.make_response(
                json.dumps({'error': 'Une erreur est survenue'}),
                headers=[('Content-Type', 'application/json')]
            )

    @http.route('/api/ecommerce/orders/<int:order_id>/send-quotation', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def send_quotation_email(self, order_id, **kwargs):
        """Envoyer le devis par email au client"""
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            order = request.env['sale.order'].sudo().browse(order_id)

            if not order.exists():
                return {
                    'success': False,
                    'error': 'Order not found'
                }

            # Vérifier que la commande est en état approprié
            if order.state not in ['draft', 'sent']:
                return {
                    'success': False,
                    'error': 'Can only send quotation for draft or sent orders'
                }

            # Utiliser la méthode Odoo pour envoyer le devis
            order.action_quotation_send()

            # Mettre à jour l'état si nécessaire
            if order.state == 'draft':
                order.write({'state': 'sent'})

            return {
                'success': True,
                'message': 'Quotation sent successfully',
                'order': {
                    'id': order.id,
                    'name': order.name,
                    'state': order.state,
                }
            }

        except Exception as e:
            _logger.error(f"Send quotation error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/orders/<int:order_id>/create-invoice', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def create_invoice_from_order(self, order_id, **kwargs):
        """Creer une facture depuis une commande (ADMIN UNIQUEMENT)"""
        # SECURITE : Vérifier droits admin
        error = self._require_admin()
        if error:
            return error

        try:
            order = request.env['sale.order'].sudo().browse(order_id)
            if not order.exists():
                return {'success': False, 'error': 'Order not found'}

            if order.state not in ['sale', 'done']:
                return {'success': False, 'error': 'Order must be confirmed before invoicing'}

            existing = order.invoice_ids.filtered(lambda i: i.state != 'cancel')
            if existing:
                return {'success': False, 'error': 'Order already has invoices', 'invoice_ids': existing.ids}

            invoice = order._create_invoices()
            return {
                'success': True,
                'invoice': {'id': invoice.id, 'name': invoice.name or 'Brouillon', 'amount_total': invoice.amount_total},
                'message': 'Invoice created successfully'
            }
        except Exception as e:
            _logger.error(f"Create invoice error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/orders/<int:order_id>/unlock', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def unlock_order(self, order_id, **kwargs):
        """Remettre la commande en brouillon"""
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            order = request.env['sale.order'].sudo().browse(order_id)

            if not order.exists():
                return {
                    'success': False,
                    'error': 'Order not found'
                }

            # Vérifier que la commande peut être déverrouillée
            if order.state == 'cancel':
                return {
                    'success': False,
                    'error': 'Cannot unlock a cancelled order'
                }

            if order.state == 'draft':
                return {
                    'success': False,
                    'error': 'Order is already in draft state'
                }

            # Vérifier qu'il n'y a pas de facture validée
            if order.invoice_ids.filtered(lambda inv: inv.state == 'posted'):
                return {
                    'success': False,
                    'error': 'Cannot unlock order with posted invoices'
                }

            # Remettre en brouillon
            if hasattr(order, 'action_draft'):
                order.action_draft()
            else:
                order.write({'state': 'draft'})

            return {
                'success': True,
                'message': 'Order unlocked successfully',
                'order': {
                    'id': order.id,
                    'name': order.name,
                    'state': order.state,
                }
            }

        except Exception as e:
            _logger.error(f"Unlock order error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/customer/orders', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_customer_orders(self, **kwargs):
        """Liste des commandes du client connecté"""
        try:
            params = self._get_params()
            limit = int(params.get('limit', 20))
            offset = int(params.get('offset', 0))

            partner_id = request.env.user.partner_id.id

            orders = request.env['sale.order'].sudo().search(
                [('partner_id', '=', partner_id)],
                limit=limit,
                offset=offset,
                order='date_order desc'
            )

            total = request.env['sale.order'].sudo().search_count([('partner_id', '=', partner_id)])

            data = [{
                'id': o.id,
                'name': o.name,
                'date_order': o.date_order.isoformat() if o.date_order else None,
                'state': o.state,
                'amount_total': o.amount_total,
                'lines_count': len(o.order_line),
            } for o in orders]

            return {
                'success': True,
                'data': {
                    'orders': data,
                    'total': total,
                    'limit': limit,
                    'offset': offset,
                }
            }

        except Exception as e:
            _logger.error(f"Get customer orders error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/orders/<int:order_id>/reorder', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def reorder(self, order_id, **kwargs):
        """
        One-Click Reorder : Ajoute tous les produits d'une commande passée au panier actuel.
        Vérifie la disponibilité du stock et retourne le nouveau panier.
        """
        try:
            # Vérifier que l'utilisateur est connecté
            if not request.session.uid:
                return {
                    'success': False,
                    'error': 'Authentification requise',
                    'error_code': 'AUTH_REQUIRED'
                }

            partner_id = request.env.user.partner_id.id

            # Récupérer la commande originale
            original_order = request.env['sale.order'].sudo().browse(order_id)

            if not original_order.exists():
                return {
                    'success': False,
                    'error': 'Commande non trouvée',
                    'error_code': 'ORDER_NOT_FOUND'
                }

            # Vérifier que la commande appartient bien au client
            if original_order.partner_id.id != partner_id:
                return {
                    'success': False,
                    'error': 'Accès non autorisé',
                    'error_code': 'UNAUTHORIZED'
                }

            # Récupérer ou créer le panier actuel
            cart = self._get_or_create_cart(partner_id)

            # Liste des produits ajoutés et des erreurs
            added_products = []
            unavailable_products = []

            # Parcourir les lignes de la commande originale
            for line in original_order.order_line:
                # Ignorer les lignes sans produit (frais de port, remises, etc.)
                if not line.product_id or line.is_delivery or line.is_downpayment:
                    continue

                product = line.product_id

                # Vérifier que le produit est toujours vendable
                if not product.active or not product.sale_ok:
                    unavailable_products.append({
                        'name': product.name,
                        'reason': 'Produit non disponible à la vente'
                    })
                    continue

                # Vérifier le stock disponible
                available_qty = product.qty_available
                requested_qty = line.product_uom_qty

                if available_qty <= 0:
                    unavailable_products.append({
                        'name': product.name,
                        'reason': 'Rupture de stock'
                    })
                    continue

                # Ajuster la quantité si stock insuffisant
                qty_to_add = min(requested_qty, available_qty)

                # Vérifier si le produit est déjà dans le panier
                existing_line = cart.order_line.filtered(
                    lambda l: l.product_id.id == product.id
                )

                if existing_line:
                    # Mettre à jour la quantité
                    new_qty = existing_line.product_uom_qty + qty_to_add
                    existing_line.write({'product_uom_qty': new_qty})
                else:
                    # Créer une nouvelle ligne
                    request.env['sale.order.line'].sudo().create({
                        'order_id': cart.id,
                        'product_id': product.id,
                        'product_uom_qty': qty_to_add,
                        'price_unit': product.list_price,
                    })

                added_products.append({
                    'name': product.name,
                    'quantity': qty_to_add,
                    'adjusted': qty_to_add < requested_qty
                })

            # Recalculer le panier
            cart._compute_amount_all()

            # Construire la réponse du panier
            cart_data = self._serialize_cart(cart)

            return {
                'success': True,
                'message': f'{len(added_products)} produit(s) ajouté(s) au panier',
                'cart': cart_data,
                'added_products': added_products,
                'unavailable_products': unavailable_products,
            }

        except Exception as e:
            _logger.error(f"Reorder error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue lors du réapprovisionnement'
            }

    @http.route('/api/ecommerce/orders/<int:order_id>/delivery-slip/pdf', type='http', auth='public', methods=['GET'], csrf=False)
    def get_delivery_slip_pdf(self, order_id, **kwargs):
        """Télécharger le bon de livraison PDF d'une commande (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            if not request.env.user.has_group('base.group_system'):
                return request.make_response(
                    json.dumps({'error': 'Insufficient permissions'}),
                    headers=[('Content-Type', 'application/json')]
                )

            order = request.env['sale.order'].sudo().browse(order_id)

            if not order.exists():
                return request.make_response(
                    json.dumps({'error': 'Order not found'}),
                    headers=[('Content-Type', 'application/json')]
                )

            # Récupérer les pickings (bons de livraison) de la commande
            pickings = order.picking_ids.filtered(lambda p: p.state in ['assigned', 'done'])

            if not pickings:
                return request.make_response(
                    json.dumps({'error': 'No delivery order found for this sale order'}),
                    headers=[('Content-Type', 'application/json')]
                )

            # Utiliser le premier picking (ou le dernier livré)
            picking = pickings.filtered(lambda p: p.state == 'done')[:1] or pickings[:1]

            # Générer le PDF avec le rapport Odoo standard
            # Le rapport 'stock.report_deliveryslip' est le rapport standard de bon de livraison
            report = request.env.ref('stock.action_report_delivery')
            pdf_content, _ = report.sudo()._render_qweb_pdf(picking.ids)

            # Nom du fichier
            filename = f"bon_livraison_{order.name.replace('/', '_')}.pdf"

            pdfhttpheaders = [
                ('Content-Type', 'application/pdf'),
                ('Content-Length', len(pdf_content)),
                ('Content-Disposition', f'attachment; filename="{filename}"')
            ]

            return request.make_response(pdf_content, headers=pdfhttpheaders)

        except Exception as e:
            _logger.error(f"Get delivery slip PDF error: {e}")
            return request.make_response(
                json.dumps({'error': 'Une erreur est survenue'}),
                headers=[('Content-Type', 'application/json')]
            )

    @http.route('/api/ecommerce/orders/<int:order_id>/tracking', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_order_tracking(self, order_id, **kwargs):
        """Récupérer les informations de suivi d'une commande"""
        try:
            order = request.env['sale.order'].sudo().browse(order_id)

            if not order.exists():
                return {'success': False, 'error': 'Order not found'}

            # Récupérer le picking (bon de livraison) de la commande
            picking = order.picking_ids.filtered(lambda p: p.state == 'done')[:1]

            if not picking:
                return {
                    'success': True,
                    'data': {
                        'status': 'no_tracking',
                        'message': 'Aucun suivi disponible pour cette commande',
                    }
                }

            tracking_ref = picking.carrier_tracking_ref
            carrier = picking.carrier_id

            if not tracking_ref or not carrier:
                return {
                    'success': True,
                    'data': {
                        'status': 'no_tracking',
                        'message': 'Numéro de suivi non disponible',
                    }
                }

            # Déterminer le transporteur et construire l'URL de suivi
            tracking_url = None
            carrier_name = carrier.name.lower()

            if 'colissimo' in carrier_name:
                tracking_url = f'https://www.laposte.fr/outils/suivre-vos-envois?code={tracking_ref}'
            elif 'mondial' in carrier_name or 'relay' in carrier_name:
                tracking_url = f'https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition={tracking_ref}'
            elif 'chronopost' in carrier_name:
                tracking_url = f'https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT={tracking_ref}'
            elif 'ups' in carrier_name:
                tracking_url = f'https://www.ups.com/track?tracknum={tracking_ref}'
            elif 'dhl' in carrier_name:
                tracking_url = f'https://www.dhl.com/fr-fr/home/tracking.html?tracking-id={tracking_ref}'
            elif 'fedex' in carrier_name:
                tracking_url = f'https://www.fedex.com/fedextrack/?trknbr={tracking_ref}'

            return {
                'success': True,
                'data': {
                    'status': 'tracked',
                    'tracking_ref': tracking_ref,
                    'carrier_name': carrier.name,
                    'carrier_code': carrier_name,
                    'tracking_url': tracking_url,
                    'shipment_date': picking.date_done.strftime('%Y-%m-%d %H:%M:%S') if picking.date_done else None,
                }
            }

        except Exception as e:
            _logger.error(f"Get order tracking error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/orders/<int:order_id>/tracking/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def update_order_tracking(self, order_id, **kwargs):
        """Mettre à jour le numéro de tracking d'une commande (ADMIN UNIQUEMENT)"""
        # SECURITE : Vérifier droits admin
        error = self._require_admin()
        if error:
            return error

        try:
            order = request.env['sale.order'].sudo().browse(order_id)

            if not order.exists():
                return {
                    'success': False,
                    'error': 'Order not found'
                }

            params = self._get_params()
            picking_id = params.get('picking_id')
            tracking_ref = params.get('tracking_ref', '')
            carrier_id = params.get('carrier_id')

            if not picking_id:
                return {
                    'success': False,
                    'error': 'picking_id is required'
                }

            picking = request.env['stock.picking'].sudo().browse(picking_id)

            if not picking.exists():
                return {
                    'success': False,
                    'error': 'Picking not found'
                }

            # Vérifier que le picking appartient bien à cette commande
            if picking.sale_id.id != order_id:
                return {
                    'success': False,
                    'error': 'Picking does not belong to this order'
                }

            # Mettre à jour le tracking
            picking.write({
                'carrier_tracking_ref': tracking_ref,
                'carrier_id': carrier_id if carrier_id else picking.carrier_id.id,
            })

            return {
                'success': True,
                'message': 'Tracking information updated successfully',
                'data': {
                    'picking_id': picking.id,
                    'picking_name': picking.name,
                    'carrier_tracking_ref': picking.carrier_tracking_ref or '',
                    'carrier_tracking_url': picking.carrier_tracking_url or '',
                }
            }

        except Exception as e:
            _logger.error(f"Update order tracking error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/orders/<int:order_id>/history', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_order_history(self, order_id, **kwargs):
        """Obtenir l'historique des modifications d'une commande (admin uniquement)"""
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            order = request.env['sale.order'].sudo().browse(order_id)

            if not order.exists():
                return {
                    'success': False,
                    'error': 'Order not found'
                }

            # Récupérer les messages liés à cette commande
            messages = request.env['mail.message'].sudo().search([
                ('model', '=', 'sale.order'),
                ('res_id', '=', order_id),
            ], order='date desc')

            history = []
            for msg in messages:
                # Filtrer les messages importants (changements d'état, notes, activités)
                if msg.message_type in ['notification', 'comment'] or msg.subtype_id:
                    history.append({
                        'id': msg.id,
                        'date': msg.date.isoformat() if msg.date else None,
                        'author': msg.author_id.name if msg.author_id else 'Système',
                        'body': msg.body or '',
                        'message_type': msg.message_type,
                        'subtype': msg.subtype_id.name if msg.subtype_id else None,
                        'tracking_values': [
                            {
                                'field': tracking.field,
                                'field_desc': tracking.field_desc,
                                'old_value': tracking.old_value_char or tracking.old_value_text or str(tracking.old_value_integer) if tracking.old_value_integer else tracking.old_value_float or '',
                                'new_value': tracking.new_value_char or tracking.new_value_text or str(tracking.new_value_integer) if tracking.new_value_integer else tracking.new_value_float or '',
                            }
                            for tracking in msg.tracking_value_ids
                        ] if msg.tracking_value_ids else []
                    })

            return {
                'success': True,
                'data': {
                    'history': history,
                    'total': len(history),
                }
            }

        except Exception as e:
            _logger.error(f"Get order history error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/invoices', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_invoices_list(self, **kwargs):
        """Liste des factures (admin uniquement)"""
        try:
            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            params = self._get_params()
            limit = int(params.get('limit', 20))
            offset = int(params.get('offset', 0))
            state_filter = params.get('state', '')
            search = params.get('search', '').strip()

            domain = [('move_type', 'in', ['out_invoice', 'out_refund'])]
            if state_filter:
                domain.append(('state', '=', state_filter))
            if search:
                domain.append('|')
                domain.append(('name', 'ilike', search))
                domain.append(('partner_id.name', 'ilike', search))

            invoices = request.env['account.move'].sudo().search(
                domain, limit=limit, offset=offset, order='invoice_date desc, id desc'
            )
            total = request.env['account.move'].sudo().search_count(domain)

            data = [{
                'id': inv.id,
                'name': inv.name or 'Brouillon',
                'move_type': inv.move_type,
                'move_type_label': 'Facture' if inv.move_type == 'out_invoice' else 'Avoir',
                'state': inv.state,
                'partner': {
                    'id': inv.partner_id.id if inv.partner_id else None,
                    'name': inv.partner_id.name if inv.partner_id else 'Anonyme',
                },
                'invoice_date': inv.invoice_date.isoformat() if inv.invoice_date else None,
                'amount_total': inv.amount_total,
                'amount_residual': inv.amount_residual,
                'currency': inv.currency_id.name if inv.currency_id else 'EUR',
                'payment_state': inv.payment_state,
                'invoice_origin': inv.invoice_origin or '',
            } for inv in invoices]

            all_inv = request.env['account.move'].sudo().search([('move_type', 'in', ['out_invoice', 'out_refund'])])
            stats = {
                'total': len(all_inv),
                'draft': len(all_inv.filtered(lambda i: i.state == 'draft')),
                'posted': len(all_inv.filtered(lambda i: i.state == 'posted')),
                'paid': len(all_inv.filtered(lambda i: i.payment_state == 'paid')),
                'total_amount': sum(all_inv.filtered(lambda i: i.state == 'posted' and i.move_type == 'out_invoice').mapped('amount_total')),
            }

            return {'success': True, 'data': {'invoices': data, 'total': total, 'stats': stats}}
        except Exception as e:
            _logger.error(f"Get invoices list error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/invoices/<int:invoice_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_invoice_detail(self, invoice_id, **kwargs):
        """Detail d'une facture"""
        try:
            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            invoice = request.env['account.move'].sudo().browse(invoice_id)
            if not invoice.exists():
                return {'success': False, 'error': 'Invoice not found'}

            lines = [{
                'id': l.id,
                'name': l.name or '',
                'product': {'id': l.product_id.id, 'name': l.product_id.name} if l.product_id else None,
                'quantity': l.quantity,
                'price_unit': l.price_unit,
                'price_total': l.price_total,
            } for l in invoice.invoice_line_ids if l.display_type not in ['line_section', 'line_note']]

            return {
                'success': True,
                'invoice': {
                    'id': invoice.id,
                    'name': invoice.name or 'Brouillon',
                    'move_type': invoice.move_type,
                    'state': invoice.state,
                    'partner': {
                        'id': invoice.partner_id.id if invoice.partner_id else None,
                        'name': invoice.partner_id.name if invoice.partner_id else 'Anonyme',
                        'email': invoice.partner_id.email if invoice.partner_id else '',
                    },
                    'invoice_date': invoice.invoice_date.isoformat() if invoice.invoice_date else None,
                    'amount_untaxed': invoice.amount_untaxed,
                    'amount_tax': invoice.amount_tax,
                    'amount_total': invoice.amount_total,
                    'amount_residual': invoice.amount_residual,
                    'payment_state': invoice.payment_state,
                    'invoice_origin': invoice.invoice_origin or '',
                    'lines': lines,
                }
            }
        except Exception as e:
            _logger.error(f"Get invoice detail error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/orders/<int:order_id>/create-invoice', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def create_invoice_from_order(self, order_id, **kwargs):
        """Creer une facture depuis une commande (ADMIN UNIQUEMENT)"""
        # SECURITE : Vérifier droits admin
        error = self._require_admin()
        if error:
            return error

        try:
            order = request.env['sale.order'].sudo().browse(order_id)
            if not order.exists():
                return {'success': False, 'error': 'Order not found'}

            if order.state not in ['sale', 'done']:
                return {'success': False, 'error': 'Order must be confirmed before invoicing'}

            existing = order.invoice_ids.filtered(lambda i: i.state != 'cancel')
            if existing:
                return {'success': False, 'error': 'Order already has invoices', 'invoice_ids': existing.ids}

            invoice = order._create_invoices()
            return {
                'success': True,
                'invoice': {'id': invoice.id, 'name': invoice.name or 'Brouillon', 'amount_total': invoice.amount_total},
                'message': 'Invoice created successfully'
            }
        except Exception as e:
            _logger.error(f"Create invoice error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/invoices/<int:invoice_id>/post', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def post_invoice(self, invoice_id, **kwargs):
        """Valider une facture brouillon"""
        try:
            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            invoice = request.env['account.move'].sudo().browse(invoice_id)
            if not invoice.exists():
                return {'success': False, 'error': 'Invoice not found'}
            if invoice.state != 'draft':
                return {'success': False, 'error': 'Invoice is not in draft state'}

            invoice.action_post()
            return {
                'success': True,
                'invoice': {'id': invoice.id, 'name': invoice.name, 'state': invoice.state},
                'message': 'Invoice posted successfully'
            }
        except Exception as e:
            _logger.error(f"Post invoice error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/orders/<int:order_id>/tracking', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_order_tracking(self, order_id, **kwargs):
        """Récupérer les informations de suivi d'une commande"""
        try:
            order = request.env['sale.order'].sudo().browse(order_id)

            if not order.exists():
                return {'success': False, 'error': 'Order not found'}

            # Récupérer le picking (bon de livraison) de la commande
            picking = order.picking_ids.filtered(lambda p: p.state == 'done')[:1]

            if not picking:
                return {
                    'success': True,
                    'data': {
                        'status': 'no_tracking',
                        'message': 'Aucun suivi disponible pour cette commande',
                    }
                }

            tracking_ref = picking.carrier_tracking_ref
            carrier = picking.carrier_id

            if not tracking_ref or not carrier:
                return {
                    'success': True,
                    'data': {
                        'status': 'no_tracking',
                        'message': 'Numéro de suivi non disponible',
                    }
                }

            # Déterminer le transporteur et construire l'URL de suivi
            tracking_url = None
            carrier_name = carrier.name.lower()

            if 'colissimo' in carrier_name:
                tracking_url = f'https://www.laposte.fr/outils/suivre-vos-envois?code={tracking_ref}'
            elif 'mondial' in carrier_name or 'relay' in carrier_name:
                tracking_url = f'https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition={tracking_ref}'
            elif 'chronopost' in carrier_name:
                tracking_url = f'https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT={tracking_ref}'
            elif 'ups' in carrier_name:
                tracking_url = f'https://www.ups.com/track?tracknum={tracking_ref}'
            elif 'dhl' in carrier_name:
                tracking_url = f'https://www.dhl.com/fr-fr/home/tracking.html?tracking-id={tracking_ref}'
            elif 'fedex' in carrier_name:
                tracking_url = f'https://www.fedex.com/fedextrack/?trknbr={tracking_ref}'

            return {
                'success': True,
                'data': {
                    'status': 'tracked',
                    'tracking_ref': tracking_ref,
                    'carrier_name': carrier.name,
                    'carrier_code': carrier_name,
                    'tracking_url': tracking_url,
                    'shipment_date': picking.date_done.strftime('%Y-%m-%d %H:%M:%S') if picking.date_done else None,
                }
            }

        except Exception as e:
            _logger.error(f"Get order tracking error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/tracking/colissimo/<string:tracking_number>', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_colissimo_tracking(self, tracking_number, **kwargs):
        """Récupérer le détail du suivi Colissimo via leur API"""
        try:
            # TODO: Implémenter l'appel API Colissimo
            # Nécessite : login, mot de passe Colissimo
            # Doc: https://www.colissimo.entreprise.laposte.fr/fr/system/files/imagescontent/docs/spec_ws_suiviv2.pdf

            return {
                'success': False,
                'error': 'API Colissimo non configurée. Contactez l\'administrateur.',
                'message': 'Veuillez utiliser le lien de suivi fourni pour suivre votre colis.'
            }

        except Exception as e:
            _logger.error(f"Colissimo tracking error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/tracking/mondialrelay/<string:tracking_number>', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_mondialrelay_tracking(self, tracking_number, **kwargs):
        """Récupérer le détail du suivi Mondial Relay via leur API"""
        try:
            # TODO: Implémenter l'appel API Mondial Relay
            # Nécessite : clé API Mondial Relay
            # Doc: https://www.mondialrelay.fr/media/108391/tracking-web-service.pdf

            return {
                'success': False,
                'error': 'API Mondial Relay non configurée. Contactez l\'administrateur.',
                'message': 'Veuillez utiliser le lien de suivi fourni pour suivre votre colis.'
            }

        except Exception as e:
            _logger.error(f"Mondial Relay tracking error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    # =========================================================================
    # LATE AVAILABILITY (Stock Future)
    # =========================================================================

    @http.route('/api/orders/fulfillment-status', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_orders_by_fulfillment(self, **kwargs):
        """
        Liste des commandes filtrées par disponibilité future du stock.

        Paramètres :
        - priority: 'immediate', 'short', 'medium', 'long', 'backorder' (optionnel)
        - can_fulfill_now: true/false (optionnel)
        - limit: nombre max de résultats (défaut: 50)
        - offset: décalage pagination (défaut: 0)
        - state: état commande ('draft', 'sale', etc.) (optionnel)
        """
        try:
            auth_result = self._authenticate_from_header()
            if auth_result:
                return auth_result

            priority = kwargs.get('priority')
            can_fulfill_now = kwargs.get('can_fulfill_now')
            limit = int(kwargs.get('limit', 50))
            offset = int(kwargs.get('offset', 0))
            state = kwargs.get('state')

            SaleOrder = request.env['sale.order'].sudo()

            domain = []
            if priority:
                domain.append(('fulfillment_priority', '=', priority))
            if can_fulfill_now is not None:
                domain.append(('can_fulfill_now', '=', bool(can_fulfill_now)))
            if state:
                domain.append(('state', '=', state))
            else:
                # Par défaut, exclure annulées et terminées
                domain.append(('state', 'not in', ['cancel', 'done']))

            total = SaleOrder.search_count(domain)
            orders = SaleOrder.search(
                domain,
                limit=limit,
                offset=offset,
                order='expected_fulfillment_date asc, date_order desc'
            )

            import json
            data = []
            for order in orders:
                missing_stock = []
                if order.missing_stock_details:
                    try:
                        missing_stock = json.loads(order.missing_stock_details)
                    except Exception:
                        pass

                data.append({
                    'id': order.id,
                    'name': order.name,
                    'date_order': order.date_order.isoformat() if order.date_order else None,
                    'state': order.state,
                    'amount_total': order.amount_total,
                    'customer_name': order.partner_id.name if order.partner_id else '',
                    'can_fulfill_now': order.can_fulfill_now,
                    'expected_fulfillment_date': order.expected_fulfillment_date.isoformat() if order.expected_fulfillment_date else None,
                    'fulfillment_priority': order.fulfillment_priority,
                    'missing_stock': missing_stock,
                })

            return {
                'success': True,
                'orders': data,
                'total': total,
                'limit': limit,
                'offset': offset,
            }

        except Exception as e:
            _logger.error(f"Get fulfillment status error: {e}", exc_info=True)
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/orders/<int:order_id>/fulfillment-detail', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_order_fulfillment_detail(self, order_id, **kwargs):
        """
        Détails complets de disponibilité pour une commande spécifique.

        Retourne :
        - État actuel du stock pour chaque ligne
        - Dates estimées de réapprovisionnement
        - Suggestions (split order, substitute products, etc.)
        """
        try:
            auth_result = self._authenticate_from_header()
            if auth_result:
                return auth_result

            SaleOrder = request.env['sale.order'].sudo()
            order = SaleOrder.browse(order_id)

            if not order.exists():
                return {
                    'success': False,
                    'error': f'Commande {order_id} introuvable'
                }

            import json
            missing_stock = []
            if order.missing_stock_details:
                try:
                    missing_stock = json.loads(order.missing_stock_details)
                except Exception:
                    pass

            # Analyser chaque ligne pour détails supplémentaires
            lines_detail = []
            for line in order.order_line:
                product = line.product_id
                qty_needed = line.product_uom_qty

                lines_detail.append({
                    'line_id': line.id,
                    'product_id': product.id,
                    'product_name': product.display_name,
                    'sku': product.default_code or '',
                    'qty_ordered': qty_needed,
                    'qty_available': product.qty_available,
                    'qty_available_unreserved': product.qty_available_unreserved,
                    'qty_reserved_manual': product.qty_reserved_manual,
                    'qty_available_after_manual_reservations': product.qty_available_after_manual_reservations,
                    'is_sufficient': product.qty_available_after_manual_reservations >= qty_needed,
                })

            return {
                'success': True,
                'order': {
                    'id': order.id,
                    'name': order.name,
                    'state': order.state,
                    'can_fulfill_now': order.can_fulfill_now,
                    'expected_fulfillment_date': order.expected_fulfillment_date.isoformat() if order.expected_fulfillment_date else None,
                    'fulfillment_priority': order.fulfillment_priority,
                    'missing_stock_summary': missing_stock,
                    'lines_detail': lines_detail,
                }
            }

        except Exception as e:
            _logger.error(f"Get fulfillment detail error: {e}", exc_info=True)
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/orders/fulfillment-stats', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_fulfillment_statistics(self, **kwargs):
        """
        Statistiques globales de disponibilité des commandes.

        Retourne :
        - Nombre de commandes par priorité (immediate, short, medium, long, backorder)
        - Nombre de commandes prêtes vs en attente
        - Valeur totale bloquée par manque de stock
        """
        try:
            auth_result = self._authenticate_from_header()
            if auth_result:
                return auth_result

            SaleOrder = request.env['sale.order'].sudo()

            # Compter par priorité (exclure cancel/done)
            base_domain = [('state', 'not in', ['cancel', 'done'])]

            stats_by_priority = {}
            for priority in ['immediate', 'short', 'medium', 'long', 'backorder']:
                count = SaleOrder.search_count(base_domain + [('fulfillment_priority', '=', priority)])
                stats_by_priority[priority] = count

            # Commandes prêtes vs en attente
            ready_count = SaleOrder.search_count(base_domain + [('can_fulfill_now', '=', True)])
            waiting_count = SaleOrder.search_count(base_domain + [('can_fulfill_now', '=', False)])

            # Valeur totale bloquée
            blocked_orders = SaleOrder.search(base_domain + [('can_fulfill_now', '=', False)])
            blocked_value = sum(blocked_orders.mapped('amount_total'))

            return {
                'success': True,
                'stats': {
                    'by_priority': stats_by_priority,
                    'ready_count': ready_count,
                    'waiting_count': waiting_count,
                    'total_pending': ready_count + waiting_count,
                    'blocked_value': round(blocked_value, 2),
                }
            }

        except Exception as e:
            _logger.error(f"Get fulfillment stats error: {e}", exc_info=True)
            return {'success': False, 'error': 'Une erreur est survenue'}
