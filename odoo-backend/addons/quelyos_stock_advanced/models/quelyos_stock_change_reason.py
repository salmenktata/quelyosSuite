# -*- coding: utf-8 -*-
"""
Raisons de changement de stock - Quelyos Native

Permet de tracer les motifs d'ajustements de stock (casse, vol, inventaire, etc.)
Remplace le module OCA stock_change_qty_reason.
"""
from odoo import models, fields, api
from odoo.exceptions import ValidationError
from odoo.tools.translate import _


class QuelyosStockChangeReason(models.Model):
    _name = 'quelyos.stock.change.reason'
    _description = 'Raison de Changement de Stock Quelyos'
    _order = 'name'

    name = fields.Char(
        string='Nom',
        required=True,
        translate=True,
        help="Nom de la raison (ex: Casse, Vol, Inventaire physique)"
    )

    code = fields.Char(
        string='Code',
        help="Code court optionnel pour identification rapide"
    )

    description = fields.Text(
        string='Description',
        translate=True,
        help="Description détaillée de la raison"
    )

    active = fields.Boolean(
        string='Actif',
        default=True,
        help="Décocher pour archiver la raison sans la supprimer"
    )

    usage_count = fields.Integer(
        string='Nombre d\'utilisations',
        compute='_compute_usage_count',
        store=False,
        help="Nombre de fois que cette raison a été utilisée"
    )

    @api.depends()
    def _compute_usage_count(self):
        """Calculer le nombre d'utilisations de cette raison"""
        # Pour l'instant, on met à 0
        # Plus tard, on comptera les ajustements de stock liés
        for record in self:
            record.usage_count = 0

    @api.constrains('code')
    def _check_code_unique(self):
        """Contrainte: Le code doit être unique"""
        for record in self:
            if record.code:
                duplicate = self.search([
                    ('code', '=', record.code),
                    ('id', '!=', record.id)
                ], limit=1)
                if duplicate:
                    raise ValidationError(_('Le code doit être unique !'))
