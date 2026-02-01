# -*- coding: utf-8 -*-
"""
Contrôleur pour les paramètres utilisateur (sécurité, sessions, préférences)
Endpoints: /api/ecommerce/user/*
"""
import logging
from datetime import datetime
from odoo import http
from odoo.http import request
from ..config import get_cors_headers
from .base import BaseController

_logger = logging.getLogger(__name__)


class UserSettingsController(BaseController):
    """API pour les paramètres et préférences utilisateur"""

    @http.route('/api/ecommerce/user/security/status', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_security_status(self):
        """
        Retourne le statut de sécurité de l'utilisateur (2FA, etc.)

        Returns:
            {
                "success": true,
                "data": {
                    "twoFAEnabled": false,
                    "hasPassword": true,
                    "lastPasswordChange": "2024-01-15T10:30:00Z"
                }
            }
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        # Vérifier authentification
        if not request.session.uid:
            return request.make_json_response(
                {
                    'success': False,
                    'error': 'Authentication required',
                    'error_code': 'AUTH_REQUIRED'
                },
                headers=cors_headers,
                status=401
            )

        try:
            user = request.env.user

            # Vérifier si 2FA est activé (via module totp si disponible)
            totp_enabled = False
            if hasattr(user, 'totp_enabled'):
                totp_enabled = user.totp_enabled or False

            # Date du dernier changement de mot de passe (si disponible)
            last_password_change = None
            if hasattr(user, 'password_write_date'):
                last_password_change = user.password_write_date.isoformat() if user.password_write_date else None

            data = {
                'success': True,
                'data': {
                    'twoFAEnabled': totp_enabled,
                    'hasPassword': bool(user.password),
                    'lastPasswordChange': last_password_change,
                    'userId': user.id,
                    'email': user.email or user.login,
                }
            }

            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Error fetching security status: {e}", exc_info=True)
            return request.make_json_response(
                {
                    'success': False,
                    'error': 'Server error',
                    'error_code': 'SERVER_ERROR'
                },
                headers=cors_headers,
                status=500
            )

    @http.route('/api/ecommerce/user/sessions', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_user_sessions(self):
        """
        Retourne la liste des sessions actives de l'utilisateur

        Returns:
            {
                "success": true,
                "data": [
                    {
                        "id": 1,
                        "ipAddress": "192.168.1.1",
                        "userAgent": "Mozilla/5.0...",
                        "createdAt": "2024-01-15T10:30:00Z",
                        "isCurrent": true
                    }
                ]
            }
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        # Vérifier authentification
        if not request.session.uid:
            return request.make_json_response(
                {
                    'success': False,
                    'error': 'Authentication required',
                    'error_code': 'AUTH_REQUIRED'
                },
                headers=cors_headers,
                status=401
            )

        try:
            # Récupérer les sessions HTTP actives (simplifié)
            # Note: Backend ne stocke pas les sessions HTTP de manière facilement accessible
            # On retourne la session courante pour l'instant
            current_session_id = request.session.sid

            sessions = [
                {
                    'id': 1,
                    'ipAddress': request.httprequest.remote_addr or 'Unknown',
                    'userAgent': request.httprequest.headers.get('User-Agent', 'Unknown'),
                    'createdAt': datetime.now().isoformat(),
                    'isCurrent': True,
                }
            ]

            data = {
                'success': True,
                'data': sessions
            }

            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Error fetching user sessions: {e}", exc_info=True)
            return request.make_json_response(
                {
                    'success': False,
                    'error': 'Server error',
                    'error_code': 'SERVER_ERROR'
                },
                headers=cors_headers,
                status=500
            )

    @http.route('/api/ecommerce/user/change-password', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def change_password(self):
        """
        Permet à l'utilisateur de changer son mot de passe

        Body:
            {
                "currentPassword": "...",
                "newPassword": "..."
            }
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        # Vérifier authentification
        if not request.session.uid:
            return request.make_json_response(
                {
                    'success': False,
                    'error': 'Authentication required',
                    'error_code': 'AUTH_REQUIRED'
                },
                headers=cors_headers,
                status=401
            )

        try:
            params = self._get_json_params()
            current_password = params.get('currentPassword')
            new_password = params.get('newPassword')

            if not current_password or not new_password:
                return request.make_json_response(
                    {
                        'success': False,
                        'error': 'Current password and new password are required',
                        'error_code': 'MISSING_PARAMS'
                    },
                    headers=cors_headers,
                    status=400
                )

            # Vérifier longueur minimale du nouveau mot de passe
            if len(new_password) < 8:
                return request.make_json_response(
                    {
                        'success': False,
                        'error': 'New password must be at least 8 characters',
                        'error_code': 'PASSWORD_TOO_SHORT'
                    },
                    headers=cors_headers,
                    status=400
                )

            user = request.env.user

            # Vérifier le mot de passe actuel
            try:
                user.sudo()._check_credentials(current_password, request.env)
            except Exception:
                return request.make_json_response(
                    {
                        'success': False,
                        'error': 'Current password is incorrect',
                        'error_code': 'INVALID_PASSWORD'
                    },
                    headers=cors_headers,
                    status=403
                )

            # Changer le mot de passe
            user.sudo().write({'password': new_password})

            return request.make_json_response(
                {
                    'success': True,
                    'message': 'Password changed successfully'
                },
                headers=cors_headers
            )

        except Exception as e:
            _logger.error(f"Error changing password: {e}", exc_info=True)
            return request.make_json_response(
                {
                    'success': False,
                    'error': 'Server error',
                    'error_code': 'SERVER_ERROR'
                },
                headers=cors_headers,
                status=500
            )

    @http.route('/api/ecommerce/user/preferences', type='http', auth='public', methods=['GET', 'PUT', 'OPTIONS'], csrf=False)
    def manage_preferences(self):
        """
        GET: Récupère les préférences utilisateur
        PUT: Met à jour les préférences utilisateur

        Returns/Body:
            {
                "success": true,
                "data": {
                    "language": "fr_FR",
                    "timezone": "Europe/Paris",
                    "notifications": {
                        "email": true,
                        "push": false
                    }
                }
            }
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        # Vérifier authentification
        if not request.session.uid:
            return request.make_json_response(
                {
                    'success': False,
                    'error': 'Authentication required',
                    'error_code': 'AUTH_REQUIRED'
                },
                headers=cors_headers,
                status=401
            )

        try:
            user = request.env.user

            if request.httprequest.method == 'GET':
                # Récupérer les préférences
                preferences = {
                    'language': user.lang or 'fr_FR',
                    'timezone': user.tz or 'Europe/Paris',
                    'notifications': {
                        'email': getattr(user, 'notification_email', True),
                        'push': False  # À implémenter
                    }
                }

                return request.make_json_response(
                    {
                        'success': True,
                        'data': preferences
                    },
                    headers=cors_headers
                )

            elif request.httprequest.method == 'PUT':
                # Mettre à jour les préférences
                params = self._get_json_params()

                updates = {}
                if 'language' in params:
                    updates['lang'] = params['language']
                if 'timezone' in params:
                    updates['tz'] = params['timezone']

                if updates:
                    user.sudo().write(updates)

                return request.make_json_response(
                    {
                        'success': True,
                        'message': 'Preferences updated successfully'
                    },
                    headers=cors_headers
                )

        except Exception as e:
            _logger.error(f"Error managing preferences: {e}", exc_info=True)
            return request.make_json_response(
                {
                    'success': False,
                    'error': 'Server error',
                    'error_code': 'SERVER_ERROR'
                },
                headers=cors_headers,
                status=500
            )
