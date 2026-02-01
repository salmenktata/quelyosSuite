# -*- coding: utf-8 -*-
"""Contrôleur Exercices Fiscaux"""

import logging
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class FiscalYearsController(BaseController):
    """API Exercices Fiscaux"""

    @http.route('/api/finance/fiscal-years', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_fiscal_years(self, **params):
        """Liste des exercices fiscaux"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            # Utiliser account.fiscal.year si disponible ou date.range
            FiscalYear = request.env['account.fiscal.year'].sudo() if 'account.fiscal.year' in request.env else request.env['date.range'].sudo()
            years = FiscalYear.search([], limit=10)

            data = {
                'fiscalYears': [{'id': y.id, 'name': y.name, 'dateFrom': str(y.date_from), 'dateTo': str(y.date_to)} for y in years],
                'total': len(years),
            }

            return self._success_response(data)

        except Exception as e:
            _logger.error(f"Erreur get_fiscal_years: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)
