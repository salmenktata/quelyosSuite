# -*- coding: utf-8 -*-
"""
Contrôleur Stripe Billing pour Quelyos Suite.

Endpoints:
- POST /api/stripe/create-checkout-session : Crée une session Stripe Checkout
- POST /api/stripe/create-portal-session : Crée un lien vers le Customer Portal
- POST /api/stripe/webhooks : Réception des webhooks Stripe

Webhooks gérés:
- checkout.session.completed → Active l'abonnement
- invoice.paid → Renouvelle l'abonnement
- invoice.payment_failed → Marque past_due
- customer.subscription.updated → Met à jour le plan
- customer.subscription.deleted → Annule l'abonnement
"""

import os
import json
import hmac
import hashlib
import logging
from datetime import datetime, timedelta

from odoo import http, _
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)

# Configuration Stripe via variables d'environnement
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', '')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY', '')

# Essayer d'importer stripe
try:
    import stripe
    stripe.api_key = STRIPE_SECRET_KEY
    STRIPE_AVAILABLE = bool(STRIPE_SECRET_KEY)
except ImportError:
    STRIPE_AVAILABLE = False
    _logger.warning("stripe library not installed. Run: pip install stripe")


class StripeBillingController(BaseController):
    """Contrôleur pour l'intégration Stripe Billing"""

    # ═══════════════════════════════════════════════════════════════════════════
    # CHECKOUT SESSION
    # ═══════════════════════════════════════════════════════════════════════════

    @http.route(
        '/api/stripe/create-checkout-session',
        type='http',
        auth='public',
        methods=['POST', 'OPTIONS'],
        csrf=False,
    )
    def create_checkout_session(self, **kwargs):
        """
        Crée une session Stripe Checkout pour un nouveau client.

        Body JSON:
            {
                "plan_code": "pro",
                "billing_cycle": "monthly" | "yearly",
                "tenant_code": "ma-boutique",
                "customer_email": "client@example.com",
                "success_url": "https://...",
                "cancel_url": "https://..."
            }

        Returns:
            {"success": true, "checkout_url": "https://checkout.stripe.com/..."}
        """
        from ..config import get_cors_headers
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=cors_headers)

        if not STRIPE_AVAILABLE:
            return request.make_json_response({
                'success': False,
                'error': 'Stripe non configuré',
                'error_code': 'STRIPE_NOT_CONFIGURED'
            }, status=503, headers=cors_headers)

        try:
            data = json.loads(request.httprequest.data.decode('utf-8'))

            # Validation
            plan_code = data.get('plan_code', 'starter')
            billing_cycle = data.get('billing_cycle', 'monthly')
            tenant_code = data.get('tenant_code')
            customer_email = data.get('customer_email')
            success_url = data.get('success_url', 'https://quelyos.com/signup/success')
            cancel_url = data.get('cancel_url', 'https://quelyos.com/pricing')

            if not tenant_code:
                return request.make_json_response({
                    'success': False,
                    'error': 'tenant_code requis',
                    'error_code': 'MISSING_TENANT_CODE'
                }, status=400, headers=cors_headers)

            # Trouver le plan
            plan = request.env['quelyos.subscription.plan'].sudo().search([
                ('code', '=', plan_code),
                ('active', '=', True)
            ], limit=1)

            if not plan:
                return request.make_json_response({
                    'success': False,
                    'error': 'Plan non trouvé',
                    'error_code': 'PLAN_NOT_FOUND'
                }, status=404, headers=cors_headers)

            # Récupérer le price_id Stripe
            price_id = plan.stripe_price_id_yearly if billing_cycle == 'yearly' else plan.stripe_price_id_monthly

            if not price_id:
                return request.make_json_response({
                    'success': False,
                    'error': f'Prix Stripe non configuré pour le plan {plan.name}',
                    'error_code': 'STRIPE_PRICE_NOT_CONFIGURED'
                }, status=500, headers=cors_headers)

            # Trouver ou créer le tenant
            tenant = request.env['quelyos.tenant'].sudo().search([
                ('code', '=', tenant_code)
            ], limit=1)

            # Créer ou récupérer le customer Stripe
            stripe_customer_id = None
            if tenant and tenant.stripe_customer_id:
                stripe_customer_id = tenant.stripe_customer_id
            elif customer_email:
                # Créer un nouveau customer Stripe
                customer = stripe.Customer.create(
                    email=customer_email,
                    metadata={
                        'tenant_code': tenant_code,
                        'source': 'quelyos_checkout'
                    }
                )
                stripe_customer_id = customer.id

                # Sauvegarder l'ID dans le tenant si existe
                if tenant:
                    tenant.write({'stripe_customer_id': stripe_customer_id})

            # Créer la session Checkout
            checkout_params = {
                'payment_method_types': ['card'],
                'line_items': [{
                    'price': price_id,
                    'quantity': 1,
                }],
                'mode': 'subscription',
                'success_url': f"{success_url}?session_id={{CHECKOUT_SESSION_ID}}",
                'cancel_url': cancel_url,
                'metadata': {
                    'tenant_code': tenant_code,
                    'plan_code': plan_code,
                    'billing_cycle': billing_cycle,
                },
                'subscription_data': {
                    'metadata': {
                        'tenant_code': tenant_code,
                        'plan_code': plan_code,
                    },
                    'trial_period_days': 14,  # 14 jours d'essai
                },
                'allow_promotion_codes': True,
            }

            if stripe_customer_id:
                checkout_params['customer'] = stripe_customer_id
            elif customer_email:
                checkout_params['customer_email'] = customer_email

            session = stripe.checkout.Session.create(**checkout_params)

            _logger.info(f"Stripe Checkout session created: {session.id} for tenant {tenant_code}")

            return request.make_json_response({
                'success': True,
                'checkout_url': session.url,
                'session_id': session.id,
            }, headers=cors_headers)

        except stripe.error.StripeError as e:
            _logger.error(f"Stripe error creating checkout: {e}")
            return request.make_json_response({
                'success': False,
                'error': str(e.user_message) if hasattr(e, 'user_message') else 'Erreur Stripe',
                'error_code': 'STRIPE_ERROR'
            }, status=400, headers=cors_headers)
        except Exception as e:
            _logger.error(f"Error creating checkout session: {e}")
            return request.make_json_response({
                'success': False,
                'error': 'Erreur serveur',
                'error_code': 'SERVER_ERROR'
            }, status=500, headers=cors_headers)

    # ═══════════════════════════════════════════════════════════════════════════
    # CUSTOMER PORTAL
    # ═══════════════════════════════════════════════════════════════════════════

    @http.route(
        '/api/stripe/create-portal-session',
        type='http',
        auth='public',
        methods=['POST', 'OPTIONS'],
        csrf=False,
    )
    def create_portal_session(self, **kwargs):
        """
        Crée un lien vers le Stripe Customer Portal.
        Permet au client de gérer son abonnement.

        Body JSON:
            {
                "tenant_code": "ma-boutique",
                "return_url": "https://..."
            }

        Returns:
            {"success": true, "portal_url": "https://billing.stripe.com/..."}
        """
        from ..config import get_cors_headers
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=cors_headers)

        if not STRIPE_AVAILABLE:
            return request.make_json_response({
                'success': False,
                'error': 'Stripe non configuré'
            }, status=503, headers=cors_headers)

        try:
            # Authentification requise
            error = self._authenticate_from_header()
            if error:
                return request.make_json_response(error, status=401, headers=cors_headers)

            data = json.loads(request.httprequest.data.decode('utf-8'))
            tenant_code = data.get('tenant_code')
            return_url = data.get('return_url', 'https://quelyos.com/settings/billing')

            if not tenant_code:
                return request.make_json_response({
                    'success': False,
                    'error': 'tenant_code requis'
                }, status=400, headers=cors_headers)

            # Trouver le tenant et son customer Stripe
            tenant = request.env['quelyos.tenant'].sudo().search([
                ('code', '=', tenant_code)
            ], limit=1)

            if not tenant or not tenant.stripe_customer_id:
                return request.make_json_response({
                    'success': False,
                    'error': 'Aucun abonnement Stripe trouvé'
                }, status=404, headers=cors_headers)

            # Créer la session portal
            session = stripe.billing_portal.Session.create(
                customer=tenant.stripe_customer_id,
                return_url=return_url,
            )

            return request.make_json_response({
                'success': True,
                'portal_url': session.url,
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Error creating portal session: {e}")
            return request.make_json_response({
                'success': False,
                'error': 'Erreur serveur'
            }, status=500, headers=cors_headers)

    # ═══════════════════════════════════════════════════════════════════════════
    # WEBHOOKS
    # ═══════════════════════════════════════════════════════════════════════════

    @http.route(
        '/api/stripe/webhooks',
        type='http',
        auth='public',
        methods=['POST'],
        csrf=False,
    )
    def stripe_webhooks(self, **kwargs):
        """
        Réception des webhooks Stripe.

        Events gérés:
        - checkout.session.completed
        - invoice.paid
        - invoice.payment_failed
        - customer.subscription.updated
        - customer.subscription.deleted
        """
        if not STRIPE_AVAILABLE:
            return request.make_response('Stripe not configured', status=503)

        payload = request.httprequest.data
        sig_header = request.httprequest.headers.get('Stripe-Signature', '')

        try:
            # Vérifier la signature du webhook
            if STRIPE_WEBHOOK_SECRET:
                event = stripe.Webhook.construct_event(
                    payload, sig_header, STRIPE_WEBHOOK_SECRET
                )
            else:
                # En dev sans secret, parser directement
                event = json.loads(payload)
                _logger.warning("Webhook signature not verified (STRIPE_WEBHOOK_SECRET not set)")

            event_type = event.get('type') if isinstance(event, dict) else event.type
            event_data = event.get('data', {}).get('object', {}) if isinstance(event, dict) else event.data.object

            _logger.info(f"Stripe webhook received: {event_type}")

            # Router vers le handler approprié
            handlers = {
                'checkout.session.completed': self._handle_checkout_completed,
                'invoice.paid': self._handle_invoice_paid,
                'invoice.payment_failed': self._handle_invoice_failed,
                'customer.subscription.updated': self._handle_subscription_updated,
                'customer.subscription.deleted': self._handle_subscription_deleted,
            }

            handler = handlers.get(event_type)
            if handler:
                handler(event_data)
            else:
                _logger.debug(f"Unhandled webhook event: {event_type}")

            return request.make_response('OK', status=200)

        except stripe.error.SignatureVerificationError as e:
            _logger.error(f"Webhook signature verification failed: {e}")
            return request.make_response('Invalid signature', status=400)
        except Exception as e:
            _logger.error(f"Webhook error: {e}")
            return request.make_response('Webhook error', status=500)

    # ═══════════════════════════════════════════════════════════════════════════
    # WEBHOOK HANDLERS
    # ═══════════════════════════════════════════════════════════════════════════

    def _handle_checkout_completed(self, session):
        """
        Gère checkout.session.completed.
        Active l'abonnement après paiement réussi.
        """
        try:
            metadata = session.get('metadata', {})
            tenant_code = metadata.get('tenant_code')
            plan_code = metadata.get('plan_code')
            stripe_subscription_id = session.get('subscription')
            stripe_customer_id = session.get('customer')

            if not tenant_code:
                _logger.warning("checkout.session.completed: No tenant_code in metadata")
                return

            # Trouver le tenant
            tenant = request.env['quelyos.tenant'].sudo().search([
                ('code', '=', tenant_code)
            ], limit=1)

            if not tenant:
                _logger.warning(f"checkout.session.completed: Tenant not found: {tenant_code}")
                return

            # Mettre à jour le tenant avec l'ID customer Stripe
            tenant.write({'stripe_customer_id': stripe_customer_id})

            # Mettre à jour l'abonnement
            if tenant.subscription_id:
                tenant.subscription_id.write({
                    'stripe_subscription_id': stripe_subscription_id,
                    'stripe_customer_id': stripe_customer_id,
                    'state': 'active',
                })
                tenant.subscription_id.message_post(
                    body=_("Paiement Stripe confirmé. Abonnement activé.")
                )

            # Activer le tenant si en provisioning
            if tenant.status == 'provisioning':
                tenant.action_activate()

            _logger.info(f"Checkout completed for tenant {tenant_code}")

        except Exception as e:
            _logger.error(f"Error handling checkout.session.completed: {e}")

    def _handle_invoice_paid(self, invoice):
        """
        Gère invoice.paid.
        Renouvelle l'abonnement.
        """
        try:
            subscription_id = invoice.get('subscription')
            if not subscription_id:
                return

            # Trouver l'abonnement par stripe_subscription_id
            subscription = request.env['quelyos.subscription'].sudo().search([
                ('stripe_subscription_id', '=', subscription_id)
            ], limit=1)

            if subscription:
                # Calculer la prochaine date de facturation
                billing_cycle = subscription.billing_cycle
                if billing_cycle == 'yearly':
                    next_date = datetime.now() + timedelta(days=365)
                else:
                    next_date = datetime.now() + timedelta(days=30)

                subscription.write({
                    'state': 'active',
                    'next_billing_date': next_date.date(),
                })
                subscription.message_post(body=_("Facture payée. Abonnement renouvelé."))
                _logger.info(f"Invoice paid for subscription {subscription.name}")

        except Exception as e:
            _logger.error(f"Error handling invoice.paid: {e}")

    def _handle_invoice_failed(self, invoice):
        """
        Gère invoice.payment_failed.
        Marque l'abonnement comme past_due.
        """
        try:
            subscription_id = invoice.get('subscription')
            if not subscription_id:
                return

            subscription = request.env['quelyos.subscription'].sudo().search([
                ('stripe_subscription_id', '=', subscription_id)
            ], limit=1)

            if subscription:
                subscription.action_mark_past_due()
                _logger.info(f"Invoice failed for subscription {subscription.name}")

        except Exception as e:
            _logger.error(f"Error handling invoice.payment_failed: {e}")

    def _handle_subscription_updated(self, stripe_sub):
        """
        Gère customer.subscription.updated.
        Met à jour le plan si changé.
        """
        try:
            subscription_id = stripe_sub.get('id')
            status = stripe_sub.get('status')

            subscription = request.env['quelyos.subscription'].sudo().search([
                ('stripe_subscription_id', '=', subscription_id)
            ], limit=1)

            if subscription:
                # Mapper le statut Stripe vers notre statut
                status_map = {
                    'active': 'active',
                    'trialing': 'trial',
                    'past_due': 'past_due',
                    'canceled': 'cancelled',
                    'unpaid': 'past_due',
                }
                new_state = status_map.get(status, subscription.state)

                if new_state != subscription.state:
                    subscription.write({'state': new_state})
                    subscription.message_post(body=_(f"Statut Stripe mis à jour: {status}"))

                _logger.info(f"Subscription updated: {subscription.name} -> {new_state}")

        except Exception as e:
            _logger.error(f"Error handling customer.subscription.updated: {e}")

    def _handle_subscription_deleted(self, stripe_sub):
        """
        Gère customer.subscription.deleted.
        Annule l'abonnement.
        """
        try:
            subscription_id = stripe_sub.get('id')

            subscription = request.env['quelyos.subscription'].sudo().search([
                ('stripe_subscription_id', '=', subscription_id)
            ], limit=1)

            if subscription:
                subscription.action_cancel()
                _logger.info(f"Subscription cancelled: {subscription.name}")

        except Exception as e:
            _logger.error(f"Error handling customer.subscription.deleted: {e}")

    # ═══════════════════════════════════════════════════════════════════════════
    # UTILITAIRES
    # ═══════════════════════════════════════════════════════════════════════════

    @http.route(
        '/api/stripe/config',
        type='http',
        auth='public',
        methods=['GET', 'OPTIONS'],
        csrf=False,
    )
    def get_stripe_config(self, **kwargs):
        """
        Retourne la clé publique Stripe pour le frontend.
        """
        from ..config import get_cors_headers
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=cors_headers)

        return request.make_json_response({
            'publishable_key': STRIPE_PUBLISHABLE_KEY,
            'available': STRIPE_AVAILABLE,
        }, headers=cors_headers)
