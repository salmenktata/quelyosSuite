# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import UserError


class StockScrap(models.Model):
    """
    Mise au rebut de stock (produits perdus, cassés, périmés).
    Compatible avec traçabilité Odoo standard.
    """
    _name = 'quelyos.stock.scrap'
    _description = 'Stock Scrap (Mise au rebut)'
    _order = 'create_date desc'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(
        string='Référence',
        required=True,
        default='New',
        readonly=True,
        copy=False,
        tracking=True
    )

    # Produit
    product_id = fields.Many2one(
        'product.product',
        string='Produit',
        required=True,
        domain="[('type', 'in', ['product', 'consu'])]",
        tracking=True
    )

    product_tmpl_id = fields.Many2one(
        'product.template',
        string='Template Produit',
        related='product_id.product_tmpl_id',
        readonly=True
    )

    # Quantité
    scrap_qty = fields.Float(
        string='Quantité mise au rebut',
        required=True,
        default=1.0,
        tracking=True
    )

    product_uom_id = fields.Many2one(
        'uom.uom',
        string='Unité de mesure',
        related='product_id.uom_id',
        readonly=True
    )

    # Emplacement source
    location_id = fields.Many2one(
        'stock.location',
        string='Emplacement source',
        required=True,
        domain="[('usage', '=', 'internal')]",
        tracking=True
    )

    # Emplacement rebut (destination)
    scrap_location_id = fields.Many2one(
        'stock.location',
        string='Emplacement rebut',
        required=True,
        domain="[('scrap_location', '=', True)]",
        default=lambda self: self.env['stock.location'].search([('scrap_location', '=', True)], limit=1),
        tracking=True
    )

    # Lot/Numéro de série (optionnel selon config produit)
    lot_id = fields.Many2one(
        'stock.lot',
        string='Lot/Numéro de série',
        domain="[('product_id', '=', product_id)]",
        tracking=True
    )

    # Raison
    reason = fields.Selection([
        ('damaged', 'Produit endommagé'),
        ('expired', 'Produit périmé'),
        ('defective', 'Défaut de fabrication'),
        ('lost', 'Produit perdu'),
        ('theft', 'Vol'),
        ('quality', 'Contrôle qualité'),
        ('other', 'Autre'),
    ], string='Raison', required=True, default='damaged', tracking=True)

    notes = fields.Text(string='Notes')

    # État
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('done', 'Validé'),
    ], string='État', default='draft', tracking=True)

    # Mouvement stock généré
    move_id = fields.Many2one(
        'stock.move',
        string='Mouvement stock',
        readonly=True,
        help='Mouvement stock généré lors de la validation'
    )

    # Date
    date_done = fields.Datetime(
        string='Date de validation',
        readonly=True,
        copy=False
    )

    # Responsable
    user_id = fields.Many2one(
        'res.users',
        string='Responsable',
        default=lambda self: self.env.user,
        tracking=True
    )

    # Multi-tenant
    company_id = fields.Many2one(
        'res.company',
        string='Société',
        default=lambda self: self.env.company,
        required=True
    )

    _sql_constraints = [
        ('scrap_qty_positive', 'CHECK(scrap_qty > 0)',
         'La quantité mise au rebut doit être positive'),
    ]

    @api.model
    def create(self, vals):
        """Générer séquence pour référence"""
        if vals.get('name', 'New') == 'New':
            vals['name'] = self.env['ir.sequence'].next_by_code('quelyos.stock.scrap') or 'SCR/00000'
        return super().create(vals)

    def action_validate(self):
        """
        Valider la mise au rebut et générer mouvement stock.
        Crée un mouvement de location_id vers scrap_location_id.
        """
        self.ensure_one()

        if self.state == 'done':
            raise UserError('Cette mise au rebut est déjà validée.')

        if self.scrap_qty <= 0:
            raise UserError('La quantité doit être positive.')

        # Créer mouvement stock
        StockMove = self.env['stock.move'].sudo()

        move_vals = {
            'name': f'Scrap: {self.product_id.name}',
            'product_id': self.product_id.id,
            'product_uom': self.product_uom_id.id,
            'product_uom_qty': self.scrap_qty,
            'location_id': self.location_id.id,
            'location_dest_id': self.scrap_location_id.id,
            'origin': self.name,
            'company_id': self.company_id.id,
        }

        # Ajouter lot si spécifié
        if self.lot_id:
            move_vals['lot_ids'] = [(6, 0, [self.lot_id.id])]

        move = StockMove.create(move_vals)

        # Confirmer et valider le mouvement immédiatement
        move._action_confirm()
        move._action_assign()
        move._set_quantity_done(self.scrap_qty)
        move._action_done()

        # Mettre à jour scrap
        self.write({
            'state': 'done',
            'move_id': move.id,
            'date_done': fields.Datetime.now(),
        })

        # Message dans chatter
        self.message_post(
            body=f"Mise au rebut validée : {self.scrap_qty} {self.product_uom_id.name} de {self.product_id.name}. Raison : {dict(self._fields['reason'].selection).get(self.reason)}"
        )

        return True

    def action_cancel(self):
        """Annuler la mise au rebut (retour en brouillon)"""
        self.ensure_one()
        if self.state == 'done':
            raise UserError('Impossible d\'annuler une mise au rebut validée.')
        self.write({'state': 'draft'})
        return True

    def to_dict(self):
        """Sérialisation pour API"""
        return {
            'id': self.id,
            'name': self.name,
            'product_id': self.product_id.id,
            'product_name': self.product_id.name,
            'scrap_qty': self.scrap_qty,
            'uom': self.product_uom_id.name,
            'location_name': self.location_id.complete_name,
            'scrap_location_name': self.scrap_location_id.complete_name,
            'lot_name': self.lot_id.name if self.lot_id else None,
            'reason': self.reason,
            'reason_label': dict(self._fields['reason'].selection).get(self.reason),
            'notes': self.notes or '',
            'state': self.state,
            'user_name': self.user_id.name,
            'date_done': self.date_done.isoformat() if self.date_done else None,
            'create_date': self.create_date.isoformat() if self.create_date else None,
        }
