# -*- coding: utf-8 -*-
"""
Controller Super Admin
Endpoints dédiés à l'administration de la plateforme SaaS.
Accès restreint aux utilisateurs du groupe base.group_system.
"""

from odoo import http
from odoo.http import request
from odoo.exceptions import AccessDenied
from datetime import datetime, timedelta
import logging
import json
import csv
import io

from ..config import get_cors_headers

_logger = logging.getLogger(__name__)



class SuperAdminController(http.Controller):
    """Contrôleur de base super-admin avec helpers d'authentification"""

    def _check_super_admin(self):
        """Vérifie que l'utilisateur est super admin (base.group_system)"""
        user = request.env.user
        endpoint = request.httprequest.path
        ip_address = request.httprequest.remote_addr

        if not user.has_group('base.group_system'):
            _logger.warning(
                f"[AUDIT] Super admin access DENIED - User: {user.login} (ID: {user.id}) | "
                f"IP: {ip_address} | Endpoint: {endpoint}"
            )
            raise AccessDenied("Super admin access required")

        # Log audit de l'accès super admin
        _logger.info(
            f"[AUDIT] Super admin access granted - User: {user.login} (ID: {user.id}) | "
            f"IP: {ip_address} | Endpoint: {endpoint}"
        )

        # Rate limiting automatique
        self._check_rate_limit()

    def _check_rate_limit(self, max_requests=100, window_seconds=60):
        """
        Vérifie le rate limiting via table PostgreSQL
        Par défaut: 100 requêtes par minute par utilisateur
        """
        user = request.env.user
        endpoint = request.httprequest.path
        now = datetime.now()
        window_start = now - timedelta(seconds=window_seconds)

        # Nettoyer anciennes entrées (> window)
        request.env.cr.execute("""
            DELETE FROM ir_logging
            WHERE name = 'rate_limit.superadmin'
            AND create_date < %s
        """, (window_start,))

        # Compter requêtes dans la fenêtre
        request.env.cr.execute("""
            SELECT COUNT(*)
            FROM ir_logging
            WHERE name = 'rate_limit.superadmin'
            AND message LIKE %s
            AND create_date >= %s
        """, (f"{user.id}:{endpoint}%", window_start))

        count = request.env.cr.fetchone()[0]

        if count >= max_requests:
            _logger.warning(
                f"[RATE LIMIT] User {user.login} (ID: {user.id}) exceeded rate limit "
                f"on {endpoint}: {count}/{max_requests} requests"
            )
            raise AccessDenied(f"Rate limit exceeded. Max {max_requests} requests per {window_seconds}s.")

        # Enregistrer cette requête
        request.env.cr.execute("""
            INSERT INTO ir_logging (create_date, create_uid, name, type, dbname, level, message, path, line, func)
            VALUES (NOW(), %s, 'rate_limit.superadmin', 'server', current_database(), 'INFO', %s, '', '', '')
        """, (user.id, f"{user.id}:{endpoint}"))

    @http.route('/api/super-admin/security-groups', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_security_groups(self):
        """Liste les groupes de sécurité disponibles pour les plans"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            Groups = request.env['res.groups'].sudo()
            # Récupérer tous les groupes triés par nom
            groups = Groups.search([], order='name')

            # Exclure certains groupes système trop techniques
            excluded_names = ['Portal', 'Public', 'Anonymous']

            result_groups = []
            for g in groups:
                full_name = g.full_name or g.name
                # Ignorer les groupes Portal/Public/Anonymous
                if any(excl in full_name for excl in excluded_names):
                    continue
                # Extraire la catégorie depuis full_name (format: "Module / Group")
                category = 'Général'
                if ' / ' in full_name:
                    category = full_name.split(' / ')[0]
                result_groups.append({
                    'id': g.id,
                    'name': g.name,
                    'full_name': full_name,
                    'category': category,
                })

            data = {
                'success': True,
                'data': result_groups,
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List security groups error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )
