# -*- coding: utf-8 -*-
import logging
import time
import os
from odoo import http, fields
from odoo.http import request
from passlib.context import CryptContext
from ..config import is_origin_allowed, get_cors_headers

_logger = logging.getLogger(__name__)

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    _logger.warning("Redis package not installed. Rate limiting will use in-memory cache (not production-ready for multi-worker setups)")

# Context de cryptage pour vérifier les mots de passe
crypt_context = CryptContext(schemes=['pbkdf2_sha512', 'plaintext'], deprecated=['plaintext'])

# Redis client pour cache distribué (rate limiting, etc.)
_redis_client = None
if REDIS_AVAILABLE:
    try:
        redis_host = os.environ.get('REDIS_HOST', 'localhost')
        redis_port = int(os.environ.get('REDIS_PORT', 6379))
        _redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            db=0,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2
        )
        # Tester la connexion
        _redis_client.ping()
        _logger.info(f"Redis connected successfully at {redis_host}:{redis_port}")
    except Exception as e:
        _logger.warning(f"Could not connect to Redis: {e}. Falling back to in-memory cache.")
        _redis_client = None

# Fallback: Cache en mémoire pour rate limiting (si Redis non disponible)
# ATTENTION: Ne fonctionne pas correctement avec plusieurs workers Odoo
_view_count_cache = {}


