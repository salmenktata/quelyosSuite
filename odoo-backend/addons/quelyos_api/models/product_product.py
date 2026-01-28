# -*- coding: utf-8 -*-
from odoo import models, fields, api
from datetime import datetime, timedelta


class ProductProduct(models.Model):
    _inherit = 'product.product'

    # ═══════════════════════════════════════════════════════════════════════════
    # MULTI-TENANT (hérité de product.template)
    # ═══════════════════════════════════════════════════════════════════════════

    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        related='product_tmpl_id.tenant_id',
        store=True,
        index=True,
    )

    qty_available_unreserved = fields.Float(
        string='Stock Disponible Non Réservé',
        compute='_compute_qty_available_unreserved',
        help='Quantité disponible en stock excluant les réservations (commandes confirmées non livrées)'
    )

    qty_sold_365 = fields.Float(
        string='Quantité Vendue (365j)',
        compute='_compute_stock_turnover',
        help='Quantité totale vendue sur les 365 derniers jours'
    )

    stock_turnover_365 = fields.Float(
        string='Rotation Stock (365j)',
        compute='_compute_stock_turnover',
        help='Nombre de fois que le stock a tourné sur les 365 derniers jours (Quantité vendue / Stock moyen)'
    )

    days_of_stock = fields.Float(
        string='Jours de Stock',
        compute='_compute_stock_turnover',
        help='Nombre de jours estimés avant rupture au rythme de vente actuel (365 / Rotation)'
    )

    @api.depends('qty_available')
    def _compute_qty_available_unreserved(self):
        """
        Calcul du stock disponible hors réservations.

        Formule : qty_available_unreserved = qty_available - reserved_qty

        reserved_qty = Somme des mouvements stock en état 'assigned' (prêt à livrer)
        pour ce produit depuis locations internes vers locations clients.
        """
        for product in self:
            # Récupérer les mouvements réservés (assigned) pour ce produit
            # depuis emplacements internes vers emplacements clients
            reserved_moves = self.env['stock.move'].search([
                ('product_id', '=', product.id),
                ('state', 'in', ['assigned', 'confirmed', 'waiting']),
                ('location_id.usage', '=', 'internal'),
                ('location_dest_id.usage', '=', 'customer'),
            ])

            # Sommer les quantités réservées
            reserved_qty = sum(reserved_moves.mapped('product_uom_qty'))

            # Calculer stock disponible hors réservations
            product.qty_available_unreserved = max(0, product.qty_available - reserved_qty)

    def _compute_stock_turnover(self):
        """
        Calcul de la rotation stock sur les 365 derniers jours.

        Rotation = Quantité vendue / Stock moyen
        Jours de stock = 365 / Rotation (si rotation > 0)

        Utilise les mouvements stock 'done' depuis internal vers customer
        sur les 365 derniers jours.
        """
        date_from = datetime.now() - timedelta(days=365)

        for product in self:
            # Récupérer mouvements de vente validés (done) sur les 365 derniers jours
            # Depuis emplacements internes vers emplacements clients
            sale_moves = self.env['stock.move'].search([
                ('product_id', '=', product.id),
                ('state', '=', 'done'),
                ('location_id.usage', '=', 'internal'),
                ('location_dest_id.usage', '=', 'customer'),
                ('date', '>=', date_from),
            ])

            # Quantité vendue = somme des quantités des mouvements
            qty_sold = sum(sale_moves.mapped('product_uom_qty'))
            product.qty_sold_365 = qty_sold

            # Stock moyen approximé = (stock actuel + stock il y a 365j) / 2
            # Pour simplifier, on utilise le stock actuel comme approximation
            # (calcul exact nécessiterait historique stock quotidien)
            avg_stock = product.qty_available if product.qty_available > 0 else 1

            # Rotation = Quantité vendue / Stock moyen
            if avg_stock > 0 and qty_sold > 0:
                turnover = qty_sold / avg_stock
                product.stock_turnover_365 = round(turnover, 2)

                # Jours de stock = 365 / Rotation
                if turnover > 0:
                    product.days_of_stock = round(365 / turnover, 1)
                else:
                    product.days_of_stock = 0
            else:
                product.stock_turnover_365 = 0
                product.days_of_stock = 0
