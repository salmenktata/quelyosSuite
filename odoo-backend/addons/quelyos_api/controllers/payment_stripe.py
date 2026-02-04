# -*- coding: utf-8 -*-
"""
Controller Stripe Payments - Paiements marketplace thèmes premium

Endpoints :
- POST /api/themes/<id>/stripe/create-payment-intent : Créer Payment Intent
- POST /api/stripe/webhook                            : Webhook confirmations
"""

import json
import logging
import stripe
from odoo import http, fields
from odoo.http import request

_logger = logging.getLogger(__name__)


class StripePaymentController(http.Controller):
    """Controller pour paiements Stripe marketplace thèmes"""

    def _get_stripe_secret_key(self):
        """Récupérer clé secrète Stripe depuis paramètres système"""
        return request.env['ir.config_parameter'].sudo().get_param('payment.stripe.secret_key')

    def _get_stripe_webhook_secret(self):
        """Récupérer webhook secret Stripe"""
        return request.env['ir.config_parameter'].sudo().get_param('payment.stripe.webhook_secret')

    # ═══════════════════════════════════════════════════════════════════════════
    # CRÉATION PAYMENT INTENT
    # ═══════════════════════════════════════════════════════════════════════════

    @http.route('/api/themes/<int:theme_id>/stripe/create-payment-intent',
                auth='user', type='jsonrpc', methods=['POST'], csrf=False)
    def create_theme_payment_intent(self, theme_id, tenant_id):
        """
        Créer un Payment Intent Stripe pour achat thème premium
        (AUTHENTIFICATION REQUISE)

        Args:
            theme_id (int): ID du thème à acheter
            tenant_id (int): ID du tenant acheteur

        Returns:
            dict: {
                success: bool,
                client_secret: str,  # Pour Stripe Elements
                payment_intent_id: str,
                amount: float,
                currency: str
            }
        """
        try:
            # Récupérer clé Stripe
            stripe_key = self._get_stripe_secret_key()
            if not stripe_key:
                return {
                    'success': False,
                    'error': 'Stripe not configured'
                }

            stripe.api_key = stripe_key

            # Récupérer thème
            theme = request.env['quelyos.theme'].sudo().browse(theme_id)
            if not theme.exists():
                return {
                    'success': False,
                    'error': 'Theme not found'
                }

            # Vérifier que le thème est premium
            if not theme.is_premium or theme.price <= 0:
                return {
                    'success': False,
                    'error': 'Theme is not premium'
                }

            # Vérifier si déjà acheté
            existing_purchase = request.env['quelyos.theme.purchase'].sudo().search([
                ('submission_id.theme_id', '=', theme_id),
                ('tenant_id', '=', tenant_id),
                ('status', '=', 'completed'),
            ], limit=1)

            if existing_purchase:
                return {
                    'success': False,
                    'error': 'Theme already purchased'
                }

            # Créer Payment Intent Stripe
            amount_cents = int(theme.price * 100)  # Convertir en centimes

            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='usd',  # TODO: Récupérer devise depuis tenant
                metadata={
                    'theme_id': theme_id,
                    'theme_name': theme.name,
                    'tenant_id': tenant_id,
                    'user_id': request.env.user.id,
                    'designer_id': theme.designer_id.id if theme.designer_id else None,
                },
                description=f'Theme: {theme.name}',
            )

            # Créer purchase en attente
            purchase = request.env['quelyos.theme.purchase'].sudo().create({
                'submission_id': theme.designer_id.submission_ids.filtered(
                    lambda s: s.theme_id == theme
                ).id if theme.designer_id else False,
                'tenant_id': tenant_id,
                'user_id': request.env.user.id,
                'amount': theme.price,
                'payment_method': 'stripe',
                'status': 'pending',
                'stripe_payment_intent_id': payment_intent.id,
            })

            _logger.info(
                f"Payment Intent created: {payment_intent.id} "
                f"for theme {theme.name} (purchase {purchase.id})"
            )

            return {
                'success': True,
                'client_secret': payment_intent.client_secret,
                'payment_intent_id': payment_intent.id,
                'purchase_id': purchase.id,
                'amount': theme.price,
                'currency': 'USD',
            }

        except stripe.error.StripeError as e:
            _logger.error(f"Stripe error creating payment intent: {str(e)}")
            return {
                'success': False,
                'error': f'Stripe error: {str(e)}'
            }
        except Exception as e:
            _logger.error(f"Error creating payment intent: {str(e)}")
            return {
                'success': False,
                'error': 'Internal server error'
            }

    # ═══════════════════════════════════════════════════════════════════════════
    # WEBHOOK STRIPE
    # ═══════════════════════════════════════════════════════════════════════════

    @http.route('/api/stripe/webhook', auth='none', type='http', methods=['POST'], csrf=False)
    def stripe_webhook(self, **kwargs):
        """
        Webhook Stripe pour événements paiement
        (PUBLIC - Authentifié via signature Stripe)

        Événements gérés :
        - payment_intent.succeeded : Paiement réussi
        - payment_intent.payment_failed : Paiement échoué
        """
        payload = request.httprequest.data
        sig_header = request.httprequest.headers.get('Stripe-Signature')

        # Récupérer clés Stripe
        stripe_key = self._get_stripe_secret_key()
        webhook_secret = self._get_stripe_webhook_secret()

        if not stripe_key or not webhook_secret:
            _logger.error("Stripe webhook: Missing configuration")
            return request.make_response('Webhook configuration error', status=400)

        stripe.api_key = stripe_key

        try:
            # Vérifier signature Stripe
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except ValueError:
            _logger.error("Stripe webhook: Invalid payload")
            return request.make_response('Invalid payload', status=400)
        except stripe.error.SignatureVerificationError:
            _logger.error("Stripe webhook: Invalid signature")
            return request.make_response('Invalid signature', status=400)

        # ═════════════════════════════════════════════════════════════════════
        # IDEMPOTENCE : Vérifier si event déjà traité
        # ═════════════════════════════════════════════════════════════════════
        event_id = event['id']
        event_type = event['type']

        StripeEvent = request.env['quelyos.stripe_event'].sudo()

        # Vérifier idempotence
        if StripeEvent.is_event_processed(event_id):
            _logger.info(f"Stripe event {event_id} already processed (idempotence)")
            return request.make_response('Success (idempotent)', status=200)

        # Créer record event (garantit idempotence via contrainte unique)
        try:
            stripe_event = StripeEvent.create_from_webhook(event)
        except Exception as e:
            _logger.error(f"Error creating Stripe event record: {e}")
            # Si échec création (ex: duplicate key), event déjà traité
            return request.make_response('Success (duplicate)', status=200)

        # Traiter événement de manière asynchrone
        # TODO: Utiliser queue job pour parallélisation
        # Pour l'instant, traitement synchrone
        stripe_event.action_process_event()

        _logger.info(f"Stripe webhook processed: {event_type} (event {event_id})")

        return request.make_response('Success', status=200)

    def _handle_payment_success(self, payment_intent):
        """
        Gérer succès paiement Stripe

        Actions :
        1. Mettre à jour purchase status → completed
        2. Enregistrer revenue pour designer (70/30 split)
        3. Logger transaction
        """
        try:
            payment_intent_id = payment_intent['id']
            metadata = payment_intent.get('metadata', {})

            # Récupérer purchase
            purchase = request.env['quelyos.theme.purchase'].sudo().search([
                ('stripe_payment_intent_id', '=', payment_intent_id),
            ], limit=1)

            if not purchase:
                _logger.warning(f"Purchase not found for Payment Intent {payment_intent_id}")
                return

            # Vérifier si déjà traité
            if purchase.status == 'completed':
                _logger.info(f"Purchase {purchase.id} already completed")
                return

            # Mettre à jour purchase
            purchase.write({
                'status': 'completed',
                'completion_date': fields.Datetime.now(),
            })

            # Si thème a un designer, créer revenue
            if purchase.submission_id and purchase.submission_id.designer_id:
                designer = purchase.submission_id.designer_id
                amount = purchase.amount

                # Calculer split (70% designer, 30% platform)
                designer_amount = amount * (designer.revenue_share_rate / 100)
                platform_amount = amount - designer_amount

                request.env['quelyos.theme.revenue'].sudo().create({
                    'purchase_id': purchase.id,
                    'designer_id': designer.id,
                    'submission_id': purchase.submission_id.id,
                    'amount': amount,
                    'designer_share': designer_amount,
                    'platform_share': platform_amount,
                    'status': 'pending',  # En attente de payout
                })

                _logger.info(
                    f"Revenue created for purchase {purchase.id}: "
                    f"${designer_amount:.2f} designer, ${platform_amount:.2f} platform"
                )

            _logger.info(f"Purchase {purchase.id} completed successfully")

        except Exception as e:
            _logger.error(f"Error handling payment success: {str(e)}")

    def _handle_payment_failed(self, payment_intent):
        """Gérer échec paiement"""
        try:
            payment_intent_id = payment_intent['id']

            purchase = request.env['quelyos.theme.purchase'].sudo().search([
                ('stripe_payment_intent_id', '=', payment_intent_id),
            ], limit=1)

            if purchase:
                purchase.write({
                    'status': 'failed',
                })
                _logger.warning(f"Purchase {purchase.id} failed")

        except Exception as e:
            _logger.error(f"Error handling payment failure: {str(e)}")
