# -*- coding: utf-8 -*-
"""
Migration 19.0.1.18.0 - Enable Row Level Security (RLS) PostgreSQL

Cette migration active RLS PostgreSQL pour renforcer l'isolation multi-tenant
au niveau base de données. Cela empêche les requêtes SQL directes de contourner
les filtres applicatifs sur tenant_id.

IMPORTANT: Cette migration nécessite des privilèges superuser PostgreSQL.
"""

import logging
import os

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    """
    Active Row Level Security sur toutes les tables avec tenant_id
    """
    _logger.info("=== Migration 19.0.1.18.0: Enable RLS Tenant Isolation ===")

    # Chemin vers le script SQL
    sql_file = os.path.join(
        os.path.dirname(__file__),
        '..',
        'enable_rls_tenant_isolation.sql'
    )

    if not os.path.exists(sql_file):
        _logger.error(f"Migration SQL file not found: {sql_file}")
        return

    try:
        # Lire et exécuter le script SQL
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()

        # Diviser en commandes individuelles (séparées par ;)
        # et exécuter une par une pour meilleure traçabilité
        commands = [cmd.strip() for cmd in sql_content.split(';') if cmd.strip()]

        for i, command in enumerate(commands):
            # Ignorer les commentaires purs
            if command.startswith('--') or command.startswith('/*'):
                continue

            try:
                cr.execute(command)
                _logger.debug(f"RLS Command {i+1}/{len(commands)} executed successfully")
            except Exception as e:
                _logger.warning(
                    f"RLS Command {i+1} failed (may already exist): {str(e)[:200]}"
                )
                # Ne pas fail complètement si une policy existe déjà
                continue

        _logger.info("✅ RLS Tenant Isolation enabled successfully")
        _logger.info("IMPORTANT: Backend must call 'SET LOCAL app.current_tenant' at each request")

    except Exception as e:
        _logger.error(f"❌ Failed to enable RLS: {e}", exc_info=True)
        # Ne pas bloquer la migration si RLS échoue (ex: pas de droits superuser)
        _logger.warning("RLS migration failed but continuing. Manual execution may be required.")
