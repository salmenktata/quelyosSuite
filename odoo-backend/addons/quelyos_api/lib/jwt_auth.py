# -*- coding: utf-8 -*-
"""
JWT Authentication Module
Génère et valide des JWT access tokens pour l'API Quelyos.
"""
import jwt
import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

_logger = logging.getLogger(__name__)

# Configuration JWT
JWT_SECRET = os.environ.get('JWT_SECRET', 'quelyos-dev-secret-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_ISSUER = 'quelyos-api'

# Durées de validité
ACCESS_TOKEN_EXPIRY_MINUTES = 15  # 15 minutes
REFRESH_TOKEN_EXPIRY_DAYS = 7    # 7 jours
PENDING_2FA_TOKEN_EXPIRY_MINUTES = 5  # 5 minutes pour compléter le 2FA


class JWTError(Exception):
    """Erreur JWT personnalisée"""
    pass


class TokenExpiredError(JWTError):
    """Token expiré"""
    pass


class InvalidTokenError(JWTError):
    """Token invalide"""
    pass


def generate_access_token(
    user_id: int,
    user_login: str,
    tenant_id: Optional[int] = None,
    tenant_domain: Optional[str] = None,
    extra_claims: Optional[Dict[str, Any]] = None
) -> str:
    """
    Génère un JWT access token.

    Args:
        user_id: ID de l'utilisateur Odoo
        user_login: Login de l'utilisateur
        tenant_id: ID du tenant (si multi-tenant)
        tenant_domain: Domaine du tenant
        extra_claims: Claims supplémentaires

    Returns:
        str: JWT encodé
    """
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=ACCESS_TOKEN_EXPIRY_MINUTES)

    payload = {
        # Standard claims
        'iss': JWT_ISSUER,
        'sub': str(user_id),
        'iat': int(now.timestamp()),
        'exp': int(expires_at.timestamp()),
        'nbf': int(now.timestamp()),

        # Custom claims
        'uid': user_id,
        'login': user_login,
        'type': 'access',
    }

    # Claims multi-tenant
    if tenant_id:
        payload['tenant_id'] = tenant_id
    if tenant_domain:
        payload['tenant_domain'] = tenant_domain

    # Claims supplémentaires
    if extra_claims:
        payload.update(extra_claims)

    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    _logger.debug(f"Access token generated for user {user_id}, expires at {expires_at}")
    return token


def generate_refresh_token(
    user_id: int,
    token_id: int,
    extra_claims: Optional[Dict[str, Any]] = None
) -> str:
    """
    Génère un JWT refresh token.

    Args:
        user_id: ID de l'utilisateur
        token_id: ID du record auth.refresh.token en DB (pour tracking)
        extra_claims: Claims supplémentaires

    Returns:
        str: JWT refresh token encodé
    """
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=REFRESH_TOKEN_EXPIRY_DAYS)

    payload = {
        'iss': JWT_ISSUER,
        'sub': str(user_id),
        'iat': int(now.timestamp()),
        'exp': int(expires_at.timestamp()),
        'nbf': int(now.timestamp()),

        'uid': user_id,
        'jti': str(token_id),  # JWT ID = ID du token en DB
        'type': 'refresh',
    }

    if extra_claims:
        payload.update(extra_claims)

    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    _logger.debug(f"Refresh token generated for user {user_id}, jti={token_id}")
    return token


def decode_token(token: str, verify_exp: bool = True) -> Dict[str, Any]:
    """
    Décode et valide un JWT token.

    Args:
        token: JWT encodé
        verify_exp: Vérifier l'expiration

    Returns:
        dict: Payload décodé

    Raises:
        TokenExpiredError: Si le token est expiré
        InvalidTokenError: Si le token est invalide
    """
    try:
        options = {'verify_exp': verify_exp}
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            options=options,
            issuer=JWT_ISSUER
        )
        return payload

    except jwt.ExpiredSignatureError:
        _logger.warning("Token expired")
        raise TokenExpiredError("Token expiré")

    except jwt.InvalidIssuerError:
        _logger.warning("Invalid token issuer")
        raise InvalidTokenError("Token invalide (issuer)")

    except jwt.InvalidTokenError as e:
        _logger.warning(f"Invalid token: {e}")
        raise InvalidTokenError(f"Token invalide: {str(e)}")


def validate_access_token(token: str) -> Dict[str, Any]:
    """
    Valide un access token et retourne les claims.

    Args:
        token: JWT access token

    Returns:
        dict: Claims du token (uid, login, tenant_id, etc.)

    Raises:
        TokenExpiredError: Si expiré
        InvalidTokenError: Si invalide ou pas un access token
    """
    payload = decode_token(token)

    if payload.get('type') != 'access':
        raise InvalidTokenError("Token n'est pas un access token")

    return payload


def validate_refresh_token(token: str) -> Dict[str, Any]:
    """
    Valide un refresh token et retourne les claims.

    Args:
        token: JWT refresh token

    Returns:
        dict: Claims du token (uid, jti, etc.)

    Raises:
        TokenExpiredError: Si expiré
        InvalidTokenError: Si invalide ou pas un refresh token
    """
    payload = decode_token(token)

    if payload.get('type') != 'refresh':
        raise InvalidTokenError("Token n'est pas un refresh token")

    return payload


def extract_bearer_token(authorization_header: Optional[str]) -> Optional[str]:
    """
    Extrait le token depuis le header Authorization.

    Args:
        authorization_header: Valeur du header "Authorization"

    Returns:
        str ou None: Token extrait ou None si absent/invalide
    """
    if not authorization_header:
        return None

    parts = authorization_header.split()

    if len(parts) != 2:
        return None

    scheme, token = parts

    if scheme.lower() != 'bearer':
        return None

    return token


