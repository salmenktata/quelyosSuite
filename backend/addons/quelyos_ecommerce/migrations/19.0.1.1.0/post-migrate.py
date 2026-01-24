# -*- coding: utf-8 -*-
"""
Migration script for version 19.0.1.1.0
Converts existing product images (image_1920) to the new gallery system (product.product.image)
"""
import logging

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    """
    Migrate existing product images to new gallery system.

    For each product with an image_1920 but no gallery images:
    1. Create a product.product.image record
    2. Set it as the main image
    3. Copy the image data
    """
    _logger.info("=== Starting migration to product image gallery system ===")

    # Check if image_1920 column exists (might not exist in fresh Odoo 19 installs)
    cr.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'product_template'
          AND column_name = 'image_1920'
    """)

    if not cr.fetchone():
        _logger.info("Column image_1920 does not exist in product_template - skipping migration")
        _logger.info("This is normal for fresh Odoo 19 installations using the new image system")
        return

    # Find products with image_1920 but no gallery images
    cr.execute("""
        SELECT pt.id, pt.image_1920
        FROM product_template pt
        WHERE pt.image_1920 IS NOT NULL
          AND NOT EXISTS (
              SELECT 1
              FROM product_product_image ppi
              WHERE ppi.product_tmpl_id = pt.id
          )
    """)

    products_to_migrate = cr.fetchall()
    total_count = len(products_to_migrate)

    if total_count == 0:
        _logger.info("No products to migrate - all products already use gallery system")
        return

    _logger.info(f"Found {total_count} products with images to migrate")

    migrated_count = 0
    error_count = 0

    for product_id, image_data in products_to_migrate:
        try:
            # Create gallery image record
            cr.execute("""
                INSERT INTO product_product_image (
                    product_tmpl_id,
                    image,
                    sequence,
                    is_main,
                    alt_text,
                    create_date,
                    write_date,
                    create_uid,
                    write_uid
                )
                VALUES (
                    %s,  -- product_tmpl_id
                    %s,  -- image (copy from image_1920)
                    10,  -- sequence
                    true,  -- is_main (this is the default image)
                    'Product image',  -- alt_text
                    NOW(),  -- create_date
                    NOW(),  -- write_date
                    1,  -- create_uid (admin)
                    1   -- write_uid (admin)
                )
            """, (product_id, image_data))

            migrated_count += 1

            if migrated_count % 50 == 0:
                _logger.info(f"Migration progress: {migrated_count}/{total_count} products")

        except Exception as e:
            error_count += 1
            _logger.error(f"Failed to migrate product {product_id}: {str(e)}")
            continue

    # Log summary
    _logger.info("=== Migration completed ===")
    _logger.info(f"Total products processed: {total_count}")
    _logger.info(f"Successfully migrated: {migrated_count}")
    _logger.info(f"Errors: {error_count}")

    if migrated_count > 0:
        _logger.info(
            "Old image_1920 fields are kept for backward compatibility. "
            "The new gallery system will be used by default in get_api_data()."
        )
