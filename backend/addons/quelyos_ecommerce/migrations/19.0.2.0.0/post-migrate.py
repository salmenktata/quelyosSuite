# -*- coding: utf-8 -*-
"""
Migration script for version 19.0.2.0.0
Adds variant-specific image support and promo image flag
"""
import logging

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    """
    Migrate to variant-specific image system.

    Changes:
    1. Add is_promo column to product_product_image
    2. Create Many2many table product_variant_image_rel
    3. Add indexes for performance
    4. Backward compatible - no data migration needed
    """
    _logger.info("=== Starting migration to variant-specific image system (19.0.2.0.0) ===")

    # Step 1: Add is_promo column if it doesn't exist
    cr.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'product_product_image'
          AND column_name = 'is_promo'
    """)

    if not cr.fetchone():
        _logger.info("Adding is_promo column to product_product_image...")
        cr.execute("""
            ALTER TABLE product_product_image
            ADD COLUMN is_promo BOOLEAN DEFAULT FALSE
        """)
        _logger.info("✓ is_promo column added")
    else:
        _logger.info("Column is_promo already exists - skipping")

    # Step 2: Add is_variant_specific column if it doesn't exist
    cr.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'product_product_image'
          AND column_name = 'is_variant_specific'
    """)

    if not cr.fetchone():
        _logger.info("Adding is_variant_specific column to product_product_image...")
        cr.execute("""
            ALTER TABLE product_product_image
            ADD COLUMN is_variant_specific BOOLEAN DEFAULT FALSE
        """)
        _logger.info("✓ is_variant_specific column added")
    else:
        _logger.info("Column is_variant_specific already exists - skipping")

    # Step 3: Create Many2many relation table if it doesn't exist
    cr.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'product_variant_image_rel'
        )
    """)

    if not cr.fetchone()[0]:
        _logger.info("Creating product_variant_image_rel table...")
        cr.execute("""
            CREATE TABLE product_variant_image_rel (
                image_id INTEGER NOT NULL,
                variant_id INTEGER NOT NULL,
                PRIMARY KEY (image_id, variant_id)
            )
        """)
        _logger.info("✓ product_variant_image_rel table created")

        # Add foreign key constraints
        _logger.info("Adding foreign key constraints...")
        cr.execute("""
            ALTER TABLE product_variant_image_rel
            ADD CONSTRAINT product_variant_image_rel_image_id_fkey
            FOREIGN KEY (image_id) REFERENCES product_product_image(id) ON DELETE CASCADE
        """)
        cr.execute("""
            ALTER TABLE product_variant_image_rel
            ADD CONSTRAINT product_variant_image_rel_variant_id_fkey
            FOREIGN KEY (variant_id) REFERENCES product_product(id) ON DELETE CASCADE
        """)
        _logger.info("✓ Foreign key constraints added")

        # Add indexes for performance
        _logger.info("Creating indexes for performance...")
        cr.execute("""
            CREATE INDEX product_variant_image_rel_image_id_idx
            ON product_variant_image_rel(image_id)
        """)
        cr.execute("""
            CREATE INDEX product_variant_image_rel_variant_id_idx
            ON product_variant_image_rel(variant_id)
        """)
        _logger.info("✓ Indexes created")
    else:
        _logger.info("Table product_variant_image_rel already exists - skipping")

    # Step 4: Add index on is_promo for faster queries
    cr.execute("""
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'product_product_image'
          AND indexname = 'product_product_image_is_promo_idx'
    """)

    if not cr.fetchone():
        _logger.info("Creating index on is_promo column...")
        cr.execute("""
            CREATE INDEX product_product_image_is_promo_idx
            ON product_product_image(is_promo)
            WHERE is_promo = TRUE
        """)
        _logger.info("✓ Partial index on is_promo created (only TRUE values)")
    else:
        _logger.info("Index on is_promo already exists - skipping")

    # Summary
    _logger.info("=== Migration completed successfully ===")
    _logger.info("New features available:")
    _logger.info("  - Images can be assigned to specific product variants")
    _logger.info("  - Images can be marked as promotional (is_promo)")
    _logger.info("  - Backward compatible: existing template images work as before")
    _logger.info("  - If image has no variant assignment, it applies to all variants (template level)")
