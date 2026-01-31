# -*- coding: utf-8 -*-
"""
Extension du modèle product.wishlist pour le partage public
"""
import secrets
from odoo import models, fields, api


class ProductWishlist(models.Model):
    _inherit = 'product.wishlist'

    x_share_token = fields.Char(
        string='Token de partage',
        index=True,
        copy=False,
        help='Token unique pour partager la wishlist publiquement'
    )
    x_is_public = fields.Boolean(
        string='Wishlist publique',
        default=False,
        help='Si activé, la wishlist peut être consultée via le lien de partage'
    )

    @api.model
    def generate_share_token(self, partner_id):
        """Génère un token de partage unique pour un partenaire"""
        token = secrets.token_urlsafe(32)

        # Mettre à jour tous les items du partenaire avec le même token
        wishlists = self.search([('partner_id', '=', partner_id)])
        if wishlists:
            wishlists.write({
                'x_share_token': token,
                'x_is_public': True
            })

        return token

    @api.model
    def get_by_share_token(self, token):
        """Récupère les items de wishlist par token de partage"""
        return self.search([
            ('share_token', '=', token),
            ('is_public', '=', True)
        ])

    @api.model
    def disable_sharing(self, partner_id):
        """Désactive le partage pour un partenaire"""
        wishlists = self.search([('partner_id', '=', partner_id)])
        if wishlists:
            wishlists.write({
                'x_share_token': False,
                'x_is_public': False
            })
        return True
