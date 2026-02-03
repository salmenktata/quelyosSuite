# -*- coding: utf-8 -*-
"""
Classe de base pour les contrôleurs avec méthodes de sécurité communes
"""
import logging
from odoo import http
from odoo.http import request
from odoo.exceptions import AccessError
from ..config import is_origin_allowed, get_cors_headers
from ..lib.rate_limiter import (
    check_rate_limit,
    RateLimitConfig,
    rate_limit_key,
    get_rate_limiter
)
from ..lib.tenant_security import (
    get_tenant_from_header,
    get_company_from_tenant,
    check_quota_products,
    check_quota_users,
    check_quota_orders,
    check_subscription_active,
    get_quota_status
)

_logger = logging.getLogger(__name__)


class BaseController(http.Controller):
    """
    Classe de base pour tous les contrôleurs Quelyos API.
    Fournit des méthodes de sécurité communes (CORS, admin, etc.)
    """

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
            except (ValueError, TypeError, KeyError):
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

    def _authenticate_from_header(self):
        """
        Authentifie l'utilisateur via le header Authorization (Bearer token).
        Supporte JWT tokens et legacy session_id Odoo.
        Utilisé pour les endpoints auth='public' qui nécessitent une authentification.

        Returns:
            dict d'erreur si authentification échouée, None si succès

        Usage:
            error = self._authenticate_from_header()
            if error:
                return error
            # L'utilisateur est maintenant authentifié dans request.env
        """
        from ..lib.jwt_auth import validate_jwt_request, TokenExpiredError, InvalidTokenError

        # Récupérer le token du header Authorization (format: Bearer <token>)
        auth_header = request.httprequest.headers.get('Authorization', '')
        token = None

        if auth_header.startswith('Bearer '):
            token = auth_header[7:]  # Enlever "Bearer "

        # Fallback sur X-Session-Id pour compatibilité
        if not token:
            token = request.httprequest.headers.get('X-Session-Id')

        if not token or token in ('null', 'undefined', ''):
            _logger.warning("No valid Authorization header provided")
            return {
                'success': False,
                'error': 'Authentification requise',
                'error_code': 'AUTH_REQUIRED'
            }

        # Détecter si c'est un JWT ou un session_id Odoo
        # JWT commence par "eyJ" (base64 de {"alg"...)
        is_jwt = token.startswith('eyJ')

        if is_jwt:
            # Authentification JWT
            try:
                jwt_claims = validate_jwt_request(request.httprequest)
                if not jwt_claims:
                    _logger.warning("Invalid JWT token")
                    return {
                        'success': False,
                        'error': 'Token invalide',
                        'error_code': 'INVALID_TOKEN'
                    }

                # Charger l'utilisateur depuis les claims JWT
                user_id = jwt_claims.get('uid')
                if not user_id:
                    _logger.warning("JWT missing uid claim")
                    return {
                        'success': False,
                        'error': 'Token invalide',
                        'error_code': 'INVALID_TOKEN'
                    }

                # Mettre à jour l'environnement avec l'utilisateur authentifié
                request.update_env(user=user_id)

                # Stocker les claims JWT pour accès ultérieur
                request.jwt_claims = jwt_claims

                _logger.debug(f"JWT authentication successful for user {user_id}")
                return None

            except TokenExpiredError:
                _logger.warning("JWT token expired")
                return {
                    'success': False,
                    'error': 'Token expiré',
                    'error_code': 'TOKEN_EXPIRED'
                }

            except InvalidTokenError as e:
                _logger.warning(f"Invalid JWT token: {e}")
                return {
                    'success': False,
                    'error': 'Token invalide',
                    'error_code': 'INVALID_TOKEN'
                }

            except Exception as e:
                _logger.error(f"JWT authentication error: {e}")
                return {
                    'success': False,
                    'error': 'Erreur d\'authentification',
                    'error_code': 'AUTH_ERROR'
                }
        else:
            # Legacy: Authentification par session_id Odoo
            try:
                from odoo.http import root

                # Récupérer le store de sessions
                session_store = root.session_store

                # Charger la session
                try:
                    session = session_store.get(token)
                except Exception as store_error:
                    _logger.warning(f"Session store error for id {token[:20]}...: {store_error}")
                    return {
                        'success': False,
                        'error': 'Session invalide. Veuillez vous reconnecter.',
                        'error_code': 'SESSION_INVALID'
                    }

                if not session or not session.uid:
                    _logger.warning(f"Invalid or expired session: {token[:20]}...")
                    return {
                        'success': False,
                        'error': 'Session expirée. Veuillez vous reconnecter.',
                        'error_code': 'SESSION_EXPIRED'
                    }

                # Restaurer la session dans la requête courante
                request.session.update(session)
                request.session.uid = session.uid
                request.session.login = session.login
                request.session.db = session.db

                # Mettre à jour l'environnement avec l'utilisateur authentifié
                request.update_env(user=session.uid)

                _logger.debug(f"Session restored for user {session.uid} from header")
                return None

            except Exception as e:
                _logger.error(f"Failed to authenticate from header: {e}")
                return {
                    'success': False,
                    'error': 'Erreur d\'authentification',
                    'error_code': 'AUTH_ERROR'
                }

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

    def _check_rate_limit(self, limit_config=None, endpoint_name="api"):
        """
        Vérifie le rate limit pour la requête courante.

        Args:
            limit_config: Tuple (max_requests, window_seconds)
                         Utiliser RateLimitConfig.* pour les valeurs prédéfinies
            endpoint_name: Nom de l'endpoint pour le logging

        Returns:
            dict d'erreur si limite dépassée, None si OK

        Usage:
            error = self._check_rate_limit(RateLimitConfig.LOGIN, 'login')
            if error:
                return error
        """
        return check_rate_limit(request, limit_config, endpoint_name)

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

    def _require_backoffice_auth(self):
        """
        Authentifie un utilisateur backoffice via header et vérifie ses droits.
        Combine _authenticate_from_header() avec vérification utilisateur non-public.

        Pour endpoints auth='public' qui nécessitent authentification backoffice.

        Returns:
            dict d'erreur si authentification échouée ou droits insuffisants, None si OK

        Usage:
            error = self._require_backoffice_auth()
            if error:
                return error
        """
        # Authentifier via header Authorization
        auth_error = self._authenticate_from_header()
        if auth_error:
            return auth_error

        # Vérifier que l'utilisateur n'est pas public
        if request.env.user._is_public():
            _logger.warning("Backoffice auth failed: public user after header auth")
            return {
                'success': False,
                'error': 'Authentification requise',
                'error_code': 'AUTH_REQUIRED'
            }

        # Vérifier que l'utilisateur appartient à une company valide
        if not request.env.user.company_id:
            _logger.warning(f"Backoffice auth failed: user {request.env.user.id} has no company")
            return {
                'success': False,
                'error': 'Utilisateur non associé à une entreprise',
                'error_code': 'NO_COMPANY'
            }

        return None

    def _validate_customer_ownership(self, customer_id):
        """
        Vérifie que l'utilisateur a le droit de modifier les données du client.
        - Utilisateurs authentifiés : peuvent modifier leurs propres données OU admin peut tout modifier
        - Invités : doivent fournir guest_email correspondant au partner_id.email

        Args:
            customer_id: ID du partner (res.partner)

        Returns:
            dict d'erreur si non autorisé, None sinon

        Usage dans les endpoints :
            error = self._validate_customer_ownership(customer_id)
            if error:
                return error
        """
        # Récupérer le partner
        partner = request.env['res.partner'].sudo().browse(customer_id)
        if not partner.exists():
            return {
                'success': False,
                'error': 'Client non trouvé',
                'error_code': 'CUSTOMER_NOT_FOUND'
            }

        # Cas 1 : Utilisateur authentifié
        if request.session.uid:
            # Vérifier si c'est ses propres données
            if partner.id == request.session.uid:
                return None  # OK : utilisateur modifie ses propres données

            # Vérifier si admin
            if request.env.user.has_group('base.group_system'):
                return None  # OK : admin peut tout modifier

            # Ni propriétaire ni admin
            _logger.warning(
                f"Unauthorized customer data access attempt: user {request.env.user.id} "
                f"tried to access customer {customer_id}"
            )
            return {
                'success': False,
                'error': 'Accès non autorisé : vous ne pouvez modifier que vos propres données',
                'error_code': 'OWNERSHIP_VIOLATION'
            }

        # Cas 2 : Invité - Doit fournir guest_email
        params = self._get_params()
        guest_email = params.get('guest_email')

        if not guest_email:
            return {
                'success': False,
                'error': 'Authentification requise ou guest_email manquant',
                'error_code': 'AUTH_OR_GUEST_EMAIL_REQUIRED'
            }

        # Vérifier correspondance email
        if partner.email != guest_email:
            _logger.warning(
                f"Unauthorized guest customer data access: guest_email {guest_email} "
                f"does not match customer {customer_id} email"
            )
            return {
                'success': False,
                'error': 'Accès non autorisé',
                'error_code': 'GUEST_EMAIL_MISMATCH'
            }

        return None  # OK : guest_email valide

    def _check_group(self, group_xml_id):
        """
        Vérifie que l'utilisateur possède le groupe de sécurité requis.
        Retourne un dict d'erreur si non autorisé, None sinon.

        Args:
            group_xml_id: ID XML complet du groupe (ex: 'quelyos_api.group_quelyos_stock_user')
                         ou nom court (ex: 'group_quelyos_stock_user')

        Returns:
            dict d'erreur si l'utilisateur n'a pas le groupe, None sinon

        Usage dans les endpoints:
            error = self._check_group('quelyos_api.group_quelyos_stock_user')
            if error:
                return error
        """
        # Vérifier que l'utilisateur est connecté
        if not request.env.user or request.env.user._is_public():
            _logger.warning(f"Unauthorized action attempt: user not authenticated")
            return {
                'success': False,
                'error': 'Authentification requise',
                'error_code': 'AUTH_REQUIRED'
            }

        # Normaliser l'ID du groupe (ajouter préfixe si manquant)
        if '.' not in group_xml_id:
            group_xml_id = f'quelyos_api.{group_xml_id}'

        # Vérifier si l'utilisateur a le groupe
        if not request.env.user.has_group(group_xml_id):
            _logger.warning(
                f"Unauthorized action attempt: user {request.env.user.id} "
                f"({request.env.user.login}) lacks required group '{group_xml_id}'"
            )
            return {
                'success': False,
                'error': 'Accès refusé : permissions insuffisantes',
                'error_code': 'INSUFFICIENT_PERMISSIONS'
            }

        return None

    def _check_any_group(self, *group_xml_ids):
        """
        Vérifie que l'utilisateur possède AU MOINS UN des groupes spécifiés.
        Retourne un dict d'erreur si aucun groupe n'est possédé, None sinon.

        Args:
            *group_xml_ids: Liste variable d'IDs XML de groupes

        Returns:
            dict d'erreur si l'utilisateur n'a aucun des groupes, None sinon

        Usage:
            error = self._check_any_group('group_quelyos_stock_user', 'group_quelyos_stock_manager')
            if error:
                return error
        """
        # Vérifier que l'utilisateur est connecté
        if not request.env.user or request.env.user._is_public():
            return {
                'success': False,
                'error': 'Authentification requise',
                'error_code': 'AUTH_REQUIRED'
            }

        # Normaliser les IDs et vérifier si l'utilisateur a au moins un groupe
        for group_xml_id in group_xml_ids:
            if '.' not in group_xml_id:
                group_xml_id = f'quelyos_api.{group_xml_id}'
            if request.env.user.has_group(group_xml_id):
                return None  # OK, l'utilisateur a ce groupe

        # Aucun groupe trouvé
        _logger.warning(
            f"Unauthorized action attempt: user {request.env.user.id} "
            f"({request.env.user.login}) lacks any of required groups: {group_xml_ids}"
        )
        return {
            'success': False,
            'error': 'Accès refusé : permissions insuffisantes',
            'error_code': 'INSUFFICIENT_PERMISSIONS'
        }

    def _create_session(self, uid):
        """Crée une session pour l'utilisateur et retourne le session_id"""
        return request.session.sid

    def _get_tenant(self):
        """
        Récupère et valide le tenant depuis le header X-Tenant-Domain.
        Vérifie automatiquement que l'utilisateur appartient au tenant.

        Returns:
            quelyos.tenant: Record du tenant validé
            None: Si header manquant ou validation échouée

        Usage:
            tenant = self._get_tenant()
            if not tenant:
                return {'error': 'Tenant invalide'}
        """
        try:
            return get_tenant_from_header()
        except AccessError as e:
            _logger.error(f"Tenant access violation: {e}")
            return None

    def _get_company(self):
        """
        Récupère la company associée au tenant depuis le header X-Tenant-Domain.

        Returns:
            res.company: Record de la company validée
            None: Si tenant non trouvé ou validation échouée

        Usage:
            company = self._get_company()
            if not company:
                return {'error': 'Tenant invalide'}
            products = Product.with_company(company).search([...])
        """
        return get_company_from_tenant()

    def _check_tenant_quotas(self, check_type='all'):
        """
        Vérifie les quotas du tenant.

        Args:
            check_type: Type de quota à vérifier
                       'all' - Tous les quotas (défaut)
                       'products' - Quota produits uniquement
                       'users' - Quota utilisateurs uniquement
                       'orders' - Quota commandes uniquement
                       'subscription' - Vérifier abonnement actif uniquement

        Returns:
            dict: Erreur si quota dépassé, None si OK

        Usage:
            # Avant de créer un produit
            error = self._check_tenant_quotas('products')
            if error:
                return error

            # Avant de créer un utilisateur
            error = self._check_tenant_quotas('users')
            if error:
                return error

            # Vérifier tous les quotas
            error = self._check_tenant_quotas()
            if error:
                return error
        """
        tenant = self._get_tenant()
        if not tenant:
            return {
                'success': False,
                'error': 'Tenant invalide ou manquant',
                'error_code': 'TENANT_INVALID'
            }

        # Vérifier l'abonnement d'abord
        if check_type in ('all', 'subscription'):
            error = check_subscription_active(tenant)
            if error:
                return error

        # Vérifier les quotas spécifiques
        if check_type == 'products':
            return check_quota_products(tenant)
        elif check_type == 'users':
            return check_quota_users(tenant)
        elif check_type == 'orders':
            return check_quota_orders(tenant)
        elif check_type == 'all':
            # Vérifier tous les quotas (ne retourne que le premier dépassé)
            for check_func in [check_quota_products, check_quota_users, check_quota_orders]:
                error = check_func(tenant)
                if error:
                    return error

        return None

    def _get_quota_status(self):
        """
        Retourne le statut de tous les quotas pour le tenant courant.

        Returns:
            dict: Statut détaillé des quotas ou None si tenant invalide

        Usage:
            quotas = self._get_quota_status()
            return {
                'success': True,
                'quotas': quotas
            }
        """
        tenant = self._get_tenant()
        if not tenant:
            return None

        return get_quota_status(tenant)
