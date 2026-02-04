# -*- coding: utf-8 -*-
"""
Configuration Homepage - Ordre et visibilité des sections
Permet aux marchands de personnaliser leur homepage e-commerce
"""
from odoo import models, fields, api
import json
import logging

_logger = logging.getLogger(__name__)


class HomepageConfig(models.Model):
    _name = 'quelyos.homepage.config'
    _description = 'Configuration Homepage E-commerce'

    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        required=True,
        ondelete='cascade',
        index=True
    )

    sections_order = fields.Json(
        string='Ordre des sections',
        default=lambda self: self._default_sections_order(),
        help='Ordre et visibilité des sections homepage'
    )

    @api.model
    def _default_sections_order(self):
        """Configuration par défaut des sections homepage"""
        return [
            {
                'id': 'hero_slider',
                'name': 'Hero Slider',
                'description': 'Carrousel principal avec slides animés',
                'visible': True,
                'icon': '🎪',
                'route': '/store/content/hero-slides'
            },
            {
                'id': 'trust_badges',
                'name': 'Trust Badges',
                'description': 'Badges de confiance (paiement sécurisé, livraison...)',
                'visible': True,
                'icon': '✓',
                'route': '/store/content/trust-badges'
            },
            {
                'id': 'flash_sales',
                'name': 'Ventes Flash',
                'description': 'Produits en promotion avec countdown',
                'visible': True,
                'icon': '⚡',
                'route': '/store/marketing/flash-sales'
            },
            {
                'id': 'categories_grid',
                'name': 'Grille Catégories',
                'description': 'Grid de catégories avec images',
                'visible': True,
                'icon': '📦',
                'route': '/store/catalog/categories'
            },
            {
                'id': 'featured_products',
                'name': 'Produits Vedette',
                'description': 'Produits mis en avant',
                'visible': True,
                'icon': '⭐',
                'route': '/store/marketing/featured'
            },
            {
                'id': 'promo_banners',
                'name': 'Bannières Promo',
                'description': 'Bannières promotionnelles avec gradients',
                'visible': True,
                'icon': '🎨',
                'route': '/store/marketing/banners'
            },
            {
                'id': 'testimonials',
                'name': 'Témoignages',
                'description': 'Avis clients avec photos',
                'visible': True,
                'icon': '💬',
                'route': '/store/content/testimonials'
            }
        ]

    @api.model
    def get_config_for_tenant(self, tenant_id):
        """
        Récupérer la configuration homepage pour un tenant.
        Crée la config par défaut si elle n'existe pas.

        Args:
            tenant_id: ID du tenant

        Returns:
            quelyos.homepage.config: Configuration homepage
        """
        config = self.search([('tenant_id', '=', tenant_id)], limit=1)

        if not config:
            config = self.create({
                'tenant_id': tenant_id,
                'sections_order': self._default_sections_order()
            })
            _logger.info(f"Created default homepage config for tenant {tenant_id}")

        return config

    def action_reset_to_default(self):
        """Reset la configuration à l'ordre par défaut"""
        self.ensure_one()
        self.sections_order = self._default_sections_order()
        _logger.info(f"Reset homepage config to default for tenant {self.tenant_id.id}")

    @api.constrains('sections_order')
    def _check_sections_order_format(self):
        """Valider le format JSON de sections_order"""
        for record in self:
            if not isinstance(record.sections_order, list):
                raise ValueError('sections_order doit être une liste')

            for section in record.sections_order:
                if not isinstance(section, dict):
                    raise ValueError('Chaque section doit être un dictionnaire')

                required_keys = ['id', 'name', 'visible']
                for key in required_keys:
                    if key not in section:
                        raise ValueError(f'Section doit contenir la clé "{key}"')

                if not isinstance(section['visible'], bool):
                    raise ValueError('visible doit être un booléen')
