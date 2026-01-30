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


class QuelyosCustomersAPI(BaseController):
    """API contrôleur pour les clients, profils et adresses"""

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

    @http.route('/api/ecommerce/customers', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_customers_list(self, **kwargs):
        """Liste de tous les clients (admin uniquement) avec filtrage multi-tenant"""
        try:
            # Vérifier les permissions admin
            # TODO PRODUCTION: Réactiver avec JWT (voir TODO_AUTH.md)
            # if not request.env.user.has_group('base.group_system'):
            #     return {'success': False, 'error': 'Insufficient permissions'}
            pass

            params = self._get_params()
            tenant_id = params.get('tenant_id')
            limit = int(params.get('limit', 20))
            offset = int(params.get('offset', 0))
            search = params.get('search', '').strip()

            # Construire le domaine de recherche
            domain = [('customer_rank', '>', 0)]  # Uniquement les clients

            # Filtre multi-tenant
            if tenant_id:
                domain.append(('tenant_id', '=', tenant_id))

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
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/customers/<int:customer_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
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
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/customers/<int:customer_id>/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
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
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/customers/export', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
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
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/customer/profile', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/customer/profile/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
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
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/customer/addresses', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
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
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/customer/addresses/create', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
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
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/customer/addresses/<int:address_id>/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
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
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/customer/addresses/<int:address_id>/delete', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
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
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/customer-categories', type='jsonrpc', auth='public', methods=['GET', 'POST'], csrf=False, cors='*')
    def get_customer_categories(self, **params):
        """
        Récupérer la liste des catégories/tags clients (pour segmentation).

        Returns:
            Liste des catégories avec id, name, parent_id
        """
        try:
            PartnerCategory = request.env['res.partner.category'].sudo()

            categories = PartnerCategory.search([], order='name', limit=200)

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
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/customer-categories/create', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
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
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/customer-categories/<int:category_id>/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
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
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/customer-categories/<int:category_id>/delete', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
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
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/customers/<int:customer_id>/assign-pricelist', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
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
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/customers/<int:customer_id>/assign-categories', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
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
                'error': 'Une erreur est survenue'
            }
