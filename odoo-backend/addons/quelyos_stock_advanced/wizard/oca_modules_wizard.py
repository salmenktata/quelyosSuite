# -*- coding: utf-8 -*-
"""
Wizard pour afficher la liste des modules OCA
"""
from odoo import models, fields, api


class OCAModulesWizard(models.TransientModel):
    _name = 'quelyos.oca.modules.wizard'
    _description = 'Assistant Modules OCA'

    module_ids = fields.Many2many(
        'quelyos.oca.module.info',
        string='Modules OCA'
    )

    total_modules = fields.Integer(
        string='Total Modules',
        compute='_compute_stats'
    )
    installed_modules = fields.Integer(
        string='Modules Installés',
        compute='_compute_stats'
    )
    uninstalled_modules = fields.Integer(
        string='Modules Non Installés',
        compute='_compute_stats'
    )
    installation_rate = fields.Float(
        string='Taux d\'Installation (%)',
        compute='_compute_stats'
    )

    @api.depends('module_ids')
    def _compute_stats(self):
        for wizard in self:
            OCAInfo = self.env['quelyos.oca.module.info']
            stats = OCAInfo.get_summary_stats()

            wizard.total_modules = stats['total']
            wizard.installed_modules = stats['installed']
            wizard.uninstalled_modules = stats['uninstalled']
            wizard.installation_rate = stats['installation_rate']

    @api.model
    def default_get(self, fields_list):
        """
        Pré-remplit le wizard avec les infos des modules OCA
        """
        res = super().default_get(fields_list)

        OCAInfo = self.env['quelyos.oca.module.info']
        modules_data = OCAInfo.get_oca_modules_info()

        # Créer des records transients pour chaque module
        module_ids = []
        for module_data in modules_data:
            module = OCAInfo.create(module_data)
            module_ids.append(module.id)

        res['module_ids'] = [(6, 0, module_ids)]

        return res

    def action_view_modules(self):
        """
        Ouvre la vue liste des modules OCA
        """
        self.ensure_one()

        return {
            'type': 'ir.actions.act_window',
            'name': 'Modules OCA Utilisés',
            'res_model': 'quelyos.oca.module.info',
            'view_mode': 'tree,form',
            'domain': [('id', 'in', self.module_ids.ids)],
            'target': 'current',
        }
