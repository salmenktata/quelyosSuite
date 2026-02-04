# -*- coding: utf-8 -*-
"""
Module Analytics Abonnements - MRR/ARR/Churn/LTV

Calculs KPIs SaaS :
- MRR (Monthly Recurring Revenue) : Revenus récurrents mensuels
- ARR (Annual Recurring Revenue) : Revenus récurrents annuels
- Churn Rate : Taux de désabonnement (% abonnements perdus / période)
- Customer Lifetime Value (LTV) : Valeur vie client moyenne
- New MRR : Nouveaux abonnements du mois
- Expansion MRR : Upsells (upgrades) du mois
- Contraction MRR : Downgrades du mois
- Churned MRR : MRR perdu (cancellations)
"""

import logging
from odoo import models, fields, api, _
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

_logger = logging.getLogger(__name__)


class SubscriptionAnalytics(models.Model):
    _name = 'quelyos.subscription.analytics'
    _description = 'Analytics Abonnements SaaS'
    _order = 'period_start desc'

    # Période
    period_start = fields.Date(
        string='Début Période',
        required=True,
        help='Date de début de la période analysée (1er du mois)'
    )

    period_end = fields.Date(
        string='Fin Période',
        required=True,
        help='Date de fin de la période analysée (dernier jour du mois)'
    )

    period_label = fields.Char(
        string='Période',
        compute='_compute_period_label',
        store=True,
        help='Label période (ex: "Février 2026")'
    )

    # Tenant (isolation multi-tenant)
    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        required=True,
        ondelete='cascade',
        help='Tenant pour isolation données'
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # MRR/ARR
    # ═══════════════════════════════════════════════════════════════════════════

    mrr = fields.Float(
        string='MRR (€)',
        help='Monthly Recurring Revenue fin de période'
    )

    arr = fields.Float(
        string='ARR (€)',
        compute='_compute_arr',
        store=True,
        help='Annual Recurring Revenue (MRR × 12)'
    )

    new_mrr = fields.Float(
        string='New MRR (€)',
        help='MRR des nouveaux abonnements ce mois'
    )

    expansion_mrr = fields.Float(
        string='Expansion MRR (€)',
        help='MRR additionnel des upsells (upgrades)'
    )

    contraction_mrr = fields.Float(
        string='Contraction MRR (€)',
        help='MRR perdu des downgrades'
    )

    churned_mrr = fields.Float(
        string='Churned MRR (€)',
        help='MRR perdu des cancellations'
    )

    net_new_mrr = fields.Float(
        string='Net New MRR (€)',
        compute='_compute_net_new_mrr',
        store=True,
        help='New + Expansion - Contraction - Churned'
    )

    mrr_growth_rate = fields.Float(
        string='Taux Croissance MRR (%)',
        compute='_compute_mrr_growth_rate',
        store=True,
        help='(MRR fin - MRR début) / MRR début × 100'
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # Churn
    # ═══════════════════════════════════════════════════════════════════════════

    customers_start = fields.Integer(
        string='Clients Début',
        help='Nombre clients début période'
    )

    customers_end = fields.Integer(
        string='Clients Fin',
        help='Nombre clients fin période'
    )

    customers_new = fields.Integer(
        string='Nouveaux Clients',
        help='Nouveaux clients ce mois'
    )

    customers_churned = fields.Integer(
        string='Clients Churnés',
        help='Clients perdus ce mois (cancellations)'
    )

    customer_churn_rate = fields.Float(
        string='Churn Rate Clients (%)',
        compute='_compute_churn_rates',
        store=True,
        help='(Clients churnés / Clients début) × 100'
    )

    revenue_churn_rate = fields.Float(
        string='Revenue Churn Rate (%)',
        compute='_compute_churn_rates',
        store=True,
        help='(MRR churned / MRR début) × 100'
    )

    net_revenue_retention = fields.Float(
        string='Net Revenue Retention (%)',
        compute='_compute_nrr',
        store=True,
        help='(MRR fin - New MRR) / MRR début × 100. >100% = expansion > churn'
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # LTV (Customer Lifetime Value)
    # ═══════════════════════════════════════════════════════════════════════════

    avg_customer_lifetime_months = fields.Float(
        string='Durée Vie Moyenne (mois)',
        help='1 / Churn Rate mensuel (moyenne mobile 6 mois)'
    )

    ltv = fields.Float(
        string='LTV (€)',
        compute='_compute_ltv',
        store=True,
        help='ARPU × Durée vie moyenne = Valeur vie client moyenne'
    )

    arpu = fields.Float(
        string='ARPU (€)',
        compute='_compute_arpu',
        store=True,
        help='Average Revenue Per User = MRR / Nombre clients actifs'
    )

    cac = fields.Float(
        string='CAC (€)',
        help='Customer Acquisition Cost moyen (à saisir manuellement)'
    )

    ltv_cac_ratio = fields.Float(
        string='LTV:CAC Ratio',
        compute='_compute_ltv_cac_ratio',
        store=True,
        help='LTV / CAC. Objectif : >3.0 pour SaaS sain'
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # Computed Fields
    # ═══════════════════════════════════════════════════════════════════════════

    @api.depends('period_start')
    def _compute_period_label(self):
        for record in self:
            if record.period_start:
                record.period_label = record.period_start.strftime('%B %Y')
            else:
                record.period_label = ''

    @api.depends('mrr')
    def _compute_arr(self):
        for record in self:
            record.arr = record.mrr * 12

    @api.depends('new_mrr', 'expansion_mrr', 'contraction_mrr', 'churned_mrr')
    def _compute_net_new_mrr(self):
        for record in self:
            record.net_new_mrr = (
                record.new_mrr +
                record.expansion_mrr -
                record.contraction_mrr -
                record.churned_mrr
            )

    @api.depends('mrr', 'net_new_mrr')
    def _compute_mrr_growth_rate(self):
        for record in self:
            mrr_start = record.mrr - record.net_new_mrr
            if mrr_start > 0:
                record.mrr_growth_rate = (record.net_new_mrr / mrr_start) * 100
            else:
                record.mrr_growth_rate = 0.0

    @api.depends('customers_start', 'customers_churned', 'churned_mrr', 'mrr')
    def _compute_churn_rates(self):
        for record in self:
            # Customer Churn Rate
            if record.customers_start > 0:
                record.customer_churn_rate = (record.customers_churned / record.customers_start) * 100
            else:
                record.customer_churn_rate = 0.0

            # Revenue Churn Rate
            mrr_start = record.mrr - record.net_new_mrr
            if mrr_start > 0:
                record.revenue_churn_rate = (record.churned_mrr / mrr_start) * 100
            else:
                record.revenue_churn_rate = 0.0

    @api.depends('mrr', 'new_mrr', 'net_new_mrr')
    def _compute_nrr(self):
        for record in self:
            mrr_start = record.mrr - record.net_new_mrr
            if mrr_start > 0:
                # NRR = (MRR fin - New MRR) / MRR début
                mrr_from_existing = record.mrr - record.new_mrr
                record.net_revenue_retention = (mrr_from_existing / mrr_start) * 100
            else:
                record.net_revenue_retention = 0.0

    @api.depends('mrr', 'customers_end')
    def _compute_arpu(self):
        for record in self:
            if record.customers_end > 0:
                record.arpu = record.mrr / record.customers_end
            else:
                record.arpu = 0.0

    @api.depends('arpu', 'avg_customer_lifetime_months')
    def _compute_ltv(self):
        for record in self:
            record.ltv = record.arpu * record.avg_customer_lifetime_months

    @api.depends('ltv', 'cac')
    def _compute_ltv_cac_ratio(self):
        for record in self:
            if record.cac > 0:
                record.ltv_cac_ratio = record.ltv / record.cac
            else:
                record.ltv_cac_ratio = 0.0

    # ═══════════════════════════════════════════════════════════════════════════
    # Methods
    # ═══════════════════════════════════════════════════════════════════════════

    @api.model
    def compute_analytics_for_period(self, tenant_id, period_start, period_end):
        """
        Calculer analytics abonnements pour une période donnée

        Args:
            tenant_id (int): ID du tenant
            period_start (date): Début période
            period_end (date): Fin période

        Returns:
            recordset: Enregistrement analytics créé/mis à jour
        """
        Subscription = self.env['quelyos.subscription'].sudo()

        # Chercher analytics existant
        existing = self.search([
            ('tenant_id', '=', tenant_id),
            ('period_start', '=', period_start),
            ('period_end', '=', period_end),
        ], limit=1)

        # Abonnements actifs fin de période
        active_subs = Subscription.search([
            ('tenant_id', '=', tenant_id),
            ('state', 'in', ['active', 'trial']),
            ('start_date', '<=', period_end),
            '|',
            ('end_date', '=', False),
            ('end_date', '>', period_end),
        ])

        # Calcul MRR total
        mrr_total = sum(active_subs.mapped('mrr'))

        # Abonnements créés ce mois (New MRR)
        new_subs = Subscription.search([
            ('tenant_id', '=', tenant_id),
            ('start_date', '>=', period_start),
            ('start_date', '<=', period_end),
        ])
        new_mrr = sum(new_subs.mapped('mrr'))

        # Abonnements churnés ce mois
        churned_subs = Subscription.search([
            ('tenant_id', '=', tenant_id),
            ('state', 'in', ['cancelled', 'expired']),
            ('end_date', '>=', period_start),
            ('end_date', '<=', period_end),
        ])
        churned_mrr = sum(churned_subs.mapped('mrr'))

        # Clients
        customers_end = len(active_subs)
        customers_new = len(new_subs)
        customers_churned = len(churned_subs)
        customers_start = customers_end - customers_new + customers_churned

        # TODO: Calculer expansion_mrr, contraction_mrr (upgrades/downgrades)
        # Nécessite tracking changements plan

        # Durée vie moyenne (moyenne mobile 6 derniers mois)
        # TODO: Implémenter calcul précis

        vals = {
            'tenant_id': tenant_id,
            'period_start': period_start,
            'period_end': period_end,
            'mrr': mrr_total,
            'new_mrr': new_mrr,
            'churned_mrr': churned_mrr,
            'expansion_mrr': 0.0,  # TODO
            'contraction_mrr': 0.0,  # TODO
            'customers_start': customers_start,
            'customers_end': customers_end,
            'customers_new': customers_new,
            'customers_churned': customers_churned,
            'avg_customer_lifetime_months': 24.0,  # Placeholder
            'cac': 0.0,  # À saisir manuellement
        }

        if existing:
            existing.write(vals)
            return existing
        else:
            return self.create(vals)

    @api.model
    def cron_compute_monthly_analytics(self):
        """
        Cron mensuel : Calculer analytics du mois précédent pour tous les tenants

        Exécution : 1er du mois à 6h00
        """
        _logger.info("[Analytics] Début calcul analytics mensuels")

        # Mois précédent
        today = fields.Date.today()
        period_end = (today.replace(day=1) - timedelta(days=1))  # Dernier jour mois précédent
        period_start = period_end.replace(day=1)  # 1er jour mois précédent

        # Pour chaque tenant
        Tenant = self.env['quelyos.tenant'].sudo()
        tenants = Tenant.search([('active', '=', True)])

        for tenant in tenants:
            try:
                self.compute_analytics_for_period(tenant.id, period_start, period_end)
                _logger.info(f"[Analytics] Calculé pour tenant {tenant.name} ({period_start} - {period_end})")
            except Exception as e:
                _logger.error(f"[Analytics] Erreur tenant {tenant.name}: {e}", exc_info=True)

        _logger.info(f"[Analytics] Terminé : {len(tenants)} tenants traités")
