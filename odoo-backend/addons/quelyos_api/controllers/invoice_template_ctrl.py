# -*- coding: utf-8 -*-
"""
Contrôleur API Templates Factures

Endpoints :
- POST /api/finance/invoices/templates : Liste templates (système + custom)
- POST /api/finance/invoices/templates/create : Créer template custom
- POST /api/finance/invoices/templates/<id> : Détail template
- POST /api/finance/invoices/templates/<id>/update : Modifier template
- POST /api/finance/invoices/templates/<id>/duplicate : Dupliquer template
- POST /api/finance/invoices/templates/<id>/set-default : Définir par défaut
- POST /api/finance/invoices/templates/<id>/preview : Preview PDF
"""

import logging
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class InvoiceTemplateController(BaseController):
    """API Templates Factures"""

    @http.route('/api/finance/invoices/templates', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def list_templates(self, **params):
        """
        Liste templates (système + custom tenant)

        Query params:
        - template_type: system|custom|all (default: all)
        - sector: tech|ecommerce|btp|... (optionnel)

        Returns:
        {
          "success": true,
          "data": {
            "templates": [
              {
                "id": 1,
                "name": "Template Tech Minimal",
                "code": "tech_minimal",
                "sector": "tech",
                "template_type": "system",
                "is_default": false,
                "primary_color": "#4F46E5",
                "secondary_color": "#10B981",
                "preview_url": "/api/finance/invoices/templates/1/preview",
                "usage_count": 150
              }
            ],
            "count": 10
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            # Paramètres
            data = request.jsonrequest
            template_type = data.get('template_type', 'all')
            sector = data.get('sector')

            # Domain
            domain = [('active', '=', True)]

            if template_type == 'system':
                domain.append(('tenant_id', '=', False))
                domain.append(('template_type', '=', 'system'))
            elif template_type == 'custom':
                domain.append(('tenant_id', '=', user.tenant_id.id))
                domain.append(('template_type', '=', 'custom'))
            else:
                # all : système + custom
                domain = [
                    '|',
                    ('tenant_id', '=', False),
                    ('tenant_id', '=', user.tenant_id.id),
                    ('active', '=', True),
                ]

            if sector:
                domain.append(('sector', '=', sector))

            # Recherche
            Template = request.env['quelyos.invoice_template'].sudo()
            templates = Template.search(domain, order='template_type, sector, sequence')

            # Sérialiser
            templates_data = [{
                'id': t.id,
                'name': t.name,
                'code': t.code,
                'sector': t.sector,
                'template_type': t.template_type,
                'is_default': t.is_default,
                'primary_color': t.primary_color,
                'secondary_color': t.secondary_color,
                'font_family': t.font_family,
                'preview_url': t.preview_url,
                'usage_count': t.usage_count,
                'show_logo': t.show_logo,
                'show_company_info': t.show_company_info,
                'show_bank_details': t.show_bank_details,
            } for t in templates]

            return self._success_response({
                'templates': templates_data,
                'count': len(templates_data),
            })

        except Exception as e:
            _logger.error(f"Erreur list_templates: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/invoices/templates/create', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def create_template(self, **params):
        """
        Créer template custom

        Body:
        {
          "name": "Mon Template Entreprise",
          "code": "my_company_template",
          "sector": "tech",
          "primary_color": "#4F46E5",
          "secondary_color": "#10B981",
          "font_family": "helvetica",
          "logo_url": "https://...",
          "header_content": "<div>...</div>",
          "footer_content": "<div>...</div>",
          "custom_css": "...",
          "show_logo": true,
          "show_bank_details": true,
          "is_default": false
        }

        Returns:
        {
          "success": true,
          "data": {
            "template_id": 42,
            "message": "Template créé"
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            # Paramètres
            data = request.jsonrequest

            # Créer template
            Template = request.env['quelyos.invoice_template'].sudo()
            template = Template.create({
                'name': data.get('name'),
                'code': data.get('code'),
                'tenant_id': user.tenant_id.id,
                'user_id': user.id,
                'template_type': 'custom',
                'sector': data.get('sector', 'other'),
                'primary_color': data.get('primary_color', '#4F46E5'),
                'secondary_color': data.get('secondary_color', '#10B981'),
                'font_family': data.get('font_family', 'helvetica'),
                'logo_url': data.get('logo_url'),
                'header_content': data.get('header_content'),
                'footer_content': data.get('footer_content'),
                'custom_css': data.get('custom_css'),
                'show_logo': data.get('show_logo', True),
                'show_company_info': data.get('show_company_info', True),
                'show_bank_details': data.get('show_bank_details', True),
                'show_payment_terms': data.get('show_payment_terms', True),
                'show_tax_breakdown': data.get('show_tax_breakdown', True),
                'is_default': data.get('is_default', False),
            })

            _logger.info(f"Template créé : {template.name} (ID {template.id})")

            return self._success_response({
                'template_id': template.id,
                'message': 'Template créé avec succès',
            })

        except Exception as e:
            _logger.error(f"Erreur create_template: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/invoices/templates/<int:template_id>', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def get_template(self, template_id, **params):
        """
        Détail template

        Returns:
        {
          "success": true,
          "data": {
            "template": { ... détails complets ... }
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            # Récupérer template
            Template = request.env['quelyos.invoice_template'].sudo()
            template = Template.browse(template_id)

            if not template.exists():
                return self._error_response("Template introuvable", "NOT_FOUND", 404)

            # Vérifier accès (système ou propriétaire)
            if template.tenant_id and template.tenant_id.id != user.tenant_id.id:
                return self._error_response("Accès refusé", "FORBIDDEN", 403)

            # Sérialiser complet
            template_data = {
                'id': template.id,
                'name': template.name,
                'code': template.code,
                'sector': template.sector,
                'template_type': template.template_type,
                'is_default': template.is_default,
                'primary_color': template.primary_color,
                'secondary_color': template.secondary_color,
                'font_family': template.font_family,
                'logo_url': template.logo_url,
                'header_content': template.header_content,
                'footer_content': template.footer_content,
                'custom_css': template.custom_css,
                'show_logo': template.show_logo,
                'show_company_info': template.show_company_info,
                'show_bank_details': template.show_bank_details,
                'show_payment_terms': template.show_payment_terms,
                'show_tax_breakdown': template.show_tax_breakdown,
                'preview_url': template.preview_url,
                'usage_count': template.usage_count,
                'available_variables': template.available_variables,
            }

            return self._success_response({'template': template_data})

        except Exception as e:
            _logger.error(f"Erreur get_template: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/invoices/templates/<int:template_id>/update', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def update_template(self, template_id, **params):
        """
        Modifier template (custom seulement)

        Body: Champs à modifier (partial update)

        Returns:
        {
          "success": true,
          "data": {
            "message": "Template mis à jour"
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            # Récupérer template
            Template = request.env['quelyos.invoice_template'].sudo()
            template = Template.browse(template_id)

            if not template.exists():
                return self._error_response("Template introuvable", "NOT_FOUND", 404)

            # Vérifier propriétaire
            if template.tenant_id.id != user.tenant_id.id:
                return self._error_response("Accès refusé : template non modifiable", "FORBIDDEN", 403)

            # Paramètres
            data = request.jsonrequest

            # Mettre à jour
            update_vals = {}
            for field in ['name', 'sector', 'primary_color', 'secondary_color', 'font_family',
                          'logo_url', 'header_content', 'footer_content', 'custom_css',
                          'show_logo', 'show_company_info', 'show_bank_details',
                          'show_payment_terms', 'show_tax_breakdown']:
                if field in data:
                    update_vals[field] = data[field]

            template.write(update_vals)

            _logger.info(f"Template {template.name} mis à jour")

            return self._success_response({
                'message': 'Template mis à jour avec succès',
            })

        except Exception as e:
            _logger.error(f"Erreur update_template: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/invoices/templates/<int:template_id>/duplicate', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def duplicate_template(self, template_id, **params):
        """
        Dupliquer template (système → custom)

        Returns:
        {
          "success": true,
          "data": {
            "template_id": 43,
            "message": "Template dupliqué"
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            # Récupérer template source
            Template = request.env['quelyos.invoice_template'].sudo()
            source_template = Template.browse(template_id)

            if not source_template.exists():
                return self._error_response("Template introuvable", "NOT_FOUND", 404)

            # Dupliquer
            new_template = source_template.copy({
                'name': f"{source_template.name} (Copie)",
                'code': f"{source_template.code}_copy_{user.id}",
                'template_type': 'custom',
                'tenant_id': user.tenant_id.id,
                'user_id': user.id,
                'is_default': False,
                'usage_count': 0,
            })

            _logger.info(f"Template {source_template.name} dupliqué → {new_template.name}")

            return self._success_response({
                'template_id': new_template.id,
                'message': 'Template dupliqué avec succès',
            })

        except Exception as e:
            _logger.error(f"Erreur duplicate_template: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/invoices/templates/<int:template_id>/set-default', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def set_default_template(self, template_id, **params):
        """
        Définir template par défaut

        Returns:
        {
          "success": true,
          "data": {
            "message": "Template défini par défaut"
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            # Récupérer template
            Template = request.env['quelyos.invoice_template'].sudo()
            template = Template.browse(template_id)

            if not template.exists():
                return self._error_response("Template introuvable", "NOT_FOUND", 404)

            # Vérifier propriétaire
            if template.tenant_id.id != user.tenant_id.id:
                return self._error_response("Accès refusé", "FORBIDDEN", 403)

            # Définir par défaut
            template.action_set_as_default()

            return self._success_response({
                'message': 'Template défini comme par défaut',
            })

        except Exception as e:
            _logger.error(f"Erreur set_default_template: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/invoices/templates/<int:template_id>/preview', type='http', auth='public', methods=['GET'], csrf=False)
    def preview_template(self, template_id, **params):
        """
        Preview PDF template (avec données fictives)

        Returns: PDF file
        """
        try:
            # Récupérer template
            Template = request.env['quelyos.invoice_template'].sudo()
            template = Template.browse(template_id)

            if not template.exists():
                return request.make_response('Template introuvable', status=404)

            # TODO: Générer preview PDF avec données fictives
            _logger.info(f"Preview template {template.name} (TODO: implémenter génération PDF)")

            # Placeholder
            return request.make_response(
                'Preview PDF (TODO: implémenter génération)',
                headers=[('Content-Type', 'text/plain')]
            )

        except Exception as e:
            _logger.error(f"Erreur preview_template: {e}", exc_info=True)
            return request.make_response('Erreur génération preview', status=500)
