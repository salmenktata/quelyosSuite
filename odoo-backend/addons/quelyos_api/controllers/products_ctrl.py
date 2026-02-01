# -*- coding: utf-8 -*-
import logging
import time
import os
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

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

_redis_client = None
if REDIS_AVAILABLE:
    try:
        redis_host = os.environ.get("REDIS_HOST", "localhost")
        redis_port = int(os.environ.get("REDIS_PORT", 6379))
        _redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            db=0,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2
        )
        _redis_client.ping()
    except Exception:
        _redis_client = None

_view_count_cache = {}


class QuelyosProductsAPI(BaseController):
    """API controleur pour les produits, categories, images et variantes"""

    def _serialize_product_detail(self, product, slug=None, include_ribbon=True):
        """
        Sérialise un produit product.template en dictionnaire JSON.
        Helper pour réduire duplication entre get_product_detail et get_product_by_slug.

        Args:
            product: Recordset product.template
            slug: Slug du produit (optionnel, auto-généré si absent)
            include_ribbon: Inclure les données du ribbon/badge (défaut: True)

        Returns:
            dict: Données du produit formatées pour l'API
        """
        # Récupérer toutes les images du produit
        images = []
        for img in product.product_template_image_ids.sorted('sequence'):
            images.append({
                'id': img.id,
                'name': img.name or f'Image {img.sequence}',
                'url': f'/web/image/product.image/{img.id}/image_1920',
                'sequence': img.sequence,
            })

        # Calculer le stock depuis stock.quant (somme de toutes les variantes)
        # Note: product.qty_available ne fonctionne pas correctement avec auth='public'
        StockQuant = request.env['stock.quant'].sudo()
        variant_ids = product.product_variant_ids.ids
        quants = StockQuant.search([
            ('product_id', 'in', variant_ids),
            ('location_id.usage', '=', 'internal')
        ])
        qty = sum(quants.mapped('quantity')) if quants else 0.0

        if qty <= 0:
            stock_status = 'out_of_stock'
        elif qty <= 5:
            stock_status = 'low_stock'
        else:
            stock_status = 'in_stock'

        # Récupérer les taxes applicables
        taxes = []
        for tax in product.taxes_id:
            taxes.append({
                'id': tax.id,
                'name': tax.name,
                'amount': tax.amount,
                'amount_type': tax.amount_type,
                'price_include': tax.price_include,
            })

        # Récupérer le ribbon (badge) du produit (optionnel)
        ribbon_data = None
        if include_ribbon and product.website_ribbon_id:
            ribbon = product.website_ribbon_id
            ribbon_name = ribbon.name
            if isinstance(ribbon_name, dict):
                ribbon_name = ribbon_name.get('fr_FR', ribbon_name.get('en_US', ''))
            ribbon_data = {
                'id': ribbon.id,
                'name': ribbon_name,
                'bg_color': ribbon.bg_color,
                'text_color': ribbon.text_color,
                'position': ribbon.position,
                'style': ribbon.style,
            }

        # Construire le slug (auto-généré ou fourni)
        product_slug = slug if slug is not None else product.name.lower().replace(' ', '-')

        # Construire le dictionnaire de données du produit
        data = {
            'id': product.id,
            'name': product.name,
            'description': product.description_sale or '',
            'description_purchase': product.description_purchase or '',
            'price': product.list_price,
            'standard_price': product.standard_price,
            'default_code': product.default_code or '',
            'barcode': product.barcode or '',
            'weight': product.weight or 0,
            'volume': product.volume or 0,
            'product_length': getattr(product, 'product_length', 0) or 0,
            'product_width': getattr(product, 'product_width', 0) or 0,
            'product_height': getattr(product, 'product_height', 0) or 0,
            'type': product.type or 'consu',
            'uom_id': product.uom_id.id if product.uom_id else None,
            'uom_name': product.uom_id.name if product.uom_id else None,
            'product_tag_ids': [
                {
                    'id': tag.id,
                    'name': tag.name,
                    'color': tag.color if hasattr(tag, 'color') else 0
                }
                for tag in product.product_tag_ids
            ] if product.product_tag_ids else [],
            'image': f'/web/image/product.template/{product.id}/image_1920' if product.image_1920 else (getattr(product, 'x_image_external_url', None) or None),
            'images': images,
            'slug': product_slug,
            'qty_available': qty,
            'qty_available_unreserved': product.qty_available_unreserved,
            'virtual_available': product.virtual_available,
            'stock_status': stock_status,
            'active': product.active,
            'create_date': product.create_date.isoformat() if product.create_date else None,
            'variant_count': product.product_variant_count,
            'category': {
                'id': product.categ_id.id,
                'name': product.categ_id.name,
            } if product.categ_id else None,
            'ribbon': ribbon_data,
            'taxes': taxes,
            # Champs marketing e-commerce
            'is_featured': getattr(product, 'x_is_featured', False) or False,
            'is_new': getattr(product, 'x_is_new', False) or False,
            'is_bestseller': getattr(product, 'x_is_bestseller', False) or False,
            'compare_at_price': product.compare_list_price if hasattr(product, 'compare_list_price') and product.compare_list_price else None,
            'offer_end_date': getattr(product, 'x_offer_end_date', None).isoformat() if getattr(product, 'x_offer_end_date', None) else None,
            # Champs contenu enrichi
            'technical_description': getattr(product, 'x_technical_description', None) or None,
            # Champs statistiques
            'view_count': getattr(product, 'x_view_count', 0) or 0,
        }

        return data

    def _check_view_count_rate_limit(self, product_id):
        """
        Vérifie et incrémente le compteur de vues avec rate limiting.
        Utilise Redis si disponible, sinon fallback sur cache mémoire.

        Args:
            product_id: ID du produit

        Returns:
            bool: True si la vue doit être comptée, False sinon
        """
        try:
            # Récupérer l'IP du client
            ip = request.httprequest.environ.get('HTTP_X_REAL_IP') or \
                 request.httprequest.environ.get('HTTP_X_FORWARDED_FOR', '').split(',')[0] or \
                 request.httprequest.remote_addr

            cache_key = f"view_count:{ip}:{product_id}"
            current_time = time.time()

            # Utiliser Redis si disponible
            if _redis_client:
                try:
                    # SET avec NX (not exists) et EX (expiration en secondes)
                    # Retourne True si la clé a été créée, False si elle existe déjà
                    was_set = _redis_client.set(cache_key, current_time, ex=60, nx=True)
                    return bool(was_set)
                except Exception as redis_err:
                    _logger.warning(f"Redis error in rate limiting: {redis_err}. Falling back to memory cache.")
                    # Continuer avec le cache mémoire en cas d'erreur Redis

            # Fallback: cache en mémoire (non-distribué)
            last_view = _view_count_cache.get(cache_key, 0)
            if current_time - last_view >= 60:
                _view_count_cache[cache_key] = current_time

                # Nettoyage du cache (éviter croissance infinie)
                if len(_view_count_cache) > 10000:
                    _view_count_cache.clear()

                return True

            return False

        except Exception as e:
            _logger.warning(f"Error in view count rate limiting: {e}")
            return False

    def _get_total_review_count(self):
        """
        Récupère le nombre total d'avis clients validés sur le site.
        Utilisé pour afficher les statistiques marketing.

        Returns:
            int: Nombre total d'avis ou 0 si le modèle n'existe pas
        """
        try:
            # Vérifier si le modèle product.review existe
            if 'product.review' in request.env:
                count = request.env['product.review'].sudo().search_count([
                    ('is_published', '=', True)
                ])
                return count
            # Fallback: essayer mail.message avec un type avis
            return 0
        except Exception as e:
            _logger.warning(f"Error getting total review count: {e}")
            return 0

    @http.route('/api/ecommerce/products', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_products_list(self, **kwargs):
        """Liste des produits avec recherche, filtres et tri (GET via JSON-RPC)"""
        # Rate limiting: 60 req/min par IP (anti-scraping)
        rate_error = check_rate_limit(request, RateLimitConfig.PRODUCTS_LIST, 'products_list')
        if rate_error:
            return rate_error
        try:
            params = self._get_params()
            tenant_id = params.get('tenant_id')
            limit = int(params.get('limit', 20))
            offset = int(params.get('offset', 0))
            category_id = params.get('category_id')
            search = params.get('search', '').strip()
            sort_by = params.get('sort_by', 'name')  # name, price, qty_available, create_date
            sort_order = params.get('sort_order', 'asc')  # asc, desc
            stock_status = params.get('stock_status')  # in_stock, low_stock, out_of_stock
            include_archived = params.get('include_archived', False)
            price_min = params.get('price_min')
            price_max = params.get('price_max')
            attribute_value_ids = params.get('attribute_value_ids')  # Liste d'IDs de valeurs d'attributs

            # Initialiser le cache et générer la clé unique
            cache = get_cache_service()
            cache_key = cache._generate_key(
                'products',
                tenant_id=tenant_id,
                limit=limit,
                offset=offset,
                category_id=category_id,
                search=search,
                sort_by=sort_by,
                sort_order=sort_order,
                stock_status=stock_status,
                include_archived=include_archived,
                price_min=price_min,
                price_max=price_max,
                attribute_value_ids=str(attribute_value_ids) if attribute_value_ids else None
            )

            # Vérifier le cache
            cached_data = cache.get(cache_key)
            if cached_data:
                _logger.debug(f"✅ Cache HIT for products list")
                return cached_data

            _logger.debug(f"❌ Cache MISS for products list - fetching from DB")

            # Context pour inclure les produits archivés si demandé
            ProductTemplate = request.env['product.template'].sudo()
            if include_archived:
                ProductTemplate = ProductTemplate.with_context(active_test=False)

            domain = [('sale_ok', '=', True)]

            # Filtre par tenant (multi-tenant isolation)
            if tenant_id:
                domain.append(('tenant_id', '=', tenant_id))

            # Filtre par statut actif/archivé
            if include_archived and params.get('archived_only'):
                domain.append(('active', '=', False))
            elif not include_archived:
                pass  # Par défaut, Odoo filtre déjà les inactifs
            if category_id:
                domain.append(('categ_id', '=', int(category_id)))

            # Filtres de prix
            if price_min is not None:
                domain.append(('list_price', '>=', float(price_min)))
            if price_max is not None:
                domain.append(('list_price', '<=', float(price_max)))

            # Recherche textuelle (nom, SKU, description)
            if search:
                domain.append('|')
                domain.append('|')
                domain.append(('name', 'ilike', search))
                domain.append(('default_code', 'ilike', search))
                domain.append(('description_sale', 'ilike', search))

            # Filtre par valeurs d'attributs
            # Les attribute_value_ids sont des IDs de product.attribute.value
            if attribute_value_ids:
                # Convertir en liste d'entiers si nécessaire
                if isinstance(attribute_value_ids, str):
                    attribute_value_ids = [int(x) for x in attribute_value_ids.split(',') if x.strip()]
                elif not isinstance(attribute_value_ids, list):
                    attribute_value_ids = [int(attribute_value_ids)]
                else:
                    attribute_value_ids = [int(x) for x in attribute_value_ids]

                if attribute_value_ids:
                    # Filtrer les produits qui ont ces valeurs d'attributs dans leurs lignes d'attributs
                    # attribute_line_ids.value_ids contient les product.attribute.value liées
                    domain.append(('attribute_line_ids.value_ids', 'in', attribute_value_ids))

            # Mapping des champs de tri
            sort_field_map = {
                'name': 'name',
                'price': 'list_price',
                'qty_available': 'qty_available',
                'create_date': 'create_date',
                'default_code': 'default_code',
            }
            order_field = sort_field_map.get(sort_by, 'name')
            order_dir = 'desc' if sort_order == 'desc' else 'asc'
            order = f'{order_field} {order_dir}'

            products = ProductTemplate.search(
                domain,
                limit=limit,
                offset=offset,
                order=order
            )

            total = ProductTemplate.search_count(domain)

            # Construire les données enrichies
            StockQuant = request.env['stock.quant'].sudo()
            data = []
            for p in products:
                # Calculer le statut de stock en allant directement dans stock.quant
                # (plus fiable avec auth='public' car qty_available dépend du contexte)
                quants = StockQuant.search([
                    ('product_id', 'in', p.product_variant_ids.ids),
                    ('location_id.usage', '=', 'internal')
                ])
                qty = sum(quants.mapped('quantity')) if quants else 0.0
                if qty <= 0:
                    p_stock_status = 'out_of_stock'
                elif qty <= 5:
                    p_stock_status = 'low_stock'
                else:
                    p_stock_status = 'in_stock'

                # Filtrer par statut stock si demandé
                if stock_status and p_stock_status != stock_status:
                    continue

                # Récupérer les images du produit
                images_list = []
                image_url = None
                if p.product_template_image_ids:
                    for idx, img in enumerate(p.product_template_image_ids.sorted('sequence')):
                        img_data = {
                            'id': img.id,
                            'url': f'/web/image/product.image/{img.id}/image_1920',
                            'is_main': idx == 0,
                            'sequence': img.sequence,
                        }
                        images_list.append(img_data)
                        if idx == 0:
                            image_url = img_data['url']
                elif p.image_1920:
                    # Fallback sur l'image principale du produit template
                    image_url = f'/web/image/product.template/{p.id}/image_1920'
                    images_list = [{
                        'id': 0,
                        'url': image_url,
                        'is_main': True,
                        'sequence': 1,
                    }]

                # Récupérer le ribbon (badge) du produit
                ribbon_data = None
                if p.website_ribbon_id:
                    ribbon = p.website_ribbon_id
                    # Récupérer le nom dans la langue courante (fr_FR par défaut)
                    ribbon_name = ribbon.name
                    if isinstance(ribbon_name, dict):
                        ribbon_name = ribbon_name.get('fr_FR', ribbon_name.get('en_US', ''))
                    ribbon_data = {
                        'id': ribbon.id,
                        'name': ribbon_name,
                        'bg_color': ribbon.bg_color,
                        'text_color': ribbon.text_color,
                        'position': ribbon.position,
                        'style': ribbon.style,
                    }

                data.append({
                    'id': p.id,
                    'name': p.name,
                    'price': p.list_price,
                    'standard_price': p.standard_price,
                    'default_code': p.default_code or '',
                    'barcode': p.barcode or '',
                    'image': f'/web/image/product.template/{p.id}/image_1920' if p.image_1920 else (getattr(p, 'x_image_external_url', None) or None),
                    'image_url': image_url or (getattr(p, 'x_image_external_url', None) or None),
                    'images': images_list if images_list else None,
                    'slug': p.name.lower().replace(' ', '-'),
                    'qty_available': qty,
                    'qty_available_unreserved': p.qty_available_unreserved,
                    'virtual_available': p.virtual_available,
                    'stock_status': p_stock_status,
                    'in_stock': qty > 0,
                    'weight': p.weight or 0,
                    'active': p.active,
                    'create_date': p.create_date.isoformat() if p.create_date else None,
                    'category': {
                        'id': p.categ_id.id,
                        'name': p.categ_id.name,
                    } if p.categ_id else None,
                    'variant_count': p.product_variant_count,
                    'ribbon': ribbon_data,
                    # Champs marketing e-commerce
                    'is_featured': getattr(p, 'x_is_featured', False) or False,
                    'is_new': getattr(p, 'x_is_new', False) or False,
                    'is_bestseller': getattr(p, 'x_is_bestseller', False) or False,
                    'compare_at_price': p.compare_list_price if hasattr(p, 'compare_list_price') and p.compare_list_price else None,
                    'offer_end_date': getattr(p, 'x_offer_end_date', None).isoformat() if getattr(p, 'x_offer_end_date', None) else None,
                })

            # Construire le résultat
            result = {
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

            # Stocker dans le cache (TTL: 5 minutes)
            cache.set(cache_key, result, CacheTTL.PRODUCTS_LIST)
            _logger.debug(f"✅ Cache SET for products list (TTL: {CacheTTL.PRODUCTS_LIST}s)")

            return result

        except Exception as e:
            _logger.error(f"Get products error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_product_detail(self, product_id, **kwargs):
        """Détail d'un produit (GET via JSON-RPC)"""
        try:
            product = request.env['product.template'].sudo().browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            # Utiliser le helper pour sérialiser le produit
            data = self._serialize_product_detail(product, include_ribbon=True)

            return {
                'success': True,
                'data': {
                    'product': data
                }
            }

        except Exception as e:
            _logger.error(f"Get product error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/slug/<string:slug>', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_product_by_slug(self, slug, **kwargs):
        """Détail d'un produit par slug (GET via JSON-RPC)"""
        try:
            # Rechercher tous les produits et générer leur slug pour trouver la correspondance
            products = request.env['product.template'].sudo().search([('active', '=', True)])

            product = None
            for prod in products:
                # Générer le slug du produit (même logique que dans get_product_detail)
                prod_slug = prod.name.lower().replace(' ', '-')
                if prod_slug == slug:
                    product = prod
                    break

            if not product:
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            # Incrémenter le compteur de vues (tracking) avec rate limiting
            # Limite: 1 vue par IP/produit toutes les 60 secondes
            if self._check_view_count_rate_limit(product.id):
                try:
                    # Incrémenter de manière atomique (évite race condition)
                    request.env.cr.execute("""
                        UPDATE product_template
                        SET x_view_count = COALESCE(x_view_count, 0) + 1
                        WHERE id = %s
                    """, (product.id,))
                except Exception as view_err:
                    _logger.warning(f"Could not increment view count: {view_err}")

            # Utiliser le helper pour sérialiser le produit (sans ribbon pour cet endpoint)
            data = self._serialize_product_detail(product, slug=slug, include_ribbon=False)

            return {
                'success': True,
                'product': data  # Format attendu par le frontend
            }

        except Exception as e:
            _logger.error(f"Get product by slug error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Erreur lors du chargement du produit'
            }

    @http.route('/api/ecommerce/products/create', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_product(self, **kwargs):
        """Créer un produit (ADMIN UNIQUEMENT)
        PROTECTION: Store User minimum requis
        """
        try:
            # Vérifier permissions Store User minimum
            error = self._check_any_group('group_quelyos_store_user', 'group_quelyos_store_manager')
            if error:
                return error

            params = self._get_params()
            tenant_id = params.get('tenant_id')
            name = params.get('name')
            price = params.get('price', 0.0)
            description = params.get('description', '')
            category_id = params.get('category_id')

            if not name:
                return {
                    'success': False,
                    'error': 'Product name is required'
                }

            product_data = {
                'name': name,
                'list_price': float(price),
                'description_sale': description,
                'sale_ok': True,
                'purchase_ok': True,
            }

            # Tenant multi-tenant
            if tenant_id:
                product_data['tenant_id'] = tenant_id

            if category_id:
                product_data['categ_id'] = int(category_id)

            # Champs avancés optionnels
            if params.get('default_code'):
                product_data['default_code'] = params['default_code']
            if params.get('barcode'):
                product_data['barcode'] = params['barcode']
            if params.get('standard_price'):
                product_data['standard_price'] = float(params['standard_price'])
            if params.get('weight'):
                product_data['weight'] = float(params['weight'])

            # Dimensions produit
            if params.get('product_length'):
                product_data['product_length'] = float(params['product_length'])
            if params.get('product_width'):
                product_data['product_width'] = float(params['product_width'])
            if params.get('product_height'):
                product_data['product_height'] = float(params['product_height'])

            # Type de produit (consu, service, product)
            if params.get('type'):
                product_data['type'] = params['type']

            # Unité de mesure
            if params.get('uom_id'):
                product_data['uom_id'] = int(params['uom_id'])
                product_data['uom_po_id'] = int(params['uom_id'])  # Même UoM pour achat

            # Tags produit
            if params.get('product_tag_ids'):
                tag_ids = params['product_tag_ids']
                if isinstance(tag_ids, list):
                    product_data['product_tag_ids'] = [(6, 0, tag_ids)]

            # Description achat (fournisseurs)
            if params.get('description_purchase'):
                product_data['description_purchase'] = params['description_purchase']

            # Volume (pour calcul frais livraison)
            if params.get('volume'):
                product_data['volume'] = float(params['volume'])

            # Taxes de vente
            if 'taxes_id' in params:
                tax_ids = params['taxes_id']
                if tax_ids:
                    product_data['taxes_id'] = [(6, 0, tax_ids)]
                else:
                    product_data['taxes_id'] = [(5, 0, 0)]  # Supprimer toutes les taxes

            # Champs marketing e-commerce
            if 'is_featured' in params:
                product_data['x_is_featured'] = bool(params['is_featured'])
            if 'is_new' in params:
                product_data['x_is_new'] = bool(params['is_new'])
            if 'is_bestseller' in params:
                product_data['x_is_bestseller'] = bool(params['is_bestseller'])
            if 'compare_at_price' in params and params['compare_at_price']:
                product_data['compare_list_price'] = float(params['compare_at_price'])
            if 'offer_end_date' in params and params['offer_end_date']:
                product_data['x_offer_end_date'] = params['offer_end_date']
            if 'technical_description' in params:
                product_data['x_technical_description'] = params['technical_description'] or False

            product = request.env['product.template'].sudo().create(product_data)

            return {
                'success': True,
                'data': {
                    'product': {
                        'id': product.id,
                        'name': product.name,
                        'price': product.list_price,
                        'default_code': product.default_code or '',
                        'standard_price': product.standard_price,
                        'weight': product.weight or 0,
                    }
                }
            }

        except Exception as e:
            _logger.error(f"Create product error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def update_product(self, product_id, **kwargs):
        """Modifier un produit (ADMIN UNIQUEMENT)
        PROTECTION: Store User minimum requis
        """
        try:
            # Vérifier permissions Store User minimum
            error = self._check_any_group('group_quelyos_store_user', 'group_quelyos_store_manager')
            if error:
                return error

            product = request.env['product.template'].sudo().browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            params = self._get_params()
            update_data = {}

            # Champs de base
            if 'name' in params:
                update_data['name'] = params['name']
            if 'price' in params:
                update_data['list_price'] = float(params['price'])
            if 'description' in params:
                update_data['description_sale'] = params['description']
            if 'category_id' in params:
                update_data['categ_id'] = int(params['category_id']) if params['category_id'] else False

            # Champs avancés
            if 'default_code' in params:
                update_data['default_code'] = params['default_code'] or False
            if 'barcode' in params:
                update_data['barcode'] = params['barcode'] or False
            if 'standard_price' in params:
                update_data['standard_price'] = float(params['standard_price'])
            if 'weight' in params:
                update_data['weight'] = float(params['weight'])
            if 'product_length' in params:
                update_data['product_length'] = float(params['product_length']) if params['product_length'] else 0
            if 'product_width' in params:
                update_data['product_width'] = float(params['product_width']) if params['product_width'] else 0
            if 'product_height' in params:
                update_data['product_height'] = float(params['product_height']) if params['product_height'] else 0
            if 'active' in params:
                update_data['active'] = bool(params['active'])

            # Type de produit (consu, service, product)
            if 'type' in params:
                update_data['type'] = params['type']

            # Unité de mesure
            if 'uom_id' in params:
                uom_id = int(params['uom_id']) if params['uom_id'] else False
                update_data['uom_id'] = uom_id
                update_data['uom_po_id'] = uom_id  # Même UoM pour achat

            # Tags produit
            if 'product_tag_ids' in params:
                tag_ids = params['product_tag_ids']
                if isinstance(tag_ids, list):
                    update_data['product_tag_ids'] = [(6, 0, tag_ids)]

            # Description achat (fournisseurs)
            if 'description_purchase' in params:
                update_data['description_purchase'] = params['description_purchase'] or False

            # Volume (pour calcul frais livraison)
            if 'volume' in params:
                update_data['volume'] = float(params['volume']) if params['volume'] else 0

            # Taxes de vente
            if 'taxes_id' in params:
                tax_ids = params['taxes_id']
                if tax_ids:
                    update_data['taxes_id'] = [(6, 0, tax_ids)]
                else:
                    update_data['taxes_id'] = [(5, 0, 0)]  # Supprimer toutes les taxes

            # Champs marketing e-commerce
            if 'is_featured' in params:
                update_data['x_is_featured'] = bool(params['is_featured'])
            if 'is_new' in params:
                update_data['x_is_new'] = bool(params['is_new'])
            if 'is_bestseller' in params:
                update_data['x_is_bestseller'] = bool(params['is_bestseller'])
            if 'compare_at_price' in params:
                update_data['compare_list_price'] = float(params['compare_at_price']) if params['compare_at_price'] else 0
            if 'offer_end_date' in params:
                update_data['x_offer_end_date'] = params['offer_end_date'] if params['offer_end_date'] else False
            if 'technical_description' in params:
                update_data['x_technical_description'] = params['technical_description'] if params['technical_description'] else False

            if update_data:
                product.write(update_data)

            return {
                'success': True,
                'data': {
                    'product': {
                        'id': product.id,
                        'name': product.name,
                        'price': product.list_price,
                        'default_code': product.default_code or '',
                        'standard_price': product.standard_price,
                        'weight': product.weight or 0,
                        'active': product.active,
                    }
                }
            }

        except Exception as e:
            _logger.error(f"Update product error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/delete', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def delete_product(self, product_id, **kwargs):
        """Supprimer un produit (ADMIN UNIQUEMENT)
        PROTECTION: Store User minimum requis
        """
        try:
            # Vérifier permissions Store User minimum
            error = self._check_any_group('group_quelyos_store_user', 'group_quelyos_store_manager')
            if error:
                return error

            product = request.env['product.template'].sudo().browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            product.unlink()

            return {'success': True}

        except Exception as e:
            _logger.error(f"Delete product error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/archive', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def archive_product(self, product_id, **kwargs):
        """Archiver ou désarchiver un produit (admin)
        PROTECTION: Store User minimum requis
        """
        try:
            # Vérifier permissions Store User minimum
            error = self._check_any_group('group_quelyos_store_user', 'group_quelyos_store_manager')
            if error:
                return error

            params = self._get_params()
            archive = params.get('archive', True)

            # Inclure les produits archivés dans la recherche
            product = request.env['product.template'].sudo().with_context(active_test=False).browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            product.write({'active': not archive})

            action = 'archivé' if archive else 'désarchivé'
            return {
                'success': True,
                'data': {
                    'product': {
                        'id': product.id,
                        'name': product.name,
                        'active': product.active,
                    },
                    'message': f'Produit "{product.name}" {action} avec succès'
                }
            }

        except Exception as e:
            _logger.error(f"Archive product error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/taxes', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_taxes(self, **kwargs):
        """Récupérer la liste des taxes disponibles"""
        try:
            # Rechercher les taxes de vente actives
            taxes = request.env['account.tax'].sudo().search([
                ('type_tax_use', '=', 'sale'),
                ('active', '=', True),
            ], order='sequence, name')

            taxes_data = []
            for tax in taxes:
                taxes_data.append({
                    'id': tax.id,
                    'name': tax.name,
                    'amount': tax.amount,
                    'amount_type': tax.amount_type,  # 'percent', 'fixed', etc.
                    'price_include': tax.price_include,
                    'description': tax.description or '',
                })

            return {
                'success': True,
                'data': {
                    'taxes': taxes_data
                }
            }

        except Exception as e:
            _logger.error(f"Get taxes error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/uom', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_uom(self, **kwargs):
        """Récupérer la liste des unités de mesure disponibles"""
        try:
            # Rechercher les unités de mesure actives
            uoms = request.env['uom.uom'].sudo().search([
                ('active', '=', True),
            ], order='name')

            uom_data = []
            for uom in uoms:
                uom_data.append({
                    'id': uom.id,
                    'name': uom.name,
                    'category_id': uom.category_id.id,
                    'category_name': uom.category_id.name,
                    'uom_type': uom.uom_type,  # 'bigger', 'reference', 'smaller'
                    'factor': uom.factor,
                })

            return {
                'success': True,
                'data': {
                    'uom': uom_data
                }
            }

        except Exception as e:
            _logger.error(f"Get UoM error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/product-tags', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_product_tags(self, **kwargs):
        """Récupérer la liste des tags produits disponibles"""
        try:
            # Rechercher les tags produits
            ProductTag = request.env['product.tag'].sudo()
            tags = ProductTag.search([], order='name', limit=200)

            tag_data = []
            for tag in tags:
                tag_data.append({
                    'id': tag.id,
                    'name': tag.name,
                    'color': tag.color if hasattr(tag, 'color') else 0,
                })

            return {
                'success': True,
                'data': {
                    'tags': tag_data
                }
            }

        except Exception as e:
            _logger.error(f"Get product tags error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/product-tags/create', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_product_tag(self, **kwargs):
        """Créer un nouveau tag produit (admin)
        PROTECTION: Store User minimum requis
        """
        try:
            # Vérifier permissions Store User minimum
            error = self._check_any_group('group_quelyos_store_user', 'group_quelyos_store_manager')
            if error:
                return error

            params = self._get_params()
            name = params.get('name')

            if not name:
                return {
                    'success': False,
                    'error': 'Tag name is required'
                }

            # Créer le tag
            ProductTag = request.env['product.tag'].sudo()
            tag_data = {'name': name}

            if params.get('color'):
                tag_data['color'] = int(params['color'])

            tag = ProductTag.create(tag_data)

            return {
                'success': True,
                'data': {
                    'id': tag.id,
                    'name': tag.name,
                    'color': tag.color if hasattr(tag, 'color') else 0,
                }
            }

        except Exception as e:
            _logger.error(f"Create product tag error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/product-types', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_product_types(self, **kwargs):
        """Récupérer la liste des types de produits disponibles"""
        try:
            # Types de produits Odoo standard
            product_types = [
                {'value': 'consu', 'label': 'Consommable', 'description': 'Pas de gestion de stock'},
                {'value': 'service', 'label': 'Service', 'description': 'Prestation immatérielle'},
                {'value': 'product', 'label': 'Stockable', 'description': 'Avec gestion de stock'},
            ]

            return {
                'success': True,
                'data': {
                    'product_types': product_types
                }
            }

        except Exception as e:
            _logger.error(f"Get product types error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/duplicate', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def duplicate_product(self, product_id, **kwargs):
        """Dupliquer un produit (admin)
        PROTECTION: Store User minimum requis
        """
        try:
            # Vérifier permissions Store User minimum
            error = self._check_any_group('group_quelyos_store_user', 'group_quelyos_store_manager')
            if error:
                return error

            product = request.env['product.template'].sudo().browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            # Dupliquer avec la méthode copy() d'Odoo
            params = self._get_params()
            new_name = params.get('name', f"{product.name} (copie)")

            new_product = product.copy({
                'name': new_name,
                'default_code': f"{product.default_code or ''}-COPY" if product.default_code else False,
            })

            return {
                'success': True,
                'data': {
                    'product': {
                        'id': new_product.id,
                        'name': new_product.name,
                        'price': new_product.list_price,
                        'default_code': new_product.default_code or '',
                        'image': f'/web/image/product.template/{new_product.id}/image_1920' if new_product.image_1920 else (getattr(new_product, 'x_image_external_url', None) or None),
                        'slug': new_product.name.lower().replace(' ', '-'),
                        'category': {
                            'id': new_product.categ_id.id,
                            'name': new_product.categ_id.name,
                        } if new_product.categ_id else None,
                    },
                    'message': f'Produit "{new_product.name}" créé avec succès'
                }
            }

        except Exception as e:
            _logger.error(f"Duplicate product error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/export', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def export_products(self, **kwargs):
        """Exporter les produits en CSV (admin)"""
        try:
            # Vérifier permissions Store User minimum
            error = self._check_any_group('group_quelyos_store_user', 'group_quelyos_store_manager')
            if error:
                return error

            params = self._get_params()
            category_id = params.get('category_id')
            search = params.get('search', '').strip()

            domain = [('sale_ok', '=', True)]
            if category_id:
                domain.append(('categ_id', '=', int(category_id)))
            if search:
                domain.append('|')
                domain.append('|')
                domain.append(('name', 'ilike', search))
                domain.append(('default_code', 'ilike', search))
                domain.append(('description_sale', 'ilike', search))

            products = request.env['product.template'].sudo().search(domain, order='name')

            # Construire les données CSV
            csv_data = []
            for p in products:
                qty = p.qty_available
                if qty <= 0:
                    stock_status = 'Rupture'
                elif qty <= 5:
                    stock_status = 'Stock faible'
                else:
                    stock_status = 'En stock'

                csv_data.append({
                    'id': p.id,
                    'name': p.name,
                    'default_code': p.default_code or '',
                    'barcode': p.barcode or '',
                    'price': p.list_price,
                    'standard_price': p.standard_price,
                    'qty_available': qty,
                    'qty_available_unreserved': p.qty_available_unreserved,
                    'stock_status': stock_status,
                    'weight': p.weight or 0,
                    'category': p.categ_id.name if p.categ_id else '',
                    'active': 'Oui' if p.active else 'Non',
                })

            return {
                'success': True,
                'data': {
                    'products': csv_data,
                    'total': len(csv_data),
                    'columns': [
                        {'key': 'id', 'label': 'ID'},
                        {'key': 'name', 'label': 'Nom'},
                        {'key': 'default_code', 'label': 'Référence (SKU)'},
                        {'key': 'barcode', 'label': 'Code-barres'},
                        {'key': 'price', 'label': 'Prix de vente'},
                        {'key': 'standard_price', 'label': 'Prix d\'achat'},
                        {'key': 'qty_available', 'label': 'Stock'},
                        {'key': 'stock_status', 'label': 'Statut stock'},
                        {'key': 'weight', 'label': 'Poids (kg)'},
                        {'key': 'category', 'label': 'Catégorie'},
                        {'key': 'active', 'label': 'Actif'},
                    ]
                }
            }

        except Exception as e:
            _logger.error(f"Export products error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/import', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def import_products(self, **kwargs):
        """Importer des produits depuis CSV (admin)"""
        try:
            # Vérifier permissions Store User minimum
            error = self._check_any_group('group_quelyos_store_user', 'group_quelyos_store_manager')
            if error:
                return error

            params = self._get_params()
            products_data = params.get('products', [])
            update_existing = params.get('update_existing', False)

            if not products_data:
                return {
                    'success': False,
                    'error': 'No products data provided'
                }

            ProductTemplate = request.env['product.template'].sudo()
            ProductCategory = request.env['product.category'].sudo()

            created = []
            updated = []
            errors = []

            for idx, row in enumerate(products_data, start=1):
                try:
                    name = row.get('name', '').strip()
                    if not name:
                        errors.append({'row': idx, 'error': 'Nom obligatoire'})
                        continue

                    # Chercher catégorie par nom
                    category_id = False
                    category_name = row.get('category', '').strip()
                    if category_name:
                        category = ProductCategory.search([('name', '=ilike', category_name)], limit=1)
                        if category:
                            category_id = category.id
                        else:
                            # Créer la catégorie si elle n'existe pas
                            category = ProductCategory.create({'name': category_name})
                            category_id = category.id

                    # Construire les données produit
                    product_vals = {
                        'name': name,
                        'list_price': float(row.get('price', 0) or 0),
                        'standard_price': float(row.get('standard_price', 0) or 0),
                        'description_sale': row.get('description', '') or False,
                        'default_code': row.get('default_code', row.get('sku', '')) or False,
                        'barcode': row.get('barcode', '') or False,
                        'weight': float(row.get('weight', 0) or 0),
                        'sale_ok': True,
                        'purchase_ok': True,
                    }
                    if category_id:
                        product_vals['categ_id'] = category_id

                    # Chercher produit existant par SKU ou code-barres
                    existing_product = None
                    if update_existing:
                        sku = product_vals.get('default_code')
                        barcode = product_vals.get('barcode')
                        if sku:
                            existing_product = ProductTemplate.search([('default_code', '=', sku)], limit=1)
                        if not existing_product and barcode:
                            existing_product = ProductTemplate.search([('barcode', '=', barcode)], limit=1)

                    if existing_product:
                        existing_product.write(product_vals)
                        updated.append({
                            'id': existing_product.id,
                            'name': existing_product.name,
                            'row': idx
                        })
                    else:
                        new_product = ProductTemplate.create(product_vals)
                        created.append({
                            'id': new_product.id,
                            'name': new_product.name,
                            'row': idx
                        })

                except Exception as row_error:
                    errors.append({'row': idx, 'error': str(row_error)})

            return {
                'success': True,
                'data': {
                    'created': created,
                    'updated': updated,
                    'errors': errors,
                    'summary': {
                        'total_rows': len(products_data),
                        'created_count': len(created),
                        'updated_count': len(updated),
                        'error_count': len(errors)
                    }
                }
            }

        except Exception as e:
            _logger.error(f"Import products error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    # ==================== PRODUCT IMAGES ====================

    @http.route('/api/ecommerce/products/<int:product_id>/images', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_product_images(self, product_id, **kwargs):
        """Liste toutes les images d'un produit"""
        try:
            product = request.env['product.template'].sudo().browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            images = []
            for img in product.product_template_image_ids.sorted('sequence'):
                images.append({
                    'id': img.id,
                    'name': img.name or f'Image {img.sequence}',
                    'url': f'/web/image/product.image/{img.id}/image_1920',
                    'url_medium': f'/web/image/product.image/{img.id}/image_512',
                    'url_small': f'/web/image/product.image/{img.id}/image_128',
                    'sequence': img.sequence,
                })

            return {
                'success': True,
                'data': {
                    'images': images
                }
            }

        except Exception as e:
            _logger.error(f"Get product images error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/images/upload', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def upload_product_images(self, product_id, **kwargs):
        """Upload images produit (ADMIN UNIQUEMENT)
        PROTECTION: Store User minimum requis
        """
        try:
            # Vérifier permissions Store User minimum
            error = self._check_any_group('group_quelyos_store_user', 'group_quelyos_store_manager')
            if error:
                return error

            product = request.env['product.template'].sudo().browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            params = self._get_params()
            images_data = params.get('images', [])

            if not images_data:
                return {
                    'success': False,
                    'error': 'No images provided'
                }

            # Créer les images
            ProductImage = request.env['product.image'].sudo()
            created_images = []

            # Récupérer la séquence max actuelle
            max_sequence = max([img.sequence for img in product.product_template_image_ids], default=0)

            for idx, image_data in enumerate(images_data):
                # image_data doit contenir: {name: str, image_1920: str (base64)}
                if not image_data.get('image_1920'):
                    continue

                img_values = {
                    'name': image_data.get('name', f'Image {idx + 1}'),
                    'image_1920': image_data['image_1920'],  # Base64
                    'product_tmpl_id': product.id,
                    'sequence': max_sequence + idx + 1,
                }

                new_image = ProductImage.create(img_values)
                created_images.append({
                    'id': new_image.id,
                    'name': new_image.name,
                    'url': f'/web/image/product.image/{new_image.id}/image_1920',
                    'sequence': new_image.sequence,
                })

            return {
                'success': True,
                'data': {
                    'images': created_images,
                    'message': f'{len(created_images)} image(s) uploaded successfully'
                }
            }

        except Exception as e:
            _logger.error(f"Upload product images error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/images/<int:image_id>/delete', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def delete_product_image(self, product_id, image_id, **kwargs):
        """Supprimer image produit (ADMIN UNIQUEMENT)
        PROTECTION: Store User minimum requis
        """
        try:
            # Vérifier permissions Store User minimum
            error = self._check_any_group('group_quelyos_store_user', 'group_quelyos_store_manager')
            if error:
                return error
            product = request.env['product.template'].sudo().browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            # Chercher l'image
            image = request.env['product.image'].sudo().browse(image_id)

            if not image.exists():
                return {
                    'success': False,
                    'error': 'Image not found'
                }

            # Vérifier que l'image appartient bien au produit
            if image.product_tmpl_id.id != product_id:
                return {
                    'success': False,
                    'error': 'Image does not belong to this product'
                }

            image.unlink()

            return {
                'success': True,
                'data': {
                    'message': 'Image deleted successfully'
                }
            }

        except Exception as e:
            _logger.error(f"Delete product image error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/images/reorder', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def reorder_product_images(self, product_id, **kwargs):
        """Réorganiser images produit (ADMIN UNIQUEMENT)
        PROTECTION: Store User minimum requis
        """
        try:
            # Vérifier permissions Store User minimum
            error = self._check_any_group('group_quelyos_store_user', 'group_quelyos_store_manager')
            if error:
                return error

            product = request.env['product.template'].sudo().browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            params = self._get_params()
            image_ids_order = params.get('image_ids', [])  # Liste d'IDs dans le nouvel ordre

            if not image_ids_order:
                return {
                    'success': False,
                    'error': 'No image order provided'
                }

            # Mettre à jour les séquences
            ProductImage = request.env['product.image'].sudo()

            for idx, image_id in enumerate(image_ids_order):
                image = ProductImage.browse(image_id)
                if image.exists() and image.product_tmpl_id.id == product_id:
                    image.write({'sequence': idx + 1})

            return {
                'success': True,
                'data': {
                    'message': 'Images reordered successfully'
                }
            }

        except Exception as e:
            _logger.error(f"Reorder product images error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    # ==================== ATTRIBUTE VALUE IMAGES (V2) ====================
    # Images associées aux valeurs d'attributs (ex: images pour la couleur "Rouge")
    # Approche optimisée : une seule copie des images par valeur, partagée par toutes les variantes

    @http.route('/api/ecommerce/products/<int:product_id>/attribute-images', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_product_attribute_images(self, product_id, **kwargs):
        """
        Récupère les lignes d'attributs du produit avec le compteur d'images par valeur.
        Utilisé pour afficher l'interface de gestion des images par attribut.
        """
        try:
            product = request.env['product.template'].sudo().browse(product_id)
            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            ProductImage = request.env['product.image'].sudo()
            attribute_lines = []

            for line in product.attribute_line_ids:
                values_data = []
                for ptav in line.product_template_value_ids:
                    # Compter les images pour cette valeur d'attribut
                    images = ProductImage.search([
                        ('product_tmpl_id', '=', product_id),
                        ('product_template_attribute_value_id', '=', ptav.id)
                    ]).sorted('sequence')

                    first_image_url = None
                    if images:
                        first_image_url = f'/web/image/product.image/{images[0].id}/image_128'

                    values_data.append({
                        'ptav_id': ptav.id,
                        'name': ptav.name,
                        'html_color': ptav.product_attribute_value_id.html_color if ptav.product_attribute_value_id else None,
                        'image_count': len(images),
                        'first_image_url': first_image_url,
                    })

                attribute_lines.append({
                    'id': line.id,
                    'attribute_id': line.attribute_id.id,
                    'attribute_name': line.attribute_id.name,
                    'display_type': line.attribute_id.display_type,
                    'values': values_data,
                })

            return {
                'success': True,
                'data': {
                    'attribute_lines': attribute_lines
                }
            }

        except Exception as e:
            _logger.error(f"Get product attribute images error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/attribute-values/<int:ptav_id>/images', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_attribute_value_images(self, product_id, ptav_id, **kwargs):
        """Récupère les images associées à une valeur d'attribut spécifique"""
        try:
            product = request.env['product.template'].sudo().browse(product_id)
            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            # Vérifier que le PTAV existe et appartient à ce produit
            ptav = request.env['product.template.attribute.value'].sudo().browse(ptav_id)
            if not ptav.exists() or ptav.product_tmpl_id.id != product_id:
                return {
                    'success': False,
                    'error': 'Attribute value not found or does not belong to this product'
                }

            ProductImage = request.env['product.image'].sudo()
            images = ProductImage.search([
                ('product_tmpl_id', '=', product_id),
                ('product_template_attribute_value_id', '=', ptav_id)
            ]).sorted('sequence')

            images_data = []
            for img in images:
                images_data.append({
                    'id': img.id,
                    'name': img.name or f'Image {img.sequence}',
                    'url': f'/web/image/product.image/{img.id}/image_1920',
                    'url_medium': f'/web/image/product.image/{img.id}/image_512',
                    'url_small': f'/web/image/product.image/{img.id}/image_128',
                    'sequence': img.sequence,
                })

            return {
                'success': True,
                'data': {
                    'images': images_data,
                    'ptav_id': ptav_id,
                    'ptav_name': ptav.name,
                }
            }

        except Exception as e:
            _logger.error(f"Get attribute value images error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/attribute-values/<int:ptav_id>/images/upload', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def upload_attribute_value_images(self, product_id, ptav_id, **kwargs):
        """Upload des images pour une valeur d'attribut (admin)"""
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('base.group_system'):
                return {
                    'success': False,
                    'error': 'Insufficient permissions'
                }

            product = request.env['product.template'].sudo().browse(product_id)
            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            # Vérifier que le PTAV existe et appartient à ce produit
            ptav = request.env['product.template.attribute.value'].sudo().browse(ptav_id)
            if not ptav.exists() or ptav.product_tmpl_id.id != product_id:
                return {
                    'success': False,
                    'error': 'Attribute value not found or does not belong to this product'
                }

            params = self._get_params()
            images_data = params.get('images', [])

            if not images_data:
                return {
                    'success': False,
                    'error': 'No images provided'
                }

            # Limite de 10 images par valeur d'attribut
            ProductImage = request.env['product.image'].sudo()
            existing_count = ProductImage.search_count([
                ('product_tmpl_id', '=', product_id),
                ('product_template_attribute_value_id', '=', ptav_id)
            ])

            if existing_count + len(images_data) > 10:
                return {
                    'success': False,
                    'error': f'Maximum 10 images par valeur d\'attribut. Actuellement {existing_count} images.'
                }

            # Récupérer la séquence max actuelle
            existing_images = ProductImage.search([
                ('product_tmpl_id', '=', product_id),
                ('product_template_attribute_value_id', '=', ptav_id)
            ])
            max_sequence = max([img.sequence for img in existing_images], default=0)

            created_images = []
            for idx, image_data in enumerate(images_data):
                if not image_data.get('image_1920'):
                    continue

                img_values = {
                    'name': image_data.get('name', f'Image {idx + 1}'),
                    'image_1920': image_data['image_1920'],  # Base64
                    'product_tmpl_id': product.id,
                    'product_template_attribute_value_id': ptav_id,
                    'sequence': max_sequence + idx + 1,
                }

                new_image = ProductImage.create(img_values)
                created_images.append({
                    'id': new_image.id,
                    'name': new_image.name,
                    'url': f'/web/image/product.image/{new_image.id}/image_1920',
                    'url_medium': f'/web/image/product.image/{new_image.id}/image_512',
                    'url_small': f'/web/image/product.image/{new_image.id}/image_128',
                    'sequence': new_image.sequence,
                })

            return {
                'success': True,
                'data': {
                    'images': created_images,
                    'message': f'{len(created_images)} image(s) uploadée(s) avec succès'
                }
            }

        except Exception as e:
            _logger.error(f"Upload attribute value images error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/attribute-values/<int:ptav_id>/images/<int:image_id>/delete', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def delete_attribute_value_image(self, product_id, ptav_id, image_id, **kwargs):
        """Supprimer une image d'une valeur d'attribut (ADMIN UNIQUEMENT)"""
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

            # Vérifier que le PTAV existe
            ptav = request.env['product.template.attribute.value'].sudo().browse(ptav_id)
            if not ptav.exists() or ptav.product_tmpl_id.id != product_id:
                return {
                    'success': False,
                    'error': 'Attribute value not found or does not belong to this product'
                }

            # Chercher l'image
            image = request.env['product.image'].sudo().browse(image_id)
            if not image.exists():
                return {
                    'success': False,
                    'error': 'Image not found'
                }

            # Vérifier que l'image appartient bien à cette valeur d'attribut
            if image.product_template_attribute_value_id.id != ptav_id:
                return {
                    'success': False,
                    'error': 'Image does not belong to this attribute value'
                }

            image.unlink()

            return {
                'success': True,
                'data': {
                    'message': 'Image supprimée avec succès'
                }
            }

        except Exception as e:
            _logger.error(f"Delete attribute value image error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/attribute-values/<int:ptav_id>/images/reorder', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def reorder_attribute_value_images(self, product_id, ptav_id, **kwargs):
        """Réorganiser l'ordre des images d'une valeur d'attribut (admin)"""
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('base.group_system'):
                return {
                    'success': False,
                    'error': 'Insufficient permissions'
                }

            product = request.env['product.template'].sudo().browse(product_id)
            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            # Vérifier que le PTAV existe
            ptav = request.env['product.template.attribute.value'].sudo().browse(ptav_id)
            if not ptav.exists() or ptav.product_tmpl_id.id != product_id:
                return {
                    'success': False,
                    'error': 'Attribute value not found or does not belong to this product'
                }

            params = self._get_params()
            image_ids_order = params.get('image_ids', [])

            if not image_ids_order:
                return {
                    'success': False,
                    'error': 'No image order provided'
                }

            # Mettre à jour les séquences
            ProductImage = request.env['product.image'].sudo()

            for idx, image_id in enumerate(image_ids_order):
                image = ProductImage.browse(image_id)
                if image.exists() and image.product_template_attribute_value_id.id == ptav_id:
                    image.write({'sequence': idx + 1})

            return {
                'success': True,
                'data': {
                    'message': 'Ordre des images mis à jour avec succès'
                }
            }

        except Exception as e:
            _logger.error(f"Reorder attribute value images error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    # ==================== PRODUCT VARIANTS ====================

    @http.route('/api/ecommerce/attributes', type='jsonrpc', auth='public', csrf=False, cors='*')
    def get_all_attributes(self, **kwargs):
        """Liste tous les attributs disponibles (couleur, taille, etc.)"""
        try:
            Attribute = request.env['product.attribute'].sudo()
            attributes = Attribute.search([], limit=100)

            result = []
            for attr in attributes:
                result.append({
                    'id': attr.id,
                    'name': attr.name,
                    'display_type': attr.display_type,  # 'radio', 'pills', 'select', 'color'
                    'create_variant': attr.create_variant,  # 'always', 'dynamic', 'no_variant'
                    'values': [{
                        'id': val.id,
                        'name': val.name,
                        'html_color': val.html_color if hasattr(val, 'html_color') else None,
                        'sequence': val.sequence,
                    } for val in attr.value_ids.sorted('sequence')]
                })

            return {
                'success': True,
                'data': {
                    'attributes': result
                }
            }

        except Exception as e:
            _logger.error(f"Get attributes error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/variants', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_product_variants(self, product_id, **kwargs):
        """Obtenir les variantes et attributs d'un produit"""
        try:
            product = request.env['product.template'].sudo().browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            # Récupérer les lignes d'attributs
            attribute_lines = []
            for line in product.attribute_line_ids:
                attribute_lines.append({
                    'id': line.id,
                    'attribute_id': line.attribute_id.id,
                    'attribute_name': line.attribute_id.name,
                    'display_type': line.attribute_id.display_type,
                    'create_variant': line.attribute_id.create_variant,  # 'always', 'dynamic', 'no_variant'
                    'values': [{
                        'id': val.id,
                        'name': val.name,
                        'html_color': val.html_color if hasattr(val, 'html_color') else None,
                    } for val in line.value_ids]
                })

            # Récupérer les variantes (product.product)
            ProductImage = request.env['product.image'].sudo()
            StockQuant = request.env['stock.quant'].sudo()
            base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url')
            variants = []
            for variant in product.product_variant_ids:
                # Calculer le stock directement depuis stock.quant (plus fiable avec auth='public')
                quants = StockQuant.search([
                    ('product_id', '=', variant.id),
                    ('location_id.usage', '=', 'internal')
                ])
                qty_available = sum(quants.mapped('quantity')) if quants else 0.0
                # Récupérer les PTAV de cette variante
                variant_ptav_ids = variant.product_template_attribute_value_ids.ids

                # Récupérer les images depuis les valeurs d'attributs (PTAV)
                # Une image associée à "Rouge" sera partagée par toutes les variantes Rouge
                ptav_images = ProductImage.search([
                    ('product_tmpl_id', '=', product_id),
                    ('product_template_attribute_value_id', 'in', variant_ptav_ids)
                ]).sorted('sequence') if variant_ptav_ids else ProductImage.browse([])

                # Récupérer aussi les images spécifiques à cette variante
                variant_specific_images = ProductImage.search([
                    ('product_variant_id', '=', variant.id)
                ]).sorted('sequence')

                # Combiner les images (variante spécifique en premier, puis PTAV)
                all_images = variant_specific_images | ptav_images

                images_data = [{
                    'id': img.id,
                    'url': f'{base_url}/web/image/product.image/{img.id}/image_1920',
                    'url_small': f'{base_url}/web/image/product.image/{img.id}/image_128',
                    'sequence': img.sequence,
                    'ptav_id': img.product_template_attribute_value_id.id if img.product_template_attribute_value_id else None,
                    'variant_specific': img.product_variant_id.id == variant.id if img.product_variant_id else False,
                } for img in all_images]

                # Utiliser la première image disponible (PTAV ou spécifique) ou fallback sur image_128
                first_image_url = None
                if images_data:
                    first_image_url = images_data[0]['url']
                elif variant.image_128:
                    first_image_url = f'{base_url}/web/image/product.product/{variant.id}/image_1920'

                variants.append({
                    'id': variant.id,
                    'name': variant.name,
                    'display_name': variant.display_name,
                    'default_code': variant.default_code or '',
                    'barcode': variant.barcode or '',
                    'list_price': variant.list_price,
                    'standard_price': variant.standard_price,
                    'qty_available': qty_available,
                    'in_stock': qty_available > 0,
                    'image': f'/web/image/product.product/{variant.id}/image_128' if variant.image_128 else None,
                    'image_url': first_image_url,  # Pour compatibilité frontend et preview swatches
                    'images': images_data,
                    'image_count': len(images_data),
                    'attribute_values': [{
                        'id': val.id,
                        'name': val.name,
                        'attribute_id': val.attribute_id.id,
                        'attribute_name': val.attribute_id.name,
                    } for val in variant.product_template_attribute_value_ids.mapped('product_attribute_value_id')]
                })

            return {
                'success': True,
                'attributes': attribute_lines,
                'variants': variants,
                'variant_count': len(variants)
            }

        except Exception as e:
            _logger.error(f"Get product variants error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/attributes/add', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def add_product_attribute(self, product_id, **kwargs):
        """Ajouter un attribut à un produit (admin)"""
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            product = request.env['product.template'].sudo().browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            params = self._get_params()
            attribute_id = params.get('attribute_id')
            value_ids = params.get('value_ids', [])  # Liste des IDs de valeurs

            if not attribute_id:
                return {
                    'success': False,
                    'error': 'Attribute ID is required'
                }

            if not value_ids:
                return {
                    'success': False,
                    'error': 'At least one value is required'
                }

            # Vérifier que l'attribut n'est pas déjà sur ce produit
            existing = product.attribute_line_ids.filtered(
                lambda l: l.attribute_id.id == int(attribute_id)
            )
            if existing:
                return {
                    'success': False,
                    'error': 'This attribute is already on this product'
                }

            # Créer la ligne d'attribut
            AttributeLine = request.env['product.template.attribute.line'].sudo()
            line = AttributeLine.create({
                'product_tmpl_id': product.id,
                'attribute_id': int(attribute_id),
                'value_ids': [(6, 0, [int(v) for v in value_ids])],
            })

            return {
                'success': True,
                'data': {
                    'attribute_line': {
                        'id': line.id,
                        'attribute_id': line.attribute_id.id,
                        'attribute_name': line.attribute_id.name,
                        'values': [{
                            'id': val.id,
                            'name': val.name
                        } for val in line.value_ids]
                    },
                    'message': 'Attribute added successfully'
                }
            }

        except Exception as e:
            _logger.error(f"Add product attribute error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/attributes/<int:line_id>/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def update_product_attribute(self, product_id, line_id, **kwargs):
        """Modifier les valeurs d'un attribut sur un produit (ADMIN UNIQUEMENT)"""
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

            line = request.env['product.template.attribute.line'].sudo().browse(line_id)

            if not line.exists() or line.product_tmpl_id.id != product_id:
                return {
                    'success': False,
                    'error': 'Attribute line not found'
                }

            params = self._get_params()
            value_ids = params.get('value_ids', [])

            if not value_ids:
                return {
                    'success': False,
                    'error': 'At least one value is required'
                }

            # Mettre à jour les valeurs
            line.write({
                'value_ids': [(6, 0, [int(v) for v in value_ids])],
            })

            return {
                'success': True,
                'data': {
                    'attribute_line': {
                        'id': line.id,
                        'attribute_id': line.attribute_id.id,
                        'attribute_name': line.attribute_id.name,
                        'values': [{
                            'id': val.id,
                            'name': val.name
                        } for val in line.value_ids]
                    },
                    'message': 'Attribute updated successfully'
                }
            }

        except Exception as e:
            _logger.error(f"Update product attribute error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/attributes/<int:line_id>/delete', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def delete_product_attribute(self, product_id, line_id, **kwargs):
        """Supprimer un attribut d'un produit (admin)"""
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            product = request.env['product.template'].sudo().browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            line = request.env['product.template.attribute.line'].sudo().browse(line_id)

            if not line.exists() or line.product_tmpl_id.id != product_id:
                return {
                    'success': False,
                    'error': 'Attribute line not found'
                }

            line.unlink()

            return {
                'success': True,
                'data': {
                    'message': 'Attribute removed successfully'
                }
            }

        except Exception as e:
            _logger.error(f"Delete product attribute error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/variants/regenerate', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def regenerate_product_variants(self, product_id, **kwargs):
        """Régénérer toutes les variantes d'un produit basées sur ses attributs (admin)

        Utile après ajout/modification d'attributs pour créer toutes les combinaisons manquantes.
        Odoo ne génère pas automatiquement les variantes lors de l'ajout d'attributs.
        """
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            product = request.env['product.template'].sudo().browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            # Compter les variantes avant
            variants_before = len(product.product_variant_ids)

            # Forcer la régénération des variantes
            # _create_variant_ids() crée toutes les combinaisons manquantes
            product._create_variant_ids()

            # Commit pour s'assurer que les changements sont persistés
            request.env.cr.commit()

            # Invalider le cache pour récupérer les nouvelles variantes
            request.env.invalidate_all()

            # Recharger le produit
            product = request.env['product.template'].sudo().browse(product_id)
            variants_after = len(product.product_variant_ids)

            # Récupérer les variantes mises à jour
            variants_data = []
            for variant in product.product_variant_ids:
                # Récupérer les attributs de cette variante
                attributes = []
                for ptav in variant.product_template_attribute_value_ids:
                    attributes.append({
                        'attribute': ptav.attribute_id.name,
                        'value': ptav.name,
                        'attribute_id': ptav.attribute_id.id,
                        'value_id': ptav.product_attribute_value_id.id
                    })

                # Calculer le stock depuis stock.quant
                StockQuant = request.env['stock.quant'].sudo()
                quants = StockQuant.search([
                    ('product_id', '=', variant.id),
                    ('location_id.usage', '=', 'internal')
                ])
                qty_available = sum(quants.mapped('quantity')) if quants else 0.0

                variants_data.append({
                    'id': variant.id,
                    'name': variant.display_name,
                    'default_code': variant.default_code or '',
                    'barcode': variant.barcode or '',
                    'list_price': variant.lst_price,
                    'standard_price': variant.standard_price,
                    'qty_available': qty_available,
                    'active': variant.active,
                    'attributes': attributes
                })

            return {
                'success': True,
                'data': {
                    'variants_before': variants_before,
                    'variants_after': variants_after,
                    'variants_created': variants_after - variants_before,
                    'variants': variants_data,
                    'message': f'{variants_after - variants_before} nouvelles variantes créées'
                }
            }

        except Exception as e:
            _logger.error(f"Regenerate variants error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/variants/<int:variant_id>/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def update_product_variant(self, product_id, variant_id, **kwargs):
        """Modifier une variante spécifique (prix, code, etc.) (ADMIN UNIQUEMENT)"""
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
            update_data = {}

            if 'list_price' in params:
                # Prix de la variante (surcharge)
                update_data['lst_price'] = float(params['list_price'])

            if 'standard_price' in params:
                update_data['standard_price'] = float(params['standard_price'])

            if 'default_code' in params:
                update_data['default_code'] = params['default_code']

            if 'barcode' in params:
                update_data['barcode'] = params['barcode']

            if update_data:
                variant.write(update_data)

            return {
                'success': True,
                'data': {
                    'variant': {
                        'id': variant.id,
                        'name': variant.name,
                        'display_name': variant.display_name,
                        'default_code': variant.default_code or '',
                        'barcode': variant.barcode or '',
                        'list_price': variant.list_price,
                        'standard_price': variant.standard_price,
                    },
                    'message': 'Variant updated successfully'
                }
            }

        except Exception as e:
            _logger.error(f"Update product variant error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/variants/<int:variant_id>/stock/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
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

    # ==================== VARIANT IMAGES ====================

    @http.route('/api/ecommerce/products/<int:product_id>/variants/<int:variant_id>/images', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_variant_images(self, product_id, variant_id, **kwargs):
        """Récupérer les images d'une variante spécifique"""
        try:
            variant = request.env['product.product'].sudo().browse(variant_id)

            if not variant.exists() or variant.product_tmpl_id.id != product_id:
                return {
                    'success': False,
                    'error': 'Variant not found'
                }

            # Récupérer les images de la variante depuis product.image
            images = request.env['product.image'].sudo().search([
                ('product_variant_id', '=', variant_id)
            ], order='sequence')

            base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url')

            images_data = []
            for img in images:
                images_data.append({
                    'id': img.id,
                    'name': img.name or f'Image {img.id}',
                    'url': f'{base_url}/web/image/product.image/{img.id}/image_1920',
                    'url_medium': f'{base_url}/web/image/product.image/{img.id}/image_512',
                    'url_small': f'{base_url}/web/image/product.image/{img.id}/image_128',
                    'sequence': img.sequence,
                })

            return {
                'success': True,
                'data': {
                    'images': images_data
                }
            }

        except Exception as e:
            _logger.error(f"Get variant images error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/variants/<int:variant_id>/images/upload', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def upload_variant_images(self, product_id, variant_id, **kwargs):
        """Uploader des images pour une variante"""
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            variant = request.env['product.product'].sudo().browse(variant_id)

            if not variant.exists() or variant.product_tmpl_id.id != product_id:
                return {
                    'success': False,
                    'error': 'Variant not found'
                }

            params = self._get_params()
            images = params.get('images', [])

            if not images:
                return {
                    'success': False,
                    'error': 'No images provided'
                }

            # Trouver la séquence max actuelle
            existing = request.env['product.image'].sudo().search([
                ('product_variant_id', '=', variant_id)
            ], order='sequence desc', limit=1)
            next_seq = (existing.sequence + 1) if existing else 1

            base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url')
            created_images = []

            for img_data in images:
                img = request.env['product.image'].sudo().create({
                    'name': img_data.get('name', f'Image {next_seq}'),
                    'image_1920': img_data.get('image_1920'),
                    'product_tmpl_id': product_id,
                    'product_variant_id': variant_id,
                    'sequence': next_seq,
                })
                created_images.append({
                    'id': img.id,
                    'name': img.name,
                    'url': f'{base_url}/web/image/product.image/{img.id}/image_1920',
                    'url_medium': f'{base_url}/web/image/product.image/{img.id}/image_512',
                    'url_small': f'{base_url}/web/image/product.image/{img.id}/image_128',
                    'sequence': img.sequence,
                })
                next_seq += 1

            return {
                'success': True,
                'data': {
                    'images': created_images,
                    'message': f'{len(created_images)} image(s) uploadée(s)'
                }
            }

        except Exception as e:
            _logger.error(f"Upload variant images error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/variants/<int:variant_id>/images/<int:image_id>/delete', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def delete_variant_image(self, product_id, variant_id, image_id, **kwargs):
        """Supprimer une image de variante (ADMIN UNIQUEMENT)"""
        # SECURITE : Vérifier droits admin
        error = self._require_admin()
        if error:
            return error

        try:
            image = request.env['product.image'].sudo().browse(image_id)

            if not image.exists() or image.product_variant_id.id != variant_id:
                return {
                    'success': False,
                    'error': 'Image not found'
                }

            image.unlink()

            return {
                'success': True,
                'data': {
                    'message': 'Image supprimée'
                }
            }

        except Exception as e:
            _logger.error(f"Delete variant image error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/<int:product_id>/variants/<int:variant_id>/images/reorder', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def reorder_variant_images(self, product_id, variant_id, **kwargs):
        """Réordonner les images d'une variante"""
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            params = self._get_params()
            image_ids = params.get('image_ids', [])

            if not image_ids:
                return {
                    'success': False,
                    'error': 'No image IDs provided'
                }

            for seq, img_id in enumerate(image_ids, 1):
                img = request.env['product.image'].sudo().browse(img_id)
                if img.exists() and img.product_variant_id.id == variant_id:
                    img.write({'sequence': seq})

            return {
                'success': True,
                'data': {
                    'message': 'Ordre mis à jour'
                }
            }

        except Exception as e:
            _logger.error(f"Reorder variant images error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    # ==================== CATEGORIES ====================

    @http.route('/api/ecommerce/categories', type='jsonrpc', auth='public', csrf=False, cors='*')
    def get_categories_list(self, **kwargs):
        """Liste des catégories avec compteur produits, sous-catégories et recherche"""
        try:
            params = self._get_params()
            limit = int(params.get('limit', 100))
            offset = int(params.get('offset', 0))
            search = params.get('search', '')
            # Convertir include_tree en booléen (peut venir comme string "true"/"false" ou booléen)
            include_tree_param = params.get('include_tree', False)
            include_tree = include_tree_param in ['true', 'True', '1', 1, True] or include_tree_param is True

            # Construire le domaine de recherche
            domain = []
            if search:
                domain = [('name', 'ilike', search)]

            Category = request.env['product.category'].sudo()
            Product = request.env['product.template'].sudo()

            # Compter le total pour la pagination
            total = Category.search_count(domain)

            categories = Category.search(
                domain,
                limit=limit,
                offset=offset,
                order='parent_id, name'
            )

            def get_category_data(c):
                """Construire les données d'une catégorie"""
                # Compter les produits directement dans cette catégorie
                product_count = Product.search_count([('categ_id', '=', c.id)])
                # Compter tous les produits (incluant sous-catégories)
                total_product_count = Product.search_count([('categ_id', 'child_of', c.id)])

                data = {
                    'id': c.id,
                    'name': c.name,
                    'complete_name': c.complete_name,
                    'parent_id': c.parent_id.id if c.parent_id else None,
                    'parent_name': c.parent_id.name if c.parent_id else None,
                    'product_count': product_count,
                    'total_product_count': total_product_count,
                    'child_count': len(c.child_id),
                }

                # Inclure les enfants si demandé
                # Forcer le chargement des enfants avec .ids pour vérifier s'il y en a
                if include_tree:
                    children_ids = c.child_id.ids
                    if children_ids:
                        data['children'] = [get_category_data(child) for child in c.child_id]
                    else:
                        data['children'] = []

                return data

            # Si on veut l'arbre, ne retourner que les catégories racines
            if include_tree and not search:
                root_categories = Category.search([('parent_id', '=', False)], order='name')
                data = [get_category_data(c) for c in root_categories]
            else:
                data = [get_category_data(c) for c in categories]

            return {
                'success': True,
                'data': {
                    'categories': data,
                    'total': total,
                    'limit': limit,
                    'offset': offset
                }
            }

        except Exception as e:
            _logger.error(f"Get categories error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/categories/<int:category_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_category_detail(self, category_id, **kwargs):
        """Détail d'une catégorie (GET via JSON-RPC)"""
        try:
            category = request.env['product.category'].sudo().browse(category_id)

            if not category.exists():
                return {
                    'success': False,
                    'error': 'Category not found'
                }

            return {
                'success': True,
                'category': {
                    'id': category.id,
                    'name': category.name,
                    'parent_id': category.parent_id.id if category.parent_id else None,
                    'parent_name': category.parent_id.name if category.parent_id else None,
                }
            }

        except Exception as e:
            _logger.error(f"Get category error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/categories/create', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_category(self, **kwargs):
        """Créer une catégorie (ADMIN UNIQUEMENT)"""
        # SECURITE : Vérifier droits admin
        error = self._require_admin()
        if error:
            return error

        try:
            params = self._get_params()
            name = params.get('name')
            parent_id = params.get('parent_id')

            if not name:
                return {
                    'success': False,
                    'error': 'Category name is required'
                }

            category_data = {'name': name}

            if parent_id:
                category_data['parent_id'] = int(parent_id)

            category = request.env['product.category'].sudo().create(category_data)

            return {
                'success': True,
                'category': {
                    'id': category.id,
                    'name': category.name,
                    'parent_id': category.parent_id.id if category.parent_id else None,
                }
            }

        except Exception as e:
            _logger.error(f"Create category error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/categories/<int:category_id>/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def update_category(self, category_id, **kwargs):
        """Modifier une catégorie (ADMIN UNIQUEMENT)"""
        # SECURITE : Vérifier droits admin
        error = self._require_admin()
        if error:
            return error

        try:
            category = request.env['product.category'].sudo().browse(category_id)

            if not category.exists():
                return {
                    'success': False,
                    'error': 'Category not found'
                }

            params = self._get_params()
            update_data = {}

            if 'name' in params:
                update_data['name'] = params['name']
            if 'parent_id' in params:
                update_data['parent_id'] = int(params['parent_id']) if params['parent_id'] else False

            if update_data:
                category.write(update_data)

            return {
                'success': True,
                'category': {
                    'id': category.id,
                    'name': category.name,
                    'parent_id': category.parent_id.id if category.parent_id else None,
                }
            }

        except Exception as e:
            _logger.error(f"Update category error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/categories/<int:category_id>/delete', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def delete_category(self, category_id, **kwargs):
        """Supprimer une catégorie (ADMIN UNIQUEMENT)"""
        # SECURITE : Vérifier droits admin
        error = self._require_admin()
        if error:
            return error

        try:
            category = request.env['product.category'].sudo().browse(category_id)

            if not category.exists():
                return {
                    'success': False,
                    'error': 'Category not found'
                }

            category.unlink()

            return {'success': True}

        except Exception as e:
            _logger.error(f"Delete category error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/categories/<int:category_id>/move', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def move_category(self, category_id, **kwargs):
        """Déplacer une catégorie vers un nouveau parent (admin)"""
        try:
            # SÉCURITÉ P0: Authentification obligatoire (en attendant JWT)
            error = self._authenticate_from_header()
            if error:
                return error

            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            category = request.env['product.category'].sudo().browse(category_id)

            if not category.exists():
                return {
                    'success': False,
                    'error': 'Category not found'
                }

            params = self._get_params()
            new_parent_id = params.get('parent_id')

            # Vérifier qu'on ne crée pas de boucle (catégorie ne peut pas être son propre parent)
            if new_parent_id:
                new_parent = request.env['product.category'].sudo().browse(int(new_parent_id))
                if not new_parent.exists():
                    return {
                        'success': False,
                        'error': 'New parent category not found'
                    }
                # Vérifier qu'on ne déplace pas vers un de ses enfants
                if new_parent.id == category_id:
                    return {
                        'success': False,
                        'error': 'Category cannot be its own parent'
                    }
                # Vérifier qu'on ne crée pas de boucle dans la hiérarchie
                current = new_parent
                while current.parent_id:
                    if current.parent_id.id == category_id:
                        return {
                            'success': False,
                            'error': 'Cannot create circular reference in category hierarchy'
                        }
                    current = current.parent_id

            # Déplacer la catégorie
            category.write({
                'parent_id': int(new_parent_id) if new_parent_id else False
            })

            return {
                'success': True,
                'category': {
                    'id': category.id,
                    'name': category.name,
                    'complete_name': category.complete_name,
                    'parent_id': category.parent_id.id if category.parent_id else None,
                    'parent_name': category.parent_id.name if category.parent_id else None,
                }
            }

        except Exception as e:
            _logger.error(f"Move category error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    # ==================== SITE CONFIGURATION ====================

    @http.route('/api/ecommerce/site-config', type='http', auth='public', methods=['GET'], csrf=False, cors='*')
    def get_site_config(self, **kwargs):
        """
        Récupérer la configuration du site (fonctionnalités activées/désactivées)
        Public - utilisé par le frontend pour afficher/masquer des fonctionnalités
        """
        try:
            IrConfigParam = request.env['ir.config_parameter'].sudo()

            # Récupérer les paramètres de configuration
            config = {
                # Fonctionnalités activées/désactivées
                'compare_enabled': IrConfigParam.get_param('quelyos.feature.compare_enabled', 'true') == 'true',
                'wishlist_enabled': IrConfigParam.get_param('quelyos.feature.wishlist_enabled', 'true') == 'true',
                'reviews_enabled': IrConfigParam.get_param('quelyos.feature.reviews_enabled', 'true') == 'true',
                'newsletter_enabled': IrConfigParam.get_param('quelyos.feature.newsletter_enabled', 'true') == 'true',
                # Contact
                'whatsapp_number': IrConfigParam.get_param('quelyos.contact.whatsapp', '+21600000000'),
                'contact_email': IrConfigParam.get_param('quelyos.contact.email', 'contact@quelyos.com'),
                'contact_phone': IrConfigParam.get_param('quelyos.contact.phone', '+21600000000'),
                # Livraison
                'shipping_standard_days': IrConfigParam.get_param('quelyos.shipping.standard_days', '2-5'),
                'shipping_express_days': IrConfigParam.get_param('quelyos.shipping.express_days', '1-2'),
                'free_shipping_threshold': float(IrConfigParam.get_param('quelyos.shipping.free_threshold', '150')),
                # Retours
                'return_delay_days': int(IrConfigParam.get_param('quelyos.returns.delay_days', '30')),
                'refund_delay_days': IrConfigParam.get_param('quelyos.returns.refund_days', '7-10'),
                # Garantie
                'warranty_years': int(IrConfigParam.get_param('quelyos.warranty.years', '2')),
                # Modes de paiement acceptés
                'payment_methods': IrConfigParam.get_param('quelyos.payment.methods', 'Carte bancaire,Espèces,Virement,Mobile money').split(','),
                # Service client
                'customer_service_hours': IrConfigParam.get_param('quelyos.customer_service.hours', '9h à 18h'),
                'customer_service_days': IrConfigParam.get_param('quelyos.customer_service.days', 'lundi au vendredi'),
                # Statistiques (optionnel)
                'total_review_count': self._get_total_review_count(),
            }

            return request.make_json_response({
                'success': True,
                'data': config
            }, headers={
                'Cache-Control': 'public, max-age=300',  # Cache 5 min
                'Vary': 'Accept-Encoding'
            })

        except Exception as e:
            _logger.error(f"Get site config error: {e}")
            return request.make_json_response({
                'success': False,
                'error': 'Une erreur est survenue'
            })

    @http.route('/api/ecommerce/site-config/update', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def update_site_config(self, **kwargs):
        """
        Mettre à jour la configuration du site (ADMIN UNIQUEMENT)

        Params:
            compare_enabled (bool): Activer/désactiver la comparaison de produits
            wishlist_enabled (bool): Activer/désactiver la wishlist
            reviews_enabled (bool): Activer/désactiver les avis clients
            newsletter_enabled (bool): Activer/désactiver la newsletter
        """
        # Authentifier via le header X-Session-Id (pour les requêtes sans cookies)
        error = self._authenticate_from_header()
        if error:
            return error

        # SECURITE : Vérifier droits admin
        error = self._require_admin()
        if error:
            return error

        try:
            params = self._get_params()
            IrConfigParam = request.env['ir.config_parameter'].sudo()

            updated_params = []

            # Mettre à jour les paramètres fournis
            if 'compare_enabled' in params:
                value = 'true' if params['compare_enabled'] else 'false'
                IrConfigParam.set_param('quelyos.feature.compare_enabled', value)
                updated_params.append('compare_enabled')

            if 'wishlist_enabled' in params:
                value = 'true' if params['wishlist_enabled'] else 'false'
                IrConfigParam.set_param('quelyos.feature.wishlist_enabled', value)
                updated_params.append('wishlist_enabled')

            if 'reviews_enabled' in params:
                value = 'true' if params['reviews_enabled'] else 'false'
                IrConfigParam.set_param('quelyos.feature.reviews_enabled', value)
                updated_params.append('reviews_enabled')

            if 'newsletter_enabled' in params:
                value = 'true' if params['newsletter_enabled'] else 'false'
                IrConfigParam.set_param('quelyos.feature.newsletter_enabled', value)
                updated_params.append('newsletter_enabled')

            # Paramètres de contact
            if 'whatsapp_number' in params:
                IrConfigParam.set_param('quelyos.contact.whatsapp', str(params['whatsapp_number']))
                updated_params.append('whatsapp_number')
            if 'contact_email' in params:
                IrConfigParam.set_param('quelyos.contact.email', str(params['contact_email']))
                updated_params.append('contact_email')
            if 'contact_phone' in params:
                IrConfigParam.set_param('quelyos.contact.phone', str(params['contact_phone']))
                updated_params.append('contact_phone')

            # Paramètres de livraison
            if 'shipping_standard_days' in params:
                IrConfigParam.set_param('quelyos.shipping.standard_days', str(params['shipping_standard_days']))
                updated_params.append('shipping_standard_days')
            if 'shipping_express_days' in params:
                IrConfigParam.set_param('quelyos.shipping.express_days', str(params['shipping_express_days']))
                updated_params.append('shipping_express_days')
            if 'free_shipping_threshold' in params:
                IrConfigParam.set_param('quelyos.shipping.free_threshold', str(params['free_shipping_threshold']))
                updated_params.append('free_shipping_threshold')

            # Paramètres de retours
            if 'return_delay_days' in params:
                IrConfigParam.set_param('quelyos.returns.delay_days', str(params['return_delay_days']))
                updated_params.append('return_delay_days')
            if 'refund_delay_days' in params:
                IrConfigParam.set_param('quelyos.returns.refund_days', str(params['refund_delay_days']))
                updated_params.append('refund_delay_days')

            # Paramètres de garantie
            if 'warranty_years' in params:
                IrConfigParam.set_param('quelyos.warranty.years', str(params['warranty_years']))
                updated_params.append('warranty_years')

            # Modes de paiement
            if 'payment_methods' in params:
                methods = params['payment_methods']
                if isinstance(methods, list):
                    methods = ','.join(methods)
                IrConfigParam.set_param('quelyos.payment.methods', str(methods))
                updated_params.append('payment_methods')

            if not updated_params:
                return {
                    'success': False,
                    'error': 'Aucun paramètre à mettre à jour'
                }

            # Récupérer la configuration mise à jour
            config = {
                # Fonctionnalités activées/désactivées
                'compare_enabled': IrConfigParam.get_param('quelyos.feature.compare_enabled', 'true') == 'true',
                'wishlist_enabled': IrConfigParam.get_param('quelyos.feature.wishlist_enabled', 'true') == 'true',
                'reviews_enabled': IrConfigParam.get_param('quelyos.feature.reviews_enabled', 'true') == 'true',
                'newsletter_enabled': IrConfigParam.get_param('quelyos.feature.newsletter_enabled', 'true') == 'true',
                # Contact
                'whatsapp_number': IrConfigParam.get_param('quelyos.contact.whatsapp', '+21600000000'),
                'contact_email': IrConfigParam.get_param('quelyos.contact.email', 'contact@quelyos.com'),
                'contact_phone': IrConfigParam.get_param('quelyos.contact.phone', '+21600000000'),
                # Livraison
                'shipping_standard_days': IrConfigParam.get_param('quelyos.shipping.standard_days', '2-5'),
                'shipping_express_days': IrConfigParam.get_param('quelyos.shipping.express_days', '1-2'),
                'free_shipping_threshold': float(IrConfigParam.get_param('quelyos.shipping.free_threshold', '150')),
                # Retours
                'return_delay_days': int(IrConfigParam.get_param('quelyos.returns.delay_days', '30')),
                'refund_delay_days': IrConfigParam.get_param('quelyos.returns.refund_days', '7-10'),
                # Garantie
                'warranty_years': int(IrConfigParam.get_param('quelyos.warranty.years', '2')),
                # Modes de paiement
                'payment_methods': IrConfigParam.get_param('quelyos.payment.methods', 'card,cash,transfer,mobile').split(','),
            }

            return {
                'success': True,
                'data': config,
                'message': f"Configuration mise à jour : {', '.join(updated_params)}"
            }

        except Exception as e:
            _logger.error(f"Update site config error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }


    @http.route('/api/ecommerce/user/purchased-products', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def get_user_purchased_products(self, **kwargs):
        """
        Récupérer la liste des IDs produits déjà achetés par l'utilisateur connecté
        """
        try:
            user = request.env.user
            if not user or user._is_public():
                return {'success': True, 'data': {'product_ids': []}}

            partner = user.partner_id
            if not partner:
                return {'success': True, 'data': {'product_ids': []}}

            # Récupérer tous les produits des commandes confirmées
            SaleOrder = request.env['sale.order'].sudo()
            orders = SaleOrder.search([
                ('partner_id', '=', partner.id),
                ('state', 'in', ['sale', 'done'])
            ])

            product_ids = set()
            for order in orders:
                for line in order.order_line:
                    if line.product_id and line.product_id.product_tmpl_id:
                        product_ids.add(line.product_id.product_tmpl_id.id)

            return {
                'success': True,
                'data': {
                    'product_ids': list(product_ids)
                }
            }
        except Exception as e:
            _logger.error(f"Get user purchased products error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }
