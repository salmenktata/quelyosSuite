# -*- coding: utf-8 -*-
import logging

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    """Migration 19.0.1.46.0 - Q4 Final: Champs restants → x_ prefix"""
    _logger.info("=== Migration 19.0.1.46.0: Q4 Final ===")
    
    # Note: pos_order hérite de stock.picking, pas de table dédiée
    migrations = {
        'stock_picking': [
            # Champs POS (hérités dans pos_order.py)
            ('session_id', 'x_session_id'),
            ('config_id', 'x_config_id'),
            ('pos_order_id', 'x_pos_order_id'),
            ('order_id', 'x_order_id'),
            ('offline_id', 'x_offline_id'),
            ('offline_line_id', 'x_offline_line_id'),
            ('product_name', 'x_product_name'),
            ('product_sku', 'x_product_sku'),
            ('quantity', 'x_quantity'),
            ('price_unit', 'x_price_unit'),
            ('price_subtotal', 'x_price_subtotal'),
            ('price_subtotal_untaxed', 'x_price_subtotal_untaxed'),
            ('price_tax', 'x_price_tax'),
            ('discount', 'x_discount'),
            ('discount_type', 'x_discount_type'),
            ('discount_value', 'x_discount_value'),
            ('discount_amount', 'x_discount_amount'),
            ('tax_ids', 'x_tax_ids'),
            ('note', 'x_note'),
            ('amount_untaxed', 'x_amount_untaxed'),
            ('amount_tax', 'x_amount_tax'),
            ('amount_total', 'x_amount_total'),
            ('amount_paid', 'x_amount_paid'),
            ('amount_return', 'x_amount_return'),
            ('pricelist_id', 'x_pricelist_id'),
            ('invoice_id', 'x_invoice_id'),
            ('sale_order_id', 'x_sale_order_id'),
            ('picking_ids', 'x_picking_ids'),
            ('payment_ids', 'x_payment_ids'),
            ('payment_method_id', 'x_payment_method_id'),
            ('payment_transaction_id', 'x_payment_transaction_id'),
            ('transaction_id', 'x_transaction_id'),
            ('paid_at', 'x_paid_at'),
            ('synced_at', 'x_synced_at'),
            ('is_offline_order', 'x_is_offline_order'),
            ('amount', 'x_amount'),
        ],
        'payment_transaction': [
            ('customer_phone', 'x_customer_phone'),
            ('last_webhook_date', 'x_last_webhook_date'),
            ('webhook_calls_count', 'x_webhook_calls_count'),
        ],
        'hr_attendance': [
            ('today_start', 'x_today_start'),
        ],
        'hr_leave': [
            ('min_date', 'x_min_date'),
        ],
        'stock_location': [
            ('locked_date', 'x_locked_date'),
        ],
        'stock_move': [
            ('locked_date', 'x_locked_date'),
        ],
        'product_image': [
            ('product_template_attribute_value_id', 'x_product_template_attribute_value_id'),
        ],
    }
    
    total = 0
    for table, fields in migrations.items():
        model = table.replace('_', '.')
        _logger.info(f"\n--- {model} ({len(fields)} champs) ---")
        
        for old, new in fields:
            cr.execute("SELECT 1 FROM information_schema.columns WHERE table_name=%s AND column_name=%s", (table, new))
            if cr.fetchone():
                continue
            
            cr.execute("SELECT 1 FROM information_schema.columns WHERE table_name=%s AND column_name=%s", (table, old))
            if not cr.fetchone():
                _logger.warning(f"  {old} n'existe pas, skip")
                continue
            
            _logger.info(f"  ✓ {old} → {new}")
            cr.execute(f"ALTER TABLE {table} RENAME COLUMN {old} TO {new}")
            cr.execute("UPDATE ir_model_fields SET name=%s WHERE model=%s AND name=%s", (new, model, old))
            total += 1
    
    _logger.info(f"\n=== Q4 terminée: {total} champs migrés ===")
