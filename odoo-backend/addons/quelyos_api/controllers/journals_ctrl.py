# -*- coding: utf-8 -*-
"""Contrôleur Journaux Comptables"""

import logging
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class JournalsController(BaseController):
    """API Journaux Comptables"""

    @http.route('/api/finance/journals', type='json', auth='public', methods=['GET', 'OPTIONS'], cors='*', csrf=False)
    def get_journals(self, **params):
        """Liste des journaux comptables"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            Journal = request.env['account.journal'].sudo()
            journals = Journal.search([], limit=50)

            data = {
                'journals': [self._serialize_journal(j) for j in journals],
                'total': len(journals),
            }

            return self._success_response(data)

        except Exception as e:
            _logger.error(f"Erreur get_journals: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    def _serialize_journal(self, journal):
        return {
            'id': journal.id,
            'name': journal.name,
            'code': journal.code,
            'type': journal.type,
        }
