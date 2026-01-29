# -*- coding: utf-8 -*-
"""
Fonctions de sécurité et validation pour le système multi-tenant.

Ce module renforce l'isolation des données en validant que les utilisateurs
accèdent uniquement aux données de leur propre tenant.
"""

import logging
from odoo.http import request
from odoo.exceptions import AccessError

_logger = logging.getLogger(__name__)


def get_tenant_from_header():
    """
    Récupère le tenant depuis le header X-Tenant-Domain.
    Valide que le tenant existe et appartient à la company de l'utilisateur.

    Returns:
        quelyos.tenant: Record du tenant validé
        None: Si header manquant ou validation échouée

    Raises:
        AccessError: Si l'utilisateur tente d'accéder à un tenant qui n'est pas le sien
    """
    tenant_domain = request.httprequest.headers.get('X-Tenant-Domain')

    if not tenant_domain:
        _logger.warning("Missing X-Tenant-Domain header in request")
        return None

    # Rechercher le tenant par domaine
    Tenant = request.env['quelyos.tenant'].sudo()
    tenant = Tenant.search([
        '|',
        ('domain', '=', tenant_domain),
        ('backoffice_domain', '=', tenant_domain)
    ], limit=1)

    if not tenant:
        _logger.warning(f"Tenant not found for domain: {tenant_domain}")
        return None

    # VALIDATION CRITIQUE : Vérifier que l'utilisateur appartient à ce tenant
    if not request.env.user._is_public():
        user_company_id = request.env.user.company_id.id

        if tenant.company_id.id != user_company_id:
            _logger.error(
                f"SECURITY VIOLATION: User {request.env.user.id} (company {user_company_id}) "
                f"attempted to access tenant {tenant.id} (company {tenant.company_id.id}). "
                f"Domain: {tenant_domain}"
            )
            raise AccessError(
                "Vous n'avez pas accès à ce tenant. "
                "Cette tentative a été enregistrée."
            )

    return tenant


def get_company_from_tenant():
    """
    Récupère la company associée au tenant depuis le header X-Tenant-Domain.
    Combine get_tenant_from_header() avec extraction de company_id.

    Returns:
        res.company: Record de la company validée
        None: Si tenant non trouvé ou validation échouée

    Usage:
        company = get_company_from_tenant()
        if not company:
            return {'error': 'Tenant invalide'}
        products = Product.with_company(company).search([...])
    """
    tenant = get_tenant_from_header()
    return tenant.company_id if tenant else None


def check_quota_products(tenant):
    """
    Vérifie si le tenant a atteint son quota de produits.

    Args:
        tenant: Record quelyos.tenant

    Returns:
        dict: Erreur si quota dépassé, None sinon
    """
    if not tenant or not tenant.subscription_id:
        return None

    plan = tenant.subscription_id.plan_id
    if not plan or plan.max_products == 0:  # 0 = illimité
        return None

    # Compter les produits actifs du tenant
    Product = request.env['product.template'].sudo()
    product_count = Product.search_count([
        ('company_id', '=', tenant.company_id.id),
        ('active', '=', True)
    ])

    if product_count >= plan.max_products:
        _logger.warning(
            f"Quota products exceeded for tenant {tenant.id}: "
            f"{product_count}/{plan.max_products}"
        )
        return {
            'success': False,
            'error': f'Quota produits atteint ({plan.max_products} max). '
                    f'Passez à un plan supérieur pour ajouter plus de produits.',
            'error_code': 'QUOTA_PRODUCTS_EXCEEDED',
            'quota': {
                'current': product_count,
                'max': plan.max_products,
                'plan': plan.name
            }
        }

    return None


def check_quota_users(tenant):
    """
    Vérifie si le tenant a atteint son quota d'utilisateurs.

    Args:
        tenant: Record quelyos.tenant

    Returns:
        dict: Erreur si quota dépassé, None sinon
    """
    if not tenant or not tenant.subscription_id:
        return None

    plan = tenant.subscription_id.plan_id
    if not plan or plan.max_users == 0:  # 0 = illimité
        return None

    # Compter les utilisateurs actifs du tenant (hors utilisateurs publics)
    User = request.env['res.users'].sudo()
    user_count = User.search_count([
        ('company_id', '=', tenant.company_id.id),
        ('active', '=', True),
        ('share', '=', False)  # Exclure les utilisateurs "portail"
    ])

    if user_count >= plan.max_users:
        _logger.warning(
            f"Quota users exceeded for tenant {tenant.id}: "
            f"{user_count}/{plan.max_users}"
        )
        return {
            'success': False,
            'error': f'Quota utilisateurs atteint ({plan.max_users} max). '
                    f'Passez à un plan supérieur pour ajouter plus d\'utilisateurs.',
            'error_code': 'QUOTA_USERS_EXCEEDED',
            'quota': {
                'current': user_count,
                'max': plan.max_users,
                'plan': plan.name
            }
        }

    return None


