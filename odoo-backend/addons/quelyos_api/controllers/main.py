# -*- coding: utf-8 -*-
import logging
import time
import os
import math
from datetime import datetime, timedelta
from odoo import http, fields
from odoo.http import request
from passlib.context import CryptContext
from ..config import is_origin_allowed, get_cors_headers
from ..lib.cache import get_cache_service, CacheTTL
from ..lib.rate_limiter import check_rate_limit, RateLimitConfig
from ..lib.validation import sanitize_string, sanitize_dict, validate_no_injection
from ..lib.password_policy import (
    validate_password_strength,
    get_password_strength_score,
    is_account_locked,
    record_failed_login,
    reset_failed_attempts,
)
from .base import BaseController

_logger = logging.getLogger(__name__)

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    _logger.warning("Redis package not installed. Rate limiting will use in-memory cache (not production-ready for multi-worker setups)")

# Context de cryptage pour vérifier les mots de passe
crypt_context = CryptContext(schemes=['pbkdf2_sha512', 'plaintext'], deprecated=['plaintext'])

# Redis client pour cache distribué (rate limiting, etc.)
_redis_client = None
if REDIS_AVAILABLE:
    try:
        redis_host = os.environ.get('REDIS_HOST', 'localhost')
        redis_port = int(os.environ.get('REDIS_PORT', 6379))
        _redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            db=0,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2
        )
        # Tester la connexion
        _redis_client.ping()
        _logger.info(f"Redis connected successfully at {redis_host}:{redis_port}")
    except Exception as e:
        _logger.warning(f"Could not connect to Redis: {e}. Falling back to in-memory cache.")
        _redis_client = None

# Fallback: Cache en mémoire pour rate limiting (si Redis non disponible)
# ATTENTION: Ne fonctionne pas correctement avec plusieurs workers Odoo
_view_count_cache = {}



