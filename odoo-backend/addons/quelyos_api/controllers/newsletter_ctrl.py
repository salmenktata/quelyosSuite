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

    @http.route('/api/admin/newsletter/campaigns/save', type='json', auth='public', methods=['POST'], csrf=False)
    def save_campaign(self, **kwargs):
        """Créer ou modifier une campagne"""
        tenant_id = self._authenticate_and_get_tenant()
        if not tenant_id:
            return {'success': False, 'error': 'Non authentifié'}

        Campaign = request.env['quelyos.newsletter.campaign'].sudo()
        campaign_id = kwargs.get('id')

        data = {
            'name': kwargs.get('name'),
            'subject': kwargs.get('subject'),
            'preview_text': kwargs.get('preview_text', ''),
            'html_body': kwargs.get('html_body', ''),
            'from_name': kwargs.get('from_name', 'Notre boutique'),
            'from_email': kwargs.get('from_email', 'noreply@votreboutique.com'),
            'reply_to': kwargs.get('reply_to', ''),
            'tenant_id': tenant_id,
        }

        # Segment optionnel
        segment_id = kwargs.get('segment_id')
        if segment_id:
            data['segment_id'] = segment_id

        if campaign_id:
            campaign = Campaign.search([('id', '=', campaign_id), ('tenant_id', '=', tenant_id)], limit=1)
            if campaign:
                campaign.write(data)
                return {'success': True, 'campaign_id': campaign.id}
            return {'success': False, 'error': 'Campagne non trouvée'}
        else:
            campaign = Campaign.create(data)
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
                'id': s.id,
                'name': s.name,
                'description': s.description or '',
                'segment_type': s.segment_type,
            } for s in segments]
        }
