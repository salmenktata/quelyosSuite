# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError
from odoo.tools.translate import _


class ProductCollection(models.Model):
    _name = 'quelyos.collection'
    _description = 'Collection/Lookbook'
    _order = 'sequence, name'

    name = fields.Char('Nom', required=True, translate=True)
    slug = fields.Char('Slug', required=True, index=True)
    description = fields.Html('Description', translate=True)
    short_description = fields.Text('Description courte', translate=True)

    # Visuels
    image = fields.Binary('Image principale', attachment=True)
    banner_image = fields.Binary('Bannière', attachment=True)

    # Produits
    product_ids = fields.Many2many(
        'product.template',
        'quelyos_collection_product_rel',
        'collection_id',
        'product_id',
        string='Produits'
    )
    product_count = fields.Integer('Nb produits', compute='_compute_product_count', store=True)

    # Configuration
    company_id = fields.Many2one(
        'res.company',
        string='Société',
        required=True,
        default=lambda self: self.env.company,
        index=True
    )
    sequence = fields.Integer('Ordre', default=10)
    is_published = fields.Boolean('Publié', default=False)
    is_featured = fields.Boolean('Mise en avant', default=False)

    # Période (optionnel)
    date_start = fields.Date('Date début')
    date_end = fields.Date('Date fin')

    # SEO
    meta_title = fields.Char('Meta Title')
    meta_description = fields.Text('Meta Description')
    @api.depends('product_ids')

    @api.constrains('slug', 'company_id')
    def _check_unique_slug_company(self):
        """Contrainte: Le slug doit être unique par société"""
        for record in self:
            # Chercher un doublon
            duplicate = self.search([
                ('slug', '=', record.slug),
                ('company_id', '=', record.company_id),
                ('id', '!=', record.id)
            ], limit=1)

            if duplicate:
                raise ValidationError(_('Le slug doit être unique par société'))


    def _compute_product_count(self):
        for col in self:
            col.product_count = len(col.product_ids)

    def get_image_url(self, field='image'):
        self.ensure_one()
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
        if getattr(self, field):
            return f'{base_url}/web/image/quelyos.collection/{self.id}/{field}'
        return None

    def to_dict(self, include_products=False):
        self.ensure_one()
        data = {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'shortDescription': self.short_description,
            'imageUrl': self.get_image_url('image'),
            'bannerUrl': self.get_image_url('banner_image'),
            'productCount': self.product_count,
            'isPublished': self.is_published,
            'isFeatured': self.is_featured,
            'dateStart': self.date_start.isoformat() if self.date_start else None,
            'dateEnd': self.date_end.isoformat() if self.date_end else None,
        }
        if include_products:
            data['products'] = [{
                'id': p.id,
                'name': p.name,
                'price': p.list_price,
            } for p in self.product_ids[:20]]
        return data
