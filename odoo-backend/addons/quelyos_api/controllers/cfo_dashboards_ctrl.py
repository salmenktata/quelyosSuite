# -*- coding: utf-8 -*-
"""Contrôleur CFO Executive Dashboards"""

import logging
from datetime import datetime, timedelta
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class CFODashboardsController(BaseController):
    """API Dashboards CFO Executive avec KPIs financiers"""

    @http.route('/api/finance/cfo/kpis', type='json', auth='public', methods=['GET', 'OPTIONS'], cors='*', csrf=False)
    def get_kpis(self, **params):
        """
        KPIs financiers clés pour CFO
        
        Query params:
        - period: str (current_month, current_quarter, current_year)
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            period = params.get('period', 'current_month')
            
            # TODO: Calculs réels depuis account.move, account.payment
            # DSO = (Créances clients / CA) × 365
            # DPO = (Dettes fournisseurs / Achats) × 365
            # Cash Conversion Cycle = DSO + DIO - DPO
            # Working Capital Ratio = (Actif circulant / Passif circulant)
            
            # Simuler KPIs
            kpis = {
                'dso': {
                    'value': 45.2,  # jours
                    'unit': 'days',
                    'trend': 'decreasing',  # Good (moins de délai encaissement)
                    'previousValue': 48.5,
                    'benchmark': 30,  # Objectif
                    'status': 'warning',
                },
                'dpo': {
                    'value': 38.7,  # jours
                    'unit': 'days',
                    'trend': 'stable',
                    'previousValue': 39.1,
                    'benchmark': 45,  # Objectif (plus de délai paiement = mieux)
                    'status': 'good',
                },
                'cashConversionCycle': {
                    'value': 32.5,  # DSO + DIO - DPO
                    'unit': 'days',
                    'trend': 'decreasing',  # Good
                    'previousValue': 35.8,
                    'benchmark': 25,
                    'status': 'warning',
                },
                'workingCapitalRatio': {
                    'value': 1.85,  # ratio
                    'unit': 'ratio',
                    'trend': 'increasing',  # Good
                    'previousValue': 1.72,
                    'benchmark': 1.5,  # > 1.5 = bon
                    'status': 'good',
                },
                'currentRatio': {
                    'value': 2.15,  # Actif circulant / Passif circulant
                    'unit': 'ratio',
                    'trend': 'stable',
                    'previousValue': 2.10,
                    'benchmark': 2.0,
                    'status': 'good',
                },
                'quickRatio': {
                    'value': 1.45,  # (Actif - Stocks) / Passif
                    'unit': 'ratio',
                    'trend': 'increasing',
                    'previousValue': 1.38,
                    'benchmark': 1.0,
                    'status': 'good',
                },
                'ebitdaMargin': {
                    'value': 18.5,  # %
                    'unit': 'percentage',
                    'trend': 'increasing',
                    'previousValue': 16.2,
                    'benchmark': 15,
                    'status': 'excellent',
                },
                'netProfitMargin': {
                    'value': 12.3,  # %
                    'unit': 'percentage',
                    'trend': 'increasing',
                    'previousValue': 10.8,
                    'benchmark': 10,
                    'status': 'excellent',
                },
            }
            
            return self._success_response({
                'kpis': kpis,
                'period': period,
                'updatedAt': datetime.now().isoformat(),
            })

        except Exception as e:
            _logger.error(f"Erreur get_kpis: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/cfo/trends', type='json', auth='public', methods=['GET', 'OPTIONS'], cors='*', csrf=False)
    def get_trends(self, **params):
        """
        Évolution KPIs sur 12 mois
        
        Query params:
        - kpi: str (dso, dpo, cash_conversion_cycle, etc.)
        - months: int (default: 12)
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            kpi = params.get('kpi', 'dso')
            months = params.get('months', 12)
            
            # Simuler évolution DSO sur 12 mois
            trends = []
            base_value = 50.0
            for i in range(months):
                month_date = datetime.now() - timedelta(days=30 * (months - i - 1))
                value = base_value - (i * 0.5) + (2 if i % 3 == 0 else 0)  # Tendance baissière avec oscillations
                
                trends.append({
                    'month': month_date.strftime('%Y-%m'),
                    'value': round(value, 1),
                })
            
            return self._success_response({
                'kpi': kpi,
                'trends': trends,
            })

        except Exception as e:
            _logger.error(f"Erreur get_trends: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/cfo/cashflow-summary', type='json', auth='public', methods=['GET', 'OPTIONS'], cors='*', csrf=False)
    def get_cashflow_summary(self, **params):
        """
        Résumé trésorerie : entrées, sorties, solde
        
        Query params:
        - period: str (current_month, current_quarter, current_year)
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            
            # Simuler flux de trésorerie
            summary = {
                'openingBalance': 125000.00,
                'inflows': {
                    'customerPayments': 85000.00,
                    'otherRevenue': 12000.00,
                    'total': 97000.00,
                },
                'outflows': {
                    'supplierPayments': -45000.00,
                    'salaries': -35000.00,
                    'taxes': -8000.00,
                    'other': -4000.00,
                    'total': -92000.00,
                },
                'netCashFlow': 5000.00,  # inflows + outflows
                'closingBalance': 130000.00,  # opening + net
                'burnRate': 92000.00 / 30,  # Dépenses par jour
                'runway': 130000.00 / (92000.00 / 30),  # Jours autonomie
            }
            
            return self._success_response(summary)

        except Exception as e:
            _logger.error(f"Erreur get_cashflow_summary: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/cfo/alerts', type='json', auth='public', methods=['GET', 'OPTIONS'], cors='*', csrf=False)
    def get_financial_alerts(self, **params):
        """Alertes financières CFO (seuils dépassés, anomalies)"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            
            # Simuler alertes
            alerts = [
                {
                    'id': 1,
                    'severity': 'warning',
                    'type': 'dso_high',
                    'title': 'DSO élevé',
                    'message': 'Le DSO (45.2j) dépasse l\'objectif de 30j',
                    'recommendation': 'Intensifier relances clients ou revoir conditions paiement',
                    'createdAt': datetime.now().isoformat(),
                },
                {
                    'id': 2,
                    'severity': 'info',
                    'type': 'cash_low',
                    'title': 'Trésorerie à surveiller',
                    'message': 'Solde prévisionnel < 100K€ dans 15 jours',
                    'recommendation': 'Anticiper besoins financement ou accélérer encaissements',
                    'createdAt': (datetime.now() - timedelta(hours=2)).isoformat(),
                },
            ]
            
            return self._success_response({'alerts': alerts})

        except Exception as e:
            _logger.error(f"Erreur get_financial_alerts: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)
