# -*- coding: utf-8 -*-
"""
Contrôleur API pour la gestion des tenants (boutiques/marques).

Endpoints:
- GET /api/ecommerce/tenant/by-domain : Lookup public par domaine
- GET /api/ecommerce/tenant/list : Liste des tenants (admin)
- GET /api/ecommerce/tenant/<id> : Détail d'un tenant (admin)
- POST /api/ecommerce/tenant/create : Création (admin)
- PUT /api/ecommerce/tenant/<id>/update : Modification (admin)
- DELETE /api/ecommerce/tenant/<id>/delete : Suppression (admin)

Self-Service Onboarding:
- POST /api/onboarding/check-slug : Vérifie disponibilité du slug
- POST /api/onboarding/create-tenant : Crée un tenant depuis le signup
"""

import json
import logging
import base64
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class TenantController(BaseController):
    """Contrôleur pour la gestion des tenants multi-boutique"""

    # ═══════════════════════════════════════════════════════════════════════════
    # ENDPOINTS PUBLICS
    # ═══════════════════════════════════════════════════════════════════════════

    @http.route(
        '/api/ecommerce/tenant/by-domain',
        type='http',
        auth='public',
        methods=['GET', 'OPTIONS'],
        csrf=False,
    )
    def get_tenant_by_domain(self, **kwargs):
        """
        Recherche un tenant par son domaine.
        Endpoint public utilisé par le middleware Next.js.

        Query params:
            domain: Le domaine à rechercher (ex: marque.com)

        Returns:
            {success: true, tenant: TenantConfig} ou {success: false, error: string}

        Cache: 60s recommandé côté client
        """
        # Récupérer les headers CORS
        from ..config import get_cors_headers
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=cors_headers)

        try:
            domain = kwargs.get('domain', '').strip().lower()

            if not domain:
                return request.make_json_response({
                    'success': False,
                    'error': 'Paramètre domain requis',
                    'error_code': 'MISSING_DOMAIN'
                }, status=400, headers=cors_headers)

            # Recherche du tenant
            Tenant = request.env['quelyos.tenant']
            tenant = Tenant.find_by_domain(domain)

            if not tenant:
                _logger.debug(f"Tenant not found for domain: {domain}")
                return request.make_json_response({
                    'success': False,
                    'error': 'Tenant non trouvé',
                    'error_code': 'TENANT_NOT_FOUND'
                }, status=404, headers=cors_headers)

            # Convertir en config frontend
            config = tenant.to_frontend_config()

            # Fusionner headers CORS avec Cache-Control
            response_headers = {**cors_headers, 'Cache-Control': 'public, max-age=60'}

            return request.make_json_response({
                'success': True,
                'tenant': config
            }, headers=response_headers)

        except Exception as e:
            _logger.error(f"Error fetching tenant by domain: {e}")
            return request.make_json_response({
                'success': False,
                'error': 'Erreur serveur',
                'error_code': 'SERVER_ERROR'
            }, status=500, headers=cors_headers)

    @http.route(
        '/api/ecommerce/tenant/<int:tenant_id>',
        type='http',
        auth='public',
        methods=['GET', 'OPTIONS'],
        csrf=False,
    )
    def get_tenant_by_id(self, tenant_id, **kwargs):
        """
        Récupère un tenant par son ID.
        Utilisé par le backoffice pour l'édition.

        Returns:
            {success: true, tenant: TenantConfig}
        """
        # Récupérer les headers CORS
        from ..config import get_cors_headers
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=cors_headers)

        try:
            # Authentification requise pour accès par ID
            error = self._authenticate_from_header()
            if error:
                return request.make_json_response(error, status=401, headers=cors_headers)

            error = self._require_admin()
            if error:
                return request.make_json_response(error, status=403, headers=cors_headers)

            tenant = request.env['quelyos.tenant'].sudo().browse(tenant_id)

            if not tenant.exists():
                return request.make_json_response({
                    'success': False,
                    'error': 'Tenant non trouvé',
                    'error_code': 'TENANT_NOT_FOUND'
                }, status=404, headers=cors_headers)

            return request.make_json_response({
                'success': True,
                'tenant': tenant.to_frontend_config()
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Error fetching tenant {tenant_id}: {e}")
            return request.make_json_response({
                'success': False,
                'error': 'Erreur serveur',
                'error_code': 'SERVER_ERROR'
            }, status=500, headers=cors_headers)

    @http.route(
        '/api/ecommerce/tenant/<string:code>',
        type='http',
        auth='public',
        methods=['GET', 'OPTIONS'],
        csrf=False,
    )
    def get_tenant_by_code(self, code, **kwargs):
        """
        Récupère un tenant par son code.
        Endpoint public pour le client-side après detection middleware.

        Returns:
            {success: true, tenant: TenantConfig}
        """
        # Récupérer les headers CORS
        from ..config import get_cors_headers
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=cors_headers)

        try:
            tenant = request.env['quelyos.tenant'].sudo().search([
                ('code', '=', code),
                ('active', '=', True)
            ], limit=1)

            if not tenant:
                return request.make_json_response({
                    'success': False,
                    'error': 'Tenant non trouvé',
                    'error_code': 'TENANT_NOT_FOUND'
                }, status=404, headers=cors_headers)

            # Fusionner headers CORS avec Cache-Control
            response_headers = {**cors_headers, 'Cache-Control': 'public, max-age=300'}

            return request.make_json_response({
                'success': True,
                'tenant': tenant.to_frontend_config()
            }, headers=response_headers)

        except Exception as e:
            _logger.error(f"Error fetching tenant by code {code}: {e}")
            return request.make_json_response({
                'success': False,
                'error': 'Erreur serveur',
                'error_code': 'SERVER_ERROR'
            }, status=500, headers=cors_headers)

    # ═══════════════════════════════════════════════════════════════════════════
    # ENDPOINTS UTILISATEUR (Mon Tenant)
    # ═══════════════════════════════════════════════════════════════════════════

    @http.route(
        '/api/ecommerce/tenant/my',
        type='http',
        auth='public',
        methods=['GET', 'OPTIONS'],
        csrf=False
    )
    def get_my_tenant(self, **kwargs):
        """
        Récupère le tenant de l'utilisateur connecté.
        Le tenant est trouvé via la company de l'utilisateur.

        Returns:
            {success: true, tenant: TenantConfig} ou {success: false, error: string}
        """
        # Récupérer les headers CORS
        from ..config import get_cors_headers
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=cors_headers)

        try:
            # Authentification requise
            error = self._authenticate_from_header()
            if error:
                return request.make_json_response(error, status=401, headers=cors_headers)

            user = request.env.user
            company_id = user.company_id.id

            # Rechercher le tenant lié à la company de l'utilisateur
            tenant = request.env['quelyos.tenant'].sudo().search([
                ('company_id', '=', company_id),
                ('active', '=', True)
            ], limit=1)

            # Exception pour l'admin : créer un tenant par défaut s'il n'existe pas
            if not tenant and user.login == 'admin':
                _logger.info("Création automatique d'un tenant pour l'admin")
                try:
                    # Utiliser un code unique basé sur la company ID
                    unique_code = f'admin-{company_id}'

                    # Vérifier si le tenant existe déjà (par code)
                    existing = request.env['quelyos.tenant'].sudo().search([
                        ('code', '=', unique_code)
                    ], limit=1)

                    if existing:
                        tenant = existing
                        _logger.info(f"Tenant admin existant récupéré : {tenant.id}")
                    else:
                        tenant = request.env['quelyos.tenant'].sudo().create({
                            'name': 'Admin Shop',
                            'code': unique_code,
                            'domain': f'localhost-admin-{company_id}',
                            'company_id': company_id,
                        })
                        _logger.info(f"Tenant admin créé avec succès : {tenant.id}")
                except Exception as e:
                    _logger.error(f"Erreur création tenant admin : {e}")

            if not tenant:
                return request.make_json_response({
                    'success': False,
                    'error': 'Aucun tenant associé à votre compte',
                    'error_code': 'NO_TENANT'
                }, status=404, headers=cors_headers)

            return request.make_json_response({
                'success': True,
                'tenant': tenant.to_frontend_config()
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Error fetching my tenant: {e}")
            return request.make_json_response({
                'success': False,
                'error': 'Erreur serveur',
                'error_code': 'SERVER_ERROR'
            }, status=500, headers=cors_headers)

    @http.route(
        '/api/ecommerce/tenant/my/update',
        type='http',
        auth='public',
        methods=['PUT', 'POST', 'OPTIONS'],
        csrf=False
    )
    def update_my_tenant(self, **kwargs):
        """
        Met à jour le tenant de l'utilisateur connecté.
        Permet au client de personnaliser son thème sans être admin.

        Body JSON:
            ... champs de personnalisation (couleurs, logo, contact, etc.)

        Returns:
            {success: true, tenant: TenantConfig}
        """
        # Récupérer les headers CORS
        from ..config import get_cors_headers
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=cors_headers)

        try:
            # Authentification requise
            error = self._authenticate_from_header()
            if error:
                return request.make_json_response(error, status=401, headers=cors_headers)

            user = request.env.user
            company_id = user.company_id.id

            # Trouver le tenant de l'utilisateur
            tenant = request.env['quelyos.tenant'].sudo().search([
                ('company_id', '=', company_id),
                ('active', '=', True)
            ], limit=1)

            if not tenant:
                return request.make_json_response({
                    'success': False,
                    'error': 'Aucun tenant associé à votre compte',
                    'error_code': 'NO_TENANT'
                }, status=404, headers=cors_headers)

            # Récupérer et préparer les données
            data = self._get_http_params()
            values = self._prepare_tenant_values(data, update=True)

            # Retirer les champs que le client ne peut pas modifier
            protected_fields = ['code', 'domain', 'company_id', 'active']
            for field in protected_fields:
                values.pop(field, None)

            # Mettre à jour
            tenant.write(values)

            _logger.info(f"Tenant updated by user {user.login}: {tenant.code}")

            return request.make_json_response({
                'success': True,
                'tenant': tenant.to_frontend_config()
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Error updating my tenant: {e}")
            return request.make_json_response({
                'success': False,
                'error': 'Erreur lors de la mise à jour',
                'error_code': 'UPDATE_ERROR'
            }, status=500, headers=cors_headers)

    # ═══════════════════════════════════════════════════════════════════════════
    # ENDPOINTS ADMIN (CRUD)
    # ═══════════════════════════════════════════════════════════════════════════

    @http.route(
        '/api/ecommerce/tenant/list',
        type='http',
        auth='public',
        methods=['GET', 'OPTIONS'],
        csrf=False,
    )
    def list_tenants(self, **kwargs):
        """
        Liste tous les tenants (admin seulement).

        Query params:
            active: Filtrer par statut actif (true/false)
            search: Recherche par nom ou domaine

        Returns:
            {success: true, tenants: TenantConfig[], total: number}
        """
        # Récupérer les headers CORS
        from ..config import get_cors_headers
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=cors_headers)

        try:
            # Authentification admin requise
            error = self._authenticate_from_header()
            if error:
                return request.make_json_response(error, status=401, headers=cors_headers)

            error = self._require_admin()
            if error:
                return request.make_json_response(error, status=403, headers=cors_headers)

            # Construire le domaine de recherche
            domain = []

            # Filtre par statut actif
            active_filter = kwargs.get('active')
            if active_filter is not None:
                domain.append(('active', '=', active_filter == 'true'))

            # Recherche par nom ou domaine
            search_term = kwargs.get('search', '').strip()
            if search_term:
                domain.append('|')
                domain.append(('name', 'ilike', search_term))
                domain.append(('domain', 'ilike', search_term))

            # Récupérer les tenants
            Tenant = request.env['quelyos.tenant'].sudo()
            tenants = Tenant.search(domain, order='name')
            total = Tenant.search_count(domain)

            return request.make_json_response({
                'success': True,
                'tenants': [t.to_frontend_config() for t in tenants],
                'total': total
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Error listing tenants: {e}")
            return request.make_json_response({
                'success': False,
                'error': 'Erreur serveur',
                'error_code': 'SERVER_ERROR'
            }, status=500, headers=cors_headers)

    @http.route(
        '/api/ecommerce/tenant/create',
        type='http',
        auth='public',
        methods=['POST', 'OPTIONS'],
        csrf=False,
    )
    def create_tenant(self, **kwargs):
        """
        Crée un nouveau tenant (admin seulement).

        Body JSON:
            name: Nom de la boutique (requis)
            code: Code unique (requis)
            domain: Domaine principal (requis)
            ... autres champs optionnels

        Returns:
            {success: true, tenant: TenantConfig, id: number}
        """
        # Récupérer les headers CORS
        from ..config import get_cors_headers
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=cors_headers)

        try:
            # Authentification admin requise
            error = self._authenticate_from_header()
            if error:
                return request.make_json_response(error, status=401, headers=cors_headers)

            error = self._require_admin()
            if error:
                return request.make_json_response(error, status=403, headers=cors_headers)

            # Récupérer les données
            data = self._get_http_params()

            # Validation des champs requis
            required_fields = ['name', 'code', 'domain']
            for field in required_fields:
                if not data.get(field):
                    return request.make_json_response({
                        'success': False,
                        'error': f'Champ requis manquant: {field}',
                        'error_code': 'MISSING_FIELD'
                    }, status=400, headers=cors_headers)

            # Préparer les valeurs
            values = self._prepare_tenant_values(data)

            # Créer le tenant
            tenant = request.env['quelyos.tenant'].sudo().create(values)

            _logger.info(f"Tenant created: {tenant.code} (ID: {tenant.id})")

            return request.make_json_response({
                'success': True,
                'tenant': tenant.to_frontend_config(),
                'id': tenant.id
            }, status=201, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Error creating tenant: {e}")
            error_msg = str(e)
            if 'UNIQUE constraint failed' in error_msg or 'duplicate key' in error_msg:
                return request.make_json_response({
                    'success': False,
                    'error': 'Code ou domaine déjà utilisé',
                    'error_code': 'DUPLICATE_KEY'
                }, status=409, headers=cors_headers)
            return request.make_json_response({
                'success': False,
                'error': 'Erreur lors de la création',
                'error_code': 'CREATE_ERROR'
            }, status=500, headers=cors_headers)

    @http.route(
        '/api/ecommerce/tenant/<int:tenant_id>/update',
        type='http',
        auth='public',
        methods=['PUT', 'POST', 'OPTIONS'],
        csrf=False,
    )
    def update_tenant(self, tenant_id, **kwargs):
        """
        Met à jour un tenant existant (admin seulement).

        Body JSON:
            ... champs à mettre à jour

        Returns:
            {success: true, tenant: TenantConfig}
        """
        # Récupérer les headers CORS
        from ..config import get_cors_headers
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=cors_headers)

        try:
            # Authentification admin requise
            error = self._authenticate_from_header()
            if error:
                return request.make_json_response(error, status=401, headers=cors_headers)

            error = self._require_admin()
            if error:
                return request.make_json_response(error, status=403, headers=cors_headers)

            # Récupérer le tenant
            tenant = request.env['quelyos.tenant'].sudo().browse(tenant_id)

            if not tenant.exists():
                return request.make_json_response({
                    'success': False,
                    'error': 'Tenant non trouvé',
                    'error_code': 'TENANT_NOT_FOUND'
                }, status=404, headers=cors_headers)

            # Récupérer et préparer les données
            data = self._get_http_params()
            values = self._prepare_tenant_values(data, update=True)

            # Mettre à jour
            tenant.write(values)

            _logger.info(f"Tenant updated: {tenant.code} (ID: {tenant.id})")

            return request.make_json_response({
                'success': True,
                'tenant': tenant.to_frontend_config()
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Error updating tenant {tenant_id}: {e}")
            return request.make_json_response({
                'success': False,
                'error': 'Erreur lors de la mise à jour',
                'error_code': 'UPDATE_ERROR'
            }, status=500, headers=cors_headers)

    @http.route(
        '/api/ecommerce/tenant/<int:tenant_id>/delete',
        type='http',
        auth='public',
        methods=['DELETE', 'OPTIONS'],
        csrf=False,
    )
    def delete_tenant(self, tenant_id, **kwargs):
        """
        Supprime un tenant (admin seulement).
        Par sécurité, archive plutôt que suppression définitive.

        Returns:
            {success: true, message: string}
        """
        # Récupérer les headers CORS
        from ..config import get_cors_headers
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=cors_headers)

        try:
            # Authentification admin requise
            error = self._authenticate_from_header()
            if error:
                return request.make_json_response(error, status=401, headers=cors_headers)

            error = self._require_admin()
            if error:
                return request.make_json_response(error, status=403, headers=cors_headers)

            tenant = request.env['quelyos.tenant'].sudo().browse(tenant_id)

            if not tenant.exists():
                return request.make_json_response({
                    'success': False,
                    'error': 'Tenant non trouvé',
                    'error_code': 'TENANT_NOT_FOUND'
                }, status=404, headers=cors_headers)

            tenant_code = tenant.code

            # Archiver plutôt que supprimer
            tenant.write({'active': False})

            _logger.info(f"Tenant archived: {tenant_code} (ID: {tenant_id})")

            return request.make_json_response({
                'success': True,
                'message': f'Tenant {tenant_code} archivé avec succès'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Error deleting tenant {tenant_id}: {e}")
            return request.make_json_response({
                'success': False,
                'error': 'Erreur lors de la suppression',
                'error_code': 'DELETE_ERROR'
            }, status=500, headers=cors_headers)

    # ═══════════════════════════════════════════════════════════════════════════
    # MÉTHODES PRIVÉES
    # ═══════════════════════════════════════════════════════════════════════════

    def _preflight_response(self):
        """Réponse pour les requêtes OPTIONS (CORS preflight)"""
        from ..config import get_cors_headers
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)
        # Ajouter headers preflight spécifiques si origine autorisée
        if cors_headers:
            cors_headers['Access-Control-Max-Age'] = '86400'
        return request.make_response('', headers=cors_headers or {})

    def _prepare_tenant_values(self, data, update=False):
        """
        Prépare les valeurs pour création/mise à jour d'un tenant.

        Args:
            data: Dictionnaire des données reçues
            update: True si mise à jour (ignore les champs requis)

        Returns:
            Dictionnaire des valeurs pour create/write
        """
        values = {}

        # Champs textuels simples
        text_fields = [
            'name', 'code', 'domain', 'slogan', 'description',
            'primary_color', 'primary_dark', 'primary_light',
            'secondary_color', 'secondary_dark', 'secondary_light',
            'accent_color', 'background_color', 'foreground_color',
            'muted_color', 'muted_foreground', 'border_color', 'ring_color',
            'font_family', 'email', 'phone', 'whatsapp',
            'meta_title', 'meta_description'
        ]

        for field in text_fields:
            if field in data:
                values[field] = data[field]

        # Champs booléens
        bool_fields = [
            'active', 'enable_dark_mode', 'default_dark',
            'feature_wishlist', 'feature_comparison', 'feature_reviews',
            'feature_newsletter', 'feature_guest_checkout'
        ]

        for field in bool_fields:
            if field in data:
                values[field] = bool(data[field])

        # Company ID
        if 'company_id' in data:
            values['company_id'] = int(data['company_id'])
        elif not update:
            # Valeur par défaut pour création
            company = request.env['res.company'].sudo().search([], limit=1)
            if company:
                values['company_id'] = company.id

        # Domaines additionnels (JSON)
        if 'domains' in data:
            if isinstance(data['domains'], list):
                values['domains_json'] = json.dumps(data['domains'])
            elif isinstance(data['domains'], str):
                values['domains_json'] = data['domains']

        # Liens sociaux (JSON ou objet)
        if 'social' in data:
            if isinstance(data['social'], dict):
                values['social_links_json'] = json.dumps(data['social'])
            elif isinstance(data['social'], str):
                values['social_links_json'] = data['social']

        # Logo (base64)
        if 'logo' in data and data['logo']:
            logo_data = data['logo']
            # Si c'est une data URL, extraire le base64
            if logo_data.startswith('data:'):
                logo_data = logo_data.split(',')[1]
            values['logo'] = logo_data
            if 'logo_filename' in data:
                values['logo_filename'] = data['logo_filename']

        # Favicon (base64)
        if 'favicon' in data and data['favicon']:
            favicon_data = data['favicon']
            if favicon_data.startswith('data:'):
                favicon_data = favicon_data.split(',')[1]
            values['favicon'] = favicon_data
            if 'favicon_filename' in data:
                values['favicon_filename'] = data['favicon_filename']

        return values

    # ═══════════════════════════════════════════════════════════════════════════
    # ENDPOINTS PROVISIONING ASYNCHRONE
    # ═══════════════════════════════════════════════════════════════════════════

    @http.route(
        '/api/onboarding/create-tenant-async',
        type='http',
        auth='public',
        methods=['POST', 'OPTIONS'],
        csrf=False,
    )
    def create_tenant_async(self, **kwargs):
        """
        Crée un tenant avec provisioning asynchrone.
        Retourne immédiatement un job_id pour suivre la progression.

        Body JSON: Même format que create_tenant_self_service

        Returns:
            {
                "success": true,
                "job_id": 123,
                "tenant_code": "ma-boutique",
                "status_url": "/api/onboarding/job-status/123"
            }
        """
        from ..config import get_cors_headers
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=cors_headers)

        try:
            data = json.loads(request.httprequest.data.decode('utf-8'))

            # Validation
            required_fields = ['name', 'slug', 'email']
            missing = [f for f in required_fields if not data.get(f)]
            if missing:
                return request.make_json_response({
                    'success': False,
                    'error': f"Champs requis: {', '.join(missing)}",
                }, status=400, headers=cors_headers)

            import re
            slug = re.sub(r'[^a-z0-9-]', '', data.get('slug', '').lower())

            # Vérifier disponibilité
            existing = request.env['quelyos.tenant'].sudo().search([('code', '=', slug)], limit=1)
            if existing:
                return request.make_json_response({
                    'success': False,
                    'error': 'Ce nom de boutique est déjà pris',
                }, status=409, headers=cors_headers)

            # Trouver le plan
            plan = request.env['quelyos.subscription.plan'].sudo().search([
                ('code', '=', data.get('plan', 'starter'))
            ], limit=1)

            # Créer le tenant (sans provisioning lourd)
            domain = f"{slug}.quelyos.shop"
            tenant = request.env['quelyos.tenant'].sudo().create({
                'name': data.get('name'),
                'code': slug,
                'domain': domain,
                'backoffice_domain': f"admin.{slug}.quelyos.shop",
                'plan_id': plan.id if plan else False,
                'admin_email': data.get('email'),
                'primary_color': data.get('primary_color', '#6366f1'),
                'status': 'provisioning',
                'deployment_tier': 'shared',
            })

            # Créer le job de provisioning
            job = request.env['quelyos.provisioning.job'].sudo().create({
                'tenant_id': tenant.id,
            })

            # Démarrer le provisioning en background
            job.action_start()

            return request.make_json_response({
                'success': True,
                'job_id': job.id,
                'tenant_code': tenant.code,
                'status_url': f"/api/onboarding/job-status/{job.id}",
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Error creating tenant async: {e}")
            return request.make_json_response({
                'success': False,
                'error': 'Erreur serveur',
            }, status=500, headers=cors_headers)

    @http.route(
        '/api/onboarding/job-status/<int:job_id>',
        type='http',
        auth='public',
        methods=['GET', 'OPTIONS'],
        csrf=False,
    )
    def get_job_status(self, job_id, **kwargs):
        """
        Retourne le statut d'un job de provisioning.

        Returns:
            {
                "success": true,
                "job": {
                    "state": "running",
                    "progress": 45,
                    "current_step": "Configuration des paiements...",
                    ...
                }
            }
        """
        from ..config import get_cors_headers
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=cors_headers)

        try:
            job = request.env['quelyos.provisioning.job'].sudo().browse(job_id)

            if not job.exists():
                return request.make_json_response({
                    'success': False,
                    'error': 'Job non trouvé',
                }, status=404, headers=cors_headers)

            return request.make_json_response({
                'success': True,
                'job': job.to_dict(),
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Error getting job status: {e}")
            return request.make_json_response({
                'success': False,
                'error': 'Erreur serveur',
            }, status=500, headers=cors_headers)

    # ═══════════════════════════════════════════════════════════════════════════
    # HOMEPAGE BUILDER
    # ═══════════════════════════════════════════════════════════════════════════

    @http.route('/api/admin/homepage-builder', type='json', auth='public', methods=['POST'], csrf=False)
    def get_homepage_sections(self, **kwargs):
        """Récupérer l'ordre et visibilité des sections homepage"""
        try:
            tenant_id = request.env.context.get('tenant_id')
            if not tenant_id:
                return {'success': False, 'error': 'Tenant non trouvé'}

            Tenant = request.env['quelyos.tenant'].sudo()
            tenant = Tenant.browse(tenant_id)

            if not tenant.exists():
                return {'success': False, 'error': 'Tenant invalide'}

            return {
                'success': True,
                'sections': tenant.x_homepage_sections_order or []
            }
        except Exception as e:
            _logger.error(f"Error getting homepage sections: {e}")
            return {'success': False, 'error': str(e)}

    @http.route('/api/admin/homepage-builder/save', type='json', auth='public', methods=['POST'], csrf=False)
    def save_homepage_sections(self, sections, **kwargs):
        """Sauvegarder l'ordre et visibilité des sections homepage"""
        try:
            tenant_id = request.env.context.get('tenant_id')
            if not tenant_id:
                return {'success': False, 'error': 'Tenant non trouvé'}

            Tenant = request.env['quelyos.tenant'].sudo()
            tenant = Tenant.browse(tenant_id)

            if not tenant.exists():
                return {'success': False, 'error': 'Tenant invalide'}

            # Validation des sections
            if not isinstance(sections, list):
                return {'success': False, 'error': 'Format invalide'}

            for section in sections:
                if not isinstance(section, dict) or 'id' not in section:
                    return {'success': False, 'error': 'Section invalide'}

            tenant.write({'x_homepage_sections_order': sections})

            return {
                'success': True,
                'message': 'Configuration sauvegardée',
                'sections': sections
            }
        except Exception as e:
            _logger.error(f"Error saving homepage sections: {e}")
            return {'success': False, 'error': str(e)}
