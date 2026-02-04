# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
from .base import BaseController

class NewsletterController(BaseController):

    @http.route('/api/admin/newsletter/subscribers', type='json', auth='public', methods=['POST'], csrf=False)
    def get_subscribers(self, **kwargs):
        """Récupérer la liste des abonnés newsletter"""
        tenant_id = self._authenticate_and_get_tenant()
        if not tenant_id:
            return {'success': False, 'error': 'Non authentifié'}

        Subscriber = request.env['quelyos.newsletter.subscriber'].sudo()

        # Filtres optionnels
        segment = kwargs.get('segment')
        status = kwargs.get('status', 'subscribed')

        domain = [('tenant_id', '=', tenant_id), ('status', '=', status)]
        if segment:
            domain.append(('segment', '=', segment))

        subscribers = Subscriber.search(domain)

        return {
            'success': True,
            'subscribers': [{
                'id': s.id,
                'name': s.name or '',
                'email': s.email,
                'status': s.status,
                'segment': s.segment,
                'stats_open_rate': s.stats_open_rate,
                'stats_click_rate': s.stats_click_rate,
                'stats_campaigns_received': s.stats_campaigns_received,
                'subscribed_date': s.subscribed_date.isoformat() if s.subscribed_date else None,
            } for s in subscribers],
            'total': len(subscribers),
        }

    @http.route('/api/admin/newsletter/campaigns', type='json', auth='public', methods=['POST'], csrf=False)
    def get_campaigns(self, **kwargs):
        """Récupérer la liste des campagnes newsletter"""
        tenant_id = self._authenticate_and_get_tenant()
        if not tenant_id:
            return {'success': False, 'error': 'Non authentifié'}

        Campaign = request.env['quelyos.newsletter.campaign'].sudo()
        campaigns = Campaign.search([('tenant_id', '=', tenant_id)])

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

    @http.route('/api/admin/newsletter/campaigns/<int:campaign_id>', type='json', auth='public', methods=['POST'], csrf=False)
    def get_campaign_detail(self, campaign_id, **kwargs):
        """Récupérer le détail d'une campagne"""
        tenant_id = self._authenticate_and_get_tenant()
        if not tenant_id:
            return {'success': False, 'error': 'Non authentifié'}

        Campaign = request.env['quelyos.newsletter.campaign'].sudo()
        campaign = Campaign.search([('id', '=', campaign_id), ('tenant_id', '=', tenant_id)], limit=1)

        if not campaign:
            return {'success': False, 'error': 'Campagne non trouvée'}

        return {
            'success': True,
            'campaign': {
                'id': campaign.id,
                'name': campaign.name,
                'subject': campaign.subject,
                'preview_text': campaign.preview_text or '',
                'html_body': campaign.html_body or '',
                'state': campaign.state,
                'segment_id': campaign.segment_id.id if campaign.segment_id else None,
                'segment_name': campaign.segment_id.name if campaign.segment_id else 'Tous',
                'recipient_count': campaign.recipient_count,
                'from_name': campaign.from_name,
                'from_email': campaign.from_email,
                'reply_to': campaign.reply_to or '',
                'scheduled_date': campaign.scheduled_date.isoformat() if campaign.scheduled_date else None,
                'sent_date': campaign.sent_date.isoformat() if campaign.sent_date else None,
                'stats_sent': campaign.stats_sent,
                'stats_delivered': campaign.stats_delivered,
                'stats_opened': campaign.stats_opened,
                'stats_clicked': campaign.stats_clicked,
                'stats_bounced': campaign.stats_bounced,
                'stats_unsubscribed': campaign.stats_unsubscribed,
                'open_rate': campaign.open_rate,
                'click_rate': campaign.click_rate,
            }
        }

    @http.route('/api/admin/newsletter/campaigns/create', type='json', auth='public', methods=['POST'], csrf=False)
    def create_campaign(self, **kwargs):
        """Créer une nouvelle campagne"""
        tenant_id = self._authenticate_and_get_tenant()
        if not tenant_id:
            return {'success': False, 'error': 'Non authentifié'}

        Campaign = request.env['quelyos.newsletter.campaign'].sudo()

        data = {
            'name': kwargs.get('name'),
            'subject': kwargs.get('subject'),
            'preview_text': kwargs.get('preview_text', ''),
            'html_body': kwargs.get('html_body', ''),
            'from_name': kwargs.get('from_name', 'Notre boutique'),
            'from_email': kwargs.get('from_email', 'noreply@votreboutique.com'),
            'reply_to': kwargs.get('reply_to', ''),
            'state': 'draft',
            'tenant_id': tenant_id,
        }

        # Segment optionnel
        segment = kwargs.get('segment')
        if segment and segment != 'all':
            Segment = request.env['quelyos.newsletter.segment'].sudo()
            segment_rec = Segment.search([('segment_type', '=', segment), ('tenant_id', '=', tenant_id)], limit=1)
            if segment_rec:
                data['segment_id'] = segment_rec.id

        campaign = Campaign.create(data)
        return {'success': True, 'campaign': {'id': campaign.id}}

    @http.route('/api/admin/newsletter/campaigns/<int:campaign_id>/save-draft', type='json', auth='public', methods=['POST'], csrf=False)
    def save_campaign_draft(self, campaign_id, **kwargs):
        """Sauvegarder le brouillon d'une campagne"""
        tenant_id = self._authenticate_and_get_tenant()
        if not tenant_id:
            return {'success': False, 'error': 'Non authentifié'}

        Campaign = request.env['quelyos.newsletter.campaign'].sudo()
        campaign = Campaign.search([('id', '=', campaign_id), ('tenant_id', '=', tenant_id)], limit=1)

        if not campaign:
            return {'success': False, 'error': 'Campagne non trouvée'}

        data = {}
        if 'name' in kwargs:
            data['name'] = kwargs['name']
        if 'subject' in kwargs:
            data['subject'] = kwargs['subject']
        if 'preview_text' in kwargs:
            data['preview_text'] = kwargs['preview_text']
        if 'html_body' in kwargs:
            data['html_body'] = kwargs['html_body']
        if 'from_name' in kwargs:
            data['from_name'] = kwargs['from_name']
        if 'from_email' in kwargs:
            data['from_email'] = kwargs['from_email']
        if 'reply_to' in kwargs:
            data['reply_to'] = kwargs['reply_to']

        campaign.write(data)
        return {'success': True, 'campaign_id': campaign.id}

    @http.route('/api/admin/newsletter/campaigns/<int:campaign_id>/send', type='json', auth='public', methods=['POST'], csrf=False)
    def send_campaign(self, campaign_id, **kwargs):
        """Envoyer une campagne immédiatement"""
        tenant_id = self._authenticate_and_get_tenant()
        if not tenant_id:
            return {'success': False, 'error': 'Non authentifié'}

        Campaign = request.env['quelyos.newsletter.campaign'].sudo()
        campaign = Campaign.search([('id', '=', campaign_id), ('tenant_id', '=', tenant_id)], limit=1)

        if not campaign:
            return {'success': False, 'error': 'Campagne non trouvée'}

        try:
            campaign.action_send_now()
            return {'success': True, 'message': 'Campagne envoyée avec succès'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/admin/newsletter/campaigns/<int:campaign_id>/send-test', type='json', auth='public', methods=['POST'], csrf=False)
    def send_test_campaign(self, campaign_id, **kwargs):
        """Envoyer un email de test"""
        tenant_id = self._authenticate_and_get_tenant()
        if not tenant_id:
            return {'success': False, 'error': 'Non authentifié'}

        Campaign = request.env['quelyos.newsletter.campaign'].sudo()
        campaign = Campaign.search([('id', '=', campaign_id), ('tenant_id', '=', tenant_id)], limit=1)

        if not campaign:
            return {'success': False, 'error': 'Campagne non trouvée'}

        test_email = kwargs.get('test_email')
        if not test_email:
            return {'success': False, 'error': 'Email de test requis'}

        try:
            campaign.action_send_test(test_email)
            return {'success': True, 'message': f'Email de test envoyé à {test_email}'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/admin/newsletter/campaigns/<int:campaign_id>/schedule', type='json', auth='public', methods=['POST'], csrf=False)
    def schedule_campaign(self, campaign_id, **kwargs):
        """Programmer l'envoi d'une campagne"""
        tenant_id = self._authenticate_and_get_tenant()
        if not tenant_id:
            return {'success': False, 'error': 'Non authentifié'}

        Campaign = request.env['quelyos.newsletter.campaign'].sudo()
        campaign = Campaign.search([('id', '=', campaign_id), ('tenant_id', '=', tenant_id)], limit=1)

        if not campaign:
            return {'success': False, 'error': 'Campagne non trouvée'}

        scheduled_date = kwargs.get('scheduled_date')
        if not scheduled_date:
            return {'success': False, 'error': 'Date de programmation requise'}

        try:
            campaign.action_schedule(scheduled_date)
            return {'success': True, 'message': 'Campagne programmée avec succès'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/admin/newsletter/subscribers/export', type='json', auth='public', methods=['POST'], csrf=False)
    def export_subscribers(self, **kwargs):
        """Exporter la liste des abonnés en CSV"""
        tenant_id = self._authenticate_and_get_tenant()
        if not tenant_id:
            return {'success': False, 'error': 'Non authentifié'}

        import csv
        import base64
        from io import StringIO

        Subscriber = request.env['quelyos.newsletter.subscriber'].sudo()
        subscribers = Subscriber.search([('tenant_id', '=', tenant_id)])

        # Créer CSV en mémoire
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['Email', 'Nom', 'Statut', 'Segment', 'Taux ouverture', 'Taux clic', 'Campagnes reçues', 'Date inscription'])

        for s in subscribers:
            writer.writerow([
                s.email,
                s.name or '',
                s.status,
                s.segment or '',
                f"{s.stats_open_rate:.1f}%",
                f"{s.stats_click_rate:.1f}%",
                s.stats_campaigns_received,
                s.subscribed_date.strftime('%Y-%m-%d') if s.subscribed_date else ''
            ])

        csv_content = output.getvalue()
        csv_base64 = base64.b64encode(csv_content.encode('utf-8')).decode('utf-8')

        return {
            'success': True,
            'csv_data': csv_base64,
            'filename': f'subscribers_{tenant_id}.csv'
        }

    @http.route('/api/admin/newsletter/campaigns/send-test-preview', type='json', auth='public', methods=['POST'], csrf=False)
    def send_test_preview(self, **kwargs):
        """Envoyer un email de test avec preview HTML"""
        tenant_id = self._authenticate_and_get_tenant()
        if not tenant_id:
            return {'success': False, 'error': 'Non authentifié'}

        test_email = kwargs.get('test_email')
        subject = kwargs.get('subject', 'Test Newsletter')
        html_body = kwargs.get('html_body', '')

        if not test_email or not html_body:
            return {'success': False, 'error': 'Email et contenu requis'}

        try:
            # Envoyer email de test via mail.mail
            mail = request.env['mail.mail'].sudo().create({
                'email_from': 'noreply@quelyos.com',
                'email_to': test_email,
                'subject': f'[TEST] {subject}',
                'body_html': html_body,
            })
            mail.send()
            return {'success': True, 'message': f'Email de test envoyé à {test_email}'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/admin/newsletter/upload-image', type='http', auth='public', methods=['POST'], csrf=False)
    def upload_image(self, **kwargs):
        """Upload image pour l'éditeur de newsletter"""
        import json

        tenant_id = self._authenticate_and_get_tenant()
        if not tenant_id:
            return json.dumps({'success': False, 'error': 'Non authentifié'})

        uploaded_file = request.httprequest.files.get('file')
        if not uploaded_file:
            return json.dumps({'success': False, 'error': 'Aucun fichier'})

        try:
            import base64
            file_data = base64.b64encode(uploaded_file.read())

            # Créer attachment
            Attachment = request.env['ir.attachment'].sudo()
            attachment = Attachment.create({
                'name': uploaded_file.filename,
                'type': 'binary',
                'datas': file_data,
                'res_model': 'quelyos.newsletter.campaign',
                'mimetype': uploaded_file.content_type,
            })

            # Retourner URL d'accès
            url = f'/web/image/{attachment.id}'

            return json.dumps({
                'success': True,
                'url': url,
                'attachment_id': attachment.id
            })
        except Exception as e:
            return json.dumps({'success': False, 'error': str(e)})

    @http.route('/api/admin/newsletter/segments', type='json', auth='public', methods=['POST'], csrf=False)
    def get_segments(self, **kwargs):
        """Récupérer la liste des segments"""
        tenant_id = self._authenticate_and_get_tenant()
        if not tenant_id:
            return {'success': False, 'error': 'Non authentifié'}

        Segment = request.env['quelyos.newsletter.segment'].sudo()
        segments = Segment.search([('tenant_id', '=', tenant_id)])

        return {
            'success': True,
            'segments': [{
                'value': s.segment_type,
                'label': s.name,
            } for s in segments]
        }
