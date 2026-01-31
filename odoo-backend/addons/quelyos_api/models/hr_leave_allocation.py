# -*- coding: utf-8 -*-
"""
Extension du modèle Allocations de Congés RH natif Odoo.

Ajoute le support multi-tenant et les méthodes API pour le frontend React.
Hérite de hr.leave.allocation pour bénéficier de l'intégration avec hr_holidays.
"""

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class HRLeaveAllocation(models.Model):
    _inherit = 'hr.leave.allocation'

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
    # CHAMPS ADDITIONNELS
    # ═══════════════════════════════════════════════════════════════════════════

    x_reference = fields.Char(
        string='Référence',
        readonly=True,
        copy=False,
        default='Nouveau'
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # CRUD
    # ═══════════════════════════════════════════════════════════════════════════

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('reference', 'Nouveau') == 'Nouveau':
                vals['reference'] = self.env['ir.sequence'].next_by_code('quelyos.hr.leave.allocation') or 'ALLOC-0001'
        return super().create(vals_list)

    # ═══════════════════════════════════════════════════════════════════════════
    # MÉTHODES BULK
    # ═══════════════════════════════════════════════════════════════════════════

    @api.model
    def create_yearly_allocations(self, tenant_id, leave_type_id, number_of_days, year=None):
        """Créer des allocations annuelles pour tous les employés actifs."""
        if not year:
            year = fields.Date.today().year

        date_from = fields.Date.today().replace(year=year, month=1, day=1)
        date_to = fields.Date.today().replace(year=year, month=12, day=31)

        employees = self.env['hr.employee'].search([
            ('tenant_id', '=', tenant_id),
            ('employee_state', '=', 'active'),
        ])

        allocations = []
        for employee in employees:
            existing = self.search([
                ('employee_id', '=', employee.id),
                ('holiday_status_id', '=', leave_type_id),
                ('date_from', '=', date_from),
                ('date_to', '=', date_to),
            ], limit=1)
            if not existing:
                allocations.append({
                    'employee_id': employee.id,
                    'holiday_status_id': leave_type_id,
                    'number_of_days': number_of_days,
                    'date_from': date_from,
                    'date_to': date_to,
                    'tenant_id': tenant_id,
                    'state': 'validate',
                    'allocation_type': 'regular',
                })

        if allocations:
            self.create(allocations)
        return len(allocations)

    # ═══════════════════════════════════════════════════════════════════════════
    # MÉTHODES API (pour frontend React)
    # ═══════════════════════════════════════════════════════════════════════════

    def get_allocation_data(self):
        """Retourne les données de l'allocation pour l'API."""
        self.ensure_one()
        leave_type = self.holiday_status_id
        return {
            'id': self.id,
            'x_reference': self.x_reference or '',
            'name': self.name,
            'employee_id': self.employee_id.id,
            'employee_name': self.employee_id.name,
            'leave_type_id': leave_type.id,
            'leave_type_name': leave_type.name,
            'leave_type_code': leave_type.code if hasattr(leave_type, 'code') else '',
            'number_of_days': self.number_of_days,
            'leaves_taken': self.leaves_taken,
            'max_leaves': self.max_leaves,
            'date_from': self.date_from.isoformat() if self.date_from else None,
            'date_to': self.date_to.isoformat() if self.date_to else None,
            'allocation_type': self.allocation_type,
            'state': self.state,
            'notes': self.notes or '',
        }

    @api.model
    def get_employee_balances(self, tenant_id, employee_id):
        """Retourne tous les soldes de congés d'un employé."""
        today = fields.Date.today()
        allocations = self.search([
            ('tenant_id', '=', tenant_id),
            ('employee_id', '=', employee_id),
            ('state', '=', 'validate'),
            ('date_from', '<=', today),
            ('date_to', '>=', today),
        ])

        balances = {}
        for alloc in allocations:
            lt_id = alloc.holiday_status_id.id
            if lt_id not in balances:
                balances[lt_id] = {
                    'leave_type_id': lt_id,
                    'leave_type_name': alloc.holiday_status_id.name,
                    'leave_type_code': alloc.holiday_status_id.code if hasattr(alloc.holiday_status_id, 'code') else '',
                    'allocated': 0,
                    'taken': 0,
                    'remaining': 0,
                }
            balances[lt_id]['allocated'] += alloc.number_of_days
            balances[lt_id]['taken'] += alloc.leaves_taken
            balances[lt_id]['remaining'] += alloc.max_leaves

        return list(balances.values())

    @api.model
    def get_department_summary(self, tenant_id, department_id=None):
        """Résumé des allocations par département."""
        today = fields.Date.today()
        domain = [
            ('tenant_id', '=', tenant_id),
            ('state', '=', 'validate'),
            ('date_from', '<=', today),
            ('date_to', '>=', today),
        ]
        if department_id:
            domain.append(('department_id', '=', department_id))

        allocations = self.search(domain)

        summary = {}
        for alloc in allocations:
            dept_id = alloc.department_id.id if alloc.department_id else 0
            dept_name = alloc.department_id.name if alloc.department_id else 'Non assigné'

            if dept_id not in summary:
                summary[dept_id] = {
                    'department_id': dept_id or None,
                    'department_name': dept_name,
                    'total_allocated': 0,
                    'total_taken': 0,
                    'total_remaining': 0,
                    'employees_count': set(),
                }
            summary[dept_id]['total_allocated'] += alloc.number_of_days
            summary[dept_id]['total_taken'] += alloc.leaves_taken
            summary[dept_id]['total_remaining'] += alloc.max_leaves
            summary[dept_id]['employees_count'].add(alloc.employee_id.id)

        for dept_data in summary.values():
            dept_data['employees_count'] = len(dept_data['employees_count'])

        return list(summary.values())
