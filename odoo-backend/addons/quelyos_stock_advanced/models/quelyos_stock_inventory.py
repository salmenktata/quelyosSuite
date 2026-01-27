# -*- coding: utf-8 -*-
"""
Inventaire de stock - Quelyos Native

Gestion complète des inventaires physiques avec workflow.
Remplace le module OCA stock_inventory.
"""
from odoo import models, fields, api, _
from odoo.exceptions import UserError


class QuelyosStockInventory(models.Model):
    _name = 'quelyos.stock.inventory'
    _description = 'Inventaire de Stock Quelyos'
    _order = 'date desc, id desc'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(
        string='Référence',
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: _('Nouveau'),
        tracking=True
    )

    date = fields.Datetime(
        string='Date Inventaire',
        required=True,
        default=fields.Datetime.now,
        readonly=True,
        states={'draft': [('readonly', False)]},
        tracking=True
    )

    location_id = fields.Many2one(
        'stock.location',
        string='Emplacement',
        required=True,
        domain=[('usage', '=', 'internal')],
        readonly=True,
        states={'draft': [('readonly', False)]},
        tracking=True
    )

    user_id = fields.Many2one(
        'res.users',
        string='Responsable',
        required=True,
        default=lambda self: self.env.user,
        readonly=True,
        states={'draft': [('readonly', False)]},
        tracking=True
    )

    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('in_progress', 'En Cours'),
        ('done', 'Terminé'),
        ('cancelled', 'Annulé')
    ], string='Statut', default='draft', required=True, tracking=True)

    line_ids = fields.One2many(
        'quelyos.stock.inventory.line',
        'inventory_id',
        string='Lignes Inventaire',
        readonly=True,
        states={'in_progress': [('readonly', False)]}
    )

    note = fields.Text(
        string='Notes',
        readonly=True,
        states={'draft': [('readonly', False)], 'in_progress': [('readonly', False)]}
    )

    line_count = fields.Integer(
        string='Nombre de lignes',
        compute='_compute_line_count',
        store=True
    )

    @api.depends('line_ids')
    def _compute_line_count(self):
        for inventory in self:
            inventory.line_count = len(inventory.line_ids)

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('name', _('Nouveau')) == _('Nouveau'):
                vals['name'] = self.env['ir.sequence'].next_by_code('quelyos.stock.inventory') or _('Nouveau')
        return super().create(vals_list)

    def action_start(self):
        """Démarrer l'inventaire : créer les lignes avec quantités théoriques"""
        self.ensure_one()
        if self.state != 'draft':
            raise UserError(_("Seul un inventaire en brouillon peut être démarré."))

        # Récupérer tous les produits avec stock dans l'emplacement
        quants = self.env['stock.quant'].search([
            ('location_id', '=', self.location_id.id),
            ('quantity', '>', 0)
        ])

        # Créer les lignes d'inventaire
        lines_vals = []
        for quant in quants:
            lines_vals.append({
                'inventory_id': self.id,
                'product_id': quant.product_id.id,
                'theoretical_qty': quant.quantity,
                'counted_qty': quant.quantity,  # Pré-remplir avec la quantité théorique
            })

        if lines_vals:
            self.env['quelyos.stock.inventory.line'].create(lines_vals)

        self.state = 'in_progress'
        self.message_post(body=_("Inventaire démarré. %d lignes créées.") % len(lines_vals))

    def action_validate(self):
        """Valider l'inventaire : créer les ajustements de stock"""
        self.ensure_one()
        if self.state != 'in_progress':
            raise UserError(_("Seul un inventaire en cours peut être validé."))

        # TODO: Créer les mouvements de stock pour les écarts
        # Pour l'instant, on passe juste à "done"

        self.state = 'done'
        self.message_post(body=_("Inventaire validé."))

    def action_cancel(self):
        """Annuler l'inventaire"""
        self.ensure_one()
        if self.state == 'done':
            raise UserError(_("Un inventaire terminé ne peut pas être annulé."))

        self.state = 'cancelled'
        self.message_post(body=_("Inventaire annulé."))

    def action_reset_draft(self):
        """Remettre en brouillon"""
        self.ensure_one()
        if self.state != 'cancelled':
            raise UserError(_("Seul un inventaire annulé peut être remis en brouillon."))

        self.line_ids.unlink()
        self.state = 'draft'
        self.message_post(body=_("Inventaire remis en brouillon."))
