# -*- coding: utf-8 -*-

from odoo import models, fields, api
import re


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    # SEO & URLs
    slug = fields.Char('URL Slug', compute='_compute_slug', store=True, index=True,
                       help='URL-friendly identifier pour SEO')
    meta_title = fields.Char('Meta Title (SEO)', translate=True,
                              help='Titre pour les moteurs de recherche (50-60 caractères)')
    meta_description = fields.Text('Meta Description (SEO)', translate=True,
                                    help='Description pour les moteurs de recherche (150-160 caractères)')
    meta_keywords = fields.Char('Meta Keywords (SEO)', translate=True,
                                 help='Mots-clés séparés par des virgules')

    # E-commerce features
    is_featured = fields.Boolean('Produit mis en avant', default=False,
                                  help='Afficher sur la page d\'accueil')
    featured_order = fields.Integer('Ordre affichage featured', default=0)
    is_new = fields.Boolean('Nouveau produit', default=False)
    is_bestseller = fields.Boolean('Meilleure vente', default=False)

    # Relations produits
    related_product_ids = fields.Many2many(
        'product.template',
        'product_template_related_rel',
        'product_id', 'related_id',
        string='Produits similaires',
        help='Produits à suggérer'
    )

    # Images supplémentaires (utilise product_template_image_ids natif)
    # gallery_image_ids = fields.One2many(
    #     'product.image',
    #     'product_tmpl_id',
    #     string='Galerie images'
    # )

    # Informations techniques
    technical_description = fields.Html('Description technique', translate=True)
    specifications = fields.Text('Spécifications', help='Format JSON pour affichage structuré')

    # Statistiques
    view_count = fields.Integer('Nombre de vues', default=0, readonly=True)
    wishlist_count = fields.Integer('Dans wishlists', compute='_compute_wishlist_count', store=True)

    # Gallery images
    image_ids = fields.One2many(
        'product.product.image',
        'product_tmpl_id',
        string='Gallery Images',
        help='Product image gallery (multiple images with ordering)'
    )
    image_count = fields.Integer(
        string='Number of Images',
        compute='_compute_image_count'
    )

    @api.depends('name')
    def _compute_slug(self):
        """Génère un slug SEO-friendly depuis le nom du produit."""
        for product in self:
            if product.name:
                # Convertir en minuscules, remplacer espaces et caractères spéciaux
                slug = product.name.lower()
                slug = re.sub(r'[àáâãäå]', 'a', slug)
                slug = re.sub(r'[èéêë]', 'e', slug)
                slug = re.sub(r'[ìíîï]', 'i', slug)
                slug = re.sub(r'[òóôõö]', 'o', slug)
                slug = re.sub(r'[ùúûü]', 'u', slug)
                slug = re.sub(r'[ç]', 'c', slug)
                slug = re.sub(r'[^a-z0-9]+', '-', slug)
                slug = slug.strip('-')

                # Assurer l'unicité
                existing = self.search([('slug', '=', slug), ('id', '!=', product.id)])
                if existing:
                    slug = f"{slug}-{product.id}"

                product.slug = slug
            else:
                product.slug = False

    @api.depends('wishlist_ids')
    def _compute_wishlist_count(self):
        """Compte le nombre de wishlists contenant ce produit."""
        for product in self:
            product.wishlist_count = len(product.wishlist_ids)

    @api.depends('image_ids')
    def _compute_image_count(self):
        """Compte le nombre d'images dans la galerie."""
        for product in self:
            product.image_count = len(product.image_ids)

    def increment_view_count(self):
        """Incrémente le compteur de vues."""
        self.ensure_one()
        self.sudo().write({'view_count': self.view_count + 1})

    def get_seo_data(self):
        """Retourne les données SEO formatées pour le frontend."""
        self.ensure_one()
        return {
            'slug': self.slug,
            'meta_title': self.meta_title or self.name,
            'meta_description': self.meta_description or self.description_sale or '',
            'meta_keywords': self.meta_keywords or '',
            'canonical_url': f'/products/{self.slug}',
        }

    def get_api_data(self, include_variants=True):
        """Formate les données produit pour l'API.

        Returns data in format matching frontend TypeScript Product interface.
        """
        self.ensure_one()

        # Get base URL for absolute image URLs
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url', 'http://localhost:8069')

        # Currency (use company currency if not set)
        currency = self.currency_id or self.env.company.currency_id

        # Images - Use new gallery system with fallback
        images = []

        if self.image_ids:
            # New gallery system - sorted by sequence
            for img in self.image_ids.sorted('sequence'):
                images.append(img.get_api_data())
        else:
            # Fallback: Old single image system (backward compatibility)
            if self.image_1920:
                images.append({
                    'id': 0,
                    'url': f'{base_url}/web/image/product.template/{self.id}/image_1920',
                    'alt': self.name,
                    'is_main': True
                })

        data = {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description_sale or '',
            'technical_description': self.technical_description or '',
            'list_price': self.list_price,
            'currency': {
                'id': currency.id,
                'code': currency.name,  # In Odoo, currency.name is the code (EUR, USD, etc.)
                'symbol': currency.symbol,
            },
            'is_featured': self.is_featured,
            'is_new': self.is_new,
            'is_bestseller': self.is_bestseller,
            'images': images,
            'image_url': images[0]['url'] if images else None,  # Convenience field for main image
            'category': {
                'id': self.categ_id.id,
                'name': self.categ_id.name,
                'slug': self.categ_id.name.lower().replace(' ', '-'),
            } if self.categ_id else None,
            'in_stock': self.qty_available > 0,
            'stock_qty': self.qty_available,
            'seo': {
                'slug': self.slug,
                'meta_title': self.meta_title or self.name,
                'meta_description': self.meta_description or self.description_sale or '',
                'meta_keywords': self.meta_keywords or '',
                'canonical_url': f'/products/{self.slug}',
            },
            'view_count': self.view_count,
            'wishlist_count': self.wishlist_count,
        }

        # Variants (with variant-specific images)
        if include_variants and self.product_variant_count > 1:
            data['variants'] = []
            for variant in self.product_variant_ids:
                # Use variant's get_api_data() which includes variant-specific images
                variant_data = variant.get_api_data()
                data['variants'].append(variant_data)

        # Related products (return full object with id, name, slug, image)
        if self.related_product_ids:
            data['related_products'] = [{
                'id': p.id,
                'name': p.name,
                'slug': p.slug,
                'image': f'{base_url}/web/image/product.template/{p.id}/image_256',
                'list_price': p.list_price,
            } for p in self.related_product_ids[:4]]  # Limit to 4 products

        return data
