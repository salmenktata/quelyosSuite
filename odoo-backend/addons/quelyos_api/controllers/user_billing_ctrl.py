# -*- coding: utf-8 -*-
"""
Contrôleur pour la facturation utilisateur (plans, subscription)
Endpoints: /api/ecommerce/billing/*
"""
import logging
from odoo import http
from odoo.http import request
from ..config import get_cors_headers
from .base import BaseController

_logger = logging.getLogger(__name__)


class UserBillingController(BaseController):
    """API pour la facturation et subscription utilisateur"""

    @http.route('/api/ecommerce/billing/plans', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_billing_plans(self):
        """
        Retourne la liste des plans disponibles

        Returns:
            {
                "success": true,
                "data": [
                    {
                        "id": "FREE",
                        "name": "Gratuit",
                        "description": "Pour démarrer",
                        "price": 0,
                        "priceYearly": 0,
                        "interval": "month",
                        "features": [...],
                        "limits": {
                            "users": 1,
                            "accounts": 2,
                            "transactionsPerMonth": 100
                        }
                    }
                ]
            }
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        try:
            # Plans statiques (à terme, les récupérer depuis quelyos.subscription.plan)
            plans = [
                {
                    'id': 'FREE',
                    'name': 'Gratuit',
                    'description': 'Pour démarrer avec les fonctionnalités de base',
                    'price': 0,
                    'priceYearly': 0,
                    'interval': 'month',
                    'badge': None,
                    'features': [
                        '1 utilisateur',
                        '2 comptes bancaires',
                        '100 transactions/mois',
                        'Catégories de base',
                        'Rapports simples'
                    ],
                    'limits': {
                        'users': 1,
                        'accounts': 2,
                        'transactionsPerMonth': 100
                    }
                },
                {
                    'id': 'PRO',
                    'name': 'Pro',
                    'description': 'Pour les TPE et freelances',
                    'price': 19,
                    'priceYearly': 190,
                    'interval': 'month',
                    'badge': 'Populaire',
                    'features': [
                        '3 utilisateurs',
                        '10 comptes bancaires',
                        'Transactions illimitées',
                        'Catégories personnalisées',
                        'Rapports avancés (DSO, BFR, EBITDA)',
                        'Budgets et prévisions',
                        'Export Excel/PDF',
                        'Support email prioritaire'
                    ],
                    'limits': {
                        'users': 3,
                        'accounts': 10,
                        'transactionsPerMonth': -1
                    }
                },
                {
                    'id': 'EXPERT',
                    'name': 'Expert',
                    'description': 'Pour les PME et cabinets comptables',
                    'price': 49,
                    'priceYearly': 490,
                    'interval': 'month',
                    'badge': None,
                    'features': [
                        'Utilisateurs illimités',
                        'Comptes illimités',
                        'Transactions illimitées',
                        'Multi-entreprises',
                        'Consolidation financière',
                        'Scénarios et simulations',
                        'Intégrations bancaires automatiques',
                        'API et webhooks',
                        'Support téléphone + email',
                        'Onboarding personnalisé'
                    ],
                    'limits': {
                        'users': -1,
                        'accounts': -1,
                        'transactionsPerMonth': -1
                    }
                }
            ]

            return request.make_json_response(
                {
                    'success': True,
                    'data': plans
                },
                headers=cors_headers
            )

        except Exception as e:
            _logger.error(f"Error fetching billing plans: {e}", exc_info=True)
            return request.make_json_response(
                {
                    'success': False,
                    'error': 'Server error',
                    'error_code': 'SERVER_ERROR'
                },
                headers=cors_headers,
                status=500
            )

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
