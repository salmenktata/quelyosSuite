# -*- coding: utf-8 -*-
"""
API REST Tracking Marketing.

Endpoints :
- GET /api/ecommerce/marketing/campaigns/:id/tracking - Stats tracking détaillées campagne
- GET /api/ecommerce/marketing/campaigns/:id/opens - Liste destinataires ayant ouvert
- GET /api/ecommerce/marketing/campaigns/:id/clicks - Liste destinataires ayant cliqué  
- GET /api/ecommerce/marketing/campaigns/:id/heatmap - Heatmap clics par lien
- GET /api/ecommerce/marketing/campaigns/:id/timeline - Timeline interactions
"""

from odoo import http
from odoo.http import request


class MarketingTrackingController(http.Controller):
    """API REST Tracking Marketing Avancé."""

    @http.route('/api/ecommerce/marketing/campaigns/<int:campaign_id>/tracking', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_campaign_tracking(self, campaign_id, **kwargs):
        """
        Stats tracking détaillées campagne.
        
        Returns:
            dict: {
                'success': bool,
                'tracking': {
                    'total_sent': int,
                    'total_opened': int,
                    'total_clicked': int,
                    'unique_opens': int,
                    'unique_clicks': int,
                    'avg_open_time_hours': float,
                    'avg_engagement_score': float,
                    'top_clickers': list,
                    'inactive_contacts': list,
                }
            }
        """
        try:
            campaign = request.env['mailing.mailing'].sudo().browse(campaign_id)
            if not campaign.exists():
                return {'success': False, 'error': 'Campaign not found'}

            traces = request.env['mailing.trace'].sudo().search([
                ('mass_mailing_id', '=', campaign_id)
            ])

            # Stats globales
            total_sent = len(traces)
            opened_traces = traces.filtered(lambda t: t.opened)
            clicked_traces = traces.filtered(lambda t: t.clicked)

            # Calculs métriques avancées
            total_opens = sum(t.open_count for t in opened_traces)
            total_clicks = sum(t.click_count for t in clicked_traces)

            # Temps moyen ouverture (heures entre envoi et première ouverture)
            open_times = []
            for trace in opened_traces.filtered(lambda t: t.open_date and t.sent_datetime):
                delta = (trace.open_date - trace.sent_datetime).total_seconds() / 3600
                open_times.append(delta)
            avg_open_time = sum(open_times) / len(open_times) if open_times else 0

            # Score engagement moyen
            avg_score = sum(t.engagement_score for t in traces) / total_sent if total_sent > 0 else 0

            # Top clickers (top 10)
            top_clickers = traces.sorted(lambda t: t.click_count, reverse=True)[:10]
            top_clickers_data = [{
                'email': t.email,
                'clicks': t.click_count,
                'opens': t.open_count,
                'engagement_score': t.engagement_score,
            } for t in top_clickers if t.click_count > 0]

            # Contacts inactifs (ni ouvert ni cliqué)
            inactive = traces.filtered(lambda t: not t.opened and not t.clicked)
            inactive_data = [{
                'email': t.email,
                'sent_date': t.sent_datetime.isoformat() if t.sent_datetime else None,
            } for t in inactive[:50]]  # Limiter à 50 pour perfs

            return {
                'success': True,
                'tracking': {
                    'total_sent': total_sent,
                    'total_opened': len(opened_traces),
                    'total_clicked': len(clicked_traces),
                    'unique_opens': len(opened_traces),
                    'unique_clicks': len(clicked_traces),
                    'total_open_events': total_opens,
                    'total_click_events': total_clicks,
                    'avg_open_time_hours': round(avg_open_time, 2),
                    'avg_engagement_score': round(avg_score, 2),
                    'top_clickers': top_clickers_data,
                    'inactive_contacts': inactive_data,
                    'inactive_count': len(inactive),
                }
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/marketing/campaigns/<int:campaign_id>/heatmap', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_campaign_heatmap(self, campaign_id, **kwargs):
        """
        Heatmap clics par lien.
        
        Returns:
            dict: {
                'success': bool,
                'heatmap': [
                    {'url': str, 'clicks': int, 'unique_clickers': int},
                    ...
                ]
            }
        """
        try:
            # Récupérer tous les clics pour cette campagne
            clicks = request.env['quelyos.link.tracker.click'].sudo().search([
                ('campaign_id', '=', campaign_id)
            ])

            # Grouper par lien
            heatmap = {}
            for click in clicks:
                url = click.link_url
                if url not in heatmap:
                    heatmap[url] = {
                        'url': url,
                        'clicks': 0,
                        'unique_clickers': set(),
                    }
                heatmap[url]['clicks'] += 1
                heatmap[url]['unique_clickers'].add(click.contact_email)

            # Formater résultat
            heatmap_data = [
                {
                    'url': data['url'],
                    'clicks': data['clicks'],
                    'unique_clickers': len(data['unique_clickers']),
                }
                for url, data in heatmap.items()
            ]

            # Trier par nombre clics décroissant
            heatmap_data.sort(key=lambda x: x['clicks'], reverse=True)

            return {
                'success': True,
                'heatmap': heatmap_data,
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/marketing/campaigns/<int:campaign_id>/timeline', type='jsonrpc', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_campaign_timeline(self, campaign_id, limit=100, **kwargs):
        """
        Timeline interactions (ouvertures + clics) chronologique.
        
        Args:
            limit (int): Nombre max événements (défaut 100)
        
        Returns:
            dict: {
                'success': bool,
                'timeline': [
                    {
                        'type': 'open'|'click',
                        'date': str,
                        'email': str,
                        'url': str (si click),
                    },
                    ...
                ]
            }
        """
        try:
            traces = request.env['mailing.trace'].sudo().search([
                ('mass_mailing_id', '=', campaign_id)
            ])

            events = []

            # Ajouter événements ouverture
            for trace in traces.filtered(lambda t: t.open_date):
                events.append({
                    'type': 'open',
                    'date': trace.open_date.isoformat(),
                    'email': trace.email,
                    'count': trace.open_count,
                })

            # Ajouter événements clic
            clicks = request.env['quelyos.link.tracker.click'].sudo().search([
                ('campaign_id', '=', campaign_id)
            ])
            for click in clicks:
                events.append({
                    'type': 'click',
                    'date': click.click_date.isoformat(),
                    'email': click.contact_email,
                    'url': click.link_url,
                })

            # Trier par date décroissante
            events.sort(key=lambda x: x['date'], reverse=True)

            # Limiter résultats
            events = events[:limit]

            return {
                'success': True,
                'timeline': events,
                'total_events': len(events),
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}
