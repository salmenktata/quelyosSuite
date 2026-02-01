# -*- coding: utf-8 -*-
import logging
import json
import threading
from datetime import datetime, timedelta
from odoo import http, api
from odoo.http import request
from odoo.exceptions import ValidationError, AccessDenied
from odoo.modules.registry import Registry
from .super_admin import SuperAdminController
from ..config import get_cors_headers

_logger = logging.getLogger(__name__)

# Rate limiting global
_SEED_RATE_LIMIT = {}  # {tenant_id: last_generation_time}
_MAX_CONCURRENT_JOBS = 3

# Mode DEV : Désactiver rate limiting pour localhost
import os
_DEV_MODE = os.environ.get('ODOO_DEV_MODE', 'true').lower() == 'true'


class AdminSeedController(SuperAdminController):
    """Contrôleur super-admin pour génération de données seed"""

    @http.route('/api/super-admin/seed-data/generate', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def generate_seed_data(self):
        """Générer des données seed pour un tenant

        POST Body:
        {
            "tenant_id": 1,
            "volumetry": "standard",
            "modules": ["store", "stock", "crm", "marketing", "finance", "hr", "pos", "support"],
            "reset_before_seed": false,
            "enable_relations": true,
            "enable_unsplash_images": true
        }

        Returns:
        {
            "success": true,
            "job_id": "seed_20260131_143025_001"
        }
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        # Vérification super admin (gère JWT Bearer + session)
        try:
            user_id = self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            # Parser body JSON
            try:
                body = json.loads(request.httprequest.data.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                return request.make_json_response(
                    {'success': False, 'error': f'JSON invalide: {str(e)}'},
                    headers=cors_headers,
                    status=400
                )

            # Validation paramètres
            tenant_id = body.get('tenant_id')
            if not tenant_id:
                return request.make_json_response(
                    {'success': False, 'error': 'tenant_id requis'},
                    headers=cors_headers,
                    status=400
                )

            # Vérifier tenant
            Tenant = request.env['quelyos.tenant'].sudo()
            tenant = Tenant.browse(int(tenant_id))
            if not tenant.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Tenant introuvable'},
                    headers=cors_headers,
                    status=404
                )

            if tenant.status != 'active':
                return request.make_json_response(
                    {'success': False, 'error': 'Tenant non actif'},
                    headers=cors_headers,
                    status=400
                )

            # Récupérer le modèle SeedJob
            SeedJob = request.env['quelyos.seed.job'].sudo()

            # Rate limiting : 1 génération / 5 minutes par tenant (DÉSACTIVÉ EN DEV)
            is_dev_tenant = tenant.domain in ['localhost', '127.0.0.1'] or _DEV_MODE

            if not is_dev_tenant:
                now = datetime.now()
                if tenant_id in _SEED_RATE_LIMIT:
                    last_time = _SEED_RATE_LIMIT[tenant_id]
                    if (now - last_time) < timedelta(minutes=5):
                        remaining = 300 - (now - last_time).total_seconds()
                        return request.make_json_response(
                            {
                                'success': False,
                                'error': f'Veuillez attendre {int(remaining)}s avant de relancer une génération'
                            },
                            headers=cors_headers,
                            status=429
                        )

                # Vérifier jobs concurrents globaux
                running_count = SeedJob.search_count([('status', 'in', ['pending', 'running'])])
                if running_count >= _MAX_CONCURRENT_JOBS:
                    return request.make_json_response(
                        {
                            'success': False,
                            'error': f'Trop de jobs seed en cours ({running_count}/{_MAX_CONCURRENT_JOBS}). Réessayez plus tard.'
                        },
                        headers=cors_headers,
                        status=503
                    )
            else:
                _logger.info(f"[DEV MODE] Rate limiting désactivé pour tenant {tenant.name} (domain: {tenant.domain})")

            # Construire config
            config = {
                'volumetry': body.get('volumetry', 'standard'),
                'modules': body.get('modules', ['store', 'stock', 'crm', 'marketing', 'finance', 'pos', 'support']),
                'reset_before_seed': body.get('reset_before_seed', False),
                'enable_relations': body.get('enable_relations', True),
                'enable_unsplash_images': body.get('enable_unsplash_images', True),
            }

            # Créer job
            _logger.info(f"[SEED] Creating job for tenant {tenant.name} (ID: {tenant_id})")
            job = SeedJob.create_job(tenant_id, config)
            _logger.info(f"[SEED] Job created: {job.job_id} (DB ID: {job.id})")

            # CRITICAL: Commit avant le thread pour que le nouveau cursor puisse voir le job
            request.env.cr.commit()
            _logger.info(f"[SEED] Job committed to database")

            # Lancer génération en arrière-plan
            db_name = request.env.cr.dbname
            _logger.info(f"[SEED] Launching background thread for job {job.job_id} on database {db_name}")
            threading.Thread(
                target=self._execute_seed_generation,
                args=(db_name, job.id, job.job_id),
                daemon=True
            ).start()

            # Mettre à jour rate limit (sauf en DEV)
            if not is_dev_tenant:
                _SEED_RATE_LIMIT[tenant_id] = datetime.now()

            # Audit log
            _logger.info(f"[SEED] Creating audit log for job {job.job_id}")
            request.env['quelyos.audit.log'].sudo().create({
                'action': 'seed_data_generated',
                'tenant_id': tenant_id,
                'user_id': user_id,
                'details': json.dumps({
                    'job_id': job.job_id,
                    'config': config,
                }),
            })
            _logger.info(f"[SEED] Job {job.job_id} created successfully, launching background thread")

            return request.make_json_response(
                {
                    'success': True,
                    'job_id': job.job_id,
                },
                headers=cors_headers
            )

        except ValidationError as e:
            _logger.warning(f"Validation error in seed generation: {e}")
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=400
            )
        except Exception as e:
            _logger.error(f"Seed generation error: {e}", exc_info=True)
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/seed-data/status/<string:job_id>', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_seed_status(self, job_id):
        """Récupérer le statut d'un job de génération seed (polling)

        Args:
            job_id (str): ID du job

        Returns:
        {
            "success": true,
            "data": {
                "job_id": "seed_20260131_143025_001",
                "status": "running",
                "progress_percent": 45,
                "current_module": "store",
                "logs": [...],
                "results": {...}
            }
        }
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        # Vérification super admin (gère JWT Bearer + session)
        try:
            user_id = self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            SeedJob = request.env['quelyos.seed.job'].sudo()
            job = SeedJob.search([('job_id', '=', job_id)], limit=1)

            if not job:
                return request.make_json_response(
                    {'success': False, 'error': 'Job introuvable'},
                    headers=cors_headers,
                    status=404
                )

            return request.make_json_response(
                {
                    'success': True,
                    'data': job.get_status_data(),
                },
                headers=cors_headers
            )

        except Exception as e:
            _logger.error(f"Get seed status error: {e}", exc_info=True)
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/seed-data/report/<string:job_id>', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def download_seed_report(self, job_id):
        """Télécharger le rapport JSON d'un job terminé

        Args:
            job_id (str): ID du job

        Returns:
            JSON file download
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        # Vérification super admin (gère JWT Bearer + session)
        try:
            user_id = self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            SeedJob = request.env['quelyos.seed.job'].sudo()
            job = SeedJob.search([('job_id', '=', job_id)], limit=1)

            if not job:
                return request.make_json_response(
                    {'success': False, 'error': 'Job introuvable'},
                    headers=cors_headers,
                    status=404
                )

            if job.status != 'completed':
                return request.make_json_response(
                    {'success': False, 'error': 'Job non terminé'},
                    headers=cors_headers,
                    status=400
                )

            # Générer rapport JSON
            report = {
                'job_id': job.job_id,
                'tenant_id': job.tenant_id.id,
                'tenant_name': job.tenant_id.name,
                'config': json.loads(job.config_json or '{}'),
                'results': json.loads(job.results_json or '{}'),
                'start_time': job.start_time.isoformat() if job.start_time else None,
                'end_time': job.end_time.isoformat() if job.end_time else None,
                'duration_seconds': (job.end_time - job.start_time).total_seconds() if job.start_time and job.end_time else 0,
                'generated_at': datetime.now().isoformat(),
            }

            # Téléchargement JSON
            filename = f"seed_report_{job_id}.json"
            json_data = json.dumps(report, indent=2, ensure_ascii=False)

            response = request.make_response(
                json_data,
                headers=[
                    ('Content-Type', 'application/json; charset=utf-8'),
                    ('Content-Disposition', f'attachment; filename="{filename}"'),
                    *list(cors_headers.items())
                ]
            )

            return response

        except Exception as e:
            _logger.error(f"Download seed report error: {e}", exc_info=True)
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    def _execute_seed_generation(self, db_name, job_id, job_public_id):
        """Exécuter la génération seed en arrière-plan (thread séparé)

        Args:
            db_name (str): Nom de la base de données
            job_id (int): ID du job à exécuter
            job_public_id (str): ID public du job (pour logs)
        """
        _logger.info(f"[SEED THREAD] Starting generation for job {job_public_id} (DB ID: {job_id})")

        # Créer nouveau cursor pour thread séparé (pattern Odoo correct)
        try:
            reg = Registry(db_name)
            with reg.cursor() as cr:
                env = api.Environment(cr, 1, {})  # SUPERUSER_ID = 1
                _logger.info(f"[SEED THREAD] Environment created for job {job_public_id}")

                try:
                    job = env['quelyos.seed.job'].browse(job_id)
                    if not job.exists():
                        _logger.error(f"[SEED THREAD] Job {job_id} not found in database")
                        return

                    _logger.info(f"[SEED THREAD] Job {job_public_id} found, marking as running")
                    job.mark_running()

                    # Importer et exécuter générateur
                    from ..models.seed_generator import SeedGenerator

                    config = json.loads(job.config_json)
                    _logger.info(f"[SEED THREAD] Config loaded for job {job_public_id}: {config}")

                    generator = SeedGenerator(env, job.tenant_id.id, config, job)
                    _logger.info(f"[SEED THREAD] Generator created, starting generation for tenant {job.tenant_id.name}")

                    generator.generate_all()

                    _logger.info(f"[SEED THREAD] Generation completed successfully for job {job_public_id}")

                except Exception as e:
                    _logger.error(f"[SEED THREAD] Generation failed for job {job_public_id}: {e}", exc_info=True)
                    job = env['quelyos.seed.job'].browse(job_id)
                    if job.exists():
                        job.mark_error(str(e))

        except Exception as e:
            _logger.error(f"[SEED THREAD] Critical error in thread for job {job_public_id}: {e}", exc_info=True)
