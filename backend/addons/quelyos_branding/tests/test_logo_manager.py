# -*- coding: utf-8 -*-

"""
Tests for LogoManager service
"""

from odoo.tests import TransactionCase
from odoo.exceptions import ValidationError
import base64


class TestLogoManager(TransactionCase):
    """Test LogoManager model"""

    def setUp(self):
        super().setUp()
        self.logo_manager = self.env['quelyos.branding.logo.manager']
        self.params = self.env['ir.config_parameter'].sudo()

        # Create test image (minimal valid PNG)
        self.test_logo = base64.b64encode(
            b'\x89PNG\r\n\x1a\n' + b'\x00' * 100
        )

    def test_save_logo_main(self):
        """Test saving logo_main"""
        attachment_id = self.logo_manager.save_logo('logo_main', self.test_logo)

        # Verify attachment created
        self.assertTrue(attachment_id)

        # Verify config parameter saved
        saved_id = self.params.get_param('quelyos.branding.logo_main_id')
        self.assertEqual(str(attachment_id), saved_id)

        # Verify attachment exists
        attachment = self.env['ir.attachment'].sudo().browse(attachment_id)
        self.assertTrue(attachment.exists())
        self.assertEqual(attachment.name, 'quelyos_logo_main.png')

    def test_save_logo_white(self):
        """Test saving logo_white"""
        attachment_id = self.logo_manager.save_logo('logo_white', self.test_logo)
        self.assertTrue(attachment_id)

        saved_id = self.params.get_param('quelyos.branding.logo_white_id')
        self.assertEqual(str(attachment_id), saved_id)

    def test_save_logo_replaces_old(self):
        """Test saving logo replaces old one"""
        # Save first logo
        first_id = self.logo_manager.save_logo('logo_main', self.test_logo)

        # Save second logo (should replace first)
        second_id = self.logo_manager.save_logo('logo_main', self.test_logo)

        # Verify different IDs
        self.assertNotEqual(first_id, second_id)

        # Verify first attachment deleted
        first_attachment = self.env['ir.attachment'].sudo().browse(first_id)
        self.assertFalse(first_attachment.exists())

        # Verify second attachment exists
        second_attachment = self.env['ir.attachment'].sudo().browse(second_id)
        self.assertTrue(second_attachment.exists())

    def test_save_invalid_logo_type(self):
        """Test saving with invalid logo type"""
        with self.assertRaises(ValidationError) as cm:
            self.logo_manager.save_logo('invalid_type', self.test_logo)
        self.assertIn('invalide', str(cm.exception))

    def test_save_empty_data(self):
        """Test saving with empty data"""
        with self.assertRaises(ValidationError) as cm:
            self.logo_manager.save_logo('logo_main', None)
        self.assertIn('Aucune donnée', str(cm.exception))

    def test_get_logo(self):
        """Test getting a logo"""
        # Save logo
        attachment_id = self.logo_manager.save_logo('logo_main', self.test_logo)

        # Get logo
        logo = self.logo_manager.get_logo('logo_main')

        self.assertTrue(logo)
        self.assertEqual(logo.id, attachment_id)

    def test_get_logo_not_exists(self):
        """Test getting non-existent logo"""
        logo = self.logo_manager.get_logo('logo_main')
        self.assertFalse(logo)

    def test_get_logo_invalid_type(self):
        """Test getting logo with invalid type"""
        logo = self.logo_manager.get_logo('invalid_type')
        self.assertFalse(logo)

    def test_delete_logo(self):
        """Test deleting a logo"""
        # Save logo
        attachment_id = self.logo_manager.save_logo('logo_main', self.test_logo)

        # Delete logo
        result = self.logo_manager.delete_logo('logo_main')
        self.assertTrue(result)

        # Verify attachment deleted
        attachment = self.env['ir.attachment'].sudo().browse(attachment_id)
        self.assertFalse(attachment.exists())

        # Verify config parameter cleared
        saved_id = self.params.get_param('quelyos.branding.logo_main_id')
        self.assertFalse(saved_id)

    def test_delete_logo_invalid_type(self):
        """Test deleting logo with invalid type"""
        result = self.logo_manager.delete_logo('invalid_type')
        self.assertFalse(result)

    def test_count_custom_logos(self):
        """Test counting custom logos"""
        # Initially 0
        count = self.logo_manager.count_custom_logos()
        self.assertEqual(count, 0)

        # Save 3 logos
        self.logo_manager.save_logo('logo_main', self.test_logo)
        self.logo_manager.save_logo('logo_white', self.test_logo)
        self.logo_manager.save_logo('favicon', self.test_logo)

        # Count should be 3
        count = self.logo_manager.count_custom_logos()
        self.assertEqual(count, 3)

    def test_get_all_logos(self):
        """Test getting all logos"""
        # Save multiple logos
        self.logo_manager.save_logo('logo_main', self.test_logo)
        self.logo_manager.save_logo('logo_white', self.test_logo)

        # Get all logos
        all_logos = self.logo_manager.get_all_logos()

        self.assertEqual(len(all_logos), 2)
        self.assertIn('logo_main', all_logos)
        self.assertIn('logo_white', all_logos)

    def test_logo_attachment_properties(self):
        """Test logo attachment has correct properties"""
        attachment_id = self.logo_manager.save_logo('logo_main', self.test_logo)
        attachment = self.env['ir.attachment'].sudo().browse(attachment_id)

        self.assertEqual(attachment.name, 'quelyos_logo_main.png')
        self.assertEqual(attachment.mimetype, 'image/png')
        self.assertEqual(attachment.type, 'binary')
        self.assertTrue(attachment.public)
        self.assertEqual(attachment.res_model, 'res.config.settings')

    def test_save_favicon_different_mimetype(self):
        """Test favicon has different MIME type"""
        # Create ICO data
        ico_data = base64.b64encode(b'\x00\x00\x01\x00' + b'\x00' * 100)

        attachment_id = self.logo_manager.save_logo('favicon', ico_data)
        attachment = self.env['ir.attachment'].sudo().browse(attachment_id)

        self.assertEqual(attachment.mimetype, 'image/x-icon')
        self.assertEqual(attachment.name, 'quelyos_favicon.ico')
