# -*- coding: utf-8 -*-
"""Contrôleur Rapports Financiers"""

import logging
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class FinancialReportsController(BaseController):
    """API Rapports Financiers"""

    @http.route('/api/finance/reports/balance-sheet', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_balance_sheet(self, **params):
        """Bilan comptable"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            # Simuler bilan
            balance_sheet = {
                'assets': {
                    'current': 50000,
                    'fixed': 100000,
                    'total': 150000,
                },
                'liabilities': {
                    'current': 30000,
                    'longTerm': 70000,
                    'equity': 50000,
                    'total': 150000,
                },
            }

            return self._success_response(balance_sheet)

        except Exception as e:
            _logger.error(f"Erreur get_balance_sheet: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/reports/profit-loss', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_profit_loss(self, **params):
        """Compte de résultat"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            # Simuler P&L
            profit_loss = {
                'revenue': 200000,
                'expenses': 150000,
                'netProfit': 50000,
            }

            return self._success_response(profit_loss)

        except Exception as e:
            _logger.error(f"Erreur get_profit_loss: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)
