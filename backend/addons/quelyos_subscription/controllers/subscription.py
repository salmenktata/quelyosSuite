# -*- coding: utf-8 -*-

from odoo import http
from odoo.http import request
from datetime import datetime, timedelta
import json
import logging

_logger = logging.getLogger(__name__)


class SubscriptionController(http.Controller):
    """Controller pour la gestion des abonnements via API REST."""

    @http.route('/api/ecommerce/subscription/plans', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_subscription_plans(self, **kwargs):
        """
        Liste tous les plans d'abonnement disponibles.

        Returns:
            dict: {
                'success': bool,
                'data': list of plans
            }
        """
        try:
            plans = request.env['quelyos.subscription.plan'].sudo().search([
                ('active', '=', True)
            ], order='display_order, name')

            plans_data = []
            for plan in plans:
                features = plan.get_features_list()

                plans_data.append({
                    'id': plan.id,
                    'name': plan.name,
                    'code': plan.code,
                    'price_monthly': plan.price_monthly,
                    'price_yearly': plan.price_yearly,
                    'max_users': plan.max_users,
                    'max_products': plan.max_products,
                    'max_orders_per_year': plan.max_orders_per_year,
                    'support_level': plan.support_level,
                    'features': features,
                    'description': plan.description or '',
                    'is_popular': plan.is_popular,
                    'display_order': plan.display_order
                })

            return {'success': True, 'data': plans_data}

        except Exception as e:
            _logger.error(f"Error getting subscription plans: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/subscription/current', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def get_current_subscription(self, **kwargs):
        """
        Retourne l'abonnement actuel de l'utilisateur connecté.

        Returns:
            dict: {
                'success': bool,
                'data': subscription info with usage
            }
        """
        try:
            user = request.env.user
            company = user.company_id

            subscription = request.env['quelyos.subscription'].search([
                ('company_id', '=', company.id),
                ('state', 'in', ['trial', 'active', 'past_due'])
            ], limit=1)

            if not subscription:
                return {'success': False, 'error': 'No active subscription found'}

            # Vérifier les quotas
            users_limit = subscription.check_quota_limit('users')
            products_limit = subscription.check_quota_limit('products')
            orders_limit = subscription.check_quota_limit('orders')

            return {
                'success': True,
                'data': {
                    'id': subscription.id,
                    'name': subscription.name,
                    'partner': {
                        'id': subscription.partner_id.id,
                        'name': subscription.partner_id.name,
                        'email': subscription.partner_id.email
                    },
                    'plan': {
                        'id': subscription.plan_id.id,
                        'name': subscription.plan_id.name,
                        'code': subscription.plan_id.code
                    },
                    'state': subscription.state,
                    'billing_cycle': subscription.billing_cycle,
                    'start_date': subscription.start_date.isoformat() if subscription.start_date else None,
                    'trial_end_date': subscription.trial_end_date.isoformat() if subscription.trial_end_date else None,
                    'next_billing_date': subscription.next_billing_date.isoformat() if subscription.next_billing_date else None,
                    'end_date': subscription.end_date.isoformat() if subscription.end_date else None,
                    'usage': {
                        'users': {
                            'current': users_limit[1],
                            'limit': users_limit[2],
                            'is_limit_reached': users_limit[0],
                            'percentage': subscription.users_usage_percentage
                        },
                        'products': {
                            'current': products_limit[1],
                            'limit': products_limit[2],
                            'is_limit_reached': products_limit[0],
                            'percentage': subscription.products_usage_percentage
                        },
                        'orders': {
                            'current': orders_limit[1],
                            'limit': orders_limit[2],
                            'is_limit_reached': orders_limit[0],
                            'percentage': subscription.orders_usage_percentage
                        }
                    },
                    'stripe_subscription_id': subscription.stripe_subscription_id,
                    'stripe_customer_id': subscription.stripe_customer_id
                }
            }

        except Exception as e:
            _logger.error(f"Error getting current subscription: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/subscription/create', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_subscription(self, plan_id, billing_cycle='monthly', **kwargs):
        """
        Crée un nouvel abonnement pour l'utilisateur.

        Args:
            plan_id (int): ID du plan choisi
            billing_cycle (str): 'monthly' ou 'yearly'

        Returns:
            dict: {
                'success': bool,
                'data': subscription info
            }
        """
        try:
            user = request.env.user
            company = user.company_id

            # Vérifier si abonnement actif existe déjà
            existing = request.env['quelyos.subscription'].search([
                ('company_id', '=', company.id),
                ('state', 'in', ['trial', 'active'])
            ], limit=1)

            if existing:
                return {'success': False, 'error': 'Active subscription already exists'}

            # Vérifier que le plan existe
            plan = request.env['quelyos.subscription.plan'].browse(plan_id)
            if not plan.exists():
                return {'success': False, 'error': 'Invalid plan'}

            # Créer l'abonnement
            trial_end = datetime.now().date() + timedelta(days=14)

            subscription = request.env['quelyos.subscription'].create({
                'partner_id': user.partner_id.id,
                'company_id': company.id,
                'plan_id': plan.id,
                'billing_cycle': billing_cycle,
                'state': 'trial',
                'trial_end_date': trial_end
            })

            return {
                'success': True,
                'data': {
                    'id': subscription.id,
                    'name': subscription.name,
                    'state': subscription.state,
                    'trial_end_date': subscription.trial_end_date.isoformat()
                }
            }

        except Exception as e:
            _logger.error(f"Error creating subscription: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/subscription/upgrade', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def upgrade_subscription(self, plan_id, **kwargs):
        """
        Upgrade le plan d'abonnement actuel.

        Args:
            plan_id (int): ID du nouveau plan

        Returns:
            dict: {
                'success': bool,
                'message': str
            }
        """
        try:
            user = request.env.user
            company = user.company_id

            # Trouver l'abonnement actif
            subscription = request.env['quelyos.subscription'].search([
                ('company_id', '=', company.id),
                ('state', 'in', ['trial', 'active'])
            ], limit=1)

            if not subscription:
                return {'success': False, 'error': 'No active subscription'}

            # Vérifier que le nouveau plan existe
            new_plan = request.env['quelyos.subscription.plan'].browse(plan_id)
            if not new_plan.exists():
                return {'success': False, 'error': 'Invalid plan'}

            # Vérifier qu'on upgrade bien (pas de downgrade pour l'instant)
            if new_plan.price_monthly < subscription.plan_id.price_monthly:
                return {'success': False, 'error': 'Downgrade not supported yet, please contact support'}

            old_plan_name = subscription.plan_id.name

            # Upgrade immédiat
            subscription.write({'plan_id': new_plan.id})

            # Log dans le chatter
            subscription.message_post(
                body=f"Plan upgradé de {old_plan_name} vers {new_plan.name}",
                subject="Upgrade de plan"
            )

            # TODO: Calculer prorata et facturer via Stripe

            return {
                'success': True,
                'message': f'Subscription upgraded to {new_plan.name} successfully'
            }

        except Exception as e:
            _logger.error(f"Error upgrading subscription: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/subscription/cancel', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def cancel_subscription(self, **kwargs):
        """
        Annule l'abonnement à la fin de la période en cours.

        Returns:
            dict: {
                'success': bool,
                'message': str
            }
        """
        try:
            user = request.env.user
            company = user.company_id

            # Trouver l'abonnement actif
            subscription = request.env['quelyos.subscription'].search([
                ('company_id', '=', company.id),
                ('state', 'in', ['trial', 'active'])
            ], limit=1)

            if not subscription:
                return {'success': False, 'error': 'No active subscription'}

            # Annulation à la fin de la période (pas immédiate)
            # On garde l'état active jusqu'à la fin de facturation
            subscription.message_post(
                body="Annulation demandée - l'abonnement restera actif jusqu'à la fin de la période de facturation",
                subject="Demande d'annulation"
            )

            # TODO: Annuler via Stripe API (at_period_end=True)

            return {
                'success': True,
                'message': 'Subscription will be cancelled at the end of the billing period'
            }

        except Exception as e:
            _logger.error(f"Error cancelling subscription: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/subscription/check-quota', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def check_quota(self, resource_type, **kwargs):
        """
        Vérifie si un quota est atteint.

        Args:
            resource_type (str): 'users', 'products', 'orders'

        Returns:
            dict: {
                'success': bool,
                'data': {
                    'is_limit_reached': bool,
                    'current': int,
                    'limit': int,
                    'percentage': float
                }
            }
        """
        try:
            if resource_type not in ['users', 'products', 'orders']:
                return {'success': False, 'error': 'Invalid resource_type. Must be users, products, or orders'}

            user = request.env.user
            company = user.company_id

            # Trouver l'abonnement actif
            subscription = request.env['quelyos.subscription'].search([
                ('company_id', '=', company.id),
                ('state', 'in', ['trial', 'active'])
            ], limit=1)

            if not subscription:
                return {'success': False, 'error': 'No active subscription'}

            # Vérifier le quota
            is_limit_reached, current, limit = subscription.check_quota_limit(resource_type)

            percentage = 0
            if limit > 0:
                percentage = (current / limit) * 100

            return {
                'success': True,
                'data': {
                    'is_limit_reached': is_limit_reached,
                    'current': current,
                    'limit': limit,
                    'percentage': percentage
                }
            }

        except Exception as e:
            _logger.error(f"Error checking quota: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/subscription/admin/list', type='jsonrpc', auth='user', methods=['POST'], csrf=False, cors='*')
    def admin_list_subscriptions(self, limit=20, offset=0, **kwargs):
        """
        Liste tous les abonnements (admin uniquement).

        Args:
            limit (int): Nombre max de résultats
            offset (int): Décalage pour pagination

        Returns:
            dict: {
                'success': bool,
                'data': list of subscriptions,
                'total': int
            }
        """
        try:
            # Vérifier que l'utilisateur est admin
            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Unauthorized: Admin access required'}

            # Récupérer tous les abonnements
            subscriptions = request.env['quelyos.subscription'].search([], limit=limit, offset=offset, order='create_date desc')
            total = request.env['quelyos.subscription'].search_count([])

            subscriptions_data = []
            for sub in subscriptions:
                subscriptions_data.append({
                    'id': sub.id,
                    'name': sub.name,
                    'partner_name': sub.partner_id.name,
                    'partner_email': sub.partner_id.email,
                    'plan_name': sub.plan_id.name,
                    'plan_code': sub.plan_id.code,
                    'state': sub.state,
                    'billing_cycle': sub.billing_cycle,
                    'start_date': sub.start_date.isoformat() if sub.start_date else None,
                    'next_billing_date': sub.next_billing_date.isoformat() if sub.next_billing_date else None,
                    'current_users_count': sub.current_users_count,
                    'max_users': sub.max_users,
                    'current_products_count': sub.current_products_count,
                    'max_products': sub.max_products,
                    'current_orders_count': sub.current_orders_count,
                    'max_orders_per_year': sub.max_orders_per_year
                })

            return {
                'success': True,
                'data': subscriptions_data,
                'total': total
            }

        except Exception as e:
            _logger.error(f"Error listing subscriptions: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}
