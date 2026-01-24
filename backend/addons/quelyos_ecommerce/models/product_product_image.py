# -*- coding: utf-8 -*-

import base64
import imghdr
import logging

from odoo import models, fields, api
from odoo.exceptions import ValidationError

_logger = logging.getLogger(__name__)


def validate_image(image_data, max_size_mb=2, allowed_formats=None):
    """
    Validate image data (format and size).

    Args:
        image_data: Base64 encoded image data
        max_size_mb: Maximum allowed size in MB (default: 2)
        allowed_formats: List of allowed formats (default: ['png', 'jpg', 'jpeg'])

    Raises:
        ValidationError: If image validation fails
    """
    if allowed_formats is None:
        allowed_formats = ['png', 'jpg', 'jpeg']

    if not image_data:
        return

    try:
        # Decode base64 data
        image_bytes = base64.b64decode(image_data)
    except Exception as e:
        raise ValidationError(f"Invalid image data: could not decode base64 ({str(e)})")

    # Check size
    size_mb = len(image_bytes) / (1024 * 1024)
    if size_mb > max_size_mb:
        raise ValidationError(
            f"Image size ({size_mb:.2f} MB) exceeds maximum allowed size ({max_size_mb} MB)"
        )

    # Check format
    image_format = imghdr.what(None, h=image_bytes)
    if image_format is None:
        raise ValidationError("Could not determine image format. Please upload a valid image file.")

    # Normalize format name (jpeg -> jpg for comparison)
    normalized_format = 'jpg' if image_format == 'jpeg' else image_format
    normalized_allowed = ['jpg' if f == 'jpeg' else f for f in allowed_formats]

    if normalized_format not in normalized_allowed:
        raise ValidationError(
            f"Image format '{image_format}' is not allowed. Allowed formats: {', '.join(allowed_formats)}"
        )


