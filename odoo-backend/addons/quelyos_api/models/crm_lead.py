# -*- coding: utf-8 -*-
"""
Extension CRM pour support multi-tenant.

Ajoute le champ tenant_id sur crm.lead et crm.stage pour permettre
à chaque tenant d'avoir son propre pipeline CRM séparé.
"""

from odoo import models, fields, api


class CrmStage(models.Model):
    """Extension crm.stage pour multi-tenant"""
    _inherit = 'crm.stage'

    # ═══════════════════════════════════════════════════════════════════════════
    # MULTI-TENANT
    # ═══════════════════════════════════════════════════════════════════════════

    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        index=True,
        ondelete='cascade',
        help='Tenant propriétaire de cette étape. Si vide, étape globale.',
    )

    is_global = fields.Boolean(
        string='Étape Globale',
        compute='_compute_is_global',
        store=True,
        help='Étape partagée par tous les tenants',
    )

    @api.depends('tenant_id')
    def _compute_is_global(self):
        for stage in self:
            stage.is_global = not stage.tenant_id


class CrmLead(models.Model):
    """Extension crm.lead pour multi-tenant"""
    _inherit = 'crm.lead'

    # ═══════════════════════════════════════════════════════════════════════════
    # MULTI-TENANT
    # ═══════════════════════════════════════════════════════════════════════════

    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        index=True,
        ondelete='cascade',
        required=False,  # Non obligatoire en DB pour migration progressive
        help='Tenant propriétaire de ce lead/opportunité',
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # CONTRAINTES
    # ═══════════════════════════════════════════════════════════════════════════

    @api.constrains('stage_id', 'tenant_id')
    def _check_stage_tenant(self):
        """Vérifier que le stage appartient au même tenant ou est global"""
        for lead in self:
            if lead.stage_id and lead.stage_id.tenant_id:
                if lead.stage_id.tenant_id != lead.tenant_id:
                    raise models.ValidationError(
                        f"L'étape '{lead.stage_id.name}' n'appartient pas au tenant '{lead.tenant_id.name}'"
                    )

    # ═══════════════════════════════════════════════════════════════════════════
    # DOMAINE DYNAMIQUE POUR STAGE
    # ═══════════════════════════════════════════════════════════════════════════

    @api.onchange('tenant_id')
    def _onchange_tenant_id(self):
        """Réinitialiser le stage si le tenant change"""
        if self.tenant_id and self.stage_id:
            if self.stage_id.tenant_id and self.stage_id.tenant_id != self.tenant_id:
                self.stage_id = False

    def _get_default_stage_id(self):
        """Override pour filtrer par tenant"""
        if self.env.context.get('default_tenant_id'):
            tenant_id = self.env.context['default_tenant_id']
            stage = self.env['crm.stage'].search([
                '|',
                ('tenant_id', '=', tenant_id),
                ('tenant_id', '=', False),
            ], order='sequence asc', limit=1)
            return stage.id if stage else False
        return super()._get_default_stage_id() if hasattr(super(), '_get_default_stage_id') else False
