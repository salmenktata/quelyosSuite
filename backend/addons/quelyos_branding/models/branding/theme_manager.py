# -*- coding: utf-8 -*-

"""
Theme Manager for Quelyos Branding
Handles theme presets and color scheme management.
"""

from odoo import models, api


class ThemeManager(models.AbstractModel):
    """
    Service for managing theme presets and color schemes.
    Provides predefined themes and custom color management.
    """
    _name = 'quelyos.branding.theme.manager'
    _description = 'Theme Manager for Quelyos Branding'

    # Predefined theme presets
    PRESETS = {
        'blue': {
            'name': 'Bleu Professionnel',
            'description': 'Thème bleu classique et professionnel',
            'primary_color': '#1e40af',
            'secondary_color': '#10b981',
        },
        'green': {
            'name': 'Vert Écologique',
            'description': 'Thème vert naturel et écologique',
            'primary_color': '#059669',
            'secondary_color': '#34d399',
        },
        'purple': {
            'name': 'Violet Créatif',
            'description': 'Thème violet créatif et moderne',
            'primary_color': '#7c3aed',
            'secondary_color': '#a78bfa',
        },
        'red': {
            'name': 'Rouge Énergique',
            'description': 'Thème rouge dynamique et énergique',
            'primary_color': '#dc2626',
            'secondary_color': '#f59e0b',
        },
        'orange': {
            'name': 'Orange Vitaminé',
            'description': 'Thème orange chaleureux et accueillant',
            'primary_color': '#ea580c',
            'secondary_color': '#fbbf24',
        },
        'teal': {
            'name': 'Teal Moderne',
            'description': 'Thème teal frais et moderne',
            'primary_color': '#0d9488',
            'secondary_color': '#2dd4bf',
        },
    }

    @api.model
    def apply_theme(self, theme_name):
        """
        Apply a predefined theme.

        Args:
            theme_name: Name of the theme (blue, green, purple, red, etc.)

        Returns:
            dict: Applied theme colors

        Raises:
            ValueError: If theme name is invalid
        """
        if theme_name not in self.PRESETS:
            raise ValueError(
                f"Thème invalide: {theme_name}. "
                f"Thèmes disponibles: {', '.join(self.PRESETS.keys())}"
            )

        theme = self.PRESETS[theme_name]
        params = self.env['ir.config_parameter'].sudo()

        # Apply colors
        params.set_param('quelyos.branding.primary_color', theme['primary_color'])
        params.set_param('quelyos.branding.secondary_color', theme['secondary_color'])

        return {
            'primary_color': theme['primary_color'],
            'secondary_color': theme['secondary_color'],
            'name': theme['name'],
            'description': theme['description'],
        }

    @api.model
    def get_current_theme(self):
        """
        Get the current active theme.

        Returns:
            dict: Current theme info or 'custom' if colors don't match any preset
        """
        params = self.env['ir.config_parameter'].sudo()

        current_primary = params.get_param('quelyos.branding.primary_color', '#1e40af')
        current_secondary = params.get_param('quelyos.branding.secondary_color', '#10b981')

        # Check if current colors match any preset
        for theme_name, theme in self.PRESETS.items():
            if (theme['primary_color'] == current_primary and
                theme['secondary_color'] == current_secondary):
                return {
                    'id': theme_name,
                    'name': theme['name'],
                    'description': theme['description'],
                    'primary_color': current_primary,
                    'secondary_color': current_secondary,
                }

        # Custom theme
        return {
            'id': 'custom',
            'name': 'Personnalisé',
            'description': 'Couleurs personnalisées',
            'primary_color': current_primary,
            'secondary_color': current_secondary,
        }

    @api.model
    def set_custom_colors(self, primary_color, secondary_color):
        """
        Set custom theme colors.

        Args:
            primary_color: Primary color in hex format (#RRGGBB)
            secondary_color: Secondary color in hex format (#RRGGBB)

        Returns:
            dict: Applied colors

        Raises:
            ValueError: If color format is invalid
        """
        # Validate hex color format
        self._validate_hex_color(primary_color)
        self._validate_hex_color(secondary_color)

        params = self.env['ir.config_parameter'].sudo()

        params.set_param('quelyos.branding.primary_color', primary_color)
        params.set_param('quelyos.branding.secondary_color', secondary_color)

        return {
            'primary_color': primary_color,
            'secondary_color': secondary_color,
        }

    def _validate_hex_color(self, color):
        """
        Validate hex color format.

        Args:
            color: Color string to validate

        Raises:
            ValueError: If format is invalid
        """
        import re

        if not color:
            raise ValueError("Couleur vide")

        # Regex pour format hex #RRGGBB ou #RGB
        pattern = r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'

        if not re.match(pattern, color):
            raise ValueError(
                f"Format de couleur invalide: {color}. "
                f"Format attendu: #RRGGBB (ex: #1e40af)"
            )

    @api.model
    def get_all_presets(self):
        """
        Get all available theme presets.

        Returns:
            dict: All theme presets
        """
        return self.PRESETS

    @api.model
    def get_preset(self, theme_name):
        """
        Get a specific theme preset.

        Args:
            theme_name: Name of the theme

        Returns:
            dict: Theme preset or None
        """
        return self.PRESETS.get(theme_name)

    @api.model
    def create_notification(self, title, message, notification_type='success'):
        """
        Create a notification dict for display.

        Args:
            title: Notification title
            message: Notification message
            notification_type: Type (success, info, warning, danger)

        Returns:
            dict: Notification action
        """
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': title,
                'message': message,
                'type': notification_type,
                'sticky': False,
            }
        }
