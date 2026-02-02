# -*- coding: utf-8 -*-
"""
Contrôleur pour la facturation utilisateur (plans, subscription)
Endpoints: /api/ecommerce/billing/*
"""
import logging
import json
from odoo import http
from odoo.http import request
from ..config import get_cors_headers
from .base import BaseController

_logger = logging.getLogger(__name__)


class UserBillingController(BaseController):
    """API pour la facturation et subscription utilisateur"""

    # ─── Endpoint public : grille tarifaire modulaire ──────────────────

    @http.route('/api/public/pricing', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_public_pricing(self):
        """Grille tarifaire modulaire pour la vitrine (configurateur)"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        try:
            Plan = request.env['quelyos.subscription.plan'].sudo()
            pricing_grid = Plan.get_pricing_grid()

            return request.make_json_response(
                {
                    'success': True,
                    'data': pricing_grid
                },
                headers=cors_headers
            )

        except Exception as e:
            _logger.error(f"Error fetching pricing grid: {e}", exc_info=True)
            return request.make_json_response(
                {
                    'success': False,
                    'error': 'Server error',
                    'error_code': 'SERVER_ERROR'
                },
                headers=cors_headers,
                status=500
            )

    # ─── Endpoint public legacy (backward compat) ────────────────────

    @http.route('/api/public/plans', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_public_plans(self, plan_type=None):
        """Plans publics pour la vitrine (backward compat + lecture dynamique depuis DB)"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        try:
            domain = [('active', '=', True)]
            if plan_type:
                domain.append(('plan_type', '=', plan_type))

            plans = request.env['quelyos.subscription.plan'].sudo().search(
                domain, order='display_order, id'
            )

            return request.make_json_response(
                {
                    'success': True,
                    'data': [self._serialize_public_plan(p) for p in plans]
                },
                headers=cors_headers
            )

        except Exception as e:
            _logger.error(f"Error fetching public plans: {e}", exc_info=True)
            return request.make_json_response(
                {
                    'success': False,
                    'error': 'Server error',
                    'error_code': 'SERVER_ERROR'
                },
                headers=cors_headers,
                status=500
            )

    def _serialize_public_plan(self, plan):
        """Sérialisation publique d'un plan (sans champs admin sensibles)"""
        try:
            features_marketing = json.loads(plan.features_marketing or '[]')
        except (json.JSONDecodeError, TypeError):
            features_marketing = []

        price = plan.price_monthly
        annual_price = None
        if price > 0 and plan.yearly_discount_pct:
            annual_price = round(price * (1 - plan.yearly_discount_pct / 100))

        result = {
            'id': plan.code,
            'name': plan.name,
            'description': plan.description or '',
            'price': price,
            'originalPrice': plan.original_price or None,
            'period': '/mois' if price > 0 else '',
            'annualPrice': annual_price,
            'yearlyDiscountPct': plan.yearly_discount_pct,
            'highlight': plan.is_popular,
            'badge': plan.badge_text or None,
            'cta': plan.cta_text or 'Essai gratuit',
            'href': plan.cta_href or '/register',
            'icon': plan.icon_name or 'Layers',
            'color': plan.color_theme or 'emerald',
            'features': features_marketing,
            'limits': {
                'users': plan.max_users,
                'products': plan.max_products,
                'ordersPerYear': plan.max_orders_per_year,
            },
            'trialDays': plan.trial_days,
            'planType': plan.plan_type,
        }

        # Champs additionnels pour modules
        if plan.plan_type == 'module':
            result['moduleKey'] = plan.module_key
            if plan.limit_name:
                result['moduleLimits'] = {
                    'name': plan.limit_name,
                    'included': plan.limit_included,
                    'surplusPrice': plan.surplus_price,
                    'surplusUnit': plan.surplus_unit,
                }

        # Champs additionnels pour solutions métier
        if plan.plan_type == 'solution':
            try:
                result['modules'] = json.loads(plan.solution_modules or '[]')
            except (json.JSONDecodeError, TypeError):
                result['modules'] = []
            result['solutionSlug'] = plan.solution_slug

        # Champs additionnels pour pack users
        if plan.plan_type == 'user_pack':
            result['packSize'] = plan.pack_size

        return result

    # ─── Ancien endpoint (compatibilité finance) ─────────────────────

    @http.route('/api/ecommerce/billing/plans', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_billing_plans(self):
        """Alias compatibilité : redirige vers plans finance dynamiques"""
        return self.get_public_plans(plan_type='finance')

    @http.route('/api/ecommerce/billing/subscription', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_user_subscription(self):
        """
        Retourne la subscription actuelle de l'utilisateur

        Returns:
            {
                "success": true,
                "data": {
                    "plan": "FREE",
                    "status": "active",
                    "trial": false,
                    "trialEnd": null,
                    "currentPeriodEnd": "2024-02-15T00:00:00Z",
                    "cancelAtPeriodEnd": false,
                    "amount": 0,
                    "currency": "EUR",
                    "interval": "month"
                }
            }
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        # Vérifier authentification
        if not request.session.uid:
            return request.make_json_response(
                {
                    'success': False,
                    'error': 'Authentication required',
                    'error_code': 'AUTH_REQUIRED'
                },
                headers=cors_headers,
                status=401
            )

        try:
            user = request.env.user

            # Chercher la subscription de l'utilisateur/tenant
            # Utiliser le tenant_id si disponible, sinon créer une subscription par défaut
            Subscription = request.env['quelyos.subscription']

            # Trouver le tenant de l'utilisateur
            tenant = None
            if hasattr(user, 'tenant_id') and user.tenant_id:
                tenant = user.tenant_id
            elif hasattr(user, 'company_id') and user.company_id:
                # Chercher le tenant via la company
                Tenant = request.env['quelyos.tenant']
                tenant = Tenant.sudo().search([('company_id', '=', user.company_id.id)], limit=1)

            subscription_data = {
                'plan': 'FREE',
                'status': 'active',
                'trial': False,
                'trialEnd': None,
                'currentPeriodEnd': None,
                'cancelAtPeriodEnd': False,
                'amount': 0,
                'currency': 'EUR',
                'interval': 'month'
            }

            if tenant:
                # Chercher la subscription du tenant
                subscription = Subscription.sudo().search([('tenant_id', '=', tenant.id)], limit=1)

                if subscription:
                    # Mapper les données de subscription
                    plan_code = subscription.plan_id.code if subscription.plan_id else 'FREE'

                    subscription_data = {
                        'plan': plan_code.upper(),
                        'status': subscription.state or 'active',
                        'trial': subscription.trial or False,
                        'trialEnd': subscription.trial_end_date.isoformat() if subscription.trial_end_date else None,
                        'currentPeriodEnd': subscription.current_period_end.isoformat() if subscription.current_period_end else None,
                        'cancelAtPeriodEnd': subscription.cancel_at_period_end or False,
                        'amount': subscription.mrr or 0,
                        'currency': subscription.currency_id.name if subscription.currency_id else 'EUR',
                        'interval': 'month'
                    }

            return request.make_json_response(
                {
                    'success': True,
                    'data': subscription_data
                },
                headers=cors_headers
            )

        except Exception as e:
            _logger.error(f"Error fetching user subscription: {e}", exc_info=True)
            return request.make_json_response(
                {
                    'success': False,
                    'error': 'Server error',
                    'error_code': 'SERVER_ERROR'
                },
                headers=cors_headers,
                status=500
            )

    @http.route('/api/ecommerce/billing/create-checkout', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def create_checkout_session(self):
        """
        Crée une session de checkout Stripe pour upgrade de plan

        Body:
            {
                "planId": "PRO",
                "billingInterval": "month"
            }

        Returns:
            {
                "success": true,
                "data": {
                    "sessionId": "cs_test_...",
                    "url": "https://checkout.stripe.com/..."
                }
            }
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        # Vérifier authentification
        if not request.session.uid:
            return request.make_json_response(
                {
                    'success': False,
                    'error': 'Authentication required',
                    'error_code': 'AUTH_REQUIRED'
                },
                headers=cors_headers,
                status=401
            )

        try:
            params = self._get_json_params()
            plan_id = params.get('planId')
            billing_interval = params.get('billingInterval', 'month')

            if not plan_id:
                return request.make_json_response(
                    {
                        'success': False,
                        'error': 'Plan ID is required',
                        'error_code': 'MISSING_PLAN_ID'
                    },
                    headers=cors_headers,
                    status=400
                )

            # TODO: Intégration Stripe réelle
            # Pour l'instant, retourner une réponse mock
            _logger.info(f"Checkout session requested for plan {plan_id} ({billing_interval})")

            return request.make_json_response(
                {
                    'success': False,
                    'error': 'Stripe integration not yet implemented',
                    'error_code': 'NOT_IMPLEMENTED'
                },
                headers=cors_headers,
                status=501
            )

        except Exception as e:
            _logger.error(f"Error creating checkout session: {e}", exc_info=True)
            return request.make_json_response(
                {
                    'success': False,
                    'error': 'Server error',
                    'error_code': 'SERVER_ERROR'
                },
                headers=cors_headers,
                status=500
            )

    # Routes alias pour compatibilité (sans préfixe /api/ecommerce)
    @http.route('/billing/plans', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_billing_plans_compat(self):
        """Alias pour /api/ecommerce/billing/plans"""
        return self.get_billing_plans()

    @http.route('/billing/subscription', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_user_subscription_compat(self):
        """Alias pour /api/ecommerce/billing/subscription"""
        return self.get_user_subscription()

    @http.route('/billing/create-checkout-session', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def create_checkout_session_compat(self):
        """Alias pour /api/ecommerce/billing/create-checkout"""
        return self.create_checkout_session()
