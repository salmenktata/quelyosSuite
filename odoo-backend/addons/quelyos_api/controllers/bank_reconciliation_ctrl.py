# -*- coding: utf-8 -*-
"""Contrôleur Rapprochement Bancaire AI"""

import logging
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class BankReconciliationController(BaseController):
    """API Rapprochement Bancaire avec AI"""

    @http.route('/api/finance/bank-reconciliation/suggest', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def suggest_reconciliation(self, **params):
        """Suggérer réconciliations avec score ML"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            # Simuler suggestions ML
            suggestions = [
                {
                    'bankLineId': 1,
                    'moveLineId': 10,
                    'score': 95,
                    'reason': 'Montant exact + Date proche + Similarité libellé (95%)',
                },
                {
                    'bankLineId': 2,
                    'moveLineId': 15,
                    'score': 85,
                    'reason': 'Montant exact + Similarité libellé (85%)',
                },
            ]

            return self._success_response({'suggestions': suggestions})

        except Exception as e:
            _logger.error(f"Erreur suggest_reconciliation: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)
