# -*- coding: utf-8 -*-
"""
Classe de base pour les contrôleurs avec méthodes de sécurité communes
"""
import logging
from odoo import http
from odoo.http import request
from ..config import is_origin_allowed, get_cors_headers

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

    def _authenticate_from_header(self):
        """
        Authentifie l'utilisateur via le header X-Session-Id.
        Utilisé pour les endpoints auth='public' qui nécessitent une authentification.

        Cette méthode restaure la session Odoo à partir du session_id envoyé
        dans le header, permettant aux requêtes sans cookies de fonctionner.

        Returns:
            dict d'erreur si authentification échouée, None si succès

        Usage:
            error = self._authenticate_from_header()
            if error:
                return error
            # L'utilisateur est maintenant authentifié dans request.env
        """
        # Récupérer le session_id du header
        session_id = request.httprequest.headers.get('X-Session-Id')

        if not session_id or session_id in ('null', 'undefined', ''):
            _logger.warning("No valid X-Session-Id header provided")
            return {
                'success': False,
                'error': 'Authentification requise',
                'error_code': 'AUTH_REQUIRED'
            }

        try:
            # Charger la session Odoo à partir du session_id
            from odoo.http import root

            # Récupérer le store de sessions
            session_store = root.session_store

            # Charger la session
            session = session_store.get(session_id)

            if not session or not session.uid:
                _logger.warning(f"Invalid or expired session: {session_id[:20]}...")
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

    def _create_session(self, uid):
        """Crée une session pour l'utilisateur et retourne le session_id"""
        return request.session.sid
