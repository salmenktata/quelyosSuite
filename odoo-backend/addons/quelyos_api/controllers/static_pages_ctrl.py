# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
from .base import BaseController

class StaticPagesController(BaseController):
    
    @http.route('/api/admin/static-pages', type='json', auth='public', methods=['POST'], csrf=False)
    def get_static_pages(self, **kwargs):
        tenant_id = self._authenticate_and_get_tenant()
        if not tenant_id:
            return {'success': False, 'error': 'Non authentifié'}
        
        Page = request.env['quelyos.static.page'].sudo()
        pages = Page.search([('tenant_id', '=', tenant_id)])
        
        return {
            'success': True,
            'pages': [{
                'id': p.id,
                'name': p.name,
                'slug': p.slug,
                'content_html': p.content_html or '',
                'meta_title': p.meta_title or '',
                'meta_description': p.meta_description or '',
                'state': p.state,
                'sequence': p.sequence,
                'active': p.active,
            } for p in pages]
        }
    
    @http.route('/api/admin/static-pages/save', type='json', auth='public', methods=['POST'], csrf=False)
    def save_static_page(self, id=None, **kwargs):
        tenant_id = self._authenticate_and_get_tenant()
        if not tenant_id:
            return {'success': False, 'error': 'Non authentifié'}
        
        Page = request.env['quelyos.static.page'].sudo()
        
        data = {
            'name': kwargs.get('name'),
            'slug': kwargs.get('slug'),
            'content_html': kwargs.get('content_html'),
            'meta_title': kwargs.get('meta_title'),
            'meta_description': kwargs.get('meta_description'),
            'state': kwargs.get('state', 'draft'),
            'sequence': kwargs.get('sequence', 10),
            'tenant_id': tenant_id,
        }
        
        if id:
            page = Page.search([('id', '=', id), ('tenant_id', '=', tenant_id)], limit=1)
            if page:
                page.write(data)
                return {'success': True, 'page_id': page.id}
        else:
            page = Page.create(data)
            return {'success': True, 'page_id': page.id}
        
        return {'success': False, 'error': 'Page non trouvée'}
    
    @http.route('/api/ecommerce/pages/<string:slug>', type='json', auth='public', methods=['POST'], csrf=False)
    def get_page_by_slug(self, slug, **kwargs):
        domain = kwargs.get('domain', request.httprequest.headers.get('Origin', ''))
        tenant_id = self._get_tenant_by_domain(domain)
        
        Page = request.env['quelyos.static.page'].sudo()
        page = Page.search([
            ('slug', '=', slug),
            ('tenant_id', '=', tenant_id),
            ('state', '=', 'published'),
            ('active', '=', True)
        ], limit=1)
        
        if not page:
            return {'success': False, 'error': 'Page non trouvée'}
        
        # Mapping depuis le modèle vers le format attendu par le frontend
        # Note: La table DB a un schéma plus complexe avec JSONB, mais notre modèle simple utilise des champs basiques
        return {
            'success': True,
            'page': {
                'id': page.id,
                'title': page.name,  # Mapping name → title
                'subtitle': '',  # Non géré dans le modèle simple
                'content': page.content_html or '',  # Mapping content_html → content
                'layout': 'default',  # Valeur par défaut
                'show_sidebar': False,
                'sidebar_content': '',
                'header_image_url': '',
                'show_header_image': False,
                'meta_title': page.meta_title or '',
                'meta_description': page.meta_description or '',
                'published_date': page.create_date.isoformat() if page.create_date else None,
                'updated_date': page.write_date.isoformat() if page.write_date else None,
            }
        }
