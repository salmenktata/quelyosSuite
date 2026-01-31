# -*- coding: utf-8 -*-
"""
Contrôleur API REST pour fonctionnalités OCA HR
Modules : hr_attendance_reason, hr_attendance_report_theoretical_time
"""

import logging
from datetime import datetime
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class HROCAController(http.Controller):
    """API REST pour modules OCA HR"""

    # ==================== HR ATTENDANCE REASONS ====================

    @http.route('/api/hr/attendance/reasons', type='json', auth='user', methods=['POST'], csrf=False)
    def get_attendance_reasons(self, **kwargs):
        """
        Liste des raisons d'absence/retard
        
        Returns:
            list: Liste des raisons
        """
        try:
            reasons = request.env['hr.attendance.reason'].sudo().search([])
            
            return {
                'success': True,
                'data': [{
                    'id': r.id,
                    'name': r.name,
                    'code': r.code if hasattr(r, 'code') else '',
                } for r in reasons]
            }
        
        except Exception as e:
            _logger.error("Erreur get_attendance_reasons: %s", e)
            return {'success': False, 'error': str(e)}

    @http.route('/api/hr/attendance/reasons/create', type='json', auth='user', methods=['POST'], csrf=False)
    def create_attendance_reason(self, **kwargs):
        """
        Créer une raison d'absence/retard
        
        Params:
            name (str): Nom de la raison
            code (str, optional): Code court
        
        Returns:
            dict: Raison créée
        """
        try:
            name = kwargs.get('name')
            code = kwargs.get('code', '')
            
            if not name:
                return {'success': False, 'error': 'name requis'}
            
            vals = {'name': name}
            if code:
                vals['code'] = code
            
            reason = request.env['hr.attendance.reason'].sudo().create(vals)
            
            return {
                'success': True,
                'data': {
                    'id': reason.id,
                    'name': reason.name,
                    'code': reason.code if hasattr(reason, 'code') else '',
                }
            }
        
        except Exception as e:
            _logger.error("Erreur create_attendance_reason: %s", e)
            return {'success': False, 'error': str(e)}

    @http.route('/api/hr/attendance/<int:attendance_id>/set-reason', type='json', auth='user', methods=['POST'], csrf=False)
    def set_attendance_reason(self, attendance_id, **kwargs):
        """
        Assigner une raison à un pointage
        
        Params:
            reason_id (int): ID de la raison
            notes (str, optional): Notes additionnelles
        
        Returns:
            dict: Pointage mis à jour
        """
        try:
            reason_id = kwargs.get('reason_id')
            notes = kwargs.get('notes', '')
            
            if not reason_id:
                return {'success': False, 'error': 'reason_id requis'}
            
            attendance = request.env['hr.attendance'].sudo().browse(attendance_id)
            
            if not attendance.exists():
                return {'success': False, 'error': 'Pointage non trouvé'}
            
            attendance.write({
                'attendance_reason_ids': [(4, reason_id)],
            })
            
            return {
                'success': True,
                'data': {
                    'id': attendance.id,
                    'employee_id': attendance.employee_id.id,
                    'employee_name': attendance.employee_id.name,
                    'check_in': attendance.check_in.isoformat() if attendance.check_in else None,
                    'check_out': attendance.check_out.isoformat() if attendance.check_out else None,
                    'reasons': [{'id': r.id, 'name': r.name} for r in attendance.attendance_reason_ids],
                }
            }
        
        except Exception as e:
            _logger.error("Erreur set_attendance_reason: %s", e)
            return {'success': False, 'error': str(e)}

    # ==================== THEORETICAL TIME REPORT ====================

    @http.route('/api/hr/attendance/theoretical-report', type='json', auth='user', methods=['POST'], csrf=False)
    def get_theoretical_time_report(self, **kwargs):
        """
        Rapport temps théorique vs réel pour un employé
        
        Params:
            employee_id (int): ID de l'employé
            date_from (str): Date début (YYYY-MM-DD)
            date_to (str): Date fin (YYYY-MM-DD)
        
        Returns:
            dict: Rapport détaillé
        """
        try:
            employee_id = kwargs.get('employee_id')
            date_from = kwargs.get('date_from')
            date_to = kwargs.get('date_to')
            
            if not all([employee_id, date_from, date_to]):
                return {'success': False, 'error': 'employee_id, date_from, date_to requis'}
            
            employee = request.env['hr.employee'].sudo().browse(employee_id)
            
            if not employee.exists():
                return {'success': False, 'error': 'Employé non trouvé'}
            
            # Rechercher les pointages
            attendances = request.env['hr.attendance'].sudo().search([
                ('employee_id', '=', employee_id),
                ('check_in', '>=', date_from),
                ('check_in', '<=', date_to + ' 23:59:59'),
            ], order='check_in desc')
            
            attendance_details = []
            total_worked_hours = 0.0
            
            for att in attendances:
                worked_hours = att.worked_hours if hasattr(att, 'worked_hours') else 0.0
                total_worked_hours += worked_hours
                
                attendance_details.append({
                    'id': att.id,
                    'check_in': att.check_in.isoformat() if att.check_in else None,
                    'check_out': att.check_out.isoformat() if att.check_out else None,
                    'worked_hours': worked_hours,
                })
            
            # Calcul temps théorique (basé sur calendrier employé)
            # Pour simplicité, on suppose 8h/jour * nb jours ouvrés
            date_from_dt = datetime.strptime(date_from, '%Y-%m-%d')
            date_to_dt = datetime.strptime(date_to, '%Y-%m-%d')
            days = (date_to_dt - date_from_dt).days + 1
            theoretical_hours = days * 8.0  # Simplifié
            
            difference = total_worked_hours - theoretical_hours
            
            return {
                'success': True,
                'data': {
                    'employee_id': employee.id,
                    'employee_name': employee.name,
                    'date_from': date_from,
                    'date_to': date_to,
                    'theoretical_hours': theoretical_hours,
                    'worked_hours': total_worked_hours,
                    'difference': difference,
                    'difference_percentage': (difference / theoretical_hours * 100) if theoretical_hours > 0 else 0,
                    'attendance_count': len(attendance_details),
                    'attendance_details': attendance_details,
                }
            }
        
        except Exception as e:
            _logger.error("Erreur get_theoretical_time_report: %s", e)
            return {'success': False, 'error': str(e)}

    @http.route('/api/hr/attendance/<int:attendance_id>/theoretical-time', type='json', auth='user', methods=['POST'], csrf=False)
    def get_attendance_theoretical_time(self, attendance_id, **kwargs):
        """
        Temps théorique pour un pointage spécifique
        
        Returns:
            dict: Comparaison théorique vs réel
        """
        try:
            attendance = request.env['hr.attendance'].sudo().browse(attendance_id)
            
            if not attendance.exists():
                return {'success': False, 'error': 'Pointage non trouvé'}
            
            # Pour simplicité, on suppose horaires 9h-17h (8h/jour)
            theoretical_start = '09:00'
            theoretical_end = '17:00'
            
            actual_start = attendance.check_in.strftime('%H:%M') if attendance.check_in else None
            actual_end = attendance.check_out.strftime('%H:%M') if attendance.check_out else None
            
            worked_hours = attendance.worked_hours if hasattr(attendance, 'worked_hours') else 0.0
            diff_minutes = (worked_hours - 8.0) * 60  # Différence en minutes vs 8h théoriques
            
            return {
                'success': True,
                'data': {
                    'attendance_id': attendance.id,
                    'employee_name': attendance.employee_id.name,
                    'date': attendance.check_in.strftime('%Y-%m-%d') if attendance.check_in else None,
                    'theoretical_start': theoretical_start,
                    'theoretical_end': theoretical_end,
                    'actual_start': actual_start,
                    'actual_end': actual_end,
                    'worked_hours': worked_hours,
                    'theoretical_hours': 8.0,
                    'diff_minutes': diff_minutes,
                    'status': 'overtime' if diff_minutes > 0 else 'undertime' if diff_minutes < 0 else 'normal',
                }
            }
        
        except Exception as e:
            _logger.error("Erreur get_attendance_theoretical_time: %s", e)
            return {'success': False, 'error': str(e)}
