"""
Service Sitemap

Gère le scan des routes et healthcheck des applications.
Réutilise la logique TypeScript via subprocess ou implémente en Python.
"""

import json
import subprocess
import time
import logging
from datetime import datetime, timedelta
from odoo import models, api
from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT

_logger = logging.getLogger(__name__)


class SitemapService(models.AbstractModel):
    """Service pour scan sitemap et healthcheck"""

    _name = 'quelyos.sitemap.service'
    _description = 'Sitemap Service'

    CACHE_KEY = 'sitemap_data_cache'
    CACHE_TTL = 300  # 5 minutes

    @api.model
    def get_sitemap_cached(self):
        """
        Récupère sitemap en scannant les fichiers.
        TODO: Ajouter cache Redis pour optimisation.
        """
        _logger.info('[Sitemap] Generating sitemap...')
        sitemap_data = self._generate_sitemap()
        return sitemap_data

    def _generate_sitemap(self):
        """
        Génère sitemap basique.
        TODO: Scanner les fichiers ou lire depuis fichier généré.
        """
        try:
            # Pour l'instant, retourner structure basique
            # Le frontend peut utiliser son propre sitemap.ts
            sitemap = {
                'apps': [
                    {
                        'id': 'vitrine-quelyos',
                        'name': 'Site Vitrine',
                        'baseUrl': 'http://localhost:3000',
                        'routes': []
                    },
                    {
                        'id': 'dashboard-client',
                        'name': 'Dashboard Client',
                        'baseUrl': 'http://localhost:5175',
                        'routes': []
                    },
                    {
                        'id': 'super-admin-client',
                        'name': 'Panel Super Admin',
                        'baseUrl': 'http://localhost:5176',
                        'routes': []
                    },
                    {
                        'id': 'vitrine-client',
                        'name': 'Boutique E-commerce',
                        'baseUrl': 'http://localhost:3001',
                        'routes': []
                    }
                ],
                'totalRoutes': 0,
                'lastGenerated': datetime.now().isoformat(),
                'version': '3.0.0'
            }

            # Enrichir avec healthcheck récent si disponible
            sitemap = self._enrich_with_health(sitemap)

            return sitemap

        except Exception as e:
            _logger.error(f'[Sitemap] Error generating: {str(e)}', exc_info=True)
            return self._get_fallback_sitemap()

    def _enrich_with_health(self, sitemap):
        """
        Enrichir sitemap avec données healthcheck récentes (< 1h).
        """
        HealthCheck = self.env['quelyos.sitemap.healthcheck'].sudo()
        one_hour_ago = datetime.now() - timedelta(hours=1)

        for app in sitemap.get('apps', []):
            # Récupérer dernier healthcheck
            recent_check = HealthCheck.search([
                ('app_id', '=', app['id']),
                ('create_date', '>=', one_hour_ago.strftime(DEFAULT_SERVER_DATETIME_FORMAT))
            ], limit=1, order='create_date desc')

            if recent_check:
                app['health'] = {
                    'total': recent_check.total_routes,
                    'ok': recent_check.ok_routes,
                    'errors': recent_check.error_routes,
                    'lastChecked': recent_check.create_date.isoformat() if recent_check.create_date else None
                }

                # Enrichir routes individuelles si détails disponibles
                if recent_check.routes_details:
                    try:
                        routes_health = json.loads(recent_check.routes_details)
                        for route in app.get('routes', []):
                            route_health = routes_health.get(route['path'])
                            if route_health:
                                route['health'] = route_health
                    except json.JSONDecodeError:
                        pass

        return sitemap

    def _get_fallback_sitemap(self):
        """
        Sitemap fallback en cas d'erreur.
        Charge depuis dernier cache ou retourne structure vide.
        """
        return {
            'apps': [],
            'totalRoutes': 0,
            'lastGenerated': datetime.now().isoformat(),
            'version': '3.0.0',
            'error': 'Could not generate sitemap'
        }

    @api.model
    def trigger_healthcheck(self, app_id=None):
        """
        Lance healthcheck sur une ou toutes les apps.
        Exécution synchrone simplifiée (MVP).

        Args:
            app_id (str): ID app à checker, ou None pour toutes

        Returns:
            dict: Info sur le healthcheck effectué
        """
        # Récupérer sitemap
        sitemap = self.get_sitemap_cached()
        apps_to_check = sitemap.get('apps', [])

        if app_id:
            apps_to_check = [app for app in apps_to_check if app['id'] == app_id]

        if not apps_to_check:
            raise ValueError(f'App not found: {app_id}')

        # Exécuter healthcheck directement (synchrone)
        started_at = datetime.now()
        self._run_healthcheck_job(apps_to_check)
        duration = (datetime.now() - started_at).total_seconds()

        total_routes = sum(len(app.get('routes', [])) for app in apps_to_check)

        return {
            'apps_checked': len(apps_to_check),
            'total_routes': total_routes,
            'started_at': started_at.isoformat(),
            'duration_seconds': duration
        }

    def _run_healthcheck_job(self, apps):
        """
        Job async qui exécute healthcheck sur les apps.
        Ping chaque route et stocke résultats.
        """
        import requests

        for app in apps:
            _logger.info(f'[Sitemap] Healthchecking {app["name"]}...')

            base_url = app['baseUrl']
            routes = app.get('routes', [])

            start_time = time.time()
            routes_health = {}
            ok_count = 0
            error_count = 0
            response_times = []

            for route in routes:
                url = f'{base_url}{route["path"]}'

                try:
                    # HEAD request plus rapide
                    resp_start = time.time()
                    response = requests.head(url, timeout=5, allow_redirects=True)
                    resp_time = int((time.time() - resp_start) * 1000)

                    status = 'ok' if 200 <= response.status_code < 400 else 'error'

                    if status == 'ok':
                        ok_count += 1
                    else:
                        error_count += 1

                    response_times.append(resp_time)

                    routes_health[route['path']] = {
                        'status': status,
                        'statusCode': response.status_code,
                        'responseTime': resp_time,
                        'lastChecked': datetime.now().isoformat()
                    }

                except requests.Timeout:
                    error_count += 1
                    routes_health[route['path']] = {
                        'status': 'error',
                        'error': 'timeout',
                        'lastChecked': datetime.now().isoformat()
                    }
                except Exception as e:
                    error_count += 1
                    routes_health[route['path']] = {
                        'status': 'error',
                        'error': str(e),
                        'lastChecked': datetime.now().isoformat()
                    }

            duration_ms = int((time.time() - start_time) * 1000)

            # Stocker résultats en DB
            healthcheck = self.env['quelyos.sitemap.healthcheck'].sudo().create({
                'app_id': app['id'],
                'app_name': app['name'],
                'total_routes': len(routes),
                'ok_routes': ok_count,
                'error_routes': error_count,
                'avg_response_time': int(sum(response_times) / len(response_times)) if response_times else 0,
                'max_response_time': max(response_times) if response_times else 0,
                'routes_details': json.dumps(routes_health),
                'duration_ms': duration_ms,
                'triggered_by': 'manual'
            })

            # Vérifier si dégradation → alerte
            healthcheck.check_degradation_alert()

            _logger.info(
                f'[Sitemap] {app["name"]} healthcheck done: '
                f'{ok_count}/{len(routes)} OK ({duration_ms}ms)'
            )
