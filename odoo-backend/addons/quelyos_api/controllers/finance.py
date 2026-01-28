# -*- coding: utf-8 -*-
from datetime import datetime, timedelta
from odoo import http
from odoo.http import request
from .base import BaseController

import logging
_logger = logging.getLogger(__name__)

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

    @http.route('/api/finance/categories', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
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

    # ===================================================================
    # FACTURES FOURNISSEURS - Utilisation account.move natif
    # ===================================================================

    @http.route('/api/finance/supplier-invoices', type='http', auth='user', methods=['GET'], csrf=False, cors='*')
    def get_supplier_invoices(self, **kwargs):
        """Liste des factures fournisseurs (account.move in_invoice/in_refund)"""
        try:
            error = self._check_auth()
            if error:
                return request.make_json_response(error)

            params = self._get_http_params()
            limit = int(params.get('limit', 50))
            offset = int(params.get('offset', 0))
            state = params.get('state')  # draft, posted, cancel
            payment_state = params.get('payment_state')  # not_paid, partial, paid

            domain = [('move_type', 'in', ['in_invoice', 'in_refund'])]
            if state:
                domain.append(('state', '=', state))
            if payment_state:
                domain.append(('payment_state', '=', payment_state))

            AccountMove = request.env['account.move'].sudo()
            invoices = AccountMove.search(domain, limit=limit, offset=offset, order='invoice_date desc, id desc')
            total = AccountMove.search_count(domain)

            data = []
            for inv in invoices:
                data.append({
                    'id': inv.id,
                    'name': inv.name or '',
                    'reference': inv.ref or '',
                    'supplierId': inv.partner_id.id if inv.partner_id else None,
                    'supplierName': inv.partner_id.name if inv.partner_id else '',
                    'invoiceDate': inv.invoice_date.isoformat() if inv.invoice_date else None,
                    'dueDate': inv.invoice_date_due.isoformat() if inv.invoice_date_due else None,
                    'amountUntaxed': inv.amount_untaxed,
                    'amountTax': inv.amount_tax,
                    'amountTotal': inv.amount_total,
                    'amountResidual': inv.amount_residual,
                    'currency': inv.currency_id.name if inv.currency_id else 'EUR',
                    'state': inv.state,
                    'paymentState': inv.payment_state,
                    'moveType': 'invoice' if inv.move_type == 'in_invoice' else 'refund',
                })

            return request.make_json_response({
                'success': True,
                'data': data,
                'total': total,
                'limit': limit,
                'offset': offset
            })
        except Exception as e:
            _logger.error(f"Get supplier invoices error: {e}")
            return request.make_json_response({'success': False, 'error': str(e)}, status=500)

    @http.route('/api/finance/supplier-invoices/upcoming', type='http', auth='user', methods=['GET'], csrf=False, cors='*')
    def get_upcoming_supplier_invoices(self, **kwargs):
        """Factures fournisseurs à échéance dans les X prochains jours"""
        try:
            error = self._check_auth()
            if error:
                return request.make_json_response(error)

            params = self._get_http_params()
            days = int(params.get('days', 60))

            today = datetime.now().date()
            future_date = today + timedelta(days=days)

            domain = [
                ('move_type', 'in', ['in_invoice', 'in_refund']),
                ('state', '=', 'posted'),
                ('payment_state', 'in', ['not_paid', 'partial']),
                ('invoice_date_due', '>=', today),
                ('invoice_date_due', '<=', future_date),
            ]

            AccountMove = request.env['account.move'].sudo()
            invoices = AccountMove.search(domain, order='invoice_date_due asc')

            data = []
            total_amount = 0.0
            currency = 'EUR'

            for inv in invoices:
                total_amount += inv.amount_residual
                currency = inv.currency_id.name if inv.currency_id else 'EUR'
                data.append({
                    'id': inv.id,
                    'name': inv.name or '',
                    'supplierName': inv.partner_id.name if inv.partner_id else '',
                    'dueDate': inv.invoice_date_due.isoformat() if inv.invoice_date_due else None,
                    'amountResidual': inv.amount_residual,
                    'daysUntilDue': (inv.invoice_date_due - today).days if inv.invoice_date_due else 0,
                })

            return request.make_json_response({
                'invoices': data,
                'totalAmount': total_amount,
                'currency': currency,
                'count': len(data)
            })
        except Exception as e:
            _logger.error(f"Get upcoming supplier invoices error: {e}")
            return request.make_json_response({'invoices': [], 'totalAmount': 0.0, 'currency': 'EUR'})

    @http.route('/api/finance/supplier-invoices/overdue', type='http', auth='user', methods=['GET'], csrf=False, cors='*')
    def get_overdue_supplier_invoices(self, **kwargs):
        """Factures fournisseurs en retard de paiement"""
        try:
            error = self._check_auth()
            if error:
                return request.make_json_response(error)

            today = datetime.now().date()

            domain = [
                ('move_type', 'in', ['in_invoice', 'in_refund']),
                ('state', '=', 'posted'),
                ('payment_state', 'in', ['not_paid', 'partial']),
                ('invoice_date_due', '<', today),
            ]

            AccountMove = request.env['account.move'].sudo()
            invoices = AccountMove.search(domain, order='invoice_date_due asc')

            data = []
            total_amount = 0.0
            currency = 'EUR'

            for inv in invoices:
                total_amount += inv.amount_residual
                currency = inv.currency_id.name if inv.currency_id else 'EUR'
                days_overdue = (today - inv.invoice_date_due).days if inv.invoice_date_due else 0
                data.append({
                    'id': inv.id,
                    'name': inv.name or '',
                    'supplierName': inv.partner_id.name if inv.partner_id else '',
                    'dueDate': inv.invoice_date_due.isoformat() if inv.invoice_date_due else None,
                    'amountResidual': inv.amount_residual,
                    'daysOverdue': days_overdue,
                    'urgency': 'critical' if days_overdue > 30 else 'warning' if days_overdue > 7 else 'low',
                })

            return request.make_json_response({
                'invoices': data,
                'totalAmount': total_amount,
                'currency': currency,
                'count': len(data)
            })
        except Exception as e:
            _logger.error(f"Get overdue supplier invoices error: {e}")
            return request.make_json_response({'invoices': [], 'totalAmount': 0.0, 'currency': 'EUR'})

    # ===================================================================
    # TAXES - Utilisation account.tax natif
    # ===================================================================

    @http.route('/api/finance/taxes', type='http', auth='user', methods=['GET'], csrf=False, cors='*')
    def get_taxes(self, **kwargs):
        """Liste des taxes (vente et achat)"""
        try:
            error = self._check_auth()
            if error:
                return request.make_json_response(error)

            params = self._get_http_params()
            tax_type = params.get('type')  # sale, purchase, none

            domain = [('active', '=', True)]
            if tax_type:
                domain.append(('type_tax_use', '=', tax_type))

            AccountTax = request.env['account.tax'].sudo()
            taxes = AccountTax.search(domain, order='sequence, name')

            data = []
            for tax in taxes:
                data.append({
                    'id': tax.id,
                    'name': tax.name,
                    'amount': tax.amount,
                    'amountType': tax.amount_type,  # percent, fixed, group
                    'typeUse': tax.type_tax_use,  # sale, purchase, none
                    'description': tax.description or '',
                    'priceInclude': tax.price_include,
                    'includeBaseAmount': tax.include_base_amount,
                })

            return request.make_json_response({'success': True, 'data': data})
        except Exception as e:
            _logger.error(f"Get taxes error: {e}")
            return request.make_json_response({'success': False, 'error': str(e)}, status=500)

    @http.route('/api/finance/taxes/purchase', type='http', auth='user', methods=['GET'], csrf=False, cors='*')
    def get_purchase_taxes(self, **kwargs):
        """Liste des taxes d'achat uniquement"""
        try:
            error = self._check_auth()
            if error:
                return request.make_json_response(error)

            AccountTax = request.env['account.tax'].sudo()
            taxes = AccountTax.search([
                ('type_tax_use', '=', 'purchase'),
                ('active', '=', True)
            ], order='sequence, name')

            data = [{
                'id': tax.id,
                'name': tax.name,
                'amount': tax.amount,
                'amountType': tax.amount_type,
            } for tax in taxes]

            return request.make_json_response({'success': True, 'data': data})
        except Exception as e:
            _logger.error(f"Get purchase taxes error: {e}")
            return request.make_json_response({'success': False, 'error': str(e)}, status=500)

    # ===================================================================
    # JOURNAUX COMPTABLES - Utilisation account.journal natif
    # ===================================================================

    @http.route('/api/finance/journals', type='http', auth='user', methods=['GET'], csrf=False, cors='*')
    def get_journals(self, **kwargs):
        """Liste des journaux comptables"""
        try:
            error = self._check_auth()
            if error:
                return request.make_json_response(error)

            params = self._get_http_params()
            journal_type = params.get('type')  # sale, purchase, cash, bank, general

            domain = []
            if journal_type:
                domain.append(('type', '=', journal_type))

            AccountJournal = request.env['account.journal'].sudo()
            journals = AccountJournal.search(domain, order='sequence, name')

            data = []
            for journal in journals:
                data.append({
                    'id': journal.id,
                    'name': journal.name,
                    'code': journal.code,
                    'type': journal.type,
                    'currencyId': journal.currency_id.id if journal.currency_id else None,
                    'currencyName': journal.currency_id.name if journal.currency_id else None,
                    'defaultAccountId': journal.default_account_id.id if journal.default_account_id else None,
                    'active': journal.active,
                })

            return request.make_json_response({'success': True, 'data': data})
        except Exception as e:
            _logger.error(f"Get journals error: {e}")
            return request.make_json_response({'success': False, 'error': str(e)}, status=500)

    # ===================================================================
    # BUDGETS - Utilisation account.budget natif (si module installé)
    # ===================================================================

    @http.route('/api/finance/budgets', type='http', auth='user', methods=['GET'], csrf=False, cors='*')
    def get_budgets(self, **kwargs):
        """Liste des budgets (nécessite module account_budget)"""
        try:
            error = self._check_auth()
            if error:
                return request.make_json_response(error)

            # Vérifier si le module account_budget est installé
            if 'crossovered.budget' not in request.env:
                return request.make_json_response({
                    'success': False,
                    'error': 'Module account_budget not installed',
                    'data': []
                })

            params = self._get_http_params()
            state = params.get('state')  # draft, confirm, validate, done, cancel

            domain = []
            if state:
                domain.append(('state', '=', state))

            Budget = request.env['crossovered.budget'].sudo()
            budgets = Budget.search(domain, order='date_from desc')

            data = []
            for budget in budgets:
                lines = []
                for line in budget.crossovered_budget_line:
                    lines.append({
                        'id': line.id,
                        'analyticAccountId': line.analytic_account_id.id if line.analytic_account_id else None,
                        'analyticAccountName': line.analytic_account_id.name if line.analytic_account_id else '',
                        'plannedAmount': line.planned_amount,
                        'practicalAmount': line.practical_amount,
                        'theoreticalAmount': line.theoritical_amount,
                        'percentage': line.percentage,
                    })

                data.append({
                    'id': budget.id,
                    'name': budget.name,
                    'dateFrom': budget.date_from.isoformat() if budget.date_from else None,
                    'dateTo': budget.date_to.isoformat() if budget.date_to else None,
                    'state': budget.state,
                    'companyId': budget.company_id.id if budget.company_id else None,
                    'lines': lines,
                })

            return request.make_json_response({'success': True, 'data': data})
        except Exception as e:
            _logger.error(f"Get budgets error: {e}")
            return request.make_json_response({'success': False, 'error': str(e)}, status=500)

    @http.route('/api/finance/budgets', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_budget(self):
        """Créer un nouveau budget"""
        try:
            error = self._check_auth()
            if error:
                return error

            if 'crossovered.budget' not in request.env:
                return {'success': False, 'error': 'Module account_budget not installed'}

            params = self._get_params()
            name = params.get('name')
            date_from = params.get('dateFrom')
            date_to = params.get('dateTo')

            if not name or not date_from or not date_to:
                return {'success': False, 'error': 'name, dateFrom and dateTo are required'}

            Budget = request.env['crossovered.budget'].sudo()
            budget = Budget.create({
                'name': name,
                'date_from': date_from,
                'date_to': date_to,
            })

            return {
                'success': True,
                'data': {
                    'id': budget.id,
                    'name': budget.name,
                    'state': budget.state,
                }
            }
        except Exception as e:
            _logger.error(f"Create budget error: {e}")
            return {'success': False, 'error': str(e)}
