# -*- coding: utf-8 -*-
"""
Contrôleur API Tickets Support - Client
"""
import logging
import base64
from odoo import http
from odoo.http import request
from .base import BaseController
from ..config import get_cors_headers

_logger = logging.getLogger(__name__)


class TicketController(BaseController):
    """Contrôleur pour les endpoints clients de tickets de support"""

    @http.route('/api/tickets', type='http', auth='public',
                methods=['GET', 'OPTIONS'], csrf=False)
    def list_tickets(self):
        """Liste des tickets du tenant avec filtres"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        # Authentification
        error = self._authenticate_from_header()
        if error:
            return request.make_json_response(error, headers=cors_headers, status=401)

        params = self._get_http_params()

        # Filtres (limités au tenant de l'utilisateur)
        domain = [('company_id', '=', request.env.company.id)]

        if params.get('state'):
            domain.append(('state', '=', params['state']))

        if params.get('priority'):
            domain.append(('priority', '=', params['priority']))

        if params.get('category'):
            domain.append(('category', '=', params['category']))

        if params.get('search'):
            search = params['search']
            domain.append('|')
            domain.append(('subject', 'ilike', search))
            domain.append(('name', 'ilike', search))

        # Pagination
        limit = min(int(params.get('limit', 20)), 100)
        offset = int(params.get('offset', 0))

        try:
            tickets = request.env['quelyos.ticket'].search(
                domain,
                limit=limit,
                offset=offset,
                order='create_date desc'
            )

            return request.make_json_response({
                'success': True,
                'tickets': [t.to_dict() for t in tickets],
                'total': request.env['quelyos.ticket'].search_count(domain)
            }, headers=cors_headers)
        except Exception as e:
            _logger.exception("Error listing tickets")
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=500)

    @http.route('/api/tickets', type='http', auth='public',
                methods=['POST'], csrf=False)
    def create_ticket(self):
        """Créer un nouveau ticket"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        error = self._authenticate_from_header()
        if error:
            return request.make_json_response(error, headers=cors_headers, status=401)

        params = self._get_http_params()

        # Validation
        required = ['subject', 'description', 'category']
        for field in required:
            if not params.get(field):
                return request.make_json_response({
                    'success': False,
                    'error': f'Le champ {field} est requis'
                }, headers=cors_headers, status=400)

        # Créer ticket
        try:
            ticket = request.env['quelyos.ticket'].create({
                'subject': params['subject'],
                'description': params['description'],
                'category': params['category'],
                'priority': params.get('priority', 'medium'),
                'partner_id': request.env.user.partner_id.id,
                'order_id': params.get('orderId'),
                'product_id': params.get('productId'),
                'source': 'dashboard',
            })

            return request.make_json_response({
                'success': True,
                'ticket': ticket.to_dict()
            }, headers=cors_headers)
        except Exception as e:
            _logger.exception("Error creating ticket")
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=500)

    @http.route('/api/tickets/<int:ticket_id>', type='http', auth='public',
                methods=['GET', 'OPTIONS'], csrf=False)
    def get_ticket(self, ticket_id):
        """Détail d'un ticket avec messages"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        error = self._authenticate_from_header()
        if error:
            return request.make_json_response(error, headers=cors_headers, status=401)

        try:
            ticket = request.env['quelyos.ticket'].search([
                ('id', '=', ticket_id),
                ('company_id', '=', request.env.company.id)
            ], limit=1)

            if not ticket:
                return request.make_json_response({
                    'success': False,
                    'error': 'Ticket non trouvé'
                }, headers=cors_headers, status=404)

            messages = ticket.message_ids.sorted(key=lambda m: m.create_date)

            return request.make_json_response({
                'success': True,
                'ticket': ticket.to_dict(),
                'messages': [m.to_dict() for m in messages]
            }, headers=cors_headers)
        except Exception as e:
            _logger.exception("Error getting ticket")
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=500)

    @http.route('/api/tickets/<int:ticket_id>/reply', type='http', auth='public',
                methods=['POST'], csrf=False)
    def reply_ticket(self, ticket_id):
        """Ajouter un message à un ticket"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        error = self._authenticate_from_header()
        if error:
            return request.make_json_response(error, headers=cors_headers, status=401)

        params = self._get_http_params()

        if not params.get('content'):
            return request.make_json_response({
                'success': False,
                'error': 'Le contenu du message est requis'
            }, headers=cors_headers, status=400)

        try:
            ticket = request.env['quelyos.ticket'].search([
                ('id', '=', ticket_id),
                ('company_id', '=', request.env.company.id)
            ], limit=1)

            if not ticket:
                return request.make_json_response({
                    'success': False,
                    'error': 'Ticket non trouvé'
                }, headers=cors_headers, status=404)

            message = request.env['quelyos.ticket.message'].create({
                'ticket_id': ticket.id,
                'author_id': request.env.user.partner_id.id,
                'content': params['content'],
            })

            # Réouvrir ticket si fermé
            if ticket.state in ('resolved', 'closed'):
                ticket.action_reopen()

            return request.make_json_response({
                'success': True,
                'message': message.to_dict()
            }, headers=cors_headers)
        except Exception as e:
            _logger.exception("Error replying to ticket")
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=500)

    @http.route('/api/tickets/<int:ticket_id>/close', type='http', auth='public',
                methods=['PATCH'], csrf=False)
    def close_ticket(self, ticket_id):
        """Fermer un ticket"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        error = self._authenticate_from_header()
        if error:
            return request.make_json_response(error, headers=cors_headers, status=401)

        try:
            ticket = request.env['quelyos.ticket'].search([
                ('id', '=', ticket_id),
                ('company_id', '=', request.env.company.id)
            ], limit=1)

            if not ticket:
                return request.make_json_response({
                    'success': False,
                    'error': 'Ticket non trouvé'
                }, headers=cors_headers, status=404)

            ticket.action_close()

            return request.make_json_response({
                'success': True,
                'ticket': ticket.to_dict()
            }, headers=cors_headers)
        except Exception as e:
            _logger.exception("Error closing ticket")
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=500)

    @http.route('/api/tickets/<int:ticket_id>/rate', type='http', auth='public',
                methods=['POST'], csrf=False)
    def rate_ticket(self, ticket_id):
        """Noter la satisfaction d'un ticket"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        error = self._authenticate_from_header()
        if error:
            return request.make_json_response(error, headers=cors_headers, status=401)

        params = self._get_http_params()

        if not params.get('rating'):
            return request.make_json_response({
                'success': False,
                'error': 'La note est requise'
            }, headers=cors_headers, status=400)

        try:
            ticket = request.env['quelyos.ticket'].search([
                ('id', '=', ticket_id),
                ('company_id', '=', request.env.company.id)
            ], limit=1)

            if not ticket:
                return request.make_json_response({
                    'success': False,
                    'error': 'Ticket non trouvé'
                }, headers=cors_headers, status=404)

            ticket.write({
                'satisfaction_rating': params['rating'],
                'satisfaction_comment': params.get('comment', ''),
            })

            return request.make_json_response({
                'success': True,
                'ticket': ticket.to_dict()
            }, headers=cors_headers)
        except Exception as e:
            _logger.exception("Error rating ticket")
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=500)

    @http.route('/api/tickets/<int:ticket_id>/attachments', type='http', auth='public',
                methods=['POST'], csrf=False)
    def upload_attachment(self, ticket_id):
        """Upload une pièce jointe pour un ticket"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        error = self._authenticate_from_header()
        if error:
            return request.make_json_response(error, headers=cors_headers, status=401)

        try:
            # Vérifier que le ticket existe et appartient au tenant
            ticket = request.env['quelyos.ticket'].search([
                ('id', '=', ticket_id),
                ('company_id', '=', request.env.company.id)
            ], limit=1)

            if not ticket:
                return request.make_json_response({
                    'success': False,
                    'error': 'Ticket non trouvé'
                }, headers=cors_headers, status=404)

            # Récupérer le fichier
            uploaded_file = request.httprequest.files.get('file')
            if not uploaded_file:
                return request.make_json_response({
                    'success': False,
                    'error': 'Aucun fichier fourni'
                }, headers=cors_headers, status=400)

            # Limiter la taille (10 MB)
            file_data = uploaded_file.read()
            if len(file_data) > 10 * 1024 * 1024:
                return request.make_json_response({
                    'success': False,
                    'error': 'Fichier trop volumineux (max 10 MB)'
                }, headers=cors_headers, status=400)

            # Créer l'attachment via ir.attachment
            attachment = request.env['ir.attachment'].create({
                'name': uploaded_file.filename,
                'datas': base64.b64encode(file_data),
                'res_model': 'quelyos.ticket',
                'res_id': ticket.id,
                'mimetype': uploaded_file.content_type,
            })

            return request.make_json_response({
                'success': True,
                'attachment': {
                    'id': attachment.id,
                    'name': attachment.name,
                    'mimetype': attachment.mimetype,
                    'file_size': attachment.file_size,
                    'created_at': attachment.create_date.isoformat() if attachment.create_date else None,
                }
            }, headers=cors_headers)
        except Exception as e:
            _logger.exception("Error uploading attachment")
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=500)

    @http.route('/api/tickets/<int:ticket_id>/attachments', type='http', auth='public',
                methods=['GET', 'OPTIONS'], csrf=False)
    def list_attachments(self, ticket_id):
        """Liste les pièces jointes d'un ticket"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        error = self._authenticate_from_header()
        if error:
            return request.make_json_response(error, headers=cors_headers, status=401)

        try:
            # Vérifier que le ticket existe et appartient au tenant
            ticket = request.env['quelyos.ticket'].search([
                ('id', '=', ticket_id),
                ('company_id', '=', request.env.company.id)
            ], limit=1)

            if not ticket:
                return request.make_json_response({
                    'success': False,
                    'error': 'Ticket non trouvé'
                }, headers=cors_headers, status=404)

            # Récupérer les attachments
            attachments = request.env['ir.attachment'].search([
                ('res_model', '=', 'quelyos.ticket'),
                ('res_id', '=', ticket.id)
            ], order='create_date desc')

            return request.make_json_response({
                'success': True,
                'attachments': [{
                    'id': att.id,
                    'name': att.name,
                    'mimetype': att.mimetype,
                    'file_size': att.file_size,
                    'created_at': att.create_date.isoformat() if att.create_date else None,
                    'url': f'/web/content/{att.id}?download=true'
                } for att in attachments]
            }, headers=cors_headers)
        except Exception as e:
            _logger.exception("Error listing attachments")
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=500)

    @http.route('/api/attachments/<int:attachment_id>', type='http', auth='public',
                methods=['DELETE', 'OPTIONS'], csrf=False)
    def delete_attachment(self, attachment_id):
        """Supprimer une pièce jointe"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        error = self._authenticate_from_header()
        if error:
            return request.make_json_response(error, headers=cors_headers, status=401)

        try:
            # Récupérer l'attachment et vérifier qu'il appartient à un ticket du tenant
            attachment = request.env['ir.attachment'].search([
                ('id', '=', attachment_id),
                ('res_model', '=', 'quelyos.ticket')
            ], limit=1)

            if not attachment:
                return request.make_json_response({
                    'success': False,
                    'error': 'Pièce jointe non trouvée'
                }, headers=cors_headers, status=404)

            # Vérifier que le ticket appartient au tenant
            ticket = request.env['quelyos.ticket'].browse(attachment.res_id)
            if ticket.company_id.id != request.env.company.id:
                return request.make_json_response({
                    'success': False,
                    'error': 'Non autorisé'
                }, headers=cors_headers, status=403)

            attachment.unlink()

            return request.make_json_response({
                'success': True
            }, headers=cors_headers)
        except Exception as e:
            _logger.exception("Error deleting attachment")
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=500)

    @http.route('/api/tickets/templates', type='http', auth='public',
                methods=['GET', 'OPTIONS'], csrf=False)
    def list_templates(self):
        """Liste des templates de réponse (pour clients)"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        error = self._authenticate_from_header()
        if error:
            return request.make_json_response(error, headers=cors_headers, status=401)

        try:
            templates = request.env['quelyos.support.template'].search(
                [('active', '=', True)],
                order='sequence, name'
            )

            return request.make_json_response({
                'success': True,
                'templates': [t.to_dict() for t in templates]
            }, headers=cors_headers)
        except Exception as e:
            _logger.exception("Error listing templates")
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=500)