def get_token_remaining_time(token: str) -> int:
    """
    Retourne le temps restant avant expiration (en secondes).

    Args:
        token: JWT token

    Returns:
        int: Secondes restantes (0 si expiré)
    """
    try:
        payload = decode_token(token, verify_exp=False)
        exp = payload.get('exp', 0)
        now = datetime.now(timezone.utc).timestamp()
        remaining = int(exp - now)
        return max(0, remaining)
    except JWTError:
        return 0


# =============================================================================
# MIDDLEWARE HELPERS
# =============================================================================

def get_jwt_from_request(http_request) -> Optional[str]:
    """
    Extrait le JWT depuis la requête HTTP.
    Priorité: Header Authorization > Cookie access_token

    Args:
        http_request: Objet request HTTP (werkzeug)

    Returns:
        str ou None: Token JWT ou None
    """
    # 1. Essayer header Authorization
    auth_header = http_request.headers.get('Authorization')
    token = extract_bearer_token(auth_header)
    if token:
        return token

    # 2. Fallback sur cookie
    token = http_request.cookies.get('access_token')
    if token:
        return token

    return None


def validate_jwt_request(http_request) -> Optional[Dict[str, Any]]:
    """
    Valide le JWT depuis une requête HTTP.

    Args:
        http_request: Objet request HTTP

    Returns:
        dict: Claims du JWT ou None si invalide
    """
    token = get_jwt_from_request(http_request)
    if not token:
        return None

    try:
        return validate_access_token(token)
    except (TokenExpiredError, InvalidTokenError):
        return None


def require_jwt_auth(func):
    """
    Décorateur pour protéger un endpoint avec JWT Bearer.

    Usage:
        @http.route('/api/protected', type='http', auth='none')
        @require_jwt_auth
        def my_endpoint(self, **kwargs):
            # self.jwt_claims contient les claims du token
            user_id = self.jwt_claims['uid']
            ...

    Returns:
        401 si pas de token ou token invalide
        403 si token expiré
    """
    from functools import wraps
    from odoo.http import request

    @wraps(func)
    def wrapper(self, *args, **kwargs):
        token = get_jwt_from_request(request.httprequest)

        if not token:
            return request.make_json_response(
                {'success': False, 'error': 'Authorization required'},
                status=401
            )

        try:
            claims = validate_access_token(token)
            # Stocker les claims dans self pour accès dans la méthode
            self.jwt_claims = claims
            return func(self, *args, **kwargs)

        except TokenExpiredError:
            return request.make_json_response(
                {'success': False, 'error': 'Token expired', 'code': 'TOKEN_EXPIRED'},
                status=401
            )

        except InvalidTokenError as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                status=401
            )

    return wrapper


def optional_jwt_auth(func):
    """
    Décorateur pour optionnellement extraire les claims JWT.
    Ne bloque pas si pas de token, mais ajoute self.jwt_claims si présent.

    Usage:
        @http.route('/api/public', type='http', auth='none')
        @optional_jwt_auth
        def my_endpoint(self, **kwargs):
            if self.jwt_claims:
                # Utilisateur authentifié
                user_id = self.jwt_claims['uid']
            else:
                # Accès anonyme
                ...
    """
    from functools import wraps
    from odoo.http import request

    @wraps(func)
    def wrapper(self, *args, **kwargs):
        token = get_jwt_from_request(request.httprequest)

        if token:
            try:
                self.jwt_claims = validate_access_token(token)
            except (TokenExpiredError, InvalidTokenError):
                self.jwt_claims = None
        else:
            self.jwt_claims = None

        return func(self, *args, **kwargs)

    return wrapper


# =============================================================================
# 2FA PENDING TOKEN
# =============================================================================

def generate_pending_2fa_token(
    user_id: int,
    user_login: str,
    tenant_id: Optional[int] = None,
    tenant_domain: Optional[str] = None,
) -> str:
    """
    Génère un token temporaire pour le flux 2FA.
    Ce token est émis après validation du mot de passe mais avant la vérification TOTP.

    Args:
        user_id: ID de l'utilisateur
        user_login: Login de l'utilisateur
        tenant_id: ID du tenant (optionnel)
        tenant_domain: Domaine du tenant (optionnel)

    Returns:
        str: JWT pending token (5 min de validité)
    """
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=PENDING_2FA_TOKEN_EXPIRY_MINUTES)

    payload = {
        'iss': JWT_ISSUER,
        'sub': str(user_id),
        'iat': int(now.timestamp()),
        'exp': int(expires_at.timestamp()),
        'nbf': int(now.timestamp()),

        'uid': user_id,
        'login': user_login,
        'type': 'pending_2fa',  # Type spécial
    }

    if tenant_id:
        payload['tenant_id'] = tenant_id
    if tenant_domain:
        payload['tenant_domain'] = tenant_domain

    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    _logger.debug(f"Pending 2FA token generated for user {user_id}")
    return token


def validate_pending_2fa_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Valide un token pending 2FA.

    Args:
        token: JWT pending 2FA token

    Returns:
        dict: Claims du token ou None si invalide
    """
    try:
        payload = decode_token(token)

        if payload.get('type') != 'pending_2fa':
            _logger.warning("Token is not a pending 2FA token")
            return None

        return payload

    except (TokenExpiredError, InvalidTokenError) as e:
        _logger.warning(f"Pending 2FA token validation failed: {e}")
        return None
