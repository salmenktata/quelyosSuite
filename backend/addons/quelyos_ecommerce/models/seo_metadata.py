# -*- coding: utf-8 -*-

from odoo import models, fields, api


class SeoMetadata(models.Model):
    """SEO Metadata for products and categories"""
    _name = 'seo.metadata'
    _description = 'SEO Metadata'

    name = fields.Char(string='Name', required=True)
    model_name = fields.Selection([
        ('product.template', 'Product'),
        # TODO: Re-enable if website_sale is installed
        # ('product.public.category', 'Category'),
    ], string='Model', required=True)
    res_id = fields.Integer(string='Resource ID', required=True)

    # Meta Tags
    meta_title = fields.Char(string='Meta Title', help='SEO title (max 60 chars)')
    meta_description = fields.Text(string='Meta Description', help='SEO description (max 160 chars)')
    meta_keywords = fields.Char(string='Meta Keywords', help='Comma-separated keywords')

    # Open Graph
    og_title = fields.Char(string='OG Title')
    og_description = fields.Text(string='OG Description')
    og_image = fields.Char(string='OG Image URL')
    og_type = fields.Selection([
        ('website', 'Website'),
        ('product', 'Product'),
        ('article', 'Article'),
    ], string='OG Type', default='product')

    # Twitter Cards
    twitter_card = fields.Selection([
        ('summary', 'Summary'),
        ('summary_large_image', 'Summary Large Image'),
        ('product', 'Product'),
    ], string='Twitter Card Type', default='summary_large_image')
    twitter_title = fields.Char(string='Twitter Title')
    twitter_description = fields.Text(string='Twitter Description')
    twitter_image = fields.Char(string='Twitter Image URL')

    # Structured Data
    schema_type = fields.Selection([
        ('Product', 'Product'),
        ('Category', 'Category'),
        ('Organization', 'Organization'),
    ], string='Schema Type', default='Product')
    custom_schema_json = fields.Text(string='Custom Schema JSON', help='Additional JSON-LD data')

    # Canonical URL
    canonical_url = fields.Char(string='Canonical URL')

    # Robots
    robots_index = fields.Boolean(string='Allow Indexing', default=True)
    robots_follow = fields.Boolean(string='Allow Following Links', default=True)

    # Sitemap
    sitemap_priority = fields.Float(string='Sitemap Priority', default=0.5, help='0.0 to 1.0')
    sitemap_changefreq = fields.Selection([
        ('always', 'Always'),
        ('hourly', 'Hourly'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
        ('never', 'Never'),
    ], string='Change Frequency', default='weekly')

    active = fields.Boolean(string='Active', default=True)

    _sql_constraints = [
        ('unique_model_res', 'unique(model_name, res_id)',
         'SEO metadata already exists for this record!')
    ]

    def get_robots_meta(self):
        """Get robots meta tag value"""
        self.ensure_one()
        index = 'index' if self.robots_index else 'noindex'
        follow = 'follow' if self.robots_follow else 'nofollow'
        return f"{index}, {follow}"


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    seo_metadata_id = fields.One2many(
        'seo.metadata',
        'res_id',
        string='SEO Metadata',
        domain=lambda self: [('model_name', '=', 'product.template')]
    )

    @api.model
    def get_seo_data(self, product_id):
        """Get SEO data for a product"""
        product = self.browse(product_id)
        if not product.exists():
            return {}

        # Get or create SEO metadata
        seo = self.env['seo.metadata'].search([
            ('model_name', '=', 'product.template'),
            ('res_id', '=', product_id)
        ], limit=1)

        # Default values from product
        meta_title = product.name
        meta_description = product.description_sale or product.name
        og_image = f'/web/image/product.template/{product_id}/image_1920'

        # Override with custom SEO metadata if exists
        if seo:
            meta_title = seo.meta_title or meta_title
            meta_description = seo.meta_description or meta_description
            og_image = seo.og_image or og_image

        # Build structured data (Schema.org Product)
        structured_data = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            'name': product.name,
            'description': meta_description,
            'image': og_image,
            'sku': product.default_code or str(product_id),
            'offers': {
                '@type': 'Offer',
                'url': f'/product/{product.slug or product_id}',
                'priceCurrency': 'EUR',
                'price': str(product.list_price),
                'availability': 'https://schema.org/InStock' if product.qty_available > 0 else 'https://schema.org/OutOfStock',
                'seller': {
                    '@type': 'Organization',
                    'name': 'Quelyos',
                }
            }
        }

        # Add rating if available
        if hasattr(product, 'rating_avg') and product.rating_avg > 0:
            structured_data['aggregateRating'] = {
                '@type': 'AggregateRating',
                'ratingValue': str(product.rating_avg),
                'reviewCount': str(product.rating_count) if hasattr(product, 'rating_count') else '0',
            }

        # Add brand if available
        if hasattr(product, 'brand_id') and product.brand_id:
            structured_data['brand'] = {
                '@type': 'Brand',
                'name': product.brand_id.name,
            }

        return {
            'meta_title': meta_title,
            'meta_description': meta_description,
            'meta_keywords': seo.meta_keywords if seo else '',
            'canonical_url': seo.canonical_url if seo else f'/product/{product.slug or product_id}',
            'robots': seo.get_robots_meta() if seo else 'index, follow',
            'og_title': seo.og_title if seo else meta_title,
            'og_description': seo.og_description if seo else meta_description,
            'og_image': og_image,
            'og_type': seo.og_type if seo else 'product',
            'twitter_card': seo.twitter_card if seo else 'summary_large_image',
            'twitter_title': seo.twitter_title if seo else meta_title,
            'twitter_description': seo.twitter_description if seo else meta_description,
            'twitter_image': seo.twitter_image if seo else og_image,
            'structured_data': structured_data,
        }


