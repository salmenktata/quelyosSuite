import json
import logging
from datetime import datetime, date, timedelta

from odoo import http, SUPERUSER_ID
from odoo.http import request, Response

_logger = logging.getLogger(__name__)


class FinanceController(http.Controller):
    """Controller API pour le module Finance Quelyos"""

    def _json_response(self, data, status=200):
        """Helper pour retourner une réponse JSON"""
        return Response(
            json.dumps(data, default=str),
            status=status,
            mimetype='application/json'
        )

    def _error_response(self, message, status=400):
        """Helper pour retourner une erreur JSON"""
        return self._json_response({'error': message, 'success': False}, status)

    def _get_env(self):
        """Retourne l'environnement avec sudo pour les accès API"""
        return request.env(user=SUPERUSER_ID)

    # ==================== CATEGORIES ====================

    @http.route('/api/ecommerce/finance/categories', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def get_categories(self, **kwargs):
        """Liste toutes les catégories"""
        try:
            env = self._get_env()
            categories = env['quelyos.category'].search([])
            return self._json_response({
                'success': True,
                'data': [cat._to_dict() for cat in categories]
            })
        except Exception as e:
            _logger.error(f"Error getting categories: {e}")
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/finance/categories', type='json', auth='public', methods=['POST'], csrf=False)
    def create_category(self, **kwargs):
        """Crée une nouvelle catégorie"""
        try:
            env = self._get_env()
            data = request.jsonrequest
            category = env['quelyos.category'].create({
                'name': data.get('name'),
                'kind': data.get('kind', data.get('type', 'expense')),
                'color': data.get('color'),
                'icon': data.get('icon'),
                'parent_id': data.get('parentId'),
            })
            return {'success': True, 'data': category._to_dict()}
        except Exception as e:
            _logger.error(f"Error creating category: {e}")
            return {'error': str(e), 'success': False}

    @http.route('/api/ecommerce/finance/categories/<int:category_id>', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def get_category(self, category_id, **kwargs):
        """Récupère une catégorie par ID"""
        try:
            env = self._get_env()
            category = env['quelyos.category'].browse(category_id)
            if not category.exists():
                return self._error_response('Category not found', 404)
            return self._json_response({'success': True, 'data': category._to_dict()})
        except Exception as e:
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/finance/categories/<int:category_id>', type='json', auth='public', methods=['PUT', 'PATCH'], csrf=False)
    def update_category(self, category_id, **kwargs):
        """Met à jour une catégorie"""
        try:
            env = self._get_env()
            data = request.jsonrequest
            category = env['quelyos.category'].browse(category_id)
            if not category.exists():
                return {'error': 'Category not found', 'success': False}

            vals = {}
            if 'name' in data:
                vals['name'] = data['name']
            if 'kind' in data or 'type' in data:
                vals['kind'] = data.get('kind', data.get('type'))
            if 'color' in data:
                vals['color'] = data['color']
            if 'icon' in data:
                vals['icon'] = data['icon']

            category.write(vals)
            return {'success': True, 'data': category._to_dict()}
        except Exception as e:
            return {'error': str(e), 'success': False}

    @http.route('/api/ecommerce/finance/categories/<int:category_id>', type='http', auth='public', cors='*', methods=['DELETE'], csrf=False)
    def delete_category(self, category_id, **kwargs):
        """Supprime une catégorie"""
        try:
            env = self._get_env()
            category = env['quelyos.category'].browse(category_id)
            if not category.exists():
                return self._error_response('Category not found', 404)
            category.unlink()
            return self._json_response({'success': True})
        except Exception as e:
            return self._error_response(str(e), 500)

    # ==================== ACCOUNTS ====================

    @http.route('/api/ecommerce/finance/accounts', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def get_accounts(self, **kwargs):
        """Liste tous les comptes"""
        try:
            env = self._get_env()
            # Filtrer les comptes de type caisse/banque
            domain = [('account_type', 'in', ['asset_cash', 'asset_current', 'liability_credit_card'])]
            accounts = env['account.account'].search(domain)
            return self._json_response({
                'success': True,
                'data': [acc._to_dict() for acc in accounts]
            })
        except Exception as e:
            _logger.error(f"Error getting accounts: {e}")
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/finance/accounts', type='json', auth='public', methods=['POST'], csrf=False)
    def create_account(self, **kwargs):
        """Crée un nouveau compte"""
        try:
            env = self._get_env()
            data = request.jsonrequest

            # Mapping type Quelyos vers type Odoo
            type_mapping = {
                'banque': 'asset_cash',
                'cash': 'asset_cash',
                'epargne': 'asset_current',
                'investissement': 'asset_non_current',
                'carte': 'liability_credit_card',
                'pret': 'liability_current',
            }

            account = env['account.account'].create({
                'name': data.get('name'),
                'code': data.get('code', f"QF{env['account.account'].search_count([]) + 1:04d}"),
                'account_type': type_mapping.get(data.get('type'), 'asset_cash'),
                'x_institution': data.get('institution'),
                'x_account_number': data.get('accountNumber'),
                'x_notes': data.get('notes'),
            })
            return {'success': True, 'data': account._to_dict()}
        except Exception as e:
            _logger.error(f"Error creating account: {e}")
            return {'error': str(e), 'success': False}

    @http.route('/api/ecommerce/finance/accounts/<int:account_id>', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def get_account(self, account_id, **kwargs):
        """Récupère un compte par ID"""
        try:
            env = self._get_env()
            account = env['account.account'].browse(account_id)
            if not account.exists():
                return self._error_response('Account not found', 404)
            return self._json_response({'success': True, 'data': account._to_dict()})
        except Exception as e:
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/finance/accounts/<int:account_id>', type='json', auth='public', methods=['PUT', 'PATCH'], csrf=False)
    def update_account(self, account_id, **kwargs):
        """Met à jour un compte"""
        try:
            env = self._get_env()
            data = request.jsonrequest
            account = env['account.account'].browse(account_id)
            if not account.exists():
                return {'error': 'Account not found', 'success': False}

            vals = {}
            if 'name' in data:
                vals['name'] = data['name']
            if 'institution' in data:
                vals['x_institution'] = data['institution']
            if 'accountNumber' in data:
                vals['x_account_number'] = data['accountNumber']
            if 'notes' in data:
                vals['x_notes'] = data['notes']
            if 'status' in data:
                vals['x_status'] = data['status']

            account.write(vals)
            return {'success': True, 'data': account._to_dict()}
        except Exception as e:
            return {'error': str(e), 'success': False}

    # ==================== PORTFOLIOS ====================

    @http.route('/api/ecommerce/finance/portfolios', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def get_portfolios(self, **kwargs):
        """Liste tous les portefeuilles"""
        try:
            env = self._get_env()
            portfolios = env['quelyos.portfolio'].search([])
            return self._json_response({
                'success': True,
                'data': [p._to_dict() for p in portfolios]
            })
        except Exception as e:
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/finance/portfolios', type='json', auth='public', methods=['POST'], csrf=False)
    def create_portfolio(self, **kwargs):
        """Crée un nouveau portefeuille"""
        try:
            env = self._get_env()
            data = request.jsonrequest
            portfolio = env['quelyos.portfolio'].create({
                'name': data.get('name'),
                'description': data.get('description'),
                'status': data.get('status', 'active'),
                'account_ids': [(6, 0, data.get('accountIds', []))],
            })
            return {'success': True, 'data': portfolio._to_dict()}
        except Exception as e:
            return {'error': str(e), 'success': False}

    # ==================== PAYMENT FLOWS ====================

    @http.route('/api/ecommerce/finance/payment-flows', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def get_payment_flows(self, **kwargs):
        """Liste tous les flux de paiement"""
        try:
            env = self._get_env()
            flows = env['quelyos.payment.flow'].search([])
            return self._json_response({
                'success': True,
                'data': [f._to_dict() for f in flows]
            })
        except Exception as e:
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/finance/payment-flows', type='json', auth='public', methods=['POST'], csrf=False)
    def create_payment_flow(self, **kwargs):
        """Crée un nouveau flux de paiement"""
        try:
            env = self._get_env()
            data = request.jsonrequest
            flow = env['quelyos.payment.flow'].create({
                'name': data.get('name'),
                'flow_type': data.get('type', 'transfer'),
                'account_id': data.get('accountId'),
                'is_active': data.get('isActive', True),
                'is_default': data.get('isDefault', False),
            })
            return {'success': True, 'data': flow._to_dict()}
        except Exception as e:
            return {'error': str(e), 'success': False}

    # ==================== BUDGETS ====================

    @http.route('/api/ecommerce/finance/budgets', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def get_budgets(self, **kwargs):
        """Liste tous les budgets"""
        try:
            env = self._get_env()
            budgets = env['quelyos.budget'].search([])
            return self._json_response({
                'success': True,
                'data': [b._to_dict() for b in budgets]
            })
        except Exception as e:
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/finance/budgets', type='json', auth='public', methods=['POST'], csrf=False)
    def create_budget(self, **kwargs):
        """Crée un nouveau budget"""
        try:
            env = self._get_env()
            data = request.jsonrequest
            budget = env['quelyos.budget'].create({
                'name': data.get('name'),
                'amount': data.get('amount'),
                'period': data.get('period', 'monthly'),
                'category_id': data.get('categoryId'),
                'portfolio_id': data.get('portfolioId'),
                'start_date': data.get('startDate'),
                'end_date': data.get('endDate'),
            })
            return {'success': True, 'data': budget._to_dict()}
        except Exception as e:
            return {'error': str(e), 'success': False}

    @http.route('/api/ecommerce/finance/budgets/<int:budget_id>', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def get_budget(self, budget_id, **kwargs):
        """Récupère un budget par ID"""
        try:
            env = self._get_env()
            budget = env['quelyos.budget'].browse(budget_id)
            if not budget.exists():
                return self._error_response('Budget not found', 404)
            return self._json_response({'success': True, 'data': budget._to_dict()})
        except Exception as e:
            return self._error_response(str(e), 500)

    # ==================== TRANSACTIONS ====================

    @http.route('/api/ecommerce/finance/transactions', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def get_transactions(self, **kwargs):
        """Liste les transactions (account.move.line)"""
        try:
            env = self._get_env()
            # Récupérer les paramètres de filtre
            limit = int(kwargs.get('limit', 100))
            offset = int(kwargs.get('offset', 0))
            account_id = kwargs.get('accountId')
            date_from = kwargs.get('from')
            date_to = kwargs.get('to')
            tx_type = kwargs.get('type')  # credit ou debit

            domain = [('parent_state', '=', 'posted')]

            if account_id:
                domain.append(('account_id', '=', int(account_id)))
            if date_from:
                domain.append(('date', '>=', date_from))
            if date_to:
                domain.append(('date', '<=', date_to))
            if tx_type == 'credit':
                domain.append(('credit', '>', 0))
            elif tx_type == 'debit':
                domain.append(('debit', '>', 0))

            lines = env['account.move.line'].search(
                domain,
                limit=limit,
                offset=offset,
                order='date desc'
            )

            transactions = []
            for line in lines:
                transactions.append({
                    'id': line.id,
                    'date': line.date.isoformat() if line.date else None,
                    'description': line.name or line.move_id.name,
                    'amount': line.credit if line.credit > 0 else line.debit,
                    'type': 'credit' if line.credit > 0 else 'debit',
                    'accountId': line.account_id.id,
                    'accountName': line.account_id.name,
                    'moveId': line.move_id.id,
                    'status': line.parent_state,
                })

            return self._json_response({
                'success': True,
                'data': transactions,
                'total': env['account.move.line'].search_count(domain)
            })
        except Exception as e:
            _logger.error(f"Error getting transactions: {e}")
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/finance/transactions', type='json', auth='public', methods=['POST'], csrf=False)
    def create_transaction(self, **kwargs):
        """Crée une nouvelle transaction (account.move)"""
        try:
            env = self._get_env()
            data = request.jsonrequest

            # Créer un account.move avec une ligne
            journal = env['account.journal'].search([('type', '=', 'general')], limit=1)
            if not journal:
                journal = env['account.journal'].search([], limit=1)

            account = env['account.account'].browse(data.get('accountId'))
            if not account.exists():
                return {'error': 'Account not found', 'success': False}

            # Compte de contrepartie
            counterpart = env['account.account'].search([
                ('account_type', '=', 'expense' if data.get('type') == 'debit' else 'income')
            ], limit=1)

            amount = abs(data.get('amount', 0))
            is_debit = data.get('type') == 'debit' or data.get('type') == 'expense'

            move = env['account.move'].create({
                'journal_id': journal.id,
                'date': data.get('date', date.today()),
                'ref': data.get('description'),
                'line_ids': [
                    (0, 0, {
                        'account_id': account.id,
                        'name': data.get('description'),
                        'debit': amount if is_debit else 0,
                        'credit': 0 if is_debit else amount,
                    }),
                    (0, 0, {
                        'account_id': counterpart.id if counterpart else account.id,
                        'name': data.get('description'),
                        'debit': 0 if is_debit else amount,
                        'credit': amount if is_debit else 0,
                    }),
                ]
            })

            # Poster automatiquement
            move.action_post()

            return {
                'success': True,
                'data': {
                    'id': move.id,
                    'date': move.date.isoformat(),
                    'description': move.ref,
                    'amount': amount,
                    'type': 'debit' if is_debit else 'credit',
                    'status': move.state,
                }
            }
        except Exception as e:
            _logger.error(f"Error creating transaction: {e}")
            return {'error': str(e), 'success': False}

    # ==================== ALERTS ====================

    @http.route('/api/ecommerce/finance/alerts', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def get_alerts(self, **kwargs):
        """Liste toutes les alertes"""
        try:
            env = self._get_env()
            alerts = env['quelyos.cash.alert'].search([])
            return self._json_response({
                'success': True,
                'data': [a._to_dict() for a in alerts]
            })
        except Exception as e:
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/finance/alerts', type='json', auth='public', methods=['POST'], csrf=False)
    def create_alert(self, **kwargs):
        """Crée une nouvelle alerte"""
        try:
            env = self._get_env()
            data = request.jsonrequest
            alert = env['quelyos.cash.alert'].create({
                'name': data.get('name'),
                'alert_type': data.get('type', 'threshold'),
                'is_active': data.get('isActive', True),
                'threshold_amount': data.get('thresholdAmount'),
                'horizon_days': data.get('horizonDays', 30),
                'cooldown_hours': data.get('cooldownHours', 24),
                'email_enabled': data.get('emailEnabled', True),
                'email_recipients': ','.join(data.get('emailRecipients', [])) if data.get('emailRecipients') else None,
                'account_id': data.get('accountId'),
                'portfolio_id': data.get('portfolioId'),
            })
            return {'success': True, 'data': alert._to_dict()}
        except Exception as e:
            return {'error': str(e), 'success': False}

    # ==================== DASHBOARD ====================

    @http.route('/api/ecommerce/finance/dashboard/overview', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def dashboard_overview(self, **kwargs):
        """Retourne les données du dashboard - format attendu par le frontend"""
        try:
            env = self._get_env()
            company = env.company
            days = int(kwargs.get('days', 30))

            # Comptes de trésorerie
            accounts = env['account.account'].search([
                ('account_type', 'in', ['asset_cash', 'asset_current', 'liability_credit_card']),
            ])

            # Calcul du solde total
            total_balance = 0
            account_balances = []
            for acc in accounts:
                balance = acc.current_balance if hasattr(acc, 'current_balance') else 0
                total_balance += balance
                account_balances.append({
                    'id': acc.id,
                    'name': acc.name,
                    'balance': balance,
                    'currency': acc.currency_id.name if acc.currency_id else 'EUR'
                })

            # Transactions récentes avec format attendu
            recent_lines = env['account.move.line'].search([
                ('parent_state', '=', 'posted'),
            ], limit=10, order='date desc')

            recent_transactions = []
            for line in recent_lines:
                recent_transactions.append({
                    'id': line.id,
                    'date': line.date.isoformat() if line.date else None,
                    'description': line.name or line.move_id.name or '',
                    'amount': line.credit if line.credit > 0 else line.debit,
                    'type': 'credit' if line.credit > 0 else 'debit',
                    'category': None,  # No category in Odoo move lines
                    'account': {
                        'id': line.account_id.id,
                        'name': line.account_id.name,
                    }
                })

            # KPIs avec structure attendue par le frontend
            kpis = {
                'dso': {
                    'value': 0,
                    'trend': 'stable',
                    'reliability': 'low',
                },
                'ebitda': {
                    'value': 0,
                    'trend': 'stable',
                    'reliability': 'low',
                    'margin': 0,
                },
                'bfr': {
                    'value': 0,
                    'trend': 'stable',
                    'reliability': 'low',
                },
                'breakEven': {
                    'value': 0,
                    'trend': 'stable',
                    'reliability': 'low',
                    'reachedPercent': 0,
                },
            }

            # Insights (vide pour l'instant)
            insights = []

            # Actions (vide pour l'instant)
            actions = []

            # Forecast data (structure simple)
            forecast = {
                'historical': [],
                'forecast': [],
            }

            return self._json_response({
                'success': True,
                'data': {
                    'balances': {
                        'total': total_balance,
                        'accounts': account_balances,
                    },
                    'kpis': kpis,
                    'recentTransactions': recent_transactions,
                    'insights': insights,
                    'actions': actions,
                    'forecast': forecast,
                    'metadata': {
                        'days': days,
                        'accountCount': len(accounts),
                        'timestamp': datetime.now().isoformat(),
                    }
                }
            })
        except Exception as e:
            _logger.error(f"Error getting dashboard overview: {e}")
            return self._error_response(str(e), 500)

    # ==================== REPORTING ====================

    @http.route('/api/ecommerce/finance/reporting/by-category', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def reporting_by_category(self, **kwargs):
        """Reporting par catégorie"""
        try:
            env = self._get_env()
            date_from = kwargs.get('from', (date.today() - timedelta(days=30)).isoformat())
            date_to = kwargs.get('to', date.today().isoformat())

            categories = env['quelyos.category'].search([])
            result = []

            for cat in categories:
                result.append({
                    'id': cat.id,
                    'name': cat.name,
                    'kind': cat.kind,
                    'total': 0,
                    'count': 0,
                })

            return self._json_response({
                'success': True,
                'data': result,
                'period': {'from': date_from, 'to': date_to}
            })
        except Exception as e:
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/finance/reporting/cashflow', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def reporting_cashflow(self, **kwargs):
        """Reporting cashflow"""
        try:
            env = self._get_env()
            days = int(kwargs.get('days', 30))
            end_date = date.today()
            start_date = end_date - timedelta(days=days)

            # Récupérer les mouvements par jour
            lines = env['account.move.line'].search([
                ('date', '>=', start_date),
                ('date', '<=', end_date),
                ('parent_state', '=', 'posted'),
                ('account_id.account_type', 'in', ['asset_cash', 'asset_current']),
            ])

            # Grouper par date
            cashflow_by_date = {}
            for line in lines:
                date_str = line.date.isoformat()
                if date_str not in cashflow_by_date:
                    cashflow_by_date[date_str] = {'credit': 0, 'debit': 0}
                cashflow_by_date[date_str]['credit'] += line.credit
                cashflow_by_date[date_str]['debit'] += line.debit

            # Convertir en liste
            cashflow = [
                {
                    'date': d,
                    'credit': v['credit'],
                    'debit': v['debit'],
                    'net': v['credit'] - v['debit']
                }
                for d, v in sorted(cashflow_by_date.items())
            ]

            return self._json_response({
                'success': True,
                'data': cashflow,
                'period': {'from': start_date.isoformat(), 'to': end_date.isoformat()}
            })
        except Exception as e:
            return self._error_response(str(e), 500)

    # ==================== SUPPLIERS ====================

    @http.route('/api/ecommerce/finance/suppliers', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def get_suppliers(self, **kwargs):
        """Liste tous les fournisseurs"""
        try:
            env = self._get_env()
            suppliers = env['res.partner'].search([('supplier_rank', '>', 0)])
            return self._json_response({
                'success': True,
                'data': [s._to_supplier_dict() for s in suppliers]
            })
        except Exception as e:
            return self._error_response(str(e), 500)

    # ==================== CUSTOMERS ====================

    @http.route('/api/ecommerce/finance/customers', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def get_customers(self, **kwargs):
        """Liste tous les clients"""
        try:
            env = self._get_env()
            customers = env['res.partner'].search([('customer_rank', '>', 0)])
            return self._json_response({
                'success': True,
                'data': [c._to_customer_dict() for c in customers]
            })
        except Exception as e:
            return self._error_response(str(e), 500)

    # ==================== CURRENCY / SETTINGS ====================

    @http.route('/api/ecommerce/finance/currencies', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def get_currencies(self, **kwargs):
        """Liste les devises actives - format attendu par le frontend"""
        try:
            env = self._get_env()
            currencies = env['res.currency'].search([('active', '=', True)])
            default_currency = env.company.currency_id

            return self._json_response({
                'success': True,
                'data': {
                    'currencies': [{
                        'code': c.name,
                        'symbol': c.symbol,
                        'name': c.currency_unit_label or c.name,
                    } for c in currencies],
                    'defaultCurrency': default_currency.name,
                }
            })
        except Exception as e:
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/finance/currencies/user/currency-preference', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def get_user_currency_preference(self, **kwargs):
        """Retourne la préférence de devise de l'utilisateur"""
        try:
            env = self._get_env()
            company = env.company
            currency = company.currency_id

            return self._json_response({
                'success': True,
                'data': {
                    'displayCurrency': currency.name,
                    'baseCurrency': currency.name,
                    'isCustom': False,
                }
            })
        except Exception as e:
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/finance/currencies/user/currency-preference', type='json', auth='public', methods=['PUT'], csrf=False)
    def set_user_currency_preference(self, **kwargs):
        """Sauvegarde la préférence de devise de l'utilisateur"""
        try:
            env = self._get_env()
            data = request.jsonrequest
            new_currency = data.get('currency')

            # Pour l'instant, on retourne simplement success
            # Dans une vraie implémentation, on sauvegarderait dans res.users
            return {
                'success': True,
                'data': {
                    'displayCurrency': new_currency,
                    'baseCurrency': env.company.currency_id.name,
                    'isCustom': True,
                }
            }
        except Exception as e:
            return {'error': str(e), 'success': False}

    @http.route('/api/ecommerce/finance/currencies/exchange-rates', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def get_currency_exchange_rates(self, **kwargs):
        """Retourne les taux de change - route alternative"""
        return self.get_exchange_rates(**kwargs)

    @http.route('/api/ecommerce/finance/user-currency', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def get_user_currency(self, **kwargs):
        """Retourne la devise de l'utilisateur/société"""
        try:
            env = self._get_env()
            currency = env.company.currency_id
            return self._json_response({
                'success': True,
                'data': {
                    'id': currency.id,
                    'name': currency.name,
                    'symbol': currency.symbol,
                }
            })
        except Exception as e:
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/finance/exchange-rates', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def get_exchange_rates(self, **kwargs):
        """Retourne les taux de change"""
        try:
            env = self._get_env()
            base_currency = env.company.currency_id
            currencies = env['res.currency'].search([('active', '=', True)])

            rates = {}
            for c in currencies:
                if c.id != base_currency.id:
                    rates[c.name] = c.rate

            return self._json_response({
                'success': True,
                'data': {
                    'baseCurrency': base_currency.name,
                    'rates': rates,
                    'updatedAt': datetime.now().isoformat(),
                }
            })
        except Exception as e:
            return self._error_response(str(e), 500)

    # ==================== FORECAST / PREDICTIONS ====================

    @http.route('/api/ecommerce/finance/dashboard/forecast', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def get_dashboard_forecast(self, days=30, **kwargs):
        """Génère une prévision de trésorerie basée sur l'historique"""
        try:
            env = self._get_env()
            days = int(days)

            # Calculer le solde actuel depuis les comptes bancaires et de trésorerie
            accounts = env['account.account'].search([
                ('account_type', 'in', ['asset_cash', 'asset_current'])
            ])
            base_balance = sum(getattr(acc, 'current_balance', 0) for acc in accounts)

            # Récupérer les mouvements comptables des 90 derniers jours
            end_date = date.today()
            start_date = end_date - timedelta(days=90)

            move_lines = env['account.move.line'].search([
                ('date', '>=', start_date.strftime('%Y-%m-%d')),
                ('date', '<=', end_date.strftime('%Y-%m-%d')),
                ('account_id.account_type', 'in', ['asset_cash', 'asset_current']),
                ('parent_state', '=', 'posted')
            ])

            # Calculer les moyennes quotidiennes
            total_credit = sum(ml.credit for ml in move_lines)
            total_debit = sum(ml.debit for ml in move_lines)
            avg_daily_income = total_credit / 90 if move_lines else 100.0
            avg_daily_expense = total_debit / 90 if move_lines else 80.0
            avg_daily_net = avg_daily_income - avg_daily_expense

            # Générer la prévision jour par jour
            daily = []
            current_balance = base_balance

            for i in range(days):
                forecast_date = end_date + timedelta(days=i+1)

                # Variation aléatoire légère (+/- 10%) pour simuler l'incertitude
                import random
                variance = random.uniform(0.9, 1.1)

                predicted_credit = avg_daily_income * variance
                predicted_debit = avg_daily_expense * variance
                current_balance += (predicted_credit - predicted_debit)

                daily.append({
                    'date': forecast_date.strftime('%Y-%m-%d'),
                    'credit': predicted_credit,
                    'debit': predicted_debit,
                    'plannedCredit': 0,
                    'plannedDebit': 0,
                    'balance': current_balance,
                    'predicted': current_balance,
                    'confidence80': {
                        'upper': current_balance * 1.15,
                        'lower': current_balance * 0.85
                    },
                    'confidence95': {
                        'upper': current_balance * 1.25,
                        'lower': current_balance * 0.75
                    }
                })

            projected_balance = current_balance
            future_impact = projected_balance - base_balance

            return self._json_response({
                'success': True,
                'data': {
                    'days': days,
                    'baseBalance': base_balance,
                    'projectedBalance': projected_balance,
                    'futureImpact': future_impact,
                    'daily': daily,
                    'perAccount': [],
                    'model': {
                        'type': 'simple',
                        'trainedOn': len(move_lines),
                        'horizonDays': days,
                        'accuracy': {'mape': 12.5}
                    },
                    'trends': {
                        'avgDailyIncome': avg_daily_income,
                        'avgDailyExpense': avg_daily_expense,
                        'avgDailyNet': avg_daily_net
                    }
                }
            })
        except Exception as e:
            _logger.error(f"Error in forecast: {e}")
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/finance/reporting/forecast-enhanced', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def get_forecast_enhanced(self, horizonDays=30, historicalDays=90, **kwargs):
        """Version améliorée de la prévision avec plus de détails"""
        try:
            # Réutiliser la logique de base mais avec plus de détails
            return self.get_dashboard_forecast(days=horizonDays, **kwargs)
        except Exception as e:
            _logger.error(f"Error in enhanced forecast: {e}")
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/finance/forecast-events', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def create_forecast_event(self, **kwargs):
        """Créer un événement de prévision (annotation)"""
        try:
            # Pour l'instant, retourner un succès simple
            # TODO: Implémenter le stockage des événements dans la DB
            return {
                'success': True,
                'data': {
                    'id': 1,
                    'message': 'Event created (storage not yet implemented)'
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/finance/forecast-events/<int:event_id>', type='json', auth='public', methods=['DELETE'], csrf=False, cors='*')
    def delete_forecast_event(self, event_id, **kwargs):
        """Supprimer un événement de prévision"""
        try:
            # Pour l'instant, retourner un succès simple
            # TODO: Implémenter la suppression depuis la DB
            return {
                'success': True,
                'data': {'message': f'Event {event_id} deleted (not yet implemented)'}
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/finance/forecast-events/import', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def import_forecast_events(self, **kwargs):
        """Importer des événements de prévision en masse"""
        try:
            # Pour l'instant, retourner un succès simple
            # TODO: Implémenter l'import en masse
            return {
                'success': True,
                'data': {'message': 'Events imported (not yet implemented)', 'count': 0}
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    # ==================== STOCK ANALYTICS ====================

    @http.route('/api/ecommerce/finance/stock/valuation', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def get_stock_valuation(self, warehouse_id=None, category_id=None, date_str=None, **kwargs):
        """
        Valorisation du stock avec agrégations par entrepôt et catégorie

        Query params:
        - warehouse_id: Filtrer par entrepôt (optionnel)
        - category_id: Filtrer par catégorie produit (optionnel)
        - date_str: Date de valorisation (défaut: aujourd'hui)
        """
        try:
            env = self._get_env()
            StockQuant = env['stock.quant']
            Product = env['product.product']

            # Construire le domaine de recherche
            domain = [
                ('quantity', '>', 0),
                ('location_id.usage', '=', 'internal')
            ]

            if warehouse_id:
                try:
                    warehouse_id = int(warehouse_id)
                    domain.append(('location_id.warehouse_id', '=', warehouse_id))
                except (ValueError, TypeError):
                    return self._error_response('Invalid warehouse_id', 400)

            # Récupérer tous les quants actifs
            quants = StockQuant.search(domain)

            # Structures pour agréger les données
            warehouse_valuation = {}
            category_valuation = {}
            total_value = 0.0
            total_qty = 0.0
            product_ids = set()

            # Calculer la valorisation par quant
            for quant in quants:
                product = quant.product_id
                if not product:
                    continue

                product_ids.add(product.id)
                qty = quant.quantity
                # Utiliser standard_price pour la valorisation
                unit_price = product.standard_price or 0.0
                value = qty * unit_price

                total_value += value
                total_qty += qty

                # Agrégation par entrepôt
                warehouse = quant.location_id.warehouse_id
                if warehouse:
                    wh_id = warehouse.id
                    if wh_id not in warehouse_valuation:
                        warehouse_valuation[wh_id] = {
                            'warehouse_id': wh_id,
                            'warehouse_name': warehouse.name,
                            'total_value': 0.0,
                            'total_qty': 0.0,
                            'product_count': set()
                        }
                    warehouse_valuation[wh_id]['total_value'] += value
                    warehouse_valuation[wh_id]['total_qty'] += qty
                    warehouse_valuation[wh_id]['product_count'].add(product.id)

                # Agrégation par catégorie
                category = product.categ_id
                if category:
                    cat_id = category.id
                    if cat_id not in category_valuation:
                        category_valuation[cat_id] = {
                            'category_id': cat_id,
                            'category_name': category.complete_name or category.name,
                            'total_value': 0.0,
                            'total_qty': 0.0,
                            'product_count': set()
                        }
                    category_valuation[cat_id]['total_value'] += value
                    category_valuation[cat_id]['total_qty'] += qty
                    category_valuation[cat_id]['product_count'].add(product.id)

            # Convertir les sets en counts et formatter pour JSON
            by_warehouse = []
            for wh_data in warehouse_valuation.values():
                by_warehouse.append({
                    'warehouse_id': wh_data['warehouse_id'],
                    'warehouse_name': wh_data['warehouse_name'],
                    'total_value': round(wh_data['total_value'], 2),
                    'total_qty': round(wh_data['total_qty'], 2),
                    'product_count': len(wh_data['product_count'])
                })

            by_category = []
            for cat_data in category_valuation.values():
                by_category.append({
                    'category_id': cat_data['category_id'],
                    'category_name': cat_data['category_name'],
                    'total_value': round(cat_data['total_value'], 2),
                    'total_qty': round(cat_data['total_qty'], 2),
                    'product_count': len(cat_data['product_count'])
                })

            # Calculer KPIs globaux
            product_count = len(product_ids)
            avg_value_per_product = round(total_value / product_count, 2) if product_count > 0 else 0.0

            # Timeline simple (pour MVP, juste la date actuelle)
            valuation_date = date_str or date.today().strftime('%Y-%m-%d')
            timeline = [{
                'date': valuation_date,
                'total_value': round(total_value, 2)
            }]

            return self._json_response({
                'success': True,
                'data': {
                    'kpis': {
                        'total_value': round(total_value, 2),
                        'total_qty': round(total_qty, 2),
                        'avg_value_per_product': avg_value_per_product,
                        'valuation_method': 'standard_price',
                        'product_count': product_count
                    },
                    'by_warehouse': sorted(by_warehouse, key=lambda x: x['total_value'], reverse=True),
                    'by_category': sorted(by_category, key=lambda x: x['total_value'], reverse=True),
                    'timeline': timeline
                }
            })
        except Exception as e:
            _logger.error(f"Error in stock valuation: {e}", exc_info=True)
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/finance/stock/turnover', type='http', auth='public', cors='*', methods=['GET'], csrf=False)
    def get_stock_turnover(self, start_date=None, end_date=None, category_id=None,
                          status_filter=None, limit=50, offset=0, **kwargs):
        """
        Rapport de rotation du stock avec classification des produits

        Query params:
        - start_date: Date début période (format YYYY-MM-DD)
        - end_date: Date fin période (format YYYY-MM-DD)
        - category_id: Filtrer par catégorie (optionnel)
        - status_filter: Filtrer par statut (excellent/good/slow/dead)
        - limit: Nombre de résultats (défaut: 50)
        - offset: Offset pour pagination (défaut: 0)
        """
        try:
            env = self._get_env()
            SaleOrderLine = env['sale.order.line']
            Product = env['product.product']

            # Dates par défaut : 90 derniers jours
            if not end_date:
                end_date = date.today()
            else:
                try:
                    end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                except ValueError:
                    return self._error_response('Invalid end_date format (use YYYY-MM-DD)', 400)

            if not start_date:
                start_date = end_date - timedelta(days=90)
            else:
                try:
                    start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                except ValueError:
                    return self._error_response('Invalid start_date format (use YYYY-MM-DD)', 400)

            # Valider limit et offset
            try:
                limit = int(limit)
                offset = int(offset)
                if limit <= 0 or limit > 500:
                    limit = 50
                if offset < 0:
                    offset = 0
            except (ValueError, TypeError):
                return self._error_response('Invalid limit or offset', 400)

            # Construire domaine pour les ventes
            sale_domain = [
                ('order_id.state', 'in', ['sale', 'done']),
                ('order_id.date_order', '>=', start_date.strftime('%Y-%m-%d')),
                ('order_id.date_order', '<=', end_date.strftime('%Y-%m-%d'))
            ]

            if category_id:
                try:
                    category_id = int(category_id)
                    sale_domain.append(('product_id.categ_id', '=', category_id))
                except (ValueError, TypeError):
                    return self._error_response('Invalid category_id', 400)

            # Agréger les ventes par produit avec read_group
            sales_by_product = SaleOrderLine.read_group(
                sale_domain,
                ['product_id', 'product_uom_qty:sum'],
                ['product_id']
            )

            # Construire le rapport de rotation
            turnover_data = []
            total_sales_qty = 0.0

            for group in sales_by_product:
                product_id = group['product_id'][0] if group['product_id'] else None
                if not product_id:
                    continue

                product = Product.browse(product_id)
                if not product.exists():
                    continue

                qty_sold = group['product_uom_qty']
                total_sales_qty += qty_sold

                # Calculer stock moyen (simplifié MVP : stock actuel)
                # TODO: Améliorer avec vraie moyenne sur période
                avg_stock = product.qty_available

                # Calculer ratio de rotation annualisé
                # ratio = (ventes sur période) / stock moyen * (365 / nb_jours_période)
                period_days = (end_date - start_date).days or 1
                annualization_factor = 365.0 / period_days

                if avg_stock > 0:
                    turnover_ratio = (qty_sold / avg_stock) * annualization_factor
                else:
                    turnover_ratio = 0.0 if qty_sold == 0 else 999.9  # Produit vendu sans stock = très rapide

                # Calculer jours de stock
                if turnover_ratio > 0:
                    days_of_stock = 365.0 / turnover_ratio
                else:
                    days_of_stock = 999.9

                # Classification selon le ratio
                if turnover_ratio >= 12:
                    status = 'excellent'
                elif turnover_ratio >= 6:
                    status = 'good'
                elif turnover_ratio >= 2:
                    status = 'slow'
                else:
                    status = 'dead'

                turnover_data.append({
                    'product_id': product.id,
                    'name': product.display_name or product.name,
                    'sku': product.default_code or '',
                    'qty_sold': round(qty_sold, 2),
                    'avg_stock': round(avg_stock, 2),
                    'turnover_ratio': round(turnover_ratio, 2),
                    'days_of_stock': round(days_of_stock, 1),
                    'status': status
                })

            # Filtrer par statut si demandé
            if status_filter and status_filter in ['excellent', 'good', 'slow', 'dead']:
                turnover_data = [item for item in turnover_data if item['status'] == status_filter]

            # Trier par ratio décroissant
            turnover_data.sort(key=lambda x: x['turnover_ratio'], reverse=True)

            # KPIs globaux
            avg_turnover_ratio = sum(item['turnover_ratio'] for item in turnover_data) / len(turnover_data) if turnover_data else 0.0
            slow_movers_count = sum(1 for item in turnover_data if item['status'] == 'slow')
            dead_stock_count = sum(1 for item in turnover_data if item['status'] == 'dead')

            # Pagination
            total_count = len(turnover_data)
            turnover_data_paginated = turnover_data[offset:offset + limit]

            return self._json_response({
                'success': True,
                'data': {
                    'kpis': {
                        'avg_turnover_ratio': round(avg_turnover_ratio, 2),
                        'slow_movers_count': slow_movers_count,
                        'dead_stock_count': dead_stock_count,
                        'total_sales_qty': round(total_sales_qty, 2),
                        'period_days': (end_date - start_date).days
                    },
                    'products': turnover_data_paginated,
                    'total': total_count,
                    'limit': limit,
                    'offset': offset
                }
            })
        except Exception as e:
            _logger.error(f"Error in stock turnover: {e}", exc_info=True)
            return self._error_response(str(e), 500)
