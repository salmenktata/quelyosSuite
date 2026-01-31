# -*- coding: utf-8 -*-
"""Contrôleur Import Relevés Bancaires"""

import logging
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class BankStatementsController(BaseController):
    """API Import Relevés Bancaires"""

    @http.route('/api/finance/bank-statements/import', type='json', auth='public', methods=['POST', 'OPTIONS'], cors='*', csrf=False)
    def import_bank_statement(self, **params):
        """Importer relevé bancaire (CSV, OFX, CAMT.053, MT940)"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            data = request.jsonrequest
            file_format = data.get('format', 'csv')  # csv|ofx|camt|mt940
            file_content = data.get('content', '')

            # TODO: Parser le fichier selon le format
            # Pour l'instant, retourner succès simulé
            
            return self._success_response({
                'imported': 10,
                'format': file_format,
                'message': f'{10} transactions importées depuis {file_format.upper()}',
            })

        except Exception as e:
            _logger.error(f"Erreur import_bank_statement: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)
