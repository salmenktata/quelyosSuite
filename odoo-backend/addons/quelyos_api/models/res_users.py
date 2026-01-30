# -*- coding: utf-8 -*-
"""
Extension res.users pour multi-tenant.

Ajoute le champ tenant_id aux utilisateurs pour permettre les règles ir.rule
d'isolation des données par tenant.
"""

from odoo import models, fields, api


class ResUsersMultiTenant(models.Model):
    """Extension de res.users avec support multi-tenant."""
    _inherit = 'res.users'

    # Champ tenant_id calculé à partir de la company de l'utilisateur
    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        compute='_compute_tenant_id',
        store=True,
        index=True,
        help="Tenant associé à l'utilisateur (basé sur sa company)"
    )

    @api.depends('company_id')
    def _compute_tenant_id(self):
        """Calcule le tenant_id à partir de la company de l'utilisateur."""
        Tenant = self.env['quelyos.tenant'].sudo()
        for user in self:
            if user.company_id:
                # Chercher le tenant associé à cette company
                tenant = Tenant.search([
                    ('company_id', '=', user.company_id.id)
                ], limit=1)
                user.tenant_id = tenant.id if tenant else False
            else:
                user.tenant_id = False
