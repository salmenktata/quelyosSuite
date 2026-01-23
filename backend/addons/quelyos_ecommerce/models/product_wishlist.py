# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.exceptions import ValidationError


class ProductWishlist(models.Model):
    _name = 'product.wishlist'
    _description = 'Product Wishlist'
    _order = 'create_date desc'
    _rec_name = 'product_id'

    partner_id = fields.Many2one(
        'res.partner',
        string='Customer',
        required=True,
        ondelete='cascade',
        index=True
    )
    product_id = fields.Many2one(
        'product.template',
        string='Product',
        required=True,
        ondelete='cascade',
        index=True
    )
    product_tmpl_id = fields.Many2one(
        'product.template',
        string='Product Template',
        related='product_id',
        store=True,
        readonly=True
    )
    create_date = fields.Datetime(
        string='Added Date',
        readonly=True
    )
    date_added = fields.Datetime(
        string='Date Added',
        related='create_date',
        store=True,
        readonly=True
    )
    notes = fields.Text(
        string='Notes'
    )

    _sql_constraints = [
        ('unique_partner_product', 'unique(partner_id, product_id)',
         'This product is already in your wishlist!')
    ]

    def get_api_data(self):
        """Return wishlist item data formatted for API"""
        self.ensure_one()
        return {
            'id': self.id,
            'product_id': self.product_id.id,
            'product_name': self.product_id.name,
            'product_slug': self.product_id.slug,
            'product_image': f'/web/image/product.template/{self.product_id.id}/image_256',
            'product_price': self.product_id.list_price,
            'added_date': self.create_date.isoformat() if self.create_date else None,
        }


class ResPartner(models.Model):
    _inherit = 'res.partner'

    wishlist_ids = fields.One2many(
        'product.wishlist',
        'partner_id',
        string='Wishlist Items'
    )
    wishlist_count = fields.Integer(
        string='Wishlist Count',
        compute='_compute_wishlist_count'
    )

    @api.depends('wishlist_ids')
    def _compute_wishlist_count(self):
        """Count wishlist items"""
        for partner in self:
            partner.wishlist_count = len(partner.wishlist_ids)

    def add_to_wishlist(self, product_id):
        """Add product to wishlist"""
        self.ensure_one()
        product = self.env['product.template'].browse(product_id)
        
        if not product.exists():
            raise ValidationError('Product not found.')

        # Check if already in wishlist
        existing = self.env['product.wishlist'].search([
            ('partner_id', '=', self.id),
            ('product_id', '=', product_id)
        ], limit=1)

        if existing:
            return {'success': False, 'message': 'Product already in wishlist'}

        # Create wishlist item
        wishlist_item = self.env['product.wishlist'].create({
            'partner_id': self.id,
            'product_id': product_id
        })

        return {'success': True, 'wishlist_item': wishlist_item.get_api_data()}

    def remove_from_wishlist(self, product_id):
        """Remove product from wishlist"""
        self.ensure_one()
        wishlist_item = self.env['product.wishlist'].search([
            ('partner_id', '=', self.id),
            ('product_id', '=', product_id)
        ], limit=1)

        if wishlist_item:
            wishlist_item.unlink()
            return {'success': True, 'message': 'Product removed from wishlist'}
        
        return {'success': False, 'message': 'Product not in wishlist'}

    def get_wishlist(self):
        """Get all wishlist items"""
        self.ensure_one()
        return {
            'items': [item.product_id.id for item in self.wishlist_ids],
            'details': [item.get_api_data() for item in self.wishlist_ids]
        }


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    wishlist_ids = fields.One2many(
        'product.wishlist',
        'product_id',
        string='Wishlist Entries'
    )
    wishlist_count = fields.Integer(
        string='Times Added to Wishlist',
        compute='_compute_wishlist_count',
        store=True
    )

    @api.depends('wishlist_ids')
    def _compute_wishlist_count(self):
        """Count how many times product has been added to wishlists"""
        for product in self:
            product.wishlist_count = len(product.wishlist_ids)
