# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class ProductWishlist(models.Model):
    _name = 'product.wishlist'
    _description = 'Wishlist Produit'
    _order = 'date_added desc'

    partner_id = fields.Many2one('res.partner', 'Client', required=True, ondelete='cascade', index=True)
    product_id = fields.Many2one('product.product', 'Produit', required=True, ondelete='cascade')
    product_tmpl_id = fields.Many2one('product.template', 'Template Produit',
                                       related='product_id.product_tmpl_id', store=True)
    date_added = fields.Datetime('Date ajout', default=fields.Datetime.now, required=True)
    notes = fields.Text('Notes')

    # Champs relationnels inverses
    product_id_inverse = fields.Many2one('product.product', compute='_compute_inverse_rel')

    _sql_constraints = [
        ('wishlist_unique', 'unique(partner_id, product_id)',
         'Ce produit est déjà dans votre wishlist!')
    ]

    @api.depends('product_id')
    def _compute_inverse_rel(self):
        """Permet la relation inverse pour product.template."""
        for record in self:
            record.product_id_inverse = record.product_id

    def get_api_data(self):
        """Retourne les données formatées pour l'API."""
        self.ensure_one()
        return {
            'id': self.id,
            'product': self.product_id.get_api_data(),
            'date_added': self.date_added.isoformat() if self.date_added else None,
            'notes': self.notes or '',
        }

    @api.model
    def add_to_wishlist(self, partner_id, product_id):
        """Ajoute un produit à la wishlist."""
        # Vérifier que le produit existe
        product = self.env['product.product'].browse(product_id)
        if not product.exists():
            raise ValidationError(_("Produit non trouvé"))

        # Vérifier si déjà dans wishlist
        existing = self.search([
            ('partner_id', '=', partner_id),
            ('product_id', '=', product_id)
        ])

        if existing:
            return {
                'success': False,
                'message': _("Ce produit est déjà dans votre wishlist"),
                'wishlist_item': existing.get_api_data(),
            }

        # Créer l'entrée wishlist
        wishlist_item = self.create({
            'partner_id': partner_id,
            'product_id': product_id,
        })

        return {
            'success': True,
            'message': _("Produit ajouté à la wishlist"),
            'wishlist_item': wishlist_item.get_api_data(),
        }

    @api.model
    def remove_from_wishlist(self, partner_id, product_id):
        """Retire un produit de la wishlist."""
        wishlist_item = self.search([
            ('partner_id', '=', partner_id),
            ('product_id', '=', product_id)
        ])

        if not wishlist_item:
            return {
                'success': False,
                'message': _("Produit non trouvé dans la wishlist"),
            }

        wishlist_item.unlink()

        return {
            'success': True,
            'message': _("Produit retiré de la wishlist"),
        }

    @api.model
    def get_partner_wishlist(self, partner_id):
        """Récupère toute la wishlist d'un client."""
        wishlist_items = self.search([('partner_id', '=', partner_id)])

        return {
            'count': len(wishlist_items),
            'items': [item.get_api_data() for item in wishlist_items],
        }

    @api.model
    def is_in_wishlist(self, partner_id, product_id):
        """Vérifie si un produit est dans la wishlist."""
        return bool(self.search_count([
            ('partner_id', '=', partner_id),
            ('product_id', '=', product_id)
        ]))


# Extension product.template pour relation inverse
class ProductTemplate(models.Model):
    _inherit = 'product.template'

    wishlist_ids = fields.One2many('product.wishlist', 'product_tmpl_id', 'Wishlists')
