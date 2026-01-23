# -*- coding: utf-8 -*-

"""
Tests for ResConfigSettings integration
"""

from odoo.tests import TransactionCase
import base64


class TestResConfigSettings(TransactionCase):
    """Test ResConfigSettings integration with services"""

    def setUp(self):
        super().setUp()
        self.config = self.env['res.config.settings'].create({})
        self.test_logo = base64.b64encode(b'\x89PNG\r\n\x1a\n' + b'\x00' * 100)

    def test_onchange_logo_main_valid(self):
        """Test onchange validation for logo_main"""
        # Should not raise
        self.config.quelyos_branding_logo_main = self.test_logo
        self.config._onchange_logo_main()

    def test_onchange_logo_white_valid(self):
        """Test onchange validation for logo_white"""
        # Should not raise
        self.config.quelyos_branding_logo_white = self.test_logo
        self.config._onchange_logo_main()

    def test_onchange_logo_small_valid(self):
        """Test onchange validation for logo_small"""
        # Should not raise
        self.config.quelyos_branding_logo_small = self.test_logo
        self.config._onchange_logo_small_email()

    def test_onchange_logo_email_valid(self):
        """Test onchange validation for logo_email"""
        # Should not raise
        self.config.quelyos_branding_logo_email = self.test_logo
        self.config._onchange_logo_small_email()

    def test_onchange_favicon_valid(self):
        """Test onchange validation for favicon"""
        favicon_data = base64.b64encode(b'\x00\x00\x01\x00' + b'\x00' * 100)
        self.config.quelyos_branding_favicon = favicon_data
        self.config._onchange_favicon()

    def test_compute_module_info(self):
        """Test module info computation"""
        self.config._compute_module_info()

        self.assertTrue(self.config.quelyos_branding_module_version)

    def test_compute_custom_logos(self):
        """Test custom logos computation"""
        self.config._compute_custom_logos()

        # Should be integer >= 0
        self.assertGreaterEqual(self.config.quelyos_branding_custom_logos, 0)

    def test_action_reset_to_defaults(self):
        """Test resetting to defaults"""
        result = self.config.action_reset_to_defaults()

        # Should return notification
        self.assertEqual(result['type'], 'ir.actions.client')
        self.assertEqual(result['tag'], 'display_notification')

        # Verify values reset
        params = self.env['ir.config_parameter'].sudo()
        company_name = params.get_param('quelyos.branding.company_name')
        self.assertEqual(company_name, 'Quelyos')

    def test_action_set_blue_theme(self):
        """Test setting blue theme"""
        result = self.config.action_set_blue_theme()

        # Should return notification
        self.assertEqual(result['type'], 'ir.actions.client')

        # Verify theme applied
        params = self.env['ir.config_parameter'].sudo()
        primary = params.get_param('quelyos.branding.primary_color')
        self.assertEqual(primary, '#1e40af')

    def test_action_set_green_theme(self):
        """Test setting green theme"""
        result = self.config.action_set_green_theme()
        self.assertEqual(result['type'], 'ir.actions.client')

    def test_action_set_purple_theme(self):
        """Test setting purple theme"""
        result = self.config.action_set_purple_theme()
        self.assertEqual(result['type'], 'ir.actions.client')

    def test_action_set_red_theme(self):
        """Test setting red theme"""
        result = self.config.action_set_red_theme()
        self.assertEqual(result['type'], 'ir.actions.client')

    def test_set_values_saves_logos(self):
        """Test set_values saves logos via LogoManager"""
        # Set logo data
        self.config.quelyos_branding_logo_main = self.test_logo

        # Call set_values
        self.config.set_values()

        # Verify logo saved
        params = self.env['ir.config_parameter'].sudo()
        logo_id = params.get_param('quelyos.branding.logo_main_id')
        self.assertTrue(logo_id)

    def test_set_values_multiple_logos(self):
        """Test set_values saves multiple logos"""
        # Set multiple logos
        self.config.quelyos_branding_logo_main = self.test_logo
        self.config.quelyos_branding_logo_white = self.test_logo
        self.config.quelyos_branding_logo_small = self.test_logo

        # Call set_values
        self.config.set_values()

        # Verify all saved
        params = self.env['ir.config_parameter'].sudo()
        self.assertTrue(params.get_param('quelyos.branding.logo_main_id'))
        self.assertTrue(params.get_param('quelyos.branding.logo_white_id'))
        self.assertTrue(params.get_param('quelyos.branding.logo_small_id'))

    def test_fields_exist(self):
        """Test all expected fields exist"""
        # Company info fields
        self.assertTrue(hasattr(self.config, 'quelyos_branding_company_name'))
        self.assertTrue(hasattr(self.config, 'quelyos_branding_company_url'))
        self.assertTrue(hasattr(self.config, 'quelyos_branding_support_url'))
        self.assertTrue(hasattr(self.config, 'quelyos_branding_docs_url'))

        # Color fields
        self.assertTrue(hasattr(self.config, 'quelyos_branding_primary_color'))
        self.assertTrue(hasattr(self.config, 'quelyos_branding_secondary_color'))

        # Logo fields
        self.assertTrue(hasattr(self.config, 'quelyos_branding_logo_main'))
        self.assertTrue(hasattr(self.config, 'quelyos_branding_logo_white'))
        self.assertTrue(hasattr(self.config, 'quelyos_branding_logo_small'))
        self.assertTrue(hasattr(self.config, 'quelyos_branding_logo_email'))
        self.assertTrue(hasattr(self.config, 'quelyos_branding_favicon'))

        # Boolean fields
        self.assertTrue(hasattr(self.config, 'quelyos_branding_enable_full_debranding'))
        self.assertTrue(hasattr(self.config, 'quelyos_branding_replace_odoo_text'))
        self.assertTrue(hasattr(self.config, 'quelyos_branding_hide_enterprise_features'))

        # Computed fields
        self.assertTrue(hasattr(self.config, 'quelyos_branding_module_version'))
        self.assertTrue(hasattr(self.config, 'quelyos_branding_active_since'))
        self.assertTrue(hasattr(self.config, 'quelyos_branding_custom_logos'))
