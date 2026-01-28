# -*- coding: utf-8 -*-
"""
Extension res.partner pour support multi-tenant.

Ajoute le champ tenant_id sur les contacts/clients pour permettre
à chaque tenant d'avoir ses propres clients isolés.
"""

from odoo import models, fields


class ResPartner(models.Model):
    """Extension res.partner pour multi-tenant"""
    _inherit = 'res.partner'

    # ═══════════════════════════════════════════════════════════════════════════
    # MULTI-TENANT
    # ═══════════════════════════════════════════════════════════════════════════

    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        index=True,
        ondelete='cascade',
        help='Tenant propriétaire de ce contact/client',
    )