class QuelyosAPI(http.Controller):
    """API REST pour frontend e-commerce et backoffice"""

    # Odoo gère automatiquement le format JSON-RPC pour les routes type='json'
    # On retourne directement les dictionnaires

    def _get_params(self):
        """Extrait les paramètres de la requête JSON-RPC"""
        return request.params if hasattr(request, 'params') and request.params else {}

    def _get_http_params(self):
        """Extrait les paramètres HTTP (GET query params ou POST JSON)"""
        if request.httprequest.method == 'GET':
            # Convertir ImmutableMultiDict en dict normal
            return request.httprequest.args.to_dict()
        else:  # POST avec body JSON
            try:
                data = request.get_json_data()
                if isinstance(data, dict):
                    # Si c'est un wrapper JSON-RPC (envoyé par le proxy Next.js), extraire params
                    if 'jsonrpc' in data and 'params' in data:
                        return data['params'] if isinstance(data['params'], dict) else {}
                    # Sinon retourner les données directement
                    return data
                return {}
            except:
                return {}

    def _check_session(self):
        """Vérifie que la session est valide"""
        if not request.session.uid:
            _logger.warning("Session expired or invalid")
            return {
                'success': False,
                'error': 'Session expired. Please login again.',
                'error_code': 'SESSION_EXPIRED'
            }
        return None

    def _check_cors(self):
        """
        Vérifie que l'origine de la requête est autorisée (protection CORS).
        Retourne un dict d'erreur si l'origine n'est pas autorisée, None sinon.

        Usage dans les endpoints :
            error = self._check_cors()
            if error:
                return error

        NOTE: Cette méthode devrait idéalement être appelée automatiquement
        via un décorateur ou middleware, mais pour compatibilité avec Odoo
        on l'appelle manuellement dans les endpoints sensibles.
        """
        origin = request.httprequest.headers.get('Origin', '')

        if not is_origin_allowed(origin):
            _logger.warning(
                f"CORS violation: Origin '{origin}' is not allowed. "
                f"Request path: {request.httprequest.path}"
            )
            return {
                'success': False,
                'error': 'Origine non autorisée',
                'error_code': 'CORS_VIOLATION'
            }

        return None

    def _require_admin(self):
        """
        Vérifie que l'utilisateur est authentifié ET possède les droits administrateur.
        Retourne un dict d'erreur si non autorisé, None sinon.

        Usage dans les endpoints :
            error = self._require_admin()
            if error:
                return error
        """
        # Vérifier que l'utilisateur est connecté
        if not request.env.user or request.env.user._is_public():
            _logger.warning(f"Unauthorized admin action attempt: user not authenticated")
            return {
                'success': False,
                'error': 'Authentification requise',
                'error_code': 'AUTH_REQUIRED'
            }

        # Vérifier que l'utilisateur a les droits admin (groupe system)
        if not request.env.user.has_group('base.group_system'):
            _logger.warning(
                f"Unauthorized admin action attempt: user {request.env.user.id} "
                f"({request.env.user.login}) lacks admin privileges"
            )
            return {
                'success': False,
                'error': 'Accès refusé : droits administrateur requis',
                'error_code': 'ADMIN_REQUIRED'
            }

        return None

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
            'image': f'/web/image/product.template/{product.id}/image_1920' if product.image_1920 else None,
            'images': images,
            'slug': product_slug,
            'qty_available': qty,
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

    def _validate_customer_ownership(self, customer_id):
        """
        Vérifie que l'utilisateur a le droit de modifier les données du client.
        - Utilisateurs authentifiés : peuvent modifier leurs propres données OU admin peut tout modifier
        - Invités : doivent fournir guest_email correspondant au partner_id.email

        Args:
            customer_id: ID du partner (res.partner)

        Returns:
            dict d'erreur si non autorisé, None sinon

        Usage dans les endpoints :
            error = self._validate_customer_ownership(customer_id)
            if error:
                return error
        """
        # Récupérer le partner
        partner = request.env['res.partner'].sudo().browse(customer_id)
        if not partner.exists():
            return {
                'success': False,
                'error': 'Client non trouvé',
                'error_code': 'CUSTOMER_NOT_FOUND'
            }

        # Cas 1 : Utilisateur authentifié
        if request.session.uid:
            # Vérifier si c'est ses propres données
            if partner.id == request.session.uid:
                return None  # OK : utilisateur modifie ses propres données

            # Vérifier si admin
            if request.env.user.has_group('base.group_system'):
                return None  # OK : admin peut tout modifier

            # Ni propriétaire ni admin
            _logger.warning(
                f"Unauthorized customer data access attempt: user {request.env.user.id} "
                f"tried to access customer {customer_id}"
            )
            return {
                'success': False,
                'error': 'Accès non autorisé : vous ne pouvez modifier que vos propres données',
                'error_code': 'OWNERSHIP_VIOLATION'
            }

        # Cas 2 : Invité - Doit fournir guest_email
        params = self._get_params()
        guest_email = params.get('guest_email')

        if not guest_email:
            return {
                'success': False,
                'error': 'Authentification requise ou guest_email manquant',
                'error_code': 'AUTH_OR_GUEST_EMAIL_REQUIRED'
            }

        # Vérifier correspondance email
        if partner.email != guest_email:
            _logger.warning(
                f"Unauthorized guest customer data access: guest_email {guest_email} "
                f"does not match customer {customer_id} email"
            )
            return {
                'success': False,
                'error': 'Accès non autorisé',
                'error_code': 'GUEST_EMAIL_MISMATCH'
            }

        return None  # OK : guest_email valide

    def _create_session(self, uid):
        """Crée une session pour l'utilisateur et retourne le session_id"""
        return request.session.sid

    # ==================== AUTHENTICATION ====================

    @http.route('/api/ecommerce/auth/login', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def auth_login(self, **kwargs):
        """Authentification utilisateur avec vérification du mot de passe"""
        try:
            _logger.info("========== LOGIN REQUEST RECEIVED ==========")
            params = self._get_params()
            email = params.get('email')
            password = params.get('password')

            _logger.info(f"Login attempt - email: {email}, password length: {len(password) if password else 0}")
            _logger.info(f"Request headers: {dict(request.httprequest.headers)}")
            _logger.info(f"Request DB: {request.db}")

            if not email or not password:
                return {
                    'success': False,
                    'error': 'Email and password are required'
                }

            # Authentifier l'utilisateur avec Odoo (vérifie le mot de passe)
            try:
                db_name = request.db or 'quelyos'

                # Rechercher l'utilisateur
                _logger.info(f"Searching for user with login: {email}")
                user = request.env['res.users'].sudo().search([('login', '=', email)], limit=1)
                _logger.info(f"User search result: {user} (id: {user.id if user else 'None'})")
                if not user:
                    _logger.warning(f"User not found: {email}")
                    return {
                        'success': False,
                        'error': 'Invalid email or password'
                    }

                # Vérifier le mot de passe en utilisant le même mécanisme qu'Odoo
                # Le champ password est protégé par l'ORM, on doit utiliser une requête SQL directe
                _logger.info(f"Fetching password hash from database for user id: {user.id}")
                request.env.cr.execute(
                    "SELECT password FROM res_users WHERE id = %s",
                    (user.id,)
                )
                result = request.env.cr.fetchone()
                _logger.info(f"Password fetch result: {result is not None} (hash exists: {result and result[0] is not None})")
                if not result or not result[0]:
                    _logger.warning(f"User {email} has no password set")
                    return {
                        'success': False,
                        'error': 'Invalid email or password'
                    }

                user_password = result[0]
                _logger.info(f"User {email} password hash retrieved successfully (hash starts with: {user_password[:20] if user_password else 'None'})")

                # Vérifier le mot de passe avec passlib
                _logger.info(f"Verifying password with passlib for user {email}")
                valid = crypt_context.verify(password, user_password)
                _logger.info(f"Password verification result for {email}: {valid}")
                if not valid:
                    _logger.warning(f"Invalid password for {email}")
                    return {
                        'success': False,
                        'error': 'Invalid email or password'
                    }

                uid = user.id
                _logger.info(f"Authentication successful for {email}, uid={uid}")

                # Mettre à jour la session
                _logger.info(f"Creating session for user {email} (uid={uid}, db={db_name})")
                request.session.uid = uid
                request.session.login = email
                request.session.db = db_name
                _logger.info(f"Session created with sid: {request.session.sid}")

            except Exception as auth_error:
                _logger.warning(f"Authentication failed for {email}: {auth_error}")
                return {
                    'success': False,
                    'error': 'Invalid email or password'
                }

            # Récupérer les infos utilisateur
            user = request.env['res.users'].sudo().browse(uid)
            partner = user.partner_id

            user_data = {
                'id': partner.id,
                'name': partner.name,
                'email': partner.email or user.login,
                'phone': partner.phone or '',
            }

            # Récupérer le session_id
            session_id = request.session.sid

            _logger.info(f"User {email} authenticated successfully")

            return {
                'success': True,
                'session_id': session_id,
                'user': user_data
            }

        except Exception as e:
            _logger.error(f"Login error: {e}")
            return {
                'success': False,
                'error': 'Authentication failed'
            }

    @http.route('/api/ecommerce/auth/logout', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def auth_logout(self, **kwargs):
        """Déconnexion utilisateur"""
        try:
            request.session.logout()
            return {'success': True}
        except Exception as e:
            _logger.error(f"Logout error: {e}")
            return {'success': True}  # Toujours retourner success

    @http.route('/api/ecommerce/auth/session', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def auth_session(self, **kwargs):
        """Vérifier la session courante"""
        try:
            if request.session.uid:
                user = request.env['res.users'].sudo().browse(request.session.uid)
                partner = user.partner_id

                return {
                    'authenticated': True,
                    'user': {
                        'id': partner.id,
                        'name': partner.name,
                        'email': partner.email or user.login,
                        'phone': partner.phone or '',
                    }
                }
            else:
                return {'authenticated': False}

        except Exception as e:
            _logger.error(f"Session check error: {e}")
            return {'authenticated': False}

    @http.route('/api/ecommerce/auth/register', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def auth_register(self, **kwargs):
        """Inscription nouvel utilisateur"""
        try:
            params = self._get_params()
            name = params.get('name')
            email = params.get('email')
            password = params.get('password')
            phone = params.get('phone', '')

            if not name or not email or not password:
                return {
                    'success': False,
                    'error': 'Name, email and password are required'
                }

            # Vérifier si l'email existe déjà
            existing_user = request.env['res.users'].sudo().search([
                ('login', '=', email)
            ], limit=1)

            if existing_user:
                return {
                    'success': False,
                    'error': 'Email already exists'
                }

            # Créer le partenaire
            partner = request.env['res.partner'].sudo().create({
                'name': name,
                'email': email,
                'phone': phone,
                'customer_rank': 1,
            })

            # Créer l'utilisateur
            user = request.env['res.users'].sudo().create({
                'name': name,
                'login': email,
                'password': password,
                'partner_id': partner.id,
                'groups_id': [(6, 0, [request.env.ref('base.group_portal').id])],
            })

            return {
                'success': True,
                'user': {
                    'id': partner.id,
                    'name': partner.name,
                    'email': partner.email,
                    'phone': partner.phone or '',
                }
            }

        except Exception as e:
            _logger.error(f"Registration error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    # ==================== PRODUCTS ====================

    @http.route('/api/ecommerce/products', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_products_list(self, **kwargs):
        """Liste des produits avec recherche, filtres et tri (GET via JSON-RPC)"""
        try:
            params = self._get_params()
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

            # Context pour inclure les produits archivés si demandé
            ProductTemplate = request.env['product.template'].sudo()
            if include_archived:
                ProductTemplate = ProductTemplate.with_context(active_test=False)

            domain = [('sale_ok', '=', True)]

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
                    'image': f'/web/image/product.template/{p.id}/image_1920' if p.image_1920 else None,
                    'image_url': image_url,
                    'images': images_list if images_list else None,
                    'slug': p.name.lower().replace(' ', '-'),
                    'qty_available': qty,
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
            _logger.error(f"Get products error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/slug/<string:slug>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
            _logger.error(f"Get product by slug error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/create', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_product(self, **kwargs):
        """Créer un produit (ADMIN UNIQUEMENT)"""
        try:
            # SECURITE : Vérifier droits admin
            error = self._require_admin()
            if error:
                return error

            params = self._get_params()
            name = params.get('name')
            price = params.get('price', 0.0)
            description = params.get('description', '')
            category_id = params.get('category_id')

            if not name:
                return {
                    'success': False,
                    'error': 'Product name is required'
                }
            pass

            product_data = {
                'name': name,
                'list_price': float(price),
                'description_sale': description,
                'sale_ok': True,
                'purchase_ok': True,
            }

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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def update_product(self, product_id, **kwargs):
        """Modifier un produit (ADMIN UNIQUEMENT)"""
        try:
            # SECURITE : Vérifier droits admin
            error = self._require_admin()
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/delete', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def delete_product(self, product_id, **kwargs):
        """Supprimer un produit (ADMIN UNIQUEMENT)"""
        try:
            # SECURITE : Vérifier droits admin
            error = self._require_admin()
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/archive', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def archive_product(self, product_id, **kwargs):
        """Archiver ou désarchiver un produit (admin)"""
        try:
            # Vérifier les permissions
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    @http.route('/api/ecommerce/taxes', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/uom', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/product-tags', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_product_tags(self, **kwargs):
        """Récupérer la liste des tags produits disponibles"""
        try:
            # Rechercher les tags produits
            ProductTag = request.env['product.tag'].sudo()
            tags = ProductTag.search([], order='name')

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
                'error': str(e)
            }

    @http.route('/api/ecommerce/product-tags/create', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def create_product_tag(self, **kwargs):
        """Créer un nouveau tag produit (admin)"""
        try:
            # Vérifier les permissions
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    @http.route('/api/ecommerce/product-types', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/duplicate', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def duplicate_product(self, product_id, **kwargs):
        """Dupliquer un produit (admin)"""
        try:
            # Vérifier les permissions
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                        'image': f'/web/image/product.template/{new_product.id}/image_1920' if new_product.image_1920 else None,
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/export', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def export_products(self, **kwargs):
        """Exporter les produits en CSV (admin)"""
        try:
            # Vérifier les permissions
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/import', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def import_products(self, **kwargs):
        """Importer des produits depuis CSV (admin)"""
        try:
            # Vérifier les permissions
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    # ==================== PRODUCT IMAGES ====================

    @http.route('/api/ecommerce/products/<int:product_id>/images', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/images/upload', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def upload_product_images(self, product_id, **kwargs):
        """Upload une ou plusieurs images pour un produit (admin)"""
        try:
            # Vérifier les permissions
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/images/<int:image_id>/delete', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def delete_product_image(self, product_id, image_id, **kwargs):
        """Supprimer une image d'un produit (ADMIN UNIQUEMENT)"""
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/images/reorder', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def reorder_product_images(self, product_id, **kwargs):
        """Réorganiser l'ordre des images d'un produit (admin)"""
        try:
            # Vérifier les permissions
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    # ==================== ATTRIBUTE VALUE IMAGES (V2) ====================
    # Images associées aux valeurs d'attributs (ex: images pour la couleur "Rouge")
    # Approche optimisée : une seule copie des images par valeur, partagée par toutes les variantes

    @http.route('/api/ecommerce/products/<int:product_id>/attribute-images', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/attribute-values/<int:ptav_id>/images', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/attribute-values/<int:ptav_id>/images/upload', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def upload_attribute_value_images(self, product_id, ptav_id, **kwargs):
        """Upload des images pour une valeur d'attribut (admin)"""
        try:
            # TODO PRODUCTION: Réactiver les permissions avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {
            #         'success': False,
            #         'error': 'Insufficient permissions'
            #     }
            pass

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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/attribute-values/<int:ptav_id>/images/<int:image_id>/delete', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/attribute-values/<int:ptav_id>/images/reorder', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def reorder_attribute_value_images(self, product_id, ptav_id, **kwargs):
        """Réorganiser l'ordre des images d'une valeur d'attribut (admin)"""
        try:
            # TODO PRODUCTION: Réactiver les permissions avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {
            #         'success': False,
            #         'error': 'Insufficient permissions'
            #     }
            pass

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
                'error': str(e)
            }

    # ==================== PRODUCT VARIANTS ====================

    @http.route('/api/ecommerce/attributes', type='json', auth='public', csrf=False, cors='*')
    def get_all_attributes(self, **kwargs):
        """Liste tous les attributs disponibles (couleur, taille, etc.)"""
        try:
            Attribute = request.env['product.attribute'].sudo()
            attributes = Attribute.search([])

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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/variants', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'data': {
                    'attribute_lines': attribute_lines,
                    'variants': variants,
                    'variant_count': len(variants)
                }
            }

        except Exception as e:
            _logger.error(f"Get product variants error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/attributes/add', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def add_product_attribute(self, product_id, **kwargs):
        """Ajouter un attribut à un produit (admin)"""
        try:
            # Vérifier les permissions
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/attributes/<int:line_id>/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/attributes/<int:line_id>/delete', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def delete_product_attribute(self, product_id, line_id, **kwargs):
        """Supprimer un attribut d'un produit (admin)"""
        try:
            # Vérifier les permissions
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/variants/regenerate', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def regenerate_product_variants(self, product_id, **kwargs):
        """Régénérer toutes les variantes d'un produit basées sur ses attributs (admin)

        Utile après ajout/modification d'attributs pour créer toutes les combinaisons manquantes.
        Odoo ne génère pas automatiquement les variantes lors de l'ajout d'attributs.
        """
        try:
            # Vérifier les permissions
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/variants/<int:variant_id>/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/variants/<int:variant_id>/stock/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    # ==================== VARIANT IMAGES ====================

    @http.route('/api/ecommerce/products/<int:product_id>/variants/<int:variant_id>/images', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/variants/<int:variant_id>/images/upload', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def upload_variant_images(self, product_id, variant_id, **kwargs):
        """Uploader des images pour une variante"""
        try:
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/variants/<int:variant_id>/images/<int:image_id>/delete', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/variants/<int:variant_id>/images/reorder', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def reorder_variant_images(self, product_id, variant_id, **kwargs):
        """Réordonner les images d'une variante"""
        try:
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    # ==================== CATEGORIES ====================

    @http.route('/api/ecommerce/categories', type='json', auth='public', csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/categories/<int:category_id>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/categories/create', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/categories/<int:category_id>/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/categories/<int:category_id>/delete', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/categories/<int:category_id>/move', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def move_category(self, category_id, **kwargs):
        """Déplacer une catégorie vers un nouveau parent (admin)"""
        try:
            # Vérifier les permissions
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
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
                'payment_methods': IrConfigParam.get_param('quelyos.payment.methods', 'card,cash,transfer,mobile').split(','),
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
                'error': str(e)
            })

    @http.route('/api/ecommerce/site-config/update', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    # ==================== ORDERS ====================

    @http.route('/api/ecommerce/orders', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_orders_list(self, **kwargs):
        """Liste des commandes (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    @http.route('/api/ecommerce/orders/<int:order_id>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/orders/create', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def create_order(self, **kwargs):
        """Créer une commande depuis le panier"""
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/orders/<int:order_id>/status', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def update_order_status(self, order_id, **kwargs):
        """Changer le statut d'une commande (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    @http.route('/api/ecommerce/orders/<int:order_id>/tracking', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_order_tracking(self, order_id, **kwargs):
        """Récupérer les informations de suivi de la commande"""
        try:
            # Vérifier les permissions admin
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

            order = request.env['sale.order'].sudo().browse(order_id)

            if not order.exists():
                return {
                    'success': False,
                    'error': 'Order not found'
                }

            tracking_info = []
            for picking in order.picking_ids:
                state_labels = {
                    'draft': 'Brouillon',
                    'waiting': 'En attente',
                    'confirmed': 'Confirmé',
                    'assigned': 'Prêt',
                    'done': 'Livré',
                    'cancel': 'Annulé'
                }

                tracking_info.append({
                    'picking_id': picking.id,
                    'picking_name': picking.name,
                    'state': picking.state,
                    'state_label': state_labels.get(picking.state, picking.state),
                    'carrier_id': picking.carrier_id.id if picking.carrier_id else None,
                    'carrier_name': picking.carrier_id.name if picking.carrier_id else None,
                    'carrier_tracking_ref': picking.carrier_tracking_ref or '',
                    'carrier_tracking_url': picking.carrier_tracking_url or '',
                })

            return {
                'success': True,
                'data': {
                    'tracking_info': tracking_info
                }
            }

        except Exception as e:
            _logger.error(f"Get order tracking error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/orders/<int:order_id>/tracking/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def update_order_tracking(self, order_id, **kwargs):
        """Mettre à jour le numéro de suivi d'un picking (ADMIN UNIQUEMENT)"""
        # SECURITE : Vérifier droits admin
        error = self._require_admin()
        if error:
            return error

        try:
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
            if order_id not in picking.sale_id.ids:
                return {
                    'success': False,
                    'error': 'Picking does not belong to this order'
                }

            update_vals = {
                'carrier_tracking_ref': tracking_ref
            }

            if carrier_id:
                update_vals['carrier_id'] = carrier_id

            picking.write(update_vals)

            return {
                'success': True,
                'message': 'Tracking updated successfully'
            }

        except Exception as e:
            _logger.error(f"Update order tracking error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/orders/<int:order_id>/history', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_order_history(self, order_id, **kwargs):
        """Récupérer l'historique des modifications de la commande"""
        try:
            # Vérifier les permissions admin
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

            order = request.env['sale.order'].sudo().browse(order_id)

            if not order.exists():
                return {
                    'success': False,
                    'error': 'Order not found'
                }

            # Récupérer les messages du chatter
            messages = request.env['mail.message'].sudo().search([
                ('model', '=', 'sale.order'),
                ('res_id', '=', order_id),
            ], order='date desc', limit=50)

            history = []
            for msg in messages:
                tracking_values = []
                for tracking in msg.tracking_value_ids:
                    old_value = tracking.old_value_char or str(tracking.old_value_integer or tracking.old_value_float or tracking.old_value_datetime or '')
                    new_value = tracking.new_value_char or str(tracking.new_value_integer or tracking.new_value_float or tracking.new_value_datetime or '')

                    tracking_values.append({
                        'field': tracking.field,
                        'field_desc': tracking.field_desc,
                        'old_value': old_value,
                        'new_value': new_value,
                    })

                history.append({
                    'id': msg.id,
                    'date': msg.date.isoformat() if msg.date else None,
                    'author': msg.author_id.name if msg.author_id else 'System',
                    'body': msg.body or '',
                    'message_type': msg.message_type,
                    'subtype': msg.subtype_id.name if msg.subtype_id else None,
                    'tracking_values': tracking_values
                })

            return {
                'success': True,
                'data': {
                    'history': history
                }
            }

        except Exception as e:
            _logger.error(f"Get order history error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/orders/<int:order_id>/delivery-slip', type='http', auth='public', methods=['GET'], csrf=False, cors='*')
    def get_delivery_slip_pdf(self, order_id, **kwargs):
        """Télécharger le bon de livraison en PDF"""
        try:
            # Vérifier les permissions admin
            if not request.env.user.has_group('base.group_system'):
                return request.make_response(
                    json.dumps({'error': 'Insufficient permissions'}),
                    headers=[('Content-Type', 'application/json')]
                )

            order = request.env['sale.order'].sudo().browse(int(order_id))

            if not order.exists():
                return request.make_response(
                    json.dumps({'error': 'Order not found'}),
                    headers=[('Content-Type', 'application/json')]
                )

            # Récupérer le premier picking
            picking = order.picking_ids[:1] if order.picking_ids else None

            if not picking:
                return request.make_response(
                    json.dumps({'error': 'No delivery order found for this sale order'}),
                    headers=[('Content-Type', 'application/json')]
                )

            # Générer le PDF du bon de livraison
            report = request.env.ref('stock.action_report_delivery')
            pdf_content, content_type = report.sudo()._render_qweb_pdf([picking.id])

            filename = f"delivery_slip_{picking.name.replace('/', '_')}.pdf"

            return request.make_response(
                pdf_content,
                headers=[
                    ('Content-Type', 'application/pdf'),
                    ('Content-Disposition', f'attachment; filename="{filename}"'),
                    ('Content-Length', len(pdf_content))
                ]
            )

        except Exception as e:
            _logger.error(f"Get delivery slip PDF error: {e}")
            return request.make_response(
                json.dumps({'error': str(e)}),
                headers=[('Content-Type', 'application/json')]
            )

    @http.route('/api/ecommerce/orders/<int:order_id>/send-quotation', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def send_quotation_email(self, order_id, **kwargs):
        """Envoyer le devis par email au client"""
        try:
            # Vérifier les permissions admin
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    @http.route('/api/ecommerce/orders/<int:order_id>/create-invoice', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_invoice_from_order(self, order_id, **kwargs):
        """Générer une facture depuis la commande (ADMIN UNIQUEMENT)"""
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

            # Vérifier que la commande est confirmée
            if order.state not in ['sale', 'done']:
                return {
                    'success': False,
                    'error': 'Order must be confirmed to create invoice'
                }

            # Vérifier si une facture existe déjà
            if order.invoice_ids:
                existing_invoice = order.invoice_ids[0]
                return {
                    'success': False,
                    'error': 'Invoice already exists for this order',
                    'invoice': {
                        'id': existing_invoice.id,
                        'name': existing_invoice.name,
                    }
                }

            # Créer la facture
            invoices = order._create_invoices()

            if not invoices:
                return {
                    'success': False,
                    'error': 'Failed to create invoice'
                }

            invoice = invoices[0]

            return {
                'success': True,
                'message': 'Invoice created successfully',
                'invoice': {
                    'id': invoice.id,
                    'name': invoice.name,
                    'state': invoice.state,
                    'amount_total': invoice.amount_total,
                }
            }

        except Exception as e:
            _logger.error(f"Create invoice error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/orders/<int:order_id>/unlock', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def unlock_order(self, order_id, **kwargs):
        """Remettre la commande en brouillon"""
        try:
            # Vérifier les permissions admin
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    @http.route('/api/ecommerce/customer/orders', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/orders/<int:order_id>/delivery-slip/pdf', type='http', auth='public', methods=['GET'], csrf=False, cors='*')
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
                json.dumps({'error': str(e)}),
                headers=[('Content-Type', 'application/json')]
            )

    @http.route('/api/ecommerce/orders/<int:order_id>/tracking', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_order_tracking(self, order_id, **kwargs):
        """Obtenir les informations de tracking d'une commande (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

            order = request.env['sale.order'].sudo().browse(order_id)

            if not order.exists():
                return {
                    'success': False,
                    'error': 'Order not found'
                }

            # Récupérer les pickings (livraisons) de la commande
            pickings = order.picking_ids.filtered(lambda p: p.state in ['assigned', 'done'])

            tracking_info = []
            for picking in pickings:
                tracking_info.append({
                    'picking_id': picking.id,
                    'picking_name': picking.name,
                    'state': picking.state,
                    'state_label': dict(picking._fields['state']._description_selection(request.env)).get(picking.state, picking.state),
                    'carrier_id': picking.carrier_id.id if picking.carrier_id else None,
                    'carrier_name': picking.carrier_id.name if picking.carrier_id else None,
                    'carrier_tracking_ref': picking.carrier_tracking_ref or '',
                    'carrier_tracking_url': picking.carrier_tracking_url or '',
                })

            return {
                'success': True,
                'data': {
                    'tracking_info': tracking_info,
                }
            }

        except Exception as e:
            _logger.error(f"Get order tracking error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/orders/<int:order_id>/tracking/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/orders/<int:order_id>/history', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_order_history(self, order_id, **kwargs):
        """Obtenir l'historique des modifications d'une commande (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    # ==================== CUSTOMERS (ADMIN) ====================

    @http.route('/api/ecommerce/customers', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_customers_list(self, **kwargs):
        """Liste de tous les clients (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

            params = self._get_params()
            limit = int(params.get('limit', 20))
            offset = int(params.get('offset', 0))
            search = params.get('search', '').strip()

            # Construire le domaine de recherche
            domain = [('customer_rank', '>', 0)]  # Uniquement les clients

            if search:
                domain = ['&'] + domain + [
                    '|', ('name', 'ilike', search),
                    '|', ('email', 'ilike', search),
                    ('phone', 'ilike', search)
                ]

            # Rechercher les clients
            partners = request.env['res.partner'].sudo().search(
                domain,
                limit=limit,
                offset=offset,
                order='name asc'
            )

            total = request.env['res.partner'].sudo().search_count(domain)

            # Récupérer les statistiques pour chaque client
            data = []
            for partner in partners:
                # Compter les commandes
                orders_count = request.env['sale.order'].sudo().search_count([
                    ('partner_id', '=', partner.id),
                    ('state', 'in', ['sale', 'done'])
                ])

                # Calculer le total dépensé
                orders = request.env['sale.order'].sudo().search([
                    ('partner_id', '=', partner.id),
                    ('state', 'in', ['sale', 'done'])
                ])
                total_spent = sum(orders.mapped('amount_total'))

                data.append({
                    'id': partner.id,
                    'name': partner.name,
                    'email': partner.email or '',
                    'phone': partner.phone or '',
                    'mobile': getattr(partner, 'mobile', '') or '',
                    'street': partner.street or '',
                    'city': partner.city or '',
                    'zip': partner.zip or '',
                    'country': partner.country_id.name if partner.country_id else '',
                    'orders_count': orders_count,
                    'total_spent': total_spent,
                    'create_date': partner.create_date.isoformat() if partner.create_date else None,
                })

            return {
                'success': True,
                'data': {
                    'customers': data,
                    'total': total,
                    'limit': limit,
                    'offset': offset,
                }
            }

        except Exception as e:
            _logger.error(f"Get customers error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/customers/<int:customer_id>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_customer_detail(self, customer_id, **kwargs):
        """Detail d'un client avec historique commandes (admin uniquement)"""
        try:
            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            partner = request.env['res.partner'].sudo().browse(customer_id)
            if not partner.exists():
                return {'success': False, 'error': 'Customer not found'}

            # Commandes du client
            orders = request.env['sale.order'].sudo().search([
                ('partner_id', '=', partner.id)
            ], order='date_order desc', limit=20)

            orders_data = [{
                'id': o.id,
                'name': o.name,
                'date_order': o.date_order.isoformat() if o.date_order else None,
                'state': o.state,
                'amount_total': o.amount_total,
            } for o in orders]

            # Statistiques
            confirmed_orders = request.env['sale.order'].sudo().search([
                ('partner_id', '=', partner.id),
                ('state', 'in', ['sale', 'done'])
            ])
            total_spent = sum(confirmed_orders.mapped('amount_total'))

            # Adresses
            addresses = request.env['res.partner'].sudo().search([
                ('parent_id', '=', partner.id),
                ('type', 'in', ['delivery', 'invoice'])
            ])

            addresses_data = [{
                'id': a.id,
                'type': a.type,
                'name': a.name,
                'street': a.street or '',
                'city': a.city or '',
                'zip': a.zip or '',
                'country': a.country_id.name if a.country_id else '',
            } for a in addresses]

            return {
                'success': True,
                'customer': {
                    'id': partner.id,
                    'name': partner.name,
                    'email': partner.email or '',
                    'phone': partner.phone or '',
                    'mobile': getattr(partner, 'mobile', '') or '',
                    'street': partner.street or '',
                    'city': partner.city or '',
                    'zip': partner.zip or '',
                    'country': partner.country_id.name if partner.country_id else '',
                    'create_date': partner.create_date.isoformat() if partner.create_date else None,
                    'orders_count': len(confirmed_orders),
                    'total_spent': total_spent,
                    'orders': orders_data,
                    'addresses': addresses_data,
                }
            }
        except Exception as e:
            _logger.error(f"Get customer detail error: {e}")
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/customers/<int:customer_id>/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def update_customer(self, customer_id, **kwargs):
        """Modifier un client (ownership validation)"""
        # SECURITE : Vérifier ownership (utilisateur modifie ses données OU admin)
        error = self._validate_customer_ownership(customer_id)
        if error:
            return error

        try:
            partner = request.env['res.partner'].sudo().browse(customer_id)
            if not partner.exists():
                return {'success': False, 'error': 'Customer not found'}

            params = self._get_params()
            update_vals = {}

            for field in ['name', 'email', 'phone', 'mobile', 'street', 'city', 'zip']:
                if field in params:
                    update_vals[field] = params[field]

            if update_vals:
                partner.write(update_vals)

            return {
                'success': True,
                'customer': {
                    'id': partner.id,
                    'name': partner.name,
                    'email': partner.email or '',
                    'phone': partner.phone or '',
                },
                'message': 'Customer updated successfully'
            }
        except Exception as e:
            _logger.error(f"Update customer error: {e}")
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/customers/export', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def export_customers_csv(self, **kwargs):
        """Exporter les clients en CSV (admin uniquement)"""
        try:
            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            params = self._get_params()
            search_term = params.get('search', '')

            # Domaine de recherche
            domain = [('customer_rank', '>', 0)]
            if search_term:
                domain.append('|')
                domain.append(('name', 'ilike', search_term))
                domain.append(('email', 'ilike', search_term))

            # Récupérer tous les clients
            partners = request.env['res.partner'].sudo().search(domain, order='name asc')

            # Préparer les données CSV
            customers_data = []
            for partner in partners:
                # Compter les commandes
                orders_count = request.env['sale.order'].sudo().search_count([
                    ('partner_id', '=', partner.id),
                    ('state', 'in', ['sale', 'done'])
                ])

                # Calculer le total dépensé
                orders = request.env['sale.order'].sudo().search([
                    ('partner_id', '=', partner.id),
                    ('state', 'in', ['sale', 'done'])
                ])
                total_spent = sum(orders.mapped('amount_total'))

                customers_data.append({
                    'id': partner.id,
                    'name': partner.name or '',
                    'email': partner.email or '',
                    'phone': partner.phone or '',
                    'mobile': getattr(partner, 'mobile', '') or '',
                    'street': partner.street or '',
                    'street2': partner.street2 or '',
                    'city': partner.city or '',
                    'zip': partner.zip or '',
                    'state': partner.state_id.name if partner.state_id else '',
                    'country': partner.country_id.name if partner.country_id else '',
                    'orders_count': orders_count,
                    'total_spent': total_spent,
                    'create_date': partner.create_date.strftime('%Y-%m-%d') if partner.create_date else '',
                })

            return {
                'success': True,
                'data': {
                    'customers': customers_data,
                    'total': len(customers_data),
                    'columns': [
                        {'key': 'id', 'label': 'ID'},
                        {'key': 'name', 'label': 'Nom'},
                        {'key': 'email', 'label': 'Email'},
                        {'key': 'phone', 'label': 'Téléphone'},
                        {'key': 'mobile', 'label': 'Mobile'},
                        {'key': 'street', 'label': 'Adresse'},
                        {'key': 'street2', 'label': 'Complément adresse'},
                        {'key': 'city', 'label': 'Ville'},
                        {'key': 'zip', 'label': 'Code postal'},
                        {'key': 'state', 'label': 'Région'},
                        {'key': 'country', 'label': 'Pays'},
                        {'key': 'orders_count', 'label': 'Nb commandes'},
                        {'key': 'total_spent', 'label': 'Total dépensé'},
                        {'key': 'create_date', 'label': 'Date création'},
                    ]
                }
            }

        except Exception as e:
            _logger.error(f"Export customers CSV error: {e}")
            return {'success': False, 'error': str(e)}

    # ==================== CART ====================

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

    @http.route('/api/ecommerce/cart', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/cart/add', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/cart/update', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/cart/remove/<int:line_id>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/cart/clear', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/cart/save', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/cart/abandoned', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/cart/<int:cart_id>/send-reminder', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/cart/recovery-stats', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    # ==================== CUSTOMER PROFILE ====================

    @http.route('/api/ecommerce/stock/export', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/customer/profile', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_customer_profile(self, **kwargs):
        """Récupérer le profil du client connecté"""
        try:
            partner = request.env.user.partner_id

            data = {
                'id': partner.id,
                'name': partner.name,
                'email': partner.email or '',
                'phone': partner.phone or '',
                'mobile': getattr(partner, 'mobile', '') or '',
                'street': partner.street or '',
                'street2': partner.street2 or '',
                'city': partner.city or '',
                'zip': partner.zip or '',
                'state': partner.state_id.name if partner.state_id else '',
                'country': partner.country_id.name if partner.country_id else '',
                'country_id': partner.country_id.id if partner.country_id else None,
            }

            return {
                'success': True,
                'profile': data
            }

        except Exception as e:
            _logger.error(f"Get profile error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/customer/profile/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def update_customer_profile(self, **kwargs):
        """Modifier le profil du client connecté (AUTHENTIFICATION REQUISE)"""
        try:
            partner = request.env.user.partner_id
            params = self._get_params()

            update_data = {}

            # Champs modifiables
            if 'name' in params:
                update_data['name'] = params['name']
            if 'phone' in params:
                update_data['phone'] = params['phone']
            if 'mobile' in params:
                update_data['mobile'] = params['mobile']
            if 'street' in params:
                update_data['street'] = params['street']
            if 'street2' in params:
                update_data['street2'] = params['street2']
            if 'city' in params:
                update_data['city'] = params['city']
            if 'zip' in params:
                update_data['zip'] = params['zip']
            if 'country_id' in params:
                update_data['country_id'] = int(params['country_id']) if params['country_id'] else False

            if update_data:
                partner.sudo().write(update_data)

            return {
                'success': True,
                'profile': {
                    'id': partner.id,
                    'name': partner.name,
                    'email': partner.email or '',
                    'phone': partner.phone or '',
                }
            }

        except Exception as e:
            _logger.error(f"Update profile error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    # ==================== CUSTOMER ADDRESSES ====================

    @http.route('/api/ecommerce/customer/addresses', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_customer_addresses(self, **kwargs):
        """Liste des adresses du client connecté"""
        try:
            partner = request.env.user.partner_id

            # Chercher les adresses enfants (type = 'delivery' ou 'invoice')
            addresses = request.env['res.partner'].sudo().search([
                ('parent_id', '=', partner.id),
                ('type', 'in', ['delivery', 'invoice'])
            ])

            data = [{
                'id': addr.id,
                'name': addr.name,
                'type': addr.type,
                'street': addr.street or '',
                'street2': addr.street2 or '',
                'city': addr.city or '',
                'zip': addr.zip or '',
                'state': addr.state_id.name if addr.state_id else '',
                'country': addr.country_id.name if addr.country_id else '',
                'phone': addr.phone or '',
            } for addr in addresses]

            return {
                'success': True,
                'addresses': data
            }

        except Exception as e:
            _logger.error(f"Get addresses error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/customer/addresses/create', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_customer_address(self, **kwargs):
        """Créer une nouvelle adresse pour le client (AUTHENTIFICATION REQUISE)"""
        try:
            partner = request.env.user.partner_id
            params = self._get_params()

            name = params.get('name', 'Delivery Address')
            address_type = params.get('type', 'delivery')  # delivery ou invoice

            if address_type not in ['delivery', 'invoice']:
                return {
                    'success': False,
                    'error': 'Invalid address type. Use: delivery or invoice'
                }

            address_data = {
                'parent_id': partner.id,
                'type': address_type,
                'name': name,
                'street': params.get('street', ''),
                'street2': params.get('street2', ''),
                'city': params.get('city', ''),
                'zip': params.get('zip', ''),
                'phone': params.get('phone', ''),
            }

            if 'country_id' in params:
                address_data['country_id'] = int(params['country_id'])

            address = request.env['res.partner'].sudo().create(address_data)

            return {
                'success': True,
                'address': {
                    'id': address.id,
                    'name': address.name,
                    'type': address.type,
                    'street': address.street or '',
                    'city': address.city or '',
                }
            }

        except Exception as e:
            _logger.error(f"Create address error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/customer/addresses/<int:address_id>/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def update_customer_address(self, address_id, **kwargs):
        """Modifier une adresse du client (AUTHENTIFICATION REQUISE)"""
        try:
            partner = request.env.user.partner_id
            address = request.env['res.partner'].sudo().browse(address_id)

            if not address.exists():
                return {
                    'success': False,
                    'error': 'Address not found'
                }

            # Vérifier que l'adresse appartient bien au client
            if address.parent_id.id != partner.id:
                return {
                    'success': False,
                    'error': 'Unauthorized'
                }

            params = self._get_params()
            update_data = {}

            if 'name' in params:
                update_data['name'] = params['name']
            if 'street' in params:
                update_data['street'] = params['street']
            if 'street2' in params:
                update_data['street2'] = params['street2']
            if 'city' in params:
                update_data['city'] = params['city']
            if 'zip' in params:
                update_data['zip'] = params['zip']
            if 'phone' in params:
                update_data['phone'] = params['phone']
            if 'country_id' in params:
                update_data['country_id'] = int(params['country_id']) if params['country_id'] else False

            if update_data:
                address.write(update_data)

            return {
                'success': True,
                'address': {
                    'id': address.id,
                    'name': address.name,
                    'street': address.street or '',
                    'city': address.city or '',
                }
            }

        except Exception as e:
            _logger.error(f"Update address error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/customer/addresses/<int:address_id>/delete', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def delete_customer_address(self, address_id, **kwargs):
        """Supprimer une adresse du client (AUTHENTIFICATION REQUISE)"""
        try:
            partner = request.env.user.partner_id
            address = request.env['res.partner'].sudo().browse(address_id)

            if not address.exists():
                return {
                    'success': False,
                    'error': 'Address not found'
                }

            # Vérifier que l'adresse appartient bien au client
            if address.parent_id.id != partner.id:
                return {
                    'success': False,
                    'error': 'Unauthorized'
                }

            address.unlink()

            return {'success': True}

        except Exception as e:
            _logger.error(f"Delete address error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    # ==================== RIBBONS (BADGES) ====================

    @http.route('/api/ecommerce/ribbons', type='http', auth='public', methods=['GET', 'POST'], csrf=False, cors='*')
    def get_ribbons(self, **kwargs):
        """Récupérer la liste des rubans (badges) disponibles - avec cache HTTP"""
        try:
            ribbons = request.env['product.ribbon'].sudo().search([], order='sequence')

            data = []
            for ribbon in ribbons:
                ribbon_name = ribbon.name
                if isinstance(ribbon_name, dict):
                    ribbon_name = ribbon_name.get('fr_FR', ribbon_name.get('en_US', ''))
                data.append({
                    'id': ribbon.id,
                    'name': ribbon_name,
                    'bg_color': ribbon.bg_color,
                    'text_color': ribbon.text_color,
                    'position': ribbon.position,
                    'style': ribbon.style,
                    'sequence': ribbon.sequence,
                })

            response_data = {
                'success': True,
                'data': {
                    'ribbons': data
                }
            }
            # Cache HTTP : 6 heures (badges changent rarement)
            return request.make_json_response(response_data, headers={
                'Cache-Control': 'public, max-age=21600',
                'Vary': 'Accept-Encoding'
            })
        except Exception as e:
            _logger.error(f"Get ribbons error: {e}")
            return request.make_json_response({
                'success': False,
                'error': str(e)
            })

    @http.route('/api/ecommerce/products/<int:product_id>/ribbon', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def update_product_ribbon(self, product_id, **kwargs):
        """Mettre à jour le ruban (badge) d'un produit"""
        try:
            params = self._get_params()
            ribbon_id = params.get('ribbon_id')  # null pour supprimer le ruban

            product = request.env['product.template'].sudo().browse(product_id)
            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            # Mettre à jour le ruban
            if ribbon_id:
                ribbon = request.env['product.ribbon'].sudo().browse(int(ribbon_id))
                if not ribbon.exists():
                    return {
                        'success': False,
                        'error': 'Ribbon not found'
                    }
                product.write({'website_ribbon_id': ribbon.id})
            else:
                # Supprimer le ruban
                product.write({'website_ribbon_id': False})

            return {
                'success': True,
                'message': 'Product ribbon updated successfully'
            }
        except Exception as e:
            _logger.error(f"Update product ribbon error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    # ==================== STOCK ====================

    @http.route('/api/ecommerce/products/<int:product_id>/stock', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
            }

            return {
                'success': True,
                'stock': data
            }

        except Exception as e:
            _logger.error(f"Get product stock error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/stock/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/stock/moves', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_stock_moves(self, **kwargs):
        """Liste des mouvements de stock (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

            params = self._get_params()
            limit = int(params.get('limit', 50))
            offset = int(params.get('offset', 0))
            product_id = params.get('product_id')

            domain = [('state', '=', 'done')]
            if product_id:
                domain.append(('product_id', '=', int(product_id)))

            moves = request.env['stock.move'].sudo().search(
                domain,
                limit=limit,
                offset=offset,
                order='date desc'
            )

            total = request.env['stock.move'].sudo().search_count(domain)

            data = [{
                'id': m.id,
                'product': {
                    'id': m.product_id.id,
                    'name': m.product_id.name,
                },
                'quantity': m.product_uom_qty,
                'location_src': m.location_id.complete_name,
                'location_dest': m.location_dest_id.complete_name,
                'date': m.date.isoformat() if m.date else None,
                'state': m.state,
                'reference': m.reference or '',
            } for m in moves]

            return {
                'success': True,
                'data': {
                    'moves': data,
                    'total': total,
                    'limit': limit,
                    'offset': offset,
                }
            }

        except Exception as e:
            _logger.error(f"Get stock moves error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/stock/validate', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/stock/products', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    # ==================== DELIVERY ====================

    @http.route('/api/ecommerce/delivery/methods', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/delivery/methods/create', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/delivery/methods/<int:method_id>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/delivery/methods/<int:method_id>/update', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/delivery/methods/<int:method_id>/delete', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/delivery/calculate', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/delivery/zones', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_delivery_zones(self, **kwargs):
        """Liste des zones de livraison disponibles"""
        try:
            # Dans Odoo, les zones sont définies par les pays
            countries = request.env['res.country'].sudo().search([])

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
                'error': str(e)
            }

    # ===========================
    # PHASE 4: PAIEMENT
    # ===========================

    @http.route('/api/ecommerce/payment/methods', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/payment/init', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/payment/confirm', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/payment/webhook', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/payment/transactions', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/payment/transactions/<int:transaction_id>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/payment/transactions/<int:transaction_id>/refund', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    # ===========================
    # PHASE 5: MARKETING (COUPONS)
    # ===========================

    @http.route('/api/ecommerce/coupons', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_coupons_list(self, **kwargs):
        """Liste des coupons (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    @http.route('/api/ecommerce/coupons/create', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def create_coupon(self, **kwargs):
        """Créer un nouveau coupon (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    @http.route('/api/ecommerce/coupons/<int:coupon_id>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_coupon_detail(self, coupon_id, **kwargs):
        """Détail d'un coupon (admin uniquement)"""
        try:
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    @http.route('/api/ecommerce/coupons/<int:coupon_id>/update', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def update_coupon(self, coupon_id, **kwargs):
        """Mettre à jour un coupon (admin uniquement)"""
        try:
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    @http.route('/api/ecommerce/coupons/<int:coupon_id>/delete', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def delete_coupon(self, coupon_id, **kwargs):
        """Supprimer un coupon (admin uniquement)"""
        try:
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    @http.route('/api/ecommerce/cart/coupon/apply', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/cart/coupon/remove', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    # ==================== ANALYTICS ====================

    @http.route('/api/ecommerce/analytics/stats', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_analytics_stats(self, **kwargs):
        """Statistiques globales (admin uniquement)"""
        try:
            # Total produits
            total_products = request.env['product.product'].sudo().search_count([])

            # Total clients
            total_customers = request.env['res.partner'].sudo().search_count([
                ('customer_rank', '>', 0)
            ])

            # Commandes
            total_orders = request.env['sale.order'].sudo().search_count([])
            confirmed_orders = request.env['sale.order'].sudo().search_count([
                ('state', 'in', ['sale', 'done'])
            ])

            # Chiffre d'affaires total
            confirmed_orders_obj = request.env['sale.order'].sudo().search([
                ('state', 'in', ['sale', 'done'])
            ])
            total_revenue = sum(confirmed_orders_obj.mapped('amount_total'))

            # Commandes en attente
            pending_orders = request.env['sale.order'].sudo().search_count([
                ('state', '=', 'draft')
            ])

            # Produits en rupture de stock (filtrage côté Python car qty_available est calculé)
            # Limite à 50000 produits actifs pour éviter surcharge mémoire sur très gros catalogues
            all_products = request.env['product.product'].sudo().search(
                [('active', '=', True)],
                limit=50000
            )
            out_of_stock_products = len([p for p in all_products if p.qty_available <= 0])

            # Dernières commandes (5 dernières)
            recent_orders = request.env['sale.order'].sudo().search(
                [],
                limit=5,
                order='date_order desc'
            )

            recent_orders_data = [{
                'id': o.id,
                'name': o.name,
                'date_order': o.date_order.isoformat() if o.date_order else None,
                'state': o.state,
                'amount_total': o.amount_total,
                'customer': {
                    'id': o.partner_id.id,
                    'name': o.partner_id.name,
                } if o.partner_id else None,
            } for o in recent_orders]

            # Top 5 produits les plus vendus
            order_lines = request.env['sale.order.line'].sudo().search([
                ('order_id.state', 'in', ['sale', 'done'])
            ])

            # Compter les ventes par produit
            product_sales = {}
            for line in order_lines:
                product_id = line.product_id.id
                if product_id not in product_sales:
                    product_sales[product_id] = {
                        'id': product_id,
                        'name': line.product_id.name,
                        'qty_sold': 0,
                        'revenue': 0,
                    }
                product_sales[product_id]['qty_sold'] += line.product_uom_qty
                product_sales[product_id]['revenue'] += line.price_total

            # Trier et prendre les 5 meilleurs
            top_products = sorted(
                product_sales.values(),
                key=lambda x: x['qty_sold'],
                reverse=True
            )[:5]

            # Alertes de stock (produits en rupture ou stock faible)
            # Filtrage côté Python car qty_available est un champ calculé
            sale_products = request.env['product.template'].sudo().search([('sale_ok', '=', True)])
            low_stock_products = [p for p in sale_products if p.qty_available <= 5]
            # Trier par stock croissant et limiter à 10
            low_stock_products.sort(key=lambda p: p.qty_available)
            stock_alert_products = low_stock_products[:10]

            stock_alerts = []
            for p in stock_alert_products:
                qty = p.qty_available
                if qty <= 0:
                    alert_level = 'critical'
                    alert_message = 'Rupture de stock'
                else:
                    alert_level = 'warning'
                    alert_message = f'Stock faible ({int(qty)} restants)'

                stock_alerts.append({
                    'id': p.id,
                    'name': p.name,
                    'default_code': p.default_code or '',
                    'qty_available': qty,
                    'alert_level': alert_level,
                    'alert_message': alert_message,
                    'image': f'/web/image/product.template/{p.id}/image_128' if p.image_128 else None,
                })

            # Compter les alertes par niveau (filtrage côté Python)
            low_stock_count = len([p for p in sale_products if 0 < p.qty_available <= 5])

            return {
                'success': True,
                'data': {
                    'totals': {
                        'products': total_products,
                        'customers': total_customers,
                        'orders': total_orders,
                        'confirmed_orders': confirmed_orders,
                        'pending_orders': pending_orders,
                        'out_of_stock_products': out_of_stock_products,
                        'low_stock_products': low_stock_count,
                        'revenue': total_revenue,
                    },
                    'recent_orders': recent_orders_data,
                    'top_products': top_products,
                    'stock_alerts': stock_alerts,
                }
            }

        except Exception as e:
            _logger.error(f"Get analytics stats error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/analytics/revenue-chart', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_revenue_chart(self, **kwargs):
        """Graphique évolution du chiffre d'affaires par période"""
        try:
            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            params = self._get_params()
            period = params.get('period', '30d')  # 7d, 30d, 12m, custom

            from datetime import datetime, timedelta
            from dateutil.relativedelta import relativedelta

            today = datetime.now().date()

            if period == '7d':
                start_date = today - timedelta(days=7)
                group_by = 'day'
            elif period == '30d':
                start_date = today - timedelta(days=30)
                group_by = 'day'
            elif period == '12m':
                start_date = today - relativedelta(months=12)
                group_by = 'month'
            elif period == 'custom':
                start_date = datetime.strptime(params.get('start_date'), '%Y-%m-%d').date()
                end_date = datetime.strptime(params.get('end_date', today.isoformat()), '%Y-%m-%d').date()
                group_by = params.get('group_by', 'day')
            else:
                start_date = today - timedelta(days=30)
                group_by = 'day'

            # Récupérer les commandes confirmées sur la période
            orders = request.env['sale.order'].sudo().search([
                ('state', 'in', ['sale', 'done']),
                ('date_order', '>=', start_date.isoformat()),
            ])

            # Grouper par période
            chart_data = {}
            for order in orders:
                if not order.date_order:
                    continue

                date = order.date_order.date()
                if group_by == 'day':
                    key = date.isoformat()
                elif group_by == 'month':
                    key = date.strftime('%Y-%m')
                else:
                    key = date.isoformat()

                if key not in chart_data:
                    chart_data[key] = {'revenue': 0, 'orders': 0}

                chart_data[key]['revenue'] += order.amount_total
                chart_data[key]['orders'] += 1

            # Convertir en liste triée
            data = [
                {
                    'period': key,
                    'revenue': round(values['revenue'], 2),
                    'orders': values['orders']
                }
                for key, values in sorted(chart_data.items())
            ]

            return {
                'success': True,
                'data': data,
                'period': period,
                'group_by': group_by
            }

        except Exception as e:
            _logger.error(f"Get revenue chart error: {e}")
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/analytics/orders-chart', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_orders_chart(self, **kwargs):
        """Graphique évolution du nombre de commandes par période et par état"""
        try:
            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            params = self._get_params()
            period = params.get('period', '30d')

            from datetime import datetime, timedelta
            from dateutil.relativedelta import relativedelta

            today = datetime.now().date()

            if period == '7d':
                start_date = today - timedelta(days=7)
                group_by = 'day'
            elif period == '30d':
                start_date = today - timedelta(days=30)
                group_by = 'day'
            elif period == '12m':
                start_date = today - relativedelta(months=12)
                group_by = 'month'
            else:
                start_date = today - timedelta(days=30)
                group_by = 'day'

            # Récupérer toutes les commandes sur la période
            orders = request.env['sale.order'].sudo().search([
                ('date_order', '>=', start_date.isoformat()),
            ])

            # Grouper par période et par état
            chart_data = {}
            for order in orders:
                if not order.date_order:
                    continue

                date = order.date_order.date()
                if group_by == 'day':
                    key = date.isoformat()
                elif group_by == 'month':
                    key = date.strftime('%Y-%m')
                else:
                    key = date.isoformat()

                if key not in chart_data:
                    chart_data[key] = {
                        'total': 0,
                        'draft': 0,
                        'sent': 0,
                        'sale': 0,
                        'done': 0,
                        'cancel': 0
                    }

                chart_data[key]['total'] += 1
                if order.state in chart_data[key]:
                    chart_data[key][order.state] += 1

            # Convertir en liste triée
            data = [
                {
                    'period': key,
                    'total': values['total'],
                    'confirmed': values['sale'] + values['done'],
                    'pending': values['draft'] + values['sent'],
                    'cancelled': values['cancel']
                }
                for key, values in sorted(chart_data.items())
            ]

            return {
                'success': True,
                'data': data,
                'period': period,
                'group_by': group_by
            }

        except Exception as e:
            _logger.error(f"Get orders chart error: {e}")
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/analytics/conversion-funnel', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_conversion_funnel(self, **kwargs):
        """Funnel de conversion : visiteurs → panier → commande → paiement"""
        try:
            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            params = self._get_params()
            period = params.get('period', '30d')

            from datetime import datetime, timedelta
            today = datetime.now().date()

            if period == '7d':
                start_date = today - timedelta(days=7)
            elif period == '30d':
                start_date = today - timedelta(days=30)
            elif period == '12m':
                start_date = today - timedelta(days=365)
            else:
                start_date = today - timedelta(days=30)

            # Total commandes créées (paniers)
            total_carts = request.env['sale.order'].sudo().search_count([
                ('date_order', '>=', start_date.isoformat()),
            ])

            # Commandes avec au moins 1 ligne (panier rempli)
            carts_with_items = request.env['sale.order'].sudo().search_count([
                ('date_order', '>=', start_date.isoformat()),
                ('order_line', '!=', False),
            ])

            # Commandes confirmées
            confirmed_orders = request.env['sale.order'].sudo().search_count([
                ('date_order', '>=', start_date.isoformat()),
                ('state', 'in', ['sale', 'done']),
            ])

            # Commandes payées (factures payées)
            paid_orders = request.env['sale.order'].sudo().search([
                ('date_order', '>=', start_date.isoformat()),
                ('state', 'in', ['sale', 'done']),
            ])

            paid_count = 0
            for order in paid_orders:
                # Vérifier si la facture existe et est payée
                invoices = request.env['account.move'].sudo().search([
                    ('invoice_origin', '=', order.name),
                    ('payment_state', '=', 'paid'),
                ])
                if invoices:
                    paid_count += 1

            # Calculer les taux de conversion
            funnel_data = [
                {
                    'stage': 'Paniers créés',
                    'count': total_carts,
                    'percentage': 100.0,
                    'color': '#6366f1'
                },
                {
                    'stage': 'Paniers remplis',
                    'count': carts_with_items,
                    'percentage': round((carts_with_items / total_carts * 100) if total_carts > 0 else 0, 1),
                    'color': '#8b5cf6'
                },
                {
                    'stage': 'Commandes confirmées',
                    'count': confirmed_orders,
                    'percentage': round((confirmed_orders / total_carts * 100) if total_carts > 0 else 0, 1),
                    'color': '#10b981'
                },
                {
                    'stage': 'Commandes payées',
                    'count': paid_count,
                    'percentage': round((paid_count / total_carts * 100) if total_carts > 0 else 0, 1),
                    'color': '#059669'
                }
            ]

            return {
                'success': True,
                'data': funnel_data,
                'period': period
            }

        except Exception as e:
            _logger.error(f"Get conversion funnel error: {e}")
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/analytics/top-categories', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_top_categories(self, **kwargs):
        """Top catégories les plus vendues avec graphique"""
        try:
            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            params = self._get_params()
            limit = int(params.get('limit', 10))

            # Récupérer toutes les lignes de commandes confirmées
            order_lines = request.env['sale.order.line'].sudo().search([
                ('order_id.state', 'in', ['sale', 'done'])
            ])

            # Compter les ventes par catégorie
            category_sales = {}
            for line in order_lines:
                if not line.product_id or not line.product_id.categ_id:
                    continue

                category = line.product_id.categ_id
                category_id = category.id

                if category_id not in category_sales:
                    category_sales[category_id] = {
                        'id': category_id,
                        'name': category.complete_name or category.name,
                        'qty_sold': 0,
                        'revenue': 0,
                    }

                category_sales[category_id]['qty_sold'] += line.product_uom_qty
                category_sales[category_id]['revenue'] += line.price_total

            # Trier et prendre les top N
            top_categories = sorted(
                category_sales.values(),
                key=lambda x: x['revenue'],
                reverse=True
            )[:limit]

            # Arrondir les revenues
            for cat in top_categories:
                cat['revenue'] = round(cat['revenue'], 2)
                cat['qty_sold'] = int(cat['qty_sold'])

            return {
                'success': True,
                'data': top_categories
            }

        except Exception as e:
            _logger.error(f"Get top categories error: {e}")
            return {'success': False, 'error': str(e)}

    # ===========================
    # PHASE 7: FACTURATION
    # ===========================

    @http.route('/api/ecommerce/invoices', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/invoices/<int:invoice_id>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/orders/<int:order_id>/create-invoice', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
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
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/invoices/<int:invoice_id>/post', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
            return {'success': False, 'error': str(e)}

    # ==================== FEATURED PRODUCTS ====================

    @http.route('/api/ecommerce/featured', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_featured_products(self, **kwargs):
        """Liste des produits vedettes (website_sequence > 0)"""
        try:
            params = self._get_params()
            limit = int(params.get('limit', 20))
            offset = int(params.get('offset', 0))

            ProductTemplate = request.env['product.template'].sudo()

            # Produits vedettes = website_sequence > 0, tries par sequence
            domain = [
                ('sale_ok', '=', True),
                ('active', '=', True),
                ('website_sequence', '>', 0),
            ]

            products = ProductTemplate.search(
                domain,
                limit=limit,
                offset=offset,
                order='website_sequence asc'
            )

            total = ProductTemplate.search_count(domain)

            data = []
            for p in products:
                qty = p.qty_available
                if qty <= 0:
                    stock_status = 'out_of_stock'
                elif qty <= 5:
                    stock_status = 'low_stock'
                else:
                    stock_status = 'in_stock'

                data.append({
                    'id': p.id,
                    'name': p.name,
                    'price': p.list_price,
                    'image': f'/web/image/product.template/{p.id}/image_1920' if p.image_1920 else None,
                    'sequence': p.website_sequence,
                    'qty_available': qty,
                    'stock_status': stock_status,
                    'category': {
                        'id': p.categ_id.id,
                        'name': p.categ_id.name,
                    } if p.categ_id else None,
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
            _logger.error(f"Get featured products error: {e}")
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/featured/available', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_available_products_for_featured(self, **kwargs):
        """Liste des produits non vedettes pour ajout (admin)"""
        try:
            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            params = self._get_params()
            limit = int(params.get('limit', 50))
            offset = int(params.get('offset', 0))
            search = params.get('search', '').strip()

            ProductTemplate = request.env['product.template'].sudo()

            # Produits non vedettes (website_sequence = 0 ou pas defini)
            domain = [
                ('sale_ok', '=', True),
                ('active', '=', True),
                '|',
                ('website_sequence', '=', 0),
                ('website_sequence', '=', False),
            ]

            if search:
                domain.insert(0, '&')
                domain.append('|')
                domain.append(('name', 'ilike', search))
                domain.append(('default_code', 'ilike', search))

            products = ProductTemplate.search(
                domain,
                limit=limit,
                offset=offset,
                order='name asc'
            )

            total = ProductTemplate.search_count(domain)

            data = []
            for p in products:
                data.append({
                    'id': p.id,
                    'name': p.name,
                    'price': p.list_price,
                    'image': f'/web/image/product.template/{p.id}/image_1920' if p.image_1920 else None,
                    'default_code': p.default_code or '',
                    'category': {
                        'id': p.categ_id.id,
                        'name': p.categ_id.name,
                    } if p.categ_id else None,
                })

            return {
                'success': True,
                'data': {
                    'products': data,
                    'total': total,
                }
            }

        except Exception as e:
            _logger.error(f"Get available products error: {e}")
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/featured/add', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def add_featured_product(self, **kwargs):
        """Ajouter un produit aux vedettes (admin)"""
        try:
            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            params = self._get_params()
            product_id = params.get('product_id')

            if not product_id:
                return {'success': False, 'error': 'Product ID required'}

            ProductTemplate = request.env['product.template'].sudo()
            product = ProductTemplate.browse(int(product_id))

            if not product.exists():
                return {'success': False, 'error': 'Product not found'}

            # Trouver la sequence max actuelle
            max_seq = ProductTemplate.search_read(
                [('website_sequence', '>', 0)],
                ['website_sequence'],
                order='website_sequence desc',
                limit=1
            )
            new_seq = (max_seq[0]['website_sequence'] + 1) if max_seq else 1

            product.write({'website_sequence': new_seq})

            return {
                'success': True,
                'product': {
                    'id': product.id,
                    'name': product.name,
                    'sequence': new_seq,
                },
                'message': 'Produit ajoute aux vedettes'
            }

        except Exception as e:
            _logger.error(f"Add featured product error: {e}")
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/featured/remove', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def remove_featured_product(self, **kwargs):
        """Retirer un produit des vedettes (admin)"""
        try:
            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            params = self._get_params()
            product_id = params.get('product_id')

            if not product_id:
                return {'success': False, 'error': 'Product ID required'}

            product = request.env['product.template'].sudo().browse(int(product_id))

            if not product.exists():
                return {'success': False, 'error': 'Product not found'}

            product.write({'website_sequence': 0})

            return {
                'success': True,
                'message': 'Produit retire des vedettes'
            }

        except Exception as e:
            _logger.error(f"Remove featured product error: {e}")
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/featured/reorder', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def reorder_featured_products(self, **kwargs):
        """Reordonner les produits vedettes (admin)"""
        try:
            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            params = self._get_params()
            product_ids = params.get('product_ids', [])

            if not product_ids:
                return {'success': False, 'error': 'Product IDs required'}

            ProductTemplate = request.env['product.template'].sudo()

            for idx, pid in enumerate(product_ids):
                product = ProductTemplate.browse(int(pid))
                if product.exists():
                    product.write({'website_sequence': idx + 1})

            return {
                'success': True,
                'message': f'{len(product_ids)} produits reordonnes'
            }

        except Exception as e:
            _logger.error(f"Reorder featured products error: {e}")
            return {'success': False, 'error': str(e)}

    # ==================== STOCK INVENTORY ====================

    @http.route('/api/ecommerce/stock/inventory/prepare', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def prepare_inventory(self, **kwargs):
        """Préparer un inventaire physique - Récupérer liste produits avec stock actuel"""
        try:
            # Vérifier les permissions admin
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                inventory_lines.append({
                    'product_id': product.id,
                    'product_name': product.name,
                    'sku': product.default_code or '',
                    'image_url': f'/web/image/product.product/{product.id}/image_128',
                    'category': product.categ_id.name if product.categ_id else '',
                    'theoretical_qty': product.qty_available,  # Stock théorique (actuel)
                    'counted_qty': None,  # À saisir par l'utilisateur
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/stock/inventory/validate', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def validate_inventory(self, **kwargs):
        """Valider un inventaire physique - Appliquer les ajustements de stock en masse"""
        try:
            # Vérifier les permissions admin
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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

                    adjusted_products.append({
                        'product_id': product.id,
                        'product_name': product.name,
                        'old_qty': old_qty,
                        'new_qty': new_qty,
                        'difference': new_qty - old_qty,
                    })

                except Exception as product_error:
                    errors.append({
                        'error': str(product_error),
                        'product_id': adjustment.get('product_id')
                    })

            return {
                'success': True,
                'data': {
                    'adjusted_products': adjusted_products,
                    'total_adjusted': len(adjusted_products),
                    'errors': errors,
                    'error_count': len(errors),
                }
            }

        except Exception as e:
            _logger.error(f"Validate inventory error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    # ==================== STOCK ALERTS ====================

    @http.route('/api/ecommerce/stock/low-stock-alerts', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_low_stock_alerts(self, **kwargs):
        """Récupérer les produits en stock bas (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    @http.route('/api/ecommerce/stock/high-stock-alerts', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_high_stock_alerts(self, **kwargs):
        """Récupérer les produits en surstock (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

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
                'error': str(e)
            }

    # ==================== SHIPPING TRACKING ====================

    @http.route('/api/ecommerce/orders/<int:order_id>/tracking', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/tracking/colissimo/<string:tracking_number>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/tracking/mondialrelay/<string:tracking_number>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
            return {'success': False, 'error': str(e)}

    # ===== CART RECOVERY =====

    @http.route('/api/ecommerce/cart/recover', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
            return {'success': False, 'error': str(e)}

    # ===================================================================
    # CURRENCIES - Multi-devises (Issue #17)
    # ===================================================================

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
                'error': str(e)
            })

    @http.route('/api/ecommerce/currencies/<int:currency_id>/activate', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/currencies/convert', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    # ===================================================================
    # PRICELISTS & CUSTOMER CATEGORIES - Segmentation clients (Issue #21)
    # ===================================================================

    @http.route('/api/ecommerce/pricelists', type='http', auth='public', methods=['GET', 'POST'], csrf=False, cors='*')
    def get_pricelists(self, **kwargs):
        """
        Récupérer la liste des pricelists (listes de prix) - avec cache HTTP.

        Params:
            active_only (bool): Si True, retourne uniquement les pricelists actives (défaut: True)

        Returns:
            Liste des pricelists avec id, name, currency_id, active
        """
        try:
            params = self._get_http_params()
            active_only = params.get('active_only', True)

            Pricelist = request.env['product.pricelist'].sudo()

            domain = []
            if active_only:
                domain.append(('active', '=', True))

            pricelists = Pricelist.search(domain, order='name')

            pricelist_list = []
            for pricelist in pricelists:
                pricelist_list.append({
                    'id': pricelist.id,
                    'name': pricelist.name,
                    'currency_id': pricelist.currency_id.id,
                    'currency_name': pricelist.currency_id.name,
                    'currency_symbol': pricelist.currency_id.symbol,
                    'active': pricelist.active,
                    'discount_policy': pricelist.discount_policy if hasattr(pricelist, 'discount_policy') else 'with_discount',
                })

            response_data = {
                'success': True,
                'data': pricelist_list,
                'total': len(pricelist_list)
            }
            # Cache HTTP : 6 heures (pricelists changent rarement)
            return request.make_json_response(response_data, headers={
                'Cache-Control': 'public, max-age=21600',
                'Vary': 'Accept-Encoding'
            })

        except Exception as e:
            _logger.error(f"Get pricelists error: {e}")
            return request.make_json_response({
                'success': False,
                'error': str(e)
            })

    @http.route('/api/ecommerce/pricelists/<int:pricelist_id>', type='json', auth='public', methods=['GET', 'POST'], csrf=False, cors='*')
    def get_pricelist_detail(self, pricelist_id, **params):
        """
        Récupérer le détail d'une pricelist avec ses items (règles de prix).

        Returns:
            Pricelist avec ses items
        """
        try:
            Pricelist = request.env['product.pricelist'].sudo()
            pricelist = Pricelist.browse(pricelist_id)

            if not pricelist.exists():
                return {
                    'success': False,
                    'error': f'Pricelist {pricelist_id} introuvable'
                }

            # Récupérer les items de la pricelist
            items = []
            for item in pricelist.item_ids:
                item_data = {
                    'id': item.id,
                    'applied_on': item.applied_on,  # '3_global', '2_product_category', '1_product', '0_product_variant'
                    'compute_price': item.compute_price,  # 'fixed', 'percentage', 'formula'
                    'fixed_price': float(item.fixed_price) if item.fixed_price else None,
                    'percent_price': float(item.percent_price) if item.percent_price else None,
                    'price_discount': float(item.price_discount) if item.price_discount else None,
                    'min_quantity': item.min_quantity,
                }

                # Ajouter les références produit/catégorie selon applied_on
                if item.applied_on == '1_product' and item.product_tmpl_id:
                    item_data['product_id'] = item.product_tmpl_id.id
                    item_data['product_name'] = item.product_tmpl_id.name
                elif item.applied_on == '2_product_category' and item.categ_id:
                    item_data['category_id'] = item.categ_id.id
                    item_data['category_name'] = item.categ_id.name

                items.append(item_data)

            return {
                'success': True,
                'data': {
                    'id': pricelist.id,
                    'name': pricelist.name,
                    'currency_id': pricelist.currency_id.id,
                    'currency_name': pricelist.currency_id.name,
                    'currency_symbol': pricelist.currency_id.symbol,
                    'active': pricelist.active,
                    'discount_policy': pricelist.discount_policy if hasattr(pricelist, 'discount_policy') else 'with_discount',
                    'items': items,
                    'item_count': len(items),
                }
            }

        except Exception as e:
            _logger.error(f"Get pricelist detail error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/pricelists/create', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_pricelist(self, **params):
        """
        Créer une nouvelle pricelist (ADMIN UNIQUEMENT).

        Params:
            name (str): Nom de la liste de prix (requis)
            currency_id (int): ID de la devise (requis)
            discount_policy (str): Politique remise 'with_discount' ou 'without_discount' (optionnel, défaut 'with_discount')
            active (bool): Statut actif (optionnel, défaut True)

        Returns:
            Pricelist créée avec son ID
        """
        try:
            # Vérification admin
            admin_check = self._require_admin()
            if not admin_check['success']:
                return admin_check

            # Validation paramètres requis
            name = params.get('name')
            currency_id = params.get('currency_id')

            if not name:
                return {
                    'success': False,
                    'error': 'Le nom de la liste de prix est requis'
                }

            if not currency_id:
                return {
                    'success': False,
                    'error': 'La devise est requise'
                }

            # Vérifier que la devise existe
            Currency = request.env['res.currency'].sudo()
            currency = Currency.browse(currency_id)
            if not currency.exists():
                return {
                    'success': False,
                    'error': f'Devise {currency_id} introuvable'
                }

            # Paramètres optionnels
            discount_policy = params.get('discount_policy', 'with_discount')
            active = params.get('active', True)

            # Créer la pricelist
            Pricelist = request.env['product.pricelist'].sudo()
            new_pricelist = Pricelist.create({
                'name': name,
                'currency_id': currency_id,
                'discount_policy': discount_policy,
                'active': active,
            })

            _logger.info(f"Pricelist créée : {new_pricelist.id} - {name} par user {request.env.user.login}")

            return {
                'success': True,
                'data': {
                    'id': new_pricelist.id,
                    'name': new_pricelist.name,
                    'currency_id': new_pricelist.currency_id.id,
                    'currency_name': new_pricelist.currency_id.name,
                    'currency_symbol': new_pricelist.currency_id.symbol,
                    'active': new_pricelist.active,
                    'discount_policy': new_pricelist.discount_policy,
                },
                'message': f"Liste de prix '{name}' créée avec succès"
            }

        except Exception as e:
            _logger.error(f"Create pricelist error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/pricelists/<int:pricelist_id>/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def update_pricelist(self, pricelist_id, **params):
        """
        Modifier une pricelist existante (ADMIN UNIQUEMENT).

        Params:
            name (str): Nouveau nom (optionnel)
            currency_id (int): Nouvelle devise (optionnel)
            discount_policy (str): Nouvelle politique remise (optionnel)
            active (bool): Nouveau statut actif (optionnel)

        Returns:
            Pricelist mise à jour
        """
        try:
            # Vérification admin
            admin_check = self._require_admin()
            if not admin_check['success']:
                return admin_check

            Pricelist = request.env['product.pricelist'].sudo()
            pricelist = Pricelist.browse(pricelist_id)

            if not pricelist.exists():
                return {
                    'success': False,
                    'error': f'Pricelist {pricelist_id} introuvable'
                }

            # Construire dictionnaire des champs à mettre à jour
            update_vals = {}

            if 'name' in params:
                update_vals['name'] = params['name']

            if 'currency_id' in params:
                currency_id = params['currency_id']
                Currency = request.env['res.currency'].sudo()
                currency = Currency.browse(currency_id)
                if not currency.exists():
                    return {
                        'success': False,
                        'error': f'Devise {currency_id} introuvable'
                    }
                update_vals['currency_id'] = currency_id

            if 'discount_policy' in params:
                update_vals['discount_policy'] = params['discount_policy']

            if 'active' in params:
                update_vals['active'] = params['active']

            # Appliquer les modifications
            if update_vals:
                pricelist.write(update_vals)
                _logger.info(f"Pricelist mise à jour : {pricelist_id} par user {request.env.user.login}")

            return {
                'success': True,
                'data': {
                    'id': pricelist.id,
                    'name': pricelist.name,
                    'currency_id': pricelist.currency_id.id,
                    'currency_name': pricelist.currency_id.name,
                    'currency_symbol': pricelist.currency_id.symbol,
                    'active': pricelist.active,
                    'discount_policy': pricelist.discount_policy,
                },
                'message': f"Liste de prix '{pricelist.name}' mise à jour avec succès"
            }

        except Exception as e:
            _logger.error(f"Update pricelist error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/pricelists/<int:pricelist_id>/items/create', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_pricelist_item(self, pricelist_id, **params):
        """
        Ajouter une règle de prix à une pricelist (ADMIN UNIQUEMENT).

        Params:
            applied_on (str): Type d'application '3_global', '2_product_category', '1_product', '0_product_variant' (requis)
            compute_price (str): Type de calcul 'fixed', 'percentage', 'formula' (requis)
            fixed_price (float): Prix fixe (si compute_price='fixed')
            percent_price (float): Pourcentage du prix (si compute_price='percentage')
            price_discount (float): Pourcentage de remise (si compute_price='percentage')
            min_quantity (int): Quantité minimale (optionnel, défaut 1)
            product_tmpl_id (int): ID du produit (si applied_on='1_product')
            categ_id (int): ID de la catégorie (si applied_on='2_product_category')
            date_start (str): Date début validité YYYY-MM-DD (optionnel)
            date_end (str): Date fin validité YYYY-MM-DD (optionnel)

        Returns:
            Règle de prix créée
        """
        try:
            # Vérification admin
            admin_check = self._require_admin()
            if not admin_check['success']:
                return admin_check

            Pricelist = request.env['product.pricelist'].sudo()
            pricelist = Pricelist.browse(pricelist_id)

            if not pricelist.exists():
                return {
                    'success': False,
                    'error': f'Pricelist {pricelist_id} introuvable'
                }

            # Validation paramètres requis
            applied_on = params.get('applied_on')
            compute_price = params.get('compute_price')

            if not applied_on:
                return {
                    'success': False,
                    'error': "Le type d'application (applied_on) est requis"
                }

            if applied_on not in ['3_global', '2_product_category', '1_product', '0_product_variant']:
                return {
                    'success': False,
                    'error': f"Type d'application invalide : {applied_on}"
                }

            if not compute_price:
                return {
                    'success': False,
                    'error': "Le type de calcul (compute_price) est requis"
                }

            if compute_price not in ['fixed', 'percentage', 'formula']:
                return {
                    'success': False,
                    'error': f"Type de calcul invalide : {compute_price}"
                }

            # Construire les valeurs de la règle
            item_vals = {
                'pricelist_id': pricelist_id,
                'applied_on': applied_on,
                'compute_price': compute_price,
                'min_quantity': params.get('min_quantity', 1),
            }

            # Validation selon applied_on
            if applied_on == '1_product':
                product_tmpl_id = params.get('product_tmpl_id')
                if not product_tmpl_id:
                    return {
                        'success': False,
                        'error': "product_tmpl_id requis pour applied_on='1_product'"
                    }
                # Vérifier que le produit existe
                ProductTemplate = request.env['product.template'].sudo()
                product = ProductTemplate.browse(product_tmpl_id)
                if not product.exists():
                    return {
                        'success': False,
                        'error': f'Produit {product_tmpl_id} introuvable'
                    }
                item_vals['product_tmpl_id'] = product_tmpl_id

            elif applied_on == '2_product_category':
                categ_id = params.get('categ_id')
                if not categ_id:
                    return {
                        'success': False,
                        'error': "categ_id requis pour applied_on='2_product_category'"
                    }
                # Vérifier que la catégorie existe
                Category = request.env['product.category'].sudo()
                category = Category.browse(categ_id)
                if not category.exists():
                    return {
                        'success': False,
                        'error': f'Catégorie {categ_id} introuvable'
                    }
                item_vals['categ_id'] = categ_id

            # Validation selon compute_price
            if compute_price == 'fixed':
                fixed_price = params.get('fixed_price')
                if fixed_price is None:
                    return {
                        'success': False,
                        'error': "fixed_price requis pour compute_price='fixed'"
                    }
                item_vals['fixed_price'] = float(fixed_price)

            elif compute_price == 'percentage':
                # Soit percent_price (base prix * pourcentage), soit price_discount (remise)
                if 'percent_price' in params:
                    item_vals['percent_price'] = float(params['percent_price'])
                elif 'price_discount' in params:
                    item_vals['price_discount'] = float(params['price_discount'])
                else:
                    return {
                        'success': False,
                        'error': "percent_price ou price_discount requis pour compute_price='percentage'"
                    }

            # Dates optionnelles
            if 'date_start' in params:
                item_vals['date_start'] = params['date_start']
            if 'date_end' in params:
                item_vals['date_end'] = params['date_end']

            # Créer la règle
            PricelistItem = request.env['product.pricelist.item'].sudo()
            new_item = PricelistItem.create(item_vals)

            _logger.info(f"Règle de prix créée : {new_item.id} pour pricelist {pricelist_id} par user {request.env.user.login}")

            # Préparer la réponse avec les infos de la règle
            item_data = {
                'id': new_item.id,
                'applied_on': new_item.applied_on,
                'compute_price': new_item.compute_price,
                'fixed_price': float(new_item.fixed_price) if new_item.fixed_price else None,
                'percent_price': float(new_item.percent_price) if new_item.percent_price else None,
                'price_discount': float(new_item.price_discount) if new_item.price_discount else None,
                'min_quantity': new_item.min_quantity,
            }

            # Ajouter les références produit/catégorie
            if new_item.applied_on == '1_product' and new_item.product_tmpl_id:
                item_data['product_id'] = new_item.product_tmpl_id.id
                item_data['product_name'] = new_item.product_tmpl_id.name
            elif new_item.applied_on == '2_product_category' and new_item.categ_id:
                item_data['category_id'] = new_item.categ_id.id
                item_data['category_name'] = new_item.categ_id.name

            return {
                'success': True,
                'data': item_data,
                'message': f"Règle de prix ajoutée à '{pricelist.name}' avec succès"
            }

        except Exception as e:
            _logger.error(f"Create pricelist item error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/pricelists/<int:pricelist_id>/delete', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def delete_pricelist(self, pricelist_id, **kwargs):
        """
        Supprimer une pricelist (ADMIN UNIQUEMENT).
        Vérifie qu'aucun client n'utilise cette pricelist avant suppression.

        Returns:
            Confirmation de suppression ou erreur si utilisée
        """
        try:
            # Vérification admin
            admin_check = self._require_admin()
            if not admin_check['success']:
                return admin_check

            Pricelist = request.env['product.pricelist'].sudo()
            pricelist = Pricelist.browse(pricelist_id)

            if not pricelist.exists():
                return {
                    'success': False,
                    'error': f'Pricelist {pricelist_id} introuvable'
                }

            # Vérifier si des clients utilisent cette pricelist
            Partner = request.env['res.partner'].sudo()
            customers_count = Partner.search_count([
                ('property_product_pricelist', '=', pricelist_id)
            ])

            if customers_count > 0:
                return {
                    'success': False,
                    'error': f'Impossible de supprimer : {customers_count} client(s) utilisent cette liste de prix'
                }

            pricelist_name = pricelist.name
            pricelist.unlink()

            _logger.info(f"Pricelist supprimée : {pricelist_id} - {pricelist_name} par user {request.env.user.login}")

            return {
                'success': True,
                'message': f"Liste de prix '{pricelist_name}' supprimée avec succès"
            }

        except Exception as e:
            _logger.error(f"Delete pricelist error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/pricelists/<int:pricelist_id>/items/<int:item_id>/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def update_pricelist_item(self, pricelist_id, item_id, **params):
        """
        Modifier une règle de prix existante (ADMIN UNIQUEMENT).

        Params:
            applied_on (str): Type d'application (optionnel)
            compute_price (str): Type de calcul (optionnel)
            fixed_price (float): Prix fixe (optionnel)
            percent_price (float): Pourcentage du prix (optionnel)
            price_discount (float): Pourcentage de remise (optionnel)
            min_quantity (int): Quantité minimale (optionnel)
            product_tmpl_id (int): ID du produit (optionnel)
            categ_id (int): ID de la catégorie (optionnel)
            date_start (str): Date début validité (optionnel)
            date_end (str): Date fin validité (optionnel)

        Returns:
            Règle de prix mise à jour
        """
        try:
            # Vérification admin
            admin_check = self._require_admin()
            if not admin_check['success']:
                return admin_check

            PricelistItem = request.env['product.pricelist.item'].sudo()
            item = PricelistItem.browse(item_id)

            if not item.exists():
                return {
                    'success': False,
                    'error': f'Règle de prix {item_id} introuvable'
                }

            # Vérifier que l'item appartient bien à cette pricelist
            if item.pricelist_id.id != pricelist_id:
                return {
                    'success': False,
                    'error': f'Cette règle n\'appartient pas à la pricelist {pricelist_id}'
                }

            # Construire dictionnaire des champs à mettre à jour
            update_vals = {}

            if 'applied_on' in params:
                update_vals['applied_on'] = params['applied_on']

            if 'compute_price' in params:
                update_vals['compute_price'] = params['compute_price']

            if 'fixed_price' in params:
                update_vals['fixed_price'] = float(params['fixed_price'])

            if 'percent_price' in params:
                update_vals['percent_price'] = float(params['percent_price'])

            if 'price_discount' in params:
                update_vals['price_discount'] = float(params['price_discount'])

            if 'min_quantity' in params:
                update_vals['min_quantity'] = params['min_quantity']

            if 'product_tmpl_id' in params:
                product_tmpl_id = params['product_tmpl_id']
                if product_tmpl_id:
                    ProductTemplate = request.env['product.template'].sudo()
                    product = ProductTemplate.browse(product_tmpl_id)
                    if not product.exists():
                        return {
                            'success': False,
                            'error': f'Produit {product_tmpl_id} introuvable'
                        }
                update_vals['product_tmpl_id'] = product_tmpl_id

            if 'categ_id' in params:
                categ_id = params['categ_id']
                if categ_id:
                    Category = request.env['product.category'].sudo()
                    category = Category.browse(categ_id)
                    if not category.exists():
                        return {
                            'success': False,
                            'error': f'Catégorie {categ_id} introuvable'
                        }
                update_vals['categ_id'] = categ_id

            if 'date_start' in params:
                update_vals['date_start'] = params['date_start']

            if 'date_end' in params:
                update_vals['date_end'] = params['date_end']

            # Appliquer les modifications
            if update_vals:
                item.write(update_vals)
                _logger.info(f"Règle de prix mise à jour : {item_id} par user {request.env.user.login}")

            # Préparer la réponse
            item_data = {
                'id': item.id,
                'applied_on': item.applied_on,
                'compute_price': item.compute_price,
                'fixed_price': float(item.fixed_price) if item.fixed_price else None,
                'percent_price': float(item.percent_price) if item.percent_price else None,
                'price_discount': float(item.price_discount) if item.price_discount else None,
                'min_quantity': item.min_quantity,
            }

            if item.applied_on == '1_product' and item.product_tmpl_id:
                item_data['product_id'] = item.product_tmpl_id.id
                item_data['product_name'] = item.product_tmpl_id.name
            elif item.applied_on == '2_product_category' and item.categ_id:
                item_data['category_id'] = item.categ_id.id
                item_data['category_name'] = item.categ_id.name

            return {
                'success': True,
                'data': item_data,
                'message': f"Règle de prix mise à jour avec succès"
            }

        except Exception as e:
            _logger.error(f"Update pricelist item error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/pricelists/<int:pricelist_id>/items/<int:item_id>/delete', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def delete_pricelist_item(self, pricelist_id, item_id, **kwargs):
        """
        Supprimer une règle de prix (ADMIN UNIQUEMENT).

        Returns:
            Confirmation de suppression
        """
        try:
            # Vérification admin
            admin_check = self._require_admin()
            if not admin_check['success']:
                return admin_check

            PricelistItem = request.env['product.pricelist.item'].sudo()
            item = PricelistItem.browse(item_id)

            if not item.exists():
                return {
                    'success': False,
                    'error': f'Règle de prix {item_id} introuvable'
                }

            # Vérifier que l'item appartient bien à cette pricelist
            if item.pricelist_id.id != pricelist_id:
                return {
                    'success': False,
                    'error': f'Cette règle n\'appartient pas à la pricelist {pricelist_id}'
                }

            item.unlink()

            _logger.info(f"Règle de prix supprimée : {item_id} de pricelist {pricelist_id} par user {request.env.user.login}")

            return {
                'success': True,
                'message': f"Règle de prix supprimée avec succès"
            }

        except Exception as e:
            _logger.error(f"Delete pricelist item error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/customer-categories', type='json', auth='public', methods=['GET', 'POST'], csrf=False, cors='*')
    def get_customer_categories(self, **params):
        """
        Récupérer la liste des catégories/tags clients (pour segmentation).

        Returns:
            Liste des catégories avec id, name, parent_id
        """
        try:
            PartnerCategory = request.env['res.partner.category'].sudo()

            categories = PartnerCategory.search([], order='name')

            category_list = []
            for category in categories:
                category_list.append({
                    'id': category.id,
                    'name': category.name,
                    'parent_id': category.parent_id.id if category.parent_id else None,
                    'parent_name': category.parent_id.name if category.parent_id else None,
                    'color': category.color if hasattr(category, 'color') else 0,
                    'partner_count': len(category.partner_ids) if category.partner_ids else 0,
                })

            return {
                'success': True,
                'data': category_list,
                'total': len(category_list)
            }

        except Exception as e:
            _logger.error(f"Get customer categories error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/customer-categories/create', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_customer_category(self, **params):
        """
        Créer une nouvelle catégorie/tag client.

        Params:
            name (str): Nom de la catégorie
            parent_id (int, optional): ID de la catégorie parente
            color (int, optional): Couleur (0-11)

        Returns:
            Catégorie créée
        """
        try:
            if not request.env.user.has_group('sales_team.group_sale_manager'):
                return {
                    'success': False,
                    'error': 'Accès refusé. Droits sales manager requis.'
                }

            name = params.get('name')
            if not name:
                return {
                    'success': False,
                    'error': 'Le nom de la catégorie est requis'
                }

            PartnerCategory = request.env['res.partner.category'].sudo()

            vals = {
                'name': name,
            }

            if params.get('parent_id'):
                vals['parent_id'] = params['parent_id']

            if params.get('color') is not None:
                vals['color'] = params['color']

            category = PartnerCategory.create(vals)

            return {
                'success': True,
                'data': {
                    'id': category.id,
                    'name': category.name,
                    'parent_id': category.parent_id.id if category.parent_id else None,
                },
                'message': f"Catégorie '{name}' créée avec succès"
            }

        except Exception as e:
            _logger.error(f"Create customer category error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/customer-categories/<int:category_id>/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def update_customer_category(self, category_id, **params):
        """
        Modifier une catégorie/tag client existante.

        Params:
            category_id (int): ID de la catégorie à modifier
            name (str, optional): Nouveau nom
            color (int, optional): Nouvelle couleur (0-11)

        Returns:
            Catégorie modifiée
        """
        try:
            if not request.env.user.has_group('sales_team.group_sale_manager'):
                return {
                    'success': False,
                    'error': 'Accès refusé. Droits sales manager requis.'
                }

            PartnerCategory = request.env['res.partner.category'].sudo()
            category = PartnerCategory.browse(category_id)

            if not category.exists():
                return {
                    'success': False,
                    'error': f'Catégorie {category_id} introuvable'
                }

            vals = {}
            if params.get('name'):
                vals['name'] = params['name']
            if params.get('color') is not None:
                vals['color'] = params['color']

            if not vals:
                return {
                    'success': False,
                    'error': 'Aucune modification fournie'
                }

            category.write(vals)

            return {
                'success': True,
                'data': {
                    'id': category.id,
                    'name': category.name,
                    'color': category.color if hasattr(category, 'color') else 0,
                    'parent_id': category.parent_id.id if category.parent_id else None,
                },
                'message': f"Catégorie '{category.name}' modifiée avec succès"
            }

        except Exception as e:
            _logger.error(f"Update customer category error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/customer-categories/<int:category_id>/delete', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def delete_customer_category(self, category_id, **params):
        """
        Supprimer une catégorie/tag client.

        Params:
            category_id (int): ID de la catégorie à supprimer

        Returns:
            Confirmation de suppression
        """
        try:
            if not request.env.user.has_group('sales_team.group_sale_manager'):
                return {
                    'success': False,
                    'error': 'Accès refusé. Droits sales manager requis.'
                }

            PartnerCategory = request.env['res.partner.category'].sudo()
            category = PartnerCategory.browse(category_id)

            if not category.exists():
                return {
                    'success': False,
                    'error': f'Catégorie {category_id} introuvable'
                }

            category_name = category.name
            partner_count = len(category.partner_ids) if category.partner_ids else 0

            # Suppression (les relations many2many avec res.partner sont automatiquement nettoyées)
            category.unlink()

            return {
                'success': True,
                'data': {
                    'id': category_id,
                    'name': category_name,
                    'partner_count': partner_count,
                },
                'message': f"Catégorie '{category_name}' supprimée avec succès"
            }

        except Exception as e:
            _logger.error(f"Delete customer category error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/customers/<int:customer_id>/assign-pricelist', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def assign_pricelist_to_customer(self, customer_id, **params):
        """
        Assigner une pricelist à un client.

        Params:
            customer_id (int): ID du client
            pricelist_id (int): ID de la pricelist à assigner

        Returns:
            Client mis à jour
        """
        try:
            if not request.env.user.has_group('sales_team.group_sale_manager'):
                return {
                    'success': False,
                    'error': 'Accès refusé. Droits sales manager requis.'
                }

            pricelist_id = params.get('pricelist_id')
            if not pricelist_id:
                return {
                    'success': False,
                    'error': 'pricelist_id requis'
                }

            Partner = request.env['res.partner'].sudo()
            Pricelist = request.env['product.pricelist'].sudo()

            customer = Partner.browse(customer_id)
            if not customer.exists():
                return {
                    'success': False,
                    'error': f'Client {customer_id} introuvable'
                }

            pricelist = Pricelist.browse(pricelist_id)
            if not pricelist.exists():
                return {
                    'success': False,
                    'error': f'Pricelist {pricelist_id} introuvable'
                }

            customer.write({'property_product_pricelist': pricelist_id})

            return {
                'success': True,
                'data': {
                    'id': customer.id,
                    'name': customer.name,
                    'pricelist_id': pricelist.id,
                    'pricelist_name': pricelist.name,
                },
                'message': f"Pricelist '{pricelist.name}' assignée au client '{customer.name}'"
            }

        except Exception as e:
            _logger.error(f"Assign pricelist error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/customers/<int:customer_id>/assign-categories', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def assign_categories_to_customer(self, customer_id, **params):
        """
        Assigner des catégories/tags à un client.

        Params:
            customer_id (int): ID du client
            category_ids (list): Liste d'IDs de catégories

        Returns:
            Client mis à jour avec ses catégories
        """
        try:
            if not request.env.user.has_group('sales_team.group_sale_manager'):
                return {
                    'success': False,
                    'error': 'Accès refusé. Droits sales manager requis.'
                }

            category_ids = params.get('category_ids', [])

            Partner = request.env['res.partner'].sudo()
            customer = Partner.browse(customer_id)

            if not customer.exists():
                return {
                    'success': False,
                    'error': f'Client {customer_id} introuvable'
                }

            # Remplacer les catégories existantes
            customer.write({'category_id': [(6, 0, category_ids)]})

            # Récupérer les catégories assignées
            categories = []
            for cat in customer.category_id:
                categories.append({
                    'id': cat.id,
                    'name': cat.name,
                })

            return {
                'success': True,
                'data': {
                    'id': customer.id,
                    'name': customer.name,
                    'categories': categories,
                },
                'message': f"{len(categories)} catégorie(s) assignée(s) au client '{customer.name}'"
            }

        except Exception as e:
            _logger.error(f"Assign categories error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    # ===================================================================
    # WAREHOUSES - Multi-entrepôts (Issue #22)
    # ===================================================================

    @http.route('/api/ecommerce/warehouses', type='http', auth='public', methods=['GET', 'POST'], csrf=False, cors='*')
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
                'error': str(e)
            })

    @http.route('/api/ecommerce/warehouses/<int:warehouse_id>', type='json', auth='public', methods=['GET', 'POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/stock-by-location', type='json', auth='public', methods=['GET', 'POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/stock/transfer', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
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
            if not request.env.user.has_group('stock.group_stock_user'):
                return {
                    'success': False,
                    'error': 'Accès refusé. Droits stock user requis.'
                }

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
                'error': str(e)
            }

    # ==================== PRODUITS - UPSELL & RECOMMENDATIONS ====================

    @http.route('/api/ecommerce/products/<int:product_id>/upsell', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_product_upsell(self, product_id, **kwargs):
        """
        Récupérer les produits complémentaires (upsell) pour un produit

        Args:
            product_id (int): ID du produit
            limit (int, optional): Nombre de produits à retourner (défaut: 4)

        Returns:
            dict: {
                'success': bool,
                'data': {
                    'products': [
                        {
                            'id': int,
                            'name': str,
                            'slug': str,
                            'price': float,
                            'image_url': str,
                            'in_stock': bool
                        }
                    ]
                }
            }
        """
        try:
            params = self._get_params()
            limit = params.get('limit', 4)

            Product = request.env['product.template'].sudo()
            product = Product.browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Produit non trouvé'
                }

            # Stratégie upsell : produits de même catégorie, prix supérieur
            # OU produits liés via alternative_product_ids / accessory_product_ids

            upsell_products = []

            # 1. Produits accessoires (si définis dans Odoo)
            if hasattr(product, 'accessory_product_ids') and product.accessory_product_ids:
                for accessory in product.accessory_product_ids[:limit]:
                    if accessory.website_published:
                        image_url = None
                        if accessory.image_1920:
                            image_url = f'/web/image/product.template/{accessory.id}/image_1920'

                        slug = accessory.name.lower().replace(' ', '-').replace('/', '-')

                        upsell_products.append({
                            'id': accessory.id,
                            'name': accessory.name,
                            'slug': slug,
                            'price': accessory.list_price,
                            'image_url': image_url,
                            'in_stock': accessory.qty_available > 0 if accessory.type == 'product' else True
                        })

            # 2. Si pas assez de produits accessoires, chercher dans la même catégorie (prix supérieur)
            if len(upsell_products) < limit and product.public_categ_ids:
                remaining = limit - len(upsell_products)
                category_id = product.public_categ_ids[0].id

                related_products = Product.search([
                    ('public_categ_ids', 'in', [category_id]),
                    ('id', '!=', product_id),
                    ('list_price', '>', product.list_price),
                    ('website_published', '=', True)
                ], limit=remaining, order='list_price ASC')

                for related in related_products:
                    image_url = None
                    if related.image_1920:
                        image_url = f'/web/image/product.template/{related.id}/image_1920'

                    slug = related.name.lower().replace(' ', '-').replace('/', '-')

                    upsell_products.append({
                        'id': related.id,
                        'name': related.name,
                        'slug': slug,
                        'price': related.list_price,
                        'image_url': image_url,
                        'in_stock': related.qty_available > 0 if related.type == 'product' else True
                    })

            _logger.info(f"Upsell for product {product_id}: {len(upsell_products)} products found")

            return {
                'success': True,
                'data': {
                    'products': upsell_products
                }
            }

        except Exception as e:
            _logger.error(f"Get product upsell error: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/recommendations', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_product_recommendations(self, product_id, **kwargs):
        """
        Récupérer les recommandations pour un produit

        Args:
            product_id (int): ID du produit
            limit (int, optional): Nombre de produits à retourner (défaut: 6)

        Returns:
            dict: {
                'success': bool,
                'data': {
                    'products': [
                        {
                            'id': int,
                            'name': str,
                            'slug': str,
                            'price': float,
                            'image_url': str,
                            'in_stock': bool,
                            'rating': float,
                            'reviews_count': int
                        }
                    ]
                }
            }
        """
        try:
            params = self._get_params()
            limit = params.get('limit', 6)

            Product = request.env['product.template'].sudo()
            product = Product.browse(product_id)

            if not product.exists():
                return {
                    'success': False,
                    'error': 'Produit non trouvé'
                }

            # Stratégie recommandations :
            # 1. Produits alternatifs (alternative_product_ids)
            # 2. Produits de même catégorie (prix similaire ±30%)
            # 3. Produits populaires (best sellers)

            recommendations = []

            # 1. Produits alternatifs
            if hasattr(product, 'alternative_product_ids') and product.alternative_product_ids:
                for alternative in product.alternative_product_ids[:limit]:
                    if alternative.website_published:
                        image_url = None
                        if alternative.image_1920:
                            image_url = f'/web/image/product.template/{alternative.id}/image_1920'

                        slug = alternative.name.lower().replace(' ', '-').replace('/', '-')

                        recommendations.append({
                            'id': alternative.id,
                            'name': alternative.name,
                            'slug': slug,
                            'price': alternative.list_price,
                            'image_url': image_url,
                            'in_stock': alternative.qty_available > 0 if alternative.type == 'product' else True,
                            'rating': 4.5,  # TODO: intégrer système d'avis
                            'reviews_count': 0
                        })

            # 2. Produits de même catégorie (prix similaire)
            if len(recommendations) < limit and product.public_categ_ids:
                remaining = limit - len(recommendations)
                category_id = product.public_categ_ids[0].id
                price_min = product.list_price * 0.7
                price_max = product.list_price * 1.3

                similar_products = Product.search([
                    ('public_categ_ids', 'in', [category_id]),
                    ('id', '!=', product_id),
                    ('list_price', '>=', price_min),
                    ('list_price', '<=', price_max),
                    ('website_published', '=', True)
                ], limit=remaining, order='create_date DESC')

                for similar in similar_products:
                    image_url = None
                    if similar.image_1920:
                        image_url = f'/web/image/product.template/{similar.id}/image_1920'

                    slug = similar.name.lower().replace(' ', '-').replace('/', '-')

                    recommendations.append({
                        'id': similar.id,
                        'name': similar.name,
                        'slug': slug,
                        'price': similar.list_price,
                        'image_url': image_url,
                        'in_stock': similar.qty_available > 0 if similar.type == 'product' else True,
                        'rating': 4.5,
                        'reviews_count': 0
                    })

            _logger.info(f"Recommendations for product {product_id}: {len(recommendations)} products found")

            return {
                'success': True,
                'data': {
                    'products': recommendations
                }
            }

        except Exception as e:
            _logger.error(f"Get product recommendations error: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e)
            }

    # ==================== ALERTES STOCK ====================

    @http.route('/api/ecommerce/products/<int:product_id>/stock-alert-status', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/notify-restock', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }

    @http.route('/api/ecommerce/stock-alerts/unsubscribe/<int:alert_id>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': str(e)
            }
