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

    # ═══════════════════════════════════════════════════════════════════════════
    # CHAMPS STOCK AVANCÉS (avec préfixe x_)
    # ═══════════════════════════════════════════════════════════════════════════

    x_qty_available_unreserved = fields.Float(
        string='Stock Disponible Non Réservé',
        compute='_compute_qty_available_unreserved',
        help='Quantité disponible en stock excluant les réservations (commandes confirmées non livrées)'
    )

    x_qty_reserved_manual = fields.Float(
        string='Quantité Réservée Manuellement',
        compute='_compute_qty_reserved_manual',
        help='Quantité bloquée par réservations manuelles actives'
    )

    x_qty_available_after_manual_reservations = fields.Float(
        string='Stock Disponible Après Réservations Manuelles',
        compute='_compute_qty_reserved_manual',
        help='Stock disponible après déduction des réservations manuelles'
    )

    x_qty_sold_365 = fields.Float(
        string='Quantité Vendue (365j)',
        compute='_compute_stock_turnover',
        help='Quantité totale vendue sur les 365 derniers jours'
    )

    x_stock_turnover_365 = fields.Float(
        string='Rotation Stock (365j)',
        compute='_compute_stock_turnover',
        help='Nombre de fois que le stock a tourné sur les 365 derniers jours (Quantité vendue / Stock moyen)'
    )

    x_days_of_stock = fields.Float(
        string='Jours de Stock',
        compute='_compute_stock_turnover',
        help='Nombre de jours estimés avant rupture au rythme de vente actuel (365 / Rotation)'
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # ALIAS BACKWARD-COMPATIBLE (DEPRECATED - sera supprimé Q4 2026)
    # ═══════════════════════════════════════════════════════════════════════════

    qty_available_unreserved = fields.Float(
        compute='_compute_qty_available_unreserved',
        help='[DEPRECATED] Utiliser x_qty_available_unreserved'
    )

    qty_reserved_manual = fields.Float(
        compute='_compute_qty_reserved_manual',
        help='[DEPRECATED] Utiliser x_qty_reserved_manual'
    )

    qty_available_after_manual_reservations = fields.Float(
        compute='_compute_qty_reserved_manual',
        help='[DEPRECATED] Utiliser x_qty_available_after_manual_reservations'
    )

    qty_sold_365 = fields.Float(
        compute='_compute_stock_turnover',
        help='[DEPRECATED] Utiliser x_qty_sold_365'
    )

    stock_turnover_365 = fields.Float(
        compute='_compute_stock_turnover',
        help='[DEPRECATED] Utiliser x_stock_turnover_365'
    )

    days_of_stock = fields.Float(
        compute='_compute_stock_turnover',
        help='[DEPRECATED] Utiliser x_days_of_stock'
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # MÉTHODES COMPUTED
    # ═══════════════════════════════════════════════════════════════════════════

    @api.depends('qty_available')
    def _compute_qty_available_unreserved(self):
        """
        Calcul du stock disponible hors réservations.

        Formule : x_qty_available_unreserved = qty_available - reserved_qty

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
            qty_unreserved = max(0, product.qty_available - reserved_qty)
            
            # Nouveau champ avec préfixe
            product.x_qty_available_unreserved = qty_unreserved
            
            # Alias backward-compatible (DEPRECATED)
            product.qty_available_unreserved = qty_unreserved

    @api.depends('qty_available')
    def _compute_qty_reserved_manual(self):
        """
        Calcul des réservations manuelles actives.

        x_qty_reserved_manual = Somme des réservations actives pour ce produit
        x_qty_available_after_manual_reservations = qty_available - x_qty_reserved_manual
        """
        for product in self:
            # Récupérer réservations manuelles actives pour ce produit
            reservations = self.env['quelyos.stock.reservation'].search([
                ('product_id', '=', product.id),
                ('state', '=', 'active'),
            ])

            # Sommer les quantités réservées
            reserved_manual = sum(reservations.mapped('reserved_qty'))
            
            # Nouveaux champs avec préfixe
            product.x_qty_reserved_manual = reserved_manual
            product.x_qty_available_after_manual_reservations = max(
                0,
                product.qty_available - reserved_manual
            )
            
            # Alias backward-compatible (DEPRECATED)
            product.qty_reserved_manual = reserved_manual
            product.qty_available_after_manual_reservations = max(
                0,
                product.qty_available - reserved_manual
            )

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

            # Stock moyen approximé = (stock actuel + stock il y a 365j) / 2
            # Pour simplifier, on utilise le stock actuel comme approximation
            # (calcul exact nécessiterait historique stock quotidien)
            avg_stock = product.qty_available if product.qty_available > 0 else 1

            # Rotation = Quantité vendue / Stock moyen
            if avg_stock > 0 and qty_sold > 0:
                turnover = qty_sold / avg_stock
                turnover_rounded = round(turnover, 2)

                # Jours de stock = 365 / Rotation
                if turnover > 0:
                    days = round(365 / turnover, 1)
                else:
                    days = 0
            else:
                turnover_rounded = 0
                days = 0

            # Nouveaux champs avec préfixe
            product.x_qty_sold_365 = qty_sold
            product.x_stock_turnover_365 = turnover_rounded
            product.x_days_of_stock = days
            
            # Alias backward-compatible (DEPRECATED)
            product.qty_sold_365 = qty_sold
            product.stock_turnover_365 = turnover_rounded
            product.days_of_stock = days
