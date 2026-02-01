# -*- coding: utf-8 -*-
import logging
import json
from datetime import datetime, timedelta
from odoo import http
from odoo.http import request
from .super_admin import SuperAdminController
from ..config import get_cors_headers

_logger = logging.getLogger(__name__)


class TenantAdminController(SuperAdminController):
    """Contrôleur super-admin pour la gestion des tenants"""

    @http.route('/api/super-admin/tenants', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_tenants(self):
        """Liste tous les tenants actifs (pour dropdown backup)"""
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
            tenants = Tenant.search([('active', '=', True)], order='name')

            data = {
                'success': True,
                'data': [
                    {
                        'id': t.id,
                        'code': t.code,
                        'name': t.name,
                        'domain': t.domain,
                        'company_id': t.company_id.id,
                    }
                    for t in tenants
                ],
                'total': len(tenants),
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List tenants error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

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

    @http.route('/api/super-admin/tenants/<int:tenant_id>/plan', type='http', auth='public', methods=['PUT', 'OPTIONS'], csrf=False)
    def change_tenant_plan(self, tenant_id):
        """Change le plan d'un tenant (upgrade/downgrade)"""
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
            new_plan_code = data.get('plan_code')

            if not new_plan_code:
                return request.make_json_response(
                    {'success': False, 'error': 'plan_code requis'},
                    headers=cors_headers,
                    status=400
                )

            Tenant = request.env['quelyos.tenant'].sudo()
            Plan = request.env['quelyos.subscription.plan'].sudo()

            tenant = Tenant.browse(tenant_id)
            if not tenant.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Tenant non trouvé'},
                    headers=cors_headers,
                    status=404
                )

            if not tenant.subscription_id:
                return request.make_json_response(
                    {'success': False, 'error': 'Tenant sans abonnement'},
                    headers=cors_headers,
                    status=400
                )

            new_plan = Plan.search([('code', '=', new_plan_code)], limit=1)
            if not new_plan:
                return request.make_json_response(
                    {'success': False, 'error': f'Plan "{new_plan_code}" non trouvé'},
                    headers=cors_headers,
                    status=404
                )

            old_plan = tenant.subscription_id.plan_id
            old_mrr = tenant.subscription_id.mrr

            # Vérifier les quotas si downgrade
            quota_warnings = []
            if new_plan.max_users < tenant.users_count and new_plan.max_users > 0:
                quota_warnings.append(f"Utilisateurs: {tenant.users_count}/{new_plan.max_users}")
            if new_plan.max_products < tenant.products_count and new_plan.max_products > 0:
                quota_warnings.append(f"Produits: {tenant.products_count}/{new_plan.max_products}")
            if new_plan.max_orders_per_year < tenant.orders_count and new_plan.max_orders_per_year > 0:
                quota_warnings.append(f"Commandes: {tenant.orders_count}/{new_plan.max_orders_per_year}")

            # Mettre à jour le plan de la subscription
            tenant.subscription_id.write({
                'plan_id': new_plan.id,
            })

            # Recalculer MRR
            tenant.subscription_id._compute_mrr()
            new_mrr = tenant.subscription_id.mrr

            # Déterminer si upgrade ou downgrade
            is_upgrade = new_plan.price_monthly > old_plan.price_monthly

            # Log audit
            _logger.info(
                f"[AUDIT] Plan changed - User: {request.env.user.login} | "
                f"Tenant: {tenant.name} (ID: {tenant_id}) | "
                f"Old plan: {old_plan.code} -> New plan: {new_plan.code} | "
                f"MRR: {old_mrr} -> {new_mrr}"
            )

            return request.make_json_response({
                'success': True,
                'message': f'Plan {"upgradé" if is_upgrade else "downgradé"} avec succès',
                'tenant': self._serialize_tenant(tenant),
                'plan_change': {
                    'old_plan': old_plan.code,
                    'new_plan': new_plan.code,
                    'old_mrr': old_mrr,
                    'new_mrr': new_mrr,
                    'is_upgrade': is_upgrade,
                },
                'quota_warnings': quota_warnings,
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Change plan error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

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
            'partner_id': tenant.company_id.partner_id.id if tenant.company_id and tenant.company_id.partner_id else None,
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

    @http.route('/api/super-admin/tenants', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_tenants(self):
        """Liste tous les tenants actifs (pour dropdown backup)"""
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
            tenants = Tenant.search([('active', '=', True)], order='name')

            data = {
                'success': True,
                'data': [
                    {
                        'id': t.id,
                        'code': t.code,
                        'name': t.name,
                        'domain': t.domain,
                        'company_id': t.company_id.id,
                    }
                    for t in tenants
                ],
                'total': len(tenants),
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List tenants error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )
