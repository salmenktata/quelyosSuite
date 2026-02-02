# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError
from odoo.tools.translate import _


class ProductBundle(models.Model):
    _name = 'quelyos.bundle'
    _description = 'Bundle/Pack Produits'
    _order = 'sequence, name'

    name = fields.Char('Nom', required=True, translate=True)
    slug = fields.Char('Slug', required=True, index=True)
    description = fields.Html('Description', translate=True)

    # Visuels
    image = fields.Binary('Image', attachment=True)

    # Produits inclus
    line_ids = fields.One2many(
        'quelyos.bundle.line',
        'bundle_id',
        string='Produits inclus'
    )
    product_count = fields.Integer('Nb produits', compute='_compute_prices', store=True)

    # Prix
    total_price = fields.Float('Prix total (sans remise)', compute='_compute_prices', store=True)
    bundle_price = fields.Float('Prix bundle', required=True)
    discount_amount = fields.Float('Économie', compute='_compute_prices', store=True)
    discount_percent = fields.Float('% Réduction', compute='_compute_prices', store=True)

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

    # Stock
    qty_available = fields.Integer(
        'Stock disponible',
        compute='_compute_stock',
        help="Basé sur le produit le moins disponible"
    )

    # Période (optionnel)
    date_start = fields.Date('Date début')
    date_end = fields.Date('Date fin')
    @api.depends('line_ids', 'line_ids.quantity', 'line_ids.product_id.list_price', 'bundle_price')

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


    def _compute_prices(self):
        for bundle in self:
            bundle.product_count = len(bundle.line_ids)
            bundle.total_price = sum(
                line.product_id.list_price * line.quantity
                for line in bundle.line_ids
            )
            bundle.discount_amount = bundle.total_price - bundle.bundle_price
            if bundle.total_price > 0:
                bundle.discount_percent = round(
                    (bundle.discount_amount / bundle.total_price) * 100, 1
                )
            else:
                bundle.discount_percent = 0

    @api.depends('line_ids', 'line_ids.product_id')
    def _compute_stock(self):
        for bundle in self:
            if bundle.line_ids:
                # Stock = min des stocks de chaque produit / quantité requise
                stocks = []
                for line in bundle.line_ids:
                    product = line.product_id.product_variant_id
                    if product and line.quantity > 0:
                        stocks.append(int(product.qty_available / line.quantity))
                bundle.qty_available = min(stocks) if stocks else 0
            else:
                bundle.qty_available = 0

    def get_image_url(self):
        self.ensure_one()
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
        if self.image:
            return f'{base_url}/web/image/quelyos.bundle/{self.id}/image'
        return None

    def to_dict(self):
        self.ensure_one()
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'imageUrl': self.get_image_url(),
            'products': [line.to_dict() for line in self.line_ids],
            'productCount': self.product_count,
            'totalPrice': self.total_price,
            'bundlePrice': self.bundle_price,
            'discountAmount': self.discount_amount,
            'discountPercent': self.discount_percent,
            'qtyAvailable': self.qty_available,
            'isPublished': self.is_published,
            'dateStart': self.date_start.isoformat() if self.date_start else None,
            'dateEnd': self.date_end.isoformat() if self.date_end else None,
        }


class BundleLine(models.Model):
    _name = 'quelyos.bundle.line'
    _description = 'Ligne Bundle'
    _order = 'sequence'

    bundle_id = fields.Many2one(
        'quelyos.bundle',
        string='Bundle',
        required=True,
        ondelete='cascade'
    )
    product_id = fields.Many2one(
        'product.template',
        string='Produit',
        required=True
    )
    quantity = fields.Integer('Quantité', default=1, required=True)
    sequence = fields.Integer('Ordre', default=10)

    # Informations produit (pour affichage)
    product_price = fields.Float(related='product_id.list_price', string='Prix unitaire')
    subtotal = fields.Float('Sous-total', compute='_compute_subtotal', store=True)

    @api.depends('product_id.list_price', 'quantity')
    def _compute_subtotal(self):
        for line in self:
            line.subtotal = line.product_id.list_price * line.quantity

    def to_dict(self):
        self.ensure_one()
        return {
            'id': self.id,
            'productId': self.product_id.id,
            'productName': self.product_id.name,
            'quantity': self.quantity,
            'unitPrice': self.product_price,
            'subtotal': self.subtotal,
        }
