# -*- coding: utf-8 -*-
"""
Extension account.move pour support multi-tenant.

Ajoute le champ tenant_id sur les écritures comptables (factures, avoirs, etc.)
pour permettre à chaque tenant d'avoir ses propres factures.
"""

from odoo import models, fields


class AccountMove(models.Model):
    """Extension account.move pour multi-tenant"""
    _inherit = 'account.move'

    # ═══════════════════════════════════════════════════════════════════════════
    # MULTI-TENANT
    # ═══════════════════════════════════════════════════════════════════════════

    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        index=True,
        ondelete='cascade',
        help='Tenant propriétaire de cette écriture comptable',
    )


class AccountMoveLine(models.Model):
    """Extension account.move.line pour multi-tenant (hérité)"""
    _inherit = 'account.move.line'

    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        related='move_id.tenant_id',
        store=True,
        index=True,
    )
