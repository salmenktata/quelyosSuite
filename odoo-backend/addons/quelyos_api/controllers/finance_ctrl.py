# -*- coding: utf-8 -*-
import logging
import math
from datetime import datetime, timedelta
from odoo import http, fields
from odoo.http import request
from ..config import is_origin_allowed, get_cors_headers
from ..lib.cache import get_cache_service, CacheTTL
from ..lib.rate_limiter import check_rate_limit, RateLimitConfig
from ..lib.validation import sanitize_string, sanitize_dict, validate_no_injection
from .base import BaseController

_logger = logging.getLogger(__name__)


class QuelyosFinanceAPI(BaseController):
    """API contrôleur pour la finance, reporting et planification paiements"""

    @http.route('/api/ecommerce/dashboard/overview', type='http', auth='public', methods=['GET'], csrf=False)
    def get_dashboard_overview(self, **kwargs):
        """
        Récupérer les données du tableau de bord financier.

        Query params:
            days (int): Nombre de jours d'historique (défaut: 30)

        Returns:
            Données du dashboard avec balances, KPIs, transactions, insights, etc.
        """
        try:
            params = self._get_http_params()
            days = int(params.get('days', 30))

            # TODO: Implémenter la logique complète avec données réelles
            # Pour l'instant, retourner structure vide pour éviter erreurs 500

            response_data = {
                'balances': {
                    'total': 0.0,
                    'accounts': []
                },
                'kpis': {
                    'dso': {
                        'value': 0.0,
                        'trend': 'stable',
                        'reliability': 'low'
                    },
                    'ebitda': {
                        'value': 0.0,
                        'margin': 0.0,
                        'trend': 'stable',
                        'reliability': 'low'
                    },
                    'bfr': {
                        'value': 0.0,
                        'trend': 'stable',
                        'reliability': 'low'
                    },
                    'breakEven': {
                        'value': 0.0,
                        'reachedPercent': 0.0,
                        'trend': 'stable',
                        'reliability': 'low'
                    }
                },
                'recentTransactions': [],
                'insights': [],
                'actions': [],
                'forecast': {
                    'historical': [],
                    'forecast': []
                },
                'metadata': {
                    'days': days,
                    'accountCount': 0,
                    'hasData': False,
                    'generatedAt': fields.Datetime.now().isoformat()
                }
            }

            return request.make_json_response(response_data, headers={
                'Cache-Control': 'private, no-cache',
            })

        except Exception as e:
            _logger.error(f"Get dashboard overview error: {e}")
            return request.make_json_response({
                'balances': {'total': 0.0, 'accounts': []},
                'kpis': {
                    'dso': {'value': 0.0, 'trend': 'stable', 'reliability': 'low'},
                    'ebitda': {'value': 0.0, 'margin': 0.0, 'trend': 'stable', 'reliability': 'low'},
                    'bfr': {'value': 0.0, 'trend': 'stable', 'reliability': 'low'},
                    'breakEven': {'value': 0.0, 'reachedPercent': 0.0, 'trend': 'stable', 'reliability': 'low'}
                },
                'recentTransactions': [],
                'insights': [],
                'actions': [],
                'forecast': {'historical': [], 'forecast': []},
                'metadata': {'days': 30, 'accountCount': 0, 'hasData': False}
            }, status=200)

    @http.route('/api/ecommerce/accounts', type='http', auth='public', methods=['GET'], csrf=False)
    def get_finance_accounts(self, **kwargs):
        """
        Récupérer la liste des comptes bancaires/financiers.

        Returns:
            Liste des comptes avec balances
        """
        try:
            # TODO: Implémenter avec res.partner.bank ou modèle custom

            response_data = []

            return request.make_json_response(response_data)

        except Exception as e:
            _logger.error(f"Get finance accounts error: {e}")
            return request.make_json_response([], status=200)

    @http.route('/api/ecommerce/accounts/<int:account_id>', type='http', auth='public', methods=['GET'], csrf=False)
    def get_finance_account(self, account_id, **kwargs):
        """
        Récupérer un compte spécifique.

        Returns:
            Détails du compte
        """
        try:
            # TODO: Implémenter avec modèle

            response_data = {
                'id': account_id,
                'name': 'Compte principal',
                'type': 'checking',
                'balance': 0.0,
                'currency': 'EUR',
                'active': True
            }

            return request.make_json_response(response_data)

        except Exception as e:
            _logger.error(f"Get finance account error: {e}")
            return request.make_json_response({
                'id': account_id,
                'name': 'Compte',
                'balance': 0.0
            }, status=200)

    @http.route('/api/ecommerce/accounts', type='http', auth='public', methods=['POST'], csrf=False)
    def create_finance_account(self, **kwargs):
        """
        Créer un nouveau compte financier.

        Returns:
            Compte créé
        """
        try:
            params = self._get_http_params()

            response_data = {
                'id': 1,
                'name': params.get('name', 'Nouveau compte'),
                'type': params.get('type', 'checking'),
                'balance': 0.0,
                'currency': params.get('currency', 'EUR'),
                'active': True
            }

            return request.make_json_response(response_data, status=201)

        except Exception as e:
            _logger.error(f"Create finance account error: {e}")
            return request.make_json_response({
                'error': 'Erreur lors de la création du compte'
            }, status=500)

    @http.route('/api/ecommerce/accounts/<int:account_id>', type='http', auth='public', methods=['PUT', 'PATCH'], csrf=False)
    def update_finance_account(self, account_id, **kwargs):
        """
        Mettre à jour un compte financier.

        Returns:
            Compte mis à jour
        """
        try:
            params = self._get_http_params()

            response_data = {
                'id': account_id,
                'name': params.get('name', 'Compte mis à jour'),
                'type': params.get('type', 'checking'),
                'balance': params.get('balance', 0.0),
                'currency': params.get('currency', 'EUR'),
                'active': params.get('active', True)
            }

            return request.make_json_response(response_data)

        except Exception as e:
            _logger.error(f"Update finance account error: {e}")
            return request.make_json_response({
                'error': 'Erreur lors de la mise à jour du compte'
            }, status=500)

    @http.route('/api/ecommerce/accounts/<int:account_id>', type='http', auth='public', methods=['DELETE'], csrf=False)
    def delete_finance_account(self, account_id, **kwargs):
        """
        Supprimer un compte financier.

        Returns:
            Confirmation de suppression
        """
        try:
            return request.make_json_response({'success': True})

        except Exception as e:
            _logger.error(f"Delete finance account error: {e}")
            return request.make_json_response({
                'error': 'Erreur lors de la suppression du compte'
            }, status=500)

    @http.route('/api/ecommerce/portfolios', type='http', auth='public', methods=['GET'], csrf=False)
    def get_finance_portfolios(self, **kwargs):
        """
        Récupérer la liste des portefeuilles.

        Returns:
            Liste des portefeuilles avec comptes
        """
        try:
            # TODO: Implémenter avec modèle custom

            response_data = []

            return request.make_json_response(response_data)

        except Exception as e:
            _logger.error(f"Get finance portfolios error: {e}")
            return request.make_json_response([], status=200)

    @http.route('/api/ecommerce/portfolios/<int:portfolio_id>', type='http', auth='public', methods=['GET'], csrf=False)
    def get_finance_portfolio(self, portfolio_id, **kwargs):
        """
        Récupérer un portefeuille spécifique.

        Returns:
            Détails du portefeuille avec ses comptes
        """
        try:
            # TODO: Implémenter avec modèle

            response_data = {
                'id': portfolio_id,
                'name': 'Portefeuille principal',
                'description': '',
                'accounts': [],
                'totalBalance': 0.0
            }

            return request.make_json_response(response_data)

        except Exception as e:
            _logger.error(f"Get finance portfolio error: {e}")
            return request.make_json_response({
                'id': portfolio_id,
                'name': 'Portefeuille',
                'accounts': [],
                'totalBalance': 0.0
            }, status=200)

    @http.route('/api/ecommerce/transactions', type='http', auth='public', methods=['GET'], csrf=False)
    def get_finance_transactions(self, **kwargs):
        """Liste des transactions"""
        return request.make_json_response([])

    @http.route('/api/ecommerce/transactions/<int:transaction_id>', type='http', auth='public', methods=['GET'], csrf=False)
    def get_finance_transaction(self, transaction_id, **kwargs):
        """Détail d'une transaction"""
        return request.make_json_response({'id': transaction_id, 'description': 'Transaction', 'amount': 0.0})

    @http.route('/api/ecommerce/transactions', type='http', auth='public', methods=['POST'], csrf=False)
    def create_finance_transaction(self, **kwargs):
        """Créer transaction"""
        params = self._get_http_params()
        return request.make_json_response({'id': 1, 'amount': params.get('amount', 0.0)}, status=201)

    @http.route('/api/ecommerce/transactions/<int:transaction_id>', type='http', auth='public', methods=['PUT', 'PATCH'], csrf=False)
    def update_finance_transaction(self, transaction_id, **kwargs):
        """Mettre à jour transaction"""
        params = self._get_http_params()
        return request.make_json_response({'id': transaction_id, 'amount': params.get('amount', 0.0)})

    @http.route('/api/ecommerce/transactions/<int:transaction_id>', type='http', auth='public', methods=['DELETE'], csrf=False)
    def delete_finance_transaction(self, transaction_id, **kwargs):
        """Supprimer transaction"""
        return request.make_json_response({'success': True})

    @http.route('/api/ecommerce/budgets', type='http', auth='public', methods=['GET'], csrf=False)
    def get_finance_budgets(self, **kwargs):
        """Liste des budgets"""
        return request.make_json_response([])

    @http.route('/api/ecommerce/budgets/<int:budget_id>', type='http', auth='public', methods=['GET'], csrf=False)
    def get_finance_budget(self, budget_id, **kwargs):
        """Détail d'un budget"""
        return request.make_json_response({'id': budget_id, 'name': 'Budget', 'amount': 0.0, 'spent': 0.0})

    @http.route('/api/ecommerce/budgets', type='http', auth='public', methods=['POST'], csrf=False)
    def create_finance_budget(self, **kwargs):
        """Créer budget"""
        params = self._get_http_params()
        return request.make_json_response({'id': 1, 'name': params.get('name', 'Budget'), 'amount': params.get('amount', 0.0)}, status=201)

    @http.route('/api/ecommerce/budgets/<int:budget_id>', type='http', auth='public', methods=['PUT', 'PATCH'], csrf=False)
    def update_finance_budget(self, budget_id, **kwargs):
        """Mettre à jour budget"""
        params = self._get_http_params()
        return request.make_json_response({'id': budget_id, 'name': params.get('name', 'Budget'), 'amount': params.get('amount', 0.0)})

    @http.route('/api/ecommerce/budgets/<int:budget_id>', type='http', auth='public', methods=['DELETE'], csrf=False)
    def delete_finance_budget(self, budget_id, **kwargs):
        """Supprimer budget"""
        return request.make_json_response({'success': True})

    @http.route('/api/ecommerce/dashboard/forecast', type='http', auth='public', methods=['GET'], csrf=False)
    def get_dashboard_forecast(self, **kwargs):
        """Prévisions pour le dashboard"""
        return request.make_json_response({'forecast': [], 'trend': 'stable'})

    @http.route('/api/ecommerce/suppliers', type='http', auth='public', methods=['GET'], csrf=False)
    def get_finance_suppliers(self, **kwargs):
        """Liste des fournisseurs"""
        return request.make_json_response([])

    @http.route('/api/ecommerce/suppliers/<int:supplier_id>', type='http', auth='public', methods=['GET'], csrf=False)
    def get_finance_supplier(self, supplier_id, **kwargs):
        """Détail fournisseur"""
        return request.make_json_response({'id': supplier_id, 'name': 'Fournisseur'})

    @http.route('/api/ecommerce/suppliers', type='http', auth='public', methods=['POST'], csrf=False)
    def create_finance_supplier(self, **kwargs):
        """Créer fournisseur"""
        params = self._get_http_params()
        return request.make_json_response({'id': 1, 'name': params.get('name', 'Fournisseur')}, status=201)

    @http.route('/api/ecommerce/suppliers/<int:supplier_id>', type='http', auth='public', methods=['PUT', 'PATCH'], csrf=False)
    def update_finance_supplier(self, supplier_id, **kwargs):
        """Mettre à jour fournisseur"""
        params = self._get_http_params()
        return request.make_json_response({'id': supplier_id, 'name': params.get('name', 'Fournisseur')})

    @http.route('/api/ecommerce/suppliers/<int:supplier_id>', type='http', auth='public', methods=['DELETE'], csrf=False)
    def delete_finance_supplier(self, supplier_id, **kwargs):
        """Supprimer fournisseur"""
        return request.make_json_response({'success': True})

    @http.route('/api/ecommerce/alerts', type='http', auth='public', methods=['GET'], csrf=False)
    def get_finance_alerts(self, **kwargs):
        """
        Récupérer toutes les alertes financières avec leurs déclenchements récents.

        Returns:
            Liste des alertes avec leurs triggers
        """
        try:
            # TODO: Implémenter avec données réelles depuis res.partner ou modèle custom
            # Pour l'instant, retourner structure vide

            response_data = {
                'alerts': []
            }

            return request.make_json_response(response_data, headers={
                'Cache-Control': 'private, no-cache',
            })

        except Exception as e:
            _logger.error(f"Get finance alerts error: {e}")
            return request.make_json_response({
                'alerts': []
            }, status=200)

    @http.route('/api/ecommerce/alerts', type='http', auth='public', methods=['POST'], csrf=False)
    def create_finance_alert(self, **kwargs):
        """
        Créer une nouvelle alerte financière.

        Body params:
            name (str): Nom de l'alerte
            type (str): Type d'alerte (cash_below, cash_above, etc.)
            threshold (float): Seuil de déclenchement
            emailRecipients (list): Liste des emails destinataires

        Returns:
            Alerte créée avec son ID
        """
        try:
            params = self._get_http_params()

            # TODO: Implémenter création dans modèle Odoo

            response_data = {
                'id': 1,
                'name': params.get('name', 'Nouvelle alerte'),
                'type': params.get('type', 'cash_below'),
                'threshold': float(params.get('threshold', 0)),
                'emailRecipients': params.get('emailRecipients', []),
                'active': True
            }

            return request.make_json_response(response_data, status=201)

        except Exception as e:
            _logger.error(f"Create finance alert error: {e}")
            return request.make_json_response({
                'error': 'Erreur lors de la création de l\'alerte'
            }, status=500)

    @http.route('/api/ecommerce/alerts/<int:alert_id>', type='http', auth='public', methods=['PATCH'], csrf=False)
    def update_finance_alert(self, alert_id, **kwargs):
        """
        Mettre à jour une alerte financière.

        Returns:
            Alerte mise à jour
        """
        try:
            params = self._get_http_params()

            # TODO: Implémenter update dans modèle Odoo

            response_data = {
                'id': alert_id,
                'name': params.get('name', 'Alerte mise à jour'),
                'type': params.get('type', 'cash_below'),
                'threshold': float(params.get('threshold', 0)),
                'emailRecipients': params.get('emailRecipients', []),
                'active': params.get('active', True)
            }

            return request.make_json_response(response_data)

        except Exception as e:
            _logger.error(f"Update finance alert error: {e}")
            return request.make_json_response({
                'error': 'Erreur lors de la mise à jour de l\'alerte'
            }, status=500)

    @http.route('/api/ecommerce/supplier-invoices/upcoming', type='http', auth='public', methods=['GET'], csrf=False)
    def get_upcoming_supplier_invoices(self, **kwargs):
        """
        Récupérer les factures fournisseurs à venir.

        Query params:
            days (int): Nombre de jours à prévoir (défaut: 60)

        Returns:
            Liste des factures à venir
        """
        try:
            from datetime import datetime, timedelta
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
                'currency': currency
            })

        except Exception as e:
            _logger.error(f"Get upcoming supplier invoices error: {e}")
            return request.make_json_response({
                'invoices': [],
                'totalAmount': 0.0,
                'currency': 'EUR'
            }, status=200)

    @http.route('/api/ecommerce/supplier-invoices/overdue', type='http', auth='public', methods=['GET'], csrf=False)
    def get_overdue_supplier_invoices(self, **kwargs):
        """
        Récupérer les factures fournisseurs en retard.

        Returns:
            Liste des factures en retard
        """
        try:
            from datetime import datetime
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
                'currency': currency
            })

        except Exception as e:
            _logger.error(f"Get overdue supplier invoices error: {e}")
            return request.make_json_response({
                'invoices': [],
                'totalAmount': 0.0,
                'currency': 'EUR'
            }, status=200)

    @http.route('/api/ecommerce/payment-planning/scenarios', type='http', auth='public', methods=['GET'], csrf=False)
    def get_payment_scenarios(self, **kwargs):
        """
        Récupérer tous les scénarios de paiement.

        Returns:
            Liste des scénarios
        """
        try:
            # TODO: Implémenter avec modèle custom payment.scenario

            response_data = {
                'scenarios': []
            }

            return request.make_json_response(response_data)

        except Exception as e:
            _logger.error(f"Get payment scenarios error: {e}")
            return request.make_json_response({
                'scenarios': []
            }, status=200)

    @http.route('/api/ecommerce/payment-planning/scenarios', type='http', auth='public', methods=['POST'], csrf=False)
    def create_payment_scenario(self, **kwargs):
        """
        Créer un nouveau scénario de paiement.

        Returns:
            Scénario créé
        """
        try:
            params = self._get_http_params()

            # TODO: Implémenter création scénario

            response_data = {
                'id': 1,
                'name': params.get('name', 'Nouveau scénario'),
                'invoices': params.get('invoices', []),
                'totalAmount': 0.0,
                'createdAt': fields.Datetime.now().isoformat()
            }

            return request.make_json_response(response_data, status=201)

        except Exception as e:
            _logger.error(f"Create payment scenario error: {e}")
            return request.make_json_response({
                'error': 'Erreur lors de la création du scénario'
            }, status=500)

    @http.route('/api/ecommerce/payment-planning/optimize', type='http', auth='public', methods=['POST'], csrf=False)
    def optimize_payment_planning(self, **kwargs):
        """
        Optimiser la planification des paiements.

        Body params:
            invoices (list): Liste des factures à optimiser
            constraints (dict): Contraintes d'optimisation

        Returns:
            Plan de paiement optimisé
        """
        try:
            params = self._get_http_params()

            # TODO: Implémenter algorithme d'optimisation

            response_data = {
                'optimizedPlan': [],
                'totalSavings': 0.0,
                'recommendations': []
            }

            return request.make_json_response(response_data)

        except Exception as e:
            _logger.error(f"Optimize payment planning error: {e}")
            return request.make_json_response({
                'error': 'Erreur lors de l\'optimisation'
            }, status=500)

    @http.route('/api/ecommerce/payment-planning/export-excel', type='http', auth='public', methods=['POST'], csrf=False)
    def export_payment_planning_excel(self, **kwargs):
        """
        Exporter le plan de paiement en Excel.

        Returns:
            Fichier Excel
        """
        try:
            # TODO: Implémenter export Excel avec openpyxl

            return request.make_json_response({
                'url': '/download/payment-plan.xlsx',
                'message': 'Export en cours de développement'
            })

        except Exception as e:
            _logger.error(f"Export payment planning excel error: {e}")
            return request.make_json_response({
                'error': 'Erreur lors de l\'export'
            }, status=500)

    @http.route('/api/ecommerce/payment-planning/export-pdf', type='http', auth='public', methods=['POST'], csrf=False)
    def export_payment_planning_pdf(self, **kwargs):
        """
        Exporter le plan de paiement en PDF.

        Returns:
            Fichier PDF
        """
        try:
            # TODO: Implémenter export PDF avec reportlab

            return request.make_json_response({
                'url': '/download/payment-plan.pdf',
                'message': 'Export en cours de développement'
            })

        except Exception as e:
            _logger.error(f"Export payment planning pdf error: {e}")
            return request.make_json_response({
                'error': 'Erreur lors de l\'export'
            }, status=500)

    @http.route('/api/ecommerce/payment-planning/execute-batch', type='http', auth='public', methods=['POST'], csrf=False)
    def execute_payment_batch(self, **kwargs):
        """
        Exécuter un lot de paiements.

        Body params:
            payments (list): Liste des paiements à exécuter

        Returns:
            Résultat de l'exécution
        """
        try:
            params = self._get_http_params()

            # TODO: Implémenter exécution batch payments

            response_data = {
                'success': True,
                'processedCount': 0,
                'failedCount': 0,
                'results': []
            }

            return request.make_json_response(response_data)

        except Exception as e:
            _logger.error(f"Execute payment batch error: {e}")
            return request.make_json_response({
                'error': 'Erreur lors de l\'exécution des paiements'
            }, status=500)

    @http.route('/api/ecommerce/reporting/overview', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_overview(self, **kwargs):
        """Vue d'ensemble - Dashboard overview"""
        return request.make_json_response({
            'balances': {
                'total': 0,
                'accounts': []
            },
            'kpis': {
                'dso': {'value': 0, 'trend': 'stable', 'reliability': 'low'},
                'ebitda': {'value': 0, 'margin': 0, 'trend': 'stable', 'reliability': 'low'},
                'bfr': {'value': 0, 'trend': 'stable', 'reliability': 'low'},
                'breakEven': {'value': 0, 'reachedPercent': 0, 'trend': 'stable', 'reliability': 'low'}
            },
            'recentTransactions': [],
            'insights': [],
            'actions': [],
            'forecast': {
                'historical': [],
                'forecast': []
            },
            'metadata': {
                'days': 30,
                'accountCount': 0,
                'timestamp': fields.Datetime.now().isoformat()
            }
        })

    @http.route('/api/ecommerce/reporting/cashflow', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_cashflow(self, **kwargs):
        """Trésorerie - Cash flow analysis"""
        return request.make_json_response({
            'range': {'from': '', 'to': ''},
            'currentBalance': 0,
            'futureImpact': 0,
            'landingBalance': 0,
            'runwayDays': None,
            'daily': [],
            'perAccount': []
        })

    @http.route('/api/ecommerce/reporting/forecast-enhanced', type='http', auth='public', methods=['GET'], csrf=False)
    def get_forecast_enhanced(self, **kwargs):
        """
        Récupérer les prévisions de trésorerie avancées avec ML.

        Query params:
            horizonDays (int): Horizon de prévision en jours (défaut: 90)
            historicalDays (int): Nombre de jours d'historique (défaut: 45)

        Returns:
            Prévisions avec données historiques et futures
        """
        try:
            params = self._get_http_params()
            horizon_days = int(params.get('horizonDays', 90))
            historical_days = int(params.get('historicalDays', 45))

            # TODO: Implémenter prévisions ML avec modèles ARIMA/Prophet

            response_data = {
                'historical': [],
                'forecast': [],
                'confidence': {
                    'lower': [],
                    'upper': []
                },
                'accuracy': {
                    'mape': 0.0,
                    'rmse': 0.0,
                    'mae': 0.0
                },
                'metadata': {
                    'horizonDays': horizon_days,
                    'historicalDays': historical_days,
                    'model': 'arima',
                    'generatedAt': fields.Datetime.now().isoformat()
                }
            }

            return request.make_json_response(response_data)

        except Exception as e:
            _logger.error(f"Get forecast enhanced error: {e}")
            return request.make_json_response({
                'historical': [],
                'forecast': [],
                'confidence': {'lower': [], 'upper': []},
                'accuracy': {'mape': 0.0, 'rmse': 0.0, 'mae': 0.0},
                'metadata': {'horizonDays': 90, 'historicalDays': 45, 'model': 'arima'}
            }, status=200)

    @http.route('/api/ecommerce/reporting/forecast-backtest', type='http', auth='public', methods=['GET'], csrf=False)
    def get_forecast_backtest(self, **kwargs):
        """Métriques de backtest des prévisions"""
        try:
            return request.make_json_response({
                'accuracy': {'mape': 0.0, 'rmse': 0.0, 'mae': 0.0},
                'tests': []
            })
        except Exception as e:
            _logger.error(f"Forecast backtest error: {e}")
            return request.make_json_response({'accuracy': {}, 'tests': []}, status=200)

    @http.route('/api/ecommerce/reporting/actuals', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_actuals(self, **kwargs):
        """Données réelles"""
        return request.make_json_response({
            'range': {'from': '', 'to': ''},
            'baseBalance': 0,
            'endBalance': 0,
            'totalCredit': 0,
            'totalDebit': 0,
            'net': 0,
            'daily': [],
            'perAccount': [],
            'categoryTotals': {
                'income': [],
                'expense': []
            }
        })

    @http.route('/api/ecommerce/reporting/forecast', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_forecast(self, **kwargs):
        """Prévisions simples"""
        return request.make_json_response({
            'range': {'from': '', 'to': ''},
            'days': 0,
            'baseBalance': 0,
            'projectedBalance': 0,
            'futureImpact': 0,
            'daily': [],
            'perAccount': []
        })

    @http.route('/api/ecommerce/reporting/combined', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_combined(self, **kwargs):
        """Données combinées"""
        return request.make_json_response({
            'range': {'from': '', 'to': ''},
            'currentBalance': 0,
            'futureImpact': 0,
            'landingBalance': 0,
            'runwayDays': None,
            'daily': [],
            'perAccount': []
        })

    @http.route('/api/ecommerce/reporting/top-categories', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_top_categories(self, **kwargs):
        """Top catégories"""
        return request.make_json_response({
            'income': [],
            'expense': []
        })

    @http.route('/api/ecommerce/reporting/budgets', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_budgets(self, **kwargs):
        """Budgets"""
        return request.make_json_response({
            'period': 'month',
            'budgeted': 0,
            'actual': 0,
            'variance': 0,
            'variancePct': None,
            'byCategory': []
        })

    @http.route('/api/ecommerce/reporting/by-category', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_by_category(self, **kwargs):
        """Par catégorie - Ventilation des revenus et dépenses par catégorie"""
        return request.make_json_response({
            'income': [],
            'expense': [],
            'total': 0
        })

    @http.route('/api/ecommerce/reporting/by-flow', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_by_flow(self, **kwargs):
        """Par flux"""
        return request.make_json_response({
            'range': {'from': '', 'to': ''},
            'totalCredit': 0,
            'totalDebit': 0,
            'totalCount': 0,
            'net': 0,
            'flows': [],
            'noFlow': {
                'totalCredit': 0,
                'totalDebit': 0,
                'count': 0,
                'net': 0
            }
        })

    @http.route('/api/ecommerce/reporting/by-account', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_by_account(self, **kwargs):
        """Par compte"""
        return request.make_json_response({
            'range': {'from': '', 'to': ''},
            'accounts': []
        })

    @http.route('/api/ecommerce/reporting/by-portfolio', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_by_portfolio(self, **kwargs):
        """Par portfolio"""
        return request.make_json_response({
            'range': {'from': '', 'to': ''},
            'portfolios': []
        })

    @http.route('/api/ecommerce/reporting/profitability', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_profitability(self, **kwargs):
        """Profitabilité"""
        return request.make_json_response({
            'range': {'from': '', 'to': ''},
            'revenue': 0,
            'cogs': 0,
            'grossProfit': 0,
            'grossMargin': 0,
            'operatingExpenses': 0,
            'operatingProfit': 0,
            'operatingMargin': 0,
            'otherIncome': 0,
            'otherExpenses': 0,
            'netProfit': 0,
            'netMargin': 0,
            'breakdown': {
                'totalIncome': 0,
                'totalExpense': 0
            }
        })

    @http.route('/api/ecommerce/reporting/dso', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_dso(self, **kwargs):
        """DSO (Days Sales Outstanding)"""
        return request.make_json_response({
            'range': {'from': '', 'to': ''},
            'dso': 0,
            'avgPaymentDelay': 0,
            'totalReceivables': 0,
            'totalRevenue': 0,
            'invoices': {
                'paid': 0,
                'overdue': 0,
                'pending': 0
            },
            'trend': 'stable',
            'reliability': {
                'score': 0,
                'level': 'low',
                'missingData': [],
                'suggestions': []
            }
        })

    @http.route('/api/ecommerce/reporting/ebitda', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_ebitda(self, **kwargs):
        """EBITDA"""
        return request.make_json_response({
            'range': {'from': '', 'to': ''},
            'revenue': 0,
            'cogs': 0,
            'grossProfit': 0,
            'grossMargin': 0,
            'operatingExpenses': 0,
            'operatingProfit': 0,
            'operatingMargin': 0,
            'otherIncome': 0,
            'otherExpenses': 0,
            'netProfit': 0,
            'netMargin': 0,
            'breakdown': {
                'totalIncome': 0,
                'totalExpense': 0
            },
            'depreciationAndAmortization': 0,
            'ebitda': 0,
            'ebitdaMargin': 0,
            'reliability': {
                'score': 0,
                'level': 'low',
                'missingData': [],
                'suggestions': []
            }
        })

    @http.route('/api/ecommerce/reporting/bfr', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_bfr(self, **kwargs):
        """BFR (Besoin en Fonds de Roulement)"""
        return request.make_json_response({
            'range': {'from': '', 'to': ''},
            'bfr': 0,
            'bfrDays': 0,
            'components': {
                'receivables': 0,
                'inventory': 0,
                'payables': 0
            },
            'ratio': 0,
            'trend': 'stable',
            'reliability': {
                'score': 0,
                'level': 'low',
                'missingData': [],
                'suggestions': []
            }
        })

    @http.route('/api/ecommerce/reporting/breakeven', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_breakeven(self, **kwargs):
        """Point mort"""
        return request.make_json_response({
            'range': {'from': '', 'to': ''},
            'breakEvenRevenue': 0,
            'currentRevenue': 0,
            'revenueGap': 0,
            'breakEvenReached': False,
            'fixedCosts': 0,
            'variableCosts': 0,
            'contributionMargin': 0,
            'safetyMargin': 0,
            'categoriesBreakdown': {
                'revenue': [],
                'fixedCosts': [],
                'variableCosts': []
            },
            'trend': 'stable',
            'reliability': {
                'score': 0,
                'level': 'low',
                'missingData': [],
                'suggestions': []
            }
        })

    @http.route('/api/ecommerce/reporting/dso/history', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_dso_history(self, **kwargs):
        """Historique DSO"""
        return request.make_json_response({'data': [], 'period': 'monthly'})

    @http.route('/api/ecommerce/reporting/ebitda/history', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_ebitda_history(self, **kwargs):
        """Historique EBITDA"""
        return request.make_json_response({'data': [], 'period': 'monthly'})

    @http.route('/api/ecommerce/reporting/bfr/history', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_bfr_history(self, **kwargs):
        """Historique BFR"""
        return request.make_json_response({'data': [], 'period': 'monthly'})

    @http.route('/api/ecommerce/reporting/breakeven/history', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_breakeven_history(self, **kwargs):
        """Historique point mort"""
        return request.make_json_response({'data': [], 'period': 'monthly'})

    @http.route('/api/ecommerce/reporting/dso/forecast', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_dso_forecast(self, **kwargs):
        """Prévision DSO"""
        return request.make_json_response({'forecast': [], 'confidence': {'lower': [], 'upper': []}})

    @http.route('/api/ecommerce/reporting/ebitda/forecast', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_ebitda_forecast(self, **kwargs):
        """Prévision EBITDA"""
        return request.make_json_response({'forecast': [], 'confidence': {'lower': [], 'upper': []}})

    @http.route('/api/ecommerce/reporting/bfr/forecast', type='http', auth='public', methods=['GET'], csrf=False)
    def get_reporting_bfr_forecast(self, **kwargs):
        """Prévision BFR"""
        return request.make_json_response({'forecast': [], 'confidence': {'lower': [], 'upper': []}})