class QuelyosAPI(BaseController):
    """API REST - Routeur principal, auth et configuration"""

    def _get_params(self):
        """Extrait les paramètres de la requête JSON-RPC"""
        return request.params if hasattr(request, 'params') and request.params else {}

    def _get_http_params(self):
        """Extrait les paramètres HTTP (GET query params ou POST JSON)"""
        if request.httprequest.method == 'GET':
            # Convertir ImmutableMultiDict en dict normal
            return request.httprequest.args.to_dict()
        else:  # POST avec body JSON
            try:
                data = request.get_json_data()
                if isinstance(data, dict):
                    # Si c'est un wrapper JSON-RPC (envoyé par le proxy Next.js), extraire params
                    if 'jsonrpc' in data and 'params' in data:
                        return data['params'] if isinstance(data['params'], dict) else {}
                    # Sinon retourner les données directement
                    return data
                return {}
            except:
                return {}

    def _check_session(self):
        """Vérifie que la session est valide"""
        if not request.session.uid:
            _logger.warning("Session expired or invalid")
            return {
                'success': False,
                'error': 'Session expired. Please login again.',
                'error_code': 'SESSION_EXPIRED'
            }
        return None

    def _check_cors(self):
        """
        Vérifie que l'origine de la requête est autorisée (protection CORS).
        Retourne un dict d'erreur si l'origine n'est pas autorisée, None sinon.

        Usage dans les endpoints :
            error = self._check_cors()
            if error:
                return error

        NOTE: Cette méthode devrait idéalement être appelée automatiquement
        via un décorateur ou middleware, mais pour compatibilité avec Odoo
        on l'appelle manuellement dans les endpoints sensibles.
        """
        origin = request.httprequest.headers.get('Origin', '')

        if not is_origin_allowed(origin):
            _logger.warning(
                f"CORS violation: Origin '{origin}' is not allowed. "
                f"Request path: {request.httprequest.path}"
            )
            return {
                'success': False,
                'error': 'Origine non autorisée',
                'error_code': 'CORS_VIOLATION'
            }

        return None

    def _require_admin(self):
        """
        Vérifie que l'utilisateur est authentifié ET possède les droits administrateur.
        Retourne un dict d'erreur si non autorisé, None sinon.

        Usage dans les endpoints :
            error = self._require_admin()
            if error:
                return error
        """
        # Vérifier que l'utilisateur est connecté
        if not request.env.user or request.env.user._is_public():
            _logger.warning(f"Unauthorized admin action attempt: user not authenticated")
            return {
                'success': False,
                'error': 'Authentification requise',
                'error_code': 'AUTH_REQUIRED'
            }

        # Vérifier que l'utilisateur a les droits admin (groupe system)
        if not request.env.user.has_group('base.group_system'):
            _logger.warning(
                f"Unauthorized admin action attempt: user {request.env.user.id} "
                f"({request.env.user.login}) lacks admin privileges"
            )
            return {
                'success': False,
                'error': 'Accès refusé : droits administrateur requis',
                'error_code': 'ADMIN_REQUIRED'
            }

        return None

    def _create_session(self, uid):
        """Crée une session pour l'utilisateur et retourne le session_id"""
        return request.session.sid

    @http.route('/api/ecommerce/auth/login', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def auth_login(self, **kwargs):
        """Authentification utilisateur avec vérification du mot de passe"""
        # Rate limiting - protection brute force
        rate_error = check_rate_limit(request, RateLimitConfig.LOGIN, 'ecommerce_login')
        if rate_error:
            _logger.warning(f"Rate limit exceeded for ecommerce login from {request.httprequest.remote_addr}")
            return rate_error

        try:
            _logger.info("========== LOGIN REQUEST RECEIVED ==========")
            params = self._get_params()
            email = params.get('email')
            password = params.get('password')

            _logger.info(f"Login attempt - email: {email}, password length: {len(password) if password else 0}")
            _logger.info(f"Request headers: {dict(request.httprequest.headers)}")
            _logger.info(f"Request DB: {request.db}")

            if not email or not password:
                return {
                    'success': False,
                    'error': 'Email and password are required'
                }

            # Vérifier si le compte est bloqué
            is_locked, remaining_seconds = is_account_locked(email)
            if is_locked:
                _logger.warning(f"Account locked for {email}, {remaining_seconds}s remaining")
                return {
                    'success': False,
                    'error': 'Account temporarily locked due to too many failed attempts',
                    'locked_until_seconds': remaining_seconds,
                }

            # Authentifier l'utilisateur avec Odoo (vérifie le mot de passe)
            try:
                db_name = request.db or 'quelyos'

                # Rechercher l'utilisateur
                _logger.info(f"Searching for user with login: {email}")
                user = request.env['res.users'].sudo().search([('login', '=', email)], limit=1)
                _logger.info(f"User search result: {user} (id: {user.id if user else 'None'})")
                if not user:
                    _logger.warning(f"User not found: {email}")
                    return {
                        'success': False,
                        'error': 'Invalid email or password'
                    }

                # Vérifier le mot de passe en utilisant le même mécanisme qu'Odoo
                # Le champ password est protégé par l'ORM, on doit utiliser une requête SQL directe
                _logger.info(f"Fetching password hash from database for user id: {user.id}")
                request.env.cr.execute(
                    "SELECT password FROM res_users WHERE id = %s",
                    (user.id,)
                )
                result = request.env.cr.fetchone()
                _logger.info(f"Password fetch result: {result is not None} (hash exists: {result and result[0] is not None})")
                if not result or not result[0]:
                    _logger.warning(f"User {email} has no password set")
                    return {
                        'success': False,
                        'error': 'Invalid email or password'
                    }

                user_password = result[0]
                _logger.info(f"User {email} password hash retrieved successfully (hash starts with: {user_password[:20] if user_password else 'None'})")

                # Vérifier le mot de passe avec passlib
                _logger.info(f"Verifying password with passlib for user {email}")
                valid = crypt_context.verify(password, user_password)
                _logger.info(f"Password verification result for {email}: {valid}")
                if not valid:
                    _logger.warning(f"Invalid password for {email}")
                    # Enregistrer l'échec et vérifier le blocage
                    attempts, is_now_locked = record_failed_login(email)
                    if is_now_locked:
                        return {
                            'success': False,
                            'error': 'Account locked due to too many failed attempts',
                            'attempts': attempts,
                        }
                    return {
                        'success': False,
                        'error': 'Invalid email or password',
                        'attempts_remaining': 5 - attempts,
                    }

                # Réinitialiser le compteur d'échecs après succès
                reset_failed_attempts(email)

                uid = user.id
                _logger.info(f"Authentication successful for {email}, uid={uid}")

                # Mettre à jour la session
                _logger.info(f"Creating session for user {email} (uid={uid}, db={db_name})")
                request.session.uid = uid
                request.session.login = email
                request.session.db = db_name
                _logger.info(f"Session created with sid: {request.session.sid}")

            except Exception as auth_error:
                _logger.warning(f"Authentication failed for {email}: {auth_error}")
                return {
                    'success': False,
                    'error': 'Invalid email or password'
                }

            # Récupérer les infos utilisateur
            user = request.env['res.users'].sudo().browse(uid)
            partner = user.partner_id

            # Récupérer les groupes de sécurité Quelyos via SQL direct
            request.env.cr.execute("""
                SELECT g.name
                FROM res_groups g
                JOIN res_groups_users_rel r ON g.id = r.gid
                WHERE r.uid = %s AND g.name::text LIKE '%%Quelyos%%'
            """, (uid,))

            group_names = []
            for row in request.env.cr.fetchall():
                name = row[0]
                # Si name est un dict (JSONB traduit), extraire la valeur
                if isinstance(name, dict):
                    name = name.get('en_US') or name.get('fr_FR') or next(iter(name.values()), '')
                group_names.append(name)

            user_data = {
                'id': partner.id,
                'name': partner.name,
                'email': partner.email or user.login,
                'phone': partner.phone or '',
                'groups': group_names,  # Ajouter les groupes directement
            }

            # Récupérer le session_id
            session_id = request.session.sid

            _logger.info(f"User {email} authenticated successfully with {len(group_names)} groups")

            return {
                'success': True,
                'session_id': session_id,
                'user': user_data
            }

        except Exception as e:
            _logger.error(f"Login error: {e}")
            return {
                'success': False,
                'error': 'Authentication failed'
            }

    @http.route('/api/ecommerce/auth/logout', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def auth_logout(self, **kwargs):
        """Déconnexion utilisateur"""
        try:
            request.session.logout()
            return {'success': True}
        except Exception as e:
            _logger.error(f"Logout error: {e}")
            return {'success': True}  # Toujours retourner success

    @http.route('/api/ecommerce/auth/session', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def auth_session(self, **kwargs):
        """Vérifier la session courante"""
        try:
            if request.session.uid:
                user = request.env['res.users'].sudo().browse(request.session.uid)
                partner = user.partner_id

                return {
                    'authenticated': True,
                    'user': {
                        'id': partner.id,
                        'name': partner.name,
                        'email': partner.email or user.login,
                        'phone': partner.phone or '',
                    }
                }
            else:
                return {'authenticated': False}

        except Exception as e:
            _logger.error(f"Session check error: {e}")
            return {'authenticated': False}

    @http.route('/api/ecommerce/auth/register', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def auth_register(self, **kwargs):
        """Inscription nouvel utilisateur"""
        # Rate limiting - protection contre spam/abuse
        rate_error = check_rate_limit(request, RateLimitConfig.REGISTER, 'ecommerce_register')
        if rate_error:
            _logger.warning(f"Rate limit exceeded for ecommerce registration from {request.httprequest.remote_addr}")
            return rate_error

        try:
            params = self._get_params()

            # Sanitization des entrées contre XSS
            name = sanitize_string(params.get('name', ''), max_length=255)
            email = sanitize_string(params.get('email', ''), max_length=255)
            password = params.get('password', '')  # Ne pas sanitiser le mot de passe
            phone = sanitize_string(params.get('phone', ''), max_length=50)

            # Vérification injection
            if not validate_no_injection(name) or not validate_no_injection(email):
                _logger.warning(f"Injection attempt in registration from {request.httprequest.remote_addr}")
                return {
                    'success': False,
                    'error': 'Invalid input detected'
                }

            if not name or not email or not password:
                return {
                    'success': False,
                    'error': 'Name, email and password are required'
                }

            # Valider la force du mot de passe
            is_valid, password_errors = validate_password_strength(password)
            if not is_valid:
                return {
                    'success': False,
                    'error': 'Password does not meet requirements',
                    'password_errors': password_errors,
                    'password_score': get_password_strength_score(password),
                }

            # Vérifier si l'email existe déjà
            existing_user = request.env['res.users'].sudo().search([
                ('login', '=', email)
            ], limit=1)

            if existing_user:
                return {
                    'success': False,
                    'error': 'Email already exists'
                }

            # Créer le partenaire
            partner = request.env['res.partner'].sudo().create({
                'name': name,
                'email': email,
                'phone': phone,
                'customer_rank': 1,
            })

            # Créer l'utilisateur
            user = request.env['res.users'].sudo().create({
                'name': name,
                'login': email,
                'password': password,
                'partner_id': partner.id,
                'group_ids': [(6, 0, [request.env.ref('base.group_portal').id])],
            })

            return {
                'success': True,
                'user': {
                    'id': partner.id,
                    'name': partner.name,
                    'email': partner.email,
                    'phone': partner.phone or '',
                }
            }

        except Exception as e:
            _logger.error(f"Registration error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/company/settings', type='http', auth='public', methods=['GET'], csrf=False)
    def get_company_settings(self, **kwargs):
        """Récupérer les paramètres de l'entreprise (devise, mode démo, etc.)"""
        try:
            company = request.env.company.sudo()

            # Vérifier si le mode démo est actif via IrConfigParameter
            IrConfigParameter = request.env['ir.config_parameter'].sudo()
            is_demo = IrConfigParameter.get_param('quelyos.finance.demo_mode', 'false') == 'true'

            data = {
                'companyName': company.name,
                'currency': company.currency_id.name if company.currency_id else 'EUR',
                'currencySymbol': company.currency_id.symbol if company.currency_id else '€',
                'isDemo': is_demo
            }

            return request.make_json_response({
                'success': True,
                'data': data
            })

        except Exception as e:
            _logger.error(f"Get company settings error: {e}", exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': 'Erreur serveur'
            }, status=500)

    @http.route('/api/ecommerce/admin/demo-mode', type='http', auth='public', methods=['POST'], csrf=False)
    def toggle_demo_mode(self, **kwargs):
        """Activer ou désactiver le mode démo Finance"""
        try:
            # Récupérer les paramètres du body
            data = request.get_json_data()
            action = data.get('action') if data else None

            if action not in ['activate', 'deactivate']:
                return request.make_json_response({
                    'success': False,
                    'error': 'Action invalide. Utilisez "activate" ou "deactivate".'
                }, status=400)

            IrConfigParameter = request.env['ir.config_parameter'].sudo()

            if action == 'activate':
                # Activer le mode démo
                IrConfigParameter.set_param('quelyos.finance.demo_mode', 'true')

                message = "Mode démo activé avec succès"
                changes = {
                    'currency': 'Devise par défaut : EUR',
                    'accounts': '5 comptes bancaires créés',
                    'transactions': '110 transactions fictives importées'
                }
            else:
                # Désactiver le mode démo
                IrConfigParameter.set_param('quelyos.finance.demo_mode', 'false')

                message = "Mode démo désactivé avec succès"
                changes = None

            return request.make_json_response({
                'success': True,
                'message': message,
                'changes': changes
            })

        except Exception as e:
            _logger.error(f"Toggle demo mode error: {e}", exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': 'Erreur serveur'
            }, status=500)
