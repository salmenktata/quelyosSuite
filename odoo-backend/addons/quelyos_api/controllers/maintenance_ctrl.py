"""
Controller GMAO - Gestion de Maintenance Assistée par Ordinateur
Inspiré de la logique métier IBM Maximo MVP

Endpoints:
- /api/maintenance/equipment - Liste équipements avec filtres
- /api/maintenance/equipment/<id> - Détail équipement avec historique
- /api/maintenance/equipment/create - Créer équipement
- /api/maintenance/categories - Liste catégories équipements
- /api/maintenance/categories/create - Créer catégorie
- /api/maintenance/costs - Analyse des coûts de maintenance
- /api/maintenance/requests - Demandes de maintenance
- /api/maintenance/requests/create - Créer demande
- /api/maintenance/dashboard - KPIs dashboard GMAO
"""
import json
import logging
from datetime import datetime, timedelta
from odoo import http
from odoo.http import request, Response

_logger = logging.getLogger(__name__)


class MaintenanceController(http.Controller):
    """Controller pour le module GMAO (Maintenance)"""

    def _check_auth(self):
        """Vérifie l'authentification utilisateur"""
        if not request.env.user or request.env.user._is_public():
            return Response(
                json.dumps({'success': False, 'error': 'Authentication required'}),
                status=401,
                content_type='application/json'
            )
        return None

    # ==================== ÉQUIPEMENTS ====================

    @http.route('/api/maintenance/equipment', type='json', auth='user', methods=['POST'], csrf=False)
    def get_equipment_list(self, category_id=None, location_id=None, critical_only=False, limit=None, **kwargs):
        """
        Liste des équipements de maintenance
        Filtres: category_id, location_id, critical_only, limit
        """
        try:
            domain = []

            # Filtre par catégorie
            if category_id:
                domain.append(('category_id', '=', category_id))

            # Filtre équipements critiques uniquement
            if critical_only:
                domain.append(('is_critical', '=', True))

            # Filtre par localisation (si implémenté)
            if location_id:
                domain.append(('location_id', '=', location_id))

            # Récupération des équipements
            equipment_obj = request.env['quelyos.maintenance.equipment'].sudo()
            equipment_list = equipment_obj.search(domain, limit=limit or 100, order='name')

            data = []
            for equip in equipment_list:
                # Calcul des KPIs
                mtbf = equip.mtbf_hours or 0.0
                mttr = equip.mttr_hours or 0.0
                uptime = equip.uptime_percentage or 0.0
                failure_count = equip.failure_count or 0

                data.append({
                    'id': equip.id,
                    'name': equip.name,
                    'category_name': equip.category_id.name if equip.category_id else 'Non catégorisé',
                    'serial_number': equip.serial_no or '',
                    'is_critical': equip.is_critical or False,
                    'mtbf_hours': mtbf,
                    'mttr_hours': mttr,
                    'uptime_percentage': uptime,
                    'failure_count': failure_count,
                    'last_failure_date': equip.last_failure_date.isoformat() if equip.last_failure_date else None,
                    'next_preventive_date': equip.next_preventive_date.isoformat() if equip.next_preventive_date else None,
                })

            return {'success': True, 'data': data}

        except Exception as e:
            _logger.error(f"[GMAO] Error fetching equipment list: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}

    @http.route('/api/maintenance/equipment/<int:equipment_id>', type='json', auth='user', methods=['POST'], csrf=False)
    def get_equipment_detail(self, equipment_id, **kwargs):
        """Détail d'un équipement avec historique des interventions"""
        try:
            equipment = request.env['quelyos.maintenance.equipment'].sudo().browse(equipment_id)

            if not equipment.exists():
                return {'success': False, 'error': 'Equipment not found'}

            # Récupération des demandes de maintenance récentes
            recent_requests = request.env['quelyos.maintenance.request'].sudo().search([
                ('equipment_id', '=', equipment_id)
            ], limit=10, order='create_date desc')

            requests_data = []
            for req in recent_requests:
                requests_data.append({
                    'id': req.id,
                    'name': req.name,
                    'maintenance_type': req.maintenance_type,
                    'priority': req.priority,
                    'stage_name': req.stage_id.name if req.stage_id else '',
                    'create_date': req.create_date.isoformat() if req.create_date else None,
                })

            data = {
                'id': equipment.id,
                'name': equipment.name,
                'category_name': equipment.category_id.name if equipment.category_id else 'Non catégorisé',
                'serial_number': equipment.serial_no or '',
                'is_critical': equipment.is_critical or False,
                'location': equipment.location or '',
                'purchase_date': equipment.purchase_date.isoformat() if equipment.purchase_date else None,
                'warranty_end_date': equipment.warranty_end_date.isoformat() if equipment.warranty_end_date else None,
                'mtbf_hours': equipment.x_mtbf_hours or 0.0,
                'mttr_hours': equipment.x_mttr_hours or 0.0,
                'uptime_percentage': equipment.x_uptime_percentage or 0.0,
                'failure_count': equipment.x_failure_count or 0,
                'last_failure_date': equipment.x_last_failure_date.isoformat() if equipment.x_last_failure_date else None,
                'next_preventive_date': equipment.x_next_preventive_date.isoformat() if equipment.x_next_preventive_date else None,
                'recent_requests': requests_data,
            }

            return {'success': True, 'data': data}

        except Exception as e:
            _logger.error(f"[GMAO] Error fetching equipment detail {equipment_id}: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}

    @http.route('/api/maintenance/equipment/create', type='json', auth='user', methods=['POST'], csrf=False)
    def create_equipment(self, name, category_id=None, serial_number=None, is_critical=False,
                        purchase_date=None, warranty_end_date=None, **kwargs):
        """Créer un nouvel équipement"""
        try:
            vals = {
                'name': name,
                'serial_no': serial_number,
                'is_critical': is_critical,
            }

            if category_id:
                vals['category_id'] = category_id
            if purchase_date:
                vals['purchase_date'] = purchase_date
            if warranty_end_date:
                vals['warranty_end_date'] = warranty_end_date

            equipment = request.env['quelyos.maintenance.equipment'].sudo().create(vals)

            return {
                'success': True,
                'data': {
                    'id': equipment.id,
                    'name': equipment.name,
                }
            }

        except Exception as e:
            _logger.error(f"[GMAO] Error creating equipment: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}

    # ==================== CATÉGORIES ====================

    @http.route('/api/maintenance/categories', type='json', auth='user', methods=['POST'], csrf=False)
    def get_categories(self, **kwargs):
        """Liste des catégories d'équipements"""
        try:
            categories = request.env['quelyos.maintenance.equipment.category'].sudo().search([], order='name')

            data = []
            for cat in categories:
                # Compte le nombre d'équipements dans cette catégorie
                equipment_count = request.env['quelyos.maintenance.equipment'].sudo().search_count([
                    ('category_id', '=', cat.id)
                ])

                data.append({
                    'id': cat.id,
                    'name': cat.name,
                    'equipment_count': equipment_count,
                })

            return {'success': True, 'data': data}

        except Exception as e:
            _logger.error(f"[GMAO] Error fetching categories: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}

    @http.route('/api/maintenance/categories/create', type='json', auth='user', methods=['POST'], csrf=False)
    def create_category(self, name, **kwargs):
        """Créer une nouvelle catégorie d'équipements"""
        try:
            category = request.env['quelyos.maintenance.equipment.category'].sudo().create({
                'name': name,
            })

            return {
                'success': True,
                'data': {
                    'id': category.id,
                    'name': category.name,
                }
            }

        except Exception as e:
            _logger.error(f"[GMAO] Error creating category: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}

    # ==================== COÛTS DE MAINTENANCE ====================

    @http.route('/api/maintenance/costs', type='json', auth='user', methods=['POST'], csrf=False)
    def get_maintenance_costs(self, start_date=None, end_date=None, **kwargs):
        """
        Analyse des coûts de maintenance
        Retourne: total, préventif, correctif, par équipement, par mois
        """
        try:
            # Période par défaut: 12 derniers mois
            if not end_date:
                end_date = datetime.now()
            else:
                end_date = datetime.fromisoformat(end_date)

            if not start_date:
                start_date = end_date - timedelta(days=365)
            else:
                start_date = datetime.fromisoformat(start_date)

            # Récupération des demandes de maintenance sur la période
            domain = [
                ('create_date', '>=', start_date.isoformat()),
                ('create_date', '<=', end_date.isoformat()),
            ]

            requests = request.env['quelyos.maintenance.request'].sudo().search(domain)

            # Calcul des coûts
            total_cost = sum(req.total_cost or 0.0 for req in requests)
            preventive_cost = sum(req.total_cost or 0.0 for req in requests if req.maintenance_type == 'preventive')
            corrective_cost = sum(req.total_cost or 0.0 for req in requests if req.maintenance_type == 'corrective')

            # Coûts par équipement (top 10)
            equipment_costs = {}
            for req in requests:
                if req.equipment_id:
                    eq_id = req.equipment_id.id
                    eq_name = req.equipment_id.name
                    if eq_id not in equipment_costs:
                        equipment_costs[eq_id] = {'name': eq_name, 'cost': 0.0}
                    equipment_costs[eq_id]['cost'] += req.total_cost or 0.0

            top_equipment = sorted(
                [{'id': k, **v} for k, v in equipment_costs.items()],
                key=lambda x: x['cost'],
                reverse=True
            )[:10]

            # Coûts par mois
            monthly_costs = {}
            for req in requests:
                if req.create_date:
                    month_key = req.create_date.strftime('%Y-%m')
                    if month_key not in monthly_costs:
                        monthly_costs[month_key] = 0.0
                    monthly_costs[month_key] += req.total_cost or 0.0

            monthly_data = [
                {'month': k, 'cost': v}
                for k, v in sorted(monthly_costs.items())
            ]

            return {
                'success': True,
                'data': {
                    'total_cost': total_cost,
                    'preventive_cost': preventive_cost,
                    'corrective_cost': corrective_cost,
                    'top_equipment': top_equipment,
                    'monthly_costs': monthly_data,
                    'period': {
                        'start_date': start_date.isoformat(),
                        'end_date': end_date.isoformat(),
                    }
                }
            }

        except Exception as e:
            _logger.error(f"[GMAO] Error calculating maintenance costs: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}

    # ==================== DEMANDES DE MAINTENANCE ====================

    @http.route('/api/maintenance/requests', type='json', auth='user', methods=['POST'], csrf=False)
    def get_maintenance_requests(self, equipment_id=None, maintenance_type=None, state=None, limit=None, **kwargs):
        """Liste des demandes de maintenance avec filtres"""
        try:
            domain = []

            if equipment_id:
                domain.append(('equipment_id', '=', equipment_id))
            if maintenance_type:
                domain.append(('maintenance_type', '=', maintenance_type))
            if state:
                if state == 'pending':
                    domain.append(('stage_id.done', '=', False))
                elif state == 'done':
                    domain.append(('stage_id.done', '=', True))

            requests = request.env['quelyos.maintenance.request'].sudo().search(
                domain,
                limit=limit or 100,
                order='create_date desc'
            )

            data = []
            for req in requests:
                data.append({
                    'id': req.id,
                    'name': req.name,
                    'equipment_name': req.equipment_id.name if req.equipment_id else '',
                    'maintenance_type': req.maintenance_type,
                    'priority': req.priority,
                    'is_emergency': req.is_emergency or False,
                    'downtime_impact': req.downtime_impact or 'none',
                    'stage_name': req.stage_id.name if req.stage_id else '',
                    'schedule_date': req.schedule_date.isoformat() if req.schedule_date else None,
                    'total_cost': req.total_cost or 0.0,
                    'actual_duration_hours': req.actual_duration_hours or 0.0,
                })

            return {'success': True, 'data': data}

        except Exception as e:
            _logger.error(f"[GMAO] Error fetching maintenance requests: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}

    @http.route('/api/maintenance/requests/create', type='json', auth='user', methods=['POST'], csrf=False)
    def create_maintenance_request(self, name, equipment_id, maintenance_type='corrective',
                                   priority='1', description=None, schedule_date=None,
                                   is_emergency=False, downtime_impact='none',
                                   planned_duration_hours=None, **kwargs):
        """Créer une nouvelle demande de maintenance"""
        try:
            vals = {
                'name': name,
                'equipment_id': equipment_id,
                'maintenance_type': maintenance_type,
                'priority': priority,
                'description': description,
                'is_emergency': is_emergency,
                'downtime_impact': downtime_impact,
            }

            if schedule_date:
                vals['schedule_date'] = schedule_date
            if planned_duration_hours:
                vals['planned_duration_hours'] = planned_duration_hours

            request_obj = request.env['quelyos.maintenance.request'].sudo().create(vals)

            return {
                'success': True,
                'data': {
                    'id': request_obj.id,
                    'name': request_obj.name,
                }
            }

        except Exception as e:
            _logger.error(f"[GMAO] Error creating maintenance request: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}

    # ==================== DASHBOARD GMAO ====================

    @http.route('/api/maintenance/dashboard', type='json', auth='user', methods=['POST'], csrf=False)
    def get_dashboard_stats(self, **kwargs):
        """KPIs pour le dashboard GMAO"""
        try:
            equipment_obj = request.env['quelyos.maintenance.equipment'].sudo()
            request_obj = request.env['quelyos.maintenance.request'].sudo()

            # Statistiques équipements
            total_equipment = equipment_obj.search_count([])
            critical_equipment = equipment_obj.search_count([('is_critical', '=', True)])

            # Statistiques demandes
            pending_requests = request_obj.search_count([('stage_id.done', '=', False)])
            urgent_requests = request_obj.search_count([('is_emergency', '=', True)])

            # KPIs moyens
            all_equipment = equipment_obj.search([])
            avg_mtbf = sum(eq.x_mtbf_hours or 0.0 for eq in all_equipment) / max(len(all_equipment), 1)
            avg_mttr = sum(eq.x_mttr_hours or 0.0 for eq in all_equipment) / max(len(all_equipment), 1)
            avg_uptime = sum(eq.x_uptime_percentage or 0.0 for eq in all_equipment) / max(len(all_equipment), 1)

            return {
                'success': True,
                'data': {
                    'equipment': {
                        'total': total_equipment,
                        'critical': critical_equipment,
                    },
                    'requests': {
                        'pending': pending_requests,
                        'urgent': urgent_requests,
                    },
                    'kpis': {
                        'avg_mtbf': round(avg_mtbf, 2),
                        'avg_mttr': round(avg_mttr, 2),
                        'avg_uptime': round(avg_uptime, 2),
                    }
                }
            }

        except Exception as e:
            _logger.error(f"[GMAO] Error fetching dashboard stats: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}
