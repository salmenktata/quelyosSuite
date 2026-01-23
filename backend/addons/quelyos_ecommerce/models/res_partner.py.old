# -*- coding: utf-8 -*-

from odoo import models, fields


class ResPartner(models.Model):
    _inherit = 'res.partner'

    # E-commerce wishlist
    wishlist_ids = fields.One2many('product.wishlist', 'partner_id', string='Wishlist')
    wishlist_count = fields.Integer('Nombre wishlist', compute='_compute_wishlist_count')

    def _compute_wishlist_count(self):
        """Calcule le nombre d'articles dans la wishlist."""
        for partner in self:
            partner.wishlist_count = len(partner.wishlist_ids)
