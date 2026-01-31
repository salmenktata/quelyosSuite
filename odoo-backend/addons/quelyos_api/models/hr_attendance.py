# -*- coding: utf-8 -*-
"""
Extension du modèle Présences/Pointages RH natif Odoo.

Ajoute le support multi-tenant, géolocalisation, modes de pointage et méthodes API.
Hérite de hr.attendance pour bénéficier de l'intégration avec hr_payroll (Work Entries).
"""

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
from datetime import timedelta


class HRAttendance(models.Model):
    _inherit = 'hr.attendance'

    # ═══════════════════════════════════════════════════════════════════════════
    # MULTI-TENANT (Extension Quelyos)
    # ═══════════════════════════════════════════════════════════════════════════

    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        ondelete='cascade',
        index=True
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # HEURES SUPPLÉMENTAIRES (Extension)
    # ═══════════════════════════════════════════════════════════════════════════

    x_overtime = fields.Float(
        string='Heures supplémentaires',
        compute='_compute_overtime',
        store=True,
        readonly=True,
        help="Heures au-delà de 8h/jour"
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # MODE DE POINTAGE (Extension)
    # ═══════════════════════════════════════════════════════════════════════════

    x_check_in_mode = fields.Selection([
        ('manual', 'Manuel'),
        ('kiosk', 'Kiosque'),
        ('badge', 'Badge/NFC'),
        ('gps', 'GPS Mobile'),
        ('qr', 'QR Code'),
    ], string='Mode entrée', default='manual')

    x_check_out_mode = fields.Selection([
        ('manual', 'Manuel'),
        ('kiosk', 'Kiosque'),
        ('badge', 'Badge/NFC'),
        ('gps', 'GPS Mobile'),
        ('qr', 'QR Code'),
    ], string='Mode sortie')

    # ═══════════════════════════════════════════════════════════════════════════
    # GÉOLOCALISATION (Extension)
    # ═══════════════════════════════════════════════════════════════════════════

    x_check_in_latitude = fields.Float(
        string='Latitude entrée',
        digits=(10, 7)
    )
    x_check_in_longitude = fields.Float(
        string='Longitude entrée',
        digits=(10, 7)
    )
    x_check_out_latitude = fields.Float(
        string='Latitude sortie',
        digits=(10, 7)
    )
    x_check_out_longitude = fields.Float(
        string='Longitude sortie',
        digits=(10, 7)
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # VALIDATION (Extension)
    # ═══════════════════════════════════════════════════════════════════════════

    x_attendance_state = fields.Selection([
        ('draft', 'Brouillon'),
        ('confirmed', 'Confirmé'),
        ('validated', 'Validé'),
        ('anomaly', 'Anomalie'),
    ], string='État validation', default='confirmed')

    x_anomaly_reason = fields.Char(
        string='Raison anomalie'
    )
    x_validated_by = fields.Many2one(
        'res.users',
        string='Validé par'
    )
    x_validated_date = fields.Datetime(
        string='Date validation'
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # NOTES (Extension)
    # ═══════════════════════════════════════════════════════════════════════════

    x_notes = fields.Text(
        string='Notes'
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # COMPUTED
    # ═══════════════════════════════════════════════════════════════════════════

    @api.depends('worked_hours')
    def _compute_overtime(self):
        standard_hours = 8.0  # TODO: Configurable par tenant/pays
        for attendance in self:
            if attendance.worked_hours > standard_hours:
                attendance.overtime = attendance.worked_hours - standard_hours
            else:
                attendance.overtime = 0.0

    # ═══════════════════════════════════════════════════════════════════════════
    # ACTIONS
    # ═══════════════════════════════════════════════════════════════════════════

    def action_validate(self):
        """Valider le pointage."""
        self.write({
            'x_attendance_state': 'validated',
            'x_validated_by': self.env.user.id,
            'x_validated_date': fields.Datetime.now(),
        })

    def action_mark_anomaly(self, reason=None):
        """Marquer comme anomalie."""
        self.write({
            'x_attendance_state': 'anomaly',
            'x_anomaly_reason': reason or _("Anomalie détectée"),
        })

    # ═══════════════════════════════════════════════════════════════════════════
    # MÉTHODES API (pour frontend React)
    # ═══════════════════════════════════════════════════════════════════════════

    @api.model
    def check_in_employee(self, employee_id, tenant_id, mode='manual', latitude=None, longitude=None):
        """Pointer l'entrée d'un employé."""
        existing = self.search([
            ('employee_id', '=', employee_id),
            ('check_out', '=', False),
        ], limit=1)
        if existing:
            raise ValidationError(_("L'employé a déjà un pointage en cours !"))

        attendance = self.create({
            'employee_id': employee_id,
            'tenant_id': tenant_id,
            'check_in': fields.Datetime.now(),
            'x_check_in_mode': mode,
            'x_check_in_latitude': latitude,
            'x_check_in_longitude': longitude,
        })
        return attendance.get_attendance_data()

    @api.model
    def check_out_employee(self, employee_id, tenant_id, mode='manual', latitude=None, longitude=None):
        """Pointer la sortie d'un employé."""
        attendance = self.search([
            ('employee_id', '=', employee_id),
            ('check_out', '=', False),
        ], limit=1, order='check_in desc')

        if not attendance:
            raise ValidationError(_("Aucun pointage d'entrée trouvé !"))

        attendance.write({
            'check_out': fields.Datetime.now(),
            'x_check_out_mode': mode,
            'x_check_out_latitude': latitude,
            'x_check_out_longitude': longitude,
        })
        return attendance.get_attendance_data()

    def get_attendance_data(self):
        """Retourne les données du pointage pour l'API."""
        self.ensure_one()
        return {
            'id': self.id,
            'employee_id': self.employee_id.id,
            'employee_name': self.employee_id.name,
            'employee_number': self.employee_id.employee_number if hasattr(self.employee_id, 'employee_number') else '',
            'department_name': self.employee_id.department_id.name if self.employee_id.department_id else None,
            'check_in': self.check_in.isoformat() if self.check_in else None,
            'check_out': self.check_out.isoformat() if self.check_out else None,
            'worked_hours': round(self.worked_hours, 2),
            'x_overtime': round(self.x_overtime, 2),
            'x_check_in_mode': self.x_check_in_mode,
            'x_check_out_mode': self.x_check_out_mode,
            'state': self.x_attendance_state,
            'location': {
                'check_in': {
                    'latitude': self.x_check_in_latitude,
                    'longitude': self.x_check_in_longitude,
                } if self.x_check_in_latitude else None,
                'check_out': {
                    'latitude': self.x_check_out_latitude,
                    'longitude': self.x_check_out_longitude,
                } if self.x_check_out_latitude else None,
            },
            'x_notes': self.x_notes or '',
        }

    @api.model
    def get_today_summary(self, tenant_id):
        """Résumé des présences du jour."""
        today_start = fields.Datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)

        attendances = self.search([
            ('tenant_id', '=', tenant_id),
            ('check_in', '>=', today_start),
            ('check_in', '<', today_end),
        ])

        total_employees = self.env['hr.employee'].search_count([
            ('tenant_id', '=', tenant_id),
            ('employee_state', '=', 'active'),
        ])

        present_employees = len(attendances.mapped('employee_id'))
        currently_in = len(attendances.filtered(lambda a: not a.check_out))

        return {
            'date': today_start.date().isoformat(),
            'total_employees': total_employees,
            'present_today': present_employees,
            'currently_in': currently_in,
            'absent': total_employees - present_employees,
            'attendances': [a.get_attendance_data() for a in attendances[:50]],
        }

    @api.model
    def get_period_report(self, tenant_id, date_from, date_to, employee_id=None, department_id=None):
        """Rapport de présences sur une période."""
        domain = [
            ('tenant_id', '=', tenant_id),
            ('check_in', '>=', date_from),
            ('check_in', '<=', date_to),
        ]
        if employee_id:
            domain.append(('employee_id', '=', employee_id))
        if department_id:
            domain.append(('employee_id.department_id', '=', department_id))

        attendances = self.search(domain, order='check_in')

        by_employee = {}
        for att in attendances:
            emp_id = att.employee_id.id
            if emp_id not in by_employee:
                by_employee[emp_id] = {
                    'employee_id': emp_id,
                    'employee_name': att.employee_id.name,
                    'employee_number': att.employee_id.employee_number if hasattr(att.employee_id, 'employee_number') else '',
                    'total_hours': 0,
                    'overtime_hours': 0,
                    'days_present': set(),
                    'attendances': [],
                }
            by_employee[emp_id]['total_hours'] += att.worked_hours
            by_employee[emp_id]['overtime_hours'] += att.overtime
            by_employee[emp_id]['days_present'].add(att.check_in.date())
            by_employee[emp_id]['attendances'].append(att.get_attendance_data())

        for emp_data in by_employee.values():
            emp_data['days_present'] = len(emp_data['days_present'])
            emp_data['total_hours'] = round(emp_data['total_hours'], 2)
            emp_data['overtime_hours'] = round(emp_data['overtime_hours'], 2)

        return {
            'date_from': date_from,
            'date_to': date_to,
            'employees': list(by_employee.values()),
            'total_entries': len(attendances),
        }