# TODO: Re-enable if website_sale module is installed
# Commented out because product.public.category doesn't exist without website_sale
# class ProductPublicCategory(models.Model):
#     _inherit = 'product.public.category'
#
#     seo_metadata_id = fields.One2many(
#         'seo.metadata',
#         'res_id',
#         string='SEO Metadata',
#         domain=lambda self: [('model_name', '=', 'product.public.category')]
#     )
#
#     @api.model
#     def get_seo_data(self, category_id):
#         """Get SEO data for a category"""
#         category = self.browse(category_id)
#         if not category.exists():
#             return {}
#
#         # Get SEO metadata
#         seo = self.env['seo.metadata'].search([
#             ('model_name', '=', 'product.public.category'),
#             ('res_id', '=', category_id)
#         ], limit=1)
#
#         # Default values from category
#         meta_title = f"{category.name} - Quelyos"
#         meta_description = f"Découvrez nos produits {category.name}"
#         og_image = f'/web/image/product.public.category/{category_id}/image_128' if category.image_128 else ''
#
#         # Override with custom SEO metadata if exists
#         if seo:
#             meta_title = seo.meta_title or meta_title
#             meta_description = seo.meta_description or meta_description
#             og_image = seo.og_image or og_image
#
#         # Build structured data (Schema.org CollectionPage)
#         structured_data = {
#             '@context': 'https://schema.org',
#             '@type': 'CollectionPage',
#             'name': category.name,
#             'description': meta_description,
#         }
#
#         if og_image:
#             structured_data['image'] = og_image
#
#         return {
#             'meta_title': meta_title,
#             'meta_description': meta_description,
#             'meta_keywords': seo.meta_keywords if seo else '',
#             'canonical_url': seo.canonical_url if seo else f'/category/{category.id}',
#             'robots': seo.get_robots_meta() if seo else 'index, follow',
#             'og_title': seo.og_title if seo else meta_title,
#             'og_description': seo.og_description if seo else meta_description,
#             'og_image': og_image,
#             'og_type': 'website',
#             'twitter_card': seo.twitter_card if seo else 'summary',
#             'twitter_title': seo.twitter_title if seo else meta_title,
#             'twitter_description': seo.twitter_description if seo else meta_description,
#             'twitter_image': seo.twitter_image if seo else og_image,
#             'structured_data': structured_data,
#         }