class ProductProductImage(models.Model):
    """Product Gallery Images - Multiple images per product"""
    _name = 'product.product.image'
    _description = 'Product Gallery Image'
    _order = 'sequence, id'

    # Relations
    product_tmpl_id = fields.Many2one(
        'product.template',
        string='Product Template',
        required=False,  # Not required in form, auto-filled from context or attribute_value_ids
        ondelete='cascade',
        index=True,
        help='Product this image belongs to'
    )

    # Image data
    image = fields.Binary(
        string='Image',
        required=False,  # Allow creation without image, user can upload after
        attachment=True,
        help='Product image (max 2MB, PNG/JPG/JPEG)'
    )

    # Metadata
    sequence = fields.Integer(
        string='Sequence',
        default=10,
        help='Display order (lower = first)'
    )

    is_main = fields.Boolean(
        string='Main Image',
        default=False,
        help='Mark as the default/main product image'
    )

    alt_text = fields.Char(
        string='Alt Text',
        help='Alternative text for accessibility and SEO'
    )

    # NEW: Attribute value-specific images support (e.g., Color: Red, Size: L)
    attribute_value_ids = fields.Many2many(
        'product.template.attribute.value',
        'product_attribute_value_image_rel',
        'image_id',
        'attribute_value_id',
        string='Attribute Values',
        help='Specific attribute values this image applies to (e.g., Color: Red). Empty = all variants (template level)'
    )

    is_promo = fields.Boolean(
        string='Promo Image',
        default=False,
        help='Mark as promotional image (ads, banners, social media)'
    )

    # Computed
    is_attribute_specific = fields.Boolean(
        string='Attribute Specific',
        compute='_compute_is_attribute_specific',
        store=True,
        help='True if this image is assigned to specific attribute values'
    )

    image_url = fields.Char(
        string='Image URL',
        compute='_compute_image_url',
        help='Public URL for this image'
    )

    @api.model
    def default_get(self, fields_list):
        """Auto-fill product_tmpl_id from context when creating from attribute value."""
        import logging
        _logger = logging.getLogger(__name__)

        _logger.info("=" * 80)
        _logger.info("🔍 DEBUG: default_get() called")
        _logger.info(f"  Fields requested: {fields_list}")
        _logger.info(f"  Full context: {self.env.context}")

        res = super().default_get(fields_list)
        _logger.info(f"  Super result: {res}")

        # If product_tmpl_id not already set, try to get it from context or attribute values
        if 'product_tmpl_id' not in res or not res['product_tmpl_id']:
            _logger.info("  product_tmpl_id not set, trying to auto-fill...")

            # Option 1: Direct from context
            if self.env.context.get('default_product_tmpl_id'):
                res['product_tmpl_id'] = self.env.context['default_product_tmpl_id']
                _logger.info(f"  ✅ Set from context: {res['product_tmpl_id']}")

            # Option 2: From attribute_value_ids in context
            elif self.env.context.get('default_attribute_value_ids'):
                attr_commands = self.env.context['default_attribute_value_ids']
                _logger.info(f"  Found attribute_value_ids: {attr_commands}")

                attr_id = None
                for cmd in attr_commands:
                    if cmd[0] == 4:  # Link existing
                        attr_id = cmd[1]
                        break
                    elif cmd[0] == 6 and cmd[2]:  # Replace all
                        attr_id = cmd[2][0]
                        break

                if attr_id:
                    _logger.info(f"  Extracting product_tmpl_id from attribute value {attr_id}")
                    attr_value = self.env['product.template.attribute.value'].browse(attr_id)
                    if attr_value.product_tmpl_id:
                        res['product_tmpl_id'] = attr_value.product_tmpl_id.id
                        _logger.info(f"  ✅ Set from attribute value: {res['product_tmpl_id']}")
                    else:
                        _logger.warning(f"  ⚠️ Attribute value {attr_id} has no product_tmpl_id!")
                else:
                    _logger.warning("  ⚠️ Could not extract attribute value ID from commands")
            else:
                _logger.warning("  ⚠️ No default_product_tmpl_id or default_attribute_value_ids in context!")
        else:
            _logger.info(f"  product_tmpl_id already set: {res.get('product_tmpl_id')}")

        _logger.info(f"  Final result: {res}")
        _logger.info("=" * 80)
        return res

    @api.depends('attribute_value_ids')
    def _compute_is_attribute_specific(self):
        """Check if image is assigned to specific attribute values"""
        for record in self:
            record.is_attribute_specific = bool(record.attribute_value_ids)

    @api.onchange('attribute_value_ids')
    def _onchange_attribute_value_ids(self):
        """Auto-fill product_tmpl_id from first attribute value"""
        if self.attribute_value_ids and not self.product_tmpl_id:
            # Get product_tmpl_id from the first attribute value
            first_attr = self.attribute_value_ids[0]
            if first_attr.product_tmpl_id:
                self.product_tmpl_id = first_attr.product_tmpl_id

    @api.depends('image')
    def _compute_image_url(self):
        """Generate public image URL"""
        for img in self:
            if img.image:
                img.image_url = f'/web/image/product.product.image/{img.id}/image'
            else:
                img.image_url = False

    @api.constrains('image')
    def _check_image_format(self):
        """Validate image format and size"""
        for record in self:
            if record.image:
                _logger.debug(f"Validating image for record {record.id}")
                try:
                    validate_image(
                        record.image,
                        max_size_mb=2,
                        allowed_formats=['png', 'jpg', 'jpeg']
                    )
                    _logger.debug(f"Image validation passed for record {record.id}")
                except ValidationError as e:
                    _logger.error(f"Image validation failed for record {record.id}: {str(e)}")
                    raise

    @api.constrains('is_main', 'product_tmpl_id')
    def _check_single_main_image(self):
        """Ensure only ONE image per product has is_main=True"""
        import logging
        _logger = logging.getLogger(__name__)

        for record in self:
            _logger.info(f"DEBUG: Checking main image constraint for record {record.id} (is_main={record.is_main})")
            if record.is_main:
                other_main = self.search([
                    ('product_tmpl_id', '=', record.product_tmpl_id.id),
                    ('is_main', '=', True),
                    ('id', '!=', record.id)
                ])
                if other_main:
                    _logger.error(f"ERROR: Multiple main images found for product {record.product_tmpl_id.id}")
                    raise ValidationError(
                        'Only one image can be marked as main. '
                        'Please unmark the current main image first.'
                    )
                else:
                    _logger.info(f"DEBUG: Main image constraint passed for record {record.id}")

    @api.model_create_multi
    def create(self, vals_list):
        """Auto-mark first image as main if no main exists. Auto-fill product_tmpl_id from attribute_value_ids if missing."""
        import logging
        _logger = logging.getLogger(__name__)

        _logger.info("=" * 80)
        _logger.info("💾 DEBUG: create() called")
        _logger.info(f"  Number of records: {len(vals_list)}")

        for idx, vals in enumerate(vals_list):
            _logger.info(f"  Record {idx + 1} vals: {vals}")

            # Auto-fill product_tmpl_id from attribute_value_ids if not provided
            if not vals.get('product_tmpl_id') and vals.get('attribute_value_ids'):
                _logger.info(f"  Auto-filling product_tmpl_id from attribute_value_ids...")
                attr_commands = vals['attribute_value_ids']
                attr_id = None

                # Parse Many2many commands to get first attribute value ID
                for cmd in attr_commands:
                    if cmd[0] == 4:  # (4, id) - link existing
                        attr_id = cmd[1]
                        break
                    elif cmd[0] == 6:  # (6, 0, [ids]) - replace all
                        if cmd[2]:
                            attr_id = cmd[2][0]
                            break

                if attr_id:
                    attr_value = self.env['product.template.attribute.value'].browse(attr_id)
                    if attr_value.product_tmpl_id:
                        vals['product_tmpl_id'] = attr_value.product_tmpl_id.id
                        _logger.info(f"  ✅ Set product_tmpl_id to {vals['product_tmpl_id']}")
            else:
                _logger.info(f"  product_tmpl_id: {vals.get('product_tmpl_id', 'MISSING!')}")

        try:
            records = super().create(vals_list)
            _logger.info(f"  ✅ Successfully created {len(records)} record(s)")

            for record in records:
                if not record.is_main:
                    existing_images = self.search([
                        ('product_tmpl_id', '=', record.product_tmpl_id.id),
                        ('id', '!=', record.id)
                    ])
                    if not existing_images:
                        record.is_main = True
                        _logger.info(f"  ✅ Marked record {record.id} as main")

            _logger.info("=" * 80)
            return records

        except Exception as e:
            _logger.error("!" * 80)
            _logger.error(f"  ❌ ERROR: {type(e).__name__}: {str(e)}")
            _logger.error("!" * 80)
            raise

    def get_api_data(self):
        """Return image data formatted for API"""
        self.ensure_one()
        # Get base URL for absolute image URLs
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url', 'http://localhost:8069')

        # Build absolute URL
        image_url = f'{base_url}/web/image/product.product.image/{self.id}/image' if self.image else None

        return {
            'id': self.id,
            'url': image_url,
            'alt': self.alt_text or (self.product_tmpl_id.name if self.product_tmpl_id else 'Product image'),
            'is_main': self.is_main,
            'is_promo': self.is_promo,
            'sequence': self.sequence,
            'is_attribute_specific': self.is_attribute_specific,
            'attribute_values': [{'id': av.id, 'name': av.name, 'attribute': av.attribute_id.name} for av in self.attribute_value_ids],
        }

    def action_set_as_main(self):
        """Set this image as main and unmark others"""
        self.ensure_one()

        other_images = self.search([
            ('product_tmpl_id', '=', self.product_tmpl_id.id),
            ('id', '!=', self.id)
        ])
        other_images.write({'is_main': False})
        self.write({'is_main': True})

        return True

    @api.model
    def create_bulk(self, product_id, images_data):
        """
        Bulk create images with auto-sequencing (for drag & drop upload).

        Args:
            product_id: ID of product.template
            images_data: List of dicts with 'image' (base64) and optional 'alt_text'

        Returns:
            Created recordset
        """
        # Get next sequence number
        existing = self.search(
            [('product_tmpl_id', '=', product_id)],
            order='sequence desc',
            limit=1
        )
        next_sequence = (existing.sequence + 10) if existing else 10

        vals_list = []
        for idx, img_data in enumerate(images_data):
            # Validate before creation
            validate_image(
                img_data['image'],
                max_size_mb=2,
                allowed_formats=['png', 'jpg', 'jpeg']
            )

            vals_list.append({
                'product_tmpl_id': product_id,
                'image': img_data['image'],
                'alt_text': img_data.get('alt_text', f'Image {idx + 1}'),
                'sequence': next_sequence + (idx * 10),
                'is_main': False,  # Don't override existing main
            })

        return self.create(vals_list)
