# -*- coding: utf-8 -*-
from odoo import models, fields, api
from datetime import datetime


class CycleCount(models.Model):
    _name = 'quelyos.cycle.count'
    _description = 'Comptage Cyclique Stock'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'scheduled_date desc, id desc'

    name = fields.Char(
        string='Référence',
        required=True,
        copy=False,
        readonly=True,
        default='Nouveau',
    )

    scheduled_date = fields.Date(
        string='Date Prévue',
        required=True,
        default=fields.Date.context_today,
        tracking=True,
    )

    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('scheduled', 'Planifié'),
        ('in_progress', 'En cours'),
        ('done', 'Terminé'),
        ('cancel', 'Annulé'),
    ], string='État', default='draft', required=True, tracking=True)

    location_ids = fields.Many2many(
        'stock.location',
        string='Emplacements à Compter',
        domain=[('usage', '=', 'internal')],
        required=True,
    )

    category_ids = fields.Many2many(
        'product.category',
        string='Catégories Produits',
        help='Filtrer par catégories (optionnel)',
    )

    user_id = fields.Many2one(
        'res.users',
        string='Responsable',
        default=lambda self: self.env.user,
        tracking=True,
    )

    product_count = fields.Integer(
        string='Nombre Produits',
        compute='_compute_product_count',
        store=True,
    )

    counted_products = fields.Integer(
        string='Produits Comptés',
        compute='_compute_counted_products',
        store=True,
    )

    line_ids = fields.One2many(
        'quelyos.cycle.count.line',
        'cycle_count_id',
        string='Lignes Comptage',
    )

    notes = fields.Text(string='Notes')

    completion_date = fields.Datetime(
        string='Date Achèvement',
        readonly=True,
    )

    @api.model
    def create(self, vals):
        if vals.get('name', 'Nouveau') == 'Nouveau':
            vals['name'] = self.env['ir.sequence'].next_by_code('quelyos.cycle.count') or 'CYC/NEW'
        return super().create(vals)

    @api.depends('line_ids')
    def _compute_product_count(self):
        for record in self:
            record.product_count = len(record.line_ids)

    @api.depends('line_ids.counted_qty')
    def _compute_counted_products(self):
        for record in self:
            record.counted_products = len(record.line_ids.filtered(lambda l: l.counted_qty is not None))

    def action_generate_lines(self):
        """Générer les lignes de comptage basées sur emplacements et catégories"""
        self.ensure_one()

        # Supprimer lignes existantes
        self.line_ids.unlink()

        # Construire domaine recherche produits
        domain = [
            ('type', '=', 'product'),  # Produits stockables uniquement
            ('active', '=', True),
        ]

        if self.category_ids:
            domain.append(('categ_id', 'in', self.category_ids.ids))

        products = self.env['product.product'].search(domain)

        # Créer lignes pour chaque produit dans les emplacements
        lines = []
        for location in self.location_ids:
            for product in products:
                # Récupérer stock actuel dans cette location
                quant = self.env['stock.quant'].search([
                    ('product_id', '=', product.id),
                    ('location_id', '=', location.id),
                ], limit=1)

                theoretical_qty = quant.quantity if quant else 0.0

                # Créer ligne uniquement si stock > 0 ou si on veut tout compter
                if theoretical_qty > 0 or not self.env.context.get('skip_zero_stock'):
                    lines.append((0, 0, {
                        'product_id': product.id,
                        'location_id': location.id,
                        'theoretical_qty': theoretical_qty,
                    }))

        self.line_ids = lines
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': 'Lignes générées',
                'message': f'{len(lines)} ligne(s) créée(s)',
                'type': 'success',
                'sticky': False,
            }
        }

    def action_start(self):
        """Démarrer le comptage"""
        self.ensure_one()
        self.write({'state': 'in_progress'})

    def action_validate(self):
        """Valider et appliquer les ajustements"""
        self.ensure_one()

        adjustments_made = 0
        for line in self.line_ids.filtered(lambda l: l.counted_qty is not None):
            if line.difference != 0:
                # Créer ajustement via stock.quant
                quant = self.env['stock.quant'].search([
                    ('product_id', '=', line.product_id.id),
                    ('location_id', '=', line.location_id.id),
                ], limit=1)

                if quant:
                    quant.inventory_quantity = line.counted_qty
                    quant.action_apply_inventory()
                else:
                    # Créer nouveau quant si n'existe pas
                    quant = self.env['stock.quant'].create({
                        'product_id': line.product_id.id,
                        'location_id': line.location_id.id,
                        'inventory_quantity': line.counted_qty,
                    })
                    quant.action_apply_inventory()

                adjustments_made += 1

        self.write({
            'state': 'done',
            'completion_date': fields.Datetime.now(),
        })

        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': 'Comptage validé',
                'message': f'{adjustments_made} ajustement(s) appliqué(s)',
                'type': 'success',
                'sticky': False,
            }
        }

    def action_cancel(self):
        """Annuler le comptage"""
        self.ensure_one()
        self.write({'state': 'cancel'})


class CycleCountLine(models.Model):
    _name = 'quelyos.cycle.count.line'
    _description = 'Ligne Comptage Cyclique'
    _order = 'location_id, product_id'

    cycle_count_id = fields.Many2one(
        'quelyos.cycle.count',
        string='Comptage Cyclique',
        required=True,
        ondelete='cascade',
    )

    product_id = fields.Many2one(
        'product.product',
        string='Produit',
        required=True,
    )

    location_id = fields.Many2one(
        'stock.location',
        string='Emplacement',
        required=True,
        domain=[('usage', '=', 'internal')],
    )

    theoretical_qty = fields.Float(
        string='Quantité Théorique',
        digits='Product Unit of Measure',
        readonly=True,
    )

    counted_qty = fields.Float(
        string='Quantité Comptée',
        digits='Product Unit of Measure',
    )

    difference = fields.Float(
        string='Écart',
        compute='_compute_difference',
        store=True,
        digits='Product Unit of Measure',
    )

    standard_price = fields.Float(
        related='product_id.standard_price',
        string='Coût Unitaire',
        readonly=True,
    )

    value_difference = fields.Float(
        string='Écart Valorisation',
        compute='_compute_value_difference',
        store=True,
    )

    notes = fields.Char(string='Notes')

    @api.depends('theoretical_qty', 'counted_qty')
    def _compute_difference(self):
        for line in self:
            if line.counted_qty is not None:
                line.difference = line.counted_qty - line.theoretical_qty
            else:
                line.difference = 0.0

    @api.depends('difference', 'standard_price')
    def _compute_value_difference(self):
        for line in self:
            line.value_difference = line.difference * line.standard_price
