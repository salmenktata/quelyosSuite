# -*- coding: utf-8 -*-
"""
Contrôleur API REST pour Calendriers Entrepôts OCA (stock_warehouse_calendar module).

Endpoints :
- GET /api/ecommerce/warehouses - Liste entrepôts avec calendriers
- POST /api/ecommerce/warehouses/:id/set-calendar - Assigner calendrier
- GET /api/ecommerce/calendars - Liste calendriers ressources
- POST /api/ecommerce/calendars/create - Créer calendrier
- POST /api/ecommerce/warehouses/:id/plan-delivery - Calculer date livraison selon calendrier
"""

import json
from datetime import datetime
from odoo import http
from odoo.http import request


class WarehouseCalendarController(http.Controller):
    """API REST pour Calendriers Entrepôts OCA."""

    @http.route('/api/ecommerce/warehouses', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def list_warehouses(self, tenant_id=None, limit=100, offset=0, **kwargs):
        """
        Liste des entrepôts avec leurs calendriers.

        Args:
            tenant_id (int): ID tenant pour filtrage multi-tenant
            limit (int): Nombre max de résultats
            offset (int): Décalage pour pagination

        Returns:
            dict: {
                'success': bool,
                'warehouses': list,
                'total_count': int
            }
        """
        try:
            domain = []

            if tenant_id:
                domain.append(('company_id', '=', tenant_id))

            Warehouse = request.env['stock.warehouse'].sudo()
            total_count = Warehouse.search_count(domain)
            warehouses = Warehouse.search(domain, limit=limit, offset=offset, order='name')

            warehouses_data = []
            for wh in warehouses:
                warehouses_data.append({
                    'id': wh.id,
                    'name': wh.name,
                    'code': wh.code,
                    'calendar_id': wh.calendar_id.id if wh.calendar_id else None,
                    'calendar_name': wh.calendar_id.name if wh.calendar_id else None,
                    'calendar_tz': wh.calendar_id.tz if wh.calendar_id else None,
                    'company_id': wh.company_id.id,
                    'company_name': wh.company_id.name,
                })

            return {
                'success': True,
                'warehouses': warehouses_data,
                'total_count': total_count,
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    @http.route('/api/ecommerce/warehouses/<int:warehouse_id>/set-calendar', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def set_warehouse_calendar(self, warehouse_id, calendar_id, **kwargs):
        """
        Assigner un calendrier à un entrepôt.

        Args:
            warehouse_id (int): ID entrepôt
            calendar_id (int): ID calendrier (None pour retirer)

        Returns:
            dict: {
                'success': bool,
                'warehouse': dict
            }
        """
        try:
            warehouse = request.env['stock.warehouse'].sudo().browse(warehouse_id)

            if not warehouse.exists():
                return {'success': False, 'error': 'Warehouse not found'}

            warehouse.write({'calendar_id': calendar_id or False})

            return {
                'success': True,
                'warehouse': {
                    'id': warehouse.id,
                    'name': warehouse.name,
                    'calendar_id': warehouse.calendar_id.id if warehouse.calendar_id else None,
                    'calendar_name': warehouse.calendar_id.name if warehouse.calendar_id else None,
                },
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    @http.route('/api/ecommerce/calendars', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def list_calendars(self, tenant_id=None, limit=100, offset=0, **kwargs):
        """
        Liste des calendriers ressources disponibles.

        Returns:
            dict: {
                'success': bool,
                'calendars': list,
                'total_count': int
            }
        """
        try:
            domain = []

            if tenant_id:
                domain.append(('company_id', '=', tenant_id))

            Calendar = request.env['resource.calendar'].sudo()
            total_count = Calendar.search_count(domain)
            calendars = Calendar.search(domain, limit=limit, offset=offset, order='name')

            calendars_data = []
            for cal in calendars:
                # Récupérer les horaires
                attendances_data = []
                for att in cal.attendance_ids:
                    attendances_data.append({
                        'dayofweek': att.dayofweek,
                        'day_period': att.day_period,
                        'hour_from': att.hour_from,
                        'hour_to': att.hour_to,
                        'name': att.name,
                    })

                calendars_data.append({
                    'id': cal.id,
                    'name': cal.name,
                    'tz': cal.tz,
                    'hours_per_day': cal.hours_per_day,
                    'full_time_required_hours': cal.full_time_required_hours,
                    'company_id': cal.company_id.id if cal.company_id else None,
                    'attendances': attendances_data,
                })

            return {
                'success': True,
                'calendars': calendars_data,
                'total_count': total_count,
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    @http.route('/api/ecommerce/calendars/create', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def create_calendar(self, name, tz='UTC', hours_per_day=8.0, attendances=None, tenant_id=None, **kwargs):
        """
        Créer un nouveau calendrier ressource.

        Args:
            name (str): Nom du calendrier
            tz (str): Fuseau horaire (ex: 'Africa/Tunis')
            hours_per_day (float): Heures par jour
            attendances (list): Liste horaires [{dayofweek, hour_from, hour_to, name}]
            tenant_id (int): ID tenant

        Returns:
            dict: {
                'success': bool,
                'calendar': dict
            }
        """
        try:
            vals = {
                'name': name,
                'tz': tz,
                'hours_per_day': hours_per_day,
            }

            if tenant_id:
                vals['company_id'] = tenant_id

            calendar = request.env['resource.calendar'].sudo().create(vals)

            # Créer les plages horaires
            if attendances:
                for att in attendances:
                    att_vals = {
                        'calendar_id': calendar.id,
                        'dayofweek': att.get('dayofweek'),
                        'hour_from': att.get('hour_from'),
                        'hour_to': att.get('hour_to'),
                        'name': att.get('name', ''),
                        'day_period': att.get('day_period', 'morning'),
                    }
                    request.env['resource.calendar.attendance'].sudo().create(att_vals)

            return {
                'success': True,
                'calendar': {
                    'id': calendar.id,
                    'name': calendar.name,
                    'tz': calendar.tz,
                },
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    @http.route('/api/ecommerce/warehouses/<int:warehouse_id>/plan-delivery', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def plan_delivery_date(self, warehouse_id, date_from, delta_days, **kwargs):
        """
        Calculer une date de livraison selon le calendrier de l'entrepôt.

        Args:
            warehouse_id (int): ID entrepôt
            date_from (str): Date départ (ISO format)
            delta_days (int): Nombre de jours à ajouter (jours ouvrables si calendrier)

        Returns:
            dict: {
                'success': bool,
                'delivery_date': str (ISO)
            }
        """
        try:
            warehouse = request.env['stock.warehouse'].sudo().browse(warehouse_id)

            if not warehouse.exists():
                return {'success': False, 'error': 'Warehouse not found'}

            # Parser la date
            date_ref = datetime.fromisoformat(date_from.replace('Z', '+00:00'))

            # Calculer selon calendrier
            if hasattr(warehouse, 'wh_plan_days'):
                delivery_date = warehouse.wh_plan_days(date_ref, delta_days)
            else:
                # Fallback si méthode non disponible
                from datetime import timedelta
                delivery_date = date_ref + timedelta(days=delta_days)

            return {
                'success': True,
                'delivery_date': delivery_date.isoformat(),
                'used_calendar': warehouse.calendar_id.name if warehouse.calendar_id else None,
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }
