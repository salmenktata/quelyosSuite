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
                'content_html': p.content_html,
                'meta_title': p.meta_title,
                'meta_description': p.meta_description,
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
        
        return {
            'success': True,
            'page': {
                'name': page.name,
                'slug': page.slug,
                'content_html': page.content_html,
                'meta_title': page.meta_title,
                'meta_description': page.meta_description,
            }
        }
