# -*- coding: utf-8 -*-
import logging

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    """Migration 19.0.1.45.0 - Q3 2026: Paiements & Divers → x_ prefix"""
    _logger.info("=== Migration 19.0.1.45.0: Q3 Paiements ===")
    
    migrations = {
        'payment_provider': [
            ('code', 'x_code'),
            ('flouci_app_token', 'x_flouci_app_token'),
            ('flouci_app_secret', 'x_flouci_app_secret'),
            ('flouci_timeout', 'x_flouci_timeout'),
            ('flouci_accept_cards', 'x_flouci_accept_cards'),
            ('konnect_api_key', 'x_konnect_api_key'),
            ('konnect_wallet_id', 'x_konnect_wallet_id'),
            ('konnect_lifespan', 'x_konnect_lifespan'),
            ('konnect_theme', 'x_konnect_theme'),
        ],
        'payment_transaction': [
            ('provider_payment_id', 'x_provider_payment_id'),
            ('provider_request_payload', 'x_provider_request_payload'),
            ('provider_response_payload', 'x_provider_response_payload'),
            ('provider_error_code', 'x_provider_error_code'),
            ('provider_error_message', 'x_provider_error_message'),
            ('payment_method_type', 'x_payment_method_type'),
        ],
        'product_wishlist': [
            ('share_token', 'x_share_token'),
            ('is_public', 'x_is_public'),
        ],
    }
    
    total = 0
    for table, fields in migrations.items():
        model = table.replace('_', '.')
        _logger.info(f"\n--- {model} ---")
        
        for old, new in fields:
            cr.execute("SELECT 1 FROM information_schema.columns WHERE table_name=%s AND column_name=%s", (table, new))
            if cr.fetchone():
                continue
            
            cr.execute("SELECT 1 FROM information_schema.columns WHERE table_name=%s AND column_name=%s", (table, old))
            if not cr.fetchone():
                continue
            
            _logger.info(f"  ✓ {old} → {new}")
            cr.execute(f"ALTER TABLE {table} RENAME COLUMN {old} TO {new}")
            cr.execute("UPDATE ir_model_fields SET name=%s WHERE model=%s AND name=%s", (new, model, old))
            total += 1
    
    _logger.info(f"\n=== Q3 terminée: {total} champs ===")
