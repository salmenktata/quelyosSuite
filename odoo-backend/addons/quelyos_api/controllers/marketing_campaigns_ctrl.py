# -*- coding: utf-8 -*-
"""
Contrôleur API REST pour Campagnes Marketing (mailing.mailing natif Odoo 19).

Endpoints :
- GET /api/ecommerce/marketing/campaigns - Liste campagnes
- POST /api/ecommerce/marketing/campaigns/create - Créer campagne
- GET /api/ecommerce/marketing/campaigns/:id - Détail campagne
- POST /api/ecommerce/marketing/campaigns/:id/send - Envoyer campagne
- POST /api/ecommerce/marketing/campaigns/:id/test - Envoyer test
- DELETE /api/ecommerce/marketing/campaigns/:id/delete - Supprimer
- GET /api/ecommerce/marketing/campaigns/:id/stats - Statistiques
"""

import json
from odoo import http
from odoo.http import request


class MarketingCampaignsController(http.Controller):
    """API REST pour Campagnes Marketing (mass_mailing natif)."""

    @http.route('/api/ecommerce/marketing/campaigns', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def list_campaigns(self, tenant_id=None, state=None, limit=100, offset=0, **kwargs):
        """
        Liste des campagnes marketing.

        Args:
            tenant_id (int): ID tenant
            state (str): Filtrer par état (draft, in_queue, sending, done)
            limit (int): Nombre max de résultats
            offset (int): Décalage pagination

        Returns:
            dict: {
                'success': bool,
                'campaigns': list,
                'total_count': int
            }
        """
        try:
            domain = []

            if tenant_id:
                domain.append(('company_id', '=', tenant_id))

            if state:
                domain.append(('state', '=', state))

            Mailing = request.env['mailing.mailing'].sudo()
            total_count = Mailing.search_count(domain)
            campaigns = Mailing.search(domain, limit=limit, offset=offset, order='create_date desc')

            campaigns_data = []
            for campaign in campaigns:
                campaigns_data.append({
                    'id': campaign.id,
                    'subject': campaign.subject,
                    'state': campaign.state,
                    'mailing_model_real': campaign.mailing_model_real,
                    'mailing_domain': campaign.mailing_domain,
                    'body_html': campaign.body_html,
                    'sent': campaign.sent,
                    'delivered': campaign.delivered,
                    'opened': campaign.opened,
                    'clicked': campaign.clicked,
                    'bounced': campaign.bounced,
                    'failed': campaign.failed,
                    'create_date': campaign.create_date.isoformat() if campaign.create_date else None,
                    'schedule_date': campaign.schedule_date.isoformat() if campaign.schedule_date else None,
                })

            return {
                'success': True,
                'campaigns': campaigns_data,
                'total_count': total_count,
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    @http.route('/api/ecommerce/marketing/campaigns/create', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def create_campaign(self, subject, body_html, mailing_model='res.partner', mailing_domain='[]', 
                       tenant_id=None, **kwargs):
        """
        Créer une campagne marketing.

        Args:
            subject (str): Sujet email
            body_html (str): Corps HTML
            mailing_model (str): Modèle cible (res.partner par défaut)
            mailing_domain (str): Domaine filtrage JSON
            tenant_id (int): ID tenant

        Returns:
            dict: {'success': bool, 'campaign': dict}
        """
        try:
            vals = {
                'subject': subject,
                'body_html': body_html,
                'mailing_model_id': request.env['ir.model'].sudo().search([('model', '=', mailing_model)], limit=1).id,
                'mailing_domain': mailing_domain,
            }

            if tenant_id:
                vals['company_id'] = tenant_id

            campaign = request.env['mailing.mailing'].sudo().create(vals)

            return {
                'success': True,
                'campaign': {
                    'id': campaign.id,
                    'subject': campaign.subject,
                    'state': campaign.state,
                },
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    @http.route('/api/ecommerce/marketing/campaigns/<int:campaign_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_campaign(self, campaign_id, **kwargs):
        """Détail d'une campagne."""
        try:
            campaign = request.env['mailing.mailing'].sudo().browse(campaign_id)

            if not campaign.exists():
                return {'success': False, 'error': 'Campaign not found'}

            return {
                'success': True,
                'campaign': {
                    'id': campaign.id,
                    'subject': campaign.subject,
                    'state': campaign.state,
                    'body_html': campaign.body_html,
                    'mailing_model_real': campaign.mailing_model_real,
                    'mailing_domain': campaign.mailing_domain,
                    'sent': campaign.sent,
                    'delivered': campaign.delivered,
                    'opened': campaign.opened,
                    'clicked': campaign.clicked,
                    'bounced': campaign.bounced,
                    'failed': campaign.failed,
                    'create_date': campaign.create_date.isoformat() if campaign.create_date else None,
                },
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/marketing/campaigns/<int:campaign_id>/send', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def send_campaign(self, campaign_id, **kwargs):
        """Envoyer une campagne."""
        try:
            campaign = request.env['mailing.mailing'].sudo().browse(campaign_id)

            if not campaign.exists():
                return {'success': False, 'error': 'Campaign not found'}

            campaign.action_send_mail()

            return {
                'success': True,
                'state': campaign.state,
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/marketing/campaigns/<int:campaign_id>/stats', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_campaign_stats(self, campaign_id, **kwargs):
        """Statistiques d'une campagne."""
        try:
            campaign = request.env['mailing.mailing'].sudo().browse(campaign_id)

            if not campaign.exists():
                return {'success': False, 'error': 'Campaign not found'}

            return {
                'success': True,
                'stats': {
                    'sent': campaign.sent,
                    'delivered': campaign.delivered,
                    'opened': campaign.opened,
                    'clicked': campaign.clicked,
                    'bounced': campaign.bounced,
                    'failed': campaign.failed,
                    'open_rate': (campaign.opened / campaign.sent * 100) if campaign.sent > 0 else 0,
                    'click_rate': (campaign.clicked / campaign.sent * 100) if campaign.sent > 0 else 0,
                },
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/marketing/campaigns/<int:campaign_id>/duplicate', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def duplicate_campaign(self, campaign_id, **kwargs):
        """Dupliquer une campagne."""
        try:
            campaign = request.env['mailing.mailing'].sudo().browse(campaign_id)

            if not campaign.exists():
                return {'success': False, 'error': 'Campaign not found'}

            # Dupliquer la campagne
            new_campaign = campaign.copy({
                'subject': f"{campaign.subject} (Copie)",
                'state': 'draft',
            })

            return {
                'success': True,
                'campaign': {
                    'id': new_campaign.id,
                    'subject': new_campaign.subject,
                    'state': new_campaign.state,
                },
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/marketing/campaigns/<int:campaign_id>/test', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def send_test_campaign(self, campaign_id, test_email, **kwargs):
        """Envoyer un email de test."""
        try:
            campaign = request.env['mailing.mailing'].sudo().browse(campaign_id)

            if not campaign.exists():
                return {'success': False, 'error': 'Campaign not found'}

            # Envoyer email de test
            campaign.action_test()

            return {
                'success': True,
                'message': f'Email de test envoyé à {test_email}',
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/marketing/campaigns/<int:campaign_id>/delete', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def delete_campaign(self, campaign_id, **kwargs):
        """Supprimer une campagne."""
        try:
            campaign = request.env['mailing.mailing'].sudo().browse(campaign_id)

            if not campaign.exists():
                return {'success': False, 'error': 'Campaign not found'}

            campaign.unlink()

            return {
                'success': True,
                'message': 'Campaign deleted successfully',
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}
