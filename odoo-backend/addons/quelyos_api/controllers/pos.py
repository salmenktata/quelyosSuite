# -*- coding: utf-8 -*-
"""
API REST pour le Point de Vente (POS).

Endpoints pour le frontend React :
- Configuration et sessions
- Catalogue produits
- Commandes et paiements
- Synchronisation offline
- Dashboard et rapports
"""

import logging
from odoo import http, fields
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class POSController(BaseController):
    """API REST pour le module Point de Vente"""

    # ═══════════════════════════════════════════════════════════════════════════
    # TEST ENDPOINT
    # ═══════════════════════════════════════════════════════════════════════════

    @http.route('/api/pos/test', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def test_pos(self, **kwargs):
        """Endpoint de test pour le POS"""
        _logger.info("POS test endpoint called")
        return {'success': True, 'message': 'POS controller is working'}

    # ═══════════════════════════════════════════════════════════════════════════
    # CONFIGURATION & TERMINAUX
    # ═══════════════════════════════════════════════════════════════════════════

    @http.route('/api/pos/configs', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_pos_configs(self, **kwargs):
        """
        Liste des terminaux POS accessibles par l'utilisateur.
        Filtre automatiquement selon les permissions.
        """
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            user = request.env.user
            POSConfig = request.env['quelyos.pos.config'].sudo()

            # Récupérer les terminaux actifs pour la company de l'utilisateur
            configs = POSConfig.search([
                ('company_id', '=', user.company_id.id),
                ('active', '=', True),
            ])

            # Filtrer selon les permissions
            accessible_configs = configs.filtered(lambda c: c.can_user_access(user))

            return {
                'success': True,
                'data': [c.to_frontend_dict() for c in accessible_configs],
                'total': len(accessible_configs),
            }

        except Exception as e:
            _logger.error(f"Error fetching POS configs: {e}", exc_info=True)
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/pos/config/<int:config_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_pos_config(self, config_id, **kwargs):
        """Détails d'un terminal POS"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            config = request.env['quelyos.pos.config'].sudo().browse(config_id)
            if not config.exists():
                return {'success': False, 'error': 'Terminal non trouvé'}

            if not config.can_user_access(request.env.user):
                return {'success': False, 'error': 'Accès non autorisé'}

            return {
                'success': True,
                'data': config.to_frontend_dict(),
            }

        except Exception as e:
            _logger.error(f"Error fetching POS config {config_id}: {e}", exc_info=True)
            return {'success': False, 'error': 'Erreur serveur'}

    # ═══════════════════════════════════════════════════════════════════════════
    # SESSIONS
    # ═══════════════════════════════════════════════════════════════════════════

    @http.route('/api/pos/session/open', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def open_session(self, config_id, opening_cash=0, notes=None, **kwargs):
        """
        Ouvre une nouvelle session de caisse.

        Args:
            config_id: ID du terminal
            opening_cash: Montant du fond de caisse initial
            notes: Notes optionnelles
        """
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            config = request.env['quelyos.pos.config'].sudo().browse(config_id)
            if not config.exists():
                return {'success': False, 'error': 'Terminal non trouvé'}

            if not config.can_user_access(request.env.user):
                return {'success': False, 'error': 'Accès non autorisé'}

            # Vérifier qu'il n'y a pas déjà une session ouverte
            if config.current_session_id:
                return {
                    'success': False,
                    'error': 'Une session est déjà ouverte sur ce terminal',
                    'existingSessionId': config.current_session_id.id,
                }

            # Créer la session
            session = request.env['quelyos.pos.session'].sudo().create({
                'config_id': config_id,
                'user_id': request.env.user.id,
                'opening_cash': opening_cash,
                'opening_notes': notes,
            })

            # Ouvrir la session
            session.action_open()

            return {
                'success': True,
                'data': {
                    'session': session.to_frontend_dict(),
                    'config': config.to_frontend_dict(),
                },
                'message': f"Session {session.name} ouverte avec succès",
            }

        except Exception as e:
            _logger.error(f"Error opening POS session: {e}", exc_info=True)
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/pos/session/close', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def close_session(self, session_id, closing_cash, notes=None, **kwargs):
        """
        Ferme une session de caisse.

        Args:
            session_id: ID de la session
            closing_cash: Montant compté en caisse
            notes: Notes de fermeture (écarts, incidents)
        """
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            session = request.env['quelyos.pos.session'].sudo().browse(session_id)
            if not session.exists():
                return {'success': False, 'error': 'Session non trouvée'}

            if session.state not in ['opened', 'closing']:
                return {'success': False, 'error': 'Cette session ne peut pas être fermée'}

            # Passer en mode fermeture si pas déjà fait
            if session.state == 'opened':
                session.action_start_closing()

            # Mettre à jour et fermer
            session.write({
                'closing_cash': closing_cash,
                'closing_notes': notes,
            })
            session.action_close()

            # Récupérer le rapport Z
            z_report = session.get_z_report_data()

            return {
                'success': True,
                'data': {
                    'session': session.to_frontend_dict(),
                    'zReport': z_report,
                },
                'message': f"Session {session.name} fermée avec succès",
            }

        except Exception as e:
            _logger.error(f"Error closing POS session: {e}", exc_info=True)
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/pos/session/<int:session_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_session(self, session_id, **kwargs):
        """Détails d'une session"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            session = request.env['quelyos.pos.session'].sudo().browse(session_id)
            if not session.exists():
                return {'success': False, 'error': 'Session non trouvée'}

            return {
                'success': True,
                'data': session.to_frontend_dict(),
            }

        except Exception as e:
            _logger.error(f"Error fetching session {session_id}: {e}", exc_info=True)
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/pos/sessions', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_sessions(self, config_id=None, state=None, limit=50, offset=0, **kwargs):
        """Liste des sessions avec filtres"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            domain = [('company_id', '=', request.env.user.company_id.id)]

            if config_id:
                domain.append(('config_id', '=', config_id))
            if state:
                if isinstance(state, list):
                    domain.append(('state', 'in', state))
                else:
                    domain.append(('state', '=', state))

            Session = request.env['quelyos.pos.session'].sudo()
            total = Session.search_count(domain)
            sessions = Session.search(domain, limit=limit, offset=offset, order='id desc')

            return {
                'success': True,
                'data': {
                    'sessions': [s.to_frontend_summary() for s in sessions],
                    'total': total,
                    'limit': limit,
                    'offset': offset,
                },
            }

        except Exception as e:
            _logger.error(f"Error fetching sessions: {e}", exc_info=True)
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/pos/sessions/active', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_active_sessions(self, **kwargs):
        """Liste des sessions ouvertes uniquement"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            domain = [
                ('company_id', '=', request.env.user.company_id.id),
                ('state', '=', 'opened'),
            ]

            Session = request.env['quelyos.pos.session'].sudo()
            sessions = Session.search(domain, order='id desc')

            return {
                'success': True,
                'data': [s.to_frontend_summary() for s in sessions],
            }

        except Exception as e:
            _logger.error(f"Error fetching active sessions: {e}", exc_info=True)
            return {'success': False, 'error': 'Erreur serveur'}

    # ═══════════════════════════════════════════════════════════════════════════
    # PRODUITS & CATALOGUE
    # ═══════════════════════════════════════════════════════════════════════════

    @http.route('/api/pos/products', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_products(self, config_id, category_id=None, search=None, limit=100, offset=0, **kwargs):
        """
        Catalogue produits pour le POS avec stock en temps réel.

        Args:
            config_id: ID du terminal (pour pricelist et warehouse)
            category_id: Filtrer par catégorie (optionnel)
            search: Recherche textuelle (optionnel)
            limit: Nombre max de produits
            offset: Pagination
        """
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            config = request.env['quelyos.pos.config'].sudo().browse(config_id)
            if not config.exists():
                return {'success': False, 'error': 'Terminal non trouvé'}

            Product = request.env['product.product'].sudo()

            # Domaine de base
            domain = [
                ('sale_ok', '=', True),
                ('active', '=', True),
                '|', ('company_id', '=', config.company_id.id), ('company_id', '=', False),
            ]

            # Filtre catégorie
            if category_id:
                domain.append(('categ_id', 'child_of', category_id))

            # Recherche textuelle
            if search:
                domain.append('|')
                domain.append('|')
                domain.append(('name', 'ilike', search))
                domain.append(('default_code', 'ilike', search))
                domain.append(('barcode', '=', search))

            total = Product.search_count(domain)
            products = Product.search(domain, limit=limit, offset=offset, order='name')

            # Récupérer les prix et stocks
            pricelist = config.pricelist_id
            warehouse = config.warehouse_id

            result = []
            for product in products:
                # Prix selon pricelist
                price = pricelist._get_product_price(product, 1.0) if pricelist else product.list_price

                # Stock disponible dans l'entrepôt du terminal
                stock_qty = product.with_context(warehouse=warehouse.id).qty_available if warehouse else 0

                result.append({
                    'id': product.id,
                    'name': product.name,
                    'sku': product.default_code or '',
                    'barcode': product.barcode or '',
                    'price': price,
                    'listPrice': product.list_price,
                    'stockQuantity': stock_qty,
                    'categoryId': product.categ_id.id,
                    'categoryName': product.categ_id.name,
                    'imageUrl': f"/web/image/product.product/{product.id}/image_256" if product.image_256 else None,
                    'taxIds': product.taxes_id.ids,
                    'type': product.type,
                })

            return {
                'success': True,
                'data': {
                    'products': result,
                    'total': total,
                    'limit': limit,
                    'offset': offset,
                },
            }

        except Exception as e:
            _logger.error(f"Error fetching POS products: {e}", exc_info=True)
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/pos/product/barcode', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_product_by_barcode(self, barcode, config_id, **kwargs):
        """
        Recherche un produit par code-barres.

        Args:
            barcode: Code-barres scanné
            config_id: ID du terminal (pour prix et stock)
        """
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            config = request.env['quelyos.pos.config'].sudo().browse(config_id)
            if not config.exists():
                return {'success': False, 'error': 'Terminal non trouvé'}

            Product = request.env['product.product'].sudo()

            # Chercher par barcode exact ou default_code
            product = Product.search([
                '|',
                ('barcode', '=', barcode),
                ('default_code', '=', barcode),
                ('sale_ok', '=', True),
                ('active', '=', True),
            ], limit=1)

            if not product:
                return {
                    'success': False,
                    'error': f'Aucun produit trouvé pour le code: {barcode}',
                    'error_code': 'PRODUCT_NOT_FOUND',
                }

            # Prix et stock
            pricelist = config.pricelist_id
            warehouse = config.warehouse_id
            price = pricelist._get_product_price(product, 1.0) if pricelist else product.list_price
            stock_qty = product.with_context(warehouse=warehouse.id).qty_available if warehouse else 0

            return {
                'success': True,
                'data': {
                    'id': product.id,
                    'name': product.name,
                    'sku': product.default_code or '',
                    'barcode': product.barcode or '',
                    'price': price,
                    'stockQuantity': stock_qty,
                    'imageUrl': f"/web/image/product.product/{product.id}/image_256" if product.image_256 else None,
                    'taxIds': product.taxes_id.ids,
                },
            }

        except Exception as e:
            _logger.error(f"Error fetching product by barcode: {e}", exc_info=True)
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/pos/categories', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_categories(self, config_id=None, **kwargs):
        """Liste des catégories de produits"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            Category = request.env['product.category'].sudo()
            categories = Category.search([], order='parent_id, name')

            result = []
            for cat in categories:
                result.append({
                    'id': cat.id,
                    'name': cat.name,
                    'completeName': cat.complete_name,
                    'parentId': cat.parent_id.id if cat.parent_id else None,
                })

            return {
                'success': True,
                'data': result,
            }

        except Exception as e:
            _logger.error(f"Error fetching categories: {e}", exc_info=True)
            return {'success': False, 'error': 'Erreur serveur'}

    # ═══════════════════════════════════════════════════════════════════════════
    # COMMANDES
    # ═══════════════════════════════════════════════════════════════════════════

    @http.route('/api/pos/order/create', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def create_order(self, session_id, lines, partner_id=None, discount_type=None,
                     discount_value=None, note=None, offline_id=None, **kwargs):
        """
        Crée une commande POS.

        Args:
            session_id: ID de la session
            lines: Liste de lignes [{product_id, quantity, price_unit, discount, note}]
            partner_id: ID client (optionnel)
            discount_type: 'percent' ou 'fixed' (optionnel)
            discount_value: Valeur de la remise (optionnel)
            note: Note sur la commande (optionnel)
            offline_id: UUID pour commandes créées offline (optionnel)
        """
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            session = request.env['quelyos.pos.session'].sudo().browse(session_id)
            if not session.exists():
                return {'success': False, 'error': 'Session non trouvée'}

            if session.state not in ['opening', 'opened']:
                return {'success': False, 'error': 'La session n\'est pas ouverte'}

            if not lines:
                return {'success': False, 'error': 'La commande doit contenir au moins un article'}

            # Créer les lignes
            order_lines = []
            for line in lines:
                product = request.env['product.product'].sudo().browse(line['product_id'])
                if not product.exists():
                    return {'success': False, 'error': f"Produit {line['product_id']} non trouvé"}

                # Taxes par défaut si non spécifiées
                tax_ids = line.get('tax_ids', product.taxes_id.filtered(
                    lambda t: t.company_id == session.company_id
                ).ids)

                order_lines.append((0, 0, {
                    'product_id': line['product_id'],
                    'quantity': line.get('quantity', 1),
                    'price_unit': line.get('price_unit', product.list_price),
                    'discount': line.get('discount', 0),
                    'tax_ids': [(6, 0, tax_ids)],
                    'note': line.get('note'),
                    'offline_line_id': line.get('offline_line_id'),
                }))

            # Créer la commande
            order_vals = {
                'session_id': session_id,
                'partner_id': partner_id,
                'line_ids': order_lines,
                'discount_type': discount_type,
                'discount_value': discount_value or 0,
                'note': note,
                'offline_id': offline_id,
                'is_offline_order': bool(offline_id),
            }

            if offline_id:
                order_vals['synced_at'] = fields.Datetime.now()

            order = request.env['quelyos.pos.order'].sudo().create(order_vals)

            return {
                'success': True,
                'data': order.to_frontend_dict(),
                'message': f"Commande {order.name} créée",
            }

        except Exception as e:
            _logger.error(f"Error creating POS order: {e}", exc_info=True)
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/pos/order/<int:order_id>/pay', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def pay_order(self, order_id, payments, **kwargs):
        """
        Valide le paiement d'une commande.

        Args:
            order_id: ID de la commande
            payments: Liste de paiements [{payment_method_id, amount}]
        """
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            order = request.env['quelyos.pos.order'].sudo().browse(order_id)
            if not order.exists():
                return {'success': False, 'error': 'Commande non trouvée'}

            if order.state != 'draft':
                return {'success': False, 'error': 'Cette commande a déjà été traitée'}

            # Valider le paiement
            order.action_pay(payments)

            return {
                'success': True,
                'data': order.to_frontend_dict(),
                'message': f"Paiement validé - Rendu: {order.amount_return}",
            }

        except Exception as e:
            _logger.error(f"Error paying POS order {order_id}: {e}", exc_info=True)
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/pos/order/<int:order_id>/cancel', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def cancel_order(self, order_id, reason=None, **kwargs):
        """Annule une commande"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            order = request.env['quelyos.pos.order'].sudo().browse(order_id)
            if not order.exists():
                return {'success': False, 'error': 'Commande non trouvée'}

            order.action_cancel(reason)

            return {
                'success': True,
                'data': order.to_frontend_dict(),
                'message': 'Commande annulée',
            }

        except Exception as e:
            _logger.error(f"Error cancelling POS order {order_id}: {e}", exc_info=True)
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/pos/order/<int:order_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_order(self, order_id, **kwargs):
        """Détails d'une commande"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            order = request.env['quelyos.pos.order'].sudo().browse(order_id)
            if not order.exists():
                return {'success': False, 'error': 'Commande non trouvée'}

            return {
                'success': True,
                'data': order.to_frontend_dict(),
            }

        except Exception as e:
            _logger.error(f"Error fetching POS order {order_id}: {e}", exc_info=True)
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/pos/orders', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_orders(self, session_id=None, state=None, limit=50, offset=0, **kwargs):
        """Liste des commandes avec filtres"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            domain = [('company_id', '=', request.env.user.company_id.id)]

            if session_id:
                domain.append(('session_id', '=', session_id))
            if state:
                if isinstance(state, list):
                    domain.append(('state', 'in', state))
                else:
                    domain.append(('state', '=', state))

            Order = request.env['quelyos.pos.order'].sudo()
            total = Order.search_count(domain)
            orders = Order.search(domain, limit=limit, offset=offset, order='id desc')

            return {
                'success': True,
                'data': {
                    'orders': [o.to_frontend_summary() for o in orders],
                    'total': total,
                    'limit': limit,
                    'offset': offset,
                },
            }

        except Exception as e:
            _logger.error(f"Error fetching POS orders: {e}", exc_info=True)
            return {'success': False, 'error': 'Erreur serveur'}

    # ═══════════════════════════════════════════════════════════════════════════
    # CLIENTS
    # ═══════════════════════════════════════════════════════════════════════════

    @http.route('/api/pos/customers/search', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def search_customers(self, query, limit=20, **kwargs):
        """
        Recherche rapide de clients.

        Args:
            query: Texte de recherche (nom, email, téléphone)
            limit: Nombre max de résultats
        """
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            Partner = request.env['res.partner'].sudo()

            domain = [
                ('customer_rank', '>', 0),
                ('company_id', 'in', [request.env.user.company_id.id, False]),
                '|', '|',
                ('name', 'ilike', query),
                ('email', 'ilike', query),
                ('phone', 'ilike', query),
            ]

            customers = Partner.search(domain, limit=limit)

            result = []
            for customer in customers:
                result.append({
                    'id': customer.id,
                    'name': customer.name,
                    'email': customer.email or '',
                    'phone': customer.phone or '',
                    'loyaltyPoints': getattr(customer, 'loyalty_points', 0),
                })

            return {
                'success': True,
                'data': result,
            }

        except Exception as e:
            _logger.error(f"Error searching customers: {e}", exc_info=True)
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/pos/customer/create', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def create_customer(self, name, phone=None, email=None, **kwargs):
        """
        Création rapide d'un client en caisse.

        Args:
            name: Nom du client
            phone: Téléphone (optionnel)
            email: Email (optionnel)
        """
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            if not name:
                return {'success': False, 'error': 'Le nom est obligatoire'}

            Partner = request.env['res.partner'].sudo()

            # Vérifier si existe déjà (par email ou téléphone)
            if email:
                existing = Partner.search([('email', '=', email)], limit=1)
                if existing:
                    return {
                        'success': True,
                        'data': {
                            'id': existing.id,
                            'name': existing.name,
                            'email': existing.email,
                            'phone': existing.phone,
                            'isExisting': True,
                        },
                        'message': 'Client existant récupéré',
                    }

            customer = Partner.create({
                'name': name,
                'phone': phone,
                'email': email,
                'customer_rank': 1,
                'company_id': request.env.user.company_id.id,
            })

            return {
                'success': True,
                'data': {
                    'id': customer.id,
                    'name': customer.name,
                    'email': customer.email or '',
                    'phone': customer.phone or '',
                    'isExisting': False,
                },
                'message': 'Client créé',
            }

        except Exception as e:
            _logger.error(f"Error creating customer: {e}", exc_info=True)
            return {'success': False, 'error': 'Erreur serveur'}

    # ═══════════════════════════════════════════════════════════════════════════
    # SYNC OFFLINE
    # ═══════════════════════════════════════════════════════════════════════════

    @http.route('/api/pos/sync', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def sync_offline_orders(self, orders, **kwargs):
        """
        Synchronise les commandes créées en mode hors-ligne.

        Args:
            orders: Liste de commandes offline à synchroniser
        """
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            results = []

            for order_data in orders:
                offline_id = order_data.get('offline_id')

                # Vérifier si déjà synchronisée
                existing = request.env['quelyos.pos.order'].sudo().search([
                    ('offline_id', '=', offline_id)
                ], limit=1)

                if existing:
                    results.append({
                        'offlineId': offline_id,
                        'status': 'already_synced',
                        'orderId': existing.id,
                        'orderRef': existing.name,
                    })
                    continue

                try:
                    # Créer la commande
                    create_result = self.create_order(
                        session_id=order_data['session_id'],
                        lines=order_data['lines'],
                        partner_id=order_data.get('partner_id'),
                        discount_type=order_data.get('discount_type'),
                        discount_value=order_data.get('discount_value'),
                        note=order_data.get('note'),
                        offline_id=offline_id,
                    )

                    if create_result.get('success'):
                        order = create_result['data']

                        # Si des paiements sont inclus, les traiter
                        if order_data.get('payments') and order_data.get('is_paid'):
                            pay_result = self.pay_order(
                                order_id=order['id'],
                                payments=order_data['payments'],
                            )
                            if pay_result.get('success'):
                                order = pay_result['data']

                        results.append({
                            'offlineId': offline_id,
                            'status': 'synced',
                            'orderId': order['id'],
                            'orderRef': order['reference'],
                        })
                    else:
                        results.append({
                            'offlineId': offline_id,
                            'status': 'error',
                            'error': create_result.get('error'),
                        })

                except Exception as e:
                    results.append({
                        'offlineId': offline_id,
                        'status': 'error',
                        'error': 'Erreur serveur',
                    })

            return {
                'success': True,
                'data': {
                    'results': results,
                    'syncedCount': len([r for r in results if r['status'] == 'synced']),
                    'errorCount': len([r for r in results if r['status'] == 'error']),
                },
            }

        except Exception as e:
            _logger.error(f"Error syncing offline orders: {e}", exc_info=True)
            return {'success': False, 'error': 'Erreur serveur'}

    # ═══════════════════════════════════════════════════════════════════════════
    # DASHBOARD & RAPPORTS
    # ═══════════════════════════════════════════════════════════════════════════

    @http.route('/api/pos/dashboard', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_dashboard(self, config_id=None, date_from=None, date_to=None, **kwargs):
        """
        Statistiques dashboard POS.

        Args:
            config_id: Filtrer par terminal (optionnel)
            date_from: Date de début (optionnel, défaut: aujourd'hui)
            date_to: Date de fin (optionnel, défaut: aujourd'hui)
        """
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            from datetime import datetime, timedelta

            # Dates par défaut: aujourd'hui
            if not date_from:
                date_from = datetime.now().replace(hour=0, minute=0, second=0)
            else:
                date_from = datetime.fromisoformat(date_from)

            if not date_to:
                date_to = datetime.now().replace(hour=23, minute=59, second=59)
            else:
                date_to = datetime.fromisoformat(date_to)

            # Domaine de base
            domain = [
                ('company_id', '=', request.env.user.company_id.id),
                ('state', 'in', ['paid', 'done', 'invoiced']),
                ('paid_at', '>=', date_from),
                ('paid_at', '<=', date_to),
            ]

            if config_id:
                domain.append(('config_id', '=', config_id))

            Order = request.env['quelyos.pos.order'].sudo()
            orders = Order.search(domain)

            # KPIs
            total_sales = sum(orders.mapped('amount_total'))
            order_count = len(orders)
            avg_basket = total_sales / order_count if order_count else 0

            # Clients uniques
            unique_customers = len(set(orders.mapped('partner_id.id')) - {False})

            # Sessions actives
            Session = request.env['quelyos.pos.session'].sudo()
            active_sessions = Session.search([
                ('company_id', '=', request.env.user.company_id.id),
                ('state', 'in', ['opening', 'opened']),
            ])

            # Top produits
            product_sales = {}
            for order in orders:
                for line in order.line_ids:
                    pid = line.product_id.id
                    if pid not in product_sales:
                        product_sales[pid] = {
                            'name': line.product_id.name,
                            'quantity': 0,
                            'amount': 0,
                        }
                    product_sales[pid]['quantity'] += line.quantity
                    product_sales[pid]['amount'] += line.price_subtotal

            top_products = sorted(
                product_sales.values(),
                key=lambda x: x['quantity'],
                reverse=True
            )[:5]

            return {
                'success': True,
                'data': {
                    'kpis': {
                        'totalSales': total_sales,
                        'orderCount': order_count,
                        'averageBasket': avg_basket,
                        'uniqueCustomers': unique_customers,
                    },
                    'activeSessions': [s.to_frontend_summary() for s in active_sessions],
                    'topProducts': top_products,
                    'period': {
                        'from': date_from.isoformat(),
                        'to': date_to.isoformat(),
                    },
                },
            }

        except Exception as e:
            _logger.error(f"Error fetching POS dashboard: {e}", exc_info=True)
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/pos/session/<int:session_id>/report', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_session_report(self, session_id, **kwargs):
        """Rapport Z complet d'une session"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            session = request.env['quelyos.pos.session'].sudo().browse(session_id)
            if not session.exists():
                return {'success': False, 'error': 'Session non trouvée'}

            return {
                'success': True,
                'data': session.get_z_report_data(),
            }

        except Exception as e:
            _logger.error(f"Error fetching session report: {e}", exc_info=True)
            return {'success': False, 'error': 'Erreur serveur'}

    # ═══════════════════════════════════════════════════════════════════════════
    # MÉTHODES DE PAIEMENT
    # ═══════════════════════════════════════════════════════════════════════════

    @http.route('/api/pos/payment-methods', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_payment_methods(self, config_id=None, **kwargs):
        """Liste des méthodes de paiement disponibles"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            domain = [
                ('company_id', '=', request.env.user.company_id.id),
                ('active', '=', True),
            ]

            PaymentMethod = request.env['quelyos.pos.payment.method'].sudo()
            methods = PaymentMethod.search(domain, order='sequence')

            # Si config_id spécifié, filtrer selon le terminal
            if config_id:
                config = request.env['quelyos.pos.config'].sudo().browse(config_id)
                if config.exists() and config.payment_method_ids:
                    methods = methods.filtered(lambda m: m in config.payment_method_ids)

            return {
                'success': True,
                'data': [m.to_frontend_dict() for m in methods],
            }

        except Exception as e:
            _logger.error(f"Error fetching payment methods: {e}", exc_info=True)
            return {'success': False, 'error': 'Erreur serveur'}
