# -*- coding: utf-8 -*-

from odoo import http
from odoo.http import request
from odoo.tools import file_open
import base64
import logging
from functools import lru_cache

_logger = logging.getLogger(__name__)

# Cache pour les paramètres de configuration (réduit les requêtes SQL)
_logo_cache = {}


class QuelyosLogoController(http.Controller):
    """Controller to serve dynamically uploaded logos."""

    @http.route('/quelyos_branding/logo/<string:logo_type>',
                type='http', auth='public', website=True)
    def get_logo(self, logo_type, **kwargs):
        """
        Serve logo based on type - OPTIMISÉ avec cache.

        Args:
            logo_type: 'main', 'white', 'small', 'email', 'favicon'

        Returns:
            Binary image response or fallback to static file
        """
        # Map logo type to config parameter
        logo_mapping = {
            'main': 'quelyos.branding.logo_main_id',
            'white': 'quelyos.branding.logo_white_id',
            'small': 'quelyos.branding.logo_small_id',
            'email': 'quelyos.branding.logo_email_id',
            'favicon': 'quelyos.branding.favicon_id',
        }

        # Static fallback paths
        fallback_mapping = {
            'main': '/quelyos_branding/static/src/img/logo/quelyos_logo.svg',
            'white': '/quelyos_branding/static/src/img/logo/quelyos_logo_white.svg',
            'small': '/quelyos_branding/static/src/img/logo/quelyos_logo_small.png',
            'email': '/quelyos_branding/static/src/img/logo/quelyos_logo.png',
            'favicon': '/quelyos_branding/static/src/img/favicon/favicon.ico',
        }

        if logo_type not in logo_mapping:
            return request.not_found()

        # Cache key pour ce logo
        cache_key = logo_mapping[logo_type]

        # Vérifier le cache d'abord (évite requête SQL)
        if cache_key in _logo_cache:
            cached_data = _logo_cache[cache_key]
            if cached_data:
                return request.make_response(
                    cached_data['data'],
                    headers=[
                        ('Content-Type', cached_data['content_type']),
                        ('Cache-Control', 'public, max-age=604800'),  # 1 week
                        ('ETag', f'"{cached_data["etag"]}"'),  # ETag pour validation cache
                    ]
                )

        # Try to get uploaded logo (avec cache)
        params = request.env['ir.config_parameter'].sudo()
        attachment_id = params.get_param(cache_key)

        if attachment_id:
            try:
                attachment = request.env['ir.attachment'].sudo().browse(int(attachment_id))
                if attachment.exists() and attachment.datas:
                    # Determine content type
                    content_type = 'image/png'
                    if attachment.mimetype:
                        content_type = attachment.mimetype
                    elif attachment.name:
                        if attachment.name.endswith('.svg'):
                            content_type = 'image/svg+xml'
                        elif attachment.name.endswith('.ico'):
                            content_type = 'image/x-icon'
                        elif attachment.name.endswith(('.jpg', '.jpeg')):
                            content_type = 'image/jpeg'

                    # Décodage des données
                    logo_data = base64.b64decode(attachment.datas)

                    # Sauvegarder dans le cache (OPTIMISATION)
                    _logo_cache[cache_key] = {
                        'data': logo_data,
                        'content_type': content_type,
                        'etag': str(attachment.id),  # Utiliser l'ID comme ETag
                    }

                    # Return image
                    return request.make_response(
                        logo_data,
                        headers=[
                            ('Content-Type', content_type),
                            ('Cache-Control', 'public, max-age=604800'),  # 1 week
                            ('ETag', f'"{attachment.id}"'),
                        ]
                    )
            except Exception as e:
                _logger.warning(f"Error serving logo {logo_type}: {str(e)}")
                # Invalider le cache en cas d'erreur
                _logo_cache.pop(cache_key, None)

        # Fallback to static file
        return request.redirect(fallback_mapping[logo_type])

    @classmethod
    def clear_logo_cache(cls):
        """Clear the logo cache - Appelé quand les logos sont mis à jour."""
        global _logo_cache
        _logo_cache = {}
        _logger.info("Logo cache cleared")

    @http.route('/quelyos_branding/logo/<string:logo_type>/url',
                type='json', auth='user')
    def get_logo_url(self, logo_type, **kwargs):
        """
        Get logo URL (for JavaScript usage).

        Returns:
            {
                'url': '/quelyos_branding/logo/main',
                'has_custom': True
            }
        """
        params = request.env['ir.config_parameter'].sudo()

        logo_mapping = {
            'main': 'quelyos.branding.logo_main_id',
            'white': 'quelyos.branding.logo_white_id',
            'small': 'quelyos.branding.logo_small_id',
            'email': 'quelyos.branding.logo_email_id',
            'favicon': 'quelyos.branding.favicon_id',
        }

        has_custom = bool(params.get_param(logo_mapping.get(logo_type)))

        return {
            'url': f'/quelyos_branding/logo/{logo_type}',
            'has_custom': has_custom,
        }
