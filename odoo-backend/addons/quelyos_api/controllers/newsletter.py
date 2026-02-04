# -*- coding: utf-8 -*-
"""
Contrôleur Newsletter - API REST pour gestion newsletter

Endpoints :
- GET /api/admin/newsletter/subscribers - Liste des abonnés
- POST /api/admin/newsletter/subscribers - Créer un abonné
- PUT /api/admin/newsletter/subscribers/<id> - Mettre à jour un abonné
- DELETE /api/admin/newsletter/subscribers/<id> - Supprimer un abonné
- POST /api/admin/newsletter/subscribers/export - Exporter CSV

- GET /api/admin/newsletter/campaigns - Liste des campagnes
- POST /api/admin/newsletter/campaigns - Créer une campagne
- PUT /api/admin/newsletter/campaigns/<id> - Mettre à jour une campagne
- DELETE /api/admin/newsletter/campaigns/<id> - Supprimer une campagne
- POST /api/admin/newsletter/campaigns/<id>/send - Envoyer la campagne
- POST /api/admin/newsletter/campaigns/<id>/send-test - Envoyer un test

- GET /api/admin/newsletter/segments - Liste des segments
- POST /api/admin/newsletter/upload-image - Upload image (multipart/form-data)
"""

import json
import csv
import base64
from io import StringIO
from odoo import http
from odoo.http import request, Response
from odoo.exceptions import AccessDenied


