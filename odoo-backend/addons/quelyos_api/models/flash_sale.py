# -*- coding: utf-8 -*-
from odoo import models, fields, api
from datetime import datetime


class FlashSale(models.Model):
    _name = 'quelyos.flash.sale'
    _description = 'Vente Flash'
    _order = 'date_start desc'

    name = fields.Char('Nom', required=True)
    description = fields.Text('Description')

    # Période
    date_start = fields.Datetime('Début', required=True)
    date_end = fields.Datetime('Fin', required=True)

    # Produits
    line_ids = fields.One2many(
        'quelyos.flash.sale.line',
        'flash_sale_id',
        string='Produits'
    )
    product_count = fields.Integer('Nb produits', compute='_compute_counts', store=True)

    # Configuration
    company_id = fields.Many2one(
        'res.company',
        string='Société',
        required=True,
        default=lambda self: self.env.company,
        index=True
    )
    is_active = fields.Boolean('Actif', default=True)

    # Visuels
    banner_image = fields.Binary('Bannière', attachment=True)
    background_color = fields.Char('Couleur fond', default='#ef4444')

    # Stats
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('scheduled', 'Programmé'),
        ('running', 'En cours'),
        ('ended', 'Terminé'),
    ], string='Statut', compute='_compute_state', store=False)

    total_sales = fields.Float('Ventes totales', compute='_compute_counts', store=True)
    total_orders = fields.Integer('Nb commandes', compute='_compute_counts', store=True)

    @api.depends('date_start', 'date_end', 'is_active')
    def _compute_state(self):
        now = datetime.now()
        for sale in self:
            if not sale.is_active:
                sale.state = 'draft'
            elif sale.date_start and sale.date_end:
                if now < sale.date_start:
                    sale.state = 'scheduled'
                elif now > sale.date_end:
                    sale.state = 'ended'
                else:
                    sale.state = 'running'
            else:
                sale.state = 'draft'

    @api.depends('line_ids')
    def _compute_counts(self):
        for sale in self:
            sale.product_count = len(sale.line_ids)
            sale.total_sales = sum(line.total_sold for line in sale.line_ids)
            sale.total_orders = sum(line.qty_sold for line in sale.line_ids)

    def get_banner_url(self):
        self.ensure_one()
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
        if self.banner_image:
            return f'{base_url}/web/image/quelyos.flash.sale/{self.id}/banner_image'
        return None

    def to_dict(self, include_products=True):
        self.ensure_one()
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'dateStart': self.date_start.isoformat() if self.date_start else None,
            'dateEnd': self.date_end.isoformat() if self.date_end else None,
            'state': self.state,
            'isActive': self.is_active,
            'bannerUrl': self.get_banner_url(),
            'backgroundColor': self.background_color,
            'productCount': self.product_count,
            'totalSales': self.total_sales,
            'totalOrders': self.total_orders,
        }
        if include_products:
            data['products'] = [line.to_dict() for line in self.line_ids]
        return data


class FlashSaleLine(models.Model):
    _name = 'quelyos.flash.sale.line'
    _description = 'Ligne Vente Flash'

    flash_sale_id = fields.Many2one(
        'quelyos.flash.sale',
        string='Vente Flash',
        required=True,
        ondelete='cascade'
    )
    product_id = fields.Many2one(
        'product.template',
        string='Produit',
        required=True
    )

    # Prix
    original_price = fields.Float('Prix original', required=True)
    flash_price = fields.Float('Prix flash', required=True)
    discount_percent = fields.Float('% Réduction', compute='_compute_discount', store=True)

    # Stock
    qty_available = fields.Integer('Quantité disponible', required=True, default=100)
    qty_sold = fields.Integer('Quantité vendue', default=0)
    qty_remaining = fields.Integer('Restant', compute='_compute_remaining', store=True)

    # Stats
    total_sold = fields.Float('Total vendu', compute='_compute_total_sold', store=True)

    @api.depends('original_price', 'flash_price')
    def _compute_discount(self):
        for line in self:
            if line.original_price > 0:
                line.discount_percent = round(
                    (1 - line.flash_price / line.original_price) * 100, 1
                )
            else:
                line.discount_percent = 0

    @api.depends('qty_available', 'qty_sold')
    def _compute_remaining(self):
        for line in self:
            line.qty_remaining = max(0, line.qty_available - line.qty_sold)

    @api.depends('flash_price', 'qty_sold')
    def _compute_total_sold(self):
        for line in self:
            line.total_sold = line.flash_price * line.qty_sold

    def to_dict(self):
        self.ensure_one()
        return {
            'id': self.id,
            'productId': self.product_id.id,
            'productName': self.product_id.name,
            'originalPrice': self.original_price,
            'flashPrice': self.flash_price,
            'discountPercent': self.discount_percent,
            'qtyAvailable': self.qty_available,
            'qtySold': self.qty_sold,
            'qtyRemaining': self.qty_remaining,
        }
