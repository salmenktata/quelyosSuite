# -*- coding: utf-8 -*-
"""
API Stock - Quelyos Native

Endpoints API pour les fonctionnalités stock Quelyos natives
Remplace les modules OCA par des modèles Quelyos.
"""
import logging
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class StockAPIController(http.Controller):
    """API pour fonctionnalités Stock Quelyos"""

    def _get_params(self):
        """Extrait les paramètres de la requête JSON-RPC"""
        return request.params if hasattr(request, 'params') and request.params else {}

    # ==================== STOCK CHANGE REASONS ====================

    @http.route('/api/stock/change-reasons', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def get_change_reasons(self, **kwargs):
        """
        Liste des raisons de changement de stock (modèle Quelyos natif)

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
            params = self._get_params()
            limit = params.get('limit', 100)
            offset = params.get('offset', 0)

            # Récupérer les raisons configurées
            Reason = request.env['quelyos.stock.change.reason'].sudo()
            reasons = Reason.search([], limit=limit, offset=offset, order='name asc')
            total = Reason.search_count([])

            return {
                'success': True,
                'data': {
                    'reasons': [{
                        'id': r.id,
                        'name': r.name,
                        'code': r.code or '',
                        'description': r.description or '',
                        'active': r.active,
                        'usage_count': r.usage_count,
                    } for r in reasons],
                    'total': total,
                    'limit': limit,
                    'offset': offset,
                }
            }
        except Exception as e:
            _logger.error(f"Error fetching stock change reasons: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'error_code': 'FETCH_ERROR'
            }

    @http.route('/api/stock/change-reasons/create', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_change_reason(self, **kwargs):
        """
        Créer une nouvelle raison de changement de stock

        Params:
            name: str - Nom de la raison (requis)
            code: str - Code court (optionnel)
            description: str - Description détaillée (optionnel)

        Returns:
            {
                'success': bool,
                'data': {'id': int, 'name': str, ...}
            }
        """
        try:
            params = self._get_params()
            name = params.get('name')

            if not name:
                return {
                    'success': False,
                    'error': 'Le champ "name" est requis',
                    'error_code': 'MISSING_PARAMS'
                }

            Reason = request.env['quelyos.stock.change.reason'].sudo()
            reason = Reason.create({
                'name': name,
                'code': params.get('code', ''),
                'description': params.get('description', ''),
            })

            return {
                'success': True,
                'data': {
                    'id': reason.id,
                    'name': reason.name,
                    'code': reason.code or '',
                    'description': reason.description or '',
                    'active': reason.active,
                }
            }
        except Exception as e:
            _logger.error(f"Error creating change reason: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'error_code': 'CREATE_ERROR'
            }

    # ==================== STOCK INVENTORIES ====================

    @http.route('/api/stock/inventories', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def get_inventories(self, **kwargs):
        """
        Liste des inventaires de stock (modèle Quelyos natif)

        Params:
            limit: int - Nombre max de résultats (défaut: 20)
            offset: int - Décalage pour pagination (défaut: 0)
            state: str - Filtrer par état (optionnel)

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
            state = params.get('state')

            # Construire le domaine de recherche
            domain = []
            if state:
                domain.append(('state', '=', state))

            # Récupérer les inventaires
            Inventory = request.env['quelyos.stock.inventory'].sudo()
            inventories = Inventory.search(domain, limit=limit, offset=offset, order='date desc, id desc')
            total = Inventory.search_count(domain)

            return {
                'success': True,
                'data': {
                    'inventories': [{
                        'id': inv.id,
                        'name': inv.name,
                        'date': inv.date.isoformat() if inv.date else None,
                        'state': inv.state,
                        'location_id': inv.location_id.id,
                        'location_name': inv.location_id.display_name,
                        'user_id': inv.user_id.id,
                        'user_name': inv.user_id.name,
                        'line_count': inv.line_count,
                        'note': inv.note or '',
                    } for inv in inventories],
                    'total': total,
                    'limit': limit,
                    'offset': offset,
                }
            }
        except Exception as e:
            _logger.error(f"Error fetching inventories: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'error_code': 'FETCH_ERROR'
            }

    @http.route('/api/stock/inventories/create', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_inventory(self, **kwargs):
        """
        Créer un nouvel inventaire

        Params:
            location_id: int - ID de l'emplacement (requis)
            date: str - Date inventaire ISO format (optionnel, défaut: maintenant)
            note: str - Notes (optionnel)

        Returns:
            {
                'success': bool,
                'data': {'id': int, 'name': str, ...}
            }
        """
        try:
            params = self._get_params()
            location_id = params.get('location_id')

            if not location_id:
                return {
                    'success': False,
                    'error': 'Le champ "location_id" est requis',
                    'error_code': 'MISSING_PARAMS'
                }

            Inventory = request.env['quelyos.stock.inventory'].sudo()
            vals = {
                'location_id': location_id,
            }

            if params.get('date'):
                vals['date'] = params['date']
            if params.get('note'):
                vals['note'] = params['note']

            inventory = Inventory.create(vals)

            return {
                'success': True,
                'data': {
                    'id': inventory.id,
                    'name': inventory.name,
                    'date': inventory.date.isoformat() if inventory.date else None,
                    'state': inventory.state,
                    'location_id': inventory.location_id.id,
                    'location_name': inventory.location_id.display_name,
                }
            }
        except Exception as e:
            _logger.error(f"Error creating inventory: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'error_code': 'CREATE_ERROR'
            }

    @http.route('/api/stock/inventories/<int:inventory_id>/start', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def start_inventory(self, inventory_id, **kwargs):
        """
        Démarrer un inventaire (passe en état 'in_progress' et crée les lignes)

        Returns:
            {
                'success': bool,
                'data': {'id': int, 'state': str, 'line_count': int}
            }
        """
        try:
            Inventory = request.env['quelyos.stock.inventory'].sudo()
            inventory = Inventory.browse(inventory_id)

            if not inventory.exists():
                return {
                    'success': False,
                    'error': f'Inventaire {inventory_id} introuvable',
                    'error_code': 'NOT_FOUND'
                }

            inventory.action_start()

            return {
                'success': True,
                'data': {
                    'id': inventory.id,
                    'state': inventory.state,
                    'line_count': inventory.line_count,
                }
            }
        except Exception as e:
            _logger.error(f"Error starting inventory {inventory_id}: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'error_code': 'START_ERROR'
            }

    @http.route('/api/stock/inventories/<int:inventory_id>/validate', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def validate_inventory(self, inventory_id, **kwargs):
        """
        Valider un inventaire (crée les ajustements de stock)

        Returns:
            {
                'success': bool,
                'data': {'id': int, 'state': str}
            }
        """
        try:
            Inventory = request.env['quelyos.stock.inventory'].sudo()
            inventory = Inventory.browse(inventory_id)

            if not inventory.exists():
                return {
                    'success': False,
                    'error': f'Inventaire {inventory_id} introuvable',
                    'error_code': 'NOT_FOUND'
                }

            inventory.action_validate()

            return {
                'success': True,
                'data': {
                    'id': inventory.id,
                    'state': inventory.state,
                }
            }
        except Exception as e:
            _logger.error(f"Error validating inventory {inventory_id}: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'error_code': 'VALIDATE_ERROR'
            }

    # ==================== LOCATION LOCKS ====================

    @http.route('/api/stock/location-locks', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def get_location_locks(self, **kwargs):
        """
        Liste des verrouillages d'emplacements (modèle Quelyos natif)

        Params:
            limit: int - Nombre max de résultats (défaut: 20)
            offset: int - Décalage pour pagination (défaut: 0)
            active_only: bool - Uniquement les verrouillages actifs (défaut: False)

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
            params = self._get_params()
            limit = params.get('limit', 20)
            offset = params.get('offset', 0)
            active_only = params.get('active_only', False)

            # Construire le domaine de recherche
            domain = []
            if active_only:
                domain.append(('active', '=', True))

            # Récupérer les verrouillages
            Lock = request.env['quelyos.stock.location.lock'].sudo()
            locks = Lock.search(domain, limit=limit, offset=offset, order='date_start desc, id desc')
            total = Lock.search_count(domain)

            return {
                'success': True,
                'data': {
                    'locks': [{
                        'id': lock.id,
                        'name': lock.name,
                        'location_id': lock.location_id.id,
                        'location_name': lock.location_id.display_name,
                        'reason': lock.reason,
                        'date_start': lock.date_start.isoformat() if lock.date_start else None,
                        'date_end': lock.date_end.isoformat() if lock.date_end else None,
                        'user_id': lock.user_id.id,
                        'user_name': lock.user_id.name,
                        'active': lock.active,
                        'is_locked': lock.is_locked,
                    } for lock in locks],
                    'total': total,
                    'limit': limit,
                    'offset': offset,
                }
            }
        except Exception as e:
            _logger.error(f"Error fetching location locks: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'error_code': 'FETCH_ERROR'
            }

    @http.route('/api/stock/location-locks/create', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_location_lock(self, **kwargs):
        """
        Créer un nouveau verrouillage d'emplacement

        Params:
            location_id: int - ID de l'emplacement (requis)
            reason: str - Raison du verrouillage (requis)
            date_start: str - Date début ISO format (optionnel, défaut: maintenant)
            date_end: str - Date fin ISO format (optionnel)

        Returns:
            {
                'success': bool,
                'data': {'id': int, 'name': str, ...}
            }
        """
        try:
            params = self._get_params()
            location_id = params.get('location_id')
            reason = params.get('reason')

            if not location_id or not reason:
                return {
                    'success': False,
                    'error': 'Les champs "location_id" et "reason" sont requis',
                    'error_code': 'MISSING_PARAMS'
                }

            Lock = request.env['quelyos.stock.location.lock'].sudo()
            vals = {
                'location_id': location_id,
                'reason': reason,
            }

            if params.get('date_start'):
                vals['date_start'] = params['date_start']
            if params.get('date_end'):
                vals['date_end'] = params['date_end']

            lock = Lock.create(vals)

            return {
                'success': True,
                'data': {
                    'id': lock.id,
                    'name': lock.name,
                    'location_id': lock.location_id.id,
                    'location_name': lock.location_id.display_name,
                    'reason': lock.reason,
                    'date_start': lock.date_start.isoformat() if lock.date_start else None,
                    'date_end': lock.date_end.isoformat() if lock.date_end else None,
                    'active': lock.active,
                    'is_locked': lock.is_locked,
                }
            }
        except Exception as e:
            _logger.error(f"Error creating location lock: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'error_code': 'CREATE_ERROR'
            }

    @http.route('/api/stock/location-locks/<int:lock_id>/unlock', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def unlock_location(self, lock_id, **kwargs):
        """
        Déverrouiller manuellement un emplacement

        Returns:
            {
                'success': bool,
                'data': {'id': int, 'active': bool}
            }
        """
        try:
            Lock = request.env['quelyos.stock.location.lock'].sudo()
            lock = Lock.browse(lock_id)

            if not lock.exists():
                return {
                    'success': False,
                    'error': f'Verrouillage {lock_id} introuvable',
                    'error_code': 'NOT_FOUND'
                }

            lock.action_unlock()

            return {
                'success': True,
                'data': {
                    'id': lock.id,
                    'active': lock.active,
                    'is_locked': lock.is_locked,
                }
            }
        except Exception as e:
            _logger.error(f"Error unlocking location {lock_id}: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'error_code': 'UNLOCK_ERROR'
            }

    @http.route('/api/stock/location-locks/<int:lock_id>/lock', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def lock_location(self, lock_id, **kwargs):
        """
        Reverrouiller un emplacement

        Returns:
            {
                'success': bool,
                'data': {'id': int, 'active': bool}
            }
        """
        try:
            Lock = request.env['quelyos.stock.location.lock'].sudo()
            lock = Lock.browse(lock_id)

            if not lock.exists():
                return {
                    'success': False,
                    'error': f'Verrouillage {lock_id} introuvable',
                    'error_code': 'NOT_FOUND'
                }

            lock.action_lock()

            return {
                'success': True,
                'data': {
                    'id': lock.id,
                    'active': lock.active,
                    'is_locked': lock.is_locked,
                }
            }
        except Exception as e:
            _logger.error(f"Error locking location {lock_id}: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'error_code': 'LOCK_ERROR'
            }
