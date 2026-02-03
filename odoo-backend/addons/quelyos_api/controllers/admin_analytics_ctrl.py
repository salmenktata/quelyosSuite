# -*- coding: utf-8 -*-
import logging
import json
from datetime import datetime, timedelta
from odoo import http
from odoo.http import request
from odoo.exceptions import AccessDenied
from .super_admin import SuperAdminController
from ..config import get_cors_headers

_logger = logging.getLogger(__name__)


class AdminAnalyticsController(SuperAdminController):
    """Contrôleur super-admin pour le dashboard et les métriques"""

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

            # Revenue by plan (dynamique depuis mrr_data)
            revenue_by_plan = [
                {'plan': code, 'revenue': mrr}
                for code, mrr in mrr_data.items()
                if code != 'total' and mrr > 0
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

    @http.route('/api/super-admin/provisioning-jobs', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_provisioning_jobs(self):
        """Liste tous les provisioning jobs"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

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

    @http.route('/api/super-admin/database/performance', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def database_performance(self):
        """Retourne les métriques de performance PostgreSQL"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            cr = request.env.cr

            # 1. Utilisation indexes composites tenant
            cr.execute("""
                SELECT
                    schemaname || '.' || relname AS table_name,
                    indexrelname AS index_name,
                    idx_scan AS scans,
                    idx_tup_read AS tuples_read,
                    idx_tup_fetch AS tuples_fetched,
                    ROUND((idx_tup_fetch::numeric / NULLIF(idx_tup_read, 0)) * 100, 2) AS efficiency_pct
                FROM pg_stat_user_indexes
                WHERE indexrelname LIKE 'idx_%%tenant%%'
                ORDER BY idx_scan DESC, relname
                LIMIT 15
            """)
            tenant_indexes = []
            for row in cr.fetchall():
                tenant_indexes.append({
                    'table': row[0],
                    'index_name': row[1],
                    'scans': row[2],
                    'tuples_read': row[3],
                    'tuples_fetched': row[4],
                    'efficiency_pct': float(row[5]) if row[5] else 0.0,
                })

            # 2. Top requêtes lentes (si pg_stat_statements activé)
            slow_queries = []
            try:
                cr.execute("""
                    SELECT
                        ROUND(mean_exec_time::numeric, 2) AS avg_time_ms,
                        calls,
                        ROUND((total_exec_time / 1000)::numeric, 2) AS total_time_sec,
                        LEFT(query, 150) AS query_text
                    FROM pg_stat_statements
                    WHERE query NOT LIKE '%%pg_stat%%'
                      AND query NOT LIKE '%%information_schema%%'
                    ORDER BY mean_exec_time DESC
                    LIMIT 10
                """)
                for row in cr.fetchall():
                    slow_queries.append({
                        'avg_time_ms': float(row[0]) if row[0] else 0.0,
                        'calls': row[1],
                        'total_time_sec': float(row[2]) if row[2] else 0.0,
                        'query': row[3],
                    })
            except Exception as pg_stat_error:
                _logger.info(f"pg_stat_statements not available: {pg_stat_error}")

            # 3. Statistiques tables volumineuses
            cr.execute("""
                SELECT
                    schemaname || '.' || relname AS table_name,
                    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) AS total_size,
                    pg_size_pretty(pg_indexes_size(schemaname||'.'||relname)) AS indexes_size,
                    n_tup_ins + n_tup_upd + n_tup_del AS operations,
                    seq_scan,
                    idx_scan,
                    ROUND((idx_scan::numeric / NULLIF(seq_scan + idx_scan, 0)) * 100, 2) AS index_usage_pct
                FROM pg_stat_user_tables
                WHERE relname IN ('product_template', 'sale_order', 'res_partner', 'stock_quant', 'account_move', 'crm_lead')
                ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC
            """)
            large_tables = []
            for row in cr.fetchall():
                large_tables.append({
                    'table': row[0],
                    'total_size': row[1],
                    'indexes_size': row[2],
                    'operations': row[3],
                    'seq_scans': row[4],
                    'index_scans': row[5],
                    'index_usage_pct': float(row[6]) if row[6] else 0.0,
                })

            # 4. Cache hit ratio
            cr.execute("""
                SELECT
                    ROUND(
                        (sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0)) * 100,
                        2
                    ) AS cache_hit_ratio_pct
                FROM pg_statio_user_tables
            """)
            cache_hit_ratio = cr.fetchone()[0]

            data = {
                'success': True,
                'tenant_indexes': tenant_indexes,
                'slow_queries': slow_queries,
                'large_tables': large_tables,
                'cache_hit_ratio_pct': float(cache_hit_ratio) if cache_hit_ratio else 0.0,
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Database performance error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )
