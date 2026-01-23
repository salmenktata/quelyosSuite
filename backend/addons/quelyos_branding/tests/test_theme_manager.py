# -*- coding: utf-8 -*-

"""
Tests for ThemeManager service
"""

from odoo.tests import TransactionCase


class TestThemeManager(TransactionCase):
    """Test ThemeManager model"""

    def setUp(self):
        super().setUp()
        self.theme_manager = self.env['quelyos.branding.theme.manager']
        self.params = self.env['ir.config_parameter'].sudo()

    def test_apply_blue_theme(self):
        """Test applying blue theme"""
        result = self.theme_manager.apply_theme('blue')

        self.assertEqual(result['primary_color'], '#1e40af')
        self.assertEqual(result['secondary_color'], '#10b981')
        self.assertEqual(result['name'], 'Bleu Professionnel')

        # Verify saved in config
        primary = self.params.get_param('quelyos.branding.primary_color')
        secondary = self.params.get_param('quelyos.branding.secondary_color')

        self.assertEqual(primary, '#1e40af')
        self.assertEqual(secondary, '#10b981')

    def test_apply_green_theme(self):
        """Test applying green theme"""
        result = self.theme_manager.apply_theme('green')

        self.assertEqual(result['primary_color'], '#059669')
        self.assertEqual(result['secondary_color'], '#34d399')

    def test_apply_purple_theme(self):
        """Test applying purple theme"""
        result = self.theme_manager.apply_theme('purple')

        self.assertEqual(result['primary_color'], '#7c3aed')
        self.assertEqual(result['secondary_color'], '#a78bfa')

    def test_apply_red_theme(self):
        """Test applying red theme"""
        result = self.theme_manager.apply_theme('red')

        self.assertEqual(result['primary_color'], '#dc2626')
        self.assertEqual(result['secondary_color'], '#f59e0b')

    def test_apply_orange_theme(self):
        """Test applying orange theme"""
        result = self.theme_manager.apply_theme('orange')

        self.assertEqual(result['primary_color'], '#ea580c')
        self.assertEqual(result['secondary_color'], '#fbbf24')

    def test_apply_teal_theme(self):
        """Test applying teal theme"""
        result = self.theme_manager.apply_theme('teal')

        self.assertEqual(result['primary_color'], '#0d9488')
        self.assertEqual(result['secondary_color'], '#2dd4bf')

    def test_apply_invalid_theme(self):
        """Test applying invalid theme raises error"""
        with self.assertRaises(ValueError) as cm:
            self.theme_manager.apply_theme('invalid_theme')
        self.assertIn('Thème invalide', str(cm.exception))

    def test_get_current_theme_blue(self):
        """Test getting current theme when blue is active"""
        self.theme_manager.apply_theme('blue')

        current = self.theme_manager.get_current_theme()

        self.assertEqual(current['id'], 'blue')
        self.assertEqual(current['name'], 'Bleu Professionnel')
        self.assertEqual(current['primary_color'], '#1e40af')

    def test_get_current_theme_custom(self):
        """Test getting current theme with custom colors"""
        # Set custom colors
        self.params.set_param('quelyos.branding.primary_color', '#123456')
        self.params.set_param('quelyos.branding.secondary_color', '#abcdef')

        current = self.theme_manager.get_current_theme()

        self.assertEqual(current['id'], 'custom')
        self.assertEqual(current['name'], 'Personnalisé')
        self.assertEqual(current['primary_color'], '#123456')
        self.assertEqual(current['secondary_color'], '#abcdef')

    def test_set_custom_colors(self):
        """Test setting custom colors"""
        result = self.theme_manager.set_custom_colors('#ff0000', '#00ff00')

        self.assertEqual(result['primary_color'], '#ff0000')
        self.assertEqual(result['secondary_color'], '#00ff00')

        # Verify saved
        primary = self.params.get_param('quelyos.branding.primary_color')
        secondary = self.params.get_param('quelyos.branding.secondary_color')

        self.assertEqual(primary, '#ff0000')
        self.assertEqual(secondary, '#00ff00')

    def test_validate_hex_color_valid_6_digits(self):
        """Test hex color validation with 6 digits"""
        # Should not raise
        self.theme_manager._validate_hex_color('#1e40af')
        self.theme_manager._validate_hex_color('#ABCDEF')

    def test_validate_hex_color_valid_3_digits(self):
        """Test hex color validation with 3 digits"""
        # Should not raise
        self.theme_manager._validate_hex_color('#fff')
        self.theme_manager._validate_hex_color('#ABC')

    def test_validate_hex_color_invalid_format(self):
        """Test hex color validation with invalid format"""
        with self.assertRaises(ValueError) as cm:
            self.theme_manager._validate_hex_color('1e40af')  # Missing #
        self.assertIn('invalide', str(cm.exception))

    def test_validate_hex_color_invalid_characters(self):
        """Test hex color validation with invalid characters"""
        with self.assertRaises(ValueError) as cm:
            self.theme_manager._validate_hex_color('#gggggg')
        self.assertIn('invalide', str(cm.exception))

    def test_validate_hex_color_empty(self):
        """Test hex color validation with empty string"""
        with self.assertRaises(ValueError) as cm:
            self.theme_manager._validate_hex_color('')
        self.assertIn('vide', str(cm.exception))

    def test_get_all_presets(self):
        """Test getting all presets"""
        presets = self.theme_manager.get_all_presets()

        self.assertIn('blue', presets)
        self.assertIn('green', presets)
        self.assertIn('purple', presets)
        self.assertIn('red', presets)
        self.assertIn('orange', presets)
        self.assertIn('teal', presets)

        # Verify structure
        self.assertIn('primary_color', presets['blue'])
        self.assertIn('secondary_color', presets['blue'])
        self.assertIn('name', presets['blue'])

    def test_get_preset(self):
        """Test getting specific preset"""
        preset = self.theme_manager.get_preset('blue')

        self.assertEqual(preset['primary_color'], '#1e40af')
        self.assertEqual(preset['secondary_color'], '#10b981')

    def test_get_preset_invalid(self):
        """Test getting invalid preset"""
        preset = self.theme_manager.get_preset('invalid')
        self.assertIsNone(preset)

    def test_create_notification_success(self):
        """Test creating success notification"""
        notification = self.theme_manager.create_notification(
            'Test Title',
            'Test Message',
            'success'
        )

        self.assertEqual(notification['type'], 'ir.actions.client')
        self.assertEqual(notification['tag'], 'display_notification')
        self.assertEqual(notification['params']['title'], 'Test Title')
        self.assertEqual(notification['params']['message'], 'Test Message')
        self.assertEqual(notification['params']['type'], 'success')

    def test_create_notification_default_type(self):
        """Test creating notification with default type"""
        notification = self.theme_manager.create_notification(
            'Title',
            'Message'
        )

        self.assertEqual(notification['params']['type'], 'success')
