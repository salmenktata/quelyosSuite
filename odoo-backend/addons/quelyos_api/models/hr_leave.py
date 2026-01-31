# -*- coding: utf-8 -*-
"""
Extension du modèle Demandes de Congés RH natif Odoo.

Ajoute le support multi-tenant et les méthodes API pour le frontend React.
Hérite de hr.leave pour bénéficier de l'intégration avec hr_holidays et hr_payroll.
"""

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError, UserError
from datetime import timedelta


class HRLeave(models.Model):
    _inherit = 'hr.leave'

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
    x_refuse_reason = fields.Text(
        string='Motif de refus'
    )
    x_refused_date = fields.Datetime(
        string='Date refus'
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # CONTRAINTES ADDITIONNELLES
    # ═══════════════════════════════════════════════════════════════════════════

    @api.constrains('holiday_status_id', 'request_date_from')
    def _check_notice_period(self):
        """Vérifier le préavis minimum si configuré."""
        for leave in self:
            if leave.state in ('draft', 'cancel', 'refuse'):
                continue
            min_notice = leave.holiday_status_id.min_notice_days if hasattr(leave.holiday_status_id, 'min_notice_days') else 0
            if min_notice:
                min_date = fields.Date.today() + timedelta(days=min_notice)
                if leave.request_date_from and leave.request_date_from < min_date:
                    raise ValidationError(_(
                        "Un préavis de %d jours est requis pour ce type de congé !"
                    ) % min_notice)

    # ═══════════════════════════════════════════════════════════════════════════
    # CRUD
    # ═══════════════════════════════════════════════════════════════════════════

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('reference', 'Nouveau') == 'Nouveau':
                vals['reference'] = self.env['ir.sequence'].next_by_code('quelyos.hr.leave') or 'DEM-0001'
        return super().create(vals_list)

    # ═══════════════════════════════════════════════════════════════════════════
    # ACTIONS SUPPLÉMENTAIRES
    # ═══════════════════════════════════════════════════════════════════════════

    def action_refuse_with_reason(self, reason=None):
        """Refuser avec motif."""
        self.write({
            'x_refuse_reason': reason,
            'x_refused_date': fields.Datetime.now(),
        })
        return self.action_refuse()

    # ═══════════════════════════════════════════════════════════════════════════
    # MÉTHODES API (pour frontend React)
    # ═══════════════════════════════════════════════════════════════════════════

    def get_leave_data(self):
        """Retourne les données de la demande pour l'API."""
        self.ensure_one()
        leave_type = self.holiday_status_id
        return {
            'id': self.id,
            'x_reference': self.x_reference or '',
            'name': self.name,
            'employee_id': self.employee_id.id,
            'employee_name': self.employee_id.name,
            'department_name': self.department_id.name if self.department_id else None,
            'leave_type_id': leave_type.id,
            'leave_type_name': leave_type.name,
            'leave_type_code': leave_type.code if hasattr(leave_type, 'code') else '',
            'leave_type_color': leave_type.color,
            'date_from': self.date_from.isoformat() if self.date_from else None,
            'date_to': self.date_to.isoformat() if self.date_to else None,
            'number_of_days': self.number_of_days,
            'request_unit_half': self.request_unit_half,
            'state': self.state,
            'notes': self.private_name or '',
            'manager_name': self.employee_id.parent_id.name if self.employee_id.parent_id else None,
            'first_approver': self.first_approver_id.name if self.first_approver_id else None,
            'validated_date': self.date_approve.isoformat() if hasattr(self, 'date_approve') and self.date_approve else None,
            'x_refuse_reason': self.x_refuse_reason or '',
            'has_attachments': bool(self.supported_attachment_ids) if hasattr(self, 'supported_attachment_ids') else False,
        }

    @api.model
    def get_calendar_data(self, tenant_id, date_from, date_to, department_id=None):
        """Retourne les congés pour l'affichage calendrier."""
        domain = [
            ('tenant_id', '=', tenant_id),
            ('state', 'in', ('confirm', 'validate1', 'validate')),
            ('date_from', '<=', date_to),
            ('date_to', '>=', date_from),
        ]
        if department_id:
            domain.append(('department_id', '=', department_id))

        leaves = self.search(domain)
        return [{
            'id': leave.id,
            'title': f"{leave.employee_id.name} - {leave.holiday_status_id.code if hasattr(leave.holiday_status_id, 'code') else leave.holiday_status_id.name[:3]}",
            'start': leave.date_from.isoformat(),
            'end': leave.date_to.isoformat(),
            'color': leave.holiday_status_id.color,
            'employee_id': leave.employee_id.id,
            'employee_name': leave.employee_id.name,
            'leave_type': leave.holiday_status_id.name,
            'state': leave.state,
            'days': leave.number_of_days,
        } for leave in leaves]

    @api.model
    def get_pending_approvals(self, tenant_id, manager_employee_id=None):
        """Retourne les demandes en attente d'approbation."""
        domain = [
            ('tenant_id', '=', tenant_id),
            ('state', 'in', ('confirm', 'validate1')),
        ]
        if manager_employee_id:
            domain.append(('employee_id.parent_id', '=', manager_employee_id))

        leaves = self.search(domain, order='date_from')
        return [leave.get_leave_data() for leave in leaves]
