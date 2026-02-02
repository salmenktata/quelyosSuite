# -*- coding: utf-8 -*-
import logging
import json
from odoo import http
from odoo.http import request
from odoo.exceptions import AccessDenied
from .super_admin import SuperAdminController
from ..config import get_cors_headers

_logger = logging.getLogger(__name__)

# Clés ir.config_parameter pour les informations légales
LEGAL_KEYS = [
    'quelyos.legal.company_name',
    'quelyos.legal.legal_form',
    'quelyos.legal.capital',
    'quelyos.legal.siret',
    'quelyos.legal.siren',
    'quelyos.legal.rcs',
    'quelyos.legal.tva_intra',
    'quelyos.legal.address',
    'quelyos.legal.director',
    'quelyos.legal.director_title',
    'quelyos.legal.email',
    'quelyos.legal.email_legal',
    'quelyos.legal.email_dpo',
    'quelyos.legal.email_support',
    'quelyos.legal.hosting_provider',
    'quelyos.legal.hosting_address',
    'quelyos.legal.hosting_country',
    'quelyos.legal.jurisdiction_courts',
    'quelyos.legal.mediator_name',
    'quelyos.legal.mediator_website',
]


class AdminLegalController(SuperAdminController):
    """Contrôleur super-admin pour les informations légales"""

    @http.route('/api/super-admin/settings/legal', type='http', auth='public', methods=['GET', 'POST', 'OPTIONS'], csrf=False)
    def legal_settings(self):
        """GET/POST informations légales (super-admin)"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            ICP = request.env['ir.config_parameter'].sudo()

            if request.httprequest.method == 'GET':
                data = {}
                for key in LEGAL_KEYS:
                    field = key.replace('quelyos.legal.', '')
                    data[field] = ICP.get_param(key, '')
                return request.make_json_response({'success': True, 'data': data}, headers=cors_headers)

            # POST - Sauvegarder
            body = json.loads(request.httprequest.data.decode('utf-8')) if request.httprequest.data else {}

            for key in LEGAL_KEYS:
                field = key.replace('quelyos.legal.', '')
                if field in body:
                    ICP.set_param(key, str(body[field] or ''))

            _logger.info(
                f"[AUDIT] Legal settings updated - User: {request.env.user.login}"
            )

            return request.make_json_response({
                'success': True,
                'message': 'Paramètres légaux sauvegardés'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Legal settings error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/public/legal-config', type='http', auth='none', methods=['GET', 'OPTIONS'], csrf=False)
    def public_legal_config(self):
        """GET informations légales publiques (pas d'auth requise)"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        try:
            ICP = request.env['ir.config_parameter'].sudo()

            data = {}
            for key in LEGAL_KEYS:
                field = key.replace('quelyos.legal.', '')
                data[field] = ICP.get_param(key, '')

            return request.make_json_response({
                'success': True,
                'data': data
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Public legal config error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )
