# -*- coding: utf-8 -*-
"""
Row Level Security (RLS) Context Manager

Ce module fournit des utilitaires pour configurer le tenant courant
dans la session PostgreSQL, activant ainsi l'isolation RLS.

Mécanisme:
1. SET LOCAL app.current_tenant = tenant_id (variable de session)
2. SET LOCAL ROLE quelyos_app (bascule vers rôle non-superuser)
3. Les policies RLS filtrent automatiquement par tenant_id
4. Au COMMIT/ROLLBACK, le rôle revient à 'odoo' automatiquement

Policies configurées sur chaque table avec tenant_id:
- tenant_isolation: tenant_id = get_current_tenant_id() OR tenant_id IS NULL
- admin_bypass: get_current_tenant_id() IS NULL OR = 0 (migrations/cron)

Usage:
    from quelyos_api.lib.rls_context import set_rls_tenant, rls_tenant_context

    # Méthode 1: Fonction simple
    set_rls_tenant(request.env.cr, tenant_id)

    # Méthode 2: Context manager
    with rls_tenant_context(request.env.cr, tenant_id):
        # Toutes les requêtes dans ce bloc respectent RLS
        products = Product.search([])  # Filtré automatiquement par tenant_id
"""

import os
import logging
from contextlib import contextmanager

_logger = logging.getLogger(__name__)

# Rôle applicatif non-superuser pour enforcement RLS
RLS_APP_ROLE = os.environ.get('RLS_APP_ROLE', 'quelyos_app')


def set_rls_tenant(cr, tenant_id):
    """
    Configure le tenant courant et bascule vers le rôle RLS.

    SET LOCAL ROLE quelyos_app descend les privilèges pour que les
    policies RLS soient appliquées (superuser bypass RLS sinon).
    Le rôle revient automatiquement à 'odoo' au COMMIT/ROLLBACK.

    Args:
        cr: Cursor PostgreSQL (request.env.cr)
        tenant_id (int): ID du tenant courant
    """
    if not tenant_id:
        _logger.warning("set_rls_tenant called with empty tenant_id")
        return

    try:
        # 1. Définir le tenant AVANT de changer de rôle
        cr.execute(
            "SET LOCAL app.current_tenant = %s",
            (tenant_id,)
        )
        # 2. Basculer vers rôle non-superuser pour activer RLS
        # SET ROLE n'accepte pas les paramètres bind,
        # le rôle est validé (env var, alphanum uniquement)
        if not RLS_APP_ROLE.replace('_', '').isalnum():
            raise ValueError(f"Invalid RLS role name: {RLS_APP_ROLE}")
        cr.execute(f"SET LOCAL ROLE {RLS_APP_ROLE}")
        _logger.debug(f"RLS tenant set to {tenant_id} (role: {RLS_APP_ROLE})")
    except Exception as e:
        _logger.error(f"Failed to set RLS tenant: {e}", exc_info=True)


def reset_rls_tenant(cr):
    """
    Réinitialise le rôle et le tenant RLS.

    Args:
        cr: Cursor PostgreSQL
    """
    try:
        # Restaurer le rôle superuser AVANT de reset le tenant
        cr.execute("RESET ROLE")
        cr.execute("RESET app.current_tenant")
        _logger.debug("RLS tenant and role reset")
    except Exception as e:
        _logger.error(f"Failed to reset RLS tenant: {e}")


@contextmanager
def rls_tenant_context(cr, tenant_id):
    """
    Context manager pour configurer temporairement le tenant RLS.

    Usage:
        with rls_tenant_context(request.env.cr, 123):
            # Code exécuté avec tenant_id=123 en RLS
            products = Product.search([])

        # Ici, le tenant RLS est automatiquement reset

    Args:
        cr: Cursor PostgreSQL
        tenant_id (int): ID du tenant

    Yields:
        None
    """
    try:
        set_rls_tenant(cr, tenant_id)
        yield
    finally:
        reset_rls_tenant(cr)


def get_current_rls_tenant(cr):
    """
    Récupère le tenant_id configuré dans RLS.

    Returns:
        int | None: tenant_id ou None si non configuré
    """
    try:
        cr.execute("SELECT current_setting('app.current_tenant', true)::integer")
        result = cr.fetchone()
        return result[0] if result else None
    except Exception:
        return None
