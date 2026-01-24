# -*- coding: utf-8 -*-

from odoo import http
from odoo.http import request
from .base_controller import BaseEcommerceController
import logging

_logger = logging.getLogger(__name__)


class SiteConfigController(BaseEcommerceController):
    """Controller pour la configuration du site."""

    @http.route(
        '/api/ecommerce/site-config',
        type='json',
        auth='public',
        methods=['POST'],
        csrf=False
    )
    def get_site_config(self, **kwargs):
        """
        Récupère la configuration complète du site pour le frontend.

        Returns:
            dict: Configuration du site incluant:
                - brand: informations de marque
                - social: liens réseaux sociaux
                - shipping: configuration livraison
                - returns: politique de retour
                - customerService: service client
                - currency: devise
                - loyalty: programme fidélité
                - seo: configuration SEO
                - features: flags de fonctionnalités
        """
        try:
            # Get ecommerce config
            ecommerce_config = request.env['ecommerce.config'].sudo().get_site_config()

            # Get frontend config for feature flags
            frontend_config = request.env['quelyos.frontend.config'].sudo().get_config()

            # Merge feature flags
            ecommerce_config['features'] = {
                'wishlist': frontend_config.get('enable_wishlist', True),
                'comparison': frontend_config.get('enable_comparison', True),
                'reviews': frontend_config.get('enable_reviews', True),
                'guestCheckout': frontend_config.get('enable_guest_checkout', False),
            }

            # Add products per page
            ecommerce_config['pagination'] = {
                'productsPerPage': frontend_config.get('products_per_page', 24),
            }

            # Add branding assets
            ecommerce_config['assets'] = {
                'logoUrl': frontend_config.get('logo_url', ''),
                'primaryColor': frontend_config.get('primary_color', '#01613a'),
                'secondaryColor': frontend_config.get('secondary_color', '#c9c18f'),
            }

            return self._success_response(data={'config': ecommerce_config})

        except Exception as e:
            return self._handle_error(e, "récupération de la configuration du site")

    @http.route(
        '/api/ecommerce/site-config/brand',
        type='json',
        auth='public',
        methods=['POST'],
        csrf=False
    )
    def get_brand_config(self, **kwargs):
        """Récupère uniquement la configuration de marque."""
        try:
            config = request.env['ecommerce.config'].sudo().get_site_config()
            return self._success_response(data={
                'brand': config.get('brand', {}),
                'social': config.get('social', {}),
            })
        except Exception as e:
            return self._handle_error(e, "récupération de la configuration de marque")

    @http.route(
        '/api/ecommerce/site-config/shipping',
        type='json',
        auth='public',
        methods=['POST'],
        csrf=False
    )
    def get_shipping_config(self, **kwargs):
        """Récupère uniquement la configuration de livraison."""
        try:
            config = request.env['ecommerce.config'].sudo().get_site_config()
            return self._success_response(data={
                'shipping': config.get('shipping', {}),
                'returns': config.get('returns', {}),
            })
        except Exception as e:
            return self._handle_error(e, "récupération de la configuration de livraison")
