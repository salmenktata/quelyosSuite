# -*- coding: utf-8 -*-

from odoo import http, fields
from odoo.http import request
from .base_controller import BaseEcommerceController
import logging

_logger = logging.getLogger(__name__)


class CmsMenuController(BaseEcommerceController):
    """API Controller pour les menus CMS."""

    @http.route('/api/ecommerce/menus', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_menus(self, codes=None, **kwargs):
        """
        Récupère les menus du site.

        Args:
            codes: Liste des codes de menus (ex: ['header', 'footer_quick'])
                   Si None, retourne tous les menus actifs

        Returns:
            {success: True, menus: {code: {...}, ...}}
        """
        try:
            domain = [('active', '=', True)]
            if codes:
                domain.append(('code', 'in', codes))

            menus = request.env['cms.menu'].sudo().search(domain)

            result = {}
            for menu in menus:
                result[menu.code] = menu.get_menu_data()

            return self._success_response({'menus': result})

        except Exception as e:
            return self._handle_error(e, "récupération des menus")

    @http.route('/api/ecommerce/menus/<string:code>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_menu(self, code, **kwargs):
        """
        Récupère un menu spécifique par son code.

        Args:
            code: Code technique du menu (ex: 'header')

        Returns:
            {success: True, menu: {...}}
        """
        try:
            menu = request.env['cms.menu'].sudo().search([
                ('code', '=', code),
                ('active', '=', True)
            ], limit=1)

            if not menu:
                return {
                    'success': False,
                    'error': f'Menu "{code}" non trouvé'
                }

            return self._success_response({'menu': menu.get_menu_data()})

        except Exception as e:
            return self._handle_error(e, f"récupération du menu {code}")


class CmsPageController(BaseEcommerceController):
    """API Controller pour les pages CMS."""

    @http.route('/api/ecommerce/pages', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_pages(self, limit=20, offset=0, parent_id=None, template=None, **kwargs):
        """
        Liste les pages publiées.

        Args:
            limit: Nombre de pages (max 50)
            offset: Offset de pagination
            parent_id: ID de la page parente (optionnel)
            template: Filtrer par template (optionnel)

        Returns:
            {success: True, pages: [...], total: int}
        """
        try:
            now = fields.Datetime.now()
            domain = [
                ('state', '=', 'published'),
                ('active', '=', True),
                '|', ('publish_date', '=', False), ('publish_date', '<=', now),
                '|', ('unpublish_date', '=', False), ('unpublish_date', '>', now),
            ]

            if parent_id:
                domain.append(('parent_id', '=', int(parent_id)))

            if template:
                domain.append(('template', '=', template))

            Page = request.env['cms.page'].sudo()
            total = Page.search_count(domain)

            # Limiter à 50 max
            limit = min(int(limit or 20), 50)
            offset = int(offset or 0)

            pages = Page.search(domain, limit=limit, offset=offset, order='sequence, name')

            return self._success_response({
                'pages': [p.get_page_summary() for p in pages],
                'total': total,
                'limit': limit,
                'offset': offset
            })

        except Exception as e:
            return self._handle_error(e, "récupération des pages")

    @http.route('/api/ecommerce/pages/<string:slug>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_page(self, slug, **kwargs):
        """
        Récupère une page par son slug.

        Args:
            slug: Slug URL de la page (ex: 'about')

        Returns:
            {success: True, page: {...}}
        """
        try:
            page = request.env['cms.page'].sudo().get_published_page(slug)

            if not page:
                return {
                    'success': False,
                    'error': f'Page "{slug}" non trouvée'
                }

            # Incrémenter le compteur de vues
            page.increment_view_count()

            return self._success_response({'page': page.get_page_data()})

        except Exception as e:
            return self._handle_error(e, f"récupération de la page {slug}")

    @http.route('/api/ecommerce/pages/<string:slug>/seo', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_page_seo(self, slug, **kwargs):
        """
        Récupère uniquement les données SEO d'une page.
        Utile pour le pre-rendering des meta tags côté frontend.

        Args:
            slug: Slug URL de la page

        Returns:
            {success: True, seo: {...}}
        """
        try:
            page = request.env['cms.page'].sudo().get_published_page(slug)

            if not page:
                return {
                    'success': False,
                    'error': f'Page "{slug}" non trouvée'
                }

            return self._success_response({'seo': page._get_seo_data()})

        except Exception as e:
            return self._handle_error(e, f"récupération SEO de {slug}")


class CmsBlockController(BaseEcommerceController):
    """API Controller pour les blocs CMS réutilisables."""

    @http.route('/api/ecommerce/blocks/<string:code>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_block(self, code, **kwargs):
        """
        Récupère un bloc réutilisable par son code.

        Args:
            code: Code technique du bloc

        Returns:
            {success: True, block: {...}}
        """
        try:
            block = request.env['cms.block'].sudo().search([
                ('code', '=', code),
                ('active', '=', True)
            ], limit=1)

            if not block:
                return {
                    'success': False,
                    'error': f'Bloc "{code}" non trouvé'
                }

            return self._success_response({'block': block.get_block_data()})

        except Exception as e:
            return self._handle_error(e, f"récupération du bloc {code}")

    @http.route('/api/ecommerce/blocks', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_blocks(self, codes=None, **kwargs):
        """
        Récupère plusieurs blocs par leurs codes.

        Args:
            codes: Liste des codes de blocs à récupérer

        Returns:
            {success: True, blocks: {code: {...}, ...}}
        """
        try:
            domain = [('active', '=', True)]
            if codes:
                domain.append(('code', 'in', codes))

            blocks = request.env['cms.block'].sudo().search(domain)

            result = {block.code: block.get_block_data() for block in blocks}

            return self._success_response({'blocks': result})

        except Exception as e:
            return self._handle_error(e, "récupération des blocs")
