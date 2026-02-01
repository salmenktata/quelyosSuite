# -*- coding: utf-8 -*-
import logging
import json
from datetime import datetime, timedelta
from odoo import http
from odoo.http import request
from .super_admin import SuperAdminController

_logger = logging.getLogger(__name__)


class BillingController(SuperAdminController):
    """Contrôleur super-admin pour la facturation et les abonnements"""

    def _get_mrr_history(self, months):
        """Calcule l'historique MRR sur N mois"""
        result = []
        today = datetime.today()

        for i in range(months, 0, -1):
            month_date = today - timedelta(days=30 * i)
            month_str = month_date.strftime('%Y-%m')

            # Calculer MRR pour ce mois (simplifié - à améliorer avec données historiques)
            Subscription = request.env['quelyos.subscription']
            mrr_data = Subscription.get_mrr_breakdown()

            result.append({
                'month': month_str,
                'mrr': mrr_data.get('total', 0)
            })

        return result

    @http.route('/api/super-admin/subscriptions', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_subscriptions(self, state=None, plan=None):
        """Liste globale des subscriptions"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            domain = []
            if state:
                domain.append(('state', '=', state))
            if plan:
                domain.append(('plan_id.code', '=', plan))

            Subscription = request.env['quelyos.subscription']
            subscriptions = Subscription.search(domain, order='mrr desc')

            data = {
                'success': True,
                'data': [self._serialize_subscription(s) for s in subscriptions],
                'total': len(subscriptions),
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List subscriptions error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/subscriptions/health-overview', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def health_overview(self):
        """Retourne la distribution santé des subscriptions + at-risk customers"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            Subscription = request.env['quelyos.subscription'].sudo()

            # Force le recalcul des health scores
            active_subs = Subscription.search([('state', 'in', ['active', 'trial', 'past_due'])])
            active_subs._compute_health_score()

            # Distribution par health_status
            healthy_count = Subscription.search_count([
                ('state', 'in', ['active', 'trial']),
                ('health_status', '=', 'healthy')
            ])
            at_risk_count = Subscription.search_count([
                ('state', 'in', ['active', 'trial', 'past_due']),
                ('health_status', '=', 'at_risk')
            ])
            critical_count = Subscription.search_count([
                ('state', 'in', ['active', 'trial', 'past_due']),
                ('health_status', '=', 'critical')
            ])

            # At-risk customers détaillés (at_risk + critical)
            at_risk_subs = Subscription.search([
                ('state', 'in', ['active', 'trial', 'past_due']),
                ('health_status', 'in', ['at_risk', 'critical'])
            ], order='health_score asc', limit=10)

            at_risk_customers = []
            for sub in at_risk_subs:
                tenant = sub.tenant_ids[0] if sub.tenant_ids else None
                at_risk_customers.append({
                    'id': sub.id,
                    'name': tenant.name if tenant else sub.name,
                    'tenant_id': tenant.id if tenant else None,
                    'plan': sub.plan_id.code if sub.plan_id else None,
                    'mrr': sub.mrr,
                    'health_score': sub.health_score,
                    'health_status': sub.health_status,
                    'state': sub.state,
                    'usage_score': sub.usage_score,
                    'payment_health': sub.payment_health,
                    'engagement_score': sub.engagement_score,
                    'churn_risk': sub.churn_risk,
                    'trial_end_date': sub.trial_end_date.isoformat() if sub.trial_end_date else None,
                })

            # Total MRR at risk
            total_mrr_at_risk = sum(sub.mrr for sub in at_risk_subs)

            data = {
                'success': True,
                'distribution': {
                    'healthy': healthy_count,
                    'at_risk': at_risk_count,
                    'critical': critical_count,
                    'total': healthy_count + at_risk_count + critical_count,
                },
                'at_risk_customers': at_risk_customers,
                'total_mrr_at_risk': total_mrr_at_risk,
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Health overview error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/subscriptions/mrr-breakdown', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def mrr_breakdown(self):
        """MRR par plan"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            data = request.env['quelyos.subscription'].get_mrr_breakdown()
            return request.make_json_response({'success': True, **data}, headers=cors_headers)

        except Exception as e:
            _logger.error(f"MRR breakdown error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/subscriptions/churn-analysis', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def churn_analysis(self, months=12):
        """Analyse churn sur N mois"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            data = request.env['quelyos.subscription'].get_churn_analysis(months=int(months))
            return request.make_json_response({'success': True, 'data': data}, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Churn analysis error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/dunning/overview', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def dunning_overview(self):
        """Retourne l'overview des relances en cours"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            DunningStep = request.env['quelyos.dunning.step'].sudo()
            Subscription = request.env['quelyos.subscription'].sudo()

            # Stats globales
            pending_steps = DunningStep.search_count([('state', '=', 'pending')])
            executed_today = DunningStep.search_count([
                ('state', '=', 'executed'),
                ('executed_at', '>=', datetime.now().replace(hour=0, minute=0, second=0))
            ])

            # Subscriptions past_due
            past_due_subs = Subscription.search([('state', '=', 'past_due')])
            total_past_due = len(past_due_subs)
            total_amount_due = sum(sub.mrr for sub in past_due_subs)

            # Recovered this month (past_due -> active dans le mois)
            month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0)
            recovered_subs = Subscription.search([
                ('state', '=', 'active'),
                ('dunning_step_ids.state', '=', 'skipped'),
                ('dunning_step_ids.create_date', '>=', month_start)
            ])
            recovered_amount = sum(sub.mrr for sub in recovered_subs)

            # Relances en cours détaillées (prochaines actions)
            pending_dunning = DunningStep.search([
                ('state', '=', 'pending')
            ], order='scheduled_date asc', limit=10)

            active_collections = []
            for step in pending_dunning:
                tenant = step.subscription_id.tenant_ids[0] if step.subscription_id.tenant_ids else None
                days_overdue = (datetime.now().date() - step.subscription_id.next_billing_date).days if step.subscription_id.next_billing_date else step.days_overdue
                active_collections.append({
                    'id': step.id,
                    'subscription_id': step.subscription_id.id,
                    'tenant_name': tenant.name if tenant else step.subscription_id.name,
                    'tenant_id': tenant.id if tenant else None,
                    'days_overdue': max(0, days_overdue),
                    'next_action': step.action,
                    'next_action_date': step.scheduled_date.isoformat() if step.scheduled_date else None,
                    'step_number': step.step_number,
                    'amount_due': step.amount_due,
                })

            data = {
                'success': True,
                'stats': {
                    'pending_steps': pending_steps,
                    'executed_today': executed_today,
                    'total_past_due': total_past_due,
                    'total_amount_due': total_amount_due,
                    'recovered_this_month': recovered_amount,
                    'recovered_count': len(recovered_subs),
                },
                'active_collections': active_collections,
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Dunning overview error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/invoices', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_invoices(self):
        """Liste toutes les factures"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            invoices = request.env['account.move'].sudo().search([
                ('tenant_id', '!=', False),
                ('move_type', '=', 'out_invoice')
            ], order='invoice_date desc', limit=200)

            data = {
                'success': True,
                'data': [{
                    'id': inv.id,
                    'name': inv.name,
                    'tenant_id': inv.tenant_id.id,
                    'tenant_name': inv.tenant_id.name,
                    'amount_untaxed': inv.amount_untaxed,
                    'amount_total': inv.amount_total,
                    'state': inv.state,
                    'payment_state': inv.payment_state,
                    'invoice_date': inv.invoice_date.isoformat() if inv.invoice_date else None,
                    'due_date': inv.invoice_date_due.isoformat() if inv.invoice_date_due else None,
                } for inv in invoices],
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List invoices error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/invoices/summary', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def invoices_summary(self):
        """Summary facturation mois en cours"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            today = datetime.today()
            month_start = today.replace(day=1)

            Invoice = request.env['account.move'].sudo()
            Transaction = request.env['payment.transaction'].sudo()

            # Revenue total (ce mois)
            paid_invoices = Invoice.search([
                ('tenant_id', '!=', False),
                ('move_type', '=', 'out_invoice'),
                ('payment_state', '=', 'paid'),
                ('invoice_date', '>=', month_start.date())
            ])
            total_revenue = sum(inv.amount_total for inv in paid_invoices)

            # Factures impayées
            unpaid_invoices = Invoice.search([
                ('tenant_id', '!=', False),
                ('move_type', '=', 'out_invoice'),
                ('payment_state', '=', 'not_paid')
            ])
            unpaid_count = len(unpaid_invoices)
            unpaid_amount = sum(inv.amount_total for inv in unpaid_invoices)

            # Taux succès paiement (ce mois)
            all_txs = Transaction.search_count([
                ('create_date', '>=', month_start)
            ])
            success_txs = Transaction.search_count([
                ('create_date', '>=', month_start),
                ('state', '=', 'done')
            ])
            success_rate = (success_txs / all_txs * 100) if all_txs else 0

            # Transactions échouées
            failed_txs = Transaction.search_count([
                ('create_date', '>=', month_start),
                ('state', '=', 'error')
            ])

            data = {
                'success': True,
                'total_revenue': total_revenue,
                'unpaid_invoices': unpaid_count,
                'unpaid_amount': unpaid_amount,
                'success_rate': success_rate,
                'failed_transactions': failed_txs,
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Invoices summary error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/transactions', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_transactions(self):
        """Liste toutes les transactions"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            transactions = request.env['payment.transaction'].sudo().search([
                ('tenant_id', '!=', False)
            ], order='create_date desc', limit=200)

            data = {
                'success': True,
                'data': [{
                    'id': tx.id,
                    'reference': tx.reference,
                    'tenant_id': tx.tenant_id.id,
                    'tenant_name': tx.tenant_id.name,
                    'amount': tx.amount,
                    'state': tx.state,
                    'provider': tx.provider_id.name if tx.provider_id else 'N/A',
                    'date': tx.create_date.isoformat() if tx.create_date else None,
                    'error_message': tx.state_message if tx.state == 'error' else None,
                } for tx in transactions],
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List transactions error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    def _serialize_subscription(self, subscription):
        """Sérialise une subscription pour l'API"""
        # Récupérer le premier tenant lié (relation One2many)
        tenant = subscription.tenant_ids[0] if subscription.tenant_ids else None
        return {
            'id': subscription.id,
            'name': subscription.name,
            'tenant_id': tenant.id if tenant else None,
            'tenant_name': tenant.name if tenant else None,
            'tenant_domain': tenant.domain if tenant else None,
            'plan_id': subscription.plan_id.id if subscription.plan_id else None,
            'plan_code': subscription.plan_id.code if subscription.plan_id else None,
            'plan_name': subscription.plan_id.name if subscription.plan_id else None,
            'state': subscription.state,
            'billing_cycle': subscription.billing_cycle,
            'mrr': subscription.mrr,
            'price': subscription.price,
            'start_date': subscription.start_date.isoformat() if subscription.start_date else None,
            'trial_end_date': subscription.trial_end_date.isoformat() if subscription.trial_end_date else None,
            'trial_days': subscription.plan_id.trial_days if subscription.plan_id else 14,
            'next_billing_date': subscription.next_billing_date.isoformat() if subscription.next_billing_date else None,
            'end_date': subscription.end_date.isoformat() if subscription.end_date else None,
            'stripe_subscription_id': subscription.stripe_subscription_id,
            'stripe_customer_id': subscription.stripe_customer_id,
            'users_usage': tenant.users_count if tenant else 0,
            'max_users': subscription.max_users,
            'products_usage': tenant.products_count if tenant else 0,
            'max_products': subscription.max_products,
            'orders_usage': tenant.orders_count if tenant else 0,
            'max_orders_per_year': subscription.max_orders_per_year,
        }
