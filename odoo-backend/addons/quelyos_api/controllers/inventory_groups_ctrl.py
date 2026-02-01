# -*- coding: utf-8 -*-
"""
Contrôleur API REST pour Groupes d'Inventaire OCA (stock_inventory module).

Endpoints :
- GET /api/ecommerce/stock/inventory-groups - Liste des groupes d'inventaire
- POST /api/ecommerce/stock/inventory-groups/create - Créer un groupe
- GET /api/ecommerce/stock/inventory-groups/:id - Détail d'un groupe
- POST /api/ecommerce/stock/inventory-groups/:id/start - Démarrer inventaire (draft → in_progress)
- POST /api/ecommerce/stock/inventory-groups/:id/validate - Valider inventaire (in_progress → done)
- POST /api/ecommerce/stock/inventory-groups/:id/cancel - Annuler inventaire
- DELETE /api/ecommerce/stock/inventory-groups/:id/delete - Supprimer groupe (si draft)
"""

import json
from odoo import http
from odoo.http import request


class InventoryGroupsController(http.Controller):
    """API REST pour Groupes d'Inventaire OCA."""

    @http.route('/api/ecommerce/stock/inventory-groups', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def list_inventory_groups(self, tenant_id=None, state=None, location_ids=None, limit=100, offset=0, **kwargs):
        """
        Liste des groupes d'inventaire.

        Args:
            tenant_id (int): ID tenant pour filtrage multi-tenant
            state (str): Filtrer par état (draft, in_progress, done, cancel)
            location_ids (list): Filtrer par emplacements
            limit (int): Nombre max de résultats
            offset (int): Décalage pour pagination

        Returns:
            dict: {
                'success': bool,
                'inventory_groups': list,
                'total_count': int
            }
        """
        try:
            domain = []

            # Multi-tenant
            if tenant_id:
                domain.append(('company_id', '=', tenant_id))

            # Filtres
            if state:
                domain.append(('state', '=', state))
            if location_ids:
                domain.append(('location_ids', 'in', location_ids))

            InventoryGroup = request.env['stock.inventory'].sudo()
            total_count = InventoryGroup.search_count(domain)
            groups = InventoryGroup.search(domain, limit=limit, offset=offset, order='date desc')

            groups_data = []
            for group in groups:
                groups_data.append({
                    'id': group.id,
                    'name': group.name,
                    'date': group.date.isoformat() if group.date else None,
                    'state': group.state,
                    'product_selection': group.product_selection,
                    'location_ids': group.location_ids.ids,
                    'location_names': group.location_ids.mapped('complete_name'),
                    'product_ids': group.product_ids.ids,
                    'product_count': len(group.product_ids),
                    'quant_count': len(group.stock_quant_ids),
                    'move_count': len(group.stock_move_ids),
                    'company_id': group.company_id.id,
                    'company_name': group.company_id.name,
                })

            return {
                'success': True,
                'inventory_groups': groups_data,
                'total_count': total_count,
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    @http.route('/api/ecommerce/stock/inventory-groups/create', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def create_inventory_group(self, name, location_ids, product_selection='all', product_ids=None,
                               category_id=None, lot_ids=None, tenant_id=None, **kwargs):
        """
        Créer un nouveau groupe d'inventaire.

        Args:
            name (str): Nom du groupe
            location_ids (list): IDs des emplacements
            product_selection (str): Type sélection (all, manual, category, one, lot)
            product_ids (list): IDs produits (si manual ou one)
            category_id (int): ID catégorie (si category)
            lot_ids (list): IDs lots (si lot)
            tenant_id (int): ID tenant (company)

        Returns:
            dict: {
                'success': bool,
                'inventory_group': dict,
                'error': str (si échec)
            }
        """
        try:
            vals = {
                'name': name,
                'location_ids': [(6, 0, location_ids)],
                'product_selection': product_selection,
            }

            if tenant_id:
                vals['company_id'] = tenant_id

            if product_selection in ['manual', 'one'] and product_ids:
                vals['product_ids'] = [(6, 0, product_ids)]

            if product_selection == 'category' and category_id:
                vals['category_id'] = category_id

            if product_selection == 'lot' and lot_ids:
                vals['lot_ids'] = [(6, 0, lot_ids)]

            group = request.env['stock.inventory'].sudo().create(vals)

            # Générer les quants à ajuster
            if hasattr(group, 'action_start'):
                group.action_start()

            return {
                'success': True,
                'inventory_group': {
                    'id': group.id,
                    'name': group.name,
                    'state': group.state,
                    'date': group.date.isoformat() if group.date else None,
                },
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    @http.route('/api/ecommerce/stock/inventory-groups/<int:group_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_inventory_group(self, group_id, **kwargs):
        """
        Détail d'un groupe d'inventaire avec ses ajustements.

        Returns:
            dict: Données complètes du groupe + quants
        """
        try:
            group = request.env['stock.inventory'].sudo().browse(group_id)

            if not group.exists():
                return {
                    'success': False,
                    'error': 'Inventory group not found',
                }

            # Détails des quants
            quants_data = []
            for quant in group.stock_quant_ids:
                quants_data.append({
                    'id': quant.id,
                    'product_id': quant.product_id.id,
                    'product_name': quant.product_id.display_name,
                    'product_code': quant.product_id.default_code,
                    'location_id': quant.location_id.id,
                    'location_name': quant.location_id.complete_name,
                    'quantity': quant.quantity,
                    'inventory_quantity': quant.inventory_quantity,
                    'inventory_diff_quantity': quant.inventory_diff_quantity,
                    'lot_id': quant.lot_id.id if quant.lot_id else None,
                    'lot_name': quant.lot_id.name if quant.lot_id else None,
                })

            # Mouvements créés
            moves_data = []
            for move in group.stock_move_ids:
                moves_data.append({
                    'id': move.id,
                    'product_id': move.product_id.id,
                    'product_name': move.product_id.display_name,
                    'product_qty': move.product_uom_qty,
                    'location_id': move.location_id.id,
                    'location_dest_id': move.location_dest_id.id,
                    'state': move.state,
                })

            return {
                'success': True,
                'inventory_group': {
                    'id': group.id,
                    'name': group.name,
                    'date': group.date.isoformat() if group.date else None,
                    'state': group.state,
                    'product_selection': group.product_selection,
                    'location_ids': group.location_ids.ids,
                    'location_names': group.location_ids.mapped('complete_name'),
                    'product_ids': group.product_ids.ids,
                    'quants': quants_data,
                    'moves': moves_data,
                    'company_id': group.company_id.id,
                },
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    @http.route('/api/ecommerce/stock/inventory-groups/<int:group_id>/start', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def start_inventory_group(self, group_id, **kwargs):
        """
        Démarrer un inventaire (draft → in_progress).
        Génère les quants à compter.
        """
        try:
            group = request.env['stock.inventory'].sudo().browse(group_id)

            if not group.exists():
                return {'success': False, 'error': 'Inventory group not found'}

            if group.state != 'draft':
                return {'success': False, 'error': f'Cannot start inventory in state {group.state}'}

            # Démarrer l'inventaire
            if hasattr(group, 'action_start'):
                group.action_start()
            else:
                group.write({'state': 'in_progress'})

            return {
                'success': True,
                'state': group.state,
                'quant_count': len(group.stock_quant_ids),
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    @http.route('/api/ecommerce/stock/inventory-groups/<int:group_id>/validate', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def validate_inventory_group(self, group_id, **kwargs):
        """
        Valider un inventaire (in_progress → done).
        Applique les ajustements de stock.
        """
        try:
            group = request.env['stock.inventory'].sudo().browse(group_id)

            if not group.exists():
                return {'success': False, 'error': 'Inventory group not found'}

            if group.state != 'in_progress':
                return {'success': False, 'error': f'Cannot validate inventory in state {group.state}'}

            # Valider l'inventaire
            if hasattr(group, 'action_validate'):
                group.action_validate()
            else:
                # Appliquer les ajustements
                for quant in group.stock_quant_ids:
                    if quant.inventory_diff_quantity != 0:
                        quant.action_apply_inventory()
                group.write({'state': 'done'})

            return {
                'success': True,
                'state': group.state,
                'move_count': len(group.stock_move_ids),
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    @http.route('/api/ecommerce/stock/inventory-groups/<int:group_id>/cancel', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def cancel_inventory_group(self, group_id, **kwargs):
        """
        Annuler un inventaire.
        """
        try:
            group = request.env['stock.inventory'].sudo().browse(group_id)

            if not group.exists():
                return {'success': False, 'error': 'Inventory group not found'}

            if group.state == 'done':
                return {'success': False, 'error': 'Cannot cancel validated inventory'}

            if hasattr(group, 'action_cancel'):
                group.action_cancel()
            else:
                group.write({'state': 'cancel'})

            return {
                'success': True,
                'state': group.state,
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    @http.route('/api/ecommerce/stock/inventory-groups/<int:group_id>/delete', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def delete_inventory_group(self, group_id, **kwargs):
        """
        Supprimer un groupe d'inventaire (uniquement si draft ou cancel).
        """
        try:
            group = request.env['stock.inventory'].sudo().browse(group_id)

            if not group.exists():
                return {'success': False, 'error': 'Inventory group not found'}

            if group.state not in ['draft', 'cancel']:
                return {'success': False, 'error': f'Cannot delete inventory in state {group.state}'}

            group.unlink()

            return {
                'success': True,
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }
