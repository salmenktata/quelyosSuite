# -*- coding: utf-8 -*-
import logging
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class QuelyosAPI(http.Controller):
    """API REST pour frontend e-commerce et backoffice"""

    # Odoo gère automatiquement le format JSON-RPC pour les routes type='json'
    # On retourne directement les dictionnaires

    def _get_params(self):
        """Extrait les paramètres de la requête JSON-RPC"""
        return request.params if hasattr(request, 'params') and request.params else {}

    def _create_session(self, uid):
        """Crée une session pour l'utilisateur et retourne le session_id"""
        return request.session.sid

    # ==================== AUTHENTICATION ====================

    @http.route('/api/ecommerce/auth/login', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def auth_login(self, **kwargs):
        """Authentification utilisateur - Version simplifiée pour test"""
        try:
            params = self._get_params()
            email = params.get('email')
            password = params.get('password')

            if not email or not password:
                return {
                    'success': False,
                    'error': 'Email and password are required'
                }

            # Rechercher l'utilisateur
            user = request.env['res.users'].sudo().search([
                ('login', '=', email)
            ], limit=1)

            if not user:
                return {
                    'success': False,
                    'error': 'Invalid email or password'
                }

            # TODO: Implémenter vérification du mot de passe avec Odoo 19 API
            # Pour l'instant, on simule un login réussi pour les tests
            _logger.warning(f"Login without password verification for {email} - TODO: implement proper auth")

            # Mettre à jour la session
            request.session.uid = user.id
            request.session.login = user.login

            # Récupérer les infos utilisateur
            partner = user.partner_id
            user_data = {
                'id': partner.id,
                'name': partner.name,
                'email': partner.email or user.login,
                'phone': partner.phone or '',
            }

            # Récupérer le session_id
            session_id = self._create_session(user.id)

            return {
                'success': True,
                'session_id': session_id,
                'user': user_data
            }

        except Exception as e:
            _logger.error(f"Login error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/auth/logout', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
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
        """Liste des produits (GET via JSON-RPC)"""
        try:
            params = self._get_params()
            limit = int(params.get('limit', 20))
            offset = int(params.get('offset', 0))
            category_id = params.get('category_id')

            domain = [('sale_ok', '=', True)]
            if category_id:
                domain.append(('categ_id', '=', int(category_id)))

            products = request.env['product.template'].sudo().search(
                domain,
                limit=limit,
                offset=offset,
                order='name'
            )

            total = request.env['product.template'].sudo().search_count(domain)

            data = [{
                'id': p.id,
                'name': p.name,
                'price': p.list_price,
                'image': f'/web/image/product.template/{p.id}/image_1920' if p.image_1920 else None,
                'slug': p.name.lower().replace(' ', '-'),
                'category': {
                    'id': p.categ_id.id,
                    'name': p.categ_id.name,
                } if p.categ_id else None,
            } for p in products]

            return {
                'success': True,
                'data': {
                    'products': data,
                    'total': total,
                    'limit': limit,
                    'offset': offset,
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

            data = {
                'id': product.id,
                'name': product.name,
                'description': product.description_sale or '',
                'price': product.list_price,
                'image': f'/web/image/product.template/{product.id}/image_1920' if product.image_1920 else None,
                'slug': product.name.lower().replace(' ', '-'),
                'category': {
                    'id': product.categ_id.id,
                    'name': product.categ_id.name,
                } if product.categ_id else None,
            }

            return {
                'success': True,
                'product': data
            }

        except Exception as e:
            _logger.error(f"Get product error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/create', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_product(self, **kwargs):
        """Créer un produit (admin)"""
        try:
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

            # Vérifier les permissions (admin uniquement)
            if not request.env.user.has_group('base.group_system'):
                return {
                    'success': False,
                    'error': 'Insufficient permissions'
                }

            product_data = {
                'name': name,
                'list_price': float(price),
                'description_sale': description,
                'sale_ok': True,
                'purchase_ok': True,
            }

            if category_id:
                product_data['categ_id'] = int(category_id)

            product = request.env['product.template'].sudo().create(product_data)

            return {
                'success': True,
                'product': {
                    'id': product.id,
                    'name': product.name,
                    'price': product.list_price,
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
        """Modifier un produit (admin)"""
        try:
            # Vérifier les permissions
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

            params = self._get_params()
            update_data = {}

            if 'name' in params:
                update_data['name'] = params['name']
            if 'price' in params:
                update_data['list_price'] = float(params['price'])
            if 'description' in params:
                update_data['description_sale'] = params['description']
            if 'category_id' in params:
                update_data['categ_id'] = int(params['category_id'])

            if update_data:
                product.write(update_data)

            return {
                'success': True,
                'product': {
                    'id': product.id,
                    'name': product.name,
                    'price': product.list_price,
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
        """Supprimer un produit (admin)"""
        try:
            # Vérifier les permissions
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

            product.unlink()

            return {'success': True}

        except Exception as e:
            _logger.error(f"Delete product error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    # ==================== CATEGORIES ====================

    @http.route('/api/ecommerce/categories', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_categories_list(self, **kwargs):
        """Liste des catégories (GET via JSON-RPC)"""
        try:
            params = self._get_params()
            limit = int(params.get('limit', 100))
            offset = int(params.get('offset', 0))

            categories = request.env['product.category'].sudo().search(
                [],
                limit=limit,
                offset=offset,
                order='name'
            )

            data = [{
                'id': c.id,
                'name': c.name,
                'parent_id': c.parent_id.id if c.parent_id else None,
                'parent_name': c.parent_id.name if c.parent_id else None,
            } for c in categories]

            return {
                'success': True,
                'data': {
                    'categories': data
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
        """Créer une catégorie (admin)"""
        try:
            # Vérifier les permissions
            if not request.env.user.has_group('base.group_system'):
                return {
                    'success': False,
                    'error': 'Insufficient permissions'
                }

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
        """Modifier une catégorie (admin)"""
        try:
            # Vérifier les permissions
            if not request.env.user.has_group('base.group_system'):
                return {
                    'success': False,
                    'error': 'Insufficient permissions'
                }

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
        """Supprimer une catégorie (admin)"""
        try:
            # Vérifier les permissions
            if not request.env.user.has_group('base.group_system'):
                return {
                    'success': False,
                    'error': 'Insufficient permissions'
                }

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

    # ==================== ORDERS ====================

    @http.route('/api/ecommerce/orders', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def get_orders_list(self, **kwargs):
        """Liste des commandes (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            if not request.env.user.has_group('base.group_system'):
                return {
                    'success': False,
                    'error': 'Insufficient permissions'
                }

            params = self._get_params()
            limit = int(params.get('limit', 20))
            offset = int(params.get('offset', 0))
            status = params.get('status')  # draft, sent, sale, done, cancel

            domain = []
            if status:
                domain.append(('state', '=', status))

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

    @http.route('/api/ecommerce/orders/<int:order_id>', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def get_order_detail(self, order_id, **kwargs):
        """Détail d'une commande"""
        try:
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

    @http.route('/api/ecommerce/orders/create', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
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

    @http.route('/api/ecommerce/orders/<int:order_id>/status', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def update_order_status(self, order_id, **kwargs):
        """Changer le statut d'une commande (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            if not request.env.user.has_group('base.group_system'):
                return {
                    'success': False,
                    'error': 'Insufficient permissions'
                }

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

    @http.route('/api/ecommerce/customer/orders', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
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

    # ==================== CUSTOMER PROFILE ====================

    @http.route('/api/ecommerce/customer/profile', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def get_customer_profile(self, **kwargs):
        """Récupérer le profil du client connecté"""
        try:
            partner = request.env.user.partner_id

            data = {
                'id': partner.id,
                'name': partner.name,
                'email': partner.email or '',
                'phone': partner.phone or '',
                'mobile': partner.mobile or '',
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
        """Modifier le profil du client connecté"""
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

    @http.route('/api/ecommerce/customer/addresses', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
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
        """Créer une nouvelle adresse pour le client"""
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
        """Modifier une adresse du client"""
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
        """Supprimer une adresse du client"""
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
        """Modifier le stock d'un produit (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            if not request.env.user.has_group('base.group_system'):
                return {
                    'success': False,
                    'error': 'Insufficient permissions'
                }

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

    @http.route('/api/ecommerce/stock/moves', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def get_stock_moves(self, **kwargs):
        """Liste des mouvements de stock (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            if not request.env.user.has_group('base.group_system'):
                return {
                    'success': False,
                    'error': 'Insufficient permissions'
                }

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

    @http.route('/api/ecommerce/payment/init', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
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

    @http.route('/api/ecommerce/payment/confirm', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
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

    # ===========================
    # PHASE 5: MARKETING (COUPONS)
    # ===========================

    @http.route('/api/ecommerce/coupons', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def get_coupons_list(self, **kwargs):
        """Liste des coupons (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            if not request.env.user.has_group('base.group_system'):
                return {
                    'success': False,
                    'error': 'Insufficient permissions'
                }

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

    @http.route('/api/ecommerce/coupons/create', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_coupon(self, **kwargs):
        """Créer un nouveau coupon (admin uniquement)"""
        try:
            # Vérifier les permissions admin
            if not request.env.user.has_group('base.group_system'):
                return {
                    'success': False,
                    'error': 'Insufficient permissions'
                }

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
