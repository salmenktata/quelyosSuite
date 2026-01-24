# -*- coding: utf-8 -*-

from odoo import models, fields, api


class ProductTemplateAttributeValue(models.Model):
    _inherit = 'product.template.attribute.value'

    # Images assigned to this attribute value (e.g., Color: Red)
    image_ids = fields.Many2many(
        'product.product.image',
        'product_attribute_value_image_rel',
        'attribute_value_id',
        'image_id',
        string='Images',
        help='Images for products with this attribute value'
    )

    image_count = fields.Integer(
        string='Number of Images',
        compute='_compute_image_count'
    )

    @api.depends('image_ids')
    def _compute_image_count(self):
        """Count images assigned to this attribute value"""
        for record in self:
            record.image_count = len(record.image_ids)
