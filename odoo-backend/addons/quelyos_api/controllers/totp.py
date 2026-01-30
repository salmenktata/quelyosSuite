# -*- coding: utf-8 -*-
"""
Controller 2FA/TOTP pour Quelyos API.

Endpoints pour gérer l'authentification à deux facteurs.
"""

import logging
from odoo import http
from odoo.http import request
from odoo.exceptions import ValidationError, AccessDenied
from ..config import get_cors_headers
from ..lib.rate_limiter import check_rate_limit, RateLimitConfig
from ..lib.jwt_auth import require_jwt_auth

_logger = logging.getLogger(__name__)


class TOTPController(http.Controller):
    """Endpoints pour la gestion du 2FA/TOTP"""

    @http.route('/api/auth/2fa/setup', type='http', auth='none', methods=['POST', 'OPTIONS'], csrf=False)
    @require_jwt_auth
    def setup_2fa(self, **kwargs):
        """
        Initialise le 2FA pour l'utilisateur connecté.
        Génère un secret et QR code, mais n'active pas encore le 2FA.

        Returns:
            JSON: {success, secret, qr_code, backup_codes}
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        try:
            user_id = self.jwt_claims.get('uid')

            # Vérifier si déjà activé
            UserTOTP = request.env['quelyos.user.totp']
            if UserTOTP.is_totp_enabled(user_id):
                return request.make_json_response({
                    'success': False,
                    'error': 'Le 2FA est déjà activé pour ce compte'
                }, headers=cors_headers, status=400)

            # Générer le setup
            setup_data = UserTOTP.setup_totp(user_id)

            return request.make_json_response({
                'success': True,
                'secret': setup_data['secret'],
                'qr_code': setup_data['qr_code'],
                'provisioning_uri': setup_data['provisioning_uri'],
                'backup_codes': setup_data['backup_codes'],
            }, headers=cors_headers)

        except ValidationError as e:
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=400)

        except Exception as e:
            _logger.error(f"2FA setup error: {e}", exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': 'Erreur lors de la configuration du 2FA'
            }, headers=cors_headers, status=500)

    @http.route('/api/auth/2fa/confirm', type='http', auth='none', methods=['POST', 'OPTIONS'], csrf=False)
    @require_jwt_auth
    def confirm_2fa(self, **kwargs):
        """
        Confirme et active le 2FA en vérifiant le premier code.

        Body JSON:
            {code: string} - Code TOTP de l'app authenticator

        Returns:
            JSON: {success: bool}
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        # Rate limiting
        rate_error = check_rate_limit(request, RateLimitConfig.LOGIN, '2fa_confirm')
        if rate_error:
            return request.make_json_response(rate_error, headers=cors_headers, status=429)

        try:
            body = request.get_json_data() or {}
            code = body.get('code', '').strip()

            if not code:
                return request.make_json_response({
                    'success': False,
                    'error': 'Code requis'
                }, headers=cors_headers, status=400)

            user_id = self.jwt_claims.get('uid')

            UserTOTP = request.env['quelyos.user.totp']
            UserTOTP.confirm_totp(user_id, code)

            _logger.info(f"2FA enabled for user {user_id}")

            return request.make_json_response({
                'success': True,
                'message': '2FA activé avec succès'
            }, headers=cors_headers)

        except ValidationError as e:
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=400)

        except Exception as e:
            _logger.error(f"2FA confirm error: {e}", exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': 'Erreur lors de la confirmation du 2FA'
            }, headers=cors_headers, status=500)

    @http.route('/api/auth/2fa/verify', type='http', auth='none', methods=['POST', 'OPTIONS'], csrf=False)
    def verify_2fa(self, **kwargs):
        """
        Vérifie un code 2FA pendant le processus de login.
        Appelé après validation des credentials, avant émission du JWT final.

        Body JSON:
            {
                pending_token: string,  # Token temporaire du login initial
                code: string            # Code TOTP ou backup code
            }

        Returns:
            JSON: {success, access_token, user} ou {success: false, error}
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        # Rate limiting strict pour 2FA
        rate_error = check_rate_limit(request, RateLimitConfig.LOGIN, '2fa_verify')
        if rate_error:
            return request.make_json_response(rate_error, headers=cors_headers, status=429)

        try:
            body = request.get_json_data() or {}
            pending_token = body.get('pending_token', '')
            code = body.get('code', '').strip()

            if not pending_token or not code:
                return request.make_json_response({
                    'success': False,
                    'error': 'Token et code requis'
                }, headers=cors_headers, status=400)

            # Valider le pending token et extraire user_id
            from ..lib.jwt_auth import validate_pending_2fa_token, generate_access_token
            claims = validate_pending_2fa_token(pending_token)

            if not claims:
                return request.make_json_response({
                    'success': False,
                    'error': 'Token expiré ou invalide, veuillez vous reconnecter'
                }, headers=cors_headers, status=401)

            user_id = claims.get('uid')

            # Vérifier le code TOTP
            UserTOTP = request.env['quelyos.user.totp']
            try:
                UserTOTP.verify_totp(user_id, code)
            except AccessDenied as e:
                return request.make_json_response({
                    'success': False,
                    'error': str(e)
                }, headers=cors_headers, status=401)

            # Générer le vrai access token
            user = request.env['res.users'].sudo().browse(user_id)

            tenant_id = None
            tenant_domain = None
            if hasattr(user, 'tenant_id') and user.tenant_id:
                tenant_id = user.tenant_id.id
                tenant_domain = user.tenant_id.domain

            access_token = generate_access_token(
                user_id=user_id,
                user_login=user.login,
                tenant_id=tenant_id,
                tenant_domain=tenant_domain,
            )

            _logger.info(f"2FA verified for user {user_id}")

            return request.make_json_response({
                'success': True,
                'access_token': access_token,
                'token_type': 'Bearer',
                'user': {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email or '',
                    'login': user.login,
                    'tenant_id': tenant_id,
                }
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"2FA verify error: {e}", exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': 'Erreur lors de la vérification du 2FA'
            }, headers=cors_headers, status=500)

    @http.route('/api/auth/2fa/disable', type='http', auth='none', methods=['POST', 'OPTIONS'], csrf=False)
    @require_jwt_auth
    def disable_2fa(self, **kwargs):
        """
        Désactive le 2FA pour l'utilisateur connecté.

        Body JSON:
            {code: string} - Code TOTP pour confirmer

        Returns:
            JSON: {success: bool}
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        try:
            body = request.get_json_data() or {}
            code = body.get('code', '').strip()

            if not code:
                return request.make_json_response({
                    'success': False,
                    'error': 'Code requis pour désactiver le 2FA'
                }, headers=cors_headers, status=400)

            user_id = self.jwt_claims.get('uid')

            UserTOTP = request.env['quelyos.user.totp']
            UserTOTP.disable_totp(user_id, code)

            _logger.info(f"2FA disabled for user {user_id}")

            return request.make_json_response({
                'success': True,
                'message': '2FA désactivé avec succès'
            }, headers=cors_headers)

        except AccessDenied as e:
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=401)

        except Exception as e:
            _logger.error(f"2FA disable error: {e}", exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': 'Erreur lors de la désactivation du 2FA'
            }, headers=cors_headers, status=500)

    @http.route('/api/auth/2fa/status', type='http', auth='none', methods=['GET', 'OPTIONS'], csrf=False)
    @require_jwt_auth
    def get_2fa_status(self, **kwargs):
        """
        Retourne le statut 2FA de l'utilisateur connecté.

        Returns:
            JSON: {success, enabled, backup_codes_remaining}
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        try:
            user_id = self.jwt_claims.get('uid')

            UserTOTP = request.env['quelyos.user.totp']
            totp_config = UserTOTP.sudo().search([
                ('user_id', '=', user_id),
                ('is_enabled', '=', True)
            ], limit=1)

            if totp_config:
                import json
                backup_hashes = json.loads(totp_config.backup_codes_hash or '[]')
                return request.make_json_response({
                    'success': True,
                    'enabled': True,
                    'enabled_at': totp_config.enabled_at.isoformat() if totp_config.enabled_at else None,
                    'backup_codes_remaining': len(backup_hashes),
                }, headers=cors_headers)
            else:
                return request.make_json_response({
                    'success': True,
                    'enabled': False,
                    'backup_codes_remaining': 0,
                }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"2FA status error: {e}", exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': 'Erreur lors de la récupération du statut 2FA'
            }, headers=cors_headers, status=500)

    @http.route('/api/auth/2fa/backup-codes/regenerate', type='http', auth='none', methods=['POST', 'OPTIONS'], csrf=False)
    @require_jwt_auth
    def regenerate_backup_codes(self, **kwargs):
        """
        Régénère les codes de backup (invalide les anciens).

        Body JSON:
            {code: string} - Code TOTP pour confirmer

        Returns:
            JSON: {success, backup_codes: [...]}
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        try:
            body = request.get_json_data() or {}
            code = body.get('code', '').strip()

            if not code:
                return request.make_json_response({
                    'success': False,
                    'error': 'Code requis'
                }, headers=cors_headers, status=400)

            user_id = self.jwt_claims.get('uid')

            UserTOTP = request.env['quelyos.user.totp']
            new_codes = UserTOTP.regenerate_backup_codes(user_id, code)

            return request.make_json_response({
                'success': True,
                'backup_codes': new_codes,
            }, headers=cors_headers)

        except AccessDenied as e:
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=401)

        except ValidationError as e:
            return request.make_json_response({
                'success': False,
                'error': str(e)
            }, headers=cors_headers, status=400)

        except Exception as e:
            _logger.error(f"Backup codes regenerate error: {e}", exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': 'Erreur lors de la régénération des codes'
            }, headers=cors_headers, status=500)
