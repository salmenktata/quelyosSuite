# -*- coding: utf-8 -*-
"""
Migration script for version 19.0.3.0.0
Pivot from variant-specific images to attribute value-specific images
"""
import logging

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    """
    Migrate to attribute value-based image system.

    Changes:
    1. Rename column is_variant_specific → is_attribute_specific
    2. Drop old Many2many table product_variant_image_rel (if exists)
    3. Create new Many2many table product_attribute_value_image_rel
    4. Add indexes for performance
    """
    _logger.info("=== Starting migration to attribute value-based image system (19.0.3.0.0) ===")

    # Step 1: Rename/migrate column is_variant_specific to is_attribute_specific
    cr.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'product_product_image'
          AND column_name = 'is_attribute_specific'
    """)

    if cr.fetchone():
        _logger.info("Column is_attribute_specific already exists")
        # Drop old column if it still exists
        cr.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'product_product_image'
              AND column_name = 'is_variant_specific'
        """)
        if cr.fetchone():
            _logger.info("Dropping old column is_variant_specific...")
            cr.execute("ALTER TABLE product_product_image DROP COLUMN is_variant_specific")
            _logger.info("✓ Old column dropped")
    else:
        # Check if old column exists and rename it
        cr.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'product_product_image'
              AND column_name = 'is_variant_specific'
        """)

        if cr.fetchone():
            _logger.info("Renaming is_variant_specific → is_attribute_specific...")
            cr.execute("""
                ALTER TABLE product_product_image
                RENAME COLUMN is_variant_specific TO is_attribute_specific
            """)
            _logger.info("✓ Column renamed")
        else:
            _logger.info("Fresh install - no column migration needed")

    # Step 2: Drop old variant-based Many2many table if exists
    cr.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'product_variant_image_rel'
        )
    """)

    if cr.fetchone()[0]:
        _logger.info("Dropping old table product_variant_image_rel...")
        cr.execute("DROP TABLE product_variant_image_rel CASCADE")
        _logger.info("✓ Old table dropped")

    # Step 3: Create new attribute value-based Many2many table
    cr.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'product_attribute_value_image_rel'
        )
    """)

    if not cr.fetchone()[0]:
        _logger.info("Creating product_attribute_value_image_rel table...")
        cr.execute("""
            CREATE TABLE product_attribute_value_image_rel (
                image_id INTEGER NOT NULL,
                attribute_value_id INTEGER NOT NULL,
                PRIMARY KEY (image_id, attribute_value_id)
            )
        """)
        _logger.info("✓ product_attribute_value_image_rel table created")

        # Add foreign key constraints
        _logger.info("Adding foreign key constraints...")
        cr.execute("""
            ALTER TABLE product_attribute_value_image_rel
            ADD CONSTRAINT product_attribute_value_image_rel_image_id_fkey
            FOREIGN KEY (image_id) REFERENCES product_product_image(id) ON DELETE CASCADE
        """)
        cr.execute("""
            ALTER TABLE product_attribute_value_image_rel
            ADD CONSTRAINT product_attribute_value_image_rel_attribute_value_id_fkey
            FOREIGN KEY (attribute_value_id) REFERENCES product_template_attribute_value(id) ON DELETE CASCADE
        """)
        _logger.info("✓ Foreign key constraints added")

        # Add indexes for performance
        _logger.info("Creating indexes for performance...")
        cr.execute("""
            CREATE INDEX product_attribute_value_image_rel_image_id_idx
            ON product_attribute_value_image_rel(image_id)
        """)
        cr.execute("""
            CREATE INDEX product_attribute_value_image_rel_attribute_value_id_idx
            ON product_attribute_value_image_rel(attribute_value_id)
        """)
        _logger.info("✓ Indexes created")
    else:
        _logger.info("Table product_attribute_value_image_rel already exists - skipping")

    # Summary
    _logger.info("=== Migration completed successfully ===")
    _logger.info("New architecture:")
    _logger.info("  - Images are now assigned to attribute values (e.g., Color: Red)")
    _logger.info("  - All variants with 'Red' will automatically inherit those images")
    _logger.info("  - Benefits:")
    _logger.info("    * Less duplication (upload once for 'Red', applies to all sizes)")
    _logger.info("    * More intuitive (upload on Color: Red directly)")
    _logger.info("    * Scalable (adding new sizes doesn't require new images)")
    _logger.info("  - Backward compatible: template images still work as fallback")
