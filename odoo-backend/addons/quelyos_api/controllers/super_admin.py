# -*- coding: utf-8 -*-
"""
Controller Super Admin
Endpoints dédiés à l'administration de la plateforme SaaS.
Accès restreint aux utilisateurs du groupe base.group_system.
"""

from odoo import http
from odoo.http import request
from odoo.exceptions import AccessDenied
from datetime import datetime, timedelta
import logging
import json

from ..config import get_cors_headers

_logger = logging.getLogger(__name__)


class SuperAdminController(http.Controller):
    """Controller pour le Super Admin Client"""

    def _check_super_admin(self):
        """Vérifie que l'utilisateur est super admin (base.group_system)"""
        user = request.env.user
        endpoint = request.httprequest.path
        ip_address = request.httprequest.remote_addr

        if not user.has_group('base.group_system'):
            _logger.warning(
                f"[AUDIT] Super admin access DENIED - User: {user.login} (ID: {user.id}) | "
                f"IP: {ip_address} | Endpoint: {endpoint}"
            )
            raise AccessDenied("Super admin access required")

        # Log audit de l'accès super admin
        _logger.info(
            f"[AUDIT] Super admin access granted - User: {user.login} (ID: {user.id}) | "
            f"IP: {ip_address} | Endpoint: {endpoint}"
        )

        # Rate limiting automatique
        self._check_rate_limit()

    def _check_rate_limit(self, max_requests=100, window_seconds=60):
        """
        Vérifie le rate limiting via table PostgreSQL
        Par défaut: 100 requêtes par minute par utilisateur
        """
        user = request.env.user
        endpoint = request.httprequest.path
        now = datetime.now()
        window_start = now - timedelta(seconds=window_seconds)

        # Nettoyer anciennes entrées (> window)
        request.env.cr.execute("""
            DELETE FROM ir_logging
            WHERE name = 'rate_limit.superadmin'
            AND create_date < %s
        """, (window_start,))

        # Compter requêtes dans la fenêtre
        request.env.cr.execute("""
            SELECT COUNT(*)
            FROM ir_logging
            WHERE name = 'rate_limit.superadmin'
            AND message LIKE %s
            AND create_date >= %s
        """, (f"{user.id}:{endpoint}%", window_start))

        count = request.env.cr.fetchone()[0]

        if count >= max_requests:
            _logger.warning(
                f"[RATE LIMIT] User {user.login} (ID: {user.id}) exceeded rate limit "
                f"on {endpoint}: {count}/{max_requests} requests"
            )
            raise AccessDenied(f"Rate limit exceeded. Max {max_requests} requests per {window_seconds}s.")

        # Enregistrer cette requête
        request.env.cr.execute("""
            INSERT INTO ir_logging (create_date, create_uid, name, type, dbname, level, message, path, line, func)
            VALUES (NOW(), %s, 'rate_limit.superadmin', 'server', current_database(), 'INFO', %s, '', '', '')
        """, (user.id, f"{user.id}:{endpoint}"))

    # =========================================================================
    # DASHBOARD METRICS
    # =========================================================================

    @http.route('/api/super-admin/dashboard/metrics', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def dashboard_metrics(self):
        """Retourne les KPIs globaux pour le dashboard"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        # Handle preflight OPTIONS
        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        # Vérifier authentification
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
            Tenant = request.env['quelyos.tenant'].sudo()

            # Récupérer les métriques réelles
            mrr_data = Subscription.get_mrr_breakdown()
            total_mrr = mrr_data.get('total', 0)

            active_subs = Subscription.search_count([('state', 'in', ['active', 'trial'])])

            # Churn analysis
            churn_analysis = Subscription.get_churn_analysis(months=1)
            churn_rate = churn_analysis[0].get('churn_rate', 0) if churn_analysis else 0

            # Revenue by plan
            revenue_by_plan = [
                {'plan': 'starter', 'revenue': mrr_data.get('starter', 0)},
                {'plan': 'pro', 'revenue': mrr_data.get('pro', 0)},
                {'plan': 'enterprise', 'revenue': mrr_data.get('enterprise', 0)},
            ]

            # Top customers (tenants avec le plus haut MRR)
            top_tenants = Tenant.search([
                ('subscription_id', '!=', False),
                ('status', '=', 'active')
            ], order='subscription_id desc', limit=5)
            top_customers = [{
                'id': t.id,
                'name': t.name,
                'mrr': t.subscription_id.mrr if t.subscription_id else 0,
                'plan': t.subscription_id.plan_id.code if t.subscription_id and t.subscription_id.plan_id else None,
            } for t in top_tenants]

            # Recent subscriptions
            recent_subs = Subscription.search([
                ('state', 'in', ['active', 'trial'])
            ], order='create_date desc', limit=10)
            recent_subscriptions = [{
                'id': s.id,
                'name': s.name,
                'plan': s.plan_id.code if s.plan_id else None,
                'state': s.state,
                'mrr': s.mrr,
                'created_at': s.create_date.isoformat() if s.create_date else None,
            } for s in recent_subs]

            # At-risk customers (basé sur health_score)
            at_risk_subs = Subscription.search([
                ('state', 'in', ['active', 'trial', 'past_due']),
                ('health_status', 'in', ['at_risk', 'critical'])
            ], order='health_score asc', limit=5)
            at_risk_customers = []
            for sub in at_risk_subs:
                tenant = sub.tenant_ids[0] if sub.tenant_ids else None
                at_risk_customers.append({
                    'id': sub.id,
                    'name': tenant.name if tenant else sub.name,
                    'mrr': sub.mrr,
                    'plan': sub.plan_id.code if sub.plan_id else None,
                    'health_score': sub.health_score,
                    'health_status': sub.health_status,
                })

            data = {
                'success': True,
                'mrr': total_mrr,
                'arr': total_mrr * 12,
                'active_subscriptions': active_subs,
                'churn_rate': churn_rate,
                'mrr_history': self._get_mrr_history(6),
                'revenue_by_plan': revenue_by_plan,
                'top_customers': top_customers,
                'at_risk_customers': at_risk_customers,
                'recent_subscriptions': recent_subscriptions,
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Dashboard metrics error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

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

    # =========================================================================
    # TENANTS
    # =========================================================================

    @http.route('/api/super-admin/tenants', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_tenants(self, search=None, plan=None, state=None, page=1, limit=50):
        """Liste tous les tenants avec filtres"""
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
            Tenant = request.env['quelyos.tenant'].sudo()
            page = int(page) if page else 1
            limit = int(limit) if limit else 50

            # Construire le domaine de recherche
            domain = [('active', '=', True)]
            if search:
                domain.append('|')
                domain.append(('name', 'ilike', search))
                domain.append(('domain', 'ilike', search))
            if plan:
                domain.append(('subscription_id.plan_id.code', '=', plan))
            if state:
                domain.append(('status', '=', state))

            # Compter le total
            total = Tenant.search_count(domain)

            # Paginer
            offset = (page - 1) * limit
            tenants = Tenant.search(domain, offset=offset, limit=limit, order='create_date desc')

            # Sérialiser
            tenants_data = [self._serialize_tenant(t) for t in tenants]

            data = {
                'success': True,
                'data': tenants_data,
                'total': total,
                'page': page,
                'limit': limit,
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List tenants error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    # =========================================================================
    # TENANT ACTIONS (Suspend / Activate)
    # =========================================================================

    @http.route('/api/super-admin/tenants/<int:tenant_id>/suspend', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def suspend_tenant(self, tenant_id):
        """Suspend a tenant - blocks user access"""
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
            data = json.loads(request.httprequest.data.decode('utf-8')) if request.httprequest.data else {}
            reason = data.get('reason', 'Suspended by super admin')

            Tenant = request.env['quelyos.tenant'].sudo()
            tenant = Tenant.browse(tenant_id)

            if not tenant.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Tenant non trouvé'},
                    headers=cors_headers,
                    status=404
                )

            if tenant.status == 'suspended':
                return request.make_json_response(
                    {'success': False, 'error': 'Tenant déjà suspendu'},
                    headers=cors_headers,
                    status=400
                )

            # Suspend tenant
            tenant.write({
                'status': 'suspended',
                'suspension_reason': reason,
                'suspended_at': datetime.now(),
                'suspended_by': request.env.user.id,
            })

            # Log audit
            _logger.warning(
                f"[AUDIT] Tenant SUSPENDED - User: {request.env.user.login} | "
                f"Tenant: {tenant.name} (ID: {tenant_id}) | Reason: {reason}"
            )

            return request.make_json_response({
                'success': True,
                'message': f'Tenant "{tenant.name}" suspendu avec succès',
                'tenant': self._serialize_tenant(tenant),
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Suspend tenant error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/tenants/<int:tenant_id>/activate', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def activate_tenant(self, tenant_id):
        """Reactivate a suspended tenant"""
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
            Tenant = request.env['quelyos.tenant'].sudo()
            tenant = Tenant.browse(tenant_id)

            if not tenant.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Tenant non trouvé'},
                    headers=cors_headers,
                    status=404
                )

            if tenant.status == 'active':
                return request.make_json_response(
                    {'success': False, 'error': 'Tenant déjà actif'},
                    headers=cors_headers,
                    status=400
                )

            # Reactivate tenant
            tenant.write({
                'status': 'active',
                'suspension_reason': False,
                'suspended_at': False,
                'suspended_by': False,
            })

            # Log audit
            _logger.info(
                f"[AUDIT] Tenant REACTIVATED - User: {request.env.user.login} | "
                f"Tenant: {tenant.name} (ID: {tenant_id})"
            )

            return request.make_json_response({
                'success': True,
                'message': f'Tenant "{tenant.name}" réactivé avec succès',
                'tenant': self._serialize_tenant(tenant),
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Activate tenant error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    # =========================================================================
    # SUBSCRIPTIONS
    # =========================================================================

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

    # =========================================================================
    # INVOICES & TRANSACTIONS
    # =========================================================================

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

    # =========================================================================
    # PROVISIONING & MONITORING
    # =========================================================================

    @http.route('/api/super-admin/provisioning-jobs', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_provisioning_jobs(self):
        """Liste tous les provisioning jobs"""
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
            jobs = request.env['quelyos.provisioning.job'].sudo().search([], order='create_date desc', limit=50)

            data = {
                'success': True,
                'data': [{
                    'id': job.id,
                    'tenant_id': job.tenant_id.id if job.tenant_id else None,
                    'tenant_name': job.tenant_id.name if job.tenant_id else None,
                    'job_type': 'tenant_creation',
                    'state': job.state,
                    'progress': job.progress,
                    'current_step': job.current_step,
                    'started_at': job.started_at.isoformat() if job.started_at else None,
                    'completed_at': job.completed_at.isoformat() if job.completed_at else None,
                    'duration_seconds': 0,
                    'error_message': job.error_message,
                    'steps_completed': [],
                } for job in jobs],
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List provisioning jobs error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/system/health', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def system_health(self):
        """État des services système"""
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
            import socket

            # Backend (toujours UP si on répond)
            backend_status = 'up'
            backend_response_time = 50  # ms (simulé)

            # PostgreSQL (vérifier via query)
            try:
                request.env.cr.execute("SELECT 1")
                postgres_status = 'up'
                request.env.cr.execute("SELECT count(*) FROM pg_stat_activity")
                postgres_connections = request.env.cr.fetchone()[0]
            except Exception:
                postgres_status = 'down'
                postgres_connections = 0

            # Redis (check via socket TCP)
            try:
                redis_host = request.env['ir.config_parameter'].sudo().get_param('redis.host', 'redis')
                redis_port = int(request.env['ir.config_parameter'].sudo().get_param('redis.port', '6379'))

                # Test connexion TCP
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(2)
                result = sock.connect_ex((redis_host, redis_port))
                sock.close()

                if result == 0:
                    redis_status = 'up'
                    redis_memory_mb = 128
                else:
                    redis_status = 'down'
                    redis_memory_mb = 0
            except Exception as e:
                _logger.warning(f"Redis health check failed: {str(e)}")
                redis_status = 'down'
                redis_memory_mb = 0

            # Stripe (vérifier dernière webhook)
            stripe_status = 'up'
            last_webhook = request.env['payment.transaction'].sudo().search(
                [('provider_id.code', '=', 'stripe')], order='create_date desc', limit=1
            )
            last_webhook_received = last_webhook.create_date.isoformat() if last_webhook else None

            data = {
                'success': True,
                'backend_status': backend_status,
                'backend_response_time_ms': backend_response_time,
                'postgres_status': postgres_status,
                'postgres_connections': postgres_connections,
                'redis_status': redis_status,
                'redis_memory_mb': redis_memory_mb,
                'stripe_status': stripe_status,
                'last_webhook_received': last_webhook_received,
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"System health error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    # =========================================================================
    # HELPERS
    # =========================================================================

    def _serialize_tenant(self, tenant):
        """Sérialise un tenant pour l'API"""
        sub = tenant.subscription_id
        return {
            'id': tenant.id,
            'name': tenant.name,
            'code': tenant.code,
            'domain': tenant.domain,
            'status': tenant.status,
            'logo': tenant.logo_url or None,
            'slogan': tenant.slogan,
            'subscription_id': sub.id if sub else None,
            'subscription_state': tenant.subscription_state,
            'plan_code': sub.plan_id.code if sub and sub.plan_id else None,
            'plan_name': sub.plan_id.name if sub and sub.plan_id else None,
            'users_count': tenant.users_count,
            'products_count': tenant.products_count,
            'orders_count': tenant.orders_count,
            'max_users': sub.max_users if sub else 0,
            'max_products': sub.max_products if sub else 0,
            'max_orders_per_year': sub.max_orders_per_year if sub else 0,
            'mrr': sub.mrr if sub else 0,
            'features': {
                'wishlist_enabled': tenant.feature_wishlist,
                'reviews_enabled': tenant.feature_reviews,
                'newsletter_enabled': tenant.feature_newsletter,
                'product_comparison_enabled': tenant.feature_comparison,
                'guest_checkout_enabled': tenant.feature_guest_checkout,
            },
            'provisioning_job_id': tenant.provisioning_job_id.id if tenant.provisioning_job_id else None,
            'provisioning_status': tenant.provisioning_job_id.state if tenant.provisioning_job_id else None,
            'created_at': tenant.create_date.isoformat() if tenant.create_date else None,
        }

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

    # =========================================================================
    # BACKUPS
    # =========================================================================

    @http.route('/api/super-admin/backups', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_backups(self):
        """Liste tous les backups"""
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
            Backup = request.env['quelyos.backup'].sudo()
            backups = Backup.search([], order='create_date desc', limit=100)

            # Récupérer paramètres backup auto
            ICP = request.env['ir.config_parameter'].sudo()
            last_auto = ICP.get_param('quelyos.backup.last_auto', False)
            next_scheduled = ICP.get_param('quelyos.backup.next_scheduled', False)

            # Récupérer schedule
            schedule = {
                'enabled': ICP.get_param('quelyos.backup.schedule.enabled', 'false') == 'true',
                'frequency': ICP.get_param('quelyos.backup.schedule.frequency', 'daily'),
                'day_of_week': int(ICP.get_param('quelyos.backup.schedule.day_of_week', '1')),
                'day_of_month': int(ICP.get_param('quelyos.backup.schedule.day_of_month', '1')),
                'hour': int(ICP.get_param('quelyos.backup.schedule.hour', '2')),
                'minute': int(ICP.get_param('quelyos.backup.schedule.minute', '0')),
                'backup_type': ICP.get_param('quelyos.backup.schedule.type', 'full'),
                'retention_count': int(ICP.get_param('quelyos.backup.schedule.retention', '7')),
            }

            data = {
                'success': True,
                'data': [self._serialize_backup(b) for b in backups],
                'total': len(backups),
                'last_auto_backup': last_auto,
                'next_scheduled_backup': next_scheduled,
                'schedule': schedule,
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List backups error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/backups/schedule', type='http', auth='public', methods=['GET', 'POST', 'OPTIONS'], csrf=False)
    def backup_schedule(self):
        """GET/POST schedule de backup automatique"""
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
            ICP = request.env['ir.config_parameter'].sudo()

            if request.httprequest.method == 'GET':
                schedule = {
                    'enabled': ICP.get_param('quelyos.backup.schedule.enabled', 'false') == 'true',
                    'frequency': ICP.get_param('quelyos.backup.schedule.frequency', 'daily'),
                    'day_of_week': int(ICP.get_param('quelyos.backup.schedule.day_of_week', '1')),
                    'day_of_month': int(ICP.get_param('quelyos.backup.schedule.day_of_month', '1')),
                    'hour': int(ICP.get_param('quelyos.backup.schedule.hour', '2')),
                    'minute': int(ICP.get_param('quelyos.backup.schedule.minute', '0')),
                    'backup_type': ICP.get_param('quelyos.backup.schedule.type', 'full'),
                    'retention_count': int(ICP.get_param('quelyos.backup.schedule.retention', '7')),
                }
                return request.make_json_response({'success': True, 'schedule': schedule}, headers=cors_headers)

            # POST - Save schedule
            data = json.loads(request.httprequest.data.decode('utf-8')) if request.httprequest.data else {}

            ICP.set_param('quelyos.backup.schedule.enabled', 'true' if data.get('enabled') else 'false')
            ICP.set_param('quelyos.backup.schedule.frequency', data.get('frequency', 'daily'))
            ICP.set_param('quelyos.backup.schedule.day_of_week', str(data.get('day_of_week', 1)))
            ICP.set_param('quelyos.backup.schedule.day_of_month', str(data.get('day_of_month', 1)))
            ICP.set_param('quelyos.backup.schedule.hour', str(data.get('hour', 2)))
            ICP.set_param('quelyos.backup.schedule.minute', str(data.get('minute', 0)))
            ICP.set_param('quelyos.backup.schedule.type', data.get('backup_type', 'full'))
            ICP.set_param('quelyos.backup.schedule.retention', str(data.get('retention_count', 7)))

            _logger.info(
                f"[AUDIT] Backup schedule updated - User: {request.env.user.login} | "
                f"Enabled: {data.get('enabled')} | Frequency: {data.get('frequency')}"
            )

            return request.make_json_response({
                'success': True,
                'message': 'Schedule sauvegardé'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Backup schedule error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/backups/trigger', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def trigger_backup(self):
        """Déclenche un backup manuel"""
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
            data = json.loads(request.httprequest.data.decode('utf-8')) if request.httprequest.data else {}
            backup_type = data.get('type', 'full')

            Backup = request.env['quelyos.backup'].sudo()
            backup = Backup.create({
                'type': backup_type,
                'status': 'pending',
                'triggered_by': request.env.user.id,
            })

            # Lancer le backup en tâche de fond
            backup.with_delay().execute_backup()

            _logger.info(
                f"[AUDIT] Backup triggered - User: {request.env.user.login} | "
                f"Type: {backup_type} | Backup ID: {backup.id}"
            )

            return request.make_json_response({
                'success': True,
                'backup_id': backup.id,
                'message': 'Backup déclenché avec succès'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Trigger backup error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/backups/<int:backup_id>/restore', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def restore_backup(self, backup_id):
        """Restaure un backup"""
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
            Backup = request.env['quelyos.backup'].sudo()
            backup = Backup.browse(backup_id)

            if not backup.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Backup non trouvé'},
                    headers=cors_headers,
                    status=404
                )

            if backup.status != 'completed':
                return request.make_json_response(
                    {'success': False, 'error': 'Backup non disponible pour restauration'},
                    headers=cors_headers,
                    status=400
                )

            _logger.warning(
                f"[AUDIT] Backup RESTORE initiated - User: {request.env.user.login} | "
                f"Backup ID: {backup_id} | Filename: {backup.filename}"
            )

            # Lancer la restauration en tâche de fond
            backup.with_delay().execute_restore()

            return request.make_json_response({
                'success': True,
                'message': 'Restauration lancée'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Restore backup error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    def _serialize_backup(self, backup):
        """Sérialise un backup pour l'API"""
        return {
            'id': backup.id,
            'filename': backup.filename,
            'type': backup.type,
            'tenant_id': backup.tenant_id.id if backup.tenant_id else None,
            'tenant_name': backup.tenant_id.name if backup.tenant_id else None,
            'size_mb': backup.size_mb,
            'status': backup.status,
            'created_at': backup.create_date.isoformat() if backup.create_date else None,
            'completed_at': backup.completed_at.isoformat() if backup.completed_at else None,
            'download_url': f'/api/super-admin/backups/{backup.id}/download' if backup.status == 'completed' else None,
            'error_message': backup.error_message,
        }

    # =========================================================================
    # CORS SETTINGS
    # =========================================================================

    @http.route('/api/super-admin/settings/cors', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_cors_entries(self):
        """Liste les entrées CORS whitelist"""
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
            CorsEntry = request.env['quelyos.cors.entry'].sudo()
            entries = CorsEntry.search([], order='domain')

            ICP = request.env['ir.config_parameter'].sudo()
            allow_credentials = ICP.get_param('quelyos.cors.allow_credentials', 'true') == 'true'
            max_age = int(ICP.get_param('quelyos.cors.max_age', '3600'))

            data = {
                'success': True,
                'entries': [self._serialize_cors_entry(e) for e in entries],
                'allow_credentials': allow_credentials,
                'max_age_seconds': max_age,
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List CORS entries error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/settings/cors', type='http', auth='public', methods=['POST'], csrf=False)
    def add_cors_entry(self):
        """Ajoute un domaine à la whitelist CORS"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

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
            data = json.loads(request.httprequest.data.decode('utf-8')) if request.httprequest.data else {}
            domain = data.get('domain', '').strip().lower()

            if not domain:
                return request.make_json_response(
                    {'success': False, 'error': 'Domaine requis'},
                    headers=cors_headers,
                    status=400
                )

            # Vérifier doublon
            CorsEntry = request.env['quelyos.cors.entry'].sudo()
            existing = CorsEntry.search([('domain', '=', domain)], limit=1)
            if existing:
                return request.make_json_response(
                    {'success': False, 'error': 'Domaine déjà configuré'},
                    headers=cors_headers,
                    status=409
                )

            entry = CorsEntry.create({
                'domain': domain,
                'is_active': True,
                'created_by': request.env.user.login,
            })

            _logger.info(
                f"[AUDIT] CORS entry added - User: {request.env.user.login} | "
                f"Domain: {domain}"
            )

            return request.make_json_response({
                'success': True,
                'entry': self._serialize_cors_entry(entry)
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Add CORS entry error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/settings/cors/<int:entry_id>', type='http', auth='public', methods=['PATCH', 'OPTIONS'], csrf=False)
    def update_cors_entry(self, entry_id):
        """Met à jour une entrée CORS (toggle active)"""
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
            data = json.loads(request.httprequest.data.decode('utf-8')) if request.httprequest.data else {}

            CorsEntry = request.env['quelyos.cors.entry'].sudo()
            entry = CorsEntry.browse(entry_id)

            if not entry.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Entrée non trouvée'},
                    headers=cors_headers,
                    status=404
                )

            if 'is_active' in data:
                entry.is_active = data['is_active']
                _logger.info(
                    f"[AUDIT] CORS entry toggled - User: {request.env.user.login} | "
                    f"Domain: {entry.domain} | Active: {entry.is_active}"
                )

            return request.make_json_response({
                'success': True,
                'entry': self._serialize_cors_entry(entry)
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Update CORS entry error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/settings/cors/<int:entry_id>', type='http', auth='public', methods=['DELETE'], csrf=False)
    def delete_cors_entry(self, entry_id):
        """Supprime une entrée CORS"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

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
            CorsEntry = request.env['quelyos.cors.entry'].sudo()
            entry = CorsEntry.browse(entry_id)

            if not entry.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Entrée non trouvée'},
                    headers=cors_headers,
                    status=404
                )

            domain = entry.domain
            entry.unlink()

            _logger.info(
                f"[AUDIT] CORS entry deleted - User: {request.env.user.login} | "
                f"Domain: {domain}"
            )

            return request.make_json_response({
                'success': True,
                'message': 'Domaine supprimé'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Delete CORS entry error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    def _serialize_cors_entry(self, entry):
        """Sérialise une entrée CORS pour l'API"""
        return {
            'id': entry.id,
            'domain': entry.domain,
            'tenant_id': entry.tenant_id.id if entry.tenant_id else None,
            'tenant_name': entry.tenant_id.name if entry.tenant_id else None,
            'created_at': entry.create_date.isoformat() if entry.create_date else None,
            'created_by': entry.created_by,
            'is_active': entry.is_active,
        }

    # =========================================================================
    # SUBSCRIPTION PLANS
    # =========================================================================

    @http.route('/api/super-admin/plans', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_plans(self):
        """Liste tous les plans tarifaires"""
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
            Plan = request.env['quelyos.subscription.plan'].sudo()
            plans = Plan.search([], order='sequence, id')

            data = {
                'success': True,
                'data': [self._serialize_plan(p) for p in plans],
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List plans error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/plans', type='http', auth='public', methods=['POST'], csrf=False)
    def create_plan(self):
        """Crée un nouveau plan tarifaire"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

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
            data = json.loads(request.httprequest.data.decode('utf-8')) if request.httprequest.data else {}

            Plan = request.env['quelyos.subscription.plan'].sudo()

            # Vérifier doublon code
            existing = Plan.search([('code', '=', data.get('code'))], limit=1)
            if existing:
                return request.make_json_response(
                    {'success': False, 'error': 'Code plan déjà utilisé'},
                    headers=cors_headers,
                    status=409
                )

            features = data.get('features', {})
            plan = Plan.create({
                'code': data.get('code'),
                'name': data.get('name'),
                'description': data.get('description'),
                'price_monthly': data.get('price_monthly', 0),
                'price_yearly': data.get('price_yearly', 0),
                'max_users': data.get('max_users', 5),
                'max_products': data.get('max_products', 100),
                'max_orders_per_year': data.get('max_orders_per_year', 1000),
                'feature_wishlist': features.get('wishlist_enabled', False),
                'feature_reviews': features.get('reviews_enabled', False),
                'feature_newsletter': features.get('newsletter_enabled', False),
                'feature_comparison': features.get('product_comparison_enabled', False),
                'feature_guest_checkout': features.get('guest_checkout_enabled', True),
                'feature_api_access': features.get('api_access', False),
                'feature_priority_support': features.get('priority_support', False),
                'feature_custom_domain': features.get('custom_domain', False),
                'active': True,
            })

            _logger.info(
                f"[AUDIT] Plan created - User: {request.env.user.login} | "
                f"Plan: {plan.code} (ID: {plan.id})"
            )

            return request.make_json_response({
                'success': True,
                'plan': self._serialize_plan(plan)
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Create plan error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/plans/<int:plan_id>', type='http', auth='public', methods=['PUT', 'OPTIONS'], csrf=False)
    def update_plan(self, plan_id):
        """Met à jour un plan tarifaire"""
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
            data = json.loads(request.httprequest.data.decode('utf-8')) if request.httprequest.data else {}

            Plan = request.env['quelyos.subscription.plan'].sudo()
            plan = Plan.browse(plan_id)

            if not plan.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Plan non trouvé'},
                    headers=cors_headers,
                    status=404
                )

            features = data.get('features', {})
            plan.write({
                'name': data.get('name', plan.name),
                'description': data.get('description', plan.description),
                'price_monthly': data.get('price_monthly', plan.price_monthly),
                'price_yearly': data.get('price_yearly', plan.price_yearly),
                'max_users': data.get('max_users', plan.max_users),
                'max_products': data.get('max_products', plan.max_products),
                'max_orders_per_year': data.get('max_orders_per_year', plan.max_orders_per_year),
                'feature_wishlist': features.get('wishlist_enabled', plan.feature_wishlist),
                'feature_reviews': features.get('reviews_enabled', plan.feature_reviews),
                'feature_newsletter': features.get('newsletter_enabled', plan.feature_newsletter),
                'feature_comparison': features.get('product_comparison_enabled', plan.feature_comparison),
                'feature_guest_checkout': features.get('guest_checkout_enabled', plan.feature_guest_checkout),
                'feature_api_access': features.get('api_access', plan.feature_api_access),
                'feature_priority_support': features.get('priority_support', plan.feature_priority_support),
                'feature_custom_domain': features.get('custom_domain', plan.feature_custom_domain),
            })

            _logger.info(
                f"[AUDIT] Plan updated - User: {request.env.user.login} | "
                f"Plan: {plan.code} (ID: {plan.id})"
            )

            return request.make_json_response({
                'success': True,
                'plan': self._serialize_plan(plan)
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Update plan error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/plans/<int:plan_id>', type='http', auth='public', methods=['DELETE'], csrf=False)
    def archive_plan(self, plan_id):
        """Archive un plan tarifaire (soft delete)"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

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
            Plan = request.env['quelyos.subscription.plan'].sudo()
            plan = Plan.browse(plan_id)

            if not plan.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Plan non trouvé'},
                    headers=cors_headers,
                    status=404
                )

            plan.active = False

            _logger.info(
                f"[AUDIT] Plan archived - User: {request.env.user.login} | "
                f"Plan: {plan.code} (ID: {plan.id})"
            )

            return request.make_json_response({
                'success': True,
                'message': 'Plan archivé'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Archive plan error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    def _serialize_plan(self, plan):
        """Sérialise un plan pour l'API"""
        # Compter les subscribers
        Subscription = request.env['quelyos.subscription'].sudo()
        subscribers_count = Subscription.search_count([
            ('plan_id', '=', plan.id),
            ('state', 'in', ['active', 'trial'])
        ])

        return {
            'id': plan.id,
            'code': plan.code,
            'name': plan.name,
            'description': plan.description or '',
            'price_monthly': plan.price_monthly,
            'price_yearly': plan.price_yearly or plan.price_monthly * 12 * 0.8,
            'max_users': plan.max_users,
            'max_products': plan.max_products,
            'max_orders_per_year': plan.max_orders_per_year,
            'features': {
                'wishlist_enabled': getattr(plan, 'feature_wishlist', False),
                'reviews_enabled': getattr(plan, 'feature_reviews', False),
                'newsletter_enabled': getattr(plan, 'feature_newsletter', False),
                'product_comparison_enabled': getattr(plan, 'feature_comparison', False),
                'guest_checkout_enabled': getattr(plan, 'feature_guest_checkout', True),
                'api_access': getattr(plan, 'feature_api_access', False),
                'priority_support': getattr(plan, 'feature_priority_support', False),
                'custom_domain': getattr(plan, 'feature_custom_domain', False),
            },
            'group_ids': [{'id': g.id, 'name': g.name, 'full_name': g.full_name or g.name} for g in plan.group_ids],
            'is_active': plan.active,
            'subscribers_count': subscribers_count,
            'created_at': plan.create_date.isoformat() if plan.create_date else None,
        }

    # =========================================================================
    # SESSION MANAGEMENT
    # =========================================================================

    @http.route('/api/super-admin/sessions', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_sessions(self, user_id=None):
        """Liste les sessions actives (toutes ou par utilisateur)"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            AdminSession = request.env['quelyos.admin.session'].sudo()
            domain = [('is_active', '=', True)]
            if user_id:
                domain.append(('user_id', '=', int(user_id)))

            sessions = AdminSession.search(domain, order='last_activity desc', limit=100)

            data = [{
                'id': s.id,
                'user_id': s.user_id.id,
                'user_name': s.user_id.name,
                'user_login': s.user_id.login,
                'ip_address': s.ip_address,
                'device_info': s.device_info,
                'location': s.location or 'Unknown',
                'created_at': s.created_at.isoformat() if s.created_at else None,
                'last_activity': s.last_activity.isoformat() if s.last_activity else None,
                'is_current': s.user_id.id == request.env.user.id,
            } for s in sessions]

            return request.make_json_response({
                'success': True,
                'data': data,
                'total': len(data)
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List sessions error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/sessions/<int:session_id>/revoke', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def revoke_session(self, session_id):
        """Révoque une session spécifique"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            AdminSession = request.env['quelyos.admin.session'].sudo()
            session = AdminSession.browse(session_id)

            if not session.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Session non trouvée'},
                    headers=cors_headers, status=404
                )

            session.revoke(revoked_by_id=request.env.user.id, reason='Revoked by super admin')

            _logger.info(f"[AUDIT] Session revoked by {request.env.user.login}: {session_id}")

            return request.make_json_response({
                'success': True,
                'message': 'Session révoquée'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Revoke session error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/sessions/revoke-user/<int:target_user_id>', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def revoke_user_sessions(self, target_user_id):
        """Révoque toutes les sessions d'un utilisateur"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            AdminSession = request.env['quelyos.admin.session'].sudo()
            sessions = AdminSession.search([
                ('user_id', '=', target_user_id),
                ('is_active', '=', True)
            ])

            count = len(sessions)
            sessions.revoke(revoked_by_id=request.env.user.id, reason='All sessions revoked by super admin')

            _logger.info(f"[AUDIT] {count} sessions revoked for user {target_user_id} by {request.env.user.login}")

            return request.make_json_response({
                'success': True,
                'message': f'{count} sessions révoquées',
                'count': count
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Revoke user sessions error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    # =========================================================================
    # IP WHITELIST
    # =========================================================================

    @http.route('/api/super-admin/ip-whitelist', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_ip_whitelist(self):
        """Liste les règles IP whitelist"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            IPWhitelist = request.env['quelyos.ip.whitelist'].sudo()
            rules = IPWhitelist.search([], order='sequence, id')

            data = [{
                'id': r.id,
                'name': r.name,
                'ip_address': r.ip_address,
                'ip_type': r.ip_type,
                'is_active': r.is_active,
                'sequence': r.sequence,
                'user_ids': [{'id': u.id, 'name': u.name} for u in r.user_ids],
                'valid_from': r.valid_from.isoformat() if r.valid_from else None,
                'valid_until': r.valid_until.isoformat() if r.valid_until else None,
                'notes': r.notes,
            } for r in rules]

            # Statut global
            status = IPWhitelist.get_whitelist_status()

            return request.make_json_response({
                'success': True,
                'data': data,
                'status': status,
                'current_ip': request.httprequest.remote_addr
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List IP whitelist error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/ip-whitelist', type='http', auth='public', methods=['POST'], csrf=False)
    def create_ip_whitelist(self):
        """Crée une règle IP whitelist"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            body = request.get_json_data() or {}
            name = body.get('name')
            ip_address = body.get('ip_address')

            if not name or not ip_address:
                return request.make_json_response(
                    {'success': False, 'error': 'Nom et adresse IP requis'},
                    headers=cors_headers, status=400
                )

            IPWhitelist = request.env['quelyos.ip.whitelist'].sudo()
            rule = IPWhitelist.create({
                'name': name,
                'ip_address': ip_address,
                'is_active': body.get('is_active', True),
                'notes': body.get('notes'),
                'sequence': body.get('sequence', 10),
            })

            _logger.info(f"[AUDIT] IP whitelist rule created by {request.env.user.login}: {ip_address}")

            return request.make_json_response({
                'success': True,
                'id': rule.id,
                'message': 'Règle créée'
            }, headers=cors_headers)

        except ValueError as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=400
            )

        except Exception as e:
            _logger.error(f"Create IP whitelist error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/ip-whitelist/<int:rule_id>', type='http', auth='public', methods=['DELETE', 'OPTIONS'], csrf=False)
    def delete_ip_whitelist(self, rule_id):
        """Supprime une règle IP whitelist"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            IPWhitelist = request.env['quelyos.ip.whitelist'].sudo()
            rule = IPWhitelist.browse(rule_id)

            if not rule.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Règle non trouvée'},
                    headers=cors_headers, status=404
                )

            ip_address = rule.ip_address
            rule.unlink()

            _logger.info(f"[AUDIT] IP whitelist rule deleted by {request.env.user.login}: {ip_address}")

            return request.make_json_response({
                'success': True,
                'message': 'Règle supprimée'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Delete IP whitelist error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    # =========================================================================
    # API KEYS
    # =========================================================================

    @http.route('/api/super-admin/api-keys', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_api_keys(self):
        """Liste toutes les clés API"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            APIKey = request.env['quelyos.api.key'].sudo()
            keys = APIKey.search([], order='create_date desc')

            data = [{
                'id': k.id,
                'name': k.name,
                'key_prefix': k.key_prefix,
                'description': k.description,
                'user_id': k.user_id.id,
                'user_name': k.user_id.name,
                'tenant_id': k.tenant_id.id if k.tenant_id else None,
                'tenant_name': k.tenant_id.name if k.tenant_id else None,
                'scope': k.scope,
                'rate_limit': k.rate_limit,
                'is_active': k.is_active,
                'created_at': k.create_date.isoformat() if k.create_date else None,
                'expires_at': k.expires_at.isoformat() if k.expires_at else None,
                'last_used_at': k.last_used_at.isoformat() if k.last_used_at else None,
                'usage_count': k.usage_count,
            } for k in keys]

            return request.make_json_response({
                'success': True,
                'data': data,
                'total': len(data)
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List API keys error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/api-keys', type='http', auth='public', methods=['POST'], csrf=False)
    def create_api_key(self):
        """Crée une nouvelle clé API"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            body = request.get_json_data() or {}
            name = body.get('name')

            if not name:
                return request.make_json_response(
                    {'success': False, 'error': 'Nom requis'},
                    headers=cors_headers, status=400
                )

            APIKey = request.env['quelyos.api.key'].sudo()
            record, plain_key = APIKey.generate_key(
                name=name,
                user_id=body.get('user_id', request.env.user.id),
                scope=body.get('scope', 'read'),
                tenant_id=body.get('tenant_id'),
                expires_days=body.get('expires_days'),
                description=body.get('description'),
                rate_limit=body.get('rate_limit', 60),
                ip_restrictions=body.get('ip_restrictions'),
                allowed_endpoints=body.get('allowed_endpoints'),
            )

            _logger.info(f"[AUDIT] API key created by {request.env.user.login}: {record.key_prefix}...")

            return request.make_json_response({
                'success': True,
                'id': record.id,
                'key_prefix': record.key_prefix,
                'api_key': plain_key,  # IMPORTANT: retourné UNE SEULE FOIS
                'message': 'Clé API créée. Copiez-la maintenant, elle ne sera plus affichée!'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Create API key error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/api-keys/<int:key_id>/revoke', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def revoke_api_key(self, key_id):
        """Révoque une clé API"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            APIKey = request.env['quelyos.api.key'].sudo()
            key = APIKey.browse(key_id)

            if not key.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Clé non trouvée'},
                    headers=cors_headers, status=404
                )

            key.revoke()

            _logger.info(f"[AUDIT] API key revoked by {request.env.user.login}: {key.key_prefix}...")

            return request.make_json_response({
                'success': True,
                'message': 'Clé API révoquée'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Revoke API key error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    # =========================================================================
    # SECURITY ALERTS
    # =========================================================================

    @http.route('/api/super-admin/security/alerts', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_security_alerts(self, status=None, severity=None, limit=50):
        """Liste les alertes de sécurité"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            SecurityAlert = request.env['quelyos.security.alert'].sudo()
            alerts = SecurityAlert.get_recent_alerts(
                limit=int(limit),
                status=status,
                severity=severity
            )
            summary = SecurityAlert.get_alerts_summary(hours=24)

            return request.make_json_response({
                'success': True,
                'data': alerts,
                'summary': summary,
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List security alerts error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/security/alerts/<int:alert_id>/acknowledge', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def acknowledge_alert(self, alert_id):
        """Marque une alerte comme prise en compte"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            SecurityAlert = request.env['quelyos.security.alert'].sudo()
            alert = SecurityAlert.browse(alert_id)

            if not alert.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Alerte non trouvée'},
                    headers=cors_headers, status=404
                )

            alert.acknowledge()

            return request.make_json_response({
                'success': True,
                'message': 'Alerte prise en compte'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Acknowledge alert error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/security/alerts/<int:alert_id>/resolve', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def resolve_alert(self, alert_id):
        """Résout une alerte"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            body = request.get_json_data() or {}
            notes = body.get('notes')
            is_false_positive = body.get('is_false_positive', False)

            SecurityAlert = request.env['quelyos.security.alert'].sudo()
            alert = SecurityAlert.browse(alert_id)

            if not alert.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Alerte non trouvée'},
                    headers=cors_headers, status=404
                )

            alert.resolve(notes=notes, is_false_positive=is_false_positive)

            return request.make_json_response({
                'success': True,
                'message': 'Alerte résolue'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Resolve alert error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/security/summary', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def security_summary(self):
        """Résumé global de la sécurité"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            # Alertes
            SecurityAlert = request.env['quelyos.security.alert'].sudo()
            alerts_summary = SecurityAlert.get_alerts_summary(hours=24)

            # Sessions actives
            AdminSession = request.env['quelyos.admin.session'].sudo()
            active_sessions = AdminSession.search_count([('is_active', '=', True)])

            # IP Whitelist
            IPWhitelist = request.env['quelyos.ip.whitelist'].sudo()
            whitelist_status = IPWhitelist.get_whitelist_status()

            # API Keys
            APIKey = request.env['quelyos.api.key'].sudo()
            active_keys = APIKey.search_count([('is_active', '=', True)])
            keys_used_today = APIKey.search_count([
                ('is_active', '=', True),
                ('last_used_at', '>=', datetime.now().replace(hour=0, minute=0, second=0))
            ])

            return request.make_json_response({
                'success': True,
                'alerts': alerts_summary,
                'sessions': {
                    'active': active_sessions,
                },
                'ip_whitelist': whitelist_status,
                'api_keys': {
                    'active': active_keys,
                    'used_today': keys_used_today,
                },
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Security summary error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )
