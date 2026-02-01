# -*- coding: utf-8 -*-
import logging

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    """
    Migration 19.0.1.81.0 : Ajouter champ enabled_modules au plan
    Permet de configurer les modules activés par plan (checkboxes dans UI)
    """
    _logger.info("Running migration 19.0.1.81.0: Add enabled_modules to subscription plans")

    # 1. Vérifier si la colonne existe déjà
    cr.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='quelyos_subscription_plan'
        AND column_name='enabled_modules'
    """)

    if cr.fetchone():
        _logger.info("Column enabled_modules already exists, skipping migration")
        return

    # 2. Ajouter la colonne avec valeur par défaut '["home"]'
    cr.execute("""
        ALTER TABLE quelyos_subscription_plan
        ADD COLUMN enabled_modules TEXT DEFAULT '["home"]'
    """)

    # 3. Initialiser les plans existants selon leur code
    cr.execute("""
        UPDATE quelyos_subscription_plan
        SET enabled_modules = '["home", "store"]'
        WHERE code = 'starter'
    """)

    cr.execute("""
        UPDATE quelyos_subscription_plan
        SET enabled_modules = '["home", "finance", "store", "stock", "crm", "marketing"]'
        WHERE code = 'pro'
    """)

    cr.execute("""
        UPDATE quelyos_subscription_plan
        SET enabled_modules = '["home", "finance", "store", "stock", "crm", "marketing", "hr", "support", "pos"]'
        WHERE code = 'enterprise'
    """)

    # 4. Valeur par défaut pour les plans custom ou non reconnus
    cr.execute("""
        UPDATE quelyos_subscription_plan
        SET enabled_modules = '["home"]'
        WHERE enabled_modules IS NULL OR enabled_modules = ''
    """)

    _logger.info("Migration 19.0.1.81.0 completed successfully")
