# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
from .base import BaseController

class QuelyFinanceApi(BaseController):
    """Finance & Accounting API Controller"""

    @http.route('/api/finance/categories', type='http', auth='user', methods=['GET'], csrf=False, cors='*')
    def get_finance_categories(self):
        """Get financial account categories (INCOME/EXPENSE)"""
        try:
            error = self._check_auth()
            if error:
                return request.make_json_response(error)

            AccountAccount = request.env['account.account'].sudo()

            # Récupérer les comptes de type produit et charge
            # Type 'income' = revenus (INCOME)
            # Type 'expense' = charges (EXPENSE)
            accounts = AccountAccount.search([
                ('account_type', 'in', ['income', 'income_other', 'expense', 'expense_depreciation', 'expense_direct_cost'])
            ], order='code,name')

            categories = []
            for acc in accounts:
                # Mapper les types Odoo vers INCOME/EXPENSE
                if acc.account_type in ['income', 'income_other']:
                    kind = 'INCOME'
                else:
                    kind = 'EXPENSE'

                categories.append({
                    'id': acc.id,
                    'name': f"[{acc.code}] {acc.name}" if acc.code else acc.name,
                    'companyId': acc.company_id.id if acc.company_id else 0,
                    'kind': kind
                })

            return request.make_json_response({
                'success': True,
                'data': categories
            })
        except Exception as e:
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, status=500)

    @http.route('/api/finance/categories', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_finance_category(self):
        """Create a new financial account category"""
        try:
            error = self._check_auth()
            if error:
                return error

            params = self._get_params()
            name = params.get('name')
            kind = params.get('kind', 'EXPENSE')  # INCOME ou EXPENSE

            if not name:
                return {
                    'success': False,
                    'error': 'Name is required'
                }

            # Mapper INCOME/EXPENSE vers les types Odoo
            if kind == 'INCOME':
                account_type = 'income'
            else:
                account_type = 'expense'

            AccountAccount = request.env['account.account'].sudo()

            # Générer un code automatique basé sur le dernier code
            last_account = AccountAccount.search([
                ('account_type', '=', account_type)
            ], order='code desc', limit=1)

            if last_account and last_account.code:
                try:
                    last_code = int(last_account.code)
                    new_code = str(last_code + 1)
                except:
                    # Si le code n'est pas numérique, générer un code par défaut
                    new_code = '600000' if kind == 'EXPENSE' else '700000'
            else:
                new_code = '600000' if kind == 'EXPENSE' else '700000'

            # Créer le compte
            account = AccountAccount.create({
                'name': name,
                'code': new_code,
                'account_type': account_type,
                'reconcile': False,
            })

            return {
                'success': True,
                'data': {
                    'id': account.id,
                    'name': f"[{account.code}] {account.name}",
                    'companyId': account.company_id.id if account.company_id else 0,
                    'kind': kind
                }
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
