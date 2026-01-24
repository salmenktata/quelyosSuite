# -*- coding: utf-8 -*-

from odoo import models, fields, api


class ProductProduct(models.Model):
    _inherit = 'product.product'

    # Override pour gérer les variants
    slug = fields.Char('URL Slug', compute='_compute_slug', store=True, index=True)

    # Attribute value-based images (NEW in 19.0.3.0.0)
    image_ids = fields.Many2many(
        'product.product.image',
        string='All Images',
        compute='_compute_image_ids',
        help='Images for this variant (from attribute values or template fallback)'
    )

    promo_image_id = fields.Many2one(
        'product.product.image',
        string='Promotional Image',
        compute='_compute_promo_image',
        help='Promo image: variant promo > template promo > main image'
    )

    @api.depends('name', 'product_tmpl_id.slug')
    def _compute_slug(self):
        """Génère un slug pour les variants."""
        for product in self:
            if product.product_tmpl_id.slug:
                if product.product_variant_count > 1:
                    # Pour variants: template-slug + attributs
                    attrs = '-'.join([
                        attr.name.lower().replace(' ', '-')
                        for attr in product.product_template_attribute_value_ids
                    ])
                    product.slug = f"{product.product_tmpl_id.slug}-{attrs}"
                else:
                    product.slug = product.product_tmpl_id.slug
            else:
                product.slug = False

    @api.depends('product_template_attribute_value_ids', 'product_tmpl_id.image_ids')
    def _compute_image_ids(self):
        """Return images based on attribute values OR generic template images (fallback).

        Logic:
        1. Search for images assigned to ANY of this variant's attribute values
        2. If found, use those images
        3. Otherwise, fallback to GENERIC template images (not linked to any attribute)

        Example: Variant "T-Shirt (Rouge, L)" → Search images for "Rouge" OR "L"
        If none found → Use generic product images (not linked to any variant)
        """
        ProductImage = self.env['product.product.image']

        for variant in self:
            # Get all attribute values for this variant (e.g., Color: Red, Size: L)
            attribute_values = variant.product_template_attribute_value_ids

            if attribute_values:
                # Search for images assigned to any of these attribute values
                variant_images = ProductImage.search([
                    ('product_tmpl_id', '=', variant.product_tmpl_id.id),
                    ('attribute_value_ids', 'in', attribute_values.ids)
                ])

                if variant_images:
                    variant.image_ids = variant_images
                else:
                    # No attribute-specific images, fallback to GENERIC images only
                    # (images that are not linked to ANY attribute value)
                    generic_images = ProductImage.search([
                        ('product_tmpl_id', '=', variant.product_tmpl_id.id),
                        ('attribute_value_ids', '=', False)
                    ])
                    variant.image_ids = generic_images
            else:
                # No attributes (single variant product), use all template images
                variant.image_ids = variant.product_tmpl_id.image_ids

    @api.depends('image_ids', 'image_ids.is_promo')
    def _compute_promo_image(self):
        """Get promo image: variant promo > template promo > main image."""
        for variant in self:
            # First, try to find a promo image in variant's images
            promo = variant.image_ids.filtered(lambda img: img.is_promo)
            if promo:
                variant.promo_image_id = promo[0]
            else:
                # Fallback to main image
                main = variant.image_ids.filtered(lambda img: img.is_main)
                variant.promo_image_id = main[0] if main else False

    def get_api_data(self):
        """Enhanced API data with variant-specific images."""
        self.ensure_one()

        # Get images sorted by sequence (variant-specific OR template fallback)
        images = [img.get_api_data() for img in self.image_ids.sorted('sequence')]

        return {
            'id': self.id,
            'template_id': self.product_tmpl_id.id,
            'name': self.name,
            'slug': self.slug,
            'price': self.lst_price,
            'in_stock': self.qty_available > 0,
            'stock_qty': self.qty_available,
            'images': images,
            'image_url': images[0]['url'] if images else None,
            'promo_image_url': self.promo_image_id.image_url if self.promo_image_id else None,
            'attributes': [{
                'id': attr.attribute_id.id,
                'name': attr.attribute_id.name,
                'value_id': attr.id,
                'value': attr.name,
            } for attr in self.product_template_attribute_value_ids],
        }
