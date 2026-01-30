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

            data = {
                'success': True,
                'mrr': total_mrr,
                'arr': total_mrr * 12,
                'active_subscriptions': active_subs,
                'churn_rate': churn_rate,
                'mrr_history': self._get_mrr_history(6),
                'revenue_by_plan': revenue_by_plan,
                'top_customers': top_customers,
                'at_risk_customers': [],
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

        jobs = request.env['quelyos.provisioning.job'].sudo().search([], order='create_date desc', limit=50)

        return [{
            'id': job.id,
            'tenant_id': job.tenant_id.id if job.tenant_id else None,
            'tenant_name': job.tenant_id.name if job.tenant_id else None,
            'state': job.state,
            'progress': job.progress,
            'current_step': job.current_step,
            'started_at': job.started_at.isoformat() if job.started_at else None,
            'completed_at': job.completed_at.isoformat() if job.completed_at else None,
            'error_message': job.error_message,
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

        # Redis (check via socket TCP)
        import socket
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
                # Estimation mémoire (pas de vraie valeur sans client Redis)
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

            data = {
                'success': True,
                'data': [self._serialize_backup(b) for b in backups],
                'total': len(backups),
                'last_auto_backup': last_auto,
                'next_scheduled_backup': next_scheduled,
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List backups error: {e}")
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