def check_quota_orders(tenant):
    """
    Vérifie si le tenant a atteint son quota de commandes annuelles.

    Args:
        tenant: Record quelyos.tenant

    Returns:
        dict: Erreur si quota dépassé, None sinon
    """
    if not tenant or not tenant.subscription_id:
        return None

    plan = tenant.subscription_id.plan_id
    if not plan or plan.max_orders_per_year == 0:  # 0 = illimité
        return None

    # Compter les commandes de l'année civile en cours
    from datetime import datetime
    current_year = datetime.now().year
    start_date = f'{current_year}-01-01'
    end_date = f'{current_year}-12-31'

    SaleOrder = request.env['sale.order'].sudo()
    order_count = SaleOrder.search_count([
        ('company_id', '=', tenant.company_id.id),
        ('date_order', '>=', start_date),
        ('date_order', '<=', end_date)
    ])

    if order_count >= plan.max_orders_per_year:
        _logger.warning(
            f"Quota orders exceeded for tenant {tenant.id}: "
            f"{order_count}/{plan.max_orders_per_year}"
        )
        return {
            'success': False,
            'error': f'Quota commandes annuel atteint ({plan.max_orders_per_year} max). '
                    f'Passez à un plan supérieur pour accepter plus de commandes.',
            'error_code': 'QUOTA_ORDERS_EXCEEDED',
            'quota': {
                'current': order_count,
                'max': plan.max_orders_per_year,
                'plan': plan.name,
                'year': current_year
            }
        }

    return None


def check_subscription_active(tenant):
    """
    Vérifie si l'abonnement du tenant est actif.

    Args:
        tenant: Record quelyos.tenant

    Returns:
        dict: Erreur si abonnement inactif, None sinon
    """
    if not tenant or not tenant.subscription_id:
        return {
            'success': False,
            'error': 'Aucun abonnement actif. Veuillez contacter le support.',
            'error_code': 'NO_SUBSCRIPTION'
        }

    subscription = tenant.subscription_id
    if subscription.state not in ('trial', 'active'):
        _logger.warning(
            f"Inactive subscription for tenant {tenant.id}: "
            f"state={subscription.state}"
        )
        return {
            'success': False,
            'error': f'Abonnement {subscription.state}. '
                    f'Veuillez renouveler votre abonnement pour continuer.',
            'error_code': 'SUBSCRIPTION_INACTIVE',
            'subscription': {
                'state': subscription.state,
                'plan': subscription.plan_id.name if subscription.plan_id else None,
                'end_date': subscription.end_date.isoformat() if subscription.end_date else None
            }
        }

    return None


def get_quota_status(tenant):
    """
    Retourne le statut de tous les quotas pour un tenant.

    Args:
        tenant: Record quelyos.tenant

    Returns:
        dict: Statut détaillé des quotas (produits, utilisateurs, commandes)
    """
    if not tenant or not tenant.subscription_id:
        return {
            'products': {'current': 0, 'max': 0, 'unlimited': True},
            'users': {'current': 0, 'max': 0, 'unlimited': True},
            'orders': {'current': 0, 'max': 0, 'unlimited': True}
        }

    plan = tenant.subscription_id.plan_id

    # Compter les produits
    Product = request.env['product.template'].sudo()
    product_count = Product.search_count([
        ('company_id', '=', tenant.company_id.id),
        ('active', '=', True)
    ])

    # Compter les utilisateurs
    User = request.env['res.users'].sudo()
    user_count = User.search_count([
        ('company_id', '=', tenant.company_id.id),
        ('active', '=', True),
        ('share', '=', False)
    ])

    # Compter les commandes de l'année
    from datetime import datetime
    current_year = datetime.now().year
    SaleOrder = request.env['sale.order'].sudo()
    order_count = SaleOrder.search_count([
        ('company_id', '=', tenant.company_id.id),
        ('date_order', '>=', f'{current_year}-01-01'),
        ('date_order', '<=', f'{current_year}-12-31')
    ])

    return {
        'products': {
            'current': product_count,
            'max': plan.max_products,
            'unlimited': plan.max_products == 0,
            'percentage': (product_count / plan.max_products * 100) if plan.max_products > 0 else 0
        },
        'users': {
            'current': user_count,
            'max': plan.max_users,
            'unlimited': plan.max_users == 0,
            'percentage': (user_count / plan.max_users * 100) if plan.max_users > 0 else 0
        },
        'orders': {
            'current': order_count,
            'max': plan.max_orders_per_year,
            'unlimited': plan.max_orders_per_year == 0,
            'percentage': (order_count / plan.max_orders_per_year * 100) if plan.max_orders_per_year > 0 else 0,
            'year': current_year
        },
        'plan': {
            'name': plan.name,
            'code': plan.code
        },
        'subscription': {
            'state': tenant.subscription_id.state,
            'end_date': tenant.subscription_id.end_date.isoformat() if tenant.subscription_id.end_date else None
        }
    }
