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
        """
        Vérifie que l'utilisateur est super admin (base.group_system).
        Supporte JWT Bearer token ou session Odoo classique.

        Returns:
            int: User ID si authentifié

        Raises:
            AccessDenied: Si l'utilisateur n'a pas les droits
        """
        from ..lib.jwt_auth import validate_access_token, extract_bearer_token, InvalidTokenError, TokenExpiredError

        endpoint = request.httprequest.path
        ip_address = request.httprequest.remote_addr

        # 1. Essayer JWT Bearer token d'abord
        auth_header = request.httprequest.headers.get('Authorization')
        token = extract_bearer_token(auth_header)

        user_id = None
        auth_method = None

        if token:
            try:
                # Valider le token JWT
                payload = validate_access_token(token)
                user_id = payload.get('uid')

                if not user_id:
                    raise AccessDenied("Token invalide: uid manquant")

                auth_method = 'JWT'

            except (TokenExpiredError, InvalidTokenError) as e:
                _logger.warning(f"[AUDIT] JWT validation failed: {e}")
                raise AccessDenied(f"Token invalide: {e}")

        # 2. Fallback: session Odoo classique
        elif request.session.uid:
            user_id = request.session.uid
            auth_method = 'Session'

        # 3. Aucune authentification
        else:
            _logger.warning(f"[AUDIT] No authentication - IP: {ip_address} | Endpoint: {endpoint}")
            raise AccessDenied("Authentification requise (JWT Bearer ou Session)")

        # Vérifier que l'utilisateur a les droits super admin
        user = request.env['res.users'].sudo().browse(user_id)
        if not user.exists():
            raise AccessDenied("Utilisateur introuvable")

        if not user.has_group('base.group_system'):
            _logger.warning(
                f"[AUDIT] Super admin access DENIED - User: {user.login} (ID: {user.id}) | "
                f"IP: {ip_address} | Endpoint: {endpoint} | Auth: {auth_method}"
            )
            raise AccessDenied("Super admin access required")

        # Log audit de l'accès super admin
        _logger.info(
            f"[AUDIT] Super admin access granted - User: {user.login} (ID: {user.id}) | "
            f"IP: {ip_address} | Endpoint: {endpoint} | Auth: {auth_method}"
        )

        # Rate limiting automatique
        self._check_rate_limit()

        return user_id

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
