# -*- coding: utf-8 -*-
"""
Controllers pour les fonctionnalités Stock OCA
Intégration des addons OCA : stock_change_qty_reason, stock_inventory, etc.
"""
import logging
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class StockOCAController(http.Controller):
    """API pour fonctionnalités Stock OCA"""

    # ==================== STOCK QUANTITY CHANGE REASONS (OCA) ====================

    @http.route('/api/stock/change-reasons', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def get_stock_change_reasons(self, **kwargs):
        """
        Liste des raisons de changement de quantité (module OCA stock_change_qty_reason)

        Returns:
            {
                'success': bool,
                'data': {
                    'reasons': [{'id': int, 'name': str, 'code': str, ...}],
                    'total': int
                }
            }
        """
        try:
            # Vérifier si le module OCA est installé
            if not request.env['ir.module.module'].sudo().search([
                ('name', '=', 'stock_change_qty_reason'),
                ('state', '=', 'installed')
            ]):
                return {
                    'success': False,
                    'error': 'Module OCA stock_change_qty_reason non installé',
                    'error_code': 'MODULE_NOT_INSTALLED'
                }

            # Récupérer les raisons configurées
            Reason = request.env['stock.quantity.change.reason'].sudo()
            reasons = Reason.search([], order='name asc')

            return {
                'success': True,
                'data': {
                    'reasons': [{
                        'id': r.id,
                        'name': r.name,
                        'code': r.code if hasattr(r, 'code') else None,
                        'active': r.active if hasattr(r, 'active') else True,
                    } for r in reasons],
                    'total': len(reasons),
                }
            }
        except Exception as e:
            _logger.error(f"Error fetching stock change reasons: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_code': 'FETCH_ERROR'
            }

    @http.route('/api/stock/adjust-with-reason', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def adjust_stock_with_reason(self, **kwargs):
        """
        Ajuster le stock avec une raison (module OCA stock_change_qty_reason)

        Params:
            product_id: int - ID du produit
            location_id: int - ID de l'emplacement
            new_quantity: float - Nouvelle quantité
            reason_id: int - ID de la raison (optionnel)
            notes: str - Notes complémentaires (optionnel)

        Returns:
            {
                'success': bool,
                'data': {
                    'quant_id': int,
                    'old_quantity': float,
                    'new_quantity': float,
                    'reason': str
                }
            }
        """
        try:
            params = self._get_params()

            # Validation
            product_id = params.get('product_id')
            location_id = params.get('location_id')
            new_quantity = params.get('new_quantity')
            reason_id = params.get('reason_id')
            notes = params.get('notes', '')

            if not all([product_id, location_id, new_quantity is not None]):
                return {
                    'success': False,
                    'error': 'Paramètres manquants : product_id, location_id, new_quantity requis',
                    'error_code': 'MISSING_PARAMS'
                }

            # Récupérer le quant
            Quant = request.env['stock.quant'].sudo()
            quant = Quant.search([
                ('product_id', '=', product_id),
                ('location_id', '=', location_id)
            ], limit=1)

            old_quantity = quant.quantity if quant else 0.0

            # Créer ou mettre à jour le quant avec raison
            if quant:
                # Mise à jour avec raison si module OCA installé
                if hasattr(quant, 'quantity_change_reason_id'):
                    quant.write({
                        'quantity': new_quantity,
                        'quantity_change_reason_id': reason_id if reason_id else False,
                    })
                else:
                    # Fallback si module OCA non installé
                    quant.write({'quantity': new_quantity})
            else:
                # Créer nouveau quant
                quant_vals = {
                    'product_id': product_id,
                    'location_id': location_id,
                    'quantity': new_quantity,
                }
                if reason_id and hasattr(Quant, 'quantity_change_reason_id'):
                    quant_vals['quantity_change_reason_id'] = reason_id

                quant = Quant.create(quant_vals)

            # Récupérer la raison pour le retour
            reason_name = ''
            if reason_id:
                reason = request.env['stock.quantity.change.reason'].sudo().browse(reason_id)
                reason_name = reason.name if reason else ''

            return {
                'success': True,
                'data': {
                    'quant_id': quant.id,
                    'old_quantity': old_quantity,
                    'new_quantity': new_quantity,
                    'reason': reason_name,
                    'notes': notes,
                }
            }
        except Exception as e:
            _logger.error(f"Error adjusting stock with reason: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_code': 'ADJUSTMENT_ERROR'
            }

    # ==================== STOCK INVENTORY (OCA) ====================

    @http.route('/api/stock/inventories-oca', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def get_stock_inventories_oca(self, **kwargs):
        """
        Liste des inventaires (module OCA stock_inventory)

        Returns:
            {
                'success': bool,
                'data': {
                    'inventories': [...],
                    'total': int
                }
            }
        """
        try:
            params = self._get_params()
            limit = params.get('limit', 20)
            offset = params.get('offset', 0)

            # Vérifier si module installé
            if not request.env['ir.module.module'].sudo().search([
                ('name', '=', 'stock_inventory'),
                ('state', '=', 'installed')
            ]):
                return {
                    'success': False,
                    'error': 'Module OCA stock_inventory non installé',
                    'error_code': 'MODULE_NOT_INSTALLED'
                }

            # Récupérer les inventaires
            Inventory = request.env['stock.inventory'].sudo()
            inventories = Inventory.search([], limit=limit, offset=offset, order='date desc')
            total = Inventory.search_count([])

            return {
                'success': True,
                'data': {
                    'inventories': [{
                        'id': inv.id,
                        'name': inv.name,
                        'date': inv.date.isoformat() if hasattr(inv, 'date') and inv.date else None,
                        'state': inv.state if hasattr(inv, 'state') else 'draft',
                        'location_id': inv.location_id.id if hasattr(inv, 'location_id') and inv.location_id else None,
                        'location_name': inv.location_id.name if hasattr(inv, 'location_id') and inv.location_id else None,
                    } for inv in inventories],
                    'total': total,
                    'limit': limit,
                    'offset': offset,
                }
            }
        except Exception as e:
            _logger.error(f"Error fetching OCA inventories: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_code': 'FETCH_ERROR'
            }

    # ==================== LOCATION LOCKDOWN (OCA) ====================

    @http.route('/api/stock/location-locks', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def get_location_locks(self, **kwargs):
        """
        Liste des emplacements verrouillés (module OCA stock_location_lockdown)

        Returns:
            {
                'success': bool,
                'data': {
                    'locks': [...],
                    'total': int
                }
            }
        """
        try:
            # Vérifier si module installé
            if not request.env['ir.module.module'].sudo().search([
                ('name', '=', 'stock_location_lockdown'),
                ('state', '=', 'installed')
            ]):
                return {
                    'success': False,
                    'error': 'Module OCA stock_location_lockdown non installé',
                    'error_code': 'MODULE_NOT_INSTALLED'
                }

            # Récupérer les emplacements avec lockdown actif
            Location = request.env['stock.location'].sudo()
            locked_locations = Location.search([
                ('block_inventory', '=', True)
            ]) if hasattr(Location, 'block_inventory') else []

            return {
                'success': True,
                'data': {
                    'locks': [{
                        'location_id': loc.id,
                        'location_name': loc.name,
                        'complete_name': loc.complete_name if hasattr(loc, 'complete_name') else loc.name,
                        'blocked': True,
                    } for loc in locked_locations],
                    'total': len(locked_locations),
                }
            }
        except Exception as e:
            _logger.error(f"Error fetching location locks: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_code': 'FETCH_ERROR'
            }

    @http.route('/api/stock/location/<int:location_id>/lock', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def lock_location(self, location_id, **kwargs):
        """
        Verrouiller un emplacement pendant inventaire

        Params:
            location_id: int - ID de l'emplacement
            lock: bool - True pour verrouiller, False pour déverrouiller
        """
        try:
            params = self._get_params()
            lock = params.get('lock', True)

            Location = request.env['stock.location'].sudo()
            location = Location.browse(location_id)

            if not location.exists():
                return {
                    'success': False,
                    'error': f'Emplacement {location_id} non trouvé',
                    'error_code': 'NOT_FOUND'
                }

            # Verrouiller/déverrouiller si champ existe
            if hasattr(location, 'block_inventory'):
                location.write({'block_inventory': lock})

                return {
                    'success': True,
                    'data': {
                        'location_id': location.id,
                        'location_name': location.name,
                        'locked': lock,
                    }
                }
            else:
                return {
                    'success': False,
                    'error': 'Module OCA stock_location_lockdown requis',
                    'error_code': 'MODULE_NOT_INSTALLED'
                }
        except Exception as e:
            _logger.error(f"Error locking location: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_code': 'LOCK_ERROR'
            }
