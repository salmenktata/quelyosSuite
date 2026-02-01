# -*- coding: utf-8 -*-
import logging

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    """
    Migration 19.0.1.46.0 : Ajouter champ trial_days au plan
    """
    _logger.info("Running migration 19.0.1.46.0: Add trial_days to subscription plans")

    # 1. Vérifier si la colonne existe déjà
    cr.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='quelyos_subscription_plan'
        AND column_name='trial_days'
    """)

    if cr.fetchone():
        _logger.info("Column trial_days already exists, skipping migration")
        return

    # 2. Ajouter la colonne avec valeur par défaut 14
    cr.execute("""
        ALTER TABLE quelyos_subscription_plan
        ADD COLUMN trial_days INTEGER NOT NULL DEFAULT 14
    """)

    # 3. Initialiser les plans existants (optionnel - déjà fait via DEFAULT)
    cr.execute("""
        UPDATE quelyos_subscription_plan
        SET trial_days = 14
        WHERE trial_days IS NULL
    """)

    _logger.info("Migration 19.0.1.46.0 completed successfully")
