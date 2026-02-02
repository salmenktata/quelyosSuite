# -*- coding: utf-8 -*-
import logging
import json
from datetime import datetime, timedelta
from odoo import http
from odoo.http import request
from odoo.exceptions import AccessDenied
from .super_admin import SuperAdminController
from ..config import get_cors_headers

_logger = logging.getLogger(__name__)


class AdminTicketsController(SuperAdminController):
    """Contrôleur super-admin pour les tickets support"""

    @http.route('/api/super-admin/tickets', type='http', auth='public',
                methods=['GET', 'OPTIONS'], csrf=False)
    def tickets_list(self):
        """Liste tous les tickets (tous tenants)"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            params = request.httprequest.args.to_dict()
            domain = []

            if params.get('tenant_id'):
                domain.append(('company_id', '=', int(params['tenant_id'])))

            if params.get('state'):
                domain.append(('state', '=', params['state']))

            if params.get('priority'):
                domain.append(('priority', '=', params['priority']))

            if params.get('category'):
                domain.append(('category', '=', params['category']))

            if params.get('assigned_to'):
                assigned_value = params['assigned_to']
                if assigned_value == 'unassigned':
                    domain.append(('assigned_to', '=', False))
                else:
                    domain.append(('assigned_to', '=', int(assigned_value)))

            if params.get('search'):
                search = params['search']
                domain.append('|')
                domain.append('|')
                domain.append(('subject', 'ilike', search))
                domain.append(('name', 'ilike', search))
                domain.append(('partner_id.email', 'ilike', search))

            limit = min(int(params.get('limit', 50)), 200)
            offset = int(params.get('offset', 0))

            tickets = request.env['quelyos.ticket'].sudo().search(
                domain,
                limit=limit,
                offset=offset,
                order='priority desc, create_date desc'
            )

            return request.make_json_response({
                'success': True,
                'tickets': [t.to_dict_super_admin() for t in tickets],
                'total': request.env['quelyos.ticket'].sudo().search_count(domain)
            }, headers=cors_headers)

        except Exception as e:
            _logger.exception("Error listing tickets (super admin)")
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/tickets/<int:ticket_id>', type='http', auth='public',
                methods=['GET', 'OPTIONS'], csrf=False)
    def ticket_detail(self, ticket_id):
        """Détail d'un ticket"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            ticket = request.env['quelyos.ticket'].sudo().browse(ticket_id)

            if not ticket.exists():
                return request.make_json_response({
                    'success': False,
                    'error': 'Ticket non trouvé'
                }, headers=cors_headers, status=404)

            messages = ticket.message_ids.sorted(key=lambda m: m.create_date)

            return request.make_json_response({
                'success': True,
                'ticket': ticket.to_dict_super_admin(),
                'messages': [m.to_dict() for m in messages]
            }, headers=cors_headers)

        except Exception as e:
            _logger.exception("Error getting ticket detail (super admin)")
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/tickets/<int:ticket_id>/reply', type='http', auth='public',
                methods=['POST'], csrf=False)
    def ticket_reply(self, ticket_id):
        """Répondre à un ticket"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            data = request.get_json_data()
            content = data.get('content')

            if not content:
                return request.make_json_response({
                    'success': False,
                    'error': 'Le contenu du message est requis'
                }, headers=cors_headers, status=400)

            ticket = request.env['quelyos.ticket'].sudo().browse(ticket_id)

            if not ticket.exists():
                return request.make_json_response({
                    'success': False,
                    'error': 'Ticket non trouvé'
                }, headers=cors_headers, status=404)

            message = request.env['quelyos.ticket.message'].sudo().create({
                'ticket_id': ticket.id,
                'author_id': request.env.user.partner_id.id,
                'content': content,
            })

            # Marquer comme ouvert si nouveau
            if ticket.state == 'new':
                ticket.action_open()

            return request.make_json_response({
                'success': True,
                'message': message.to_dict()
            }, headers=cors_headers)

        except Exception as e:
            _logger.exception("Error replying to ticket (super admin)")
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/tickets/<int:ticket_id>/assign', type='http', auth='public',
                methods=['POST'], csrf=False)
    def ticket_assign(self, ticket_id):
        """Assigner un ticket"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            data = request.get_json_data()
            user_id = data.get('userId')

            ticket = request.env['quelyos.ticket'].sudo().browse(ticket_id)

            if not ticket.exists():
                return request.make_json_response({
                    'success': False,
                    'error': 'Ticket non trouvé'
                }, headers=cors_headers, status=404)

            ticket.write({'assigned_to': user_id if user_id else False})

            # Publier événement WebSocket
            if user_id:
                ticket._publish_ws_event('ticket.assigned', {
                    'ticketId': ticket.id,
                    'assignedTo': ticket.assigned_to.name,
                })

            return request.make_json_response({
                'success': True,
                'ticket': ticket.to_dict_super_admin()
            }, headers=cors_headers)

        except Exception as e:
            _logger.exception("Error assigning ticket")
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/tickets/<int:ticket_id>/status', type='http', auth='public',
                methods=['PUT'], csrf=False)
    def ticket_status(self, ticket_id):
        """Changer le statut d'un ticket"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            data = request.get_json_data()
            new_state = data.get('state')

            if not new_state:
                return request.make_json_response({
                    'success': False,
                    'error': 'Le statut est requis'
                }, headers=cors_headers, status=400)

            ticket = request.env['quelyos.ticket'].sudo().browse(ticket_id)

            if not ticket.exists():
                return request.make_json_response({
                    'success': False,
                    'error': 'Ticket non trouvé'
                }, headers=cors_headers, status=404)

            # Utiliser les actions appropriées
            if new_state == 'open':
                ticket.action_open()
            elif new_state == 'pending':
                ticket.action_pending()
            elif new_state == 'resolved':
                ticket.action_resolve()
            elif new_state == 'closed':
                ticket.action_close()
            else:
                ticket.write({'state': new_state})

            return request.make_json_response({
                'success': True,
                'ticket': ticket.to_dict_super_admin()
            }, headers=cors_headers)

        except Exception as e:
            _logger.exception("Error changing ticket status")
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/tickets/stats', type='http', auth='public',
                methods=['GET', 'OPTIONS'], csrf=False)
    def tickets_stats(self):
        """Statistiques globales des tickets"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            Ticket = request.env['quelyos.ticket'].sudo()

            # Compteurs par statut
            by_state = {
                'new': Ticket.search_count([('state', '=', 'new')]),
                'open': Ticket.search_count([('state', '=', 'open')]),
                'pending': Ticket.search_count([('state', '=', 'pending')]),
                'resolved': Ticket.search_count([('state', '=', 'resolved')]),
                'closed': Ticket.search_count([('state', '=', 'closed')]),
            }

            # Compteurs par priorité
            by_priority = {
                'urgent': Ticket.search_count([('priority', '=', 'urgent')]),
                'high': Ticket.search_count([('priority', '=', 'high')]),
                'medium': Ticket.search_count([('priority', '=', 'medium')]),
                'low': Ticket.search_count([('priority', '=', 'low')]),
            }

            # Temps moyen de réponse et résolution
            tickets_with_times = Ticket.search([
                ('response_time', '>', 0)
            ])

            avg_response_time = sum(t.response_time for t in tickets_with_times) / len(tickets_with_times) if tickets_with_times else 0

            tickets_resolved = Ticket.search([
                ('resolution_time', '>', 0)
            ])

            avg_resolution_time = sum(t.resolution_time for t in tickets_resolved) / len(tickets_resolved) if tickets_resolved else 0

            # Satisfaction moyenne
            tickets_rated = Ticket.search([
                ('satisfaction_rating', '!=', False)
            ])

            avg_satisfaction = sum(int(t.satisfaction_rating) for t in tickets_rated) / len(tickets_rated) if tickets_rated else 0

            return request.make_json_response({
                'success': True,
                'total': Ticket.search_count([]),
                'byState': by_state,
                'byPriority': by_priority,
                'avgResponseTime': round(avg_response_time, 2),
                'avgResolutionTime': round(avg_resolution_time, 2),
                'avgSatisfaction': round(avg_satisfaction, 2),
            }, headers=cors_headers)

        except Exception as e:
            _logger.exception("Error getting tickets stats")
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/tickets/<int:ticket_id>/notes', type='http', auth='public',
                methods=['PUT'], csrf=False)
    def ticket_notes(self, ticket_id):
        """Sauvegarder les notes internes d'un ticket"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            data = request.get_json_data()
            notes = data.get('notes', '')

            ticket = request.env['quelyos.ticket'].sudo().browse(ticket_id)

            if not ticket.exists():
                return request.make_json_response({
                    'success': False,
                    'error': 'Ticket non trouvé'
                }, headers=cors_headers, status=404)

            ticket.write({'internal_notes': notes})

            return request.make_json_response({
                'success': True,
                'ticket': ticket.to_dict_super_admin()
            }, headers=cors_headers)

        except Exception as e:
            _logger.exception("Error saving ticket notes")
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/tickets/export', type='http', auth='public',
                methods=['GET', 'OPTIONS'], csrf=False)
    def tickets_export_csv(self):
        """Exporter les tickets en CSV"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            params = request.httprequest.args.to_dict()
            domain = []

            # Appliquer les mêmes filtres que la liste
            if params.get('tenant_id'):
                domain.append(('company_id', '=', int(params['tenant_id'])))
            if params.get('state'):
                domain.append(('state', '=', params['state']))
            if params.get('priority'):
                domain.append(('priority', '=', params['priority']))
            if params.get('category'):
                domain.append(('category', '=', params['category']))
            if params.get('assigned_to'):
                assigned_value = params['assigned_to']
                if assigned_value == 'unassigned':
                    domain.append(('assigned_to', '=', False))
                else:
                    domain.append(('assigned_to', '=', int(assigned_value)))

            # Récupérer tous les tickets (pas de limit pour export)
            tickets = request.env['quelyos.ticket'].sudo().search(
                domain,
                order='create_date desc',
                limit=10000  # Limite sécurité
            )

            # Générer CSV
            output = io.StringIO()
            writer = csv.writer(output)

            # Headers
            writer.writerow([
                'Référence',
                'Tenant',
                'Client',
                'Email',
                'Sujet',
                'Catégorie',
                'Priorité',
                'Statut',
                'Assigné à',
                'Nb Messages',
                'Temps Réponse (h)',
                'Temps Résolution (h)',
                'Satisfaction',
                'Créé le',
                'Mis à jour le',
            ])

            # Données
            for ticket in tickets:
                writer.writerow([
                    ticket.name,
                    ticket.company_id.name,
                    ticket.partner_id.name,
                    ticket.email or '',
                    ticket.subject,
                    dict(ticket._fields['category'].selection).get(ticket.category),
                    dict(ticket._fields['priority'].selection).get(ticket.priority),
                    dict(ticket._fields['state'].selection).get(ticket.state),
                    ticket.assigned_to.name if ticket.assigned_to else 'Non assigné',
                    ticket.message_count,
                    ticket.response_time or 0,
                    ticket.resolution_time or 0,
                    dict(ticket._fields['satisfaction_rating'].selection).get(ticket.satisfaction_rating) if ticket.satisfaction_rating else '',
                    ticket.create_date.strftime('%Y-%m-%d %H:%M:%S') if ticket.create_date else '',
                    ticket.write_date.strftime('%Y-%m-%d %H:%M:%S') if ticket.write_date else '',
                ])

            csv_data = output.getvalue()
            output.close()

            # Retourner le CSV
            headers = {
                **cors_headers,
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': f'attachment; filename="tickets_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"',
            }

            response = request.make_response(csv_data.encode('utf-8-sig'), headers=list(headers.items()))
            return response

        except Exception as e:
            _logger.exception("Error exporting tickets")
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/tickets/<int:ticket_id>/attachments', type='http', auth='public',
                methods=['GET', 'OPTIONS'], csrf=False)
    def ticket_attachments(self, ticket_id):
        """Liste les pièces jointes d'un ticket (Super Admin)"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            ticket = request.env['quelyos.ticket'].sudo().browse(ticket_id)

            if not ticket.exists():
                return request.make_json_response({
                    'success': False,
                    'error': 'Ticket non trouvé'
                }, headers=cors_headers, status=404)

            # Récupérer les attachments
            attachments = request.env['ir.attachment'].sudo().search([
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
            _logger.exception("Error listing ticket attachments")
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/templates', type='http', auth='public',
                methods=['GET', 'OPTIONS'], csrf=False)
    def list_templates(self):
        """Liste des templates de réponse"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            templates = request.env['quelyos.support.template'].sudo().search(
                [('active', '=', True)],
                order='sequence, name'
            )

            return request.make_json_response({
                'success': True,
                'templates': [t.to_dict() for t in templates]
            }, headers=cors_headers)

        except Exception as e:
            _logger.exception("Error listing templates")
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/templates', type='http', auth='public',
                methods=['POST'], csrf=False)
    def create_template(self):
        """Créer un template"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            data = request.get_json_data()

            if not data.get('name') or not data.get('content'):
                return request.make_json_response({
                    'success': False,
                    'error': 'Nom et contenu requis'
                }, headers=cors_headers, status=400)

            template = request.env['quelyos.support.template'].sudo().create({
                'name': data['name'],
                'content': data['content'],
                'category': data.get('category', 'other'),
                'sequence': data.get('sequence', 10),
            })

            return request.make_json_response({
                'success': True,
                'template': template.to_dict()
            }, headers=cors_headers)

        except Exception as e:
            _logger.exception("Error creating template")
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/templates/<int:template_id>', type='http', auth='public',
                methods=['PUT'], csrf=False)
    def update_template(self, template_id):
        """Modifier un template"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            template = request.env['quelyos.support.template'].sudo().browse(template_id)

            if not template.exists():
                return request.make_json_response({
                    'success': False,
                    'error': 'Template non trouvé'
                }, headers=cors_headers, status=404)

            data = request.get_json_data()
            update_vals = {}

            if 'name' in data:
                update_vals['name'] = data['name']
            if 'content' in data:
                update_vals['content'] = data['content']
            if 'category' in data:
                update_vals['category'] = data['category']
            if 'sequence' in data:
                update_vals['sequence'] = data['sequence']
            if 'active' in data:
                update_vals['active'] = data['active']

            template.write(update_vals)

            return request.make_json_response({
                'success': True,
                'template': template.to_dict()
            }, headers=cors_headers)

        except Exception as e:
            _logger.exception("Error updating template")
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/templates/<int:template_id>', type='http', auth='public',
                methods=['DELETE', 'OPTIONS'], csrf=False)
    def delete_template(self, template_id):
        """Supprimer un template"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            template = request.env['quelyos.support.template'].sudo().browse(template_id)

            if not template.exists():
                return request.make_json_response({
                    'success': False,
                    'error': 'Template non trouvé'
                }, headers=cors_headers, status=404)

            template.unlink()

            return request.make_json_response({
                'success': True
            }, headers=cors_headers)

        except Exception as e:
            _logger.exception("Error deleting template")
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/customers/<int:partner_id>/tickets', type='http', auth='public',
                methods=['GET', 'OPTIONS'], csrf=False)
    def customer_ticket_history(self, partner_id):
        """Historique complet des tickets d'un client"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            # Vérifier que le partner existe
            partner = request.env['res.partner'].sudo().browse(partner_id)
            if not partner.exists():
                return request.make_json_response({
                    'success': False,
                    'error': 'Client non trouvé'
                }, headers=cors_headers, status=404)

            # Récupérer tous les tickets du client
            tickets = request.env['quelyos.ticket'].sudo().search([
                ('partner_id', '=', partner_id)
            ], order='create_date desc')

            # Statistiques globales
            total_tickets = len(tickets)
            open_tickets = len(tickets.filtered(lambda t: t.state in ('new', 'open', 'pending')))
            resolved_tickets = len(tickets.filtered(lambda t: t.state in ('resolved', 'closed')))
            
            # Temps moyen de résolution (tickets résolus uniquement)
            resolved_with_time = tickets.filtered(lambda t: t.resolution_time > 0)
            avg_resolution_time = sum(t.resolution_time for t in resolved_with_time) / len(resolved_with_time) if resolved_with_time else 0

            # Satisfaction moyenne
            rated_tickets = tickets.filtered(lambda t: t.satisfaction_rating)
            avg_satisfaction = sum(int(t.satisfaction_rating) for t in rated_tickets) / len(rated_tickets) if rated_tickets else 0

            return request.make_json_response({
                'success': True,
                'customer': {
                    'id': partner.id,
                    'name': partner.name,
                    'email': partner.email,
                    'phone': partner.phone,
                },
                'stats': {
                    'total': total_tickets,
                    'open': open_tickets,
                    'resolved': resolved_tickets,
                    'avgResolutionTime': round(avg_resolution_time, 2),
                    'avgSatisfaction': round(avg_satisfaction, 2),
                },
                'tickets': [t.to_dict_super_admin() for t in tickets]
            }, headers=cors_headers)

        except Exception as e:
            _logger.exception("Error fetching customer ticket history")
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=500
            )
