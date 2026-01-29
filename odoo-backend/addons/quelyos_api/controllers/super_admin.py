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
import redis

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

    # =========================================================================
    # DASHBOARD METRICS
    # =========================================================================

    @http.route('/api/super-admin/dashboard/metrics', type='json', auth='user', methods=['GET'], csrf=False)
    def dashboard_metrics(self):
        """Retourne les KPIs globaux pour le dashboard"""
        self._check_super_admin()

        Subscription = request.env['quelyos.subscription']
        Tenant = request.env['quelyos.tenant']

        # MRR & ARR
        mrr_data = Subscription.get_mrr_breakdown()
        mrr = mrr_data.get('total', 0)
        arr = mrr * 12

        # Active subscriptions
        active_subs = Subscription.search_count([('state', '=', 'active')])

        # Churn rate (dernier mois)
        churn_analysis = Subscription.get_churn_analysis(months=1)
        churn_rate = churn_analysis[0]['churn_rate'] if churn_analysis else 0

        # MRR history (12 mois)
        mrr_history = self._get_mrr_history(12)

        # Revenue by plan
        revenue_by_plan = [
            {'plan': 'starter', 'revenue': mrr_data.get('starter', 0)},
            {'plan': 'pro', 'revenue': mrr_data.get('pro', 0)},
            {'plan': 'enterprise', 'revenue': mrr_data.get('enterprise', 0)},
        ]

        # Top customers par MRR
        top_customers = Tenant.search([], order='subscription_id.mrr desc', limit=10)

        # At-risk customers (past_due ou quota > 90%)
        at_risk = Tenant.search([
            '|',
            ('subscription_state', '=', 'past_due'),
            ('users_usage_percentage', '>', 90)
        ], limit=10)

        # Recent subscriptions
        recent_subs = Subscription.search([], order='create_date desc', limit=5)

        return {
            'mrr': mrr,
            'arr': arr,
            'active_subscriptions': active_subs,
            'churn_rate': churn_rate,
            'mrr_history': mrr_history,
            'revenue_by_plan': revenue_by_plan,
            'top_customers': [self._serialize_tenant(t) for t in top_customers],
            'at_risk_customers': [self._serialize_tenant(t) for t in at_risk],
            'recent_subscriptions': [self._serialize_subscription(s) for s in recent_subs],
        }

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

    @http.route('/api/super-admin/tenants', type='json', auth='user', methods=['GET'], csrf=False)
    def list_tenants(self, search=None, plan=None, state=None, page=1, limit=50):
        """Liste tous les tenants avec filtres"""
        self._check_super_admin()

        domain = []

        if search:
            domain.append('|')
            domain.append(('name', 'ilike', search))
            domain.append(('domain', 'ilike', search))

        if plan:
            domain.append(('subscription_id.plan_id.code', '=', plan))

        if state:
            domain.append(('subscription_state', '=', state))

        Tenant = request.env['quelyos.tenant']
        total = Tenant.search_count(domain)
        offset = (page - 1) * limit
        tenants = Tenant.search(domain, limit=limit, offset=offset, order='create_date desc')

        return {
            'data': [self._serialize_tenant(t) for t in tenants],
            'total': total,
            'page': page,
            'limit': limit,
        }

    # =========================================================================
    # SUBSCRIPTIONS
    # =========================================================================

    @http.route('/api/super-admin/subscriptions', type='json', auth='user', methods=['GET'], csrf=False)
    def list_subscriptions(self, state=None, plan=None):
        """Liste globale des subscriptions"""
        self._check_super_admin()

        domain = []
        if state:
            domain.append(('state', '=', state))
        if plan:
            domain.append(('plan_id.code', '=', plan))

        Subscription = request.env['quelyos.subscription']
        subscriptions = Subscription.search(domain, order='mrr desc')

        return [self._serialize_subscription(s) for s in subscriptions]

    @http.route('/api/super-admin/subscriptions/mrr-breakdown', type='json', auth='user', methods=['GET'], csrf=False)
    def mrr_breakdown(self):
        """MRR par plan"""
        self._check_super_admin()
        return request.env['quelyos.subscription'].get_mrr_breakdown()

    @http.route('/api/super-admin/subscriptions/churn-analysis', type='json', auth='user', methods=['GET'], csrf=False)
    def churn_analysis(self, months=12):
        """Analyse churn sur N mois"""
        self._check_super_admin()
        return request.env['quelyos.subscription'].get_churn_analysis(months=months)

    # =========================================================================
    # INVOICES & TRANSACTIONS
    # =========================================================================

    @http.route('/api/super-admin/invoices', type='json', auth='user', methods=['GET'], csrf=False)
    def list_invoices(self):
        """Liste toutes les factures"""
        self._check_super_admin()

        invoices = request.env['account.move'].search([
            ('tenant_id', '!=', False),
            ('move_type', '=', 'out_invoice')
        ], order='invoice_date desc', limit=200)

        return [{
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
        } for inv in invoices]

    @http.route('/api/super-admin/invoices/summary', type='json', auth='user', methods=['GET'], csrf=False)
    def invoices_summary(self):
        """Summary facturation mois en cours"""
        self._check_super_admin()

        today = datetime.today()
        month_start = today.replace(day=1)

        Invoice = request.env['account.move']
        Transaction = request.env['payment.transaction']

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

        return {
            'total_revenue': total_revenue,
            'unpaid_invoices': unpaid_count,
            'unpaid_amount': unpaid_amount,
            'success_rate': success_rate,
            'failed_transactions': failed_txs,
        }

    @http.route('/api/super-admin/transactions', type='json', auth='user', methods=['GET'], csrf=False)
    def list_transactions(self):
        """Liste toutes les transactions"""
        self._check_super_admin()

        transactions = request.env['payment.transaction'].search([
            ('tenant_id', '!=', False)
        ], order='create_date desc', limit=200)

        return [{
            'id': tx.id,
            'reference': tx.reference,
            'tenant_id': tx.tenant_id.id,
            'tenant_name': tx.tenant_id.name,
            'amount': tx.amount,
            'state': tx.state,
            'provider': tx.provider_id.name if tx.provider_id else 'N/A',
            'date': tx.create_date.isoformat() if tx.create_date else None,
            'error_message': tx.state_message if tx.state == 'error' else None,
        } for tx in transactions]

    # =========================================================================
    # PROVISIONING & MONITORING
    # =========================================================================

    @http.route('/api/super-admin/provisioning-jobs', type='json', auth='user', methods=['GET'], csrf=False)
    def list_provisioning_jobs(self):
        """Liste tous les provisioning jobs"""
        self._check_super_admin()

        jobs = request.env['provisioning.job'].search([], order='create_date desc', limit=50)

        return [{
            'id': job.id,
            'tenant_id': job.tenant_id.id,
            'tenant_name': job.tenant_id.name,
            'job_type': job.job_type,
            'state': job.state,
            'progress': job.progress,
            'started_at': job.started_at.isoformat() if job.started_at else None,
            'completed_at': job.completed_at.isoformat() if job.completed_at else None,
            'duration_seconds': job.duration_seconds,
            'error_message': job.error_message,
            'steps_completed': job.steps_completed.split(',') if job.steps_completed else [],
        } for job in jobs]

    @http.route('/api/super-admin/system/health', type='json', auth='user', methods=['GET'], csrf=False)
    def system_health(self):
        """État des services système"""
        self._check_super_admin()

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

        # Redis (simulé - TODO: implémenter vrai check)
        redis_status = 'up'
        redis_memory_mb = 128

        # Stripe (vérifier dernière webhook)
        stripe_status = 'up'
        last_webhook = request.env['payment.transaction'].search(
            [('provider_id.code', '=', 'stripe')], order='create_date desc', limit=1
        )
        last_webhook_received = last_webhook.create_date.isoformat() if last_webhook else None

        return {
            'backend_status': backend_status,
            'backend_response_time_ms': backend_response_time,
            'postgres_status': postgres_status,
            'postgres_connections': postgres_connections,
            'redis_status': redis_status,
            'redis_memory_mb': redis_memory_mb,
            'stripe_status': stripe_status,
            'last_webhook_received': last_webhook_received,
        }

    # =========================================================================
    # HELPERS
    # =========================================================================

    def _serialize_tenant(self, tenant):
        """Sérialise un tenant pour l'API"""
        return {
            'id': tenant.id,
            'name': tenant.name,
            'domain': tenant.domain,
            'logo': tenant.logo_url if hasattr(tenant, 'logo_url') else None,
            'slogan': tenant.slogan,
            'subscription_id': tenant.subscription_id.id,
            'subscription_state': tenant.subscription_state,
            'plan_code': tenant.subscription_id.plan_id.code,
            'plan_name': tenant.subscription_id.plan_id.name,
            'users_count': tenant.users_count,
            'products_count': tenant.products_count,
            'orders_count': tenant.orders_count,
            'max_users': tenant.subscription_id.max_users,
            'max_products': tenant.subscription_id.max_products,
            'max_orders_per_year': tenant.subscription_id.max_orders_per_year,
            'mrr': tenant.subscription_id.mrr,
            'features': {
                'wishlist_enabled': tenant.wishlist_enabled,
                'reviews_enabled': tenant.reviews_enabled,
                'newsletter_enabled': tenant.newsletter_enabled,
                'product_comparison_enabled': tenant.product_comparison_enabled,
                'guest_checkout_enabled': tenant.guest_checkout_enabled,
            },
            'provisioning_job_id': tenant.provisioning_job_id.id if tenant.provisioning_job_id else None,
            'provisioning_status': tenant.provisioning_job_id.state if tenant.provisioning_job_id else None,
            'created_at': tenant.create_date.isoformat() if tenant.create_date else None,
        }

    def _serialize_subscription(self, subscription):
        """Sérialise une subscription pour l'API"""
        return {
            'id': subscription.id,
            'tenant_id': subscription.tenant_id.id,
            'tenant_name': subscription.tenant_id.name,
            'tenant_domain': subscription.tenant_id.domain,
            'plan_id': subscription.plan_id.id,
            'plan_code': subscription.plan_id.code,
            'plan_name': subscription.plan_id.name,
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
            'users_usage': subscription.tenant_id.users_count,
            'max_users': subscription.max_users,
            'products_usage': subscription.tenant_id.products_count,
            'max_products': subscription.max_products,
            'orders_usage': subscription.tenant_id.orders_count,
            'max_orders_per_year': subscription.max_orders_per_year,
        }