class NewsletterController(http.Controller):

    def _check_admin_auth(self):
        """Vérifie l'authentification admin"""
        # Vérifie le JWT token dans Authorization header
        auth_header = request.httprequest.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise AccessDenied('Token manquant')

        # La validation JWT est gérée par ir_http.py
        # On vérifie juste que l'utilisateur a les droits admin
        if not request.env.user or request.env.user.id == request.env.ref('base.public_user').id:
            raise AccessDenied('Accès non autorisé')

    # ========================================================================
    # SUBSCRIBERS
    # ========================================================================

    @http.route('/api/admin/newsletter/subscribers', type='json', auth='public', methods=['POST'], csrf=False)
    def list_subscribers(self, **kwargs):
        """Liste des abonnés newsletter avec filtres et pagination"""
        try:
            tenant_id = request.env.context.get('tenant_id')
            if not tenant_id:
                return {'success': False, 'error': 'Tenant non trouvé'}

            # Paramètres
            limit = kwargs.get('limit', 50)
            offset = kwargs.get('offset', 0)
            search = kwargs.get('search', '')
            segment = kwargs.get('segment')
            status = kwargs.get('status', 'subscribed')

            # Construction domaine
            domain = [('tenant_id', '=', tenant_id)]
            if search:
                domain.append('|')
                domain.append(('name', 'ilike', search))
                domain.append(('email', 'ilike', search))
            if segment:
                domain.append(('segment', '=', segment))
            if status:
                domain.append(('status', '=', status))

            # Requête
            Subscriber = request.env['quelyos.newsletter.subscriber'].sudo()
            subscribers = Subscriber.search(domain, limit=limit, offset=offset, order='create_date desc')
            total = Subscriber.search_count(domain)

            return {
                'success': True,
                'subscribers': [{
                    'id': s.id,
                    'name': s.name,
                    'email': s.email,
                    'status': s.status,
                    'segment': s.segment,
                    'stats_open_rate': s.stats_open_rate,
                    'stats_click_rate': s.stats_click_rate,
                    'subscribed_date': s.subscribed_date.isoformat() if s.subscribed_date else None,
                    'last_activity_date': s.last_activity_date.isoformat() if s.last_activity_date else None,
                } for s in subscribers],
                'total': total,
                'limit': limit,
                'offset': offset
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/admin/newsletter/subscribers/create', type='json', auth='public', methods=['POST'], csrf=False)
    def create_subscriber(self, **kwargs):
        """Créer un nouvel abonné"""
        try:
            tenant_id = request.env.context.get('tenant_id')
            if not tenant_id:
                return {'success': False, 'error': 'Tenant non trouvé'}

            email = kwargs.get('email')
            if not email:
                return {'success': False, 'error': 'Email requis'}

            Subscriber = request.env['quelyos.newsletter.subscriber'].sudo()
            subscriber = Subscriber.create({
                'tenant_id': tenant_id,
                'email': email,
                'name': kwargs.get('name', ''),
                'segment': kwargs.get('segment', 'new'),
                'status': 'subscribed'
            })

            return {
                'success': True,
                'subscriber': {
                    'id': subscriber.id,
                    'email': subscriber.email,
                    'name': subscriber.name,
                    'segment': subscriber.segment,
                    'status': subscriber.status
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/admin/newsletter/subscribers/<int:subscriber_id>', type='json', auth='public', methods=['POST'], csrf=False)
    def update_subscriber(self, subscriber_id, **kwargs):
        """Mettre à jour un abonné"""
        try:
            tenant_id = request.env.context.get('tenant_id')
            Subscriber = request.env['quelyos.newsletter.subscriber'].sudo()
            subscriber = Subscriber.search([
                ('id', '=', subscriber_id),
                ('tenant_id', '=', tenant_id)
            ], limit=1)

            if not subscriber:
                return {'success': False, 'error': 'Abonné non trouvé'}

            update_data = {}
            if 'name' in kwargs:
                update_data['name'] = kwargs['name']
            if 'segment' in kwargs:
                update_data['segment'] = kwargs['segment']
            if 'status' in kwargs:
                update_data['status'] = kwargs['status']

            subscriber.write(update_data)

            return {'success': True, 'message': 'Abonné mis à jour'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/admin/newsletter/subscribers/<int:subscriber_id>/delete', type='json', auth='public', methods=['POST'], csrf=False)
    def delete_subscriber(self, subscriber_id, **kwargs):
        """Supprimer un abonné"""
        try:
            tenant_id = request.env.context.get('tenant_id')
            Subscriber = request.env['quelyos.newsletter.subscriber'].sudo()
            subscriber = Subscriber.search([
                ('id', '=', subscriber_id),
                ('tenant_id', '=', tenant_id)
            ], limit=1)

            if not subscriber:
                return {'success': False, 'error': 'Abonné non trouvé'}

            subscriber.unlink()
            return {'success': True, 'message': 'Abonné supprimé'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/admin/newsletter/subscribers/export', type='http', auth='public', methods=['POST'], csrf=False)
    def export_subscribers(self, **kwargs):
        """Exporter les abonnés en CSV"""
        try:
            tenant_id = request.env.context.get('tenant_id')
            domain = [('tenant_id', '=', tenant_id), ('status', '=', 'subscribed')]

            Subscriber = request.env['quelyos.newsletter.subscriber'].sudo()
            subscribers = Subscriber.search(domain)

            # Générer CSV
            output = StringIO()
            writer = csv.writer(output)
            writer.writerow(['Email', 'Nom', 'Segment', 'Taux Ouverture (%)', 'Date Abonnement'])

            for s in subscribers:
                writer.writerow([
                    s.email,
                    s.name or '',
                    s.segment or '',
                    f"{s.stats_open_rate:.2f}",
                    s.subscribed_date.strftime('%Y-%m-%d') if s.subscribed_date else ''
                ])

            csv_data = output.getvalue()
            output.close()

            return Response(
                csv_data,
                headers=[
                    ('Content-Type', 'text/csv'),
                    ('Content-Disposition', 'attachment; filename=subscribers.csv')
                ]
            )
        except Exception as e:
            return Response(
                json.dumps({'success': False, 'error': str(e)}),
                headers=[('Content-Type', 'application/json')]
            )

    # ========================================================================
    # CAMPAIGNS
    # ========================================================================

    @http.route('/api/admin/newsletter/campaigns', type='json', auth='public', methods=['POST'], csrf=False)
    def list_campaigns(self, **kwargs):
        """Liste des campagnes newsletter"""
        try:
            tenant_id = request.env.context.get('tenant_id')
            if not tenant_id:
                return {'success': False, 'error': 'Tenant non trouvé'}

            Campaign = request.env['quelyos.newsletter.campaign'].sudo()
            campaigns = Campaign.search([('tenant_id', '=', tenant_id)], order='create_date desc')

            return {
                'success': True,
                'campaigns': [{
                    'id': c.id,
                    'name': c.name,
                    'subject': c.subject,
                    'state': c.state,
                    'recipient_count': c.recipient_count,
                    'stats_sent': c.stats_sent,
                    'stats_opened': c.stats_opened,
                    'stats_clicked': c.stats_clicked,
                    'open_rate': c.open_rate,
                    'click_rate': c.click_rate,
                    'scheduled_date': c.scheduled_date.isoformat() if c.scheduled_date else None,
                    'sent_date': c.sent_date.isoformat() if c.sent_date else None,
                } for c in campaigns]
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/admin/newsletter/campaigns/create', type='json', auth='public', methods=['POST'], csrf=False)
    def create_campaign(self, **kwargs):
        """Créer une nouvelle campagne"""
        try:
            tenant_id = request.env.context.get('tenant_id')
            if not tenant_id:
                return {'success': False, 'error': 'Tenant non trouvé'}

            Campaign = request.env['quelyos.newsletter.campaign'].sudo()
            campaign = Campaign.create({
                'tenant_id': tenant_id,
                'name': kwargs.get('name'),
                'subject': kwargs.get('subject'),
                'html_body': kwargs.get('html_body', ''),
                'from_name': kwargs.get('from_name', 'Notre boutique'),
                'from_email': kwargs.get('from_email', 'noreply@votreboutique.com'),
                'state': 'draft'
            })

            return {
                'success': True,
                'campaign': {
                    'id': campaign.id,
                    'name': campaign.name,
                    'subject': campaign.subject,
                    'state': campaign.state
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/admin/newsletter/campaigns/<int:campaign_id>/send', type='json', auth='public', methods=['POST'], csrf=False)
    def send_campaign(self, campaign_id, **kwargs):
        """Envoyer une campagne"""
        try:
            tenant_id = request.env.context.get('tenant_id')
            Campaign = request.env['quelyos.newsletter.campaign'].sudo()
            campaign = Campaign.search([
                ('id', '=', campaign_id),
                ('tenant_id', '=', tenant_id)
            ], limit=1)

            if not campaign:
                return {'success': False, 'error': 'Campagne non trouvée'}

            campaign.action_send_now()
            return {'success': True, 'message': 'Campagne envoyée'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/admin/newsletter/segments', type='json', auth='public', methods=['POST'], csrf=False)
    def list_segments(self, **kwargs):
        """Liste des segments disponibles"""
        try:
            return {
                'success': True,
                'segments': [
                    {'value': 'all', 'label': 'Tous'},
                    {'value': 'vip', 'label': 'VIP'},
                    {'value': 'regular', 'label': 'Réguliers'},
                    {'value': 'occasional', 'label': 'Occasionnels'},
                    {'value': 'new', 'label': 'Nouveaux'}
                ]
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/admin/newsletter/upload-image', type='http', auth='public', methods=['POST'], csrf=False)
    def upload_image(self, **kwargs):
        """Upload image pour newsletter"""
        try:
            self._check_admin_auth()
            tenant_id = request.env.user.x_tenant_id.id if hasattr(request.env.user, 'x_tenant_id') and request.env.user.x_tenant_id else None
            if not tenant_id:
                return request.make_json_response({'success': False, 'error': 'Tenant non trouvé'})

            # Récupérer le fichier uploadé
            uploaded_file = request.httprequest.files.get('image')
            if not uploaded_file:
                return request.make_json_response({'success': False, 'error': 'Aucun fichier fourni'})

            # Vérifier le type MIME
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
            if uploaded_file.content_type not in allowed_types:
                return request.make_json_response({'success': False, 'error': 'Type de fichier non autorisé'})

            # Lire le contenu du fichier
            file_content = uploaded_file.read()

            # Créer l'attachment
            attachment = request.env['ir.attachment'].sudo().create({
                'name': uploaded_file.filename,
                'type': 'binary',
                'datas': base64.b64encode(file_content),
                'res_model': 'quelyos.newsletter.campaign',
                'res_id': 0,
                'public': True,
                'mimetype': uploaded_file.content_type
            })

            # Construire l'URL de l'image
            base_url = request.httprequest.host_url.rstrip('/')
            image_url = f"{base_url}/web/content/{attachment.id}?download=true"

            return request.make_json_response({
                'success': True,
                'url': image_url,
                'attachment_id': attachment.id
            })

        except AccessDenied:
            return request.make_json_response({'success': False, 'error': 'Accès non autorisé'}, status=401)
        except Exception as e:
            return request.make_json_response({'success': False, 'error': str(e)}, status=500)
