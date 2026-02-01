# -*- coding: utf-8 -*-
import logging
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class QuelyosPricelistsAPI(BaseController):
    """API controller for pricelists management"""

    @http.route('/api/ecommerce/pricelists', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_pricelists(self, **kwargs):
        """
        Récupérer la liste des pricelists (listes de prix) avec pagination.

        Params:
            active_only (bool): Si True, retourne uniquement les pricelists actives (défaut: True)
            limit (int): Nombre de résultats par page (défaut: 50, max: 100)
            offset (int): Décalage pour la pagination (défaut: 0)

        Returns:
            Dict avec success, data (liste pricelists), total, limit, offset
        """
        try:
            params = self._get_params()
            active_only = params.get('active_only', True)
            limit = min(int(params.get('limit', 50)), 100)  # Max 100 per page
            offset = max(int(params.get('offset', 0)), 0)

            Pricelist = request.env['product.pricelist'].sudo()

            domain = []
            if active_only:
                domain.append(('active', '=', True))

            total_count = Pricelist.search_count(domain)
            pricelists = Pricelist.search(domain, order='name', limit=limit, offset=offset)

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

            return {
                'success': True,
                'data': pricelist_list,
                'total': total_count,
                'limit': limit,
                'offset': offset,
            }

        except Exception as e:
            _logger.error(f"Get pricelists error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/pricelists/<int:pricelist_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
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
                    'applied_on': item.applied_on,
                    'compute_price': item.compute_price,
                    'fixed_price': float(item.fixed_price) if item.fixed_price else None,
                    'percent_price': float(item.percent_price) if item.percent_price else None,
                    'price_discount': float(item.price_discount) if item.price_discount else None,
                    'min_quantity': item.min_quantity,
                }

                # Ajouter les infos produit/catégorie selon applied_on
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
                    'items': items,
                    'item_count': len(items),
                }
            }

        except Exception as e:
            _logger.error(f"Get pricelist detail error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/pricelists/create', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def create_pricelist(self, **params):
        """
        Créer une nouvelle pricelist.

        Params:
            name (str): Nom de la pricelist
            currency_id (int): ID de la devise
            discount_policy (str): 'with_discount' ou 'without_discount'
            active (bool): Actif ou non

        Returns:
            Pricelist créée
        """
        try:
            data = self._get_params()

            Pricelist = request.env['product.pricelist'].sudo()

            pricelist = Pricelist.create({
                'name': data.get('name'),
                'currency_id': int(data.get('currency_id')),
                'discount_policy': data.get('discount_policy', 'with_discount'),
                'active': data.get('active', True),
            })

            return {
                'success': True,
                'data': {
                    'id': pricelist.id,
                    'name': pricelist.name,
                    'currency_id': pricelist.currency_id.id,
                    'active': pricelist.active,
                }
            }

        except Exception as e:
            _logger.error(f"Create pricelist error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/pricelists/<int:pricelist_id>/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def update_pricelist(self, pricelist_id, **params):
        """
        Mettre à jour une pricelist.

        Returns:
            Pricelist mise à jour
        """
        try:
            data = self._get_params()

            Pricelist = request.env['product.pricelist'].sudo()
            pricelist = Pricelist.browse(pricelist_id)

            if not pricelist.exists():
                return {
                    'success': False,
                    'error': f'Pricelist {pricelist_id} introuvable'
                }

            update_data = {}
            if 'name' in data:
                update_data['name'] = data['name']
            if 'currency_id' in data:
                update_data['currency_id'] = int(data['currency_id'])
            if 'discount_policy' in data:
                update_data['discount_policy'] = data['discount_policy']
            if 'active' in data:
                update_data['active'] = data['active']

            pricelist.write(update_data)

            return {
                'success': True,
                'data': {
                    'id': pricelist.id,
                    'name': pricelist.name,
                    'currency_id': pricelist.currency_id.id,
                    'active': pricelist.active,
                }
            }

        except Exception as e:
            _logger.error(f"Update pricelist error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/pricelists/<int:pricelist_id>/delete', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def delete_pricelist(self, pricelist_id, **params):
        """
        Supprimer une pricelist.

        Returns:
            Confirmation de suppression
        """
        try:
            Pricelist = request.env['product.pricelist'].sudo()
            pricelist = Pricelist.browse(pricelist_id)

            if not pricelist.exists():
                return {
                    'success': False,
                    'error': f'Pricelist {pricelist_id} introuvable'
                }

            pricelist.unlink()

            return {
                'success': True,
                'message': f'Pricelist {pricelist_id} supprimée'
            }

        except Exception as e:
            _logger.error(f"Delete pricelist error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/pricelists/<int:pricelist_id>/items/create', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def create_pricelist_item(self, pricelist_id, **params):
        """
        Créer un item (règle de prix) dans une pricelist.

        Returns:
            Item créé
        """
        try:
            data = self._get_params()

            Pricelist = request.env['product.pricelist'].sudo()
            PricelistItem = request.env['product.pricelist.item'].sudo()

            pricelist = Pricelist.browse(pricelist_id)
            if not pricelist.exists():
                return {
                    'success': False,
                    'error': f'Pricelist {pricelist_id} introuvable'
                }

            item_data = {
                'pricelist_id': pricelist_id,
                'applied_on': data.get('applied_on', '3_global'),
                'compute_price': data.get('compute_price', 'fixed'),
                'min_quantity': data.get('min_quantity', 1),
            }

            # Ajouter les champs spécifiques selon compute_price
            if data.get('compute_price') == 'fixed' and 'fixed_price' in data:
                item_data['fixed_price'] = float(data['fixed_price'])
            elif data.get('compute_price') == 'percentage' and 'percent_price' in data:
                item_data['percent_price'] = float(data['percent_price'])
            if 'price_discount' in data:
                item_data['price_discount'] = float(data['price_discount'])

            # Ajouter produit/catégorie selon applied_on
            if data.get('applied_on') == '1_product' and 'product_id' in data:
                item_data['product_tmpl_id'] = int(data['product_id'])
            elif data.get('applied_on') == '2_product_category' and 'category_id' in data:
                item_data['categ_id'] = int(data['category_id'])

            item = PricelistItem.create(item_data)

            return {
                'success': True,
                'data': {
                    'id': item.id,
                    'applied_on': item.applied_on,
                    'compute_price': item.compute_price,
                }
            }

        except Exception as e:
            _logger.error(f"Create pricelist item error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/pricelists/<int:pricelist_id>/items/<int:item_id>/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def update_pricelist_item(self, pricelist_id, item_id, **params):
        """
        Mettre à jour un item de pricelist.

        Returns:
            Item mis à jour
        """
        try:
            data = self._get_params()

            PricelistItem = request.env['product.pricelist.item'].sudo()
            item = PricelistItem.browse(item_id)

            if not item.exists() or item.pricelist_id.id != pricelist_id:
                return {
                    'success': False,
                    'error': f'Item {item_id} introuvable dans la pricelist {pricelist_id}'
                }

            update_data = {}
            if 'applied_on' in data:
                update_data['applied_on'] = data['applied_on']
            if 'compute_price' in data:
                update_data['compute_price'] = data['compute_price']
            if 'fixed_price' in data:
                update_data['fixed_price'] = float(data['fixed_price'])
            if 'percent_price' in data:
                update_data['percent_price'] = float(data['percent_price'])
            if 'price_discount' in data:
                update_data['price_discount'] = float(data['price_discount'])
            if 'min_quantity' in data:
                update_data['min_quantity'] = data['min_quantity']

            item.write(update_data)

            return {
                'success': True,
                'data': {
                    'id': item.id,
                    'applied_on': item.applied_on,
                    'compute_price': item.compute_price,
                }
            }

        except Exception as e:
            _logger.error(f"Update pricelist item error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/pricelists/<int:pricelist_id>/items/<int:item_id>/delete', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def delete_pricelist_item(self, pricelist_id, item_id, **params):
        """
        Supprimer un item de pricelist.

        Returns:
            Confirmation de suppression
        """
        try:
            PricelistItem = request.env['product.pricelist.item'].sudo()
            item = PricelistItem.browse(item_id)

            if not item.exists() or item.pricelist_id.id != pricelist_id:
                return {
                    'success': False,
                    'error': f'Item {item_id} introuvable dans la pricelist {pricelist_id}'
                }

            item.unlink()

            return {
                'success': True,
                'message': f'Item {item_id} supprimé'
            }

        except Exception as e:
            _logger.error(f"Delete pricelist item error: {e}")
            return {
                'success': False,
                'error': str(e)
            }
