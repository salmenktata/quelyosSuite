# -*- coding: utf-8 -*-
import json
import logging
from odoo import http, _
from odoo.http import request
from odoo.exceptions import ValidationError, AccessError
from .base import BaseController

_logger = logging.getLogger(__name__)


class SubscriptionController(BaseController):
    """Controller pour la gestion des abonnements Quelyos"""

    # ==================== ADMIN ENDPOINTS ====================

    @http.route('/api/ecommerce/subscription/admin/list', type='json', auth='user', methods=['POST'], csrf=False)
    def admin_list_subscriptions(self, limit=20, offset=0, **kwargs):
        """
        Liste tous les abonnements (backoffice admin)
        PROTECTION: Finance User minimum requis

        :param limit: Nombre de résultats par page
        :param offset: Décalage pour la pagination
        :return: Liste des abonnements avec stats
        """
        # Vérifier permissions Finance User minimum
        error = self._check_any_group('group_quelyos_finance_user', 'group_quelyos_finance_manager')
        if error:
            return error

        try:
            # SUDO justifié : Après vérification groupe Finance ci-dessus.
            # sudo() nécessaire pour lister tous les abonnements sans restriction ACL
            # (backoffice finance doit voir tous les subs, pas seulement ceux de son compte).
            Subscription = request.env['quelyos.subscription'].sudo()

            # Recherche avec pagination
            subscriptions = Subscription.search([], limit=limit, offset=offset, order='create_date desc')
            total_count = Subscription.search_count([])

            # Formater les données pour le frontend
            data = []
            for sub in subscriptions:
                data.append({
                    'id': sub.id,
                    'name': sub.name,
                    'partner_name': sub.partner_id.name,
                    'partner_email': sub.partner_id.email or '',
                    'plan_name': sub.plan_id.name,
                    'plan_code': sub.plan_code,
                    'state': sub.state,
                    'billing_cycle': sub.billing_cycle,
                    'start_date': sub.start_date.isoformat() if sub.start_date else None,
                    'next_billing_date': sub.next_billing_date.isoformat() if sub.next_billing_date else None,
                    'current_users_count': sub.current_users_count,
                    'max_users': sub.max_users,
                    'current_products_count': sub.current_products_count,
                    'max_products': sub.max_products,
                    'current_orders_count': sub.current_orders_count,
                    'max_orders_per_year': sub.max_orders_per_year,
                })

            return {
                'success': True,
                'data': data,
                'total': total_count,
            }
        except Exception as e:
            _logger.error("Erreur lors de la récupération des abonnements: %s", str(e), exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue',
                'data': [],
                'total': 0,
            }

    @http.route('/api/ecommerce/subscription/admin/<int:subscription_id>', type='json', auth='user', methods=['POST'], csrf=False)
    def admin_get_subscription(self, subscription_id, **kwargs):
        """
        Détails d'un abonnement (backoffice admin)
        PROTECTION: Finance User minimum requis

        :param subscription_id: ID de l'abonnement
        :return: Détails complets de l'abonnement
        """
        # Vérifier permissions Finance User minimum
        error = self._check_any_group('group_quelyos_finance_user', 'group_quelyos_finance_manager')
        if error:
            return error

        try:
            # SUDO justifié : Après vérification groupe Finance ci-dessus.
            # sudo() nécessaire pour accéder aux détails complets de l'abonnement
            # sans restriction ACL (backoffice finance doit voir toutes les infos).
            subscription = request.env['quelyos.subscription'].sudo().browse(subscription_id)

            if not subscription.exists():
                return {'success': False, 'error': _('Abonnement non trouvé')}

            # Mettre à jour les compteurs d'utilisation
            subscription.update_usage_counts()

            return {
                'success': True,
                'data': {
                    'id': subscription.id,
                    'name': subscription.name,
                    'partner': {
                        'id': subscription.partner_id.id,
                        'name': subscription.partner_id.name,
                        'email': subscription.partner_id.email or '',
                    },
                    'plan': {
                        'id': subscription.plan_id.id,
                        'name': subscription.plan_id.name,
                        'code': subscription.plan_code,
                    },
                    'state': subscription.state,
                    'billing_cycle': subscription.billing_cycle,
                    'start_date': subscription.start_date.isoformat() if subscription.start_date else None,
                    'trial_end_date': subscription.trial_end_date.isoformat() if subscription.trial_end_date else None,
                    'next_billing_date': subscription.next_billing_date.isoformat() if subscription.next_billing_date else None,
                    'end_date': subscription.end_date.isoformat() if subscription.end_date else None,
                    'usage': {
                        'users': {
                            'current': subscription.current_users_count,
                            'limit': subscription.max_users,
                            'percentage': subscription.users_usage_percentage,
                            'is_limit_reached': subscription.current_users_count >= subscription.max_users,
                        },
                        'products': {
                            'current': subscription.current_products_count,
                            'limit': subscription.max_products,
                            'percentage': subscription.products_usage_percentage,
                            'is_limit_reached': subscription.current_products_count >= subscription.max_products,
                        },
                        'orders': {
                            'current': subscription.current_orders_count,
                            'limit': subscription.max_orders_per_year,
                            'percentage': subscription.orders_usage_percentage,
                            'is_limit_reached': subscription.current_orders_count >= subscription.max_orders_per_year,
                        },
                    },
                    'stripe_subscription_id': subscription.stripe_subscription_id or '',
                    'stripe_customer_id': subscription.stripe_customer_id or '',
                },
            }
        except Exception as e:
            _logger.error("Erreur lors de la récupération de l'abonnement %d: %s", subscription_id, str(e), exc_info=True)
            return {'success': False, 'error': 'Une erreur est survenue'}

    # ==================== PUBLIC ENDPOINTS ====================

    @http.route('/api/ecommerce/subscription/plans', type='json', auth='public', methods=['POST'], csrf=False)
    def get_subscription_plans(self, **kwargs):
        """
        Liste tous les plans d'abonnement disponibles

        :return: Liste des plans
        """
        try:
            plans = request.env['quelyos.subscription.plan'].sudo().search([
                ('active', '=', True)
            ], order='display_order, id')

            data = []
            for plan in plans:
                data.append({
                    'id': plan.id,
                    'name': plan.name,
                    'code': plan.code,
                    'price_monthly': plan.price_monthly,
                    'price_yearly': plan.price_yearly,
                    'max_users': plan.max_users,
                    'max_products': plan.max_products,
                    'max_orders_per_year': plan.max_orders_per_year,
                    'support_level': plan.support_level,
                    'features': plan.get_features_list(),
                    'description': plan.description or '',
                    'is_popular': plan.is_popular,
                    'display_order': plan.display_order,
                })

            return {'success': True, 'data': data}
        except Exception as e:
            _logger.error("Erreur lors de la récupération des plans: %s", str(e), exc_info=True)
            return {'success': False, 'error': 'Une erreur est survenue', 'data': []}

    @http.route('/api/ecommerce/subscription/current', type='json', auth='user', methods=['POST'], csrf=False)
    def get_current_subscription(self, **kwargs):
        """
        Récupère l'abonnement actif de l'utilisateur connecté

        :return: Abonnement actif ou null
        """
        try:
            user = request.env.user
            partner = user.partner_id

            subscription = request.env['quelyos.subscription'].sudo().search([
                ('partner_id', '=', partner.id),
                ('state', 'in', ['trial', 'active'])
            ], limit=1, order='create_date desc')

            if not subscription:
                return {'success': True, 'data': None}

            # Mettre à jour les compteurs
            subscription.update_usage_counts()

            return {
                'success': True,
                'data': {
                    'id': subscription.id,
                    'name': subscription.name,
                    'partner': {
                        'id': subscription.partner_id.id,
                        'name': subscription.partner_id.name,
                        'email': subscription.partner_id.email or '',
                    },
                    'plan': {
                        'id': subscription.plan_id.id,
                        'name': subscription.plan_id.name,
                        'code': subscription.plan_code,
                    },
                    'state': subscription.state,
                    'billing_cycle': subscription.billing_cycle,
                    'start_date': subscription.start_date.isoformat() if subscription.start_date else None,
                    'trial_end_date': subscription.trial_end_date.isoformat() if subscription.trial_end_date else None,
                    'next_billing_date': subscription.next_billing_date.isoformat() if subscription.next_billing_date else None,
                    'usage': {
                        'users': subscription.check_quota('users'),
                        'products': subscription.check_quota('products'),
                        'orders': subscription.check_quota('orders'),
                    },
                },
            }
        except Exception as e:
            _logger.error("Erreur lors de la récupération de l'abonnement actuel: %s", str(e), exc_info=True)
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/subscription/create', type='json', auth='user', methods=['POST'], csrf=False)
    def create_subscription(self, plan_id, billing_cycle='monthly', **kwargs):
        """
        Créer un nouvel abonnement pour l'utilisateur connecté

        :param plan_id: ID du plan choisi
        :param billing_cycle: 'monthly' ou 'yearly'
        :return: Abonnement créé
        """
        try:
            user = request.env.user
            partner = user.partner_id

            # Vérifier qu'il n'existe pas déjà un abonnement actif
            existing = request.env['quelyos.subscription'].sudo().search([
                ('partner_id', '=', partner.id),
                ('state', 'in', ['trial', 'active'])
            ], limit=1)

            if existing:
                return {
                    'success': False,
                    'error': _('Vous avez déjà un abonnement actif.')
                }

            # Créer l'abonnement
            plan = request.env['quelyos.subscription.plan'].sudo().browse(plan_id)
            if not plan.exists():
                return {'success': False, 'error': _('Plan introuvable.')}

            subscription = request.env['quelyos.subscription'].sudo().create({
                'partner_id': partner.id,
                'plan_id': plan_id,
                'billing_cycle': billing_cycle,
                'state': 'trial',  # Commence toujours en trial
            })

            return {
                'success': True,
                'data': {'id': subscription.id, 'name': subscription.name},
                'message': _('Abonnement créé avec succès.')
            }
        except Exception as e:
            _logger.error("Erreur lors de la création de l'abonnement: %s", str(e), exc_info=True)
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/subscription/check-quota', type='json', auth='user', methods=['POST'], csrf=False)
    def check_quota(self, resource_type, **kwargs):
        """
        Vérifier le quota d'une ressource pour l'utilisateur connecté

        :param resource_type: 'users', 'products' ou 'orders'
        :return: Informations sur le quota
        """
        try:
            user = request.env.user
            partner = user.partner_id

            subscription = request.env['quelyos.subscription'].sudo().search([
                ('partner_id', '=', partner.id),
                ('state', 'in', ['trial', 'active'])
            ], limit=1)

            if not subscription:
                return {
                    'success': False,
                    'error': _('Aucun abonnement actif trouvé.')
                }

            quota_info = subscription.check_quota(resource_type)

            return {'success': True, 'data': quota_info}
        except ValidationError as e:
            return {'success': False, 'error': 'Une erreur est survenue'}
        except Exception as e:
            _logger.error("Erreur lors de la vérification du quota: %s", str(e), exc_info=True)
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/subscription/cancel', type='json', auth='user', methods=['POST'], csrf=False)
    def cancel_subscription(self, **kwargs):
        """
        Annuler l'abonnement de l'utilisateur connecté

        :return: Confirmation
        """
        try:
            user = request.env.user
            partner = user.partner_id

            subscription = request.env['quelyos.subscription'].sudo().search([
                ('partner_id', '=', partner.id),
                ('state', 'in', ['trial', 'active'])
            ], limit=1)

            if not subscription:
                return {
                    'success': False,
                    'error': _('Aucun abonnement actif trouvé.')
                }

            subscription.action_cancel()

            return {
                'success': True,
                'message': _('Abonnement annulé avec succès.')
            }
        except Exception as e:
            _logger.error("Erreur lors de l'annulation de l'abonnement: %s", str(e), exc_info=True)
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/subscription/upgrade', type='json', auth='user', methods=['POST'], csrf=False)
    def upgrade_subscription(self, plan_id, **kwargs):
        """
        Mettre à niveau l'abonnement vers un plan supérieur

        :param plan_id: ID du nouveau plan
        :return: Confirmation
        """
        try:
            user = request.env.user
            partner = user.partner_id

            subscription = request.env['quelyos.subscription'].sudo().search([
                ('partner_id', '=', partner.id),
                ('state', 'in', ['trial', 'active'])
            ], limit=1)

            if not subscription:
                return {
                    'success': False,
                    'error': _('Aucun abonnement actif trouvé.')
                }

            plan = request.env['quelyos.subscription.plan'].sudo().browse(plan_id)
            if not plan.exists():
                return {'success': False, 'error': _('Plan introuvable.')}

            # Mettre à jour le plan et les limites
            subscription.write({
                'plan_id': plan_id,
                'max_users': plan.max_users,
                'max_products': plan.max_products,
                'max_orders_per_year': plan.max_orders_per_year,
            })

            return {
                'success': True,
                'message': _('Abonnement mis à niveau vers %s.') % plan.name
            }
        except Exception as e:
            _logger.error("Erreur lors du upgrade de l'abonnement: %s", str(e), exc_info=True)
            return {'success': False, 'error': 'Une erreur est survenue'}
