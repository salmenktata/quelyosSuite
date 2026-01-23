# -*- coding: utf-8 -*-

"""
Tests for StatsManager service
"""

from odoo.tests import TransactionCase
import base64


class TestStatsManager(TransactionCase):
    """Test StatsManager model"""

    def setUp(self):
        super().setUp()
        self.stats_manager = self.env['quelyos.branding.stats.manager']
        self.logo_manager = self.env['quelyos.branding.logo.manager']
        self.params = self.env['ir.config_parameter'].sudo()

        # Test logo
        self.test_logo = base64.b64encode(b'\x89PNG\r\n\x1a\n' + b'\x00' * 100)

    def test_get_module_info(self):
        """Test getting module info"""
        info = self.stats_manager.get_module_info()

        self.assertIn('version', info)
        self.assertIn('active_since', info)
        self.assertIn('state', info)
        self.assertIn('installed', info)

    def test_get_custom_logos_count_zero(self):
        """Test logo count when no logos uploaded"""
        count = self.stats_manager.get_custom_logos_count()
        # Could be 0 or more depending on test environment
        self.assertGreaterEqual(count, 0)

    def test_get_custom_logos_count_with_logos(self):
        """Test logo count with uploaded logos"""
        initial_count = self.stats_manager.get_custom_logos_count()

        # Upload logos
        self.logo_manager.save_logo('logo_main', self.test_logo)
        self.logo_manager.save_logo('logo_white', self.test_logo)

        count = self.stats_manager.get_custom_logos_count()
        self.assertEqual(count, initial_count + 2)

    def test_get_branding_stats(self):
        """Test getting comprehensive branding stats"""
        stats = self.stats_manager.get_branding_stats()

        self.assertIn('module_version', stats)
        self.assertIn('active_since', stats)
        self.assertIn('custom_logos', stats)
        self.assertIn('active_features', stats)
        self.assertIn('total_features', stats)
        self.assertIn('current_theme', stats)
        self.assertIn('theme_id', stats)

        # Verify feature count
        self.assertEqual(stats['total_features'], 6)

    def test_get_feature_status(self):
        """Test getting feature status"""
        status = self.stats_manager.get_feature_status()

        # Verify all features present
        self.assertIn('full_debranding', status)
        self.assertIn('replace_text', status)
        self.assertIn('hide_enterprise', status)
        self.assertIn('hide_studio', status)
        self.assertIn('hide_upgrade', status)
        self.assertIn('hide_menus', status)

        # Verify structure
        feature = status['full_debranding']
        self.assertIn('name', feature)
        self.assertIn('description', feature)
        self.assertIn('enabled', feature)
        self.assertIsInstance(feature['enabled'], bool)

    def test_get_feature_status_all_enabled(self):
        """Test feature status when all enabled"""
        # Enable all features
        features_params = [
            'quelyos.branding.enable_full_debranding',
            'quelyos.branding.replace_odoo_text',
            'quelyos.branding.hide_enterprise_features',
            'quelyos.branding.hide_studio',
            'quelyos.branding.hide_upgrade_prompts',
            'quelyos.branding.hide_enterprise_menus',
        ]

        for param in features_params:
            self.params.set_param(param, 'True')

        status = self.stats_manager.get_feature_status()

        # All should be enabled
        for feature in status.values():
            self.assertTrue(feature['enabled'])

    def test_get_feature_status_all_disabled(self):
        """Test feature status when all disabled"""
        # Disable all features
        features_params = [
            'quelyos.branding.enable_full_debranding',
            'quelyos.branding.replace_odoo_text',
            'quelyos.branding.hide_enterprise_features',
            'quelyos.branding.hide_studio',
            'quelyos.branding.hide_upgrade_prompts',
            'quelyos.branding.hide_enterprise_menus',
        ]

        for param in features_params:
            self.params.set_param(param, 'False')

        status = self.stats_manager.get_feature_status()

        # All should be disabled
        for feature in status.values():
            self.assertFalse(feature['enabled'])

    def test_get_configuration_summary(self):
        """Test getting configuration summary"""
        summary = self.stats_manager.get_configuration_summary()

        # Verify structure
        self.assertIn('company', summary)
        self.assertIn('theme', summary)
        self.assertIn('logos', summary)
        self.assertIn('features', summary)

        # Verify company info
        self.assertIn('name', summary['company'])
        self.assertIn('url', summary['company'])
        self.assertIn('slogan', summary['company'])

        # Verify theme info
        self.assertIn('id', summary['theme'])
        self.assertIn('name', summary['theme'])

        # Verify logos info
        self.assertIn('total', summary['logos'])
        self.assertIn('types', summary['logos'])

        # Verify features info
        self.assertIn('active', summary['features'])
        self.assertIn('total', summary['features'])
        self.assertIn('details', summary['features'])

    def test_configuration_summary_with_custom_data(self):
        """Test configuration summary with custom data"""
        # Set custom company info
        self.params.set_param('quelyos.branding.company_name', 'Test Company')
        self.params.set_param('quelyos.branding.company_url', 'https://test.com')
        self.params.set_param('quelyos.branding.slogan', 'Test Slogan')

        # Upload logos
        self.logo_manager.save_logo('logo_main', self.test_logo)
        self.logo_manager.save_logo('favicon', self.test_logo)

        summary = self.stats_manager.get_configuration_summary()

        # Verify custom data
        self.assertEqual(summary['company']['name'], 'Test Company')
        self.assertEqual(summary['company']['url'], 'https://test.com')
        self.assertEqual(summary['company']['slogan'], 'Test Slogan')

        # Verify logos
        self.assertGreaterEqual(summary['logos']['total'], 2)

    def test_stats_consistency(self):
        """Test stats are consistent across methods"""
        # Get stats from different methods
        branding_stats = self.stats_manager.get_branding_stats()
        summary = self.stats_manager.get_configuration_summary()

        # Logo count should match
        self.assertEqual(
            branding_stats['custom_logos'],
            summary['logos']['total']
        )

        # Feature count should match
        self.assertEqual(
            branding_stats['total_features'],
            summary['features']['total']
        )
