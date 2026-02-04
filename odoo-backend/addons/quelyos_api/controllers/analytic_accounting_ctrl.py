# -*- coding: utf-8 -*-
import json
import logging
from datetime import datetime
from dateutil.relativedelta import relativedelta
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class AnalyticAccountingController(http.Controller):
    """
    Contrôleur Comptabilité Analytique Avancée
    Gestion centres de coûts, axes analytiques, ventilation, rapports
    """

    def _authenticate_from_header(self):
        """Authentification depuis header Authorization"""
        auth_header = request.httprequest.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header[7:]
        AuthToken = request.env['quelyos.auth_token'].sudo()
        auth_record = AuthToken.search([('token', '=', token), ('expires_at', '>', datetime.now())], limit=1)

        if auth_record and auth_record.user_id:
            return auth_record.user_id
        return None

    def _get_tenant_id(self, user):
        """Récupérer tenant_id de l'utilisateur"""
        if user and user.tenant_id:
            return user.tenant_id.id
        return None

    def _success_response(self, data, message=None):
        """Format réponse succès standardisé"""
        return json.dumps({'success': True, 'data': data, 'message': message})

    def _error_response(self, error, code="ERROR", status=400):
        """Format réponse erreur standardisé"""
        response = json.dumps({'success': False, 'error': error, 'code': code})
        return request.make_response(response, status=status, headers=[('Content-Type', 'application/json')])

    @http.route('/api/finance/analytic/accounts', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_analytic_accounts(self, **params):
        """Liste comptes analytiques (centres de coûts, projets, départements)"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            AnalyticAccount = request.env['account.analytic.account'].sudo()

            # Filtres
            plan_id = params.get('planId')  # Plan analytique (axes)
            active_only = params.get('activeOnly', True)

            domain = [('tenant_id', '=', tenant_id)]
            if plan_id:
                domain.append(('plan_id', '=', int(plan_id)))
            if active_only:
                domain.append(('active', '=', True))

            accounts = AnalyticAccount.search(domain, order='name')

            results = []
            for account in accounts:
                # Calculer totaux (lignes analytiques liées)
                lines = request.env['account.analytic.line'].sudo().search([
                    ('account_id', '=', account.id),
                    ('tenant_id', '=', tenant_id),
                ])

                total_debit = sum(line.amount if line.amount > 0 else 0 for line in lines)
                total_credit = sum(abs(line.amount) if line.amount < 0 else 0 for line in lines)
                balance = total_debit - total_credit

                results.append({
                    'id': account.id,
                    'name': account.name,
                    'code': account.code or '',
                    'plan': {
                        'id': account.plan_id.id if account.plan_id else None,
                        'name': account.plan_id.name if account.plan_id else None,
                    },
                    'group': {
                        'id': account.group_id.id if account.group_id else None,
                        'name': account.group_id.name if account.group_id else None,
                    },
                    'partner': {
                        'id': account.partner_id.id if account.partner_id else None,
                        'name': account.partner_id.name if account.partner_id else None,
                    },
                    'balance': float(balance),
                    'debit': float(total_debit),
                    'credit': float(total_credit),
                    'active': account.active,
                })

            return self._success_response({'accounts': results, 'total': len(results)})

        except Exception as e:
            _logger.error(f"Erreur get_analytic_accounts: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/analytic/accounts/create', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def create_analytic_account(self, **params):
        """Créer compte analytique (centre de coût, projet, etc.)"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            data = request.jsonrequest

            # Données requises
            name = data.get('name')
            code = data.get('code', '')
            plan_id = data.get('planId')

            if not name:
                return self._error_response("Nom requis", "VALIDATION_ERROR", 400)

            AnalyticAccount = request.env['account.analytic.account'].sudo()

            vals = {
                'name': name,
                'code': code,
                'tenant_id': tenant_id,
            }

            if plan_id:
                vals['plan_id'] = int(plan_id)

            # Optionnel : groupe, partenaire
            if data.get('groupId'):
                vals['group_id'] = int(data['groupId'])
            if data.get('partnerId'):
                vals['partner_id'] = int(data['partnerId'])

            account = AnalyticAccount.create(vals)

            return self._success_response({
                'account': {
                    'id': account.id,
                    'name': account.name,
                    'code': account.code,
                }
            }, message="Compte analytique créé")

        except Exception as e:
            _logger.error(f"Erreur create_analytic_account: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/analytic/lines', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_analytic_lines(self, **params):
        """Lignes analytiques (écritures ventilées par centre de coût)"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            AnalyticLine = request.env['account.analytic.line'].sudo()

            # Filtres
            account_id = params.get('accountId')  # Compte analytique
            date_from = params.get('dateFrom')
            date_to = params.get('dateTo')
            limit = int(params.get('limit', 100))

            domain = [('tenant_id', '=', tenant_id)]

            if account_id:
                domain.append(('account_id', '=', int(account_id)))
            if date_from:
                domain.append(('date', '>=', date_from))
            if date_to:
                domain.append(('date', '<=', date_to))

            lines = AnalyticLine.search(domain, order='date desc', limit=limit)

            results = []
            for line in lines:
                results.append({
                    'id': line.id,
                    'date': str(line.date),
                    'name': line.name,
                    'account': {
                        'id': line.account_id.id,
                        'name': line.account_id.name,
                        'code': line.account_id.code,
                    },
                    'generalAccount': {
                        'id': line.general_account_id.id if line.general_account_id else None,
                        'name': line.general_account_id.name if line.general_account_id else None,
                        'code': line.general_account_id.code if line.general_account_id else None,
                    },
                    'partner': {
                        'id': line.partner_id.id if line.partner_id else None,
                        'name': line.partner_id.name if line.partner_id else None,
                    },
                    'amount': float(line.amount),
                    'unitAmount': float(line.unit_amount) if line.unit_amount else 0.0,
                    'currency': line.currency_id.name if line.currency_id else 'EUR',
                    'move': {
                        'id': line.move_line_id.move_id.id if line.move_line_id and line.move_line_id.move_id else None,
                        'name': line.move_line_id.move_id.name if line.move_line_id and line.move_line_id.move_id else None,
                    },
                })

            return self._success_response({'lines': results, 'total': len(results)})

        except Exception as e:
            _logger.error(f"Erreur get_analytic_lines: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/analytic/reports/by-account', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_analytic_report_by_account(self, **params):
        """Rapport analytique agrégé par compte (totaux débit/crédit/solde)"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            AnalyticLine = request.env['account.analytic.line'].sudo()
            AnalyticAccount = request.env['account.analytic.account'].sudo()

            # Filtres période
            date_from = params.get('dateFrom')
            date_to = params.get('dateTo')

            domain = [('tenant_id', '=', tenant_id)]
            if date_from:
                domain.append(('date', '>=', date_from))
            if date_to:
                domain.append(('date', '<=', date_to))

            lines = AnalyticLine.search(domain)

            # Agréger par compte analytique
            aggregated = {}
            for line in lines:
                account_id = line.account_id.id
                if account_id not in aggregated:
                    aggregated[account_id] = {
                        'accountId': account_id,
                        'accountName': line.account_id.name,
                        'accountCode': line.account_id.code or '',
                        'debit': 0.0,
                        'credit': 0.0,
                        'balance': 0.0,
                        'count': 0,
                    }

                amount = float(line.amount)
                if amount > 0:
                    aggregated[account_id]['debit'] += amount
                else:
                    aggregated[account_id]['credit'] += abs(amount)

                aggregated[account_id]['balance'] += amount
                aggregated[account_id]['count'] += 1

            results = list(aggregated.values())
            results.sort(key=lambda x: abs(x['balance']), reverse=True)

            return self._success_response({
                'report': results,
                'totalDebit': sum(r['debit'] for r in results),
                'totalCredit': sum(r['credit'] for r in results),
                'totalBalance': sum(r['balance'] for r in results),
            })

        except Exception as e:
            _logger.error(f"Erreur get_analytic_report_by_account: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/analytic/distribution', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def create_analytic_distribution(self, **params):
        """
        Ventilation analytique d'une facture sur plusieurs centres de coûts
        Permet de répartir une facture sur plusieurs projets/départements
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            data = request.jsonrequest

            # Données requises
            invoice_id = data.get('invoiceId')
            distributions = data.get('distributions', [])  # Liste [{accountId, percentage}]

            if not invoice_id or not distributions:
                return self._error_response("invoiceId et distributions requis", "VALIDATION_ERROR", 400)

            # Vérifier total = 100%
            total_percentage = sum(d.get('percentage', 0) for d in distributions)
            if abs(total_percentage - 100) > 0.01:
                return self._error_response("Total répartition doit être 100%", "VALIDATION_ERROR", 400)

            AccountMove = request.env['account.move'].sudo()
            AnalyticAccount = request.env['account.analytic.account'].sudo()
            AnalyticLine = request.env['account.analytic.line'].sudo()

            invoice = AccountMove.browse(int(invoice_id))
            if not invoice.exists() or invoice.tenant_id.id != tenant_id:
                return self._error_response("Facture introuvable", "NOT_FOUND", 404)

            # Supprimer anciennes lignes analytiques (si redistribution)
            existing_lines = AnalyticLine.search([
                ('move_line_id', 'in', invoice.line_ids.ids),
                ('tenant_id', '=', tenant_id),
            ])
            if existing_lines:
                existing_lines.unlink()

            # Créer nouvelles lignes analytiques
            created_lines = []
            for distrib in distributions:
                account_id = int(distrib.get('accountId'))
                percentage = float(distrib.get('percentage'))

                analytic_account = AnalyticAccount.browse(account_id)
                if not analytic_account.exists() or analytic_account.tenant_id.id != tenant_id:
                    continue

                # Montant ventilé
                amount_distributed = float(invoice.amount_total) * (percentage / 100.0)

                # Créer ligne analytique
                line_vals = {
                    'name': f"{invoice.name} - {analytic_account.name}",
                    'account_id': account_id,
                    'tenant_id': tenant_id,
                    'date': invoice.invoice_date or datetime.now().date(),
                    'amount': amount_distributed,
                    'unit_amount': amount_distributed,
                    'currency_id': invoice.currency_id.id,
                    'partner_id': invoice.partner_id.id,
                    'general_account_id': invoice.line_ids[0].account_id.id if invoice.line_ids else None,
                }

                analytic_line = AnalyticLine.create(line_vals)
                created_lines.append({
                    'id': analytic_line.id,
                    'accountName': analytic_account.name,
                    'percentage': percentage,
                    'amount': amount_distributed,
                })

            return self._success_response({
                'lines': created_lines,
            }, message=f"{len(created_lines)} ventilation(s) créée(s)")

        except Exception as e:
            _logger.error(f"Erreur create_analytic_distribution: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/analytic/plans', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_analytic_plans(self, **params):
        """Liste plans analytiques (axes : projets, départements, produits, etc.)"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            AnalyticPlan = request.env['account.analytic.plan'].sudo()

            # Plans accessibles au tenant
            plans = AnalyticPlan.search([
                '|',
                ('company_id', '=', False),
                ('company_id.tenant_id', '=', tenant_id),
            ], order='name')

            results = []
            for plan in plans:
                # Compter comptes dans ce plan
                accounts_count = request.env['account.analytic.account'].sudo().search_count([
                    ('plan_id', '=', plan.id),
                    ('tenant_id', '=', tenant_id),
                ])

                results.append({
                    'id': plan.id,
                    'name': plan.name,
                    'description': plan.description or '',
                    'accountsCount': accounts_count,
                })

            return self._success_response({'plans': results, 'total': len(results)})

        except Exception as e:
            _logger.error(f"Erreur get_analytic_plans: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)
