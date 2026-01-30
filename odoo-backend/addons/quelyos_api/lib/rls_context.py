# -*- coding: utf-8 -*-
"""
Row Level Security (RLS) Context Manager

Ce module fournit des utilitaires pour configurer le tenant courant
dans la session PostgreSQL, activant ainsi l'isolation RLS.

Usage:
    from quelyos_api.lib.rls_context import set_rls_tenant, rls_tenant_context

    # Méthode 1: Fonction simple
    set_rls_tenant(request.env.cr, tenant_id)

    # Méthode 2: Context manager
    with rls_tenant_context(request.env.cr, tenant_id):
        # Toutes les requêtes dans ce bloc respectent RLS
        products = Product.search([])  # Filtré automatiquement par tenant_id
"""

import logging
from contextlib import contextmanager

_logger = logging.getLogger(__name__)


def set_rls_tenant(cr, tenant_id):
    """
    Configure le tenant courant pour Row Level Security PostgreSQL.

    Doit être appelé au début de chaque requête HTTP pour activer
    l'isolation RLS au niveau base de données.

    Args:
        cr: Cursor PostgreSQL (request.env.cr)
        tenant_id (int): ID du tenant courant

    Example:
        @http.route('/api/products', auth='user')
        def get_products(self, **kwargs):
            tenant = get_tenant_from_header()
            if tenant:
                set_rls_tenant(request.env.cr, tenant.id)
            # ... reste du code
    """
    if not tenant_id:
        _logger.warning("set_rls_tenant called with empty tenant_id")
        return

    try:
        # SET LOCAL = valable uniquement pour la transaction courante
        # Automatiquement annulé au commit/rollback
        cr.execute(
            "SET LOCAL app.current_tenant = %s",
            (tenant_id,)
        )
        _logger.debug(f"RLS tenant set to {tenant_id}")
    except Exception as e:
        _logger.error(f"Failed to set RLS tenant: {e}", exc_info=True)
        # Ne pas fail la requête si RLS échoue (peut-être pas activé)


def reset_rls_tenant(cr):
    """
    Réinitialise le tenant RLS (utile pour tests ou admin global).

    Args:
        cr: Cursor PostgreSQL
    """
    try:
        cr.execute("RESET app.current_tenant")
        _logger.debug("RLS tenant reset")
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
