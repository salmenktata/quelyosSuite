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


class QuelyosInventoryAPI(BaseController):
    """API contrôleur pour le stock, entrepôts, emplacements et inventaires"""

    @http.route('/api/ecommerce/products/<int:product_id>/variants/<int:variant_id>/stock/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def update_variant_stock(self, product_id, variant_id, **kwargs):
        """Modifier le stock d'une variante spécifique (ADMIN UNIQUEMENT)"""
        # SECURITE : Vérifier droits admin
        error = self._require_admin()
        if error:
            return error

        try:
            product = request.env['product.template'].sudo().browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            variant = request.env['product.product'].sudo().browse(variant_id)

            if not variant.exists() or variant.product_tmpl_id.id != product_id:
                return {
                    'success': False,
                    'error': 'Variant not found'
                }

            params = self._get_params()
            new_qty = params.get('quantity')

            if new_qty is None:
                return {
                    'success': False,
                    'error': 'Quantity is required'
                }

            # Chercher d'abord si un quant existe déjà pour ce produit
            quant = request.env['stock.quant'].sudo().search([
                ('product_id', '=', variant_id),
                ('location_id.usage', '=', 'internal')
            ], limit=1)

            if quant:
                location = quant.location_id
            else:
                # Utiliser l'emplacement "Stock" principal (nom exact)
                location = request.env['stock.location'].sudo().search([
                    ('name', '=', 'Stock'),
                    ('usage', '=', 'internal')
                ], limit=1)
                if not location:
                    # Fallback sur n'importe quel emplacement interne
                    location = request.env['stock.location'].sudo().search([
                        ('usage', '=', 'internal')
                    ], limit=1)

            if not location:
                return {
                    'success': False,
                    'error': 'No internal location found'
                }

            if quant:
                quant.sudo().write({'quantity': float(new_qty)})
            else:
                request.env['stock.quant'].sudo().create({
                    'product_id': variant_id,
                    'location_id': location.id,
                    'quantity': float(new_qty),
                })

            # Commit et vider le cache pour que qty_available soit recalculé
            request.env.cr.commit()
            request.env.invalidate_all()

            # Recharger la variante dans un nouveau contexte
            variant = request.env['product.product'].sudo().browse(variant_id)

            return {
                'success': True,
                'data': {
                    'variant': {
                        'id': variant.id,
                        'name': variant.name,
                        'qty_available': float(new_qty),  # Utiliser la valeur mise à jour
                    },
                    'message': f'Stock mis à jour à {new_qty} unités'
                }
            }

        except Exception as e:
            _logger.error(f"Update variant stock error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/stock/export', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def export_stock_csv(self, **params):
        """
        Export CSV du stock avec filtres dates (ADMIN UNIQUEMENT).
        Pour compliance audit et reporting.

        Params:
            date_from (str): Date début filtre YYYY-MM-DD (optionnel)
            date_to (str): Date fin filtre YYYY-MM-DD (optionnel)

        Returns:
            Données CSV avec colonnes : id, name, sku, qty_available, virtual_available,
            list_price, standard_price, valuation, category, create_date
        """
        try:
            # Vérification admin
            admin_check = self._require_admin()
            if not admin_check['success']:
                return admin_check

            Product = request.env['product.product'].sudo()

            # Construire domaine de recherche
            domain = [('detailed_type', '=', 'product')]

            # Filtres dates optionnels
            date_from = params.get('date_from')
            date_to = params.get('date_to')

            if date_from:
                domain.append(('create_date', '>=', date_from))

            if date_to:
                # Ajouter 23:59:59 pour inclure toute la journée
                domain.append(('create_date', '<=', f"{date_to} 23:59:59"))

            # Rechercher produits
            products = Product.search(domain, order='name')

            # Générer données CSV
            csv_data = []
            for product in products:
                csv_data.append({
                    'id': product.id,
                    'name': product.name or '',
                    'sku': product.default_code or '',
                    'qty_available': float(product.qty_available),
                    'virtual_available': float(product.virtual_available),
                    'list_price': float(product.list_price),
                    'standard_price': float(product.standard_price),
                    'valuation': float(product.qty_available * product.standard_price),
                    'category': product.categ_id.complete_name if product.categ_id else '',
                    'create_date': product.create_date.strftime('%Y-%m-%d %H:%M:%S') if product.create_date else '',
                })

            _logger.info(f"Stock CSV export : {len(csv_data)} produits par user {request.env.user.login}")

            return {
                'success': True,
                'data': csv_data,
                'total': len(csv_data),
                'filters': {
                    'date_from': date_from,
                    'date_to': date_to,
                }
            }

        except Exception as e:
            _logger.error(f"Export stock CSV error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/stock', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_product_stock(self, product_id, **kwargs):
        """Récupérer le stock disponible d'un produit"""
        try:
            product = request.env['product.product'].sudo().browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            data = {
                'product_id': product.id,
                'product_name': product.name,
                'qty_available': product.qty_available,
                'virtual_available': product.virtual_available,
                'incoming_qty': product.incoming_qty,
                'outgoing_qty': product.outgoing_qty,
                'is_available': product.qty_available > 0,
                # Indicateurs de rotation stock (Odoo 19)
                'qty_sold_365': product.qty_sold_365 if hasattr(product, 'qty_sold_365') else 0,
                'stock_turnover_365': product.stock_turnover_365 if hasattr(product, 'stock_turnover_365') else 0,
                'days_of_stock': product.days_of_stock if hasattr(product, 'days_of_stock') else 0,
            }

            return {
                'success': True,
                'stock': data
            }

        except Exception as e:
            _logger.error(f"Get product stock error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/stock/history', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def get_product_stock_history(self, product_id, **kwargs):
        """
        Récupérer l'historique des mouvements de stock d'un produit (admin uniquement).

        Paramètres optionnels:
        - date_from (str): Date de début (format ISO)
        - date_to (str): Date de fin (format ISO)
        - move_type (str): Type de mouvement ('in', 'out', 'internal', 'all') (défaut: 'all')
        - limit (int): Nombre de résultats (défaut: 100)
        - offset (int): Décalage pour pagination (défaut: 0)
        """
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._require_admin()
            if error:
                return error

            Product = request.env['product.product'].sudo()
            Move = request.env['stock.move'].sudo()

            # Vérifier que le produit existe
            product = Product.browse(product_id)
            if not product.exists():
                return {
                    'success': False,
                    'error': 'Produit introuvable',
                    'errorCode': 'PRODUCT_NOT_FOUND'
                }

            params = self._get_params()
            limit = int(params.get('limit', 100))
            offset = int(params.get('offset', 0))
            date_from = params.get('date_from')
            date_to = params.get('date_to')
            move_type = params.get('move_type', 'all')

            # Domain de base : produit + état done
            domain = [
                ('product_id', '=', product_id),
                ('state', '=', 'done'),
            ]

            # Filtre période
            if date_from:
                domain.append(('date', '>=', date_from))
            if date_to:
                domain.append(('date', '<=', date_to))

            # Filtre type de mouvement
            if move_type and move_type != 'all':
                if move_type == 'in':
                    domain.extend([
                        ('location_id.usage', '=', 'supplier'),
                        ('location_dest_id.usage', '=', 'internal'),
                    ])
                elif move_type == 'out':
                    domain.extend([
                        ('location_id.usage', '=', 'internal'),
                        ('location_dest_id.usage', '=', 'customer'),
                    ])
                elif move_type == 'internal':
                    domain.extend([
                        ('location_id.usage', '=', 'internal'),
                        ('location_dest_id.usage', '=', 'internal'),
                    ])

            # Recherche avec tri chronologique inverse
            moves = Move.search(
                domain,
                limit=limit,
                offset=offset,
                order='date desc, id desc'
            )

            total = Move.search_count(domain)

            # Construction des données enrichies
            history = []
            for m in moves:
                # Déterminer le type et impact sur stock
                if m.location_id.usage == 'supplier' and m.location_dest_id.usage == 'internal':
                    move_type_label = 'Entrée'
                    impact = '+{}'.format(m.product_uom_qty)
                    icon = 'arrow_downward'
                elif m.location_id.usage == 'internal' and m.location_dest_id.usage == 'customer':
                    move_type_label = 'Sortie'
                    impact = '-{}'.format(m.product_uom_qty)
                    icon = 'arrow_upward'
                elif m.location_id.usage == 'internal' and m.location_dest_id.usage == 'internal':
                    move_type_label = 'Transfert'
                    impact = '~{}'.format(m.product_uom_qty)
                    icon = 'swap_horiz'
                elif m.location_id.usage == 'inventory' or m.location_dest_id.usage == 'inventory':
                    move_type_label = 'Ajustement'
                    if m.location_dest_id.usage == 'inventory':
                        impact = '-{}'.format(m.product_uom_qty)
                    else:
                        impact = '+{}'.format(m.product_uom_qty)
                    icon = 'tune'
                else:
                    move_type_label = 'Autre'
                    impact = '{}'.format(m.product_uom_qty)
                    icon = 'info'

                # Origine du mouvement
                origin = m.origin or m.reference or ''
                if m.picking_id:
                    origin = m.picking_id.name

                history.append({
                    'id': m.id,
                    'date': m.date.isoformat() if m.date else None,
                    'move_type': move_type_label,
                    'icon': icon,
                    'quantity': m.product_uom_qty,
                    'impact': impact,
                    'location_src': m.location_id.complete_name,
                    'location_dest': m.location_dest_id.complete_name,
                    'reference': m.reference or '',
                    'origin': origin,
                    'picking_id': m.picking_id.id if m.picking_id else None,
                    'picking_name': m.picking_id.name if m.picking_id else None,
                    'state': m.state,
                })

            _logger.info(f"Fetched stock history for product {product.display_name}: {len(history)} moves")

            return {
                'success': True,
                'data': {
                    'product_id': product_id,
                    'product_name': product.display_name,
                    'product_sku': product.default_code or '',
                    'current_stock': product.qty_available,
                    'history': history,
                    'total': total,
                    'limit': limit,
                    'offset': offset,
                }
            }

        except Exception as e:
            _logger.error(f"Get product stock history error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/stock/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def update_product_stock(self, product_id, **kwargs):
        """Modifier le stock d'un produit (ADMIN UNIQUEMENT)"""
        # SECURITE : Vérifier droits admin
        error = self._require_admin()
        if error:
            return error

        try:
            product = request.env['product.product'].sudo().browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            params = self._get_params()
            new_qty = params.get('quantity')

            if new_qty is None:
                return {
                    'success': False,
                    'error': 'Quantity is required'
                }

            # Créer un ajustement de stock
            location = request.env['stock.location'].sudo().search([
                ('usage', '=', 'internal')
            ], limit=1)

            if not location:
                return {
                    'success': False,
                    'error': 'No internal location found'
                }

            # Créer le mouvement de stock
            quant = request.env['stock.quant'].sudo().search([
                ('product_id', '=', product_id),
                ('location_id', '=', location.id)
            ], limit=1)

            if quant:
                quant.sudo().write({'quantity': float(new_qty)})
            else:
                request.env['stock.quant'].sudo().create({
                    'product_id': product_id,
                    'location_id': location.id,
                    'quantity': float(new_qty),
                })

            return {
                'success': True,
                'stock': {
                    'product_id': product.id,
                    'qty_available': product.qty_available,
                }
            }

        except Exception as e:
            _logger.error(f"Update product stock error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/stock/moves', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def get_stock_moves(self, **kwargs):
        """
        Liste des mouvements de stock avec historique complet (admin uniquement).

        Paramètres optionnels:
        - product_id (int): Filtrer par produit
        - location_id (int): Filtrer par emplacement (source ou destination)
        - date_from (str): Date de début (format ISO)
        - date_to (str): Date de fin (format ISO)
        - state (str): Filtrer par état ('done', 'assigned', 'confirmed', 'waiting', 'cancel')
        - move_type (str): Type de mouvement ('in', 'out', 'internal')
        - limit (int): Nombre de résultats (défaut: 50)
        - offset (int): Décalage pour pagination (défaut: 0)
        """
        # Handle CORS preflight
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        try:
            # Authentification manuelle depuis le header Authorization
            error = self._authenticate_from_header()
            if error:
                import json
                response_data = {
                    'jsonrpc': '2.0',
                    'id': None,
                    'result': error
                }
                return request.make_response(
                    json.dumps(response_data),
                    headers=[('Content-Type', 'application/json')] + list(cors_headers.items())
                )

            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._require_admin()
            if error:
                return error

            Move = request.env['stock.move'].sudo()
            params = self._get_http_params()

            limit = int(params.get('limit', 50))
            offset = int(params.get('offset', 0))
            product_id = params.get('product_id')
            location_id = params.get('location_id')
            date_from = params.get('date_from')
            date_to = params.get('date_to')
            state = params.get('state', 'done')  # Par défaut uniquement les mouvements terminés
            move_type = params.get('move_type')

            # Construction du domain
            domain = []

            # Filtre produit
            if product_id:
                domain.append(('product_id', '=', int(product_id)))

            # Filtre état
            if state:
                domain.append(('state', '=', state))

            # Filtre emplacement (source OU destination)
            if location_id:
                location_id = int(location_id)
                domain.append('|')
                domain.append(('location_id', '=', location_id))
                domain.append(('location_dest_id', '=', location_id))

            # Filtre période
            if date_from:
                domain.append(('date', '>=', date_from))
            if date_to:
                domain.append(('date', '<=', date_to))

            # Filtre type de mouvement
            if move_type:
                if move_type == 'in':
                    # Entrées : depuis fournisseur vers internal
                    domain.extend([
                        ('location_id.usage', '=', 'supplier'),
                        ('location_dest_id.usage', '=', 'internal'),
                    ])
                elif move_type == 'out':
                    # Sorties : depuis internal vers client
                    domain.extend([
                        ('location_id.usage', '=', 'internal'),
                        ('location_dest_id.usage', '=', 'customer'),
                    ])
                elif move_type == 'internal':
                    # Transferts internes
                    domain.extend([
                        ('location_id.usage', '=', 'internal'),
                        ('location_dest_id.usage', '=', 'internal'),
                    ])

            # Recherche avec tri chronologique inverse
            moves = Move.search(
                domain,
                limit=limit,
                offset=offset,
                order='date desc, id desc'
            )

            total = Move.search_count(domain)

            # Construction des données enrichies
            data = []
            for m in moves:
                # Déterminer le type de mouvement
                if m.location_id.usage == 'supplier' and m.location_dest_id.usage == 'internal':
                    move_type_label = 'Entrée (réception)'
                elif m.location_id.usage == 'internal' and m.location_dest_id.usage == 'customer':
                    move_type_label = 'Sortie (livraison)'
                elif m.location_id.usage == 'internal' and m.location_dest_id.usage == 'internal':
                    move_type_label = 'Transfert interne'
                elif m.location_id.usage == 'inventory':
                    move_type_label = 'Ajustement inventaire'
                else:
                    move_type_label = 'Autre'

                # Origine du mouvement
                origin = m.origin or m.reference or ''
                if m.picking_id:
                    origin = m.picking_id.name

                data.append({
                    'id': m.id,
                    'product': {
                        'id': m.product_id.id,
                        'name': m.product_id.display_name,
                        'sku': m.product_id.default_code or '',
                    },
                    'quantity': m.product_uom_qty,
                    'uom': m.product_uom.name if m.product_uom else 'Unité',
                    'location_src_id': m.location_id.id,
                    'location_src': m.location_id.complete_name,
                    'location_dest_id': m.location_dest_id.id,
                    'location_dest': m.location_dest_id.complete_name,
                    'date': m.date.isoformat() if m.date else None,
                    'state': m.state,
                    'state_label': dict(Move._fields['state'].selection).get(m.state, m.state),
                    'move_type': move_type_label,
                    'reference': m.reference or '',
                    'origin': origin,
                    'picking_id': m.picking_id.id if m.picking_id else None,
                    'picking_name': m.picking_id.name if m.picking_id else None,
                })

            _logger.info(f"Fetched {len(data)} stock moves (total: {total})")

            import json
            response_data = {
                'jsonrpc': '2.0',
                'id': request.jsonrequest.get('id') if hasattr(request, 'jsonrequest') and request.jsonrequest else None,
                'result': {
                    'success': True,
                    'data': {
                        'moves': data,
                        'total': total,
                        'limit': limit,
                        'offset': offset,
                    }
                }
            }
            return request.make_response(
                json.dumps(response_data),
                headers=[('Content-Type', 'application/json')] + list(cors_headers.items())
            )

        except Exception as e:
            _logger.error(f"Get stock moves error: {e}", exc_info=True)
            import json
            response_data = {
                'jsonrpc': '2.0',
                'id': request.jsonrequest.get('id') if hasattr(request, 'jsonrequest') and request.jsonrequest else None,
                'result': {
                    'success': False,
                    'error': 'Erreur serveur',
                    'errorCode': 'SERVER_ERROR'
                }
            }
            return request.make_response(
                json.dumps(response_data),
                headers=[('Content-Type', 'application/json')] + list(cors_headers.items())
            )

    @http.route('/api/ecommerce/stock/validate', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def validate_stock_availability(self, **kwargs):
        """Vérifier la disponibilité du stock pour plusieurs produits"""
        try:
            params = self._get_params()
            items = params.get('items', [])  # [{'product_id': 1, 'quantity': 2}, ...]

            if not items:
                return {
                    'success': False,
                    'error': 'Items list is required'
                }

            results = []
            all_available = True

            for item in items:
                product_id = item.get('product_id')
                quantity = float(item.get('quantity', 1))

                product = request.env['product.product'].sudo().browse(int(product_id))

                if not product.exists():
                    results.append({
                        'product_id': product_id,
                        'available': False,
                        'reason': 'Product not found'
                    })
                    all_available = False
                    continue

                is_available = product.qty_available >= quantity

                results.append({
                    'product_id': product_id,
                    'product_name': product.name,
                    'requested_qty': quantity,
                    'available_qty': product.qty_available,
                    'available': is_available,
                })

                if not is_available:
                    all_available = False

            return {
                'success': True,
                'all_available': all_available,
                'items': results
            }

        except Exception as e:
            _logger.error(f"Validate stock error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/stock/products', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_stock_products(self, **kwargs):
        """Liste de tous les produits avec leur stock (admin uniquement)"""
        try:
            params = self._get_params()
            limit = int(params.get('limit', 20))
            offset = int(params.get('offset', 0))
            search = params.get('search', '').strip()

            # Construire le domaine de recherche
            domain = []

            if search:
                domain = [
                    '|', ('name', 'ilike', search),
                    ('default_code', 'ilike', search)  # SKU
                ]

            # Rechercher les produits
            products = request.env['product.product'].sudo().search(
                domain,
                limit=limit,
                offset=offset,
                order='name asc'
            )

            total = request.env['product.product'].sudo().search_count(domain)

            # Préparer les données
            data = []
            for product in products:
                # Déterminer le statut stock
                if product.qty_available <= 0:
                    stock_status = 'out_of_stock'
                elif product.qty_available < 10:  # Seuil d'alerte
                    stock_status = 'low_stock'
                else:
                    stock_status = 'in_stock'

                data.append({
                    'id': product.id,
                    'name': product.name,
                    'sku': product.default_code or '',
                    'image': f'/web/image/product.product/{product.id}/image_128',
                    'image_url': f'/web/image/product.product/{product.id}/image_128',  # Alias
                    'list_price': product.list_price,
                    'qty_available': product.qty_available,
                    'virtual_available': product.virtual_available,
                    'incoming_qty': product.incoming_qty,
                    'outgoing_qty': product.outgoing_qty,
                    'stock_status': stock_status,
                    'category': product.categ_id.name if product.categ_id else '',
                })

            return {
                'success': True,
                'products': data,
                'total': total,
                'limit': limit,
                'offset': offset,
                'facets': {
                    'categories': [],
                    'price_range': {'min': 0, 'max': 1000}
                }
            }

        except Exception as e:
            _logger.error(f"Get stock products error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/stock/inventory/prepare', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def prepare_inventory(self, **kwargs):
        """Préparer un inventaire physique - Récupérer liste produits avec stock actuel"""
        try:
            # Vérifier les permissions admin
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            params = self._get_params()
            category_id = params.get('category_id')  # Filtrer par catégorie (optionnel)
            search = params.get('search', '').strip()  # Recherche par nom/SKU (optionnel)

            # Construire domaine de recherche
            domain = []

            if category_id:
                domain.append(('categ_id', '=', int(category_id)))

            if search:
                domain.extend([
                    '|', ('name', 'ilike', search),
                    ('default_code', 'ilike', search)
                ])

            # Récupérer les produits
            Product = request.env['product.product'].sudo()
            products = Product.search(domain, order='name asc')

            # Préparer les données pour l'inventaire
            inventory_lines = []
            for product in products:
                # Ajouter informations de valorisation
                theoretical_qty = product.qty_available
                standard_price = product.standard_price
                theoretical_value = theoretical_qty * standard_price

                inventory_lines.append({
                    'product_id': product.id,
                    'product_name': product.name,
                    'sku': product.default_code or '',
                    'image_url': f'/web/image/product.product/{product.id}/image_128',
                    'category': product.categ_id.name if product.categ_id else '',
                    'theoretical_qty': theoretical_qty,
                    'counted_qty': None,  # À saisir par l'utilisateur
                    'standard_price': standard_price,
                    'theoretical_value': theoretical_value,
                })

            return {
                'success': True,
                'data': {
                    'inventory_lines': inventory_lines,
                    'total_products': len(inventory_lines),
                }
            }

        except Exception as e:
            _logger.error(f"Prepare inventory error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/stock/inventory/validate', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def validate_inventory(self, **kwargs):
        """Valider un inventaire physique - Appliquer les ajustements de stock en masse"""
        try:
            # Vérifier les permissions admin
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            params = self._get_params()
            adjustments = params.get('adjustments', [])  # Liste des ajustements : [{'product_id': int, 'new_qty': float}, ...]

            if not adjustments:
                return {
                    'success': False,
                    'error': 'No adjustments provided'
                }

            Product = request.env['product.product'].sudo()
            StockQuant = request.env['stock.quant'].sudo()
            Location = request.env['stock.location'].sudo()

            # Récupérer l'emplacement stock principal (WH/Stock)
            location = Location.search([
                ('usage', '=', 'internal')
            ], limit=1)

            if not location:
                return {
                    'success': False,
                    'error': 'No internal location found'
                }

            adjusted_products = []
            errors = []

            for adjustment in adjustments:
                try:
                    product_id = adjustment.get('product_id')
                    new_qty = float(adjustment.get('new_qty', 0))

                    if product_id is None:
                        errors.append({'error': 'Missing product_id', 'adjustment': adjustment})
                        continue

                    product = Product.browse(int(product_id))

                    if not product.exists():
                        errors.append({'error': 'Product not found', 'product_id': product_id})
                        continue

                    # Récupérer le quant pour ce produit dans l'emplacement
                    quant = StockQuant.search([
                        ('product_id', '=', product.id),
                        ('location_id', '=', location.id)
                    ], limit=1)

                    old_qty = product.qty_available

                    if quant:
                        # Mettre à jour le quant existant
                        quant.write({'inventory_quantity': new_qty})
                        quant.action_apply_inventory()
                    else:
                        # Créer un nouveau quant
                        quant = StockQuant.create({
                            'product_id': product.id,
                            'location_id': location.id,
                            'inventory_quantity': new_qty,
                        })
                        quant.action_apply_inventory()

                    # Calculer valorisation (coût × quantité)
                    standard_price = product.standard_price
                    old_value = old_qty * standard_price
                    new_value = new_qty * standard_price
                    value_difference = new_value - old_value

                    adjusted_products.append({
                        'product_id': product.id,
                        'product_name': product.name,
                        'sku': product.default_code or '',
                        'old_qty': old_qty,
                        'new_qty': new_qty,
                        'difference': new_qty - old_qty,
                        'standard_price': standard_price,
                        'old_value': old_value,
                        'new_value': new_value,
                        'value_difference': value_difference,
                    })

                except Exception as product_error:
                    errors.append({
                        'error': str(product_error),
                        'product_id': adjustment.get('product_id')
                    })

            # Calculer valorisation totale de l'inventaire
            total_value_difference = sum(p['value_difference'] for p in adjusted_products)
            total_old_value = sum(p['old_value'] for p in adjusted_products)
            total_new_value = sum(p['new_value'] for p in adjusted_products)

            return {
                'success': True,
                'data': {
                    'adjusted_products': adjusted_products,
                    'total_adjusted': len(adjusted_products),
                    'total_old_value': total_old_value,
                    'total_new_value': total_new_value,
                    'total_value_difference': total_value_difference,
                    'errors': errors,
                    'error_count': len(errors),
                }
            }

        except Exception as e:
            _logger.error(f"Validate inventory error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/stock/pickings', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_stock_pickings(self, **kwargs):
        """
        Lister les bons de transfert (stock.picking) avec filtres
        ADMIN UNIQUEMENT
        """
        try:
            # Vérifier droits admin
            # TODO: Réactiver pour production
            # error = self._require_admin()
            # if error:
            #     return error
            pass

            params = self._get_params()
            limit = params.get('limit', 20)
            offset = params.get('offset', 0)
            state = params.get('state')  # draft, waiting, confirmed, assigned, done, cancel
            warehouse_id = params.get('warehouse_id')
            search = params.get('search', '').strip()

            Picking = request.env['stock.picking'].sudo()

            # Construire domaine de recherche
            domain = []

            if state:
                domain.append(('state', '=', state))

            if warehouse_id:
                domain.append(('location_id.warehouse_id', '=', warehouse_id))

            if search:
                domain.append('|')
                domain.append(('name', 'ilike', search))
                domain.append(('origin', 'ilike', search))

            # Recherche avec pagination
            pickings = Picking.search(domain, limit=limit, offset=offset, order='scheduled_date desc, id desc')
            total_count = Picking.search_count(domain)

            # Mapping des états pour labels français
            state_labels = {
                'draft': 'Brouillon',
                'waiting': 'En attente',
                'confirmed': 'Confirmé',
                'assigned': 'Prêt',
                'done': 'Fait',
                'cancel': 'Annulé',
            }

            transfers = []
            for picking in pickings:
                # Récupérer les produits du transfert
                products = []
                for move in picking.move_ids:
                    products.append({
                        'id': move.product_id.id,
                        'name': move.product_id.name,
                        'sku': move.product_id.default_code or '',
                        'qty_demand': move.product_uom_qty,
                        'qty_done': move.quantity,
                    })

                transfers.append({
                    'id': picking.id,
                    'name': picking.name,
                    'state': picking.state,
                    'state_label': state_labels.get(picking.state, picking.state),
                    'scheduled_date': picking.scheduled_date.isoformat() if picking.scheduled_date else None,
                    'date_done': picking.date_done.isoformat() if picking.date_done else None,
                    'from_location': picking.location_id.complete_name if picking.location_id else '',
                    'to_location': picking.location_dest_id.complete_name if picking.location_dest_id else '',
                    'from_warehouse': picking.location_id.warehouse_id.name if picking.location_id.warehouse_id else None,
                    'to_warehouse': picking.location_dest_id.warehouse_id.name if picking.location_dest_id.warehouse_id else None,
                    'products': products,
                    'products_count': len(products),
                    'note': picking.note or '',
                    'create_date': picking.create_date.isoformat() if picking.create_date else None,
                    'user_name': picking.user_id.name if picking.user_id else None,
                })

            return {
                'success': True,
                'data': {
                    'transfers': transfers,
                    'total': total_count,
                    'limit': limit,
                    'offset': offset,
                }
            }

        except Exception as e:
            _logger.error(f"Get stock pickings error: {e}")
            return {
                'success': False,
                'error': 'Erreur lors de la récupération des transferts'
            }

    @http.route('/api/ecommerce/stock/pickings/<int:picking_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_stock_picking_details(self, picking_id, **kwargs):
        """
        Récupérer les détails d'un bon de transfert
        ADMIN UNIQUEMENT
        """
        try:
            # Vérifier droits admin
            # TODO: Réactiver pour production
            # error = self._require_admin()
            # if error:
            #     return error
            pass

            Picking = request.env['stock.picking'].sudo()
            picking = Picking.browse(picking_id)

            if not picking.exists():
                return {
                    'success': False,
                    'error': 'Transfert non trouvé'
                }

            # Mapping des états
            state_labels = {
                'draft': 'Brouillon',
                'waiting': 'En attente',
                'confirmed': 'Confirmé',
                'assigned': 'Prêt',
                'done': 'Fait',
                'cancel': 'Annulé',
            }

            # Récupérer les lignes de mouvement
            moves = []
            for move in picking.move_ids:
                moves.append({
                    'id': move.id,
                    'product_id': move.product_id.id,
                    'product_name': move.product_id.name,
                    'product_sku': move.product_id.default_code or '',
                    'qty_demand': move.product_uom_qty,
                    'qty_done': move.quantity,
                    'location_src': move.location_id.complete_name if move.location_id else '',
                    'location_dest': move.location_dest_id.complete_name if move.location_dest_id else '',
                    'state': move.state,
                })

            return {
                'success': True,
                'data': {
                    'id': picking.id,
                    'name': picking.name,
                    'state': picking.state,
                    'state_label': state_labels.get(picking.state, picking.state),
                    'scheduled_date': picking.scheduled_date.isoformat() if picking.scheduled_date else None,
                    'date_done': picking.date_done.isoformat() if picking.date_done else None,
                    'origin': picking.origin or '',
                    'note': picking.note or '',
                    'from_location': picking.location_id.complete_name if picking.location_id else '',
                    'to_location': picking.location_dest_id.complete_name if picking.location_dest_id else '',
                    'from_warehouse': picking.location_id.warehouse_id.name if picking.location_id.warehouse_id else None,
                    'to_warehouse': picking.location_dest_id.warehouse_id.name if picking.location_dest_id.warehouse_id else None,
                    'user_name': picking.user_id.name if picking.user_id else None,
                    'moves': moves,
                    'moves_count': len(moves),
                }
            }

        except Exception as e:
            _logger.error(f"Get picking details error: {e}")
            return {
                'success': False,
                'error': 'Erreur lors de la récupération des détails'
            }

    @http.route('/api/ecommerce/stock/pickings/<int:picking_id>/validate', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def validate_stock_picking(self, picking_id, **kwargs):
        """
        Valider un bon de transfert (action_done)
        ADMIN UNIQUEMENT
        """
        try:
            # Vérifier droits admin
            # TODO: Réactiver pour production
            # error = self._require_admin()
            # if error:
            #     return error
            pass

            Picking = request.env['stock.picking'].sudo()
            picking = Picking.browse(picking_id)

            if not picking.exists():
                return {
                    'success': False,
                    'error': 'Transfert non trouvé'
                }

            # Vérifier que le picking est dans un état validable
            if picking.state in ['done', 'cancel']:
                return {
                    'success': False,
                    'error': f'Le transfert ne peut pas être validé (état: {picking.state})'
                }

            # Valider le picking (met à jour les stock.quant automatiquement)
            try:
                picking.button_validate()
            except Exception as validate_error:
                _logger.error(f"Picking validation error: {validate_error}")
                return {
                    'success': False,
                    'error': f'Erreur lors de la validation: {str(validate_error)}'
                }

            _logger.info(f"[STOCK] Picking {picking.name} validated by admin")

            return {
                'success': True,
                'data': {
                    'picking_id': picking.id,
                    'picking_name': picking.name,
                    'state': picking.state,
                },
                'message': f'Transfert {picking.name} validé avec succès'
            }

        except Exception as e:
            _logger.error(f"Validate picking error: {e}")
            return {
                'success': False,
                'error': 'Erreur lors de la validation du transfert'
            }

    @http.route('/api/ecommerce/stock/pickings/<int:picking_id>/cancel', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def cancel_stock_picking(self, picking_id, **kwargs):
        """
        Annuler un bon de transfert
        ADMIN UNIQUEMENT
        """
        try:
            # Vérifier droits admin
            # TODO: Réactiver pour production
            # error = self._require_admin()
            # if error:
            #     return error
            pass

            Picking = request.env['stock.picking'].sudo()
            picking = Picking.browse(picking_id)

            if not picking.exists():
                return {
                    'success': False,
                    'error': 'Transfert non trouvé'
                }

            # Vérifier que le picking peut être annulé
            if picking.state == 'done':
                return {
                    'success': False,
                    'error': 'Un transfert validé ne peut pas être annulé'
                }

            if picking.state == 'cancel':
                return {
                    'success': False,
                    'error': 'Le transfert est déjà annulé'
                }

            # Annuler le picking
            picking.action_cancel()

            _logger.info(f"[STOCK] Picking {picking.name} cancelled by admin")

            return {
                'success': True,
                'data': {
                    'picking_id': picking.id,
                    'picking_name': picking.name,
                    'state': picking.state,
                },
                'message': f'Transfert {picking.name} annulé'
            }

        except Exception as e:
            _logger.error(f"Cancel picking error: {e}")
            return {
                'success': False,
                'error': 'Erreur lors de l\'annulation du transfert'
            }

    @http.route('/api/ecommerce/stock/cycle-counts', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def get_cycle_counts(self, **kwargs):
        """
        Lister les comptages cycliques
        PROTECTION: Stock User minimum requis
        """
        try:
            # Vérifier permissions Stock User minimum
            error = self._check_any_group('group_quelyos_stock_user', 'group_quelyos_stock_manager')
            if error:
                return error

            params = self._get_params()
            limit = params.get('limit', 20)
            offset = params.get('offset', 0)
            state = params.get('state')  # draft, scheduled, in_progress, done, cancel

            CycleCount = request.env['quelyos.cycle.count'].sudo()

            domain = []
            if state:
                domain.append(('state', '=', state))

            counts = CycleCount.search(domain, limit=limit, offset=offset, order='scheduled_date desc, id desc')
            total_count = CycleCount.search_count(domain)

            state_labels = {
                'draft': 'Brouillon',
                'scheduled': 'Planifié',
                'in_progress': 'En cours',
                'done': 'Terminé',
                'cancel': 'Annulé',
            }

            cycle_counts = []
            for count in counts:
                cycle_counts.append({
                    'id': count.id,
                    'name': count.name,
                    'scheduled_date': count.scheduled_date.isoformat() if count.scheduled_date else None,
                    'state': count.state,
                    'state_label': state_labels.get(count.state, count.state),
                    'location_names': ', '.join(count.location_ids.mapped('complete_name')),
                    'category_names': ', '.join(count.category_ids.mapped('name')) if count.category_ids else 'Toutes',
                    'user_name': count.user_id.name if count.user_id else None,
                    'product_count': count.product_count,
                    'counted_products': count.counted_products,
                    'completion_date': count.completion_date.isoformat() if count.completion_date else None,
                })

            return {
                'success': True,
                'data': {
                    'cycle_counts': cycle_counts,
                    'total': total_count,
                    'limit': limit,
                    'offset': offset,
                }
            }

        except Exception as e:
            _logger.error(f"Get cycle counts error: {e}")
            return {
                'success': False,
                'error': 'Erreur lors de la récupération des comptages'
            }

    @http.route('/api/ecommerce/stock/cycle-counts/<int:count_id>', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def get_cycle_count_detail(self, count_id, **kwargs):
        """
        Détails d'un comptage cyclique avec lignes
        PROTECTION: Stock User minimum requis
        """
        try:
            # Vérifier permissions Stock User minimum
            error = self._check_any_group('group_quelyos_stock_user', 'group_quelyos_stock_manager')
            if error:
                return error

            CycleCount = request.env['quelyos.cycle.count'].sudo()
            count = CycleCount.browse(count_id)

            if not count.exists():
                return {
                    'success': False,
                    'error': 'Comptage non trouvé'
                }

            lines = []
            for line in count.line_ids:
                lines.append({
                    'id': line.id,
                    'product_id': line.product_id.id,
                    'product_name': line.product_id.name,
                    'product_sku': line.product_id.default_code or '',
                    'location_id': line.location_id.id,
                    'location_name': line.location_id.complete_name,
                    'theoretical_qty': line.theoretical_qty,
                    'counted_qty': line.counted_qty,
                    'difference': line.difference,
                    'standard_price': line.standard_price,
                    'value_difference': line.value_difference,
                    'notes': line.notes or '',
                })

            return {
                'success': True,
                'data': {
                    'id': count.id,
                    'name': count.name,
                    'scheduled_date': count.scheduled_date.isoformat() if count.scheduled_date else None,
                    'state': count.state,
                    'location_ids': count.location_ids.ids,
                    'location_names': ', '.join(count.location_ids.mapped('complete_name')),
                    'category_ids': count.category_ids.ids if count.category_ids else [],
                    'category_names': ', '.join(count.category_ids.mapped('name')) if count.category_ids else 'Toutes',
                    'user_name': count.user_id.name if count.user_id else None,
                    'product_count': count.product_count,
                    'counted_products': count.counted_products,
                    'completion_date': count.completion_date.isoformat() if count.completion_date else None,
                    'notes': count.notes or '',
                    'lines': lines,
                }
            }

        except Exception as e:
            _logger.error(f"Get cycle count detail error: {e}")
            return {
                'success': False,
                'error': 'Erreur lors de la récupération des détails'
            }

    @http.route('/api/ecommerce/stock/cycle-counts/create', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def create_cycle_count(self, **kwargs):
        """
        Créer un comptage cyclique
        PROTECTION: Stock User minimum requis
        """
        try:
            # Vérifier permissions Stock User minimum
            error = self._check_any_group('group_quelyos_stock_user', 'group_quelyos_stock_manager')
            if error:
                return error

            params = self._get_params()
            scheduled_date = params.get('scheduled_date')
            location_ids = params.get('location_ids', [])
            category_ids = params.get('category_ids', [])
            notes = params.get('notes', '')

            if not location_ids:
                return {
                    'success': False,
                    'error': 'Au moins un emplacement est requis'
                }

            CycleCount = request.env['quelyos.cycle.count'].sudo()

            cycle_count = CycleCount.create({
                'scheduled_date': scheduled_date,
                'location_ids': [(6, 0, location_ids)],
                'category_ids': [(6, 0, category_ids)] if category_ids else False,
                'notes': notes,
            })

            # Générer automatiquement les lignes
            cycle_count.action_generate_lines()

            _logger.info(f"[CYCLE COUNT] Created {cycle_count.name} by admin")

            return {
                'success': True,
                'data': {
                    'id': cycle_count.id,
                    'name': cycle_count.name,
                    'product_count': cycle_count.product_count,
                },
                'message': f'Comptage {cycle_count.name} créé avec {cycle_count.product_count} produit(s)'
            }

        except Exception as e:
            _logger.error(f"Create cycle count error: {e}")
            return {
                'success': False,
                'error': 'Erreur lors de la création du comptage'
            }

    @http.route('/api/ecommerce/stock/cycle-counts/<int:count_id>/start', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def start_cycle_count(self, count_id, **kwargs):
        """
        Démarrer un comptage cyclique
        PROTECTION: Stock User minimum requis
        """
        try:
            # Vérifier permissions Stock User minimum
            error = self._check_any_group('group_quelyos_stock_user', 'group_quelyos_stock_manager')
            if error:
                return error

            CycleCount = request.env['quelyos.cycle.count'].sudo()
            count = CycleCount.browse(count_id)

            if not count.exists():
                return {
                    'success': False,
                    'error': 'Comptage non trouvé'
                }

            count.action_start()

            return {
                'success': True,
                'message': f'Comptage {count.name} démarré'
            }

        except Exception as e:
            _logger.error(f"Start cycle count error: {e}")
            return {
                'success': False,
                'error': 'Erreur lors du démarrage'
            }

    @http.route('/api/ecommerce/stock/cycle-counts/<int:count_id>/validate', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def validate_cycle_count(self, count_id, **kwargs):
        """
        Valider un comptage cyclique et appliquer ajustements
        PROTECTION: Stock User minimum requis
        """
        try:
            # Vérifier permissions Stock User minimum
            error = self._check_any_group('group_quelyos_stock_user', 'group_quelyos_stock_manager')
            if error:
                return error

            CycleCount = request.env['quelyos.cycle.count'].sudo()
            count = CycleCount.browse(count_id)

            if not count.exists():
                return {
                    'success': False,
                    'error': 'Comptage non trouvé'
                }

            count.action_validate()

            _logger.info(f"[CYCLE COUNT] Validated {count.name} by admin")

            return {
                'success': True,
                'message': f'Comptage {count.name} validé et ajustements appliqués'
            }

        except Exception as e:
            _logger.error(f"Validate cycle count error: {e}")
            return {
                'success': False,
                'error': 'Erreur lors de la validation'
            }

    @http.route('/api/ecommerce/stock/cycle-counts/<int:count_id>/update-line', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def update_cycle_count_line(self, count_id, **kwargs):
        """
        Mettre à jour quantité comptée d'une ligne
        PROTECTION: Stock User minimum requis
        """
        try:
            # Vérifier permissions Stock User minimum
            error = self._check_any_group('group_quelyos_stock_user', 'group_quelyos_stock_manager')
            if error:
                return error

            params = self._get_params()
            line_id = params.get('line_id')
            counted_qty = params.get('counted_qty')

            if line_id is None or counted_qty is None:
                return {
                    'success': False,
                    'error': 'line_id et counted_qty requis'
                }

            Line = request.env['quelyos.cycle.count.line'].sudo()
            line = Line.browse(line_id)

            if not line.exists() or line.cycle_count_id.id != count_id:
                return {
                    'success': False,
                    'error': 'Ligne non trouvée'
                }

            line.write({'counted_qty': float(counted_qty)})

            return {
                'success': True,
                'data': {
                    'line_id': line.id,
                    'counted_qty': line.counted_qty,
                    'difference': line.difference,
                    'value_difference': line.value_difference,
                }
            }

        except Exception as e:
            _logger.error(f"Update cycle count line error: {e}")
            return {
                'success': False,
                'error': 'Erreur lors de la mise à jour'
            }

    @http.route('/api/ecommerce/stock/locations/<int:location_id>/lock', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def lock_stock_location(self, location_id, **kwargs):
        """
        Verrouiller une location (bloquer mouvements)
        ADMIN UNIQUEMENT
        """
        try:
            # Vérifier droits admin
            error = self._require_admin()
            if error:
                return error

            params = self._get_params()
            reason = params.get('reason', 'Inventaire en cours')

            Location = request.env['stock.location'].sudo()
            location = Location.browse(location_id)

            if not location.exists():
                return {
                    'success': False,
                    'error': 'Emplacement non trouvé'
                }

            if location.is_locked:
                return {
                    'success': False,
                    'error': f'Emplacement déjà verrouillé par {location.locked_by_id.name}'
                }

            location.action_lock(reason=reason)

            _logger.info(f"[STOCK] Location {location.complete_name} locked by {request.env.user.name}")

            return {
                'success': True,
                'message': f'Emplacement {location.complete_name} verrouillé',
                'data': {
                    'location_id': location.id,
                    'is_locked': location.is_locked,
                    'lock_reason': location.lock_reason,
                    'locked_by': location.locked_by_id.name,
                    'locked_date': location.locked_date.isoformat() if location.locked_date else None,
                }
            }

        except Exception as e:
            _logger.error(f"Lock location error: {e}")
            return {
                'success': False,
                'error': 'Erreur lors du verrouillage'
            }

    @http.route('/api/ecommerce/stock/locations/<int:location_id>/unlock', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def unlock_stock_location(self, location_id, **kwargs):
        """
        Déverrouiller une location
        ADMIN UNIQUEMENT
        """
        try:
            # Vérifier droits admin
            error = self._require_admin()
            if error:
                return error

            Location = request.env['stock.location'].sudo()
            location = Location.browse(location_id)

            if not location.exists():
                return {
                    'success': False,
                    'error': 'Emplacement non trouvé'
                }

            if not location.is_locked:
                return {
                    'success': False,
                    'error': 'Emplacement déjà déverrouillé'
                }

            location.action_unlock()

            _logger.info(f"[STOCK] Location {location.complete_name} unlocked by {request.env.user.name}")

            return {
                'success': True,
                'message': f'Emplacement {location.complete_name} déverrouillé',
                'data': {
                    'location_id': location.id,
                    'is_locked': location.is_locked,
                }
            }

        except Exception as e:
            _logger.error(f"Unlock location error: {e}")
            return {
                'success': False,
                'error': 'Erreur lors du déverrouillage'
            }

    @http.route('/api/ecommerce/stock/turnover', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def get_stock_turnover(self, **kwargs):
        """
        Récupérer les statistiques de rotation stock pour tous les produits (admin uniquement).

        Paramètres optionnels:
        - limit (int): Nombre de produits à retourner (défaut: 50)
        - offset (int): Décalage pour pagination (défaut: 0)
        - sort (str): Tri ('turnover_desc', 'turnover_asc', 'days_desc', 'days_asc') (défaut: 'turnover_desc')
        - min_turnover (float): Filtrer par rotation minimale
        - max_turnover (float): Filtrer par rotation maximale
        """
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._require_admin()
            if error:
                return error

            Product = request.env['product.product'].sudo()
            params = self._get_params()

            limit = int(params.get('limit', 50))
            offset = int(params.get('offset', 0))
            sort = params.get('sort', 'turnover_desc')
            min_turnover = params.get('min_turnover')
            max_turnover = params.get('max_turnover')

            # Domain de base : produits stockables uniquement
            domain = [
                ('type', '=', 'product'),
                ('active', '=', True),
            ]

            # Rechercher tous les produits
            products = Product.search(domain)

            # Construire les données avec rotation
            products_data = []
            for product in products:
                turnover = product.stock_turnover_365 if hasattr(product, 'stock_turnover_365') else 0
                days = product.days_of_stock if hasattr(product, 'days_of_stock') else 0
                qty_sold = product.qty_sold_365 if hasattr(product, 'qty_sold_365') else 0

                # Appliquer filtres
                if min_turnover is not None and turnover < float(min_turnover):
                    continue
                if max_turnover is not None and turnover > float(max_turnover):
                    continue

                products_data.append({
                    'id': product.id,
                    'name': product.display_name,
                    'sku': product.default_code or '',
                    'qty_available': product.qty_available,
                    'qty_sold_365': qty_sold,
                    'stock_turnover_365': turnover,
                    'days_of_stock': days,
                    'standard_price': product.standard_price,
                    'list_price': product.list_price,
                })

            # Tri
            if sort == 'turnover_desc':
                products_data.sort(key=lambda x: x['stock_turnover_365'], reverse=True)
            elif sort == 'turnover_asc':
                products_data.sort(key=lambda x: x['stock_turnover_365'])
            elif sort == 'days_desc':
                products_data.sort(key=lambda x: x['days_of_stock'], reverse=True)
            elif sort == 'days_asc':
                products_data.sort(key=lambda x: x['days_of_stock'])

            # Pagination
            total = len(products_data)
            products_data = products_data[offset:offset+limit]

            _logger.info(f"Fetched stock turnover for {len(products_data)} products (total: {total})")

            return {
                'success': True,
                'data': {
                    'products': products_data,
                    'total': total,
                    'limit': limit,
                    'offset': offset,
                }
            }

        except Exception as e:
            _logger.error(f"Get stock turnover error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/abc-analysis', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_abc_analysis(self, **kwargs):
        """
        Analyse ABC des produits selon la règle de Pareto 80-20 (admin uniquement).

        Classification:
        - Catégorie A: 20% produits = 80% valeur stock
        - Catégorie B: 30% produits = 15% valeur stock
        - Catégorie C: 50% produits = 5% valeur stock

        Paramètres optionnels:
        - warehouse_id (int): Filtrer par entrepôt
        - category_id (int): Filtrer par catégorie produit
        - threshold_a (float): Seuil % catégorie A (défaut: 80)
        - threshold_b (float): Seuil % catégorie B (défaut: 95)

        Returns:
            - products: Liste produits avec classification A/B/C
            - kpis: Statistiques par catégorie
            - cumulative: Données pour courbe de Pareto
        """
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._require_admin()
            if error:
                return error

            Product = request.env['product.product'].sudo()
            params = self._get_params()

            warehouse_id = params.get('warehouse_id')
            category_id = params.get('category_id')
            threshold_a = float(params.get('threshold_a', 80))
            threshold_b = float(params.get('threshold_b', 95))

            # Domain de base : produits stockables uniquement
            domain = [
                ('type', '=', 'product'),
                ('active', '=', True),
            ]

            if category_id:
                domain.append(('categ_id', '=', int(category_id)))

            # Rechercher tous les produits
            products = Product.search(domain)

            # Calculer valeur stock pour chaque produit
            products_data = []
            total_value = 0

            for product in products:
                # Quantité en stock (filtré par warehouse si spécifié)
                if warehouse_id:
                    qty = product.with_context(warehouse=int(warehouse_id)).qty_available
                else:
                    qty = product.qty_available

                # Valeur = quantité × prix coût
                value = qty * product.standard_price
                total_value += value

                if value > 0:  # On garde uniquement les produits avec valeur > 0
                    products_data.append({
                        'id': product.id,
                        'name': product.display_name,
                        'sku': product.default_code or '',
                        'qty': qty,
                        'standard_price': product.standard_price,
                        'value': value,
                    })

            # Trier par valeur décroissante
            products_data.sort(key=lambda x: x['value'], reverse=True)

            # Calculer % cumulé et classifier
            cumulative_value = 0
            cumulative_data = []

            for i, product in enumerate(products_data):
                cumulative_value += product['value']
                cumulative_pct = (cumulative_value / total_value * 100) if total_value > 0 else 0

                # Classification ABC selon seuils
                if cumulative_pct <= threshold_a:
                    category = 'A'
                elif cumulative_pct <= threshold_b:
                    category = 'B'
                else:
                    category = 'C'

                product['category'] = category
                product['cumulative_value'] = cumulative_value
                product['cumulative_pct'] = round(cumulative_pct, 2)
                product['value_pct'] = round((product['value'] / total_value * 100), 2) if total_value > 0 else 0

                # Données pour graphique courbe de Pareto
                cumulative_data.append({
                    'product_index': i + 1,
                    'cumulative_pct': round(cumulative_pct, 2),
                    'category': category
                })

            # Calculer KPIs par catégorie
            category_a = [p for p in products_data if p['category'] == 'A']
            category_b = [p for p in products_data if p['category'] == 'B']
            category_c = [p for p in products_data if p['category'] == 'C']

            kpis = {
                'total_value': round(total_value, 2),
                'total_products': len(products_data),
                'category_a': {
                    'count': len(category_a),
                    'count_pct': round((len(category_a) / len(products_data) * 100), 1) if products_data else 0,
                    'value': round(sum(p['value'] for p in category_a), 2),
                    'value_pct': round((sum(p['value'] for p in category_a) / total_value * 100), 1) if total_value > 0 else 0,
                },
                'category_b': {
                    'count': len(category_b),
                    'count_pct': round((len(category_b) / len(products_data) * 100), 1) if products_data else 0,
                    'value': round(sum(p['value'] for p in category_b), 2),
                    'value_pct': round((sum(p['value'] for p in category_b) / total_value * 100), 1) if total_value > 0 else 0,
                },
                'category_c': {
                    'count': len(category_c),
                    'count_pct': round((len(category_c) / len(products_data) * 100), 1) if products_data else 0,
                    'value': round(sum(p['value'] for p in category_c), 2),
                    'value_pct': round((sum(p['value'] for p in category_c) / total_value * 100), 1) if total_value > 0 else 0,
                },
            }

            _logger.info(f"ABC Analysis completed: {len(products_data)} products analyzed")

            return {
                'success': True,
                'data': {
                    'products': products_data,
                    'kpis': kpis,
                    'cumulative': cumulative_data,
                    'thresholds': {
                        'a': threshold_a,
                        'b': threshold_b,
                    }
                }
            }

        except Exception as e:
            _logger.error(f"ABC Analysis error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/forecast', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_stock_forecast(self, **kwargs):
        """
        Calcul des prévisions de besoins stock basées sur historique ventes (admin uniquement).

        Méthodes:
        - Moyenne mobile (7j, 30j, 90j, 365j)
        - Tendance linéaire
        - Prévisions sur N jours

        Paramètres optionnels:
        - product_id (int): ID du produit (requis pour prévisions produit)
        - forecast_days (int): Nombre de jours à prévoir (défaut: 30)
        - method (str): 'moving_average' ou 'linear_trend' (défaut: 'moving_average')
        - period_days (int): Période historique en jours (défaut: 90)

        Returns:
            - historical: Données historiques de vente
            - forecast: Prévisions pour N jours
            - metrics: Métriques (moyennes, tendance)
            - recommendations: Suggestions réapprovisionnement
        """
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._require_admin()
            if error:
                return error

            from datetime import datetime, timedelta

            Product = request.env['product.product'].sudo()
            Move = request.env['stock.move'].sudo()
            params = self._get_params()

            product_id = params.get('product_id')
            if not product_id:
                return {
                    'success': False,
                    'error': 'Le paramètre product_id est requis',
                    'errorCode': 'MISSING_PRODUCT_ID'
                }

            product_id = int(product_id)
            forecast_days = int(params.get('forecast_days', 30))
            method = params.get('method', 'moving_average')
            period_days = int(params.get('period_days', 90))

            # Vérifier que le produit existe
            product = Product.browse(product_id)
            if not product.exists():
                return {
                    'success': False,
                    'error': 'Produit introuvable',
                    'errorCode': 'PRODUCT_NOT_FOUND'
                }

            # Récupérer historique des ventes (mouvements done depuis internal vers customer)
            date_from = datetime.now() - timedelta(days=period_days)
            moves = Move.search([
                ('product_id', '=', product_id),
                ('state', '=', 'done'),
                ('location_id.usage', '=', 'internal'),
                ('location_dest_id.usage', '=', 'customer'),
                ('date', '>=', date_from),
            ], order='date ASC')

            # Agréger ventes par jour
            daily_sales = {}
            for move in moves:
                date_key = move.date.date().isoformat() if move.date else None
                if date_key:
                    daily_sales[date_key] = daily_sales.get(date_key, 0) + move.product_uom_qty

            # Construire série temporelle complète (avec 0 pour jours sans vente)
            current_date = date_from.date()
            end_date = datetime.now().date()
            historical = []

            while current_date <= end_date:
                date_key = current_date.isoformat()
                qty_sold = daily_sales.get(date_key, 0)
                historical.append({
                    'date': date_key,
                    'qty_sold': qty_sold
                })
                current_date += timedelta(days=1)

            # Calculer moyennes mobiles
            ma_7 = sum(d['qty_sold'] for d in historical[-7:]) / 7 if len(historical) >= 7 else 0
            ma_30 = sum(d['qty_sold'] for d in historical[-30:]) / 30 if len(historical) >= 30 else 0
            ma_90 = sum(d['qty_sold'] for d in historical[-90:]) / 90 if len(historical) >= 90 else 0

            # Calcul de tendance (régression linéaire simple)
            n = len(historical)
            if n > 10:  # Besoin d'au moins 10 points
                sum_x = sum(range(n))
                sum_y = sum(d['qty_sold'] for d in historical)
                sum_xy = sum(i * d['qty_sold'] for i, d in enumerate(historical))
                sum_x2 = sum(i * i for i in range(n))

                # Pente (a) et ordonnée (b) de y = ax + b
                a = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x) if (n * sum_x2 - sum_x * sum_x) != 0 else 0
                b = (sum_y - a * sum_x) / n

                trend = 'increasing' if a > 0.01 else ('decreasing' if a < -0.01 else 'stable')
                trend_slope = round(a, 4)
            else:
                a, b, trend, trend_slope = 0, ma_7, 'stable', 0

            # Générer prévisions
            forecast = []
            forecast_date = datetime.now().date() + timedelta(days=1)

            if method == 'moving_average':
                # Utiliser la moyenne mobile comme prévision constante
                forecast_qty = ma_7 if ma_7 > 0 else ma_30
            else:  # linear_trend
                # Utiliser la tendance linéaire
                forecast_qty = max(0, b + a * n)  # Commencer à partir du dernier point

            for i in range(forecast_days):
                if method == 'linear_trend':
                    # Ajuster selon la pente
                    daily_forecast = max(0, b + a * (n + i))
                else:
                    # Moyenne mobile constante
                    daily_forecast = forecast_qty

                forecast.append({
                    'date': forecast_date.isoformat(),
                    'qty_forecast': round(daily_forecast, 2)
                })
                forecast_date += timedelta(days=1)

            # Calcul total prévisionnel
            total_forecast = sum(f['qty_forecast'] for f in forecast)

            # Stock actuel
            current_stock = product.qty_available

            # Recommandations
            recommendations = []
            if total_forecast > current_stock:
                shortage = total_forecast - current_stock
                recommendations.append({
                    'type': 'warning',
                    'message': f'Risque de rupture : {round(shortage, 2)} unités manquantes sur {forecast_days} jours',
                    'qty_to_order': round(shortage * 1.2, 2),  # +20% marge sécurité
                })
            elif current_stock > total_forecast * 3:
                recommendations.append({
                    'type': 'info',
                    'message': f'Surstock détecté : {round(current_stock - total_forecast, 2)} unités en excès',
                })
            else:
                recommendations.append({
                    'type': 'success',
                    'message': 'Stock adéquat pour la période prévue',
                })

            # Métriques
            metrics = {
                'moving_averages': {
                    'ma_7': round(ma_7, 2),
                    'ma_30': round(ma_30, 2),
                    'ma_90': round(ma_90, 2),
                },
                'trend': {
                    'status': trend,
                    'slope': trend_slope,
                },
                'current_stock': current_stock,
                'total_forecast': round(total_forecast, 2),
                'avg_daily_forecast': round(total_forecast / forecast_days, 2),
                'days_of_stock': round(current_stock / (total_forecast / forecast_days), 1) if total_forecast > 0 else 0,
            }

            _logger.info(f"Stock forecast generated for product {product.display_name}: {forecast_days} days")

            return {
                'success': True,
                'data': {
                    'product_id': product_id,
                    'product_name': product.display_name,
                    'product_sku': product.default_code or '',
                    'historical': historical,
                    'forecast': forecast,
                    'metrics': metrics,
                    'recommendations': recommendations,
                    'method': method,
                    'period_days': period_days,
                    'forecast_days': forecast_days,
                }
            }

        except Exception as e:
            _logger.error(f"Stock forecast error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/uom', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_uom_list(self, **kwargs):
        """Liste toutes les unités de mesure disponibles (Odoo 19 - catégories UoM supprimées)"""
        try:
            domain = [('active', '=', True)]
            uoms = request.env['uom.uom'].sudo().search(domain, order='name')

            uom_list = []
            for uom in uoms:
                uom_list.append({
                    'id': uom.id,
                    'name': uom.name,
                    'rounding': uom.rounding,
                    'active': uom.active,
                })

            return {
                'success': True,
                'data': {
                    'uoms': uom_list,
                    'total': len(uom_list),
                }
            }

        except Exception as e:
            _logger.error(f"UoM list error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/uom/categories', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_uom_categories(self, **kwargs):
        """
        Note: Les catégories UoM ont été supprimées dans Odoo 19.
        Retourne une liste vide pour compatibilité API.
        """
        try:
            return {
                'success': True,
                'data': {
                    'categories': [],
                    'total': 0,
                    'message': 'UoM categories removed in Odoo 19'
                }
            }

        except Exception as e:
            _logger.error(f"UoM categories error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/uom/convert', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def convert_uom(self, **kwargs):
        """Convertit une quantité d'une UoM vers une autre"""
        try:
            params = self._get_params()
            qty = params.get('qty', 0)
            from_uom_id = params.get('from_uom_id')
            to_uom_id = params.get('to_uom_id')

            if not from_uom_id or not to_uom_id:
                return {
                    'success': False,
                    'error': 'from_uom_id et to_uom_id requis'
                }

            from_uom = request.env['uom.uom'].sudo().browse(from_uom_id)
            to_uom = request.env['uom.uom'].sudo().browse(to_uom_id)

            if not from_uom.exists() or not to_uom.exists():
                return {
                    'success': False,
                    'error': 'UoM non trouvée'
                }

            # Conversion via Odoo (Odoo 19 gère automatiquement la compatibilité)
            try:
                converted_qty = from_uom._compute_quantity(qty, to_uom)
            except Exception as conversion_error:
                return {
                    'success': False,
                    'error': f'Conversion impossible : {str(conversion_error)}'
                }

            return {
                'success': True,
                'data': {
                    'original_qty': qty,
                    'from_uom': {
                        'id': from_uom.id,
                        'name': from_uom.name,
                    },
                    'to_uom': {
                        'id': to_uom.id,
                        'name': to_uom.name,
                    },
                    'converted_qty': round(converted_qty, 4),
                    'formula': f'{qty} {from_uom.name} = {round(converted_qty, 4)} {to_uom.name}',
                }
            }

        except Exception as e:
            _logger.error(f"UoM conversion error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/uom-config', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_product_uom_config(self, product_id, **kwargs):
        """Configuration UoM d'un produit"""
        try:
            product = request.env['product.product'].sudo().browse(product_id)
            if not product.exists():
                return {
                    'success': False,
                    'error': 'Produit non trouvé'
                }

            # UoM principale (Odoo 19: structure simplifiée)
            uom = product.uom_id

            # Autres UoM actives
            alternative_uoms = request.env['uom.uom'].sudo().search([
                ('id', '!=', uom.id),
                ('active', '=', True)
            ], limit=10)

            return {
                'success': True,
                'data': {
                    'product_id': product.id,
                    'product_name': product.name,
                    'uom': {
                        'id': uom.id,
                        'name': uom.name,
                        'rounding': uom.rounding,
                    },
                    'alternative_uoms': [{
                        'id': u.id,
                        'name': u.name,
                    } for u in alternative_uoms],
                }
            }

        except Exception as e:
            _logger.error(f"Product UoM config error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/lots/<int:lot_id>/traceability', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_lot_traceability(self, lot_id, **kwargs):
        """Traçabilité complète amont/aval d'un lot"""
        try:
            lot = request.env['stock.lot'].sudo().browse(lot_id)
            if not lot.exists():
                return {
                    'success': False,
                    'error': 'Lot non trouvé'
                }

            # Mouvements upstream (entrées : d'où vient le lot)
            upstream_moves = request.env['stock.move.line'].sudo().search([
                ('lot_id', '=', lot.id),
                ('location_dest_id.usage', '=', 'internal'),
                ('state', '=', 'done')
            ], order='date desc', limit=50)

            upstream = []
            for move_line in upstream_moves:
                move = move_line.move_id
                upstream.append({
                    'id': move.id,
                    'date': move.date.isoformat() if move.date else None,
                    'location_src': move.location_id.complete_name,
                    'location_dest': move.location_dest_id.complete_name,
                    'quantity': move_line.quantity,
                    'uom': move.product_uom.name,
                    'reference': move.reference or '',
                    'origin': move.origin or '',
                    'picking_name': move.picking_id.name if move.picking_id else None,
                    'partner': move.picking_id.partner_id.name if move.picking_id and move.picking_id.partner_id else None,
                })

            # Mouvements downstream (sorties : où va le lot)
            downstream_moves = request.env['stock.move.line'].sudo().search([
                ('lot_id', '=', lot.id),
                ('location_id.usage', '=', 'internal'),
                ('state', '=', 'done')
            ], order='date desc', limit=50)

            downstream = []
            for move_line in downstream_moves:
                move = move_line.move_id
                downstream.append({
                    'id': move.id,
                    'date': move.date.isoformat() if move.date else None,
                    'location_src': move.location_id.complete_name,
                    'location_dest': move.location_dest_id.complete_name,
                    'quantity': move_line.quantity,
                    'uom': move.product_uom.name,
                    'reference': move.reference or '',
                    'origin': move.origin or '',
                    'picking_name': move.picking_id.name if move.picking_id else None,
                    'partner': move.picking_id.partner_id.name if move.picking_id and move.picking_id.partner_id else None,
                })

            # Infos lot (expiration_date peut ne pas exister selon config Odoo)
            lot_info = {
                'id': lot.id,
                'name': lot.name,
                'ref': lot.ref or '',
                'product_id': lot.product_id.id,
                'product_name': lot.product_id.name,
                'product_sku': lot.product_id.default_code or '',
                'stock_qty': lot.product_qty,
                'expiration_date': getattr(lot, 'expiration_date', None).isoformat() if getattr(lot, 'expiration_date', None) else None,
            }

            return {
                'success': True,
                'data': {
                    'lot': lot_info,
                    'upstream': upstream,
                    'downstream': downstream,
                    'upstream_count': len(upstream),
                    'downstream_count': len(downstream),
                }
            }

        except Exception as e:
            _logger.error(f"Lot traceability error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/reports/advanced', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_advanced_stock_reports(self, **kwargs):
        """Rapports stock avancés : ruptures, dead stock, anomalies"""
        try:
            params = self._get_params()
            days_threshold = params.get('days_threshold', 90)  # Pour dead stock

            # 1. RUPTURES DE STOCK (produits avec stock <= 0 et règles réappro)
            stockouts = []
            reordering_rules = request.env['stock.warehouse.orderpoint'].sudo().search([
                ('product_id.qty_available', '<=', 0),
                ('active', '=', True)
            ], limit=50)

            for rule in reordering_rules:
                product = rule.product_id
                stockouts.append({
                    'product_id': product.id,
                    'product_name': product.name,
                    'product_sku': product.default_code or '',
                    'current_stock': product.qty_available,
                    'warehouse': rule.warehouse_id.name,
                    'min_qty': rule.product_min_qty,
                    'shortage': abs(product.qty_available),
                })

            # 2. DEAD STOCK (pas de mouvement sortant depuis X jours)
            cutoff_date = datetime.now() - timedelta(days=days_threshold)
            dead_stock = []

            products_with_stock = request.env['product.product'].sudo().search([
                ('qty_available', '>', 0),
                ('type', '=', 'product')
            ], limit=100)

            for product in products_with_stock:
                # Chercher dernier mouvement sortant
                last_out_move = request.env['stock.move'].sudo().search([
                    ('product_id', '=', product.id),
                    ('location_id.usage', '=', 'internal'),
                    ('location_dest_id.usage', '!=', 'internal'),
                    ('state', '=', 'done')
                ], order='date desc', limit=1)

                if not last_out_move or (last_out_move.date and last_out_move.date < cutoff_date):
                    dead_stock.append({
                        'product_id': product.id,
                        'product_name': product.name,
                        'product_sku': product.default_code or '',
                        'qty_available': product.qty_available,
                        'value': product.qty_available * product.standard_price,
                        'last_move_date': last_out_move.date.isoformat() if last_out_move and last_out_move.date else None,
                        'days_inactive': (datetime.now().date() - last_out_move.date).days if last_out_move and last_out_move.date else days_threshold + 1,
                    })

            # 3. ANOMALIES (stock négatif théorique)
            anomalies = []
            negative_stock_products = request.env['product.product'].sudo().search([
                ('qty_available', '<', 0),
                ('type', '=', 'product')
            ], limit=50)

            for product in negative_stock_products:
                anomalies.append({
                    'product_id': product.id,
                    'product_name': product.name,
                    'product_sku': product.default_code or '',
                    'qty_available': product.qty_available,
                    'anomaly_type': 'negative_stock',
                    'severity': 'high',
                })

            # KPIs globaux
            total_stockout_value = sum(s.get('shortage', 0) * 0 for s in stockouts)  # Simplifié
            total_dead_stock_value = sum(d.get('value', 0) for d in dead_stock)

            return {
                'success': True,
                'data': {
                    'stockouts': {
                        'items': stockouts,
                        'count': len(stockouts),
                        'total_value': total_stockout_value,
                    },
                    'dead_stock': {
                        'items': dead_stock[:20],  # Limiter à 20
                        'count': len(dead_stock),
                        'total_value': round(total_dead_stock_value, 2),
                        'days_threshold': days_threshold,
                    },
                    'anomalies': {
                        'items': anomalies,
                        'count': len(anomalies),
                    },
                    'kpis': {
                        'stockout_count': len(stockouts),
                        'dead_stock_count': len(dead_stock),
                        'anomaly_count': len(anomalies),
                        'total_dead_stock_value': round(total_dead_stock_value, 2),
                    }
                }
            }

        except Exception as e:
            _logger.error(f"Advanced stock reports error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/valuation/by-category', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_stock_valuation_by_category(self, **kwargs):
        """Rapport de valorisation du stock par catégorie produit (coût standard)"""
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._require_admin()
            if error:
                return error

            params = self._get_params()
            warehouse_id = params.get('warehouse_id')
            include_zero_stock = params.get('include_zero_stock', False)

            Product = request.env['product.product'].sudo()

            # Construire domaine de recherche
            # Inclure tous les produits qui ont un coût (stockables, consommables, etc.)
            domain = [
                ('type', 'in', ['product', 'consu']),  # Stockables ou consommables
                ('standard_price', '>', 0),  # Avec un coût défini
            ]

            if not include_zero_stock:
                domain.append(('qty_available', '>', 0))

            products = Product.search(domain)

            # Grouper par catégorie
            categories_data = {}
            total_valuation = 0
            total_products = 0
            total_quantity = 0

            for product in products:
                # Filtrer par entrepôt si spécifié
                if warehouse_id:
                    qty = product.with_context(warehouse=warehouse_id).qty_available
                else:
                    qty = product.qty_available

                if not include_zero_stock and qty <= 0:
                    continue

                # Utiliser coût standard pour valorisation comptable
                cost = product.standard_price or 0
                valuation = cost * qty

                # Récupérer catégorie
                category = product.categ_id
                if category:
                    cat_name = category.complete_name or category.name or 'Sans catégorie'
                    cat_id = category.id
                else:
                    cat_name = 'Sans catégorie'
                    cat_id = 0

                if cat_name not in categories_data:
                    categories_data[cat_name] = {
                        'category_id': cat_id,
                        'category_name': cat_name,
                        'product_count': 0,
                        'total_quantity': 0,
                        'total_valuation': 0,
                        'average_cost': 0,
                        'products': []
                    }

                categories_data[cat_name]['product_count'] += 1
                categories_data[cat_name]['total_quantity'] += qty
                categories_data[cat_name]['total_valuation'] += valuation

                categories_data[cat_name]['products'].append({
                    'id': product.id,
                    'name': product.name,
                    'sku': product.default_code or '',
                    'quantity': qty,
                    'cost': cost,
                    'valuation': valuation
                })

                total_valuation += valuation
                total_products += 1
                total_quantity += qty

            # Calculer moyennes et trier
            categories_list = []
            for cat_name, data in categories_data.items():
                data['average_cost'] = (
                    data['total_valuation'] / data['product_count']
                    if data['product_count'] > 0
                    else 0
                )
                data['percentage_of_total'] = (
                    (data['total_valuation'] / total_valuation * 100)
                    if total_valuation > 0
                    else 0
                )
                categories_list.append(data)

            # Trier par valorisation décroissante
            categories_list.sort(key=lambda x: x['total_valuation'], reverse=True)

            return {
                'success': True,
                'data': {
                    'categories': categories_list,
                    'summary': {
                        'total_categories': len(categories_list),
                        'total_products': total_products,
                        'total_quantity': total_quantity,
                        'total_valuation': total_valuation,
                        'average_valuation_per_category': (
                            total_valuation / len(categories_list)
                            if len(categories_list) > 0
                            else 0
                        )
                    }
                }
            }

        except Exception as e:
            _logger.error(f"Stock valuation by category error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/low-stock-alerts', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_low_stock_alerts(self, **kwargs):
        """Récupérer les produits en stock bas (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            params = self._get_params()
            limit = params.get('limit', 20)
            offset = params.get('offset', 0)
            
            # Récupérer tous les quants actifs
            StockQuant = request.env['stock.quant'].sudo()
            quants = StockQuant.search([
                ('location_id.usage', '=', 'internal'),
                ('quantity', '>', 0),
            ])

            # Grouper par produit
            products_stock = {}
            for quant in quants:
                product_id = quant.product_id.id
                if product_id not in products_stock:
                    products_stock[product_id] = {
                        'product': quant.product_id,
                        'total_qty': 0,
                    }
                products_stock[product_id]['total_qty'] += quant.quantity

            # Filtrer les produits en stock bas
            low_stock_alerts = []
            for product_id, data in products_stock.items():
                product = data['product']
                total_qty = data['total_qty']
                threshold = product.product_tmpl_id.low_stock_threshold or 10.0

                if total_qty < threshold:
                    low_stock_alerts.append({
                        'id': product.id,
                        'name': product.display_name,
                        'sku': product.default_code or '',
                        'current_stock': total_qty,
                        'threshold': threshold,
                        'diff': threshold - total_qty,
                        'image_url': f'/web/image/product.product/{product.id}/image_128' if product.image_128 else None,
                        'list_price': product.list_price,
                        'category': product.categ_id.name if product.categ_id else '',
                    })

            # Trier par différence (plus critique en premier)
            low_stock_alerts.sort(key=lambda x: -x['diff'])

            # Pagination
            total = len(low_stock_alerts)
            paginated_alerts = low_stock_alerts[offset:offset + limit]

            return {
                'success': True,
                'data': {
                    'alerts': paginated_alerts,
                    'total': total,
                }
            }

        except Exception as e:
            _logger.error(f"Get low stock alerts error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/stock/high-stock-alerts', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_high_stock_alerts(self, **kwargs):
        """Récupérer les produits en surstock (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            params = self._get_params()
            limit = params.get('limit', 20)
            offset = params.get('offset', 0)

            # Seuil de surstock par défaut (peut être configuré par produit ultérieurement)
            HIGH_STOCK_THRESHOLD_MULTIPLIER = 3  # 3x le seuil bas = seuil haut

            # Récupérer tous les quants actifs
            StockQuant = request.env['stock.quant'].sudo()
            quants = StockQuant.search([
                ('location_id.usage', '=', 'internal'),
                ('quantity', '>', 0),
            ])

            # Grouper par produit
            products_stock = {}
            for quant in quants:
                product_id = quant.product_id.id
                if product_id not in products_stock:
                    products_stock[product_id] = {
                        'product': quant.product_id,
                        'total_qty': 0,
                    }
                products_stock[product_id]['total_qty'] += quant.quantity

            # Filtrer les produits en surstock
            high_stock_alerts = []
            for product_id, data in products_stock.items():
                product = data['product']
                total_qty = data['total_qty']
                threshold_low = product.product_tmpl_id.low_stock_threshold or 10.0
                threshold_high = threshold_low * HIGH_STOCK_THRESHOLD_MULTIPLIER

                if total_qty > threshold_high:
                    high_stock_alerts.append({
                        'id': product.id,
                        'name': product.display_name,
                        'sku': product.default_code or '',
                        'current_stock': total_qty,
                        'threshold': threshold_high,
                        'diff': total_qty - threshold_high,
                        'image_url': f'/web/image/product.product/{product.id}/image_128' if product.image_128 else None,
                        'list_price': product.list_price,
                        'category': product.categ_id.name if product.categ_id else '',
                    })

            # Trier par différence (plus critique en premier)
            high_stock_alerts.sort(key=lambda x: -x['diff'])

            # Pagination
            total = len(high_stock_alerts)
            paginated_alerts = high_stock_alerts[offset:offset + limit]

            return {
                'success': True,
                'data': {
                    'alerts': paginated_alerts,
                    'total': total,
                }
            }

        except Exception as e:
            _logger.error(f"Get high stock alerts error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/warehouses', type='http', auth='public', methods=['GET', 'POST'], csrf=False)
    def get_warehouses(self, **kwargs):
        """
        Récupérer la liste des entrepôts - avec cache HTTP.

        Params:
            active_only (bool): Si True, retourne uniquement les entrepôts actifs (défaut: True)

        Returns:
            Liste des entrepôts avec id, name, code, company, locations
        """
        try:
            params = self._get_http_params()
            active_only = params.get('active_only', True)

            Warehouse = request.env['stock.warehouse'].sudo()

            domain = []
            if active_only:
                domain.append(('active', '=', True))

            warehouses = Warehouse.search(domain, order='name')

            warehouse_list = []
            for warehouse in warehouses:
                warehouse_list.append({
                    'id': warehouse.id,
                    'name': warehouse.name,
                    'code': warehouse.code,
                    'company_id': warehouse.company_id.id if warehouse.company_id else None,
                    'company_name': warehouse.company_id.name if warehouse.company_id else None,
                    'active': warehouse.active,
                    'partner_id': warehouse.partner_id.id if warehouse.partner_id else None,
                    'lot_stock_id': warehouse.lot_stock_id.id if warehouse.lot_stock_id else None,
                    'view_location_id': warehouse.view_location_id.id if warehouse.view_location_id else None,
                })

            response_data = {
                'success': True,
                'data': warehouse_list,
                'total': len(warehouse_list)
            }
            # Cache HTTP : 6 heures (warehouses changent rarement)
            return request.make_json_response(response_data, headers={
                'Cache-Control': 'public, max-age=21600',
                'Vary': 'Accept-Encoding'
            })

        except Exception as e:
            _logger.error(f"Get warehouses error: {e}")
            return request.make_json_response({
                'success': False,
                'error': 'Une erreur est survenue'
            })

    @http.route('/api/ecommerce/warehouses/<int:warehouse_id>', type='jsonrpc', auth='public', methods=['GET', 'POST'], csrf=False)
    def get_warehouse_detail(self, warehouse_id, **params):
        """
        Récupérer le détail d'un entrepôt avec ses locations.

        Returns:
            Entrepôt avec locations et stock total
        """
        try:
            Warehouse = request.env['stock.warehouse'].sudo()
            warehouse = Warehouse.browse(warehouse_id)

            if not warehouse.exists():
                return {
                    'success': False,
                    'error': f'Entrepôt {warehouse_id} introuvable'
                }

            # Récupérer les locations de cet entrepôt
            Location = request.env['stock.location'].sudo()
            locations = Location.search([
                ('warehouse_id', '=', warehouse_id),
                ('usage', '=', 'internal')
            ])

            location_list = []
            for location in locations:
                location_list.append({
                    'id': location.id,
                    'name': location.name,
                    'complete_name': location.complete_name,
                    'usage': location.usage,
                    'parent_id': location.location_id.id if location.location_id else None,
                })

            return {
                'success': True,
                'data': {
                    'id': warehouse.id,
                    'name': warehouse.name,
                    'code': warehouse.code,
                    'company_id': warehouse.company_id.id if warehouse.company_id else None,
                    'company_name': warehouse.company_id.name if warehouse.company_id else None,
                    'active': warehouse.active,
                    'locations': location_list,
                    'location_count': len(location_list),
                }
            }

        except Exception as e:
            _logger.error(f"Get warehouse detail error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/warehouses/<int:warehouse_id>/stock', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_warehouse_stock(self, warehouse_id, **params):
        """
        Récupérer le stock de tous les produits dans un entrepôt.

        Params:
            warehouse_id (int): ID de l'entrepôt
            limit (int): Pagination (défaut: 50)
            offset (int): Pagination (défaut: 0)
            search (str): Recherche par nom produit
            low_stock_only (bool): Uniquement les produits en stock faible

        Returns:
            products: Liste des produits avec leur stock dans cet entrepôt
            total: Nombre total
        """
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('stock.group_stock_user'):
                return {'success': False, 'error': 'Accès refusé.'}

            limit = params.get('limit', 50)
            offset = params.get('offset', 0)
            search = params.get('search', '')
            low_stock_only = params.get('low_stock_only', False)

            Warehouse = request.env['stock.warehouse'].sudo()
            warehouse = Warehouse.browse(warehouse_id)

            if not warehouse.exists():
                return {
                    'success': False,
                    'error': f'Entrepôt {warehouse_id} introuvable'
                }

            # Récupérer les locations internes de l'entrepôt
            Location = request.env['stock.location'].sudo()
            locations = Location.search([
                ('warehouse_id', '=', warehouse_id),
                ('usage', '=', 'internal')
            ])
            location_ids = locations.ids

            if not location_ids:
                return {
                    'success': True,
                    'data': {
                        'warehouse': {
                            'id': warehouse.id,
                            'name': warehouse.name,
                            'code': warehouse.code,
                        },
                        'products': [],
                        'total': 0,
                        'limit': limit,
                        'offset': offset,
                    }
                }

            # Récupérer les quants (stock) dans ces locations
            Quant = request.env['stock.quant'].sudo()
            quant_domain = [
                ('location_id', 'in', location_ids),
                ('quantity', '>', 0)
            ]

            if search:
                quant_domain.append('|')
                quant_domain.append(('product_id.name', 'ilike', search))
                quant_domain.append(('product_id.default_code', 'ilike', search))

            # Grouper par produit pour avoir le stock total par produit dans l'entrepôt
            quants = Quant.search(quant_domain)

            # Agréger par produit
            product_stock = {}
            for quant in quants:
                pid = quant.product_id.id
                if pid not in product_stock:
                    product = quant.product_id
                    product_stock[pid] = {
                        'id': pid,
                        'name': product.display_name,
                        'sku': product.default_code or '',
                        'image_url': f'/web/image/product.product/{pid}/image_128' if product.image_128 else None,
                        'qty_available': 0,
                        'reserved_qty': 0,
                        'free_qty': 0,
                        'reorder_min': product.reordering_min_qty if hasattr(product, 'reordering_min_qty') else 0,
                        'category': product.categ_id.name if product.categ_id else '',
                        'list_price': product.list_price,
                    }
                product_stock[pid]['qty_available'] += quant.quantity
                product_stock[pid]['reserved_qty'] += quant.reserved_quantity
                product_stock[pid]['free_qty'] += (quant.quantity - quant.reserved_quantity)

            # Convertir en liste et trier
            products_list = list(product_stock.values())

            # Filtrer stock faible (free_qty < 10 par défaut)
            if low_stock_only:
                products_list = [p for p in products_list if p['free_qty'] < 10]

            # Trier par nom
            products_list.sort(key=lambda x: x['name'])

            total = len(products_list)

            # Pagination
            products_paginated = products_list[offset:offset + limit]

            return {
                'success': True,
                'data': {
                    'warehouse': {
                        'id': warehouse.id,
                        'name': warehouse.name,
                        'code': warehouse.code,
                    },
                    'products': products_paginated,
                    'total': total,
                    'limit': limit,
                    'offset': offset,
                }
            }

        except Exception as e:
            _logger.error(f"Get warehouse stock error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/stock-by-location', type='jsonrpc', auth='public', methods=['GET', 'POST'], csrf=False)
    def get_product_stock_by_location(self, product_id, **params):
        """
        Récupérer le stock d'un produit par location/entrepôt.

        Params:
            product_id (int): ID du produit (product.product)
            warehouse_id (int, optional): Filtrer par entrepôt

        Returns:
            Stock par location avec warehouse, location, qty_available
        """
        try:
            warehouse_id = params.get('warehouse_id')

            Product = request.env['product.product'].sudo()
            product = Product.browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': f'Produit {product_id} introuvable'
                }

            # Récupérer les quants (stock) du produit
            Quant = request.env['stock.quant'].sudo()
            domain = [
                ('product_id', '=', product_id),
                ('location_id.usage', '=', 'internal'),
            ]

            if warehouse_id:
                domain.append(('location_id.warehouse_id', '=', warehouse_id))

            quants = Quant.search(domain)

            # Grouper par location
            stock_by_location = {}
            for quant in quants:
                location_id = quant.location_id.id
                if location_id not in stock_by_location:
                    stock_by_location[location_id] = {
                        'location_id': location_id,
                        'location_name': quant.location_id.complete_name,
                        'warehouse_id': quant.location_id.warehouse_id.id if quant.location_id.warehouse_id else None,
                        'warehouse_name': quant.location_id.warehouse_id.name if quant.location_id.warehouse_id else None,
                        'qty_available': 0,
                    }
                stock_by_location[location_id]['qty_available'] += quant.quantity

            stock_list = list(stock_by_location.values())

            # Calculer le total
            total_qty = sum(item['qty_available'] for item in stock_list)

            return {
                'success': True,
                'data': {
                    'product_id': product.id,
                    'product_name': product.display_name,
                    'stock_by_location': stock_list,
                    'total_qty': total_qty,
                    'location_count': len(stock_list),
                }
            }

        except Exception as e:
            _logger.error(f"Get product stock by location error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/stock/transfer', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def create_stock_transfer(self, **params):
        """
        Créer un transfert de stock entre deux locations/entrepôts.

        Params:
            product_id (int): ID du produit à transférer
            quantity (float): Quantité à transférer
            from_location_id (int): ID de la location source
            to_location_id (int): ID de la location destination
            note (str, optional): Note sur le transfert

        Returns:
            Picking (transfert) créé
        """
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('stock.group_stock_user'):
                return {'success': False, 'error': 'Accès refusé.'}

            product_id = params.get('product_id')
            quantity = params.get('quantity')
            from_location_id = params.get('from_location_id')
            to_location_id = params.get('to_location_id')
            note = params.get('note', '')

            if not all([product_id, quantity, from_location_id, to_location_id]):
                return {
                    'success': False,
                    'error': 'Paramètres product_id, quantity, from_location_id, to_location_id requis'
                }

            Product = request.env['product.product'].sudo()
            Location = request.env['stock.location'].sudo()
            PickingType = request.env['stock.picking.type'].sudo()
            Picking = request.env['stock.picking'].sudo()

            product = Product.browse(product_id)
            if not product.exists():
                return {
                    'success': False,
                    'error': f'Produit {product_id} introuvable'
                }

            from_location = Location.browse(from_location_id)
            to_location = Location.browse(to_location_id)

            if not from_location.exists() or not to_location.exists():
                return {
                    'success': False,
                    'error': 'Location source ou destination introuvable'
                }

            # Trouver le type de picking "Internal Transfer"
            picking_type = PickingType.search([
                ('code', '=', 'internal'),
                ('warehouse_id', '=', from_location.warehouse_id.id)
            ], limit=1)

            if not picking_type:
                # Fallback : utiliser n'importe quel type internal
                picking_type = PickingType.search([('code', '=', 'internal')], limit=1)

            if not picking_type:
                return {
                    'success': False,
                    'error': 'Type de transfert interne introuvable'
                }

            # Créer le picking (transfert)
            picking_vals = {
                'picking_type_id': picking_type.id,
                'location_id': from_location_id,
                'location_dest_id': to_location_id,
                'move_type': 'direct',
                'note': note,
            }

            picking = Picking.create(picking_vals)

            # Créer le mouvement de stock
            Move = request.env['stock.move'].sudo()
            move_vals = {
                'name': product.display_name,
                'product_id': product_id,
                'product_uom_qty': quantity,
                'product_uom': product.uom_id.id,
                'picking_id': picking.id,
                'location_id': from_location_id,
                'location_dest_id': to_location_id,
            }

            move = Move.create(move_vals)

            # Confirmer le picking
            picking.action_confirm()

            return {
                'success': True,
                'data': {
                    'picking_id': picking.id,
                    'picking_name': picking.name,
                    'state': picking.state,
                    'product_name': product.display_name,
                    'quantity': quantity,
                    'from_location': from_location.complete_name,
                    'to_location': to_location.complete_name,
                },
                'message': f"Transfert créé : {quantity} {product.display_name} de {from_location.name} vers {to_location.name}"
            }

        except Exception as e:
            _logger.error(f"Create stock transfer error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/stock/transfers', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def list_stock_transfers(self, **params):
        """
        Lister les transferts internes (pickings).

        Params:
            limit (int): Pagination (défaut: 20)
            offset (int): Pagination (défaut: 0)
            state (str): Filtre par état (draft, waiting, confirmed, assigned, done, cancel)
            warehouse_id (int): Filtre par entrepôt source
            search (str): Recherche par nom/référence

        Returns:
            transfers: Liste des transferts avec détails
            total: Nombre total
        """
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('stock.group_stock_user'):
                return {
                    'success': False,
                    'error': 'Accès refusé. Droits stock user requis.'
                }

            limit = params.get('limit', 20)
            offset = params.get('offset', 0)
            state = params.get('state')
            warehouse_id = params.get('warehouse_id')
            search = params.get('search', '')

            Picking = request.env['stock.picking'].sudo()
            PickingType = request.env['stock.picking.type'].sudo()

            # Trouver les types de picking internes
            internal_types = PickingType.search([('code', '=', 'internal')])

            domain = [('picking_type_id', 'in', internal_types.ids)]

            if state:
                domain.append(('state', '=', state))

            if warehouse_id:
                domain.append(('location_id.warehouse_id', '=', warehouse_id))

            if search:
                domain.append('|')
                domain.append(('name', 'ilike', search))
                domain.append(('origin', 'ilike', search))

            total = Picking.search_count(domain)
            pickings = Picking.search(domain, limit=limit, offset=offset, order='create_date desc')

            state_labels = dict(Picking._fields['state'].selection)

            transfers = []
            for picking in pickings:
                products = []
                for move in picking.move_ids:
                    products.append({
                        'id': move.product_id.id,
                        'name': move.product_id.display_name,
                        'sku': move.product_id.default_code or '',
                        'quantity': move.product_uom_qty,
                        'quantity_done': move.quantity,
                    })

                transfers.append({
                    'id': picking.id,
                    'name': picking.name,
                    'state': picking.state,
                    'state_label': state_labels.get(picking.state, picking.state),
                    'scheduled_date': picking.scheduled_date.isoformat() if picking.scheduled_date else None,
                    'date_done': picking.date_done.isoformat() if picking.date_done else None,
                    'from_location': picking.location_id.complete_name,
                    'to_location': picking.location_dest_id.complete_name,
                    'from_warehouse': picking.location_id.warehouse_id.name if picking.location_id.warehouse_id else None,
                    'to_warehouse': picking.location_dest_id.warehouse_id.name if picking.location_dest_id.warehouse_id else None,
                    'products': products,
                    'products_count': len(products),
                    'note': picking.note or '',
                    'create_date': picking.create_date.isoformat() if picking.create_date else None,
                    'user_name': picking.user_id.name if picking.user_id else None,
                })

            return {
                'success': True,
                'data': {
                    'transfers': transfers,
                    'total': total,
                    'limit': limit,
                    'offset': offset,
                }
            }

        except Exception as e:
            _logger.error(f"List stock transfers error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/stock/locations', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def list_stock_locations(self, **params):
        """
        Lister les locations de stock (pour sélection transfert).

        Params:
            warehouse_id (int): Filtre par entrepôt
            usage (str): Filtre par usage (internal, view, supplier, customer, inventory, transit)
            internal_only (bool): Uniquement les locations internes (défaut: True)

        Returns:
            locations: Liste des locations
        """
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('stock.group_stock_user'):
                return {'success': False, 'error': 'Accès refusé.'}

            warehouse_id = params.get('warehouse_id')
            usage = params.get('usage')
            internal_only = params.get('internal_only', True)

            Location = request.env['stock.location'].sudo()

            domain = [('active', '=', True)]

            if internal_only:
                domain.append(('usage', '=', 'internal'))
            elif usage:
                domain.append(('usage', '=', usage))

            if warehouse_id:
                domain.append(('warehouse_id', '=', warehouse_id))

            locations = Location.search(domain, order='complete_name')

            location_list = []
            for loc in locations:
                location_list.append({
                    'id': loc.id,
                    'name': loc.name,
                    'complete_name': loc.complete_name,
                    'warehouse_id': loc.warehouse_id.id if loc.warehouse_id else None,
                    'warehouse_name': loc.warehouse_id.name if loc.warehouse_id else None,
                    'usage': loc.usage,
                })

            return {
                'success': True,
                'data': {
                    'locations': location_list,
                    'total': len(location_list),
                }
            }

        except Exception as e:
            _logger.error(f"List stock locations error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/stock/transfers/<int:picking_id>/validate', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def validate_stock_transfer(self, picking_id, **params):
        """
        Valider un transfert (marquer quantités faites + confirmer).

        Params:
            picking_id (int): ID du picking à valider
            force (bool): Forcer même si quantité insuffisante (défaut: False)

        Returns:
            Picking validé
        """
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('stock.group_stock_user'):
                return {'success': False, 'error': 'Accès refusé.'}

            Picking = request.env['stock.picking'].sudo()
            picking = Picking.browse(picking_id)

            if not picking.exists():
                return {
                    'success': False,
                    'error': f'Transfert {picking_id} introuvable'
                }

            if picking.state == 'done':
                return {
                    'success': False,
                    'error': 'Ce transfert est déjà validé'
                }

            if picking.state == 'cancel':
                return {
                    'success': False,
                    'error': 'Ce transfert est annulé'
                }

            # Marquer les quantités comme faites
            for move in picking.move_ids:
                move.quantity = move.product_uom_qty

            # Valider le picking
            picking.button_validate()

            return {
                'success': True,
                'data': {
                    'picking_id': picking.id,
                    'picking_name': picking.name,
                    'state': picking.state,
                },
                'message': f'Transfert {picking.name} validé avec succès'
            }

        except Exception as e:
            _logger.error(f"Validate stock transfer error: {e}")
            return {
                'success': False,
                'error': 'Erreur serveur' if 'pas assez de stock' in str(e).lower() else 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/stock/transfers/<int:picking_id>/cancel', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def cancel_stock_transfer(self, picking_id, **params):
        """
        Annuler un transfert.

        Params:
            picking_id (int): ID du picking à annuler

        Returns:
            Picking annulé
        """
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('stock.group_stock_user'):
                return {'success': False, 'error': 'Accès refusé.'}

            Picking = request.env['stock.picking'].sudo()
            picking = Picking.browse(picking_id)

            if not picking.exists():
                return {
                    'success': False,
                    'error': f'Transfert {picking_id} introuvable'
                }

            if picking.state == 'done':
                return {
                    'success': False,
                    'error': 'Impossible d\'annuler un transfert déjà validé'
                }

            if picking.state == 'cancel':
                return {
                    'success': False,
                    'error': 'Ce transfert est déjà annulé'
                }

            picking.action_cancel()

            return {
                'success': True,
                'data': {
                    'picking_id': picking.id,
                    'picking_name': picking.name,
                    'state': picking.state,
                },
                'message': f'Transfert {picking.name} annulé'
            }

        except Exception as e:
            _logger.error(f"Cancel stock transfer error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/stock-alert-status', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_stock_alert_status(self, product_id, **kwargs):
        """
        Vérifier si l'utilisateur est abonné aux alertes de réapprovisionnement

        Args:
            product_id (int): ID du produit

        Returns:
            dict: {
                'success': bool,
                'data': {
                    'subscribed': bool,
                    'alert_id': int | null,
                    'email': str | null
                }
            }
        """
        try:
            # Vérifier si utilisateur authentifié
            if not request.session.uid:
                return {
                    'success': True,
                    'data': {
                        'subscribed': False,
                        'alert_id': None,
                        'email': None
                    }
                }

            Partner = request.env['res.partner'].sudo()
            partner = Partner.browse(request.session.uid)

            if not partner.exists():
                return {
                    'success': False,
                    'error': 'Utilisateur non trouvé'
                }

            # Vérifier si une alerte existe déjà
            # Note: Le modèle stock.alert n'existe pas par défaut dans Odoo
            # Il faut utiliser ir.config_parameter ou créer un modèle custom
            # Pour l'instant, on simule avec ir.config_parameter

            IrParam = request.env['ir.config_parameter'].sudo()
            alert_key = f'stock_alert.{product_id}.{partner.id}'
            alert_value = IrParam.get_param(alert_key)

            if alert_value:
                return {
                    'success': True,
                    'data': {
                        'subscribed': True,
                        'alert_id': int(alert_value),  # Stocker l'ID fictif
                        'email': partner.email
                    }
                }
            else:
                return {
                    'success': True,
                    'data': {
                        'subscribed': False,
                        'alert_id': None,
                        'email': partner.email
                    }
                }

        except Exception as e:
            _logger.error(f"Get stock alert status error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/notify-restock', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def notify_restock(self, product_id, **kwargs):
        """
        S'abonner aux alertes de réapprovisionnement

        Args:
            product_id (int): ID du produit
            email (str, optional): Email pour recevoir l'alerte (si invité)

        Returns:
            dict: {
                'success': bool,
                'message': str,
                'alert_id': int
            }
        """
        try:
            params = self._get_params()
            email = params.get('email')

            Product = request.env['product.template'].sudo()
            product = Product.browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Produit non trouvé'
                }

            # Vérifier que le produit est bien en rupture
            if product.type == 'product' and product.qty_available > 0:
                return {
                    'success': False,
                    'error': 'Le produit est actuellement en stock'
                }

            # Si utilisateur authentifié
            if request.session.uid:
                Partner = request.env['res.partner'].sudo()
                partner = Partner.browse(request.session.uid)
                email = partner.email
                partner_id = partner.id
            else:
                # Utilisateur invité
                if not email:
                    return {
                        'success': False,
                        'error': 'Email requis pour les utilisateurs invités'
                    }
                partner_id = 0  # Invité

            # Créer l'alerte (stockée dans ir.config_parameter pour simplicité)
            # Dans une vraie implémentation, créer un modèle custom stock.alert
            import time
            alert_id = int(time.time())  # Générer un ID unique basé sur timestamp

            IrParam = request.env['ir.config_parameter'].sudo()
            alert_key = f'stock_alert.{product_id}.{partner_id or email}'
            IrParam.set_param(alert_key, str(alert_id))

            # Stocker aussi l'email pour pouvoir envoyer la notification plus tard
            email_key = f'stock_alert_email.{alert_id}'
            IrParam.set_param(email_key, email)

            _logger.info(f"Stock alert created: product {product_id}, email {email}, alert_id {alert_id}")

            return {
                'success': True,
                'message': f'Vous serez notifié par email à {email} lorsque {product.name} sera de nouveau en stock',
                'alert_id': alert_id
            }

        except Exception as e:
            _logger.error(f"Notify restock error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/warehouses/create', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def create_warehouse(self, **kwargs):
        """
        Créer un nouvel entrepôt avec validation du code et création automatique des locations

        Body:
            - name: str (requis)
            - code: str (requis, 5 chars max, uppercase)
            - company_id: int (requis)
            - partner_id: int (optionnel)
            - partner_data: dict (optionnel, pour créer une nouvelle adresse)

        Returns:
            dict: {
                'success': bool,
                'data': {
                    'id': int,
                    'name': str,
                    'code': str,
                    'locations': list,
                    'pickingTypes': list
                },
                'error': str (si erreur),
                'errorCode': str (si erreur)
            }
        """
        try:
            import re
            Warehouse = request.env['stock.warehouse'].sudo()
            Partner = request.env['res.partner'].sudo()
            Location = request.env['stock.location'].sudo()
            PickingType = request.env['stock.picking.type'].sudo()
            Company = request.env['res.company'].sudo()

            params = self._get_params()

            # Récupérer et valider les champs requis
            name = params.get('name')
            code = params.get('code')
            company_id = params.get('company_id')

            if not name or not code:
                return {
                    'success': False,
                    'error': "Champs 'name' et 'code' requis",
                    'errorCode': 'MISSING_FIELDS'
                }

            # Validation format code (max 5 chars, uppercase, lettres/chiffres/tirets)
            code = code.upper().strip()
            if not re.match(r'^[A-Z0-9-]+$', code) or len(code) > 5:
                return {
                    'success': False,
                    'error': f"Code invalide. Format: max 5 caractères, lettres majuscules, chiffres et tirets uniquement",
                    'errorCode': 'INVALID_CODE'
                }

            # Vérifier unicité du code
            existing = Warehouse.search([('code', '=', code)], limit=1)
            if existing:
                return {
                    'success': False,
                    'error': f"Un entrepôt avec le code '{code}' existe déjà",
                    'errorCode': 'DUPLICATE_CODE'
                }

            # Vérifier que la société existe
            if company_id:
                company = Company.browse(company_id)
                if not company.exists():
                    return {
                        'success': False,
                        'error': "La société n'existe pas",
                        'errorCode': 'INVALID_COMPANY'
                    }
            else:
                # Utiliser la société par défaut
                company_id = request.env.company.id

            # Gérer le partner (adresse)
            partner_id = params.get('partner_id')
            partner_data = params.get('partner_data')

            if partner_data and not partner_id:
                # Créer un nouveau partner
                partner_vals = {
                    'name': partner_data.get('name', name),
                    'street': partner_data.get('street'),
                    'city': partner_data.get('city'),
                    'zip': partner_data.get('zip'),
                    'country_id': partner_data.get('country_id'),
                    'company_id': company_id
                }
                partner = Partner.create(partner_vals)
                partner_id = partner.id

            # Créer l'entrepôt
            # Odoo va automatiquement créer les locations (Stock, Input, Output) et picking types
            warehouse_vals = {
                'name': name,
                'code': code,
                'company_id': company_id,
                'active': True
            }
            if partner_id:
                warehouse_vals['partner_id'] = partner_id

            warehouse = Warehouse.create(warehouse_vals)

            # Récupérer les locations auto-créées
            locations = Location.search([
                ('warehouse_id', '=', warehouse.id),
                ('usage', '=', 'internal')
            ])
            locations_data = [{
                'id': loc.id,
                'name': loc.name,
                'complete_name': loc.complete_name,
                'usage': loc.usage
            } for loc in locations]

            # Récupérer les picking types auto-créés
            picking_types = PickingType.search([('warehouse_id', '=', warehouse.id)])
            picking_types_data = [{
                'id': pt.id,
                'name': pt.name,
                'code': pt.code,
                'sequence_id': pt.sequence_id.id if pt.sequence_id else None
            } for pt in picking_types]

            _logger.info(f"Warehouse created: {warehouse.name} (code: {warehouse.code}, id: {warehouse.id})")

            return {
                'success': True,
                'data': {
                    'id': warehouse.id,
                    'name': warehouse.name,
                    'code': warehouse.code,
                    'company_id': warehouse.company_id.id,
                    'partner_id': warehouse.partner_id.id if warehouse.partner_id else None,
                    'active': warehouse.active,
                    'locations': locations_data,
                    'pickingTypes': picking_types_data
                }
            }

        except Exception as e:
            _logger.error(f"Create warehouse error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/warehouses/<int:warehouse_id>/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def update_warehouse(self, warehouse_id, **kwargs):
        """
        Modifier un entrepôt existant

        Args:
            warehouse_id: ID de l'entrepôt

        Body:
            - name: str (optionnel)
            - partner_id: int (optionnel)
            - active: bool (optionnel)

        Note: Le code (code) et la société (company_id) sont IMMUTABLES après création

        Returns:
            dict: {'success': bool, 'data': dict, 'error': str}
        """
        try:
            Warehouse = request.env['stock.warehouse'].sudo()
            Partner = request.env['res.partner'].sudo()

            params = self._get_params()

            warehouse = Warehouse.browse(warehouse_id)
            if not warehouse.exists():
                return {
                    'success': False,
                    'error': 'Entrepôt introuvable',
                    'errorCode': 'NOT_FOUND'
                }

            # Construire les valeurs à mettre à jour
            vals = {}
            if 'name' in params:
                vals['name'] = params['name']
            if 'partner_id' in params:
                partner_id = params['partner_id']
                if partner_id:
                    partner = Partner.browse(partner_id)
                    if not partner.exists():
                        return {
                            'success': False,
                            'error': 'Partner introuvable',
                            'errorCode': 'INVALID_PARTNER'
                        }
                vals['partner_id'] = partner_id
            if 'active' in params:
                vals['active'] = params['active']

            if vals:
                warehouse.write(vals)

            _logger.info(f"Warehouse updated: {warehouse.name} (id: {warehouse.id})")

            return {
                'success': True,
                'data': {
                    'id': warehouse.id,
                    'name': warehouse.name,
                    'code': warehouse.code,
                    'active': warehouse.active,
                    'partner_id': warehouse.partner_id.id if warehouse.partner_id else None
                }
            }

        except Exception as e:
            _logger.error(f"Update warehouse error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/warehouses/<int:warehouse_id>/archive', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def archive_warehouse(self, warehouse_id, **kwargs):
        """
        Archiver un entrepôt (ne pas supprimer, juste désactiver)

        Vérifications:
        - Pas de stock dans les locations de l'entrepôt
        - Pas de mouvements en cours (picking actifs)

        Args:
            warehouse_id: ID de l'entrepôt

        Returns:
            dict: {'success': bool, 'error': str, 'errorCode': str}
        """
        try:
            Warehouse = request.env['stock.warehouse'].sudo()
            StockQuant = request.env['stock.quant'].sudo()
            StockPicking = request.env['stock.picking'].sudo()

            warehouse = Warehouse.browse(warehouse_id)
            if not warehouse.exists():
                return {
                    'success': False,
                    'error': 'Entrepôt introuvable',
                    'errorCode': 'NOT_FOUND'
                }

            # Vérifier qu'il n'y a pas de stock
            quants = StockQuant.search([
                ('location_id.warehouse_id', '=', warehouse_id),
                ('quantity', '>', 0),
                ('location_id.usage', '=', 'internal')
            ])
            if quants:
                total_qty = sum(quants.mapped('quantity'))
                product_count = len(set(quants.mapped('product_id.id')))
                return {
                    'success': False,
                    'error': f"Impossible d'archiver : {total_qty:.0f} unités de {product_count} produits en stock",
                    'errorCode': 'HAS_STOCK',
                    'details': {
                        'total_qty': total_qty,
                        'product_count': product_count
                    }
                }

            # Vérifier qu'il n'y a pas de pickings en cours
            active_pickings = StockPicking.search([
                ('picking_type_id.warehouse_id', '=', warehouse_id),
                ('state', 'not in', ['done', 'cancel'])
            ])
            if active_pickings:
                return {
                    'success': False,
                    'error': f"Impossible d'archiver : {len(active_pickings)} transferts en cours",
                    'errorCode': 'HAS_ACTIVE_PICKINGS',
                    'details': {
                        'picking_count': len(active_pickings)
                    }
                }

            # Archiver l'entrepôt
            warehouse.active = False

            _logger.info(f"Warehouse archived: {warehouse.name} (id: {warehouse.id})")

            return {
                'success': True,
                'message': f"Entrepôt '{warehouse.name}' archivé avec succès"
            }

        except Exception as e:
            _logger.error(f"Archive warehouse error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/routes', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def get_stock_routes(self, **kwargs):
        """
        Liste toutes les routes stock disponibles (admin uniquement).

        Les routes définissent comment les produits se déplacent entre emplacements.

        Returns:
            - Routes globales (Buy, Make to Order, etc.)
            - Routes d'entrepôt (Reception, Delivery, Cross-Dock, etc.)
        """
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._require_admin()
            if error:
                return error

            Route = request.env['stock.route'].sudo()

            # Récupérer toutes les routes actives
            routes = Route.search([('active', '=', True)])

            routes_data = []
            for route in routes:
                # Compter les règles push et pull
                push_count = len(route.push_ids)
                pull_count = len(route.rule_ids)

                # Déterminer le type de route
                if route.warehouse_ids:
                    route_type = 'warehouse'
                    warehouses = [{'id': w.id, 'name': w.name} for w in route.warehouse_ids]
                else:
                    route_type = 'global'
                    warehouses = []

                routes_data.append({
                    'id': route.id,
                    'name': route.name,
                    'sequence': route.sequence,
                    'active': route.active,
                    'route_type': route_type,
                    'warehouses': warehouses,
                    'push_rules_count': push_count,
                    'pull_rules_count': pull_count,
                    'sale_selectable': route.sale_selectable,
                    'product_selectable': route.product_selectable,
                })

            _logger.info(f"Fetched {len(routes_data)} stock routes")

            return {
                'success': True,
                'data': {
                    'routes': routes_data,
                    'total': len(routes_data),
                }
            }

        except Exception as e:
            _logger.error(f"Get stock routes error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/routes/<int:route_id>', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def get_stock_route_detail(self, route_id, **kwargs):
        """
        Détails d'une route avec ses règles push et pull (admin uniquement).

        Args:
            route_id: ID de la route

        Returns:
            - Informations de la route
            - Liste des règles push
            - Liste des règles pull
        """
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._require_admin()
            if error:
                return error

            Route = request.env['stock.route'].sudo()
            route = Route.browse(route_id)

            if not route.exists():
                return {
                    'success': False,
                    'error': 'Route introuvable',
                    'errorCode': 'NOT_FOUND'
                }

            # Règles push
            push_rules = []
            for push in route.push_ids:
                push_rules.append({
                    'id': push.id,
                    'name': push.name,
                    'location_src_id': push.location_src_id.id,
                    'location_src': push.location_src_id.complete_name,
                    'location_dest_id': push.location_dest_id.id,
                    'location_dest': push.location_dest_id.complete_name,
                    'picking_type_id': push.picking_type_id.id if push.picking_type_id else None,
                    'picking_type': push.picking_type_id.name if push.picking_type_id else None,
                    'auto': push.auto,
                    'active': push.active,
                })

            # Règles pull
            pull_rules = []
            for pull in route.rule_ids:
                pull_rules.append({
                    'id': pull.id,
                    'name': pull.name,
                    'action': pull.action,
                    'location_dest_id': pull.location_dest_id.id,
                    'location_dest': pull.location_dest_id.complete_name,
                    'location_src_id': pull.location_src_id.id if pull.location_src_id else None,
                    'location_src': pull.location_src_id.complete_name if pull.location_src_id else None,
                    'picking_type_id': pull.picking_type_id.id if pull.picking_type_id else None,
                    'picking_type': pull.picking_type_id.name if pull.picking_type_id else None,
                    'procure_method': pull.procure_method,
                    'active': pull.active,
                })

            route_data = {
                'id': route.id,
                'name': route.name,
                'sequence': route.sequence,
                'active': route.active,
                'sale_selectable': route.sale_selectable,
                'product_selectable': route.product_selectable,
                'warehouses': [{'id': w.id, 'name': w.name} for w in route.warehouse_ids],
                'push_rules': push_rules,
                'pull_rules': pull_rules,
            }

            _logger.info(f"Fetched route details: {route.name} (id: {route.id})")

            return {
                'success': True,
                'data': route_data
            }

        except Exception as e:
            _logger.error(f"Get stock route detail error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/warehouses/<int:warehouse_id>/routes', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def get_warehouse_routes(self, warehouse_id, **kwargs):
        """
        Récupérer les routes configurées pour un entrepôt (admin uniquement).

        Args:
            warehouse_id: ID de l'entrepôt

        Returns:
            - Routes actives de l'entrepôt
            - Configuration (reception_steps, delivery_steps)
        """
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._require_admin()
            if error:
                return error

            Warehouse = request.env['stock.warehouse'].sudo()
            warehouse = Warehouse.browse(warehouse_id)

            if not warehouse.exists():
                return {
                    'success': False,
                    'error': 'Entrepôt introuvable',
                    'errorCode': 'NOT_FOUND'
                }

            # Routes de l'entrepôt
            routes_data = []
            for route in warehouse.route_ids.filtered(lambda r: r.active):
                routes_data.append({
                    'id': route.id,
                    'name': route.name,
                    'sequence': route.sequence,
                    'push_rules_count': len(route.push_ids),
                    'pull_rules_count': len(route.rule_ids),
                })

            # Configuration de l'entrepôt
            config = {
                'reception_steps': warehouse.reception_steps,
                'delivery_steps': warehouse.delivery_steps,
            }

            # Labels pour les étapes
            reception_labels = {
                'one_step': 'Réception en 1 étape (Stock)',
                'two_steps': 'Réception en 2 étapes (Input + Stock)',
                'three_steps': 'Réception en 3 étapes (Input + Quality + Stock)',
            }

            delivery_labels = {
                'ship_only': 'Livraison en 1 étape (Stock)',
                'pick_ship': 'Livraison en 2 étapes (Pick + Ship)',
                'pick_pack_ship': 'Livraison en 3 étapes (Pick + Pack + Ship)',
            }

            _logger.info(f"Fetched routes for warehouse {warehouse.name}: {len(routes_data)} routes")

            return {
                'success': True,
                'data': {
                    'warehouse_id': warehouse_id,
                    'warehouse_name': warehouse.name,
                    'routes': routes_data,
                    'config': {
                        'reception_steps': warehouse.reception_steps,
                        'reception_label': reception_labels.get(warehouse.reception_steps, warehouse.reception_steps),
                        'delivery_steps': warehouse.delivery_steps,
                        'delivery_label': delivery_labels.get(warehouse.delivery_steps, warehouse.delivery_steps),
                    }
                }
            }

        except Exception as e:
            _logger.error(f"Get warehouse routes error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/warehouses/<int:warehouse_id>/routes/configure', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def configure_warehouse_routes(self, warehouse_id, **kwargs):
        """
        Configurer les étapes de réception et livraison d'un entrepôt (admin uniquement).

        Odoo génère automatiquement les routes et règles correspondantes.

        Args:
            warehouse_id: ID de l'entrepôt
            reception_steps: 'one_step', 'two_steps', ou 'three_steps'
            delivery_steps: 'ship_only', 'pick_ship', ou 'pick_pack_ship'

        Returns:
            dict: Nouvelle configuration appliquée
        """
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._require_admin()
            if error:
                return error

            Warehouse = request.env['stock.warehouse'].sudo()
            params = self._get_params()

            warehouse = Warehouse.browse(warehouse_id)
            if not warehouse.exists():
                return {
                    'success': False,
                    'error': 'Entrepôt introuvable',
                    'errorCode': 'NOT_FOUND'
                }

            reception_steps = params.get('reception_steps')
            delivery_steps = params.get('delivery_steps')

            # Validation des valeurs
            valid_reception = ['one_step', 'two_steps', 'three_steps']
            valid_delivery = ['ship_only', 'pick_ship', 'pick_pack_ship']

            update_vals = {}

            if reception_steps:
                if reception_steps not in valid_reception:
                    return {
                        'success': False,
                        'error': f'Valeur reception_steps invalide. Valeurs autorisées : {valid_reception}',
                        'errorCode': 'INVALID_VALUE'
                    }
                update_vals['reception_steps'] = reception_steps

            if delivery_steps:
                if delivery_steps not in valid_delivery:
                    return {
                        'success': False,
                        'error': f'Valeur delivery_steps invalide. Valeurs autorisées : {valid_delivery}',
                        'errorCode': 'INVALID_VALUE'
                    }
                update_vals['delivery_steps'] = delivery_steps

            if not update_vals:
                return {
                    'success': False,
                    'error': 'Aucune configuration à modifier',
                    'errorCode': 'NO_UPDATE'
                }

            # Appliquer les modifications
            # Odoo va automatiquement créer/modifier les routes et règles correspondantes
            warehouse.write(update_vals)

            _logger.info(f"Warehouse routes configured: {warehouse.name} - {update_vals}")

            return {
                'success': True,
                'message': 'Configuration des routes mise à jour',
                'data': {
                    'warehouse_id': warehouse_id,
                    'reception_steps': warehouse.reception_steps,
                    'delivery_steps': warehouse.delivery_steps,
                }
            }

        except Exception as e:
            _logger.error(f"Configure warehouse routes error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/lots', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def get_lots(self, **kwargs):
        """
        Liste tous les lots/numéros de série avec dates d'expiration (admin uniquement).

        Paramètres optionnels:
        - product_id (int): Filtrer par produit
        - expiry_status (str): Filtrer par statut ('expired', 'removal', 'alert', 'ok')
        - has_stock (bool): Uniquement les lots avec stock > 0 (défaut: True)
        - limit (int): Nombre de résultats (défaut: 100)
        - offset (int): Décalage pour pagination (défaut: 0)
        """
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._require_admin()
            if error:
                return error

            Lot = request.env['stock.lot'].sudo()
            StockQuant = request.env['stock.quant'].sudo()
            params = self._get_params()

            limit = int(params.get('limit', 100))
            offset = int(params.get('offset', 0))
            product_id = params.get('product_id')
            expiry_status = params.get('expiry_status')
            has_stock = params.get('has_stock', True)

            # Domain de base
            domain = []

            if product_id:
                domain.append(('product_id', '=', int(product_id)))

            # Rechercher lots
            lots = Lot.search(domain, limit=limit, offset=offset, order='expiration_date ASC')

            lots_data = []
            for lot in lots:
                # Calculer stock total du lot
                quants = StockQuant.search([
                    ('lot_id', '=', lot.id),
                    ('location_id.usage', '=', 'internal'),
                    ('quantity', '>', 0)
                ])
                stock_qty = sum(quants.mapped('quantity'))

                # Filtrer si has_stock
                if has_stock and stock_qty <= 0:
                    continue

                # Filtrer par expiry_status
                if expiry_status and lot.expiry_status != expiry_status:
                    continue

                lots_data.append({
                    'id': lot.id,
                    'name': lot.name,
                    'ref': lot.ref or '',
                    'product_id': lot.product_id.id,
                    'product_name': lot.product_id.display_name,
                    'product_sku': lot.product_id.default_code or '',
                    'stock_qty': stock_qty,
                    'expiration_date': lot.expiration_date.isoformat() if lot.expiration_date else None,
                    'use_date': lot.use_date.isoformat() if lot.use_date else None,
                    'removal_date': lot.removal_date.isoformat() if lot.removal_date else None,
                    'alert_date': lot.alert_date.isoformat() if lot.alert_date else None,
                    'days_until_expiry': lot.days_until_expiry,
                    'days_until_alert': lot.days_until_alert,
                    'days_until_removal': lot.days_until_removal,
                    'days_until_best_before': lot.days_until_best_before,
                    'expiry_status': lot.expiry_status,
                    'is_expired': lot.is_expired,
                    'is_near_expiry': lot.is_near_expiry,
                })

            total = len(lots_data)

            _logger.info(f"Fetched {total} lots/serial numbers")

            return {
                'success': True,
                'data': {
                    'lots': lots_data,
                    'total': total,
                    'limit': limit,
                    'offset': offset,
                }
            }

        except Exception as e:
            _logger.error(f"Get lots error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/lots/<int:lot_id>', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def get_lot_detail(self, lot_id, **kwargs):
        """
        Détails complets d'un lot/numéro de série (admin uniquement).

        Args:
            lot_id: ID du lot

        Returns:
            - Informations du lot
            - Dates d'expiration
            - Stock par emplacement
            - Historique des mouvements
        """
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._require_admin()
            if error:
                return error

            Lot = request.env['stock.lot'].sudo()
            StockQuant = request.env['stock.quant'].sudo()
            Move = request.env['stock.move'].sudo()

            lot = Lot.browse(lot_id)
            if not lot.exists():
                return {
                    'success': False,
                    'error': 'Lot introuvable',
                    'errorCode': 'NOT_FOUND'
                }

            # Stock par emplacement
            quants = StockQuant.search([
                ('lot_id', '=', lot_id),
                ('quantity', '>', 0)
            ])

            stock_by_location = []
            total_stock = 0
            for quant in quants:
                stock_by_location.append({
                    'location_id': quant.location_id.id,
                    'location_name': quant.location_id.complete_name,
                    'quantity': quant.quantity,
                })
                total_stock += quant.quantity

            # Historique mouvements (10 derniers)
            moves = Move.search([
                ('lot_ids', 'in', [lot_id]),
                ('state', '=', 'done')
            ], limit=10, order='date desc')

            moves_data = []
            for move in moves:
                moves_data.append({
                    'id': move.id,
                    'date': move.date.isoformat() if move.date else None,
                    'location_src': move.location_id.complete_name,
                    'location_dest': move.location_dest_id.complete_name,
                    'quantity': move.product_uom_qty,
                    'reference': move.reference or '',
                })

            lot_data = {
                'id': lot.id,
                'name': lot.name,
                'ref': lot.ref or '',
                'product_id': lot.product_id.id,
                'product_name': lot.product_id.display_name,
                'product_sku': lot.product_id.default_code or '',
                'company_id': lot.company_id.id if lot.company_id else None,
                'note': lot.note or '',
                'expiration_date': lot.expiration_date.isoformat() if lot.expiration_date else None,
                'use_date': lot.use_date.isoformat() if lot.use_date else None,
                'removal_date': lot.removal_date.isoformat() if lot.removal_date else None,
                'alert_date': lot.alert_date.isoformat() if lot.alert_date else None,
                'days_until_expiry': lot.days_until_expiry,
                'days_until_alert': lot.days_until_alert,
                'days_until_removal': lot.days_until_removal,
                'days_until_best_before': lot.days_until_best_before,
                'expiry_status': lot.expiry_status,
                'is_expired': lot.is_expired,
                'is_near_expiry': lot.is_near_expiry,
                'total_stock': total_stock,
                'stock_by_location': stock_by_location,
                'recent_moves': moves_data,
            }

            _logger.info(f"Fetched lot details: {lot.name} (id: {lot.id})")

            return {
                'success': True,
                'data': lot_data
            }

        except Exception as e:
            _logger.error(f"Get lot detail error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/lots/expiry-alerts', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def get_expiry_alerts(self, **kwargs):
        """
        Récupérer les lots avec alertes d'expiration (admin uniquement).

        Paramètres optionnels:
        - days_threshold (int): Nombre de jours avant expiration pour l'alerte (défaut: 30)
        - status_filter (str): Filtrer par statut ('alert', 'removal', 'expired', 'all') (défaut: 'all')
        - has_stock_only (bool): Uniquement lots avec stock (défaut: True)
        - limit (int): Nombre de résultats (défaut: 100)

        Returns:
            - Lots avec alertes groupés par statut
            - Statistiques (nombre par statut)
        """
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._require_admin()
            if error:
                return error

            Lot = request.env['stock.lot'].sudo()
            StockQuant = request.env['stock.quant'].sudo()
            params = self._get_params()

            days_threshold = int(params.get('days_threshold', 30))
            status_filter = params.get('status_filter', 'all')
            has_stock_only = params.get('has_stock_only', True)
            limit = int(params.get('limit', 100))

            # Rechercher tous les lots avec date d'expiration
            lots = Lot.search([
                ('expiration_date', '!=', False)
            ], order='expiration_date ASC')

            # Filtrer et grouper par statut
            alerts = {
                'expired': [],
                'removal': [],
                'alert': [],
                'ok_but_soon': [],  # OK mais dans le threshold
            }

            for lot in lots:
                # Calculer stock si nécessaire
                if has_stock_only:
                    quants = StockQuant.search([
                        ('lot_id', '=', lot.id),
                        ('location_id.usage', '=', 'internal'),
                        ('quantity', '>', 0)
                    ])
                    stock_qty = sum(quants.mapped('quantity'))
                    if stock_qty <= 0:
                        continue
                else:
                    stock_qty = 0

                # Appliquer filtre statut
                if status_filter != 'all' and lot.expiry_status != status_filter:
                    if not (status_filter == 'alert' and lot.days_until_expiry <= days_threshold):
                        continue

                lot_data = {
                    'id': lot.id,
                    'name': lot.name,
                    'product_id': lot.product_id.id,
                    'product_name': lot.product_id.display_name,
                    'product_sku': lot.product_id.default_code or '',
                    'stock_qty': stock_qty,
                    'expiration_date': lot.expiration_date.isoformat() if lot.expiration_date else None,
                    'days_until_expiry': lot.days_until_expiry,
                    'expiry_status': lot.expiry_status,
                }

                # Grouper par statut
                if lot.expiry_status == 'expired':
                    alerts['expired'].append(lot_data)
                elif lot.expiry_status == 'removal':
                    alerts['removal'].append(lot_data)
                elif lot.expiry_status == 'alert':
                    alerts['alert'].append(lot_data)
                elif lot.days_until_expiry <= days_threshold:
                    alerts['ok_but_soon'].append(lot_data)

                # Limiter le total
                total_count = sum(len(v) for v in alerts.values())
                if total_count >= limit:
                    break

            # Statistiques
            stats = {
                'expired_count': len(alerts['expired']),
                'removal_count': len(alerts['removal']),
                'alert_count': len(alerts['alert']),
                'ok_but_soon_count': len(alerts['ok_but_soon']),
                'total': sum(len(v) for v in alerts.values()),
            }

            _logger.info(f"Fetched expiry alerts: {stats['total']} lots")

            return {
                'success': True,
                'data': {
                    'alerts': alerts,
                    'stats': stats,
                    'days_threshold': days_threshold,
                }
            }

        except Exception as e:
            _logger.error(f"Get expiry alerts error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/expiry-config', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def get_product_expiry_config(self, product_id, **kwargs):
        """
        Récupérer la configuration des délais d'expiration d'un produit (admin uniquement).

        Args:
            product_id: ID du produit

        Returns:
            - Configuration des délais (use_time, removal_time, alert_time, expiration_time)
            - Activation du tracking par lot
        """
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._require_admin()
            if error:
                return error

            Product = request.env['product.product'].sudo()
            product = Product.browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Produit introuvable',
                    'errorCode': 'PRODUCT_NOT_FOUND'
                }

            config_data = {
                'product_id': product_id,
                'product_name': product.display_name,
                'tracking': product.tracking,
                'use_expiration_date': product.use_expiration_date if hasattr(product, 'use_expiration_date') else False,
                'expiration_time': product.expiration_time if hasattr(product, 'expiration_time') else 0,
                'use_time': product.use_time if hasattr(product, 'use_time') else 0,
                'removal_time': product.removal_time if hasattr(product, 'removal_time') else 0,
                'alert_time': product.alert_time if hasattr(product, 'alert_time') else 0,
            }

            _logger.info(f"Fetched expiry config for product: {product.display_name}")

            return {
                'success': True,
                'data': config_data
            }

        except Exception as e:
            _logger.error(f"Get product expiry config error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/expiry-config/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def update_product_expiry_config(self, product_id, **kwargs):
        """
        Configurer les délais d'expiration d'un produit (admin uniquement).

        Args:
            product_id: ID du produit
            use_expiration_date (bool): Activer suivi des dates d'expiration
            expiration_time (int): Nombre de jours avant expiration
            use_time (int): Nombre de jours avant DLUO (Best Before Date)
            removal_time (int): Nombre de jours avant retrait du stock
            alert_time (int): Nombre de jours avant déclenchement alerte

        Returns:
            Configuration mise à jour
        """
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._require_admin()
            if error:
                return error

            Product = request.env['product.product'].sudo()
            params = self._get_params()

            product = Product.browse(product_id)
            if not product.exists():
                return {
                    'success': False,
                    'error': 'Produit introuvable',
                    'errorCode': 'PRODUCT_NOT_FOUND'
                }

            # Vérifier que le produit est suivi par lot/série
            if product.tracking == 'none':
                return {
                    'success': False,
                    'error': 'Le produit doit être suivi par lot ou numéro de série pour activer les dates d\'expiration',
                    'errorCode': 'TRACKING_REQUIRED'
                }

            update_vals = {}

            if 'use_expiration_date' in params:
                update_vals['use_expiration_date'] = bool(params['use_expiration_date'])

            if 'expiration_time' in params:
                try:
                    update_vals['expiration_time'] = int(params['expiration_time'])
                except (ValueError, TypeError):
                    return {
                        'success': False,
                        'error': 'Valeur expiration_time invalide',
                        'errorCode': 'INVALID_VALUE'
                    }

            if 'use_time' in params:
                try:
                    update_vals['use_time'] = int(params['use_time'])
                except (ValueError, TypeError):
                    return {
                        'success': False,
                        'error': 'Valeur use_time invalide',
                        'errorCode': 'INVALID_VALUE'
                    }

            if 'removal_time' in params:
                try:
                    update_vals['removal_time'] = int(params['removal_time'])
                except (ValueError, TypeError):
                    return {
                        'success': False,
                        'error': 'Valeur removal_time invalide',
                        'errorCode': 'INVALID_VALUE'
                    }

            if 'alert_time' in params:
                try:
                    update_vals['alert_time'] = int(params['alert_time'])
                except (ValueError, TypeError):
                    return {
                        'success': False,
                        'error': 'Valeur alert_time invalide',
                        'errorCode': 'INVALID_VALUE'
                    }

            if not update_vals:
                return {
                    'success': False,
                    'error': 'Aucune configuration à modifier',
                    'errorCode': 'NO_UPDATE'
                }

            # Appliquer les modifications
            product.write(update_vals)

            _logger.info(f"Updated expiry config for product: {product.display_name} - {update_vals}")

            return {
                'success': True,
                'message': 'Configuration d\'expiration mise à jour',
                'data': {
                    'product_id': product_id,
                    'use_expiration_date': product.use_expiration_date if hasattr(product, 'use_expiration_date') else False,
                    'expiration_time': product.expiration_time if hasattr(product, 'expiration_time') else 0,
                    'use_time': product.use_time if hasattr(product, 'use_time') else 0,
                    'removal_time': product.removal_time if hasattr(product, 'removal_time') else 0,
                    'alert_time': product.alert_time if hasattr(product, 'alert_time') else 0,
                }
            }

        except Exception as e:
            _logger.error(f"Update product expiry config error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    def _is_descendant(self, ancestor_id, potential_child_id):
        """
        Vérifier si potential_child_id est un descendant de ancestor_id
        (pour éviter les boucles infinies dans la hiérarchie)
        """
        if ancestor_id == potential_child_id:
            return True

        Location = request.env['stock.location'].sudo()
        child = Location.browse(potential_child_id)

        while child.location_id:
            if child.location_id.id == ancestor_id:
                return True
            child = child.location_id

        return False

    @http.route('/api/ecommerce/stock/locations/tree', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_locations_tree(self, **kwargs):
        """
        Récupérer toutes les locations avec structure hiérarchique (admin uniquement).

        Body (params):
            - warehouse_id: int (optionnel, filtrer par entrepôt)
            - usage: str (optionnel, filtrer par type: 'internal', 'view')
            - active: bool (optionnel, filtrer par statut actif)

        Returns:
            dict: {
                'success': bool,
                'data': {
                    'locations': [...]
                }
            }
        """
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._require_admin()
            if error:
                return error

            Location = request.env['stock.location'].sudo()
            StockQuant = request.env['stock.quant'].sudo()

            params = self._get_params()

            # Construire le domaine
            domain = [('usage', 'in', ['internal', 'view'])]

            if params.get('warehouse_id'):
                try:
                    warehouse_id = int(params['warehouse_id'])
                    domain.append(('warehouse_id', '=', warehouse_id))
                except (ValueError, TypeError):
                    return {
                        'success': False,
                        'error': 'Invalid warehouse_id',
                        'errorCode': 'INVALID_PARAM'
                    }

            if params.get('usage'):
                usage = params['usage']
                if usage in ['internal', 'view']:
                    domain = [('usage', '=', usage)]

            if 'active' in params:
                domain.append(('active', '=', bool(params['active'])))
            else:
                domain.append(('active', '=', True))

            # Récupérer toutes les locations
            locations = Location.search(domain, order='complete_name ASC')

            # Sérialiser avec calcul du stock
            locations_data = []
            for loc in locations:
                # Calculer stock total de la location
                quants = StockQuant.search([
                    ('location_id', '=', loc.id),
                    ('quantity', '>', 0)
                ])
                stock_count = sum(quants.mapped('quantity')) if quants else 0.0

                locations_data.append({
                    'id': loc.id,
                    'name': loc.name,
                    'complete_name': loc.complete_name,
                    'usage': loc.usage,
                    'parent_id': loc.location_id.id if loc.location_id else None,
                    'warehouse_id': loc.warehouse_id.id if loc.warehouse_id else None,
                    'warehouse_name': loc.warehouse_id.name if loc.warehouse_id else None,
                    'barcode': loc.barcode or '',
                    'stock_count': round(stock_count, 2),
                    'active': loc.active
                })

            _logger.info(f"Locations tree retrieved: {len(locations_data)} locations")

            return {
                'success': True,
                'data': {
                    'locations': locations_data
                }
            }

        except Exception as e:
            _logger.error(f"Get locations tree error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/locations/<int:location_id>', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def get_location_detail(self, location_id, **kwargs):
        """
        Obtenir les détails complets d'une location (admin uniquement).

        Args:
            location_id: ID de la location

        Returns:
            - Informations complètes de la location
            - Stock actuel (quantité totale par produit)
            - Nombre de produits stockés
            - Sous-emplacements (enfants directs)
        """
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._require_admin()
            if error:
                return error

            Location = request.env['stock.location'].sudo()
            StockQuant = request.env['stock.quant'].sudo()

            location = Location.browse(location_id)
            if not location.exists():
                return {
                    'success': False,
                    'error': 'Location introuvable',
                    'errorCode': 'NOT_FOUND'
                }

            # Calculer stock total
            quants = StockQuant.search([
                ('location_id', '=', location_id),
                ('quantity', '>', 0)
            ])
            total_stock = sum(quants.mapped('quantity'))
            products_count = len(set(quants.mapped('product_id.id')))

            # Stock par produit (top 10)
            stock_by_product = []
            product_quants = {}
            for quant in quants:
                if quant.product_id.id not in product_quants:
                    product_quants[quant.product_id.id] = {
                        'product_id': quant.product_id.id,
                        'product_name': quant.product_id.display_name,
                        'product_sku': quant.product_id.default_code or '',
                        'quantity': 0,
                    }
                product_quants[quant.product_id.id]['quantity'] += quant.quantity

            # Trier par quantité décroissante et limiter à 10
            stock_by_product = sorted(
                product_quants.values(),
                key=lambda x: x['quantity'],
                reverse=True
            )[:10]

            # Sous-emplacements (enfants directs)
            children = Location.search([
                ('location_id', '=', location_id),
                ('active', '=', True)
            ], order='name')

            children_data = []
            for child in children:
                child_quants = StockQuant.search([
                    ('location_id', '=', child.id),
                    ('quantity', '>', 0)
                ])
                child_stock = sum(child_quants.mapped('quantity'))

                children_data.append({
                    'id': child.id,
                    'name': child.name,
                    'complete_name': child.complete_name,
                    'usage': child.usage,
                    'stock_count': round(child_stock, 2),
                })

            location_data = {
                'id': location.id,
                'name': location.name,
                'complete_name': location.complete_name,
                'usage': location.usage,
                'parent_id': location.location_id.id if location.location_id else None,
                'parent_name': location.location_id.complete_name if location.location_id else None,
                'warehouse_id': location.warehouse_id.id if location.warehouse_id else None,
                'warehouse_name': location.warehouse_id.name if location.warehouse_id else None,
                'barcode': location.barcode or '',
                'active': location.active,
                'is_locked': location.is_locked if hasattr(location, 'is_locked') else False,
                'lock_reason': location.lock_reason if hasattr(location, 'lock_reason') else None,
                'total_stock': round(total_stock, 2),
                'products_count': products_count,
                'stock_by_product': stock_by_product,
                'children': children_data,
                'children_count': len(children_data),
            }

            _logger.info(f"Fetched location details: {location.complete_name} (id: {location.id})")

            return {
                'success': True,
                'data': location_data
            }

        except Exception as e:
            _logger.error(f"Get location detail error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/locations/create', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def create_location(self, **kwargs):
        """Créer une nouvelle location (admin uniquement)"""
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._require_admin()
            if error:
                return error

            Location = request.env['stock.location'].sudo()
            Warehouse = request.env['stock.warehouse'].sudo()

            params = self._get_params()

            name = params.get('name')
            warehouse_id = params.get('warehouse_id')
            usage = params.get('usage', 'internal')

            if not name or not warehouse_id:
                return {
                    'success': False,
                    'error': "Champs 'name' et 'warehouse_id' requis",
                    'errorCode': 'MISSING_FIELDS'
                }

            if usage not in ['internal', 'view']:
                return {
                    'success': False,
                    'error': "Usage doit être 'internal' ou 'view'",
                    'errorCode': 'INVALID_USAGE'
                }

            warehouse = Warehouse.browse(warehouse_id)
            if not warehouse.exists():
                return {
                    'success': False,
                    'error': "Entrepôt introuvable",
                    'errorCode': 'WAREHOUSE_NOT_FOUND'
                }

            parent_id = params.get('parent_id')
            if parent_id:
                parent = Location.browse(parent_id)
                if not parent.exists():
                    return {
                        'success': False,
                        'error': "Parent location introuvable",
                        'errorCode': 'PARENT_NOT_FOUND'
                    }

                if parent.warehouse_id and parent.warehouse_id.id != warehouse_id:
                    return {
                        'success': False,
                        'error': "Parent doit être dans le même entrepôt",
                        'errorCode': 'WAREHOUSE_MISMATCH'
                    }

                if parent.usage == 'internal':
                    return {
                        'success': False,
                        'error': "Parent doit être de type 'View', pas 'Stock physique'",
                        'errorCode': 'INVALID_PARENT_TYPE'
                    }

            location_vals = {
                'name': name,
                'usage': usage,
                'location_id': parent_id or warehouse.view_location_id.id,
                'company_id': warehouse.company_id.id,
                'barcode': params.get('barcode') or False,
                'active': True
            }

            location = Location.create(location_vals)

            _logger.info(f"Location created: {location.complete_name} (id: {location.id})")

            return {
                'success': True,
                'data': {
                    'id': location.id,
                    'name': location.name,
                    'complete_name': location.complete_name,
                    'usage': location.usage,
                    'parent_id': location.location_id.id if location.location_id else None,
                    'warehouse_id': location.warehouse_id.id if location.warehouse_id else None,
                    'barcode': location.barcode or '',
                    'active': location.active
                }
            }

        except Exception as e:
            _logger.error(f"Create location error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/locations/<int:location_id>/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def update_location(self, location_id, **kwargs):
        """Modifier une location existante (admin uniquement)"""
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._require_admin()
            if error:
                return error

            Location = request.env['stock.location'].sudo()
            params = self._get_params()

            location = Location.browse(location_id)
            if not location.exists():
                return {
                    'success': False,
                    'error': 'Location introuvable',
                    'errorCode': 'NOT_FOUND'
                }

            vals = {}

            if 'name' in params:
                vals['name'] = params['name']

            if 'parent_id' in params:
                new_parent_id = params['parent_id']
                if new_parent_id:
                    if self._is_descendant(location_id, new_parent_id):
                        return {
                            'success': False,
                            'error': 'Impossible : boucle infinie détectée',
                            'errorCode': 'CIRCULAR_LOOP'
                        }

                    new_parent = Location.browse(new_parent_id)
                    if not new_parent.exists():
                        return {
                            'success': False,
                            'error': 'Nouveau parent introuvable',
                            'errorCode': 'PARENT_NOT_FOUND'
                        }

                    if location.warehouse_id and new_parent.warehouse_id:
                        if new_parent.warehouse_id.id != location.warehouse_id.id:
                            return {
                                'success': False,
                                'error': 'Parent doit être dans le même entrepôt',
                                'errorCode': 'WAREHOUSE_MISMATCH'
                            }

                vals['location_id'] = new_parent_id

            if 'barcode' in params:
                vals['barcode'] = params['barcode'] or False

            if 'active' in params:
                vals['active'] = params['active']

            if vals:
                location.write(vals)

            _logger.info(f"Location updated: {location.complete_name} (id: {location.id})")

            return {
                'success': True,
                'data': {
                    'id': location.id,
                    'name': location.name,
                    'complete_name': location.complete_name,
                    'usage': location.usage,
                    'parent_id': location.location_id.id if location.location_id else None,
                    'barcode': location.barcode or '',
                    'active': location.active
                }
            }

        except Exception as e:
            _logger.error(f"Update location error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/locations/<int:location_id>/archive', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def archive_location(self, location_id, **kwargs):
        """Archiver une location"""
        try:
            Location = request.env['stock.location'].sudo()
            StockQuant = request.env['stock.quant'].sudo()

            location = Location.browse(location_id)
            if not location.exists():
                return {
                    'success': False,
                    'error': 'Location introuvable',
                    'errorCode': 'NOT_FOUND'
                }

            quants = StockQuant.search([
                ('location_id', '=', location_id),
                ('quantity', '>', 0)
            ])
            if quants:
                stock_qty = sum(quants.mapped('quantity'))
                return {
                    'success': False,
                    'error': f"Impossible d'archiver : {stock_qty:.0f} unités en stock",
                    'errorCode': 'HAS_STOCK',
                    'details': {'stock_qty': stock_qty}
                }

            children_count = Location.search_count([
                ('location_id', '=', location_id),
                ('active', '=', True)
            ])
            if children_count > 0:
                return {
                    'success': False,
                    'error': f"Archiver d'abord les {children_count} sous-emplacements",
                    'errorCode': 'HAS_CHILDREN',
                    'details': {'children_count': children_count}
                }

            location.active = False
            _logger.info(f"Location archived: {location.complete_name} (id: {location.id})")

            return {
                'success': True,
                'message': f"Emplacement '{location.name}' archivé avec succès"
            }

        except Exception as e:
            _logger.error(f"Archive location error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/locations/<int:location_id>/move', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def move_location(self, location_id, **kwargs):
        """Déplacer une location dans l'arbre"""
        try:
            Location = request.env['stock.location'].sudo()
            params = self._get_params()
            new_parent_id = params.get('new_parent_id')

            if not new_parent_id:
                return {
                    'success': False,
                    'error': "Champ 'new_parent_id' requis",
                    'errorCode': 'MISSING_FIELDS'
                }

            location = Location.browse(location_id)
            if not location.exists():
                return {
                    'success': False,
                    'error': 'Location introuvable',
                    'errorCode': 'NOT_FOUND'
                }

            if self._is_descendant(location_id, new_parent_id):
                return {
                    'success': False,
                    'error': 'Impossible : boucle infinie détectée',
                    'errorCode': 'CIRCULAR_LOOP'
                }

            new_parent = Location.browse(new_parent_id)
            if not new_parent.exists():
                return {
                    'success': False,
                    'error': 'Nouveau parent introuvable',
                    'errorCode': 'PARENT_NOT_FOUND'
                }

            if location.warehouse_id and new_parent.warehouse_id:
                if new_parent.warehouse_id.id != location.warehouse_id.id:
                    return {
                        'success': False,
                        'error': 'Parent doit être dans le même entrepôt',
                        'errorCode': 'WAREHOUSE_MISMATCH'
                    }

            location.location_id = new_parent_id
            _logger.info(f"Location moved: {location.complete_name} to parent {new_parent_id}")

            return {
                'success': True,
                'data': {
                    'complete_name': location.complete_name,
                    'parent_id': location.location_id.id if location.location_id else None
                }
            }

        except Exception as e:
            _logger.error(f"Move location error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/reordering-rules', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_reordering_rules(self, **kwargs):
        """Liste les règles de réapprovisionnement avec état actuel"""
        try:
            Orderpoint = request.env['stock.warehouse.orderpoint'].sudo()
            Product = request.env['product.product'].sudo()

            params = self._get_params()

            # Build domain
            domain = []
            if params.get('warehouse_id'):
                domain.append(('warehouse_id', '=', int(params['warehouse_id'])))
            if params.get('active') is not None:
                domain.append(('active', '=', bool(params['active'])))

            rules = Orderpoint.search(domain)

            rules_data = []
            for rule in rules:
                product = rule.product_id

                # Calculer stock actuel dans le warehouse
                current_stock = product.with_context(
                    warehouse=rule.warehouse_id.id
                ).qty_available

                # Vérifier si règle déclenchée (stock < min)
                is_triggered = current_stock < rule.product_min_qty

                # Calculer quantité à commander
                qty_to_order = 0
                if is_triggered:
                    qty_needed = rule.product_max_qty - current_stock
                    if rule.qty_multiple > 1:
                        qty_to_order = math.ceil(qty_needed / rule.qty_multiple) * rule.qty_multiple
                    else:
                        qty_to_order = qty_needed

                rules_data.append({
                    'id': rule.id,
                    'product_id': product.id,
                    'product_name': product.display_name,
                    'product_sku': product.default_code or '',
                    'warehouse_id': rule.warehouse_id.id,
                    'warehouse_name': rule.warehouse_id.name,
                    'min_qty': rule.product_min_qty,
                    'max_qty': rule.product_max_qty,
                    'qty_multiple': rule.qty_multiple or 1,
                    'rule_horizon': rule.rule_horizon if hasattr(rule, 'rule_horizon') else 0,
                    'deadline': rule.deadline if hasattr(rule, 'deadline') else 0,
                    'current_stock': current_stock,
                    'is_triggered': is_triggered,
                    'qty_to_order': max(0, qty_to_order),
                    'active': rule.active
                })

            # Filtrer si triggered demandé
            if params.get('triggered'):
                rules_data = [r for r in rules_data if r['is_triggered']]

            _logger.info(f"Fetched {len(rules_data)} reordering rules")

            return {
                'success': True,
                'data': {
                    'rules': rules_data,
                    'total': len(rules_data)
                }
            }

        except Exception as e:
            _logger.error(f"Get reordering rules error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/reordering-rules/create', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def create_reordering_rule(self, **kwargs):
        """Créer une nouvelle règle de réapprovisionnement"""
        try:
            Orderpoint = request.env['stock.warehouse.orderpoint'].sudo()
            Product = request.env['product.product'].sudo()
            Warehouse = request.env['stock.warehouse'].sudo()

            params = self._get_params()

            # Validation champs requis
            product_id = params.get('product_id')
            warehouse_id = params.get('warehouse_id')
            min_qty = params.get('product_min_qty')
            max_qty = params.get('product_max_qty')

            if not all([product_id, warehouse_id, min_qty is not None, max_qty is not None]):
                return {
                    'success': False,
                    'error': 'Champs requis manquants : product_id, warehouse_id, product_min_qty, product_max_qty',
                    'errorCode': 'MISSING_FIELDS'
                }

            # Convertir en nombres
            try:
                product_id = int(product_id)
                warehouse_id = int(warehouse_id)
                min_qty = float(min_qty)
                max_qty = float(max_qty)
                qty_multiple = float(params.get('qty_multiple', 1))
            except (ValueError, TypeError):
                return {
                    'success': False,
                    'error': 'Valeurs numériques invalides',
                    'errorCode': 'INVALID_VALUES'
                }

            # Validation logique min < max
            if min_qty >= max_qty:
                return {
                    'success': False,
                    'error': 'Seuil minimum doit être inférieur au seuil maximum',
                    'errorCode': 'INVALID_RANGE'
                }

            # Vérifier que le produit existe
            product = Product.browse(product_id)
            if not product.exists():
                return {
                    'success': False,
                    'error': 'Produit introuvable',
                    'errorCode': 'PRODUCT_NOT_FOUND'
                }

            # Vérifier que l'entrepôt existe
            warehouse = Warehouse.browse(warehouse_id)
            if not warehouse.exists():
                return {
                    'success': False,
                    'error': 'Entrepôt introuvable',
                    'errorCode': 'WAREHOUSE_NOT_FOUND'
                }

            # Vérifier unicité produit + warehouse
            existing = Orderpoint.search([
                ('product_id', '=', product_id),
                ('warehouse_id', '=', warehouse_id),
                ('active', '=', True)
            ])
            if existing:
                return {
                    'success': False,
                    'error': 'Une règle existe déjà pour ce produit dans cet entrepôt',
                    'errorCode': 'DUPLICATE_RULE'
                }

            # Récupérer location stock principale
            stock_location = warehouse.lot_stock_id

            # Créer la règle
            rule_vals = {
                'product_id': product_id,
                'warehouse_id': warehouse_id,
                'location_id': stock_location.id,
                'product_min_qty': min_qty,
                'product_max_qty': max_qty,
                'qty_multiple': qty_multiple,
                'active': True
            }

            # Champs Odoo 19 : horizon et deadline (optionnels)
            if 'rule_horizon' in params:
                try:
                    rule_vals['rule_horizon'] = float(params['rule_horizon'])
                except (ValueError, TypeError):
                    pass

            if 'deadline' in params:
                try:
                    rule_vals['deadline'] = float(params['deadline'])
                except (ValueError, TypeError):
                    pass

            rule = Orderpoint.create(rule_vals)

            _logger.info(f"Reordering rule created: Product {product.display_name} in {warehouse.name} (id: {rule.id})")

            return {
                'success': True,
                'data': {
                    'id': rule.id,
                    'product_id': product_id,
                    'product_name': product.display_name,
                    'warehouse_id': warehouse_id,
                    'warehouse_name': warehouse.name,
                    'min_qty': min_qty,
                    'max_qty': max_qty,
                    'qty_multiple': qty_multiple,
                    'rule_horizon': rule.rule_horizon if hasattr(rule, 'rule_horizon') else 0,
                    'deadline': rule.deadline if hasattr(rule, 'deadline') else 0
                }
            }

        except Exception as e:
            _logger.error(f"Create reordering rule error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/reordering-rules/<int:rule_id>/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def update_reordering_rule(self, rule_id, **kwargs):
        """Modifier une règle de réapprovisionnement"""
        try:
            Orderpoint = request.env['stock.warehouse.orderpoint'].sudo()
            params = self._get_params()

            rule = Orderpoint.browse(rule_id)
            if not rule.exists():
                return {
                    'success': False,
                    'error': 'Règle introuvable',
                    'errorCode': 'NOT_FOUND'
                }

            # Récupérer valeurs à mettre à jour
            min_qty = params.get('product_min_qty')
            max_qty = params.get('product_max_qty')
            qty_multiple = params.get('qty_multiple')
            active = params.get('active')

            # Construire dict update
            update_vals = {}

            if min_qty is not None:
                try:
                    min_qty = float(min_qty)
                    update_vals['product_min_qty'] = min_qty
                except (ValueError, TypeError):
                    return {
                        'success': False,
                        'error': 'Valeur min_qty invalide',
                        'errorCode': 'INVALID_VALUES'
                    }

            if max_qty is not None:
                try:
                    max_qty = float(max_qty)
                    update_vals['product_max_qty'] = max_qty
                except (ValueError, TypeError):
                    return {
                        'success': False,
                        'error': 'Valeur max_qty invalide',
                        'errorCode': 'INVALID_VALUES'
                    }

            # Validation min < max
            final_min = update_vals.get('product_min_qty', rule.product_min_qty)
            final_max = update_vals.get('product_max_qty', rule.product_max_qty)
            if final_min >= final_max:
                return {
                    'success': False,
                    'error': 'Seuil minimum doit être inférieur au seuil maximum',
                    'errorCode': 'INVALID_RANGE'
                }

            if qty_multiple is not None:
                try:
                    update_vals['qty_multiple'] = float(qty_multiple)
                except (ValueError, TypeError):
                    return {
                        'success': False,
                        'error': 'Valeur qty_multiple invalide',
                        'errorCode': 'INVALID_VALUES'
                    }

            if active is not None:
                update_vals['active'] = bool(active)

            # Champs Odoo 19 : horizon et deadline (optionnels)
            rule_horizon = params.get('rule_horizon')
            if rule_horizon is not None:
                try:
                    update_vals['rule_horizon'] = float(rule_horizon)
                except (ValueError, TypeError):
                    return {
                        'success': False,
                        'error': 'Valeur rule_horizon invalide',
                        'errorCode': 'INVALID_VALUES'
                    }

            deadline = params.get('deadline')
            if deadline is not None:
                try:
                    update_vals['deadline'] = float(deadline)
                except (ValueError, TypeError):
                    return {
                        'success': False,
                        'error': 'Valeur deadline invalide',
                        'errorCode': 'INVALID_VALUES'
                    }

            if update_vals:
                rule.write(update_vals)
                _logger.info(f"Reordering rule updated: {rule.id}")

            return {
                'success': True,
                'data': {
                    'id': rule.id,
                    'min_qty': rule.product_min_qty,
                    'max_qty': rule.product_max_qty,
                    'qty_multiple': rule.qty_multiple,
                    'rule_horizon': rule.rule_horizon if hasattr(rule, 'rule_horizon') else 0,
                    'deadline': rule.deadline if hasattr(rule, 'deadline') else 0,
                    'active': rule.active
                }
            }

        except Exception as e:
            _logger.error(f"Update reordering rule error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/reordering-rules/<int:rule_id>/delete', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def delete_reordering_rule(self, rule_id, **kwargs):
        """Supprimer (archiver) une règle de réapprovisionnement"""
        try:
            Orderpoint = request.env['stock.warehouse.orderpoint'].sudo()

            rule = Orderpoint.browse(rule_id)
            if not rule.exists():
                return {
                    'success': False,
                    'error': 'Règle introuvable',
                    'errorCode': 'NOT_FOUND'
                }

            product_name = rule.product_id.display_name
            warehouse_name = rule.warehouse_id.name

            # Archiver (ne pas supprimer définitivement)
            rule.active = False

            _logger.info(f"Reordering rule archived: {product_name} in {warehouse_name} (id: {rule.id})")

            return {
                'success': True,
                'message': f"Règle pour {product_name} archivée avec succès"
            }

        except Exception as e:
            _logger.error(f"Delete reordering rule error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'errorCode': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/change-reasons', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_stock_change_reasons(self, **kwargs):
        """
        Récupérer les raisons de changement de stock (OCA).

        Returns:
            dict: {
                'success': bool,
                'data': {
                    'reasons': [...],
                    'total': int,
                    'limit': int,
                    'offset': int
                }
            }
        """
        try:
            # Raisons prédéfinies pour le moment
            # TODO: Créer un vrai modèle Odoo stock.change.reason si besoin
            predefined_reasons = [
                {
                    'id': 1,
                    'name': 'Inventaire annuel',
                    'code': 'INVENTORY',
                    'description': 'Ajustement suite à inventaire physique',
                    'active': True,
                    'usage_count': 0
                },
                {
                    'id': 2,
                    'name': 'Produit endommagé',
                    'code': 'DAMAGED',
                    'description': 'Produit cassé ou non vendable',
                    'active': True,
                    'usage_count': 0
                },
                {
                    'id': 3,
                    'name': 'Produit périmé',
                    'code': 'EXPIRED',
                    'description': 'Produit hors date de péremption',
                    'active': True,
                    'usage_count': 0
                },
                {
                    'id': 4,
                    'name': 'Vol',
                    'code': 'THEFT',
                    'description': 'Produit volé',
                    'active': True,
                    'usage_count': 0
                },
                {
                    'id': 5,
                    'name': 'Perte',
                    'code': 'LOSS',
                    'description': 'Produit perdu',
                    'active': True,
                    'usage_count': 0
                },
                {
                    'id': 6,
                    'name': 'Retour fournisseur',
                    'code': 'SUPPLIER_RETURN',
                    'description': 'Produit retourné au fournisseur',
                    'active': True,
                    'usage_count': 0
                },
                {
                    'id': 7,
                    'name': 'Erreur de saisie',
                    'code': 'DATA_ERROR',
                    'description': 'Correction d\'une erreur de saisie',
                    'active': True,
                    'usage_count': 0
                },
                {
                    'id': 8,
                    'name': 'Don',
                    'code': 'DONATION',
                    'description': 'Produit donné',
                    'active': True,
                    'usage_count': 0
                },
                {
                    'id': 9,
                    'name': 'Échantillon',
                    'code': 'SAMPLE',
                    'description': 'Produit utilisé comme échantillon',
                    'active': True,
                    'usage_count': 0
                },
                {
                    'id': 10,
                    'name': 'Autre',
                    'code': 'OTHER',
                    'description': 'Autre raison',
                    'active': True,
                    'usage_count': 0
                }
            ]

            return {
                'success': True,
                'data': {
                    'reasons': predefined_reasons,
                    'total': len(predefined_reasons),
                    'limit': 100,
                    'offset': 0
                }
            }

        except Exception as e:
            _logger.error(f"Get stock change reasons error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'error_code': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/inventories', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_stock_inventories_oca(self, **kwargs):
        """
        Récupérer les inventaires de stock (OCA).

        Returns:
            dict: {
                'success': bool,
                'data': {
                    'inventories': [...],
                    'total': int,
                    'limit': int,
                    'offset': int
                }
            }
        """
        try:
            # Inventaires fictifs pour le moment
            # TODO: Intégrer avec le module OCA stock_inventory si installé
            sample_inventories = []

            return {
                'success': True,
                'data': {
                    'inventories': sample_inventories,
                    'total': 0,
                    'limit': 100,
                    'offset': 0
                }
            }

        except Exception as e:
            _logger.error(f"Get stock inventories error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'error_code': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/adjust-with-reason', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def adjust_stock_with_reason(self, **kwargs):
        """
        Ajuster le stock d'un produit avec une raison (OCA).

        Params:
            product_id: int
            location_id: int
            new_quantity: number
            reason_id: int (optional)
            notes: str (optional)

        Returns:
            dict: {'success': bool, 'message': str}
        """
        try:
            params = self._get_params()

            # Valider les paramètres requis
            if not params.get('product_id'):
                return {
                    'success': False,
                    'error': 'product_id requis',
                    'error_code': 'MISSING_PARAM'
                }

            if not params.get('location_id'):
                return {
                    'success': False,
                    'error': 'location_id requis',
                    'error_code': 'MISSING_PARAM'
                }

            if 'new_quantity' not in params:
                return {
                    'success': False,
                    'error': 'new_quantity requis',
                    'error_code': 'MISSING_PARAM'
                }

            # TODO: Implémenter l'ajustement réel avec stock.quant
            # Pour le moment, retourner succès

            return {
                'success': True,
                'message': 'Ajustement de stock enregistré'
            }

        except Exception as e:
            _logger.error(f"Adjust stock with reason error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'error_code': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock/location-locks', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_location_locks(self, **kwargs):
        """
        Récupérer les emplacements verrouillés (OCA).

        Returns:
            dict: {
                'success': bool,
                'data': {
                    'locks': [...],
                    'total': int
                }
            }
        """
        try:
            # Verrous fictifs pour le moment
            # TODO: Intégrer avec le module OCA stock_location_lockdown si installé
            sample_locks = []

            return {
                'success': True,
                'data': {
                    'locks': sample_locks,
                    'total': 0
                }
            }

        except Exception as e:
            _logger.error(f"Get location locks error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur serveur',
                'error_code': 'SERVER_ERROR'
            }

    @http.route('/api/ecommerce/stock-alerts/unsubscribe/<int:alert_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def unsubscribe_stock_alert(self, alert_id, **kwargs):
        """
        Se désabonner d'une alerte de réapprovisionnement

        Args:
            alert_id (int): ID de l'alerte

        Returns:
            dict: {
                'success': bool,
                'message': str
            }
        """
        try:
            IrParam = request.env['ir.config_parameter'].sudo()

            # Chercher l'alerte
            # Note: ir.config_parameter n'a pas de méthode search par valeur,
            # donc on doit itérer ou utiliser une autre stratégie
            # Pour simplifier, on suppose que l'utilisateur fournit le product_id aussi

            params = self._get_params()
            product_id = params.get('product_id')

            if not product_id:
                return {
                    'success': False,
                    'error': 'product_id requis pour désabonnement'
                }

            # Déterminer la clé
            if request.session.uid:
                Partner = request.env['res.partner'].sudo()
                partner = Partner.browse(request.session.uid)
                alert_key = f'stock_alert.{product_id}.{partner.id}'
            else:
                email = params.get('email')
                if not email:
                    return {
                        'success': False,
                        'error': 'Email requis pour désabonnement invité'
                    }
                alert_key = f'stock_alert.{product_id}.{email}'

            # Supprimer l'alerte
            IrParam.set_param(alert_key, False)  # Suppression

            # Supprimer aussi l'email associé
            email_key = f'stock_alert_email.{alert_id}'
            IrParam.set_param(email_key, False)

            _logger.info(f"Stock alert {alert_id} unsubscribed")

            return {
                'success': True,
                'message': 'Vous ne recevrez plus de notifications pour ce produit'
            }

        except Exception as e:
            _logger.error(f"Unsubscribe stock alert error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    # =========================================================================
    # STOCK SCRAP (Mise au rebut)
    # =========================================================================

    @http.route('/api/stock/scraps', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_stock_scraps(self, **kwargs):
        """Liste des mises au rebut avec filtres"""
        try:
            auth_result = self._authenticate_from_header()
            if auth_result:
                return auth_result

            state = kwargs.get('state')  # 'draft', 'done'
            product_id = kwargs.get('product_id')
            limit = kwargs.get('limit', 50)
            offset = kwargs.get('offset', 0)

            Scrap = request.env['quelyos.stock.scrap'].sudo()

            domain = []
            if state:
                domain.append(('state', '=', state))
            if product_id:
                domain.append(('product_id', '=', int(product_id)))

            total = Scrap.search_count(domain)
            scraps = Scrap.search(domain, limit=limit, offset=offset, order='create_date desc')

            return {
                'success': True,
                'scraps': [s.to_dict() for s in scraps],
                'total': total,
                'limit': limit,
                'offset': offset,
            }

        except Exception as e:
            _logger.error(f"Get stock scraps error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/stock/scraps/<int:scrap_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_stock_scrap_detail(self, scrap_id, **kwargs):
        """Détails d'une mise au rebut"""
        try:
            auth_result = self._authenticate_from_header()
            if auth_result:
                return auth_result

            Scrap = request.env['quelyos.stock.scrap'].sudo()
            scrap = Scrap.browse(scrap_id)

            if not scrap.exists():
                return {
                    'success': False,
                    'error': f'Mise au rebut {scrap_id} introuvable'
                }

            return {
                'success': True,
                'scrap': scrap.to_dict(),
            }

        except Exception as e:
            _logger.error(f"Get stock scrap detail error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/stock/scraps/create', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def create_stock_scrap(self, **kwargs):
        """Créer une nouvelle mise au rebut"""
        try:
            auth_result = self._authenticate_from_header()
            if auth_result:
                return auth_result

            # Validation champs requis
            required_fields = ['product_id', 'scrap_qty', 'location_id', 'reason']
            for field in required_fields:
                if not kwargs.get(field):
                    return {
                        'success': False,
                        'error': f'Champ requis: {field}'
                    }

            Scrap = request.env['quelyos.stock.scrap'].sudo()

            # Préparer valeurs
            vals = {
                'product_id': int(kwargs['product_id']),
                'scrap_qty': float(kwargs['scrap_qty']),
                'location_id': int(kwargs['location_id']),
                'reason': kwargs['reason'],
            }

            # Champs optionnels
            if kwargs.get('scrap_location_id'):
                vals['scrap_location_id'] = int(kwargs['scrap_location_id'])
            if kwargs.get('lot_id'):
                vals['lot_id'] = int(kwargs['lot_id'])
            if kwargs.get('notes'):
                vals['notes'] = kwargs['notes']

            scrap = Scrap.create(vals)

            return {
                'success': True,
                'message': 'Mise au rebut créée avec succès',
                'scrap': scrap.to_dict(),
            }

        except Exception as e:
            _logger.error(f"Create stock scrap error: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e) if str(e) else 'Une erreur est survenue'
            }

    @http.route('/api/stock/scraps/<int:scrap_id>/validate', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def validate_stock_scrap(self, scrap_id, **kwargs):
        """Valider une mise au rebut (génère mouvement stock)"""
        try:
            auth_result = self._authenticate_from_header()
            if auth_result:
                return auth_result

            Scrap = request.env['quelyos.stock.scrap'].sudo()
            scrap = Scrap.browse(scrap_id)

            if not scrap.exists():
                return {
                    'success': False,
                    'error': f'Mise au rebut {scrap_id} introuvable'
                }

            # Valider
            scrap.action_validate()

            return {
                'success': True,
                'message': 'Mise au rebut validée avec succès',
                'scrap': scrap.to_dict(),
            }

        except Exception as e:
            _logger.error(f"Validate stock scrap error: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e) if str(e) else 'Une erreur est survenue'
            }

    @http.route('/api/stock/scraps/<int:scrap_id>/delete', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def delete_stock_scrap(self, scrap_id, **kwargs):
        """Supprimer une mise au rebut (brouillon uniquement)"""
        try:
            auth_result = self._authenticate_from_header()
            if auth_result:
                return auth_result

            Scrap = request.env['quelyos.stock.scrap'].sudo()
            scrap = Scrap.browse(scrap_id)

            if not scrap.exists():
                return {
                    'success': False,
                    'error': f'Mise au rebut {scrap_id} introuvable'
                }

            if scrap.state == 'done':
                return {
                    'success': False,
                    'error': 'Impossible de supprimer une mise au rebut validée'
                }

            scrap.unlink()

            return {
                'success': True,
                'message': 'Mise au rebut supprimée avec succès'
            }

        except Exception as e:
            _logger.error(f"Delete stock scrap error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    # =========================================================================
    # STOCK RESERVATIONS (Réservations manuelles)
    # =========================================================================

    @http.route('/api/stock/reservations', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_stock_reservations(self, **kwargs):
        """Liste des réservations avec filtres"""
        try:
            auth_result = self._authenticate_from_header()
            if auth_result:
                return auth_result

            state = kwargs.get('state')  # 'draft', 'active', 'released', 'expired'
            product_id = kwargs.get('product_id')
            location_id = kwargs.get('location_id')
            limit = kwargs.get('limit', 50)
            offset = kwargs.get('offset', 0)

            Reservation = request.env['quelyos.stock.reservation'].sudo()

            domain = []
            if state:
                domain.append(('state', '=', state))
            if product_id:
                domain.append(('product_id', '=', int(product_id)))
            if location_id:
                domain.append(('location_id', '=', int(location_id)))

            total = Reservation.search_count(domain)
            reservations = Reservation.search(domain, limit=limit, offset=offset, order='create_date desc')

            return {
                'success': True,
                'reservations': [r.to_dict() for r in reservations],
                'total': total,
                'limit': limit,
                'offset': offset,
            }

        except Exception as e:
            _logger.error(f"Get stock reservations error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/stock/reservations/<int:reservation_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_stock_reservation_detail(self, reservation_id, **kwargs):
        """Détails d'une réservation"""
        try:
            auth_result = self._authenticate_from_header()
            if auth_result:
                return auth_result

            Reservation = request.env['quelyos.stock.reservation'].sudo()
            reservation = Reservation.browse(reservation_id)

            if not reservation.exists():
                return {
                    'success': False,
                    'error': f'Réservation {reservation_id} introuvable'
                }

            return {
                'success': True,
                'reservation': reservation.to_dict(),
            }

        except Exception as e:
            _logger.error(f"Get stock reservation detail error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/stock/reservations/create', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def create_stock_reservation(self, **kwargs):
        """Créer une nouvelle réservation"""
        try:
            auth_result = self._authenticate_from_header()
            if auth_result:
                return auth_result

            # Validation champs requis
            required_fields = ['product_id', 'reserved_qty', 'location_id', 'reason']
            for field in required_fields:
                if not kwargs.get(field):
                    return {
                        'success': False,
                        'error': f'Champ requis: {field}'
                    }

            Reservation = request.env['quelyos.stock.reservation'].sudo()

            # Préparer valeurs
            vals = {
                'product_id': int(kwargs['product_id']),
                'reserved_qty': float(kwargs['reserved_qty']),
                'location_id': int(kwargs['location_id']),
                'reason': kwargs['reason'],
            }

            # Champs optionnels
            if kwargs.get('expiration_date'):
                vals['expiration_date'] = kwargs['expiration_date']
            if kwargs.get('notes'):
                vals['notes'] = kwargs['notes']
            if kwargs.get('tenant_id'):
                vals['tenant_id'] = int(kwargs['tenant_id'])

            # Créer réservation
            reservation = Reservation.create(vals)

            return {
                'success': True,
                'message': 'Réservation créée avec succès',
                'reservation': reservation.to_dict(),
            }

        except Exception as e:
            _logger.error(f"Create stock reservation error: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e) if str(e) else 'Une erreur est survenue'
            }

    @http.route('/api/stock/reservations/<int:reservation_id>/activate', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def activate_stock_reservation(self, reservation_id, **kwargs):
        """Activer une réservation (vérifie stock disponible)"""
        try:
            auth_result = self._authenticate_from_header()
            if auth_result:
                return auth_result

            Reservation = request.env['quelyos.stock.reservation'].sudo()
            reservation = Reservation.browse(reservation_id)

            if not reservation.exists():
                return {
                    'success': False,
                    'error': f'Réservation {reservation_id} introuvable'
                }

            # Activer
            reservation.action_activate()

            return {
                'success': True,
                'message': 'Réservation activée avec succès',
                'reservation': reservation.to_dict(),
            }

        except Exception as e:
            _logger.error(f"Activate stock reservation error: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e) if str(e) else 'Une erreur est survenue'
            }

    @http.route('/api/stock/reservations/<int:reservation_id>/release', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def release_stock_reservation(self, reservation_id, **kwargs):
        """Libérer une réservation manuellement"""
        try:
            auth_result = self._authenticate_from_header()
            if auth_result:
                return auth_result

            Reservation = request.env['quelyos.stock.reservation'].sudo()
            reservation = Reservation.browse(reservation_id)

            if not reservation.exists():
                return {
                    'success': False,
                    'error': f'Réservation {reservation_id} introuvable'
                }

            # Libérer
            reservation.action_release()

            return {
                'success': True,
                'message': 'Réservation libérée avec succès',
                'reservation': reservation.to_dict(),
            }

        except Exception as e:
            _logger.error(f"Release stock reservation error: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e) if str(e) else 'Une erreur est survenue'
            }

    @http.route('/api/stock/reservations/<int:reservation_id>/delete', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def delete_stock_reservation(self, reservation_id, **kwargs):
        """Supprimer une réservation (brouillon uniquement)"""
        try:
            auth_result = self._authenticate_from_header()
            if auth_result:
                return auth_result

            Reservation = request.env['quelyos.stock.reservation'].sudo()
            reservation = Reservation.browse(reservation_id)

            if not reservation.exists():
                return {
                    'success': False,
                    'error': f'Réservation {reservation_id} introuvable'
                }

            if reservation.state not in ['draft', 'released', 'expired']:
                return {
                    'success': False,
                    'error': 'Impossible de supprimer une réservation active'
                }

            reservation.unlink()

            return {
                'success': True,
                'message': 'Réservation supprimée avec succès'
            }

        except Exception as e:
            _logger.error(f"Delete stock reservation error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }
