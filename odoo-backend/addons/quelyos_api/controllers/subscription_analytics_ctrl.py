# -*- coding: utf-8 -*-
"""
Contrôleur API Analytics Abonnements

Endpoints :
- POST /api/finance/subscriptions/analytics/dashboard : Dashboard MRR/ARR/Churn
- POST /api/finance/subscriptions/analytics/trend : Historique 12 mois
- POST /api/finance/subscriptions/analytics/compute : Recalculer période
"""

import logging
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class SubscriptionAnalyticsController(BaseController):
    """API Analytics Abonnements SaaS"""

    @http.route('/api/finance/subscriptions/analytics/dashboard', type='json', auth='public', methods=['POST'], csrf=False)
    def get_analytics_dashboard(self, **params):
        """
        Dashboard analytics abonnements (période actuelle + tendances)

        Returns:
        {
          "success": true,
          "data": {
            "current_period": {
              "period_label": "Février 2026",
              "mrr": 125000.0,
              "arr": 1500000.0,
              "new_mrr": 15000.0,
              "expansion_mrr": 8000.0,
              "contraction_mrr": 2000.0,
              "churned_mrr": 5000.0,
              "net_new_mrr": 16000.0,
              "mrr_growth_rate": 14.67,
              "customers_end": 450,
              "customers_new": 35,
              "customers_churned": 12,
              "customer_churn_rate": 2.67,
              "revenue_churn_rate": 4.13,
              "net_revenue_retention": 112.0,
              "arpu": 277.78,
              "ltv": 6666.67,
              "cac": 1500.0,
              "ltv_cac_ratio": 4.44
            },
            "trends": {
              "mrr_last_12_months": [...],
              "churn_last_12_months": [...],
              "nrr_last_12_months": [...]
            }
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = user.tenant_id.id
            Analytics = request.env['quelyos.subscription.analytics'].sudo()

            # Période actuelle (mois en cours)
            today = datetime.today().date()
            current_start = today.replace(day=1)
            next_month = current_start + relativedelta(months=1)
            current_end = next_month - timedelta(days=1)

            # Calculer analytics du mois en cours (si pas déjà fait)
            current_analytics = Analytics.search([
                ('tenant_id', '=', tenant_id),
                ('period_start', '=', current_start),
            ], limit=1)

            if not current_analytics:
                # Calculer pour la première fois
                current_analytics = Analytics.compute_analytics_for_period(
                    tenant_id, current_start, current_end
                )

            # Historique 12 derniers mois
            trend_data = self._get_trend_data(tenant_id, 12)

            # Formater données période actuelle
            current_data = {
                'period_label': current_analytics.period_label,
                'mrr': current_analytics.mrr,
                'arr': current_analytics.arr,
                'new_mrr': current_analytics.new_mrr,
                'expansion_mrr': current_analytics.expansion_mrr,
                'contraction_mrr': current_analytics.contraction_mrr,
                'churned_mrr': current_analytics.churned_mrr,
                'net_new_mrr': current_analytics.net_new_mrr,
                'mrr_growth_rate': round(current_analytics.mrr_growth_rate, 2),
                'customers_start': current_analytics.customers_start,
                'customers_end': current_analytics.customers_end,
                'customers_new': current_analytics.customers_new,
                'customers_churned': current_analytics.customers_churned,
                'customer_churn_rate': round(current_analytics.customer_churn_rate, 2),
                'revenue_churn_rate': round(current_analytics.revenue_churn_rate, 2),
                'net_revenue_retention': round(current_analytics.net_revenue_retention, 2),
                'arpu': round(current_analytics.arpu, 2),
                'ltv': round(current_analytics.ltv, 2),
                'cac': current_analytics.cac,
                'ltv_cac_ratio': round(current_analytics.ltv_cac_ratio, 2),
            }

            return self._success_response({
                'current_period': current_data,
                'trends': trend_data,
            })

        except Exception as e:
            _logger.error(f"Erreur get_analytics_dashboard: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/subscriptions/analytics/trend', type='json', auth='public', methods=['POST'], csrf=False)
    def get_analytics_trend(self, **params):
        """
        Historique analytics (12 derniers mois par défaut)

        Query params:
        - months: Nombre de mois à retourner (default: 12)

        Returns:
        {
          "success": true,
          "data": {
            "periods": [
              {
                "period_label": "Février 2026",
                "mrr": 125000.0,
                "arr": 1500000.0,
                "churn_rate": 2.67,
                "nrr": 112.0,
                ...
              }
            ]
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            data = request.jsonrequest
            months = data.get('months', 12)
            tenant_id = user.tenant_id.id

            trend_data = self._get_trend_data(tenant_id, months)

            return self._success_response(trend_data)

        except Exception as e:
            _logger.error(f"Erreur get_analytics_trend: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/subscriptions/analytics/compute', type='json', auth='public', methods=['POST'], csrf=False)
    def compute_analytics_period(self, **params):
        """
        Recalculer analytics pour une période donnée

        Body:
        {
          "period_start": "2026-02-01",
          "period_end": "2026-02-28"
        }

        Returns:
        {
          "success": true,
          "data": {
            "message": "Analytics calculés",
            "analytics": {...}
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            data = request.jsonrequest
            period_start_str = data.get('period_start')
            period_end_str = data.get('period_end')

            if not period_start_str or not period_end_str:
                return self._error_response("period_start et period_end requis", "VALIDATION_ERROR", 400)

            # Parser dates
            period_start = datetime.strptime(period_start_str, '%Y-%m-%d').date()
            period_end = datetime.strptime(period_end_str, '%Y-%m-%d').date()

            tenant_id = user.tenant_id.id
            Analytics = request.env['quelyos.subscription.analytics'].sudo()

            # Calculer
            analytics = Analytics.compute_analytics_for_period(tenant_id, period_start, period_end)

            return self._success_response({
                'message': f'Analytics calculés pour {analytics.period_label}',
                'analytics': {
                    'mrr': analytics.mrr,
                    'arr': analytics.arr,
                    'customers_end': analytics.customers_end,
                    'churn_rate': round(analytics.customer_churn_rate, 2),
                }
            })

        except Exception as e:
            _logger.error(f"Erreur compute_analytics_period: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    # ═══════════════════════════════════════════════════════════════════════════
    # Helper Methods
    # ═══════════════════════════════════════════════════════════════════════════

    def _get_trend_data(self, tenant_id, months=12):
        """
        Récupérer données tendance N derniers mois

        Args:
            tenant_id (int): ID du tenant
            months (int): Nombre de mois

        Returns:
            dict: Données formatées pour graphiques
        """
        Analytics = request.env['quelyos.subscription.analytics'].sudo()

        # Calculer date début
        today = datetime.today().date()
        start_date = (today.replace(day=1) - relativedelta(months=months-1))

        # Chercher analytics
        analytics_records = Analytics.search([
            ('tenant_id', '=', tenant_id),
            ('period_start', '>=', start_date),
        ], order='period_start asc')

        # Formater pour graphiques
        mrr_trend = []
        churn_trend = []
        nrr_trend = []
        customers_trend = []

        for record in analytics_records:
            mrr_trend.append({
                'period': record.period_label,
                'value': record.mrr,
                'new': record.new_mrr,
                'expansion': record.expansion_mrr,
                'churned': record.churned_mrr,
            })

            churn_trend.append({
                'period': record.period_label,
                'customer_churn_rate': round(record.customer_churn_rate, 2),
                'revenue_churn_rate': round(record.revenue_churn_rate, 2),
            })

            nrr_trend.append({
                'period': record.period_label,
                'value': round(record.net_revenue_retention, 2),
            })

            customers_trend.append({
                'period': record.period_label,
                'total': record.customers_end,
                'new': record.customers_new,
                'churned': record.customers_churned,
            })

        return {
            'mrr_trend': mrr_trend,
            'churn_trend': churn_trend,
            'nrr_trend': nrr_trend,
            'customers_trend': customers_trend,
        }
