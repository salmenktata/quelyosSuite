# -*- coding: utf-8 -*-

"""
Tests for ImageValidator service
"""

from odoo.tests import TransactionCase
from odoo.exceptions import ValidationError
import base64


class TestImageValidator(TransactionCase):
    """Test ImageValidator model"""

    def setUp(self):
        super().setUp()
        self.validator = self.env['quelyos.branding.image.validator']

        # Create test images (minimal valid images)
        # PNG magic bytes: \x89PNG\r\n\x1a\n + minimal PNG data
        self.valid_png = base64.b64encode(
            b'\x89PNG\r\n\x1a\n' + b'\x00' * 100
        )

        # JPEG magic bytes: \xff\xd8\xff
        self.valid_jpeg = base64.b64encode(
            b'\xff\xd8\xff\xe0' + b'\x00' * 100
        )

        # ICO magic bytes: \x00\x00\x01\x00
        self.valid_ico = base64.b64encode(
            b'\x00\x00\x01\x00' + b'\x00' * 100
        )

        # SVG minimal
        self.valid_svg = base64.b64encode(
            b'<svg xmlns="http://www.w3.org/2000/svg"></svg>'
        )

        # Invalid format
        self.invalid_format = base64.b64encode(b'INVALID_IMAGE_DATA')

        # Too large (create 3MB image)
        self.too_large = base64.b64encode(b'\x89PNG\r\n\x1a\n' + b'\x00' * (3 * 1024 * 1024))

    def test_validate_png_success(self):
        """Test PNG validation succeeds"""
        result = self.validator.validate_image(
            self.valid_png,
            max_size_mb=2,
            allowed_formats=['png']
        )
        self.assertTrue(result)

    def test_validate_jpeg_success(self):
        """Test JPEG validation succeeds"""
        result = self.validator.validate_image(
            self.valid_jpeg,
            max_size_mb=2,
            allowed_formats=['jpg', 'jpeg']
        )
        self.assertTrue(result)

    def test_validate_ico_success(self):
        """Test ICO validation succeeds"""
        result = self.validator.validate_image(
            self.valid_ico,
            max_size_mb=1,
            allowed_formats=['ico']
        )
        self.assertTrue(result)

    def test_validate_svg_success(self):
        """Test SVG validation succeeds"""
        result = self.validator.validate_image(
            self.valid_svg,
            max_size_mb=2,
            allowed_formats=['svg']
        )
        self.assertTrue(result)

    def test_validate_empty_image(self):
        """Test empty image returns True (no validation)"""
        result = self.validator.validate_image(None)
        self.assertTrue(result)

    def test_validate_size_too_large(self):
        """Test image size validation fails"""
        with self.assertRaises(ValidationError) as cm:
            self.validator.validate_image(
                self.too_large,
                max_size_mb=2,
                allowed_formats=['png']
            )
        self.assertIn('trop volumineuse', str(cm.exception))

    def test_validate_format_not_allowed(self):
        """Test format not allowed"""
        with self.assertRaises(ValidationError) as cm:
            self.validator.validate_image(
                self.valid_jpeg,
                max_size_mb=2,
                allowed_formats=['png']  # Only PNG allowed
            )
        self.assertIn('Format non autorisé', str(cm.exception))

    def test_validate_invalid_base64(self):
        """Test invalid base64 data"""
        with self.assertRaises(ValidationError) as cm:
            self.validator.validate_image(
                'INVALID_BASE64!!!',
                max_size_mb=2,
                allowed_formats=['png']
            )
        self.assertIn('invalide', str(cm.exception))

    def test_validate_logo_main(self):
        """Test logo_main validation"""
        result = self.validator.validate_logo('logo_main', self.valid_png)
        self.assertTrue(result)

    def test_validate_logo_white(self):
        """Test logo_white validation"""
        result = self.validator.validate_logo('logo_white', self.valid_svg)
        self.assertTrue(result)

    def test_validate_logo_small(self):
        """Test logo_small validation"""
        result = self.validator.validate_logo('logo_small', self.valid_jpeg)
        self.assertTrue(result)

    def test_validate_logo_email(self):
        """Test logo_email validation"""
        result = self.validator.validate_logo('logo_email', self.valid_png)
        self.assertTrue(result)

    def test_validate_favicon(self):
        """Test favicon validation"""
        result = self.validator.validate_logo('favicon', self.valid_ico)
        self.assertTrue(result)

    def test_validate_invalid_logo_type(self):
        """Test invalid logo type"""
        with self.assertRaises(ValidationError) as cm:
            self.validator.validate_logo('invalid_type', self.valid_png)
        self.assertIn('invalide', str(cm.exception))

    def test_get_logo_config(self):
        """Test get_logo_config method"""
        config = self.validator.get_logo_config('logo_main')
        self.assertIn('max_size_mb', config)
        self.assertIn('allowed_formats', config)
        self.assertEqual(config['max_size_mb'], 2)

    def test_get_recommended_size(self):
        """Test get_recommended_size method"""
        size = self.validator.get_recommended_size('logo_main')
        self.assertEqual(size, '1000x250px')

    def test_magic_bytes_png(self):
        """Test PNG magic bytes detection"""
        result = self.validator._validate_format_fast(
            b'\x89PNG\r\n\x1a\n' + b'\x00' * 100,
            ['png']
        )
        self.assertTrue(result)

    def test_magic_bytes_jpeg(self):
        """Test JPEG magic bytes detection"""
        result = self.validator._validate_format_fast(
            b'\xff\xd8\xff' + b'\x00' * 100,
            ['jpg', 'jpeg']
        )
        self.assertTrue(result)

    def test_magic_bytes_ico(self):
        """Test ICO magic bytes detection"""
        result = self.validator._validate_format_fast(
            b'\x00\x00\x01\x00' + b'\x00' * 100,
            ['ico']
        )
        self.assertTrue(result)

    def test_magic_bytes_svg(self):
        """Test SVG detection"""
        result = self.validator._validate_format_fast(
            b'<svg xmlns="http://www.w3.org/2000/svg"></svg>',
            ['svg']
        )
        self.assertTrue(result)

    def test_magic_bytes_invalid(self):
        """Test invalid magic bytes"""
        result = self.validator._validate_format_fast(
            b'INVALID_DATA',
            ['png']
        )
        self.assertFalse(result)
