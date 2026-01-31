# -*- coding: utf-8 -*-
"""
Extension du modèle Types de Congés RH natif Odoo.

Ajoute le support multi-tenant et les méthodes API pour le frontend React.
Hérite de hr.leave.type pour bénéficier de l'intégration avec hr_holidays.
"""

from odoo import models, fields, api
from odoo.exceptions import ValidationError
from odoo.tools.translate import _


class HRLeaveType(models.Model):
    _inherit = 'hr.leave.type'

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

    x_code = fields.Char(
        string='Code',
        required=True,
        help="Code unique (ex: CP, MAL, SS)"
    )
    x_max_consecutive_days = fields.Float(
        string='Jours consécutifs max',
        help="Nombre maximum de jours consécutifs (0 = illimité)"
    )
    x_min_notice_days = fields.Integer(
        string='Préavis minimum (jours)',
        default=0,
        help="Délai minimum avant la date de début"
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # CONTRAINTES
    # ═══════════════════════════════════════════════════════════════════════════
    # ═══════════════════════════════════════════════════════════════════════════
    # MÉTHODES
    # ═══════════════════════════════════════════════════════════════════════════

    @api.constrains('code', 'tenant_id')
    def _check_code_tenant_uniq(self):
        """Contrainte: Ce code de type de congé existe déjà !"""
        for record in self:
            # Chercher un doublon
            duplicate = self.search([
                ('code', '=', record.x_code),
                ('tenant_id', '=', record.tenant_id),
                ('id', '!=', record.id)
            ], limit=1)

            if duplicate:
                raise ValidationError(_('Ce code de type de congé existe déjà !'))


    @api.model
    def create_default_types(self, tenant_id):
        """Créer les types de congés par défaut pour un tenant (Tunisie)."""
        tenant = self.env['quelyos.tenant'].browse(tenant_id)
        default_types = [
            {
                'name': 'Congés Payés',
                'x_code': 'CP',
                'color': 4,
                'requires_allocation': 'yes',
                'leave_validation_type': 'manager',
            },
            {
                'name': 'Congé Maladie',
                'x_code': 'MAL',
                'color': 1,
                'requires_allocation': 'no',
                'leave_validation_type': 'hr',
                'support_document': True,
            },
            {
                'name': 'Congé Sans Solde',
                'x_code': 'CSS',
                'color': 2,
                'requires_allocation': 'no',
                'leave_validation_type': 'both',
                'unpaid': True,
            },
            {
                'name': 'Congé Maternité',
                'x_code': 'MAT',
                'color': 6,
                'requires_allocation': 'no',
                'leave_validation_type': 'hr',
                'support_document': True,
            },
            {
                'name': 'Congé Paternité',
                'x_code': 'PAT',
                'color': 5,
                'requires_allocation': 'no',
                'leave_validation_type': 'hr',
            },
        ]

        for leave_type in default_types:
            leave_type['tenant_id'] = tenant_id
            leave_type['company_id'] = tenant.company_id.id
            existing = self.search([
                ('code', '=', leave_type['code']),
                ('tenant_id', '=', tenant_id),
            ], limit=1)
            if not existing:
                self.create(leave_type)

    def get_leave_type_data(self):
        """Retourne les données du type de congé pour l'API."""
        self.ensure_one()
        return {
            'id': self.id,
            'name': self.name,
            'x_code': self.x_code,
            'color': self.color,
            'requires_allocation': self.requires_allocation,
            'request_unit': self.request_unit,
            'leave_validation_type': self.leave_validation_type,
            'x_max_consecutive_days': self.x_max_consecutive_days,
            'x_min_notice_days': self.x_min_notice_days,
            'unpaid': self.unpaid,
            'support_document': self.support_document,
            'active': self.active,
        }
