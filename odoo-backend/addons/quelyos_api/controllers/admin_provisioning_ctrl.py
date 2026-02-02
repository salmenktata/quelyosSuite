# -*- coding: utf-8 -*-
"""
Controller Super Admin - Provisioning Tenants
Endpoints pour créer et provisionner de nouveaux tenants.
"""

import logging
import json
import secrets
from datetime import datetime

from odoo import http
from odoo.http import request
from odoo.exceptions import AccessDenied, ValidationError

from .super_admin import SuperAdminController
from ..config import get_cors_headers

_logger = logging.getLogger(__name__)


class AdminProvisioningController(SuperAdminController):
    """Contrôleur super-admin pour provisioning des tenants"""

    @http.route('/api/super-admin/tenants', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def create_tenant(self):
        """Créer un nouveau tenant et démarrer le provisioning

        POST Body:
        {
            "name": "Ma Boutique",
            "domain": "ma-boutique.quelyos.com",
            "plan_code": "pro",
            "admin_email": "admin@example.com",
            "admin_name": "Jean Dupont"
        }

        Returns:
        {
            "success": true,
            "data": {
                "tenant_id": 123,
                "provisioning_job_id": "PROV-001"
            }
        }
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        # Vérification authentification
        # Vérification super admin
        try:
            self._check_super_admin()
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

            # Validation paramètres requis
            name = body.get('name')
            domain = body.get('domain')
            plan_code = body.get('plan_code')
            admin_email = body.get('admin_email')
            admin_name = body.get('admin_name')

            if not all([name, domain, plan_code, admin_email]):
                return request.make_json_response(
                    {'success': False, 'error': 'Paramètres requis: name, domain, plan_code, admin_email'},
                    headers=cors_headers,
                    status=400
                )

            # Vérifier que le domain n'existe pas déjà
            Tenant = request.env['quelyos.tenant'].sudo()
            existing = Tenant.search([('domain', '=', domain)], limit=1)
            if existing:
                return request.make_json_response(
                    {'success': False, 'error': f'Le domaine {domain} est déjà utilisé'},
                    headers=cors_headers,
                    status=409
                )

            # Vérifier que le plan existe
            Plan = request.env['quelyos.subscription.plan'].sudo()
            plan = Plan.search([('code', '=', plan_code)], limit=1)
            if not plan:
                # Créer le plan s'il n'existe pas (pour mode dev)
                _logger.warning(f"Plan {plan_code} not found, creating default plan")
                plan = Plan.create({
                    'name': plan_code.title(),
                    'code': plan_code,
                    'price': {'starter': 49, 'pro': 99, 'enterprise': 299}.get(plan_code, 99),
                    'max_users': {'starter': 5, 'pro': 20, 'enterprise': 9999}.get(plan_code, 20),
                    'max_products': {'starter': 1000, 'pro': 10000, 'enterprise': 999999}.get(plan_code, 10000),
                    'max_orders_per_month': {'starter': 500, 'pro': 5000, 'enterprise': 999999}.get(plan_code, 5000),
                })

            # Créer le tenant avec status 'provisioning'
            # Générer code unique depuis le domaine
            code = domain.split('.')[0].replace('-', '_')

            tenant = Tenant.create({
                'name': name,
                'code': code,
                'domain': domain,
                'status': 'provisioning',
                'plan_id': plan.id,
                'admin_email': admin_email,
            })

            _logger.info(f"[PROVISIONING] Created tenant {tenant.id}: {name} ({domain})")

            # Créer le job de provisioning
            ProvisioningJob = request.env['quelyos.provisioning.job'].sudo()
            job = ProvisioningJob.create({
                'tenant_id': tenant.id,
            })

            # Démarrer le provisioning en background
            job.action_start()

            _logger.info(f"[PROVISIONING] Started job {job.name} for tenant {tenant.id}")

            return request.make_json_response(
                {
                    'success': True,
                    'data': {
                        'tenant_id': tenant.id,
                        'provisioning_job_id': job.name,
                    }
                },
                headers=cors_headers
            )

        except ValidationError as e:
            _logger.warning(f"Validation error in tenant creation: {e}")
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=400
            )
        except Exception as e:
            _logger.error(f"Tenant creation error: {e}", exc_info=True)
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/provisioning/status/<string:job_id>', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_provisioning_status(self, job_id):
        """Récupérer le statut d'un job de provisioning (polling)

        Args:
            job_id (str): ID du job (ex: "PROV-001")

        Returns:
        {
            "success": true,
            "data": {
                "status": "running",
                "progress_percent": 65,
                "current_step": "Création de l'entrepôt...",
                "tenant_id": 123,
                "store_url": "https://ma-boutique.quelyos.com",
                "admin_url": "https://admin.ma-boutique.quelyos.com",
                "temp_password": "TempPass123",
                "error_message": null
            }
        }
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        # Vérification authentification
        # Vérification super admin
        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            # Chercher le job par son name (qui est le job_id)
            ProvisioningJob = request.env['quelyos.provisioning.job'].sudo()
            job = ProvisioningJob.search([('name', '=', job_id)], limit=1)

            if not job:
                return request.make_json_response(
                    {'success': False, 'error': 'Job introuvable'},
                    headers=cors_headers,
                    status=404
                )

            # Construire la réponse
            data = {
                'status': job.state,
                'progress_percent': job.progress,
                'current_step': job.current_step,
                'tenant_id': job.tenant_id.id if job.tenant_id else None,
                'store_url': job.store_url,
                'admin_url': job.admin_url,
                'temp_password': job.temp_password if job.state == 'completed' else None,
                'error_message': job.error_message,
            }

            return request.make_json_response(
                {
                    'success': True,
                    'data': data
                },
                headers=cors_headers
            )

        except Exception as e:
            _logger.error(f"Provisioning status error: {e}", exc_info=True)
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )
