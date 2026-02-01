# -*- coding: utf-8 -*-
"""Contrôleur Plan Comptable (Chart of Accounts)"""

import logging
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class ChartOfAccountsController(BaseController):
    """API Plan Comptable"""

    @http.route('/api/finance/accounts', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_accounts(self, **params):
        """Liste des comptes comptables"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            # Récupérer tous les comptes (account.account)
            Account = request.env['account.account'].sudo()
            accounts = Account.search([], limit=100, order='code')

            data = {
                'accounts': [self._serialize_account(acc) for acc in accounts],
                'total': len(accounts),
            }

            return self._success_response(data)

        except Exception as e:
            _logger.error(f"Erreur get_accounts: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/accounts/create', type='json', auth='user', methods=['POST', 'OPTIONS'], csrf=False)
    def create_account(self, **params):
        """Créer compte comptable"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            data = request.jsonrequest

            vals = {
                'code': data.get('code'),
                'name': data.get('name'),
                'account_type': data.get('accountType', 'asset_current'),
            }

            Account = request.env['account.account'].sudo()
            account = Account.create(vals)

            return self._success_response(self._serialize_account(account))

        except Exception as e:
            _logger.error(f"Erreur create_account: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    def _serialize_account(self, account):
        """Convertir en format frontend"""
        return {
            'id': account.id,
            'code': account.code,
            'name': account.name,
            'accountType': account.account_type,
            'balance': float(account.current_balance) if hasattr(account, 'current_balance') else 0.0,
        }
