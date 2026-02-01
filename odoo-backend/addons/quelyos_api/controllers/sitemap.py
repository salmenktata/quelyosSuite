"""
Controller Sitemap Dynamique V3

Endpoint API pour scanner les routes des 4 applications et fournir
healthcheck automatique avec historique.

Routes:
    GET /api/v1/sitemap - Liste toutes les routes scannées
    POST /api/v1/sitemap/healthcheck - Lance healthcheck sur une app
    GET /api/v1/sitemap/health-history - Historique healthchecks
"""

import logging
import json
from datetime import datetime
from odoo import http
from odoo.http import request, Response

_logger = logging.getLogger(__name__)


class SitemapController(http.Controller):
    """Controller pour sitemap dynamique et healthcheck"""

    @http.route('/api/v1/sitemap', auth='public', methods=['GET'], csrf=False)
    def get_sitemap(self, **kwargs):
        """
        GET /api/v1/sitemap

        Retourne toutes les routes des 4 applications scannées.
        Utilise le scanner TypeScript côté backend (réutilise logique V2).

        Response:
            {
                "success": true,
                "data": {
                    "apps": [
                        {
                            "id": "vitrine-quelyos",
                            "name": "Vitrine Quelyos",
                            "baseUrl": "http://localhost:3000",
                            "port": 3000,
                            "routes": [
                                {
                                    "path": "/",
                                    "name": "Accueil",
                                    "type": "static",
                                    "health": {
                                        "status": "ok",
                                        "statusCode": 200,
                                        "responseTime": 45,
                                        "lastChecked": "2026-01-30T17:00:00Z"
                                    }
                                }
                            ],
                            "health": {
                                "total": 64,
                                "ok": 63,
                                "errors": 1,
                                "lastChecked": "2026-01-30T17:00:00Z"
                            }
                        }
                    ],
                    "totalRoutes": 235,
                    "lastGenerated": "2026-01-30T17:00:00Z",
                    "version": "3.0.0"
                }
            }
        """
        try:
            # Récupérer données depuis cache ou régénérer
            SitemapService = request.env['quelyos.sitemap.service'].sudo()
            sitemap_data = SitemapService.get_sitemap_cached()

            return Response(
                json.dumps({
                    'success': True,
                    'data': sitemap_data
                }),
                content_type='application/json',
                status=200
            )

        except Exception as e:
            _logger.error(f'[Sitemap] Error fetching sitemap: {str(e)}', exc_info=True)
            return Response(
                json.dumps({
                    'success': False,
                    'error': str(e)
                }),
                content_type='application/json',
                status=500
            )

    @http.route('/api/v1/sitemap/healthcheck', auth='public', methods=['POST'], csrf=False)
    def trigger_healthcheck(self, **kwargs):
        """
        POST /api/v1/sitemap/healthcheck

        Lance healthcheck sur une ou toutes les apps.

        Body:
            {
                "app_id": "vitrine-quelyos"  # Optionnel, si absent = toutes apps
            }

        Response:
            {
                "success": true,
                "data": {
                    "healthcheck_id": 123,
                    "apps_checked": 1,
                    "total_routes": 64,
                    "ok": 63,
                    "errors": 1,
                    "started_at": "2026-01-30T17:00:00Z"
                }
            }
        """
        try:
            data = json.loads(request.httprequest.data.decode('utf-8'))
            app_id = data.get('app_id')

            SitemapService = request.env['quelyos.sitemap.service'].sudo()
            result = SitemapService.trigger_healthcheck(app_id)

            return Response(
                json.dumps({
                    'success': True,
                    'data': result
                }),
                content_type='application/json',
                status=200
            )

        except Exception as e:
            _logger.error(f'[Sitemap] Error triggering healthcheck: {str(e)}', exc_info=True)
            return Response(
                json.dumps({
                    'success': False,
                    'error': str(e)
                }),
                content_type='application/json',
                status=500
            )

    @http.route('/api/v1/sitemap/health-history', auth='public', methods=['GET'], csrf=False)
    def get_health_history(self, **kwargs):
        """
        GET /api/v1/sitemap/health-history?app_id=vitrine-quelyos&limit=50

        Récupère historique healthchecks.

        Query params:
            app_id (str): Filtrer par app
            limit (int): Nombre max résultats (défaut 50)

        Response:
            {
                "success": true,
                "data": {
                    "history": [
                        {
                            "id": 123,
                            "app_id": "vitrine-quelyos",
                            "total": 64,
                            "ok": 63,
                            "errors": 1,
                            "created_at": "2026-01-30T17:00:00Z"
                        }
                    ],
                    "total": 100
                }
            }
        """
        try:
            app_id = kwargs.get('app_id')
            limit = int(kwargs.get('limit', 50))

            HealthCheck = request.env['quelyos.sitemap.healthcheck'].sudo()

            domain = []
            if app_id:
                domain.append(('app_id', '=', app_id))

            checks = HealthCheck.search(domain, limit=limit, order='create_date desc')

            history = [{
                'id': check.id,
                'app_id': check.app_id,
                'total': check.total_routes,
                'ok': check.ok_routes,
                'errors': check.error_routes,
                'created_at': check.create_date.isoformat() if check.create_date else None,
            } for check in checks]

            total = HealthCheck.search_count(domain)

            return Response(
                json.dumps({
                    'success': True,
                    'data': {
                        'history': history,
                        'total': total
                    }
                }),
                content_type='application/json',
                status=200
            )

        except Exception as e:
            _logger.error(f'[Sitemap] Error fetching health history: {str(e)}', exc_info=True)
            return Response(
                json.dumps({
                    'success': False,
                    'error': str(e)
                }),
                content_type='application/json',
                status=500
            )
