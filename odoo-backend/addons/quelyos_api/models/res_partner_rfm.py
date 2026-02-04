# -*- coding: utf-8 -*-
"""
Extension res.partner avec scoring RFM (Récence, Fréquence, Montant)
pour segmentation clients e-commerce
"""
from odoo import models, fields, api
from datetime import datetime, timedelta
import logging

_logger = logging.getLogger(__name__)


class ResPartnerRFM(models.Model):
    _inherit = 'res.partner'

    # Champs computed RFM
    x_rfm_recency_score = fields.Integer(
        string='Score Récence',
        compute='_compute_rfm_scores',
        store=True,
        help='Score 1-5 : 5 = achat très récent, 1 = achat ancien'
    )
    x_rfm_frequency_score = fields.Integer(
        string='Score Fréquence',
        compute='_compute_rfm_scores',
        store=True,
        help='Score 1-5 : 5 = achète très souvent, 1 = achète rarement'
    )
    x_rfm_monetary_score = fields.Integer(
        string='Score Montant',
        compute='_compute_rfm_scores',
        store=True,
        help='Score 1-5 : 5 = dépense beaucoup, 1 = dépense peu'
    )
    x_rfm_segment = fields.Selection([
        ('vip', 'VIP'),
        ('regular', 'Régulier'),
        ('occasional', 'Occasionnel'),
        ('at_risk', 'À risque'),
        ('inactive', 'Inactif'),
    ], string='Segment RFM', compute='_compute_rfm_scores', store=True)

    # Statistiques clients
    x_total_orders = fields.Integer(
        string='Nombre commandes',
        compute='_compute_customer_stats',
        store=True
    )
    x_total_spent = fields.Float(
        string='Montant total dépensé',
        compute='_compute_customer_stats',
        store=True
    )
    x_average_order_value = fields.Float(
        string='Panier moyen',
        compute='_compute_customer_stats',
        store=True
    )
    x_last_order_date = fields.Datetime(
        string='Dernière commande',
        compute='_compute_customer_stats',
        store=True
    )
    x_days_since_last_order = fields.Integer(
        string='Jours depuis dernière commande',
        compute='_compute_customer_stats',
        store=True
    )

    @api.depends('sale_order_ids', 'sale_order_ids.state', 'sale_order_ids.amount_total', 'sale_order_ids.date_order')
    def _compute_customer_stats(self):
        """Calculer les statistiques clients basées sur les commandes"""
        for partner in self:
            # Filtrer commandes confirmées uniquement (sale, done)
            confirmed_orders = partner.sale_order_ids.filtered(
                lambda o: o.state in ('sale', 'done')
            )

            partner.x_total_orders = len(confirmed_orders)
            partner.x_total_spent = sum(confirmed_orders.mapped('amount_total'))
            partner.x_average_order_value = (
                partner.x_total_spent / partner.x_total_orders
                if partner.x_total_orders > 0 else 0
            )

            # Dernière commande
            if confirmed_orders:
                last_order = confirmed_orders.sorted('date_order', reverse=True)[0]
                partner.x_last_order_date = last_order.date_order

                # Jours depuis dernière commande
                if last_order.date_order:
                    delta = datetime.now() - last_order.date_order.replace(tzinfo=None)
                    partner.x_days_since_last_order = delta.days
                else:
                    partner.x_days_since_last_order = 9999
            else:
                partner.x_last_order_date = False
                partner.x_days_since_last_order = 9999

    @api.depends('x_total_orders', 'x_total_spent', 'x_days_since_last_order')
    def _compute_rfm_scores(self):
        """
        Calculer les scores RFM et le segment client.

        Méthode RFM :
        - Récence (R) : Nombre de jours depuis dernier achat (plus c'est bas, mieux c'est)
        - Fréquence (F) : Nombre de commandes (plus c'est haut, mieux c'est)
        - Montant (M) : Total dépensé (plus c'est haut, mieux c'est)

        Segmentation :
        - VIP : R=5, F≥4, M≥4 (achète souvent, récemment, montant élevé)
        - Régulier : R≥3, F≥3, M≥3 (bon équilibre)
        - Occasionnel : F≤2 (achète peu)
        - À risque : R≤2, F≥3 (client fidèle mais n'a pas acheté récemment)
        - Inactif : R≤2, F≤2 (peu d'achats et anciens)
        """
        # Récupérer tous les partners avec commandes pour calculer percentiles
        all_partners = self.search([('x_total_orders', '>', 0)])

        if not all_partners:
            for partner in self:
                partner.x_rfm_recency_score = 0
                partner.x_rfm_frequency_score = 0
                partner.x_rfm_monetary_score = 0
                partner.x_rfm_segment = 'inactive'
            return

        # Calculer percentiles pour scoring
        recency_values = sorted([p.x_days_since_last_order for p in all_partners])
        frequency_values = sorted([p.x_total_orders for p in all_partners], reverse=True)
        monetary_values = sorted([p.x_total_spent for p in all_partners], reverse=True)

        def get_percentile_score(value, values_list, reverse=False):
            """Retourne score 1-5 basé sur percentile"""
            if not values_list or value is None:
                return 1

            try:
                position = values_list.index(value)
                percentile = position / len(values_list)

                if reverse:
                    percentile = 1 - percentile

                if percentile >= 0.8:
                    return 5
                elif percentile >= 0.6:
                    return 4
                elif percentile >= 0.4:
                    return 3
                elif percentile >= 0.2:
                    return 2
                else:
                    return 1
            except (ValueError, ZeroDivisionError):
                return 1

        for partner in self:
            if partner.x_total_orders == 0:
                partner.x_rfm_recency_score = 0
                partner.x_rfm_frequency_score = 0
                partner.x_rfm_monetary_score = 0
                partner.x_rfm_segment = 'inactive'
                continue

            # Calculer scores individuels (1-5)
            partner.x_rfm_recency_score = get_percentile_score(
                partner.x_days_since_last_order, recency_values
            )
            partner.x_rfm_frequency_score = get_percentile_score(
                partner.x_total_orders, frequency_values
            )
            partner.x_rfm_monetary_score = get_percentile_score(
                partner.x_total_spent, monetary_values
            )

            # Déterminer segment
            r = partner.x_rfm_recency_score
            f = partner.x_rfm_frequency_score
            m = partner.x_rfm_monetary_score

            if r == 5 and f >= 4 and m >= 4:
                segment = 'vip'
            elif r >= 3 and f >= 3 and m >= 3:
                segment = 'regular'
            elif r <= 2 and f >= 3:
                segment = 'at_risk'
            elif f <= 2:
                segment = 'occasional'
            else:
                segment = 'inactive'

            partner.x_rfm_segment = segment

    def action_recompute_rfm(self):
        """Action manuelle pour recalculer RFM (utile pour cron job)"""
        self._compute_customer_stats()
        self._compute_rfm_scores()
        _logger.info(f"RFM scores recomputed for {len(self)} partners")
